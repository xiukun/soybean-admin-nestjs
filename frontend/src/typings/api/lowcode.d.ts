declare namespace Api {
  namespace Lowcode {
    /** Project status */
    type ProjectStatus = 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';

    /** Deployment status */
    type DeploymentStatus = 'INACTIVE' | 'DEPLOYING' | 'DEPLOYED' | 'FAILED';

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
      /** Deployment status */
      deploymentStatus?: DeploymentStatus;
      /** Deployment port */
      deploymentPort?: number;
      /** Deployment configuration */
      deploymentConfig?: Record<string, any>;
      /** Last deployed time */
      lastDeployedAt?: string;
      /** Deployment logs */
      deploymentLogs?: string;
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
    interface ProjectSearchParams extends Common.CommonSearchParams {
      /** Project name or code search */
      search?: string;
      /** Project status */
      status?: ProjectStatus | null;
    }

    /** Project list */
    interface ProjectList extends Common.PaginatingQueryRecord<Project> {}

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
    interface EntitySearchParams extends Common.CommonSearchParams {
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
    interface EntityList extends Common.PaginatingQueryRecord<Entity> {}

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
    type FieldType =
      | 'VARCHAR'
      | 'TEXT'
      | 'INT'
      | 'BIGINT'
      | 'DECIMAL'
      | 'FLOAT'
      | 'DOUBLE'
      | 'BOOLEAN'
      | 'DATE'
      | 'DATETIME'
      | 'TIMESTAMP'
      | 'JSON'
      | 'UUID';

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

    /** API config list (Platform Management Format) */
    interface ApiConfigList extends Common.PaginatingQueryRecord {
      records: ApiConfig[];
    }

    /** API config for lowcode pages */
    interface ApiConfigLowcodeOption {
      /** Display label */
      label: string;
      /** Option value */
      value: string;
      /** API config ID */
      id: string;
      /** API name */
      name: string;
      /** HTTP method */
      method: HttpMethod;
      /** API path */
      path: string;
      /** Full API path */
      fullPath: string;
      /** API description */
      description?: string;
      /** API status */
      status: ApiConfigStatus;
      /** Has authentication */
      hasAuthentication: boolean;
      /** API URL for direct use */
      api: string;
      /** URL alias */
      url: string;
      /** Additional data for amis */
      data?: {
        api: string;
        method: string;
      };
    }

    /** API config list for lowcode pages (Amis Format) */
    interface ApiConfigLowcodeList {
      status: number;
      msg: string;
      data: {
        options: ApiConfigLowcodeOption[];
        page: number;
        perPage: number;
        total: number;
        totalPages: number;
      };
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
    type QueryStatus = 'DRAFT' | 'PUBLISHED' | 'DEPRECATED';

    /** Join type */
    type JoinType = 'INNER' | 'LEFT' | 'RIGHT' | 'FULL';

    /** Filter operator */
    type FilterOperator =
      | 'eq'
      | 'ne'
      | 'gt'
      | 'gte'
      | 'lt'
      | 'lte'
      | 'like'
      | 'in'
      | 'not_in'
      | 'is_null'
      | 'is_not_null';

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
      /** Query status */
      status?: QueryStatus;
      /** Generated SQL */
      sql?: string;
    }

    /** Field data type */
    /** Field data type */
    type FieldDataType =
      | 'STRING'
      | 'INTEGER'
      | 'DECIMAL'
      | 'BOOLEAN'
      | 'DATE'
      | 'DATETIME'
      | 'TEXT'
      | 'JSON'
      | 'UUID'
      | 'ENUM';

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
      defaultValue?: any;
      /** Field configuration */
      config?: Record<string, any>;
      /** Display order */
      displayOrder: number;
      /** Is common field */
      isCommon?: boolean;
      /** Enum values (when dataType is ENUM) */
      enumValues?: string[];
      /** Field metadata */
      metadata?: Record<string, any>;
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

    // ==================== 通用字段自动生成功能相关类型定义 ====================

    /** 通用字段配置选项 */
    interface CommonFieldOptions {
      /** 是否自动创建数据库表 */
      autoCreateTable?: boolean;
      /** 是否包含审计字段 */
      includeAuditFields?: boolean;
      /** 是否包含软删除字段 */
      includeSoftDelete?: boolean;
      /** 自定义通用字段 */
      customCommonFields?: string[];
    }

    /** 增强的实体创建请求 */
    interface EnhancedCreateEntityRequest extends EntityEdit {
      /** 通用字段配置 */
      commonFieldOptions?: CommonFieldOptions;
      /** 业务字段列表 */
      businessFields?: FieldEdit[];
    }

    /** 实体创建结果 */
    interface EntityCreationResult {
      /** 创建的实体 */
      entity: Entity;
      /** 自动添加的通用字段 */
      commonFields: Field[];
      /** 创建的业务字段 */
      businessFields: Field[];
      /** 数据库表创建状态 */
      tableCreated: boolean;
      /** 验证结果 */
      validation: EntityValidationResult;
    }

    /** 实体验证结果 */
    interface EntityValidationResult {
      /** 是否有效 */
      isValid: boolean;
      /** 错误列表 */
      errors: ValidationError[];
      /** 警告列表 */
      warnings: ValidationWarning[];
      /** 验证摘要 */
      summary: {
        /** 总字段数 */
        totalFields: number;
        /** 通用字段数 */
        commonFields: number;
        /** 业务字段数 */
        businessFields: number;
        /** 必填字段数 */
        requiredFields: number;
        /** 唯一字段数 */
        uniqueFields: number;
      };
    }

    /** 验证错误 */
    interface ValidationError {
      /** 字段名 */
      field: string;
      /** 错误消息 */
      message: string;
      /** 错误代码 */
      code: string;
    }

    /** 验证警告 */
    interface ValidationWarning {
      /** 字段名 */
      field: string;
      /** 警告消息 */
      message: string;
      /** 警告代码 */
      code: string;
    }

    /** 通用字段定义 */
    interface CommonFieldDefinition {
      /** 字段名称 */
      name: string;
      /** 字段编码 */
      code: string;
      /** 数据类型 */
      dataType: FieldDataType;
      /** 字段长度 */
      length?: number;
      /** 数字精度 */
      precision?: number;
      /** 是否必填 */
      required: boolean;
      /** 是否唯一 */
      unique: boolean;
      /** 默认值 */
      defaultValue?: string;
      /** 字段描述 */
      description: string;
      /** 显示顺序 */
      displayOrder: number;
    }
  }
}

/** 关系类型 */
type RelationshipType = 'ONE_TO_ONE' | 'ONE_TO_MANY' | 'MANY_TO_ONE' | 'MANY_TO_MANY';

/** 关系状态 */
type RelationshipStatus = 'ACTIVE' | 'INACTIVE';

/** 关系搜索参数 */
interface RelationshipSearchParams extends Api.Common.CommonSearchParams {
  /** 项目ID */
  projectId?: string;
  /** 关系类型 */
  type?: RelationshipType;
  /** 关系状态 */
  status?: RelationshipStatus;
  /** 搜索关键词 */
  search?: string;
}

/** 关系列表响应 */
interface RelationshipList extends Api.Common.PaginatingQueryRecord<Relationship> {}

/** 关系实体 */
interface Relationship {
  /** 关系ID */
  id: string;
  /** 关系名称 */
  name: string;
  /** 关系代码 */
  code: string;
  /** 关系类型 */
  type: RelationshipType;
  /** 源实体ID */
  sourceEntityId: string;
  /** 目标实体ID */
  targetEntityId: string;
  /** 外键字段 */
  foreignKeyField?: string;
  /** 级联删除 */
  cascadeDelete?: boolean;
  /** 级联更新 */
  cascadeUpdate?: boolean;
  /** 关系描述 */
  description?: string;
  /** 关系状态 */
  status: RelationshipStatus;
  /** 项目ID */
  projectId: string;
  /** 创建时间 */
  createdAt: string;
  /** 更新时间 */
  updatedAt: string;
  /** 源实体信息 */
  sourceEntity?: Entity;
  /** 目标实体信息 */
  targetEntity?: Entity;
}

/** 关系编辑参数 */
interface RelationshipEdit {
  /** 关系名称 */
  name: string;
  /** 关系代码 */
  code: string;
  /** 关系类型 */
  type: RelationshipType;
  /** 源实体ID */
  sourceEntityId: string;
  /** 目标实体ID */
  targetEntityId: string;
  /** 外键字段 */
  foreignKeyField?: string;
  /** 级联删除 */
  cascadeDelete?: boolean;
  /** 级联更新 */
  cascadeUpdate?: boolean;
  /** 关系描述 */
  description?: string;
  /** 关系状态 */
  status: RelationshipStatus;
  /** 项目ID */
  projectId: string;
}
