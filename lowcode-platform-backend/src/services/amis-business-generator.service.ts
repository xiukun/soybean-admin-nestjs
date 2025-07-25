import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs-extra';
import * as path from 'path';
import { EntityDefinition, FieldDefinition } from './layered-code-generator.service';
import { TemplateEngineService } from './template-engine.service';

/**
 * Amis业务配置
 */
export interface AmisBusinessConfig {
  /** 项目名称 */
  projectName: string;
  /** 输出目录 */
  outputDir: string;
  /** 模块名称 */
  moduleName: string;
  /** 是否生成CRUD接口 */
  generateCrud?: boolean;
  /** 是否生成查询接口 */
  generateQuery?: boolean;
  /** 是否生成统计接口 */
  generateStats?: boolean;
  /** 是否生成导入导出 */
  generateImportExport?: boolean;
  /** 是否生成审批流程 */
  generateWorkflow?: boolean;
  /** API前缀 */
  apiPrefix?: string;
  /** 数据库表前缀 */
  tablePrefix?: string;
  /** 是否启用软删除 */
  enableSoftDelete?: boolean;
  /** 是否启用数据权限 */
  enableDataPermission?: boolean;
  /** 分页大小限制 */
  pageSizeLimit?: number;
}

/**
 * Amis页面配置
 */
export interface AmisPageConfig {
  /** 页面类型 */
  type: 'list' | 'form' | 'detail' | 'chart';
  /** 页面标题 */
  title: string;
  /** 页面描述 */
  description?: string;
  /** 是否启用搜索 */
  enableSearch?: boolean;
  /** 是否启用批量操作 */
  enableBatchActions?: boolean;
  /** 是否启用导入导出 */
  enableImportExport?: boolean;
  /** 自定义操作按钮 */
  customActions?: AmisAction[];
  /** 表格列配置 */
  columns?: AmisColumn[];
  /** 表单字段配置 */
  formFields?: AmisFormField[];
}

/**
 * Amis操作按钮
 */
export interface AmisAction {
  /** 按钮类型 */
  type: 'button' | 'link' | 'dropdown';
  /** 按钮文本 */
  label: string;
  /** 按钮图标 */
  icon?: string;
  /** 按钮级别 */
  level?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger';
  /** 操作类型 */
  actionType: 'ajax' | 'dialog' | 'drawer' | 'url' | 'copy' | 'reload';
  /** API地址 */
  api?: string;
  /** 确认提示 */
  confirmText?: string;
  /** 权限标识 */
  permission?: string;
}

/**
 * Amis表格列
 */
export interface AmisColumn {
  /** 字段名 */
  name: string;
  /** 列标题 */
  label: string;
  /** 列类型 */
  type?: 'text' | 'date' | 'datetime' | 'image' | 'link' | 'status' | 'mapping';
  /** 列宽度 */
  width?: number;
  /** 是否可排序 */
  sortable?: boolean;
  /** 是否可搜索 */
  searchable?: boolean;
  /** 格式化函数 */
  format?: string;
  /** 映射配置 */
  map?: Record<string, any>;
}

/**
 * Amis表单字段
 */
export interface AmisFormField {
  /** 字段名 */
  name: string;
  /** 字段标题 */
  label: string;
  /** 字段类型 */
  type: 'input-text' | 'input-number' | 'select' | 'input-date' | 'input-datetime' | 'textarea' | 'switch' | 'input-file';
  /** 是否必填 */
  required?: boolean;
  /** 验证规则 */
  validations?: Record<string, any>;
  /** 字段描述 */
  description?: string;
  /** 默认值 */
  value?: any;
  /** 选项配置 */
  options?: Array<{ label: string; value: any }>;
  /** 数据源API */
  source?: string;
}

/**
 * 生成的文件信息
 */
export interface AmisGeneratedFile {
  /** 文件路径 */
  filePath: string;
  /** 文件内容 */
  content: string;
  /** 文件类型 */
  type: 'controller' | 'service' | 'repository' | 'dto' | 'entity' | 'module' | 'page-config' | 'api-config';
  /** 文件描述 */
  description: string;
  /** 是否可编辑 */
  editable: boolean;
  /** 依赖文件 */
  dependencies: string[];
}

/**
 * Amis业务代码生成器服务
 */
