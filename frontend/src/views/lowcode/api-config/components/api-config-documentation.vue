<template>
  <div class="api-config-documentation">
    <NCard :title="$t('page.lowcode.apiConfig.documentation.title')" :bordered="false" size="small">
      <template #header-extra>
        <NSpace>
          <NButton type="primary" @click="generateDocumentation" :loading="generateLoading">
            <template #icon>
              <SvgIcon icon="ic:round-description" />
            </template>
            {{ $t('page.lowcode.apiConfig.documentation.generate') }}
          </NButton>
          <NButton @click="exportSwagger" :disabled="!hasDocumentation" :loading="exportLoading">
            <template #icon>
              <SvgIcon icon="ic:round-download" />
            </template>
            {{ $t('page.lowcode.apiConfig.documentation.exportSwagger') }}
          </NButton>
        </NSpace>
      </template>

      <NSpace vertical :size="16">
        <!-- 项目选择 -->
        <div>
          <h3 class="text-lg font-semibold mb-3">{{ $t('page.lowcode.apiConfig.documentation.selectProject') }}</h3>
          <NSpace>
            <NSelect
              v-model:value="selectedProjectId"
              :placeholder="$t('page.lowcode.project.form.name.placeholder')"
              :options="projectOptions"
              style="width: 200px"
              @update:value="handleProjectChange"
            />
            <NCheckbox v-model:checked="includeInactive">
              {{ $t('page.lowcode.apiConfig.documentation.includeInactive') }}
            </NCheckbox>
          </NSpace>
        </div>

        <!-- 文档配置 -->
        <div>
          <h3 class="text-lg font-semibold mb-3">{{ $t('page.lowcode.apiConfig.documentation.config') }}</h3>
          <NCard size="small">
            <NSpace vertical :size="12">
              <NFormItem :label="$t('page.lowcode.apiConfig.documentation.docTitle')">
                <NInput v-model:value="docConfig.title" :placeholder="$t('page.lowcode.apiConfig.documentation.titlePlaceholder')" />
              </NFormItem>
              <NFormItem :label="$t('page.lowcode.apiConfig.documentation.docVersion')">
                <NInput v-model:value="docConfig.version" :placeholder="$t('page.lowcode.apiConfig.documentation.versionPlaceholder')" />
              </NFormItem>
              <NFormItem :label="$t('page.lowcode.apiConfig.documentation.docDescription')">
                <NInput
                  v-model:value="docConfig.description"
                  type="textarea"
                  :placeholder="$t('page.lowcode.apiConfig.documentation.descriptionPlaceholder')"
                  :rows="3"
                />
              </NFormItem>
              <NFormItem :label="$t('page.lowcode.apiConfig.documentation.docBaseUrl')">
                <NInput v-model:value="docConfig.baseUrl" :placeholder="$t('page.lowcode.apiConfig.documentation.baseUrlPlaceholder')" />
              </NFormItem>
            </NSpace>
          </NCard>
        </div>

        <!-- API统计 -->
        <div v-if="apiStats">
          <h3 class="text-lg font-semibold mb-3">{{ $t('page.lowcode.apiConfig.documentation.statistics') }}</h3>
          <NCard size="small">
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div class="text-center">
                <div class="text-2xl font-bold text-blue-500">{{ apiStats.total }}</div>
                <div class="text-sm text-gray-500">{{ $t('page.lowcode.apiConfig.documentation.totalApis') }}</div>
              </div>
              <div class="text-center">
                <div class="text-2xl font-bold text-green-500">{{ apiStats.active }}</div>
                <div class="text-sm text-gray-500">{{ $t('page.lowcode.apiConfig.documentation.activeApis') }}</div>
              </div>
              <div class="text-center">
                <div class="text-2xl font-bold text-orange-500">{{ apiStats.inactive }}</div>
                <div class="text-sm text-gray-500">{{ $t('page.lowcode.apiConfig.documentation.inactiveApis') }}</div>
              </div>
              <div class="text-center">
                <div class="text-2xl font-bold text-purple-500">{{ apiStats.methods.length }}</div>
                <div class="text-sm text-gray-500">{{ $t('page.lowcode.apiConfig.documentation.methods') }}</div>
              </div>
            </div>
            <div class="mt-4">
              <h4 class="font-medium mb-2">{{ $t('page.lowcode.apiConfig.documentation.methodDistribution') }}</h4>
              <NSpace>
                <NTag v-for="method in apiStats.methods" :key="method.name" :type="getMethodTagType(method.name)">
                  {{ method.name }} ({{ method.count }})
                </NTag>
              </NSpace>
            </div>
          </NCard>
        </div>

        <!-- 生成的文档预览 -->
        <div v-if="generatedDoc">
          <h3 class="text-lg font-semibold mb-3">{{ $t('page.lowcode.apiConfig.documentation.preview') }}</h3>
          <NCard size="small">
            <NTabs type="line">
              <NTabPane name="swagger" :tab="$t('page.lowcode.apiConfig.documentation.swaggerFormat')">
                <NScrollbar style="max-height: 500px">
                  <pre class="text-sm">{{ JSON.stringify(generatedDoc.swagger, null, 2) }}</pre>
                </NScrollbar>
              </NTabPane>
              <NTabPane name="markdown" :tab="$t('page.lowcode.apiConfig.documentation.markdownFormat')">
                <NScrollbar style="max-height: 500px">
                  <div class="markdown-content" v-html="generatedDoc.markdown"></div>
                </NScrollbar>
              </NTabPane>
              <NTabPane name="html" :tab="$t('page.lowcode.apiConfig.documentation.htmlFormat')">
                <NScrollbar style="max-height: 500px">
                  <iframe
                    :srcdoc="generatedDoc.html"
                    style="width: 100%; height: 400px; border: 1px solid #e0e0e0; border-radius: 4px"
                  ></iframe>
                </NScrollbar>
              </NTabPane>
            </NTabs>
          </NCard>
        </div>

        <!-- 导出选项 -->
        <div v-if="hasDocumentation">
          <h3 class="text-lg font-semibold mb-3">{{ $t('page.lowcode.apiConfig.documentation.export') }}</h3>
          <NCard size="small">
            <NSpace>
              <NButton @click="exportFormat('swagger')" :loading="exportLoading">
                <template #icon>
                  <SvgIcon icon="ic:round-code" />
                </template>
                {{ $t('page.lowcode.apiConfig.documentation.exportSwagger') }}
              </NButton>
              <NButton @click="exportFormat('markdown')" :loading="exportLoading">
                <template #icon>
                  <SvgIcon icon="ic:round-description" />
                </template>
                {{ $t('page.lowcode.apiConfig.documentation.exportMarkdown') }}
              </NButton>
              <NButton @click="exportFormat('html')" :loading="exportLoading">
                <template #icon>
                  <SvgIcon icon="ic:round-web" />
                </template>
                {{ $t('page.lowcode.apiConfig.documentation.exportHtml') }}
              </NButton>
              <NButton @click="exportFormat('postman')" :loading="exportLoading">
                <template #icon>
                  <SvgIcon icon="ic:round-api" />
                </template>
                {{ $t('page.lowcode.apiConfig.documentation.exportPostman') }}
              </NButton>
              <NButton @click="exportFormat('openapi')" :loading="exportLoading">
                <template #icon>
                  <SvgIcon icon="ic:round-code" />
                </template>
                {{ $t('page.lowcode.apiConfig.documentation.exportOpenAPI') }}
              </NButton>
              <NButton @click="exportFormat('insomnia')" :loading="exportLoading">
                <template #icon>
                  <SvgIcon icon="ic:round-http" />
                </template>
                {{ $t('page.lowcode.apiConfig.documentation.exportInsomnia') }}
              </NButton>
            </NSpace>
          </NCard>
        </div>
      </NSpace>
    </NCard>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import {
  NCard, NSpace, NButton, NSelect, NCheckbox, NFormItem, NInput,
  NTag, NTabs, NTabPane, NScrollbar
} from 'naive-ui';
import { $t } from '@/locales';
import { fetchGetAllProjects, fetchGetApiConfigListForLowcode } from '@/service/api';
import SvgIcon from '@/components/custom/svg-icon.vue';

