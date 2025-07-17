import { request } from '../request';

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
      page: params?.page,
      limit: params?.limit,
      status: params?.status,
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
  return request<{
    total: number;
    draft: number;
    published: number;
    deprecated: number;
  }>({
    url: `/entities/project/${projectId}/stats`,
    method: 'get'
  });
}
