import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CqrsModule } from '@nestjs/cqrs';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { APP_GUARD, APP_FILTER } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';

// Import configurations
import { AppConfig, CorsConfig, SecurityConfig } from '@lib/shared/config';
import { AppController } from '@src/app.controller';
import { AppService } from '@src/app.service';
import { PrismaModule } from '@prisma/prisma.module';
import { EntityModule } from '@entity/entity.module';
import { ApiModule } from '@api-context/api.module';
import { ProjectModule } from '@project/project.module';
import { RelationshipModule } from '@lib/bounded-contexts/relationship/relationship.module';
import { ApiConfigModule } from '@lib/bounded-contexts/api-config/api-config.module';
import { QueryModule } from '@lib/bounded-contexts/query/query.module';
import { FieldModule } from '@field/field.module';
import { EntityController } from '@api/lowcode/entity.controller';
import { ProjectController } from '@api/lowcode/project.controller';
import { RelationshipController } from '@api/lowcode/relationship.controller';
import { ApiConfigController } from '@api/lowcode/api-config.controller';
import { QueryController } from '@api/lowcode/query.controller';
import { FieldController } from '@api/lowcode/field.controller';
import { TemplateController } from '@api/lowcode/template.controller';
// import { EntityLayoutController } from '@api/lowcode/entity-layout.controller';
// import { EntityLayoutService } from './api/lowcode/services/entity-layout.service';

import { CodeGenerationController } from '@api/lowcode/code-generation.controller';
import { CodeGenerationPageController } from '@api/lowcode/code-generation-page.controller';
// import { TargetProjectController } from '@api/lowcode/target-project.controller';
import { JwtAuthGuard } from '@guards/jwt-auth.guard';
import { JwtStrategy } from '@strategies/jwt.strategy';
import { CodeGenerationModule } from '@lib/bounded-contexts/code-generation/code-generation.module';
import { HealthModule } from '@api/health/health.module';
import { MetadataModule } from '@lib/bounded-contexts/metadata/metadata.module';
import { TemplateModule } from '@lib/bounded-contexts/template/template.module';
import { DatabaseInitService } from '@infra/database/database-init.service';

@Module({
  imports: [
    // 配置模块
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
      load: [AppConfig, CorsConfig, SecurityConfig],
    }),

    // 认证模块
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const securityConfig = configService.get('security');
        return {
          secret: securityConfig.jwtSecret,
          signOptions: {
            expiresIn: securityConfig.jwtExpiresIn,
          },
        };
      },
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
    QueryModule,
    FieldModule,
    CodeGenerationModule,
    HealthModule,
    MetadataModule,
    TemplateModule,
  ],
  controllers: [
    AppController,
    EntityController,
    ProjectController,
    RelationshipController,
    ApiConfigController,
    QueryController,
    FieldController,
    TemplateController,
    // EntityLayoutController,

    CodeGenerationController,
    CodeGenerationPageController,
    // TargetProjectController
  ],
  providers: [
    AppService,
    JwtStrategy,
    DatabaseInitService,
    // EntityLayoutService,
    // {
    //   provide: APP_GUARD,
    //   useClass: JwtAuthGuard,
    // },
  ],
})
export class AppModule {}
