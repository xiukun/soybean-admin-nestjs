declare namespace Api {
  namespace Lowcode {
    /** 关系类型 */
    type RelationshipType = 'ONE_TO_ONE' | 'ONE_TO_MANY' | 'MANY_TO_ONE' | 'MANY_TO_MANY';

    /** 级联操作类型 */
    type CascadeAction = 'RESTRICT' | 'CASCADE' | 'SET_NULL' | 'NO_ACTION';

    /** 关系状态 */
    type RelationshipStatus = 'ACTIVE' | 'INACTIVE';

    /** 关系 */
    interface Relationship {
      /** 关系ID */
      id: string;
      /** 项目ID */
      projectId: string;
      /** 关系名称 */
      name: string;
      /** 关系代码 */
      code: string;
      /** 关系描述 */
      description?: string;
      /** 关系类型 */
      type: RelationshipType;
      /** 源实体ID */
      sourceEntityId: string;
      /** 目标实体ID */
      targetEntityId: string;
      /** 源实体 */
      sourceEntity?: Entity;
      /** 目标实体 */
      targetEntity?: Entity;
      /** 外键字段 */
      foreignKeyField?: string;
      /** 删除时操作 */
      onDelete?: CascadeAction;
      /** 更新时操作 */
      onUpdate?: CascadeAction;
      /** 是否必填 */
      required?: boolean;
      /** 关系状态 */
      status: RelationshipStatus;
      /** 创建者 */
      createdBy: string;
      /** 创建时间 */
      createdAt: string;
      /** 更新者 */
      updatedBy?: string;
      /** 更新时间 */
      updatedAt?: string;
    }

    /** 关系搜索参数 */
    interface RelationshipSearchParams extends Common.CommonSearchParams {
      /** 项目ID */
      projectId: string;
      /** 关系名称或代码搜索 */
      search?: string;
      /** 关系类型 */
      type?: RelationshipType | null;
      /** 关系状态 */
      status?: RelationshipStatus | null;
    }

    /** 关系列表 */
    interface RelationshipList extends Common.PaginatingQueryRecord<Relationship> {
    }

    /** 关系编辑 */
    interface RelationshipEdit {
      /** 项目ID */
      projectId: string;
      /** 关系名称 */
      name: string;
      /** 关系代码 */
      code: string;
      /** 关系描述 */
      description?: string;
      /** 关系类型 */
      type: RelationshipType;
      /** 源实体ID */
      sourceEntityId: string;
      /** 目标实体ID */
      targetEntityId: string;
      /** 外键字段 */
      foreignKeyField?: string;
      /** 删除时操作 */
      onDelete?: CascadeAction;
      /** 更新时操作 */
      onUpdate?: CascadeAction;
      /** 是否必填 */
      required?: boolean;
      /** 关系状态 */
      status?: RelationshipStatus;
    }

    /** 关系统计 */
    interface RelationshipStats {
      /** 总关系数 */
      total: number;
      /** 一对一关系数 */
      oneToOne: number;
      /** 一对多关系数 */
      oneToMany: number;
      /** 多对一关系数 */
      manyToOne: number;
      /** 多对多关系数 */
      manyToMany: number;
      /** 活跃关系数 */
      active: number;
      /** 非活跃关系数 */
      inactive: number;
    }
  }
}