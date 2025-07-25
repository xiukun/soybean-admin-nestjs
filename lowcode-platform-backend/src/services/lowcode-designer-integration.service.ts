import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@lib/shared/prisma/prisma.service';
import { SingleTableCrudGeneratorService } from './single-table-crud-generator.service';
import { MultiTableRelationGeneratorService } from './multi-table-relation-generator.service';
import { ApiParameterConfigService } from './api-parameter-config.service';
import { AmisBusinessGeneratorService } from './amis-business-generator.service';

/**
 * 设计器组件类型
 */
export type DesignerComponentType = 
  | 'crud-table'
  | 'form'
  | 'detail'
  | 'chart'
  | 'list'
  | 'tree'
  | 'tabs'
  | 'wizard'
  | 'dialog'
  | 'drawer';

/**
 * 数据源类型
 */
export type DataSourceType = 
  | 'api'
  | 'static'
  | 'variable'
  | 'expression';

/**
 * 设计器组件配置
 */
export interface DesignerComponentConfig {
  /** 组件ID */
  id: string;
  /** 组件类型 */
  type: DesignerComponentType;
  /** 组件名称 */
  name: string;
  /** 组件标题 */
  title?: string;
  /** 数据源配置 */
  dataSource?: DataSourceConfig;
  /** 字段配置 */
  fields?: FieldConfig[];
  /** 操作配置 */
  actions?: ActionConfig[];
  /** 样式配置 */
  style?: any;
  /** 其他属性 */
  props?: any;
  /** 子组件 */
  children?: DesignerComponentConfig[];
}

/**
 * 数据源配置
 */
export interface DataSourceConfig {
  /** 数据源类型 */
  type: DataSourceType;
  /** API配置 */
  api?: {
    /** 接口地址 */
    url: string;
    /** 请求方法 */
    method: string;
    /** 请求参数 */
    params?: Record<string, any>;
    /** 请求头 */
    headers?: Record<string, string>;
    /** 数据映射 */
    dataMapping?: string;
  };
  /** 静态数据 */
  staticData?: any;
  /** 变量名 */
  variable?: string;
  /** 表达式 */
  expression?: string;
}

/**
 * 字段配置
 */
export interface FieldConfig {
  /** 字段名 */
  name: string;
  /** 字段标签 */
  label: string;
  /** 字段类型 */
  type: string;
  /** 是否必填 */
  required?: boolean;
  /** 是否只读 */
  readonly?: boolean;
  /** 是否隐藏 */
  hidden?: boolean;
  /** 默认值 */
  defaultValue?: any;
  /** 验证规则 */
  validationRules?: any[];
  /** 字段选项（用于select、radio等） */
  options?: Array<{ label: string; value: any }>;
  /** 字段属性 */
  props?: any;
}

/**
 * 操作配置
 */
export interface ActionConfig {
  /** 操作ID */
  id: string;
  /** 操作类型 */
  type: 'button' | 'link' | 'dropdown';
  /** 操作标签 */
  label: string;
  /** 操作图标 */
  icon?: string;
  /** 操作行为 */
  action: {
    /** 行为类型 */
    type: 'api' | 'dialog' | 'drawer' | 'page' | 'script';
    /** 行为配置 */
    config: any;
  };
  /** 显示条件 */
  visibleOn?: string;
  /** 禁用条件 */
  disabledOn?: string;
}

/**
 * 页面配置
 */
export interface PageConfig {
  /** 页面ID */
  id: string;
  /** 页面名称 */
  name: string;
  /** 页面标题 */
  title: string;
  /** 页面路径 */
  path: string;
  /** 页面类型 */
  type: 'list' | 'form' | 'detail' | 'dashboard' | 'custom';
  /** 页面组件 */
  components: DesignerComponentConfig[];
  /** 页面数据源 */
  dataSources?: Record<string, DataSourceConfig>;
  /** 页面变量 */
  variables?: Record<string, any>;
  /** 页面样式 */
  style?: any;
  /** 页面脚本 */
  scripts?: {
    onInit?: string;
    onMount?: string;
    onUnmount?: string;
  };
}

/**
 * 接口生成配置
 */
