<template>
  <div class="api-config-online-test">
    <NCard :title="$t('page.lowcode.apiConfig.onlineTest.title')" :bordered="false" size="small">
      <template #header-extra>
        <NSpace>
          <NButton @click="loadTestHistory" :loading="historyLoading">
            <template #icon>
              <SvgIcon icon="ic:round-history" />
            </template>
            {{ $t('page.lowcode.apiConfig.onlineTest.history') }}
          </NButton>
          <NButton @click="clearTestData">
            <template #icon>
              <SvgIcon icon="ic:round-clear" />
            </template>
            {{ $t('common.clear') }}
          </NButton>
        </NSpace>
      </template>

      <NSpace vertical :size="16">
        <!-- API选择 -->
        <div>
          <h3 class="text-lg font-semibold mb-3">{{ $t('page.lowcode.apiConfig.onlineTest.selectApi') }}</h3>
          <NSpace>
            <NSelect
              v-model:value="selectedProjectId"
              :placeholder="$t('page.lowcode.project.form.name.placeholder')"
              :options="projectOptions"
              style="width: 200px"
              @update:value="handleProjectChange"
            />
            <NSelect
              v-model:value="selectedApiId"
              :placeholder="$t('page.lowcode.apiConfig.selector.selectApiPlaceholder')"
              :options="apiOptions"
              filterable
              clearable
              style="width: 300px"
              @update:value="handleApiSelect"
            />
          </NSpace>
        </div>

        <!-- API信息展示 -->
        <div v-if="selectedApiConfig">
          <h3 class="text-lg font-semibold mb-3">{{ $t('page.lowcode.apiConfig.onlineTest.apiInfo') }}</h3>
          <NCard size="small">
            <NDescriptions :column="3" bordered size="small">
              <NDescriptionsItem :label="$t('page.lowcode.apiConfig.name')">
                {{ selectedApiConfig.name }}
              </NDescriptionsItem>
              <NDescriptionsItem :label="$t('page.lowcode.apiConfig.method')">
                <NTag :type="getMethodTagType(selectedApiConfig.method)">
                  {{ selectedApiConfig.method }}
                </NTag>
              </NDescriptionsItem>
              <NDescriptionsItem :label="$t('page.lowcode.apiConfig.path')">
                <code>{{ selectedApiConfig.fullPath }}</code>
              </NDescriptionsItem>
              <NDescriptionsItem :label="$t('page.lowcode.apiConfig.authRequired')" :span="3">
                <NTag :type="selectedApiConfig.hasAuthentication ? 'error' : 'success'">
                  {{ selectedApiConfig.hasAuthentication ? $t('common.yesOrNo.yes') : $t('common.yesOrNo.no') }}
                </NTag>
              </NDescriptionsItem>
            </NDescriptions>
          </NCard>
        </div>

        <!-- 测试配置 -->
        <div v-if="selectedApiConfig">
          <h3 class="text-lg font-semibold mb-3">{{ $t('page.lowcode.apiConfig.onlineTest.testConfig') }}</h3>
          <NCard size="small">
            <NSpace vertical :size="12">
              <!-- 请求头 -->
              <div>
                <h4 class="font-medium mb-2">{{ $t('page.lowcode.apiConfig.onlineTest.headers') }}</h4>
                <div v-for="(header, index) in testConfig.headers" :key="index" class="flex gap-2 mb-2">
                  <NInput
                    v-model:value="header.key"
                    :placeholder="$t('page.lowcode.apiConfig.onlineTest.headerKey')"
                    style="width: 200px"
                  />
                  <NInput
                    v-model:value="header.value"
                    :placeholder="$t('page.lowcode.apiConfig.onlineTest.headerValue')"
                    style="flex: 1"
                  />
                  <NButton @click="removeHeader(index)" type="error" size="small">
                    <template #icon>
                      <SvgIcon icon="ic:round-remove" />
                    </template>
                  </NButton>
                </div>
                <NButton @click="addHeader" size="small">
                  <template #icon>
                    <SvgIcon icon="ic:round-add" />
                  </template>
                  {{ $t('page.lowcode.apiConfig.onlineTest.addHeader') }}
                </NButton>
              </div>

              <!-- 环境变量 -->
              <div>
                <h4 class="font-medium mb-2">{{ $t('page.lowcode.apiConfig.onlineTest.envVariables') }}</h4>
                <div v-for="(variable, index) in testConfig.envVariables" :key="index" class="flex gap-2 mb-2">
                  <NInput
                    v-model:value="variable.key"
                    :placeholder="$t('page.lowcode.apiConfig.onlineTest.variableKey')"
                    style="width: 200px"
                  />
                  <NInput
                    v-model:value="variable.value"
                    :placeholder="$t('page.lowcode.apiConfig.onlineTest.variableValue')"
                    style="flex: 1"
                  />
                  <NButton @click="removeEnvVariable(index)" type="error" size="small">
                    <template #icon>
                      <SvgIcon icon="ic:round-remove" />
                    </template>
                  </NButton>
                </div>
                <NButton @click="addEnvVariable" size="small">
                  <template #icon>
                    <SvgIcon icon="ic:round-add" />
                  </template>
                  {{ $t('page.lowcode.apiConfig.onlineTest.addVariable') }}
                </NButton>
              </div>

              <!-- 查询参数 -->
              <div v-if="selectedApiConfig.method === 'GET'">
                <h4 class="font-medium mb-2">{{ $t('page.lowcode.apiConfig.onlineTest.queryParams') }}</h4>
                <div v-for="(param, index) in testConfig.queryParams" :key="index" class="flex gap-2 mb-2">
                  <NInput
                    v-model:value="param.key"
                    :placeholder="$t('page.lowcode.apiConfig.onlineTest.paramKey')"
                    style="width: 200px"
                  />
                  <NInput
                    v-model:value="param.value"
                    :placeholder="$t('page.lowcode.apiConfig.onlineTest.paramValue')"
                    style="flex: 1"
                  />
                  <NButton @click="removeQueryParam(index)" type="error" size="small">
                    <template #icon>
                      <SvgIcon icon="ic:round-remove" />
                    </template>
                  </NButton>
                </div>
                <NButton @click="addQueryParam" size="small">
                  <template #icon>
                    <SvgIcon icon="ic:round-add" />
                  </template>
                  {{ $t('page.lowcode.apiConfig.onlineTest.addParam') }}
                </NButton>
              </div>

              <!-- 请求体 -->
              <div v-if="['POST', 'PUT', 'PATCH'].includes(selectedApiConfig.method)">
                <h4 class="font-medium mb-2">{{ $t('page.lowcode.apiConfig.onlineTest.requestBody') }}</h4>
                <NSpace vertical :size="8">
                  <NRadioGroup v-model:value="testConfig.bodyType">
                    <NRadio value="json">JSON</NRadio>
                    <NRadio value="form">Form Data</NRadio>
                    <NRadio value="raw">Raw</NRadio>
                  </NRadioGroup>
                  
                  <div v-if="testConfig.bodyType === 'json'">
                    <NInput
                      v-model:value="testConfig.jsonBody"
                      type="textarea"
                      :placeholder="$t('page.lowcode.apiConfig.onlineTest.jsonPlaceholder')"
                      :rows="6"
                    />
                  </div>
                  
                  <div v-else-if="testConfig.bodyType === 'form'">
                    <div v-for="(field, index) in testConfig.formData" :key="index" class="flex gap-2 mb-2">
                      <NInput
                        v-model:value="field.key"
                        :placeholder="$t('page.lowcode.apiConfig.onlineTest.fieldKey')"
                        style="width: 200px"
                      />
                      <NInput
                        v-model:value="field.value"
                        :placeholder="$t('page.lowcode.apiConfig.onlineTest.fieldValue')"
                        style="flex: 1"
                      />
                      <NButton @click="removeFormField(index)" type="error" size="small">
                        <template #icon>
                          <SvgIcon icon="ic:round-remove" />
                        </template>
                      </NButton>
                    </div>
                    <NButton @click="addFormField" size="small">
                      <template #icon>
                        <SvgIcon icon="ic:round-add" />
                      </template>
                      {{ $t('page.lowcode.apiConfig.onlineTest.addField') }}
                    </NButton>
                  </div>
                  
                  <div v-else-if="testConfig.bodyType === 'raw'">
                    <NInput
                      v-model:value="testConfig.rawBody"
                      type="textarea"
                      :placeholder="$t('page.lowcode.apiConfig.onlineTest.rawPlaceholder')"
                      :rows="6"
                    />
                  </div>
                </NSpace>
              </div>
            </NSpace>
          </NCard>
        </div>

        <!-- 测试按钮 -->
        <div v-if="selectedApiConfig">
          <NSpace>
            <NButton type="primary" @click="executeTest" :loading="testLoading" size="large">
              <template #icon>
                <SvgIcon icon="ic:round-play-arrow" />
              </template>
              {{ $t('page.lowcode.apiConfig.onlineTest.execute') }}
            </NButton>
            <NButton @click="saveTestCase" :disabled="!hasTestResult">
              <template #icon>
                <SvgIcon icon="ic:round-save" />
              </template>
              {{ $t('page.lowcode.apiConfig.onlineTest.saveCase') }}
            </NButton>
            <NButton @click="showTestCases = !showTestCases">
              <template #icon>
                <SvgIcon icon="ic:round-folder" />
              </template>
              {{ $t('page.lowcode.apiConfig.onlineTest.testCases') }}
            </NButton>
          </NSpace>
        </div>

        <!-- 测试用例管理 -->
        <div v-if="showTestCases">
          <h3 class="text-lg font-semibold mb-3">{{ $t('page.lowcode.apiConfig.onlineTest.testCases') }}</h3>
          <NCard size="small">
            <NSpace vertical :size="12">
              <div class="flex justify-between items-center">
                <span class="font-medium">{{ $t('page.lowcode.apiConfig.onlineTest.savedCases') }}</span>
                <NButton @click="loadTestCases" size="small">
                  <template #icon>
                    <SvgIcon icon="ic:round-refresh" />
                  </template>
                  {{ $t('common.refresh') }}
                </NButton>
              </div>

              <div v-if="testCases.length === 0" class="text-center text-gray-500 py-4">
                {{ $t('page.lowcode.apiConfig.onlineTest.noCases') }}
              </div>

              <div v-else>
                <div v-for="(testCase, index) in testCases" :key="index" class="border rounded p-3 mb-2">
                  <div class="flex justify-between items-start mb-2">
                    <div>
                      <h5 class="font-medium">{{ testCase.name }}</h5>
                      <p class="text-sm text-gray-600">{{ testCase.description }}</p>
                    </div>
                    <NSpace>
                      <NButton @click="loadTestCase(testCase)" size="small">
                        <template #icon>
                          <SvgIcon icon="ic:round-play-arrow" />
                        </template>
                        {{ $t('page.lowcode.apiConfig.onlineTest.load') }}
                      </NButton>
                      <NButton @click="deleteTestCase(index)" type="error" size="small">
                        <template #icon>
                          <SvgIcon icon="ic:round-delete" />
                        </template>
                      </NButton>
                    </NSpace>
                  </div>
                  <div class="text-xs text-gray-500">
                    {{ $t('page.lowcode.apiConfig.onlineTest.createdAt') }}: {{ formatTime(testCase.createdAt) }}
                  </div>
                </div>
              </div>
            </NSpace>
          </NCard>
        </div>

        <!-- 测试结果 -->
        <div v-if="testResult">
          <h3 class="text-lg font-semibold mb-3">{{ $t('page.lowcode.apiConfig.onlineTest.result') }}</h3>
          <NCard size="small">
            <NSpace vertical :size="12">
              <!-- 响应状态 -->
              <div class="flex items-center gap-4">
                <span class="font-medium">{{ $t('page.lowcode.apiConfig.onlineTest.status') }}:</span>
                <NTag :type="getStatusTagType(testResult.status)">
                  {{ testResult.status }}
                </NTag>
                <span class="font-medium">{{ $t('page.lowcode.apiConfig.onlineTest.time') }}:</span>
                <span>{{ testResult.responseTime }}ms</span>
              </div>

              <!-- 响应头 -->
              <div>
                <h4 class="font-medium mb-2">{{ $t('page.lowcode.apiConfig.onlineTest.responseHeaders') }}</h4>
                <NScrollbar style="max-height: 150px">
                  <pre class="text-sm">{{ JSON.stringify(testResult.headers, null, 2) }}</pre>
                </NScrollbar>
              </div>

              <!-- 响应体 -->
              <div>
                <h4 class="font-medium mb-2">{{ $t('page.lowcode.apiConfig.onlineTest.responseBody') }}</h4>
                <NTabs type="line">
                  <NTabPane name="formatted" :tab="$t('page.lowcode.apiConfig.onlineTest.formatted')">
                    <NScrollbar style="max-height: 300px">
                      <pre class="text-sm">{{ formatResponseBody(testResult.data) }}</pre>
                    </NScrollbar>
                  </NTabPane>
                  <NTabPane name="raw" :tab="$t('page.lowcode.apiConfig.onlineTest.raw')">
                    <NScrollbar style="max-height: 300px">
                      <pre class="text-sm">{{ testResult.rawData }}</pre>
                    </NScrollbar>
                  </NTabPane>
                </NTabs>
              </div>
            </NSpace>
          </NCard>
        </div>

        <!-- 测试历史 -->
        <div v-if="showHistory && testHistory.length > 0">
          <h3 class="text-lg font-semibold mb-3">{{ $t('page.lowcode.apiConfig.onlineTest.testHistory') }}</h3>
          <NCard size="small">
            <NList>
              <NListItem v-for="(record, index) in testHistory" :key="index">
                <NSpace justify="space-between" style="width: 100%">
                  <div>
                    <NTag :type="getMethodTagType(record.method)" size="small">{{ record.method }}</NTag>
                    <span class="ml-2">{{ record.url }}</span>
                    <NTag :type="getStatusTagType(record.status)" size="small" class="ml-2">{{ record.status }}</NTag>
                  </div>
                  <div class="text-sm text-gray-500">
                    {{ formatTime(record.timestamp) }}
                  </div>
                </NSpace>
              </NListItem>
            </NList>
          </NCard>
        </div>
      </NSpace>
    </NCard>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import {
  NCard, NSpace, NButton, NSelect, NDescriptions, NDescriptionsItem, NTag,
  NInput, NRadioGroup, NRadio, NScrollbar, NTabs, NTabPane, NList, NListItem
} from 'naive-ui';
import { $t } from '@/locales';
import { fetchGetAllProjects, fetchGetApiConfigListForLowcode } from '@/service/api';
import SvgIcon from '@/components/custom/svg-icon.vue';

