<script setup lang="ts">
import { onMounted, reactive, ref, watch } from 'vue';
import type { FormInst, FormRules } from 'naive-ui';
import { fetchGetAllApiConfigs, fetchGetAllProjects, fetchTestApiConfig } from '@/service/api';
import { createRequiredFormRule } from '@/utils/form/rule';
import { $t } from '@/locales';

const props = defineProps<{
  projectId?: string;
}>();

interface KeyValuePair {
  key: string;
  value: string;
}

interface TestForm {
  projectId: string;
  apiConfigId: string;
  method: string;
  url: string;
  environment: string;
  headers: KeyValuePair[];
  params: KeyValuePair[];
  body: string;
}

interface TestResult {
  status: number;
  time: number;
  headers: Record<string, string>;
  data: any;
  request?: {
    url: string;
    headers: Record<string, string>;
    body?: any;
  };
}

const formRef = ref<FormInst | null>(null);
const testing = ref(false);
const apiConfigLoading = ref(false);

// 模态框状态
const showEnvironmentModal = ref(false);
const showHistoryModal = ref(false);
const showBatchTestModal = ref(false);

const projectOptions = ref<Array<{ label: string; value: string }>>([]);
const apiConfigOptions = ref<Array<{ label: string; value: string }>>([]);
const environmentOptions = ref<Array<{ label: string; value: string }>>([]);

// 测试历史记录
const testHistory = ref<TestResult[]>([]);

// 环境变量管理
const environmentVariables = ref<Array<{ key: string; value: string }>>([]);

// 批量测试相关
const batchTesting = ref(false);
const selectedApiIds = ref<string[]>([]);
const batchTestData = ref<Array<{ id: string; name: string; method: string; url: string; status?: string }>>([]);
const batchTestResults = ref<Array<{ id: string; name: string; status: number; time: number; success: boolean }>>([]);

// 表格列定义
const historyColumns = ref([
  { title: '时间', key: 'timestamp', width: 180 },
  { title: 'API名称', key: 'apiName', width: 150 },
  { title: '方法', key: 'method', width: 80 },
  { title: 'URL', key: 'url', ellipsis: { tooltip: true } },
  { title: '状态码', key: 'status', width: 80 },
  { title: '响应时间', key: 'responseTime', width: 100, render: (row: any) => `${row.responseTime}ms` },
  { title: '结果', key: 'success', width: 80, render: (row: any) => (row.success ? '成功' : '失败') }
]);

const batchTestColumns = ref([
  { type: 'selection' as const },
  { title: 'API名称', key: 'name', width: 200 },
  { title: '方法', key: 'method', width: 80 },
  { title: 'URL', key: 'url', ellipsis: { tooltip: true } },
  { title: '状态', key: 'status', width: 100 }
]);

const batchResultColumns = ref([
  { title: 'API名称', key: 'name', width: 200 },
  { title: '状态码', key: 'status', width: 100 },
  { title: '响应时间', key: 'time', width: 120, render: (row: any) => `${row.time}ms` },
  { title: '结果', key: 'success', width: 100, render: (row: any) => (row.success ? '✅ 成功' : '❌ 失败') }
]);

const testForm = reactive<TestForm>({
  projectId: props.projectId || '',
  apiConfigId: '',
  method: 'GET',
  url: '',
  environment: 'development',
  headers: [
    { key: 'Content-Type', value: 'application/json' },
    { key: 'Accept', value: 'application/json' }
  ],
  params: [],
  body: ''
});

const testResult = ref<TestResult | null>(null);

const rules: FormRules = {
  projectId: createRequiredFormRule($t('page.lowcode.apiTest.form.project.required')),
  apiConfigId: createRequiredFormRule($t('page.lowcode.apiTest.form.apiConfig.required'))
};

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

function formatResponseBody(data: any): string {
  try {
    return JSON.stringify(data, null, 2);
  } catch {
    return String(data);
  }
}

