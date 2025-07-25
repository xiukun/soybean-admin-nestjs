import { SetMetadata, applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiParam, ApiQuery, ApiBody } from '@nestjs/swagger';
import { ParameterConfig, ValidationRule, TransformationRule } from '../services/api-parameter-config.service';

/**
 * API配置元数据键
 */
export const API_CONFIG_KEY = 'api_config';
export const API_VALIDATION_KEY = 'api_validation';
export const API_TRANSFORMATION_KEY = 'api_transformation';

/**
 * API配置选项
 */
export interface ApiConfigOptions {
  /** 接口名称 */
  name: string;
  /** 接口描述 */
  description?: string;
  /** 输入参数配置 */
  inputParameters?: ParameterConfig[];
  /** 输出参数配置 */
  outputParameters?: ParameterConfig[];
  /** 响应格式配置 */
  responseFormat?: any;
  /** 分页配置 */
  paginationConfig?: any;
  /** 排序配置 */
  sortConfig?: any;
  /** 筛选配置 */
  filterConfig?: any;
  /** 缓存配置 */
  cacheConfig?: any;
  /** 权限配置 */
  permissionConfig?: any;
  /** 是否自动生成Swagger文档 */
  generateSwagger?: boolean;
}

/**
 * 参数验证选项
 */
export interface ParameterValidationOptions {
  /** 参数名称 */
  name: string;
  /** 参数类型 */
  type: string;
  /** 是否必填 */
  required?: boolean;
  /** 验证规则 */
  rules?: ValidationRule[];
  /** 转换规则 */
  transformations?: TransformationRule[];
  /** 默认值 */
  defaultValue?: any;
  /** 描述 */
  description?: string;
}

/**
 * API配置装饰器
 * 用于配置API的参数验证、响应格式等
 */
export function ApiConfig(options: ApiConfigOptions) {
  const decorators = [
    SetMetadata(API_CONFIG_KEY, options),
  ];

  if (options.generateSwagger !== false) {
    // 自动生成Swagger文档
    decorators.push(
      ApiOperation({
        summary: options.name,
        description: options.description,
      })
    );

    // 添加响应文档
    if (options.outputParameters) {
      decorators.push(
        ApiResponse({
          status: 200,
          description: '成功响应',
          schema: generateSwaggerSchema(options.outputParameters),
        })
      );
    }

    // 添加参数文档
    if (options.inputParameters) {
      for (const param of options.inputParameters) {
        if (param.showInDocs !== false) {
          decorators.push(
            ApiQuery({
              name: param.name,
              description: param.description,
              required: param.required,
              type: mapTypeToSwagger(param.type),
              example: param.example,
            })
          );
        }
      }
    }
  }

  return applyDecorators(...decorators);
}

/**
 * 参数验证装饰器
 * 用于单个参数的验证配置
 */
export function ValidateParameter(options: ParameterValidationOptions) {
  return function (target: any, propertyKey: string, parameterIndex: number) {
    const existingValidations = Reflect.getMetadata(API_VALIDATION_KEY, target, propertyKey) || [];
    existingValidations[parameterIndex] = options;
    Reflect.defineMetadata(API_VALIDATION_KEY, existingValidations, target, propertyKey);
  };
}

/**
 * 参数转换装饰器
 * 用于参数的自动转换
 */
export function TransformParameter(transformations: TransformationRule[]) {
  return function (target: any, propertyKey: string, parameterIndex: number) {
    const existingTransformations = Reflect.getMetadata(API_TRANSFORMATION_KEY, target, propertyKey) || [];
    existingTransformations[parameterIndex] = transformations;
    Reflect.defineMetadata(API_TRANSFORMATION_KEY, existingTransformations, target, propertyKey);
  };
}

/**
 * 快速验证装饰器
 */
export const ValidateString = (options: {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  email?: boolean;
  url?: boolean;
  description?: string;
}) => {
  const rules: ValidationRule[] = [];

  if (options.required) {
    rules.push({
      type: 'required',
      message: '此字段为必填项',
      enabled: true,
    });
  }

  if (options.minLength !== undefined) {
    rules.push({
      type: 'minLength',
      value: options.minLength,
      message: `长度不能少于${options.minLength}个字符`,
      enabled: true,
    });
  }

  if (options.maxLength !== undefined) {
    rules.push({
      type: 'maxLength',
      value: options.maxLength,
      message: `长度不能超过${options.maxLength}个字符`,
      enabled: true,
    });
  }

  if (options.pattern) {
    rules.push({
      type: 'pattern',
      value: options.pattern,
      message: '格式不正确',
      enabled: true,
    });
  }

  if (options.email) {
    rules.push({
      type: 'email',
      message: '邮箱格式不正确',
      enabled: true,
    });
  }

  if (options.url) {
    rules.push({
      type: 'url',
      message: 'URL格式不正确',
      enabled: true,
    });
  }

  return ValidateParameter({
    name: 'string_param',
    type: 'string',
    required: options.required,
    rules,
    description: options.description,
  });
};

