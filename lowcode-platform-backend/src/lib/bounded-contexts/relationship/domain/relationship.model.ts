import { ulid } from 'ulid';

export enum RelationshipType {
  ONE_TO_ONE = 'ONE_TO_ONE',
  ONE_TO_MANY = 'ONE_TO_MANY',
  MANY_TO_ONE = 'MANY_TO_ONE',
  MANY_TO_MANY = 'MANY_TO_MANY',
}

export enum RelationshipStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

export class Relationship {
  public readonly id: string;
  public readonly projectId: string;
  public name: string;
  public code: string;
  public description?: string;
  public type: RelationshipType;
  public readonly sourceEntityId: string;
  public readonly targetEntityId: string;
  public sourceFieldId?: string;
  public targetFieldId?: string;
  public foreignKeyName?: string;
  public onDelete?: string; // CASCADE, SET_NULL, RESTRICT
  public onUpdate?: string; // CASCADE, SET_NULL, RESTRICT
  public config?: any;
  public status: RelationshipStatus;
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
    type: RelationshipType;
    sourceEntityId: string;
    targetEntityId: string;
    sourceFieldId?: string;
    targetFieldId?: string;
    foreignKeyName?: string;
    onDelete?: string;
    onUpdate?: string;
    config?: any;
    status?: RelationshipStatus;
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
    this.type = data.type;
    this.sourceEntityId = data.sourceEntityId;
    this.targetEntityId = data.targetEntityId;
    this.sourceFieldId = data.sourceFieldId;
    this.targetFieldId = data.targetFieldId;
    this.foreignKeyName = data.foreignKeyName;
    this.onDelete = data.onDelete || 'RESTRICT';
    this.onUpdate = data.onUpdate || 'RESTRICT';
    this.config = data.config || {};
    this.status = data.status || RelationshipStatus.ACTIVE;
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
    type: RelationshipType;
    sourceEntityId: string;
    targetEntityId: string;
    sourceFieldId?: string;
    targetFieldId?: string;
    foreignKeyName?: string;
    onDelete?: string;
    onUpdate?: string;
    config?: any;
    createdBy: string;
  }): Relationship {
    // 验证必填字段
    if (!data.projectId?.trim()) {
      throw new Error('Project ID is required');
    }
    if (!data.name?.trim()) {
      throw new Error('Relationship name is required');
    }
    if (!data.code?.trim()) {
      throw new Error('Relationship code is required');
    }
    if (!data.sourceEntityId?.trim()) {
      throw new Error('Source entity ID is required');
    }
    if (!data.targetEntityId?.trim()) {
      throw new Error('Target entity ID is required');
    }
    if (!data.createdBy?.trim()) {
      throw new Error('Created by is required');
    }

    // 验证关系代码格式
    if (!/^[a-zA-Z][a-zA-Z0-9_]*$/.test(data.code)) {
      throw new Error(
        'Relationship code must start with a letter and contain only letters, numbers, and underscores'
      );
    }

    // 验证关系类型
    if (!Object.values(RelationshipType).includes(data.type)) {
      throw new Error('Invalid relationship type');
    }

    // 验证不能自关联（除非是特殊情况）
    if (data.sourceEntityId === data.targetEntityId) {
      console.warn('Self-referencing relationship detected');
    }

    // 验证外键操作
    const validActions = ['CASCADE', 'SET_NULL', 'RESTRICT', 'NO_ACTION'];
    if (data.onDelete && !validActions.includes(data.onDelete)) {
      throw new Error('Invalid onDelete action');
    }
    if (data.onUpdate && !validActions.includes(data.onUpdate)) {
      throw new Error('Invalid onUpdate action');
    }

    return new Relationship(data);
  }

  static fromPersistence(data: {
    id: string;
    projectId: string;
    name: string;
    code: string;
    description?: string;
    type: RelationshipType;
    sourceEntityId: string;
    targetEntityId: string;
    sourceFieldId?: string;
    targetFieldId?: string;
    foreignKeyName?: string;
    onDelete?: string;
    onUpdate?: string;
    config?: any;
    status: RelationshipStatus;
    createdBy: string;
    createdAt: Date;
    updatedBy?: string;
    updatedAt?: Date;
    sourceEntity?: any;
    targetEntity?: any;
  }): Relationship {
    const relationship = new Relationship(data);

    // 添加实体信息（如果存在）
    if (data.sourceEntity) {
      (relationship as any).sourceEntity = data.sourceEntity;
    }
    if (data.targetEntity) {
      (relationship as any).targetEntity = data.targetEntity;
    }

    return relationship;
  }

  static fromExisting(data: any): Relationship {
    return new Relationship({
      id: data.id,
      projectId: data.projectId,
      name: data.name,
      code: data.code,
      description: data.description,
      type: data.type,
      sourceEntityId: data.sourceEntityId,
      targetEntityId: data.targetEntityId,
      sourceFieldId: data.sourceFieldId,
      targetFieldId: data.targetFieldId,
      foreignKeyName: data.foreignKeyName,
      onDelete: data.onDelete,
      onUpdate: data.onUpdate,
      config: data.config,
      status: data.status,
      createdBy: data.createdBy,
      createdAt: data.createdAt,
      updatedBy: data.updatedBy,
      updatedAt: data.updatedAt,
    });
  }

  update(data: {
    name?: string;
    description?: string;
    sourceFieldId?: string;
    targetFieldId?: string;
    foreignKeyName?: string;
    onDelete?: string;
    onUpdate?: string;
    config?: any;
    status?: RelationshipStatus;
    updatedBy?: string;
  }): void {
    if (data.name !== undefined) {
      if (!data.name.trim()) {
        throw new Error('Relationship name is required');
      }
      this.name = data.name;
    }

    // 验证外键操作
    const validActions = ['CASCADE', 'SET_NULL', 'RESTRICT', 'NO_ACTION'];
    if (data.onDelete && !validActions.includes(data.onDelete)) {
      throw new Error('Invalid onDelete action');
    }
    if (data.onUpdate && !validActions.includes(data.onUpdate)) {
      throw new Error('Invalid onUpdate action');
    }

    if (data.description !== undefined) this.description = data.description;
    if (data.sourceFieldId !== undefined) this.sourceFieldId = data.sourceFieldId;
    if (data.targetFieldId !== undefined) this.targetFieldId = data.targetFieldId;
    if (data.foreignKeyName !== undefined) this.foreignKeyName = data.foreignKeyName;
    if (data.onDelete !== undefined) this.onDelete = data.onDelete;
    if (data.onUpdate !== undefined) this.onUpdate = data.onUpdate;
    if (data.config !== undefined) this.config = data.config;
    if (data.status !== undefined) this.status = data.status;

    this.updatedBy = data.updatedBy || 'system';
    this.updatedAt = new Date();
  }

  // 业务方法
  isActive(): boolean {
    return this.status === RelationshipStatus.ACTIVE;
  }

  isOneToOne(): boolean {
    return this.type === RelationshipType.ONE_TO_ONE;
  }

  isOneToMany(): boolean {
    return this.type === RelationshipType.ONE_TO_MANY;
  }

  isManyToOne(): boolean {
    return this.type === RelationshipType.MANY_TO_ONE;
  }

  isManyToMany(): boolean {
    return this.type === RelationshipType.MANY_TO_MANY;
  }

  isSelfReferencing(): boolean {
    return this.sourceEntityId === this.targetEntityId;
  }

  activate(): void {
    if (this.status === RelationshipStatus.ACTIVE) {
      throw new Error('Relationship is already active');
    }
    this.status = RelationshipStatus.ACTIVE;
    this.updatedAt = new Date();
  }

  deactivate(): void {
    if (this.status === RelationshipStatus.INACTIVE) {
      throw new Error('Relationship is already inactive');
    }
    this.status = RelationshipStatus.INACTIVE;
    this.updatedAt = new Date();
  }

  canDelete(): boolean {
    // 关系可以删除，但需要检查是否被其他地方引用
    return true;
  }

  generateForeignKeyName(): string {
    if (this.foreignKeyName) {
      return this.foreignKeyName;
    }
    // 生成默认外键名称
    return `fk_${this.code.toLowerCase()}`;
  }

  generateJoinTableName(): string {
    // 用于多对多关系的中间表名称
    if (this.type !== RelationshipType.MANY_TO_MANY) {
      throw new Error('Join table is only for many-to-many relationships');
    }
    return `${this.sourceEntityId}_${this.targetEntityId}`.toLowerCase();
  }

  toJSON(): any {
    return {
      id: this.id,
      projectId: this.projectId,
      name: this.name,
      code: this.code,
      description: this.description,
      type: this.type,
      sourceEntityId: this.sourceEntityId,
      targetEntityId: this.targetEntityId,
      sourceFieldId: this.sourceFieldId,
      targetFieldId: this.targetFieldId,
      foreignKeyName: this.foreignKeyName,
      onDelete: this.onDelete,
      onUpdate: this.onUpdate,
      config: this.config,
      status: this.status,
      createdBy: this.createdBy,
      createdAt: this.createdAt,
      updatedBy: this.updatedBy,
      updatedAt: this.updatedAt,
    };
  }
}