function addHeader() {
  testForm.headers.push({ key: '', value: '' });
}

function removeHeader(index: number) {
  testForm.headers.splice(index, 1);
}

function addParam() {
  testForm.params.push({ key: '', value: '' });
}

function removeParam(index: number) {
  testForm.params.splice(index, 1);
}

async function loadProjects() {
  try {
    const response = await fetchGetAllProjects();
    const projects = response.data || response; // 处理响应结构
    if (Array.isArray(projects)) {
      projectOptions.value = projects.map(project => ({
        label: project.name,
        value: project.id
      }));
    } else {
      console.error('Projects data is not an array:', projects);
    }
  } catch (error) {
    console.error('Failed to load projects:', error);
  }
}

async function loadApiConfigs(projectId: string) {
  if (!projectId) {
    apiConfigOptions.value = [];
    batchTestData.value = [];
    return;
  }

  try {
    apiConfigLoading.value = true;
    const response = await fetchGetAllApiConfigs(projectId);
    const apiConfigs = response.data || response; // 处理响应结构
    if (Array.isArray(apiConfigs)) {
      apiConfigOptions.value = apiConfigs.map((config: any) => ({
        label: `${config.method} ${config.path} - ${config.name}`,
        value: config.id,
        config // 保存完整的配置信息
      }));

      // 更新批量测试数据
      initializeBatchTestData();
    } else {
      console.error('API configs data is not an array:', apiConfigs);
    }
  } catch (error) {
    console.error('Failed to load API configs:', error);
  } finally {
    apiConfigLoading.value = false;
  }
}

function handleProjectChange(projectId: string) {
  testForm.apiConfigId = '';
  testForm.url = '';
  testForm.method = 'GET';
  loadApiConfigs(projectId);
}

/**
 * 处理环境变更
 *
 * @param environment - 选中的环境
 */
function handleEnvironmentChange(environment: string) {
  // 根据环境更新基础URL
  const baseUrls = {
    development: 'http://localhost:3002',
    staging: 'https://staging-api.example.com',
    production: 'https://api.example.com'
  };

  // 更新当前URL的基础部分
  if (testForm.url) {
    const pathPart = testForm.url.split('/api')[1] || '';
    testForm.url = `${baseUrls[environment as keyof typeof baseUrls] || baseUrls.development}/api${pathPart}`;
  }
}

function handleApiConfigChange(apiConfigId: string) {
  const selectedConfig = apiConfigOptions.value.find(option => option.value === apiConfigId);
  if (selectedConfig) {
    const [method, path] = selectedConfig.label.split(' ');
    testForm.method = method;
    testForm.url = `${window.location.origin}/api${path}`;
  }
}

async function handleTest() {
  await formRef.value?.validate();

  try {
    testing.value = true;
    testResult.value = null;

    const startTime = Date.now();
    const response = await fetchTestApiConfig(testForm.apiConfigId);
    const endTime = Date.now();

    // 处理响应结构
    const result = response.data || response;

    const testResultData = {
      status: (result as any)?.status || 200,
      time: endTime - startTime,
      headers: (result as any)?.headers || {},
      data: result,
      request: {
        url: testForm.url,
        headers: testForm.headers.reduce(
          (acc, header) => {
            if (header.key && header.value) {
              acc[header.key] = header.value;
            }
            return acc;
          },
          {} as Record<string, string>
        ),
        body: testForm.body ? JSON.parse(testForm.body) : undefined
      },
      success: true
    };

    testResult.value = testResultData;

    // 保存到测试历史
    saveTestToHistory(testResultData);

    window.$message?.success($t('page.lowcode.apiTest.testSuccess'));
  } catch (error: any) {
    testResult.value = {
      status: error.status || 500,
      time: 0,
      headers: {},
      data: error.message || 'Test failed',
      request: {
        url: testForm.url,
        headers: {}
      }
    };
    window.$message?.error($t('page.lowcode.apiTest.testFailed'));
  } finally {
    testing.value = false;
  }
}

