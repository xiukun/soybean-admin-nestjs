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
 * test template with data
 *
 * @param id - template id
 * @param data - test data
 */
export function fetchTestTemplate(
  id: string,
  data: {
    variables: Record<string, any>;
    expectedOutput?: string;
  }
) {
  return request<{
    success: boolean;
    output: string;
    errors: string[];
    usedVariables: string[];
    unusedVariables: string[];
    testPassed: boolean;
    expectedOutput?: string;
    actualOutput: string;
  }>({
    url: `/templates/${id}/test`,
    method: 'post',
    data
  });
}

/**
 * preview template with variables
 *
 * @param id - template id
 * @param variables - template variables
 */
export function fetchPreviewTemplate(
  id: string,
  variables: Record<string, any>
) {
  return request<{
    success: boolean;
    output: string;
    errors: string[];
    usedVariables: string[];
    unusedVariables: string[];
  }>({
    url: `/templates/${id}/preview`,
    method: 'post',
    data: { variables }
  });
}

/**
 * validate template content
 *
 * @param data - validation data
 */
export function fetchValidateTemplate(data: {
  content: string;
  variables?: any[];
}) {
  return request<{
    isValid: boolean;
    errors: string[];
    warnings: string[];
  }>({
    url: '/templates/validate',
    method: 'post',
    data
  });
}