@Injectable()
export class AmisBusinessGeneratorService {
  private readonly logger = new Logger(AmisBusinessGeneratorService.name);

  constructor(
    private readonly templateEngine: TemplateEngineService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * 生成Amis业务代码
   */
  async generateAmisBusinessCode(
    entities: EntityDefinition[],
    config: AmisBusinessConfig,
    pageConfigs: Record<string, AmisPageConfig> = {}
  ): Promise<AmisGeneratedFile[]> {
    const generatedFiles: AmisGeneratedFile[] = [];

    try {
      this.logger.log(`开始生成Amis业务代码: ${config.projectName}`);

      // 创建输出目录
      await this.createDirectoryStructure(config.outputDir, config.moduleName);

      // 为每个实体生成代码
      for (const entity of entities) {
        const entityFiles = await this.generateEntityBusinessCode(entity, config, pageConfigs[entity.code]);
        generatedFiles.push(...entityFiles);
      }

      // 生成模块文件
      const moduleFiles = await this.generateModuleFiles(entities, config);
      generatedFiles.push(...moduleFiles);

      // 生成API配置文件
      const apiConfigFiles = await this.generateApiConfigFiles(entities, config);
      generatedFiles.push(...apiConfigFiles);

      this.logger.log(`Amis业务代码生成完成，共生成 ${generatedFiles.length} 个文件`);
      return generatedFiles;

    } catch (error) {
      this.logger.error('Amis业务代码生成失败:', error);
      throw error;
    }
  }

  /**
   * 为单个实体生成业务代码
   */
  private async generateEntityBusinessCode(
    entity: EntityDefinition,
    config: AmisBusinessConfig,
    pageConfig?: AmisPageConfig
  ): Promise<AmisGeneratedFile[]> {
    const files: AmisGeneratedFile[] = [];

    // 生成Controller
    const controller = await this.generateAmisController(entity, config);
    files.push(controller);

    // 生成Service
    const service = await this.generateAmisService(entity, config);
    files.push(service);

    // 生成Repository
    const repository = await this.generateAmisRepository(entity, config);
    files.push(repository);

    // 生成DTO
    const dtos = await this.generateAmisDTOs(entity, config);
    files.push(...dtos);

    // 生成Entity
    const entityFile = await this.generateAmisEntity(entity, config);
    files.push(entityFile);

    // 生成页面配置
    if (pageConfig) {
      const pageConfigFile = await this.generateAmisPageConfig(entity, config, pageConfig);
      files.push(pageConfigFile);
    }

    return files;
  }

  /**
   * 生成Amis Controller
   */
  private async generateAmisController(
    entity: EntityDefinition,
    config: AmisBusinessConfig
  ): Promise<AmisGeneratedFile> {
    const templateData = {
      entity,
      config,
      className: this.toPascalCase(entity.code) + 'Controller',
      serviceName: this.toCamelCase(entity.code) + 'Service',
      apiPath: config.apiPrefix ? `${config.apiPrefix}/${entity.code}` : entity.code,
      enableSoftDelete: config.enableSoftDelete,
      enableDataPermission: config.enableDataPermission,
      pageSizeLimit: config.pageSizeLimit || 100,
    };

    const content = await this.templateEngine.render('amis-controller', templateData);
    
    return {
      filePath: path.join(config.outputDir, config.moduleName, 'controllers', `${entity.code}.controller.ts`),
      content,
      type: 'controller',
      description: `${entity.description || entity.name} Amis控制器`,
      editable: true,
      dependencies: [
        path.join(config.outputDir, config.moduleName, 'services', `${entity.code}.service.ts`),
        path.join(config.outputDir, config.moduleName, 'dto', `${entity.code}.dto.ts`),
      ],
    };
  }

  /**
   * 生成Amis Service
   */
  private async generateAmisService(
    entity: EntityDefinition,
    config: AmisBusinessConfig
  ): Promise<AmisGeneratedFile> {
    const templateData = {
      entity,
      config,
      className: this.toPascalCase(entity.code) + 'Service',
      repositoryName: this.toCamelCase(entity.code) + 'Repository',
      enableSoftDelete: config.enableSoftDelete,
      enableDataPermission: config.enableDataPermission,
    };

    const content = await this.templateEngine.render('amis-service', templateData);
    
    return {
      filePath: path.join(config.outputDir, config.moduleName, 'services', `${entity.code}.service.ts`),
      content,
      type: 'service',
      description: `${entity.description || entity.name} Amis服务`,
      editable: true,
      dependencies: [
        path.join(config.outputDir, config.moduleName, 'repositories', `${entity.code}.repository.ts`),
        path.join(config.outputDir, config.moduleName, 'entities', `${entity.code}.entity.ts`),
      ],
    };
  }

  /**
   * 生成Amis Repository
   */
  private async generateAmisRepository(
    entity: EntityDefinition,
    config: AmisBusinessConfig
  ): Promise<AmisGeneratedFile> {
    const templateData = {
      entity,
      config,
      className: this.toPascalCase(entity.code) + 'Repository',
      tableName: config.tablePrefix ? `${config.tablePrefix}_${entity.code}` : entity.code,
      enableSoftDelete: config.enableSoftDelete,
    };

    const content = await this.templateEngine.render('amis-repository', templateData);
    
    return {
      filePath: path.join(config.outputDir, config.moduleName, 'repositories', `${entity.code}.repository.ts`),
      content,
      type: 'repository',
      description: `${entity.description || entity.name} Amis仓储`,
      editable: true,
      dependencies: [
        path.join(config.outputDir, config.moduleName, 'entities', `${entity.code}.entity.ts`),
      ],
    };
  }

  /**
   * 生成Amis DTOs
   */
  private async generateAmisDTOs(
    entity: EntityDefinition,
    config: AmisBusinessConfig
  ): Promise<AmisGeneratedFile[]> {
    const files: AmisGeneratedFile[] = [];

    // 创建DTO
    const createDto = await this.generateCreateDTO(entity, config);
    files.push(createDto);

    // 更新DTO
    const updateDto = await this.generateUpdateDTO(entity, config);
    files.push(updateDto);

    // 查询DTO
    const queryDto = await this.generateQueryDTO(entity, config);
    files.push(queryDto);

    // 响应DTO
    const responseDto = await this.generateResponseDTO(entity, config);
    files.push(responseDto);

    return files;
  }

  /**
   * 生成创建DTO
   */
  private async generateCreateDTO(
    entity: EntityDefinition,
    config: AmisBusinessConfig
  ): Promise<AmisGeneratedFile> {
    const templateData = {
      entity,
      config,
      className: `Create${this.toPascalCase(entity.code)}Dto`,
      fields: entity.fields.filter(field => !field.name.includes('id') && !field.name.includes('created') && !field.name.includes('updated')),
    };

    const content = await this.templateEngine.render('amis-create-dto', templateData);
    
    return {
      filePath: path.join(config.outputDir, config.moduleName, 'dto', `create-${entity.code}.dto.ts`),
      content,
      type: 'dto',
      description: `${entity.description || entity.name} 创建DTO`,
      editable: true,
      dependencies: [],
    };
  }

  /**
   * 生成更新DTO
   */
  private async generateUpdateDTO(
    entity: EntityDefinition,
    config: AmisBusinessConfig
  ): Promise<AmisGeneratedFile> {
    const templateData = {
      entity,
      config,
      className: `Update${this.toPascalCase(entity.code)}Dto`,
      createDtoName: `Create${this.toPascalCase(entity.code)}Dto`,
    };

    const content = await this.templateEngine.render('amis-update-dto', templateData);
    
    return {
      filePath: path.join(config.outputDir, config.moduleName, 'dto', `update-${entity.code}.dto.ts`),
      content,
      type: 'dto',
      description: `${entity.description || entity.name} 更新DTO`,
      editable: true,
      dependencies: [
        path.join(config.outputDir, config.moduleName, 'dto', `create-${entity.code}.dto.ts`),
      ],
    };
  }

  /**
   * 生成查询DTO
   */
  private async generateQueryDTO(
    entity: EntityDefinition,
    config: AmisBusinessConfig
  ): Promise<AmisGeneratedFile> {
    const templateData = {
      entity,
      config,
      className: `Query${this.toPascalCase(entity.code)}Dto`,
      searchableFields: entity.fields.filter(field => 
        field.type === 'string' || field.type === 'text'
      ),
      filterableFields: entity.fields.filter(field => 
        field.type !== 'text' && !field.name.includes('password')
      ),
    };

    const content = await this.templateEngine.render('amis-query-dto', templateData);
    
    return {
      filePath: path.join(config.outputDir, config.moduleName, 'dto', `query-${entity.code}.dto.ts`),
      content,
      type: 'dto',
      description: `${entity.description || entity.name} 查询DTO`,
      editable: true,
      dependencies: [],
    };
  }

  /**
   * 生成响应DTO
   */
  private async generateResponseDTO(
    entity: EntityDefinition,
    config: AmisBusinessConfig
  ): Promise<AmisGeneratedFile> {
    const templateData = {
      entity,
      config,
      className: `${this.toPascalCase(entity.code)}ResponseDto`,
    };

    const content = await this.templateEngine.render('amis-response-dto', templateData);
    
    return {
      filePath: path.join(config.outputDir, config.moduleName, 'dto', `${entity.code}-response.dto.ts`),
      content,
      type: 'dto',
      description: `${entity.description || entity.name} 响应DTO`,
      editable: true,
      dependencies: [],
    };
  }

  /**
   * 生成Amis Entity
   */
  private async generateAmisEntity(
    entity: EntityDefinition,
    config: AmisBusinessConfig
  ): Promise<AmisGeneratedFile> {
    const templateData = {
      entity,
      config,
      className: this.toPascalCase(entity.code),
      tableName: config.tablePrefix ? `${config.tablePrefix}_${entity.code}` : entity.code,
      enableSoftDelete: config.enableSoftDelete,
    };

    const content = await this.templateEngine.render('amis-entity', templateData);
    
    return {
      filePath: path.join(config.outputDir, config.moduleName, 'entities', `${entity.code}.entity.ts`),
      content,
      type: 'entity',
      description: `${entity.description || entity.name} Amis实体`,
      editable: true,
      dependencies: [],
    };
  }

  /**
   * 生成Amis页面配置
   */
  private async generateAmisPageConfig(
    entity: EntityDefinition,
    config: AmisBusinessConfig,
    pageConfig: AmisPageConfig
  ): Promise<AmisGeneratedFile> {
    const templateData = {
      entity,
      config,
      pageConfig,
      apiPath: config.apiPrefix ? `${config.apiPrefix}/${entity.code}` : entity.code,
      columns: this.generateAmisColumns(entity, pageConfig),
      formFields: this.generateAmisFormFields(entity, pageConfig),
    };

    const content = await this.templateEngine.render('amis-page-config', templateData);
    
    return {
      filePath: path.join(config.outputDir, config.moduleName, 'pages', `${entity.code}-page.json`),
      content,
      type: 'page-config',
      description: `${entity.description || entity.name} Amis页面配置`,
      editable: true,
      dependencies: [],
    };
  }

  /**
   * 生成模块文件
   */
  private async generateModuleFiles(
    entities: EntityDefinition[],
    config: AmisBusinessConfig
  ): Promise<AmisGeneratedFile[]> {
    const files: AmisGeneratedFile[] = [];

    // 生成主模块文件
    const moduleFile = await this.generateMainModule(entities, config);
    files.push(moduleFile);

    return files;
  }

  /**
   * 生成主模块
   */
  private async generateMainModule(
    entities: EntityDefinition[],
    config: AmisBusinessConfig
  ): Promise<AmisGeneratedFile> {
    const templateData = {
      entities,
      config,
      moduleName: this.toPascalCase(config.moduleName) + 'Module',
      controllers: entities.map(entity => ({
        name: this.toPascalCase(entity.code) + 'Controller',
        path: `./controllers/${entity.code}.controller`,
      })),
      services: entities.map(entity => ({
        name: this.toPascalCase(entity.code) + 'Service',
        path: `./services/${entity.code}.service`,
      })),
      repositories: entities.map(entity => ({
        name: this.toPascalCase(entity.code) + 'Repository',
        path: `./repositories/${entity.code}.repository`,
      })),
    };

    const content = await this.templateEngine.render('amis-module', templateData);
    
    return {
      filePath: path.join(config.outputDir, config.moduleName, `${config.moduleName}.module.ts`),
      content,
      type: 'module',
      description: `${config.moduleName} Amis模块`,
      editable: true,
      dependencies: [],
    };
  }

  /**
   * 生成API配置文件
   */
  private async generateApiConfigFiles(
    entities: EntityDefinition[],
    config: AmisBusinessConfig
  ): Promise<AmisGeneratedFile[]> {
    const files: AmisGeneratedFile[] = [];

    // 生成API路由配置
    const apiRoutes = await this.generateApiRoutes(entities, config);
    files.push(apiRoutes);

    // 生成Swagger配置
    const swaggerConfig = await this.generateSwaggerConfig(entities, config);
    files.push(swaggerConfig);

    return files;
  }

  /**
   * 生成API路由配置
   */
  private async generateApiRoutes(
    entities: EntityDefinition[],
    config: AmisBusinessConfig
  ): Promise<AmisGeneratedFile> {
    const templateData = {
      entities,
      config,
      routes: entities.map(entity => ({
        path: config.apiPrefix ? `${config.apiPrefix}/${entity.code}` : entity.code,
        controller: this.toPascalCase(entity.code) + 'Controller',
        entity: entity,
      })),
    };

    const content = await this.templateEngine.render('amis-api-routes', templateData);
    
    return {
      filePath: path.join(config.outputDir, config.moduleName, 'config', 'api-routes.ts'),
      content,
      type: 'api-config',
      description: `${config.moduleName} API路由配置`,
      editable: true,
      dependencies: [],
    };
  }

  /**
   * 生成Swagger配置
   */
  private async generateSwaggerConfig(
    entities: EntityDefinition[],
    config: AmisBusinessConfig
  ): Promise<AmisGeneratedFile> {
    const templateData = {
      entities,
      config,
      moduleName: config.moduleName,
      apiPrefix: config.apiPrefix,
    };

    const content = await this.templateEngine.render('amis-swagger-config', templateData);
    
    return {
      filePath: path.join(config.outputDir, config.moduleName, 'config', 'swagger.config.ts'),
      content,
      type: 'api-config',
      description: `${config.moduleName} Swagger配置`,
      editable: true,
      dependencies: [],
    };
  }

  /**
   * 创建目录结构
   */
  private async createDirectoryStructure(outputDir: string, moduleName: string): Promise<void> {
    const dirs = [
      path.join(outputDir, moduleName),
      path.join(outputDir, moduleName, 'controllers'),
      path.join(outputDir, moduleName, 'services'),
      path.join(outputDir, moduleName, 'repositories'),
      path.join(outputDir, moduleName, 'dto'),
      path.join(outputDir, moduleName, 'entities'),
      path.join(outputDir, moduleName, 'pages'),
      path.join(outputDir, moduleName, 'config'),
    ];

    for (const dir of dirs) {
      await fs.ensureDir(dir);
    }
  }

  /**
   * 生成Amis表格列配置
   */
  private generateAmisColumns(entity: EntityDefinition, pageConfig?: AmisPageConfig): AmisColumn[] {
    if (pageConfig?.columns) {
      return pageConfig.columns;
    }

    return entity.fields.map(field => ({
      name: field.name,
      label: field.description || field.name,
      type: this.getAmisColumnType(field),
      sortable: field.type !== 'text',
      searchable: field.type === 'string' || field.type === 'text',
    }));
  }

  /**
   * 生成Amis表单字段配置
   */
  private generateAmisFormFields(entity: EntityDefinition, pageConfig?: AmisPageConfig): AmisFormField[] {
    if (pageConfig?.formFields) {
      return pageConfig.formFields;
    }

    return entity.fields
      .filter(field => !field.name.includes('id') && !field.name.includes('created') && !field.name.includes('updated'))
      .map(field => ({
        name: field.name,
        label: field.description || field.name,
        type: this.getAmisFormFieldType(field),
        required: field.required,
        description: field.description,
      }));
  }

  /**
   * 获取Amis列类型
   */
  private getAmisColumnType(field: FieldDefinition): string {
    switch (field.type) {
      case 'date':
        return 'date';
      case 'datetime':
        return 'datetime';
      case 'boolean':
        return 'status';
      case 'number':
        return 'text';
      default:
        return 'text';
    }
  }

  /**
   * 获取Amis表单字段类型
   */
  private getAmisFormFieldType(field: FieldDefinition): string {
    switch (field.type) {
      case 'string':
        return field.length && field.length > 255 ? 'textarea' : 'input-text';
      case 'text':
        return 'textarea';
      case 'number':
        return 'input-number';
      case 'boolean':
        return 'switch';
      case 'date':
        return 'input-date';
      case 'datetime':
        return 'input-datetime';
      default:
        return 'input-text';
    }
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
