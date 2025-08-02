const lowcode: App.I18n.Schema['page']['lowcode'] = {
  dashboard: {
    title: 'Low-Code Platform Dashboard',
    description: 'Welcome to the low-code platform, build your applications quickly',
    totalProjects: 'Total Projects',
    activeProjects: 'Active Projects',
    totalEntities: 'Total Entities',
    totalTemplates: 'Total Templates',
    recentProjects: 'Recent Projects',
    viewAll: 'View All',
    quickActions: 'Quick Actions',
    documentation: 'Documentation',
  },
  project: {
    title: 'Project Management',
    management: 'Project Management',
    managementDesc: 'Manage and configure your low-code projects',
    addProject: 'Add Project',
    editProject: 'Edit Project',
    create: 'Create Project',
    edit: 'Edit Project',
    import: 'Import Project',
    export: 'Export Project',
    open: 'Open Project',
    duplicate: 'Duplicate Project',
    archive: 'Archive Project',
    name: 'Project Name',
    code: 'Project Code',
    description: 'Description',
    version: 'Version',
    framework: 'Framework',
    architecture: 'Architecture',
    language: 'Language',
    database: 'Database',
    packageName: 'Package Name',
    basePackage: 'Base Package',
    author: 'Author',
    outputPath: 'Output Path',
    entities: 'Entities',
    templates: 'Templates',
    createdBy: 'Created By',
    createdAt: 'Created At',
    statusLabel: 'Status',
    searchPlaceholder: 'Search project name, code or description',
    filterByStatus: 'Filter by Status',
    filterByFramework: 'Filter by Framework',
    gridView: 'Grid View',
    tableView: 'Table View',
    noDescription: 'No description',
    advancedConfig: 'Advanced Configuration',
    importFromJson: 'Import from JSON',
    importFromGit: 'Import from Git',
    importFromFile: 'Import from File',
    gitUrl: 'Git Repository URL',
    gitUrlPlaceholder: 'Please enter Git repository URL',
    branch: 'Branch',
    branchPlaceholder: 'Please enter branch name',
    uploadFile: 'Click or drag file to this area to upload',
    supportedFormats: 'Support .json and .zip formats',
    importJsonPlaceholder: 'Please paste project JSON configuration',
    nameRequired: 'Please enter project name',
    codeRequired: 'Please enter project code',
    frameworkRequired: 'Please select framework',
    loadFailed: 'Failed to load projects',
    archiveConfirm: 'Confirm to archive this project?',
    deleteConfirm: 'Confirm to delete this project? This action cannot be undone!',
    archiveSuccess: 'Project archived successfully',
    invalidJsonFormat: 'Invalid JSON format',
    gitImportNotImplemented: 'Git import feature not implemented yet',
    fileImportNotImplemented: 'File import feature not implemented yet',
    detail: 'Project Detail',
    basicInfo: 'Basic Information',
    techStackConfig: 'Technology Stack Configuration',
    packageConfig: 'Package Configuration',
    databaseConfig: 'Database Configuration',
    generationConfig: 'Generation Configuration',
    openDesigner: 'Open Designer',
    apis: 'APIs',
    codeGeneration: 'Code Generation',
    configuration: 'Project Configuration',
    dbHost: 'Database Host',
    dbPort: 'Database Port',
    dbName: 'Database Name',
    dbUsername: 'Username',
    dbPassword: 'Password',
    dbSchema: 'Database Schema',
    testConnection: 'Test Connection',
    connectionSuccess: 'Database connection successful',
    connectionFailed: 'Database connection failed',
    enableSwagger: 'Enable Swagger',
    enableValidation: 'Enable Data Validation',
    enableAudit: 'Enable Audit Log',
    enableSoftDelete: 'Enable Soft Delete',
    enablePagination: 'Enable Pagination',
    enableCaching: 'Enable Caching',
    relationships: 'Relationships',
    generatedFiles: 'Generated Files',
    lastUpdated: 'Last Updated',
    techStack: 'Tech Stack',
    progress: 'Progress',
    design: 'Design',
    designEntities: 'Design Entities',
    generate: 'Generate',
    generateCode: 'Generate Code',
    relationship: 'Relationship',
    viewRelationships: 'View Entity Relationships',
    yesterday: 'Yesterday',
    daysAgo: '{days} days ago',
    configure: 'Configure',
    view: 'View',
    generated: 'Generated',
    status: {
      ACTIVE: 'Active',
      INACTIVE: 'Inactive',
      ARCHIVED: 'Archived',
      active: 'Active',
      inactive: 'Inactive',
      archived: 'Archived'
    },
    deploymentStatus: {
      inactive: 'Not Deployed',
      deploying: 'Deploying',
      deployed: 'Deployed',
      failed: 'Deployment Failed'
    },
    deploymentStatusLabel: 'Deployment Status',
    port: 'Port',
    lastDeployed: 'Last Deployed',
    deploy: 'Deploy',
    deployProject: 'Deploy Project',
    stopDeployment: 'Stop Deployment',
    stopProjectDeployment: 'Stop Project Deployment',
    form: {
      name: {
        placeholder: 'Please enter project name',
        required: 'Please enter project name'
      },
      code: {
        placeholder: 'Please enter project code',
        required: 'Please enter project code'
      },
      description: {
        placeholder: 'Please enter description'
      },
      version: {
        placeholder: 'Please enter version',
        required: 'Please enter version'
      },
      status: {
        placeholder: 'Please select status'
      }
    }
  },
  entity: {
    title: 'Entity Management',
    addEntity: 'Add Entity',
    editEntity: 'Edit Entity',
    name: 'Entity Name',
    code: 'Entity Code',
    description: 'Description',
    tableName: 'Table Name',
    category: 'Entity Category',
    management: 'Entity Management',
    managementDesc: 'Manage and design your data entities',
    listView: 'List View',
    designerView: 'Designer View',
    fieldDesigner: 'Field Designer',
    fieldList: 'Field List',
    addField: 'Add Field',
    importFields: 'Import Fields',
    fieldProperties: 'Field Properties',
    fieldName: 'Field Name',
    fieldCode: 'Field Code',
    dataType: 'Data Type',
    length: 'Length',
    precision: 'Precision',
    required: 'Required',
    unique: 'Unique',
    primaryKey: 'Primary Key',
    autoIncrement: 'Auto Increment',
    defaultValue: 'Default Value',
    comment: 'Comment',
    displayOrder: 'Display Order',
    selectFieldToEdit: 'Select field to edit',
    entityPreview: 'Entity Preview',
    sqlPreview: 'SQL Preview',
    exportSQL: 'Export SQL',
    fieldNameRequired: 'Please enter field name',
    fieldCodeRequired: 'Please enter field code',
    dataTypeRequired: 'Please select data type',
    deleteFieldConfirm: 'Confirm to delete this field?',
    fieldValidationFailed: 'Field validation failed',
    relationshipDesigner: 'Relationship Designer',
    relationshipDesignerDesc: 'Design relationships between entities',
    autoLayout: 'Auto Layout',
    entityList: 'Entity List',
    designCanvas: 'Design Canvas',
    properties: 'Properties',
    entityProperties: 'Entity Properties',
    relationshipProperties: 'Relationship Properties',
    selectEntityOrRelationship: 'Select entity or relationship to edit',
    createRelationship: 'Create Relationship',
    relationshipType: 'Relationship Type',
    sourceEntity: 'Source Entity',
    targetEntity: 'Target Entity',
    sourceField: 'Source Field',
    targetField: 'Target Field',
    relationshipName: 'Relationship Name',
    relationshipTypeRequired: 'Please select relationship type',
    sourceEntityRequired: 'Please select source entity',
    targetEntityRequired: 'Please select target entity',
    sourceFieldRequired: 'Please select source field',
    targetFieldRequired: 'Please select target field',
    relationshipNameRequired: 'Please enter relationship name',
    searchPlaceholder: 'Search entity name, code or table name',
    filterByCategory: 'Filter by Category',
    nameRequired: 'Please enter entity name',
    codeRequired: 'Please enter entity code',
    tableNameRequired: 'Please enter table name',
    categoryRequired: 'Please select category',
    deleteConfirm: 'Confirm to delete this entity?',
    loadFailed: 'Failed to load entities',
    noDescription: 'No description',
    preview: 'Preview',
    create: 'Create Entity',
    edit: 'Edit Entity',
    import: 'Import Entity',
    designFields: 'Design Fields',
    fieldCount: 'Field Count',
    createdAt: 'Created At',
    status: {
      DRAFT: 'Draft',
      PUBLISHED: 'Published',
      DEPRECATED: 'Deprecated',
      ACTIVE: 'Active',
      INACTIVE: 'Inactive',
      active: 'Active',
      inactive: 'Inactive',
      draft: 'Draft'
    },
    categories: {
      core: 'Core',
      business: 'Business',
      system: 'System',
      config: 'Configuration'
    },
    dataTypes: {
      STRING: 'String',
      INTEGER: 'Integer',
      BIGINT: 'Big Integer',
      DECIMAL: 'Decimal',
      BOOLEAN: 'Boolean',
      DATE: 'Date',
      DATETIME: 'DateTime',
      TEXT: 'Text',
      JSON: 'JSON'
    },
    relationshipTypes: {
      ONE_TO_ONE: 'One to One',
      ONE_TO_MANY: 'One to Many',
      MANY_TO_ONE: 'Many to One',
      MANY_TO_MANY: 'Many to Many'
    },
    form: {
      name: {
        placeholder: 'Please enter entity name',
        required: 'Please enter entity name'
      },
      code: {
        placeholder: 'Please enter entity code',
        required: 'Please enter entity code'
      },
      description: {
        placeholder: 'Please enter description'
      },
      tableName: {
        placeholder: 'Please enter table name',
        required: 'Please enter table name'
      },
      category: {
        placeholder: 'Please select entity category',
        required: 'Please select entity category'
      },
      status: {
        placeholder: 'Please select status'
      }
    }
  },
  field: {
    title: 'Field Management',
    addField: 'Add Field',
    editField: 'Edit Field',
    name: 'Field Name',
    code: 'Field Code',
    description: 'Description',
    dataType: 'Data Type',
    length: 'Length',
    precision: 'Precision',
    required: 'Required',
    unique: 'Unique',
    defaultValue: 'Default Value',
    displayOrder: 'Display Order',
    dataTypes: {
      STRING: 'String',
      INTEGER: 'Integer',
      DECIMAL: 'Decimal',
      BOOLEAN: 'Boolean',
      DATE: 'Date',
      DATETIME: 'DateTime',
      TEXT: 'Text',
      JSON: 'JSON'
    },
    form: {
      name: {
        placeholder: 'Please enter field name',
        required: 'Please enter field name'
      },
      code: {
        placeholder: 'Please enter field code',
        required: 'Please enter field code'
      },
      description: {
        placeholder: 'Please enter description'
      },
      dataType: {
        placeholder: 'Please select data type',
        required: 'Please select data type'
      },
      length: {
        placeholder: 'Please enter length'
      },
      precision: {
        placeholder: 'Please enter precision'
      },
      defaultValue: {
        placeholder: 'Please enter default value'
      },
      displayOrder: {
        placeholder: 'Please enter display order',
        required: 'Please enter display order'
      }
    }
  },
  api: {
    title: 'API Management',
    addApi: 'Add API',
    editApi: 'Edit API',
    name: 'API Name',
    code: 'API Code',
    path: 'API Path',
    method: 'HTTP Method',
    description: 'Description',
    version: 'Version',
    status: {
      DRAFT: 'Draft',
      PUBLISHED: 'Published',
      DEPRECATED: 'Deprecated'
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
        placeholder: 'Please enter API name',
        required: 'Please enter API name'
      },
      code: {
        placeholder: 'Please enter API code',
        required: 'Please enter API code'
      },
      path: {
        placeholder: 'Please enter API path',
        required: 'Please enter API path'
      },
      method: {
        placeholder: 'Please select HTTP method',
        required: 'Please select HTTP method'
      },
      description: {
        placeholder: 'Please enter description'
      },
      version: {
        placeholder: 'Please enter version',
        required: 'Please enter version'
      },
      status: {
        placeholder: 'Please select status'
      }
    }
  },
  relationship: {
    title: 'Relationship Management',
    addRelationship: 'Add Relationship',
    editRelationship: 'Edit Relationship',
    sourceEntity: 'Source Entity',
    targetEntity: 'Target Entity',
    relationType: 'Relationship Type',
    relationshipName: 'Relationship Name',
    description: 'Description',
    cascadeDelete: 'Cascade Delete',
    required: 'Required',
    relationTypes: {
      oneToOne: 'One to One',
      oneToMany: 'One to Many',
      manyToOne: 'Many to One',
      manyToMany: 'Many to Many'
    },
    form: {
      sourceEntity: {
        placeholder: 'Please select source entity',
        required: 'Please select source entity'
      },
      targetEntity: {
        placeholder: 'Please select target entity',
        required: 'Please select target entity'
      },
      relationType: {
        placeholder: 'Please select relationship type',
        required: 'Please select relationship type'
      },
      relationshipName: {
        placeholder: 'Please enter relationship name',
        required: 'Please enter relationship name'
      },
      description: {
        placeholder: 'Please enter description'
      }
    }
  },
  codegen: {
    title: 'Code Generation',
    generate: 'Generate Code',
    template: 'Code Template',
    output: 'Output Directory',
    progress: 'Generation Progress',
    batchGeneration: 'Batch Generation',
    batchMode: 'Batch Mode',
    concurrency: 'Concurrency',
    batchByProjects: 'Batch by Projects',
    batchByEntities: 'Batch by Entities',
    batchByTemplates: 'Batch by Templates',
    selectProjects: 'Select Projects',
    selectEntities: 'Select Entities',
    selectTemplates: 'Select Templates',
    outputStrategy: 'Output Strategy',
    separateDirectories: 'Separate Directories',
    separateDirectoriesDesc: 'Generate each project/entity to separate directory',
    mergedDirectory: 'Merged Directory',
    mergedDirectoryDesc: 'Merge all generated content to same directory',
    baseOutputPath: 'Base Output Path',
    startBatchGeneration: 'Start Batch Generation',
    batchProgress: 'Batch Progress',
    batchResults: 'Batch Results',
    batchModeRequired: 'Please select batch mode',
    baseOutputPathRequired: 'Please enter base output path',
    batchGenerationCompleted: 'Batch generation completed',
    batchGenerationFailed: 'Batch generation failed',
    downloadAll: 'Download All',
    openOutputDirectory: 'Open Output Directory',
    clearResults: 'Clear Results',
    createGitRepo: 'Create Git Repository',
    autoCommit: 'Auto Commit',
    status: {
      PENDING: 'Pending',
      RUNNING: 'Running',
      SUCCESS: 'Success',
      FAILED: 'Failed'
    },
    form: {
      template: {
        placeholder: 'Please select code template',
        required: 'Please select code template'
      },
      output: {
        placeholder: 'Please enter output directory',
        required: 'Please enter output directory'
      }
    }
  },
  template: {
    title: 'Template Management',
    management: 'Template Management',
    selectProject: 'Select Project',
    currentProject: 'Current Project',
    addTemplate: 'Add Template',
    editTemplate: 'Edit Template',
    name: 'Template Name',
    code: 'Template Code',
    description: 'Template Description',
    category: 'Template Category',
    language: 'Programming Language',
    framework: 'Framework',
    content: 'Template Content',
    variables: 'Template Variables',
    tags: 'Tags',
    isPublic: 'Public Template',
    usageCount: 'Usage Count',
    publish: 'Publish',
    publishSuccess: 'Template published successfully',
    publishFailed: 'Failed to publish template',
    managementDesc: 'Manage and edit your code templates',
    gridView: 'Grid View',
    listView: 'List View',
    marketplace: 'Template Marketplace',
    marketplaceComingSoon: 'Template marketplace coming soon',
    searchPlaceholder: 'Search template name, code or description',
    filterByCategory: 'Filter by Category',
    filterByLanguage: 'Filter by Language',
    create: 'Create Template',
    import: 'Import Templates',
    export: 'Export Templates',
    noDescription: 'No description',
    noTemplates: 'No templates',
    createFirst: 'Create first template',
    preview: 'Preview',
    unpublish: 'Unpublish',
    duplicate: 'Duplicate',
    duplicated: 'Template duplicated',
    statusUpdated: 'Status updated',
    deleteConfirm: 'Confirm to delete this template?',
    loadFailed: 'Failed to load templates',
    batchOperations: 'Batch Operations',
    selectedTemplatesCount: '{count} templates selected',
    batchPublish: 'Batch Publish',
    batchUnpublish: 'Batch Unpublish',
    batchExport: 'Batch Export',
    batchDelete: 'Batch Delete',
    batchPublishSuccess: 'Batch publish successful',
    batchUnpublishSuccess: 'Batch unpublish successful',
    batchDeleteConfirm: 'Confirm to delete selected templates?',
    editor: 'Template Editor',
    newTemplate: 'New Template',
    settings: 'Template Settings',
    templateVariables: 'Template Variables',
    addVariable: 'Add Variable',
    variableName: 'Variable Name',
    variableType: 'Variable Type',
    defaultValue: 'Default Value',
    required: 'Required',
    noVariables: 'No variables',
    lines: 'Lines',
    format: 'Format',
    insertVariable: 'Insert Variable',
    selectVariableToInsert: 'Select variable to insert',
    commonVariables: 'Common Variables',
    clickPreviewToGenerate: 'Click preview button to generate preview',
    previewGenerated: 'Preview generated successfully',
    previewFailed: 'Failed to generate preview',
    validationPassed: 'Validation passed',
    validationFailed: 'Validation failed',
    tagsPlaceholder: 'Enter tags and press enter',
    validate: 'Validate',
    test: 'Test',
    previewResult: 'Preview Result',
    output: 'Output Result',
    validation: 'Validation Result',
    testResult: 'Test Result',
    validationSuccess: 'Template validation passed',
    testPassed: 'Test passed',
    testFailed: 'Test failed',
    errors: 'Errors',
    warnings: 'Warnings',
    suggestions: 'Suggestions',
    extractedVariables: 'Extracted Variables',
    usedVariables: 'Used Variables',
    unusedVariables: 'Unused Variables',
    variableAnalysis: 'Variable Analysis',
    actualOutput: 'Actual Output',
    newVariable: 'New Variable',
    variableValue: 'Variable Value',
    status: {
      DRAFT: 'Draft',
      PUBLISHED: 'Published',
      DEPRECATED: 'Deprecated'
    },
    categories: {
      CONTROLLER: 'Controller',
      SERVICE: 'Service',
      MODEL: 'Model',
      DTO: 'Data Transfer Object',
      COMPONENT: 'Component',
      PAGE: 'Page',
      CONFIG: 'Configuration',
      TEST: 'Test'
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
        placeholder: 'Please enter template name',
        required: 'Please enter template name'
      },
      code: {
        placeholder: 'Please enter template code',
        required: 'Please enter template code'
      },
      description: {
        placeholder: 'Please enter template description'
      },
      category: {
        placeholder: 'Please select template category',
        required: 'Please select template category'
      },
      language: {
        placeholder: 'Please select programming language',
        required: 'Please select programming language'
      },
      framework: {
        placeholder: 'Please select framework',
        required: 'Please select framework'
      },
      content: {
        placeholder: 'Please enter template content',
        required: 'Please enter template content'
      },
      variables: {
        placeholder: 'Please enter template variables'
      },
      tags: {
        placeholder: 'Please enter tags, separated by commas'
      },
      status: {
        placeholder: 'Please select status'
      },
      project: {
        placeholder: 'Please select project'
      },
      variableValue: {
        stringPlaceholder: 'Please enter string value',
        numberPlaceholder: 'Please enter number value',
        arrayPlaceholder: 'Please enter JSON array, e.g.: ["item1", "item2"]',
        objectPlaceholder: 'Please enter JSON object, e.g.: {"key": "value"}'
      }
    }
  },
  query: {
    title: 'Query Management',
    addQuery: 'Add Query',
    editQuery: 'Edit Query',
    name: 'Query Name',
    code: 'Query Code',
    description: 'Query Description',
    sql: 'SQL Statement',
    parameters: 'Query Parameters',
    result: 'Query Result',
    execute: 'Execute Query',
    save: 'Save Query',
    baseEntity: 'Base Entity',
    baseEntityAlias: 'Base Entity Alias',
    joinCount: 'Join Count',
    fieldCount: 'Field Count',
    filterCount: 'Filter Count',
    lastExecuted: 'Last Executed',
    executeSuccess: 'Query executed successfully',
    executeFailed: 'Query execution failed',
    noDataToExport: 'No data to export',
    exportComingSoon: 'Export feature coming soon',
    generateSQLFailed: 'SQL generation failed',
    basicInfo: 'Basic Information',
    joins: 'Table Joins',
    fields: 'Field Selection',
    filters: 'Filter Conditions',
    sorting: 'Sorting Settings',
    joinType: 'Join Type',
    targetEntity: 'Target Entity',
    sourceField: 'Source Field',
    targetField: 'Target Field',
    alias: 'Alias',
    fieldName: 'Field Name',
    fieldAlias: 'Field Alias',
    entityAlias: 'Entity Alias',
    aggregation: 'Aggregation Function',
    operator: 'Operator',
    value: 'Value',
    direction: 'Sort Direction',
    addJoin: 'Add Join',
    join: 'Join',
    addField: 'Add Field',
    field: 'Field',
    addFilter: 'Add Filter',
    filter: 'Filter',
    addSort: 'Add Sort',
    sort: 'Sort',
    sqlPreview: 'SQL Preview',
    generateSQL: 'Generate SQL',
    noSQL: 'No SQL',
    executeError: 'Execution Error',
    noData: 'No Data',
    info: 'Information',
    executeTime: 'Execution Time',
    rowCount: 'Row Count',
    columnCount: 'Column Count',
    status: {
      DRAFT: 'Draft',
      PUBLISHED: 'Published',
      DEPRECATED: 'Deprecated'
    },
    form: {
      name: {
        placeholder: 'Please enter query name',
        required: 'Please enter query name'
      },
      code: {
        placeholder: 'Please enter query code',
        required: 'Please enter query code'
      },
      description: {
        placeholder: 'Please enter query description'
      },
      sql: {
        placeholder: 'Please enter SQL statement',
        required: 'Please enter SQL statement'
      },
      baseEntity: {
        placeholder: 'Please select base entity',
        required: 'Please select base entity'
      },
      baseEntityAlias: {
        placeholder: 'Please enter base entity alias',
        required: 'Please enter base entity alias'
      },
      joinType: {
        placeholder: 'Please select join type'
      },
      targetEntity: {
        placeholder: 'Please select target entity'
      },
      sourceField: {
        placeholder: 'Please enter source field'
      },
      targetField: {
        placeholder: 'Please enter target field'
      },
      alias: {
        placeholder: 'Please enter alias'
      },
      fieldName: {
        placeholder: 'Please enter field name'
      },
      fieldAlias: {
        placeholder: 'Please enter field alias'
      },
      entityAlias: {
        placeholder: 'Please enter entity alias'
      },
      aggregation: {
        placeholder: 'Please select aggregation function'
      },
      operator: {
        placeholder: 'Please select operator'
      },
      value: {
        placeholder: 'Please enter value'
      },
      direction: {
        placeholder: 'Please select sort direction'
      }
    }
  },
  apiConfig: {
    title: 'API Configuration Management',
    addApiConfig: 'Add API Configuration',
    editApiConfig: 'Edit API Configuration',
    selectProject: 'Select Project',
    currentProject: 'Current Project',
    changeProject: 'Change Project',
    test: 'Test',
    quickExport: 'Quick Export',
    advancedSearch: 'Advanced Search',
    advancedSearchOptions: 'Advanced Search Options',
    selectMethod: 'Select Method',
    selectStatus: 'Select Status',
    selectAuth: 'Select Auth Requirement',
    dateRange: 'Date Range',
    totalCount: 'Total',
    selectedCount: 'Selected',
    testSuccess: 'API test successful',
    testFailed: 'API test failed',
    name: 'API Name',
    code: 'API Code',
    path: 'API Path',
    method: 'HTTP Method',
    description: 'Description',
    version: 'Version',
    entity: 'Related Entity',
    authRequired: 'Authentication Required',
    queryConfig: 'Query Configuration',
    paginationEnabled: 'Enable Pagination',
    defaultPageSize: 'Default Page Size',
    maxPageSize: 'Maximum Page Size',
    responseConfig: 'Response Configuration',
    responseFormat: 'Response Format',
    responseWrapper: 'Response Wrapper',
    securityConfig: 'Security Configuration',
    rateLimitEnabled: 'Enable Rate Limiting',
    rateLimitRequests: 'Rate Limit Requests',
    rateLimitWindow: 'Rate Limit Window',
    status: {
      ACTIVE: 'Active',
      INACTIVE: 'Inactive'
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
        placeholder: 'Please enter API name',
        required: 'Please enter API name'
      },
      code: {
        placeholder: 'Please enter API code',
        required: 'Please enter API code'
      },
      path: {
        placeholder: 'Please enter API path',
        required: 'Please enter API path',
        invalid: 'API path must start with /'
      },
      method: {
        placeholder: 'Please select HTTP method',
        required: 'Please select HTTP method'
      },
      description: {
        placeholder: 'Please enter description'
      },
      version: {
        placeholder: 'Please enter version',
        required: 'Please enter version'
      },
      entity: {
        placeholder: 'Please select related entity'
      },
      authRequired: {
        placeholder: 'Please select authentication requirement'
      },
      status: {
        placeholder: 'Please select status'
      },
      responseFormat: {
        placeholder: 'Please select response format',
        required: 'Please select response format'
      },
      defaultPageSize: {
        placeholder: 'Please enter default page size'
      },
      maxPageSize: {
        placeholder: 'Please enter maximum page size'
      },
      responseWrapper: {
        placeholder: 'Please enter response wrapper, e.g.: data'
      },
      rateLimitRequests: {
        placeholder: 'Please enter rate limit requests'
      },
      rateLimitWindow: {
        placeholder: 'Please enter rate limit window (seconds)'
      },
      search: {
        placeholder: 'Please enter API name or path to search'
      }
    },
    selector: {
      title: 'API Configuration Selector',
      platformFormat: 'Platform Management Format (current/size + records)',
      lowcodeFormat: 'Lowcode Page Format (page/perPage + options)',
      selectApi: 'Select API Configuration',
      selectApiPlaceholder: 'Please select an API configuration to use',
      selectedApi: 'Selected API Configuration',
      amisConfig: 'Generated Amis Configuration'
    },
    tabs: {
      management: 'API Configuration Management',
      selector: 'Interface Format Comparison',
      batchOperations: 'Batch Operations',
      onlineTest: 'Online Test',
      versionManagement: 'Version Management',
      documentation: 'Documentation'
    },
    batchOperations: {
      title: 'Batch Operations',
      export: {
        title: 'Batch Export',
        all: 'Export All',
        selected: 'Export Selected',
        allSuccess: 'Successfully exported all API configurations',
        selectedSuccess: 'Successfully exported {count} API configurations'
      },
      import: {
        title: 'Batch Import',
        button: 'Start Import',
        dragText: 'Click or drag files to this area to upload',
        hintText: 'Supports JSON, YAML formats, single file size not exceeding 10MB',
        overwrite: 'Overwrite existing configurations',
        invalidFormat: 'Unsupported file format, please upload JSON or YAML files',
        success: 'Import successful: created {created}, updated {updated}'
      },
      delete: {
        title: 'Batch Delete',
        selected: 'Delete Selected',
        confirm: 'Are you sure you want to delete the selected {count} API configurations? This operation cannot be undone.',
        success: 'Successfully deleted {count} API configurations'
      },
      template: {
        title: 'Template Download',
        json: 'Download JSON Template',
        yaml: 'Download YAML Template',
        downloaded: 'Downloaded {format} format template file'
      }
    },
    onlineTest: {
      title: 'Online API Test',
      history: 'Test History',
      selectApi: 'Select API',
      apiInfo: 'API Information',
      testConfig: 'Test Configuration',
      headers: 'Request Headers',
      headerKey: 'Header Name',
      headerValue: 'Header Value',
      addHeader: 'Add Header',
      queryParams: 'Query Parameters',
      paramKey: 'Parameter Name',
      paramValue: 'Parameter Value',
      addParam: 'Add Parameter',
      requestBody: 'Request Body',
      jsonPlaceholder: 'Please enter JSON format request body',
      fieldKey: 'Field Name',
      fieldValue: 'Field Value',
      addField: 'Add Field',
      rawPlaceholder: 'Please enter raw request body content',
      execute: 'Execute Test',
      saveCase: 'Save Test Case',
      result: 'Test Result',
      status: 'Status Code',
      time: 'Response Time',
      responseHeaders: 'Response Headers',
      responseBody: 'Response Body',
      formatted: 'Formatted',
      raw: 'Raw',
      testHistory: 'Test History',
      envVariables: 'Environment Variables',
      variableKey: 'Variable Name',
      variableValue: 'Variable Value',
      addVariable: 'Add Variable',
      testCases: 'Test Cases',
      savedCases: 'Saved Test Cases',
      noCases: 'No saved test cases',
      load: 'Load',
      createdAt: 'Created At',
      caseSaved: 'Test case saved',
      caseLoaded: 'Test case loaded',
      caseDeleted: 'Test case deleted'
    },
    versionManagement: {
      title: 'API Version Management',
      selectApi: 'Select API',
      currentVersion: 'Current Version',
      versionHistory: 'Version History',
      versionCompare: 'Version Compare',
      createVersion: 'Create Version',
      version: 'Version',
      versionNumber: 'Version Number',
      versionPlaceholder: 'Please enter version number, e.g.: 1.0.0',
      changeLog: 'Change Log',
      changeLogPlaceholder: 'Please enter detailed description of changes',
      compare: 'Compare',
      rollback: 'Rollback',
      viewVersion: 'View version {version}',
      selectSecondVersion: 'Please select a second version for comparison',
      compareReady: 'Version comparison is ready',
      sameVersion: 'Cannot select the same version for comparison',
      versionCreated: 'Version created successfully',
      createFailed: 'Failed to create version',
      rollbackSuccess: 'Successfully rolled back to version {version}',
      rollbackFailed: 'Failed to rollback version',
      loadFailed: 'Failed to load versions, using mock data'
    },
    documentation: {
      title: 'API Documentation Generation',
      generate: 'Generate Documentation',
      exportSwagger: 'Export Swagger',
      selectProject: 'Select Project',
      selectProjectFirst: 'Please select a project first',
      includeInactive: 'Include inactive APIs',
      config: 'Documentation Configuration',
      docTitle: 'Documentation Title',
      docVersion: 'Documentation Version',
      docDescription: 'Documentation Description',
      docBaseUrl: 'Base URL',
      titlePlaceholder: 'Please enter documentation title',
      versionPlaceholder: 'Please enter documentation version',
      descriptionPlaceholder: 'Please enter documentation description',
      baseUrlPlaceholder: 'Please enter base URL',
      statistics: 'API Statistics',
      totalApis: 'Total APIs',
      activeApis: 'Active APIs',
      inactiveApis: 'Inactive APIs',
      methods: 'Method Types',
      methodDistribution: 'Method Distribution',
      preview: 'Documentation Preview',
      swaggerFormat: 'Swagger Format',
      markdownFormat: 'Markdown Format',
      htmlFormat: 'HTML Format',
      export: 'Export Documentation',
      exportMarkdown: 'Export Markdown',
      exportHtml: 'Export HTML',
      exportPostman: 'Export Postman Collection',
      exportOpenAPI: 'Export OpenAPI YAML',
      exportInsomnia: 'Export Insomnia Collection',
      generateSuccess: 'Documentation generated successfully',
      generateFailed: 'Failed to generate documentation',
      exportSuccess: 'Successfully exported {format} format documentation',
      exportFailed: 'Failed to export documentation'
    }
  },
  apiTest: {
    title: 'API Testing',
    project: 'Project',
    apiConfig: 'API Configuration',
    requestConfig: 'Request Configuration',
    method: 'Request Method',
    url: 'Request URL',
    headers: 'Request Headers',
    params: 'Request Parameters',
    body: 'Request Body',
    response: 'Response Result',
    status: 'Status Code',
    time: 'Response Time',
    responseHeaders: 'Response Headers',
    responseData: 'Response Data',
    requestInfo: 'Request Information',
    testApi: 'Test API',
    clearResult: 'Clear Result',
    saveAsTemplate: 'Save as Template',
    addHeader: 'Add Header',
    addParam: 'Add Parameter',
    testSuccess: 'API test successful',
    testFailed: 'API test failed',
    saveAsTemplateNotImplemented: 'Save as template feature not implemented yet',
    queryParams: 'Query Parameters',
    test: 'Test',
    form: {
      project: {
        placeholder: 'Please select a project',
        required: 'Please select a project'
      },
      apiConfig: {
        placeholder: 'Please select an API configuration',
        required: 'Please select an API configuration'
      },
      url: {
        placeholder: 'Request URL will be generated automatically'
      },
      headerKey: {
        placeholder: 'Header name'
      },
      headerValue: {
        placeholder: 'Header value'
      },
      paramKey: {
        placeholder: 'Parameter name'
      },
      paramValue: {
        placeholder: 'Parameter value'
      },
      body: {
        placeholder: 'Please enter JSON format request body'
      }
    }
  }
};

export default lowcode;