defineOptions({
  name: 'ApiConfigOnlineTest'
});

interface Props {
  projectId?: string;
}

const props = defineProps<Props>();

// 响应式数据
const selectedProjectId = ref<string>(props.projectId || '');
const selectedApiId = ref<string>('');
const projectOptions = ref<Array<{ label: string; value: string }>>([]);
const apiOptions = ref<Array<{ label: string; value: string; [key: string]: any }>>([]);
const selectedApiConfig = ref<any>(null);

// 测试配置
const testConfig = ref({
  headers: [{ key: 'Content-Type', value: 'application/json' }],
  queryParams: [{ key: '', value: '' }],
  envVariables: [{ key: '', value: '' }],
  bodyType: 'json' as 'json' | 'form' | 'raw',
  jsonBody: '{\n  "example": "value"\n}',
  formData: [{ key: '', value: '' }],
  rawBody: ''
});

// 测试结果
const testResult = ref<any>(null);
const testHistory = ref<any[]>([]);
const showHistory = ref(false);

// 测试用例管理
const testCases = ref<any[]>([]);
const showTestCases = ref(false);

// 加载状态
const testLoading = ref(false);
const historyLoading = ref(false);

// 计算属性
const hasTestResult = computed(() => !!testResult.value);

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

function getStatusTagType(status: number): 'success' | 'warning' | 'error' {
  if (status >= 200 && status < 300) return 'success';
  if (status >= 400 && status < 500) return 'warning';
  return 'error';
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
    const response = await fetchGetApiConfigListForLowcode(projectId, { page: 1, perPage: 100 });
    if (response.data?.data?.options) {
      apiOptions.value = response.data.data.options;
    }
  } catch (error) {
    console.error('Failed to load API configs:', error);
  }
}

