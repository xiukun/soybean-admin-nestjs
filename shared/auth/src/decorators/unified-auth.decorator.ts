import { SetMetadata, applyDecorators, UseGuards, createParamDecorator, ExecutionContext } from '@nestjs/common';
import { ApiBearerAuth, ApiUnauthorizedResponse, ApiForbiddenResponse } from '@nestjs/swagger';
import { 
  UnifiedJwtGuard, 
  AdminGuard, 
  SuperAdminGuard, 
  ResourceOwnerGuard,
  RateLimitGuard,
  IS_PUBLIC_KEY,
  PERMISSIONS_KEY,
  ROLES_KEY,
  OPTIONAL_AUTH_KEY,
  AuthenticatedRequest
} from '../guards/unified-jwt.guard';

/**
 * 公开接口装饰器
 * 标记接口为公开，不需要认证
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

/**
 * 可选认证装饰器
 * 如果有令牌则验证，没有令牌也允许通过
 */
export const OptionalAuth = () => SetMetadata(OPTIONAL_AUTH_KEY, true);

/**
 * 权限要求装饰器
 * 指定接口需要的权限
 */
export const RequirePermissions = (...permissions: string[]) => 
  SetMetadata(PERMISSIONS_KEY, permissions);

/**
 * 角色要求装饰器
 * 指定接口需要的角色
 */
export const RequireRoles = (...roles: string[]) => 
  SetMetadata(ROLES_KEY, roles);

/**
 * JWT认证装饰器
 * 应用JWT认证守卫和Swagger文档
 */
export const JwtAuth = () => applyDecorators(
  UseGuards(UnifiedJwtGuard),
  ApiBearerAuth(),
  ApiUnauthorizedResponse({ description: 'Unauthorized - Invalid or missing token' }),
);

/**
 * 管理员认证装饰器
 * 需要管理员权限
 */
export const AdminAuth = () => applyDecorators(
  UseGuards(UnifiedJwtGuard, AdminGuard),
  ApiBearerAuth(),
  ApiUnauthorizedResponse({ description: 'Unauthorized - Invalid or missing token' }),
  ApiForbiddenResponse({ description: 'Forbidden - Admin access required' }),
);

/**
 * 超级管理员认证装饰器
 * 需要超级管理员权限
 */
export const SuperAdminAuth = () => applyDecorators(
  UseGuards(UnifiedJwtGuard, SuperAdminGuard),
  ApiBearerAuth(),
  ApiUnauthorizedResponse({ description: 'Unauthorized - Invalid or missing token' }),
  ApiForbiddenResponse({ description: 'Forbidden - Super admin access required' }),
);

/**
 * 资源所有者认证装饰器
 * 需要是资源的所有者或管理员
 */
export const ResourceOwnerAuth = () => applyDecorators(
  UseGuards(UnifiedJwtGuard, ResourceOwnerGuard),
  ApiBearerAuth(),
  ApiUnauthorizedResponse({ description: 'Unauthorized - Invalid or missing token' }),
  ApiForbiddenResponse({ description: 'Forbidden - Resource owner access required' }),
);

/**
 * 带权限的JWT认证装饰器
 * 需要特定权限
 */
export const JwtAuthWithPermissions = (...permissions: string[]) => applyDecorators(
  RequirePermissions(...permissions),
  UseGuards(UnifiedJwtGuard),
  ApiBearerAuth(),
  ApiUnauthorizedResponse({ description: 'Unauthorized - Invalid or missing token' }),
  ApiForbiddenResponse({ description: 'Forbidden - Insufficient permissions' }),
);

/**
 * 带角色的JWT认证装饰器
 * 需要特定角色
 */
export const JwtAuthWithRoles = (...roles: string[]) => applyDecorators(
  RequireRoles(...roles),
  UseGuards(UnifiedJwtGuard),
  ApiBearerAuth(),
  ApiUnauthorizedResponse({ description: 'Unauthorized - Invalid or missing token' }),
  ApiForbiddenResponse({ description: 'Forbidden - Insufficient roles' }),
);

/**
 * 带速率限制的JWT认证装饰器
 * 限制API调用频率
 */
export const JwtAuthWithRateLimit = (maxRequests: number = 100, windowMs: number = 60000) => applyDecorators(
  UseGuards(UnifiedJwtGuard, new RateLimitGuard(maxRequests, windowMs)),
  ApiBearerAuth(),
  ApiUnauthorizedResponse({ description: 'Unauthorized - Invalid or missing token' }),
  ApiForbiddenResponse({ description: 'Forbidden - Rate limit exceeded' }),
);

/**
 * 完整的认证装饰器
 * 包含权限、角色和速率限制
 */