function handleReset() {
  testForm.headers = [
    { key: 'Content-Type', value: 'application/json' },
    { key: 'Accept', value: 'application/json' }
  ];
  testForm.params = [];
  testForm.body = '';
  testResult.value = null;
}

function handleSaveAsTemplate() {
  // TODO: Implement save as template functionality
  window.$message?.info($t('page.lowcode.apiTest.saveAsTemplateNotImplemented'));
}

/** 获取当前环境的基础URL */
function getCurrentBaseUrl(): string {
  const baseUrls = {
    development: 'http://localhost:3002',
    staging: 'https://staging-api.example.com',
    production: 'https://api.example.com'
  };
  return baseUrls[testForm.environment as keyof typeof baseUrls] || baseUrls.development;
}

/** 添加环境变量 */
function addEnvironmentVariable() {
  environmentVariables.value.push({ key: '', value: '' });
}

/** 移除环境变量 */
function removeEnvironmentVariable(index: number) {
  environmentVariables.value.splice(index, 1);
}

/** 保存环境配置 */
function saveEnvironmentConfig() {
  // 保存到本地存储
  localStorage.setItem('api-test-env-vars', JSON.stringify(environmentVariables.value));
  window.$message?.success('环境配置已保存');
  showEnvironmentModal.value = false;
}

/** 清空测试历史 */
function clearTestHistory() {
  testHistory.value = [];
  localStorage.removeItem('api-test-history');
  window.$message?.success('测试历史已清空');
}

/** 全选API */
function selectAllApis() {
  selectedApiIds.value = batchTestData.value.map(item => item.id);
}

/** 清空API选择 */
function clearApiSelection() {
  selectedApiIds.value = [];
}

/** 运行批量测试 */
async function runBatchTest() {
  if (selectedApiIds.value.length === 0) {
    window.$message?.warning('请选择要测试的API');
    return;
  }

  batchTesting.value = true;
  batchTestResults.value = [];

  try {
    for (const apiId of selectedApiIds.value) {
      const apiConfig = batchTestData.value.find(item => item.id === apiId);
      if (!apiConfig) continue;

      const startTime = Date.now();
      try {
        const response = await fetch(apiConfig.url, {
          method: apiConfig.method,
          headers: { 'Content-Type': 'application/json' }
        });

        const endTime = Date.now();
        batchTestResults.value.push({
          id: apiId,
          name: apiConfig.name,
          status: response.status,
          time: endTime - startTime,
          success: response.ok
        });
      } catch (error) {
        const endTime = Date.now();
        batchTestResults.value.push({
          id: apiId,
          name: apiConfig.name,
          status: 0,
          time: endTime - startTime,
          success: false
        });
      }
    }

    window.$message?.success(`批量测试完成，共测试 ${selectedApiIds.value.length} 个API`);
  } finally {
    batchTesting.value = false;
  }
}

// 初始化环境选项
function initializeEnvironmentOptions() {
  environmentOptions.value = [
    { label: '开发环境 (Development)', value: 'development' },
    { label: '测试环境 (Staging)', value: 'staging' },
    { label: '生产环境 (Production)', value: 'production' }
  ];
}

/** 初始化批量测试数据 */
function initializeBatchTestData() {
  // 从API配置中生成批量测试数据
  batchTestData.value = apiConfigOptions.value.map((option: any) => {
    const config = option.config;
    return {
      id: option.value,
      name: config?.name || option.label,
      method: config?.method || 'GET',
      url: config?.path ? `${getCurrentBaseUrl()}${config.path}` : `${getCurrentBaseUrl()}/api/example`,
      status: '待测试'
    };
  });
}