function handleApiSelect(apiId: string) {
  selectedApiId.value = apiId;
  selectedApiConfig.value = apiOptions.value.find(item => item.value === apiId) || null;
  
  // 重置测试配置
  if (selectedApiConfig.value) {
    testConfig.value.headers = [
      { key: 'Content-Type', value: 'application/json' }
    ];
    if (selectedApiConfig.value.hasAuthentication) {
      testConfig.value.headers.push({ key: 'Authorization', value: 'Bearer YOUR_TOKEN' });
    }
  }
}

function addHeader() {
  testConfig.value.headers.push({ key: '', value: '' });
}

function removeHeader(index: number) {
  testConfig.value.headers.splice(index, 1);
}

function addQueryParam() {
  testConfig.value.queryParams.push({ key: '', value: '' });
}

function removeQueryParam(index: number) {
  testConfig.value.queryParams.splice(index, 1);
}

function addFormField() {
  testConfig.value.formData.push({ key: '', value: '' });
}

function removeFormField(index: number) {
  testConfig.value.formData.splice(index, 1);
}

function addEnvVariable() {
  testConfig.value.envVariables.push({ key: '', value: '' });
}

function removeEnvVariable(index: number) {
  testConfig.value.envVariables.splice(index, 1);
}

// 替换环境变量
function replaceEnvVariables(text: string): string {
  let result = text;
  testConfig.value.envVariables.forEach(variable => {
    if (variable.key && variable.value) {
      const regex = new RegExp(`\\{\\{${variable.key}\\}\\}`, 'g');
      result = result.replace(regex, variable.value);
    }
  });
  return result;
}

