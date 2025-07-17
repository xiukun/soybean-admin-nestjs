declare namespace Api {
  namespace Lowcode {
    /** Project status */
    type ProjectStatus = 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';

    /** Project */
    interface Project {
      /** Project ID */
      id: string;
      /** Project name */
      name: string;
      /** Project code */
      code: string;
      /** Project description */
      description?: string;
      /** Project version */
      version: string;
      /** Project configuration */
      config?: Record<string, any>;
      /** Project status */
      status: ProjectStatus;
      /** Created by */
      createdBy: string;
      /** Created time */
      createdAt: string;
      /** Updated by */
      updatedBy?: string;
      /** Updated time */
      updatedAt?: string;
    }

    /** Project search params */
    interface ProjectSearchParams extends Common.PaginatingQueryRecord {
      /** Project name or code search */
      search?: string;
      /** Project status */
      status?: ProjectStatus | null;
    }

    /** Project list */
    interface ProjectList extends Common.PaginatingQueryRecord {
      projects: Project[];
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    }

    /** Project edit */
    interface ProjectEdit {
      /** Project name */
      name: string;
      /** Project code */
      code: string;
      /** Project description */
      description?: string;
      /** Project version */
      version: string;
      /** Project configuration */
      config?: Record<string, any>;
      /** Project status */
      status?: ProjectStatus;
    }

    /** Project statistics */
    interface ProjectStats {
      /** Total projects */
      total: number;
      /** Active projects */
      active: number;
      /** Inactive projects */
      inactive: number;
      /** Archived projects */
      archived: number;
    }

    /** Entity status */
    type EntityStatus = 'DRAFT' | 'PUBLISHED' | 'DEPRECATED';

    /** Entity */
    interface Entity {
      /** Entity ID */
      id: string;
      /** Project ID */
      projectId: string;
      /** Entity name */
      name: string;
      /** Entity code */
      code: string;
      /** Entity description */
      description?: string;
      /** Table name */
      tableName: string;
      /** Entity category */
      category: string;
      /** Entity version */
      version?: number;
      /** Entity configuration */
      config?: Record<string, any>;
      /** Entity status */
      status: EntityStatus;
      /** Created by */
      createdBy: string;
      /** Created time */
      createdAt: string;
      /** Updated by */
      updatedBy?: string;
      /** Updated time */
      updatedAt?: string;
    }

    /** Entity search params */
    interface EntitySearchParams extends Common.PaginatingQueryRecord {
      /** Project ID */
      projectId: string;
      /** Entity name or code search */
      search?: string;
      /** Entity status */
      status?: EntityStatus | null;
      /** Entity category */
      category?: string | null;
    }

    /** Entity list */
    interface EntityList extends Common.PaginatingQueryRecord {
      entities: Entity[];
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    }

    /** Entity edit */
    interface EntityEdit {
      /** Project ID */
      projectId: string;
      /** Entity name */
      name: string;
      /** Entity code */
      code: string;
      /** Entity description */
      description?: string;
      /** Table name */
      tableName: string;
      /** Entity category */
      category: string;
      /** Entity configuration */
      config?: Record<string, any>;
      /** Entity status */
      status?: EntityStatus;
    }

    /** Entity statistics */
    interface EntityStats {
      /** Total entities */
      total: number;
      /** Draft entities */
      draft: number;
      /** Published entities */
      published: number;
      /** Deprecated entities */
      deprecated: number;
    }

    /** Field type */
    type FieldType = 'VARCHAR' | 'TEXT' | 'INT' | 'BIGINT' | 'DECIMAL' | 'FLOAT' | 'DOUBLE' | 'BOOLEAN' | 'DATE' | 'DATETIME' | 'TIMESTAMP' | 'JSON' | 'UUID';

    /** Field */
    interface Field {
      /** Field ID */
      id: string;
      /** Entity ID */
      entityId: string;
      /** Field name */
      name: string;
      /** Field code */
      code: string;
      /** Field type */
      type: FieldType;
      /** Field length */
      length?: number;
      /** Field precision */
      precision?: number;
      /** Field scale */
      scale?: number;
      /** Is nullable */
      nullable: boolean;
      /** Is unique */
      unique: boolean;
      /** Is primary key */
      primaryKey: boolean;
      /** Is auto increment */
      autoIncrement: boolean;
      /** Default value */
      defaultValue?: any;
      /** Field comment */
      comment?: string;
      /** Field order */
      order: number;
      /** Created time */
      createdAt: string;
      /** Updated time */
      updatedAt: string;
    }

    /** Field edit */
    interface FieldEdit {
      /** Entity ID */
      entityId: string;
      /** Field name */
      name: string;
      /** Field code */
      code: string;
      /** Field type */
      type: FieldType;
      /** Field length */
      length?: number;
      /** Field precision */
      precision?: number;
      /** Field scale */
      scale?: number;
      /** Is nullable */
      nullable: boolean;
      /** Is unique */
      unique: boolean;
      /** Is primary key */
      primaryKey: boolean;
      /** Is auto increment */
      autoIncrement: boolean;
      /** Default value */
      defaultValue?: any;
      /** Field comment */
      comment?: string;
    }

    /** HTTP method */
    type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

    /** API config status */
    type ApiConfigStatus = 'ACTIVE' | 'INACTIVE';

    /** API config */
    interface ApiConfig {
      /** API config ID */
      id: string;
      /** Project ID */
      projectId: string;
      /** API name */
      name: string;
      /** API path */
      path: string;
      /** HTTP method */
      method: HttpMethod;
      /** API description */
      description?: string;
      /** Entity ID */
      entityId?: string;
      /** Query configuration */
      queryConfig: Record<string, any>;
      /** Response configuration */
      responseConfig: Record<string, any>;
      /** Auth required */
      authRequired: boolean;
      /** Rate limit configuration */
      rateLimit?: Record<string, any>;
      /** API status */
      status: ApiConfigStatus;
      /** Created by */
      createdBy: string;
      /** Created time */
      createdAt: string;
      /** Updated by */
      updatedBy?: string;
      /** Updated time */
      updatedAt?: string;
    }

    /** API config list */
    interface ApiConfigList extends Common.PaginatingQueryRecord {
      records: ApiConfig[];
    }

    /** API config search params */
    interface ApiConfigSearchParams extends Common.PaginatingQueryRecord {
      /** Project ID */
      projectId: string;
      /** API name or path search */
      search?: string;
      /** HTTP method */
      method?: HttpMethod | null;
      /** API status */
      status?: ApiConfigStatus | null;
    }

    /** API config edit */
    interface ApiConfigEdit {
      /** Project ID */
      projectId: string;
      /** API name */
      name: string;
      /** API path */
      path: string;
      /** HTTP method */
      method: HttpMethod;
      /** API description */
      description?: string;
      /** Entity ID */
      entityId?: string;
      /** Query configuration */
      queryConfig: Record<string, any>;
      /** Response configuration */
      responseConfig: Record<string, any>;
      /** Auth required */
      authRequired: boolean;
      /** Rate limit configuration */
      rateLimit?: Record<string, any>;
      /** API status */
      status?: ApiConfigStatus;
    }

    /** Template status */
    type TemplateStatus = 'DRAFT' | 'PUBLISHED' | 'DEPRECATED';

    /** Template variable */
    interface TemplateVariable {
      /** Variable name */
      name: string;
      /** Variable type */
      type: 'string' | 'number' | 'boolean' | 'array' | 'object';
      /** Variable description */
      description?: string;
      /** Default value */
      defaultValue?: any;
      /** Is required */
      required: boolean;
      /** Validation rules */
      validation?: Record<string, any>;
    }

    /** Code template */
    interface CodeTemplate {
      /** Template ID */
      id: string;
      /** Project ID */
      projectId: string;
      /** Template name */
      name: string;
      /** Template description */
      description?: string;
      /** Template category */
      category: string;
      /** Programming language */
      language: string;
      /** Framework */
      framework?: string;
      /** Template content */
      content: string;
      /** Template variables */
      variables: TemplateVariable[];
      /** Template tags */
      tags: string[];
      /** Is public */
      isPublic: boolean;
      /** Template status */
      status: TemplateStatus;
      /** Current version */
      currentVersion: string;
      /** Usage count */
      usageCount: number;
      /** Template rating */
      rating?: number;
      /** Created by */
      createdBy: string;
      /** Created time */
      createdAt: string;
      /** Updated by */
      updatedBy?: string;
      /** Updated time */
      updatedAt?: string;
    }

    /** Template list */
    interface TemplateList extends Common.PaginatingQueryRecord {
      records: CodeTemplate[];
    }

    /** Template search params */
    interface TemplateSearchParams extends Common.PaginatingQueryRecord {
      /** Project ID */
      projectId: string;
      /** Template name search */
      search?: string;
      /** Template category */
      category?: string | null;
      /** Programming language */
      language?: string | null;
      /** Framework */
      framework?: string | null;
      /** Template status */
      status?: TemplateStatus | null;
      /** Is public */
      isPublic?: boolean | null;
    }

    /** Template edit */
    interface TemplateEdit {
      /** Project ID */
      projectId: string;
      /** Template name */
      name: string;
      /** Template description */
      description?: string;
      /** Template category */
      category: string;
      /** Programming language */
      language: string;
      /** Framework */
      framework?: string;
      /** Template content */
      content: string;
      /** Template variables */
      variables: TemplateVariable[];
      /** Template tags */
      tags: string[];
      /** Is public */
      isPublic: boolean;
    }

    /** Query status */
    type QueryStatus = 'DRAFT' | 'ACTIVE' | 'INACTIVE';

    /** Join type */
    type JoinType = 'INNER' | 'LEFT' | 'RIGHT' | 'FULL';

    /** Filter operator */
    type FilterOperator = 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'like' | 'in' | 'not_in' | 'is_null' | 'is_not_null';

    /** Sort direction */
    type SortDirection = 'ASC' | 'DESC';

    /** Join configuration */
    interface JoinConfig {
      /** Join type */
      type: JoinType;
      /** Target entity ID */
      targetEntityId: string;
      /** Source field */
      sourceField: string;
      /** Target field */
      targetField: string;
      /** Join alias */
      alias?: string;
    }

    /** Filter condition */
    interface FilterCondition {
      /** Field name */
      field: string;
      /** Filter operator */
      operator: FilterOperator;
      /** Filter value */
      value?: any;
      /** Entity alias */
      entityAlias?: string;
    }

    /** Sort configuration */
    interface SortConfig {
      /** Field name */
      field: string;
      /** Sort direction */
      direction: SortDirection;
      /** Entity alias */
      entityAlias?: string;
    }

    /** Field selection */
    interface FieldSelection {
      /** Field name */
      field: string;
      /** Field alias */
      alias?: string;
      /** Entity alias */
      entityAlias?: string;
      /** Aggregation function */
      aggregation?: 'COUNT' | 'SUM' | 'AVG' | 'MIN' | 'MAX';
    }

    /** Multi-table query */
    interface MultiTableQuery {
      /** Query ID */
      id: string;
      /** Project ID */
      projectId: string;
      /** Query name */
      name: string;
      /** Query description */
      description?: string;
      /** Base entity ID */
      baseEntityId: string;
      /** Base entity alias */
      baseEntityAlias: string;
      /** Join configurations */
      joins: JoinConfig[];
      /** Field selections */
      fields: FieldSelection[];
      /** Filter conditions */
      filters: FilterCondition[];
      /** Sort configurations */
      sorting: SortConfig[];
      /** Group by fields */
      groupBy: string[];
      /** Having conditions */
      having: FilterCondition[];
      /** Result limit */
      limit?: number;
      /** Result offset */
      offset?: number;
      /** Query status */
      status: QueryStatus;
      /** Generated SQL */
      sqlQuery?: string;
      /** Execution statistics */
      executionStats?: {
        lastExecuted?: string;
        executionTime?: number;
        resultCount?: number;
      };
      /** Created by */
      createdBy: string;
      /** Created time */
      createdAt: string;
      /** Updated by */
      updatedBy?: string;
      /** Updated time */
      updatedAt?: string;
    }

    /** Query list */
    interface QueryList extends Common.PaginatingQueryRecord {
      records: MultiTableQuery[];
    }

    /** Query search params */
    interface QuerySearchParams extends Common.PaginatingQueryRecord {
      /** Project ID */
      projectId: string;
      /** Query name search */
      search?: string;
      /** Query status */
      status?: QueryStatus | null;
      /** Base entity ID */
      baseEntityId?: string | null;
    }

    /** Query edit */
    interface QueryEdit {
      /** Project ID */
      projectId: string;
      /** Query name */
      name: string;
      /** Query description */
      description?: string;
      /** Base entity ID */
      baseEntityId: string;
      /** Base entity alias */
      baseEntityAlias?: string;
      /** Join configurations */
      joins: JoinConfig[];
      /** Field selections */
      fields: FieldSelection[];
      /** Filter conditions */
      filters: FilterCondition[];
      /** Sort configurations */
      sorting: SortConfig[];
      /** Group by fields */
      groupBy?: string[];
      /** Having conditions */
      having?: FilterCondition[];
      /** Result limit */
      limit?: number;
      /** Result offset */
      offset?: number;
    }

    /** Field data type */
    type FieldDataType = 'STRING' | 'INTEGER' | 'DECIMAL' | 'BOOLEAN' | 'DATE' | 'DATETIME' | 'TEXT' | 'JSON';

    /** Field */
    interface Field {
      /** Field ID */
      id: string;
      /** Entity ID */
      entityId: string;
      /** Field name */
      name: string;
      /** Field code */
      code: string;
      /** Field description */
      description?: string;
      /** Data type */
      dataType: FieldDataType;
      /** Field length */
      length?: number;
      /** Decimal places */
      precision?: number;
      /** Is required */
      required: boolean;
      /** Is unique */
      unique: boolean;
      /** Default value */
      defaultValue?: string;
      /** Field configuration */
      config?: Record<string, any>;
      /** Display order */
      displayOrder: number;
      /** Created by */
      createdBy: string;
      /** Created time */
      createdAt: string;
      /** Updated by */
      updatedBy?: string;
      /** Updated time */
      updatedAt?: string;
    }

    /** Field search params */
    interface FieldSearchParams extends Common.PaginatingQueryRecord {
      /** Entity ID */
      entityId: string;
      /** Field name or code search */
      search?: string;
      /** Data type */
      dataType?: FieldDataType | null;
    }

    /** Field list */
    interface FieldList extends Common.PaginatingQueryRecord {
      fields: Field[];
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    }

    /** Field edit */
    interface FieldEdit {
      /** Entity ID */
      entityId: string;
      /** Field name */
      name: string;
      /** Field code */
      code: string;
      /** Field description */
      description?: string;
      /** Data type */
      dataType: FieldDataType;
      /** Field length */
      length?: number;
      /** Decimal places */
      precision?: number;
      /** Is required */
      required: boolean;
      /** Is unique */
      unique: boolean;
      /** Default value */
      defaultValue?: string;
      /** Field configuration */
      config?: Record<string, any>;
      /** Display order */
      displayOrder: number;
    }
  }
}
