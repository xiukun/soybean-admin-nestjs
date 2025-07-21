import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { GenerateCodeHandler } from './application/handlers/generate-code.handler';
import { GetGenerationProgressHandler } from './application/handlers/get-generation-progress.handler';
import { IntelligentCodeGeneratorService } from './application/services/intelligent-code-generator.service';
import { AmisBackendManagerService } from './application/services/amis-backend-manager.service';
import { FieldTypeMapperService } from './application/services/field-type-mapper.service';
import { MetadataAggregatorService } from '../metadata/application/services/metadata-aggregator.service';

const CommandHandlers = [
  GenerateCodeHandler,
];

const QueryHandlers = [
  GetGenerationProgressHandler,
];

const Services = [
  IntelligentCodeGeneratorService,
  AmisBackendManagerService,
  FieldTypeMapperService,
  MetadataAggregatorService,
];

@Module({
  imports: [CqrsModule],
  providers: [
    ...CommandHandlers,
    ...QueryHandlers,
    ...Services,
  ],
  exports: [
    ...Services,
  ],
})
export class CodeGenerationModule {}