export const ValidateNumber = (options: {
  required?: boolean;
  min?: number;
  max?: number;
  description?: string;
}) => {
  const rules: ValidationRule[] = [];

  if (options.required) {
    rules.push({
      type: 'required',
      message: '此字段为必填项',
      enabled: true,
    });
  }

  if (options.min !== undefined) {
    rules.push({
      type: 'min',
      value: options.min,
      message: `值不能小于${options.min}`,
      enabled: true,
    });
  }

  if (options.max !== undefined) {
    rules.push({
      type: 'max',
      value: options.max,
      message: `值不能大于${options.max}`,
      enabled: true,
    });
  }

  return ValidateParameter({
    name: 'number_param',
    type: 'number',
    required: options.required,
    rules,
    description: options.description,
  });
};

export const ValidateEnum = (options: {
  required?: boolean;
  values: any[];
  description?: string;
}) => {
  const rules: ValidationRule[] = [];

  if (options.required) {
    rules.push({
      type: 'required',
      message: '此字段为必填项',
      enabled: true,
    });
  }

  return ValidateParameter({
    name: 'enum_param',
    type: 'enum',
    required: options.required,
    rules,
    description: options.description,
  });
};

/**
 * 分页参数装饰器
 */
export function PaginationParams() {
  return applyDecorators(
    ApiQuery({
      name: 'page',
      required: false,
      description: '页码',
      type: 'number',
      example: 1,
    }),
    ApiQuery({
      name: 'limit',
      required: false,
      description: '每页数量',
      type: 'number',
      example: 10,
    }),
  );
}

/**
 * 排序参数装饰器
 */
export function SortParams(allowedFields?: string[]) {
  const decorators = [
    ApiQuery({
      name: 'sortBy',
      required: false,
      description: '排序字段',
      type: 'string',
      example: 'createdAt',
    }),
    ApiQuery({
      name: 'sortOrder',
      required: false,
      description: '排序方向',
      enum: ['ASC', 'DESC'],
      example: 'DESC',
    }),
  ];

  if (allowedFields) {
    decorators[0] = ApiQuery({
      name: 'sortBy',
      required: false,
      description: `排序字段，可选值: ${allowedFields.join(', ')}`,
      enum: allowedFields,
      example: allowedFields[0],
    });
  }

  return applyDecorators(...decorators);
}

/**
 * 搜索参数装饰器
 */
export function SearchParams() {
  return applyDecorators(
    ApiQuery({
      name: 'search',
      required: false,
      description: '搜索关键词',
      type: 'string',
      example: 'keyword',
    }),
  );
}

/**
 * 筛选参数装饰器
 */
export function FilterParams(filters: Array<{ name: string; type: string; description?: string }>) {
  const decorators = filters.map(filter =>
    ApiQuery({
      name: filter.name,
      required: false,
      description: filter.description || `${filter.name}筛选`,
      type: filter.type,
    })
  );

  return applyDecorators(...decorators);
}

/**
 * Amis响应格式装饰器
 */
export function AmisResponse(dataType?: any) {
  return applyDecorators(
    ApiResponse({
      status: 200,
      description: '成功响应',
      schema: {
        type: 'object',
        properties: {
          status: { type: 'number', example: 0, description: '状态码，0表示成功' },
          msg: { type: 'string', example: 'success', description: '响应消息' },
          data: dataType || { type: 'object', description: '响应数据' },
        },
      },
    }),
    ApiResponse({
      status: 400,
      description: '请求错误',
      schema: {
        type: 'object',
        properties: {
          status: { type: 'number', example: 1, description: '状态码，非0表示失败' },
          msg: { type: 'string', example: 'error message', description: '错误消息' },
          data: { type: 'null', description: '错误时数据为null' },
        },
      },
    }),
  );
}

/**
 * 生成Swagger Schema
 */
function generateSwaggerSchema(parameters: ParameterConfig[]): any {
  const properties: Record<string, any> = {};
  const required: string[] = [];

  for (const param of parameters) {
    if (!param.showInDocs) continue;

    const property: any = {
      type: mapTypeToSwagger(param.type),
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
        type: mapTypeToSwagger(param.arrayItemType),
      };
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
 * 映射类型到Swagger
 */
function mapTypeToSwagger(type: string): string {
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
