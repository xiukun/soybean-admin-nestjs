/**
 * Namespace Api.Lowcode
 *
 * All lowcode api type
 */
declare namespace Api {
  namespace Lowcode {
    /** 实体状态 */
    type EntityStatus = 'ACTIVE' | 'INACTIVE';

    /** 字段数据类型 */
    type FieldDataType = 
      | 'STRING' 
      | 'INTEGER' 
      | 'LONG' 
      | 'DOUBLE' 
      | 'BOOLEAN' 
      | 'DATE' 
      | 'DATETIME' 
      | 'TEXT' 
      | 'JSON';

    /** 实体分类 */
    type EntityCategory = 'core' | 'business' | 'system' | 'config' | 'lookup' | 'log';

    /** 关系类型 */
    type RelationshipType = "ONE_TO_ONE" | "ONE_TO_MANY" | "MANY_TO_ONE" | "MANY_TO_MANY";

    /** 关系状态 */
    type RelationshipStatus = "ACTIVE" | "INACTIVE";

    /** 实体 */
    interface Entity {
      /** 实体ID */
      id: string;
      /** 实体名称 */
      name: string;
      /** 实体代码 */
      code: string;
      /** 表名 */
      tableName: string;
      /** 实体描述 */
      description?: string;
      /** 实体状态 */
      status: EntityStatus;
      /** 实体分类 */
      category: EntityCategory;
      /** 项目ID */
      projectId: string;
      /** 创建时间 */
      createdAt: string;
      /** 更新时间 */
      updatedAt: string;
    }

    /** 字段 */
    interface Field {
      /** 字段ID */
      id: string;
      /** 字段名称 */
      name: string;
      /** 字段代码 */
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
      /** 实体ID */
      entityId: string;
      /** 项目ID */
      projectId: string;
      /** 创建时间 */
      createdAt: string;
      /** 更新时间 */
      updatedAt: string;
    }

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

    /** 项目 */
    interface Project {
      /** 项目ID */
      id: string;
      /** 项目名称 */
      name: string;
      /** 项目代码 */
      code: string;
      /** 项目描述 */
      description?: string;
      /** 创建时间 */
      createdAt: string;
      /** 更新时间 */
      updatedAt: string;
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