export const FullAuth = (options: {
  permissions?: string[];
  roles?: string[];
  maxRequests?: number;
  windowMs?: number;
  requireOwnership?: boolean;
} = {}) => {
  const decorators = [UseGuards(UnifiedJwtGuard)];
  
  if (options.permissions && options.permissions.length > 0) {
    decorators.unshift(RequirePermissions(...options.permissions));
  }
  
  if (options.roles && options.roles.length > 0) {
    decorators.unshift(RequireRoles(...options.roles));
  }
  
  if (options.requireOwnership) {
    decorators.push(UseGuards(ResourceOwnerGuard));
  }
  
  if (options.maxRequests && options.windowMs) {
    decorators.push(UseGuards(new RateLimitGuard(options.maxRequests, options.windowMs)));
  }
  
  decorators.push(
    ApiBearerAuth(),
    ApiUnauthorizedResponse({ description: 'Unauthorized - Invalid or missing token' }),
    ApiForbiddenResponse({ description: 'Forbidden - Access denied' }),
  );
  
  return applyDecorators(...decorators);
};

/**
 * 获取当前用户装饰器
 * 从请求中提取当前用户信息
 */
export const CurrentUser = createParamDecorator(
  (data: keyof AuthenticatedRequest['user'] | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<AuthenticatedRequest>();
    const user = request.user;
    
    return data ? user?.[data] : user;
  },
);

/**
 * 获取用户ID装饰器
 */
export const UserId = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<AuthenticatedRequest>();
    return request.user?.sub;
  },
);

/**
 * 获取用户名装饰器
 */
export const Username = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<AuthenticatedRequest>();
    return request.user?.username;
  },
);

/**
 * 获取用户角色装饰器
 */
export const UserRoles = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<AuthenticatedRequest>();
    return request.user?.roles || [];
  },
);

/**
 * 获取用户权限装饰器
 */
export const UserPermissions = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<AuthenticatedRequest>();
    return request.user?.permissions || [];
  },
);

/**
 * 检查权限装饰器
 * 在方法内部检查用户是否有特定权限
 */
export const CheckPermission = (permission: string) => 
  createParamDecorator((data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<AuthenticatedRequest>();
    const user = request.user;
    
    if (!user) {
      return false;
    }
    
    return user.permissions?.includes(permission) || false;
  });

/**
 * 检查角色装饰器
 * 在方法内部检查用户是否有特定角色
 */
export const CheckRole = (role: string) => 
  createParamDecorator((data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<AuthenticatedRequest>();
    const user = request.user;
    
    if (!user) {
      return false;
    }
    
    return user.roles?.includes(role) || false;
  });

/**
 * 条件认证装饰器
 * 根据条件决定是否需要认证
 */
export const ConditionalAuth = (condition: (ctx: ExecutionContext) => boolean) => 
  (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    const originalMethod = descriptor.value;
    
    descriptor.value = async function (...args: any[]) {
      const ctx = args[args.length - 1] as ExecutionContext;
      
      if (condition(ctx)) {
        // 需要认证，应用JWT守卫
        const guard = new UnifiedJwtGuard(
          this.jwtService || args[0]?.jwtService,
          this.reflector || args[0]?.reflector
        );
        
        const canActivate = await guard.canActivate(ctx);
        if (!canActivate) {
          throw new Error('Authentication failed');
        }
      }
      
      return originalMethod.apply(this, args);
    };
    
    return descriptor;
  };

/**
 * 批量权限检查装饰器
 * 检查用户是否有多个权限中的任意一个
 */
export const RequireAnyPermission = (...permissions: string[]) => 
  SetMetadata(PERMISSIONS_KEY, permissions);

/**
 * 批量角色检查装饰器
 * 检查用户是否有多个角色中的任意一个
 */
export const RequireAnyRole = (...roles: string[]) => 
  SetMetadata(ROLES_KEY, roles);

/**
 * 时间限制认证装饰器
 * 只在特定时间段内允许访问
 */
export const TimeRestrictedAuth = (startHour: number, endHour: number) => 
  applyDecorators(
    UseGuards(UnifiedJwtGuard),
    (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
      const originalMethod = descriptor.value;
      
      descriptor.value = async function (...args: any[]) {
        const currentHour = new Date().getHours();
        
        if (currentHour < startHour || currentHour >= endHour) {
          throw new Error(`Access denied. Service available only between ${startHour}:00 and ${endHour}:00`);
        }
        
        return originalMethod.apply(this, args);
      };
      
      return descriptor;
    }
  );

/**
 * IP限制认证装饰器
 * 只允许特定IP访问
 */
export const IpRestrictedAuth = (allowedIps: string[]) => 
  applyDecorators(
    UseGuards(UnifiedJwtGuard),
    (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
      const originalMethod = descriptor.value;
      
      descriptor.value = async function (...args: any[]) {
        const ctx = args[args.length - 1] as ExecutionContext;
        const request = ctx.switchToHttp().getRequest();
        const clientIp = request.ip || request.connection.remoteAddress;
        
        if (!allowedIps.includes(clientIp)) {
          throw new Error(`Access denied from IP: ${clientIp}`);
        }
        
        return originalMethod.apply(this, args);
      };
      
      return descriptor;
    }
  );
