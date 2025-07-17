import { ulid } from 'ulid';

export enum ApiMethod {
  GET = 'GET',
  POST = 'POST',
  PUT = 'PUT',
  DELETE = 'DELETE',
  PATCH = 'PATCH',
}

export enum ApiStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  DEPRECATED = 'DEPRECATED',
}

export enum ParameterType {
  STRING = 'STRING',
  INTEGER = 'INTEGER',
  DECIMAL = 'DECIMAL',
  BOOLEAN = 'BOOLEAN',
  DATE = 'DATE',
  DATETIME = 'DATETIME',
  JSON = 'JSON',
  FILE = 'FILE',
}

export enum ParameterLocation {
  QUERY = 'QUERY',
  PATH = 'PATH',
  BODY = 'BODY',
  HEADER = 'HEADER',
}

export interface ApiParameter {
  name: string;
  type: ParameterType;
  location: ParameterLocation;
  required: boolean;
  description?: string;
  defaultValue?: any;
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    enum?: any[];
  };
}

export interface ApiResponse {
  statusCode: number;
  description: string;
  schema?: any;
  example?: any;
  amisFormat?: boolean; // 是否使用amis格式
  dataKey?: string; // 数据包装的key名称
}

export interface ApiSecurity {
  type: 'none' | 'jwt' | 'apikey' | 'basic';
  config?: any;
}

export class ApiConfig {
  public readonly id: string;
  public readonly projectId: string;
  public name: string;
  public code: string;
  public description?: string;
  public method: ApiMethod;
  public path: string;
  public entityId?: string;
  public parameters: ApiParameter[];
  public responses: ApiResponse[];
  public security: ApiSecurity;
  public config: any;
  public status: ApiStatus;
  public version: string;
  public readonly createdBy: string;
  public readonly createdAt: Date;
  public updatedBy?: string;
  public updatedAt?: Date;

  private constructor(data: {
    id?: string;
    projectId: string;
    name: string;
    code: string;
    description?: string;
    method: ApiMethod;
    path: string;
    entityId?: string;
    parameters?: ApiParameter[];
    responses?: ApiResponse[];
    security?: ApiSecurity;
    config?: any;
    status?: ApiStatus;
    version?: string;
    createdBy: string;
    createdAt?: Date;
    updatedBy?: string;
    updatedAt?: Date;
  }) {
    this.id = data.id || ulid();
    this.projectId = data.projectId;
    this.name = data.name;
    this.code = data.code;
    this.description = data.description;
    this.method = data.method;
    this.path = data.path;
    this.entityId = data.entityId;
    this.parameters = data.parameters || [];
    this.responses = data.responses || [];
    this.security = data.security || { type: 'none' };
    this.config = data.config || {};
    this.status = data.status || ApiStatus.DRAFT;
    this.version = data.version || '1.0.0';
    this.createdBy = data.createdBy;
    this.createdAt = data.createdAt || new Date();
    this.updatedBy = data.updatedBy;
    this.updatedAt = data.updatedAt;
  }

  static create(data: {
    projectId: string;
    name: string;
    code: string;
    description?: string;
    method: ApiMethod;
    path: string;
    entityId?: string;
    parameters?: ApiParameter[];
    responses?: ApiResponse[];
    security?: ApiSecurity;
    config?: any;
    createdBy: string;
  }): ApiConfig {
    // 验证必填字段
    if (!data.projectId?.trim()) {
      throw new Error('Project ID is required');
    }
    if (!data.name?.trim()) {
      throw new Error('API name is required');
    }
    if (!data.code?.trim()) {
      throw new Error('API code is required');
    }
    if (!data.path?.trim()) {
      throw new Error('API path is required');
    }
    if (!data.createdBy?.trim()) {
      throw new Error('Created by is required');
    }

    // 验证API代码格式
    if (!/^[a-zA-Z][a-zA-Z0-9_]*$/.test(data.code)) {
      throw new Error(
        'API code must start with a letter and contain only letters, numbers, and underscores'
      );
    }

    // 验证HTTP方法
    if (!Object.values(ApiMethod).includes(data.method)) {
      throw new Error('Invalid HTTP method');
    }

    // 验证API路径格式
    if (!data.path.startsWith('/')) {
      throw new Error('API path must start with /');
    }

    // 验证参数
    if (data.parameters) {
      data.parameters.forEach((param, index) => {
        if (!param.name?.trim()) {
          throw new Error(`Parameter ${index + 1} name is required`);
        }
        if (!Object.values(ParameterType).includes(param.type)) {
          throw new Error(`Invalid parameter type for ${param.name}`);
        }
        if (!Object.values(ParameterLocation).includes(param.location)) {
          throw new Error(`Invalid parameter location for ${param.name}`);
        }
      });
    }

    // 验证响应
    if (data.responses) {
      data.responses.forEach((response, index) => {
        if (!response.statusCode || response.statusCode < 100 || response.statusCode > 599) {
          throw new Error(`Invalid status code for response ${index + 1}`);
        }
        if (!response.description?.trim()) {
          throw new Error(`Response ${index + 1} description is required`);
        }
      });
    }

    return new ApiConfig(data);
  }

  static fromPersistence(data: {
    id: string;
    projectId: string;
    name: string;
    code: string;
    description?: string;
    method: ApiMethod;
    path: string;
    entityId?: string;
    parameters: ApiParameter[];
    responses: ApiResponse[];
    security: ApiSecurity;
    config: any;
    status: ApiStatus;
    version: string;
    createdBy: string;
    createdAt: Date;
    updatedBy?: string;
    updatedAt?: Date;
  }): ApiConfig {
    return new ApiConfig(data);
  }

