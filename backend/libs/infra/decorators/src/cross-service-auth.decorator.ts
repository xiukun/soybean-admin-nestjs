import { SetMetadata, applyDecorators } from '@nestjs/common';
import { ApiSecurity, ApiOperation } from '@nestjs/swagger';

/**
 * 跨服务认证元数据键
 */
export const CROSS_SERVICE_AUTH_KEY = 'crossServiceAuth';

/**
 * 跨服务认证配置
 */
export interface CrossServiceAuthConfig {
  /** 允许的服务列表 */
  allowedServices?: string[];
  /** 是否需要用户上下文 */
  requireUserContext?: boolean;
  /** 是否验证服务签名 */
  verifySignature?: boolean;
  /** 自定义验证函数 */
  customValidator?: string;
}

/**
 * 跨服务认证装饰器
 * 用于标记需要跨服务认证的接口
 */
export function CrossServiceAuth(config: CrossServiceAuthConfig = {}) {
  return applyDecorators(
    SetMetadata(CROSS_SERVICE_AUTH_KEY, {
      allowedServices: config.allowedServices || [],
      requireUserContext: config.requireUserContext ?? false,
      verifySignature: config.verifySignature ?? true,
      customValidator: config.customValidator,
    }),
    ApiSecurity('service-auth'),
    ApiOperation({
      description: 'This endpoint requires cross-service authentication',
    }),
  );
}

/**
 * 内部服务调用装饰器
 * 跳过JWT认证，仅验证服务身份
 */
export function InternalServiceCall(allowedServices: string[] = []) {
  return applyDecorators(
    SetMetadata('skipAuth', true),
    SetMetadata(CROSS_SERVICE_AUTH_KEY, {
      allowedServices,
      requireUserContext: false,
      verifySignature: true,
      internal: true,
    }),
    ApiSecurity('internal-service'),
  );
}

/**
 * 服务间用户上下文传递装饰器
 * 需要传递用户认证信息的服务间调用
 */
export function ServiceUserContext(allowedServices: string[] = []) {
  return applyDecorators(
    SetMetadata(CROSS_SERVICE_AUTH_KEY, {
      allowedServices,
      requireUserContext: true,
      verifySignature: true,
      propagateUser: true,
    }),
    ApiSecurity('service-user-auth'),
  );
}
