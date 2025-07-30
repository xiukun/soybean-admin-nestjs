import { Injectable, Logger, Inject } from '@nestjs/common';
import { EntityRepository } from '@entity/domain/entity.repository';
import { FieldRepository } from '@field/domain/field.repository';

export interface OptimizationReport {
  entityCount: number;
  relationshipCount: number;
  issues: OptimizationIssue[];
  recommendations: OptimizationRecommendation[];
  performanceMetrics: PerformanceMetrics;
}

export interface OptimizationIssue {
  type: 'CIRCULAR_DEPENDENCY' | 'MISSING_INDEX' | 'REDUNDANT_RELATIONSHIP' | 'NAMING_INCONSISTENCY';
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  entityId: string;
  description: string;
  solution: string;
}

export interface OptimizationRecommendation {
  type: 'ADD_INDEX' | 'MERGE_ENTITIES' | 'SPLIT_ENTITY' | 'OPTIMIZE_RELATIONSHIP';
  priority: number;
  description: string;
  expectedBenefit: string;
  implementation: string;
}

export interface PerformanceMetrics {
  queryComplexity: number;
  indexCoverage: number;
  relationshipDepth: number;
  estimatedQueryTime: number;
}

@Injectable()
export class RelationshipOptimizationService {
  private readonly logger = new Logger(RelationshipOptimizationService.name);

  constructor(
    @Inject('EntityRepository')
    private readonly entityRepository: EntityRepository,
    @Inject('FieldRepository')
    private readonly fieldRepository: FieldRepository
  ) {}

  /**
   * 生成关系优化报告
   */
  async generateOptimizationReport(projectId: string): Promise<OptimizationReport> {
    this.logger.log(`生成项目 ${projectId} 的关系优化报告`);

    const entities = await this.entityRepository.findByProjectId(projectId);
    const issues: OptimizationIssue[] = [];
    const recommendations: OptimizationRecommendation[] = [];

    // 分析循环依赖
    const circularDependencies = await this.detectCircularDependencies(entities);
    issues.push(...circularDependencies);

    // 分析缺失索引
    const missingIndexes = await this.detectMissingIndexes(entities);
    issues.push(...missingIndexes);

    // 生成性能指标
    const performanceMetrics = await this.calculatePerformanceMetrics(entities);

    // 生成优化建议
    const optimizationRecommendations = await this.generateRecommendations(entities, issues);
    recommendations.push(...optimizationRecommendations);

    return {
      entityCount: entities.length,
      relationshipCount: await this.countRelationships(entities),
      issues,
      recommendations,
      performanceMetrics
    };
  }

  /**
   * 检测循环依赖
   */
  private async detectCircularDependencies(entities: any[]): Promise<OptimizationIssue[]> {
    const issues: OptimizationIssue[] = [];
    
    // 简化的循环依赖检测逻辑
    for (const entity of entities) {
      const fields = await this.fieldRepository.findByEntityId(entity.id);
      const foreignKeys = fields.filter(field => field.code.endsWith('_id') && field.code !== 'id');
      
      if (foreignKeys.length > 3) {
        issues.push({
          type: 'CIRCULAR_DEPENDENCY',
          severity: 'MEDIUM',
          entityId: entity.id,
          description: `实体 ${entity.name} 包含过多外键关系，可能存在循环依赖`,
          solution: '考虑重构实体关系，减少直接依赖'
        });
      }
    }

    return issues;
  }

  /**
   * 检测缺失索引
   */
  private async detectMissingIndexes(entities: any[]): Promise<OptimizationIssue[]> {
    const issues: OptimizationIssue[] = [];
    
    for (const entity of entities) {
      const fields = await this.fieldRepository.findByEntityId(entity.id);
      const foreignKeys = fields.filter(field => field.code.endsWith('_id') && field.code !== 'id');
      
      for (const fk of foreignKeys) {
        // 简化处理：假设外键字段都需要索引
        issues.push({
          type: 'MISSING_INDEX',
          severity: 'HIGH',
          entityId: entity.id,
          description: `外键字段 ${fk.name} 建议添加索引`,
          solution: `为字段 ${fk.name} 添加数据库索引以提高查询性能`
        });
      }
    }

    return issues;
  }

  /**
   * 计算性能指标
   */
  private async calculatePerformanceMetrics(entities: any[]): Promise<PerformanceMetrics> {
    let totalFields = 0;
    let indexedFields = 0;
    let relationshipCount = 0;

    for (const entity of entities) {
      const fields = await this.fieldRepository.findByEntityId(entity.id);
      totalFields += fields.length;
      indexedFields += fields.filter(f => f.code === 'id' || f.code.endsWith('_id')).length;
      relationshipCount += fields.filter(f => f.code.endsWith('_id')).length;
    }

    return {
      queryComplexity: Math.min(relationshipCount / entities.length, 10),
      indexCoverage: totalFields > 0 ? (indexedFields / totalFields) * 100 : 0,
      relationshipDepth: Math.ceil(relationshipCount / entities.length),
      estimatedQueryTime: relationshipCount * 10 // 简化的估算
    };
  }

  /**
   * 生成优化建议
   */
  private async generateRecommendations(entities: any[], issues: OptimizationIssue[]): Promise<OptimizationRecommendation[]> {
    const recommendations: OptimizationRecommendation[] = [];

    // 基于问题生成建议
    const missingIndexIssues = issues.filter(i => i.type === 'MISSING_INDEX');
    if (missingIndexIssues.length > 0) {
      recommendations.push({
        type: 'ADD_INDEX',
        priority: 1,
        description: `为 ${missingIndexIssues.length} 个外键字段添加索引`,
        expectedBenefit: '查询性能提升 30-50%',
        implementation: '在数据库迁移中添加索引创建语句'
      });
    }

    // 实体数量过多的建议
    if (entities.length > 20) {
      recommendations.push({
        type: 'SPLIT_ENTITY',
        priority: 2,
        description: '考虑将大型实体拆分为更小的模块',
        expectedBenefit: '提高代码可维护性和查询性能',
        implementation: '按业务领域重新组织实体结构'
      });
    }

    return recommendations;
  }

  /**
   * 统计关系数量
   */
  private async countRelationships(entities: any[]): Promise<number> {
    let count = 0;
    for (const entity of entities) {
      const fields = await this.fieldRepository.findByEntityId(entity.id);
      count += fields.filter(f => f.code.endsWith('_id') && f.code !== 'id').length;
    }
    return count;
  }
}