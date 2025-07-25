import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@lib/shared/prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import * as Joi from 'joi';

/**
 * 参数类型
 */
export type ParameterType = 
  | 'string' 
  | 'number' 
  | 'boolean' 
  | 'date' 
  | 'datetime' 
  | 'array' 
  | 'object' 
  | 'file' 
  | 'enum';

/**
 * 验证规则类型
 */
export type ValidationRuleType = 
  | 'required' 
  | 'minLength' 
  | 'maxLength' 
  | 'min' 
  | 'max' 
  | 'pattern' 
  | 'email' 
  | 'url' 
  | 'custom';

/**
 * 数据转换类型
 */
export type TransformationType = 
  | 'trim' 
  | 'toLowerCase' 
  | 'toUpperCase' 
  | 'toNumber' 
  | 'toBoolean' 
  | 'toDate' 
  | 'format' 
  | 'custom';

/**
 * 参数验证规则
 */
export interface ValidationRule {
  /** 规则类型 */
  type: ValidationRuleType;
  /** 规则值 */
  value?: any;
  /** 错误消息 */
  message: string;
  /** 自定义验证函数 */
  validator?: string;
  /** 是否启用 */
  enabled: boolean;
}

/**
 * 数据转换规则
 */
export interface TransformationRule {
  /** 转换类型 */
  type: TransformationType;
  /** 转换参数 */
  params?: any;
  /** 自定义转换函数 */
  transformer?: string;
  /** 是否启用 */
  enabled: boolean;
  /** 执行顺序 */
  order: number;
}

/**
 * 参数配置
 */
export interface ParameterConfig {
  /** 参数名称 */
  name: string;
  /** 参数类型 */
  type: ParameterType;
  /** 参数描述 */
  description?: string;
  /** 是否必填 */
  required: boolean;
  /** 默认值 */
  defaultValue?: any;
  /** 验证规则 */
  validationRules: ValidationRule[];
  /** 转换规则 */
  transformationRules: TransformationRule[];
  /** 枚举选项（当type为enum时） */
  enumOptions?: Array<{ label: string; value: any }>;
  /** 数组项类型（当type为array时） */
  arrayItemType?: ParameterType;
  /** 对象属性（当type为object时） */
  objectProperties?: Record<string, ParameterConfig>;
  /** 示例值 */
  example?: any;
  /** 是否在文档中显示 */
  showInDocs: boolean;
  /** 是否已弃用 */
  deprecated: boolean;
  /** 弃用说明 */
  deprecationMessage?: string;
}

/**
 * 接口配置
 */
export interface ApiConfig {
  /** 配置ID */
  id?: string;
  /** 接口路径 */
  path: string;
  /** HTTP方法 */
  method: string;
  /** 接口名称 */
  name: string;
  /** 接口描述 */
  description?: string;
  /** 输入参数配置 */
  inputParameters: ParameterConfig[];
  /** 输出参数配置 */
  outputParameters: ParameterConfig[];
  /** 响应格式配置 */
  responseFormat: {
    /** 是否包装响应 */
    wrapResponse: boolean;
    /** 成功状态码 */
    successCode: number;
    /** 错误状态码 */
    errorCode: number;
    /** 数据字段名 */
    dataField: string;
    /** 消息字段名 */
    messageField: string;
    /** 状态字段名 */
    statusField: string;
  };
  /** 分页配置 */
  paginationConfig?: {
    /** 是否启用分页 */
    enabled: boolean;
    /** 页码参数名 */
    pageParam: string;
    /** 页大小参数名 */
    limitParam: string;
    /** 默认页大小 */
    defaultLimit: number;
    /** 最大页大小 */
    maxLimit: number;
    /** 总数字段名 */
    totalField: string;
  };
  /** 排序配置 */
  sortConfig?: {
    /** 是否启用排序 */
    enabled: boolean;
    /** 排序字段参数名 */
    sortByParam: string;
    /** 排序方向参数名 */
    sortOrderParam: string;
    /** 默认排序字段 */
    defaultSortBy: string;
    /** 默认排序方向 */
    defaultSortOrder: 'ASC' | 'DESC';
    /** 允许排序的字段 */
    allowedFields: string[];
  };
  /** 筛选配置 */
  filterConfig?: {
    /** 是否启用筛选 */
    enabled: boolean;
    /** 筛选参数前缀 */
    filterPrefix: string;
    /** 支持的筛选操作符 */
    supportedOperators: string[];
    /** 筛选字段配置 */
    filterFields: Array<{
      field: string;
      type: ParameterType;
      operators: string[];
    }>;
  };
  /** 缓存配置 */
  cacheConfig?: {
    /** 是否启用缓存 */
    enabled: boolean;
    /** 缓存TTL（秒） */
    ttl: number;
    /** 缓存键模板 */
    keyTemplate: string;
    /** 缓存条件 */
    conditions: string[];
  };
  /** 权限配置 */
  permissionConfig?: {
    /** 是否需要认证 */
    requireAuth: boolean;
    /** 所需权限 */
    permissions: string[];
    /** 数据权限 */
    dataPermissions: string[];
  };
  /** 创建时间 */
  createdAt?: Date;
  /** 更新时间 */
  updatedAt?: Date;
  /** 创建者 */
  createdBy?: string;
  /** 版本号 */
  version: number;
  /** 是否启用 */
  enabled: boolean;
}

