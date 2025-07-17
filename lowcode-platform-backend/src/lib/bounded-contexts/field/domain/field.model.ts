import { ulid } from 'ulid';

export enum FieldDataType {
  STRING = 'STRING',
  INTEGER = 'INTEGER',
  DECIMAL = 'DECIMAL',
  BOOLEAN = 'BOOLEAN',
  DATE = 'DATE',
  DATETIME = 'DATETIME',
  TEXT = 'TEXT',
  JSON = 'JSON',
}

export class Field {
  public readonly id: string;
  public readonly entityId: string;
  public name: string;
  public code: string;
  public description?: string;
  public dataType: FieldDataType;
  public length?: number;
  public precision?: number;
  public required: boolean;
  public unique: boolean;
  public defaultValue?: string;
  public config?: any;
  public displayOrder: number;
  public readonly createdBy: string;
  public readonly createdAt: Date;
  public updatedBy?: string;
  public updatedAt?: Date;

  private constructor(data: {
    id?: string;
    entityId: string;
    name: string;
    code: string;
    description?: string;
    dataType: FieldDataType;
    length?: number;
    precision?: number;
    required: boolean;
    unique: boolean;
    defaultValue?: string;
    config?: any;
    displayOrder: number;
    createdBy: string;
    createdAt?: Date;
    updatedBy?: string;
    updatedAt?: Date;
  }) {
    this.id = data.id || ulid();
    this.entityId = data.entityId;
    this.name = data.name;
    this.code = data.code;
    this.description = data.description;
    this.dataType = data.dataType;
    this.length = data.length;
    this.precision = data.precision;
    this.required = data.required;
    this.unique = data.unique;
    this.defaultValue = data.defaultValue;
    this.config = data.config || {};
    this.displayOrder = data.displayOrder;
    this.createdBy = data.createdBy;
    this.createdAt = data.createdAt || new Date();
    this.updatedBy = data.updatedBy;
    this.updatedAt = data.updatedAt;
  }

  static create(data: {
    entityId: string;
    name: string;
    code: string;
    description?: string;
    dataType: FieldDataType;
    length?: number;
    precision?: number;
    required?: boolean;
    unique?: boolean;
    defaultValue?: string;
    config?: any;
    displayOrder: number;
    createdBy: string;
  }): Field {
    // 验证必填字段
    if (!data.entityId?.trim()) {
      throw new Error('Entity ID is required');
    }
    if (!data.name?.trim()) {
      throw new Error('Field name is required');
    }
    if (!data.code?.trim()) {
      throw new Error('Field code is required');
    }
    if (!data.createdBy?.trim()) {
      throw new Error('Created by is required');
    }

    // 验证字段代码格式
    if (!/^[a-zA-Z][a-zA-Z0-9_]*$/.test(data.code)) {
      throw new Error(
        'Field code must start with a letter and contain only letters, numbers, and underscores'
      );
    }

    // 验证数据类型
    if (!Object.values(FieldDataType).includes(data.dataType)) {
      throw new Error('Invalid data type');
    }

    // 验证长度和精度
    if (data.length !== undefined && data.length <= 0) {
      throw new Error('Field length must be greater than 0');
    }
    if (data.precision !== undefined && data.precision < 0) {
      throw new Error('Field precision must be greater than or equal to 0');
    }

    // 验证显示顺序
    if (data.displayOrder < 0) {
      throw new Error('Display order must be greater than or equal to 0');
    }

    return new Field({
      ...data,
      required: data.required ?? false,
      unique: data.unique ?? false,
    });
  }

  static fromPersistence(data: {
    id: string;
    entityId: string;
    name: string;
    code: string;
    description?: string;
    dataType: FieldDataType;
    length?: number;
    precision?: number;
    required: boolean;
    unique: boolean;
    defaultValue?: string;
    config?: any;
    displayOrder: number;
    createdBy: string;
    createdAt: Date;
    updatedBy?: string;
    updatedAt?: Date;
  }): Field {
    return new Field(data);
  }

  update(data: {
    name?: string;
    description?: string;
    dataType?: FieldDataType;
    length?: number;
    precision?: number;
    required?: boolean;
    unique?: boolean;
    defaultValue?: string;
    config?: any;
    displayOrder?: number;
    updatedBy?: string;
  }): void {
    if (data.name !== undefined) {
      if (!data.name.trim()) {
        throw new Error('Field name is required');
      }
      this.name = data.name;
    }

    if (data.dataType !== undefined) {
      if (!Object.values(FieldDataType).includes(data.dataType)) {
        throw new Error('Invalid data type');
      }
      this.dataType = data.dataType;
    }

    if (data.length !== undefined && data.length <= 0) {
      throw new Error('Field length must be greater than 0');
    }
    if (data.precision !== undefined && data.precision < 0) {
      throw new Error('Field precision must be greater than or equal to 0');
    }
    if (data.displayOrder !== undefined && data.displayOrder < 0) {
      throw new Error('Display order must be greater than or equal to 0');
    }

    if (data.description !== undefined) this.description = data.description;
    if (data.length !== undefined) this.length = data.length;
    if (data.precision !== undefined) this.precision = data.precision;
    if (data.required !== undefined) this.required = data.required;
    if (data.unique !== undefined) this.unique = data.unique;
    if (data.defaultValue !== undefined) this.defaultValue = data.defaultValue;
    if (data.config !== undefined) this.config = data.config;
    if (data.displayOrder !== undefined) this.displayOrder = data.displayOrder;

    this.updatedBy = data.updatedBy || 'system';
    this.updatedAt = new Date();
  }

  // 业务方法
  isRequired(): boolean {
    return this.required;
  }

  isUnique(): boolean {
    return this.unique;
  }

  hasDefaultValue(): boolean {
    return this.defaultValue !== undefined && this.defaultValue !== null;
  }

  isNumericType(): boolean {
    return [FieldDataType.INTEGER, FieldDataType.DECIMAL].includes(this.dataType);
  }

  isStringType(): boolean {
    return [FieldDataType.STRING, FieldDataType.TEXT].includes(this.dataType);
  }

  isDateType(): boolean {
    return [FieldDataType.DATE, FieldDataType.DATETIME].includes(this.dataType);
  }

  canDelete(): boolean {
    // 字段可以删除，但需要检查是否被其他地方引用
    return true;
  }

  generateColumnName(): string {
    // 将字段代码转换为数据库列名（下划线命名）
    return this.code
      .replace(/([a-z])([A-Z])/g, '$1_$2')
      .toLowerCase();
  }

  toJSON(): any {
    return {
      id: this.id,
      entityId: this.entityId,
      name: this.name,
      code: this.code,
      description: this.description,
      dataType: this.dataType,
      length: this.length,
      precision: this.precision,
      required: this.required,
      unique: this.unique,
      defaultValue: this.defaultValue,
      config: this.config,
      displayOrder: this.displayOrder,
      createdBy: this.createdBy,
      createdAt: this.createdAt,
      updatedBy: this.updatedBy,
      updatedAt: this.updatedAt,
    };
  }
}
