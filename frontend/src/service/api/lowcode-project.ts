import { lowcodeRequest as request } from '../request';
// Alternative: use smart router for automatic service detection
// import { lowcodeSmartRequest as request } from '../request/router';

/**
 * get project list
 *
 * @param params - project search params
 */
export function fetchGetProjectList(params?: Api.Lowcode.ProjectSearchParams) {
  return request<Api.Lowcode.ProjectList>({
    url: '/projects/paginated',
    method: 'get',
    params,
  });
}

/**
 * get all projects
 */
export function fetchGetAllProjects() {
  return request<Api.Lowcode.Project[]>({
    url: '/projects',
    method: 'get'
  });
}

/**
 * get project by id
 *
 * @param id - project id
 */
export function fetchGetProject(id: string) {
  return request<Api.Lowcode.Project>({
    url: `/projects/${id}`,
    method: 'get'
  });
}

/**
 * get project by code
 *
 * @param code - project code
 */
export function fetchGetProjectByCode(code: string) {
  return request<Api.Lowcode.Project>({
    url: `/projects/code/${code}`,
    method: 'get'
  });
}

/**
 * add project
 *
 * @param data - project data
 */
export function fetchAddProject(data: Api.Lowcode.ProjectEditForm) {
  return request<Api.Lowcode.Project>({
    url: '/projects',
    method: 'post',
    data
  });
}

/**
 * update project
 *
 * @param id - project id
 * @param data - project data
 */
export function fetchUpdateProject(id: string, data: Api.Lowcode.ProjectEditForm) {
  return request<Api.Lowcode.Project>({
    url: `/projects/${id}`,
    method: 'put',
    data
  });
}

/**
 * update project status
 *
 * @param id - project id
 * @param data - status data
 */
export function fetchUpdateProjectStatus(id: string, data: Api.Lowcode.ProjectStatusUpdate) {
  return request<Api.Lowcode.Project>({
    url: `/projects/${id}/status`,
    method: 'put',
    data
  });
}

/**
 * delete project
 *
 * @param id - project id
 */
export function fetchDeleteProject(id: string) {
  return request({
    url: `/projects/${id}`,
    method: 'delete'
  });
}

/**
 * get project statistics
 */
export function fetchGetProjectStats() {
  return request<Api.Lowcode.ProjectStats>({
    url: '/projects/stats',
    method: 'get'
  });
}

/**
 * duplicate project
 *
 * @param id - project id
 * @param data - duplicate data
 */
export function fetchDuplicateProject(id: string, data: { name: string }) {
  return request<Api.Lowcode.Project>({
    url: `/projects/${id}/duplicate`,
    method: 'post',
    data
  });
}

/**
 * archive project
 *
 * @param id - project id
 */
export function fetchArchiveProject(id: string) {
  return request<Api.Lowcode.Project>({
    url: `/projects/${id}/archive`,
    method: 'put'
  });
}

/**
 * export project
 *
 * @param id - project id
 */
export function fetchExportProject(id: string) {
  return request({
    url: `/projects/${id}/export`,
    method: 'get',
    responseType: 'blob'
  });
}

/**
 * test database connection
 *
 * @param config - database config
 */
export function fetchTestDatabaseConnection(config: any) {
  return request<{ success: boolean; message: string }>({
    url: '/projects/test-connection',
    method: 'post',
    data: config
  });
}

/**
 * validate project config
 *
 * @param config - project config
 */
export function fetchValidateProjectConfig(config: any) {
  return request<{ valid: boolean; errors: string[] }>({
    url: '/projects/validate-config',
    method: 'post',
    data: config
  });
}

/**
 * deploy project
 *
 * @param id - project id
 * @param config - deployment configuration
 */
export function fetchDeployProject(id: string, config: { port?: number; config?: Record<string, any> }) {
  return request<Api.Lowcode.Project>({
    url: `/projects/${id}/deploy`,
    method: 'post',
    data: config
  });
}

/**
 * stop project deployment
 *
 * @param id - project id
 */
export function fetchStopProjectDeployment(id: string) {
  return request<Api.Lowcode.Project>({
    url: `/projects/${id}/stop-deployment`,
    method: 'post'
  });
}
