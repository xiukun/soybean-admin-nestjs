const lowcode: App.I18n.Schema['page']['lowcode'] = {
  project: {
    title: 'Project Management',
    addProject: 'Add Project',
    editProject: 'Edit Project',
    name: 'Project Name',
    code: 'Project Code',
    description: 'Description',
    version: 'Version',
    status: {
      ACTIVE: 'Active',
      INACTIVE: 'Inactive',
      ARCHIVED: 'Archived'
    },
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
    status: {
      DRAFT: 'Draft',
      ACTIVE: 'Active',
      INACTIVE: 'Inactive',
      ARCHIVED: 'Archived'
    },
    categories: {
      core: 'Core',
      business: 'Business',
      system: 'System',
      config: 'Configuration'
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
