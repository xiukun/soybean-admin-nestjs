const lowcode: App.I18n.Schema['page']['lowcode'] = {
  project: {
    title: '项目管理',
    management: '项目管理',
    managementDesc: '管理和配置您的低代码项目',
    addProject: '新增项目',
    editProject: '编辑项目',
    create: '创建项目',
    edit: '编辑项目',
    import: '导入项目',
    export: '导出项目',
    open: '打开项目',
    duplicate: '复制项目',
    archive: '归档项目',
    name: '项目名称',
    code: '项目代码',
    description: '项目描述',
    version: '版本号',
    framework: '开发框架',
    architecture: '架构模式',
    language: '编程语言',
    database: '数据库',
    packageName: '包名',
    basePackage: '基础包名',
    author: '作者',
    outputPath: '输出路径',
    entities: '实体',
    templates: '模板',
    createdBy: '创建者',
    searchPlaceholder: '搜索项目名称、代码或描述',
    filterByStatus: '按状态筛选',
    filterByFramework: '按框架筛选',
    gridView: '网格视图',
    tableView: '表格视图',
    noDescription: '暂无描述',
    advancedConfig: '高级配置',
    importFromJson: '从JSON导入',
    importFromGit: '从Git导入',
    importFromFile: '从文件导入',
    gitUrl: 'Git仓库地址',
    gitUrlPlaceholder: '请输入Git仓库地址',
    branch: '分支',
    branchPlaceholder: '请输入分支名称',
    uploadFile: '点击或拖拽文件到此区域上传',
    supportedFormats: '支持 .json 和 .zip 格式',
    importJsonPlaceholder: '请粘贴项目JSON配置',
    nameRequired: '请输入项目名称',
    codeRequired: '请输入项目代码',
    frameworkRequired: '请选择开发框架',
    loadFailed: '加载项目失败',
    archiveConfirm: '确认归档此项目？',
    deleteConfirm: '确认删除此项目？此操作不可恢复！',
    archiveSuccess: '项目归档成功',
    invalidJsonFormat: 'JSON格式无效',
    gitImportNotImplemented: 'Git导入功能暂未实现',
    fileImportNotImplemented: '文件导入功能暂未实现',
    status: {
      ACTIVE: '活跃',
      INACTIVE: '非活跃',
      ARCHIVED: '已归档',
      active: '活跃',
      inactive: '非活跃',
      archived: '已归档'
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
      PUBLISHED: '已发布',
      DEPRECATED: '已废弃'
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
    selectProject: '选择项目',
    currentProject: '当前项目',
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
    usageCount: '使用次数',
    publish: '发布',
    publishSuccess: '模板发布成功',
    publishFailed: '模板发布失败',
    status: {
      DRAFT: '草稿',
      PUBLISHED: '已发布',
      DEPRECATED: '已废弃'
    },
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
      },
      status: {
        placeholder: '请选择状态'
      },
      project: {
        placeholder: '请选择项目'
      },
      variableValue: {
        stringPlaceholder: '请输入字符串值',
        numberPlaceholder: '请输入数字值',
        arrayPlaceholder: '请输入JSON数组，如: ["item1", "item2"]',
        objectPlaceholder: '请输入JSON对象，如: {"key": "value"}'
      }
    },
    preview: '预览',
    validate: '验证',
    test: '测试',
    previewResult: '预览结果',
    output: '输出结果',
    validation: '验证结果',
    testResult: '测试结果',
    validationSuccess: '模板验证通过',
    validationFailed: '模板验证失败',
    testPassed: '测试通过',
    testFailed: '测试失败',
    errors: '错误',
    warnings: '警告',
    suggestions: '建议',
    extractedVariables: '提取的变量',
    usedVariables: '已使用变量',
    unusedVariables: '未使用变量',
    variableAnalysis: '变量分析',
    actualOutput: '实际输出',
    addVariable: '添加变量',
    newVariable: '新变量',
    variableName: '变量名',
    variableType: '变量类型',
    variableValue: '变量值'
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
  relationship: {
    title: '关系管理',
    addRelationship: '新增关系',
    editRelationship: '编辑关系',
    sourceEntity: '源实体',
    targetEntity: '目标实体',
    relationType: '关系类型',
    relationshipName: '关系名称',
    description: '关系描述',
    cascadeDelete: '级联删除',
    required: '必填',
    relationTypes: {
      oneToOne: '一对一',
      oneToMany: '一对多',
      manyToOne: '多对一',
      manyToMany: '多对多'
    },
    form: {
      sourceEntity: {
        placeholder: '请选择源实体',
        required: '请选择源实体'
      },
      targetEntity: {
        placeholder: '请选择目标实体',
        required: '请选择目标实体'
      },
      relationType: {
        placeholder: '请选择关系类型',
        required: '请选择关系类型'
      },
      relationshipName: {
        placeholder: '请输入关系名称',
        required: '请输入关系名称'
      },
      description: {
        placeholder: '请输入关系描述'
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
    selectProject: '选择项目',
    currentProject: '当前项目',
    changeProject: '切换项目',
    test: '测试',
    quickExport: '快速导出',
    advancedSearch: '高级搜索',
    advancedSearchOptions: '高级搜索选项',
    selectMethod: '选择请求方法',
    selectStatus: '选择状态',
    selectAuth: '选择认证要求',
    dateRange: '日期范围',
    totalCount: '总数',
    selectedCount: '已选择',
    testSuccess: 'API测试成功',
    testFailed: 'API测试失败',
    name: 'API名称',
    code: 'API代码',
    path: 'API路径',
    method: 'HTTP方法',
    description: '描述',
    version: '版本',
    entity: '关联实体',
    authRequired: '需要认证',
    queryConfig: '查询配置',
    paginationEnabled: '启用分页',
    defaultPageSize: '默认页面大小',
    maxPageSize: '最大页面大小',
    responseConfig: '响应配置',
    responseFormat: '响应格式',
    responseWrapper: '响应包装器',
    securityConfig: '安全配置',
    rateLimitEnabled: '启用限流',
    rateLimitRequests: '限流请求数',
    rateLimitWindow: '限流时间窗口',
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
        required: '请输入API路径',
        invalid: 'API路径必须以/开头'
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
      },
      responseFormat: {
        placeholder: '请选择响应格式',
        required: '请选择响应格式'
      },
      defaultPageSize: {
        placeholder: '请输入默认页面大小'
      },
      maxPageSize: {
        placeholder: '请输入最大页面大小'
      },
      responseWrapper: {
        placeholder: '请输入响应包装器，如：data'
      },
      rateLimitRequests: {
        placeholder: '请输入限流请求数'
      },
      rateLimitWindow: {
        placeholder: '请输入限流时间窗口（秒）'
      },
      search: {
        placeholder: '请输入API名称或路径进行搜索'
      }
    },
    selector: {
      title: 'API配置选择器',
      platformFormat: '平台管理格式 (current/size + records)',
      lowcodeFormat: '低代码页面格式 (page/perPage + options)',
      selectApi: '选择API配置',
      selectApiPlaceholder: '请选择要使用的API配置',
      selectedApi: '选中的API配置',
      amisConfig: '生成的Amis配置'
    },
    tabs: {
      management: 'API配置管理',
      selector: '接口格式对比',
      batchOperations: '批量操作',
      onlineTest: '在线测试',
      versionManagement: '版本管理',
      documentation: '文档生成'
    },
    batchOperations: {
      title: '批量操作',
      export: {
        title: '批量导出',
        all: '导出全部',
        selected: '导出选中',
        allSuccess: '已成功导出所有API配置',
        selectedSuccess: '已成功导出 {count} 个API配置'
      },
      import: {
        title: '批量导入',
        button: '开始导入',
        dragText: '点击或拖拽文件到此区域上传',
        hintText: '支持 JSON、YAML 格式，单个文件大小不超过 10MB',
        overwrite: '覆盖已存在的配置',
        invalidFormat: '不支持的文件格式，请上传 JSON 或 YAML 文件',
        success: '导入成功：新建 {created} 个，更新 {updated} 个'
      },
      delete: {
        title: '批量删除',
        selected: '删除选中',
        confirm: '确定要删除选中的 {count} 个API配置吗？此操作不可撤销。',
        success: '已成功删除 {count} 个API配置'
      },
      template: {
        title: '模板下载',
        json: '下载JSON模板',
        yaml: '下载YAML模板',
        downloaded: '已下载 {format} 格式模板文件'
      }
    },
    onlineTest: {
      title: '在线API测试',
      history: '测试历史',
      selectApi: '选择API',
      apiInfo: 'API信息',
      testConfig: '测试配置',
      headers: '请求头',
      headerKey: '请求头名称',
      headerValue: '请求头值',
      addHeader: '添加请求头',
      queryParams: '查询参数',
      paramKey: '参数名',
      paramValue: '参数值',
      addParam: '添加参数',
      requestBody: '请求体',
      jsonPlaceholder: '请输入JSON格式的请求体',
      fieldKey: '字段名',
      fieldValue: '字段值',
      addField: '添加字段',
      rawPlaceholder: '请输入原始请求体内容',
      execute: '执行测试',
      saveCase: '保存用例',
      result: '测试结果',
      status: '状态码',
      time: '响应时间',
      responseHeaders: '响应头',
      responseBody: '响应体',
      formatted: '格式化',
      raw: '原始',
      testHistory: '测试历史',
      envVariables: '环境变量',
      variableKey: '变量名',
      variableValue: '变量值',
      addVariable: '添加变量',
      testCases: '测试用例',
      savedCases: '已保存的测试用例',
      noCases: '暂无保存的测试用例',
      load: '加载',
      createdAt: '创建时间',
      caseSaved: '测试用例已保存',
      caseLoaded: '测试用例已加载',
      caseDeleted: '测试用例已删除'
    },
    versionManagement: {
      title: 'API版本管理',
      selectApi: '选择API',
      currentVersion: '当前版本',
      versionHistory: '版本历史',
      versionCompare: '版本对比',
      createVersion: '创建版本',
      version: '版本',
      versionNumber: '版本号',
      versionPlaceholder: '请输入版本号，如：1.0.0',
      changeLog: '变更日志',
      changeLogPlaceholder: '请输入本次变更的详细说明',
      compare: '对比',
      rollback: '回滚',
      viewVersion: '查看版本 {version}',
      selectSecondVersion: '请选择第二个版本进行对比',
      compareReady: '版本对比已准备就绪',
      sameVersion: '不能选择相同的版本进行对比',
      versionCreated: '版本创建成功',
      createFailed: '版本创建失败',
      rollbackSuccess: '已成功回滚到版本 {version}',
      rollbackFailed: '版本回滚失败',
      loadFailed: '版本加载失败，使用模拟数据'
    },
    documentation: {
      title: 'API文档生成',
      generate: '生成文档',
      exportSwagger: '导出Swagger',
      selectProject: '选择项目',
      selectProjectFirst: '请先选择项目',
      includeInactive: '包含未激活的API',
      config: '文档配置',
      docTitle: '文档标题',
      docVersion: '文档版本',
      docDescription: '文档描述',
      docBaseUrl: '基础URL',
      titlePlaceholder: '请输入文档标题',
      versionPlaceholder: '请输入文档版本',
      descriptionPlaceholder: '请输入文档描述',
      baseUrlPlaceholder: '请输入基础URL',
      statistics: 'API统计',
      totalApis: '总API数',
      activeApis: '激活API数',
      inactiveApis: '未激活API数',
      methods: '方法类型',
      methodDistribution: '方法分布',
      preview: '文档预览',
      swaggerFormat: 'Swagger格式',
      markdownFormat: 'Markdown格式',
      htmlFormat: 'HTML格式',
      export: '导出文档',
      exportMarkdown: '导出Markdown',
      exportHtml: '导出HTML',
      exportPostman: '导出Postman集合',
      exportOpenAPI: '导出OpenAPI YAML',
      exportInsomnia: '导出Insomnia集合',
      generateSuccess: '文档生成成功',
      generateFailed: '文档生成失败',
      exportSuccess: '已成功导出 {format} 格式文档',
      exportFailed: '文档导出失败'
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
  },
  apiTest: {
    title: 'API测试',
    project: '项目',
    apiConfig: 'API配置',
    requestConfig: '请求配置',
    method: '请求方法',
    url: '请求URL',
    headers: '请求头',
    params: '请求参数',
    body: '请求体',
    response: '响应结果',
    status: '状态码',
    time: '响应时间',
    responseHeaders: '响应头',
    responseData: '响应数据',
    requestInfo: '请求信息',
    testApi: '测试API',
    clearResult: '清空结果',
    saveAsTemplate: '保存为模板',
    addHeader: '添加请求头',
    addParam: '添加参数',
    testSuccess: 'API测试成功',
    testFailed: 'API测试失败',
    saveAsTemplateNotImplemented: '保存为模板功能尚未实现',
    queryParams: '查询参数',
    test: '测试',
    form: {
      project: {
        placeholder: '请选择项目',
        required: '请选择项目'
      },
      apiConfig: {
        placeholder: '请选择API配置',
        required: '请选择API配置'
      },
      url: {
        placeholder: '请求URL将自动生成'
      },
      headerKey: {
        placeholder: '请求头名称'
      },
      headerValue: {
        placeholder: '请求头值'
      },
      paramKey: {
        placeholder: '参数名称'
      },
      paramValue: {
        placeholder: '参数值'
      },
      body: {
        placeholder: '请输入JSON格式的请求体'
      }
    }
  }
};

export default lowcode;
