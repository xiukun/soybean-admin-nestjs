import { Injectable, Inject } from '@nestjs/common';
import { PrismaService } from '@lib/shared/prisma/prisma.service';
import { Entity } from '@entity/domain/entity.model';
import { Field } from '@entity/domain/field.model';
import { Relation } from '@entity/domain/relation.model';

export interface JoinConfig {
  sourceEntity: string;
  targetEntity: string;
  sourceField: string;
  targetField: string;
  joinType: 'INNER' | 'LEFT' | 'RIGHT' | 'FULL';
  alias?: string;
}

export interface QueryConfig {
  mainEntity: string;
  joins: JoinConfig[];
  select: string[];
  where?: any;
  orderBy?: any;
  limit?: number;
  offset?: number;
}

export interface QueryResult {
  data: any[];
  total: number;
  page?: number;
  limit?: number;
}

@Injectable()
export class MultiTableQueryService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject('EntityRepository')
    private readonly entityRepository: any,
  ) {}

  async executeQuery(config: QueryConfig): Promise<QueryResult> {
    // 验证查询配置
    await this.validateQueryConfig(config);

    // 构建SQL查询
    const sql = await this.buildSqlQuery(config);

    // 执行查询
    const data = await this.prisma.$queryRawUnsafe(sql.query, ...sql.params) as any[];

    // 如果需要总数，执行计数查询
    let total = data.length;
    if (config.limit) {
      const countSql = await this.buildCountQuery(config);
      const countResult = await this.prisma.$queryRawUnsafe(countSql.query, ...countSql.params) as any[];
      total = Number(countResult[0]?.count) || 0;
    }

    return {
      data,
      total,
      page: config.offset && config.limit ? Math.floor(config.offset / config.limit) + 1 : undefined,
      limit: config.limit,
    };
  }

  async generateCrudApi(entityId: string, config: any): Promise<any> {
    const entityWithFields = await this.entityRepository.findEntityWithFields(entityId);
    if (!entityWithFields) {
      throw new Error(`Entity with ID ${entityId} not found`);
    }

    const { entity, fields } = entityWithFields;

    return {
      create: this.generateCreateApi(entity, fields, config),
      read: this.generateReadApi(entity, fields, config),
      update: this.generateUpdateApi(entity, fields, config),
      delete: this.generateDeleteApi(entity, fields, config),
      list: this.generateListApi(entity, fields, config),
    };
  }

  private async validateQueryConfig(config: QueryConfig): Promise<void> {
    // 验证主实体存在
    const mainEntity = await this.entityRepository.findByCode(config.mainEntity);
    if (!mainEntity) {
      throw new Error(`Main entity '${config.mainEntity}' not found`);
    }

    // 验证关联实体存在
    for (const join of config.joins) {
      const sourceEntity = await this.entityRepository.findByCode(join.sourceEntity);
      const targetEntity = await this.entityRepository.findByCode(join.targetEntity);
      
      if (!sourceEntity) {
        throw new Error(`Source entity '${join.sourceEntity}' not found`);
      }
      
      if (!targetEntity) {
        throw new Error(`Target entity '${join.targetEntity}' not found`);
      }
    }

    // 验证选择字段
    for (const selectField of config.select) {
      await this.validateSelectField(selectField);
    }
  }

  private async validateSelectField(selectField: string): Promise<void> {
    // 解析字段格式：entity.field 或 alias.field
    const parts = selectField.split('.');
    if (parts.length !== 2) {
      throw new Error(`Invalid select field format: ${selectField}. Expected format: entity.field`);
    }

    const [entityCode, fieldCode] = parts;
    
    // 验证实体和字段存在
    const entity = await this.entityRepository.findByCode(entityCode);
    if (!entity) {
      throw new Error(`Entity '${entityCode}' not found in select field: ${selectField}`);
    }

    const fields = await this.entityRepository.findFieldsByEntityId(entity.id);
    const field = fields.find(f => f.code === fieldCode);
    if (!field) {
      throw new Error(`Field '${fieldCode}' not found in entity '${entityCode}'`);
    }
  }

  private async buildSqlQuery(config: QueryConfig): Promise<{ query: string; params: any[] }> {
    const params: any[] = [];
    let paramIndex = 1;

    // 构建SELECT子句
    const selectClause = config.select.map(field => {
      const [entity, fieldName] = field.split('.');
      return `${entity}.${fieldName}`;
    }).join(', ');

    // 构建FROM子句
    const fromClause = config.mainEntity;

    // 构建JOIN子句
    const joinClauses = config.joins.map(join => {
      const alias = join.alias || join.targetEntity;
      return `${join.joinType} JOIN ${join.targetEntity} AS ${alias} ON ${join.sourceEntity}.${join.sourceField} = ${alias}.${join.targetField}`;
    }).join(' ');

    // 构建WHERE子句
    let whereClause = '';
    if (config.where) {
      const whereConditions = this.buildWhereConditions(config.where, params, paramIndex);
      whereClause = `WHERE ${whereConditions.clause}`;
      paramIndex = whereConditions.paramIndex;
    }

    // 构建ORDER BY子句
    let orderByClause = '';
    if (config.orderBy) {
      const orderConditions = Object.entries(config.orderBy).map(([field, direction]) => {
        return `${field} ${direction}`;
      }).join(', ');
      orderByClause = `ORDER BY ${orderConditions}`;
    }

    // 构建LIMIT和OFFSET子句
    let limitClause = '';
    if (config.limit) {
      limitClause = `LIMIT $${paramIndex}`;
      params.push(config.limit);
      paramIndex++;
    }

    let offsetClause = '';
    if (config.offset) {
      offsetClause = `OFFSET $${paramIndex}`;
      params.push(config.offset);
      paramIndex++;
    }

    const query = [
      `SELECT ${selectClause}`,
      `FROM ${fromClause}`,
      joinClauses,
      whereClause,
      orderByClause,
      limitClause,
      offsetClause,
    ].filter(Boolean).join(' ');

    return { query, params };
  }

  private async buildCountQuery(config: QueryConfig): Promise<{ query: string; params: any[] }> {
    const params: any[] = [];
    let paramIndex = 1;

    // 构建FROM子句
    const fromClause = config.mainEntity;

    // 构建JOIN子句
    const joinClauses = config.joins.map(join => {
      const alias = join.alias || join.targetEntity;
      return `${join.joinType} JOIN ${join.targetEntity} AS ${alias} ON ${join.sourceEntity}.${join.sourceField} = ${alias}.${join.targetField}`;
    }).join(' ');

    // 构建WHERE子句
    let whereClause = '';
    if (config.where) {
      const whereConditions = this.buildWhereConditions(config.where, params, paramIndex);
      whereClause = `WHERE ${whereConditions.clause}`;
    }

    const query = [
      'SELECT COUNT(*) as count',
      `FROM ${fromClause}`,
      joinClauses,
      whereClause,
    ].filter(Boolean).join(' ');

    return { query, params };
  }

  private buildWhereConditions(where: any, params: any[], paramIndex: number): { clause: string; paramIndex: number } {
    const conditions: string[] = [];

    for (const [field, condition] of Object.entries(where)) {
      if (typeof condition === 'object' && condition !== null) {
        // 处理操作符条件
        for (const [operator, value] of Object.entries(condition)) {
          switch (operator) {
            case 'eq':
              conditions.push(`${field} = $${paramIndex}`);
              params.push(value);
              paramIndex++;
              break;
            case 'ne':
              conditions.push(`${field} != $${paramIndex}`);
              params.push(value);
              paramIndex++;
              break;
            case 'gt':
              conditions.push(`${field} > $${paramIndex}`);
              params.push(value);
              paramIndex++;
              break;
            case 'gte':
              conditions.push(`${field} >= $${paramIndex}`);
              params.push(value);
              paramIndex++;
              break;
            case 'lt':
              conditions.push(`${field} < $${paramIndex}`);
              params.push(value);
              paramIndex++;
              break;
            case 'lte':
              conditions.push(`${field} <= $${paramIndex}`);
              params.push(value);
              paramIndex++;
              break;
            case 'like':
              conditions.push(`${field} LIKE $${paramIndex}`);
              params.push(value);
              paramIndex++;
              break;
            case 'in':
              const placeholders = (value as any[]).map(() => `$${paramIndex++}`).join(', ');
              conditions.push(`${field} IN (${placeholders})`);
              params.push(...(value as any[]));
              break;
          }
        }
      } else {
        // 简单等值条件
        conditions.push(`${field} = $${paramIndex}`);
        params.push(condition);
        paramIndex++;
      }
    }

    return {
      clause: conditions.join(' AND '),
      paramIndex,
    };
  }

  private generateCreateApi(entity: Entity, fields: Field[], config: any): any {
    return {
      path: `/api/v1/${entity.code}`,
      method: 'POST',
      requestConfig: {
        body: this.generateRequestSchema(fields, 'create'),
      },
      responseConfig: {
        schema: this.generateResponseSchema(fields),
      },
      implementation: this.generateCreateImplementation(entity, fields),
    };
  }

  private generateReadApi(entity: Entity, fields: Field[], config: any): any {
    return {
      path: `/api/v1/${entity.code}/:id`,
      method: 'GET',
      requestConfig: {
        params: {
          id: { type: 'string', required: true },
        },
      },
      responseConfig: {
        schema: this.generateResponseSchema(fields),
      },
      implementation: this.generateReadImplementation(entity, fields),
    };
  }

  private generateUpdateApi(entity: Entity, fields: Field[], config: any): any {
    return {
      path: `/api/v1/${entity.code}/:id`,
      method: 'PUT',
      requestConfig: {
        params: {
          id: { type: 'string', required: true },
        },
        body: this.generateRequestSchema(fields, 'update'),
      },
      responseConfig: {
        schema: this.generateResponseSchema(fields),
      },
      implementation: this.generateUpdateImplementation(entity, fields),
    };
  }

  private generateDeleteApi(entity: Entity, fields: Field[], config: any): any {
    return {
      path: `/api/v1/${entity.code}/:id`,
      method: 'DELETE',
      requestConfig: {
        params: {
          id: { type: 'string', required: true },
        },
      },
      responseConfig: {
        schema: { type: 'object', properties: { success: { type: 'boolean' } } },
      },
      implementation: this.generateDeleteImplementation(entity, fields),
    };
  }

  private generateListApi(entity: Entity, fields: Field[], config: any): any {
    return {
      path: `/api/v1/${entity.code}`,
      method: 'GET',
      requestConfig: {
        query: {
          page: { type: 'number', default: 1 },
          limit: { type: 'number', default: 10 },
          ...this.generateFilterSchema(fields),
        },
      },
      responseConfig: {
        schema: {
          type: 'object',
          properties: {
            data: {
              type: 'array',
              items: this.generateResponseSchema(fields),
            },
            total: { type: 'number' },
            page: { type: 'number' },
            limit: { type: 'number' },
          },
        },
      },
      implementation: this.generateListImplementation(entity, fields),
    };
  }

  private generateRequestSchema(fields: Field[], operation: 'create' | 'update'): any {
    const properties: any = {};
    const required: string[] = [];

    for (const field of fields) {
      if (field.primaryKey) continue; // 跳过主键字段

      properties[field.code] = {
        type: this.mapFieldTypeToJsonSchema(field.type),
        description: field.comment || field.name,
      };

      if (operation === 'create' && !field.nullable && !field.defaultValue) {
        required.push(field.code);
      }
    }

    return {
      type: 'object',
      properties,
      required,
    };
  }

  private generateResponseSchema(fields: Field[]): any {
    const properties: any = {};

    for (const field of fields) {
      properties[field.code] = {
        type: this.mapFieldTypeToJsonSchema(field.type),
        description: field.comment || field.name,
      };
    }

    return {
      type: 'object',
      properties,
    };
  }

  private generateFilterSchema(fields: Field[]): any {
    const filters: any = {};

    for (const field of fields) {
      if (field.indexed || field.primaryKey) {
        filters[field.code] = {
          type: this.mapFieldTypeToJsonSchema(field.type),
          description: `Filter by ${field.name}`,
        };
      }
    }

    return filters;
  }

  private mapFieldTypeToJsonSchema(fieldType: string): string {
    const typeMap: Record<string, string> = {
      'STRING': 'string',
      'TEXT': 'string',
      'INTEGER': 'number',
      'DECIMAL': 'number',
      'BOOLEAN': 'boolean',
      'DATE': 'string',
      'DATETIME': 'string',
      'TIME': 'string',
      'UUID': 'string',
      'JSON': 'object',
    };
    
    return typeMap[fieldType] || 'string';
  }

  private generateCreateImplementation(entity: Entity, fields: Field[]): string {
    return `
async create(data: any) {
  return await this.prisma.${entity.tableName}.create({
    data,
  });
}`;
  }

  private generateReadImplementation(entity: Entity, fields: Field[]): string {
    return `
async findById(id: string) {
  return await this.prisma.${entity.tableName}.findUnique({
    where: { id },
  });
}`;
  }

  private generateUpdateImplementation(entity: Entity, fields: Field[]): string {
    return `
async update(id: string, data: any) {
  return await this.prisma.${entity.tableName}.update({
    where: { id },
    data,
  });
}`;
  }

  private generateDeleteImplementation(entity: Entity, fields: Field[]): string {
    return `
async delete(id: string) {
  await this.prisma.${entity.tableName}.delete({
    where: { id },
  });
  return { success: true };
}`;
  }

  private generateListImplementation(entity: Entity, fields: Field[]): string {
    return `
async findMany(query: any) {
  const { page = 1, limit = 10, ...filters } = query;
  const skip = (page - 1) * limit;
  
  const [data, total] = await Promise.all([
    this.prisma.${entity.tableName}.findMany({
      where: filters,
      skip,
      take: limit,
    }),
    this.prisma.${entity.tableName}.count({
      where: filters,
    }),
  ]);
  
  return {
    data,
    total,
    page,
    limit,
  };
}`;
  }
}
