import { ulid } from 'ulid';

export interface JoinConfig {
  type: 'INNER' | 'LEFT' | 'RIGHT' | 'FULL';
  targetEntityId: string;
  sourceField: string;
  targetField: string;
  alias?: string;
}

export interface FilterCondition {
  field: string;
  operator: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'like' | 'in' | 'not_in' | 'is_null' | 'is_not_null';
  value?: any;
  entityAlias?: string;
}

export interface SortConfig {
  field: string;
  direction: 'ASC' | 'DESC';
  entityAlias?: string;
}

export interface FieldSelection {
  field: string;
  alias?: string;
  entityAlias?: string;
  aggregation?: 'COUNT' | 'SUM' | 'AVG' | 'MIN' | 'MAX';
}

export interface MultiTableQueryProperties {
  projectId: string;
  name: string;
  description?: string;
  baseEntityId: string;
  baseEntityAlias?: string;
  joins: JoinConfig[];
  fields: FieldSelection[];
  filters: FilterCondition[];
  sorting: SortConfig[];
  groupBy?: string[];
  having?: FilterCondition[];
  limit?: number;
  offset?: number;
  createdBy: string;
}

export interface MultiTableQueryPersistence extends MultiTableQueryProperties {
  id: string;
  status: QueryStatus;
  sqlQuery?: string;
  executionStats?: {
    lastExecuted?: Date;
    executionTime?: number;
    resultCount?: number;
  };
  createdAt: Date;
  updatedAt: Date;
  updatedBy?: string;
}

export enum QueryStatus {
  DRAFT = 'DRAFT',
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

export class MultiTableQuery {
  private constructor(
    public readonly id: string,
    public readonly projectId: string,
    public readonly name: string,
    public readonly description: string | undefined,
    public readonly baseEntityId: string,
    public readonly baseEntityAlias: string,
    public readonly joins: JoinConfig[],
    public readonly fields: FieldSelection[],
    public readonly filters: FilterCondition[],
    public readonly sorting: SortConfig[],
    public readonly groupBy: string[],
    public readonly having: FilterCondition[],
    public readonly limit: number | undefined,
    public readonly offset: number | undefined,
    public readonly status: QueryStatus,
    public readonly sqlQuery: string | undefined,
    public readonly executionStats: any,
    public readonly createdBy: string,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    public readonly updatedBy: string | undefined,
  ) {}

  static create(properties: MultiTableQueryProperties): MultiTableQuery {
    // 验证基本属性
    if (!properties.projectId?.trim()) {
      throw new Error('Project ID is required');
    }

    if (!properties.name?.trim()) {
      throw new Error('Query name is required');
    }

    if (properties.name.length > 100) {
      throw new Error('Query name cannot exceed 100 characters');
    }

    if (!properties.baseEntityId?.trim()) {
      throw new Error('Base entity ID is required');
    }

    if (!properties.createdBy?.trim()) {
      throw new Error('Created by is required');
    }

    // 验证字段选择
    if (!properties.fields || properties.fields.length === 0) {
      throw new Error('At least one field must be selected');
    }

    // 验证连接配置
    this.validateJoins(properties.joins);

    // 验证过滤条件
    this.validateFilters(properties.filters);

    // 验证排序配置
    this.validateSorting(properties.sorting);

    const now = new Date();
    const baseAlias = properties.baseEntityAlias || 'base';

    return new MultiTableQuery(
      ulid(),
      properties.projectId,
      properties.name,
      properties.description,
      properties.baseEntityId,
      baseAlias,
      properties.joins || [],
      properties.fields,
      properties.filters || [],
      properties.sorting || [],
      properties.groupBy || [],
      properties.having || [],
      properties.limit,
      properties.offset,
      QueryStatus.DRAFT,
      undefined,
      undefined,
      properties.createdBy,
      now,
      now,
      undefined,
    );
  }

  static fromPersistence(data: MultiTableQueryPersistence): MultiTableQuery {
    return new MultiTableQuery(
      data.id,
      data.projectId,
      data.name,
      data.description,
      data.baseEntityId,
      data.baseEntityAlias || 'base',
      data.joins,
      data.fields,
      data.filters,
      data.sorting,
      data.groupBy || [],
      data.having || [],
      data.limit,
      data.offset,
      data.status,
      data.sqlQuery,
      data.executionStats,
      data.createdBy,
      data.createdAt,
      data.updatedAt,
      data.updatedBy,
    );
  }

  private static validateJoins(joins: JoinConfig[]): void {
    if (!joins) return;

    for (const join of joins) {
      if (!join.targetEntityId?.trim()) {
        throw new Error('Join target entity ID is required');
      }

      if (!join.sourceField?.trim()) {
        throw new Error('Join source field is required');
      }

      if (!join.targetField?.trim()) {
        throw new Error('Join target field is required');
      }

      if (!['INNER', 'LEFT', 'RIGHT', 'FULL'].includes(join.type)) {
        throw new Error('Invalid join type');
      }
    }
  }

  private static validateFilters(filters: FilterCondition[]): void {
    if (!filters) return;

    const validOperators = ['eq', 'ne', 'gt', 'gte', 'lt', 'lte', 'like', 'in', 'not_in', 'is_null', 'is_not_null'];

    for (const filter of filters) {
      if (!filter.field?.trim()) {
        throw new Error('Filter field is required');
      }

      if (!validOperators.includes(filter.operator)) {
        throw new Error('Invalid filter operator');
      }

      // 检查需要值的操作符
      const operatorsRequiringValue = ['eq', 'ne', 'gt', 'gte', 'lt', 'lte', 'like', 'in', 'not_in'];
      if (operatorsRequiringValue.includes(filter.operator) && filter.value === undefined) {
        throw new Error(`Filter operator ${filter.operator} requires a value`);
      }
    }
  }

