import { AggregateRoot } from '@nestjs/cqrs';

// 项目状态枚举
export enum ProjectStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  ARCHIVED = 'ARCHIVED'
}

// 项目属性接口
export interface ProjectProperties {
  id?: string;
  name: string;
  code: string;
  description?: string;
  version?: string;
  config?: any;
  status?: ProjectStatus;
  createdBy: string;
  createdAt?: Date;
  updatedBy?: string;
  updatedAt?: Date;
}

export interface ProjectCreateProperties extends Omit<ProjectProperties, 'id' | 'createdAt' | 'updatedAt'> {
  createdAt?: Date;
}

export interface ProjectUpdateProperties extends Partial<Omit<ProjectProperties, 'id' | 'createdBy' | 'createdAt'>> {
  updatedBy: string;
  updatedAt?: Date;
}

export class Project extends AggregateRoot {
  private constructor(private props: ProjectProperties) {
    super();
  }

  static create(props: ProjectCreateProperties): Project {
    // 业务规则验证
    Project.validateBusinessRules(props);
    
    const projectProps: ProjectProperties = {
      ...props,
      version: props.version || '1.0.0',
      status: props.status || ProjectStatus.ACTIVE,
      config: props.config || {},
      createdAt: props.createdAt || new Date(),
    };

    return new Project(projectProps);
  }

  static fromPersistence(props: ProjectProperties): Project {
    return new Project(props);
  }

  update(props: ProjectUpdateProperties): void {
    // 验证更新属性
    if (props.code && props.code !== this.props.code) {
      Project.validateCode(props.code);
    }
    
    Object.assign(this.props, {
      ...props,
      updatedAt: props.updatedAt || new Date(),
    });
  }

  private static validateBusinessRules(props: ProjectCreateProperties): void {
    if (!props.name || props.name.trim().length === 0) {
      throw new Error('Project name is required');
    }
    
    if (!props.code || props.code.trim().length === 0) {
      throw new Error('Project code is required');
    }
    
    Project.validateCode(props.code);
    
    if (!props.createdBy) {
      throw new Error('Created by is required');
    }
  }

  private static validateCode(code: string): void {
    const codeRegex = /^[a-zA-Z][a-zA-Z0-9_-]*$/;
    if (!codeRegex.test(code)) {
      throw new Error('Project code must start with a letter and contain only letters, numbers, underscores, and hyphens');
    }
  }

  // Getters
  get id(): string | undefined { return this.props.id; }
  get name(): string { return this.props.name; }
  get code(): string { return this.props.code; }
  get description(): string | undefined { return this.props.description; }
  get version(): string { return this.props.version || '1.0.0'; }
  get config(): any { return this.props.config; }
  get status(): ProjectStatus { return this.props.status || ProjectStatus.ACTIVE; }
  get createdBy(): string { return this.props.createdBy; }
  get createdAt(): Date | undefined { return this.props.createdAt; }
  get updatedBy(): string | undefined { return this.props.updatedBy; }
  get updatedAt(): Date | undefined { return this.props.updatedAt; }

  // 业务方法
  activate(): void {
    if (this.status === ProjectStatus.ACTIVE) {
      throw new Error('Project is already active');
    }
    this.props.status = ProjectStatus.ACTIVE;
    this.props.updatedAt = new Date();
  }

  deactivate(): void {
    if (this.status === ProjectStatus.INACTIVE) {
      throw new Error('Project is already inactive');
    }
    this.props.status = ProjectStatus.INACTIVE;
    this.props.updatedAt = new Date();
  }

  archive(): void {
    if (this.status === ProjectStatus.ARCHIVED) {
      throw new Error('Project is already archived');
    }
    this.props.status = ProjectStatus.ARCHIVED;
    this.props.updatedAt = new Date();
  }

  canDelete(): boolean {
    return this.status === ProjectStatus.INACTIVE || this.status === ProjectStatus.ARCHIVED;
  }

  isActive(): boolean {
    return this.status === ProjectStatus.ACTIVE;
  }

  toJSON(): ProjectProperties {
    return { ...this.props };
  }
}
