import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { CreateApiHandler } from './application/handlers/create-api.handler';
import { MultiTableQueryService } from './application/services/multi-table-query.service';
import { ApiPrismaRepository } from '../../../infra/bounded-contexts/api/api-prisma.repository';
import { EntityModule } from '../entity/entity.module';

const CommandHandlers = [
  CreateApiHandler,
];

const QueryHandlers = [
  // TODO: Add query handlers
];

@Module({
  imports: [CqrsModule, EntityModule],
  providers: [
    ...CommandHandlers,
    ...QueryHandlers,
    MultiTableQueryService,
    {
      provide: 'ApiRepository',
      useClass: ApiPrismaRepository,
    },
  ],
  exports: [
    ...CommandHandlers,
    ...QueryHandlers,
    MultiTableQueryService,
    'ApiRepository',
  ],
})
export class ApiModule {}
