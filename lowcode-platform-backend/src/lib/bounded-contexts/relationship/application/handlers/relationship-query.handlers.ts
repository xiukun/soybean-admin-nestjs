/*
 * @Description: 实体关系管理查询处理器
 * @Autor: henry.xiukun
 * @Date: 2025-07-26 00:15:00
 * @LastEditors: henry.xiukun
 */

import { Injectable, Logger } from '@nestjs/common';
import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import {
  GetRelationshipsQuery,
  GetRelationshipByIdQuery,
  GetProjectRelationshipsQuery,
  GetEntityRelationshipsQuery,
  GetRelationshipTypesQuery,
  ValidateRelationshipConfigQuery,
  GetRelationshipSQLQuery,
  GetRelationshipGraphQuery,
  SearchRelationshipsQuery,
  GetRelationshipStatsQuery,
  GetRelationshipConflictsQuery,
} from '../queries/relationship.queries';
import { RelationshipManagerService } from '../services/relationship-manager.service';
import { PrismaService } from '@lib/shared/prisma/prisma.service';

@Injectable()
@QueryHandler(GetRelationshipsQuery)
export class GetRelationshipsHandler implements IQueryHandler<GetRelationshipsQuery> {
  private readonly logger = new Logger(GetRelationshipsHandler.name);

  constructor(
    private readonly relationshipManager: RelationshipManagerService,
    private readonly prisma: PrismaService,
  ) {}

  async execute(query: GetRelationshipsQuery) {
    this.logger.log('获取关系列表');

    try {
      const { filter, options } = query;
      
      const where: any = {};
      
      if (filter.projectId) {
        where.projectId = filter.projectId;
      }
      
      if (filter.sourceEntityId) {
        where.sourceEntityId = filter.sourceEntityId;
      }
      
      if (filter.targetEntityId) {
        where.targetEntityId = filter.targetEntityId;
      }
      
      if (filter.type) {
        where.type = filter.type;
      }
      
      if (filter.status) {
        where.status = filter.status;
      }
      
      if (filter.search) {
        where.OR = [
          { name: { contains: filter.search, mode: 'insensitive' } },
          { code: { contains: filter.search, mode: 'insensitive' } },
          { description: { contains: filter.search, mode: 'insensitive' } },
        ];
      }

      const {
        page = 1,
        size = 10,
        sortBy = 'createdAt',
        sortOrder = 'desc',
      } = options;

      const skip = (page - 1) * size;

      const [relationships, total] = await Promise.all([
        this.prisma.relation.findMany({
          where,
          skip,
          take: size,
          orderBy: { [sortBy]: sortOrder },
          include: {
            sourceEntity: {
              select: {
                id: true,
                name: true,
                code: true,
              },
            },
            targetEntity: {
              select: {
                id: true,
                name: true,
                code: true,
              },
            },
            sourceField: {
              select: {
                id: true,
                name: true,
                code: true,
                type: true,
              },
            },
            targetField: {
              select: {
                id: true,
                name: true,
                code: true,
                type: true,
              },
            },
          },
        }),
        this.prisma.relation.count({ where }),
      ]);

      return {
        relationships,
        total,
        page,
        size,
      };

    } catch (error) {
      this.logger.error(`获取关系列表失败: ${error.message}`);
      throw error;
    }
  }
}

@Injectable()
@QueryHandler(GetRelationshipByIdQuery)
export class GetRelationshipByIdHandler implements IQueryHandler<GetRelationshipByIdQuery> {
  private readonly logger = new Logger(GetRelationshipByIdHandler.name);

  constructor(private readonly prisma: PrismaService) {}

  async execute(query: GetRelationshipByIdQuery) {
    this.logger.log(`获取关系详情: ${query.relationshipId}`);

    try {
      const relationship = await this.prisma.relation.findUnique({
        where: { id: query.relationshipId },
        include: {
          sourceEntity: {
            select: {
              id: true,
              name: true,
              code: true,
              tableName: true,
            },
          },
          targetEntity: {
            select: {
              id: true,
              name: true,
              code: true,
              tableName: true,
            },
          },
          sourceField: {
            select: {
              id: true,
              name: true,
              code: true,
              type: true,
            },
          },
          targetField: {
            select: {
              id: true,
              name: true,
              code: true,
              type: true,
            },
          },
        },
      });

      return relationship;

    } catch (error) {
      this.logger.error(`获取关系详情失败: ${error.message}`);
      throw error;
    }
  }
}

@Injectable()
@QueryHandler(GetProjectRelationshipsQuery)
export class GetProjectRelationshipsHandler implements IQueryHandler<GetProjectRelationshipsQuery> {
  private readonly logger = new Logger(GetProjectRelationshipsHandler.name);

  constructor(private readonly relationshipManager: RelationshipManagerService) {}

  async execute(query: GetProjectRelationshipsQuery) {
    this.logger.log(`获取项目关系: ${query.projectId}`);

    try {
      const result = await this.relationshipManager.getProjectRelationships(
        query.projectId,
        query.options,
      );

      return result;

    } catch (error) {
      this.logger.error(`获取项目关系失败: ${error.message}`);
      throw error;
    }
  }
}

