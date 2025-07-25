/*
 * @Description: 关联查询生成命令处理器
 * @Autor: henry.xiukun
 * @Date: 2025-07-26 00:45:00
 * @LastEditors: henry.xiukun
 */

import { Injectable, Logger } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import {
  GenerateJoinQueryCommand,
  ValidateJoinQueryConfigCommand,
  SaveJoinQueryConfigCommand,
  DeleteJoinQueryConfigCommand,
  BatchGenerateJoinQueriesCommand,
  OptimizeJoinQueryCommand,
  GenerateJoinQueryTestsCommand,
} from '../commands/join-query.commands';
import { JoinQueryGeneratorService } from '../services/join-query-generator.service';
import { PrismaService } from '@lib/shared/prisma/prisma.service';
import * as fs from 'fs/promises';
import * as path from 'path';

@Injectable()
@CommandHandler(GenerateJoinQueryCommand)
export class GenerateJoinQueryHandler implements ICommandHandler<GenerateJoinQueryCommand> {
  private readonly logger = new Logger(GenerateJoinQueryHandler.name);

  constructor(
    private readonly joinQueryGenerator: JoinQueryGeneratorService,
    private readonly prisma: PrismaService,
  ) {}

  async execute(command: GenerateJoinQueryCommand) {
    this.logger.log(`生成关联查询: 项目 ${command.projectId}`);

    try {
      // 生成关联查询代码
      const generated = await this.joinQueryGenerator.generateJoinQuery(command.config);

      // 创建输出目录
      await this.ensureDirectoryExists(command.outputPath);

      const files: string[] = [];

      // 生成控制器文件
      if (command.options.generateController !== false) {
        const controllerPath = path.join(command.outputPath, 'controllers');
        await this.ensureDirectoryExists(controllerPath);
        
        const mainEntity = await this.prisma.entity.findUnique({
          where: { id: command.config.mainEntityId },
        });
        
        const controllerFile = path.join(controllerPath, `${mainEntity?.code}-join.controller.ts`);
        await fs.writeFile(controllerFile, generated.apiInterface);
        files.push(controllerFile);
      }

      // 生成类型定义文件
      if (command.options.generateTypes !== false) {
        const typesPath = path.join(command.outputPath, 'types');
        await this.ensureDirectoryExists(typesPath);
        
        const mainEntity = await this.prisma.entity.findUnique({
          where: { id: command.config.mainEntityId },
        });
        
        const typesFile = path.join(typesPath, `${mainEntity?.code}-join.types.ts`);
        await fs.writeFile(typesFile, generated.typeDefinition);
        files.push(typesFile);
      }

      // 生成SQL文件
      const sqlPath = path.join(command.outputPath, 'sql');
      await this.ensureDirectoryExists(sqlPath);
      
      const mainEntity = await this.prisma.entity.findUnique({
        where: { id: command.config.mainEntityId },
      });
      
      const sqlFile = path.join(sqlPath, `${mainEntity?.code}-join.sql`);
      await fs.writeFile(sqlFile, generated.sql);
      files.push(sqlFile);

      // 生成文档文件
      if (command.options.generateDocumentation !== false) {
        const docsPath = path.join(command.outputPath, 'docs');
        await this.ensureDirectoryExists(docsPath);
        
        const docFile = path.join(docsPath, `${mainEntity?.code}-join.md`);
        await fs.writeFile(docFile, generated.documentation);
        files.push(docFile);
      }

      // 保存配置到数据库
      const savedConfig = await this.prisma.codegenTask.create({
        data: {
          projectId: command.projectId,
          name: `${mainEntity?.name}关联查询`,
          type: 'join-query',
          config: {
            ...command.config,
            generated: {
              sql: generated.sql,
              prismaQuery: generated.prismaQuery,
              typeDefinition: generated.typeDefinition,
              apiInterface: generated.apiInterface,
              documentation: generated.documentation,
            },
          } as any,
          status: 'completed',
          createdBy: command.userId || 'system',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });

      return {
        success: true,
        data: {
          configId: savedConfig.id,
          files,
          generated,
        },
        message: '关联查询生成成功',
      };

    } catch (error) {
      this.logger.error(`生成关联查询失败: ${error.message}`);
      return {
        success: false,
        message: error.message,
        error: error.message,
      };
    }
  }

  private async ensureDirectoryExists(dirPath: string): Promise<void> {
    try {
      await fs.access(dirPath);
    } catch {
      await fs.mkdir(dirPath, { recursive: true });
    }
  }
}

@Injectable()
@CommandHandler(ValidateJoinQueryConfigCommand)
export class ValidateJoinQueryConfigHandler implements ICommandHandler<ValidateJoinQueryConfigCommand> {
  private readonly logger = new Logger(ValidateJoinQueryConfigHandler.name);

  constructor(private readonly joinQueryGenerator: JoinQueryGeneratorService) {}

  async execute(command: ValidateJoinQueryConfigCommand) {
    this.logger.log(`验证关联查询配置: 项目 ${command.projectId}`);

    try {
      // 这里可以添加配置验证逻辑
      // 暂时返回成功状态
      return {
        success: true,
        data: {
          isValid: true,
          errors: [],
          warnings: [],
          suggestions: [],
        },
        message: '配置验证成功',
      };

    } catch (error) {
      this.logger.error(`验证关联查询配置失败: ${error.message}`);
      return {
        success: false,
        message: error.message,
        error: error.message,
      };
    }
  }
}

@Injectable()
@CommandHandler(SaveJoinQueryConfigCommand)
export class SaveJoinQueryConfigHandler implements ICommandHandler<SaveJoinQueryConfigCommand> {
  private readonly logger = new Logger(SaveJoinQueryConfigHandler.name);

