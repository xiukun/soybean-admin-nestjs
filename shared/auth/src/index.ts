// Module
export { UnifiedAuthModule } from './unified-auth.module';

// Configuration
export {
  UnifiedJwtConfig,
  JWT_CONFIG_TOKEN,
  JWT_CONSTANTS,
  jwtConfig,
  getJwtConfig,
  validateJwtConfig,
} from './config/jwt.config';

// Services
export {
  UnifiedJwtService,
  IAuthentication,
  JwtPayload,
  TokenPair,
} from './services/unified-jwt.service';

// Strategies
export { UnifiedJwtStrategy } from './strategies/unified-jwt.strategy';

// Guards
export { UnifiedJwtGuard } from './guards/unified-jwt.guard';
export { RolesGuard } from './guards/roles.guard';
export { PermissionsGuard } from './guards/permissions.guard';
export { CrossServiceGuard, ServiceAuthUtil } from './guards/cross-service.guard';
export { RateLimitGuard, RateLimitOptions, RateLimitInfo } from './guards/rate-limit.guard';

// Interceptors
export { AuditLogInterceptor, AuditLogEntry } from './interceptors/audit-log.interceptor';

// Decorators
export {
  // 基础装饰器
  Public,
  Roles,
  Permissions,
  CurrentUser,
  CurrentUserId,
  CurrentUsername,
  CurrentUserDomain,
  CurrentUserRoles,
  CurrentUserPermissions,
  CurrentToken,
  ClientIp,
  UserAgent,
  // 服务间调用装饰器
  InternalService,
  CrossService,
  ResourceOwner,
  AdminOnly,
  SuperAdminOnly,
  // API装饰器
  ApiJwtAuth,
  ApiPublic,
  ApiAdminAuth,
  ApiSuperAdminAuth,
  // 功能装饰器
  RateLimit,
  AuditLog,
  Cache,
  ValidatedAuth,
} from './decorators/auth.decorators';
export { AutoApiJwtAuth, SmartApiJwtAuth, GlobalApiJwtAuth } from './decorators/auto-api-jwt-auth.decorator';

// Constants
export { IS_PUBLIC_KEY } from './guards/jwt-auth.guard';
export { ROLES_KEY } from './decorators/roles.decorator';
export { PERMISSIONS_KEY } from './decorators/permissions.decorator';