export interface ApiGenerationConfig {
  /** 实体名称 */
  entityName: string;
  /** 实体描述 */
  entityDescription?: string;
  /** 字段定义 */
  fields: Array<{
    name: string;
    type: string;
    required: boolean;
    description?: string;
    defaultValue?: any;
  }>;
  /** 生成的接口类型 */
  apiTypes: Array<'list' | 'detail' | 'create' | 'update' | 'delete' | 'batch'>;
  /** 接口配置 */
  apiConfig: {
    /** 基础路径 */
    basePath: string;
    /** 是否启用分页 */
    enablePagination: boolean;
    /** 是否启用搜索 */
    enableSearch: boolean;
    /** 是否启用排序 */
    enableSort: boolean;
    /** 是否启用筛选 */
    enableFilter: boolean;
    /** 是否启用缓存 */
    enableCache: boolean;
  };
}

/**
 * 低代码设计器集成服务
 */
@Injectable()
export class LowcodeDesignerIntegrationService {
  private readonly logger = new Logger(LowcodeDesignerIntegrationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly singleTableCrudGenerator: SingleTableCrudGeneratorService,
    private readonly multiTableRelationGenerator: MultiTableRelationGeneratorService,
    private readonly apiParameterConfigService: ApiParameterConfigService,
    private readonly amisBusinessGenerator: AmisBusinessGeneratorService,
  ) {}

  /**
   * 解析页面配置并生成对应的后端接口
   */
  async generateApisFromPageConfig(pageConfig: PageConfig): Promise<{
    generatedApis: any[];
    generatedFiles: any[];
    errors: string[];
  }> {
    const generatedApis: any[] = [];
    const generatedFiles: any[] = [];
    const errors: string[] = [];

    try {
      this.logger.log(`开始为页面 ${pageConfig.name} 生成后端接口`);

      // 分析页面组件，提取需要的API
      const apiRequirements = this.analyzePageComponents(pageConfig.components);

      // 为每个API需求生成对应的接口
      for (const requirement of apiRequirements) {
        try {
          const result = await this.generateApiForRequirement(requirement, pageConfig);
          generatedApis.push(...result.apis);
          generatedFiles.push(...result.files);
        } catch (error) {
          errors.push(`生成API失败 (${requirement.type}): ${error.message}`);
        }
      }

      // 生成页面数据源配置
      const dataSourceConfig = this.generateDataSourceConfig(pageConfig, generatedApis);

      this.logger.log(`页面 ${pageConfig.name} 接口生成完成: ${generatedApis.length} 个API, ${generatedFiles.length} 个文件`);

      return {
        generatedApis,
        generatedFiles,
        errors,
      };

    } catch (error) {
      this.logger.error('页面接口生成失败:', error);
      throw new BadRequestException(`页面接口生成失败: ${error.message}`);
    }
  }

  /**
   * 分析页面组件，提取API需求
   */
  private analyzePageComponents(components: DesignerComponentConfig[]): ApiGenerationConfig[] {
    const requirements: ApiGenerationConfig[] = [];

    for (const component of components) {
      const requirement = this.analyzeComponent(component);
      if (requirement) {
        requirements.push(requirement);
      }

      // 递归分析子组件
      if (component.children) {
        requirements.push(...this.analyzePageComponents(component.children));
      }
    }

    return requirements;
  }

  /**
   * 分析单个组件的API需求
   */
  private analyzeComponent(component: DesignerComponentConfig): ApiGenerationConfig | null {
    switch (component.type) {
      case 'crud-table':
        return this.analyzeCrudTableComponent(component);
      case 'form':
        return this.analyzeFormComponent(component);
      case 'detail':
        return this.analyzeDetailComponent(component);
      case 'list':
        return this.analyzeListComponent(component);
      case 'chart':
        return this.analyzeChartComponent(component);
      default:
        return null;
    }
  }

  /**
   * 分析CRUD表格组件
   */
  private analyzeCrudTableComponent(component: DesignerComponentConfig): ApiGenerationConfig {
    const entityName = this.extractEntityName(component);
    const fields = this.extractFields(component);

    return {
      entityName,
      entityDescription: component.title || component.name,
      fields,
      apiTypes: ['list', 'detail', 'create', 'update', 'delete', 'batch'],
      apiConfig: {
        basePath: `/api/${entityName.toLowerCase()}`,
        enablePagination: true,
        enableSearch: true,
        enableSort: true,
        enableFilter: true,
        enableCache: true,
      },
    };
  }

