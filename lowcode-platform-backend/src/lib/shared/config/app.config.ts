import { ConfigType, registerAs } from '@nestjs/config';
import { getEnvBoolean, getEnvNumber, getEnvString, getPort, getHost } from '../utils/env.util';

export const appConfigToken = 'app';

/**
 * Application Configuration
 * 应用配置
 */
export const AppConfig = registerAs(appConfigToken, () => ({
  // Server configuration
  port: getPort(3002),
  host: getHost('0.0.0.0'),
  
  // Environment
  nodeEnv: getEnvString('NODE_ENV', 'development'),
  
  // Documentation
  docSwaggerEnable: getEnvBoolean('DOC_SWAGGER_ENABLE', true),
  docSwaggerPath: getEnvString('DOC_SWAGGER_PATH', 'api-docs'),
  
  // API configuration
  apiPrefix: getEnvString('API_PREFIX', 'api'),
  apiVersion: getEnvString('API_VERSION', 'v1'),
  
  // Rate limiting
  rateLimitMax: getEnvNumber('RATE_LIMIT_MAX', 200),
  rateLimitWindow: getEnvNumber('RATE_LIMIT_WINDOW', 60000), // 1 minute
  
  // File upload
  uploadMaxSize: getEnvNumber('UPLOAD_MAX_SIZE', 10485760), // 10MB
  uploadAllowedTypes: getEnvString(
    'UPLOAD_ALLOWED_TYPES',
    'image/jpeg,image/png,image/gif,application/pdf'
  ).split(',').map(type => type.trim()),
  
  // Logging
  logLevel: getEnvString('LOG_LEVEL', 'info'),
  
  // Performance monitoring
  metricsEnabled: getEnvBoolean('METRICS_ENABLED', true),
  performanceMonitoring: getEnvBoolean('PERFORMANCE_MONITORING', true),
}));

export type IAppConfig = ConfigType<typeof AppConfig>;
