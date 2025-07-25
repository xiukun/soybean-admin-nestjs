/*
 * @Description: 代码生成查询处理器
 * @Autor: henry.xiukun
 * @Date: 2025-07-25 22:30:00
 * @LastEditors: henry.xiukun
 */

import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '@lib/shared/prisma/prisma.service';
import {
  GetGenerationConfigQuery,
  GetAvailableTemplatesQuery,
  GetProjectEntitiesQuery,
  GetGenerationPreviewQuery,
  GetGenerationStatusQuery,
  GetGeneratedFilesQuery,
} from '../queries/code-generation.queries';
import * as fs from 'fs-extra';
import * as path from 'path';

@Injectable()
@QueryHandler(GetGenerationConfigQuery)
export class GetGenerationConfigHandler implements IQueryHandler<GetGenerationConfigQuery> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(query: GetGenerationConfigQuery) {
    const { projectId } = query;

    // 获取项目信息
    const project = await (this.prisma as any).lowcodeProject.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      throw new Error('项目不存在');
    }

    // 获取项目的默认配置
    const defaultConfig = {
      projectId,
      entityIds: [],
      templateIds: [],
      outputPath: `./generated/${project.code}`,
      baseConfig: {
        generateAuth: true,
        generateValidation: true,
        generateSwagger: true,
        generateTests: false,
        outputFormat: 'typescript' as const,
      },
      bizConfig: {
        allowCustomization: true,
        preserveCustomCode: true,
        generateInterfaces: true,
      },
    };

    // 获取可用的实体
    const entities = await (this.prisma as any).lowcodeEntity.findMany({
      where: { projectId },
      select: {
        id: true,
        name: true,
        code: true,
        description: true,
        status: true,
      },
    });

    // 获取可用的模板
    const templates = await (this.prisma as any).codeTemplate.findMany({
      where: {
        status: 'PUBLISHED',
        OR: [
          { isPublic: true },
          { createdBy: project.createdBy },
        ],
      },
      select: {
        id: true,
        name: true,
        category: true,
        language: true,
        framework: true,
        description: true,
      },
    });

    return {
      project,
      defaultConfig,
      availableEntities: entities,
      availableTemplates: templates,
    };
  }
}

@Injectable()
@QueryHandler(GetAvailableTemplatesQuery)
export class GetAvailableTemplatesHandler implements IQueryHandler<GetAvailableTemplatesQuery> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(query: GetAvailableTemplatesQuery) {
    const { projectId, category, language, framework } = query;

    // 构建查询条件
    const where: any = {
      status: 'PUBLISHED',
      OR: [
        { isPublic: true },
        // TODO: 添加项目所有者检查
      ],
    };

    if (category) {
      where.category = category;
    }

    if (language) {
      where.language = language;
    }

    if (framework) {
      where.framework = framework;
    }

    const templates = await (this.prisma as any).codeTemplate.findMany({
      where,
      select: {
        id: true,
        name: true,
        code: true,
        category: true,
        language: true,
        framework: true,
        description: true,
        variables: true,
        tags: true,
        usageCount: true,
        createdAt: true,
      },
      orderBy: [
        { usageCount: 'desc' },
        { createdAt: 'desc' },
      ],
    });

    // 按分类分组
    const groupedTemplates = templates.reduce((acc, template) => {
      const category = template.category;
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(template);
      return acc;
    }, {} as Record<string, any[]>);

    return {
      templates,
      groupedTemplates,
      total: templates.length,
    };
  }
}

@Injectable()
@QueryHandler(GetProjectEntitiesQuery)
export class GetProjectEntitiesHandler implements IQueryHandler<GetProjectEntitiesQuery> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(query: GetProjectEntitiesQuery) {
    const { projectId, includeFields, includeRelations } = query;

    const include: any = {};
    if (includeFields) {
      include.fields = {
        orderBy: { order: 'asc' },
      };
    }
    if (includeRelations) {
      include.relations = true;
    }

    const entities = await (this.prisma as any).lowcodeEntity.findMany({
      where: { projectId },
      include,
      orderBy: { createdAt: 'asc' },
    });