/**
 * 接口参数配置服务
 */
@Injectable()
export class ApiParameterConfigService {
  private readonly logger = new Logger(ApiParameterConfigService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * 创建接口配置
   */
  async createApiConfig(config: Omit<ApiConfig, 'id' | 'createdAt' | 'updatedAt' | 'version'>): Promise<ApiConfig> {
    try {
      // 验证配置
      this.validateApiConfig(config);

      // 检查路径和方法是否已存在
      const existing = await this.prisma.apiConfig.findFirst({
        where: {
          path: config.path,
          method: config.method,
        },
      });

      if (existing) {
        throw new BadRequestException(`接口 ${config.method} ${config.path} 已存在`);
      }

      // 创建配置
      const created = await this.prisma.apiConfig.create({
        data: {
          ...config,
          version: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });

      this.logger.log(`创建接口配置: ${config.method} ${config.path}`);
      return created;

    } catch (error) {
      this.logger.error('创建接口配置失败:', error);
      throw error;
    }
  }

  /**
   * 更新接口配置
   */
  async updateApiConfig(id: string, config: Partial<ApiConfig>): Promise<ApiConfig> {
    try {
      // 检查配置是否存在
      const existing = await this.findApiConfigById(id);

      // 验证配置
      if (config.inputParameters || config.outputParameters) {
        this.validateApiConfig({ ...existing, ...config } as ApiConfig);
      }

      // 更新配置
      const updated = await this.prisma.apiConfig.update({
        where: { id },
        data: {
          ...config,
          version: existing.version + 1,
          updatedAt: new Date(),
        },
      });

      this.logger.log(`更新接口配置: ${id}`);
      return updated;

    } catch (error) {
      this.logger.error('更新接口配置失败:', error);
      throw error;
    }
  }

  /**
   * 删除接口配置
   */
  async deleteApiConfig(id: string): Promise<void> {
    try {
      await this.findApiConfigById(id);

      await this.prisma.apiConfig.delete({
        where: { id },
      });

      this.logger.log(`删除接口配置: ${id}`);

    } catch (error) {
      this.logger.error('删除接口配置失败:', error);
      throw error;
    }
  }

  /**
   * 根据ID获取接口配置
   */
  async findApiConfigById(id: string): Promise<ApiConfig> {
    try {
      const config = await this.prisma.apiConfig.findUnique({
        where: { id },
      });

      if (!config) {
        throw new NotFoundException(`接口配置不存在: ${id}`);
      }

      return config;

    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error('获取接口配置失败:', error);
      throw new BadRequestException('获取接口配置失败');
    }
  }

  /**
   * 根据路径和方法获取接口配置
   */
  async findApiConfigByPathAndMethod(path: string, method: string): Promise<ApiConfig | null> {
    try {
      const config = await this.prisma.apiConfig.findFirst({
        where: {
          path,
          method,
          enabled: true,
        },
      });

      return config;

    } catch (error) {
      this.logger.error('获取接口配置失败:', error);
      return null;
    }
  }

  /**
   * 获取接口配置列表
   */
  async findApiConfigs(query: {
    page?: number;
    limit?: number;
    search?: string;
    method?: string;
    enabled?: boolean;
  }): Promise<{
    data: ApiConfig[];
    total: number;
    page: number;
    limit: number;
  }> {
    try {
      const { page = 1, limit = 10, search, method, enabled } = query;
      const skip = (page - 1) * limit;

      // 构建查询条件
      const where: any = {};

      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { path: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ];
      }

      if (method) {
        where.method = method;
      }

      if (enabled !== undefined) {
        where.enabled = enabled;
      }

      // 执行查询
      const [data, total] = await Promise.all([
        this.prisma.apiConfig.findMany({
          where,
          skip,
          take: limit,
          orderBy: { updatedAt: 'desc' },
        }),
        this.prisma.apiConfig.count({ where }),
      ]);

      return {
        data,
        total,
        page,
        limit,
      };

    } catch (error) {
      this.logger.error('获取接口配置列表失败:', error);
      throw new BadRequestException('获取接口配置列表失败');
    }
  }

  /**
   * 验证参数值
   */
  async validateParameters(
    parameters: ParameterConfig[],
    values: Record<string, any>
  ): Promise<{
    isValid: boolean;
    errors: Array<{ field: string; message: string }>;
    transformedValues: Record<string, any>;
  }> {
    const errors: Array<{ field: string; message: string }> = [];
    const transformedValues: Record<string, any> = {};

    try {
      for (const param of parameters) {
        const value = values[param.name];

        // 检查必填参数
        if (param.required && (value === undefined || value === null || value === '')) {
          errors.push({
            field: param.name,
            message: `${param.name} 是必填参数`,
          });
          continue;
        }

        // 如果值为空且不是必填，使用默认值
        if ((value === undefined || value === null || value === '') && param.defaultValue !== undefined) {
          transformedValues[param.name] = param.defaultValue;
          continue;
        }

        // 如果值为空且没有默认值，跳过验证
        if (value === undefined || value === null || value === '') {
          continue;
        }

        // 数据转换
        let transformedValue = value;
        try {
          transformedValue = await this.transformValue(value, param.transformationRules);
        } catch (transformError) {
          errors.push({
            field: param.name,
            message: `${param.name} 数据转换失败: ${transformError.message}`,
          });
          continue;
        }

        // 类型验证
        const typeValidation = this.validateType(transformedValue, param.type, param);
        if (!typeValidation.isValid) {
          errors.push({
            field: param.name,
            message: typeValidation.message,
          });
          continue;
        }

        // 验证规则检查
        const ruleValidation = await this.validateRules(transformedValue, param.validationRules);
        if (!ruleValidation.isValid) {
          errors.push({
            field: param.name,
            message: ruleValidation.message,
          });
          continue;
        }

        transformedValues[param.name] = transformedValue;
      }

      return {
        isValid: errors.length === 0,
        errors,
        transformedValues,
      };

    } catch (error) {
      this.logger.error('参数验证失败:', error);
      return {
        isValid: false,
        errors: [{ field: 'system', message: '参数验证系统错误' }],
        transformedValues: {},
      };
    }
  }

  /**
   * 生成Joi验证Schema
   */
  generateJoiSchema(parameters: ParameterConfig[]): Joi.ObjectSchema {
    const schemaFields: Record<string, Joi.Schema> = {};

    for (const param of parameters) {
      let schema = this.createJoiSchemaForType(param.type, param);

      // 添加验证规则
      for (const rule of param.validationRules) {
        if (!rule.enabled) continue;

        switch (rule.type) {
          case 'required':
            schema = schema.required();
            break;
          case 'minLength':
            schema = schema.min(rule.value);
            break;
          case 'maxLength':
            schema = schema.max(rule.value);
            break;
          case 'min':
            schema = schema.min(rule.value);
            break;
          case 'max':
            schema = schema.max(rule.value);
            break;
          case 'pattern':
            schema = schema.pattern(new RegExp(rule.value));
            break;
          case 'email':
            schema = schema.email();
            break;
          case 'url':
            schema = schema.uri();
            break;
        }

        if (rule.message) {
          schema = schema.messages({
            'any.required': rule.message,
            'string.min': rule.message,
            'string.max': rule.message,
            'number.min': rule.message,
            'number.max': rule.message,
            'string.pattern.base': rule.message,
            'string.email': rule.message,
            'string.uri': rule.message,
          });
        }
      }

      // 设置默认值
      if (param.defaultValue !== undefined) {
        schema = schema.default(param.defaultValue);
      }

      // 设置可选
      if (!param.required) {
        schema = schema.optional();
      }

      schemaFields[param.name] = schema;
    }

    return Joi.object(schemaFields);
  }

  /**
   * 生成OpenAPI Schema
   */
  generateOpenApiSchema(parameters: ParameterConfig[]): any {
    const properties: Record<string, any> = {};
    const required: string[] = [];

    for (const param of parameters) {
      const property: any = {
        type: this.mapTypeToOpenApi(param.type),
        description: param.description,
      };

      if (param.example !== undefined) {
        property.example = param.example;
      }

      if (param.defaultValue !== undefined) {
        property.default = param.defaultValue;
      }

      if (param.type === 'enum' && param.enumOptions) {
        property.enum = param.enumOptions.map(option => option.value);
      }

      if (param.type === 'array' && param.arrayItemType) {
        property.items = {
          type: this.mapTypeToOpenApi(param.arrayItemType),
        };
      }

      if (param.type === 'object' && param.objectProperties) {
        property.properties = this.generateOpenApiSchema(Object.values(param.objectProperties)).properties;
      }

      // 添加验证规则到schema
      for (const rule of param.validationRules) {
        if (!rule.enabled) continue;

        switch (rule.type) {
          case 'minLength':
            property.minLength = rule.value;
            break;
          case 'maxLength':
            property.maxLength = rule.value;
            break;
          case 'min':
            property.minimum = rule.value;
            break;
          case 'max':
            property.maximum = rule.value;
            break;
          case 'pattern':
            property.pattern = rule.value;
            break;
          case 'email':
            property.format = 'email';
            break;
          case 'url':
            property.format = 'uri';
            break;
        }
      }

      if (param.deprecated) {
        property.deprecated = true;
        if (param.deprecationMessage) {
          property.description += ` (已弃用: ${param.deprecationMessage})`;
        }
      }

      properties[param.name] = property;

      if (param.required) {
        required.push(param.name);
      }
    }

    return {
      type: 'object',
      properties,
      required: required.length > 0 ? required : undefined,
    };
  }

  /**
   * 复制接口配置
   */
  async duplicateApiConfig(id: string, newName: string, newPath: string): Promise<ApiConfig> {
    try {
      const original = await this.findApiConfigById(id);

      const duplicated = await this.createApiConfig({
        ...original,
        name: newName,
        path: newPath,
        version: 1,
      });

      this.logger.log(`复制接口配置: ${id} -> ${duplicated.id}`);
      return duplicated;

    } catch (error) {
      this.logger.error('复制接口配置失败:', error);
      throw error;
    }
  }

  /**
   * 导入接口配置
   */
  async importApiConfigs(configs: ApiConfig[]): Promise<{
    success: number;
    failed: number;
    errors: string[];
  }> {
    let success = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const config of configs) {
      try {
        await this.createApiConfig(config);
        success++;
      } catch (error) {
        failed++;
        errors.push(`导入 ${config.method} ${config.path} 失败: ${error.message}`);
      }
    }

    this.logger.log(`导入接口配置完成: 成功 ${success}, 失败 ${failed}`);
    return { success, failed, errors };
  }

