import { AggregateRoot } from '@nestjs/cqrs';

// 关系类型枚举
export enum RelationType {
  ONE_TO_ONE = 'ONE_TO_ONE',
  ONE_TO_MANY = 'ONE_TO_MANY',
  MANY_TO_MANY = 'MANY_TO_MANY'
}

// 级联操作类型枚举
export enum CascadeType {
  CASCADE = 'CASCADE',
  SET_NULL = 'SET_NULL',
  RESTRICT = 'RESTRICT',
  NO_ACTION = 'NO_ACTION'
}

// 关系属性接口
export interface RelationProperties {
  id?: string;
  projectId: string;
  name: string;
  type: RelationType;
  sourceEntityId: string;
  sourceFieldId: string;
  targetEntityId: string;
  targetFieldId: string;
  joinTableConfig?: any;
  onDelete?: CascadeType;
  onUpdate?: CascadeType;
  indexed?: boolean;
  indexName?: string;
  createdBy: string;
  createdAt?: Date;
}

export interface RelationCreateProperties extends Omit<RelationProperties, 'id' | 'createdAt'> {
  createdAt?: Date;
}

export interface RelationUpdateProperties extends Partial<Omit<RelationProperties, 'id' | 'projectId' | 'createdBy' | 'createdAt'>> {}

export class Relation extends AggregateRoot {
  private constructor(private props: RelationProperties) {
    super();
  }

  static create(props: RelationCreateProperties): Relation {
    // 业务规则验证
    Relation.validateBusinessRules(props);
    
    const relationProps: RelationProperties = {
      ...props,
      onDelete: props.onDelete || CascadeType.RESTRICT,
      onUpdate: props.onUpdate || CascadeType.RESTRICT,
      indexed: props.indexed !== false,
      createdAt: props.createdAt || new Date(),
    };

    return new Relation(relationProps);
  }

  static fromPersistence(props: RelationProperties): Relation {
    return new Relation(props);
  }

  update(props: RelationUpdateProperties): void {
    // 验证更新属性
    if (props.type && props.type !== this.props.type) {
      Relation.validateTypeChange(this.props.type, props.type);
    }
    
    Object.assign(this.props, props);
  }

  private static validateBusinessRules(props: RelationCreateProperties): void {
    if (!props.name || props.name.trim().length === 0) {
      throw new Error('Relation name is required');
    }
    
    if (!props.projectId) {
      throw new Error('Project ID is required');
    }
    
    if (!props.sourceEntityId) {
      throw new Error('Source entity ID is required');
    }
    
    if (!props.sourceFieldId) {
      throw new Error('Source field ID is required');
    }
    
    if (!props.targetEntityId) {
      throw new Error('Target entity ID is required');
    }
    
    if (!props.targetFieldId) {
      throw new Error('Target field ID is required');
    }
    
    if (props.sourceEntityId === props.targetEntityId && props.sourceFieldId === props.targetFieldId) {
      throw new Error('Cannot create relation to the same field');
    }
    
    if (!props.type) {
      throw new Error('Relation type is required');
    }
    
    if (!props.createdBy) {
      throw new Error('Created by is required');
    }
    
    // 验证多对多关系的连接表配置
    if (props.type === RelationType.MANY_TO_MANY && !props.joinTableConfig) {
      throw new Error('Join table configuration is required for many-to-many relations');
    }
  }

  private static validateTypeChange(oldType: RelationType, newType: RelationType): void {
    // 定义允许的关系类型转换
    const allowedTypeChanges: Record<RelationType, RelationType[]> = {
      [RelationType.ONE_TO_ONE]: [RelationType.ONE_TO_MANY],
      [RelationType.ONE_TO_MANY]: [RelationType.ONE_TO_ONE, RelationType.MANY_TO_MANY],
      [RelationType.MANY_TO_MANY]: [RelationType.ONE_TO_MANY]
    };

    if (!allowedTypeChanges[oldType]?.includes(newType)) {
      throw new Error(`Cannot change relation type from ${oldType} to ${newType}`);
    }
  }

  // Getters
  get id(): string | undefined { return this.props.id; }
  get projectId(): string { return this.props.projectId; }
  get name(): string { return this.props.name; }
  get type(): RelationType { return this.props.type; }
  get sourceEntityId(): string { return this.props.sourceEntityId; }
  get sourceFieldId(): string { return this.props.sourceFieldId; }
  get targetEntityId(): string { return this.props.targetEntityId; }
  get targetFieldId(): string { return this.props.targetFieldId; }
  get joinTableConfig(): any { return this.props.joinTableConfig; }
  get onDelete(): CascadeType { return this.props.onDelete || CascadeType.RESTRICT; }
  get onUpdate(): CascadeType { return this.props.onUpdate || CascadeType.RESTRICT; }
  get indexed(): boolean { return this.props.indexed !== false; }
  get indexName(): string | undefined { return this.props.indexName; }
  get createdBy(): string { return this.props.createdBy; }
  get createdAt(): Date | undefined { return this.props.createdAt; }

  // 业务方法
  isSelfReferencing(): boolean {
    return this.sourceEntityId === this.targetEntityId;
  }

  requiresJoinTable(): boolean {
    return this.type === RelationType.MANY_TO_MANY;
  }

  generateForeignKeyName(): string {
    return `fk_${this.sourceEntityId}_${this.sourceFieldId}_${this.targetEntityId}_${this.targetFieldId}`;
  }

  generateIndexName(): string {
    return this.indexName || `idx_${this.sourceEntityId}_${this.sourceFieldId}`;
  }

  generateJoinTableName(): string {
    if (!this.requiresJoinTable()) {
      throw new Error('Join table name is only applicable for many-to-many relations');
    }
    
    const sourceEntity = this.sourceEntityId.toLowerCase();
    const targetEntity = this.targetEntityId.toLowerCase();
    
    // 按字母顺序排列以确保一致性
    return sourceEntity < targetEntity 
      ? `${sourceEntity}_${targetEntity}` 
      : `${targetEntity}_${sourceEntity}`;
  }

  generateDDLStatements(): string[] {
    const statements: string[] = [];
    
    if (this.requiresJoinTable()) {
      // 生成连接表DDL
      const joinTableName = this.generateJoinTableName();
      const createTableSQL = `CREATE TABLE ${joinTableName} (
        ${this.sourceEntityId}_id UUID NOT NULL,
        ${this.targetEntityId}_id UUID NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (${this.sourceEntityId}_id, ${this.targetEntityId}_id),
        FOREIGN KEY (${this.sourceEntityId}_id) REFERENCES ${this.sourceEntityId}(id) ON DELETE CASCADE,
        FOREIGN KEY (${this.targetEntityId}_id) REFERENCES ${this.targetEntityId}(id) ON DELETE CASCADE
      );`;
      
      statements.push(createTableSQL);
    } else {
      // 生成外键约束DDL
      const fkName = this.generateForeignKeyName();
      const alterTableSQL = `ALTER TABLE ${this.sourceEntityId} ADD CONSTRAINT ${fkName} ` +
        `FOREIGN KEY (${this.sourceFieldId}) REFERENCES ${this.targetEntityId}(${this.targetFieldId}) ` +
        `ON DELETE ${this.onDelete} ON UPDATE ${this.onUpdate};`;
      
      statements.push(alterTableSQL);
      
      // 添加索引
      if (this.indexed) {
        const indexName = this.generateIndexName();
        statements.push(`CREATE INDEX ${indexName} ON ${this.sourceEntityId}(${this.sourceFieldId});`);
      }
    }
    
    return statements;
  }

  toJSON(): RelationProperties {
    return { ...this.props };
  }
}
