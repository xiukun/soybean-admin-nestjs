import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CqrsModule } from '@nestjs/cqrs';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './lib/shared/prisma/prisma.module';
import { EntityModule } from './lib/bounded-contexts/entity/entity.module';
import { ApiModule } from './lib/bounded-contexts/api/api.module';
import { ProjectModule } from './lib/bounded-contexts/project/project.module';
import { RelationshipModule } from './lib/bounded-contexts/relationship/relationship.module';
import { ApiConfigModule } from './lib/bounded-contexts/api-config/api-config.module';
import { EntityController } from './api/lowcode/entity.controller';
import { ProjectController } from './api/lowcode/project.controller';
import { RelationshipController } from './api/lowcode/relationship.controller';
import { ApiConfigController } from './api/lowcode/api-config.controller';
import { AmisDemoController } from './api/lowcode/amis-demo.controller';

@Module({
  imports: [
    // 配置模块
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
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
  ],
})
export class AppModule {}