  /**
   * 导出接口配置
   */
  async exportApiConfigs(ids?: string[]): Promise<ApiConfig[]> {
    try {
      const where = ids ? { id: { in: ids } } : {};
      
      const configs = await this.prisma.apiConfig.findMany({
        where,
        orderBy: { createdAt: 'asc' },
      });

      this.logger.log(`导出接口配置: ${configs.length} 个`);
      return configs;

    } catch (error) {
      this.logger.error('导出接口配置失败:', error);
      throw new BadRequestException('导出接口配置失败');
    }
  }

  /**
   * 验证接口配置
   */
  private validateApiConfig(config: ApiConfig): void {
    if (!config.path) {
      throw new BadRequestException('接口路径不能为空');
    }

    if (!config.method) {
      throw new BadRequestException('HTTP方法不能为空');
    }

    if (!config.name) {
      throw new BadRequestException('接口名称不能为空');
    }

    // 验证参数配置
    this.validateParameters(config.inputParameters);
    this.validateParameters(config.outputParameters);
  }

  /**
   * 验证参数配置
   */
  private validateParameters(parameters: ParameterConfig[]): void {
    const names = new Set<string>();

    for (const param of parameters) {
      if (!param.name) {
        throw new BadRequestException('参数名称不能为空');
      }

      if (names.has(param.name)) {
        throw new BadRequestException(`参数名称重复: ${param.name}`);
      }

      names.add(param.name);

      // 验证枚举选项
      if (param.type === 'enum' && (!param.enumOptions || param.enumOptions.length === 0)) {
        throw new BadRequestException(`枚举参数 ${param.name} 必须提供选项`);
      }

      // 验证对象属性
      if (param.type === 'object' && param.objectProperties) {
        this.validateParameters(Object.values(param.objectProperties));
      }
    }
  }

