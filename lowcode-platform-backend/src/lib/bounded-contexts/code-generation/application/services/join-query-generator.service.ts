/*
 * @Description: 关联查询生成引擎
 * @Autor: henry.xiukun
 * @Date: 2025-07-26 00:45:00
 * @LastEditors: henry.xiukun
 */

import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@lib/shared/prisma/prisma.service';

export interface JoinQueryConfig {
  mainEntityId: string;
  joinConfigs: JoinConfig[];
  selectFields: SelectFieldConfig[];
  filterConditions?: FilterCondition[];
  sortConfig?: SortConfig[];
  pagination?: PaginationConfig;
}

export interface JoinConfig {
  relationshipId: string;
  joinType: 'INNER' | 'LEFT' | 'RIGHT' | 'FULL';
  alias?: string;
  condition?: string; // 自定义连接条件
}

export interface SelectFieldConfig {
  entityId: string;
  fieldId: string;
  alias?: string;
  aggregation?: 'COUNT' | 'SUM' | 'AVG' | 'MAX' | 'MIN';
}

export interface FilterCondition {
  entityId: string;
  fieldId: string;
  operator: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'like' | 'in' | 'between';
  value: any;
  logicalOperator?: 'AND' | 'OR';
}

export interface SortConfig {
  entityId: string;
  fieldId: string;
  direction: 'ASC' | 'DESC';
}

export interface PaginationConfig {
  page: number;
  size: number;
}

export interface GeneratedJoinQuery {
  sql: string;
  prismaQuery: any;
  typeDefinition: string;
  apiInterface: string;
  documentation: string;
}

