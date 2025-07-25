/*
 * @Description: 代码生成命令处理器
 * @Autor: henry.xiukun
 * @Date: 2025-07-25 22:30:00
 * @LastEditors: henry.xiukun
 */

import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@lib/shared/prisma/prisma.service';
import { DualLayerGeneratorService } from '../services/dual-layer-generator.service';
import { GenerationConfigManagerService } from '../services/generation-config-manager.service';
import { BizCodeProtectionService } from '../services/biz-code-protection.service';
import { CodeDiffAnalyzerService } from '../services/code-diff-analyzer.service';
import {
  GenerateCodeCommand,
  ValidateGenerationConfigCommand,
  PreviewGenerationCommand,
  CleanupGeneratedFilesCommand,
  SaveGenerationConfigCommand,
  CreateConfigTemplateCommand,
  CloneConfigCommand,
  DeleteConfigCommand,
  AnalyzeCodeDiffCommand,
  CheckFileProtectionCommand,
  MergeCodeCommand,
  SuggestConflictResolutionCommand,
} from '../commands/code-generation.commands';
import * as fs from 'fs-extra';
import * as path from 'path';

@Injectable()
@CommandHandler(GenerateCodeCommand)
export class GenerateCodeHandler implements ICommandHandler<GenerateCodeCommand> {
  private readonly logger = new Logger(GenerateCodeHandler.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly generatorService: DualLayerGeneratorService,
  ) {}

  async execute(command: GenerateCodeCommand) {
    const { config, userId } = command;

    this.logger.log(`开始执行代码生成，项目ID: ${config.projectId}`);

    try {
      // 1. 验证配置
      const validation = await this.validateConfig(config);
      if (!validation.isValid) {
        return {
          success: false,
          errors: validation.errors,
          taskId: null,
        };
      }

      // 2. 创建生成任务记录
      const task = await this.createGenerationTask(config, userId);

      // 3. 执行代码生成
      const result = await this.generatorService.generateCode(config);

      // 4. 更新任务状态
      await this.updateGenerationTask(task.id, result);

      // 5. 记录生成历史
      await this.recordGenerationHistory(config, result, userId);

      return {
        success: result.success,
        taskId: task.id,
        result: result,
      };

    } catch (error) {
      this.logger.error('代码生成失败', error);
      return {
        success: false,
        errors: [error.message],
        taskId: null,
      };
    }
  }

