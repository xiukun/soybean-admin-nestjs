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
import { JwtStrategy } from '@shared/strategies/jwt.strategy';
import { JwtAuthGuard } from '@shared/guards/jwt-auth.guard';

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

    TestUserModule,
    RoleModule
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
}