  /**
   * 分析表单组件
   */
  private analyzeFormComponent(component: DesignerComponentConfig): ApiGenerationConfig {
    const entityName = this.extractEntityName(component);
    const fields = this.extractFields(component);

    // 根据表单的用途确定API类型
    const isEditForm = component.props?.mode === 'edit' || component.props?.initApi;
    const apiTypes = isEditForm ? ['detail', 'update'] : ['create'];

    return {
      entityName,
      entityDescription: component.title || component.name,
      fields,
      apiTypes,
      apiConfig: {
        basePath: `/api/${entityName.toLowerCase()}`,
        enablePagination: false,
        enableSearch: false,
        enableSort: false,
        enableFilter: false,
        enableCache: false,
      },
    };
  }

  /**
   * 分析详情组件
   */
  private analyzeDetailComponent(component: DesignerComponentConfig): ApiGenerationConfig {
    const entityName = this.extractEntityName(component);
    const fields = this.extractFields(component);

    return {
      entityName,
      entityDescription: component.title || component.name,
      fields,
      apiTypes: ['detail'],
      apiConfig: {
        basePath: `/api/${entityName.toLowerCase()}`,
        enablePagination: false,
        enableSearch: false,
        enableSort: false,
        enableFilter: false,
        enableCache: true,
      },
    };
  }

  /**
   * 分析列表组件
   */
  private analyzeListComponent(component: DesignerComponentConfig): ApiGenerationConfig {
    const entityName = this.extractEntityName(component);
    const fields = this.extractFields(component);

    return {
      entityName,
      entityDescription: component.title || component.name,
      fields,
      apiTypes: ['list'],
      apiConfig: {
        basePath: `/api/${entityName.toLowerCase()}`,
        enablePagination: true,
        enableSearch: true,
        enableSort: true,
        enableFilter: true,
        enableCache: true,
      },
    };
  }

  /**
   * 分析图表组件
   */
  private analyzeChartComponent(component: DesignerComponentConfig): ApiGenerationConfig {
    const entityName = this.extractEntityName(component);
    const fields = this.extractFields(component);

    return {
      entityName,
      entityDescription: component.title || component.name,
      fields,
      apiTypes: ['list'], // 图表通常需要列表数据
      apiConfig: {
        basePath: `/api/${entityName.toLowerCase()}/chart`,
        enablePagination: false,
        enableSearch: false,
        enableSort: false,
        enableFilter: true,
        enableCache: true,
      },
    };
  }

  /**
   * 为API需求生成对应的接口
   */
  private async generateApiForRequirement(
    requirement: ApiGenerationConfig,
    pageConfig: PageConfig
  ): Promise<{
    apis: any[];
    files: any[];
  }> {
    const apis: any[] = [];
    const files: any[] = [];

    // 构建实体定义
    const entityDefinition = {
      code: requirement.entityName.toLowerCase(),
      name: requirement.entityName,
      description: requirement.entityDescription,
      fields: requirement.fields.map(field => ({
        name: field.name,
        type: field.type,
        required: field.required,
        description: field.description,
        defaultValue: field.defaultValue,
      })),
    };

    // 构建CRUD配置
    const crudConfig = {
      projectName: `${pageConfig.name}-${requirement.entityName}`,
      outputDir: `./generated/pages/${pageConfig.id}`,
      enableSoftDelete: true,
      enableDataPermission: true,
      enableAuditLog: true,
      enableCache: requirement.apiConfig.enableCache,
      generateTests: true,
      generateSwagger: true,
    };

    // 构建操作配置
    const operationConfig = {
      enableCreate: requirement.apiTypes.includes('create'),
      enableRead: requirement.apiTypes.includes('list') || requirement.apiTypes.includes('detail'),
      enableUpdate: requirement.apiTypes.includes('update'),
      enableDelete: requirement.apiTypes.includes('delete'),
      enableBatchOperations: requirement.apiTypes.includes('batch'),
      enableSearch: requirement.apiConfig.enableSearch,
      enableSort: requirement.apiConfig.enableSort,
      enableFilter: requirement.apiConfig.enableFilter,
      enableImportExport: false,
    };

    // 生成CRUD代码
    const generatedFiles = await this.singleTableCrudGenerator.generateSingleTableCrud(
      entityDefinition,
      crudConfig,
      operationConfig
    );

    files.push(...generatedFiles);

    // 生成API配置
    for (const apiType of requirement.apiTypes) {
      const apiConfig = await this.generateApiConfig(
        requirement,
        apiType,
        pageConfig
      );
      apis.push(apiConfig);
    }

    return { apis, files };
  }