  /**
   * 数据转换
   */
  private async transformValue(value: any, rules: TransformationRule[]): Promise<any> {
    let result = value;

    // 按顺序执行转换规则
    const enabledRules = rules.filter(rule => rule.enabled).sort((a, b) => a.order - b.order);

    for (const rule of enabledRules) {
      switch (rule.type) {
        case 'trim':
          if (typeof result === 'string') {
            result = result.trim();
          }
          break;
        case 'toLowerCase':
          if (typeof result === 'string') {
            result = result.toLowerCase();
          }
          break;
        case 'toUpperCase':
          if (typeof result === 'string') {
            result = result.toUpperCase();
          }
          break;
        case 'toNumber':
          result = Number(result);
          if (isNaN(result)) {
            throw new Error('无法转换为数字');
          }
          break;
        case 'toBoolean':
          if (typeof result === 'string') {
            result = result.toLowerCase() === 'true' || result === '1';
          } else {
            result = Boolean(result);
          }
          break;
        case 'toDate':
          result = new Date(result);
          if (isNaN(result.getTime())) {
            throw new Error('无法转换为日期');
          }
          break;
        case 'format':
          if (rule.params && rule.params.template) {
            result = rule.params.template.replace(/\{value\}/g, result);
          }
          break;
        case 'custom':
          if (rule.transformer) {
            // 执行自定义转换函数
            try {
              const transformerFn = new Function('value', 'params', rule.transformer);
              result = transformerFn(result, rule.params);
            } catch (error) {
              throw new Error(`自定义转换失败: ${error.message}`);
            }
          }
          break;
      }
    }

    return result;
  }

