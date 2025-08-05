import { Injectable, Inject } from '@nestjs/common';
import { Entity } from '@entity/domain/entity.model';
import { Field, FieldDataType } from '@lib/bounded-contexts/field/domain/field.model';
import { EntityRepository } from '@entity/domain/entity.repository';
import { FieldRepository } from '@lib/bounded-contexts/field/domain/field.repository';

export interface EntityRelationship {
  sourceEntityId: string;
  targetEntityId: string;
  sourceFieldCode: string;
  targetFieldCode: string;
  relationshipType: 'ONE_TO_ONE' | 'ONE_TO_MANY' | 'MANY_TO_ONE' | 'MANY_TO_MANY';
  cascadeDelete: boolean;
  nullable: boolean;
}

export interface RelationshipValidationError {
  entityId: string;
  entityName: string;
  fieldCode: string;
  errorType: 'error' | 'warning';
  message: string;
  relatedEntityId?: string;
}

export interface EntityRelationshipValidationResult {
  isValid: boolean;
  errors: RelationshipValidationError[];
  warnings: RelationshipValidationError[];
  summary: {
    totalRelationships: number;
    validRelationships: number;
    circularReferences: number;
    orphanedReferences: number;
  };
  recommendations: string[];
}

@Injectable()
export class EntityRelationshipValidatorService {
  constructor(
    @Inject('EntityRepository')
    private readonly entityRepository: EntityRepository,
    @Inject('FieldRepository')
    private readonly fieldRepository: FieldRepository,
  ) {}

