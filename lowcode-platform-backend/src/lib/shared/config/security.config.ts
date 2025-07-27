import { ConfigType, registerAs } from '@nestjs/config';
import { getEnvNumber, getEnvString } from '../utils/env.util';

export const securityRegToken = 'security';

/**
 * Security Configuration
 * 安全配置
 */
export const SecurityConfig = registerAs(securityRegToken, () => ({
  // JWT configuration
  jwtSecret: getEnvString('JWT_SECRET', 'JWT_SECRET-soybean-admin-nest!@#123.'),
  jwtExpiresIn: getEnvString('JWT_EXPIRES_IN', '7d'),
  
  // Refresh token configuration
  refreshJwtSecret: getEnvString(
    'REFRESH_TOKEN_SECRET',
    'REFRESH_TOKEN_SECRET-soybean-admin-nest!@#123.',
  ),
  refreshJwtExpiresIn: getEnvNumber('REFRESH_TOKEN_EXPIRE_IN', 60 * 60 * 12), // 12 hours
  
  // Request signing
  signReqTimestampDisparity: getEnvNumber(
    'SIGN_REQ_TIMESTAMP_DISPARITY',
    5 * 60 * 1000, // 5 minutes
  ),
  signReqNonceTTL: getEnvNumber('SIGN_REQ_NONCE_TTL', 300), // 5 minutes
  
  // Password policy
  passwordMinLength: getEnvNumber('PASSWORD_MIN_LENGTH', 8),
  passwordRequireUppercase: getEnvString('PASSWORD_REQUIRE_UPPERCASE', 'true') === 'true',
  passwordRequireLowercase: getEnvString('PASSWORD_REQUIRE_LOWERCASE', 'true') === 'true',
  passwordRequireNumbers: getEnvString('PASSWORD_REQUIRE_NUMBERS', 'true') === 'true',
  passwordRequireSymbols: getEnvString('PASSWORD_REQUIRE_SYMBOLS', 'false') === 'true',
}));

export type ISecurityConfig = ConfigType<typeof SecurityConfig>;