@Injectable()
@QueryHandler(GetEntityRelationshipsQuery)
export class GetEntityRelationshipsHandler implements IQueryHandler<GetEntityRelationshipsQuery> {
  private readonly logger = new Logger(GetEntityRelationshipsHandler.name);

  constructor(private readonly prisma: PrismaService) {}

  async execute(query: GetEntityRelationshipsQuery) {
    this.logger.log(`获取实体关系: ${query.entityId}`);

    try {
      const { entityId, direction = 'both' } = query;

      const where: any = {};

      if (direction === 'source') {
        where.sourceEntityId = entityId;
      } else if (direction === 'target') {
        where.targetEntityId = entityId;
      } else {
        where.OR = [
          { sourceEntityId: entityId },
          { targetEntityId: entityId },
        ];
      }

      const relationships = await this.prisma.relation.findMany({
        where,
        include: {
          sourceEntity: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
          targetEntity: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
          sourceField: {
            select: {
              id: true,
              name: true,
              code: true,
              type: true,
            },
          },
          targetField: {
            select: {
              id: true,
              name: true,
              code: true,
              type: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      return relationships;

    } catch (error) {
      this.logger.error(`获取实体关系失败: ${error.message}`);
      throw error;
    }
  }
}

@Injectable()
@QueryHandler(GetRelationshipTypesQuery)
export class GetRelationshipTypesHandler implements IQueryHandler<GetRelationshipTypesQuery> {
  private readonly logger = new Logger(GetRelationshipTypesHandler.name);

  async execute(query: GetRelationshipTypesQuery) {
    this.logger.log('获取关系类型列表');

    try {
      const types = [
        {
          value: 'one-to-one',
          label: '一对一',
          description: '两个实体之间的一对一关系',
          icon: 'link',
        },
        {
          value: 'one-to-many',
          label: '一对多',
          description: '一个实体对应多个实体',
          icon: 'share-alt',
        },
        {
          value: 'many-to-one',
          label: '多对一',
          description: '多个实体对应一个实体',
          icon: 'merge',
        },
        {
          value: 'many-to-many',
          label: '多对多',
          description: '多个实体之间的多对多关系',
          icon: 'cluster',
        },
      ];

      return types;

    } catch (error) {
      this.logger.error(`获取关系类型失败: ${error.message}`);
      throw error;
    }
  }
}

@Injectable()
@QueryHandler(ValidateRelationshipConfigQuery)
export class ValidateRelationshipConfigHandler implements IQueryHandler<ValidateRelationshipConfigQuery> {
  private readonly logger = new Logger(ValidateRelationshipConfigHandler.name);

  constructor(private readonly relationshipManager: RelationshipManagerService) {}

  async execute(query: ValidateRelationshipConfigQuery) {
    this.logger.log(`验证关系配置: ${query.projectId}`);

    try {
      const validation = await this.relationshipManager.validateRelationshipConfig(
        query.projectId,
        query.config,
      );

      return validation;

    } catch (error) {
      this.logger.error(`验证关系配置失败: ${error.message}`);
      throw error;
    }
  }
}

@Injectable()
@QueryHandler(GetRelationshipSQLQuery)
export class GetRelationshipSQLHandler implements IQueryHandler<GetRelationshipSQLQuery> {
  private readonly logger = new Logger(GetRelationshipSQLHandler.name);

  constructor(private readonly relationshipManager: RelationshipManagerService) {}

  async execute(query: GetRelationshipSQLQuery) {
    this.logger.log(`获取关系SQL: ${query.relationshipId}`);

    try {
      const sql = await this.relationshipManager.generateRelationshipSQL(
        query.relationshipId,
      );

      return { sql };

    } catch (error) {
      this.logger.error(`获取关系SQL失败: ${error.message}`);
      throw error;
    }
  }
}

@Injectable()
@QueryHandler(GetRelationshipGraphQuery)
export class GetRelationshipGraphHandler implements IQueryHandler<GetRelationshipGraphQuery> {
  private readonly logger = new Logger(GetRelationshipGraphHandler.name);

  constructor(private readonly relationshipManager: RelationshipManagerService) {}

  async execute(query: GetRelationshipGraphQuery) {
    this.logger.log(`获取关系图: ${query.projectId}`);

    try {
      const graph = await this.relationshipManager.getRelationshipGraph(
        query.projectId,
      );

      return graph;

    } catch (error) {
      this.logger.error(`获取关系图失败: ${error.message}`);
      throw error;
    }
  }
}

@Injectable()
@QueryHandler(GetRelationshipStatsQuery)
export class GetRelationshipStatsHandler implements IQueryHandler<GetRelationshipStatsQuery> {
  private readonly logger = new Logger(GetRelationshipStatsHandler.name);

  constructor(private readonly relationshipManager: RelationshipManagerService) {}

  async execute(query: GetRelationshipStatsQuery) {
    this.logger.log(`获取关系统计: ${query.projectId}`);

    try {
      const stats = await this.relationshipManager.getRelationshipStats(
        query.projectId,
      );

      return stats;

    } catch (error) {
      this.logger.error(`获取关系统计失败: ${error.message}`);
      throw error;
    }
  }
}
