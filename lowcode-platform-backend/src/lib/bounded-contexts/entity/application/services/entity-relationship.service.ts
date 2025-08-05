import { Injectable } from '@nestjs/common';
import { FieldDataType } from '@lib/bounded-contexts/field/domain/field.model';

export interface EntityRelationship {
  id: string;
  name: string;
  description?: string;
  sourceEntityCode: string;
  targetEntityCode: string;
  type: RelationshipType;
  cardinality: RelationshipCardinality;
  sourceField?: string;
  targetField?: string;
  cascadeOptions: CascadeOptions;
  constraints: RelationshipConstraint[];
  isVirtual: boolean;
  metadata: Record<string, any>;
  createdBy: string;
  createdAt: Date;
  updatedBy?: string;
  updatedAt?: Date;
}

export type RelationshipType = 
  | 'one_to_one' 
  | 'one_to_many' 
  | 'many_to_one' 
  | 'many_to_many'
  | 'inheritance'
  | 'composition'
  | 'aggregation'
  | 'dependency';

export interface RelationshipCardinality {
  sourceMin: number;
  sourceMax: number | 'unlimited';
  targetMin: number;
  targetMax: number | 'unlimited';
}

export interface CascadeOptions {
  onDelete: 'cascade' | 'set_null' | 'restrict' | 'no_action';
  onUpdate: 'cascade' | 'set_null' | 'restrict' | 'no_action';
  onCreate?: 'cascade' | 'manual';
}

export interface RelationshipConstraint {
  id: string;
  type: 'foreign_key' | 'unique' | 'check' | 'custom';
  name: string;
  description?: string;
  expression?: string;
  isActive: boolean;
  errorMessage?: string;
}

export interface EntityDependency {
  entityCode: string;
  dependsOn: string[];
  dependents: string[];
  level: number;
  circularDependencies: string[][];
}

export interface RelationshipGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
  clusters: EntityCluster[];
  metrics: GraphMetrics;
}

export interface GraphNode {
  id: string;
  entityCode: string;
  entityName: string;
  type: 'entity' | 'view' | 'aggregate';
  position?: { x: number; y: number };
  size?: { width: number; height: number };
  color?: string;
  metadata: Record<string, any>;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  relationshipId: string;
  type: RelationshipType;
  label?: string;
  weight: number;
  style?: {
    color?: string;
    width?: number;
    dashArray?: string;
  };
  metadata: Record<string, any>;
}

export interface EntityCluster {
  id: string;
  name: string;
  description?: string;
  entities: string[];
  type: 'domain' | 'module' | 'layer' | 'custom';
  color?: string;
  position?: { x: number; y: number };
  size?: { width: number; height: number };
}

export interface GraphMetrics {
  totalNodes: number;
  totalEdges: number;
  density: number;
  averageDegree: number;
  maxDegree: number;
  connectedComponents: number;
  diameter: number;
  clustering: number;
  centralityScores: Record<string, number>;
}

export interface RelationshipValidationResult {
  isValid: boolean;
  errors: RelationshipValidationError[];
  warnings: RelationshipValidationWarning[];
  suggestions: RelationshipSuggestion[];
}

export interface RelationshipValidationError {
  type: 'circular_dependency' | 'invalid_cardinality' | 'missing_field' | 'type_mismatch' | 'constraint_violation';
  message: string;
  relationshipId?: string;
  entityCode?: string;
  fieldCode?: string;
  severity: 'error' | 'warning';
}

export interface RelationshipValidationWarning {
  type: 'performance' | 'design' | 'maintenance';
  message: string;
  relationshipId?: string;
  impact: 'low' | 'medium' | 'high';
  recommendation: string;
}

export interface RelationshipSuggestion {
  type: 'optimization' | 'normalization' | 'denormalization' | 'indexing';
  description: string;
  benefit: string;
  effort: 'low' | 'medium' | 'high';
  priority: 'low' | 'medium' | 'high';
  affectedEntities: string[];
  affectedRelationships: string[];
}

export interface RelationshipQuery {
  sourceEntity?: string;
  targetEntity?: string;
  type?: RelationshipType;
  includeVirtual?: boolean;
  depth?: number;
  direction?: 'incoming' | 'outgoing' | 'both';
}

export interface RelationshipPath {
  entities: string[];
  relationships: string[];
  length: number;
  weight: number;
  type: 'direct' | 'indirect';
}