@Injectable()
export class JoinQueryGeneratorService {
  private readonly logger = new Logger(JoinQueryGeneratorService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * 生成关联查询
   */
  async generateJoinQuery(config: JoinQueryConfig): Promise<GeneratedJoinQuery> {
    try {
      this.logger.log(`生成关联查询: 主实体 ${config.mainEntityId}`);

      // 验证配置
      await this.validateJoinConfig(config);

      // 获取实体和关系信息
      const entityInfo = await this.getEntityInfo(config);

      // 生成SQL查询
      const sql = await this.generateSQL(config, entityInfo);

      // 生成Prisma查询
      const prismaQuery = await this.generatePrismaQuery(config, entityInfo);

      // 生成TypeScript类型定义
      const typeDefinition = await this.generateTypeDefinition(config, entityInfo);

      // 生成API接口
      const apiInterface = await this.generateAPIInterface(config, entityInfo);

      // 生成文档
      const documentation = await this.generateDocumentation(config, entityInfo);

      return {
        sql,
        prismaQuery,
        typeDefinition,
        apiInterface,
        documentation,
      };

    } catch (error) {
      this.logger.error(`生成关联查询失败: ${error.message}`);
      throw error;
    }
  }

  /**
   * 验证关联查询配置
   */
  private async validateJoinConfig(config: JoinQueryConfig): Promise<void> {
    // 验证主实体存在
    const mainEntity = await this.prisma.entity.findUnique({
      where: { id: config.mainEntityId },
    });

    if (!mainEntity) {
      throw new BadRequestException('主实体不存在');
    }

    // 验证关系配置
    for (const joinConfig of config.joinConfigs) {
      const relationship = await this.prisma.relation.findUnique({
        where: { id: joinConfig.relationshipId },
        include: {
          sourceEntity: true,
          targetEntity: true,
        },
      });

      if (!relationship) {
        throw new BadRequestException(`关系 ${joinConfig.relationshipId} 不存在`);
      }

      // 验证关系是否与主实体相关
      if (relationship.sourceEntityId !== config.mainEntityId && 
          relationship.targetEntityId !== config.mainEntityId) {
        throw new BadRequestException(`关系 ${joinConfig.relationshipId} 与主实体无关`);
      }
    }

    // 验证选择字段
    for (const selectField of config.selectFields) {
      const field = await this.prisma.field.findUnique({
        where: { id: selectField.fieldId },
      });

      if (!field) {
        throw new BadRequestException(`字段 ${selectField.fieldId} 不存在`);
      }
    }
  }

  /**
   * 获取实体信息
   */
  private async getEntityInfo(config: JoinQueryConfig) {
    const entityIds = new Set([config.mainEntityId]);
    
    // 收集所有相关实体ID
    for (const joinConfig of config.joinConfigs) {
      const relationship = await this.prisma.relation.findUnique({
        where: { id: joinConfig.relationshipId },
      });
      
      if (relationship) {
        entityIds.add(relationship.sourceEntityId);
        entityIds.add(relationship.targetEntityId);
      }
    }

    // 获取实体详细信息
    const entities = await this.prisma.entity.findMany({
      where: {
        id: { in: Array.from(entityIds) },
      },
      include: {
        fields: true,
        project: true,
      },
    });

    // 获取关系详细信息
    const relationships = await this.prisma.relation.findMany({
      where: {
        id: { in: config.joinConfigs.map(jc => jc.relationshipId) },
      },
      include: {
        sourceEntity: true,
        targetEntity: true,
        sourceField: true,
        targetField: true,
      },
    });

    return {
      entities: entities.reduce((acc, entity) => {
        acc[entity.id] = entity;
        return acc;
      }, {} as Record<string, any>),
      relationships: relationships.reduce((acc, rel) => {
        acc[rel.id] = rel;
        return acc;
      }, {} as Record<string, any>),
    };
  }

  /**
   * 生成SQL查询
   */
  private async generateSQL(config: JoinQueryConfig, entityInfo: any): Promise<string> {
    const mainEntity = entityInfo.entities[config.mainEntityId];
    const mainTableName = mainEntity.tableName || mainEntity.code;

    // 构建SELECT子句
    const selectClauses = config.selectFields.map(sf => {
      const entity = entityInfo.entities[sf.entityId];
      const field = entity.fields.find((f: any) => f.id === sf.fieldId);
      const tableName = entity.tableName || entity.code;
      const fieldName = field.columnName || field.code;
      const alias = sf.alias || `${entity.code}_${field.code}`;

      if (sf.aggregation) {
        return `${sf.aggregation}(${tableName}.${fieldName}) AS ${alias}`;
      } else {
        return `${tableName}.${fieldName} AS ${alias}`;
      }
    });

    // 构建FROM子句
    let fromClause = `FROM ${mainTableName}`;

    // 构建JOIN子句
    const joinClauses = config.joinConfigs.map(jc => {
      const relationship = entityInfo.relationships[jc.relationshipId];
      const sourceEntity = relationship.sourceEntity;
      const targetEntity = relationship.targetEntity;
      
      const sourceTable = sourceEntity.tableName || sourceEntity.code;
      const targetTable = targetEntity.tableName || targetEntity.code;
      
      let joinCondition = '';
      
      if (relationship.type === 'many-to-many') {
        // 多对多关系需要中间表
        const joinTableConfig = relationship.joinTableConfig as any;
        if (joinTableConfig) {
          const joinTable = joinTableConfig.tableName;
          const sourceColumn = joinTableConfig.sourceColumn;
          const targetColumn = joinTableConfig.targetColumn;
          
          return `${jc.joinType} JOIN ${joinTable} ON ${sourceTable}.id = ${joinTable}.${sourceColumn}
                  ${jc.joinType} JOIN ${targetTable} ON ${joinTable}.${targetColumn} = ${targetTable}.id`;
        }
      } else {
        // 一对一、一对多、多对一关系
        const sourceField = relationship.sourceField?.columnName || relationship.sourceField?.code || 'id';
        const targetField = relationship.targetField?.columnName || relationship.targetField?.code || 'id';
        
        if (relationship.sourceEntityId === config.mainEntityId) {
          joinCondition = `${sourceTable}.${sourceField} = ${targetTable}.${targetField}`;
        } else {
          joinCondition = `${targetTable}.${targetField} = ${sourceTable}.${sourceField}`;
        }
      }

      return `${jc.joinType} JOIN ${targetTable} ON ${joinCondition}`;
    });

    // 构建WHERE子句
    let whereClause = '';
    if (config.filterConditions && config.filterConditions.length > 0) {
      const conditions = config.filterConditions.map(fc => {
        const entity = entityInfo.entities[fc.entityId];
        const field = entity.fields.find((f: any) => f.id === fc.fieldId);
        const tableName = entity.tableName || entity.code;
        const fieldName = field.columnName || field.code;

        let condition = '';
        switch (fc.operator) {
          case 'eq':
            condition = `${tableName}.${fieldName} = '${fc.value}'`;
            break;
          case 'ne':
            condition = `${tableName}.${fieldName} != '${fc.value}'`;
            break;
          case 'gt':
            condition = `${tableName}.${fieldName} > '${fc.value}'`;
            break;
          case 'gte':
            condition = `${tableName}.${fieldName} >= '${fc.value}'`;
            break;
          case 'lt':
            condition = `${tableName}.${fieldName} < '${fc.value}'`;
            break;
          case 'lte':
            condition = `${tableName}.${fieldName} <= '${fc.value}'`;
            break;
          case 'like':
            condition = `${tableName}.${fieldName} LIKE '%${fc.value}%'`;
            break;
          case 'in':
            const values = Array.isArray(fc.value) ? fc.value : [fc.value];
            condition = `${tableName}.${fieldName} IN (${values.map(v => `'${v}'`).join(', ')})`;
            break;
          case 'between':
            if (Array.isArray(fc.value) && fc.value.length === 2) {
              condition = `${tableName}.${fieldName} BETWEEN '${fc.value[0]}' AND '${fc.value[1]}'`;
            }
            break;
        }

        return condition;
      });

      whereClause = `WHERE ${conditions.join(' AND ')}`;
    }

    // 构建ORDER BY子句
    let orderByClause = '';
    if (config.sortConfig && config.sortConfig.length > 0) {
      const sortClauses = config.sortConfig.map(sc => {
        const entity = entityInfo.entities[sc.entityId];
        const field = entity.fields.find((f: any) => f.id === sc.fieldId);
        const tableName = entity.tableName || entity.code;
        const fieldName = field.columnName || field.code;
        
        return `${tableName}.${fieldName} ${sc.direction}`;
      });

      orderByClause = `ORDER BY ${sortClauses.join(', ')}`;
    }

    // 构建LIMIT子句
    let limitClause = '';
    if (config.pagination) {
      const offset = (config.pagination.page - 1) * config.pagination.size;
      limitClause = `LIMIT ${config.pagination.size} OFFSET ${offset}`;
    }

    // 组合完整SQL
    const sql = [
      `SELECT ${selectClauses.join(', ')}`,
      fromClause,
      ...joinClauses,
      whereClause,
      orderByClause,
      limitClause,
    ].filter(clause => clause.trim() !== '').join('\n');

    return sql;
  }

  /**
   * 生成Prisma查询
   */
  private async generatePrismaQuery(config: JoinQueryConfig, entityInfo: any): Promise<any> {
    const mainEntity = entityInfo.entities[config.mainEntityId];

    // 构建include对象
    const include: any = {};

    for (const joinConfig of config.joinConfigs) {
      const relationship = entityInfo.relationships[joinConfig.relationshipId];

      // 确定关联字段名
      let relationName = '';
      if (relationship.sourceEntityId === config.mainEntityId) {
        // 主实体是源实体
        relationName = relationship.targetEntity.code;
      } else {
        // 主实体是目标实体
        relationName = relationship.sourceEntity.code;
      }

      include[relationName] = {
        select: {},
      };

      // 添加选择的字段
      config.selectFields
        .filter(sf => sf.entityId === (relationship.sourceEntityId === config.mainEntityId ?
          relationship.targetEntityId : relationship.sourceEntityId))
        .forEach(sf => {
          const entity = entityInfo.entities[sf.entityId];
          const field = entity.fields.find((f: any) => f.id === sf.fieldId);
          include[relationName].select[field.code] = true;
        });
    }

    // 构建where条件
    const where: any = {};
    if (config.filterConditions) {
      for (const fc of config.filterConditions) {
        if (fc.entityId === config.mainEntityId) {
          const entity = entityInfo.entities[fc.entityId];
          const field = entity.fields.find((f: any) => f.id === fc.fieldId);

          switch (fc.operator) {
            case 'eq':
              where[field.code] = fc.value;
              break;
            case 'ne':
              where[field.code] = { not: fc.value };
              break;
            case 'gt':
              where[field.code] = { gt: fc.value };
              break;
            case 'gte':
              where[field.code] = { gte: fc.value };
              break;
            case 'lt':
              where[field.code] = { lt: fc.value };
              break;
            case 'lte':
              where[field.code] = { lte: fc.value };
              break;
            case 'like':
              where[field.code] = { contains: fc.value, mode: 'insensitive' };
              break;
            case 'in':
              where[field.code] = { in: Array.isArray(fc.value) ? fc.value : [fc.value] };
              break;
          }
        }
      }
    }

    // 构建orderBy
    const orderBy: any[] = [];
    if (config.sortConfig) {
      for (const sc of config.sortConfig) {
        if (sc.entityId === config.mainEntityId) {
          const entity = entityInfo.entities[sc.entityId];
          const field = entity.fields.find((f: any) => f.id === sc.fieldId);
          orderBy.push({ [field.code]: sc.direction.toLowerCase() });
        }
      }
    }

    // 构建分页
    const pagination: any = {};
    if (config.pagination) {
      pagination.skip = (config.pagination.page - 1) * config.pagination.size;
      pagination.take = config.pagination.size;
    }

    const prismaQuery = {
      where,
      include,
      orderBy: orderBy.length > 0 ? orderBy : undefined,
      ...pagination,
    };

    return prismaQuery;
  }

  /**
   * 生成TypeScript类型定义
   */
  private async generateTypeDefinition(config: JoinQueryConfig, entityInfo: any): Promise<string> {
    const mainEntity = entityInfo.entities[config.mainEntityId];
    const interfaceName = `${this.toPascalCase(mainEntity.code)}JoinResult`;

    // 收集所有字段类型
    const fieldTypes: string[] = [];

    for (const sf of config.selectFields) {
      const entity = entityInfo.entities[sf.entityId];
      const field = entity.fields.find((f: any) => f.id === sf.fieldId);
      const alias = sf.alias || `${entity.code}_${field.code}`;

      let fieldType = this.mapFieldTypeToTS(field.type);

      if (sf.aggregation) {
        fieldType = 'number'; // 聚合函数结果通常是数字
      }

      fieldTypes.push(`  ${alias}: ${fieldType};`);
    }

    const typeDefinition = `
export interface ${interfaceName} {
${fieldTypes.join('\n')}
}

export interface ${interfaceName}ListResponse {
  items: ${interfaceName}[];
  total: number;
  page: number;
  size: number;
}
`;

    return typeDefinition;
  }

  /**
   * 生成API接口
   */
  private async generateAPIInterface(config: JoinQueryConfig, entityInfo: any): Promise<string> {
    const mainEntity = entityInfo.entities[config.mainEntityId];
    const controllerName = `${this.toPascalCase(mainEntity.code)}JoinController`;
    const serviceName = `${this.toPascalCase(mainEntity.code)}JoinService`;
    const interfaceName = `${this.toPascalCase(mainEntity.code)}JoinResult`;

    // 生成查询参数接口
    const queryParams: string[] = [];

    if (config.filterConditions) {
      for (const fc of config.filterConditions) {
        const entity = entityInfo.entities[fc.entityId];
        const field = entity.fields.find((f: any) => f.id === fc.fieldId);
        const paramName = `${entity.code}_${field.code}`;
        const paramType = this.mapFieldTypeToTS(field.type);

        queryParams.push(`  @Query('${paramName}') ${paramName}?: ${paramType},`);
      }
    }

    queryParams.push(`  @Query('page') page?: number,`);
    queryParams.push(`  @Query('size') size?: number,`);

    const apiInterface = `
import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { AmisResponse } from '@lib/shared/decorators/amis-response.decorator';

@ApiTags('${mainEntity.name}关联查询')
@Controller('api/v1/${mainEntity.code.toLowerCase()}-join')
export class ${controllerName} {
  constructor(private readonly ${serviceName.charAt(0).toLowerCase() + serviceName.slice(1)}: ${serviceName}) {}

  @Get()
  @ApiOperation({ summary: '${mainEntity.name}关联查询' })
${config.filterConditions?.map(fc => {
  const entity = entityInfo.entities[fc.entityId];
  const field = entity.fields.find((f: any) => f.id === fc.fieldId);
  return `  @ApiQuery({ name: '${entity.code}_${field.code}', description: '${field.name}', required: false })`;
}).join('\n') || ''}
  @ApiQuery({ name: 'page', description: '页码', required: false })
  @ApiQuery({ name: 'size', description: '每页数量', required: false })
  @AmisResponse({ description: '查询成功', dataKey: 'items' })
  async getJoinData(
${queryParams.join('\n')}
  ): Promise<any> {
    const result = await this.${serviceName.charAt(0).toLowerCase() + serviceName.slice(1)}.getJoinData({
${config.filterConditions?.map(fc => {
  const entity = entityInfo.entities[fc.entityId];
  const field = entity.fields.find((f: any) => f.id === fc.fieldId);
  const paramName = `${entity.code}_${field.code}`;
  return `      ${paramName},`;
}).join('\n') || ''}
      page: page || 1,
      size: size || 10,
    });

    return {
      status: 0,
      msg: 'success',
      data: {
        items: result.items,
        total: result.total,
        page: result.page,
        size: result.size,
      },
    };
  }
}
`;

    return apiInterface;
  }

  /**
   * 生成文档
   */
  private async generateDocumentation(config: JoinQueryConfig, entityInfo: any): Promise<string> {
    const mainEntity = entityInfo.entities[config.mainEntityId];

    const relationshipDocs = config.joinConfigs.map(jc => {
      const relationship = entityInfo.relationships[jc.relationshipId];
      return `- ${relationship.name} (${relationship.type})`;
    }).join('\n');

    const fieldDocs = config.selectFields.map(sf => {
      const entity = entityInfo.entities[sf.entityId];
      const field = entity.fields.find((f: any) => f.id === sf.fieldId);
      const alias = sf.alias || `${entity.code}_${field.code}`;
      return `- ${alias}: ${field.name} (${entity.name}.${field.name})`;
    }).join('\n');

    const documentation = `
# ${mainEntity.name}关联查询接口

## 概述
此接口提供${mainEntity.name}的多表关联查询功能。

## 关联关系
${relationshipDocs}

## 返回字段
${fieldDocs}

## 使用示例

\`\`\`typescript
// 查询请求
GET /api/v1/${mainEntity.code.toLowerCase()}-join?page=1&size=10

// 响应格式
{
  "status": 0,
  "msg": "success",
  "data": {
    "items": [
      // ${this.toPascalCase(mainEntity.code)}JoinResult[]
    ],
    "total": 100,
    "page": 1,
    "size": 10
  }
}
\`\`\`

## 注意事项
- 此接口为自动生成，请勿手动修改
- 支持分页查询，默认每页10条记录
- 支持多种过滤条件和排序方式
`;

    return documentation;
  }

  /**
   * 工具方法：转换为PascalCase
   */
  private toPascalCase(str: string): string {
    return str.replace(/(?:^|_)([a-z])/g, (_, char) => char.toUpperCase());
  }

  /**
   * 工具方法：映射字段类型到TypeScript类型
   */
  private mapFieldTypeToTS(fieldType: string): string {
    const typeMap: Record<string, string> = {
      'string': 'string',
      'varchar': 'string',
      'text': 'string',
      'int': 'number',
      'integer': 'number',
      'bigint': 'number',
      'decimal': 'number',
      'float': 'number',
      'double': 'number',
      'boolean': 'boolean',
      'bool': 'boolean',
      'date': 'Date',
      'datetime': 'Date',
      'timestamp': 'Date',
      'json': 'any',
      'jsonb': 'any',
    };

    return typeMap[fieldType.toLowerCase()] || 'any';
  }
}
