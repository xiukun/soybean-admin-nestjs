/*
 * @Description: 实体关系管理模块
 * @Autor: henry.xiukun
 * @Date: 2025-07-26 00:15:00
 * @LastEditors: henry.xiukun
 */

import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { PrismaModule } from '@lib/shared/prisma/prisma.module';

// 新的命令处理器
import {
  CreateRelationshipHandler,
  UpdateRelationshipHandler,
  DeleteRelationshipHandler,
  ValidateRelationshipHandler,
  GenerateRelationshipSQLHandler,
  BatchCreateRelationshipsHandler,
  SyncRelationshipsHandler,
} from './application/handlers/relationship.handlers';

// 新的查询处理器
import {
  GetRelationshipsHandler,
  GetRelationshipByIdHandler,
  GetProjectRelationshipsHandler,
  GetEntityRelationshipsHandler,
  GetRelationshipTypesHandler,
  ValidateRelationshipConfigHandler,
  GetRelationshipSQLHandler,
  GetRelationshipGraphHandler,
  GetRelationshipStatsHandler,
} from './application/handlers/relationship-query.handlers';

// 服务
import { RelationshipManagerService } from './application/services/relationship-manager.service';

const CommandHandlers = [
  CreateRelationshipHandler,
  UpdateRelationshipHandler,
  DeleteRelationshipHandler,
  ValidateRelationshipHandler,
  GenerateRelationshipSQLHandler,
  BatchCreateRelationshipsHandler,
  SyncRelationshipsHandler,
];

const QueryHandlers = [
  GetRelationshipsHandler,
  GetRelationshipByIdHandler,
  GetProjectRelationshipsHandler,
  GetEntityRelationshipsHandler,
  GetRelationshipTypesHandler,
  ValidateRelationshipConfigHandler,
  GetRelationshipSQLHandler,
  GetRelationshipGraphHandler,
  GetRelationshipStatsHandler,
];

const Services = [
  RelationshipManagerService,
];

@Module({
  imports: [
    CqrsModule,
    PrismaModule,
  ],
  providers: [
    ...CommandHandlers,
    ...QueryHandlers,
    ...Services,
  ],
  exports: [
    ...Services,
  ],
})
export class RelationshipModule {}
