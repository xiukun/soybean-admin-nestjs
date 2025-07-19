import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { PrismaModule } from '@prisma/prisma.module';

// Commands and Handlers
import { CreateFieldHandler } from '@field/application/handlers/create-field.handler';
import { UpdateFieldHandler } from '@field/application/handlers/update-field.handler';
import { DeleteFieldHandler } from '@field/application/handlers/delete-field.handler';
import { MoveFieldHandler } from '@field/application/handlers/move-field.handler';
import { GetFieldHandler, GetFieldsByEntityHandler, GetFieldsPaginatedHandler } from '@field/application/handlers/get-field.handler';

// Repository
import { FieldPrismaRepository } from '@infra/bounded-contexts/field/field-prisma.repository';

const CommandHandlers = [
  CreateFieldHandler,
  UpdateFieldHandler,
  DeleteFieldHandler,
  MoveFieldHandler,
];

const QueryHandlers = [
  GetFieldHandler,
  GetFieldsByEntityHandler,
  GetFieldsPaginatedHandler,
];

@Module({
  imports: [CqrsModule, PrismaModule],
  providers: [
    ...CommandHandlers,
    ...QueryHandlers,
    {
      provide: 'FieldRepository',
      useClass: FieldPrismaRepository,
    },
  ],
  exports: [
    'FieldRepository',
  ],
})
export class FieldModule {}
