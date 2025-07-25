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

// Decorators
export { Public } from './decorators/public.decorator';
export { Roles } from './decorators/roles.decorator';
export { Permissions } from './decorators/permissions.decorator';
export { CurrentUser } from './decorators/current-user.decorator';
export { ApiJwtAuth } from './decorators/api-jwt-auth.decorator';
export { AutoApiJwtAuth, SmartApiJwtAuth, GlobalApiJwtAuth } from './decorators/auto-api-jwt-auth.decorator';

// Constants
export { IS_PUBLIC_KEY } from './guards/unified-jwt.guard';
export { ROLES_KEY } from './decorators/roles.decorator';
export { PERMISSIONS_KEY } from './decorators/permissions.decorator';

// Health & Monitoring
export { AuthHealthService } from './health/auth-health.service';

// Middleware
export { AuthLoggingMiddleware, SecurityAuditMiddleware } from './middleware/auth-logging.middleware';
