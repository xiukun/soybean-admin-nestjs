import { Module, DynamicModule, Global } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';

import { UnifiedJwtService } from './services/unified-jwt.service';
import { UnifiedJwtStrategy } from './strategies/unified-jwt.strategy';
import { UnifiedJwtGuard } from './guards/unified-jwt.guard';
import { jwtConfig, JWT_CONFIG_TOKEN, UnifiedJwtConfig } from './config/jwt.config';

/**
 * 统一认证模块配置选项
 */
export interface UnifiedAuthModuleOptions {
  /** 是否为全局模块 */
  isGlobal?: boolean;
  /** JWT配置 */
  jwt?: {
    /** 访问令牌密钥 */
    accessTokenSecret?: string;
    /** 刷新令牌密钥 */
    refreshTokenSecret?: string;
    /** 访问令牌过期时间 */
    accessTokenExpiresIn?: string;
    /** 刷新令牌过期时间 */
    refreshTokenExpiresIn?: string;
    /** 发行者 */
    issuer?: string;
    /** 受众 */
    audience?: string;
    /** 算法 */
    algorithm?: string;
  };
  /** 速率限制配置 */
  rateLimit?: {
    /** 最大请求数 */
    maxRequests?: number;
    /** 时间窗口（毫秒） */
    windowMs?: number;
  };
  /** 是否启用WebSocket支持 */
  enableWebSocket?: boolean;
  /** 自定义提供者 */
  providers?: any[];
  /** 自定义导出 */
  exports?: any[];
}

/**
 * 异步配置选项
 */
export interface UnifiedAuthModuleAsyncOptions {
  /** 是否为全局模块 */
  isGlobal?: boolean;
  /** 导入的模块 */
  imports?: any[];
  /** 使用工厂函数 */
  useFactory?: (...args: any[]) => Promise<UnifiedAuthModuleOptions> | UnifiedAuthModuleOptions;
  /** 注入的依赖 */
  inject?: any[];
  /** 使用类 */
  useClass?: any;
  /** 使用现有的提供者 */
  useExisting?: any;
}

/**
 * 统一认证模块
 * 提供跨微服务的统一JWT认证功能
 * 支持：backend, lowcode-platform-backend, amis-lowcode-backend
 */
@Global()
@Module({})
export class UnifiedAuthModule {
  /**
   * 同步注册模块
   */
  static forRoot(options: UnifiedAuthModuleOptions = {}): DynamicModule {
    const providers = [
      // JWT配置提供者
      {
        provide: JWT_CONFIG_TOKEN,
        useFactory: jwtConfig,
      },
      // 核心服务和策略
      UnifiedJwtService,
      UnifiedJwtStrategy,
      // 守卫
      UnifiedJwtGuard,
      ...(options.providers || []),
    ];

    const exports = [
      // 核心服务
      UnifiedJwtService,
      UnifiedJwtStrategy,
      // 守卫
      UnifiedJwtGuard,
      // 模块
      JwtModule,
      PassportModule,
      ...(options.exports || []),
    ];

    return {
      module: UnifiedAuthModule,
      global: options.isGlobal !== false,
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          load: [jwtConfig],
        }),
        PassportModule.register({ defaultStrategy: 'jwt' }),
        JwtModule.registerAsync({
          imports: [ConfigModule],
          useFactory: async (configService: ConfigService) => {
            const config = jwtConfig();
            return {
              secret: config.accessTokenSecret,
              signOptions: {
                expiresIn: config.accessTokenExpiresIn,
                issuer: config.issuer,
                audience: config.audience,
                algorithm: config.algorithm as any,
              },
              verifyOptions: {
                issuer: config.issuer,
                audience: config.audience,
              },
            };
          },
          inject: [ConfigService],
        }),
      ],
      providers,
      exports,
    };
  }

  /**
   * 异步注册模块
   */
  static forRootAsync(options: UnifiedAuthModuleAsyncOptions): DynamicModule {
    const providers = [
      // JWT配置提供者
      {
        provide: JWT_CONFIG_TOKEN,
        useFactory: options.useFactory || (() => jwtConfig()),
        inject: options.inject || [],
      },
      // 核心服务和策略
      UnifiedJwtService,
      UnifiedJwtStrategy,
      UnifiedJwtGuard,
    ];

    const exports = [
      UnifiedJwtService,
      UnifiedJwtStrategy,
      UnifiedJwtGuard,
      JwtModule,
      PassportModule,
    ];

    return {
      module: UnifiedAuthModule,
      global: options.isGlobal !== false,
      imports: [
        ConfigModule,
        PassportModule.register({ defaultStrategy: 'jwt' }),
        JwtModule.registerAsync({
          imports: [ConfigModule],
          useFactory: async (configService: ConfigService) => {
            const config = jwtConfig();
            return {
              secret: config.accessTokenSecret,
              signOptions: {
                expiresIn: config.accessTokenExpiresIn,
                issuer: config.issuer,
                audience: config.audience,
                algorithm: config.algorithm as any,
              },
            };
          },
          inject: [ConfigService],
        }),
        ...(options.imports || []),
      ],
      providers,
      exports,
    };
  }

  /**
   * 创建测试模块
   */
  static forTesting(options: {
    /** 模拟的JWT服务 */
    mockJwtService?: any;
    /** 模拟的配置服务 */
    mockConfigService?: any;
  } = {}): DynamicModule {
    const providers = [
      {
        provide: JWT_CONFIG_TOKEN,
        useValue: {
          accessTokenSecret: 'test-secret',
          refreshTokenSecret: 'test-refresh-secret',
          accessTokenExpiresIn: '1h',
          refreshTokenExpiresIn: '7d',
          issuer: 'test-issuer',
          audience: 'test-audience',
          algorithm: 'HS256',
          serviceSecret: 'test-service-secret',
          enableBlacklist: false,
          enableSessionManagement: false,
          redis: {
            host: 'localhost',
            port: 6379,
            db: 0,
          },
        },
      },
      UnifiedJwtService,
      {
        provide: ConfigService,
        useValue: {
          get: (key: string, defaultValue?: any) => process.env[key] || defaultValue,
        },
      },
      UnifiedJwtStrategy,
      UnifiedJwtGuard,
    ];

    return {
      module: UnifiedAuthModule,
      providers,
      exports: providers,
    };
  }
}


