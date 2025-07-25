import { registerAs } from '@nestjs/config';

/**
 * 统一JWT配置接口
 * 适用于所有微服务：backend, lowcode-platform-backend, amis-lowcode-backend
 */
export interface UnifiedJwtConfig {
  /** JWT访问令牌密钥 */
  accessTokenSecret: string;
  /** JWT刷新令牌密钥 */
  refreshTokenSecret: string;
  /** 访问令牌过期时间 */
  accessTokenExpiresIn: string;
  /** 刷新令牌过期时间 */
  refreshTokenExpiresIn: string;
  /** JWT签发者 */
  issuer: string;
  /** JWT受众 */
  audience: string;
  /** JWT算法 */
  algorithm: string;
  /** 服务间认证密钥 */
  serviceSecret: string;
  /** 是否启用Token黑名单 */
  enableBlacklist: boolean;
  /** 是否启用会话管理 */
  enableSessionManagement: boolean;
  /** Redis配置 */
  redis: {
    host: string;
    port: number;
    password?: string;
    db: number;
  };
}

/**
 * JWT配置注册token
 */
export const JWT_CONFIG_TOKEN = 'jwt-config';

/**
 * 统一JWT配置
 */
export const jwtConfig = registerAs(JWT_CONFIG_TOKEN, (): UnifiedJwtConfig => {
  // 验证必需的环境变量
  const accessTokenSecret = process.env.JWT_SECRET;
  const refreshTokenSecret = process.env.REFRESH_TOKEN_SECRET;
  const serviceSecret = process.env.SERVICE_SECRET;

  if (!accessTokenSecret) {
    throw new Error('JWT_SECRET environment variable is required');
  }

  if (!refreshTokenSecret) {
    throw new Error('REFRESH_TOKEN_SECRET environment variable is required');
  }

  if (!serviceSecret) {
    throw new Error('SERVICE_SECRET environment variable is required');
  }

  // 验证密钥长度
  if (accessTokenSecret.length < 32) {
    throw new Error('JWT_SECRET must be at least 32 characters long');
  }

  if (refreshTokenSecret.length < 32) {
    throw new Error('REFRESH_TOKEN_SECRET must be at least 32 characters long');
  }

  if (serviceSecret.length < 32) {
    throw new Error('SERVICE_SECRET must be at least 32 characters long');
  }

  return {
    accessTokenSecret,
    refreshTokenSecret,
    accessTokenExpiresIn: process.env.JWT_EXPIRES_IN || '2h',
    refreshTokenExpiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || '7d',
    issuer: process.env.JWT_ISSUER || 'soybean-admin',
    audience: process.env.JWT_AUDIENCE || 'soybean-admin-client',
    algorithm: process.env.JWT_ALGORITHM || 'HS256',
    serviceSecret,
    enableBlacklist: process.env.ENABLE_TOKEN_BLACKLIST !== 'false',
    enableSessionManagement: process.env.ENABLE_SESSION_MANAGEMENT !== 'false',
    redis: {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379', 10),
      password: process.env.REDIS_PASSWORD,
      db: parseInt(process.env.REDIS_DB || '0', 10),
    },
  };
});

/**
 * 获取JWT配置的辅助函数
 */
export function getJwtConfig(): UnifiedJwtConfig {
  return jwtConfig();
}

/**
 * 验证JWT配置
 */
export function validateJwtConfig(config: UnifiedJwtConfig): void {
  const errors: string[] = [];

  if (!config.accessTokenSecret || config.accessTokenSecret.length < 32) {
    errors.push('Access token secret must be at least 32 characters long');
  }

  if (!config.refreshTokenSecret || config.refreshTokenSecret.length < 32) {
    errors.push('Refresh token secret must be at least 32 characters long');
  }

  if (!config.serviceSecret || config.serviceSecret.length < 32) {
    errors.push('Service secret must be at least 32 characters long');
  }

  if (!config.issuer) {
    errors.push('JWT issuer is required');
  }

  if (!config.audience) {
    errors.push('JWT audience is required');
  }

  if (!['HS256', 'HS384', 'HS512'].includes(config.algorithm)) {
    errors.push('JWT algorithm must be one of: HS256, HS384, HS512');
  }

  if (errors.length > 0) {
    throw new Error(`JWT configuration validation failed:\n${errors.join('\n')}`);
  }
}

/**
 * JWT配置常量
 */
export const JWT_CONSTANTS = {
  /** 默认访问令牌过期时间 */
  DEFAULT_ACCESS_TOKEN_EXPIRES_IN: '2h',
  /** 默认刷新令牌过期时间 */
  DEFAULT_REFRESH_TOKEN_EXPIRES_IN: '7d',
  /** 默认签发者 */
  DEFAULT_ISSUER: 'soybean-admin',
  /** 默认受众 */
  DEFAULT_AUDIENCE: 'soybean-admin-client',
  /** 默认算法 */
  DEFAULT_ALGORITHM: 'HS256',
  /** 支持的算法 */
  SUPPORTED_ALGORITHMS: ['HS256', 'HS384', 'HS512'],
  /** 最小密钥长度 */
  MIN_SECRET_LENGTH: 32,
  /** Token类型 */
  TOKEN_TYPES: {
    ACCESS: 'access',
    REFRESH: 'refresh',
  } as const,
  /** Redis键前缀 */
  REDIS_KEYS: {
    TOKEN_BLACKLIST: 'jwt:blacklist:',
    USER_SESSION: 'jwt:session:',
    USER_TOKENS: 'jwt:tokens:',
    SERVICE_REGISTRY: 'jwt:services:',
    NONCE: 'jwt:nonce:',
  } as const,
} as const;

/**
 * 环境变量映射
 */
export const ENV_VARIABLES = {
  JWT_SECRET: 'JWT_SECRET',
  REFRESH_TOKEN_SECRET: 'REFRESH_TOKEN_SECRET',
  JWT_EXPIRES_IN: 'JWT_EXPIRES_IN',
  REFRESH_TOKEN_EXPIRES_IN: 'REFRESH_TOKEN_EXPIRES_IN',
  JWT_ISSUER: 'JWT_ISSUER',
  JWT_AUDIENCE: 'JWT_AUDIENCE',
  JWT_ALGORITHM: 'JWT_ALGORITHM',
  SERVICE_SECRET: 'SERVICE_SECRET',
  ENABLE_TOKEN_BLACKLIST: 'ENABLE_TOKEN_BLACKLIST',
  ENABLE_SESSION_MANAGEMENT: 'ENABLE_SESSION_MANAGEMENT',
  REDIS_HOST: 'REDIS_HOST',
  REDIS_PORT: 'REDIS_PORT',
  REDIS_PASSWORD: 'REDIS_PASSWORD',
  REDIS_DB: 'REDIS_DB',
} as const;
