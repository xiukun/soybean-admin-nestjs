const lowcode: App.I18n.Schema['page']['lowcode'] = {
  dashboard: {
    title: '低代码平台仪表板',
    description: '欢迎使用低代码平台，快速构建您的应用程序',
    totalProjects: '总项目数',
    activeProjects: '活跃项目',
    totalEntities: '总实体数',
    totalTemplates: '总模板数',
    recentProjects: '最近项目',
    viewAll: '查看全部',
    quickActions: '快速操作',
    documentation: '文档',
  },
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
    createdAt: '创建时间',
    statusLabel: '状态',
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
    detail: '项目详情',
    basicInfo: '基本信息',
    techStackConfig: '技术栈配置',
    packageConfig: '包配置',
    databaseConfig: '数据库配置',
    generationConfig: '生成配置',
    openDesigner: '打开设计器',
    apis: 'API接口',
    codeGeneration: '代码生成',
    configuration: '项目配置',
    dbHost: '数据库主机',
    dbPort: '数据库端口',
    dbName: '数据库名称',
    dbUsername: '用户名',
    dbPassword: '密码',
    dbSchema: '数据库模式',
    testConnection: '测试连接',
    connectionSuccess: '数据库连接成功',
    connectionFailed: '数据库连接失败',
    enableSwagger: '启用Swagger',
    enableValidation: '启用数据验证',
    enableAudit: '启用审计日志',
    enableSoftDelete: '启用软删除',
    enablePagination: '启用分页',
    enableCaching: '启用缓存',
    relationships: '关系',
    generatedFiles: '生成文件',
    lastUpdated: '最后更新',
    techStack: '技术栈',
    progress: '进度',
    design: '设计',
    designEntities: '设计实体',
    generate: '生成',
    generateCode: '生成代码',
    relationship: '关系',
    viewRelationships: '查看实体关系图',
    yesterday: '昨天',
    daysAgo: '{days}天前',
    configure: '配置',
    view: '查看',
    generated: '已生成',
    status: {
      ACTIVE: '活跃',
      INACTIVE: '非活跃',
      ARCHIVED: '已归档',
      active: '活跃',
      inactive: '非活跃',
      archived: '已归档'
    },
  apiTest: {
    title: 'API测试',
    project: '项目',
    apiConfig: 'API配置',
    environment: '环境',
    history: '测试历史',
    batchTest: '批量测试',
    method: '请求方法',
    url: '请求URL',
    headers: '请求头',
    params: '查询参数',
    body: '请求体',
    response: '响应结果',
    test: '测试',
    reset: '重置',
    saveAsTemplate: '保存为模板',
    testSuccess: '测试成功',
    testFailed: '测试失败',
    form: {
      project: {
        placeholder: '请选择项目'
      },
      apiConfig: {
        placeholder: '请选择API配置'
      },
      environment: {
        placeholder: '请选择环境'
      }
    }
  },
    deploymentStatus: {
      inactive: '未部署',
      deploying: '部署中',
      deployed: '已部署',
      failed: '部署失败'
    },
    deploymentStatusLabel: '部署状态',
    port: '端口',
    lastDeployed: '最后部署',
    deploy: '部署',
    deployProject: '部署项目',
    stopDeployment: '停止部署',
    stopProjectDeployment: '停止项目部署',
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
    management: '实体管理',
    managementDesc: '管理和设计您的数据实体',
    listView: '列表视图',
    designerView: '设计器视图',
    fieldDesigner: '字段设计器',
    fieldList: '字段列表',
    addField: '添加字段',
    importFields: '导入字段',
    fieldProperties: '字段属性',
    fieldName: '字段名称',
    fieldCode: '字段代码',
    dataType: '数据类型',
    length: '长度',
    precision: '精度',
    required: '必填',
    unique: '唯一',
    primaryKey: '主键',
    autoIncrement: '自增',
    defaultValue: '默认值',
    comment: '注释',
    displayOrder: '显示顺序',
    selectFieldToEdit: '选择字段进行编辑',
    entityPreview: '实体预览',
    sqlPreview: 'SQL预览',
    exportSQL: '导出SQL',
    fieldNameRequired: '请输入字段名称',
    fieldCodeRequired: '请输入字段代码',
    dataTypeRequired: '请选择数据类型',
    deleteFieldConfirm: '确认删除此字段？',
    fieldValidationFailed: '字段验证失败',
    relationshipDesigner: '关系设计器',
    relationshipDesignerDesc: '设计实体之间的关系',
    autoLayout: '自动布局',
    entityList: '实体列表',
    designCanvas: '设计画布',
    properties: '属性',
    entityProperties: '实体属性',
    relationshipProperties: '关系属性',
    selectEntityOrRelationship: '选择实体或关系进行编辑',
    createRelationship: '创建关系',
    relationshipType: '关系类型',
    sourceEntity: '源实体',
    targetEntity: '目标实体',
    sourceField: '源字段',
    targetField: '目标字段',
    relationshipName: '关系名称',
    relationshipTypeRequired: '请选择关系类型',
    sourceEntityRequired: '请选择源实体',
    targetEntityRequired: '请选择目标实体',
    sourceFieldRequired: '请选择源字段',
    targetFieldRequired: '请选择目标字段',
    relationshipNameRequired: '请输入关系名称',
    searchPlaceholder: '搜索实体名称、代码或表名',
    filterByCategory: '按分类筛选',
    nameRequired: '请输入实体名称',
    codeRequired: '请输入实体代码',
    tableNameRequired: '请输入表名',
    categoryRequired: '请选择分类',
    deleteConfirm: '确认删除此实体？',
    loadFailed: '加载实体失败',
    noDescription: '暂无描述',
    preview: '预览',
    create: '创建实体',
    edit: '编辑实体',
    import: '导入实体',
    designFields: '设计字段',
    fieldCount: '字段数量',
    createdAt: '创建时间',
    createdBy: '创建者',
    fields: '字段',
    relationships: '关系',
    manageFields: '管理字段',
    gridView: '网格视图',
    tableView: '表格视图',
    fieldAdded: '字段添加成功',
    fieldUpdated: '字段更新成功',
    fieldDeleted: '字段删除成功',
    invalidJsonFormat: 'JSON格式无效',
    sqlImportNotImplemented: 'SQL导入功能暂未实现',
    dbImportNotImplemented: '数据库导入功能暂未实现',
    commonFieldOptions: '通用字段选项',
    enableCommonFields: '启用通用字段',
    autoCreateTable: '自动创建表',
    commonFieldsPreview: '通用字段预览',
    commonFieldsDesc: '系统将自动为实体添加以下通用字段',
    status: {
      DRAFT: '草稿',
      PUBLISHED: '已发布',
      DEPRECATED: '已废弃',
      ACTIVE: '活跃',
      INACTIVE: '非活跃',
      active: '活跃',
      inactive: '非活跃',
      draft: '草稿'
    },
    categories: {
      core: '核心',
      business: '业务',
      system: '系统',
      config: '配置',
    },
    designer: {
      title: '实体设计器',
      entityList: '实体列表',
      searchEntity: '搜索实体',
      noEntities: '暂无实体',
      createEntity: '创建实体',
      properties: '属性',
      autoLayout: '自动布局',
      connectMode: '连线模式',
      fitView: '适应视图',
      minimap: '小地图',
      saveSuccess: '保存成功',
      saveFailed: '保存失败',
      selectSourceEntity: '请选择源实体',
      selectTargetEntity: '已选择 {name}，请选择目标实体',
      layouts: {
        hierarchical: '层次布局',
        force: '力导向布局',
        circular: '环形布局',
        grid: '网格布局'
      },
      basicInfo: '基本信息',
      appearance: '外观',
      actions: '操作',
      color: '颜色',
      width: '宽度',
      height: '高度',
      manageFields: '管理字段',
      generateCode: '生成代码',
      deleteConfirm: '确定要删除这个实体吗？',
      generateCodeTip: '代码生成功能开发中...',
      addField: '添加字段',
       noFields: '暂无字段'
     },
     lookup: '查找',
     log: '日志',
    dataTypes: {
      STRING: '字符串',
      INTEGER: '整数',
      BIGINT: '长整数',
      DECIMAL: '小数',
      BOOLEAN: '布尔值',
      DATE: '日期',
      DATETIME: '日期时间',
      TEXT: '文本',
      JSON: 'JSON'
    },
    relationshipTypes: {
      ONE_TO_ONE: '一对一',
      ONE_TO_MANY: '一对多',
      MANY_TO_ONE: '多对一',
      MANY_TO_MANY: '多对多'
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
  relationship: {
    title: '关系管理',
    name: '关系名称',
    code: '关系代码',
    relationType: '关系类型',
    sourceEntity: '源实体',
    targetEntity: '目标实体',
    description: '关系描述',
    cascadeDelete: '级联删除',
    cascadeUpdate: '级联更新',
    foreignKeyField: '外键字段',
    required: '必填',
    addRelationship: '新增关系',
    editRelationship: '编辑关系',
    deleteRelationship: '删除关系',
    visualDesigner: '可视化设计器',
    listView: '列表视图',
    designerView: '设计器视图',
    autoLayout: '自动布局',
    zoomIn: '放大',
    zoomOut: '缩小',
    resetZoom: '重置缩放',
    fitToScreen: '适应屏幕',
    exportImage: '导出图片',
    relationshipRecommendations: '关系推荐',
    optimizationReport: '优化报告',
    smartRecommendations: '智能推荐',
    performanceAnalysis: '性能分析',
    relationshipCount: '关系数量',
    circularDependencies: '循环依赖',
    missingIndexes: '缺失索引',
    optimizationSuggestions: '优化建议',
    applyRecommendation: '应用推荐',
    generateReport: '生成报告',
    refreshAnalysis: '刷新分析',
    exportReport: '导出报告',
    onDelete: '删除时',
    onUpdate: '更新时',
    entityList: '实体列表',
    noEntities: '没有找到实体',
    // X6关系图设计器相关
    connectMode: '连线模式',
    selectSourceEntity: '请点击源实体开始连线',
    selectTargetEntity: '已选择 "{name}"，请点击目标实体完成连线',
    cancelConnect: '取消连线',
    createRelationshipDialog: '创建关系',
    relationshipExists: '关系已存在',
    relationshipCreated: '关系创建成功',
    relationshipUpdated: '关系更新成功',
    relationshipDeleted: '关系删除成功',
    // 工具栏操作
    toolbar: {
      connectMode: '连线模式',
      autoLayout: '自动布局',
      minimap: '小地图',
      zoomIn: '放大',
      zoomOut: '缩小',
      resetZoom: '重置缩放',
      fitCanvas: '适应画布',
      toggleGrid: '显示/隐藏网格',
      snapToGrid: '对齐网格',
      export: '导出',
      saveState: '保存状态',
      addEntity: '添加实体',
      deleteSelected: '删除选中',
      undo: '撤销',
      redo: '重做',
      legend: '图例说明'
    },
    // 导出选项
    exportOptions: {
      png: 'PNG图片',
      jpg: 'JPG图片',
      svg: 'SVG矢量图',
      json: 'JSON数据'
    },
    // 线条样式
    lineStyles: {
      solid: '实线',
      dashed: '虚线',
      dotted: '点线'
    },
    // 级联操作
    cascadeActions: {
      restrict: '限制',
      cascade: '级联',
      setNull: '设为空',
      noAction: '无操作'
    },
    // 关系类型
    relationTypes: {
      oneToOne: '一对一',
      oneToMany: '一对多',
      manyToOne: '多对一',
      manyToMany: '多对多'
    },
    // 表单相关
    form: {
      name: {
        placeholder: '请输入关系名称'
      },
      relationType: {
        placeholder: '请选择关系类型'
      },
      description: {
        placeholder: '请输入关系描述'
      }
    },
    // 属性面板
    propertyPanel: {
      title: '属性面板',
      entityProperties: '实体属性',
      relationshipProperties: '关系属性',
      basicInfo: '基本信息',
      visualStyle: '视觉样式',
      fieldManagement: '字段管理',
      noSelection: '请选择实体或关系',
      entityName: '实体名称',
      displayName: '显示名称',
      description: '描述',
      color: '颜色',
      position: '位置',
      size: '大小',
      fields: '字段列表',
      addField: '添加字段',
      fieldName: '字段名称',
      fieldType: '字段类型',
      isPrimaryKey: '主键',
      isRequired: '必填',
      isUnique: '唯一',
      isIndex: '索引',
      relationshipName: '关系名称',
      relationshipType: '关系类型',
      sourceEntity: '源实体',
      targetEntity: '目标实体',
      lineStyle: '线条样式',
      lineColor: '线条颜色'
    },
    relationshipTypes: {
      ONE_TO_ONE: '一对一',
      ONE_TO_MANY: '一对多',
      MANY_TO_ONE: '多对一',
      MANY_TO_MANY: '多对多'
    }
  },
  relation: {
    title: '关系管理',
    name: '关系名称',
    code: '关系代码',
    relationType: '关系类型',
    sourceEntity: '源实体',
    targetEntity: '目标实体',
    description: '关系描述',
    onDelete: '删除时',
    onUpdate: '更新时',
    addRelation: '新增关系',
    editRelation: '编辑关系',
    relationTypes: {
      ONE_TO_ONE: '一对一',
      ONE_TO_MANY: '一对多',
      MANY_TO_ONE: '多对一',
      MANY_TO_MANY: '多对多'
    },
    cascadeActions: {
      RESTRICT: '限制',
      CASCADE: '级联',
      SET_NULL: '设为空',
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
      type: {
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
      relationType: {
        placeholder: '请选择关系类型',
        required: '请选择关系类型'
      },
      description: {
        placeholder: '请输入关系描述'
      },
      onDelete: {
        placeholder: '请选择删除时操作'
      },
      onUpdate: {
        placeholder: '请选择更新时操作'
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
    batchGeneration: '批量生成',
    batchMode: '批量模式',
    concurrency: '并发数',
    batchByProjects: '按项目批量',
    batchByEntities: '按实体批量',
    batchByTemplates: '按模板批量',
    selectProjects: '选择项目',
    selectEntities: '选择实体',
    selectTemplates: '选择模板',
    outputStrategy: '输出策略',
    separateDirectories: '分离目录',
    separateDirectoriesDesc: '为每个项目/实体生成单独目录',
    mergedDirectory: '合并目录',
    mergedDirectoryDesc: '将所有生成内容合并到同一目录',
    baseOutputPath: '基础输出路径',
    startBatchGeneration: '开始批量生成',
    batchProgress: '批量进度',
    batchResults: '批量结果',
    batchModeRequired: '请选择批量模式',
    baseOutputPathRequired: '请输入基础输出路径',
    batchGenerationCompleted: '批量生成完成',
    batchGenerationFailed: '批量生成失败',
    downloadAll: '下载全部',
    openOutputDirectory: '打开输出目录',
    clearResults: '清空结果',
    createGitRepo: '创建Git仓库',
    autoCommit: '自动提交',
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
    management: '模板管理',
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
    managementDesc: '管理和编辑您的代码模板',
    gridView: '网格视图',
    listView: '列表视图',
    marketplace: '模板市场',
    marketplaceComingSoon: '模板市场即将上线',
    searchPlaceholder: '搜索模板名称、代码或描述',
    filterByCategory: '按分类筛选',
    filterByLanguage: '按语言筛选',
    create: '创建模板',
    import: '导入模板',
    export: '导出模板',
    noDescription: '暂无描述',
    noTemplates: '暂无模板',
    createFirst: '创建第一个模板',
    preview: '预览',
    unpublish: '取消发布',
    duplicate: '复制',
    duplicated: '模板已复制',
    statusUpdated: '状态已更新',
    deleteConfirm: '确认删除此模板？',
    loadFailed: '加载模板失败',
    batchOperations: '批量操作',
    selectedTemplatesCount: '已选择 {count} 个模板',
    batchPublish: '批量发布',
    batchUnpublish: '批量取消发布',
    batchExport: '批量导出',
    batchDelete: '批量删除',
    batchPublishSuccess: '批量发布成功',
    batchUnpublishSuccess: '批量取消发布成功',
    batchDeleteConfirm: '确认删除选中的模板？',
    editor: '模板编辑器',
    newTemplate: '新模板',
    settings: '模板设置',
    templateVariables: '模板变量',
    addVariable: '添加变量',
    variableName: '变量名称',
    variableType: '变量类型',
    defaultValue: '默认值',
    required: '必填',
    noVariables: '暂无变量',
    lines: '行数',
    format: '格式化',
    insertVariable: '插入变量',
    selectVariableToInsert: '选择要插入的变量',
    commonVariables: '常用变量',
    clickPreviewToGenerate: '点击预览按钮生成预览',
    previewGenerated: '预览生成成功',
    previewFailed: '预览生成失败',
    validationPassed: '验证通过',
    validationFailed: '验证失败',
    tagsPlaceholder: '输入标签并按回车',
    validate: '验证',
    test: '测试',
    previewResult: '预览结果',
    output: '输出结果',
    validation: '验证结果',
    testResult: '测试结果',
    validationSuccess: '模板验证通过',
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
    newVariable: '新变量',
    variableValue: '变量值',
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
      finish: '完成',
      duplicate: '复制'
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
      createSuccess: '创建成功',
      importSuccess: '导入成功'
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
