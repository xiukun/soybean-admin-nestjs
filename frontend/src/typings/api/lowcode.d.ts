declare namespace Api {
  namespace LowcodePage {
    /** 低代码页面 */
    interface Page extends Api.Common.CommonRecord {
      /** 页面ID */
      id: string;
      /** 页面名称 */
      name: string;
      /** 页面标题 */
      title: string;
      /** 页面编码 */
      code: string;
      /** 页面描述 */
      description?: string;
      /** 页面路径 */
      path: string;
      /** 页面Schema配置 */
      schema: string;
      /** 关联菜单ID */
      menuId?: number;
      /** 状态 */
      status: Common.EnableStatus;
      /** 创建时间 */
      createdAt: string;
      /** 创建人 */
      createdBy: string;
      /** 更新时间 */
      updatedAt?: string;
      /** 更新人 */
      updatedBy?: string;
    }

    /** 低代码页面搜索参数 */
    interface PageSearchParams {
      /** current page number */
      current?: number;
      /** page size */
      size?: number;
      /** 页面名称 */
      name?: string;
      /** 状态 */
      status?: Common.EnableStatus | null;
    }

    /** 低代码页面列表 */
    interface PageList extends Common.PaginatingQueryRecord {
      records: Page[];
    }

    /** 低代码页面编辑 */
    interface PageEdit {
      /** 页面名称 */
      name: string;
      /** 页面标题 */
      title: string;
      /** 页面编码 */
      code: string;
      /** 页面描述 */
      description?: string;
      /** 页面路径 */
      path: string;
      /** 页面Schema配置 */
      schema: string;
      /** 关联菜单ID */
      menuId?: number;
      /** 状态 */
      status: Common.EnableStatus;
    }
  }

  namespace LowcodeModel {
    /** 低代码模型属性 */
    interface ModelProperty {
      /** 属性ID */
      id: string;
      /** 模型ID */
      modelId: string;
      /** 属性名称 */
      name: string;
      /** 属性编码 */
      code: string;
      /** 属性描述 */
      description?: string;
      /** 数据类型 */
      type: string;
      /** 长度 */
      length?: number;
      /** 精度 */
      precision?: number;
      /** 小数位数 */
      scale?: number;
      /** 是否可为空 */
      nullable: boolean;
      /** 默认值 */
      defaultValue?: string;
      /** 是否主键 */
      isPrimaryKey: boolean;
      /** 是否唯一 */
      isUnique: boolean;
      /** 是否索引 */
      isIndex: boolean;
      /** 创建时间 */
      createdAt: string;
      /** 创建人 */
      createdBy: string;
      /** 更新时间 */
      updatedAt?: string;
      /** 更新人 */
      updatedBy?: string;
    }

    /** 低代码模型关联 */
    interface ModelReference {
      /** 关联ID */
      id: string;
      /** 模型ID */
      modelId: string;
      /** 关联名称 */
      name: string;
      /** 源模型 */
      sourceModel: string;
      /** 源属性 */
      sourceProperty: string;
      /** 目标模型 */
      targetModel: string;
      /** 目标属性 */
      targetProperty: string;
      /** 关联类型 */
      relationType: string;
      /** 删除时操作 */
      onDelete?: string;
      /** 更新时操作 */
      onUpdate?: string;
      /** 创建时间 */
      createdAt: string;
      /** 创建人 */
      createdBy: string;
      /** 更新时间 */
      updatedAt?: string;
      /** 更新人 */
      updatedBy?: string;
    }

    /** 低代码模型 */
    interface Model extends Api.Common.CommonRecord {
      /** 模型ID */
      id: string;
      /** 模型名称 */
      name: string;
      /** 模型编码 */
      code: string;
      /** 模型描述 */
      description?: string;
      /** 对应表名 */
      tableName: string;
      /** 状态 */
      status: Common.EnableStatus;
      /** 创建时间 */
      createdAt: string;
      /** 创建人 */
      createdBy: string;
      /** 更新时间 */
      updatedAt?: string;
      /** 更新人 */
      updatedBy?: string;
      /** 模型属性 */
      properties?: ModelProperty[];
      /** 模型关联 */
      references?: ModelReference[];
    }

    /** 低代码模型搜索参数 */
    interface ModelSearchParams {
      /** current page number */
      current?: number;
      /** page size */
      size?: number;
      /** 模型名称 */
      name?: string;
      /** 状态 */
      status?: Common.EnableStatus | null;
      /** 是否包含关联数据 */
      withRelations?: boolean;
    }

    /** 低代码模型列表 */
    interface ModelList extends Common.PaginatingQueryRecord {
      records: Model[];
    }

    /** 低代码模型编辑 */
    interface ModelEdit {
      /** 模型名称 */
      name: string;
      /** 模型编码 */
      code: string;
      /** 模型描述 */
      description?: string;
      /** 对应表名 */
      tableName: string;
      /** 状态 */
      status: Common.EnableStatus;
      /** 模型属性 */
      properties?: Omit<ModelProperty, 'id' | 'modelId' | 'createdAt' | 'createdBy' | 'updatedAt' | 'updatedBy'>[];
      /** 模型关联 */
      references?: Omit<ModelReference, 'id' | 'modelId' | 'createdAt' | 'createdBy' | 'updatedAt' | 'updatedBy'>[];
    }
  }
}
