import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs-extra';
import * as path from 'path';
import { EntityDefinition, FieldDefinition } from './layered-code-generator.service';
import { TemplateEngineService } from './template-engine.service';

/**
 * 单表CRUD配置
 */
export interface SingleTableCrudConfig {
  /** 项目名称 */
  projectName: string;
  /** 输出目录 */
  outputDir: string;
  /** API前缀 */
  apiPrefix?: string;
  /** 数据库表前缀 */
  tablePrefix?: string;
  /** 是否启用软删除 */
  enableSoftDelete?: boolean;
  /** 是否启用数据权限 */
  enableDataPermission?: boolean;
  /** 是否启用审计日志 */
  enableAuditLog?: boolean;
  /** 分页大小限制 */
  pageSizeLimit?: number;
  /** 是否生成Swagger文档 */
  generateSwagger?: boolean;
  /** 是否生成测试文件 */
  generateTests?: boolean;
  /** 是否启用缓存 */
  enableCache?: boolean;
  /** 缓存TTL（秒） */
  cacheTtl?: number;
  /** 是否启用字段级权限 */
  enableFieldPermission?: boolean;
  /** 是否启用数据验证 */
  enableValidation?: boolean;
}

/**
 * CRUD操作配置
 */
export interface CrudOperationConfig {
  /** 是否启用创建操作 */
  enableCreate?: boolean;
  /** 是否启用读取操作 */
  enableRead?: boolean;
  /** 是否启用更新操作 */
  enableUpdate?: boolean;
  /** 是否启用删除操作 */
  enableDelete?: boolean;
  /** 是否启用批量操作 */
  enableBatchOperations?: boolean;
  /** 是否启用搜索功能 */
  enableSearch?: boolean;
  /** 是否启用排序功能 */
  enableSort?: boolean;
  /** 是否启用筛选功能 */
  enableFilter?: boolean;
  /** 是否启用导入导出 */
  enableImportExport?: boolean;
  /** 自定义操作列表 */
  customOperations?: CustomOperation[];
}

/**
 * 自定义操作
 */
export interface CustomOperation {
  /** 操作名称 */
  name: string;
  /** HTTP方法 */
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  /** 路径 */
  path: string;
  /** 描述 */
  description: string;
  /** 请求体类型 */
  requestType?: string;
  /** 响应类型 */
  responseType?: string;
  /** 是否需要权限 */
  requiresAuth?: boolean;
  /** 所需权限 */
  permissions?: string[];
}

/**
 * 字段配置
 */
export interface FieldConfig {
  /** 字段名 */
  name: string;
  /** 是否在列表中显示 */
  showInList?: boolean;
  /** 是否在详情中显示 */
  showInDetail?: boolean;
  /** 是否可搜索 */
  searchable?: boolean;
  /** 是否可排序 */
  sortable?: boolean;
  /** 是否可筛选 */
  filterable?: boolean;
  /** 是否在创建时必填 */
  requiredOnCreate?: boolean;
  /** 是否在更新时必填 */
  requiredOnUpdate?: boolean;
  /** 是否只读 */
  readonly?: boolean;
  /** 字段权限 */
  permissions?: string[];
  /** 验证规则 */
  validationRules?: ValidationRule[];
}

/**
 * 验证规则
 */
export interface ValidationRule {
  /** 规则类型 */
  type: 'required' | 'minLength' | 'maxLength' | 'min' | 'max' | 'pattern' | 'email' | 'url' | 'custom';
  /** 规则值 */
  value?: any;
  /** 错误消息 */
  message: string;
  /** 自定义验证函数（仅用于custom类型） */
  validator?: string;
}

/**
 * 生成的CRUD文件
 */
export interface CrudGeneratedFile {
  /** 文件路径 */
  filePath: string;
  /** 文件内容 */
  content: string;
  /** 文件类型 */
  type: 'controller' | 'service' | 'repository' | 'dto' | 'entity' | 'module' | 'test' | 'config';
  /** 文件描述 */
  description: string;
  /** 是否可编辑 */
  editable: boolean;
  /** 依赖文件 */
  dependencies: string[];
  /** 元数据 */
  metadata: {
    /** 实体代码 */
    entityCode: string;
    /** 操作类型 */
    operations: string[];
    /** 字段数量 */
    fieldsCount: number;
    /** 是否有关系 */
    hasRelationships: boolean;
  };
}