/** 加载本地存储的数据 */
function loadLocalStorageData() {
  // 加载环境变量
  const savedEnvVars = localStorage.getItem('api-test-env-vars');
  if (savedEnvVars) {
    try {
      environmentVariables.value = JSON.parse(savedEnvVars);
    } catch (error) {
      console.warn('Failed to parse saved environment variables:', error);
    }
  }

  // 加载测试历史
  const savedHistory = localStorage.getItem('api-test-history');
  if (savedHistory) {
    try {
      testHistory.value = JSON.parse(savedHistory);
    } catch (error) {
      console.warn('Failed to parse saved test history:', error);
    }
  }
}

/** 保存测试结果到历史记录 */
function saveTestToHistory(result: any) {
  const historyItem = {
    ...result,
    timestamp: new Date().toLocaleString(),
    apiName: apiConfigOptions.value.find(opt => opt.value === testForm.apiConfigId)?.label || 'Unknown API'
  };

  testHistory.value.unshift(historyItem);

  // 限制历史记录数量
  if (testHistory.value.length > 100) {
    testHistory.value = testHistory.value.slice(0, 100);
  }

  // 保存到本地存储
  localStorage.setItem('api-test-history', JSON.stringify(testHistory.value));
}

onMounted(() => {
  initializeEnvironmentOptions();
  loadLocalStorageData();
  loadProjects();
  if (props.projectId) {
    loadApiConfigs(props.projectId);
  }
});

watch(
  () => props.projectId,
  newProjectId => {
    if (newProjectId) {
      testForm.projectId = newProjectId;
      loadApiConfigs(newProjectId);
    }
  }
);
</script>

