<template>
  <div class="min-h-500px flex-col-stretch gap-16px overflow-hidden lt-sm:overflow-auto">
    <NCard :title="$t('page.lowcode.apiTest.title')" :bordered="false" size="small" class="card-wrapper">
      <NForm ref="formRef" :model="testForm" :rules="rules" label-placement="left" :label-width="120">
        <NGrid :cols="24" :x-gap="16">
          <NFormItemGi :span="12" :label="$t('page.lowcode.apiTest.project')" path="projectId">
            <NSelect 
              v-model:value="testForm.projectId" 
              :placeholder="$t('page.lowcode.apiTest.form.project.placeholder')"
              :options="projectOptions"
              @update:value="handleProjectChange"
            />
          </NFormItemGi>
          <NFormItemGi :span="12" :label="$t('page.lowcode.apiTest.apiConfig')" path="apiConfigId">
            <NSelect 
              v-model:value="testForm.apiConfigId" 
              :placeholder="$t('page.lowcode.apiTest.form.apiConfig.placeholder')"
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
          <NInput v-model:value="testForm.url" :placeholder="$t('page.lowcode.apiTest.form.url.placeholder')" readonly />
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
            <NButton type="dashed" @click="addHeader" class="w-full">
              {{ $t('page.lowcode.apiTest.addHeader') }}
            </NButton>
          </NSpace>
        </NFormItem>
        
        <NFormItem v-if="['POST', 'PUT'].includes(testForm.method)" :label="$t('page.lowcode.apiTest.requestBody')" path="body">
          <NInput
            v-model:value="testForm.body"
            :placeholder="$t('page.lowcode.apiTest.form.body.placeholder')"
            type="textarea"
            :rows="8"
          />
        </NFormItem>
        
        <NFormItem v-if="['GET', 'DELETE'].includes(testForm.method)" :label="$t('page.lowcode.apiTest.queryParams')" path="params">
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
            <NButton type="dashed" @click="addParam" class="w-full">
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
    
    <NCard v-if="testResult" :title="$t('page.lowcode.apiTest.result')" :bordered="false" size="small" class="card-wrapper">
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
            <NCode v-if="testResult.request?.body" :code="JSON.stringify(testResult.request.body, null, 2)" language="json" />
          </NSpace>
        </NTabPane>
      </NTabs>
    </NCard>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, watch, onMounted } from 'vue';
import type { FormInst, FormRules } from 'naive-ui';
import { fetchGetAllProjects, fetchGetAllApiConfigs, fetchTestApiConfig } from '@/service/api';
import { $t } from '@/locales';
import { createRequiredFormRule } from '@/utils/form/rule';

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

const projectOptions = ref<Array<{ label: string; value: string }>>([]);
const apiConfigOptions = ref<Array<{ label: string; value: string }>>([]);

const testForm = reactive<TestForm>({
  projectId: props.projectId || '',
  apiConfigId: '',
  method: 'GET',
  url: '',
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
    const projects = await fetchGetAllProjects();
    projectOptions.value = projects.map(project => ({
      label: project.name,
      value: project.id
    }));
  } catch (error) {
    console.error('Failed to load projects:', error);
  }
}

async function loadApiConfigs(projectId: string) {
  if (!projectId) return;
  
  try {
    apiConfigLoading.value = true;
    const apiConfigs = await fetchGetAllApiConfigs(projectId);
    apiConfigOptions.value = apiConfigs.map(config => ({
      label: `${config.method} ${config.path} - ${config.name}`,
      value: config.id
    }));
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
    const result = await fetchTestApiConfig(testForm.apiConfigId);
    const endTime = Date.now();
    
    testResult.value = {
      status: result.status || 200,
      time: endTime - startTime,
      headers: result.headers || {},
      data: result.data,
      request: {
        url: testForm.url,
        headers: testForm.headers.reduce((acc, header) => {
          if (header.key && header.value) {
            acc[header.key] = header.value;
          }
          return acc;
        }, {} as Record<string, string>),
        body: testForm.body ? JSON.parse(testForm.body) : undefined
      }
    };
    
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

onMounted(() => {
  loadProjects();
  if (props.projectId) {
    loadApiConfigs(props.projectId);
  }
});

watch(() => props.projectId, (newProjectId) => {
  if (newProjectId) {
    testForm.projectId = newProjectId;
    loadApiConfigs(newProjectId);
  }
});
</script>

<style scoped></style>