  /**
   * 生成API配置
   */
  private async generateApiConfig(
    requirement: ApiGenerationConfig,
    apiType: string,
    pageConfig: PageConfig
  ): Promise<any> {
    const basePath = requirement.apiConfig.basePath;
    
    switch (apiType) {
      case 'list':
        return {
          path: basePath,
          method: 'GET',
          name: `获取${requirement.entityDescription}列表`,
          description: `分页获取${requirement.entityDescription}列表`,
          inputParameters: this.generateListInputParameters(requirement),
          outputParameters: this.generateListOutputParameters(requirement),
          responseFormat: this.getAmisResponseFormat(),
          paginationConfig: requirement.apiConfig.enablePagination ? this.getDefaultPaginationConfig() : null,
          sortConfig: requirement.apiConfig.enableSort ? this.getDefaultSortConfig() : null,
          filterConfig: requirement.apiConfig.enableFilter ? this.getDefaultFilterConfig(requirement) : null,
          cacheConfig: requirement.apiConfig.enableCache ? this.getDefaultCacheConfig() : null,
          enabled: true,
        };

      case 'detail':
        return {
          path: `${basePath}/:id`,
          method: 'GET',
          name: `获取${requirement.entityDescription}详情`,
          description: `根据ID获取${requirement.entityDescription}详情`,
          inputParameters: this.generateDetailInputParameters(),
          outputParameters: this.generateDetailOutputParameters(requirement),
          responseFormat: this.getAmisResponseFormat(),
          cacheConfig: requirement.apiConfig.enableCache ? this.getDefaultCacheConfig() : null,
          enabled: true,
        };

      case 'create':
        return {
          path: basePath,
          method: 'POST',
          name: `创建${requirement.entityDescription}`,
          description: `创建新的${requirement.entityDescription}`,
          inputParameters: this.generateCreateInputParameters(requirement),
          outputParameters: this.generateCreateOutputParameters(requirement),
          responseFormat: this.getAmisResponseFormat(),
          enabled: true,
        };

      case 'update':
        return {
          path: `${basePath}/:id`,
          method: 'PUT',
          name: `更新${requirement.entityDescription}`,
          description: `更新${requirement.entityDescription}信息`,
          inputParameters: this.generateUpdateInputParameters(requirement),
          outputParameters: this.generateUpdateOutputParameters(requirement),
          responseFormat: this.getAmisResponseFormat(),
          enabled: true,
        };

      case 'delete':
        return {
          path: `${basePath}/:id`,
          method: 'DELETE',
          name: `删除${requirement.entityDescription}`,
          description: `删除${requirement.entityDescription}`,
          inputParameters: this.generateDeleteInputParameters(),
          outputParameters: this.generateDeleteOutputParameters(),
          responseFormat: this.getAmisResponseFormat(),
          enabled: true,
        };

      case 'batch':
        return {
          path: `${basePath}/batch`,
          method: 'DELETE',
          name: `批量删除${requirement.entityDescription}`,
          description: `批量删除${requirement.entityDescription}`,
          inputParameters: this.generateBatchDeleteInputParameters(),
          outputParameters: this.generateBatchDeleteOutputParameters(),
          responseFormat: this.getAmisResponseFormat(),
          enabled: true,
        };

      default:
        throw new Error(`不支持的API类型: ${apiType}`);
    }
  }