  /**
   * 验证实体间的关系
   */
  async validateEntityRelationships(
    projectId: string,
    relationships: EntityRelationship[]
  ): Promise<EntityRelationshipValidationResult> {
    const errors: RelationshipValidationError[] = [];
    const warnings: RelationshipValidationError[] = [];
    const recommendations: string[] = [];

    // 获取项目中的所有实体
    const entities = await this.entityRepository.findByProjectId(projectId);
    const entityMap = new Map(entities.map(e => [e.id!, e]));

    // 验证每个关系
    for (const relationship of relationships) {
      const relationshipValidation = await this.validateSingleRelationship(
        relationship,
        entityMap
      );
      errors.push(...relationshipValidation.errors);
      warnings.push(...relationshipValidation.warnings);
    }

    // 检查循环引用
    const circularReferences = this.detectCircularReferences(relationships);
    errors.push(...circularReferences.errors);
    warnings.push(...circularReferences.warnings);

    // 检查孤立引用
    const orphanedReferences = await this.detectOrphanedReferences(
      projectId,
      relationships
    );
    warnings.push(...orphanedReferences);

    // 生成优化建议
    const optimizationRecommendations = this.generateRelationshipRecommendations(
      relationships,
      entities
    );
    recommendations.push(...optimizationRecommendations);

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      recommendations,
      summary: {
        totalRelationships: relationships.length,
        validRelationships: relationships.length - errors.length,
        circularReferences: circularReferences.errors.length,
        orphanedReferences: orphanedReferences.length,
      },
    };
  }

  /**
   * 验证单个关系
   */
  private async validateSingleRelationship(
    relationship: EntityRelationship,
    entityMap: Map<string, Entity>
  ): Promise<{ errors: RelationshipValidationError[]; warnings: RelationshipValidationError[] }> {
    const errors: RelationshipValidationError[] = [];
    const warnings: RelationshipValidationError[] = [];

    const sourceEntity = entityMap.get(relationship.sourceEntityId);
    const targetEntity = entityMap.get(relationship.targetEntityId);

    // 验证源实体存在
    if (!sourceEntity) {
      errors.push({
        entityId: relationship.sourceEntityId,
        entityName: '未知实体',
        fieldCode: relationship.sourceFieldCode,
        errorType: 'error',
        message: `源实体不存在: ${relationship.sourceEntityId}`,
        relatedEntityId: relationship.targetEntityId,
      });
      return { errors, warnings };
    }

    // 验证目标实体存在
    if (!targetEntity) {
      errors.push({
        entityId: relationship.sourceEntityId,
        entityName: sourceEntity.name,
        fieldCode: relationship.sourceFieldCode,
        errorType: 'error',
        message: `目标实体不存在: ${relationship.targetEntityId}`,
        relatedEntityId: relationship.targetEntityId,
      });
      return { errors, warnings };
    }

    // 验证字段存在
    const sourceFields = await this.fieldRepository.findByEntityId(relationship.sourceEntityId);
    const targetFields = await this.fieldRepository.findByEntityId(relationship.targetEntityId);

    const sourceField = sourceFields.find(f => f.code === relationship.sourceFieldCode);
    const targetField = targetFields.find(f => f.code === relationship.targetFieldCode);

    if (!sourceField) {
      errors.push({
        entityId: relationship.sourceEntityId,
        entityName: sourceEntity.name,
        fieldCode: relationship.sourceFieldCode,
        errorType: 'error',
        message: `源字段不存在: ${relationship.sourceFieldCode}`,
        relatedEntityId: relationship.targetEntityId,
      });
    }

    if (!targetField) {
      errors.push({
        entityId: relationship.targetEntityId,
        entityName: targetEntity.name,
        fieldCode: relationship.targetFieldCode,
        errorType: 'error',
        message: `目标字段不存在: ${relationship.targetFieldCode}`,
        relatedEntityId: relationship.sourceEntityId,
      });
    }

    // 验证字段类型兼容性
    if (sourceField && targetField) {
      if (!this.areFieldTypesCompatible(sourceField, targetField)) {
        errors.push({
          entityId: relationship.sourceEntityId,
          entityName: sourceEntity.name,
          fieldCode: relationship.sourceFieldCode,
          errorType: 'error',
          message: `字段类型不兼容: ${sourceField.dataType} vs ${targetField.dataType}`,
          relatedEntityId: relationship.targetEntityId,
        });
      }

      // 验证关系类型的合理性
      const relationshipTypeValidation = this.validateRelationshipType(
        relationship,
        sourceField,
        targetField
      );
      warnings.push(...relationshipTypeValidation);
    }

    return { errors, warnings };
  }

  /**
   * 检测循环引用
   */
  private detectCircularReferences(
    relationships: EntityRelationship[]
  ): { errors: RelationshipValidationError[]; warnings: RelationshipValidationError[] } {
    const errors: RelationshipValidationError[] = [];
    const warnings: RelationshipValidationError[] = [];
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    const dfs = (entityId: string, path: string[]): boolean => {
      if (recursionStack.has(entityId)) {
        // 发现循环引用
        const cycleStart = path.indexOf(entityId);
        const cycle = path.slice(cycleStart).concat(entityId);
        
        errors.push({
          entityId,
          entityName: '循环引用',
          fieldCode: '',
          errorType: 'error',
          message: `检测到循环引用: ${cycle.join(' -> ')}`,
        });
        return true;
      }

      if (visited.has(entityId)) {
        return false;
      }

      visited.add(entityId);
      recursionStack.add(entityId);

      // 查找从当前实体出发的所有关系
      const outgoingRelationships = relationships.filter(
        r => r.sourceEntityId === entityId
      );

      for (const relationship of outgoingRelationships) {
        if (dfs(relationship.targetEntityId, [...path, entityId])) {
          return true;
        }
      }

      recursionStack.delete(entityId);
      return false;
    };

    // 检查所有实体
    const allEntityIds = new Set([
      ...relationships.map(r => r.sourceEntityId),
      ...relationships.map(r => r.targetEntityId),
    ]);

    for (const entityId of allEntityIds) {
      if (!visited.has(entityId)) {
        dfs(entityId, []);
      }
    }

    return { errors, warnings };
  }

  /**
   * 检测孤立引用
   */
  private async detectOrphanedReferences(
    projectId: string,
    relationships: EntityRelationship[]
  ): Promise<RelationshipValidationError[]> {
    const warnings: RelationshipValidationError[] = [];
    const entities = await this.entityRepository.findByProjectId(projectId);
    const entityIds = new Set(entities.map(e => e.id!));

    // 检查关系中引用的实体是否都存在
    const referencedEntityIds = new Set([
      ...relationships.map(r => r.sourceEntityId),
      ...relationships.map(r => r.targetEntityId),
    ]);

    for (const entityId of referencedEntityIds) {
      if (!entityIds.has(entityId)) {
        warnings.push({
          entityId,
          entityName: '未知实体',
          fieldCode: '',
          errorType: 'warning',
          message: `关系中引用的实体不存在: ${entityId}`,
        });
      }
    }

    return warnings;
  }

  /**
   * 验证字段类型兼容性
   */
  private areFieldTypesCompatible(sourceField: Field, targetField: Field): boolean {
    // 相同类型直接兼容
    if (sourceField.dataType === targetField.dataType) {
      return true;
    }

    // 定义兼容的类型组合
    const compatibleTypes = new Map([
      [FieldDataType.STRING, [FieldDataType.STRING]],
      [FieldDataType.INTEGER, [FieldDataType.INTEGER, FieldDataType.DECIMAL]],
      [FieldDataType.DECIMAL, [FieldDataType.INTEGER, FieldDataType.DECIMAL]],
      [FieldDataType.DATE, [FieldDataType.DATE, FieldDataType.DATETIME]],
      [FieldDataType.DATETIME, [FieldDataType.DATE, FieldDataType.DATETIME]],
      [FieldDataType.BOOLEAN, [FieldDataType.BOOLEAN]],
      [FieldDataType.TEXT, [FieldDataType.STRING, FieldDataType.TEXT]],
      [FieldDataType.JSON, [FieldDataType.JSON]],
    ]);

    const sourceCompatibleTypes = compatibleTypes.get(sourceField.dataType) || [];
    return sourceCompatibleTypes.includes(targetField.dataType);
  }

  /**
   * 验证关系类型的合理性
   */
  private validateRelationshipType(
    relationship: EntityRelationship,
    sourceField: Field,
    targetField: Field
  ): RelationshipValidationError[] {
    const warnings: RelationshipValidationError[] = [];

    // 检查一对一关系的唯一性约束
    if (relationship.relationshipType === 'ONE_TO_ONE') {
      if (!sourceField.unique || !targetField.unique) {
        warnings.push({
          entityId: relationship.sourceEntityId,
          entityName: '',
          fieldCode: relationship.sourceFieldCode,
          errorType: 'warning',
          message: '一对一关系建议在两端都设置唯一约束',
          relatedEntityId: relationship.targetEntityId,
        });
      }
    }

    // 检查多对多关系的实现方式
    if (relationship.relationshipType === 'MANY_TO_MANY') {
      warnings.push({
        entityId: relationship.sourceEntityId,
        entityName: '',
        fieldCode: relationship.sourceFieldCode,
        errorType: 'warning',
        message: '多对多关系建议通过中间表实现，而不是直接字段引用',
        relatedEntityId: relationship.targetEntityId,
      });
    }

    return warnings;
  }

  /**
   * 生成关系优化建议
   */
  private generateRelationshipRecommendations(
    relationships: EntityRelationship[],
    entities: Entity[]
  ): string[] {
    const recommendations: string[] = [];

    // 检查关系数量
    if (relationships.length > 50) {
      recommendations.push('实体关系数量较多，建议考虑简化实体模型或拆分为多个子域');
    }

    // 检查级联删除的使用
    const cascadeDeleteCount = relationships.filter(r => r.cascadeDelete).length;
    if (cascadeDeleteCount > relationships.length * 0.3) {
      recommendations.push('级联删除关系较多，请谨慎使用以避免意外的数据丢失');
    }

    // 检查关系的分布
    const entityRelationshipCount = new Map<string, number>();
    relationships.forEach(r => {
      entityRelationshipCount.set(
        r.sourceEntityId,
        (entityRelationshipCount.get(r.sourceEntityId) || 0) + 1
      );
    });

    const maxRelationships = Math.max(...entityRelationshipCount.values());
    if (maxRelationships > 10) {
      recommendations.push('某些实体的关系数量过多，建议考虑重构以降低耦合度');
    }

    return recommendations;
  }
}