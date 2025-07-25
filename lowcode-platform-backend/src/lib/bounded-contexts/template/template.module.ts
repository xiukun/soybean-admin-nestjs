import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { PrismaModule } from '@lib/shared/prisma/prisma.module';
import { TemplateIntegrationService } from './application/services/template-integration.service';
import { EnhancedTemplateEngineService } from './infrastructure/enhanced-template-engine.service';
import { CodeGenerationService } from './application/services/code-generation.service';

@Module({
  imports: [
    CqrsModule,
    PrismaModule,
  ],
  providers: [
    // Services
    TemplateIntegrationService,
    EnhancedTemplateEngineService,
    CodeGenerationService,
  ],
  exports: [
    // Services
    TemplateIntegrationService,
    EnhancedTemplateEngineService,
    CodeGenerationService,
  ],
})
export class TemplateModule {}
