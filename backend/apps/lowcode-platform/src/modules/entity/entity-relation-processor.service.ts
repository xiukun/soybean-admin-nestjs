import { Injectable, Logger } from '@nestjs/common';
import { AuthenticatedUser } from '@lib/shared-auth';
import { BusinessException } from '@lib/shared-errors';

export enum RelationType {
  ONE_TO_ONE = 'ONE_TO_ONE',
  ONE_TO_MANY = 'ONE_TO_MANY',
  MANY_TO_ONE = 'MANY_TO_ONE',
  MANY_TO_MANY = 'MANY_TO_MANY',
}

export interface EntityRelation {
  id: string;
  name: string;
  sourceEntityId: string;
  targetEntityId: string;
  type: RelationType;
  sourceField?: string;
  targetField?: string;
  foreignKey?: string;
  joinTable?: string;
  onDelete?: 'CASCADE' | 'SET_NULL' | 'RESTRICT' | 'NO_ACTION';
  onUpdate?: 'CASCADE' | 'SET_NULL' | 'RESTRICT' | 'NO_ACTION';
  required?: boolean;
  lazy?: boolean;
  eager?: boolean;
}

export interface ProcessedEntity {
  id: string;
  name: string;
  tableName: string;
  fields: any[];
  relations: ProcessedRelation[];
  imports: string[];
  dependencies: string[];
}

export interface ProcessedRelation {
  relation: EntityRelation;
  sourceEntity: any;
  targetEntity: any;
  generatedCode: {
    sourceCode: string;
    targetCode: string;
    joinTableCode?: string;
  };
  validationResult: RelationValidationResult;
}

export interface RelationValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  suggestions: string[];
}

@Injectable()
export class EntityRelationProcessorService {
  private readonly logger = new Logger(EntityRelationProcessorService.name);

  async processEntityRelations(
    entities: any[],
    relations: EntityRelation[],
    framework: string = 'nestjs',
    user: AuthenticatedUser
  ): Promise<ProcessedEntity[]> {
    this.logger.log(`Processing ${relations.length} relations for ${entities.length} entities`);

    const processedEntities: ProcessedEntity[] = [];

    for (const entity of entities) {
      const entityRelations = relations.filter(
        rel => rel.sourceEntityId === entity.id || rel.targetEntityId === entity.id
      );

      const processedEntity = await this.processEntityWithRelations(
        entity,
        entityRelations,
        entities,
        framework,
        user
      );

      processedEntities.push(processedEntity);
    }

    // 验证关系的一致性
    await this.validateRelationConsistency(processedEntities, user);

    return processedEntities;
  }

  private async processEntityWithRelations(
    entity: any,
    entityRelations: EntityRelation[],
    allEntities: any[],
    framework: string,
    user: AuthenticatedUser
  ): Promise<ProcessedEntity> {
    const processedRelations: ProcessedRelation[] = [];
    const imports: Set<string> = new Set();
    const dependencies: Set<string> = new Set();

    for (const relation of entityRelations) {
      const processedRelation = await this.processRelation(
        relation,
        entity,
        allEntities,
        framework,
        user
      );

      processedRelations.push(processedRelation);

      // 收集导入和依赖
      if (processedRelation.targetEntity.id !== entity.id) {
        imports.add(processedRelation.targetEntity.name);
        dependencies.add(processedRelation.targetEntity.id);
      }
    }

    return {
      id: entity.id,
      name: entity.name,
      tableName: entity.tableName,
      fields: entity.fields || [],
      relations: processedRelations,
      imports: Array.from(imports),
      dependencies: Array.from(dependencies),
    };
  }

  private async processRelation(
    relation: EntityRelation,
    currentEntity: any,
    allEntities: any[],
    framework: string,
    user: AuthenticatedUser
  ): Promise<ProcessedRelation> {
    const sourceEntity = allEntities.find(e => e.id === relation.sourceEntityId);
    const targetEntity = allEntities.find(e => e.id === relation.targetEntityId);

    if (!sourceEntity || !targetEntity) {
      throw BusinessException.notFound('Entity', 'Source or target entity not found');
    }

    // 验证关系
    const validationResult = await this.validateRelation(relation, sourceEntity, targetEntity);

    // 生成关系代码
    const generatedCode = await this.generateRelationCode(
      relation,
      sourceEntity,
      targetEntity,
      framework
    );

    return {
      relation,
      sourceEntity,
      targetEntity,
      generatedCode,
      validationResult,
    };
  }

