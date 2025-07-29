import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { CreateEntityHandler } from '@entity/application/handlers/create-entity.handler';
import { UpdateEntityHandler } from '@entity/application/handlers/update-entity.handler';
import { DeleteEntityHandler } from '@entity/application/handlers/delete-entity.handler';
import {
  GetEntityHandler,
  GetEntityByCodeHandler,
  GetEntitiesByProjectHandler,
  GetEntitiesPaginatedHandler,
  GetEntityStatsHandler
} from '@entity/application/handlers/get-entity.handler';
import { EntityPrismaRepository } from '@infra/bounded-contexts/entity/entity-prisma.repository';
import { CommonFieldService } from '@entity/application/services/common-field.service';
import { DatabaseGeneratorService } from '@entity/application/services/database-generator.service';
import { DatabaseMigrationService } from '@entity/application/services/database-migration.service';
import { PrismaSchemaGeneratorService } from '@entity/application/services/prisma-schema-generator.service';
import { EntityFieldValidatorService } from '@entity/application/services/entity-field-validator.service';
import { FieldCreationService } from '@lib/bounded-contexts/field/application/services/field-creation.service';
import { FieldModule } from '@lib/bounded-contexts/field/field.module';
import { PrismaModule } from '@lib/shared/prisma/prisma.module';

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

const Services = [
    CommonFieldService,
    DatabaseGeneratorService,
    DatabaseMigrationService,
    PrismaSchemaGeneratorService,
    EntityFieldValidatorService,
  FieldCreationService,
];

@Module({
  imports: [CqrsModule, FieldModule, PrismaModule],
  providers: [
    ...CommandHandlers,
    ...QueryHandlers,
    ...Services,
    {
      provide: 'EntityRepository',
      useClass: EntityPrismaRepository,
    },
  ],
  exports: [
    ...CommandHandlers,
    ...QueryHandlers,
    ...Services,
    'EntityRepository',
  ],
})
export class EntityModule {}
