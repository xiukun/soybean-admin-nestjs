import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Injectable, Logger } from '@nestjs/common';
import { GenerateCodeCommand } from '../commands/generate-code.command';
import { IntelligentCodeGeneratorService } from '../services/intelligent-code-generator.service';
import { AmisBackendManagerService } from '../services/amis-backend-manager.service';
import { MetadataAggregatorService } from '../../../metadata/application/services/metadata-aggregator.service';

@Injectable()
@CommandHandler(GenerateCodeCommand)
export class GenerateCodeHandler implements ICommandHandler<GenerateCodeCommand> {
  private readonly logger = new Logger(GenerateCodeHandler.name);

  constructor(
    private readonly codeGenerator: IntelligentCodeGeneratorService,
    private readonly amisBackendManager: AmisBackendManagerService,
    private readonly metadataService: MetadataAggregatorService,
  ) {}

  async execute(command: GenerateCodeCommand): Promise<any> {
    const startTime = Date.now();
    const taskId = this.generateTaskId();

    try {
      this.logger.log(`Starting code generation for project: ${command.projectId}`);

      // 1. 获取项目元数据
      const metadata = await this.metadataService.getProjectMetadata(command.projectId);
      this.logger.log(`Retrieved metadata for ${metadata.entities.length} entities`);

      // 2. 生成代码文件
      const generatedFiles = await this.codeGenerator.generateFiles({
        projectId: command.projectId,
        templateIds: command.templateIds,
        entityIds: command.entityIds,
        outputPath: command.outputPath,
        variables: command.variables,
        options: command.options,
      });

      this.logger.log(`Generated ${generatedFiles.length} files`);

      // 3. 写入amis-lowcode-backend
      await this.amisBackendManager.writeGeneratedFiles(generatedFiles);

      // 4. 更新Prisma schema
      await this.amisBackendManager.generatePrismaSchema(metadata);

      // 5. 更新app.module.ts
      await this.amisBackendManager.updateAppModule(metadata.entities);

      // 6. 重启amis-lowcode-backend服务
      await this.amisBackendManager.restartAmisBackend();

      // 7. 获取文件树
      const fileTree = await this.amisBackendManager.getFileTree();

      const duration = Date.now() - startTime;
      this.logger.log(`Code generation completed in ${duration}ms`);

      return {
        success: true,
        taskId,
        filesGenerated: generatedFiles.length,
        outputPath: command.outputPath,
        errors: [],
        warnings: [],
        fileTree,
        metadata: {
          projectId: command.projectId,
          templatesUsed: command.templateIds,
          entitiesProcessed: command.entityIds || [],
          generatedAt: new Date(),
          duration,
        },
      };

    } catch (error) {
      this.logger.error(`Code generation failed: ${error.message}`, error.stack);
      
      return {
        success: false,
        taskId,
        filesGenerated: 0,
        outputPath: command.outputPath,
        errors: [error.message],
        warnings: [],
        fileTree: [],
        metadata: {
          projectId: command.projectId,
          templatesUsed: command.templateIds,
          entitiesProcessed: command.entityIds || [],
          generatedAt: new Date(),
          duration: Date.now() - startTime,
        },
      };
    }
  }

  private generateTaskId(): string {
    return `gen_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
