import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaService } from '@shared/services/prisma.service';
import { DatabaseInitService } from '@shared/database/database-init.service';
import { JwtStrategy } from '@shared/strategies/jwt.strategy';
import { JwtAuthGuard } from '@shared/guards/jwt-auth.guard';
import { RoleModule } from './biz/modules/role.module';
import { TestUserModule } from './biz/modules/test-user.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),

    // 认证模块
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: configService.get<string>('JWT_EXPIRES_IN', '7d'),
        },
      }),
      inject: [ConfigService],
    }),

    // 生成的业务模块
    RoleModule,
    TestUserModule
  ],
  controllers: [AppController],
  providers: [
    AppService,
    PrismaService,
    DatabaseInitService,
    JwtStrategy,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {
  // This module is dynamically updated by the code generator
  // Project: 1
  // Updated: 2025-07-27T11:55:08.281Z
}