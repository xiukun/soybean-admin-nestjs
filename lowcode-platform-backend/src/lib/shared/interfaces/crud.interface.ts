/**
 * 标准化CRUD接口定义
 * 用于确保所有生成的API接口遵循统一的规范
 */

export interface QueryOptions {
  current?: number;  // 当前页码，从1开始
  size?: number;     // 每页大小，默认10
  sort?: string;     // 排序字段，格式：field:order，如 createdAt:desc
  search?: string;   // 搜索关键词
  [key: string]: any; // 其他过滤条件
}

export interface PaginationResult<T> {
  options: T[];      // 数据列表 (AMIS标准格式)
  total: number;     // 总数量
  page: number;      // 当前页码 (AMIS标准格式)
  perPage: number;   // 每页大小 (AMIS标准格式)
  totalPages?: number; // 总页数
}

// 兼容旧版本的接口
export interface PaginationResultLegacy<T> {
  items: T[];        // 数据列表
  total: number;     // 总数量
  current: number;   // 当前页码
  size: number;      // 每页大小
  totalPages?: number; // 总页数
}

export interface BatchCreateResult<T> {
  success: T[];      // 成功创建的项目
  failed: Array<{    // 失败的项目
    item: any;
    error: string;
  }>;
  total: number;     // 总数量
  successCount: number; // 成功数量
  failedCount: number;  // 失败数量
}

export interface BatchDeleteResult {
  deletedIds: string[];  // 成功删除的ID列表
  failedIds: Array<{     // 失败的ID列表
    id: string;
    error: string;
  }>;
  deletedCount: number;  // 删除成功数量
  failedCount: number;   // 删除失败数量
}

export interface DeleteResult {
  id: string;
  deletedAt: string;
}

/**
 * 标准化CRUD操作接口
 */
export interface ICrudService<T, CreateDto, UpdateDto> {
  /**
   * 分页查询
   */
  findMany(options?: QueryOptions): Promise<PaginationResult<T>>;

  /**
   * 根据ID查询
   */
  findById(id: string): Promise<T | null>;

  /**
   * 根据ID获取（不存在时抛出异常）
   */
  getById(id: string): Promise<T>;

  /**
   * 创建
   */
  create(data: CreateDto, createdBy?: string): Promise<T>;

  /**
   * 更新
   */
  update(id: string, data: UpdateDto, updatedBy?: string): Promise<T>;

  /**
   * 删除
   */
  delete(id: string): Promise<void>;

  /**
   * 批量创建
   */
  batchCreate(items: CreateDto[]): Promise<BatchCreateResult<T>>;

  /**
   * 批量删除
   */
  batchDelete(ids: string[]): Promise<BatchDeleteResult>;
}

/**
 * 标准化CRUD控制器接口
 */
export interface ICrudController<T, CreateDto, UpdateDto, QueryDto> {
  /**
   * 获取列表
   */
  findAll(query: QueryDto): Promise<PaginationResult<T>>;

  /**
   * 获取详情
   */
  findOne(id: string): Promise<T>;

  /**
   * 创建
   */
  create(createDto: CreateDto): Promise<T>;

  /**
   * 更新
   */
  update(id: string, updateDto: UpdateDto): Promise<T>;

  /**
   * 删除
   */
  remove(id: string): Promise<DeleteResult>;

  /**
   * 批量创建
   */
  batchCreate(createDtos: CreateDto[]): Promise<BatchCreateResult<T>>;

  /**
   * 批量删除
   */
  batchRemove(ids: string[]): Promise<BatchDeleteResult>;
}

/**
 * 关系查询选项
 */
export interface RelationQueryOptions extends QueryOptions {
  relation: string;  // 关系名称
  sourceId: string;  // 源实体ID
}

/**
 * 关系查询结果
 */
export interface RelationResult<T> extends PaginationResult<T> {
  relation: {
    type: string;        // 关系类型
    sourceEntity: string; // 源实体
    targetEntity: string; // 目标实体
    sourceField: string;  // 源字段
    targetField: string;  // 目标字段
  };
}

/**
 * 扩展的CRUD服务接口（支持关系查询）
 */
export interface IExtendedCrudService<T, CreateDto, UpdateDto> extends ICrudService<T, CreateDto, UpdateDto> {
  /**
   * 查询关联数据
   */
  findRelated(id: string, relation: string, options?: QueryOptions): Promise<PaginationResult<any>>;
}

/**
 * 扩展的CRUD控制器接口（支持关系查询）
 */
export interface IExtendedCrudController<T, CreateDto, UpdateDto, QueryDto> extends ICrudController<T, CreateDto, UpdateDto, QueryDto> {
  /**
   * 获取关联数据
   */
  getRelated(id: string, relation: string, query: QueryOptions): Promise<RelationResult<any>>;
}
