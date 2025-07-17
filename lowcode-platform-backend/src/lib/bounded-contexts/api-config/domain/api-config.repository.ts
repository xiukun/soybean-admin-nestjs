import { ApiConfig } from './api-config.model';

export interface ApiConfigRepository {
  // 基本CRUD操作
  save(apiConfig: ApiConfig): Promise<ApiConfig>;
  findById(id: string): Promise<ApiConfig | null>;
  update(apiConfig: ApiConfig): Promise<ApiConfig>;
  delete(id: string): Promise<void>;

  // 查询操作
  findByProjectId(projectId: string): Promise<ApiConfig[]>;
  findByCode(projectId: string, code: string): Promise<ApiConfig | null>;
  findByPath(projectId: string, method: string, path: string): Promise<ApiConfig | null>;
  findByEntityId(entityId: string): Promise<ApiConfig[]>;

  // 分页查询
  findPaginated(
    projectId: string,
    page: number,
    limit: number,
    filters?: any
  ): Promise<{
    apiConfigs: ApiConfig[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }>;

  // 检查操作
  existsByCode(projectId: string, code: string, excludeId?: string): Promise<boolean>;
  existsByPath(
    projectId: string,
    method: string,
    path: string,
    excludeId?: string
  ): Promise<boolean>;

  // 统计操作
  countByProjectId(projectId: string): Promise<number>;
  countByStatus(projectId: string, status: string): Promise<number>;
  countByMethod(projectId: string, method: string): Promise<number>;

  // 批量操作
  findByIds(ids: string[]): Promise<ApiConfig[]>;
  deleteByProjectId(projectId: string): Promise<void>;
  deleteByEntityId(entityId: string): Promise<void>;

  // 版本管理
  findVersions(projectId: string, code: string): Promise<ApiConfig[]>;
  findLatestVersion(projectId: string, code: string): Promise<ApiConfig | null>;

  // 发布管理
  findPublishedApis(projectId: string): Promise<ApiConfig[]>;
  findDraftApis(projectId: string): Promise<ApiConfig[]>;
}
