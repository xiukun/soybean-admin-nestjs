import { AggregateRoot } from '@nestjs/cqrs';

// 字段类型枚举
export enum FieldType {
  STRING = 'STRING',
  TEXT = 'TEXT',
  INTEGER = 'INTEGER',
  DECIMAL = 'DECIMAL',
  BOOLEAN = 'BOOLEAN',
  DATE = 'DATE',
  DATETIME = 'DATETIME',
  TIME = 'TIME',
  UUID = 'UUID',
  JSON = 'JSON'
}

// 字段属性接口
export interface FieldProperties {
  id?: string;
  entityId: string;
  name: string;
  code: string;
  type: FieldType;
  length?: number;
  precision?: number;
  scale?: number;
  nullable?: boolean;
  uniqueConstraint?: boolean;
  indexed?: boolean;
  primaryKey?: boolean;
  defaultValue?: string;
  validationRules?: any;
  referenceConfig?: any;
  enumOptions?: any;
  comment?: string;
  sortOrder?: number;
  createdBy: string;
  createdAt?: Date;
  updatedBy?: string;
  updatedAt?: Date;
}

export interface FieldCreateProperties extends Omit<FieldProperties, 'id' | 'createdAt' | 'updatedAt'> {
  createdAt?: Date;
}

export interface FieldUpdateProperties extends Partial<Omit<FieldProperties, 'id' | 'entityId' | 'createdBy' | 'createdAt'>> {
  updatedBy: string;
  updatedAt?: Date;
}

export class Field extends AggregateRoot {
  private constructor(private props: FieldProperties) {
    super();
  }

  static create(props: FieldCreateProperties): Field {
    // 业务规则验证
    Field.validateBusinessRules(props);
    
    const fieldProps: FieldProperties = {
      ...props,
      nullable: props.nullable !== false,
      uniqueConstraint: props.uniqueConstraint || false,
      indexed: props.indexed || false,
      primaryKey: props.primaryKey || false,
      sortOrder: props.sortOrder || 0,
      validationRules: props.validationRules || {},
      createdAt: props.createdAt || new Date(),
    };

    return new Field(fieldProps);
  }

  static fromPersistence(props: FieldProperties): Field {
    return new Field(props);
  }

  update(props: FieldUpdateProperties): void {
    // 验证更新属性
    if (props.code && props.code !== this.props.code) {
      Field.validateCode(props.code);
    }
    
    if (props.type && props.type !== this.props.type) {
      Field.validateTypeChange(this.props.type, props.type);
    }
    
    Object.assign(this.props, {
      ...props,
      updatedAt: props.updatedAt || new Date(),
    });
  }

  private static validateBusinessRules(props: FieldCreateProperties): void {
    if (!props.name || props.name.trim().length === 0) {
      throw new Error('Field name is required');
    }
    
    if (!props.code || props.code.trim().length === 0) {
      throw new Error('Field code is required');
    }
    
    Field.validateCode(props.code);
    
    if (!props.entityId) {
      throw new Error('Entity ID is required');
    }
    
    if (!props.type) {
      throw new Error('Field type is required');
    }
    
    if (!props.createdBy) {
      throw new Error('Created by is required');
    }
    
    // 验证字段类型特定的属性
    Field.validateTypeSpecificProperties(props);
  }

  private static validateCode(code: string): void {
    const codeRegex = /^[a-zA-Z][a-zA-Z0-9_]*$/;
    if (!codeRegex.test(code)) {
      throw new Error('Field code must start with a letter and contain only letters, numbers, and underscores');
    }
  }

  private static validateTypeSpecificProperties(props: FieldCreateProperties): void {
    switch (props.type) {
      case FieldType.STRING:
        if (props.length && (props.length < 1 || props.length > 65535)) {
          throw new Error('String field length must be between 1 and 65535');
        }
        break;
      case FieldType.DECIMAL:
        if (props.precision && (props.precision < 1 || props.precision > 65)) {
          throw new Error('Decimal field precision must be between 1 and 65');
        }
        if (props.scale && (props.scale < 0 || props.scale > 30)) {
          throw new Error('Decimal field scale must be between 0 and 30');
        }
        break;
    }
  }

