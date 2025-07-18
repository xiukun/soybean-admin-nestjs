import { Entity } from '@entity/domain/entity.model';
import { Field } from '@entity/domain/field.model';
import { Relation } from '@entity/domain/relation.model';

export interface EntityRepository {
  // 实体操作
  save(entity: Entity): Promise<Entity>;
  findById(id: string): Promise<Entity | null>;
  findByCode(projectId: string, code: string): Promise<Entity | null>;
  findByProjectId(projectId: string): Promise<Entity[]>;
  update(entity: Entity): Promise<Entity>;
  delete(id: string): Promise<void>;
  
  // 字段操作
  saveField(field: Field): Promise<Field>;
  findFieldById(id: string): Promise<Field | null>;
  findFieldsByEntityId(entityId: string): Promise<Field[]>;
  updateField(field: Field): Promise<Field>;
  deleteField(id: string): Promise<void>;
  
  // 关系操作
  saveRelation(relation: Relation): Promise<Relation>;
  findRelationById(id: string): Promise<Relation | null>;
  findRelationsByProjectId(projectId: string): Promise<Relation[]>;
  findRelationsByEntityId(entityId: string): Promise<Relation[]>;
  updateRelation(relation: Relation): Promise<Relation>;
  deleteRelation(id: string): Promise<void>;
  
  // 复合查询
  findEntityWithFields(id: string): Promise<{ entity: Entity; fields: Field[] } | null>;
  findEntityWithRelations(id: string): Promise<{ entity: Entity; relations: Relation[] } | null>;
  findProjectEntitiesWithFields(projectId: string): Promise<Array<{ entity: Entity; fields: Field[] }>>;
  
  // 验证操作
  existsByCode(projectId: string, code: string, excludeId?: string): Promise<boolean>;
  existsByTableName(projectId: string, tableName: string, excludeId?: string): Promise<boolean>;
  fieldExistsByCode(entityId: string, code: string, excludeId?: string): Promise<boolean>;
  
  // 分页查询
  findEntitiesPaginated(
    projectId: string,
    page: number,
    limit: number,
    filters?: any
  ): Promise<{
    entities: Entity[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }>;

  // 统计方法
  countTotal(projectId: string): Promise<number>;
  countByStatus(projectId: string, status: string): Promise<number>;
}
