import { lowcodeRequest as request } from '../request';

/**
 * get template list by project
 *
 * @param projectId - project id
 * @param params - template search params
 */
export function fetchGetTemplateList(projectId: string, params?: Api.Lowcode.TemplateSearchParams) {
  return request<Api.Lowcode.TemplateList>({
    url: `/templates/project/${projectId}/paginated`,
    method: 'get',
    params
  });
}

/**
 * get all templates by project
 *
 * @param projectId - project id
 */
export function fetchGetAllTemplates(projectId: string) {
  return request<Api.Lowcode.CodeTemplate[]>({
    url: `/templates/project/${projectId}`,
    method: 'get'
  });
}

/**
 * get template by id
 *
 * @param id - template id
 */
export function fetchGetTemplate(id: string) {
  return request<Api.Lowcode.CodeTemplate>({
    url: `/templates/${id}`,
    method: 'get'
  });
}

/**
 * add template
 *
 * @param data - template data
 */
export function fetchAddTemplate(data: Api.Lowcode.TemplateEdit) {
  return request<Api.Lowcode.CodeTemplate>({
    url: '/templates',
    method: 'post',
    data
  });
}

/**
 * update template
 *
 * @param id - template id
 * @param data - template data
 */
export function fetchUpdateTemplate(id: string, data: Api.Lowcode.TemplateEdit) {
  return request<Api.Lowcode.CodeTemplate>({
    url: `/templates/${id}`,
    method: 'put',
    data
  });
}

/**
 * delete template
 *
 * @param id - template id
 */
export function fetchDeleteTemplate(id: string) {
  return request({
    url: `/templates/${id}`,
    method: 'delete'
  });
}

/**
 * publish template
 *
 * @param id - template id
 */
export function fetchPublishTemplate(id: string) {
  return request<Api.Lowcode.CodeTemplate>({
    url: `/templates/${id}/publish`,
    method: 'post'
  });
}

/**
 * create template version
 *
 * @param id - template id
 * @param data - version data
 */
export function fetchCreateTemplateVersion(
  id: string,
  data: {
    version: string;
    content: string;
    variables: Api.Lowcode.TemplateVariable[];
    changelog?: string;
  }
) {
  return request<Api.Lowcode.CodeTemplate>({
    url: `/templates/${id}/versions`,
    method: 'post',
    data
  });
}
