/*
 * @Description: 实体关系管理服务
 * @Autor: henry.xiukun
 * @Date: 2025-07-26 00:15:00
 * @LastEditors: henry.xiukun
 */

import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@lib/shared/prisma/prisma.service';
import { RelationshipConfig } from '../commands/relationship.commands';

export interface RelationshipValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  suggestions: string[];
}

export interface RelationshipStats {
  totalRelationships: number;
  byType: Record<string, number>;
  byStatus: Record<string, number>;
  entitiesWithRelationships: number;
  orphanedEntities: number;
}

export interface RelationshipGraphNode {
  id: string;
  name: string;
  code: string;
  type: 'entity';
  fields: Array<{
    id: string;
    name: string;
    type: string;
  }>;
}

export interface RelationshipGraphEdge {
  id: string;
  source: string;
  target: string;
  type: string;
  label: string;
  config: any;
}

export interface RelationshipGraph {
  nodes: RelationshipGraphNode[];
  edges: RelationshipGraphEdge[];
}

@Injectable()
export class RelationshipManagerService {
  private readonly logger = new Logger(RelationshipManagerService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * 创建实体关系
   */
  async createRelationship(
    projectId: string,
    name: string,
    code: string,
    description: string,
    config: RelationshipConfig,
    userId: string,
  ): Promise<any> {
    try {
      // 验证配置
      const validation = await this.validateRelationshipConfig(projectId, config);
      if (!validation.isValid) {
        throw new BadRequestException(`关系配置无效: ${validation.errors.join(', ')}`);
      }

      // 检查代码唯一性
      const existing = await this.prisma.relation.findFirst({
        where: {
          projectId,
          code,
        },
      });

      if (existing) {
        throw new BadRequestException(`关系代码 "${code}" 已存在`);
      }

      // 创建关系
      const relationship = await this.prisma.relation.create({
        data: {
          projectId,
          name,
          code,
          description,
          type: config.type,
          sourceEntityId: config.sourceEntityId,
          sourceFieldId: config.sourceFieldId,
          targetEntityId: config.targetEntityId,
          targetFieldId: config.targetFieldId,
          foreignKeyName: config.foreignKeyName,
          joinTableConfig: config.joinTableConfig,
          onDelete: config.onDelete || 'RESTRICT',
          onUpdate: config.onUpdate || 'RESTRICT',
          config: config as any,
          indexed: config.indexed ?? true,
          indexName: config.indexName,
          createdBy: userId,
          updatedBy: userId,
        },
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
      });

      this.logger.log(`创建关系成功: ${name} (${code})`);
      return relationship;

    } catch (error) {
      this.logger.error(`创建关系失败: ${error.message}`);
      throw error;
    }
  }

  /**
   * 更新实体关系
   */
  async updateRelationship(
    relationshipId: string,
    updates: {
      name?: string;
      description?: string;
      config?: Partial<RelationshipConfig>;
    },
    userId: string,
  ): Promise<any> {
    try {
      const existing = await this.prisma.relation.findUnique({
        where: { id: relationshipId },
      });

      if (!existing) {
        throw new NotFoundException('关系不存在');
      }

      // 如果更新配置，需要验证
      let newConfig = existing.config as any;
      if (updates.config) {
        newConfig = { ...newConfig, ...updates.config };
        const validation = await this.validateRelationshipConfig(existing.projectId, newConfig);
        if (!validation.isValid) {
          throw new BadRequestException(`关系配置无效: ${validation.errors.join(', ')}`);
        }
      }

      const updateData: any = {
        updatedBy: userId,
        updatedAt: new Date(),
      };

      if (updates.name) updateData.name = updates.name;
      if (updates.description !== undefined) updateData.description = updates.description;
      if (updates.config) {
        updateData.config = newConfig;
        updateData.type = newConfig.type;
        updateData.sourceEntityId = newConfig.sourceEntityId;
        updateData.sourceFieldId = newConfig.sourceFieldId;
        updateData.targetEntityId = newConfig.targetEntityId;
        updateData.targetFieldId = newConfig.targetFieldId;
        updateData.foreignKeyName = newConfig.foreignKeyName;
        updateData.joinTableConfig = newConfig.joinTableConfig;
        updateData.onDelete = newConfig.onDelete;
        updateData.onUpdate = newConfig.onUpdate;
        updateData.indexed = newConfig.indexed;
        updateData.indexName = newConfig.indexName;
      }

      const relationship = await this.prisma.relation.update({
        where: { id: relationshipId },
        data: updateData,
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
      });

      this.logger.log(`更新关系成功: ${relationshipId}`);
      return relationship;

    } catch (error) {
      this.logger.error(`更新关系失败: ${error.message}`);
      throw error;
    }
  }

  /**
   * 删除实体关系
   */
  async deleteRelationship(relationshipId: string, userId: string): Promise<void> {
    try {
      const existing = await this.prisma.relation.findUnique({
        where: { id: relationshipId },
      });

      if (!existing) {
        throw new NotFoundException('关系不存在');
      }

      await this.prisma.relation.delete({
        where: { id: relationshipId },
      });

      this.logger.log(`删除关系成功: ${relationshipId}`);

    } catch (error) {
      this.logger.error(`删除关系失败: ${error.message}`);
      throw error;
    }
  }

  /**
   * 验证关系配置
   */
  async validateRelationshipConfig(
    projectId: string,
    config: RelationshipConfig,
  ): Promise<RelationshipValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];
    const suggestions: string[] = [];

