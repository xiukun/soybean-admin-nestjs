import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { PrismaModule } from '@lib/shared/prisma/prisma.module';

// Command Handlers
import {
  CreateQueryHandler,
  UpdateQueryHandler,
  DeleteQueryHandler,
  ExecuteQueryHandler,
  ActivateQueryHandler,
  DeactivateQueryHandler,
} from './application/handlers/create-query.handler';

// Query Handlers
import {
  GetQueryHandler,
  GetQueriesByProjectHandler,
  GetQueriesPaginatedHandler,
  GetQueryStatsHandler,
} from './application/handlers/get-query.handler';

// Infrastructure
import { QueryRepository } from './infrastructure/query.repository';

const CommandHandlers = [
  CreateQueryHandler,
  UpdateQueryHandler,
  DeleteQueryHandler,
  ExecuteQueryHandler,
  ActivateQueryHandler,
  DeactivateQueryHandler,
];

const QueryHandlers = [
  GetQueryHandler,
  GetQueriesByProjectHandler,
  GetQueriesPaginatedHandler,
  GetQueryStatsHandler,
];

@Module({
  imports: [CqrsModule, PrismaModule],
  providers: [
    ...CommandHandlers,
    ...QueryHandlers,
    {
      provide: 'QueryRepository',
      useClass: QueryRepository,
    },
  ],
  exports: [
    ...CommandHandlers,
    ...QueryHandlers,
    'QueryRepository',
  ],
})
export class QueryModule {}
