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
  }
};

export default lowcode;
