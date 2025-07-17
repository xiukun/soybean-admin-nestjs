import { AggregateRoot } from '@nestjs/cqrs';

// 代码生成任务类型枚举
export enum CodegenTaskType {
  ENTITY = 'ENTITY',
  API = 'API',
  FULL_PROJECT = 'FULL_PROJECT'
}

// 代码生成任务状态枚举
export enum CodegenTaskStatus {
  PENDING = 'PENDING',
  RUNNING = 'RUNNING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED'
}

// 代码生成任务属性接口
export interface CodegenTaskProperties {
  id?: string;
  projectId: string;
  name: string;
  type: CodegenTaskType;
  config: any;
  status?: CodegenTaskStatus;
  progress?: number;
  result?: any;
  errorMsg?: string;
  outputPath?: string;
  createdBy: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CodegenTaskCreateProperties extends Omit<CodegenTaskProperties, 'id' | 'createdAt' | 'updatedAt'> {
  createdAt?: Date;
}

export interface CodegenTaskUpdateProperties extends Partial<Omit<CodegenTaskProperties, 'id' | 'projectId' | 'createdBy' | 'createdAt'>> {
  updatedAt?: Date;
}

export class CodegenTask extends AggregateRoot {
  private constructor(private props: CodegenTaskProperties) {
    super();
  }

  static create(props: CodegenTaskCreateProperties): CodegenTask {
    // 业务规则验证
    CodegenTask.validateBusinessRules(props);
    
    const taskProps: CodegenTaskProperties = {
      ...props,
      status: props.status || CodegenTaskStatus.PENDING,
      progress: props.progress || 0,
      createdAt: props.createdAt || new Date(),
    };

    return new CodegenTask(taskProps);
  }

  static fromPersistence(props: CodegenTaskProperties): CodegenTask {
    return new CodegenTask(props);
  }

  update(props: CodegenTaskUpdateProperties): void {
    Object.assign(this.props, {
      ...props,
      updatedAt: props.updatedAt || new Date(),
    });
  }

  private static validateBusinessRules(props: CodegenTaskCreateProperties): void {
    if (!props.name || props.name.trim().length === 0) {
      throw new Error('Task name is required');
    }
    
    if (!props.projectId) {
      throw new Error('Project ID is required');
    }
    
    if (!props.type) {
      throw new Error('Task type is required');
    }
    
    if (!props.config) {
      throw new Error('Task configuration is required');
    }
    
    if (!props.createdBy) {
      throw new Error('Created by is required');
    }
  }

  // Getters
  get id(): string | undefined { return this.props.id; }
  get projectId(): string { return this.props.projectId; }
  get name(): string { return this.props.name; }
  get type(): CodegenTaskType { return this.props.type; }
  get config(): any { return this.props.config; }
  get status(): CodegenTaskStatus { return this.props.status || CodegenTaskStatus.PENDING; }
  get progress(): number { return this.props.progress || 0; }
  get result(): any { return this.props.result; }
  get errorMsg(): string | undefined { return this.props.errorMsg; }
  get outputPath(): string | undefined { return this.props.outputPath; }
  get createdBy(): string { return this.props.createdBy; }
  get createdAt(): Date | undefined { return this.props.createdAt; }
  get updatedAt(): Date | undefined { return this.props.updatedAt; }

  // 业务方法
  start(): void {
    if (this.status !== CodegenTaskStatus.PENDING) {
      throw new Error('Task can only be started from pending status');
    }
    this.props.status = CodegenTaskStatus.RUNNING;
    this.props.progress = 0;
    this.props.updatedAt = new Date();
  }

  updateProgress(progress: number): void {
    if (this.status !== CodegenTaskStatus.RUNNING) {
      throw new Error('Can only update progress for running tasks');
    }
    if (progress < 0 || progress > 100) {
      throw new Error('Progress must be between 0 and 100');
    }
    this.props.progress = progress;
    this.props.updatedAt = new Date();
  }

  complete(result: any, outputPath?: string): void {
    if (this.status !== CodegenTaskStatus.RUNNING) {
      throw new Error('Task can only be completed from running status');
    }
    this.props.status = CodegenTaskStatus.COMPLETED;
    this.props.progress = 100;
    this.props.result = result;
    this.props.outputPath = outputPath;
    this.props.updatedAt = new Date();
  }

  fail(errorMsg: string): void {
    if (this.status !== CodegenTaskStatus.RUNNING) {
      throw new Error('Task can only be failed from running status');
    }
    this.props.status = CodegenTaskStatus.FAILED;
    this.props.errorMsg = errorMsg;
    this.props.updatedAt = new Date();
  }

  canRestart(): boolean {
    return this.status === CodegenTaskStatus.FAILED || this.status === CodegenTaskStatus.COMPLETED;
  }

  restart(): void {
    if (!this.canRestart()) {
      throw new Error('Task cannot be restarted in current status');
    }
    this.props.status = CodegenTaskStatus.PENDING;
    this.props.progress = 0;
    this.props.result = undefined;
    this.props.errorMsg = undefined;
    this.props.outputPath = undefined;
    this.props.updatedAt = new Date();
  }

  isCompleted(): boolean {
    return this.status === CodegenTaskStatus.COMPLETED;
  }

  isFailed(): boolean {
    return this.status === CodegenTaskStatus.FAILED;
  }

  isRunning(): boolean {
    return this.status === CodegenTaskStatus.RUNNING;
  }

  toJSON(): CodegenTaskProperties {
    return { ...this.props };
  }
}
