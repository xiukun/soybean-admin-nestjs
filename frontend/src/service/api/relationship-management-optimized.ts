import { request } from '../request';

// 关系推荐和优化相关的高级功能API
// 这些API是对基础关系管理API的补充，提供智能分析功能

export interface RelationshipRecommendation {
  sourceEntityId: string;
  targetEntityId: string;
  recommendedType: 'ONE_TO_ONE' | 'ONE_TO_MANY' | 'MANY_TO_ONE' | 'MANY_TO_MANY';
  confidence: number;
  reason: string;
  suggestedName: string;
  suggestedForeignKey: string;
}

export interface OptimizationSuggestion {
  type: 'PERFORMANCE' | 'STRUCTURE' | 'NAMING' | 'CONSTRAINT';
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  title: string;
  description: string;
  impact: string;
  solution: string;
  estimatedEffort: 'LOW' | 'MEDIUM' | 'HIGH';
  relatedEntities: string[];
}

export interface RelationshipMetrics {
  totalRelationships: number;
  relationshipTypes: Record<string, number>;
  averageRelationshipsPerEntity: number;
  complexEntities: string[];
  orphanEntities: string[];
  circularDependencies: string[][];
  performanceIssues: string[];
}

export interface OptimizationReport {
  summary: string;
  metrics: RelationshipMetrics;
  suggestions: OptimizationSuggestion[];
  actionPlan: {
    immediate: OptimizationSuggestion[];
    shortTerm: OptimizationSuggestion[];
    longTerm: OptimizationSuggestion[];
  };
}

/**
 * 获取关系推荐 - 智能分析功能
 */
export function fetchRelationshipRecommendations(projectId: string) {
  return request<RelationshipRecommendation[]>({
    url: `/api/relationships/recommendations/${projectId}`,
    method: 'get'
  });
}

/**
 * 获取项目关系分析报告 - 智能分析功能
 */
export function fetchRelationshipOptimizationReport(projectId: string) {
  return request<OptimizationReport>({
    url: `/api/relationships/optimization-report/${projectId}`,
    method: 'get'
  });
}

/**
 * 获取项目关系指标 - 智能分析功能
 */
export function fetchRelationshipMetrics(projectId: string) {
  return request<RelationshipMetrics>({
    url: `/api/relationships/metrics/${projectId}`,
    method: 'get'
  });
}