  private async validateConfig(config: any) {
    const errors: string[] = [];

    // 验证项目是否存在
    const project = await (this.prisma as any).lowcodeProject.findUnique({
      where: { id: config.projectId },
    });
    if (!project) {
      errors.push('项目不存在');
    }

    // 验证实体是否存在
    if (config.entityIds.length === 0) {
      errors.push('至少需要选择一个实体');
    }

    // 验证模板是否存在
    if (config.templateIds.length === 0) {
      errors.push('至少需要选择一个模板');
    }

    // 验证输出路径
    if (!config.outputPath) {
      errors.push('输出路径不能为空');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  private async createGenerationTask(config: any, userId?: string) {
    return (this.prisma as any).codeGenerationTask.create({
      data: {
        projectId: config.projectId,
        config: JSON.stringify(config),
        status: 'RUNNING',
        createdBy: userId,
        startedAt: new Date(),
      },
    });
  }

  private async updateGenerationTask(taskId: string, result: any) {
    return (this.prisma as any).codeGenerationTask.update({
      where: { id: taskId },
      data: {
        status: result.success ? 'COMPLETED' : 'FAILED',
        result: JSON.stringify(result),
        completedAt: new Date(),
      },
    });
  }

  private async recordGenerationHistory(config: any, result: any, userId?: string) {
    return (this.prisma as any).codeGenerationHistory.create({
      data: {
        projectId: config.projectId,
        entityIds: config.entityIds,
        templateIds: config.templateIds,
        config: JSON.stringify(config),
        result: JSON.stringify(result),
        success: result.success,
        generatedBy: userId,
        generatedAt: new Date(),
      },
    });
  }
}

@Injectable()
@CommandHandler(ValidateGenerationConfigCommand)
export class ValidateGenerationConfigHandler implements ICommandHandler<ValidateGenerationConfigCommand> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(command: ValidateGenerationConfigCommand) {
    const { config } = command;
    const errors: string[] = [];
    const warnings: string[] = [];

    // 验证项目
    const project = await (this.prisma as any).lowcodeProject.findUnique({
      where: { id: config.projectId },
    });
    if (!project) {
      errors.push('项目不存在');
    }

    // 验证实体
    const entities = await (this.prisma as any).lowcodeEntity.findMany({
      where: { id: { in: config.entityIds } },
    });
    if (entities.length !== config.entityIds.length) {
      warnings.push('部分实体不存在或已被删除');
    }

    // 验证模板
    const templates = await (this.prisma as any).codeTemplate.findMany({
      where: { id: { in: config.templateIds } },
    });
    if (templates.length !== config.templateIds.length) {
      warnings.push('部分模板不存在或已被删除');
    }

    // 验证输出路径
    if (config.outputPath) {
      try {
        await fs.ensureDir(config.outputPath);
      } catch (error) {
        errors.push(`无法创建输出目录: ${error.message}`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      suggestions: this.generateSuggestions(config, entities, templates),
    };
  }

  private generateSuggestions(config: any, entities: any[], templates: any[]): string[] {
    const suggestions: string[] = [];

    // 检查模板和实体的兼容性
    const controllerTemplates = templates.filter(t => t.category === 'CONTROLLER');
    const serviceTemplates = templates.filter(t => t.category === 'SERVICE');

    if (controllerTemplates.length > 0 && serviceTemplates.length === 0) {
      suggestions.push('建议同时选择Service模板以生成完整的业务逻辑');
    }

    if (entities.length > 10) {
      suggestions.push('实体数量较多，建议分批生成以提高性能');
    }

    if (!config.baseConfig.generateTests) {
      suggestions.push('建议启用测试代码生成以提高代码质量');
    }

    return suggestions;
  }
}

@Injectable()
@CommandHandler(PreviewGenerationCommand)
export class PreviewGenerationHandler implements ICommandHandler<PreviewGenerationCommand> {
  constructor(
    private readonly prisma: PrismaService,
    private readonly generatorService: DualLayerGeneratorService,
  ) {}

  async execute(command: PreviewGenerationCommand) {
    const { config, entityId, templateId } = command;

    try {
      // 获取实体和模板
      const entity = await (this.prisma as any).lowcodeEntity.findUnique({
        where: { id: entityId },
        include: { fields: true, relations: true },
      });

      const template = await (this.prisma as any).codeTemplate.findUnique({
        where: { id: templateId },
      });

      if (!entity || !template) {
        return {
          success: false,
          error: '实体或模板不存在',
        };
      }

      // 获取项目信息
      const project = await (this.prisma as any).lowcodeProject.findUnique({
        where: { id: config.projectId },
      });

      // 生成预览（不写入文件）
      const preview = await this.generatePreview(entity, template, project, config);

      return {
        success: true,
        preview,
      };

    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  private async generatePreview(entity: any, template: any, project: any, config: any) {
    // 这里可以复用DualLayerGeneratorService的逻辑，但不写入文件
    const variables = {
      entity: {
        ...entity,
        hasAuth: config.baseConfig.generateAuth,
        hasValidation: config.baseConfig.generateValidation,
        hasSwagger: config.baseConfig.generateSwagger,
      },
      project,
      config: config.baseConfig,
    };

    return {
      baseContent: '// Base layer preview content',
      bizContent: '// Biz layer preview content',
      variables,
    };
  }
}

@Injectable()
@CommandHandler(CleanupGeneratedFilesCommand)
export class CleanupGeneratedFilesHandler implements ICommandHandler<CleanupGeneratedFilesCommand> {
  private readonly logger = new Logger(CleanupGeneratedFilesHandler.name);

  async execute(command: CleanupGeneratedFilesCommand) {
    const { outputPath, preserveBizFiles } = command;

    try {
      const basePath = path.join(outputPath, 'base');
      const bizPath = path.join(outputPath, 'biz');

      // 清理Base文件（总是清理）
      if (await fs.pathExists(basePath)) {
        await fs.remove(basePath);
        this.logger.log(`已清理Base文件目录: ${basePath}`);
      }

      // 根据配置决定是否清理Biz文件
      if (!preserveBizFiles && await fs.pathExists(bizPath)) {
        await fs.remove(bizPath);
        this.logger.log(`已清理Biz文件目录: ${bizPath}`);
      }

      return {
        success: true,
        message: '文件清理完成',
      };

    } catch (error) {
      this.logger.error('文件清理失败', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }
}

// ==================== 配置管理命令处理器 ====================

@Injectable()
@CommandHandler(SaveGenerationConfigCommand)
export class SaveGenerationConfigHandler implements ICommandHandler<SaveGenerationConfigCommand> {
  constructor(private readonly configManager: GenerationConfigManagerService) {}

  async execute(command: SaveGenerationConfigCommand) {
    const { projectId, config, name, description, userId } = command;

    return await this.configManager.saveConfig(
      projectId,
      config,
      name,
      description,
      userId,
    );
  }
}

@Injectable()
@CommandHandler(CreateConfigTemplateCommand)
export class CreateConfigTemplateHandler implements ICommandHandler<CreateConfigTemplateCommand> {
  constructor(private readonly configManager: GenerationConfigManagerService) {}

  async execute(command: CreateConfigTemplateCommand) {
    const {
      name,
      description,
      category,
      framework,
      language,
      config,
      isPublic,
      userId,
    } = command;

    return await this.configManager.createConfigTemplate(
      name,
      description,
      category,
      framework,
      language,
      config,
      isPublic,
      userId,
    );
  }
}

@Injectable()
@CommandHandler(CloneConfigCommand)
export class CloneConfigHandler implements ICommandHandler<CloneConfigCommand> {
  constructor(private readonly configManager: GenerationConfigManagerService) {}

  async execute(command: CloneConfigCommand) {
    const { configId, newName, newDescription, userId } = command;

    return await this.configManager.cloneConfig(
      configId,
      newName,
      newDescription,
      userId,
    );
  }
}

@Injectable()
@CommandHandler(DeleteConfigCommand)
export class DeleteConfigHandler implements ICommandHandler<DeleteConfigCommand> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(command: DeleteConfigCommand) {
    const { configId, userId } = command;

    try {
      await (this.prisma as any).codeGenerationConfig.delete({
        where: { id: configId },
      });

      return {
        success: true,
        message: '配置删除成功',
      };

    } catch (error) {
      return {
        success: false,
        message: `配置删除失败: ${error.message}`,
      };
    }
  }
}

// ==================== 代码保护和差异分析命令处理器 ====================

@Injectable()
@CommandHandler(AnalyzeCodeDiffCommand)
export class AnalyzeCodeDiffHandler implements ICommandHandler<AnalyzeCodeDiffCommand> {
  constructor(private readonly codeDiffAnalyzerService: CodeDiffAnalyzerService) {}

  async execute(command: AnalyzeCodeDiffCommand) {
    const { baseContent, bizContent } = command;

    const result = this.codeDiffAnalyzerService.analyzeDiff(baseContent, bizContent);
    const significantChanges = this.codeDiffAnalyzerService.detectSignificantChanges(result.diffs);
    const recommendations = this.codeDiffAnalyzerService.generateMergeRecommendations(result);

    return {
      analysis: result,
      significantChanges,
      recommendations,
    };
  }
}

@Injectable()
@CommandHandler(CheckFileProtectionCommand)
export class CheckFileProtectionHandler implements ICommandHandler<CheckFileProtectionCommand> {
  constructor(private readonly bizCodeProtectionService: BizCodeProtectionService) {}

  async execute(command: CheckFileProtectionCommand) {
    const { filePath, config } = command;

    const shouldProtect = await this.bizCodeProtectionService.shouldProtectBizFile(
      filePath,
      {
        preserveCustomCode: config?.preserveCustomCode ?? true,
        enableSmartMerge: config?.enableSmartMerge ?? true,
        backupBeforeOverwrite: config?.backupBeforeOverwrite ?? true,
        customCodeMarkers: {
          start: '// CUSTOM_CODE_START',
          end: '// CUSTOM_CODE_END',
        },
        protectedSections: ['constructor', 'custom methods'],
      },
    );

    return {
      shouldProtect,
      filePath,
    };
  }
}

@Injectable()
@CommandHandler(MergeCodeCommand)
export class MergeCodeHandler implements ICommandHandler<MergeCodeCommand> {
  constructor(private readonly bizCodeProtectionService: BizCodeProtectionService) {}

  async execute(command: MergeCodeCommand) {
    const { baseContent, bizFilePath, config } = command;

    const result = await this.bizCodeProtectionService.mergeCode(
      baseContent,
      bizFilePath,
      {
        preserveCustomCode: config?.preserveCustomCode ?? true,
        enableSmartMerge: config?.enableSmartMerge ?? true,
        backupBeforeOverwrite: config?.backupBeforeOverwrite ?? true,
        customCodeMarkers: {
          start: '// CUSTOM_CODE_START',
          end: '// CUSTOM_CODE_END',
        },
        protectedSections: ['constructor', 'custom methods'],
      },
    );

    return result;
  }
}

@Injectable()
@CommandHandler(SuggestConflictResolutionCommand)
export class SuggestConflictResolutionHandler implements ICommandHandler<SuggestConflictResolutionCommand> {
  constructor(private readonly codeDiffAnalyzerService: CodeDiffAnalyzerService) {}

  async execute(command: SuggestConflictResolutionCommand) {
    const { baseContent, bizContent, conflictType } = command;

    const resolution = this.codeDiffAnalyzerService.suggestConflictResolution(
      baseContent,
      bizContent,
      conflictType,
    );

    return resolution;
  }
}