  private async validateRelation(
    relation: EntityRelation,
    sourceEntity: any,
    targetEntity: any
  ): Promise<RelationValidationResult> {
    const result: RelationValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
      suggestions: [],
    };

    // 基本验证
    if (relation.sourceEntityId === relation.targetEntityId) {
      result.errors.push('Self-referencing relations are not recommended');
      result.isValid = false;
    }

    // 验证字段存在性
    if (relation.sourceField) {
      const sourceFieldExists = sourceEntity.fields?.some(
        (field: any) => field.name === relation.sourceField
      );
      if (!sourceFieldExists) {
        result.warnings.push(`Source field '${relation.sourceField}' does not exist in entity '${sourceEntity.name}'`);
      }
    }

    if (relation.targetField) {
      const targetFieldExists = targetEntity.fields?.some(
        (field: any) => field.name === relation.targetField
      );
      if (!targetFieldExists) {
        result.warnings.push(`Target field '${relation.targetField}' does not exist in entity '${targetEntity.name}'`);
      }
    }

    // 验证外键
    if (relation.foreignKey && relation.type !== RelationType.MANY_TO_MANY) {
      const foreignKeyExists = sourceEntity.fields?.some(
        (field: any) => field.name === relation.foreignKey
      );
      if (!foreignKeyExists) {
        result.suggestions.push(`Consider adding foreign key field '${relation.foreignKey}' to entity '${sourceEntity.name}'`);
      }
    }

    // 多对多关系验证
    if (relation.type === RelationType.MANY_TO_MANY) {
      if (!relation.joinTable) {
        result.warnings.push('Many-to-many relation should specify a join table name');
      }
    }