  /**
   * 生成数据源配置
   */
  private generateDataSourceConfig(pageConfig: PageConfig, generatedApis: any[]): any {
    const dataSources: Record<string, any> = {};

    for (const api of generatedApis) {
      const dataSourceName = `${api.name.replace(/[^\w]/g, '_')}_api`;
      dataSources[dataSourceName] = {
        type: 'api',
        api: {
          url: api.path,
          method: api.method,
          dataMapping: api.method === 'GET' ? '${items}' : '${data}',
        },
      };
    }

    return dataSources;
  }

  /**
   * 提取实体名称
   */
  private extractEntityName(component: DesignerComponentConfig): string {
    // 从组件配置中提取实体名称
    if (component.props?.entity) {
      return component.props.entity;
    }

    if (component.dataSource?.api?.url) {
      // 从API URL中提取实体名称
      const matches = component.dataSource.api.url.match(/\/api\/(\w+)/);
      if (matches) {
        return matches[1];
      }
    }

    // 使用组件名称作为实体名称
    return component.name.replace(/[^\w]/g, '');
  }

  /**
   * 提取字段配置
   */
  private extractFields(component: DesignerComponentConfig): Array<{
    name: string;
    type: string;
    required: boolean;
    description?: string;
    defaultValue?: any;
  }> {
    const fields: any[] = [];

    if (component.fields) {
      for (const field of component.fields) {
        fields.push({
          name: field.name,
          type: this.mapFieldType(field.type),
          required: field.required || false,
          description: field.label,
          defaultValue: field.defaultValue,
        });
      }
    }

    // 如果没有字段配置，生成默认字段
    if (fields.length === 0) {
      fields.push(
        { name: 'id', type: 'string', required: true, description: 'ID' },
        { name: 'name', type: 'string', required: true, description: '名称' },
        { name: 'description', type: 'string', required: false, description: '描述' },
        { name: 'status', type: 'string', required: false, description: '状态', defaultValue: 'active' },
        { name: 'createdAt', type: 'datetime', required: false, description: '创建时间' },
        { name: 'updatedAt', type: 'datetime', required: false, description: '更新时间' }
      );
    }

    return fields;
  }

  /**
   * 映射字段类型
   */
  private mapFieldType(fieldType: string): string {
    const typeMapping: Record<string, string> = {
      'input-text': 'string',
      'input-number': 'number',
      'input-email': 'string',
      'input-password': 'string',
      'textarea': 'text',
      'select': 'string',
      'checkbox': 'boolean',
      'switch': 'boolean',
      'input-date': 'date',
      'input-datetime': 'datetime',
      'input-file': 'file',
      'input-image': 'string',
      'input-rich-text': 'text',
    };

    return typeMapping[fieldType] || 'string';
  }

  /**
   * 生成列表输入参数
   */
  private generateListInputParameters(requirement: ApiGenerationConfig): any[] {
    const parameters = [];

    if (requirement.apiConfig.enablePagination) {
      parameters.push(
        {
          name: 'page',
          type: 'number',
          required: false,
          defaultValue: 1,
          description: '页码',
          validationRules: [
            { type: 'min', value: 1, message: '页码必须大于0', enabled: true }
          ],
          transformationRules: [
            { type: 'toNumber', enabled: true, order: 1 }
          ],
          showInDocs: true,
          deprecated: false,
        },
        {
          name: 'limit',
          type: 'number',
          required: false,
          defaultValue: 10,
          description: '每页数量',
          validationRules: [
            { type: 'min', value: 1, message: '每页数量必须大于0', enabled: true },
            { type: 'max', value: 100, message: '每页数量不能超过100', enabled: true }
          ],
          transformationRules: [
            { type: 'toNumber', enabled: true, order: 1 }
          ],
          showInDocs: true,
          deprecated: false,
        }
      );
    }

    if (requirement.apiConfig.enableSearch) {
      parameters.push({
        name: 'search',
        type: 'string',
        required: false,
        description: '搜索关键词',
        validationRules: [
          { type: 'maxLength', value: 100, message: '搜索关键词不能超过100个字符', enabled: true }
        ],
        transformationRules: [
          { type: 'trim', enabled: true, order: 1 }
        ],
        showInDocs: true,
        deprecated: false,
      });
    }

    if (requirement.apiConfig.enableSort) {
      parameters.push(
        {
          name: 'sortBy',
          type: 'string',
          required: false,
          defaultValue: 'createdAt',
          description: '排序字段',
          showInDocs: true,
          deprecated: false,
        },
        {
          name: 'sortOrder',
          type: 'enum',
          required: false,
          defaultValue: 'DESC',
          description: '排序方向',
          enumOptions: [
            { label: '升序', value: 'ASC' },
            { label: '降序', value: 'DESC' }
          ],
          showInDocs: true,
          deprecated: false,
        }
      );
    }

    return parameters;
  }

