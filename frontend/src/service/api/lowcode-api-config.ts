import { lowcodeRequest as request } from '../request';

/**
 * get api config list by project (Platform Management Format) 平台管理接口：使用 current/size 参数，返回 records 格式
 *
 * @param projectId - project id
 * @param params - api config search params
 */
export function fetchGetApiConfigList(projectId: string, params?: Api.Lowcode.ApiConfigSearchParams) {
  return request<Api.Lowcode.ApiConfigList>({
    url: `/api-configs/project/${projectId}/paginated`,
    method: 'get',
    params
  });
}

/**
 * get api config list by project (Lowcode Page Format) 低代码页面接口：使用 page/perPage 参数，返回 options 格式
 *
 * @param projectId - project id
 * @param params - api config search params
 */
export function fetchGetApiConfigListForLowcode(projectId: string, params?: any) {
  return request<any>({
    url: `/api-configs/project/${projectId}/lowcode-paginated`,
    method: 'get',
    params
  });
}

/**
 * get all api configs by project
 *
 * @param projectId - project id
 */
export function fetchGetAllApiConfigs(projectId: string) {
  return request<Api.Lowcode.ApiConfig[]>({
    url: `/api-configs/project/${projectId}`,
    method: 'get'
  });
}

/**
 * get api config by id
 *
 * @param id - api config id
 */
export function fetchGetApiConfig(id: string) {
  return request<Api.Lowcode.ApiConfig>({
    url: `/api-configs/${id}`,
    method: 'get'
  });
}

/**
 * add api config
 *
 * @param data - api config data
 */
export function fetchAddApiConfig(data: Api.Lowcode.ApiConfigEdit) {
  return request<Api.Lowcode.ApiConfig>({
    url: '/api-configs',
    method: 'post',
    data
  });
}

/**
 * update api config
 *
 * @param id - api config id
 * @param data - api config data
 */
export function fetchUpdateApiConfig(id: string, data: Api.Lowcode.ApiConfigEdit) {
  return request<Api.Lowcode.ApiConfig>({
    url: `/api-configs/${id}`,
    method: 'put',
    data
  });
}

/**
 * delete api config
 *
 * @param id - api config id
 */
export function fetchDeleteApiConfig(id: string) {
  return request({
    url: `/api-configs/${id}`,
    method: 'delete'
  });
}

/**
 * test api config
 *
 * @param id - api config id
 */
export function fetchTestApiConfig(id: string) {
  return request<any>({
    url: `/api-configs/${id}/test`,
    method: 'post'
  });
}

/**
 * get api config versions
 *
 * @param projectId - project id
 * @param code - api config code
 */
export function fetchGetApiConfigVersions(projectId: string, code: string) {
  return request<Api.Lowcode.ApiConfig[]>({
    url: `/api-configs/project/${projectId}/code/${code}/versions`,
    method: 'get'
  });
}

/**
 * create api config version
 *
 * @param id - api config id
 * @param data - version data
 */
export function fetchCreateApiConfigVersion(id: string, data: any) {
  return request<Api.Lowcode.ApiConfig>({
    url: `/api-configs/${id}/versions`,
    method: 'post',
    data
  });
}

/**
 * rollback api config to specific version
 *
 * @param id - api config id
 * @param version - target version
 */
export function fetchRollbackApiConfigVersion(id: string, version: string) {
  return request<Api.Lowcode.ApiConfig>({
    url: `/api-configs/${id}/rollback/${version}`,
    method: 'put'
  });
}