// 测试用例管理
function saveTestCase() {
  if (!selectedApiConfig.value || !testResult.value) return;

  const testCase = {
    name: `${selectedApiConfig.value.name} - ${new Date().toLocaleString()}`,
    description: `${selectedApiConfig.value.method} ${selectedApiConfig.value.path}`,
    apiId: selectedApiId.value,
    config: JSON.parse(JSON.stringify(testConfig.value)),
    result: JSON.parse(JSON.stringify(testResult.value)),
    createdAt: Date.now()
  };

  testCases.value.unshift(testCase);

  // 保存到本地存储
  localStorage.setItem('api-test-cases', JSON.stringify(testCases.value));

  window.$message?.success($t('page.lowcode.apiConfig.onlineTest.caseSaved'));
}

function loadTestCases() {
  try {
    const saved = localStorage.getItem('api-test-cases');
    if (saved) {
      testCases.value = JSON.parse(saved);
    }
  } catch (error) {
    console.error('Failed to load test cases:', error);
  }
}

function loadTestCase(testCase: any) {
  testConfig.value = JSON.parse(JSON.stringify(testCase.config));
  testResult.value = JSON.parse(JSON.stringify(testCase.result));

  // 如果API配置不同，需要重新选择
  if (selectedApiId.value !== testCase.apiId) {
    selectedApiId.value = testCase.apiId;
    selectedApiConfig.value = apiOptions.value.find(item => item.value === testCase.apiId) || null;
  }

  window.$message?.success($t('page.lowcode.apiConfig.onlineTest.caseLoaded'));
}

