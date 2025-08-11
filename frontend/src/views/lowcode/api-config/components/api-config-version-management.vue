<script setup lang="tsx">
import { computed, onMounted, ref } from 'vue';
import {
  NButton,
  NCard,
  NDataTable,
  NDescriptions,
  NDescriptionsItem,
  NFormItem,
  NInput,
  NModal,
  NScrollbar,
  NSelect,
  NSpace,
  NTag
} from 'naive-ui';
import type { DataTableColumns } from 'naive-ui';
import {
  fetchCreateApiConfigVersion,
  fetchGetAllProjects,
  fetchGetApiConfigListForLowcode,
  fetchGetApiConfigVersions,
  fetchRollbackApiConfigVersion
} from '@/service/api';
import { $t } from '@/locales';
import SvgIcon from '@/components/custom/svg-icon.vue';

defineOptions({
  name: 'ApiConfigVersionManagement'
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
const currentApiConfig = ref<any>(null);
const versions = ref<any[]>([]);
const compareVersions = ref<any[]>([]);

// 对话框状态
const createVersionVisible = ref(false);
const newVersionForm = ref({
  version: '',
  changeLog: ''
});

// 加载状态
const versionsLoading = ref(false);
const createVersionLoading = ref(false);

// 表格列定义
const versionColumns: DataTableColumns<any> = [
  {
    title: $t('page.lowcode.apiConfig.versionManagement.version'),
    key: 'version',
    width: 100,
    render: row => <NTag type="info">v{row.version}</NTag>
  },
  {
    title: $t('page.lowcode.apiConfig.versionManagement.changeLog'),
    key: 'changeLog',
    ellipsis: {
      tooltip: true
    }
  },
  {
    title: $t('common.createdBy'),
    key: 'createdBy',
    width: 120
  },
  {
    title: $t('common.createdAt'),
    key: 'createdAt',
    width: 180,
    render: row => formatTime(row.createdAt)
  },
  {
    title: $t('common.operate'),
    key: 'operate',
    width: 200,
    render: row => (
      <NSpace size="small">
        <NButton size="small" onClick={() => handleViewVersion(row)}>
          {$t('common.view')}
        </NButton>
        <NButton size="small" onClick={() => handleCompareVersion(row)}>
          {$t('page.lowcode.apiConfig.versionManagement.compare')}
        </NButton>
        <NButton size="small" type="warning" onClick={() => handleRollbackVersion(row)}>
          {$t('page.lowcode.apiConfig.versionManagement.rollback')}
        </NButton>
      </NSpace>
    )
  }
];

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

function formatTime(timestamp: string | number): string {
  return new Date(timestamp).toLocaleString();
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

async function handleApiSelect(apiId: string) {
  selectedApiId.value = apiId;
  currentApiConfig.value = apiOptions.value.find(item => item.value === apiId) || null;

  if (apiId) {
    await loadVersions(apiId);
  } else {
    versions.value = [];
    compareVersions.value = [];
  }
}

async function loadVersions(apiId: string) {
  if (!currentApiConfig.value) return;

  try {
    versionsLoading.value = true;

    const response = await fetchGetApiConfigVersions(selectedProjectId.value, currentApiConfig.value.code);

    if (response.data) {
      versions.value = response.data.map((version: any) => ({
        id: version.id,
        version: version.version,
        changeLog: version.description || '无变更日志',
        createdBy: version.createdBy,
        createdAt: new Date(version.createdAt).getTime(),
        config: version
      }));
    }
  } catch (error) {
    console.error('Failed to load versions:', error);

    // 使用模拟数据作为后备方案
    const mockVersions = [
      {
        id: '1',
        version: '1.0.0',
        changeLog: '初始版本',
        createdBy: 'admin',
        createdAt: Date.now() - 86400000 * 7,
        config: currentApiConfig.value
      },
      {
        id: '2',
        version: '1.1.0',
        changeLog: '添加新的参数验证',
        createdBy: 'developer',
        createdAt: Date.now() - 86400000 * 3,
        config: { ...currentApiConfig.value, parameters: ['newParam'] }
      },
      {
        id: '3',
        version: '1.2.0',
        changeLog: '优化响应格式',
        createdBy: 'admin',
        createdAt: Date.now() - 86400000,
        config: { ...currentApiConfig.value, responseFormat: 'optimized' }
      }
    ];

    versions.value = mockVersions;
    window.$message?.warning($t('page.lowcode.apiConfig.versionManagement.loadFailed'));
  } finally {
    versionsLoading.value = false;
  }
}

function refreshVersions() {
  if (selectedApiId.value) {
    loadVersions(selectedApiId.value);
  }
}

function createVersion() {
  newVersionForm.value = {
    version: '',
    changeLog: ''
  };
  createVersionVisible.value = true;
}

async function handleCreateVersion() {
  if (!currentApiConfig.value) return;

  try {
    createVersionLoading.value = true;

    const versionData = {
      version: newVersionForm.value.version,
      description: newVersionForm.value.changeLog,
      ...currentApiConfig.value
    };

    await fetchCreateApiConfigVersion(currentApiConfig.value.id, versionData);

    window.$message?.success($t('page.lowcode.apiConfig.versionManagement.versionCreated'));
    createVersionVisible.value = false;

    // 重置表单
    newVersionForm.value = {
      version: '',
      changeLog: ''
    };

    // 刷新版本列表
    await refreshVersions();
  } catch (error) {
    console.error('Failed to create version:', error);
    window.$message?.error($t('page.lowcode.apiConfig.versionManagement.createFailed'));
  } finally {
    createVersionLoading.value = false;
  }
}

function handleViewVersion(version: any) {
  window.$message?.info($t('page.lowcode.apiConfig.versionManagement.viewVersion', { version: version.version }));
}

function handleCompareVersion(version: any) {
  if (compareVersions.value.length === 0) {
    compareVersions.value = [version];
    window.$message?.info($t('page.lowcode.apiConfig.versionManagement.selectSecondVersion'));
  } else if (compareVersions.value.length === 1) {
    if (compareVersions.value[0].id !== version.id) {
      compareVersions.value.push(version);
      window.$message?.success($t('page.lowcode.apiConfig.versionManagement.compareReady'));
    } else {
      window.$message?.warning($t('page.lowcode.apiConfig.versionManagement.sameVersion'));
    }
  } else {
    compareVersions.value = [version];
    window.$message?.info($t('page.lowcode.apiConfig.versionManagement.selectSecondVersion'));
  }
}

async function handleRollbackVersion(version: any) {
  if (!currentApiConfig.value) return;

  try {
    await fetchRollbackApiConfigVersion(currentApiConfig.value.id, version.version);

    window.$message?.success(
      $t('page.lowcode.apiConfig.versionManagement.rollbackSuccess', { version: version.version })
    );

    // 刷新当前配置和版本列表
    await handleApiSelect(selectedApiId.value);
  } catch (error) {
    console.error('Failed to rollback version:', error);
    window.$message?.error($t('page.lowcode.apiConfig.versionManagement.rollbackFailed'));
  }
}

onMounted(() => {
  loadProjects();
});
</script>

<template>
  <div class="api-config-version-management">
    <NCard :title="$t('page.lowcode.apiConfig.versionManagement.title')" :bordered="false" size="small">
      <template #header-extra>
        <NSpace>
          <NButton type="primary" :disabled="!selectedApiId" @click="createVersion">
            <template #icon>
              <SvgIcon icon="ic:round-add" />
            </template>
            {{ $t('page.lowcode.apiConfig.versionManagement.createVersion') }}
          </NButton>
          <NButton :loading="versionsLoading" @click="refreshVersions">
            <template #icon>
              <SvgIcon icon="ic:round-refresh" />
            </template>
            {{ $t('common.refresh') }}
          </NButton>
        </NSpace>
      </template>

      <NSpace vertical :size="16">
        <!-- API选择 -->
        <div>
          <h3 class="mb-3 text-lg font-semibold">{{ $t('page.lowcode.apiConfig.versionManagement.selectApi') }}</h3>
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

        <!-- 当前版本信息 -->
        <div v-if="currentApiConfig">
          <h3 class="mb-3 text-lg font-semibold">
            {{ $t('page.lowcode.apiConfig.versionManagement.currentVersion') }}
          </h3>
          <NCard size="small">
            <NDescriptions :column="3" bordered size="small">
              <NDescriptionsItem :label="$t('page.lowcode.apiConfig.name')">
                {{ currentApiConfig.name }}
              </NDescriptionsItem>
              <NDescriptionsItem :label="$t('page.lowcode.apiConfig.version')">
                <NTag type="info">v{{ currentApiConfig.version }}</NTag>
              </NDescriptionsItem>
              <NDescriptionsItem :label="$t('page.lowcode.apiConfig.method')">
                <NTag :type="getMethodTagType(currentApiConfig.method)">
                  {{ currentApiConfig.method }}
                </NTag>
              </NDescriptionsItem>
              <NDescriptionsItem :label="$t('page.lowcode.apiConfig.path')" :span="2">
                <code>{{ currentApiConfig.path }}</code>
              </NDescriptionsItem>
              <NDescriptionsItem :label="$t('common.status')">
                <NTag :type="currentApiConfig.status === 'ACTIVE' ? 'success' : 'warning'">
                  {{ $t(`page.lowcode.apiConfig.status.${currentApiConfig.status}`) }}
                </NTag>
              </NDescriptionsItem>
              <NDescriptionsItem :label="$t('common.updatedAt')" :span="3">
                {{ formatTime(currentApiConfig.updatedAt) }}
              </NDescriptionsItem>
            </NDescriptions>
          </NCard>
        </div>

        <!-- 版本历史 -->
        <div v-if="selectedApiId">
          <h3 class="mb-3 text-lg font-semibold">
            {{ $t('page.lowcode.apiConfig.versionManagement.versionHistory') }}
          </h3>
          <NCard size="small">
            <NDataTable
              :columns="versionColumns"
              :data="versions"
              :loading="versionsLoading"
              size="small"
              :pagination="false"
              :max-height="400"
            />
          </NCard>
        </div>

        <!-- 版本对比 -->
        <div v-if="compareVersions.length === 2">
          <h3 class="mb-3 text-lg font-semibold">
            {{ $t('page.lowcode.apiConfig.versionManagement.versionCompare') }}
          </h3>
          <NCard size="small">
            <div class="grid grid-cols-2 gap-4">
              <div>
                <h4 class="mb-2 font-medium">
                  {{ $t('page.lowcode.apiConfig.versionManagement.version') }} {{ compareVersions[0].version }}
                  <NTag size="small" class="ml-2">{{ formatTime(compareVersions[0].createdAt) }}</NTag>
                </h4>
                <NScrollbar style="max-height: 300px">
                  <pre class="text-sm">{{ JSON.stringify(compareVersions[0].config, null, 2) }}</pre>
                </NScrollbar>
              </div>
              <div>
                <h4 class="mb-2 font-medium">
                  {{ $t('page.lowcode.apiConfig.versionManagement.version') }} {{ compareVersions[1].version }}
                  <NTag size="small" class="ml-2">{{ formatTime(compareVersions[1].createdAt) }}</NTag>
                </h4>
                <NScrollbar style="max-height: 300px">
                  <pre class="text-sm">{{ JSON.stringify(compareVersions[1].config, null, 2) }}</pre>
                </NScrollbar>
              </div>
            </div>
          </NCard>
        </div>
      </NSpace>
    </NCard>

    <!-- 创建版本对话框 -->
    <NModal
      v-model:show="createVersionVisible"
      preset="dialog"
      :title="$t('page.lowcode.apiConfig.versionManagement.createVersion')"
    >
      <NSpace vertical :size="12">
        <NFormItem :label="$t('page.lowcode.apiConfig.versionManagement.versionNumber')">
          <NInput
            v-model:value="newVersionForm.version"
            :placeholder="$t('page.lowcode.apiConfig.versionManagement.versionPlaceholder')"
          />
        </NFormItem>
        <NFormItem :label="$t('page.lowcode.apiConfig.versionManagement.changeLog')">
          <NInput
            v-model:value="newVersionForm.changeLog"
            type="textarea"
            :placeholder="$t('page.lowcode.apiConfig.versionManagement.changeLogPlaceholder')"
            :rows="4"
          />
        </NFormItem>
      </NSpace>
      <template #action>
        <NSpace>
          <NButton @click="createVersionVisible = false">{{ $t('common.cancel') }}</NButton>
          <NButton type="primary" :loading="createVersionLoading" @click="handleCreateVersion">
            {{ $t('common.confirm') }}
          </NButton>
        </NSpace>
      </template>
    </NModal>
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
