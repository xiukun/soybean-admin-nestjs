import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { PrismaModule } from '@lib/shared/prisma/prisma.module';

// Query Handlers
import {
  GetTemplatesHandler,
  GetTemplateByIdHandler,
  GetTemplateByCodeHandler,
  GetTemplateVersionsHandler,
} from './application/handlers/get-templates.handler';

// Command Handlers
import {
  CreateTemplateHandler,
  UpdateTemplateHandler,
  DeleteTemplateHandler,
  CreateTemplateVersionHandler,
  RestoreTemplateVersionHandler,
} from './application/handlers/template.handlers';

const QueryHandlers = [
  GetTemplatesHandler,
  GetTemplateByIdHandler,
  GetTemplateByCodeHandler,
  GetTemplateVersionsHandler,
];

const CommandHandlers = [
  CreateTemplateHandler,
  UpdateTemplateHandler,
  DeleteTemplateHandler,
  CreateTemplateVersionHandler,
  RestoreTemplateVersionHandler,
];

@Module({
  imports: [CqrsModule, PrismaModule],
  providers: [...QueryHandlers, ...CommandHandlers],
  exports: [...QueryHandlers, ...CommandHandlers],
})
export class TemplateModule {}
