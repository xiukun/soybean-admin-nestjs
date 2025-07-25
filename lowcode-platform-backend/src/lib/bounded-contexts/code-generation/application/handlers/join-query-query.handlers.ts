/*
 * @Description: 关联查询生成查询处理器
 * @Autor: henry.xiukun
 * @Date: 2025-07-26 00:45:00
 * @LastEditors: henry.xiukun
 */

import { Injectable, Logger } from '@nestjs/common';
import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import {
  GetJoinQueryConfigsQuery,
  GetJoinQueryConfigByIdQuery,
  GetProjectJoinQueryConfigsQuery,
  GetEntityJoinQueryConfigsQuery,
  ValidateJoinQueryConfigQuery,
  PreviewJoinQueryQuery,
  GetJoinQuerySQLQuery,
  GetJoinQueryTypesQuery,
  GetJoinQueryAPIQuery,
  GetJoinQueryDocumentationQuery,
  GetJoinQueryStatsQuery,
  SearchJoinQueryConfigsQuery,
  GetJoinQueryTemplatesQuery,
  GetJoinQueryPerformanceQuery,
  GetJoinQueryDependenciesQuery,
  GetJoinQueryConflictsQuery,
} from '../queries/join-query.queries';
import { JoinQueryGeneratorService } from '../services/join-query-generator.service';
import { PrismaService } from '@lib/shared/prisma/prisma.service';

@Injectable()
@QueryHandler(GetJoinQueryConfigsQuery)
export class GetJoinQueryConfigsHandler implements IQueryHandler<GetJoinQueryConfigsQuery> {
  private readonly logger = new Logger(GetJoinQueryConfigsHandler.name);

  constructor(private readonly prisma: PrismaService) {}

  async execute(query: GetJoinQueryConfigsQuery) {
    this.logger.log('获取关联查询配置列表');

    try {
      const { filter, options } = query;
      
      const where: any = {
        type: { in: ['join-query', 'join-query-config'] },
      };
      
      if (filter.projectId) {
        where.projectId = filter.projectId;
      }
      
      if (filter.name) {
        where.name = { contains: filter.name, mode: 'insensitive' };
      }
      
      if (filter.status) {
        where.status = filter.status;
      }
      
      if (filter.search) {
        where.OR = [
          { name: { contains: filter.search, mode: 'insensitive' } },
        ];
      }

      const {
        page = 1,
        size = 10,
        sortBy = 'createdAt',
        sortOrder = 'desc',
      } = options;

      const skip = (page - 1) * size;

      const [configs, total] = await Promise.all([
        this.prisma.codegenTask.findMany({
          where,
          skip,
          take: size,
          orderBy: { [sortBy]: sortOrder },
        }),
        this.prisma.codegenTask.count({ where }),
      ]);

      return {
        configs,
        total,
        page,
        size,
      };

    } catch (error) {
      this.logger.error(`获取关联查询配置列表失败: ${error.message}`);
      throw error;
    }
  }
}

@Injectable()
@QueryHandler(GetJoinQueryConfigByIdQuery)
export class GetJoinQueryConfigByIdHandler implements IQueryHandler<GetJoinQueryConfigByIdQuery> {
  private readonly logger = new Logger(GetJoinQueryConfigByIdHandler.name);

  constructor(private readonly prisma: PrismaService) {}

  async execute(query: GetJoinQueryConfigByIdQuery) {
    this.logger.log(`获取关联查询配置详情: ${query.configId}`);

    try {
      const config = await this.prisma.codegenTask.findUnique({
        where: { id: query.configId },
      });

      return config;

    } catch (error) {
      this.logger.error(`获取关联查询配置详情失败: ${error.message}`);
      throw error;
    }
  }
}

@Injectable()
@QueryHandler(GetProjectJoinQueryConfigsQuery)
export class GetProjectJoinQueryConfigsHandler implements IQueryHandler<GetProjectJoinQueryConfigsQuery> {
  private readonly logger = new Logger(GetProjectJoinQueryConfigsHandler.name);

  constructor(private readonly prisma: PrismaService) {}

