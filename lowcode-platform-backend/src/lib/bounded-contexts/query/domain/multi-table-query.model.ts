import { ulid } from 'ulid';

export interface JoinConfig {
  type: 'INNER' | 'LEFT' | 'RIGHT' | 'FULL';
  targetEntityId: string;
  sourceField: string;
  targetField: string;
  alias?: string;
}

export interface FieldSelection {
  entityId: string;
  fieldId: string;
  entityAlias?: string;
  alias?: string;
  aggregation?: 'COUNT' | 'SUM' | 'AVG' | 'MIN' | 'MAX';
}

export interface FilterCondition {
  field: string;
  entityAlias?: string;
  operator: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'like' | 'in' | 'not_in' | 'is_null' | 'is_not_null';
  value?: any;
  logicalOperator?: 'AND' | 'OR';
}

export interface SortConfig {
  field: string;
  entityAlias?: string;
  direction: 'ASC' | 'DESC';
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
  PUBLISHED = 'PUBLISHED',
  DEPRECATED = 'DEPRECATED',
}

export class MultiTableQuery {
  private constructor(
    public readonly id: string,
    public readonly projectId: string,
    public name: string,
    public baseEntityId: string,
    public baseEntityAlias: string,
    public joins: JoinConfig[],
    public fields: FieldSelection[],
    public filters: FilterCondition[],
    public sorting: SortConfig[],
    public groupBy: string[],
    public having: FilterCondition[],
    public status: QueryStatus,
    public readonly createdBy: string,
    public readonly createdAt: Date,
    public description?: string,
    public limit?: number,
    public offset?: number,
    public sqlQuery?: string,
    public executionStats?: {
      lastExecuted?: Date;
      executionTime?: number;
      resultCount?: number;
    },
    public updatedBy?: string,
    public updatedAt?: Date,
  ) {}

  static create(properties: MultiTableQueryProperties): MultiTableQuery {
    const id = ulid();
    const now = new Date();

    return new MultiTableQuery(
      id,
      properties.projectId,
      properties.name,
      properties.baseEntityId,
      properties.baseEntityAlias || 'main',
      properties.joins || [],
      properties.fields || [],
      properties.filters || [],
      properties.sorting || [],
      properties.groupBy || [],
      properties.having || [],
      QueryStatus.DRAFT,
      properties.createdBy,
      now,
      properties.description,
      properties.limit,
      properties.offset,
      undefined,
      undefined,
    );
  }

  static fromPersistence(data: MultiTableQueryPersistence): MultiTableQuery {
    return new MultiTableQuery(
      data.id,
      data.projectId,
      data.name,
      data.baseEntityId,
      data.baseEntityAlias || 'main',
      data.joins || [],
      data.fields || [],
      data.filters || [],
      data.sorting || [],
      data.groupBy || [],
      data.having || [],
      data.status,
      data.createdBy,
      data.createdAt,
      data.description,
      data.limit,
      data.offset,
      data.sqlQuery,
      data.executionStats,
      data.updatedBy,
      data.updatedAt,
    );
  }

  update(properties: Partial<MultiTableQueryProperties & { updatedBy: string }>): void {
    if (properties.name) this.name = properties.name;
    if (properties.description !== undefined) this.description = properties.description;
    if (properties.baseEntityId) this.baseEntityId = properties.baseEntityId;
    if (properties.baseEntityAlias) this.baseEntityAlias = properties.baseEntityAlias;
    if (properties.joins) this.joins = properties.joins;
    if (properties.fields) this.fields = properties.fields;
    if (properties.filters) this.filters = properties.filters;
    if (properties.sorting) this.sorting = properties.sorting;
    if (properties.groupBy) this.groupBy = properties.groupBy;
    if (properties.having) this.having = properties.having;
    if (properties.limit !== undefined) this.limit = properties.limit;
    if (properties.offset !== undefined) this.offset = properties.offset;
    if (properties.updatedBy) this.updatedBy = properties.updatedBy;
    this.updatedAt = new Date();
  }

  activate(): void {
    this.status = QueryStatus.PUBLISHED;
    this.updatedAt = new Date();
  }

  deactivate(): void {
    this.status = QueryStatus.DEPRECATED;
    this.updatedAt = new Date();
  }

  updateExecutionStats(executionTime: number, resultCount: number): void {
    this.executionStats = {
      lastExecuted: new Date(),
      executionTime,
      resultCount,
    };
    this.updatedAt = new Date();
  }

  setSqlQuery(sqlQuery: string): void {
    this.sqlQuery = sqlQuery;
    this.updatedAt = new Date();
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
      updatedBy: this.updatedBy,
      updatedAt: this.updatedAt,
    };
  }
}