  /**
   * 生成列表输出参数
   */
  private generateListOutputParameters(requirement: ApiGenerationConfig): any[] {
    const parameters = [
      {
        name: 'items',
        type: 'array',
        required: true,
        description: `${requirement.entityDescription}列表`,
        arrayItemType: 'object',
        showInDocs: true,
        deprecated: false,
      }
    ];

    if (requirement.apiConfig.enablePagination) {
      parameters.push(
        {
          name: 'total',
          type: 'number',
          required: true,
          description: '总记录数',
          showInDocs: true,
          deprecated: false,
        },
        {
          name: 'page',
          type: 'number',
          required: true,
          description: '当前页码',
          showInDocs: true,
          deprecated: false,
        },
        {
          name: 'limit',
          type: 'number',
          required: true,
          description: '每页数量',
          showInDocs: true,
          deprecated: false,
        }
      );
    }

    return parameters;
  }

  /**
   * 生成详情输入参数
   */
  private generateDetailInputParameters(): any[] {
    return [
      {
        name: 'id',
        type: 'string',
        required: true,
        description: 'ID',
        validationRules: [
          { type: 'required', message: 'ID不能为空', enabled: true }
        ],
        showInDocs: true,
        deprecated: false,
      }
    ];
  }

  /**
   * 生成详情输出参数
   */
  private generateDetailOutputParameters(requirement: ApiGenerationConfig): any[] {
    return requirement.fields.map(field => ({
      name: field.name,
      type: field.type,
      required: field.required,
      description: field.description,
      showInDocs: true,
      deprecated: false,
    }));
  }

  /**
   * 生成创建输入参数
   */
  private generateCreateInputParameters(requirement: ApiGenerationConfig): any[] {
    return requirement.fields
      .filter(field => field.name !== 'id' && !field.name.includes('At'))
      .map(field => ({
        name: field.name,
        type: field.type,
        required: field.required,
        description: field.description,
        defaultValue: field.defaultValue,
        validationRules: this.generateFieldValidationRules(field),
        transformationRules: this.generateFieldTransformationRules(field),
        showInDocs: true,
        deprecated: false,
      }));
  }

  /**
   * 生成创建输出参数
   */
  private generateCreateOutputParameters(requirement: ApiGenerationConfig): any[] {
    return requirement.fields.map(field => ({
      name: field.name,
      type: field.type,
      required: field.required,
      description: field.description,
      showInDocs: true,
      deprecated: false,
    }));
  }

  /**
   * 生成更新输入参数
   */
  private generateUpdateInputParameters(requirement: ApiGenerationConfig): any[] {
    const parameters = [
      {
        name: 'id',
        type: 'string',
        required: true,
        description: 'ID',
        validationRules: [
          { type: 'required', message: 'ID不能为空', enabled: true }
        ],
        showInDocs: true,
        deprecated: false,
      }
    ];

    parameters.push(...requirement.fields
      .filter(field => field.name !== 'id' && !field.name.includes('At'))
      .map(field => ({
        name: field.name,
        type: field.type,
        required: false, // 更新时字段通常不是必填的
        description: field.description,
        validationRules: this.generateFieldValidationRules(field),
        transformationRules: this.generateFieldTransformationRules(field),
        showInDocs: true,
        deprecated: false,
      })));

    return parameters;
  }

  /**
   * 生成更新输出参数
   */
  private generateUpdateOutputParameters(requirement: ApiGenerationConfig): any[] {
    return requirement.fields.map(field => ({
      name: field.name,
      type: field.type,
      required: field.required,
      description: field.description,
      showInDocs: true,
      deprecated: false,
    }));
  }