  async execute(query: GetProjectJoinQueryConfigsQuery) {
    this.logger.log(`获取项目关联查询配置: ${query.projectId}`);

    try {
      const {
        page = 1,
        size = 10,
        sortBy = 'createdAt',
        sortOrder = 'desc',
      } = query.options;

      const skip = (page - 1) * size;

      const [configs, total] = await Promise.all([
        this.prisma.codegenTask.findMany({
          where: {
            projectId: query.projectId,
            type: { in: ['join-query', 'join-query-config'] },
          },
          skip,
          take: size,
          orderBy: { [sortBy]: sortOrder },
        }),
        this.prisma.codegenTask.count({
          where: {
            projectId: query.projectId,
            type: { in: ['join-query', 'join-query-config'] },
          },
        }),
      ]);

      return {
        configs,
        total,
        page,
        size,
      };

    } catch (error) {
      this.logger.error(`获取项目关联查询配置失败: ${error.message}`);
      throw error;
    }
  }
}

@Injectable()
@QueryHandler(GetEntityJoinQueryConfigsQuery)
export class GetEntityJoinQueryConfigsHandler implements IQueryHandler<GetEntityJoinQueryConfigsQuery> {
  private readonly logger = new Logger(GetEntityJoinQueryConfigsHandler.name);

  constructor(private readonly prisma: PrismaService) {}

  async execute(query: GetEntityJoinQueryConfigsQuery) {
    this.logger.log(`获取实体关联查询配置: ${query.entityId}`);

    try {
      const {
        page = 1,
        size = 10,
        sortBy = 'createdAt',
        sortOrder = 'desc',
      } = query.options;

      const skip = (page - 1) * size;

      // 查找包含指定实体的关联查询配置
      const [configs, total] = await Promise.all([
        this.prisma.codegenTask.findMany({
          where: {
            type: { in: ['join-query', 'join-query-config'] },
            // 这里需要根据config字段中的mainEntityId进行过滤
            // 由于Prisma的JSON查询限制，这里简化处理
          },
          skip,
          take: size,
          orderBy: { [sortBy]: sortOrder },
        }),
        this.prisma.codegenTask.count({
          where: {
            type: { in: ['join-query', 'join-query-config'] },
          },
        }),
      ]);

      // 在应用层过滤包含指定实体的配置
      const filteredConfigs = configs.filter(config => {
        const configData = config.config as any;
        return configData?.mainEntityId === query.entityId;
      });

      return {
        configs: filteredConfigs,
        total: filteredConfigs.length,
        page,
        size,
      };

    } catch (error) {
      this.logger.error(`获取实体关联查询配置失败: ${error.message}`);
      throw error;
    }
  }
}

@Injectable()
@QueryHandler(ValidateJoinQueryConfigQuery)
export class ValidateJoinQueryConfigQueryHandler implements IQueryHandler<ValidateJoinQueryConfigQuery> {
  private readonly logger = new Logger(ValidateJoinQueryConfigQueryHandler.name);

  constructor(private readonly joinQueryGenerator: JoinQueryGeneratorService) {}

  async execute(query: ValidateJoinQueryConfigQuery) {
    this.logger.log(`验证关联查询配置: 项目 ${query.projectId}`);

    try {
      // 这里可以添加配置验证逻辑
      return {
        isValid: true,
        errors: [],
        warnings: [],
        suggestions: [],
      };

    } catch (error) {
      this.logger.error(`验证关联查询配置失败: ${error.message}`);
      throw error;
    }
  }
}

@Injectable()
@QueryHandler(PreviewJoinQueryQuery)
export class PreviewJoinQueryHandler implements IQueryHandler<PreviewJoinQueryQuery> {
  private readonly logger = new Logger(PreviewJoinQueryHandler.name);

  constructor(private readonly joinQueryGenerator: JoinQueryGeneratorService) {}

  async execute(query: PreviewJoinQueryQuery) {
    this.logger.log(`预览关联查询: 项目 ${query.projectId}`);

    try {
      const generated = await this.joinQueryGenerator.generateJoinQuery(query.config);

      return {
        sql: generated.sql,
        prismaQuery: generated.prismaQuery,
        typeDefinition: generated.typeDefinition,
        apiInterface: generated.apiInterface,
      };

    } catch (error) {
      this.logger.error(`预览关联查询失败: ${error.message}`);
      throw error;
    }
  }
}

@Injectable()
@QueryHandler(GetJoinQuerySQLQuery)
export class GetJoinQuerySQLHandler implements IQueryHandler<GetJoinQuerySQLQuery> {
  private readonly logger = new Logger(GetJoinQuerySQLHandler.name);

  constructor(private readonly prisma: PrismaService) {}

