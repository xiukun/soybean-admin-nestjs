import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { CreateEntityHandler } from './application/handlers/create-entity.handler';
import { UpdateEntityHandler } from './application/handlers/update-entity.handler';
import { DeleteEntityHandler } from './application/handlers/delete-entity.handler';
import {
  GetEntityHandler,
  GetEntityByCodeHandler,
  GetEntitiesByProjectHandler,
  GetEntitiesPaginatedHandler,
  GetEntityStatsHandler
} from './application/handlers/get-entity.handler';
import { EntityPrismaRepository } from '../../../infra/bounded-contexts/entity/entity-prisma.repository';

const CommandHandlers = [
  CreateEntityHandler,
  UpdateEntityHandler,
  DeleteEntityHandler,
];

const QueryHandlers = [
  GetEntityHandler,
  GetEntityByCodeHandler,
  GetEntitiesByProjectHandler,
  GetEntitiesPaginatedHandler,
  GetEntityStatsHandler,
];

@Module({
  imports: [CqrsModule],
  providers: [
    ...CommandHandlers,
    ...QueryHandlers,
    {
      provide: 'EntityRepository',
      useClass: EntityPrismaRepository,
    },
  ],
  exports: [
    ...CommandHandlers,
    ...QueryHandlers,
    'EntityRepository',
  ],
})
export class EntityModule {}