<template>
  <div class="min-h-500px flex-col-stretch gap-16px overflow-hidden lt-sm:overflow-auto">
    <!-- 增强的API测试工具 -->
    <NCard :title="$t('page.lowcode.apiTest.title')" :bordered="false" size="small" class="card-wrapper">
      <template #header-extra>
        <NSpace>
          <NButton type="info" size="small" @click="showEnvironmentModal = true">
            <template #icon>
              <icon-mdi-cog />
            </template>
            环境管理
          </NButton>
          <NButton type="success" size="small" @click="showHistoryModal = true">
            <template #icon>
              <icon-mdi-history />
            </template>
            测试历史
          </NButton>
          <NButton type="warning" size="small" @click="showBatchTestModal = true">
            <template #icon>
              <icon-mdi-playlist-check />
            </template>
            批量测试
          </NButton>
        </NSpace>
      </template>

      <NForm ref="formRef" :model="testForm" :rules="rules" label-placement="left" :label-width="120">
        <NGrid :cols="24" :x-gap="16">
          <NFormItemGi :span="8" label="环境" path="environment">
            <NSelect
              v-model:value="testForm.environment"
              placeholder="请选择环境"
              :options="environmentOptions"
              @update:value="handleEnvironmentChange"
            />
          </NFormItemGi>
          <NFormItemGi :span="8" label="项目" path="projectId">
            <NSelect
              v-model:value="testForm.projectId"
              placeholder="请选择项目"
              :options="projectOptions"
              @update:value="handleProjectChange"
            />
          </NFormItemGi>
          <NFormItemGi :span="8" label="API配置" path="apiConfigId">
            <NSelect
              v-model:value="testForm.apiConfigId"
              placeholder="请选择API配置"
              :options="apiConfigOptions"
              :loading="apiConfigLoading"
              @update:value="handleApiConfigChange"
            />
          </NFormItemGi>
        </NGrid>

        <NDivider title-placement="left">{{ $t('page.lowcode.apiTest.requestConfig') }}</NDivider>

        <NFormItem :label="$t('page.lowcode.apiTest.method')" path="method">
          <NTag :type="getMethodTagType(testForm.method)">{{ testForm.method }}</NTag>
        </NFormItem>

        <NFormItem :label="$t('page.lowcode.apiTest.url')" path="url">
          <NInput
            v-model:value="testForm.url"
            :placeholder="$t('page.lowcode.apiTest.form.url.placeholder')"
            readonly
          />
        </NFormItem>

        <NFormItem :label="$t('page.lowcode.apiTest.headers')" path="headers">
          <NSpace vertical class="w-full">
            <NSpace v-for="(header, index) in testForm.headers" :key="index" align="center" class="w-full">
              <NInput
                v-model:value="header.key"
                :placeholder="$t('page.lowcode.apiTest.form.headerKey.placeholder')"
                style="flex: 1"
              />
              <NInput
                v-model:value="header.value"
                :placeholder="$t('page.lowcode.apiTest.form.headerValue.placeholder')"
                style="flex: 2"
              />
              <NButton type="error" size="small" @click="removeHeader(index)">
                {{ $t('common.delete') }}
              </NButton>
            </NSpace>
            <NButton type="default" dashed class="w-full" @click="addHeader">
              {{ $t('page.lowcode.apiTest.addHeader') }}
            </NButton>
          </NSpace>
        </NFormItem>

        <NFormItem
          v-if="['POST', 'PUT'].includes(testForm.method)"
          :label="$t('page.lowcode.apiTest.requestBody')"
          path="body"
        >
          <NInput
            v-model:value="testForm.body"
            :placeholder="$t('page.lowcode.apiTest.form.body.placeholder')"
            type="textarea"
            :rows="8"
          />
        </NFormItem>

        <NFormItem
          v-if="['GET', 'DELETE'].includes(testForm.method)"
          :label="$t('page.lowcode.apiTest.queryParams')"
          path="params"
        >
          <NSpace vertical class="w-full">
            <NSpace v-for="(param, index) in testForm.params" :key="index" align="center" class="w-full">
              <NInput
                v-model:value="param.key"
                :placeholder="$t('page.lowcode.apiTest.form.paramKey.placeholder')"
                style="flex: 1"
              />
              <NInput
                v-model:value="param.value"
                :placeholder="$t('page.lowcode.apiTest.form.paramValue.placeholder')"
                style="flex: 2"
              />
              <NButton type="error" size="small" @click="removeParam(index)">
                {{ $t('common.delete') }}
              </NButton>
            </NSpace>
            <NButton type="default" dashed class="w-full" @click="addParam">
              {{ $t('page.lowcode.apiTest.addParam') }}
            </NButton>
          </NSpace>
        </NFormItem>

        <NFormItem>
          <NSpace>
            <NButton type="primary" :loading="testing" @click="handleTest">
              {{ $t('page.lowcode.apiTest.test') }}
            </NButton>
            <NButton @click="handleReset">
              {{ $t('common.reset') }}
            </NButton>
            <NButton type="info" @click="handleSaveAsTemplate">
              {{ $t('page.lowcode.apiTest.saveAsTemplate') }}
            </NButton>
          </NSpace>
        </NFormItem>
      </NForm>
    </NCard>

    <NCard
      v-if="testResult"
      :title="$t('page.lowcode.apiTest.result')"
      :bordered="false"
      size="small"
      class="card-wrapper"
    >
      <NTabs type="line" animated>
        <NTabPane name="response" :tab="$t('page.lowcode.apiTest.response')">
          <NSpace vertical>
            <NSpace align="center">
              <NText strong>{{ $t('page.lowcode.apiTest.status') }}:</NText>
              <NTag :type="getStatusTagType(testResult.status)">{{ testResult.status }}</NTag>
              <NText strong>{{ $t('page.lowcode.apiTest.time') }}:</NText>
              <NText>{{ testResult.time }}ms</NText>
            </NSpace>
            <NDivider />
            <NText strong>{{ $t('page.lowcode.apiTest.responseHeaders') }}:</NText>
            <NCode :code="JSON.stringify(testResult.headers, null, 2)" language="json" />
            <NText strong>{{ $t('page.lowcode.apiTest.responseBody') }}:</NText>
            <NCode :code="formatResponseBody(testResult.data)" language="json" />
          </NSpace>
        </NTabPane>
        <NTabPane name="request" :tab="$t('page.lowcode.apiTest.requestInfo')">
          <NSpace vertical>
            <NText strong>{{ $t('page.lowcode.apiTest.requestUrl') }}:</NText>
            <NCode :code="testResult.request?.url || ''" language="text" />
            <NText strong>{{ $t('page.lowcode.apiTest.requestHeaders') }}:</NText>
            <NCode :code="JSON.stringify(testResult.request?.headers, null, 2)" language="json" />
            <NText v-if="testResult.request?.body" strong>{{ $t('page.lowcode.apiTest.requestBody') }}:</NText>
            <NCode
              v-if="testResult.request?.body"
              :code="JSON.stringify(testResult.request.body, null, 2)"
              language="json"
            />
          </NSpace>
        </NTabPane>
      </NTabs>
    </NCard>

    <!-- 环境管理模态框 -->
    <NModal v-model:show="showEnvironmentModal" preset="card" title="环境管理" style="width: 600px">
      <NForm label-placement="left" :label-width="100">
        <NFormItem label="当前环境">
          <NSelect
            v-model:value="testForm.environment"
            :options="environmentOptions"
            @update:value="handleEnvironmentChange"
          />
        </NFormItem>
        <NFormItem label="基础URL">
          <NInput :value="getCurrentBaseUrl()" readonly />
        </NFormItem>
        <NFormItem label="环境变量">
          <NSpace vertical class="w-full">
            <NSpace v-for="(env, index) in environmentVariables" :key="index" align="center" class="w-full">
              <NInput v-model:value="env.key" placeholder="变量名" style="flex: 1" />
              <NInput v-model:value="env.value" placeholder="变量值" style="flex: 2" />
              <NButton type="error" size="small" @click="removeEnvironmentVariable(index)">删除</NButton>
            </NSpace>
            <NButton type="default" dashed class="w-full" @click="addEnvironmentVariable">添加环境变量</NButton>
          </NSpace>
        </NFormItem>
      </NForm>
      <template #footer>
        <NSpace justify="end">
          <NButton @click="showEnvironmentModal = false">取消</NButton>
          <NButton type="primary" @click="saveEnvironmentConfig">保存</NButton>
        </NSpace>
      </template>
    </NModal>

    <!-- 测试历史模态框 -->
    <NModal v-model:show="showHistoryModal" preset="card" title="测试历史" style="width: 800px">
      <NDataTable :columns="historyColumns" :data="testHistory" :pagination="{ pageSize: 10 }" size="small" />
      <template #footer>
        <NSpace justify="end">
          <NButton @click="clearTestHistory">清空历史</NButton>
          <NButton @click="showHistoryModal = false">关闭</NButton>
        </NSpace>
      </template>
    </NModal>

    <!-- 批量测试模态框 -->
    <NModal v-model:show="showBatchTestModal" preset="card" title="批量测试" style="width: 900px">
      <NSpace vertical>
        <NSpace>
          <NButton type="primary" :loading="batchTesting" @click="runBatchTest">开始批量测试</NButton>
          <NButton @click="selectAllApis">全选</NButton>
          <NButton @click="clearApiSelection">清空选择</NButton>
        </NSpace>
        <NDataTable
          v-model:checked-row-keys="selectedApiIds"
          :columns="batchTestColumns"
          :data="batchTestData"
          :row-key="row => row.id"
          size="small"
          max-height="400"
        />
        <div v-if="batchTestResults.length > 0">
          <NDivider>测试结果</NDivider>
          <NDataTable :columns="batchResultColumns" :data="batchTestResults" size="small" max-height="300" />
        </div>
      </NSpace>
      <template #footer>
        <NSpace justify="end">
          <NButton @click="showBatchTestModal = false">关闭</NButton>
        </NSpace>
      </template>
    </NModal>
  </div>
</template>

<style scoped></style>
