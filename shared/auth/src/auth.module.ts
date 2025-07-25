import { Module, Global } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { APP_GUARD } from '@nestjs/core';

// Services
import { UnifiedJwtService } from './services/jwt.service';

// Strategies
import { UnifiedJwtStrategy } from './strategies/jwt.strategy';

// Guards
import { UnifiedJwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { PermissionsGuard } from './guards/permissions.guard';

/**
 * 统一认证模块
 * 提供跨微服务的JWT认证功能
 */
@Global()
@Module({
  imports: [
    ConfigModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET', 'default-secret'),
        signOptions: {
          expiresIn: configService.get<string>('JWT_EXPIRES_IN', '2h'),
          issuer: configService.get<string>('JWT_ISSUER', 'soybean-admin'),
          audience: configService.get<string>('JWT_AUDIENCE', 'soybean-admin'),
        },
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [
    // Services
    UnifiedJwtService,
    
    // Strategies
    UnifiedJwtStrategy,
    
    // Guards
    {
      provide: APP_GUARD,
      useClass: UnifiedJwtAuthGuard,
    },
    RolesGuard,
    PermissionsGuard,
  ],
  exports: [
    // Services
    UnifiedJwtService,
    
    // Strategies
    UnifiedJwtStrategy,
    
    // Guards
    UnifiedJwtAuthGuard,
    RolesGuard,
    PermissionsGuard,
    
    // Modules
    JwtModule,
    PassportModule,
  ],
})
export class UnifiedAuthModule {
  /**
   * 为特定微服务配置认证模块
   * @param options 配置选项
   * @returns 配置后的模块
   */
  static forRoot(options?: {
    enableGlobalGuard?: boolean;
    jwtSecret?: string;
    jwtExpiresIn?: string;
    issuer?: string;
    audience?: string;
  }) {
    return {
      module: UnifiedAuthModule,
      providers: [
        ...(options?.enableGlobalGuard !== false ? [
          {
            provide: APP_GUARD,
            useClass: UnifiedJwtAuthGuard,
          },
        ] : []),
      ],
    };
  }
}
