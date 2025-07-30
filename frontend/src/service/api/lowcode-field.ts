import { lowcodeRequest as request } from '../request';

/**
 * get field list by entity
 *
 * @param entityId - entity id
 */
export function fetchGetFieldList(entityId: string) {
  return request<Api.Lowcode.Field[]>({
    url: `/fields/entity/${entityId}`,
    method: 'get'
  });
}

/**
 * get field by id
 *
 * @param id - field id
 */
export function fetchGetField(id: string) {
  return request<Api.Lowcode.Field>({
    url: `/fields/${id}`,
    method: 'get'
  });
}

/**
 * add field
 *
 * @param data - field data
 */
export function fetchAddField(data: Api.Lowcode.FieldEdit) {
  return request<Api.Lowcode.Field>({
    url: '/fields',
    method: 'post',
    data
  });
}

/**
 * update field
 *
 * @param id - field id
 * @param data - field data
 */
export function fetchUpdateField(id: string, data: Api.Lowcode.FieldEdit) {
  return request<Api.Lowcode.Field>({
    url: `/fields/${id}`,
    method: 'put',
    data
  });
}

/**
 * delete field
 *
 * @param id - field id
 */
export function fetchDeleteField(id: string) {
  return request({
    url: `/fields/${id}`,
    method: 'delete'
  });
}

/**
 * move field order
 *
 * @param id - field id
 * @param direction - move direction
 */
export function fetchMoveField(id: string, direction: 'up' | 'down') {
  return request({
    url: `/fields/${id}/move`,
    method: 'post',
    data: { direction }
  });
}

/**
 * get all fields by project
 *
 * @param params - query parameters
 */
export function fetchGetAllFields(params: { projectId: string }) {
  return request<Api.Lowcode.Field[]>({
    url: '/fields',
    method: 'get',
    params
  });
}