  /**
   * 类型验证
   */
  private validateType(value: any, type: ParameterType, param: ParameterConfig): {
    isValid: boolean;
    message: string;
  } {
    switch (type) {
      case 'string':
        if (typeof value !== 'string') {
          return { isValid: false, message: `${param.name} 必须是字符串` };
        }
        break;
      case 'number':
        if (typeof value !== 'number' || isNaN(value)) {
          return { isValid: false, message: `${param.name} 必须是数字` };
        }
        break;
      case 'boolean':
        if (typeof value !== 'boolean') {
          return { isValid: false, message: `${param.name} 必须是布尔值` };
        }
        break;
      case 'date':
      case 'datetime':
        if (!(value instanceof Date) && isNaN(Date.parse(value))) {
          return { isValid: false, message: `${param.name} 必须是有效的日期` };
        }
        break;
      case 'array':
        if (!Array.isArray(value)) {
          return { isValid: false, message: `${param.name} 必须是数组` };
        }
        break;
      case 'object':
        if (typeof value !== 'object' || value === null || Array.isArray(value)) {
          return { isValid: false, message: `${param.name} 必须是对象` };
        }
        break;
      case 'enum':
        if (param.enumOptions && !param.enumOptions.some(option => option.value === value)) {
          return { isValid: false, message: `${param.name} 值无效` };
        }
        break;
    }

    return { isValid: true, message: '' };
  }