  private static validateSorting(sorting: SortConfig[]): void {
    if (!sorting) return;

    for (const sort of sorting) {
      if (!sort.field?.trim()) {
        throw new Error('Sort field is required');
      }

      if (!['ASC', 'DESC'].includes(sort.direction)) {
        throw new Error('Invalid sort direction');
      }
    }
  }

  update(
    name?: string,
    description?: string,
    joins?: JoinConfig[],
    fields?: FieldSelection[],
    filters?: FilterCondition[],
    sorting?: SortConfig[],
    groupBy?: string[],
    having?: FilterCondition[],
    limit?: number,
    offset?: number,
    updatedBy?: string,
  ): MultiTableQuery {
    // 验证更新的数据
    if (name !== undefined) {
      if (!name.trim()) {
        throw new Error('Query name is required');
      }
      if (name.length > 100) {
        throw new Error('Query name cannot exceed 100 characters');
      }
    }

    if (joins !== undefined) {
      MultiTableQuery.validateJoins(joins);
    }

    if (fields !== undefined && fields.length === 0) {
      throw new Error('At least one field must be selected');
    }

    if (filters !== undefined) {
      MultiTableQuery.validateFilters(filters);
    }

    if (sorting !== undefined) {
      MultiTableQuery.validateSorting(sorting);
    }

    return new MultiTableQuery(
      this.id,
      this.projectId,
      name ?? this.name,
      description ?? this.description,
      this.baseEntityId,
      this.baseEntityAlias,
      joins ?? this.joins,
      fields ?? this.fields,
      filters ?? this.filters,
      sorting ?? this.sorting,
      groupBy ?? this.groupBy,
      having ?? this.having,
      limit ?? this.limit,
      offset ?? this.offset,
      this.status,
      undefined, // SQL query will be regenerated
      this.executionStats,
      this.createdBy,
      this.createdAt,
      new Date(),
      updatedBy ?? this.updatedBy,
    );
  }

  activate(): MultiTableQuery {
    if (this.status === QueryStatus.ACTIVE) {
      throw new Error('Query is already active');
    }

    return new MultiTableQuery(
      this.id,
      this.projectId,
      this.name,
      this.description,
      this.baseEntityId,
      this.baseEntityAlias,
      this.joins,
      this.fields,
      this.filters,
      this.sorting,
      this.groupBy,
      this.having,
      this.limit,
      this.offset,
      QueryStatus.ACTIVE,
      this.sqlQuery,
      this.executionStats,
      this.createdBy,
      this.createdAt,
      new Date(),
      this.updatedBy,
    );
  }

  deactivate(): MultiTableQuery {
    if (this.status === QueryStatus.INACTIVE) {
      throw new Error('Query is already inactive');
    }

    return new MultiTableQuery(
      this.id,
      this.projectId,
      this.name,
      this.description,
      this.baseEntityId,
      this.baseEntityAlias,
      this.joins,
      this.fields,
      this.filters,
      this.sorting,
      this.groupBy,
      this.having,
      this.limit,
      this.offset,
      QueryStatus.INACTIVE,
      this.sqlQuery,
      this.executionStats,
      this.createdBy,
      this.createdAt,
      new Date(),
      this.updatedBy,
    );
  }

  updateExecutionStats(executionTime: number, resultCount: number): MultiTableQuery {
    const newStats = {
      lastExecuted: new Date(),
      executionTime,
      resultCount,
    };

    return new MultiTableQuery(
      this.id,
      this.projectId,
      this.name,
      this.description,
      this.baseEntityId,
      this.baseEntityAlias,
      this.joins,
      this.fields,
      this.filters,
      this.sorting,
      this.groupBy,
      this.having,
      this.limit,
      this.offset,
      this.status,
      this.sqlQuery,
      newStats,
      this.createdBy,
      this.createdAt,
      new Date(),
      this.updatedBy,
    );
  }

  setSqlQuery(sqlQuery: string): MultiTableQuery {
    return new MultiTableQuery(
      this.id,
      this.projectId,
      this.name,
      this.description,
      this.baseEntityId,
      this.baseEntityAlias,
      this.joins,
      this.fields,
      this.filters,
      this.sorting,
      this.groupBy,
      this.having,
      this.limit,
      this.offset,
      this.status,
      sqlQuery,
      this.executionStats,
      this.createdBy,
      this.createdAt,
      this.updatedAt,
      this.updatedBy,
    );
  }

  toPersistence(): MultiTableQueryPersistence {
    return {
      id: this.id,
      projectId: this.projectId,
      name: this.name,
      description: this.description,
      baseEntityId: this.baseEntityId,
      baseEntityAlias: this.baseEntityAlias,
      joins: this.joins,
      fields: this.fields,
      filters: this.filters,
      sorting: this.sorting,
      groupBy: this.groupBy,
      having: this.having,
      limit: this.limit,
      offset: this.offset,
      status: this.status,
      sqlQuery: this.sqlQuery,
      executionStats: this.executionStats,
      createdBy: this.createdBy,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      updatedBy: this.updatedBy,
    };
  }
}
