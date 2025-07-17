import { lowcodeRequest as request } from '../request';

/**
 * get query list by project
 *
 * @param projectId - project id
 * @param params - query search params
 */
export function fetchGetQueryList(projectId: string, params?: Api.Lowcode.QuerySearchParams) {
  return request<Api.Lowcode.QueryList>({
    url: `/queries/project/${projectId}/paginated`,
    method: 'get',
    params
  });
}

/**
 * get all queries by project
 *
 * @param projectId - project id
 */
export function fetchGetAllQueries(projectId: string) {
  return request<Api.Lowcode.MultiTableQuery[]>({
    url: `/queries/project/${projectId}`,
    method: 'get'
  });
}

/**
 * get query by id
 *
 * @param id - query id
 */
export function fetchGetQuery(id: string) {
  return request<Api.Lowcode.MultiTableQuery>({
    url: `/queries/${id}`,
    method: 'get'
  });
}

/**
 * add query
 *
 * @param data - query data
 */
export function fetchAddQuery(data: Api.Lowcode.QueryEdit) {
  return request<Api.Lowcode.MultiTableQuery>({
    url: '/queries',
    method: 'post',
    data
  });
}

/**
 * update query
 *
 * @param id - query id
 * @param data - query data
 */
export function fetchUpdateQuery(id: string, data: Api.Lowcode.QueryEdit) {
  return request<Api.Lowcode.MultiTableQuery>({
    url: `/queries/${id}`,
    method: 'put',
    data
  });
}

/**
 * delete query
 *
 * @param id - query id
 */
export function fetchDeleteQuery(id: string) {
  return request({
    url: `/queries/${id}`,
    method: 'delete'
  });
}

/**
 * execute query
 *
 * @param id - query id
 * @param params - execution parameters
 */
export function fetchExecuteQuery(id: string, params?: Record<string, any>) {
  return request<any>({
    url: `/queries/${id}/execute`,
    method: 'post',
    data: params
  });
}

/**
 * activate query
 *
 * @param id - query id
 */
export function fetchActivateQuery(id: string) {
  return request<Api.Lowcode.MultiTableQuery>({
    url: `/queries/${id}/activate`,
    method: 'post'
  });
}

/**
 * deactivate query
 *
 * @param id - query id
 */
export function fetchDeactivateQuery(id: string) {
  return request<Api.Lowcode.MultiTableQuery>({
    url: `/queries/${id}/deactivate`,
    method: 'post'
  });
}