    // 统计信息
    const stats = {
      totalEntities: entities.length,
      totalFields: entities.reduce((sum, entity) => sum + (entity.fields?.length || 0), 0),
      totalRelations: entities.reduce((sum, entity) => sum + (entity.relations?.length || 0), 0),
      entitiesByCategory: entities.reduce((acc, entity) => {
        const category = entity.category || 'UNKNOWN';
        acc[category] = (acc[category] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
    };

    return {
      entities,
      stats,
    };
  }
}

@Injectable()
@QueryHandler(GetGenerationPreviewQuery)
export class GetGenerationPreviewHandler implements IQueryHandler<GetGenerationPreviewQuery> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(query: GetGenerationPreviewQuery) {
    const { entityId, templateId, variables = {} } = query;

    // 获取实体信息
    const entity = await (this.prisma as any).lowcodeEntity.findUnique({
      where: { id: entityId },
      include: {
        fields: true,
        relations: true,
        project: true,
      },
    });

    if (!entity) {
      throw new Error('实体不存在');
    }

    // 获取模板信息
    const template = await (this.prisma as any).codeTemplate.findUnique({
      where: { id: templateId },
    });

    if (!template) {
      throw new Error('模板不存在');
    }

    // 准备模板变量
    const templateVariables = {
      entity: {
        ...entity,
        ...variables.entity,
      },
      project: entity.project,
      ...variables,
    };

    // 生成预览内容
    const baseFileName = this.getBaseFileName(entity.code, template.category);
    const bizFileName = this.getBizFileName(entity.code, template.category);

    return {
      entity: {
        id: entity.id,
        name: entity.name,
        code: entity.code,
        description: entity.description,
      },
      template: {
        id: template.id,
        name: template.name,
        category: template.category,
        language: template.language,
        framework: template.framework,
      },
      preview: {
        baseFileName,
        bizFileName,
        variables: templateVariables,
        // 实际的预览内容将由前端调用模板预览API生成
      },
    };
  }

  private getBaseFileName(entityCode: string, category: string): string {
    const kebabCase = entityCode.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
    const extensions: Record<string, string> = {
      CONTROLLER: 'controller.ts',
      SERVICE: 'service.ts',
      DTO: 'dto.ts',
      ENTITY: 'entity.ts',
    };
    const ext = extensions[category] || 'ts';
    return `${kebabCase}.base.${ext}`;
  }

  private getBizFileName(entityCode: string, category: string): string {
    const kebabCase = entityCode.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
    const extensions: Record<string, string> = {
      CONTROLLER: 'controller.ts',
      SERVICE: 'service.ts',
      DTO: 'dto.ts',
      ENTITY: 'entity.ts',
    };
    const ext = extensions[category] || 'ts';
    return `${kebabCase}.${ext}`;
  }
}

@Injectable()
@QueryHandler(GetGenerationStatusQuery)
export class GetGenerationStatusHandler implements IQueryHandler<GetGenerationStatusQuery> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(query: GetGenerationStatusQuery) {
    const { taskId } = query;

    const task = await (this.prisma as any).codeGenerationTask.findUnique({
      where: { id: taskId },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
    });

    if (!task) {
      throw new Error('生成任务不存在');
    }

    // 解析配置和结果
    let config = {};
    let result = {};

    try {
      config = JSON.parse(task.config || '{}');
    } catch (error) {
      // 忽略解析错误
    }

    try {
      result = JSON.parse(task.result || '{}');
    } catch (error) {
      // 忽略解析错误
    }

    return {
      task: {
        id: task.id,
        status: task.status,
        startedAt: task.startedAt,
        completedAt: task.completedAt,
        createdBy: task.createdBy,
      },
      project: task.project,
      config,
      result,
    };
  }
}

@Injectable()
@QueryHandler(GetGeneratedFilesQuery)
export class GetGeneratedFilesHandler implements IQueryHandler<GetGeneratedFilesQuery> {
  async execute(query: GetGeneratedFilesQuery) {
    const { outputPath, type = 'all' } = query;

    const files: any[] = [];

    try {
      // 扫描Base文件
      if (type === 'all' || type === 'base') {
        const basePath = path.join(outputPath, 'base');
        if (await fs.pathExists(basePath)) {
          const baseFiles = await this.scanDirectory(basePath, 'base');
          files.push(...baseFiles);
        }
      }

      // 扫描Biz文件
      if (type === 'all' || type === 'biz') {
        const bizPath = path.join(outputPath, 'biz');
        if (await fs.pathExists(bizPath)) {
          const bizFiles = await this.scanDirectory(bizPath, 'biz');
          files.push(...bizFiles);
        }
      }

      return {
        files,
        summary: {
          totalFiles: files.length,
          baseFiles: files.filter(f => f.type === 'base').length,
          bizFiles: files.filter(f => f.type === 'biz').length,
        },
      };

    } catch (error) {
      return {
        files: [],
        summary: {
          totalFiles: 0,
          baseFiles: 0,
          bizFiles: 0,
        },
        error: error.message,
      };
    }
  }

  private async scanDirectory(dirPath: string, type: 'base' | 'biz'): Promise<any[]> {
    const files: any[] = [];
    const items = await fs.readdir(dirPath);

    for (const item of items) {
      const itemPath = path.join(dirPath, item);
      const stat = await fs.stat(itemPath);

      if (stat.isFile()) {
        files.push({
          name: item,
          path: itemPath,
          type,
          size: stat.size,
          modifiedAt: stat.mtime,
          extension: path.extname(item),
        });
      }
    }

    return files;
  }
}
