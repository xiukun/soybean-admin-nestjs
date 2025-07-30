import { Injectable, Logger, Inject } from '@nestjs/common';
import { EntityRepository } from '@entity/domain/entity.repository';
import { FieldRepository } from '@field/domain/field.repository';

export interface RelationshipRecommendation {
  sourceEntityId: string;
  targetEntityId: string;
  recommendedType: 'ONE_TO_ONE' | 'ONE_TO_MANY' | 'MANY_TO_ONE' | 'MANY_TO_MANY';
  confidence: number;
  reason: string;
  suggestedName: string;
  suggestedForeignKey: string;
}

@Injectable()
export class RelationshipRecommendationService {
  private readonly logger = new Logger(RelationshipRecommendationService.name);

  constructor(
    @Inject('EntityRepository')
    private readonly entityRepository: EntityRepository,
    @Inject('FieldRepository')
    private readonly fieldRepository: FieldRepository
  ) {}

  /**
   * 分析项目中的实体，推荐可能的关系
   */
  async analyzeAndRecommendRelationships(projectId: string): Promise<RelationshipRecommendation[]> {
    this.logger.log(`分析项目 ${projectId} 的实体关系`);

    const entities = await this.entityRepository.findByProjectId(projectId);
    const recommendations: RelationshipRecommendation[] = [];

    // 分析每对实体之间的潜在关系
    for (let i = 0; i < entities.length; i++) {
      for (let j = i + 1; j < entities.length; j++) {
        const sourceEntity = entities[i];
        const targetEntity = entities[j];

        // 获取实体字段
        const sourceFields = await this.fieldRepository.findByEntityId(sourceEntity.id);
        const targetFields = await this.fieldRepository.findByEntityId(targetEntity.id);

        // 分析命名模式
        const namingRecommendations = this.analyzeNamingPatterns(
          sourceEntity, targetEntity, sourceFields, targetFields
        );
        recommendations.push(...namingRecommendations);
      }
    }

    // 按置信度排序
    return recommendations.sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * 基于命名模式分析关系
   */
  private analyzeNamingPatterns(sourceEntity: any, targetEntity: any, sourceFields: any[], targetFields: any[]): RelationshipRecommendation[] {
    const recommendations: RelationshipRecommendation[] = [];

    // 检查是否有外键命名模式
    const foreignKeyPatterns = [
      `${targetEntity.code.toLowerCase()}_id`,
      `${targetEntity.code.toLowerCase()}Id`
    ];

    const hasForeignKey = sourceFields.some(field => 
      foreignKeyPatterns.includes(field.code.toLowerCase())
    );

    if (hasForeignKey) {
      recommendations.push({
        sourceEntityId: sourceEntity.id,
        targetEntityId: targetEntity.id,
        recommendedType: 'MANY_TO_ONE',
        confidence: 0.8,
        reason: `实体 ${sourceEntity.name} 包含指向 ${targetEntity.name} 的外键字段`,
        suggestedName: `${sourceEntity.name}To${targetEntity.name}`,
        suggestedForeignKey: `${targetEntity.code.toLowerCase()}_id`
      });
    }

    return recommendations;
  }
}