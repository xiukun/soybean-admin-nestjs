import { SetMetadata, createParamDecorator, ExecutionContext, applyDecorators, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiUnauthorizedResponse, ApiForbiddenResponse } from '@nestjs/swagger';

import { UnifiedJwtGuard } from '../guards/unified-jwt.guard';

/**
 * 公开接口装饰器 - 跳过JWT认证
 */
export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

/**
 * 角色装饰器 - 指定需要的角色
 */
export const ROLES_KEY = 'roles';
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);

/**
 * 权限装饰器 - 指定需要的权限
 */
export const PERMISSIONS_KEY = 'permissions';
export const Permissions = (...permissions: string[]) => SetMetadata(PERMISSIONS_KEY, permissions);

/**
 * 获取当前用户装饰器
 */
export const CurrentUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;

    return data ? user?.[data] : user;
  },
);

/**
 * 获取当前用户ID装饰器
 */
export const CurrentUserId = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest();
    return request.user?.uid;
  },
);

/**
 * 获取当前用户名装饰器
 */
export const CurrentUsername = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest();
    return request.user?.username;
  },
);

/**
 * 获取当前用户域装饰器
 */
export const CurrentUserDomain = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest();
    return request.user?.domain;
  },
);

/**
 * 获取当前用户角色装饰器
 */
export const CurrentUserRoles = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string[] => {
    const request = ctx.switchToHttp().getRequest();
    return request.user?.roles || [];
  },
);

/**
 * 获取当前用户权限装饰器
 */
export const CurrentUserPermissions = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string[] => {
    const request = ctx.switchToHttp().getRequest();
    return request.user?.permissions || [];
  },
);

/**
 * 获取JWT Token装饰器
 */
export const CurrentToken = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;
    return authHeader?.replace('Bearer ', '') || '';
  },
);

/**
 * 获取请求IP装饰器
 */
export const ClientIp = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest();
    return request.ip || request.connection?.remoteAddress || 'unknown';
  },
);

/**
 * 获取User-Agent装饰器
 */
export const UserAgent = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest();
    return request.headers['user-agent'] || 'unknown';
  },
);

/**
 * 服务间调用装饰器 - 标记为内部服务调用
 */
export const INTERNAL_SERVICE_KEY = 'internalService';
export const InternalService = (allowedServices?: string[]) => 
  SetMetadata(INTERNAL_SERVICE_KEY, allowedServices || []);

/**
 * 跨服务认证装饰器 - 允许跨服务调用
 */
export const CROSS_SERVICE_KEY = 'crossService';
export const CrossService = (options?: {
  allowedServices?: string[];
  requireUserContext?: boolean;
}) => SetMetadata(CROSS_SERVICE_KEY, options || {});

/**
 * 资源所有者装饰器 - 只允许资源所有者访问
 */
export const RESOURCE_OWNER_KEY = 'resourceOwner';
export const ResourceOwner = (resourceIdParam: string = 'id') => 
  SetMetadata(RESOURCE_OWNER_KEY, resourceIdParam);

/**
 * 管理员装饰器 - 只允许管理员访问
 */
export const AdminOnly = () => Roles('admin', 'super-admin');

/**
 * 超级管理员装饰器 - 只允许超级管理员访问
 */
export const SuperAdminOnly = () => Roles('super-admin');

/**
 * API JWT认证装饰器 - 组合装饰器，包含Swagger文档
 */
export const ApiJwtAuth = (options?: {
  summary?: string;
  description?: string;
  roles?: string[];
  permissions?: string[];
}) => {
  const decorators = [
    UseGuards(UnifiedJwtGuard),
    ApiBearerAuth(),
    ApiUnauthorizedResponse({ description: 'Unauthorized' }),
  ];

  if (options?.roles && options.roles.length > 0) {
    decorators.push(Roles(...options.roles));
    decorators.push(ApiForbiddenResponse({ description: 'Insufficient role privileges' }));
  }

  if (options?.permissions && options.permissions.length > 0) {
    decorators.push(Permissions(...options.permissions));
    decorators.push(ApiForbiddenResponse({ description: 'Insufficient permissions' }));
  }

  return applyDecorators(...decorators);
};

/**
 * API公开接口装饰器 - 组合装饰器，包含Swagger文档
 */
export const ApiPublic = (options?: {
  summary?: string;
  description?: string;
}) => {
  return applyDecorators(
    Public(),
  );
};

/**
 * API管理员接口装饰器 - 组合装饰器
 */
export const ApiAdminAuth = (options?: {
  summary?: string;
  description?: string;
}) => {
  return applyDecorators(
    UseGuards(UnifiedJwtGuard),
    AdminOnly(),
    ApiBearerAuth(),
    ApiUnauthorizedResponse({ description: 'Unauthorized' }),
    ApiForbiddenResponse({ description: 'Admin access required' }),
  );
};

/**
 * API超级管理员接口装饰器 - 组合装饰器
 */
export const ApiSuperAdminAuth = (options?: {
  summary?: string;
  description?: string;
}) => {
  return applyDecorators(
    UseGuards(UnifiedJwtGuard),
    SuperAdminOnly(),
    ApiBearerAuth(),
    ApiUnauthorizedResponse({ description: 'Unauthorized' }),
    ApiForbiddenResponse({ description: 'Super admin access required' }),
  );
};

/**
 * 限流装饰器 - 基于用户的限流
 */
export const RATE_LIMIT_KEY = 'rateLimit';
export const RateLimit = (options: {
  maxRequests: number;
  windowMs: number;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
}) => SetMetadata(RATE_LIMIT_KEY, options);

/**
 * 审计日志装饰器 - 记录操作日志
 */
export const AUDIT_LOG_KEY = 'auditLog';
export const AuditLog = (options?: {
  action?: string;
  resource?: string;
  description?: string;
}) => SetMetadata(AUDIT_LOG_KEY, options || {});

/**
 * 缓存装饰器 - 缓存响应结果
 */
export const CACHE_KEY = 'cache';
export const Cache = (options?: {
  ttl?: number;
  key?: string;
  condition?: string;
}) => SetMetadata(CACHE_KEY, options || {});

/**
 * 验证装饰器组合 - 常用验证组合
 */
export const ValidatedAuth = (options?: {
  roles?: string[];
  permissions?: string[];
  rateLimit?: { maxRequests: number; windowMs: number };
  audit?: { action: string; resource: string };
}) => {
  const decorators = [
    UseGuards(UnifiedJwtGuard),
    ApiBearerAuth(),
    ApiUnauthorizedResponse({ description: 'Unauthorized' }),
  ];

  if (options?.roles) {
    decorators.push(Roles(...options.roles));
    decorators.push(ApiForbiddenResponse({ description: 'Insufficient role privileges' }));
  }

  if (options?.permissions) {
    decorators.push(Permissions(...options.permissions));
    decorators.push(ApiForbiddenResponse({ description: 'Insufficient permissions' }));
  }

  if (options?.rateLimit) {
    decorators.push(RateLimit(options.rateLimit));
  }

  if (options?.audit) {
    decorators.push(AuditLog(options.audit));
  }

  return applyDecorators(...decorators);
};
