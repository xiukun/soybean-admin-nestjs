import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { UnifiedJwtService, JwtPayload } from '../services/unified-jwt.service';

/**
 * 公开接口装饰器键
 */
export const IS_PUBLIC_KEY = 'isPublic';

/**
 * 权限要求装饰器键
 */
export const PERMISSIONS_KEY = 'permissions';

/**
 * 角色要求装饰器键
 */
export const ROLES_KEY = 'roles';

/**
 * 可选认证装饰器键
 */
export const OPTIONAL_AUTH_KEY = 'optionalAuth';

/**
 * 扩展的Request接口，包含用户信息
 */
export interface AuthenticatedRequest extends Request {
  user: JwtPayload;
}

/**
 * 统一JWT认证守卫
 * 提供跨微服务的统一JWT认证和授权
 */
@Injectable()
export class UnifiedJwtGuard implements CanActivate {
  private readonly logger = new Logger(UnifiedJwtGuard.name);

  constructor(
    private readonly jwtService: UnifiedJwtService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // 检查是否为公开接口
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    // 检查是否为可选认证
    const isOptionalAuth = this.reflector.getAllAndOverride<boolean>(OPTIONAL_AUTH_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token = this.extractTokenFromHeader(request);

    // 如果没有令牌
    if (!token) {
      if (isOptionalAuth) {
        return true; // 可选认证，允许通过
      }
      throw new UnauthorizedException('Access token is required');
    }

    try {
      // 验证令牌
      const payload = await this.jwtService.verifyAccessToken(token);
      
      // 将用户信息附加到请求对象
      request.user = payload;

      // 检查权限和角色
      await this.checkPermissionsAndRoles(context, payload);

      this.logger.debug(`用户 ${payload.username} 通过认证`);
      return true;

    } catch (error) {
      if (isOptionalAuth) {
        this.logger.debug('可选认证失败，但允许通过');
        return true;
      }

      this.logger.warn(`认证失败: ${error.message}`);
      
      if (error instanceof ForbiddenException) {
        throw error;
      }
      
      throw new UnauthorizedException('Invalid or expired token');
    }
  }

  /**
   * 从请求头中提取令牌
   */
  private extractTokenFromHeader(request: Request): string | undefined {
    const authHeader = request.headers.authorization;
    
    if (!authHeader) {
      return undefined;
    }

    // 支持 Bearer 和 Token 两种格式
    const bearerMatch = authHeader.match(/^Bearer\s+(.+)$/i);
    if (bearerMatch) {
      return bearerMatch[1];
    }

    const tokenMatch = authHeader.match(/^Token\s+(.+)$/i);
    if (tokenMatch) {
      return tokenMatch[1];
    }

    // 如果没有前缀，直接使用整个值
    return authHeader;
  }

  /**
   * 检查权限和角色
   */
  private async checkPermissionsAndRoles(
    context: ExecutionContext,
    payload: JwtPayload,
  ): Promise<void> {
    // 获取所需权限
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // 获取所需角色
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // 检查权限
    if (requiredPermissions && requiredPermissions.length > 0) {
      const hasPermission = this.jwtService.hasAnyPermission(payload, requiredPermissions);
      if (!hasPermission) {
        this.logger.warn(
          `用户 ${payload.username} 缺少权限: ${requiredPermissions.join(', ')}`
        );
        throw new ForbiddenException('Insufficient permissions');
      }
    }

    // 检查角色
    if (requiredRoles && requiredRoles.length > 0) {
      const hasRole = this.jwtService.hasAnyRole(payload, requiredRoles);
      if (!hasRole) {
        this.logger.warn(
          `用户 ${payload.username} 缺少角色: ${requiredRoles.join(', ')}`
        );
        throw new ForbiddenException('Insufficient roles');
      }
    }
  }
}

/**
 * WebSocket JWT认证守卫
 */
@Injectable()
export class WsJwtGuard implements CanActivate {
  private readonly logger = new Logger(WsJwtGuard.name);