defineOptions({
  name: 'ApiConfigDocumentation'
});

interface Props {
  projectId?: string;
}

const props = defineProps<Props>();

// 响应式数据
const selectedProjectId = ref<string>(props.projectId || '');
const includeInactive = ref(false);
const projectOptions = ref<Array<{ label: string; value: string }>>([]);
const apiConfigs = ref<any[]>([]);

// 文档配置
const docConfig = ref({
  title: 'API Documentation',
  version: '1.0.0',
  description: 'Generated API documentation for the project',
  baseUrl: 'https://api.example.com'
});

// 生成的文档
const generatedDoc = ref<any>(null);
const apiStats = ref<any>(null);

// 加载状态
const generateLoading = ref(false);
const exportLoading = ref(false);

// 计算属性
const hasDocumentation = computed(() => !!generatedDoc.value);

// 方法
function getMethodTagType(method: string): 'info' | 'success' | 'warning' | 'error' {
  const methodMap: Record<string, 'info' | 'success' | 'warning' | 'error'> = {
    GET: 'info',
    POST: 'success',
    PUT: 'warning',
    DELETE: 'error'
  };
  return methodMap[method] || 'info';
}

async function loadProjects() {
  try {
    const response = await fetchGetAllProjects();
    let projects: any[] = [];

    // 处理不同的响应格式
    if (Array.isArray(response)) {
      projects = response;
    } else if (response && Array.isArray((response as any).data)) {
      projects = (response as any).data;
    } else if (response && Array.isArray((response as any).records)) {
      projects = (response as any).records;
    } else {
      console.warn('Unexpected response structure:', response);
    }

    if (projects.length > 0) {
      projectOptions.value = projects.map((project: any) => ({
        label: project.name || project.title || `项目 ${project.id}`,
        value: project.id
      }));

      if (!selectedProjectId.value) {
        selectedProjectId.value = projects[0].id;
        await handleProjectChange(projects[0].id);
      }
    } else {
      // 使用模拟数据
      projectOptions.value = [
        { label: '示例项目1', value: 'project-1' },
        { label: '示例项目2', value: 'project-2' },
        { label: '示例项目3', value: 'project-3' }
      ];

      if (!selectedProjectId.value) {
        selectedProjectId.value = 'project-1';
        await handleProjectChange('project-1');
      }
    }
  } catch (error) {
    console.error('Failed to load projects:', error);

    // 使用模拟数据作为后备方案
    projectOptions.value = [
      { label: '示例项目1', value: 'project-1' },
      { label: '示例项目2', value: 'project-2' },
      { label: '示例项目3', value: 'project-3' }
    ];

    if (!selectedProjectId.value) {
      selectedProjectId.value = 'project-1';
      try {
        await handleProjectChange('project-1');
      } catch (err) {
        console.error('Failed to handle project change:', err);
      }
    }
  }
}

