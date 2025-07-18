import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { CreateApiConfigHandler } from '@lib/bounded-contexts/api-config/application/handlers/create-api-config.handler';
import { 
  GetApiConfigHandler, 
  GetApiConfigByCodeHandler, 
  GetApiConfigsByProjectHandler,
  GetApiConfigsPaginatedHandler,
  GetApiConfigsByEntityHandler,
  GetApiConfigStatsHandler,
  GetPublishedApiConfigsHandler,
  GetApiConfigVersionsHandler
} from '@lib/bounded-contexts/api-config/application/handlers/get-api-config.handler';
import { ApiConfigPrismaRepository } from '@infra/bounded-contexts/api-config/api-config-prisma.repository';

const CommandHandlers = [
  CreateApiConfigHandler,
];

const QueryHandlers = [
  GetApiConfigHandler,
  GetApiConfigByCodeHandler,
  GetApiConfigsByProjectHandler,
  GetApiConfigsPaginatedHandler,
  GetApiConfigsByEntityHandler,
  GetApiConfigStatsHandler,
  GetPublishedApiConfigsHandler,
  GetApiConfigVersionsHandler,
];

@Module({
  imports: [CqrsModule],
  providers: [
    ...CommandHandlers,
    ...QueryHandlers,
    {
      provide: 'ApiConfigRepository',
      useClass: ApiConfigPrismaRepository,
    },
  ],
  exports: [
    ...CommandHandlers,
    ...QueryHandlers,
    'ApiConfigRepository',
  ],
})
export class ApiConfigModule {}
