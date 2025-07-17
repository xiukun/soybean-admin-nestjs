import { Injectable } from '@nestjs/common';
import { 
  MultiTableQuery, 
  JoinConfig, 
  FilterCondition, 
  SortConfig, 
  FieldSelection 
} from './multi-table-query.model';

export interface EntityMetadata {
  id: string;
  tableName: string;
  fields: FieldMetadata[];
}

export interface FieldMetadata {
  name: string;
  type: string;
  nullable: boolean;
}

@Injectable()
export class SqlBuilderService {
  /**
   * 构建多表查询的SQL语句
   */
  buildQuery(
    query: MultiTableQuery, 
    entityMetadata: Map<string, EntityMetadata>
  ): { sql: string; parameters: any[] } {
    const baseEntity = entityMetadata.get(query.baseEntityId);
    if (!baseEntity) {
      throw new Error(`Base entity not found: ${query.baseEntityId}`);
    }

    const parameters: any[] = [];
    let parameterIndex = 1;

    // 构建SELECT子句
    const selectClause = this.buildSelectClause(query.fields, query.baseEntityAlias, entityMetadata);

    // 构建FROM子句
    const fromClause = `FROM ${baseEntity.tableName} AS ${query.baseEntityAlias}`;

    // 构建JOIN子句
    const joinClause = this.buildJoinClause(query.joins, query.baseEntityAlias, entityMetadata);

    // 构建WHERE子句
    const { whereClause, whereParameters } = this.buildWhereClause(
      query.filters, 
      parameterIndex, 
      entityMetadata
    );
    parameters.push(...whereParameters);
    parameterIndex += whereParameters.length;

    // 构建GROUP BY子句
    const groupByClause = this.buildGroupByClause(query.groupBy, query.baseEntityAlias);

    // 构建HAVING子句
    const { havingClause, havingParameters } = this.buildHavingClause(
      query.having, 
      parameterIndex, 
      entityMetadata
    );
    parameters.push(...havingParameters);
    parameterIndex += havingParameters.length;

    // 构建ORDER BY子句
    const orderByClause = this.buildOrderByClause(query.sorting, query.baseEntityAlias);

    // 构建LIMIT和OFFSET子句
    const limitClause = this.buildLimitClause(query.limit, query.offset);

    // 组合完整的SQL语句
    const sqlParts = [
      selectClause,
      fromClause,
      joinClause,
      whereClause,
      groupByClause,
      havingClause,
      orderByClause,
      limitClause,
    ].filter(part => part.trim() !== '');

    const sql = sqlParts.join('\n');

    return { sql, parameters };
  }

  /**
   * 构建SELECT子句
   */
  private buildSelectClause(
    fields: FieldSelection[], 
    baseAlias: string, 
    entityMetadata: Map<string, EntityMetadata>
  ): string {
    const fieldExpressions = fields.map(field => {
      const entityAlias = field.entityAlias || baseAlias;
      let expression = `${entityAlias}.${field.field}`;

      // 处理聚合函数
      if (field.aggregation) {
        expression = `${field.aggregation}(${expression})`;
      }

      // 处理字段别名
      if (field.alias) {
        expression += ` AS ${field.alias}`;
      }

      return expression;
    });

    return `SELECT ${fieldExpressions.join(', ')}`;
  }

  /**
   * 构建JOIN子句
   */
  private buildJoinClause(
    joins: JoinConfig[], 
    baseAlias: string, 
    entityMetadata: Map<string, EntityMetadata>
  ): string {
    if (!joins || joins.length === 0) {
      return '';
    }

    const joinClauses = joins.map(join => {
      const targetEntity = entityMetadata.get(join.targetEntityId);
      if (!targetEntity) {
        throw new Error(`Target entity not found: ${join.targetEntityId}`);
      }

      const targetAlias = join.alias || `t_${targetEntity.tableName}`;
      const joinType = join.type === 'INNER' ? 'INNER JOIN' : 
                      join.type === 'LEFT' ? 'LEFT JOIN' : 
                      join.type === 'RIGHT' ? 'RIGHT JOIN' : 
                      'FULL OUTER JOIN';

      return `${joinType} ${targetEntity.tableName} AS ${targetAlias} ON ${baseAlias}.${join.sourceField} = ${targetAlias}.${join.targetField}`;
    });

    return joinClauses.join('\n');
  }

  /**
   * 构建WHERE子句
   */
  private buildWhereClause(
    filters: FilterCondition[], 
    startParameterIndex: number, 
    entityMetadata: Map<string, EntityMetadata>
  ): { whereClause: string; whereParameters: any[] } {
    if (!filters || filters.length === 0) {
      return { whereClause: '', whereParameters: [] };
    }

    const parameters: any[] = [];
    let parameterIndex = startParameterIndex;

    const conditions = filters.map(filter => {
      const entityAlias = filter.entityAlias || 'base';
      const fieldExpression = `${entityAlias}.${filter.field}`;

      return this.buildCondition(filter, fieldExpression, parameters, parameterIndex++);
    });

    const whereClause = `WHERE ${conditions.join(' AND ')}`;
    return { whereClause, whereParameters: parameters };
  }

  /**
   * 构建HAVING子句
   */
  private buildHavingClause(
    having: FilterCondition[], 
    startParameterIndex: number, 
    entityMetadata: Map<string, EntityMetadata>
  ): { havingClause: string; havingParameters: any[] } {
    if (!having || having.length === 0) {
      return { havingClause: '', havingParameters: [] };
    }

    const parameters: any[] = [];
    let parameterIndex = startParameterIndex;

    const conditions = having.map(filter => {
      const entityAlias = filter.entityAlias || 'base';
      const fieldExpression = `${entityAlias}.${filter.field}`;

      return this.buildCondition(filter, fieldExpression, parameters, parameterIndex++);
    });

    const havingClause = `HAVING ${conditions.join(' AND ')}`;
    return { havingClause, havingParameters: parameters };
  }

