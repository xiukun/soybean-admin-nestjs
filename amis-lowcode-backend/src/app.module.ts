import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaService } from '@shared/services/prisma.service';
import { TestUserModule } from './biz/modules/test-user.module';
import { RoleModule } from '@modules/role.module';
import { DatabaseInitService } from '@shared/database/database-init.service';
import { UnifiedAuthModule } from '../../shared/auth/src';
import { AuthController } from './shared/controllers/auth.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),

    // 统一认证模块
    UnifiedAuthModule.forRoot(),

    TestUserModule,
    RoleModule
  ],
  controllers: [AppController, AuthController],
  providers: [
    AppService,
    PrismaService,
    DatabaseInitService,
  ],
})
export class AppModule {
  // This module is dynamically updated by the code generator
}