/**
 * 单表CRUD生成器服务
 */
@Injectable()
export class SingleTableCrudGeneratorService {
  private readonly logger = new Logger(SingleTableCrudGeneratorService.name);

  constructor(
    private readonly templateEngine: TemplateEngineService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * 生成单表CRUD代码
   */
  async generateSingleTableCrud(
    entity: EntityDefinition,
    config: SingleTableCrudConfig,
    operationConfig: CrudOperationConfig = {},
    fieldConfigs: Record<string, FieldConfig> = {}
  ): Promise<CrudGeneratedFile[]> {
    const generatedFiles: CrudGeneratedFile[] = [];

    try {
      this.logger.log(`开始生成单表CRUD代码: ${entity.name}`);

      // 创建输出目录
      await this.createDirectoryStructure(config.outputDir, entity.code);

      // 处理字段配置
      const processedFields = this.processFieldConfigs(entity.fields, fieldConfigs);

      // 生成Controller
      if (operationConfig.enableRead !== false || operationConfig.enableCreate !== false || 
          operationConfig.enableUpdate !== false || operationConfig.enableDelete !== false) {
        const controller = await this.generateCrudController(entity, config, operationConfig, processedFields);
        generatedFiles.push(controller);
      }

      // 生成Service
      const service = await this.generateCrudService(entity, config, operationConfig, processedFields);
      generatedFiles.push(service);

      // 生成Repository
      const repository = await this.generateCrudRepository(entity, config, processedFields);
      generatedFiles.push(repository);

      // 生成DTOs
      const dtos = await this.generateCrudDTOs(entity, config, operationConfig, processedFields);
      generatedFiles.push(...dtos);

      // 生成Entity
      const entityFile = await this.generateCrudEntity(entity, config, processedFields);
      generatedFiles.push(entityFile);

      // 生成Module
      const moduleFile = await this.generateCrudModule(entity, config, operationConfig);
      generatedFiles.push(moduleFile);

      // 生成测试文件
      if (config.generateTests) {
        const testFiles = await this.generateCrudTests(entity, config, operationConfig);
        generatedFiles.push(...testFiles);
      }

      // 生成配置文件
      const configFiles = await this.generateCrudConfigs(entity, config, operationConfig);
      generatedFiles.push(...configFiles);

      this.logger.log(`单表CRUD代码生成完成，共生成 ${generatedFiles.length} 个文件`);
      return generatedFiles;

    } catch (error) {
      this.logger.error('单表CRUD代码生成失败:', error);
      throw error;
    }
  }

  /**
   * 生成CRUD Controller
   */
  private async generateCrudController(
    entity: EntityDefinition,
    config: SingleTableCrudConfig,
    operationConfig: CrudOperationConfig,
    processedFields: any[]
  ): Promise<CrudGeneratedFile> {
    const templateData = {
      entity,
      config,
      operationConfig,
      fields: processedFields,
      className: this.toPascalCase(entity.code) + 'Controller',
      serviceName: this.toCamelCase(entity.code) + 'Service',
      apiPath: config.apiPrefix ? `${config.apiPrefix}/${entity.code}` : entity.code,
      enabledOperations: this.getEnabledOperations(operationConfig),
      customOperations: operationConfig.customOperations || [],
      searchableFields: processedFields.filter(field => field.searchable),
      sortableFields: processedFields.filter(field => field.sortable),
      filterableFields: processedFields.filter(field => field.filterable),
    };

    const content = await this.templateEngine.render('single-table-crud-controller', templateData);
    
    return {
      filePath: path.join(config.outputDir, entity.code, 'controllers', `${entity.code}.controller.ts`),
      content,
      type: 'controller',
      description: `${entity.description || entity.name} CRUD控制器`,
      editable: true,
      dependencies: [
        path.join(config.outputDir, entity.code, 'services', `${entity.code}.service.ts`),
        path.join(config.outputDir, entity.code, 'dto', 'index.ts'),
      ],
      metadata: {
        entityCode: entity.code,
        operations: this.getEnabledOperations(operationConfig),
        fieldsCount: processedFields.length,
        hasRelationships: (entity.relationships || []).length > 0,
      },
    };
  }

  /**
   * 生成CRUD Service
   */
  private async generateCrudService(
    entity: EntityDefinition,
    config: SingleTableCrudConfig,
    operationConfig: CrudOperationConfig,
    processedFields: any[]
  ): Promise<CrudGeneratedFile> {
    const templateData = {
      entity,
      config,
      operationConfig,
      fields: processedFields,
      className: this.toPascalCase(entity.code) + 'Service',
      repositoryName: this.toCamelCase(entity.code) + 'Repository',
      enabledOperations: this.getEnabledOperations(operationConfig),
      searchableFields: processedFields.filter(field => field.searchable),
      uniqueFields: processedFields.filter(field => field.unique),
      requiredFields: processedFields.filter(field => field.required),
    };

    const content = await this.templateEngine.render('single-table-crud-service', templateData);
    
    return {
      filePath: path.join(config.outputDir, entity.code, 'services', `${entity.code}.service.ts`),
      content,
      type: 'service',
      description: `${entity.description || entity.name} CRUD服务`,
      editable: true,
      dependencies: [
        path.join(config.outputDir, entity.code, 'repositories', `${entity.code}.repository.ts`),
        path.join(config.outputDir, entity.code, 'entities', `${entity.code}.entity.ts`),
      ],
      metadata: {
        entityCode: entity.code,
        operations: this.getEnabledOperations(operationConfig),
        fieldsCount: processedFields.length,
        hasRelationships: (entity.relationships || []).length > 0,
      },
    };
  }

  /**
   * 生成CRUD Repository
   */
  private async generateCrudRepository(
    entity: EntityDefinition,
    config: SingleTableCrudConfig,
    processedFields: any[]
  ): Promise<CrudGeneratedFile> {
    const templateData = {
      entity,
      config,
      fields: processedFields,
      className: this.toPascalCase(entity.code) + 'Repository',
      tableName: config.tablePrefix ? `${config.tablePrefix}_${entity.code}` : entity.code,
      searchableFields: processedFields.filter(field => field.searchable),
      indexedFields: processedFields.filter(field => field.unique || field.indexed),
    };

    const content = await this.templateEngine.render('single-table-crud-repository', templateData);
    
    return {
      filePath: path.join(config.outputDir, entity.code, 'repositories', `${entity.code}.repository.ts`),
      content,
      type: 'repository',
      description: `${entity.description || entity.name} CRUD仓储`,
      editable: true,
      dependencies: [
        path.join(config.outputDir, entity.code, 'entities', `${entity.code}.entity.ts`),
      ],
      metadata: {
        entityCode: entity.code,
        operations: ['findAll', 'findOne', 'create', 'update', 'delete'],
        fieldsCount: processedFields.length,
        hasRelationships: (entity.relationships || []).length > 0,
      },
    };
  }

  /**
   * 生成CRUD DTOs
   */
  private async generateCrudDTOs(
    entity: EntityDefinition,
    config: SingleTableCrudConfig,
    operationConfig: CrudOperationConfig,
    processedFields: any[]
  ): Promise<CrudGeneratedFile[]> {
    const files: CrudGeneratedFile[] = [];

    // 创建DTO
    if (operationConfig.enableCreate !== false) {
      const createDto = await this.generateCreateDTO(entity, config, processedFields);
      files.push(createDto);
    }

    // 更新DTO
    if (operationConfig.enableUpdate !== false) {
      const updateDto = await this.generateUpdateDTO(entity, config, processedFields);
      files.push(updateDto);
    }

    // 查询DTO
    if (operationConfig.enableSearch !== false || operationConfig.enableFilter !== false) {
      const queryDto = await this.generateQueryDTO(entity, config, operationConfig, processedFields);
      files.push(queryDto);
    }

    // 响应DTO
    if (operationConfig.enableRead !== false) {
      const responseDto = await this.generateResponseDTO(entity, config, processedFields);
      files.push(responseDto);
    }

    // 索引文件
    const indexFile = await this.generateDTOIndex(entity, config, operationConfig);
    files.push(indexFile);

    return files;
  }

  /**
   * 生成创建DTO
   */
  private async generateCreateDTO(
    entity: EntityDefinition,
    config: SingleTableCrudConfig,
    processedFields: any[]
  ): Promise<CrudGeneratedFile> {
    const templateData = {
      entity,
      config,
      className: `Create${this.toPascalCase(entity.code)}Dto`,
      fields: processedFields.filter(field => 
        !field.name.includes('id') && 
        !field.name.includes('created') && 
        !field.name.includes('updated') &&
        !field.readonly
      ),
    };

    const content = await this.templateEngine.render('single-table-create-dto', templateData);
    
    return {
      filePath: path.join(config.outputDir, entity.code, 'dto', `create-${entity.code}.dto.ts`),
      content,
      type: 'dto',
      description: `${entity.description || entity.name} 创建DTO`,
      editable: true,
      dependencies: [],
      metadata: {
        entityCode: entity.code,
        operations: ['create'],
        fieldsCount: processedFields.length,
        hasRelationships: false,
      },
    };
  }

  /**
   * 生成更新DTO
   */
  private async generateUpdateDTO(
    entity: EntityDefinition,
    config: SingleTableCrudConfig,
    processedFields: any[]
  ): Promise<CrudGeneratedFile> {
    const templateData = {
      entity,
      config,
      className: `Update${this.toPascalCase(entity.code)}Dto`,
      createDtoName: `Create${this.toPascalCase(entity.code)}Dto`,
      fields: processedFields.filter(field => !field.readonly),
    };

    const content = await this.templateEngine.render('single-table-update-dto', templateData);
    
    return {
      filePath: path.join(config.outputDir, entity.code, 'dto', `update-${entity.code}.dto.ts`),
      content,
      type: 'dto',
      description: `${entity.description || entity.name} 更新DTO`,
      editable: true,
      dependencies: [
        path.join(config.outputDir, entity.code, 'dto', `create-${entity.code}.dto.ts`),
      ],
      metadata: {
        entityCode: entity.code,
        operations: ['update'],
        fieldsCount: processedFields.length,
        hasRelationships: false,
      },
    };
  }

  /**
   * 生成查询DTO
   */
  private async generateQueryDTO(
    entity: EntityDefinition,
    config: SingleTableCrudConfig,
    operationConfig: CrudOperationConfig,
    processedFields: any[]
  ): Promise<CrudGeneratedFile> {
    const templateData = {
      entity,
      config,
      operationConfig,
      className: `Query${this.toPascalCase(entity.code)}Dto`,
      searchableFields: processedFields.filter(field => field.searchable),
      filterableFields: processedFields.filter(field => field.filterable),
      sortableFields: processedFields.filter(field => field.sortable),
    };

    const content = await this.templateEngine.render('single-table-query-dto', templateData);
    
    return {
      filePath: path.join(config.outputDir, entity.code, 'dto', `query-${entity.code}.dto.ts`),
      content,
      type: 'dto',
      description: `${entity.description || entity.name} 查询DTO`,
      editable: true,
      dependencies: [],
      metadata: {
        entityCode: entity.code,
        operations: ['query', 'search', 'filter'],
        fieldsCount: processedFields.length,
        hasRelationships: false,
      },
    };
  }

  /**
   * 生成响应DTO
   */
  private async generateResponseDTO(
    entity: EntityDefinition,
    config: SingleTableCrudConfig,
    processedFields: any[]
  ): Promise<CrudGeneratedFile> {
    const templateData = {
      entity,
      config,
      className: `${this.toPascalCase(entity.code)}ResponseDto`,
      fields: processedFields,
    };

    const content = await this.templateEngine.render('single-table-response-dto', templateData);
    
    return {
      filePath: path.join(config.outputDir, entity.code, 'dto', `${entity.code}-response.dto.ts`),
      content,
      type: 'dto',
      description: `${entity.description || entity.name} 响应DTO`,
      editable: true,
      dependencies: [],
      metadata: {
        entityCode: entity.code,
        operations: ['response'],
        fieldsCount: processedFields.length,
        hasRelationships: (entity.relationships || []).length > 0,
      },
    };
  }

  /**
   * 生成DTO索引文件
   */
  private async generateDTOIndex(
    entity: EntityDefinition,
    config: SingleTableCrudConfig,
    operationConfig: CrudOperationConfig
  ): Promise<CrudGeneratedFile> {
    const templateData = {
      entity,
      config,
      operationConfig,
      enabledOperations: this.getEnabledOperations(operationConfig),
    };

    const content = await this.templateEngine.render('single-table-dto-index', templateData);
    
    return {
      filePath: path.join(config.outputDir, entity.code, 'dto', 'index.ts'),
      content,
      type: 'dto',
      description: `${entity.description || entity.name} DTO索引文件`,
      editable: true,
      dependencies: [],
      metadata: {
        entityCode: entity.code,
        operations: this.getEnabledOperations(operationConfig),
        fieldsCount: 0,
        hasRelationships: false,
      },
    };
  }

  /**
   * 生成CRUD Entity
   */
  private async generateCrudEntity(
    entity: EntityDefinition,
    config: SingleTableCrudConfig,
    processedFields: any[]
  ): Promise<CrudGeneratedFile> {
    const templateData = {
      entity,
      config,
      fields: processedFields,
      className: this.toPascalCase(entity.code),
      tableName: config.tablePrefix ? `${config.tablePrefix}_${entity.code}` : entity.code,
      indexedFields: processedFields.filter(field => field.unique || field.indexed),
    };

    const content = await this.templateEngine.render('single-table-crud-entity', templateData);
    
    return {
      filePath: path.join(config.outputDir, entity.code, 'entities', `${entity.code}.entity.ts`),
      content,
      type: 'entity',
      description: `${entity.description || entity.name} CRUD实体`,
      editable: true,
      dependencies: [],
      metadata: {
        entityCode: entity.code,
        operations: ['entity'],
        fieldsCount: processedFields.length,
        hasRelationships: (entity.relationships || []).length > 0,
      },
    };
  }

  /**
   * 生成CRUD Module
   */
  private async generateCrudModule(
    entity: EntityDefinition,
    config: SingleTableCrudConfig,
    operationConfig: CrudOperationConfig
  ): Promise<CrudGeneratedFile> {
    const templateData = {
      entity,
      config,
      operationConfig,
      moduleName: this.toPascalCase(entity.code) + 'Module',
      controllerName: this.toPascalCase(entity.code) + 'Controller',
      serviceName: this.toPascalCase(entity.code) + 'Service',
      repositoryName: this.toPascalCase(entity.code) + 'Repository',
      enabledOperations: this.getEnabledOperations(operationConfig),
    };

    const content = await this.templateEngine.render('single-table-crud-module', templateData);
    
    return {
      filePath: path.join(config.outputDir, entity.code, `${entity.code}.module.ts`),
      content,
      type: 'module',
      description: `${entity.description || entity.name} CRUD模块`,
      editable: true,
      dependencies: [],
      metadata: {
        entityCode: entity.code,
        operations: this.getEnabledOperations(operationConfig),
        fieldsCount: 0,
        hasRelationships: false,
      },
    };
  }

  /**
   * 生成CRUD测试文件
   */
  private async generateCrudTests(
    entity: EntityDefinition,
    config: SingleTableCrudConfig,
    operationConfig: CrudOperationConfig
  ): Promise<CrudGeneratedFile[]> {
    const files: CrudGeneratedFile[] = [];

    // Controller测试
    const controllerTest = await this.generateControllerTest(entity, config, operationConfig);
    files.push(controllerTest);

    // Service测试
    const serviceTest = await this.generateServiceTest(entity, config, operationConfig);
    files.push(serviceTest);

    return files;
  }

  /**
   * 生成Controller测试
   */
  private async generateControllerTest(
    entity: EntityDefinition,
    config: SingleTableCrudConfig,
    operationConfig: CrudOperationConfig
  ): Promise<CrudGeneratedFile> {
    const templateData = {
      entity,
      config,
      operationConfig,
      className: this.toPascalCase(entity.code) + 'Controller',
      enabledOperations: this.getEnabledOperations(operationConfig),
    };

    const content = await this.templateEngine.render('single-table-controller-test', templateData);
    
    return {
      filePath: path.join(config.outputDir, entity.code, 'test', `${entity.code}.controller.spec.ts`),
      content,
      type: 'test',
      description: `${entity.description || entity.name} Controller测试`,
      editable: true,
      dependencies: [],
      metadata: {
        entityCode: entity.code,
        operations: this.getEnabledOperations(operationConfig),
        fieldsCount: 0,
        hasRelationships: false,
      },
    };
  }

  /**
   * 生成Service测试
   */
  private async generateServiceTest(
    entity: EntityDefinition,
    config: SingleTableCrudConfig,
    operationConfig: CrudOperationConfig
  ): Promise<CrudGeneratedFile> {
    const templateData = {
      entity,
      config,
      operationConfig,
      className: this.toPascalCase(entity.code) + 'Service',
      enabledOperations: this.getEnabledOperations(operationConfig),
    };

    const content = await this.templateEngine.render('single-table-service-test', templateData);
    
    return {
      filePath: path.join(config.outputDir, entity.code, 'test', `${entity.code}.service.spec.ts`),
      content,
      type: 'test',
      description: `${entity.description || entity.name} Service测试`,
      editable: true,
      dependencies: [],
      metadata: {
        entityCode: entity.code,
        operations: this.getEnabledOperations(operationConfig),
        fieldsCount: 0,
        hasRelationships: false,
      },
    };
  }

  /**
   * 生成CRUD配置文件
   */
  private async generateCrudConfigs(
    entity: EntityDefinition,
    config: SingleTableCrudConfig,
    operationConfig: CrudOperationConfig
  ): Promise<CrudGeneratedFile[]> {
    const files: CrudGeneratedFile[] = [];

    // API路由配置
    const routeConfig = await this.generateRouteConfig(entity, config, operationConfig);
    files.push(routeConfig);

    // 权限配置
    if (config.enableDataPermission || config.enableFieldPermission) {
      const permissionConfig = await this.generatePermissionConfig(entity, config);
      files.push(permissionConfig);
    }

    return files;
  }

  /**
   * 生成路由配置
   */
  private async generateRouteConfig(
    entity: EntityDefinition,
    config: SingleTableCrudConfig,
    operationConfig: CrudOperationConfig
  ): Promise<CrudGeneratedFile> {
    const templateData = {
      entity,
      config,
      operationConfig,
      apiPath: config.apiPrefix ? `${config.apiPrefix}/${entity.code}` : entity.code,
      enabledOperations: this.getEnabledOperations(operationConfig),
      customOperations: operationConfig.customOperations || [],
    };

    const content = await this.templateEngine.render('single-table-route-config', templateData);
    
    return {
      filePath: path.join(config.outputDir, entity.code, 'config', 'routes.ts'),
      content,
      type: 'config',
      description: `${entity.description || entity.name} 路由配置`,
      editable: true,
      dependencies: [],
      metadata: {
        entityCode: entity.code,
        operations: this.getEnabledOperations(operationConfig),
        fieldsCount: 0,
        hasRelationships: false,
      },
    };
  }

  /**
   * 生成权限配置
   */
  private async generatePermissionConfig(
    entity: EntityDefinition,
    config: SingleTableCrudConfig
  ): Promise<CrudGeneratedFile> {
    const templateData = {
      entity,
      config,
      permissions: this.generatePermissionList(entity, config),
    };

    const content = await this.templateEngine.render('single-table-permission-config', templateData);
    
    return {
      filePath: path.join(config.outputDir, entity.code, 'config', 'permissions.ts'),
      content,
      type: 'config',
      description: `${entity.description || entity.name} 权限配置`,
      editable: true,
      dependencies: [],
      metadata: {
        entityCode: entity.code,
        operations: ['permissions'],
        fieldsCount: 0,
        hasRelationships: false,
      },
    };
  }

  /**
   * 创建目录结构
   */
  private async createDirectoryStructure(outputDir: string, entityCode: string): Promise<void> {
    const dirs = [
      path.join(outputDir, entityCode),
      path.join(outputDir, entityCode, 'controllers'),
      path.join(outputDir, entityCode, 'services'),
      path.join(outputDir, entityCode, 'repositories'),
      path.join(outputDir, entityCode, 'dto'),
      path.join(outputDir, entityCode, 'entities'),
      path.join(outputDir, entityCode, 'test'),
      path.join(outputDir, entityCode, 'config'),
    ];

    for (const dir of dirs) {
      await fs.ensureDir(dir);
    }
  }

  /**
   * 处理字段配置
   */
  private processFieldConfigs(
    fields: FieldDefinition[],
    fieldConfigs: Record<string, FieldConfig>
  ): any[] {
    return fields.map(field => {
      const config = fieldConfigs[field.name] || {};
      return {
        ...field,
        showInList: config.showInList !== false,
        showInDetail: config.showInDetail !== false,
        searchable: config.searchable || (field.type === 'string' || field.type === 'text'),
        sortable: config.sortable !== false && field.type !== 'text',
        filterable: config.filterable !== false,
        requiredOnCreate: config.requiredOnCreate !== undefined ? config.requiredOnCreate : field.required,
        requiredOnUpdate: config.requiredOnUpdate !== undefined ? config.requiredOnUpdate : false,
        readonly: config.readonly || field.name.includes('id') || field.name.includes('created'),
        permissions: config.permissions || [],
        validationRules: config.validationRules || [],
      };
    });
  }

  /**
   * 获取启用的操作列表
   */
  private getEnabledOperations(operationConfig: CrudOperationConfig): string[] {
    const operations: string[] = [];

    if (operationConfig.enableCreate !== false) operations.push('create');
    if (operationConfig.enableRead !== false) operations.push('read');
    if (operationConfig.enableUpdate !== false) operations.push('update');
    if (operationConfig.enableDelete !== false) operations.push('delete');
    if (operationConfig.enableBatchOperations) operations.push('batch');
    if (operationConfig.enableSearch) operations.push('search');
    if (operationConfig.enableSort) operations.push('sort');
    if (operationConfig.enableFilter) operations.push('filter');
    if (operationConfig.enableImportExport) operations.push('import', 'export');

    return operations;
  }

  /**
   * 生成权限列表
   */
  private generatePermissionList(entity: EntityDefinition, config: SingleTableCrudConfig): string[] {
    const permissions: string[] = [];
    const entityCode = entity.code;

    permissions.push(`${entityCode}:read`);
    permissions.push(`${entityCode}:create`);
    permissions.push(`${entityCode}:update`);
    permissions.push(`${entityCode}:delete`);

    if (config.enableDataPermission) {
      permissions.push(`${entityCode}:read:own`);
      permissions.push(`${entityCode}:update:own`);
      permissions.push(`${entityCode}:delete:own`);
    }

    if (config.enableFieldPermission) {
      entity.fields.forEach(field => {
        if (field.name !== 'id') {
          permissions.push(`${entityCode}:field:${field.name}:read`);
          permissions.push(`${entityCode}:field:${field.name}:write`);
        }
      });
    }

    return permissions;
  }

  /**
   * 转换为PascalCase
   */
  private toPascalCase(str: string): string {
    return str.replace(/(?:^|[-_])(\w)/g, (_, c) => c.toUpperCase());
  }

  /**
   * 转换为camelCase
   */
  private toCamelCase(str: string): string {
    const pascal = this.toPascalCase(str);
    return pascal.charAt(0).toLowerCase() + pascal.slice(1);
  }
}
