import { RecordNamePaths } from '@lib/typings/utils';
import { ConfigModuleOptions } from '@nestjs/config';
import { getConfigPath } from '@lib/utils/env';

import { AppConfig, IAppConfig, appConfigToken } from './app.config';
import { CorsConfig, corsRegToken, ICorsConfig } from './cors.config';
import { RedisConfig, IRedisConfig, redisRegToken } from './redis.config';
import {
  SecurityConfig,
  ISecurityConfig,
  securityRegToken,
} from './security.config';
import {
  ThrottlerConfig,
  IThrottlerConfig,
  throttlerConfigToken,
} from './throttler.config';
import {
  UnifiedAuthConfig,
  IUnifiedAuthConfig,
  unifiedAuthRegToken,
} from './unified-auth.config';

export * from './app.config';
export * from './redis.config';
export * from './security.config';
export * from './throttler.config';
export * from './cors.config';
export * from './unified-auth.config';

export interface AllConfigType {
  [appConfigToken]: IAppConfig;
  [redisRegToken]: IRedisConfig;
  [securityRegToken]: ISecurityConfig;
  [throttlerConfigToken]: IThrottlerConfig;
  [corsRegToken]: ICorsConfig;
  [unifiedAuthRegToken]: IUnifiedAuthConfig;
}

export type ConfigKeyPaths = RecordNamePaths<AllConfigType>;

export default {
  AppConfig,
  RedisConfig,
  SecurityConfig,
  ThrottlerConfig,
  CorsConfig,
  UnifiedAuthConfig,
};

export const configModuleOptions: ConfigModuleOptions = {
  isGlobal: true,
  load: [AppConfig, RedisConfig, SecurityConfig, ThrottlerConfig, CorsConfig, UnifiedAuthConfig],
  envFilePath: [getConfigPath(`${process.env.NODE_ENV || 'development'}`)],
};
