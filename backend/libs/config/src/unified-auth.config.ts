import { registerAs } from '@nestjs/config';

/**
 * 统一认证配置接口
 */
export interface IUnifiedAuthConfig {
  /** JWT密钥 */
  jwtSecret: string;
  /** 刷新token密钥 */
  refreshJwtSecret: string;
  /** JWT过期时间（秒） */
  jwtExpiresIn: number;
  /** 刷新token过期时间（秒） */
  refreshJwtExpiresIn: number;
  /** JWT签发者 */
  jwtIssuer: string;
  /** JWT受众 */
  jwtAudience: string;
  /** 服务间认证密钥 */
  serviceSecret: string;
  /** 最大时间戳差异（毫秒） */
  maxTimestampDiff: number;
  /** 是否启用跨服务认证 */
  enableCrossServiceAuth: boolean;
  /** 是否启用token黑名单 */
  enableTokenBlacklist: boolean;
  /** 是否启用用户会话管理 */
  enableSessionManagement: boolean;
  /** token统计信息缓存时间（秒） */
  tokenStatsCacheTtl: number;
}

/**
 * 统一认证配置注册token
 */
export const unifiedAuthRegToken = 'unified-auth';

/**
 * 统一认证配置
 */
export const UnifiedAuthConfig = registerAs(
  unifiedAuthRegToken,
  (): IUnifiedAuthConfig => ({
    jwtSecret: process.env.JWT_SECRET || 'soybean-admin-jwt-secret-key',
    refreshJwtSecret: process.env.REFRESH_TOKEN_SECRET || 'soybean-admin-refresh-secret-key',
    jwtExpiresIn: parseInt(process.env.JWT_EXPIRE_IN || '7200', 10), // 2小时
    refreshJwtExpiresIn: parseInt(process.env.REFRESH_TOKEN_EXPIRE_IN || '43200', 10), // 12小时
    jwtIssuer: process.env.JWT_ISSUER || 'soybean-admin',
    jwtAudience: process.env.JWT_AUDIENCE || 'soybean-admin-client',
    serviceSecret: process.env.SERVICE_SECRET || 'soybean-admin-service-secret',
    maxTimestampDiff: parseInt(process.env.MAX_TIMESTAMP_DIFF || '300000', 10), // 5分钟
    enableCrossServiceAuth: process.env.ENABLE_CROSS_SERVICE_AUTH === 'true',
    enableTokenBlacklist: process.env.ENABLE_TOKEN_BLACKLIST !== 'false', // 默认启用
    enableSessionManagement: process.env.ENABLE_SESSION_MANAGEMENT !== 'false', // 默认启用
    tokenStatsCacheTtl: parseInt(process.env.TOKEN_STATS_CACHE_TTL || '300', 10), // 5分钟
  }),
);

/**
 * 获取统一认证配置
 */
export function getUnifiedAuthConfig(): IUnifiedAuthConfig {
  return {
    jwtSecret: process.env.JWT_SECRET || 'soybean-admin-jwt-secret-key',
    refreshJwtSecret: process.env.REFRESH_TOKEN_SECRET || 'soybean-admin-refresh-secret-key',
    jwtExpiresIn: parseInt(process.env.JWT_EXPIRE_IN || '7200', 10),
    refreshJwtExpiresIn: parseInt(process.env.REFRESH_TOKEN_EXPIRE_IN || '43200', 10),
    jwtIssuer: process.env.JWT_ISSUER || 'soybean-admin',
    jwtAudience: process.env.JWT_AUDIENCE || 'soybean-admin-client',
    serviceSecret: process.env.SERVICE_SECRET || 'soybean-admin-service-secret',
    maxTimestampDiff: parseInt(process.env.MAX_TIMESTAMP_DIFF || '300000', 10),
    enableCrossServiceAuth: process.env.ENABLE_CROSS_SERVICE_AUTH === 'true',
    enableTokenBlacklist: process.env.ENABLE_TOKEN_BLACKLIST !== 'false',
    enableSessionManagement: process.env.ENABLE_SESSION_MANAGEMENT !== 'false',
    tokenStatsCacheTtl: parseInt(process.env.TOKEN_STATS_CACHE_TTL || '300', 10),
  };
}

/**
 * 验证认证配置
 */
export function validateUnifiedAuthConfig(config: IUnifiedAuthConfig): void {
  const errors: string[] = [];

  if (!config.jwtSecret || config.jwtSecret.length < 32) {
    errors.push('JWT_SECRET must be at least 32 characters long');
  }

  if (!config.refreshJwtSecret || config.refreshJwtSecret.length < 32) {
    errors.push('REFRESH_TOKEN_SECRET must be at least 32 characters long');
  }

  if (config.jwtExpiresIn <= 0) {
    errors.push('JWT_EXPIRE_IN must be greater than 0');
  }

  if (config.refreshJwtExpiresIn <= config.jwtExpiresIn) {
    errors.push('REFRESH_TOKEN_EXPIRE_IN must be greater than JWT_EXPIRE_IN');
  }

  if (!config.serviceSecret || config.serviceSecret.length < 32) {
    errors.push('SERVICE_SECRET must be at least 32 characters long');
  }

  if (config.maxTimestampDiff <= 0) {
    errors.push('MAX_TIMESTAMP_DIFF must be greater than 0');
  }

  if (errors.length > 0) {
    throw new Error(`Invalid unified auth configuration:\n${errors.join('\n')}`);
  }
}

/**
 * 认证配置常量
 */
export const AUTH_CONSTANTS = {
  /** 默认JWT过期时间（2小时） */
  DEFAULT_JWT_EXPIRES_IN: 7200,
  /** 默认刷新token过期时间（12小时） */
  DEFAULT_REFRESH_TOKEN_EXPIRES_IN: 43200,
  /** 默认最大时间戳差异（5分钟） */
  DEFAULT_MAX_TIMESTAMP_DIFF: 300000,
  /** 默认token统计缓存时间（5分钟） */
  DEFAULT_TOKEN_STATS_CACHE_TTL: 300,
  /** 最小密钥长度 */
  MIN_SECRET_LENGTH: 32,
  /** 支持的JWT算法 */
  SUPPORTED_JWT_ALGORITHMS: ['HS256', 'HS384', 'HS512'],
  /** 默认JWT算法 */
  DEFAULT_JWT_ALGORITHM: 'HS256',
} as const;

/**
 * 环境变量配置映射
 */
export const ENV_CONFIG_MAP = {
  JWT_SECRET: 'jwtSecret',
  REFRESH_TOKEN_SECRET: 'refreshJwtSecret',
  JWT_EXPIRE_IN: 'jwtExpiresIn',
  REFRESH_TOKEN_EXPIRE_IN: 'refreshJwtExpiresIn',
  JWT_ISSUER: 'jwtIssuer',
  JWT_AUDIENCE: 'jwtAudience',
  SERVICE_SECRET: 'serviceSecret',
  MAX_TIMESTAMP_DIFF: 'maxTimestampDiff',
  ENABLE_CROSS_SERVICE_AUTH: 'enableCrossServiceAuth',
  ENABLE_TOKEN_BLACKLIST: 'enableTokenBlacklist',
  ENABLE_SESSION_MANAGEMENT: 'enableSessionManagement',
  TOKEN_STATS_CACHE_TTL: 'tokenStatsCacheTtl',
} as const;