  /**
   * 生成删除输入参数
   */
  private generateDeleteInputParameters(): any[] {
    return [
      {
        name: 'id',
        type: 'string',
        required: true,
        description: 'ID',
        validationRules: [
          { type: 'required', message: 'ID不能为空', enabled: true }
        ],
        showInDocs: true,
        deprecated: false,
      }
    ];
  }

  /**
   * 生成删除输出参数
   */
  private generateDeleteOutputParameters(): any[] {
    return [
      {
        name: 'success',
        type: 'boolean',
        required: true,
        description: '是否删除成功',
        showInDocs: true,
        deprecated: false,
      }
    ];
  }

  /**
   * 生成批量删除输入参数
   */
  private generateBatchDeleteInputParameters(): any[] {
    return [
      {
        name: 'ids',
        type: 'array',
        required: true,
        description: 'ID列表',
        arrayItemType: 'string',
        validationRules: [
          { type: 'required', message: 'ID列表不能为空', enabled: true }
        ],
        showInDocs: true,
        deprecated: false,
      }
    ];
  }

  /**
   * 生成批量删除输出参数
   */
  private generateBatchDeleteOutputParameters(): any[] {
    return [
      {
        name: 'deletedCount',
        type: 'number',
        required: true,
        description: '删除的记录数',
        showInDocs: true,
        deprecated: false,
      }
    ];
  }

  /**
   * 生成字段验证规则
   */
  private generateFieldValidationRules(field: any): any[] {
    const rules: any[] = [];

    if (field.required) {
      rules.push({
        type: 'required',
        message: `${field.description || field.name}不能为空`,
        enabled: true,
      });
    }

    switch (field.type) {
      case 'string':
        rules.push({
          type: 'maxLength',
          value: 255,
          message: `${field.description || field.name}长度不能超过255个字符`,
          enabled: true,
        });
        break;
      case 'number':
        rules.push({
          type: 'min',
          value: 0,
          message: `${field.description || field.name}不能小于0`,
          enabled: true,
        });
        break;
    }

    return rules;
  }

  /**
   * 生成字段转换规则
   */
  private generateFieldTransformationRules(field: any): any[] {
    const rules: any[] = [];

    switch (field.type) {
      case 'string':
        rules.push({
          type: 'trim',
          enabled: true,
          order: 1,
        });
        break;
      case 'number':
        rules.push({
          type: 'toNumber',
          enabled: true,
          order: 1,
        });
        break;
      case 'boolean':
        rules.push({
          type: 'toBoolean',
          enabled: true,
          order: 1,
        });
        break;
    }

    return rules;
  }

  /**
   * 获取Amis响应格式
   */
  private getAmisResponseFormat(): any {
    return {
      wrapResponse: true,
      successCode: 0,
      errorCode: 1,
      dataField: 'data',
      messageField: 'msg',
      statusField: 'status',
    };
  }

  /**
   * 获取默认分页配置
   */
  private getDefaultPaginationConfig(): any {
    return {
      enabled: true,
      pageParam: 'page',
      limitParam: 'limit',
      defaultLimit: 10,
      maxLimit: 100,
      totalField: 'total',
    };
  }

  /**
   * 获取默认排序配置
   */
  private getDefaultSortConfig(): any {
    return {
      enabled: true,
      sortByParam: 'sortBy',
      sortOrderParam: 'sortOrder',
      defaultSortBy: 'createdAt',
      defaultSortOrder: 'DESC',
      allowedFields: ['createdAt', 'updatedAt', 'name'],
    };
  }

  /**
   * 获取默认筛选配置
   */
  private getDefaultFilterConfig(requirement: ApiGenerationConfig): any {
    return {
      enabled: true,
      filterPrefix: 'filter_',
      supportedOperators: ['eq', 'ne', 'like', 'in', 'between'],
      filterFields: requirement.fields.map(field => ({
        field: field.name,
        type: field.type,
        operators: field.type === 'string' ? ['eq', 'like'] : ['eq', 'ne'],
      })),
    };
  }

  /**
   * 获取默认缓存配置
   */
  private getDefaultCacheConfig(): any {
    return {
      enabled: true,
      ttl: 300,
      keyTemplate: 'api:{method}:{path}:{query}',
      conditions: [],
    };
  }
}
