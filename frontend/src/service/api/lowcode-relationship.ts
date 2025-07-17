import { request } from '../request';

/**
 * get relationship list by project
 *
 * @param params - relationship search params
 */
export function fetchGetRelationshipList(params?: Api.Lowcode.RelationshipSearchParams) {
  return request<Api.Lowcode.RelationshipList>({
    url: `/relationships/project/${params?.projectId}/paginated`,
    method: 'get',
    params: {
      page: params?.page,
      limit: params?.limit,
      type: params?.type,
      status: params?.status,
      search: params?.search
    }
  });
}

/**
 * get all relationships by project
 *
 * @param projectId - project id
 */
export function fetchGetAllRelationships(projectId: string) {
  return request<Api.Lowcode.Relationship[]>({
    url: `/relationships/project/${projectId}`,
    method: 'get'
  });
}

/**
 * get relationship by id
 *
 * @param id - relationship id
 */
export function fetchGetRelationship(id: string) {
  return request<Api.Lowcode.Relationship>({
    url: `/relationships/${id}`,
    method: 'get'
  });
}

/**
 * get relationship by code
 *
 * @param projectId - project id
 * @param code - relationship code
 */
export function fetchGetRelationshipByCode(projectId: string, code: string) {
  return request<Api.Lowcode.Relationship>({
    url: `/relationships/project/${projectId}/code/${code}`,
    method: 'get'
  });
}

/**
 * get relationships by entity
 *
 * @param entityId - entity id
 */
export function fetchGetRelationshipsByEntity(entityId: string) {
  return request<Api.Lowcode.Relationship[]>({
    url: `/relationships/entity/${entityId}`,
    method: 'get'
  });
}

/**
 * get relationship graph
 *
 * @param projectId - project id
 */
export function fetchGetRelationshipGraph(projectId: string) {
  return request<{
    entities: { id: string; name: string; code: string }[];
    relationships: Api.Lowcode.Relationship[];
  }>({
    url: `/relationships/project/${projectId}/graph`,
    method: 'get'
  });
}

/**
 * add relationship
 *
 * @param data - relationship data
 */
export function fetchAddRelationship(data: Api.Lowcode.RelationshipEdit) {
  return request<Api.Lowcode.Relationship>({
    url: '/relationships',
    method: 'post',
    data
  });
}

/**
 * update relationship
 *
 * @param id - relationship id
 * @param data - relationship data
 */
export function fetchUpdateRelationship(id: string, data: Api.Lowcode.RelationshipEdit) {
  return request<Api.Lowcode.Relationship>({
    url: `/relationships/${id}`,
    method: 'put',
    data
  });
}

/**
 * delete relationship
 *
 * @param id - relationship id
 */
export function fetchDeleteRelationship(id: string) {
  return request({
    url: `/relationships/${id}`,
    method: 'delete'
  });
}

/**
 * get relationship statistics
 *
 * @param projectId - project id
 */
export function fetchGetRelationshipStats(projectId: string) {
  return request<{
    total: number;
    oneToOne: number;
    oneToMany: number;
    manyToOne: number;
    manyToMany: number;
    active: number;
    inactive: number;
  }>({
    url: `/relationships/project/${projectId}/stats`,
    method: 'get'
  });
}
