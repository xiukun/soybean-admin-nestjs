declare namespace Api {
  namespace Lowcode {
    /** 通用字段定义 */
    interface CommonFieldDefinition {
      /** 字段名称 */
      name: string;
      /** 字段代码 */
      code: string;
      /** 字段描述 */
      description: string;
      /** 数据类型 */
      dataType: FieldDataType;
      /** 字段长度 */
      length?: number;
      /** 精度 */
      precision?: number;
      /** 是否必填 */
      required: boolean;
      /** 是否唯一 */
      unique: boolean;
      /** 默认值 */
      defaultValue?: any;
      /** 字段配置 */
      config?: Record<string, any>;
      /** 显示顺序 */
      displayOrder: number;
      /** 字段元数据 */
      metadata?: Record<string, any>;
    }

    /** 通用字段选项 */
    interface CommonFieldOptions {
      /** 启用通用字段 */
      enabled: boolean;
      /** 自动创建数据库表 */
      autoCreateTable: boolean;
      /** 自定义字段配置 */
      customConfigs?: Record<string, any>;
    }

    /** 增强的创建实体请求 */
    interface EnhancedCreateEntityRequest extends CreateEntityRequest {
      /** 通用字段选项 */
      commonFieldOptions?: CommonFieldOptions;
      /** 额外字段定义 */
      additionalFields?: Partial<Field>[];
    }

    /** 实体创建结果 */
    interface EntityCreationResult {
      /** 创建的实体 */
      entity: Entity;
      /** 创建的字段 */
      fields: Field[];
      /** 验证错误 */
      errors: string[];
      /** 验证警告 */
      warnings: string[];
      /** 数据库表是否已创建 */
      tableCreated: boolean;
    }

    /** 实体验证结果 */
    interface EntityValidationResult {
      /** 验证错误 */
      errors: string[];
      /** 验证警告 */
      warnings: string[];
      /** 字段验证结果 */
      fieldValidations: FieldValidationResult[];
    }

    /** 字段验证结果 */
    interface FieldValidationResult {
      /** 字段ID */
      fieldId: string;
      /** 字段名称 */
      fieldName: string;
      /** 验证错误 */
      errors: string[];
      /** 验证警告 */
      warnings: string[];
    }

    /** 数据库模式信息 */
    interface DatabaseSchemaInfo {
      /** 表名 */
      tableName: string;
      /** 列定义 */
      columns: ColumnDefinition[];
      /** 索引 */
      indexes: IndexDefinition[];
      /** 约束 */
      constraints: ConstraintDefinition[];
    }

    /** 列定义 */
    interface ColumnDefinition {
      /** 列名 */
      name: string;
      /** 数据类型 */
      type: string;
      /** 是否可空 */
      nullable: boolean;
      /** 默认值 */
      defaultValue?: any;
      /** 是否主键 */
      isPrimaryKey: boolean;
      /** 是否唯一 */
      isUnique: boolean;
    }

    /** 索引定义 */
    interface IndexDefinition {
      /** 索引名 */
      name: string;
      /** 列名 */
      columns: string[];
      /** 是否唯一 */
      unique: boolean;
    }

    /** 约束定义 */
    interface ConstraintDefinition {
      /** 约束名 */
      name: string;
      /** 约束类型 */
      type: 'PRIMARY_KEY' | 'FOREIGN_KEY' | 'UNIQUE' | 'CHECK';
      /** 列名 */
      columns: string[];
      /** 引用表（外键） */
      referencedTable?: string;
      /** 引用列（外键） */
      referencedColumns?: string[];
    }
  }
}
