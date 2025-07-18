import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CqrsModule } from '@nestjs/cqrs';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AppController } from '@src/app.controller';
import { AppService } from '@src/app.service';
import { PrismaModule } from '@prisma/prisma.module';
import { EntityModule } from '@entity/entity.module';
import { ApiModule } from '@api-context/api.module';
import { ProjectModule } from '@project/project.module';
import { RelationshipModule } from '@lib/bounded-contexts/relationship/relationship.module';
import { ApiConfigModule } from '@lib/bounded-contexts/api-config/api-config.module';
import { EntityController } from '@api/lowcode/entity.controller';
import { ProjectController } from '@api/lowcode/project.controller';
import { RelationshipController } from '@api/lowcode/relationship.controller';
import { ApiConfigController } from '@api/lowcode/api-config.controller';
import { AmisDemoController } from '@api/lowcode/amis-demo.controller';
import { JwtAuthGuard } from '@guards/jwt-auth.guard';
import { JwtStrategy } from '@strategies/jwt.strategy';

@Module({
  imports: [
    // 配置模块
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

    // CQRS模块
    CqrsModule,

    // 事件模块
    EventEmitterModule.forRoot(),

    // 数据库模块
    PrismaModule,

    // 业务模块
    EntityModule,
    ApiModule,
    ProjectModule,
    RelationshipModule,
    ApiConfigModule,
  ],
  controllers: [AppController, EntityController, ProjectController, RelationshipController, ApiConfigController, AmisDemoController],
  providers: [
    AppService,
    JwtStrategy,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
