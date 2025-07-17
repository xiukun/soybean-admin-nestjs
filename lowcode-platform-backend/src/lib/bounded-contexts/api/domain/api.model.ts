import { AggregateRoot } from '@nestjs/cqrs';

// API方法枚举
export enum ApiMethod {
  GET = 'GET',
  POST = 'POST',
  PUT = 'PUT',
  DELETE = 'DELETE',
  PATCH = 'PATCH'
}

// API状态枚举
export enum ApiStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  DEPRECATED = 'DEPRECATED'
}

// API属性接口
export interface ApiProperties {
  id?: string;
  projectId: string;
  entityId?: string;
  name: string;
  code: string;
  path: string;
  method: ApiMethod;
  description?: string;
  requestConfig?: any;
  responseConfig?: any;
  queryConfig?: any;
  authConfig?: any;
  version?: string;
  status?: ApiStatus;
  createdBy: string;
  createdAt?: Date;
  updatedBy?: string;
  updatedAt?: Date;
}

export interface ApiCreateProperties extends Omit<ApiProperties, 'id' | 'createdAt' | 'updatedAt'> {
  createdAt?: Date;
}

export interface ApiUpdateProperties extends Partial<Omit<ApiProperties, 'id' | 'projectId' | 'createdBy' | 'createdAt'>> {
  updatedBy: string;
  updatedAt?: Date;
}

export class Api extends AggregateRoot {
  private constructor(private props: ApiProperties) {
    super();
  }

  static create(props: ApiCreateProperties): Api {
    // 业务规则验证
    Api.validateBusinessRules(props);
    
    const apiProps: ApiProperties = {
      ...props,
      version: props.version || '1.0.0',
      status: props.status || ApiStatus.DRAFT,
      requestConfig: props.requestConfig || {},
      responseConfig: props.responseConfig || {},
      queryConfig: props.queryConfig || {},
      authConfig: props.authConfig || {},
      createdAt: props.createdAt || new Date(),
    };

    return new Api(apiProps);
  }

  static fromPersistence(props: ApiProperties): Api {
    return new Api(props);
  }

  update(props: ApiUpdateProperties): void {
    // 验证更新属性
    if (props.code && props.code !== this.props.code) {
      Api.validateCode(props.code);
    }
    
    if (props.path && props.path !== this.props.path) {
      Api.validatePath(props.path);
    }
    
    Object.assign(this.props, {
      ...props,
      updatedAt: props.updatedAt || new Date(),
    });
  }

  private static validateBusinessRules(props: ApiCreateProperties): void {
    if (!props.name || props.name.trim().length === 0) {
      throw new Error('API name is required');
    }
    
    if (!props.code || props.code.trim().length === 0) {
      throw new Error('API code is required');
    }
    
    Api.validateCode(props.code);
    
    if (!props.path || props.path.trim().length === 0) {
      throw new Error('API path is required');
    }
    
    Api.validatePath(props.path);
    
    if (!props.method) {
      throw new Error('API method is required');
    }
    
    if (!props.projectId) {
      throw new Error('Project ID is required');
    }
    
    if (!props.createdBy) {
      throw new Error('Created by is required');
    }
  }

  private static validateCode(code: string): void {
    const codeRegex = /^[a-zA-Z][a-zA-Z0-9_]*$/;
    if (!codeRegex.test(code)) {
      throw new Error('API code must start with a letter and contain only letters, numbers, and underscores');
    }
  }

  private static validatePath(path: string): void {
    if (!path.startsWith('/')) {
      throw new Error('API path must start with a forward slash');
    }
    
    const pathRegex = /^\/[a-zA-Z0-9\/_-]*$/;
    if (!pathRegex.test(path)) {
      throw new Error('API path contains invalid characters');
    }
  }

  // Getters
  get id(): string | undefined { return this.props.id; }
  get projectId(): string { return this.props.projectId; }
  get entityId(): string | undefined { return this.props.entityId; }
  get name(): string { return this.props.name; }
  get code(): string { return this.props.code; }
  get path(): string { return this.props.path; }
  get method(): ApiMethod { return this.props.method; }
  get description(): string | undefined { return this.props.description; }
  get requestConfig(): any { return this.props.requestConfig; }
  get responseConfig(): any { return this.props.responseConfig; }
  get queryConfig(): any { return this.props.queryConfig; }
  get authConfig(): any { return this.props.authConfig; }
  get version(): string { return this.props.version || '1.0.0'; }
  get status(): ApiStatus { return this.props.status || ApiStatus.DRAFT; }
  get createdBy(): string { return this.props.createdBy; }
  get createdAt(): Date | undefined { return this.props.createdAt; }
  get updatedBy(): string | undefined { return this.props.updatedBy; }
  get updatedAt(): Date | undefined { return this.props.updatedAt; }

  // 业务方法
  publish(): void {
    if (this.status === ApiStatus.PUBLISHED) {
      throw new Error('API is already published');
    }
    this.props.status = ApiStatus.PUBLISHED;
    this.props.updatedAt = new Date();
  }

  deprecate(): void {
    if (this.status === ApiStatus.DEPRECATED) {
      throw new Error('API is already deprecated');
    }
    this.props.status = ApiStatus.DEPRECATED;
    this.props.updatedAt = new Date();
  }

  canDelete(): boolean {
    return this.status === ApiStatus.DRAFT;
  }

  isEntityApi(): boolean {
    return !!this.entityId;
  }

  generateFullPath(): string {
    return `/api/v${this.version.split('.')[0]}${this.path}`;
  }

  hasAuthentication(): boolean {
    return this.authConfig && Object.keys(this.authConfig).length > 0;
  }

  supportsMultipleQueries(): boolean {
    return this.queryConfig && this.queryConfig.multiTable === true;
  }

  toJSON(): ApiProperties {
    return { ...this.props };
  }
}
