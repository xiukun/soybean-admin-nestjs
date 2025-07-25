import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { PrismaModule } from '@lib/shared/prisma/prisma.module';
import { TemplateModule } from '../template/template.module';

// Existing handlers
import { GenerateCodeHandler } from './application/handlers/generate-code.handler';
import { GetGenerationProgressHandler } from './application/handlers/get-generation-progress.handler';
import { GetTemplatesHandler } from './application/queries/handlers/get-templates.handler';

// New dual-layer handlers
import {
  GenerateCodeHandler as DualLayerGenerateCodeHandler,
  ValidateGenerationConfigHandler,
  PreviewGenerationHandler,
  CleanupGeneratedFilesHandler,
} from './application/handlers/code-generation.handlers';

import {
  GetGenerationConfigHandler,
  GetAvailableTemplatesHandler,
  GetProjectEntitiesHandler,
  GetGenerationPreviewHandler,
  GetGenerationStatusHandler,
  GetGeneratedFilesHandler,
} from './application/handlers/code-generation-query.handlers';

// Existing services
import { IntelligentCodeGeneratorService } from './application/services/intelligent-code-generator.service';
import { AmisBackendManagerService } from './application/services/amis-backend-manager.service';
import { FieldTypeMapperService } from './application/services/field-type-mapper.service';
import { PrismaTypeMapperService } from './application/services/prisma-type-mapper.service';
import { TemplateValidationService } from './application/services/template-validation.service';
import { TemplateEngineService } from './infrastructure/template-engine.service';
import { MetadataAggregatorService } from '../metadata/application/services/metadata-aggregator.service';

// New dual-layer service
import { DualLayerGeneratorService } from './application/services/dual-layer-generator.service';

const CommandHandlers = [
  GenerateCodeHandler,
  DualLayerGenerateCodeHandler,
  ValidateGenerationConfigHandler,
  PreviewGenerationHandler,
  CleanupGeneratedFilesHandler,
];

const QueryHandlers = [
  GetGenerationProgressHandler,
  GetTemplatesHandler,
  GetGenerationConfigHandler,
  GetAvailableTemplatesHandler,
  GetProjectEntitiesHandler,
  GetGenerationPreviewHandler,
  GetGenerationStatusHandler,
  GetGeneratedFilesHandler,
];

const Services = [
  IntelligentCodeGeneratorService,
  AmisBackendManagerService,
  FieldTypeMapperService,
  PrismaTypeMapperService,
  TemplateValidationService,
  TemplateEngineService,
  MetadataAggregatorService,
  DualLayerGeneratorService,
];

@Module({
  imports: [CqrsModule, PrismaModule, TemplateModule],
  providers: [
    ...CommandHandlers,
    ...QueryHandlers,
    ...Services,
  ],
  exports: [
    ...CommandHandlers,
    ...QueryHandlers,
    ...Services,
  ],
})
export class CodeGenerationModule {}
