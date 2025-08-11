<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { NAlert, NButton, NCard, NDescriptions, NDescriptionsItem, NScrollbar, NSelect, NSpace } from 'naive-ui';
import { fetchGetAllProjects, fetchGetApiConfigList, fetchGetApiConfigListForLowcode } from '@/service/api';
import { $t } from '@/locales';

defineOptions({
  name: 'ApiConfigTest'
});

// 响应式数据
const selectedProjectId = ref<string>('');
const selectedApiId = ref<string>('');
const projectOptions = ref<Array<{ label: string; value: string }>>([]);
const platformResult = ref<any>(null);
const lowcodeResult = ref<any>(null);
const amisConfig = ref<any>(null);
const errorMessage = ref<string>('');

// 加载状态
const platformLoading = ref(false);
const lowcodeLoading = ref(false);

// 计算属性
const apiOptions = computed(() => {
  if (!lowcodeResult.value?.data?.options) return [];
  return lowcodeResult.value.data.options.map((item: any) => ({
    label: item.label,
    value: item.value,
    ...item
  }));
});

const selectedApiConfig = computed(() => {
  if (!selectedApiId.value || !apiOptions.value.length) return null;
  return apiOptions.value.find(item => item.value === selectedApiId.value);
});

// 方法
async function loadProjects() {
  try {
    errorMessage.value = '';
    const response = await fetchGetAllProjects();

    // Handle different response structures
    let projects: any[] = [];
    if (Array.isArray(response)) {
      projects = response;
    } else if (response && Array.isArray((response as any).data)) {
      projects = (response as any).data;
    } else if (response && Array.isArray((response as any).records)) {
      projects = (response as any).records;
    } else {
      console.warn('Unexpected response structure:', response);
      projects = [];
    }

    projectOptions.value = projects.map((project: any) => ({
      label: project.name,
      value: project.id
    }));

    // 自动选择第一个项目
    if (projects.length > 0) {
      selectedProjectId.value = projects[0].id;
    }
  } catch (error) {
    console.error('Failed to load projects:', error);
    errorMessage.value = `加载项目失败: ${error}`;
  }
}

async function handleProjectChange(projectId: string) {
  selectedProjectId.value = projectId;
  // 清空之前的结果
  platformResult.value = null;
  lowcodeResult.value = null;
  selectedApiId.value = '';
  amisConfig.value = null;
}

async function testPlatformApi() {
  if (!selectedProjectId.value) {
    errorMessage.value = '请先选择项目';
    return;
  }

  try {
    platformLoading.value = true;
    errorMessage.value = '';

    const response = await fetchGetApiConfigList(selectedProjectId.value, {
      current: 1,
      size: 5
    });

    platformResult.value = response.data;
  } catch (error) {
    console.error('Platform API test failed:', error);
    errorMessage.value = `平台管理接口测试失败: ${error}`;
  } finally {
    platformLoading.value = false;
  }
}

async function testLowcodeApi() {
  if (!selectedProjectId.value) {
    errorMessage.value = '请先选择项目';
    return;
  }

  try {
    lowcodeLoading.value = true;
    errorMessage.value = '';

    const response = await fetchGetApiConfigListForLowcode(selectedProjectId.value, {
      page: 1,
      perPage: 5
    });

    lowcodeResult.value = response.data;
  } catch (error) {
    console.error('Lowcode API test failed:', error);
    errorMessage.value = `低代码页面接口测试失败: ${error}`;
  } finally {
    lowcodeLoading.value = false;
  }
}

function clearPlatformResult() {
  platformResult.value = null;
}

function clearLowcodeResult() {
  lowcodeResult.value = null;
  selectedApiId.value = '';
  amisConfig.value = null;
}

function handleApiSelect(apiId: string) {
  selectedApiId.value = apiId;
  amisConfig.value = null;
}

function generateAmisConfig() {
  if (!selectedApiConfig.value) return;

  const config = selectedApiConfig.value;

  // 根据HTTP方法生成不同的amis配置
  if (config.method === 'GET') {
    amisConfig.value = {
      type: 'service',
      api: {
        method: config.method,
        url: config.fullPath,
        ...(config.hasAuthentication && {
          headers: {
            Authorization: '${token}'
          }
        })
      },
      body: {
        type: 'table',
        source: '$data',
        columns: [
          { name: 'id', label: 'ID' },
          { name: 'name', label: '名称' }
        ]
      }
    };
  } else {
    amisConfig.value = {
      type: 'form',
      api: {
        method: config.method,
        url: config.fullPath,
        ...(config.hasAuthentication && {
          headers: {
            Authorization: '${token}'
          }
        })
      },
      body: [
        {
          type: 'input-text',
          name: 'name',
          label: '名称',
          required: true
        }
      ]
    };
  }
}

