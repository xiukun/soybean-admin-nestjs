<template>
  <div class="api-config-selector">
    <NCard :title="$t('page.lowcode.apiConfig.selector.title')" :bordered="false" size="small">
      <template #header-extra>
        <NSpace>
          <NSelect
            v-model:value="selectedProjectId"
            :placeholder="$t('page.lowcode.project.form.name.placeholder')"
            :options="projectOptions"
            style="width: 200px"
            @update:value="handleProjectChange"
          />
          <NButton type="primary" @click="refreshApiConfigs">
            <template #icon>
              <SvgIcon icon="ic:round-refresh" />
            </template>
            {{ $t('common.refresh') }}
          </NButton>
        </NSpace>
      </template>
      
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <!-- 平台管理格式预览 -->
        <div>
          <h3 class="text-lg font-semibold mb-3">{{ $t('page.lowcode.apiConfig.selector.platformFormat') }}</h3>
          <NCard size="small" class="h-400px">
            <NScrollbar>
              <pre class="text-sm">{{ JSON.stringify(platformFormatData, null, 2) }}</pre>
            </NScrollbar>
          </NCard>
        </div>
        
        <!-- 低代码格式预览 -->
        <div>
          <h3 class="text-lg font-semibold mb-3">{{ $t('page.lowcode.apiConfig.selector.lowcodeFormat') }}</h3>
          <NCard size="small" class="h-400px">
            <NScrollbar>
              <pre class="text-sm">{{ JSON.stringify(lowcodeFormatData, null, 2) }}</pre>
            </NScrollbar>
          </NCard>
        </div>
      </div>
      
      <!-- API配置选择器 -->
      <div class="mt-6">
        <h3 class="text-lg font-semibold mb-3">{{ $t('page.lowcode.apiConfig.selector.selectApi') }}</h3>
        <NSelect
          v-model:value="selectedApiId"
          :placeholder="$t('page.lowcode.apiConfig.selector.selectApiPlaceholder')"
          :options="apiOptions"
          filterable
          clearable
          @update:value="handleApiSelect"
        />
        
        <!-- 选中的API详情 -->
        <div v-if="selectedApiConfig" class="mt-4">
          <NCard :title="$t('page.lowcode.apiConfig.selector.selectedApi')" size="small">
            <NDescriptions :column="2" bordered>
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
              <NDescriptionsItem :label="$t('page.lowcode.apiConfig.authRequired')">
                <NTag :type="selectedApiConfig.hasAuthentication ? 'error' : 'success'">
                  {{ selectedApiConfig.hasAuthentication ? $t('common.yesOrNo.yes') : $t('common.yesOrNo.no') }}
                </NTag>
              </NDescriptionsItem>
              <NDescriptionsItem :label="$t('page.lowcode.apiConfig.description')" :span="2">
                {{ selectedApiConfig.description || '-' }}
              </NDescriptionsItem>
            </NDescriptions>
            
            <!-- 生成的amis配置 -->
            <div class="mt-4">
              <h4 class="font-medium mb-2">{{ $t('page.lowcode.apiConfig.selector.amisConfig') }}</h4>
              <NCard size="small">
                <NScrollbar style="max-height: 200px">
                  <pre class="text-sm">{{ JSON.stringify(generateAmisConfig(), null, 2) }}</pre>
                </NScrollbar>
              </NCard>
            </div>
          </NCard>
        </div>
      </div>
    </NCard>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { NCard, NSelect, NButton, NSpace, NScrollbar, NDescriptions, NDescriptionsItem, NTag } from 'naive-ui';
import { fetchGetApiConfigList, fetchGetApiConfigListForLowcode } from '@/service/api';
import { fetchGetAllProjects } from '@/service/api';
import { $t } from '@/locales';
import SvgIcon from '@/components/custom/svg-icon.vue';

defineOptions({
  name: 'ApiConfigSelector'
});

// 响应式数据
const selectedProjectId = ref<string>('');
const selectedApiId = ref<string>('');
const platformFormatData = ref<any>(null);
const lowcodeFormatData = ref<any>(null);
const projectOptions = ref<Array<{ label: string; value: string }>>([]);

// 计算属性
const apiOptions = computed(() => {
  if (!lowcodeFormatData.value?.data?.options) return [];
  return lowcodeFormatData.value.data.options.map((item: any) => ({
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
function getMethodTagType(method: string): 'info' | 'success' | 'warning' | 'error' {
  const methodMap: Record<string, 'info' | 'success' | 'warning' | 'error'> = {
    GET: 'info',
    POST: 'success',
    PUT: 'warning',
    DELETE: 'error'
  };
  return methodMap[method] || 'info';
}

function generateAmisConfig() {
  if (!selectedApiConfig.value) return {};
  
  const config = selectedApiConfig.value;
  
  // 根据HTTP方法生成不同的amis配置
  if (config.method === 'GET') {
    return {
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
    return {
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
      // 使用模拟数据作为后备方案
      projects = [
        { id: 'project-1', name: '示例项目1' },
        { id: 'project-2', name: '示例项目2' },
        { id: 'project-3', name: '示例项目3' }
      ];
    }

    if (projects.length > 0) {
      projectOptions.value = projects.map((project: any) => ({
        label: project.name || project.title || `项目 ${project.id}`,
        value: project.id
      }));

      // 自动选择第一个项目
      selectedProjectId.value = projects[0].id;
      await handleProjectChange(projects[0].id);
    } else {
      console.warn('No projects found');
      // 使用模拟数据
      projectOptions.value = [
        { label: '示例项目1', value: 'project-1' },
        { label: '示例项目2', value: 'project-2' },
        { label: '示例项目3', value: 'project-3' }
      ];
      selectedProjectId.value = 'project-1';
      await handleProjectChange('project-1');
    }
  } catch (error) {
    console.error('Failed to load projects:', error);

    // 使用模拟数据作为后备方案
    projectOptions.value = [
      { label: '示例项目1', value: 'project-1' },
      { label: '示例项目2', value: 'project-2' },
      { label: '示例项目3', value: 'project-3' }
    ];
    selectedProjectId.value = 'project-1';

    try {
      await handleProjectChange('project-1');
    } catch (err) {
      console.error('Failed to handle project change:', err);
    }

    // 显示友好的错误提示
    window.$message?.warning('项目列表加载失败，已使用示例数据。');
  }
}

async function handleProjectChange(projectId: string) {
  if (!projectId) return;
  
  try {
    // 同时获取两种格式的数据
    const [platformResponse, lowcodeResponse] = await Promise.all([
      fetchGetApiConfigList(projectId, { current: 1, size: 10 }),
      fetchGetApiConfigListForLowcode(projectId, { page: 1, perPage: 10 })
    ]);
    
    platformFormatData.value = platformResponse.data;
    lowcodeFormatData.value = lowcodeResponse.data;
  } catch (error) {
    console.error('Failed to load API configs:', error);
  }
}

async function refreshApiConfigs() {
  if (selectedProjectId.value) {
    await handleProjectChange(selectedProjectId.value);
  }
}

function handleApiSelect(apiId: string) {
  selectedApiId.value = apiId;
}

onMounted(() => {
  loadProjects();
});
</script>

<style scoped>
.api-config-selector {
  padding: 16px;
}

pre {
  background-color: #f5f5f5;
  padding: 12px;
  border-radius: 4px;
  overflow-x: auto;
}
</style>
