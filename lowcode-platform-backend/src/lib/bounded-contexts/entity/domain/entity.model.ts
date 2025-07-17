import { AggregateRoot } from '@nestjs/cqrs';

// 实体状态枚举
export enum EntityStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  DEPRECATED = 'DEPRECATED'
}

// 实体属性接口
export interface EntityProperties {
  id?: string;
  projectId: string;
  name: string;
  code: string;
  tableName: string;
  description?: string;
  category?: string;
  diagramPosition?: any;
  config?: any;
  version?: string;
  status?: EntityStatus;
  createdBy: string;
  createdAt?: Date;
  updatedBy?: string;
  updatedAt?: Date;
}

export interface EntityCreateProperties extends Omit<EntityProperties, 'id' | 'createdAt' | 'updatedAt'> {
  createdAt?: Date;
}

export interface EntityUpdateProperties extends Partial<Omit<EntityProperties, 'id' | 'projectId' | 'createdBy' | 'createdAt'>> {
  updatedBy: string;
  updatedAt?: Date;
}

export class Entity extends AggregateRoot {
  private constructor(private props: EntityProperties) {
    super();
  }

  static create(props: EntityCreateProperties): Entity {
    // 业务规则验证
    Entity.validateBusinessRules(props);
    
    const entityProps: EntityProperties = {
      ...props,
      version: props.version || '1.0.0',
      status: props.status || EntityStatus.DRAFT,
      config: props.config || {},
      createdAt: props.createdAt || new Date(),
    };

    return new Entity(entityProps);
  }

  static fromPersistence(props: EntityProperties): Entity {
    return new Entity(props);
  }

  update(props: EntityUpdateProperties): void {
    // 验证更新属性
    if (props.code && props.code !== this.props.code) {
      Entity.validateCode(props.code);
    }
    
    Object.assign(this.props, {
      ...props,
      updatedAt: props.updatedAt || new Date(),
    });
  }

  private static validateBusinessRules(props: EntityCreateProperties): void {
    if (!props.name || props.name.trim().length === 0) {
      throw new Error('Entity name is required');
    }
    
    if (!props.code || props.code.trim().length === 0) {
      throw new Error('Entity code is required');
    }
    
    Entity.validateCode(props.code);
    
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
      throw new Error('Entity code must start with a letter and contain only letters, numbers, and underscores');
    }
  }

  // Getters
  get id(): string | undefined { return this.props.id; }
  get projectId(): string { return this.props.projectId; }
  get name(): string { return this.props.name; }
  get code(): string { return this.props.code; }
  get tableName(): string { return this.props.tableName; }
  get description(): string | undefined { return this.props.description; }
  get category(): string | undefined { return this.props.category; }
  get diagramPosition(): any { return this.props.diagramPosition; }
  get config(): any { return this.props.config; }
  get version(): string { return this.props.version || '1.0.0'; }
  get status(): EntityStatus { return this.props.status || EntityStatus.DRAFT; }
  get createdBy(): string { return this.props.createdBy; }
  get createdAt(): Date | undefined { return this.props.createdAt; }
  get updatedBy(): string | undefined { return this.props.updatedBy; }
  get updatedAt(): Date | undefined { return this.props.updatedAt; }

  // 业务方法
  publish(): void {
    if (this.status === EntityStatus.PUBLISHED) {
      throw new Error('Entity is already published');
    }
    this.props.status = EntityStatus.PUBLISHED;
    this.props.updatedAt = new Date();
  }

  deprecate(): void {
    if (this.status === EntityStatus.DEPRECATED) {
      throw new Error('Entity is already deprecated');
    }
    this.props.status = EntityStatus.DEPRECATED;
    this.props.updatedAt = new Date();
  }

  canDelete(): boolean {
    return this.status === EntityStatus.DRAFT;
  }

  generateTableName(): string {
    // 将驼峰命名转换为下划线命名
    return this.code
      .replace(/([a-z])([A-Z])/g, '$1_$2') // 在小写字母和大写字母之间插入下划线
      .toLowerCase();
  }

  toJSON(): EntityProperties {
    return { ...this.props };
  }
}
