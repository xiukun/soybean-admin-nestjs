import { Field } from './field.model';

export interface FieldRepository {
  // 基本CRUD操作
  save(field: Field): Promise<Field>;
  findById(id: string): Promise<Field | null>;
  update(field: Field): Promise<Field>;
  delete(id: string): Promise<void>;

  // 查询操作
  findByEntityId(entityId: string): Promise<Field[]>;
  findByCode(entityId: string, code: string): Promise<Field | null>;
  findByDisplayOrder(entityId: string, displayOrder: number): Promise<Field | null>;

  // 分页查询
  findPaginated(
    entityId: string,
    page: number,
    limit: number,
    filters?: any
  ): Promise<{
    fields: Field[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }>;

  // 检查操作
  existsByCode(entityId: string, code: string, excludeId?: string): Promise<boolean>;
  existsByDisplayOrder(entityId: string, displayOrder: number, excludeId?: string): Promise<boolean>;

  // 排序操作
  findMaxDisplayOrder(entityId: string): Promise<number>;
  updateDisplayOrders(entityId: string, updates: { id: string; displayOrder: number }[]): Promise<void>;

  // 统计操作
  countByEntityId(entityId: string): Promise<number>;
  countByDataType(entityId: string, dataType: string): Promise<number>;
  countRequired(entityId: string): Promise<number>;
  countUnique(entityId: string): Promise<number>;

  // 批量操作
  findByIds(ids: string[]): Promise<Field[]>;
  deleteByEntityId(entityId: string): Promise<void>;
}
