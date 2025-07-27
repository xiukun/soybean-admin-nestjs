/**
 * Configuration exports
 * 配置导出
 */

export * from './app.config';
export * from './cors.config';
export * from './security.config';

// Configuration tokens for easy import
export const CONFIG_TOKENS = {
  APP: 'app',
  CORS: 'cors',
  SECURITY: 'security',
} as const;

// Type for configuration keys
export type ConfigKeyPaths = 
  | 'app'
  | 'cors' 
  | 'security';