export interface RelationshipImpactAnalysis {
  relationshipId: string;
  affectedEntities: {
    entityCode: string;
    impactType: 'direct' | 'indirect';
    operations: ('create' | 'read' | 'update' | 'delete')[];
    estimatedRecords: number;
  }[];
  cascadeEffects: {
    operation: 'delete' | 'update';
    affectedRelationships: string[];
    estimatedImpact: number;
  }[];
  performanceImpact: {
    queryComplexity: number;
    indexRequirements: string[];
    joinCost: number;
  };
  recommendations: string[];
}

export interface RelationshipMigration {
  id: string;
  name: string;
  description?: string;
  type: 'create' | 'update' | 'delete' | 'restructure';
  operations: RelationshipMigrationOperation[];
  dependencies: string[];
  rollbackOperations: RelationshipMigrationOperation[];
  estimatedDuration: number;
  riskLevel: 'low' | 'medium' | 'high';
  status: 'pending' | 'running' | 'completed' | 'failed' | 'rolled_back';
  createdAt: Date;
  executedAt?: Date;
  completedAt?: Date;
}

export interface RelationshipMigrationOperation {
  type: 'add_relationship' | 'remove_relationship' | 'modify_relationship' | 'add_constraint' | 'remove_constraint';
  relationshipId?: string;
  data: Record<string, any>;
  order: number;
}

@Injectable()
export class EntityRelationshipService {
  private relationships = new Map<string, EntityRelationship>();
  private relationshipCache = new Map<string, any>();
  private graphCache: RelationshipGraph | null = null;
  private lastGraphUpdate = 0;

  /**
   * 创建实体关系
   */
  async createRelationship(
    data: Omit<EntityRelationship, 'id' | 'createdAt' | 'updatedAt'>,
    createdBy: string
  ): Promise<EntityRelationship> {
    // 验证关系定义
    const validationResult = await this.validateRelationshipDefinition(data);
    if (!validationResult.isValid) {
      throw new Error(`关系定义无效: ${validationResult.errors.map(e => e.message).join(', ')}`);
    }

    const relationship: EntityRelationship = {
      id: this.generateId('rel'),
      ...data,
      createdBy,
      createdAt: new Date(),
    };

    this.relationships.set(relationship.id, relationship);
    this.invalidateCache();

    return relationship;
  }

  /**
   * 更新实体关系
   */
  async updateRelationship(
    relationshipId: string,
    data: Partial<Omit<EntityRelationship, 'id' | 'createdAt' | 'createdBy'>>,
    updatedBy: string
  ): Promise<EntityRelationship> {
    const relationship = this.relationships.get(relationshipId);
    if (!relationship) {
      throw new Error(`关系 ${relationshipId} 不存在`);
    }

    const updatedRelationship: EntityRelationship = {
      ...relationship,
      ...data,
      updatedBy,
      updatedAt: new Date(),
    };

    // 验证更新后的关系定义
    const validationResult = await this.validateRelationshipDefinition(updatedRelationship);
    if (!validationResult.isValid) {
      throw new Error(`关系定义无效: ${validationResult.errors.map(e => e.message).join(', ')}`);
    }

    this.relationships.set(relationshipId, updatedRelationship);
    this.invalidateCache();

    return updatedRelationship;
  }

  /**
   * 删除实体关系
   */
  async deleteRelationship(relationshipId: string): Promise<boolean> {
    const relationship = this.relationships.get(relationshipId);
    if (!relationship) {
      return false;
    }

    // 分析删除影响
    const impactAnalysis = await this.analyzeRelationshipImpact(relationshipId);
    if (impactAnalysis.cascadeEffects.length > 0) {
      console.warn(`删除关系 ${relationshipId} 将产生级联影响:`, impactAnalysis.cascadeEffects);
    }

    this.relationships.delete(relationshipId);
    this.invalidateCache();

    return true;
  }

  /**
   * 获取实体关系
   */
  getRelationship(relationshipId: string): EntityRelationship | null {
    return this.relationships.get(relationshipId) || null;
  }

  /**
   * 查询实体关系
   */
  queryRelationships(query: RelationshipQuery): EntityRelationship[] {
    let relationships = Array.from(this.relationships.values());

    if (query.sourceEntity) {
      relationships = relationships.filter(rel => rel.sourceEntityCode === query.sourceEntity);
    }

    if (query.targetEntity) {
      relationships = relationships.filter(rel => rel.targetEntityCode === query.targetEntity);
    }

    if (query.type) {
      relationships = relationships.filter(rel => rel.type === query.type);
    }

    if (query.includeVirtual === false) {
      relationships = relationships.filter(rel => !rel.isVirtual);
    }

    return relationships;
  }