  /**
   * 构建单个条件
   */
  private buildCondition(
    filter: FilterCondition, 
    fieldExpression: string, 
    parameters: any[], 
    parameterIndex: number
  ): string {
    switch (filter.operator) {
      case 'eq':
        parameters.push(filter.value);
        return `${fieldExpression} = $${parameterIndex}`;
      
      case 'ne':
        parameters.push(filter.value);
        return `${fieldExpression} != $${parameterIndex}`;
      
      case 'gt':
        parameters.push(filter.value);
        return `${fieldExpression} > $${parameterIndex}`;
      
      case 'gte':
        parameters.push(filter.value);
        return `${fieldExpression} >= $${parameterIndex}`;
      
      case 'lt':
        parameters.push(filter.value);
        return `${fieldExpression} < $${parameterIndex}`;
      
      case 'lte':
        parameters.push(filter.value);
        return `${fieldExpression} <= $${parameterIndex}`;
      
      case 'like':
        parameters.push(`%${filter.value}%`);
        return `${fieldExpression} LIKE $${parameterIndex}`;
      
      case 'in':
        if (!Array.isArray(filter.value)) {
          throw new Error('IN operator requires an array value');
        }
        const inPlaceholders = filter.value.map((_, i) => `$${parameterIndex + i}`).join(', ');
        parameters.push(...filter.value);
        return `${fieldExpression} IN (${inPlaceholders})`;
      
      case 'not_in':
        if (!Array.isArray(filter.value)) {
          throw new Error('NOT IN operator requires an array value');
        }
        const notInPlaceholders = filter.value.map((_, i) => `$${parameterIndex + i}`).join(', ');
        parameters.push(...filter.value);
        return `${fieldExpression} NOT IN (${notInPlaceholders})`;
      
      case 'is_null':
        return `${fieldExpression} IS NULL`;
      
      case 'is_not_null':
        return `${fieldExpression} IS NOT NULL`;
      
      default:
        throw new Error(`Unsupported operator: ${filter.operator}`);
    }
  }

  /**
   * 构建GROUP BY子句
   */
  private buildGroupByClause(groupBy: string[], baseAlias: string): string {
    if (!groupBy || groupBy.length === 0) {
      return '';
    }

    const groupFields = groupBy.map(field => {
      // 如果字段包含别名，直接使用；否则添加基础别名
      return field.includes('.') ? field : `${baseAlias}.${field}`;
    });

    return `GROUP BY ${groupFields.join(', ')}`;
  }

  /**
   * 构建ORDER BY子句
   */
  private buildOrderByClause(sorting: SortConfig[], baseAlias: string): string {
    if (!sorting || sorting.length === 0) {
      return '';
    }

    const sortExpressions = sorting.map(sort => {
      const entityAlias = sort.entityAlias || baseAlias;
      return `${entityAlias}.${sort.field} ${sort.direction}`;
    });

    return `ORDER BY ${sortExpressions.join(', ')}`;
  }

  /**
   * 构建LIMIT和OFFSET子句
   */
  private buildLimitClause(limit?: number, offset?: number): string {
    const clauses: string[] = [];

    if (limit !== undefined && limit > 0) {
      clauses.push(`LIMIT ${limit}`);
    }

    if (offset !== undefined && offset > 0) {
      clauses.push(`OFFSET ${offset}`);
    }

    return clauses.join(' ');
  }

  /**
   * 验证查询的安全性
   */
  validateQuerySecurity(query: MultiTableQuery): void {
    // 检查是否有潜在的SQL注入风险
    const dangerousPatterns = [
      /;\s*(drop|delete|update|insert|create|alter|truncate)/i,
      /union\s+select/i,
      /--/,
      /\/\*/,
      /\*\//,
    ];

    const queryString = JSON.stringify(query);
    
    for (const pattern of dangerousPatterns) {
      if (pattern.test(queryString)) {
        throw new Error('Query contains potentially dangerous SQL patterns');
      }
    }

    // 检查字段名和表名的合法性
    const validIdentifierPattern = /^[a-zA-Z_][a-zA-Z0-9_]*$/;

    query.fields.forEach(field => {
      if (!validIdentifierPattern.test(field.field)) {
        throw new Error(`Invalid field name: ${field.field}`);
      }
      if (field.alias && !validIdentifierPattern.test(field.alias)) {
        throw new Error(`Invalid field alias: ${field.alias}`);
      }
    });

    query.joins.forEach(join => {
      if (!validIdentifierPattern.test(join.sourceField)) {
        throw new Error(`Invalid source field: ${join.sourceField}`);
      }
      if (!validIdentifierPattern.test(join.targetField)) {
        throw new Error(`Invalid target field: ${join.targetField}`);
      }
    });
  }

  /**
   * 优化查询性能
   */
  optimizeQuery(query: MultiTableQuery): MultiTableQuery {
    // 如果没有排序，添加默认排序以确保结果一致性
    if (!query.sorting || query.sorting.length === 0) {
      const defaultSort = {
        field: 'id',
        direction: 'ASC' as const,
        entityAlias: query.baseEntityAlias,
      };
      
      return query.update(
        undefined, // name
        undefined, // description
        undefined, // joins
        undefined, // fields
        undefined, // filters
        [defaultSort], // sorting
      );
    }

    return query;
  }
}