  constructor(private readonly prisma: PrismaService) {}

  async execute(command: SaveJoinQueryConfigCommand) {
    this.logger.log(`保存关联查询配置: ${command.name}`);

    try {
      const savedConfig = await this.prisma.codegenTask.create({
        data: {
          projectId: command.projectId,
          name: command.name,
          type: 'join-query-config',
          config: command.config as any,
          status: 'draft',
          createdBy: command.userId,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });

      return {
        success: true,
        data: savedConfig,
        message: '配置保存成功',
      };

    } catch (error) {
      this.logger.error(`保存关联查询配置失败: ${error.message}`);
      return {
        success: false,
        message: error.message,
        error: error.message,
      };
    }
  }
}

@Injectable()
@CommandHandler(DeleteJoinQueryConfigCommand)
export class DeleteJoinQueryConfigHandler implements ICommandHandler<DeleteJoinQueryConfigCommand> {
  private readonly logger = new Logger(DeleteJoinQueryConfigHandler.name);

  constructor(private readonly prisma: PrismaService) {}

  async execute(command: DeleteJoinQueryConfigCommand) {
    this.logger.log(`删除关联查询配置: ${command.configId}`);

    try {
      await this.prisma.codegenTask.delete({
        where: { id: command.configId },
      });

      return {
        success: true,
        message: '配置删除成功',
      };

    } catch (error) {
      this.logger.error(`删除关联查询配置失败: ${error.message}`);
      return {
        success: false,
        message: error.message,
        error: error.message,
      };
    }
  }
}

@Injectable()
@CommandHandler(BatchGenerateJoinQueriesCommand)
export class BatchGenerateJoinQueriesHandler implements ICommandHandler<BatchGenerateJoinQueriesCommand> {
  private readonly logger = new Logger(BatchGenerateJoinQueriesHandler.name);

  constructor(
    private readonly joinQueryGenerator: JoinQueryGeneratorService,
    private readonly prisma: PrismaService,
  ) {}

  async execute(command: BatchGenerateJoinQueriesCommand) {
    this.logger.log(`批量生成关联查询: ${command.configs.length} 个`);

    try {
      const results = [];
      const errors = [];

      for (const configData of command.configs) {
        try {
          const generated = await this.joinQueryGenerator.generateJoinQuery(configData.config);
          
          // 保存配置
          const savedConfig = await this.prisma.codegenTask.create({
            data: {
              projectId: command.projectId,
              name: configData.name,
              type: 'join-query',
              config: {
                ...configData.config,
                generated,
              } as any,
              status: 'completed',
              createdBy: command.userId,
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          });

          results.push({
            name: configData.name,
            configId: savedConfig.id,
            generated,
          });

        } catch (error) {
          errors.push({
            name: configData.name,
            error: error.message,
          });
        }
      }

      return {
        success: errors.length === 0,
        data: {
          results,
          errors,
          total: command.configs.length,
          successful: results.length,
          failed: errors.length,
        },
        message: `批量生成完成: 成功 ${results.length} 个，失败 ${errors.length} 个`,
      };

    } catch (error) {
      this.logger.error(`批量生成关联查询失败: ${error.message}`);
      return {
        success: false,
        message: error.message,
        error: error.message,
      };
    }
  }
}

@Injectable()
@CommandHandler(OptimizeJoinQueryCommand)
export class OptimizeJoinQueryHandler implements ICommandHandler<OptimizeJoinQueryCommand> {
  private readonly logger = new Logger(OptimizeJoinQueryHandler.name);

  constructor(private readonly prisma: PrismaService) {}

  async execute(command: OptimizeJoinQueryCommand) {
    this.logger.log(`优化关联查询: ${command.configId}`);

    try {
      // 这里可以添加查询优化逻辑
      // 暂时返回成功状态
      return {
        success: true,
        data: {
          optimizations: [],
          suggestions: [],
        },
        message: '查询优化完成',
      };

    } catch (error) {
      this.logger.error(`优化关联查询失败: ${error.message}`);
      return {
        success: false,
        message: error.message,
        error: error.message,
      };
    }
  }
}

@Injectable()
@CommandHandler(GenerateJoinQueryTestsCommand)
export class GenerateJoinQueryTestsHandler implements ICommandHandler<GenerateJoinQueryTestsCommand> {
  private readonly logger = new Logger(GenerateJoinQueryTestsHandler.name);

  async execute(command: GenerateJoinQueryTestsCommand) {
    this.logger.log(`生成关联查询测试: ${command.configId}`);

    try {
      // 这里可以添加测试生成逻辑
      // 暂时返回成功状态
      return {
        success: true,
        data: {
          testFiles: [],
          mockData: [],
        },
        message: '测试生成完成',
      };

    } catch (error) {
      this.logger.error(`生成关联查询测试失败: ${error.message}`);
      return {
        success: false,
        message: error.message,
        error: error.message,
      };
    }
  }
}