  /**
   * 获取实体的所有关系
   */
  getEntityRelationships(
    entityCode: string,
    direction: 'incoming' | 'outgoing' | 'both' = 'both'
  ): EntityRelationship[] {
    const relationships = Array.from(this.relationships.values());
    
    switch (direction) {
      case 'incoming':
        return relationships.filter(rel => rel.targetEntityCode === entityCode);
      case 'outgoing':
        return relationships.filter(rel => rel.sourceEntityCode === entityCode);
      case 'both':
      default:
        return relationships.filter(rel => 
          rel.sourceEntityCode === entityCode || rel.targetEntityCode === entityCode
        );
    }
  }

  /**
   * 查找实体间的路径
   */
  findRelationshipPath(
    sourceEntity: string,
    targetEntity: string,
    maxDepth: number = 5
  ): RelationshipPath[] {
    const paths: RelationshipPath[] = [];
    const visited = new Set<string>();
    
    const findPaths = (
      current: string,
      target: string,
      currentPath: string[],
      currentRelationships: string[],
      depth: number
    ) => {
      if (depth > maxDepth) return;
      if (visited.has(current)) return;
      
      visited.add(current);
      
      if (current === target && currentPath.length > 1) {
        paths.push({
          entities: [...currentPath],
          relationships: [...currentRelationships],
          length: currentPath.length - 1,
          weight: this.calculatePathWeight(currentRelationships),
          type: currentPath.length === 2 ? 'direct' : 'indirect',
        });
        visited.delete(current);
        return;
      }
      
      const outgoingRels = this.getEntityRelationships(current, 'outgoing');
      for (const rel of outgoingRels) {
        if (!visited.has(rel.targetEntityCode)) {
          findPaths(
            rel.targetEntityCode,
            target,
            [...currentPath, rel.targetEntityCode],
            [...currentRelationships, rel.id],
            depth + 1
          );
        }
      }
      
      visited.delete(current);
    };
    
    findPaths(sourceEntity, targetEntity, [sourceEntity], [], 0);
    
    // 按路径长度和权重排序
    return paths.sort((a, b) => {
      if (a.length !== b.length) {
        return a.length - b.length;
      }
      return a.weight - b.weight;
    });
  }

  /**
   * 分析实体依赖关系
   */
  analyzeEntityDependencies(): Map<string, EntityDependency> {
    const dependencies = new Map<string, EntityDependency>();
    const allEntities = this.getAllEntities();
    
    // 初始化依赖信息
    for (const entity of allEntities) {
      dependencies.set(entity, {
        entityCode: entity,
        dependsOn: [],
        dependents: [],
        level: 0,
        circularDependencies: [],
      });
    }
    
    // 构建依赖关系
    for (const relationship of this.relationships.values()) {
      const source = dependencies.get(relationship.sourceEntityCode);
      const target = dependencies.get(relationship.targetEntityCode);
      
      if (source && target) {
        // 根据关系类型确定依赖方向
        if (this.isDependencyRelationship(relationship)) {
          source.dependsOn.push(relationship.targetEntityCode);
          target.dependents.push(relationship.sourceEntityCode);
        }
      }
    }
    
    // 计算依赖层级
    this.calculateDependencyLevels(dependencies);
    
    // 检测循环依赖
    this.detectCircularDependencies(dependencies);
    
    return dependencies;
  }

  /**
   * 生成关系图谱
   */
  generateRelationshipGraph(options: {
    includeVirtual?: boolean;
    entityFilter?: string[];
    relationshipTypes?: RelationshipType[];
    layout?: 'force' | 'hierarchical' | 'circular';
  } = {}): RelationshipGraph {
    const cacheKey = JSON.stringify(options);
    const cached = this.relationshipCache.get(cacheKey);
    
    if (cached && Date.now() - this.lastGraphUpdate < 60000) { // 1分钟缓存
      return cached;
    }
    
    const nodes: GraphNode[] = [];
    const edges: GraphEdge[] = [];
    const entitySet = new Set<string>();
    
    // 过滤关系
    let relationships = Array.from(this.relationships.values());
    
    if (options.includeVirtual === false) {
      relationships = relationships.filter(rel => !rel.isVirtual);
    }
    
    if (options.relationshipTypes) {
      relationships = relationships.filter(rel => options.relationshipTypes!.includes(rel.type));
    }
    
    if (options.entityFilter) {
      relationships = relationships.filter(rel => 
        options.entityFilter!.includes(rel.sourceEntityCode) ||
        options.entityFilter!.includes(rel.targetEntityCode)
      );
    }
    
    // 收集实体
    for (const rel of relationships) {
      entitySet.add(rel.sourceEntityCode);
      entitySet.add(rel.targetEntityCode);
    }
    
    // 创建节点
    for (const entityCode of entitySet) {
      nodes.push({
        id: entityCode,
        entityCode,
        entityName: this.getEntityDisplayName(entityCode),
        type: 'entity',
        metadata: {},
      });
    }
    
    // 创建边
    for (const rel of relationships) {
      edges.push({
        id: rel.id,
        source: rel.sourceEntityCode,
        target: rel.targetEntityCode,
        relationshipId: rel.id,
        type: rel.type,
        label: rel.name,
        weight: this.calculateRelationshipWeight(rel),
        metadata: { relationship: rel },
      });
    }
    
    // 生成集群
    const clusters = this.generateEntityClusters(nodes, edges);
    
    // 计算图谱指标
    const metrics = this.calculateGraphMetrics(nodes, edges);
    
    // 应用布局
    if (options.layout) {
      this.applyGraphLayout(nodes, edges, options.layout);
    }
    
    const graph: RelationshipGraph = {
      nodes,
      edges,
      clusters,
      metrics,
    };
    
    this.relationshipCache.set(cacheKey, graph);
    this.lastGraphUpdate = Date.now();
    
    return graph;
  }