async function handleProjectChange(projectId: string) {
  if (!projectId) return;
  
  try {
    const response = await fetchGetApiConfigListForLowcode(projectId, { page: 1, perPage: 1000 });
    if (response.data?.data?.options) {
      apiConfigs.value = response.data.data.options;
      calculateStats();
    }
  } catch (error) {
    console.error('Failed to load API configs:', error);
  }
}

function calculateStats() {
  const total = apiConfigs.value.length;
  const active = apiConfigs.value.filter(api => api.status === 'ACTIVE').length;
  const inactive = total - active;
  
  const methodCounts: Record<string, number> = {};
  apiConfigs.value.forEach(api => {
    methodCounts[api.method] = (methodCounts[api.method] || 0) + 1;
  });
  
  const methods = Object.entries(methodCounts).map(([name, count]) => ({ name, count }));
  
  apiStats.value = { total, active, inactive, methods };
}

async function generateDocumentation() {
  if (!selectedProjectId.value) {
    window.$message?.warning($t('page.lowcode.apiConfig.documentation.selectProjectFirst'));
    return;
  }
  
  try {
    generateLoading.value = true;
    
    // 过滤API配置
    const filteredApis = includeInactive.value 
      ? apiConfigs.value 
      : apiConfigs.value.filter(api => api.status === 'ACTIVE');
    
    // 生成Swagger文档
    const swaggerDoc = generateSwaggerDoc(filteredApis);
    
    // 生成Markdown文档
    const markdownDoc = generateMarkdownDoc(filteredApis);
    
    // 生成HTML文档
    const htmlDoc = generateHtmlDoc(filteredApis);
    
    generatedDoc.value = {
      swagger: swaggerDoc,
      markdown: markdownDoc,
      html: htmlDoc
    };
    
    window.$message?.success($t('page.lowcode.apiConfig.documentation.generateSuccess'));
  } catch (error) {
    console.error('Failed to generate documentation:', error);
    window.$message?.error($t('page.lowcode.apiConfig.documentation.generateFailed'));
  } finally {
    generateLoading.value = false;
  }
}

