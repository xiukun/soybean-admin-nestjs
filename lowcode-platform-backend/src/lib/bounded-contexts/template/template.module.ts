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
import {
  PreviewTemplateHandler,
  ValidateTemplateHandler,
  TestTemplateHandler,
} from './application/handlers/template-preview.handler';

// Command Handlers
import {
  CreateTemplateHandler,
  UpdateTemplateHandler,
  DeleteTemplateHandler,
  CreateTemplateVersionHandler,
  RestoreTemplateVersionHandler,
} from './application/handlers/template.handlers';

// Services
import { TemplatePreviewService } from './application/services/template-preview.service';

const QueryHandlers = [
  GetTemplatesHandler,
  GetTemplateByIdHandler,
  GetTemplateByCodeHandler,
  GetTemplateVersionsHandler,
  PreviewTemplateHandler,
  ValidateTemplateHandler,
  TestTemplateHandler,
];

const CommandHandlers = [
  CreateTemplateHandler,
  UpdateTemplateHandler,
  DeleteTemplateHandler,
  CreateTemplateVersionHandler,
  RestoreTemplateVersionHandler,
];

const Services = [
  TemplatePreviewService,
];

@Module({
  imports: [CqrsModule, PrismaModule],
  providers: [...QueryHandlers, ...CommandHandlers, ...Services],
  exports: [...QueryHandlers, ...CommandHandlers, ...Services],
})
export class TemplateModule {}
