const lowcode: App.I18n.Schema['page']['lowcode'] = {
  project: {
    title: '项目管理',
    addProject: '新增项目',
    editProject: '编辑项目',
    name: '项目名称',
    code: '项目代码',
    description: '项目描述',
    version: '版本号',
    status: {
      ACTIVE: '活跃',
      INACTIVE: '非活跃',
      ARCHIVED: '已归档'
    },
    form: {
      name: {
        placeholder: '请输入项目名称',
        required: '请输入项目名称'
      },
      code: {
        placeholder: '请输入项目代码',
        required: '请输入项目代码'
      },
      description: {
        placeholder: '请输入项目描述'
      },
      version: {
        placeholder: '请输入版本号',
        required: '请输入版本号'
      },
      status: {
        placeholder: '请选择项目状态'
      }
    }
  },
  entity: {
    title: '实体管理',
    addEntity: '新增实体',
    editEntity: '编辑实体',
    name: '实体名称',
    code: '实体代码',
    description: '实体描述',
    tableName: '表名',
    category: '实体分类',
    status: {
      DRAFT: '草稿',
      ACTIVE: '活跃',
      INACTIVE: '非活跃',
      ARCHIVED: '已归档'
    },
    categories: {
      core: '核心',
      business: '业务',
      system: '系统',
      config: '配置'
    },
    form: {
      name: {
        placeholder: '请输入实体名称',
        required: '请输入实体名称'
      },
      code: {
        placeholder: '请输入实体代码',
        required: '请输入实体代码'
      },
      description: {
        placeholder: '请输入实体描述'
      },
      tableName: {
        placeholder: '请输入表名',
        required: '请输入表名'
      },
      category: {
        placeholder: '请选择实体分类',
        required: '请选择实体分类'
      },
      status: {
        placeholder: '请选择实体状态'
      }
    }
  },
  field: {
    title: '字段管理',
    addField: '新增字段',
    editField: '编辑字段',
    name: '字段名称',
    code: '字段代码',
    description: '字段描述',
    dataType: '数据类型',
    length: '长度',
    precision: '精度',
    required: '必填',
    unique: '唯一',
    defaultValue: '默认值',
    displayOrder: '显示顺序',
    dataTypes: {
      STRING: '字符串',
      INTEGER: '整数',
      DECIMAL: '小数',
      BOOLEAN: '布尔值',
      DATE: '日期',
      DATETIME: '日期时间',
      TEXT: '文本',
      JSON: 'JSON'
    },
    form: {
      name: {
        placeholder: '请输入字段名称',
        required: '请输入字段名称'
      },
      code: {
        placeholder: '请输入字段代码',
        required: '请输入字段代码'
      },
      description: {
        placeholder: '请输入字段描述'
      },
      dataType: {
        placeholder: '请选择数据类型',
        required: '请选择数据类型'
      },
      length: {
        placeholder: '请输入长度'
      },
      precision: {
        placeholder: '请输入精度'
      },
      defaultValue: {
        placeholder: '请输入默认值'
      },
      displayOrder: {
        placeholder: '请输入显示顺序',
        required: '请输入显示顺序'
      }
    }
  },
  api: {
    title: 'API管理',
    addApi: '新增API',
    editApi: '编辑API',
    name: 'API名称',
    code: 'API代码',
    path: 'API路径',
    method: '请求方法',
    description: 'API描述',
    version: '版本号',
    status: {
      DRAFT: '草稿',
      PUBLISHED: '已发布',
      DEPRECATED: '已废弃'
    },
    methods: {
      GET: 'GET',
      POST: 'POST',
      PUT: 'PUT',
      DELETE: 'DELETE',
      PATCH: 'PATCH'
    },
    form: {
      name: {
        placeholder: '请输入API名称',
        required: '请输入API名称'
      },
      code: {
        placeholder: '请输入API代码',
        required: '请输入API代码'
      },
      path: {
        placeholder: '请输入API路径',
        required: '请输入API路径'
      },
      method: {
        placeholder: '请选择请求方法',
        required: '请选择请求方法'
      },
      description: {
        placeholder: '请输入API描述'
      },
      version: {
        placeholder: '请输入版本号',
        required: '请输入版本号'
      },
      status: {
        placeholder: '请选择API状态'
      }
    }
  },
  codeGeneration: {
    title: '代码生成',
    project: '项目',
    entity: '实体',
    template: '代码模板',
    outputPath: '输出目录',
    generate: '生成代码',
    progress: '生成进度',
    logs: '生成日志',
    result: '生成结果',
    fileList: '文件列表',
    fileContent: '文件内容',
    status: {
      PENDING: '等待中',
      RUNNING: '生成中',
      SUCCESS: '成功',
      FAILED: '失败'
    },
    form: {
      project: {
        placeholder: '请选择项目',
        required: '请选择项目'
      },
      entity: {
        placeholder: '请选择实体'
      },
      template: {
        placeholder: '请选择代码模板',
        required: '请选择代码模板'
      },
      outputPath: {
        placeholder: '请输入输出目录',
        required: '请输入输出目录'
      }
    }
  },
  template: {
    title: '模板管理',
    addTemplate: '新增模板',
    editTemplate: '编辑模板',
    name: '模板名称',
    code: '模板代码',
    description: '模板描述',
    category: '模板分类',
    language: '编程语言',
    framework: '框架',
    content: '模板内容',
    variables: '模板变量',
    tags: '标签',
    isPublic: '公开模板',
    categories: {
      CONTROLLER: '控制器',
      SERVICE: '服务',
      MODEL: '模型',
      DTO: '数据传输对象',
      COMPONENT: '组件',
      PAGE: '页面',
      CONFIG: '配置',
      TEST: '测试'
    },
    languages: {
      TYPESCRIPT: 'TypeScript',
      JAVASCRIPT: 'JavaScript',
      JAVA: 'Java',
      PYTHON: 'Python',
      CSHARP: 'C#',
      GO: 'Go'
    },
    frameworks: {
      NESTJS: 'NestJS',
      EXPRESS: 'Express',
      SPRING: 'Spring Boot',
      DJANGO: 'Django',
      DOTNET: '.NET Core',
      GIN: 'Gin'
    },
    form: {
      name: {
        placeholder: '请输入模板名称',
        required: '请输入模板名称'
      },
      code: {
        placeholder: '请输入模板代码',
        required: '请输入模板代码'
      },
      description: {
        placeholder: '请输入模板描述'
      },
      category: {
        placeholder: '请选择模板分类',
        required: '请选择模板分类'
      },
      language: {
        placeholder: '请选择编程语言',
        required: '请选择编程语言'
      },
      framework: {
        placeholder: '请选择框架',
        required: '请选择框架'
      },
      content: {
        placeholder: '请输入模板内容',
        required: '请输入模板内容'
      },
      variables: {
        placeholder: '请输入模板变量'
      },
      tags: {
        placeholder: '请输入标签，多个标签用逗号分隔'
      }
    }
  },
  relation: {
    title: '关系管理',
    addRelation: '新增关系',
    editRelation: '编辑关系',
    name: '关系名称',
    code: '关系代码',
    description: '关系描述',
    sourceEntity: '源实体',
    targetEntity: '目标实体',
    sourceField: '源字段',
    targetField: '目标字段',
    relationType: '关系类型',
    onDelete: '删除时',
    onUpdate: '更新时',
    relationTypes: {
      ONE_TO_ONE: '一对一',
      ONE_TO_MANY: '一对多',
      MANY_TO_ONE: '多对一',
      MANY_TO_MANY: '多对多'
    },
    cascadeActions: {
      CASCADE: '级联',
      SET_NULL: '设为空',
      RESTRICT: '限制',
      NO_ACTION: '无操作'
    },
    form: {
      name: {
        placeholder: '请输入关系名称',
        required: '请输入关系名称'
      },
      code: {
        placeholder: '请输入关系代码',
        required: '请输入关系代码'
      },
      description: {
        placeholder: '请输入关系描述'
      },
      sourceEntity: {
        placeholder: '请选择源实体',
        required: '请选择源实体'
      },
      targetEntity: {
        placeholder: '请选择目标实体',
        required: '请选择目标实体'
      },
      sourceField: {
        placeholder: '请选择源字段',
        required: '请选择源字段'
      },
      targetField: {
        placeholder: '请选择目标字段',
        required: '请选择目标字段'
      },
      relationType: {
        placeholder: '请选择关系类型',
        required: '请选择关系类型'
      },
      onDelete: {
        placeholder: '请选择删除时操作'
      },
      onUpdate: {
        placeholder: '请选择更新时操作'
      }
    }
  },
  query: {
    title: '查询管理',
    addQuery: '新增查询',
    editQuery: '编辑查询',
    name: '查询名称',
    code: '查询代码',
    description: '查询描述',
    sql: 'SQL语句',
    parameters: '查询参数',
    result: '查询结果',
    execute: '执行查询',
    save: '保存查询',
    baseEntity: '基础实体',
    baseEntityAlias: '基础实体别名',
    joinCount: '关联数量',
    fieldCount: '字段数量',
    filterCount: '过滤条件',
    lastExecuted: '最后执行',
    executeSuccess: '查询执行成功',
    executeFailed: '查询执行失败',
    noDataToExport: '没有数据可导出',
    exportComingSoon: '导出功能即将推出',
    generateSQLFailed: 'SQL生成失败',
    basicInfo: '基础信息',
    joins: '表关联',
    fields: '字段选择',
    filters: '过滤条件',
    sorting: '排序设置',
    joinType: '关联类型',
    targetEntity: '目标实体',
    sourceField: '源字段',
    targetField: '目标字段',
    alias: '别名',
    fieldName: '字段名',
    fieldAlias: '字段别名',
    entityAlias: '实体别名',
    aggregation: '聚合函数',
    operator: '操作符',
    value: '值',
    direction: '排序方向',
    addJoin: '添加关联',
    join: '关联',
    addField: '添加字段',
    field: '字段',
    addFilter: '添加过滤条件',
    filter: '过滤条件',
    addSort: '添加排序',
    sort: '排序',
    sqlPreview: 'SQL预览',
    generateSQL: '生成SQL',
    noSQL: '暂无SQL',
    executeError: '执行错误',
    noData: '暂无数据',
    info: '信息',
    executeTime: '执行时间',
    rowCount: '行数',
    columnCount: '列数',
    status: {
      DRAFT: '草稿',
      PUBLISHED: '已发布',
      DEPRECATED: '已废弃'
    },
    form: {
      name: {
        placeholder: '请输入查询名称',
        required: '请输入查询名称'
      },
      code: {
        placeholder: '请输入查询代码',
        required: '请输入查询代码'
      },
      description: {
        placeholder: '请输入查询描述'
      },
      sql: {
        placeholder: '请输入SQL语句',
        required: '请输入SQL语句'
      },
      baseEntity: {
        placeholder: '请选择基础实体',
        required: '请选择基础实体'
      },
      baseEntityAlias: {
        placeholder: '请输入基础实体别名',
        required: '请输入基础实体别名'
      },
      joinType: {
        placeholder: '请选择关联类型'
      },
      targetEntity: {
        placeholder: '请选择目标实体'
      },
      sourceField: {
        placeholder: '请输入源字段'
      },
      targetField: {
        placeholder: '请输入目标字段'
      },
      alias: {
        placeholder: '请输入别名'
      },
      fieldName: {
        placeholder: '请输入字段名'
      },
      fieldAlias: {
        placeholder: '请输入字段别名'
      },
      entityAlias: {
        placeholder: '请输入实体别名'
      },
      aggregation: {
        placeholder: '请选择聚合函数'
      },
      operator: {
        placeholder: '请选择操作符'
      },
      value: {
        placeholder: '请输入值'
      },
      direction: {
        placeholder: '请选择排序方向'
      }
    }
  },
  apiConfig: {
    title: 'API配置管理',
    addApiConfig: '新增API配置',
    editApiConfig: '编辑API配置',
    name: 'API名称',
    code: 'API代码',
    path: 'API路径',
    method: 'HTTP方法',
    description: '描述',
    version: '版本',
    entity: '关联实体',
    authRequired: '需要认证',
    test: '测试',
    testSuccess: 'API测试成功',
    testFailed: 'API测试失败',
    status: {
      ACTIVE: '启用',
      INACTIVE: '禁用'
    },
    methods: {
      GET: 'GET',
      POST: 'POST',
      PUT: 'PUT',
      DELETE: 'DELETE',
      PATCH: 'PATCH'
    },
    form: {
      name: {
        placeholder: '请输入API名称',
        required: '请输入API名称'
      },
      code: {
        placeholder: '请输入API代码',
        required: '请输入API代码'
      },
      path: {
        placeholder: '请输入API路径',
        required: '请输入API路径'
      },
      method: {
        placeholder: '请选择HTTP方法',
        required: '请选择HTTP方法'
      },
      description: {
        placeholder: '请输入描述'
      },
      version: {
        placeholder: '请输入版本',
        required: '请输入版本'
      },
      entity: {
        placeholder: '请选择关联实体'
      },
      authRequired: {
        placeholder: '请选择是否需要认证'
      },
      status: {
        placeholder: '请选择状态'
      }
    }
  },
  common: {
    search: {
      placeholder: '请输入搜索关键词'
    },
    actions: {
      add: '新增',
      edit: '编辑',
      delete: '删除',
      view: '查看',
      copy: '复制',
      export: '导出',
      import: '导入',
      refresh: '刷新',
      reset: '重置',
      submit: '提交',
      cancel: '取消',
      confirm: '确认',
      save: '保存',
      back: '返回',
      next: '下一步',
      previous: '上一步',
      finish: '完成'
    },
    status: {
      enabled: '启用',
      disabled: '禁用',
      active: '活跃',
      inactive: '非活跃',
      draft: '草稿',
      published: '已发布',
      archived: '已归档',
      deprecated: '已废弃'
    },
    messages: {
      success: '操作成功',
      error: '操作失败',
      loading: '加载中...',
      noData: '暂无数据',
      confirmDelete: '确认删除此项？',
      deleteSuccess: '删除成功',
      saveSuccess: '保存成功',
      updateSuccess: '更新成功',
      createSuccess: '创建成功'
    },
    validation: {
      required: '此字段为必填项',
      minLength: '长度不能少于{min}个字符',
      maxLength: '长度不能超过{max}个字符',
      email: '请输入有效的邮箱地址',
      phone: '请输入有效的手机号码',
      url: '请输入有效的URL地址',
      number: '请输入有效的数字',
      integer: '请输入有效的整数',
      positive: '请输入正数',
      unique: '此值已存在，请输入其他值'
    }
  }
};

export default lowcode;