  constructor(private readonly jwtService: UnifiedJwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      const client = context.switchToWs().getClient();
      const token = this.extractTokenFromWsClient(client);

      if (!token) {
        throw new UnauthorizedException('Access token is required');
      }

      const payload = await this.jwtService.verifyAccessToken(token);
      
      // 将用户信息附加到客户端对象
      client.user = payload;

      this.logger.debug(`WebSocket用户 ${payload.username} 通过认证`);
      return true;

    } catch (error) {
      this.logger.warn(`WebSocket认证失败: ${error.message}`);
      return false;
    }
  }

  /**
   * 从WebSocket客户端提取令牌
   */
  private extractTokenFromWsClient(client: any): string | undefined {
    // 从握手信息中提取令牌
    const token = client.handshake?.auth?.token || 
                  client.handshake?.query?.token ||
                  client.handshake?.headers?.authorization?.replace('Bearer ', '');
    
    return token;
  }
}

/**
 * 管理员权限守卫
 */
@Injectable()
export class AdminGuard implements CanActivate {
  private readonly logger = new Logger(AdminGuard.name);

  constructor(private readonly jwtService: UnifiedJwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    
    if (!request.user) {
      throw new UnauthorizedException('Authentication required');
    }

    const isAdmin = this.jwtService.hasRole(request.user, 'admin') ||
                   this.jwtService.hasRole(request.user, 'super_admin');

    if (!isAdmin) {
      this.logger.warn(`用户 ${request.user.username} 尝试访问管理员接口`);
      throw new ForbiddenException('Admin access required');
    }

    return true;
  }
}

/**
 * 超级管理员权限守卫
 */
@Injectable()
export class SuperAdminGuard implements CanActivate {
  private readonly logger = new Logger(SuperAdminGuard.name);

  constructor(private readonly jwtService: UnifiedJwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    
    if (!request.user) {
      throw new UnauthorizedException('Authentication required');
    }

    const isSuperAdmin = this.jwtService.hasRole(request.user, 'super_admin');

    if (!isSuperAdmin) {
      this.logger.warn(`用户 ${request.user.username} 尝试访问超级管理员接口`);
      throw new ForbiddenException('Super admin access required');
    }

    return true;
  }
}

/**
 * 资源所有者守卫
 * 检查用户是否为资源的所有者
 */
@Injectable()
export class ResourceOwnerGuard implements CanActivate {
  private readonly logger = new Logger(ResourceOwnerGuard.name);

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    
    if (!request.user) {
      throw new UnauthorizedException('Authentication required');
    }

    // 从路径参数中获取资源ID
    const resourceId = request.params.id;
    const userId = request.user.sub;

    // 这里应该实现具体的资源所有权检查逻辑
    // 例如：查询数据库检查资源是否属于当前用户
    
    // 简化实现：如果用户是管理员，允许访问所有资源
    if (request.user.roles?.includes('admin') || request.user.roles?.includes('super_admin')) {
      return true;
    }

    // 实际应用中，这里需要根据具体业务逻辑实现
    this.logger.debug(`检查用户 ${userId} 对资源 ${resourceId} 的所有权`);
    
    return true; // 简化实现，实际需要具体的业务逻辑
  }
}

/**
 * 速率限制守卫
 * 基于用户的API调用频率限制
 */
@Injectable()
export class RateLimitGuard implements CanActivate {
  private readonly logger = new Logger(RateLimitGuard.name);
  private readonly requestCounts = new Map<string, { count: number; resetTime: number }>();

  constructor(
    private readonly maxRequests: number = 100,
    private readonly windowMs: number = 60000, // 1分钟
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    
    if (!request.user) {
      return true; // 未认证用户不受限制（由其他守卫处理）
    }

    const userId = request.user.sub;
    const now = Date.now();
    const userLimit = this.requestCounts.get(userId);

    if (!userLimit || now > userLimit.resetTime) {
      // 重置计数器
      this.requestCounts.set(userId, {
        count: 1,
        resetTime: now + this.windowMs,
      });
      return true;
    }

    if (userLimit.count >= this.maxRequests) {
      this.logger.warn(`用户 ${request.user.username} 超过速率限制`);
      throw new ForbiddenException('Rate limit exceeded');
    }

    userLimit.count++;
    return true;
  }
}