  async execute(query: GetJoinQuerySQLQuery) {
    this.logger.log(`获取关联查询SQL: ${query.configId}`);

    try {
      const config = await this.prisma.codegenTask.findUnique({
        where: { id: query.configId },
      });

      if (!config) {
        throw new Error('配置不存在');
      }

      const configData = config.config as any;
      const sql = configData?.generated?.sql || '';

      return { sql };

    } catch (error) {
      this.logger.error(`获取关联查询SQL失败: ${error.message}`);
      throw error;
    }
  }
}

@Injectable()
@QueryHandler(GetJoinQueryTypesQuery)
export class GetJoinQueryTypesHandler implements IQueryHandler<GetJoinQueryTypesQuery> {
  private readonly logger = new Logger(GetJoinQueryTypesHandler.name);

  constructor(private readonly prisma: PrismaService) {}

  async execute(query: GetJoinQueryTypesQuery) {
    this.logger.log(`获取关联查询类型定义: ${query.configId}`);

    try {
      const config = await this.prisma.codegenTask.findUnique({
        where: { id: query.configId },
      });

      if (!config) {
        throw new Error('配置不存在');
      }

      const configData = config.config as any;
      const typeDefinition = configData?.generated?.typeDefinition || '';

      return { typeDefinition };

    } catch (error) {
      this.logger.error(`获取关联查询类型定义失败: ${error.message}`);
      throw error;
    }
  }
}

@Injectable()
@QueryHandler(GetJoinQueryAPIQuery)
export class GetJoinQueryAPIHandler implements IQueryHandler<GetJoinQueryAPIQuery> {
  private readonly logger = new Logger(GetJoinQueryAPIHandler.name);

  constructor(private readonly prisma: PrismaService) {}

  async execute(query: GetJoinQueryAPIQuery) {
    this.logger.log(`获取关联查询API接口: ${query.configId}`);

    try {
      const config = await this.prisma.codegenTask.findUnique({
        where: { id: query.configId },
      });

      if (!config) {
        throw new Error('配置不存在');
      }

      const configData = config.config as any;
      const apiInterface = configData?.generated?.apiInterface || '';

      return { apiInterface };

    } catch (error) {
      this.logger.error(`获取关联查询API接口失败: ${error.message}`);
      throw error;
    }
  }
}

@Injectable()
@QueryHandler(GetJoinQueryDocumentationQuery)
export class GetJoinQueryDocumentationHandler implements IQueryHandler<GetJoinQueryDocumentationQuery> {
  private readonly logger = new Logger(GetJoinQueryDocumentationHandler.name);

  constructor(private readonly prisma: PrismaService) {}

  async execute(query: GetJoinQueryDocumentationQuery) {
    this.logger.log(`获取关联查询文档: ${query.configId}`);

    try {
      const config = await this.prisma.codegenTask.findUnique({
        where: { id: query.configId },
      });

      if (!config) {
        throw new Error('配置不存在');
      }

      const configData = config.config as any;
      const documentation = configData?.generated?.documentation || '';

      return { documentation };

    } catch (error) {
      this.logger.error(`获取关联查询文档失败: ${error.message}`);
      throw error;
    }
  }
}

@Injectable()
@QueryHandler(GetJoinQueryStatsQuery)
export class GetJoinQueryStatsHandler implements IQueryHandler<GetJoinQueryStatsQuery> {
  private readonly logger = new Logger(GetJoinQueryStatsHandler.name);

  constructor(private readonly prisma: PrismaService) {}

  async execute(query: GetJoinQueryStatsQuery) {
    this.logger.log(`获取关联查询统计: ${query.projectId}`);

    try {
      const [totalConfigs, completedConfigs, draftConfigs] = await Promise.all([
        this.prisma.codegenTask.count({
          where: {
            projectId: query.projectId,
            type: { in: ['join-query', 'join-query-config'] },
          },
        }),
        this.prisma.codegenTask.count({
          where: {
            projectId: query.projectId,
            type: { in: ['join-query', 'join-query-config'] },
            status: 'completed',
          },
        }),
        this.prisma.codegenTask.count({
          where: {
            projectId: query.projectId,
            type: { in: ['join-query', 'join-query-config'] },
            status: 'draft',
          },
        }),
      ]);

      return {
        totalConfigs,
        completedConfigs,
        draftConfigs,
        completionRate: totalConfigs > 0 ? (completedConfigs / totalConfigs) * 100 : 0,
      };

    } catch (error) {
      this.logger.error(`获取关联查询统计失败: ${error.message}`);
      throw error;
    }
  }
}
