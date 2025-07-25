import {
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  Logger,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { Observable } from 'rxjs';
import { ConfigService } from '@nestjs/config';

import { IS_PUBLIC_KEY } from '@lib/infra/decorators/public.decorator';
import { IAuthentication } from '@lib/typings/global';

/**
 * 统一JWT认证守卫
 * 支持多微服务的JWT认证和权限控制
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  private readonly logger = new Logger(JwtAuthGuard.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly configService: ConfigService,
  ) {
    super();
  }

  /**
   * 判断是否可以激活路由
   */
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    // 检查是否为公开接口
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      this.logger.debug('Public endpoint accessed');
      return true;
    }

    // 检查是否跳过认证（用于内部服务调用）
    const skipAuth = this.reflector.getAllAndOverride<boolean>('skipAuth', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (skipAuth) {
      this.logger.debug('Authentication skipped for internal service');
      return true;
    }

    return super.canActivate(context);
  }

  /**
   * 处理认证请求
   */
  handleRequest<TUser = any>(
    err: any,
    user: any,
    info: any,
    context: ExecutionContext,
    status?: any
  ): TUser {
    const request = context.switchToHttp().getRequest();

    // 记录认证失败日志
    if (err || !user) {
      const errorMessage = this.getErrorMessage(err, info);
      const userAgent = request.headers['user-agent'] || 'Unknown';
      const ip = request.ip || request.connection?.remoteAddress || 'Unknown';

      this.logger.warn(`Authentication failed: ${errorMessage}`, {
        ip,
        userAgent,
        url: request.url,
        method: request.method,
        error: err?.message,
        info: info?.message,
      });

      throw err || new UnauthorizedException(errorMessage);
    }

    // 验证用户状态
    this.validateUserStatus(user);

    // 记录成功认证日志（仅在开发环境）
    if (this.configService.get('NODE_ENV') === 'development') {
      this.logger.debug(`Authentication successful for user: ${user.username}`);
    }

    return user;
  }

  /**
   * 获取错误消息
   */
  private getErrorMessage(err: any, info: any): string {
    if (err) {
      return err.message || 'Authentication error';
    }

    if (info) {
      switch (info.message) {
        case 'No auth token':
          return 'Missing authentication token';
        case 'jwt expired':
          return 'Authentication token has expired';
        case 'jwt malformed':
          return 'Invalid authentication token format';
        case 'jwt signature verification failed':
          return 'Invalid authentication token signature';
        case 'invalid token':
          return 'Invalid authentication token';
        default:
          return info.message || 'Authentication failed';
      }
    }

    return 'Authentication required';
  }

  /**
   * 验证用户状态
   */
  private validateUserStatus(user: IAuthentication): void {
    // 检查用户是否被禁用
    if (user.status === 'disabled' || user.status === 'suspended') {
      throw new ForbiddenException('User account has been disabled');
    }

    // 检查用户是否已删除
    if (user.status === 'deleted') {
      throw new UnauthorizedException('User account not found');
    }

    // 检查域是否有效
    if (!user.domain || user.domain === 'invalid') {
      throw new ForbiddenException('Invalid user domain');
    }

    // 检查token是否即将过期（提前5分钟警告）
    if (user.exp) {
      const expirationTime = user.exp * 1000;
      const warningTime = 5 * 60 * 1000; // 5分钟
      const currentTime = Date.now();

      if (expirationTime - currentTime < warningTime) {
        this.logger.warn(`Token expiring soon for user: ${user.username}`, {
          userId: user.uid,
          expiresAt: new Date(expirationTime).toISOString(),
          remainingTime: Math.round((expirationTime - currentTime) / 1000),
        });
      }
    }
  }
}
