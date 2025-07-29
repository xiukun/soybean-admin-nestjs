import { lowcodeRequest as request } from '../request';

/**
 * get entity list by project
 *
 * @param params - entity search params
 */
export function fetchGetEntityList(params?: Api.Lowcode.EntitySearchParams) {
  return request<Api.Lowcode.EntityList>({
    url: `/entities/project/${params?.projectId}/paginated`,
    method: 'get',
    params: {
      current: params?.current,
      size: params?.size,
      status: params?.status,
      category: params?.category,
      search: params?.search
    }
  });
}

/**
 * get all entities by project
 *
 * @param projectId - project id
 */
export function fetchGetAllEntities(projectId: string) {
  return request<Api.Lowcode.Entity[]>({
    url: `/entities/project/${projectId}`,
    method: 'get'
  });
}

/**
 * get entity by id
 *
 * @param id - entity id
 */
export function fetchGetEntity(id: string) {
  return request<Api.Lowcode.Entity>({
    url: `/entities/${id}`,
    method: 'get'
  });
}

/**
 * get entity by code
 *
 * @param projectId - project id
 * @param code - entity code
 */
export function fetchGetEntityByCode(projectId: string, code: string) {
  return request<Api.Lowcode.Entity>({
    url: `/entities/project/${projectId}/code/${code}`,
    method: 'get'
  });
}

/**
 * add entity
 *
 * @param data - entity data
 */
export function fetchAddEntity(data: Api.Lowcode.EntityEdit) {
  return request<Api.Lowcode.Entity>({
    url: '/entities',
    method: 'post',
    data
  });
}

/**
 * update entity
 *
 * @param id - entity id
 * @param data - entity data
 */
export function fetchUpdateEntity(id: string, data: Api.Lowcode.EntityEdit) {
  return request<Api.Lowcode.Entity>({
    url: `/entities/${id}`,
    method: 'put',
    data
  });
}

/**
 * delete entity
 *
 * @param id - entity id
 */
export function fetchDeleteEntity(id: string) {
  return request({
    url: `/entities/${id}`,
    method: 'delete'
  });
}

/**
 * get entity statistics
 *
 * @param projectId - project id
 */
export function fetchGetEntityStats(projectId: string) {
  return request<Api.Lowcode.EntityStats>({
    url: `/entities/project/${projectId}/stats`,
    method: 'get'
  });
}

/**
 * publish entity
 *
 * @param id - entity id
 */
export function fetchPublishEntity(id: string) {
  return request<Api.Lowcode.Entity>({
    url: `/entities/${id}/publish`,
    method: 'post'
  });
}

/**
 * deprecate entity
 *
 * @param id - entity id
 */
export function fetchDeprecateEntity(id: string) {
  return request<Api.Lowcode.Entity>({
    url: `/entities/${id}/deprecate`,
    method: 'post'
  });
}

/**
 * generate table for entity
 *
 * @param id - entity id
 */
export function fetchGenerateEntityTable(id: string) {
  return request<{ success: boolean; message: string }>({
    url: `/entities/${id}/generate-table`,
    method: 'post'
  });
}

/**
/**
 * validate entity
 *
 * @param data - entity data
 */
export function fetchValidateEntity(data: Api.Lowcode.EntityEdit) {
  return request<{ valid: boolean; errors: string[] }>({
    url: '/entities/validate',
    method: 'post',
    data
  });
}

/**
 * 增强的创建实体接口（支持通用字段自动生成）
 *
 * @param data - 增强的实体创建数据
 */
export function fetchCreateEnhancedEntity(data: {
  name: string;
  code: string;
  description?: string;
  projectId: string;
  category?: string;
  commonFieldOptions?: {
    enabled: boolean;
    autoCreateTable: boolean;
    customConfigs?: Record<string, any>;
  };
  additionalFields?: Array<{
    name: string;
    code: string;
    description?: string;
    dataType: string;
    required?: boolean;
    unique?: boolean;
    defaultValue?: any;
  }>;
}) {
  return request<{
    entity: Api.Lowcode.Entity;
    fields: Api.Lowcode.Field[];
    errors: string[];
    warnings: string[];
    tableCreated: boolean;
  }>({
    url: '/entities/enhanced',
    method: 'post',
    data
  });
}

/**
 * 验证实体字段和约束
 *
 * @param id - 实体ID
 */
export function fetchValidateEntityFields(id: string) {
  return request<{
    errors: string[];
    warnings: string[];
    fieldValidations: Array<{
      fieldId: string;
      fieldName: string;
      errors: string[];
      warnings: string[];
    }>;
  }>({
    url: `/entities/${id}/validate`,
    method: 'get'
  });
}

/**
 * 获取通用字段定义
 */
export function fetchGetCommonFieldDefinitions() {
  return request<Array<{
    name: string;
    code: string;
    description: string;
    dataType: string;
    required: boolean;
    unique: boolean;
    defaultValue?: any;
    displayOrder: number;
  }>>({
    url: '/entities/common-fields',
    method: 'get'
  });
}

/**
 * 获取数据库模式信息
 *
 * @param id - 实体ID
 */
export function fetchGetDatabaseSchema(id: string) {
  return request<{
    tableName: string;
    columns: Array<{
      name: string;
      type: string;
      nullable: boolean;
      defaultValue?: any;
      isPrimaryKey: boolean;
      isUnique: boolean;
    }>;
    indexes: Array<{
      name: string;
      columns: string[];
      unique: boolean;
    }>;
    constraints: Array<{
      name: string;
      type: string;
      columns: string[];
      referencedTable?: string;
      referencedColumns?: string[];
    }>;
  }>({
    url: `/entities/${id}/schema`,
    method: 'get'
  });
}