function generateSwaggerDoc(apis: any[]) {
  const swagger = {
    openapi: '3.0.0',
    info: {
      title: docConfig.value.title,
      version: docConfig.value.version,
      description: docConfig.value.description
    },
    servers: [
      {
        url: docConfig.value.baseUrl,
        description: 'Production server'
      }
    ],
    paths: {} as any
  };
  
  apis.forEach(api => {
    const path = api.path;
    const method = api.method.toLowerCase();
    
    if (!swagger.paths[path]) {
      swagger.paths[path] = {};
    }
    
    const operation: any = {
      summary: api.name,
      description: api.description || '',
      tags: [api.category || 'Default'],
      responses: {
        '200': {
          description: 'Successful response',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  status: { type: 'integer', example: 0 },
                  msg: { type: 'string', example: '' },
                  data: { type: 'object' }
                }
              }
            }
          }
        },
        '400': {
          description: 'Bad Request',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  status: { type: 'integer', example: 1 },
                  msg: { type: 'string', example: 'Invalid parameters' }
                }
              }
            }
          }
        },
        '401': {
          description: 'Unauthorized',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  status: { type: 'integer', example: 401 },
                  msg: { type: 'string', example: 'Unauthorized' }
                }
              }
            }
          }
        },
        '500': {
          description: 'Internal Server Error',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  status: { type: 'integer', example: 500 },
                  msg: { type: 'string', example: 'Internal server error' }
                }
              }
            }
          }
        }
      }
    };

    // Add parameters if available
    if (api.parameters && api.parameters.length > 0) {
      operation.parameters = api.parameters.map((param: any) => ({
        name: param.name,
        in: param.location || 'query',
        required: param.required || false,
        description: param.description || '',
        schema: {
          type: param.type || 'string'
        }
      }));
    }

    // Add request body for POST/PUT/PATCH methods
    if (['POST', 'PUT', 'PATCH'].includes(api.method)) {
      operation.requestBody = {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                // Add example properties based on API configuration
                example: { type: 'string', example: 'value' }
              }
            }
          }
        }
      };
    }

    if (api.hasAuthentication) {
      operation.security = [{ bearerAuth: [] }];
    }

    swagger.paths[path][method] = operation;
  });
  
  if (apis.some(api => api.hasAuthentication)) {
    swagger.components = {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    };
  }
  
  return swagger;
}

function generateMarkdownDoc(apis: any[]) {
  let markdown = `# ${docConfig.value.title}\n\n`;
  markdown += `${docConfig.value.description}\n\n`;
  markdown += `**Version:** ${docConfig.value.version}\n`;
  markdown += `**Base URL:** ${docConfig.value.baseUrl}\n\n`;

  // Table of Contents
  markdown += `## Table of Contents\n\n`;
  apis.forEach((api, index) => {
    markdown += `${index + 1}. [${api.method} ${api.path}](#${api.method.toLowerCase()}-${api.path.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()})\n`;
  });
  markdown += `\n`;

  // API Statistics
  const stats = {
    total: apis.length,
    active: apis.filter(api => api.status === 'ACTIVE').length,
    methods: apis.reduce((acc: any, api) => {
      acc[api.method] = (acc[api.method] || 0) + 1;
      return acc;
    }, {})
  };

  markdown += `## API Statistics\n\n`;
  markdown += `- **Total APIs:** ${stats.total}\n`;
  markdown += `- **Active APIs:** ${stats.active}\n`;
  markdown += `- **Methods:**\n`;
  Object.entries(stats.methods).forEach(([method, count]) => {
    markdown += `  - ${method}: ${count}\n`;
  });
  markdown += `\n`;

  markdown += `## API Endpoints\n\n`;

  apis.forEach(api => {
    markdown += `### ${api.method} ${api.path}\n\n`;
    markdown += `**Name:** ${api.name}\n\n`;
    if (api.description) {
      markdown += `**Description:** ${api.description}\n\n`;
    }
    markdown += `**Authentication:** ${api.hasAuthentication ? '🔒 Required' : '🔓 Not required'}\n\n`;
    markdown += `**Status:** \`${api.status}\`\n\n`;

    // Parameters
    if (api.parameters && api.parameters.length > 0) {
      markdown += `**Parameters:**\n\n`;
      markdown += `| Name | Type | Required | Location | Description |\n`;
      markdown += `|------|------|----------|----------|-------------|\n`;
      api.parameters.forEach((param: any) => {
        markdown += `| ${param.name} | ${param.type || 'string'} | ${param.required ? 'Yes' : 'No'} | ${param.location || 'query'} | ${param.description || '-'} |\n`;
      });
      markdown += `\n`;
    }

    // Request Example
    markdown += `**Request Example:**\n\n`;
    markdown += `\`\`\`bash\n`;
    markdown += `curl -X ${api.method} "${docConfig.value.baseUrl}${api.path}"`;
    if (api.hasAuthentication) {
      markdown += ` \\\n  -H "Authorization: Bearer YOUR_TOKEN"`;
    }
    if (['POST', 'PUT', 'PATCH'].includes(api.method)) {
      markdown += ` \\\n  -H "Content-Type: application/json" \\\n  -d '{"example": "value"}'`;
    }
    markdown += `\n\`\`\`\n\n`;

    // Response Example
    markdown += `**Response Example:**\n\n`;
    markdown += `\`\`\`json\n`;
    markdown += `{\n`;
    markdown += `  "status": 0,\n`;
    markdown += `  "msg": "",\n`;
    markdown += `  "data": {\n`;
    markdown += `    "example": "response data"\n`;
    markdown += `  }\n`;
    markdown += `}\n`;
    markdown += `\`\`\`\n\n`;

    markdown += `---\n\n`;
  });

  // Footer
  markdown += `## Notes\n\n`;
  markdown += `- All timestamps are in ISO 8601 format\n`;
  markdown += `- All responses follow the standard format: \`{status, msg, data}\`\n`;
  markdown += `- Authentication is required for endpoints marked with 🔒\n`;
  markdown += `- Base URL: ${docConfig.value.baseUrl}\n\n`;
  markdown += `Generated on: ${new Date().toISOString()}\n`;

  return markdown;
}

