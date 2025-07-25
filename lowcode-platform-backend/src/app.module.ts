import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CqrsModule } from '@nestjs/cqrs';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { APP_GUARD, APP_FILTER } from '@nestjs/core';
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
import { QueryModule } from '@lib/bounded-contexts/query/query.module';
import { FieldModule } from '@field/field.module';
import { EntityController } from '@api/lowcode/entity.controller';
import { ProjectController } from '@api/lowcode/project.controller';
import { RelationshipController } from '@api/lowcode/relationship.controller';
import { ApiConfigController } from '@api/lowcode/api-config.controller';
import { QueryController } from '@api/lowcode/query.controller';
import { FieldController } from '@api/lowcode/field.controller';
import { TemplateController } from '@api/lowcode/template.controller';
import { AmisDemoController } from '@api/lowcode/amis-demo.controller';
import { CodeGenerationController } from '@api/lowcode/code-generation.controller';
import { CodeGenerationPageController } from '@api/lowcode/code-generation-page.controller';
import { TargetProjectController } from '@api/lowcode/target-project.controller';
import { UnifiedAuthModule } from '../../shared/auth/src';
import { CodeGenerationModule } from '@lib/code-generation/code-generation.module';
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
    }),

    // 统一认证模块
    UnifiedAuthModule.forRoot(),

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
    TemplateModule,
    HealthModule,
    MetadataModule,
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
    AmisDemoController,
    CodeGenerationController,
    CodeGenerationPageController,
    TargetProjectController
  ],
  providers: [
    AppService,
    DatabaseInitService,
  ],
})
export class AppModule {}