  /**
   * 验证规则检查
   */
  private async validateRules(value: any, rules: ValidationRule[]): Promise<{
    isValid: boolean;
    message: string;
  }> {
    for (const rule of rules) {
      if (!rule.enabled) continue;

      switch (rule.type) {
        case 'minLength':
          if (typeof value === 'string' && value.length < rule.value) {
            return { isValid: false, message: rule.message };
          }
          break;
        case 'maxLength':
          if (typeof value === 'string' && value.length > rule.value) {
            return { isValid: false, message: rule.message };
          }
          break;
        case 'min':
          if (typeof value === 'number' && value < rule.value) {
            return { isValid: false, message: rule.message };
          }
          break;
        case 'max':
          if (typeof value === 'number' && value > rule.value) {
            return { isValid: false, message: rule.message };
          }
          break;
        case 'pattern':
          if (typeof value === 'string' && !new RegExp(rule.value).test(value)) {
            return { isValid: false, message: rule.message };
          }
          break;
        case 'email':
          if (typeof value === 'string' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
            return { isValid: false, message: rule.message };
          }
          break;
        case 'url':
          if (typeof value === 'string') {
            try {
              new URL(value);
            } catch {
              return { isValid: false, message: rule.message };
            }
          }
          break;
        case 'custom':
          if (rule.validator) {
            try {
              const validatorFn = new Function('value', 'rule', rule.validator);
              const result = validatorFn(value, rule);
              if (!result) {
                return { isValid: false, message: rule.message };
              }
            } catch (error) {
              return { isValid: false, message: `自定义验证失败: ${error.message}` };
            }
          }
          break;
      }
    }

    return { isValid: true, message: '' };
  }

  /**
   * 创建Joi Schema
   */
  private createJoiSchemaForType(type: ParameterType, param: ParameterConfig): Joi.Schema {
    switch (type) {
      case 'string':
        return Joi.string();
      case 'number':
        return Joi.number();
      case 'boolean':
        return Joi.boolean();
      case 'date':
      case 'datetime':
        return Joi.date();
      case 'array':
        if (param.arrayItemType) {
          return Joi.array().items(this.createJoiSchemaForType(param.arrayItemType, param));
        }
        return Joi.array();
      case 'object':
        if (param.objectProperties) {
          const objectSchema: Record<string, Joi.Schema> = {};
          for (const [key, prop] of Object.entries(param.objectProperties)) {
            objectSchema[key] = this.createJoiSchemaForType(prop.type, prop);
          }
          return Joi.object(objectSchema);
        }
        return Joi.object();
      case 'enum':
        if (param.enumOptions) {
          return Joi.valid(...param.enumOptions.map(option => option.value));
        }
        return Joi.any();
      case 'file':
        return Joi.any();
      default:
        return Joi.any();
    }
  }

  /**
   * 映射类型到OpenAPI
   */
  private mapTypeToOpenApi(type: ParameterType): string {
    switch (type) {
      case 'string':
      case 'enum':
        return 'string';
      case 'number':
        return 'number';
      case 'boolean':
        return 'boolean';
      case 'date':
      case 'datetime':
        return 'string';
      case 'array':
        return 'array';
      case 'object':
        return 'object';
      case 'file':
        return 'string';
      default:
        return 'string';
    }
  }

