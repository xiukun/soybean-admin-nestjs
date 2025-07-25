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
  SaveGenerationConfigHandler,
  CreateConfigTemplateHandler,
  CloneConfigHandler,
  DeleteConfigHandler,
  AnalyzeCodeDiffHandler,
  CheckFileProtectionHandler,
  MergeCodeHandler,
  SuggestConflictResolutionHandler,
} from './application/handlers/code-generation.handlers';

// Join query handlers
import {
  GenerateJoinQueryHandler,
  ValidateJoinQueryConfigHandler,
  SaveJoinQueryConfigHandler,
  DeleteJoinQueryConfigHandler,
  BatchGenerateJoinQueriesHandler,
  OptimizeJoinQueryHandler,
  GenerateJoinQueryTestsHandler,
} from './application/handlers/join-query.handlers';

import {
  GetGenerationConfigHandler,
  GetAvailableTemplatesHandler,
  GetProjectEntitiesHandler,
  GetGenerationPreviewHandler,
  GetGenerationStatusHandler,
  GetGeneratedFilesHandler,
  GetProjectConfigsHandler,
  GetConfigTemplatesHandler,
  LoadConfigHandler,
  ValidateConfigHandler,
  CompareConfigsHandler,
} from './application/handlers/code-generation-query.handlers';

// Join query query handlers
import {
  GetJoinQueryConfigsHandler,
  GetJoinQueryConfigByIdHandler,
  GetProjectJoinQueryConfigsHandler,
  GetEntityJoinQueryConfigsHandler,
  ValidateJoinQueryConfigQueryHandler,
  PreviewJoinQueryHandler,
  GetJoinQuerySQLHandler,
  GetJoinQueryTypesHandler,
  GetJoinQueryAPIHandler,
  GetJoinQueryDocumentationHandler,
  GetJoinQueryStatsHandler,
} from './application/handlers/join-query-query.handlers';

// Existing services
import { IntelligentCodeGeneratorService } from './application/services/intelligent-code-generator.service';
import { AmisBackendManagerService } from './application/services/amis-backend-manager.service';
import { FieldTypeMapperService } from './application/services/field-type-mapper.service';
import { PrismaTypeMapperService } from './application/services/prisma-type-mapper.service';
import { TemplateValidationService } from './application/services/template-validation.service';
import { TemplateEngineService } from './infrastructure/template-engine.service';
import { MetadataAggregatorService } from '../metadata/application/services/metadata-aggregator.service';

// New dual-layer services
import { DualLayerGeneratorService } from './application/services/dual-layer-generator.service';
import { BizCodeProtectionService } from './application/services/biz-code-protection.service';
import { CodeDiffAnalyzerService } from './application/services/code-diff-analyzer.service';
import { GenerationConfigManagerService } from './application/services/generation-config-manager.service';
import { JoinQueryGeneratorService } from './application/services/join-query-generator.service';

const CommandHandlers = [
  GenerateCodeHandler,
  DualLayerGenerateCodeHandler,
  ValidateGenerationConfigHandler,
  PreviewGenerationHandler,
  CleanupGeneratedFilesHandler,
  SaveGenerationConfigHandler,
  CreateConfigTemplateHandler,
  CloneConfigHandler,
  DeleteConfigHandler,
  AnalyzeCodeDiffHandler,
  CheckFileProtectionHandler,
  MergeCodeHandler,
  SuggestConflictResolutionHandler,
  GenerateJoinQueryHandler,
  ValidateJoinQueryConfigHandler,
  SaveJoinQueryConfigHandler,
  DeleteJoinQueryConfigHandler,
  BatchGenerateJoinQueriesHandler,
  OptimizeJoinQueryHandler,
  GenerateJoinQueryTestsHandler,
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
  GetProjectConfigsHandler,
  GetConfigTemplatesHandler,
  LoadConfigHandler,
  ValidateConfigHandler,
  CompareConfigsHandler,
  GetJoinQueryConfigsHandler,
  GetJoinQueryConfigByIdHandler,
  GetProjectJoinQueryConfigsHandler,
  GetEntityJoinQueryConfigsHandler,
  ValidateJoinQueryConfigQueryHandler,
  PreviewJoinQueryHandler,
  GetJoinQuerySQLHandler,
  GetJoinQueryTypesHandler,
  GetJoinQueryAPIHandler,
  GetJoinQueryDocumentationHandler,
  GetJoinQueryStatsHandler,
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
  BizCodeProtectionService,
  CodeDiffAnalyzerService,
  GenerationConfigManagerService,
  JoinQueryGeneratorService,
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