function deleteTestCase(index: number) {
  testCases.value.splice(index, 1);
  localStorage.setItem('api-test-cases', JSON.stringify(testCases.value));
  window.$message?.success($t('page.lowcode.apiConfig.onlineTest.caseDeleted'));
}

async function executeTest() {
  if (!selectedApiConfig.value) return;
  
  try {
    testLoading.value = true;
    
    const startTime = Date.now();
    
    // 构建请求URL（应用环境变量）
    let url = replaceEnvVariables(selectedApiConfig.value.fullPath);
    if (selectedApiConfig.value.method === 'GET' && testConfig.value.queryParams.length > 0) {
      const params = new URLSearchParams();
      testConfig.value.queryParams.forEach(param => {
        if (param.key && param.value) {
          params.append(param.key, replaceEnvVariables(param.value));
        }
      });
      if (params.toString()) {
        url += '?' + params.toString();
      }
    }

    // 构建请求头（应用环境变量）
    const headers: Record<string, string> = {};
    testConfig.value.headers.forEach(header => {
      if (header.key && header.value) {
        headers[header.key] = replaceEnvVariables(header.value);
      }
    });
    
    // 构建请求体（应用环境变量）
    let body: any = undefined;
    if (['POST', 'PUT', 'PATCH'].includes(selectedApiConfig.value.method)) {
      if (testConfig.value.bodyType === 'json') {
        body = replaceEnvVariables(testConfig.value.jsonBody);
      } else if (testConfig.value.bodyType === 'form') {
        const formData = new FormData();
        testConfig.value.formData.forEach(field => {
          if (field.key && field.value) {
            formData.append(field.key, replaceEnvVariables(field.value));
          }
        });
        body = formData;
        delete headers['Content-Type']; // Let browser set it for FormData
      } else if (testConfig.value.bodyType === 'raw') {
        body = replaceEnvVariables(testConfig.value.rawBody);
      }
    }
    
    // 发送请求
    const response = await fetch(url, {
      method: selectedApiConfig.value.method,
      headers,
      body
    });
    
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    
    const responseHeaders: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      responseHeaders[key] = value;
    });
    
    const rawData = await response.text();
    let data: any;
    try {
      data = JSON.parse(rawData);
    } catch {
      data = rawData;
    }
    
    testResult.value = {
      status: response.status,
      headers: responseHeaders,
      data,
      rawData,
      responseTime
    };
    
    // 保存到历史记录
    const historyRecord = {
      method: selectedApiConfig.value.method,
      url,
      status: response.status,
      timestamp: Date.now()
    };
    testHistory.value.unshift(historyRecord);
    if (testHistory.value.length > 10) {
      testHistory.value = testHistory.value.slice(0, 10);
    }
    
  } catch (error) {
    console.error('Test execution failed:', error);
    testResult.value = {
      status: 0,
      headers: {},
      data: { error: String(error) },
      rawData: String(error),
      responseTime: 0
    };
  } finally {
    testLoading.value = false;
  }
}

function formatResponseBody(data: any): string {
  try {
    return JSON.stringify(data, null, 2);
  } catch {
    return String(data);
  }
}

function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleString();
}

function loadTestHistory() {
  historyLoading.value = true;
  showHistory.value = true;
  setTimeout(() => {
    historyLoading.value = false;
  }, 500);
}

function clearTestData() {
  testResult.value = null;
  testHistory.value = [];
  showHistory.value = false;
}

onMounted(() => {
  loadProjects();
  loadTestCases();
});
</script>

<style scoped>
pre {
  background-color: #f5f5f5;
  padding: 12px;
  border-radius: 4px;
  overflow-x: auto;
}
</style>
