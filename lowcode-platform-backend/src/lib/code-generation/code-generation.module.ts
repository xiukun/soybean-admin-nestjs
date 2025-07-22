import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { CodeGenerationService } from './services/code-generation.service';
import { HotUpdateService } from './services/hot-update.service';
import { TargetProjectService } from './services/target-project.service';
import { GitIntegrationService } from './services/git-integration.service';
import { PrismaModule } from '@prisma/prisma.module';

/**
 * Code Generation Module
 * 
 * This module provides code generation capabilities for the low-code platform.
 * It includes services for:
 * - Code generation from entity definitions
 * - Hot updates and file watching
 * - Template management and caching
 */
@Module({
  imports: [
    PrismaModule,
    EventEmitterModule,
  ],
  providers: [
    CodeGenerationService,
    HotUpdateService,
    TargetProjectService,
    GitIntegrationService,
  ],
  exports: [
    CodeGenerationService,
    HotUpdateService,
    TargetProjectService,
    GitIntegrationService,
  ],
})
export class CodeGenerationModule {}