    try {
      // 验证必填字段
      if (!config.type) {
        errors.push('关系类型不能为空');
      }

      if (!config.sourceEntityId) {
        errors.push('源实体不能为空');
      }

      if (!config.targetEntityId) {
        errors.push('目标实体不能为空');
      }

      // 验证关系类型
      const validTypes = ['one-to-one', 'one-to-many', 'many-to-one', 'many-to-many'];
      if (config.type && !validTypes.includes(config.type)) {
        errors.push(`无效的关系类型: ${config.type}`);
      }

      // 验证实体存在性
      if (config.sourceEntityId && config.targetEntityId) {
        const entities = await this.prisma.entity.findMany({
          where: {
            id: { in: [config.sourceEntityId, config.targetEntityId] },
            projectId,
          },
        });

        if (entities.length !== 2) {
          errors.push('源实体或目标实体不存在');
        }

        // 检查自引用
        if (config.sourceEntityId === config.targetEntityId) {
          warnings.push('检测到自引用关系，请确认这是预期的');
        }
      }

      // 验证字段存在性
      if (config.sourceFieldId) {
        const sourceField = await this.prisma.field.findFirst({
          where: {
            id: config.sourceFieldId,
            entityId: config.sourceEntityId,
          },
        });

        if (!sourceField) {
          errors.push('源字段不存在');
        }
      }

      if (config.targetFieldId) {
        const targetField = await this.prisma.field.findFirst({
          where: {
            id: config.targetFieldId,
            entityId: config.targetEntityId,
          },
        });

        if (!targetField) {
          errors.push('目标字段不存在');
        }
      }

      // 多对多关系验证
      if (config.type === 'many-to-many') {
        if (!config.joinTableConfig) {
          errors.push('多对多关系需要配置中间表');
        } else {
          if (!config.joinTableConfig.tableName) {
            errors.push('中间表名称不能为空');
          }
          if (!config.joinTableConfig.sourceColumn) {
            errors.push('中间表源列名不能为空');
          }
          if (!config.joinTableConfig.targetColumn) {
            errors.push('中间表目标列名不能为空');
          }
        }
      }

      // 外键约束验证
      if (config.onDelete && !['CASCADE', 'RESTRICT', 'SET_NULL', 'NO_ACTION'].includes(config.onDelete)) {
        errors.push(`无效的删除约束: ${config.onDelete}`);
      }

      if (config.onUpdate && !['CASCADE', 'RESTRICT', 'SET_NULL', 'NO_ACTION'].includes(config.onUpdate)) {
        errors.push(`无效的更新约束: ${config.onUpdate}`);
      }

      // 生成建议
      if (config.type === 'one-to-many' && !config.indexed) {
        suggestions.push('建议为一对多关系创建索引以提高查询性能');
      }

      if (!config.foreignKeyName && config.type !== 'many-to-many') {
        suggestions.push('建议指定外键名称以便于数据库管理');
      }

      return {
        isValid: errors.length === 0,
        errors,
        warnings,
        suggestions,
      };

    } catch (error) {
      this.logger.error(`验证关系配置失败: ${error.message}`);
      return {
        isValid: false,
        errors: [`验证过程出错: ${error.message}`],
        warnings,
        suggestions,
      };
    }
  }

  /**
   * 获取项目关系列表
   */
  async getProjectRelationships(
    projectId: string,
    options: {
      page?: number;
      size?: number;
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
      search?: string;
      type?: string;
      status?: string;
    } = {},
  ): Promise<{
    relationships: any[];
    total: number;
    page: number;
    size: number;
  }> {
    try {
      const {
        page = 1,
        size = 10,
        sortBy = 'createdAt',
        sortOrder = 'desc',
        search,
        type,
        status,
      } = options;

      const skip = (page - 1) * size;

      const where: any = {
        projectId,
      };

      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { code: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ];
      }

      if (type) {
        where.type = type;
      }

      if (status) {
        where.status = status;
      }

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
      this.logger.error(`获取项目关系列表失败: ${error.message}`);
      throw error;
    }
  }

  /**
   * 获取实体关系图
   */
  async getRelationshipGraph(projectId: string): Promise<RelationshipGraph> {
    try {
      // 获取项目中的所有实体
      const entities = await this.prisma.entity.findMany({
        where: { projectId },
        include: {
          fields: {
            select: {
              id: true,
              name: true,
              code: true,
              type: true,
            },
          },
        },
      });

      // 获取项目中的所有关系
      const relationships = await this.prisma.relation.findMany({
        where: { projectId },
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
        },
      });

      // 构建节点
      const nodes: RelationshipGraphNode[] = entities.map(entity => ({
        id: entity.id,
        name: entity.name,
        code: entity.code,
        type: 'entity',
        fields: entity.fields,
      }));

      // 构建边
      const edges: RelationshipGraphEdge[] = relationships.map(rel => ({
        id: rel.id,
        source: rel.sourceEntityId,
        target: rel.targetEntityId,
        type: rel.type,
        label: rel.name,
        config: rel.config,
      }));

      return {
        nodes,
        edges,
      };

    } catch (error) {
      this.logger.error(`获取关系图失败: ${error.message}`);
      throw error;
    }
  }

  /**
   * 获取关系统计信息
   */
  async getRelationshipStats(projectId: string): Promise<RelationshipStats> {
    try {
      const [
        totalRelationships,
        relationshipsByType,
        relationshipsByStatus,
        totalEntities,
        entitiesWithRelationships,
      ] = await Promise.all([
        this.prisma.relation.count({
          where: { projectId },
        }),
        this.prisma.relation.groupBy({
          by: ['type'],
          where: { projectId },
          _count: true,
        }),
        this.prisma.relation.groupBy({
          by: ['status'],
          where: { projectId },
          _count: true,
        }),
        this.prisma.entity.count({
          where: { projectId },
        }),
        this.prisma.entity.count({
          where: {
            projectId,
            OR: [
              {
                sourceRelations: {
                  some: {},
                },
              },
              {
                targetRelations: {
                  some: {},
                },
              },
            ],
          },
        }),
      ]);

      const byType: Record<string, number> = {};
      relationshipsByType.forEach(item => {
        byType[item.type] = item._count;
      });

      const byStatus: Record<string, number> = {};
      relationshipsByStatus.forEach(item => {
        byStatus[item.status || 'ACTIVE'] = item._count;
      });

      return {
        totalRelationships,
        byType,
        byStatus,
        entitiesWithRelationships,
        orphanedEntities: totalEntities - entitiesWithRelationships,
      };

    } catch (error) {
      this.logger.error(`获取关系统计失败: ${error.message}`);
      throw error;
    }
  }

  /**
   * 生成关系SQL
   */
  async generateRelationshipSQL(relationshipId: string): Promise<string> {
    try {
      const relationship = await this.prisma.relation.findUnique({
        where: { id: relationshipId },
        include: {
          sourceEntity: true,
          targetEntity: true,
          sourceField: true,
          targetField: true,
        },
      });

      if (!relationship) {
        throw new NotFoundException('关系不存在');
      }

      const config = relationship.config as any;
      let sql = '';

      switch (relationship.type) {
        case 'one-to-one':
        case 'one-to-many':
        case 'many-to-one':
          // 外键约束SQL
          const foreignKeyName = config.foreignKeyName ||
            `fk_${relationship.sourceEntity.tableName}_${relationship.targetEntity.tableName}`;

          sql = `ALTER TABLE ${relationship.sourceEntity.tableName || relationship.sourceEntity.code}
ADD CONSTRAINT ${foreignKeyName}
FOREIGN KEY (${config.sourceFieldId ? relationship.sourceField?.code : 'id'})
REFERENCES ${relationship.targetEntity.tableName || relationship.targetEntity.code}(${config.targetFieldId ? relationship.targetField?.code : 'id'})
ON DELETE ${relationship.onDelete || 'RESTRICT'}
ON UPDATE ${relationship.onUpdate || 'RESTRICT'};`;

          // 索引SQL
          if (relationship.indexed) {
            const indexName = relationship.indexName ||
              `idx_${relationship.sourceEntity.code}_${relationship.targetEntity.code}`;
            sql += `\n\nCREATE INDEX ${indexName}
ON ${relationship.sourceEntity.tableName || relationship.sourceEntity.code}(${config.sourceFieldId ? relationship.sourceField?.code : 'id'});`;
          }
          break;

        case 'many-to-many':
          // 中间表SQL
          if (config.joinTableConfig) {
            const joinTable = config.joinTableConfig.tableName;
            const sourceColumn = config.joinTableConfig.sourceColumn;
            const targetColumn = config.joinTableConfig.targetColumn;

            sql = `CREATE TABLE ${joinTable} (
  ${sourceColumn} VARCHAR(36) NOT NULL,
  ${targetColumn} VARCHAR(36) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (${sourceColumn}, ${targetColumn}),
  FOREIGN KEY (${sourceColumn}) REFERENCES ${relationship.sourceEntity.tableName || relationship.sourceEntity.code}(id) ON DELETE CASCADE,
  FOREIGN KEY (${targetColumn}) REFERENCES ${relationship.targetEntity.tableName || relationship.targetEntity.code}(id) ON DELETE CASCADE
);`;

            // 索引
            sql += `\n\nCREATE INDEX idx_${joinTable}_${sourceColumn} ON ${joinTable}(${sourceColumn});`;
            sql += `\nCREATE INDEX idx_${joinTable}_${targetColumn} ON ${joinTable}(${targetColumn});`;
          }
          break;
      }

      return sql;

    } catch (error) {
      this.logger.error(`生成关系SQL失败: ${error.message}`);
      throw error;
    }
  }
}
