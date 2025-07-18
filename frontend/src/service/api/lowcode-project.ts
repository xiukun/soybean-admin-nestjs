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