  private static validateTypeChange(oldType: FieldType, newType: FieldType): void {
    // 定义允许的类型转换
    const allowedTypeChanges: Record<FieldType, FieldType[]> = {
      [FieldType.STRING]: [FieldType.TEXT],
      [FieldType.TEXT]: [FieldType.STRING],
      [FieldType.INTEGER]: [FieldType.DECIMAL],
      [FieldType.DECIMAL]: [FieldType.INTEGER],
      [FieldType.DATE]: [FieldType.DATETIME],
      [FieldType.DATETIME]: [FieldType.DATE],
      [FieldType.UUID]: [],
      [FieldType.JSON]: [],
      [FieldType.BOOLEAN]: [],
      [FieldType.TIME]: []
    };

    if (!allowedTypeChanges[oldType]?.includes(newType)) {
      throw new Error(`Cannot change field type from ${oldType} to ${newType}`);
    }
  }

  // Getters
  get id(): string | undefined { return this.props.id; }
  get entityId(): string { return this.props.entityId; }
  get name(): string { return this.props.name; }
  get code(): string { return this.props.code; }
  get type(): FieldType { return this.props.type; }
  get length(): number | undefined { return this.props.length; }
  get precision(): number | undefined { return this.props.precision; }
  get scale(): number | undefined { return this.props.scale; }
  get nullable(): boolean { return this.props.nullable !== false; }
  get uniqueConstraint(): boolean { return this.props.uniqueConstraint || false; }
  get indexed(): boolean { return this.props.indexed || false; }
  get primaryKey(): boolean { return this.props.primaryKey || false; }
  get defaultValue(): string | undefined { return this.props.defaultValue; }
  get validationRules(): any { return this.props.validationRules; }
  get referenceConfig(): any { return this.props.referenceConfig; }
  get enumOptions(): any { return this.props.enumOptions; }
  get comment(): string | undefined { return this.props.comment; }
  get sortOrder(): number { return this.props.sortOrder || 0; }
  get createdBy(): string { return this.props.createdBy; }
  get createdAt(): Date | undefined { return this.props.createdAt; }
  get updatedBy(): string | undefined { return this.props.updatedBy; }
  get updatedAt(): Date | undefined { return this.props.updatedAt; }

  // 业务方法
  isPrimaryKey(): boolean {
    return this.primaryKey;
  }

  isRequired(): boolean {
    return !this.nullable;
  }

  hasValidation(): boolean {
    return this.validationRules && Object.keys(this.validationRules).length > 0;
  }

  generateColumnDefinition(): string {
    let definition = this.code;
    
    switch (this.type) {
      case FieldType.STRING:
        definition += ` VARCHAR(${this.length || 255})`;
        break;
      case FieldType.TEXT:
        definition += ' TEXT';
        break;
      case FieldType.INTEGER:
        definition += ' INTEGER';
        break;
      case FieldType.DECIMAL:
        definition += ` DECIMAL(${this.precision || 10},${this.scale || 2})`;
        break;
      case FieldType.BOOLEAN:
        definition += ' BOOLEAN';
        break;
      case FieldType.DATE:
        definition += ' DATE';
        break;
      case FieldType.DATETIME:
        definition += ' TIMESTAMP';
        break;
      case FieldType.TIME:
        definition += ' TIME';
        break;
      case FieldType.UUID:
        definition += ' UUID';
        break;
      case FieldType.JSON:
        definition += ' JSON';
        break;
      default:
        definition += ' TEXT';
    }

    if (!this.nullable) {
      definition += ' NOT NULL';
    }

    if (this.defaultValue) {
      definition += ` DEFAULT ${this.defaultValue}`;
    }

    return definition;
  }

  toJSON(): FieldProperties {
    return { ...this.props };
  }
}
