import { Api } from '@api-context/domain/api.model';

export interface ApiRepository {
  // 基本操作
  save(api: Api): Promise<Api>;
  findById(id: string): Promise<Api | null>;
  findByCode(projectId: string, code: string): Promise<Api | null>;
  findByProjectId(projectId: string): Promise<Api[]>;
  findByEntityId(entityId: string): Promise<Api[]>;
  update(api: Api): Promise<Api>;
  delete(id: string): Promise<void>;
  
  // 验证操作
  existsByCode(projectId: string, code: string, excludeId?: string): Promise<boolean>;
  existsByPath(projectId: string, path: string, method: string, excludeId?: string): Promise<boolean>;
  
  // 分页查询
  findPaginated(
    projectId: string,
    page: number,
    limit: number,
    filters?: any
  ): Promise<{
    apis: Api[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }>;
  
  // 复合查询
  findApisByPathPattern(projectId: string, pathPattern: string): Promise<Api[]>;
  findApisByMethod(projectId: string, method: string): Promise<Api[]>;
  findPublishedApis(projectId: string): Promise<Api[]>;
  
  // 统计操作
  countByStatus(projectId: string, status: string): Promise<number>;
  countByMethod(projectId: string, method: string): Promise<number>;
}
