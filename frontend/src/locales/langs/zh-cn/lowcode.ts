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
    status: {
      ACTIVE: '活跃',
      INACTIVE: '非活跃',
      ARCHIVED: '已归档'
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
  codegen: {
    title: '代码生成',
    generate: '生成代码',
    template: '代码模板',
    output: '输出目录',
    progress: '生成进度',
    preview: '预览代码',
    download: '下载代码',
    status: {
      PENDING: '等待中',
      RUNNING: '生成中',
      SUCCESS: '成功',
      FAILED: '失败'
    },
    form: {
      template: {
        placeholder: '请选择代码模板',
        required: '请选择代码模板'
      },
      output: {
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
        placeholder: '请选择框架'
      },
      content: {
        placeholder: '请输入模板内容',
        required: '请输入模板内容'
      },
      tags: {
        placeholder: '请输入标签，多个标签用逗号分隔'
      }
    }
  },
  relationship: {
    title: '关系管理',
    addRelationship: '新增关系',
    editRelationship: '编辑关系',
    name: '关系名称',
    code: '关系代码',
    description: '关系描述',
    typeLabel: '关系类型',
    sourceEntity: '源实体',
    targetEntity: '目标实体',
    sourceField: '源字段',
    targetField: '目标字段',
    onDelete: '删除时',
    onUpdate: '更新时',
    type: {
      oneToOne: '一对一',
      oneToMany: '一对多',
      manyToOne: '多对一',
      manyToMany: '多对多'
    },
    types: {
      ONE_TO_ONE: '一对一',
      ONE_TO_MANY: '一对多',
      MANY_TO_ONE: '多对一',
      MANY_TO_MANY: '多对多'
    },
    status: {
      ACTIVE: '活跃',
      INACTIVE: '非活跃'
    },
    actions: {
      CASCADE: '级联',
      SET_NULL: '设为空',
      RESTRICT: '限制',
      NO_ACTION: '无操作'
    },
    cascade: {
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
      type: {
        placeholder: '请选择关系类型',
        required: '请选择关系类型'
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
      onDelete: {
        placeholder: '请选择删除时操作'
      },
      onUpdate: {
        placeholder: '请选择更新时操作'
      },
      status: {
        placeholder: '请选择状态'
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
