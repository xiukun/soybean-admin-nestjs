import { Project } from './project.model';

export interface ProjectRepository {
  // 基本操作
  save(project: Project): Promise<Project>;
  findById(id: string): Promise<Project | null>;
  findByCode(code: string): Promise<Project | null>;
  findAll(): Promise<Project[]>;
  update(project: Project): Promise<Project>;
  delete(id: string): Promise<void>;
  
  // 验证操作
  existsByCode(code: string, excludeId?: string): Promise<boolean>;
  
  // 分页查询
  findPaginated(
    page: number,
    limit: number,
    filters?: any
  ): Promise<{
    projects: Project[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }>;
  
  // 统计操作
  countByStatus(status: string): Promise<number>;
  countTotal(): Promise<number>;
}
