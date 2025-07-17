import { Relationship } from './relationship.model';

export interface RelationshipRepository {
  // 基本CRUD操作
  save(relationship: Relationship): Promise<Relationship>;
  findById(id: string): Promise<Relationship | null>;
  update(relationship: Relationship): Promise<Relationship>;
  delete(id: string): Promise<void>;

  // 查询操作
  findByProjectId(projectId: string): Promise<Relationship[]>;
  findByCode(projectId: string, code: string): Promise<Relationship | null>;
  findBySourceEntityId(sourceEntityId: string): Promise<Relationship[]>;
  findByTargetEntityId(targetEntityId: string): Promise<Relationship[]>;
  findByEntityId(entityId: string): Promise<Relationship[]>; // 查找涉及某个实体的所有关系

  // 分页查询
  findPaginated(
    projectId: string,
    page: number,
    limit: number,
    filters?: any
  ): Promise<{
    relationships: Relationship[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }>;

  // 检查操作
  existsByCode(projectId: string, code: string, excludeId?: string): Promise<boolean>;
  existsBetweenEntities(
    sourceEntityId: string,
    targetEntityId: string,
    excludeId?: string
  ): Promise<boolean>;

  // 统计操作
  countByProjectId(projectId: string): Promise<number>;
  countByType(projectId: string, type: string): Promise<number>;
  countByStatus(projectId: string, status: string): Promise<number>;

  // 批量操作
  findByIds(ids: string[]): Promise<Relationship[]>;
  deleteByProjectId(projectId: string): Promise<void>;
  deleteByEntityId(entityId: string): Promise<void>;

  // 关系图相关
  findRelationshipGraph(projectId: string): Promise<{
    entities: { id: string; name: string; code: string }[];
    relationships: Relationship[];
  }>;
}
