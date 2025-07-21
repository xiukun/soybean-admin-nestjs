import { CodeTemplate } from './code-template.model';

/**
 * 模板仓库接口
 * Template Repository Interface
 */
export interface TemplateRepository {
  /**
   * 根据ID查找模板
   * Find template by ID
   */
  findById(id: string): Promise<CodeTemplate | null>;

  /**
   * 根据类型查找模板
   * Find templates by type
   */
  findByType(type: string): Promise<CodeTemplate[]>;

  /**
   * 根据名称查找模板
   * Find template by name
   */
  findByName(name: string): Promise<CodeTemplate | null>;

  /**
   * 获取所有模板
   * Get all templates
   */
  findAll(): Promise<CodeTemplate[]>;

  /**
   * 保存模板
   * Save template
   */
  save(template: CodeTemplate): Promise<CodeTemplate>;

  /**
   * 删除模板
   * Delete template
   */
  delete(id: string): Promise<void>;

  /**
   * 检查模板是否存在
   * Check if template exists
   */
  exists(id: string): Promise<boolean>;

  /**
   * 根据条件查找模板
   * Find templates by criteria
   */
  findByCriteria(criteria: {
    type?: string;
    category?: string;
    tags?: string[];
    isActive?: boolean;
  }): Promise<CodeTemplate[]>;

  /**
   * 根据项目ID和名称查找模板
   * Find template by project ID and name
   */
  findByProjectAndName(projectId: string, name: string): Promise<CodeTemplate | null>;
}