function generateHtmlDoc(apis: any[]) {
  let html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>${docConfig.value.title}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .method { display: inline-block; padding: 4px 8px; border-radius: 4px; color: white; font-weight: bold; }
        .get { background-color: #61affe; }
        .post { background-color: #49cc90; }
        .put { background-color: #fca130; }
        .delete { background-color: #f93e3e; }
        .endpoint { margin: 20px 0; padding: 15px; border: 1px solid #ddd; border-radius: 5px; }
      </style>
    </head>
    <body>
      <h1>${docConfig.value.title}</h1>
      <p>${docConfig.value.description}</p>
      <p><strong>Version:</strong> ${docConfig.value.version}</p>
      <p><strong>Base URL:</strong> ${docConfig.value.baseUrl}</p>
      <h2>API Endpoints</h2>
  `;
  
  apis.forEach(api => {
    html += `
      <div class="endpoint">
        <h3><span class="method ${api.method.toLowerCase()}">${api.method}</span> ${api.path}</h3>
        <p><strong>Name:</strong> ${api.name}</p>
        ${api.description ? `<p><strong>Description:</strong> ${api.description}</p>` : ''}
        <p><strong>Authentication:</strong> ${api.hasAuthentication ? 'Required' : 'Not required'}</p>
        <p><strong>Status:</strong> ${api.status}</p>
      </div>
    `;
  });
  
  html += `
    </body>
    </html>
  `;
  
  return html;
}

async function exportSwagger() {
  await exportFormat('swagger');
}

async function exportFormat(format: 'swagger' | 'markdown' | 'html' | 'postman' | 'openapi' | 'insomnia') {
  if (!generatedDoc.value) return;

  try {
    exportLoading.value = true;

    let content: string;
    let filename: string;
    let mimeType: string;

    switch (format) {
      case 'swagger':
        content = JSON.stringify(generatedDoc.value.swagger, null, 2);
        filename = 'api-documentation.json';
        mimeType = 'application/json';
        break;
      case 'markdown':
        content = generatedDoc.value.markdown;
        filename = 'api-documentation.md';
        mimeType = 'text/markdown';
        break;
      case 'html':
        content = generatedDoc.value.html;
        filename = 'api-documentation.html';
        mimeType = 'text/html';
        break;
      case 'postman':
        content = JSON.stringify(generatePostmanCollection(), null, 2);
        filename = 'api-collection.postman.json';
        mimeType = 'application/json';
        break;
      case 'openapi':
        content = generateOpenAPIYaml();
        filename = 'api-documentation.yaml';
        mimeType = 'text/yaml';
        break;
      case 'insomnia':
        content = JSON.stringify(generateInsomniaCollection(), null, 2);
        filename = 'api-collection.insomnia.json';
        mimeType = 'application/json';
        break;
      default:
        return;
    }
    
    const blob = new Blob([content], { type: mimeType });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    
    window.$message?.success($t('page.lowcode.apiConfig.documentation.exportSuccess', { format: format.toUpperCase() }));
  } catch (error) {
    console.error('Failed to export documentation:', error);
    window.$message?.error($t('page.lowcode.apiConfig.documentation.exportFailed'));
  } finally {
    exportLoading.value = false;
  }
}

function generatePostmanCollection() {
  const collection = {
    info: {
      name: docConfig.value.title,
      description: docConfig.value.description,
      schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json'
    },
    item: [] as any[]
  };
  
  const filteredApis = includeInactive.value 
    ? apiConfigs.value 
    : apiConfigs.value.filter(api => api.status === 'ACTIVE');
  
  filteredApis.forEach(api => {
    const item = {
      name: api.name,
      request: {
        method: api.method,
        header: [] as any[],
        url: {
          raw: `${docConfig.value.baseUrl}${api.path}`,
          host: [docConfig.value.baseUrl.replace(/^https?:\/\//, '')],
          path: api.path.split('/').filter(Boolean)
        }
      }
    };
    
    if (api.hasAuthentication) {
      item.request.header.push({
        key: 'Authorization',
        value: 'Bearer {{token}}',
        type: 'text'
      });
    }
    
    collection.item.push(item);
  });
  
  return collection;
}

function generateOpenAPIYaml() {
  const swagger = generatedDoc.value?.swagger;
  if (!swagger) return '';

  // Convert JSON to YAML format
  let yaml = `openapi: ${swagger.openapi}\n`;
  yaml += `info:\n`;
  yaml += `  title: ${swagger.info.title}\n`;
  yaml += `  version: ${swagger.info.version}\n`;
  yaml += `  description: ${swagger.info.description}\n`;

  yaml += `servers:\n`;
  swagger.servers.forEach((server: any) => {
    yaml += `  - url: ${server.url}\n`;
    yaml += `    description: ${server.description}\n`;
  });

  yaml += `paths:\n`;
  Object.entries(swagger.paths).forEach(([path, methods]: [string, any]) => {
    yaml += `  ${path}:\n`;
    Object.entries(methods).forEach(([method, details]: [string, any]) => {
      yaml += `    ${method}:\n`;
      yaml += `      summary: ${details.summary}\n`;
      yaml += `      description: ${details.description}\n`;
      yaml += `      tags:\n`;
      details.tags.forEach((tag: string) => {
        yaml += `        - ${tag}\n`;
      });
      yaml += `      responses:\n`;
      Object.entries(details.responses).forEach(([code, response]: [string, any]) => {
        yaml += `        '${code}':\n`;
        yaml += `          description: ${response.description}\n`;
      });
    });
  });

  if (swagger.components) {
    yaml += `components:\n`;
    yaml += `  securitySchemes:\n`;
    Object.entries(swagger.components.securitySchemes).forEach(([name, scheme]: [string, any]) => {
      yaml += `    ${name}:\n`;
      yaml += `      type: ${scheme.type}\n`;
      yaml += `      scheme: ${scheme.scheme}\n`;
      if (scheme.bearerFormat) {
        yaml += `      bearerFormat: ${scheme.bearerFormat}\n`;
      }
    });
  }

  return yaml;
}

function generateInsomniaCollection() {
  const collection = {
    _type: 'export',
    __export_format: 4,
    __export_date: new Date().toISOString(),
    __export_source: 'lowcode-platform',
    resources: [
      {
        _id: 'wrk_' + Date.now(),
        _type: 'workspace',
        name: docConfig.value.title,
        description: docConfig.value.description,
        scope: 'collection'
      }
    ]
  };

  const filteredApis = includeInactive.value
    ? apiConfigs.value
    : apiConfigs.value.filter(api => api.status === 'ACTIVE');

  filteredApis.forEach((api, index) => {
    const requestId = 'req_' + Date.now() + '_' + index;

    const request = {
      _id: requestId,
      _type: 'request',
      parentId: collection.resources[0]._id,
      name: api.name,
      description: api.description || '',
      url: `${docConfig.value.baseUrl}${api.path}`,
      method: api.method,
      headers: [] as any[],
      body: {},
      parameters: []
    };

    if (api.hasAuthentication) {
      request.headers.push({
        name: 'Authorization',
        value: 'Bearer {{ _.token }}',
        description: 'JWT Token'
      });
    }

    collection.resources.push(request);
  });

  return collection;
}

onMounted(() => {
  loadProjects();
});
</script>

<style scoped>
pre {
  background-color: #f5f5f5;
  padding: 12px;
  border-radius: 4px;
  overflow-x: auto;
}

.markdown-content {
  background-color: #f9f9f9;
  padding: 16px;
  border-radius: 4px;
}
</style>
