import { ConfigType, registerAs } from '@nestjs/config';
import {
  getEnvArray,
  getEnvBoolean,
  getEnvNumber,
  getEnvString,
} from '../utils/env.util';

export const corsRegToken = 'cors';

/**
 * CORS Configuration
 * CORS 配置
 */
export const CorsConfig = registerAs(corsRegToken, () => {
  return {
    enabled: getEnvBoolean('CORS_ENABLED', true),
    corsOptions: {
      origin: getEnvArray('CORS_ORIGIN', [
        'http://localhost:9527',
        'http://127.0.0.1:9527',
        'http://localhost:9528',
        'http://127.0.0.1:9528',
      ]),
      methods: getEnvString(
        'CORS_METHODS',
        'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
      ).split(',').map(method => method.trim()),
      preflightContinue: getEnvBoolean('CORS_PREFLIGHT_CONTINUE', false),
      optionsSuccessStatus: getEnvNumber('CORS_OPTIONS_SUCCESS_STATUS', 204),
      credentials: getEnvBoolean('CORS_CREDENTIALS', true),
      maxAge: getEnvNumber('CORS_MAX_AGE', 3600),
      allowedHeaders: getEnvString(
        'CORS_ALLOWED_HEADERS',
        'Content-Type,Authorization,X-Requested-With,Accept,Origin,Access-Control-Request-Method,Access-Control-Request-Headers',
      ).split(',').map(header => header.trim()),
    },
  };
});

export type ICorsConfig = ConfigType<typeof CorsConfig>;