  /**
   * 验证关系定义
   */
  async validateRelationshipDefinition(
    relationship: Omit<EntityRelationship, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<RelationshipValidationResult> {
    const errors: RelationshipValidationError[] = [];
    const warnings: RelationshipValidationWarning[] = [];
    const suggestions: RelationshipSuggestion[] = [];
    
    // 检查实体是否存在
    if (!this.entityExists(relationship.sourceEntityCode)) {
      errors.push({
        type: 'missing_field',
        message: `源实体 ${relationship.sourceEntityCode} 不存在`,
        entityCode: relationship.sourceEntityCode,
        severity: 'error',
      });
    }
    
    if (!this.entityExists(relationship.targetEntityCode)) {
      errors.push({
        type: 'missing_field',
        message: `目标实体 ${relationship.targetEntityCode} 不存在`,
        entityCode: relationship.targetEntityCode,
        severity: 'error',
      });
    }
    
    // 检查字段是否存在
    if (relationship.sourceField && !this.fieldExists(relationship.sourceEntityCode, relationship.sourceField)) {
      errors.push({
        type: 'missing_field',
        message: `源实体字段 ${relationship.sourceField} 不存在`,
        entityCode: relationship.sourceEntityCode,
        fieldCode: relationship.sourceField,
        severity: 'error',
      });
    }
    
    if (relationship.targetField && !this.fieldExists(relationship.targetEntityCode, relationship.targetField)) {
      errors.push({
        type: 'missing_field',
        message: `目标实体字段 ${relationship.targetField} 不存在`,
        entityCode: relationship.targetEntityCode,
        fieldCode: relationship.targetField,
        severity: 'error',
      });
    }
    
    // 检查字段类型匹配
    if (relationship.sourceField && relationship.targetField) {
      const sourceFieldType = this.getFieldType(relationship.sourceEntityCode, relationship.sourceField);
      const targetFieldType = this.getFieldType(relationship.targetEntityCode, relationship.targetField);
      
      if (sourceFieldType && targetFieldType && !this.areTypesCompatible(sourceFieldType, targetFieldType)) {
        errors.push({
          type: 'type_mismatch',
          message: `字段类型不匹配: ${sourceFieldType} vs ${targetFieldType}`,
          severity: 'error',
        });
      }
    }
    
    // 检查基数约束
    if (!this.isValidCardinality(relationship.cardinality)) {
      errors.push({
        type: 'invalid_cardinality',
        message: '基数约束无效',
        severity: 'error',
      });
    }
    
    // 检查循环依赖
    const tempRelationship: EntityRelationship = {
      id: 'temp',
      ...relationship,
      createdBy: 'system',
      createdAt: new Date(),
    };
    
    if (this.wouldCreateCircularDependency(tempRelationship)) {
      errors.push({
        type: 'circular_dependency',
        message: '会创建循环依赖',
        severity: 'error',
      });
    }
    
    // 性能警告
    if (relationship.type === 'many_to_many' && !relationship.isVirtual) {
      warnings.push({
        type: 'performance',
        message: '多对多关系可能影响查询性能',
        impact: 'medium',
        recommendation: '考虑添加中间表或使用虚拟关系',
      });
    }
    
    // 设计建议
    if (relationship.cascadeOptions.onDelete === 'cascade') {
      suggestions.push({
        type: 'optimization',
        description: '级联删除可能影响数据完整性',
        benefit: '提高数据安全性',
        effort: 'low',
        priority: 'medium',
        affectedEntities: [relationship.sourceEntityCode, relationship.targetEntityCode],
        affectedRelationships: [],
      });
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      suggestions,
    };
  }

  /**
   * 分析关系影响
   */
  async analyzeRelationshipImpact(relationshipId: string): Promise<RelationshipImpactAnalysis> {
    const relationship = this.relationships.get(relationshipId);
    if (!relationship) {
      throw new Error(`关系 ${relationshipId} 不存在`);
    }
    
    const affectedEntities = [
      {
        entityCode: relationship.sourceEntityCode,
        impactType: 'direct' as 'direct' | 'indirect',
        operations: ['create', 'read', 'update', 'delete'] as ('create' | 'read' | 'update' | 'delete')[],
        estimatedRecords: this.getEntityRecordCount(relationship.sourceEntityCode),
      },
      {
        entityCode: relationship.targetEntityCode,
        impactType: 'direct' as 'direct' | 'indirect',
        operations: ['create', 'read', 'update', 'delete'] as ('create' | 'read' | 'update' | 'delete')[],
        estimatedRecords: this.getEntityRecordCount(relationship.targetEntityCode),
      },
    ];
    
    // 分析间接影响
    const indirectlyAffected = this.findIndirectlyAffectedEntities(relationship);
    for (const entity of indirectlyAffected) {
      affectedEntities.push({
        entityCode: entity,
        impactType: 'indirect' as 'direct' | 'indirect',
        operations: ['read', 'update'] as ('create' | 'read' | 'update' | 'delete')[],
        estimatedRecords: this.getEntityRecordCount(entity),
      });
    }
    
    // 分析级联效果
    const cascadeEffects = [];
    if (relationship.cascadeOptions.onDelete === 'cascade') {
      cascadeEffects.push({
        operation: 'delete' as const,
        affectedRelationships: this.getRelatedRelationships(relationshipId),
        estimatedImpact: this.estimateCascadeImpact(relationship, 'delete'),
      });
    }
    
    if (relationship.cascadeOptions.onUpdate === 'cascade') {
      cascadeEffects.push({
        operation: 'update' as const,
        affectedRelationships: this.getRelatedRelationships(relationshipId),
        estimatedImpact: this.estimateCascadeImpact(relationship, 'update'),
      });
    }
    
    // 分析性能影响
    const performanceImpact = {
      queryComplexity: this.calculateQueryComplexity(relationship),
      indexRequirements: this.getIndexRequirements(relationship),
      joinCost: this.calculateJoinCost(relationship),
    };
    
    // 生成建议
    const recommendations = this.generateRelationshipRecommendations(relationship, {
      affectedEntities,
      cascadeEffects,
      performanceImpact,
    });
    
    return {
      relationshipId,
      affectedEntities,
      cascadeEffects,
      performanceImpact,
      recommendations,
    };
  }

  /**
   * 创建关系迁移
   */
  async createRelationshipMigration(
    name: string,
    operations: RelationshipMigrationOperation[],
    description?: string
  ): Promise<RelationshipMigration> {
    const migration: RelationshipMigration = {
      id: this.generateId('migration'),
      name,
      description,
      type: this.determineMigrationType(operations),
      operations: operations.sort((a, b) => a.order - b.order),
      dependencies: this.calculateMigrationDependencies(operations),
      rollbackOperations: this.generateRollbackOperations(operations),
      estimatedDuration: this.estimateMigrationDuration(operations),
      riskLevel: this.assessMigrationRisk(operations),
      status: 'pending',
      createdAt: new Date(),
    };
    
    return migration;
  }

  /**
   * 执行关系迁移
   */
  async executeMigration(migrationId: string): Promise<void> {
    // 这里应该实现实际的迁移执行逻辑
    console.log(`执行关系迁移: ${migrationId}`);
  }

  /**
   * 获取关系统计信息
   */
  getRelationshipStatistics(): {
    totalRelationships: number;
    relationshipsByType: Record<RelationshipType, number>;
    virtualRelationships: number;
    entitiesWithMostRelationships: { entityCode: string; count: number }[];
    complexityScore: number;
  } {
    const relationships = Array.from(this.relationships.values());
    const relationshipsByType = {} as Record<RelationshipType, number>;
    const entityRelationshipCount = new Map<string, number>();
    
    // 统计关系类型
    for (const rel of relationships) {
      relationshipsByType[rel.type] = (relationshipsByType[rel.type] || 0) + 1;
      
      // 统计实体关系数量
      entityRelationshipCount.set(
        rel.sourceEntityCode,
        (entityRelationshipCount.get(rel.sourceEntityCode) || 0) + 1
      );
      entityRelationshipCount.set(
        rel.targetEntityCode,
        (entityRelationshipCount.get(rel.targetEntityCode) || 0) + 1
      );
    }
    
    // 找出关系最多的实体
    const entitiesWithMostRelationships = Array.from(entityRelationshipCount.entries())
      .map(([entityCode, count]) => ({ entityCode, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
    
    // 计算复杂度分数
    const complexityScore = this.calculateRelationshipComplexity();
    
    return {
      totalRelationships: relationships.length,
      relationshipsByType,
      virtualRelationships: relationships.filter(rel => rel.isVirtual).length,
      entitiesWithMostRelationships,
      complexityScore,
    };
  }

  // 私有辅助方法

  private getAllEntities(): string[] {
    const entities = new Set<string>();
    for (const rel of this.relationships.values()) {
      entities.add(rel.sourceEntityCode);
      entities.add(rel.targetEntityCode);
    }
    return Array.from(entities);
  }

  private isDependencyRelationship(relationship: EntityRelationship): boolean {
    return ['one_to_many', 'many_to_one', 'composition', 'dependency'].includes(relationship.type);
  }

  private calculateDependencyLevels(dependencies: Map<string, EntityDependency>): void {
    const visited = new Set<string>();
    const calculating = new Set<string>();
    
    const calculateLevel = (entityCode: string): number => {
      if (visited.has(entityCode)) {
        return dependencies.get(entityCode)?.level || 0;
      }
      
      if (calculating.has(entityCode)) {
        return 0; // 循环依赖
      }
      
      calculating.add(entityCode);
      
      const dependency = dependencies.get(entityCode);
      if (!dependency) return 0;
      
      let maxLevel = 0;
      for (const dep of dependency.dependsOn) {
        const depLevel = calculateLevel(dep);
        maxLevel = Math.max(maxLevel, depLevel + 1);
      }
      
      dependency.level = maxLevel;
      calculating.delete(entityCode);
      visited.add(entityCode);
      
      return maxLevel;
    };
    
    for (const entityCode of dependencies.keys()) {
      calculateLevel(entityCode);
    }
  }

  private detectCircularDependencies(dependencies: Map<string, EntityDependency>): void {
    for (const [entityCode, dependency] of dependencies) {
      const visited = new Set<string>();
      const path: string[] = [];
      
      const findCircular = (current: string): boolean => {
        if (path.includes(current)) {
          const circularStart = path.indexOf(current);
          dependency.circularDependencies.push(path.slice(circularStart).concat(current));
          return true;
        }
        
        if (visited.has(current)) return false;
        
        visited.add(current);
        path.push(current);
        
        const currentDep = dependencies.get(current);
        if (currentDep) {
          for (const dep of currentDep.dependsOn) {
            if (findCircular(dep)) {
              return true;
            }
          }
        }
        
        path.pop();
        return false;
      };
      
      findCircular(entityCode);
    }
  }

  private calculatePathWeight(relationshipIds: string[]): number {
    let weight = 0;
    for (const relId of relationshipIds) {
      const rel = this.relationships.get(relId);
      if (rel) {
        weight += this.calculateRelationshipWeight(rel);
      }
    }
    return weight;
  }

  private calculateRelationshipWeight(relationship: EntityRelationship): number {
    let weight = 1;
    
    // 根据关系类型调整权重
    switch (relationship.type) {
      case 'one_to_one':
        weight = 1;
        break;
      case 'one_to_many':
      case 'many_to_one':
        weight = 2;
        break;
      case 'many_to_many':
        weight = 3;
        break;
      case 'inheritance':
        weight = 0.5;
        break;
      default:
        weight = 1;
    }
    
    // 虚拟关系权重较低
    if (relationship.isVirtual) {
      weight *= 0.5;
    }
    
    return weight;
  }

  private generateEntityClusters(nodes: GraphNode[], edges: GraphEdge[]): EntityCluster[] {
    // 这里可以实现聚类算法，例如基于连通性或领域划分
    // 简化实现：按实体名称前缀分组
    const clusters = new Map<string, string[]>();
    
    for (const node of nodes) {
      const prefix = node.entityCode.split('_')[0] || 'default';
      if (!clusters.has(prefix)) {
        clusters.set(prefix, []);
      }
      clusters.get(prefix)!.push(node.entityCode);
    }
    
    return Array.from(clusters.entries()).map(([prefix, entities], index) => ({
      id: `cluster_${index}`,
      name: `${prefix} 模块`,
      entities,
      type: 'module' as const,
    }));
  }

  private calculateGraphMetrics(nodes: GraphNode[], edges: GraphEdge[]): GraphMetrics {
    const nodeCount = nodes.length;
    const edgeCount = edges.length;
    
    // 计算密度
    const maxEdges = nodeCount * (nodeCount - 1) / 2;
    const density = maxEdges > 0 ? edgeCount / maxEdges : 0;
    
    // 计算度数
    const degrees = new Map<string, number>();
    for (const edge of edges) {
      degrees.set(edge.source, (degrees.get(edge.source) || 0) + 1);
      degrees.set(edge.target, (degrees.get(edge.target) || 0) + 1);
    }
    
    const degreeValues = Array.from(degrees.values());
    const averageDegree = degreeValues.length > 0 ? 
      degreeValues.reduce((sum, degree) => sum + degree, 0) / degreeValues.length : 0;
    const maxDegree = degreeValues.length > 0 ? Math.max(...degreeValues) : 0;
    
    // 计算中心性分数（简化版）
    const centralityScores: Record<string, number> = {};
    for (const node of nodes) {
      centralityScores[node.id] = degrees.get(node.id) || 0;
    }
    
    return {
      totalNodes: nodeCount,
      totalEdges: edgeCount,
      density,
      averageDegree,
      maxDegree,
      connectedComponents: 1, // 简化实现
      diameter: 0, // 简化实现
      clustering: 0, // 简化实现
      centralityScores,
    };
  }

  private applyGraphLayout(nodes: GraphNode[], edges: GraphEdge[], layout: string): void {
    // 这里可以实现不同的布局算法
    // 简化实现：随机布局
    for (let i = 0; i < nodes.length; i++) {
      nodes[i].position = {
        x: Math.random() * 800,
        y: Math.random() * 600,
      };
    }
  }

  private getEntityDisplayName(entityCode: string): string {
    // 这里应该从实体定义中获取显示名称
    return entityCode.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }

  private entityExists(entityCode: string): boolean {
    // 这里应该检查实体是否真实存在
    return true; // 简化实现
  }

  private fieldExists(entityCode: string, fieldCode: string): boolean {
    // 这里应该检查字段是否真实存在
    return true; // 简化实现
  }

  private getFieldType(entityCode: string, fieldCode: string): FieldDataType | null {
    // 这里应该获取字段的实际类型
    return FieldDataType.TEXT; // 简化实现
  }

  private areTypesCompatible(type1: FieldDataType, type2: FieldDataType): boolean {
    // 检查类型兼容性
    if (type1 === type2) return true;
    
    // 数值类型之间的兼容性
    const numericTypes = [FieldDataType.INTEGER, FieldDataType.DECIMAL];
    if (numericTypes.includes(type1) && numericTypes.includes(type2)) {
      return true;
    }
    
    return false;
  }

  private isValidCardinality(cardinality: RelationshipCardinality): boolean {
    return cardinality.sourceMin >= 0 && 
           cardinality.targetMin >= 0 && 
           (cardinality.sourceMax === 'unlimited' || cardinality.sourceMax >= cardinality.sourceMin) &&
           (cardinality.targetMax === 'unlimited' || cardinality.targetMax >= cardinality.targetMin);
  }

  private wouldCreateCircularDependency(relationship: EntityRelationship): boolean {
    // 简化实现：检查是否会创建直接循环
    return relationship.sourceEntityCode === relationship.targetEntityCode;
  }

  private getEntityRecordCount(entityCode: string): number {
    // 这里应该获取实际的记录数量
    return Math.floor(Math.random() * 10000); // 简化实现
  }

  private findIndirectlyAffectedEntities(relationship: EntityRelationship): string[] {
    // 查找间接受影响的实体
    const affected = new Set<string>();
    const queue = [relationship.sourceEntityCode, relationship.targetEntityCode];
    const visited = new Set<string>();
    
    while (queue.length > 0) {
      const current = queue.shift()!;
      if (visited.has(current)) continue;
      
      visited.add(current);
      const relatedRels = this.getEntityRelationships(current);
      
      for (const rel of relatedRels) {
        const other = rel.sourceEntityCode === current ? rel.targetEntityCode : rel.sourceEntityCode;
        if (!visited.has(other)) {
          affected.add(other);
          queue.push(other);
        }
      }
    }
    
    return Array.from(affected);
  }

  private getRelatedRelationships(relationshipId: string): string[] {
    const relationship = this.relationships.get(relationshipId);
    if (!relationship) return [];
    
    return Array.from(this.relationships.values())
      .filter(rel => 
        rel.id !== relationshipId && (
          rel.sourceEntityCode === relationship.sourceEntityCode ||
          rel.targetEntityCode === relationship.targetEntityCode ||
          rel.sourceEntityCode === relationship.targetEntityCode ||
          rel.targetEntityCode === relationship.sourceEntityCode
        )
      )
      .map(rel => rel.id);
  }

  private estimateCascadeImpact(relationship: EntityRelationship, operation: 'delete' | 'update'): number {
    // 估算级联影响的记录数
    const sourceCount = this.getEntityRecordCount(relationship.sourceEntityCode);
    const targetCount = this.getEntityRecordCount(relationship.targetEntityCode);
    
    switch (relationship.type) {
      case 'one_to_many':
        return operation === 'delete' ? targetCount * 0.1 : targetCount * 0.05;
      case 'many_to_one':
        return operation === 'delete' ? sourceCount * 0.1 : sourceCount * 0.05;
      case 'many_to_many':
        return operation === 'delete' ? (sourceCount + targetCount) * 0.05 : (sourceCount + targetCount) * 0.02;
      default:
        return 0;
    }
  }

  private calculateQueryComplexity(relationship: EntityRelationship): number {
    let complexity = 1;
    
    switch (relationship.type) {
      case 'one_to_one':
        complexity = 1;
        break;
      case 'one_to_many':
      case 'many_to_one':
        complexity = 2;
        break;
      case 'many_to_many':
        complexity = 3;
        break;
      default:
        complexity = 1;
    }
    
    // 约束增加复杂度
    complexity += relationship.constraints.length * 0.5;
    
    return complexity;
  }

  private getIndexRequirements(relationship: EntityRelationship): string[] {
    const requirements = [];
    
    if (relationship.sourceField) {
      requirements.push(`${relationship.sourceEntityCode}.${relationship.sourceField}`);
    }
    
    if (relationship.targetField) {
      requirements.push(`${relationship.targetEntityCode}.${relationship.targetField}`);
    }
    
    return requirements;
  }

  private calculateJoinCost(relationship: EntityRelationship): number {
    const sourceCount = this.getEntityRecordCount(relationship.sourceEntityCode);
    const targetCount = this.getEntityRecordCount(relationship.targetEntityCode);
    
    // 简化的连接成本计算
    return Math.log(sourceCount * targetCount);
  }

  private generateRelationshipRecommendations(
    relationship: EntityRelationship,
    analysis: any
  ): string[] {
    const recommendations = [];
    
    if (analysis.performanceImpact.queryComplexity > 3) {
      recommendations.push('考虑添加索引以提高查询性能');
    }
    
    if (relationship.type === 'many_to_many' && !relationship.isVirtual) {
      recommendations.push('考虑使用中间表优化多对多关系');
    }
    
    if (analysis.cascadeEffects.length > 0) {
      recommendations.push('评估级联操作的影响，考虑添加软删除');
    }
    
    return recommendations;
  }

  private determineMigrationType(operations: RelationshipMigrationOperation[]): RelationshipMigration['type'] {
    const types = operations.map(op => op.type);
    
    if (types.includes('add_relationship')) return 'create';
    if (types.includes('remove_relationship')) return 'delete';
    if (types.includes('modify_relationship')) return 'update';
    
    return 'restructure';
  }

  private calculateMigrationDependencies(operations: RelationshipMigrationOperation[]): string[] {
    // 计算迁移依赖
    return [];
  }

  private generateRollbackOperations(operations: RelationshipMigrationOperation[]): RelationshipMigrationOperation[] {
    // 生成回滚操作
    return operations.map((op, index) => ({
      ...op,
      type: this.getRollbackOperationType(op.type),
      order: operations.length - index,
    }));
  }

  private getRollbackOperationType(type: RelationshipMigrationOperation['type']): RelationshipMigrationOperation['type'] {
    switch (type) {
      case 'add_relationship': return 'remove_relationship';
      case 'remove_relationship': return 'add_relationship';
      case 'add_constraint': return 'remove_constraint';
      case 'remove_constraint': return 'add_constraint';
      default: return type;
    }
  }

  private estimateMigrationDuration(operations: RelationshipMigrationOperation[]): number {
    // 估算迁移时间（分钟）
    return operations.length * 5;
  }

  private assessMigrationRisk(operations: RelationshipMigrationOperation[]): 'low' | 'medium' | 'high' {
    const riskFactors = operations.filter(op => 
      op.type === 'remove_relationship' || op.type === 'modify_relationship'
    ).length;
    
    if (riskFactors === 0) return 'low';
    if (riskFactors <= 2) return 'medium';
    return 'high';
  }

  private calculateRelationshipComplexity(): number {
    const relationships = Array.from(this.relationships.values());
    let complexity = 0;
    
    for (const rel of relationships) {
      complexity += this.calculateRelationshipWeight(rel);
      complexity += rel.constraints.length * 0.5;
    }
    
    return complexity;
  }

  private invalidateCache(): void {
    this.relationshipCache.clear();
    this.graphCache = null;
  }

  private generateId(prefix: string): string {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}