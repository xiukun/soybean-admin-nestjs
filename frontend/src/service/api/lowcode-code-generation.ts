import { lowcodeRequest as request } from '../request';

/**
 * generate code
 *
 * @param data - generation data
 */
export function fetchGenerateCode(data: {
  projectId: string;
  templateId: string;
  entityIds: string[];
  outputPath: string;
  variables: Record<string, any>;
  options: {
    overwriteExisting: boolean;
    generateTests: boolean;
    generateDocs: boolean;
    architecture: string;
    framework: string;
  };
}) {
  return request<{
    success: boolean;
    filesGenerated: number;
    outputPath: string;
    errors?: string[];
    fileTree?: any[];
    taskId: string;
  }>({
    url: '/code-generation/generate',
    method: 'post',
    data
  });
}

/**
 * get generation progress
 *
 * @param taskId - task id
 */
export function fetchGetGenerationProgress(taskId: string) {
  return request<{
    percentage: number;
    status: 'active' | 'success' | 'error';
    message: string;
    logs: Array<{
      level: 'info' | 'warn' | 'error';
      message: string;
      timestamp: string;
    }>;
  }>({
    url: `/code-generation/progress/${taskId}`,
    method: 'get'
  });
}

/**
 * get generated file content
 *
 * @param filePath - file path
 */
export function fetchGetGeneratedFileContent(filePath: string) {
  return request<string>({
    url: '/code-generation/file-content',
    method: 'get',
    params: { filePath }
  });
}

/**
 * preview code generation
 *
 * @param data - generation data
 */
export function fetchPreviewCodeGeneration(data: {
  projectId: string;
  templateId: string;
  entityIds: string[];
  variables: Record<string, any>;
}) {
  return request<{
    files: Array<{
      path: string;
      content: string;
      language: string;
    }>;
  }>({
    url: '/code-generation/preview',
    method: 'post',
    data
  });
}

/**
 * get generation history
 *
 * @param projectId - project id
 * @param params - search params
 */
export function fetchGetGenerationHistory(projectId: string, params?: {
  current?: number;
  size?: number;
  templateId?: string;
  status?: string;
}) {
  return request<{
    records: Array<{
      id: string;
      projectId: string;
      templateId: string;
      templateName: string;
      entityIds: string[];
      outputPath: string;
      status: 'pending' | 'running' | 'success' | 'failed';
      filesGenerated: number;
      startTime: string;
      endTime?: string;
      duration?: number;
      errors?: string[];
      createdBy: string;
      createdAt: string;
    }>;
    total: number;
    current: number;
    size: number;
  }>({
    url: `/code-generation/history/project/${projectId}`,
    method: 'get',
    params
  });
}

/**
 * download generated code
 *
 * @param taskId - task id
 */
export function fetchDownloadGeneratedCode(taskId: string) {
  return request<Blob>({
    url: `/code-generation/download/${taskId}`,
    method: 'get',
    responseType: 'blob'
  });
}

/**
 * delete generation result
 *
 * @param taskId - task id
 */
export function fetchDeleteGenerationResult(taskId: string) {
  return request({
    url: `/code-generation/result/${taskId}`,
    method: 'delete'
  });
}

/**
 * get template variables
 *
 * @param templateId - template id
 */
export function fetchGetTemplateVariables(templateId: string) {
  return request<Api.Lowcode.TemplateVariable[]>({
    url: `/templates/${templateId}/variables`,
    method: 'get'
  });
}

/**
 * validate template variables
 *
 * @param templateId - template id
 * @param variables - variables to validate
 */
export function fetchValidateTemplateVariables(templateId: string, variables: Record<string, any>) {
  return request<{
    valid: boolean;
    errors: Array<{
      variable: string;
      message: string;
    }>;
  }>({
    url: `/templates/${templateId}/validate-variables`,
    method: 'post',
    data: { variables }
  });
}