  update(data: {
    name?: string;
    description?: string;
    path?: string;
    parameters?: ApiParameter[];
    responses?: ApiResponse[];
    security?: ApiSecurity;
    config?: any;
    status?: ApiStatus;
    updatedBy?: string;
  }): void {
    if (data.name !== undefined) {
      if (!data.name.trim()) {
        throw new Error('API name is required');
      }
      this.name = data.name;
    }

    if (data.path !== undefined) {
      if (!data.path.trim()) {
        throw new Error('API path is required');
      }
      if (!data.path.startsWith('/')) {
        throw new Error('API path must start with /');
      }
      this.path = data.path;
    }

    // 验证参数
    if (data.parameters) {
      data.parameters.forEach((param, index) => {
        if (!param.name?.trim()) {
          throw new Error(`Parameter ${index + 1} name is required`);
        }
        if (!Object.values(ParameterType).includes(param.type)) {
          throw new Error(`Invalid parameter type for ${param.name}`);
        }
        if (!Object.values(ParameterLocation).includes(param.location)) {
          throw new Error(`Invalid parameter location for ${param.name}`);
        }
      });
    }

    // 验证响应
    if (data.responses) {
      data.responses.forEach((response, index) => {
        if (!response.statusCode || response.statusCode < 100 || response.statusCode > 599) {
          throw new Error(`Invalid status code for response ${index + 1}`);
        }
        if (!response.description?.trim()) {
          throw new Error(`Response ${index + 1} description is required`);
        }
      });
    }

    if (data.description !== undefined) this.description = data.description;
    if (data.parameters !== undefined) this.parameters = data.parameters;
    if (data.responses !== undefined) this.responses = data.responses;
    if (data.security !== undefined) this.security = data.security;
    if (data.config !== undefined) this.config = data.config;
    if (data.status !== undefined) this.status = data.status;

    this.updatedBy = data.updatedBy || 'system';
    this.updatedAt = new Date();
  }

  // 业务方法
  isDraft(): boolean {
    return this.status === ApiStatus.DRAFT;
  }

  isPublished(): boolean {
    return this.status === ApiStatus.PUBLISHED;
  }

  isDeprecated(): boolean {
    return this.status === ApiStatus.DEPRECATED;
  }

  publish(): void {
    if (this.status === ApiStatus.PUBLISHED) {
      throw new Error('API is already published');
    }
    this.status = ApiStatus.PUBLISHED;
    this.updatedAt = new Date();
  }

  deprecate(): void {
    if (this.status === ApiStatus.DEPRECATED) {
      throw new Error('API is already deprecated');
    }
    this.status = ApiStatus.DEPRECATED;
    this.updatedAt = new Date();
  }

  canDelete(): boolean {
    // 只有草稿状态的API可以删除
    return this.status === ApiStatus.DRAFT;
  }

  getFullPath(): string {
    return `/api/v1${this.path}`;
  }

  hasParameters(): boolean {
    return this.parameters.length > 0;
  }

  getRequiredParameters(): ApiParameter[] {
    return this.parameters.filter(param => param.required);
  }

  getParametersByLocation(location: ParameterLocation): ApiParameter[] {
    return this.parameters.filter(param => param.location === location);
  }

  hasAuthentication(): boolean {
    return this.security.type !== 'none';
  }

  // amis接口规范相关方法
  isAmisCompliant(): boolean {
    // 检查是否符合amis接口规范
    return this.responses.some(response =>
      response.statusCode === 200 && response.amisFormat === true
    );
  }

  generateAmisResponse(data: any, dataKey?: string): any {
    // 生成符合amis规范的响应格式
    if (typeof data === 'string' || Array.isArray(data)) {
      // 字符串或数组需要用key包装
      const key = dataKey || (Array.isArray(data) ? 'items' : 'text');
      return {
        status: 0,
        msg: '',
        data: {
          [key]: data
        }
      };
    }

    // 对象直接包装
    return {
      status: 0,
      msg: '',
      data: data || {}
    };
  }

  generateAmisErrorResponse(message: string, status: number = 1): any {
    // 生成amis错误响应格式
    return {
      status,
      msg: message,
      data: {}
    };
  }

  generateAmisPaginationResponse(items: any[], page: number, perPage: number, total: number): any {
    // 生成amis分页表格响应格式（统一分页参数）
    return {
      status: 0,
      msg: '',
      data: {
        options: items,
        page,      // 页码，从1开始
        perPage,   // 每页数量，默认10
        total
      }
    };
  }

  validateAmisResponseSchema(schema: any): boolean {
    // 验证响应schema是否符合amis规范
    if (!schema || typeof schema !== 'object') {
      return false;
    }

    // 检查是否有必需的amis响应结构
    const hasStatus = schema.properties?.status;
    const hasMsg = schema.properties?.msg;
    const hasData = schema.properties?.data;

    return !!(hasStatus && hasMsg && hasData);
  }

  toJSON(): any {
    return {
      id: this.id,
      projectId: this.projectId,
      name: this.name,
      code: this.code,
      description: this.description,
      method: this.method,
      path: this.path,
      entityId: this.entityId,
      parameters: this.parameters,
      responses: this.responses,
      security: this.security,
      config: this.config,
      status: this.status,
      version: this.version,
      createdBy: this.createdBy,
      createdAt: this.createdAt,
      updatedBy: this.updatedBy,
      updatedAt: this.updatedAt,
    };
  }
}
