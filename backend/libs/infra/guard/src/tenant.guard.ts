import {
  Injectable,
  CanActivate,
  ExecutionContext,
  BadRequestException,
  Inject,
  Optional,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';

import { IS_PUBLIC_KEY } from '@lib/infra/decorators/public.decorator';
import { TENANT_REQUIRED_KEY } from '@lib/infra/decorators/tenant.decorator';
import { TenantContextService } from '@lib/shared/services/tenant-context.service';
import { CacheConstant } from '@lib/constants/cache.constant';
import { RedisUtility } from '@lib/shared/redis/redis.util';
import { IAuthentication } from '@lib/typings/global';

// 立即执行的日志，确认文件被加载
console.log('=== TENANT GUARD FILE LOADED ===');

/**
 * 多租户守卫
 * 从请求头或查询参数中提取租户ID，并将其设置到请求上下文中
 * 超级管理员账号不需要租户验证
 */
@Injectable()
export class TenantGuard implements CanActivate {
  static {
    console.log('=== TenantGuard CLASS LOADED ===');
  }
  constructor(
    @Inject(Reflector) private readonly reflector: Reflector,
    @Optional()
    private readonly tenantContextService?: TenantContextService,
  ) {
    console.log('=== TenantGuard CONSTRUCTOR START ===');
    console.log('TenantGuard constructor - reflector:', this.reflector);
    console.log('TenantGuard constructor - tenantContextService:', this.tenantContextService);
    console.log('=== TenantGuard CONSTRUCTOR END ===');
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    console.log('TenantGuard.canActivate - reflector:', this.reflector);
    if (!this.reflector) {
      console.error('TenantGuard: Reflector is undefined!');
      throw new Error('TenantGuard: Reflector is undefined!');
    }
    const request = context.switchToHttp().getRequest();
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    
    // 公开接口不需要租户验证
    if (isPublic) {
      return true;
    }

    // 检查是否需要租户验证
    const tenantRequired = this.reflector.getAllAndOverride<boolean>(TENANT_REQUIRED_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // 如果没有明确要求租户验证，则跳过
    if (tenantRequired === false) {
      return true;
    }

    // request已在上面声明
    
    // 检查用户是否为超级管理员
    const user = (request as any).user as IAuthentication;
    if (user && await this.isSuperAdmin(user.uid)) {
      // 超级管理员跳过租户验证
      return true;
    }
    
    // 从请求头或查询参数中获取租户ID
    const tenantId = this.extractTenantId(request);
    
    if (!tenantId) {
      throw new BadRequestException('租户ID不能为空');
    }

    // 将租户ID设置到请求对象和租户上下文服务中
    (request as any).tenantId = tenantId;
    if (this.tenantContextService) {
      this.tenantContextService.setTenantId(tenantId);
    }
    
    return true;
  }

  /**
   * 检查用户是否为超级管理员
   */
  private async isSuperAdmin(userId: string): Promise<boolean> {
    try {
      const userRoles = await RedisUtility.instance.smembers(
        `${CacheConstant.AUTH_TOKEN_PREFIX}${userId}`,
      );
      return userRoles.includes('ROLE_SUPER');
    } catch (error) {
      // 如果Redis查询失败，返回false，继续正常的租户验证流程
      return false;
    }
  }

  /**
   * 从请求中提取租户ID
   * 优先级：请求头 > 查询参数 > 请求体
   */
  private extractTenantId(request: Request): string | null {
    // 1. 从请求头中获取
    const headerTenantId = request.headers['x-tenant-id'] as string;
    if (headerTenantId) {
      return headerTenantId;
    }

    // 2. 从查询参数中获取
    const queryTenantId = request.query.tenantId as string;
    if (queryTenantId) {
      return queryTenantId;
    }

    // 3. 从请求体中获取（仅限POST/PUT等请求）
    if (request.body && request.body.tenantId) {
      return request.body.tenantId;
    }

    return null;
  }
}