  /**
   * 获取参数配置模板
   */
  getParameterTemplates(): Record<string, ParameterConfig> {
    return {
      id: {
        name: 'id',
        type: 'string',
        description: '唯一标识符',
        required: true,
        validationRules: [
          {
            type: 'required',
            message: 'ID不能为空',
            enabled: true,
          },
          {
            type: 'pattern',
            value: '^[a-zA-Z0-9-_]+$',
            message: 'ID格式无效',
            enabled: true,
          },
        ],
        transformationRules: [
          {
            type: 'trim',
            enabled: true,
            order: 1,
          },
        ],
        example: 'user_123',
        showInDocs: true,
        deprecated: false,
      },
      page: {
        name: 'page',
        type: 'number',
        description: '页码',
        required: false,
        defaultValue: 1,
        validationRules: [
          {
            type: 'min',
            value: 1,
            message: '页码必须大于0',
            enabled: true,
          },
        ],
        transformationRules: [
          {
            type: 'toNumber',
            enabled: true,
            order: 1,
          },
        ],
        example: 1,
        showInDocs: true,
        deprecated: false,
      },
      limit: {
        name: 'limit',
        type: 'number',
        description: '每页数量',
        required: false,
        defaultValue: 10,
        validationRules: [
          {
            type: 'min',
            value: 1,
            message: '每页数量必须大于0',
            enabled: true,
          },
          {
            type: 'max',
            value: 100,
            message: '每页数量不能超过100',
            enabled: true,
          },
        ],
        transformationRules: [
          {
            type: 'toNumber',
            enabled: true,
            order: 1,
          },
        ],
        example: 10,
        showInDocs: true,
        deprecated: false,
      },
      search: {
        name: 'search',
        type: 'string',
        description: '搜索关键词',
        required: false,
        validationRules: [
          {
            type: 'maxLength',
            value: 100,
            message: '搜索关键词不能超过100个字符',
            enabled: true,
          },
        ],
        transformationRules: [
          {
            type: 'trim',
            enabled: true,
            order: 1,
          },
        ],
        example: 'keyword',
        showInDocs: true,
        deprecated: false,
      },
      sortBy: {
        name: 'sortBy',
        type: 'string',
        description: '排序字段',
        required: false,
        defaultValue: 'createdAt',
        validationRules: [],
        transformationRules: [
          {
            type: 'trim',
            enabled: true,
            order: 1,
          },
        ],
        example: 'createdAt',
        showInDocs: true,
        deprecated: false,
      },
      sortOrder: {
        name: 'sortOrder',
        type: 'enum',
        description: '排序方向',
        required: false,
        defaultValue: 'DESC',
        enumOptions: [
          { label: '升序', value: 'ASC' },
          { label: '降序', value: 'DESC' },
        ],
        validationRules: [],
        transformationRules: [
          {
            type: 'toUpperCase',
            enabled: true,
            order: 1,
          },
        ],
        example: 'DESC',
        showInDocs: true,
        deprecated: false,
      },
      email: {
        name: 'email',
        type: 'string',
        description: '邮箱地址',
        required: true,
        validationRules: [
          {
            type: 'required',
            message: '邮箱不能为空',
            enabled: true,
          },
          {
            type: 'email',
            message: '邮箱格式无效',
            enabled: true,
          },
        ],
        transformationRules: [
          {
            type: 'trim',
            enabled: true,
            order: 1,
          },
          {
            type: 'toLowerCase',
            enabled: true,
            order: 2,
          },
        ],
        example: 'user@example.com',
        showInDocs: true,
        deprecated: false,
      },
      phone: {
        name: 'phone',
        type: 'string',
        description: '手机号码',
        required: false,
        validationRules: [
          {
            type: 'pattern',
            value: '^1[3-9]\\d{9}$',
            message: '手机号码格式无效',
            enabled: true,
          },
        ],
        transformationRules: [
          {
            type: 'trim',
            enabled: true,
            order: 1,
          },
        ],
        example: '13800138000',
        showInDocs: true,
        deprecated: false,
      },
      status: {
        name: 'status',
        type: 'enum',
        description: '状态',
        required: false,
        enumOptions: [
          { label: '启用', value: 'active' },
          { label: '禁用', value: 'inactive' },
          { label: '删除', value: 'deleted' },
        ],
        validationRules: [],
        transformationRules: [],
        example: 'active',
        showInDocs: true,
        deprecated: false,
      },
      dateRange: {
        name: 'dateRange',
        type: 'array',
        description: '日期范围',
        required: false,
        arrayItemType: 'datetime',
        validationRules: [
          {
            type: 'custom',
            validator: `
              if (value && value.length === 2) {
                const start = new Date(value[0]);
                const end = new Date(value[1]);
                return start <= end;
              }
              return true;
            `,
            message: '开始日期不能晚于结束日期',
            enabled: true,
          },
        ],
        transformationRules: [],
        example: ['2024-01-01', '2024-12-31'],
        showInDocs: true,
        deprecated: false,
      },
    };
  }