    return result;
  }

  private async generateRelationCode(
    relation: EntityRelation,
    sourceEntity: any,
    targetEntity: any,
    framework: string
  ): Promise<{ sourceCode: string; targetCode: string; joinTableCode?: string }> {
    switch (framework.toLowerCase()) {
      case 'nestjs':
        return this.generateNestJSRelationCode(relation, sourceEntity, targetEntity);
      case 'spring-boot':
        return this.generateSpringBootRelationCode(relation, sourceEntity, targetEntity);
      case 'django':
        return this.generateDjangoRelationCode(relation, sourceEntity, targetEntity);
      default:
        throw BusinessException.badRequest(`Unsupported framework: ${framework}`);
    }
  }

  private generateNestJSRelationCode(
    relation: EntityRelation,
    sourceEntity: any,
    targetEntity: any
  ): { sourceCode: string; targetCode: string; joinTableCode?: string } {
    const sourceField = relation.sourceField || this.getDefaultFieldName(targetEntity.name, relation.type);
    const targetField = relation.targetField || this.getDefaultFieldName(sourceEntity.name, relation.type, true);
    const foreignKey = relation.foreignKey || `${targetEntity.name.toLowerCase()}_id`;

    let sourceCode = '';
    let targetCode = '';
    let joinTableCode = '';

    switch (relation.type) {
      case RelationType.ONE_TO_ONE:
        sourceCode = `@OneToOne(() => ${targetEntity.name}${relation.lazy ? ', { lazy: true }' : ''})
  @JoinColumn({ name: '${foreignKey}' })
  ${sourceField}: ${targetEntity.name};`;

        targetCode = `@OneToOne(() => ${sourceEntity.name}, ${sourceEntity.name.toLowerCase()} => ${sourceEntity.name.toLowerCase()}.${sourceField})
  ${targetField}: ${sourceEntity.name};`;
        break;

      case RelationType.ONE_TO_MANY:
        sourceCode = `@OneToMany(() => ${targetEntity.name}, ${targetEntity.name.toLowerCase()} => ${targetEntity.name.toLowerCase()}.${targetField}${relation.lazy ? ', { lazy: true }' : ''})
  ${sourceField}: ${targetEntity.name}[];`;

        targetCode = `@ManyToOne(() => ${sourceEntity.name}${relation.lazy ? ', { lazy: true }' : ''})
  @JoinColumn({ name: '${foreignKey}' })
  ${targetField}: ${sourceEntity.name};`;
        break;

      case RelationType.MANY_TO_ONE:
        sourceCode = `@ManyToOne(() => ${targetEntity.name}${relation.lazy ? ', { lazy: true }' : ''})
  @JoinColumn({ name: '${foreignKey}' })
  ${sourceField}: ${targetEntity.name};`;

        targetCode = `@OneToMany(() => ${sourceEntity.name}, ${sourceEntity.name.toLowerCase()} => ${sourceEntity.name.toLowerCase()}.${sourceField}${relation.lazy ? ', { lazy: true }' : ''})
  ${targetField}: ${sourceEntity.name}[];`;
        break;

      case RelationType.MANY_TO_MANY:
        const joinTable = relation.joinTable || `${sourceEntity.name.toLowerCase()}_${targetEntity.name.toLowerCase()}`;
        
        sourceCode = `@ManyToMany(() => ${targetEntity.name}${relation.lazy ? ', { lazy: true }' : ''})
  @JoinTable({
    name: '${joinTable}',
    joinColumn: { name: '${sourceEntity.name.toLowerCase()}_id' },
    inverseJoinColumn: { name: '${targetEntity.name.toLowerCase()}_id' }
  })
  ${sourceField}: ${targetEntity.name}[];`;

        targetCode = `@ManyToMany(() => ${sourceEntity.name}, ${sourceEntity.name.toLowerCase()} => ${sourceEntity.name.toLowerCase()}.${sourceField}${relation.lazy ? ', { lazy: true }' : ''})
  ${targetField}: ${sourceEntity.name}[];`;

        joinTableCode = `-- Join table for ${relation.name}
CREATE TABLE ${joinTable} (
  ${sourceEntity.name.toLowerCase()}_id UUID NOT NULL,
  ${targetEntity.name.toLowerCase()}_id UUID NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (${sourceEntity.name.toLowerCase()}_id, ${targetEntity.name.toLowerCase()}_id),
  FOREIGN KEY (${sourceEntity.name.toLowerCase()}_id) REFERENCES ${sourceEntity.tableName}(id) ON DELETE CASCADE,
  FOREIGN KEY (${targetEntity.name.toLowerCase()}_id) REFERENCES ${targetEntity.tableName}(id) ON DELETE CASCADE
);`;
        break;
    }

    return { sourceCode, targetCode, joinTableCode };
  }

  private generateSpringBootRelationCode(
    relation: EntityRelation,
    sourceEntity: any,
    targetEntity: any
  ): { sourceCode: string; targetCode: string; joinTableCode?: string } {
    const sourceField = relation.sourceField || this.getDefaultFieldName(targetEntity.name, relation.type);
    const targetField = relation.targetField || this.getDefaultFieldName(sourceEntity.name, relation.type, true);
    const foreignKey = relation.foreignKey || `${targetEntity.name.toLowerCase()}_id`;

    let sourceCode = '';
    let targetCode = '';

    switch (relation.type) {
      case RelationType.ONE_TO_ONE:
        sourceCode = `@OneToOne${relation.lazy ? '(fetch = FetchType.LAZY)' : ''}
    @JoinColumn(name = "${foreignKey}")
    private ${targetEntity.name} ${sourceField};`;

        targetCode = `@OneToOne(mappedBy = "${sourceField}"${relation.lazy ? ', fetch = FetchType.LAZY' : ''})
    private ${sourceEntity.name} ${targetField};`;
        break;

      case RelationType.ONE_TO_MANY:
        sourceCode = `@OneToMany(mappedBy = "${targetField}"${relation.lazy ? ', fetch = FetchType.LAZY' : ''})
    private List<${targetEntity.name}> ${sourceField};`;

        targetCode = `@ManyToOne${relation.lazy ? '(fetch = FetchType.LAZY)' : ''}
    @JoinColumn(name = "${foreignKey}")
    private ${sourceEntity.name} ${targetField};`;
        break;

      case RelationType.MANY_TO_ONE:
        sourceCode = `@ManyToOne${relation.lazy ? '(fetch = FetchType.LAZY)' : ''}
    @JoinColumn(name = "${foreignKey}")
    private ${targetEntity.name} ${sourceField};`;

        targetCode = `@OneToMany(mappedBy = "${sourceField}"${relation.lazy ? ', fetch = FetchType.LAZY' : ''})
    private List<${sourceEntity.name}> ${targetField};`;
        break;

      case RelationType.MANY_TO_MANY:
        const joinTable = relation.joinTable || `${sourceEntity.name.toLowerCase()}_${targetEntity.name.toLowerCase()}`;
        
        sourceCode = `@ManyToMany${relation.lazy ? '(fetch = FetchType.LAZY)' : ''}
    @JoinTable(
        name = "${joinTable}",
        joinColumns = @JoinColumn(name = "${sourceEntity.name.toLowerCase()}_id"),
        inverseJoinColumns = @JoinColumn(name = "${targetEntity.name.toLowerCase()}_id")
    )
    private List<${targetEntity.name}> ${sourceField};`;

        targetCode = `@ManyToMany(mappedBy = "${sourceField}"${relation.lazy ? ', fetch = FetchType.LAZY' : ''})
    private List<${sourceEntity.name}> ${targetField};`;
        break;
    }

    return { sourceCode, targetCode };
  }

  private generateDjangoRelationCode(
    relation: EntityRelation,
    sourceEntity: any,
    targetEntity: any
  ): { sourceCode: string; targetCode: string } {
    const sourceField = relation.sourceField || this.getDefaultFieldName(targetEntity.name, relation.type);
    const targetField = relation.targetField || this.getDefaultFieldName(sourceEntity.name, relation.type, true);

    let sourceCode = '';
    let targetCode = '';

    switch (relation.type) {
      case RelationType.ONE_TO_ONE:
        sourceCode = `${sourceField} = models.OneToOneField(${targetEntity.name}, on_delete=models.CASCADE)`;
        targetCode = `${targetField} = models.OneToOneField(${sourceEntity.name}, on_delete=models.CASCADE, related_name='${sourceField}')`;
        break;

      case RelationType.ONE_TO_MANY:
        sourceCode = `# ${sourceField} accessible via ${targetEntity.name.toLowerCase()}_set`;
        targetCode = `${targetField} = models.ForeignKey(${sourceEntity.name}, on_delete=models.CASCADE, related_name='${sourceField}')`;
        break;

      case RelationType.MANY_TO_ONE:
        sourceCode = `${sourceField} = models.ForeignKey(${targetEntity.name}, on_delete=models.CASCADE, related_name='${targetField}')`;
        targetCode = `# ${targetField} accessible via ${sourceEntity.name.toLowerCase()}_set`;
        break;

      case RelationType.MANY_TO_MANY:
        sourceCode = `${sourceField} = models.ManyToManyField(${targetEntity.name}, related_name='${targetField}')`;
        targetCode = `# ${targetField} accessible via ${sourceField} reverse relation`;
        break;
    }

    return { sourceCode, targetCode };
  }

  private getDefaultFieldName(entityName: string, relationType: RelationType, isInverse: boolean = false): string {
    const baseName = entityName.charAt(0).toLowerCase() + entityName.slice(1);
    
    if (relationType === RelationType.ONE_TO_MANY || relationType === RelationType.MANY_TO_MANY) {
      return isInverse ? baseName : `${baseName}s`;
    }
    
    return baseName;
  }

  private async validateRelationConsistency(
    processedEntities: ProcessedEntity[],
    user: AuthenticatedUser
  ): Promise<void> {
    this.logger.log('Validating relation consistency across entities');

    const issues: string[] = [];

    for (const entity of processedEntities) {
      for (const processedRelation of entity.relations) {
        const { relation, sourceEntity, targetEntity } = processedRelation;

        // 检查反向关系是否存在
        const reverseEntity = processedEntities.find(e => e.id === targetEntity.id);
        if (reverseEntity) {
          const hasReverseRelation = reverseEntity.relations.some(rel =>
            rel.relation.sourceEntityId === relation.targetEntityId &&
            rel.relation.targetEntityId === relation.sourceEntityId
          );

          if (!hasReverseRelation && relation.type !== RelationType.MANY_TO_ONE) {
            issues.push(`Missing reverse relation for ${relation.name} between ${sourceEntity.name} and ${targetEntity.name}`);
          }
        }
      }
    }

    if (issues.length > 0) {
      this.logger.warn(`Relation consistency issues found: ${issues.join(', ')}`);
    }
  }
}
