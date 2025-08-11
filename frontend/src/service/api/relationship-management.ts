import { request } from '../request';

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

/** 获取关系推荐 */
export function fetchRelationshipRecommendations(projectId: string) {
  return request<RelationshipRecommendation[]>({
    url: `/api/relationships/recommendations/${projectId}`,
    method: 'get'
  });
}

/** 验证关系推荐 */
export function validateRelationshipRecommendation(recommendation: RelationshipRecommendation) {
  return request<{
    isValid: boolean;
    issues: string[];
    suggestions: string[];
  }>({
    url: '/api/relationships/validate-recommendation',
    method: 'post',
    data: recommendation
  });
}

/** 批量创建推荐的关系 */
export function createRecommendedRelationships(
  recommendations: RelationshipRecommendation[],
  options: {
    autoApprove?: boolean;
    confidenceThreshold?: number;
  } = {}
) {
  return request<{
    created: string[];
    skipped: string[];
    errors: { recommendation: RelationshipRecommendation; error: string }[];
  }>({
    url: '/api/relationships/create-recommended',
    method: 'post',
    data: {
      recommendations,
      options
    }
  });
}

/** 获取项目关系分析报告 */
export function fetchRelationshipOptimizationReport(projectId: string) {
  return request<OptimizationReport>({
    url: `/api/relationships/optimization-report/${projectId}`,
    method: 'get'
  });
}

/** 获取项目关系指标 */
export function fetchRelationshipMetrics(projectId: string) {
  return request<RelationshipMetrics>({
    url: `/api/relationships/metrics/${projectId}`,
    method: 'get'
  });
}

/** 获取关系图数据 */
export function fetchRelationshipGraph(projectId: string) {
  return request<{
    nodes: Array<{
      id: string;
      name: string;
      type: string;
      x?: number;
      y?: number;
      color?: string;
    }>;
    edges: Array<{
      id: string;
      source: string;
      target: string;
      type: string;
      label: string;
    }>;
  }>({
    url: `/api/relationships/graph/${projectId}`,
    method: 'get'
  });
}

/** 保存关系图布局 */
export function saveRelationshipGraphLayout(projectId: string, layout: Record<string, { x: number; y: number }>) {
  return request({
    url: `/api/relationships/graph/${projectId}/layout`,
    method: 'post',
    data: layout
  });
}

/** 导出关系模式 */
export function exportRelationshipSchema(projectId: string, format: 'json' | 'sql' | 'prisma' = 'json') {
  return request<string>({
    url: `/api/relationships/export/${projectId}`,
    method: 'get',
    params: { format }
  });
}

/** 导入关系模式 */
export function importRelationshipSchema(projectId: string, schema: string, format: 'json' | 'sql' = 'json') {
  return request<{
    imported: number;
    skipped: number;
    errors: string[];
  }>({
    url: `/api/relationships/import/${projectId}`,
    method: 'post',
    data: {
      schema,
      format
    }
  });
}