  /**
   * 获取响应格式模板
   */
  getResponseFormatTemplates(): Record<string, any> {
    return {
      amis: {
        name: 'Amis格式',
        description: 'Amis框架标准响应格式',
        format: {
          wrapResponse: true,
          successCode: 0,
          errorCode: 1,
          dataField: 'data',
          messageField: 'msg',
          statusField: 'status',
        },
      },
      restful: {
        name: 'RESTful格式',
        description: 'RESTful API标准响应格式',
        format: {
          wrapResponse: false,
          successCode: 200,
          errorCode: 400,
          dataField: 'data',
          messageField: 'message',
          statusField: 'code',
        },
      },
      custom: {
        name: '自定义格式',
        description: '可自定义的响应格式',
        format: {
          wrapResponse: true,
          successCode: 200,
          errorCode: 500,
          dataField: 'result',
          messageField: 'message',
          statusField: 'code',
        },
      },
    };
  }

  /**
   * 生成接口文档
   */
  generateApiDocumentation(config: ApiConfig): any {
    return {
      path: config.path,
      method: config.method,
      name: config.name,
      description: config.description,
      parameters: {
        input: this.generateParameterDocs(config.inputParameters),
        output: this.generateParameterDocs(config.outputParameters),
      },
      examples: {
        request: this.generateRequestExample(config.inputParameters),
        response: this.generateResponseExample(config.outputParameters, config.responseFormat),
      },
      responseFormat: config.responseFormat,
      pagination: config.paginationConfig,
      sorting: config.sortConfig,
      filtering: config.filterConfig,
      caching: config.cacheConfig,
      permissions: config.permissionConfig,
      version: config.version,
      deprecated: !config.enabled,
    };
  }

  /**
   * 生成参数文档
   */
  private generateParameterDocs(parameters: ParameterConfig[]): any[] {
    return parameters
      .filter(param => param.showInDocs)
      .map(param => ({
        name: param.name,
        type: param.type,
        description: param.description,
        required: param.required,
        defaultValue: param.defaultValue,
        example: param.example,
        validationRules: param.validationRules.filter(rule => rule.enabled),
        enumOptions: param.enumOptions,
        deprecated: param.deprecated,
        deprecationMessage: param.deprecationMessage,
      }));
  }

  /**
   * 生成请求示例
   */
  private generateRequestExample(parameters: ParameterConfig[]): any {
    const example: any = {};

    for (const param of parameters) {
      if (param.example !== undefined) {
        example[param.name] = param.example;
      } else if (param.defaultValue !== undefined) {
        example[param.name] = param.defaultValue;
      } else {
        example[param.name] = this.generateExampleValue(param.type, param);
      }
    }

    return example;
  }

  /**
   * 生成响应示例
   */
  private generateResponseExample(parameters: ParameterConfig[], responseFormat: any): any {
    const data: any = {};

    for (const param of parameters) {
      if (param.example !== undefined) {
        data[param.name] = param.example;
      } else {
        data[param.name] = this.generateExampleValue(param.type, param);
      }
    }

    if (responseFormat.wrapResponse) {
      return {
        [responseFormat.statusField]: responseFormat.successCode,
        [responseFormat.messageField]: 'success',
        [responseFormat.dataField]: data,
      };
    }

    return data;
  }

  /**
   * 生成示例值
   */
  private generateExampleValue(type: ParameterType, param: ParameterConfig): any {
    switch (type) {
      case 'string':
        return 'example string';
      case 'number':
        return 123;
      case 'boolean':
        return true;
      case 'date':
      case 'datetime':
        return new Date().toISOString();
      case 'array':
        return [this.generateExampleValue(param.arrayItemType || 'string', param)];
      case 'object':
        if (param.objectProperties) {
          const obj: any = {};
          for (const [key, prop] of Object.entries(param.objectProperties)) {
            obj[key] = this.generateExampleValue(prop.type, prop);
          }
          return obj;
        }
        return {};
      case 'enum':
        return param.enumOptions?.[0]?.value || 'option1';
      case 'file':
        return 'file.txt';
      default:
        return null;
    }
  }
}
