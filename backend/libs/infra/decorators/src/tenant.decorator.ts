import { SetMetadata } from '@nestjs/common';

export const TENANT_REQUIRED_KEY = 'tenant_required';

/**
 * 租户装饰器
 * 标记需要租户验证的接口
 * @param required - 是否必须提供租户ID，默认为true
 */
export const TenantRequired = (required: boolean = true) => SetMetadata(TENANT_REQUIRED_KEY, required);

/**
 * 获取当前请求的租户ID装饰器
 * 用于在控制器方法中直接获取租户ID
 */
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentTenant = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest();
    return request.tenantId;
  },
);