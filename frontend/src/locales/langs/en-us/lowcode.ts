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
    status: {
      ACTIVE: 'Active',
      INACTIVE: 'Inactive',
      ARCHIVED: 'Archived'
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
    name: 'Relationship Name',
    code: 'Relationship Code',
    description: 'Description',
    typeLabel: 'Relationship Type',
    type: {
      oneToOne: 'One to One',
      oneToMany: 'One to Many',
      manyToOne: 'Many to One',
      manyToMany: 'Many to Many'
    },
    sourceEntity: 'Source Entity',
    targetEntity: 'Target Entity',
    sourceField: 'Source Field',
    targetField: 'Target Field',
    onDelete: 'On Delete',
    onUpdate: 'On Update',
    types: {
      ONE_TO_ONE: 'One to One',
      ONE_TO_MANY: 'One to Many',
      MANY_TO_ONE: 'Many to One',
      MANY_TO_MANY: 'Many to Many'
    },
    status: {
      ACTIVE: 'Active',
      INACTIVE: 'Inactive'
    },
    actions: {
      CASCADE: 'Cascade',
      SET_NULL: 'Set Null',
      RESTRICT: 'Restrict',
      NO_ACTION: 'No Action'
    },
    cascade: {
      CASCADE: 'Cascade',
      SET_NULL: 'Set Null',
      RESTRICT: 'Restrict',
      NO_ACTION: 'No Action'
    },
    form: {
      name: {
        placeholder: 'Please enter relationship name',
        required: 'Please enter relationship name'
      },
      code: {
        placeholder: 'Please enter relationship code',
        required: 'Please enter relationship code'
      },
      description: {
        placeholder: 'Please enter description'
      },
      type: {
        placeholder: 'Please select relationship type',
        required: 'Please select relationship type'
      },
      sourceEntity: {
        placeholder: 'Please select source entity',
        required: 'Please select source entity'
      },
      targetEntity: {
        placeholder: 'Please select target entity',
        required: 'Please select target entity'
      },
      sourceField: {
        placeholder: 'Please select source field',
        required: 'Please select source field'
      },
      targetField: {
        placeholder: 'Please select target field',
        required: 'Please select target field'
      },
      onDelete: {
        placeholder: 'Please select on delete action'
      },
      onUpdate: {
        placeholder: 'Please select on update action'
      },
      status: {
        placeholder: 'Please select status'
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
  apiConfig: {
    title: 'API Configuration Management',
    addApiConfig: 'Add API Configuration',
    editApiConfig: 'Edit API Configuration',
    name: 'API Name',
    code: 'API Code',
    path: 'API Path',
    method: 'HTTP Method',
    description: 'Description',
    version: 'Version',
    entity: 'Related Entity',
    authRequired: 'Authentication Required',
    test: 'Test',
    testSuccess: 'API test successful',
    testFailed: 'API test failed',
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
      entity: {
        placeholder: 'Please select related entity'
      },
      authRequired: {
        placeholder: 'Please select authentication requirement'
      },
      status: {
        placeholder: 'Please select status'
      }
    }
  }
};

export default lowcode;