onMounted(() => {
  loadProjects();
});
</script>

<template>
  <div class="api-config-test p-4">
    <NCard title="API配置功能测试" :bordered="false">
      <NSpace vertical :size="16">
        <!-- 项目选择 -->
        <div>
          <h3 class="mb-2">1. 项目选择测试</h3>
          <NSelect
            v-model:value="selectedProjectId"
            :placeholder="$t('page.lowcode.project.form.name.placeholder')"
            :options="projectOptions"
            style="width: 300px"
            @update:value="handleProjectChange"
          />
          <div class="mt-2 text-sm text-gray-500">当前选中项目ID: {{ selectedProjectId || '未选择' }}</div>
        </div>

        <!-- 平台管理接口测试 -->
        <div>
          <h3 class="mb-2">2. 平台管理接口测试 (current/size + records)</h3>
          <NSpace>
            <NButton type="primary" :loading="platformLoading" @click="testPlatformApi">测试平台管理接口</NButton>
            <NButton @click="clearPlatformResult">清空结果</NButton>
          </NSpace>
          <div v-if="platformResult" class="mt-2">
            <NCard size="small" title="平台管理接口响应">
              <NScrollbar style="max-height: 200px">
                <pre class="text-sm">{{ JSON.stringify(platformResult, null, 2) }}</pre>
              </NScrollbar>
            </NCard>
          </div>
        </div>

        <!-- 低代码页面接口测试 -->
        <div>
          <h3 class="mb-2">3. 低代码页面接口测试 (page/perPage + options)</h3>
          <NSpace>
            <NButton type="primary" :loading="lowcodeLoading" @click="testLowcodeApi">测试低代码页面接口</NButton>
            <NButton @click="clearLowcodeResult">清空结果</NButton>
          </NSpace>
          <div v-if="lowcodeResult" class="mt-2">
            <NCard size="small" title="低代码页面接口响应">
              <NScrollbar style="max-height: 200px">
                <pre class="text-sm">{{ JSON.stringify(lowcodeResult, null, 2) }}</pre>
              </NScrollbar>
            </NCard>
          </div>
        </div>

        <!-- API配置选择器测试 -->
        <div>
          <h3 class="mb-2">4. API配置选择器测试</h3>
          <NSelect
            v-model:value="selectedApiId"
            :placeholder="$t('page.lowcode.apiConfig.selector.selectApiPlaceholder')"
            :options="apiOptions"
            filterable
            clearable
            style="width: 400px"
            @update:value="handleApiSelect"
          />
          <div v-if="selectedApiConfig" class="mt-2">
            <NCard size="small" title="选中的API配置">
              <NDescriptions :column="2" bordered size="small">
                <NDescriptionsItem label="名称">{{ selectedApiConfig.name }}</NDescriptionsItem>
                <NDescriptionsItem label="方法">{{ selectedApiConfig.method }}</NDescriptionsItem>
                <NDescriptionsItem label="路径">{{ selectedApiConfig.fullPath }}</NDescriptionsItem>
                <NDescriptionsItem label="认证">
                  {{ selectedApiConfig.hasAuthentication ? '需要' : '不需要' }}
                </NDescriptionsItem>
              </NDescriptions>
            </NCard>
          </div>
        </div>

        <!-- amis配置生成测试 -->
        <div>
          <h3 class="mb-2">5. amis配置生成测试</h3>
          <NButton type="primary" :disabled="!selectedApiConfig" @click="generateAmisConfig">生成amis配置</NButton>
          <div v-if="amisConfig" class="mt-2">
            <NCard size="small" title="生成的amis配置">
              <NScrollbar style="max-height: 200px">
                <pre class="text-sm">{{ JSON.stringify(amisConfig, null, 2) }}</pre>
              </NScrollbar>
            </NCard>
          </div>
        </div>

        <!-- 错误信息显示 -->
        <div v-if="errorMessage" class="mt-4">
          <NAlert type="error" :title="errorMessage" />
        </div>
      </NSpace>
    </NCard>
  </div>
</template>

<style scoped>
pre {
  background-color: #f5f5f5;
  padding: 12px;
  border-radius: 4px;
  overflow-x: auto;
}
</style>
