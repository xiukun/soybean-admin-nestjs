<template>
  <div class="api-config-container">
    <!-- 项目选择 -->
    <NCard v-if="!currentProjectId" :title="$t('page.lowcode.apiConfig.selectProject')" :bordered="false" size="small">
      <NSpace>
        <NSelect
          v-model:value="selectedProjectId"
          :placeholder="$t('page.lowcode.project.form.name.placeholder')"
          :options="projectOptions"
          style="width: 300px"
          @update:value="handleProjectSelect"
        />
        <NButton type="primary" :disabled="!selectedProjectId" @click="confirmProjectSelection">
          {{ $t('common.confirm') }}
        </NButton>
      </NSpace>
    </NCard>

    <div v-if="currentProjectId">
      <!-- 项目信息显示 -->
      <NCard size="small" class="mb-4">
        <template #header>
          <NSpace align="center">
            <span>{{ $t('page.lowcode.apiConfig.currentProject') }}: {{ currentProjectName }}</span>
            <NButton size="small" @click="changeProject">
              {{ $t('page.lowcode.apiConfig.changeProject') }}
            </NButton>
          </NSpace>
        </template>
      </NCard>

      <NTabs v-model:value="activeTab" type="line">
        <NTabPane name="management" :tab="$t('page.lowcode.apiConfig.tabs.management')">
        <div class="flex-col-stretch gap-16px">
          <!-- 搜索和操作栏 -->
          <NCard size="small" :bordered="false">
            <div class="search-toolbar">
              <div class="search-section">
                <ApiConfigSearch v-model:model="searchParams" @reset="resetSearchParams" @search="handleSearch" />
              </div>
              <div class="action-section">
                <NSpace>
                  <NButton @click="handleQuickExport" :loading="exportLoading" size="small">
                    <template #icon>
                      <SvgIcon icon="ic:round-download" />
                    </template>
                    {{ $t('page.lowcode.apiConfig.quickExport') }}
                  </NButton>
                  <NButton @click="showAdvancedSearch = !showAdvancedSearch" size="small">
                    <template #icon>
                      <SvgIcon icon="ic:round-search" />
                    </template>
                    {{ $t('page.lowcode.apiConfig.advancedSearch') }}
                  </NButton>
                </NSpace>
              </div>
            </div>

            <!-- 高级搜索面板 -->
            <NCollapse v-if="showAdvancedSearch" class="mb-4">
              <NCollapseItem :title="$t('page.lowcode.apiConfig.advancedSearchOptions')" name="advanced">
                <NGrid :cols="4" :x-gap="16" :y-gap="16">
                  <NGridItem>
                    <NFormItem :label="$t('page.lowcode.apiConfig.method')">
                      <NSelect
                        v-model:value="advancedSearchParams.method"
                        :placeholder="$t('page.lowcode.apiConfig.selectMethod')"
                        :options="methodOptions"
                        clearable
                      />
                    </NFormItem>
                  </NGridItem>
                  <NGridItem>
                    <NFormItem :label="$t('common.status')">
                      <NSelect
                        v-model:value="advancedSearchParams.status"
                        :placeholder="$t('page.lowcode.apiConfig.selectStatus')"
                        :options="statusOptions"
                        clearable
                      />
                    </NFormItem>
                  </NGridItem>
                  <NGridItem>
                    <NFormItem :label="$t('page.lowcode.apiConfig.authRequired')">
                      <NSelect
                        v-model:value="advancedSearchParams.hasAuthentication"
                        :placeholder="$t('page.lowcode.apiConfig.selectAuth')"
                        :options="authOptions"
                        clearable
                      />
                    </NFormItem>
                  </NGridItem>
                  <NGridItem>
                    <NFormItem :label="$t('page.lowcode.apiConfig.dateRange')">
                      <NDatePicker
                        v-model:value="advancedSearchParams.dateRange"
                        type="daterange"
                        clearable
                        start-placeholder="开始日期"
                        end-placeholder="结束日期"
                      />
                    </NFormItem>
                  </NGridItem>
                </NGrid>
                <NSpace class="mt-4">
                  <NButton type="primary" @click="handleAdvancedSearch">
                    {{ $t('common.search') }}
                  </NButton>
                  <NButton @click="resetAdvancedSearch">
                    {{ $t('common.reset') }}
                  </NButton>
                </NSpace>
              </NCollapseItem>
            </NCollapse>
          </NCard>

          <NCard :title="$t('page.lowcode.apiConfig.title')" :bordered="false" size="small" class="table-card">
            <template #header-extra>
              <NSpace>
                <!-- 统计信息 -->
                <NStatistic
                  :label="$t('page.lowcode.apiConfig.totalCount')"
                  :value="mobilePagination ? mobilePagination.itemCount : 0"
                  class="mr-4"
                />
                <NStatistic
                  :label="$t('page.lowcode.apiConfig.selectedCount')"
                  :value="checkedRowKeys.length"
                  class="mr-4"
                />
                <TableHeaderOperation
                  v-model:columns="columnChecks"
                  :disabled-delete="checkedRowKeys.length === 0"
                  :loading="loading"
                  @add="handleAdd"
                  @delete="handleBatchDelete"
                  @refresh="getData"
                />
              </NSpace>
            </template>
            <div class="table-container">
              <NDataTable
                v-model:checked-row-keys="checkedRowKeys"
                :columns="columns"
                :data="data"
                size="small"
                :scroll-x="1200"
                :loading="loading"
                remote
                :row-key="row => row.id"
                :pagination="mobilePagination"
                :max-height="600"
                class="api-config-table"
              />
            </div>
          </NCard>
        </div>
      </NTabPane>

      <NTabPane name="selector" :tab="$t('page.lowcode.apiConfig.tabs.selector')">
        <ApiConfigSelector :project-id="currentProjectId" />
      </NTabPane>

      <NTabPane name="batchOperations" :tab="$t('page.lowcode.apiConfig.tabs.batchOperations')">
        <ApiConfigBatchOperations
          :project-id="currentProjectId"
          :selected-items="checkedRowKeys"
          @refresh="getDataByPage"
          @selection-change="handleSelectionChange"
        />
      </NTabPane>

      <NTabPane name="onlineTest" :tab="$t('page.lowcode.apiConfig.tabs.onlineTest')">
        <ApiConfigOnlineTest :project-id="currentProjectId" />
      </NTabPane>

      <NTabPane name="versionManagement" :tab="$t('page.lowcode.apiConfig.tabs.versionManagement')">
        <ApiConfigVersionManagement :project-id="currentProjectId" />
      </NTabPane>

      <NTabPane name="documentation" :tab="$t('page.lowcode.apiConfig.tabs.documentation')">
        <ApiConfigDocumentation :project-id="currentProjectId" />
      </NTabPane>
    </NTabs>
    </div>

    <ApiConfigOperateDrawer
      v-model:visible="drawerVisible"
      :operate-type="operateType"
      :row-data="editingData"
      :project-id="currentProjectId"
      @submitted="getDataByPage"
    />


  </div>
</template>

<script setup lang="tsx">
import { ref, watch, onMounted, onUnmounted } from 'vue';
import {
  NButton,
  NPopconfirm,
  NTag,
  NTabs,
  NTabPane,
  NCollapse,
  NCollapseItem,
  NGrid,
  NGridItem,
  NFormItem,
  NSelect,
  NDatePicker,
  NStatistic
} from 'naive-ui';
import SvgIcon from '@/components/custom/svg-icon.vue';
import { useBoolean } from '@sa/hooks';
import { fetchDeleteApiConfig, fetchGetApiConfigList, fetchTestApiConfig, fetchGetAllProjects } from '@/service/api';
import { $t } from '@/locales';
import { useTable } from '@/hooks/common/table';
import ApiConfigOperateDrawer from './modules/api-config-operate-drawer.vue';
import ApiConfigSearch from './modules/api-config-search.vue';
import ApiConfigSelector from './components/api-config-selector.vue';
import ApiConfigBatchOperations from './components/api-config-batch-operations.vue';
import ApiConfigOnlineTest from './components/api-config-online-test.vue';
import ApiConfigVersionManagement from './components/api-config-version-management.vue';
import ApiConfigDocumentation from './components/api-config-documentation.vue';
import TableHeaderOperation from '@/components/advanced/table-header-operation.vue';

const props = defineProps<{
  projectId?: string;
}>();

// 标签页状态
const activeTab = ref('management');

// 项目选择状态
const selectedProjectId = ref<string>('');
const currentProjectId = ref<string>(props.projectId || '');
const currentProjectName = ref<string>('');
const projectOptions = ref<Array<{ label: string; value: string }>>([]);

// 高级搜索状态
const showAdvancedSearch = ref(false);
const exportLoading = ref(false);
const advancedSearchParams = ref({
  method: null as string | null,
  status: null as string | null,
  hasAuthentication: null as string | null,
  dateRange: null as [number, number] | null
});

// 搜索选项
const methodOptions = [
  { label: 'GET', value: 'GET' },
  { label: 'POST', value: 'POST' },
  { label: 'PUT', value: 'PUT' },
  { label: 'DELETE', value: 'DELETE' }
];

const statusOptions = [
  { label: $t('page.lowcode.apiConfig.status.ACTIVE'), value: 'ACTIVE' },
  { label: $t('page.lowcode.apiConfig.status.INACTIVE'), value: 'INACTIVE' }
];

const authOptions = [
  { label: $t('common.yesOrNo.yes'), value: 'true' },
  { label: $t('common.yesOrNo.no'), value: 'false' }
];

// 创建适配器函数来处理API调用（平台管理接口）
const apiConfigListAdapter = async (params: any) => {
  const { current, size, ...searchParams } = params;
  const projectId = currentProjectId.value;

  // 平台管理接口使用 current/size 参数
  const backendParams = {
    ...searchParams,
    current: current || 1,
    size: size || 10
  };

  const response = await fetchGetApiConfigList(projectId, backendParams);

  // 后端已经返回 records 格式，直接处理字段映射
  if (response.data) {
    const responseData = response.data as any;
    const { records = [], total = 0, current: currentPage = 1, size: pageSize = 10 } = responseData;

    // 转换字段名称以匹配 TableData 类型
    const processedRecords = records.map((item: any) => ({
      ...item,
      // 映射字段名称以兼容 TableData 类型
      createBy: item.createdBy,
      createTime: item.createdAt,
      updateBy: item.updatedBy,
      updateTime: item.updatedAt,
      // 保持原有字段以兼容 ApiConfig 类型
      createdBy: item.createdBy,
      createdAt: item.createdAt,
      updatedBy: item.updatedBy,
      updatedAt: item.updatedAt
    }));

    return {
      ...response,
      data: {
        records: processedRecords,
        current: currentPage,
        size: pageSize,
        total
      }
    };
  }

  return response;
};

const {
  columns,
  columnChecks,
  data,
  loading,
  getData,
  getDataByPage,
  mobilePagination,
  searchParams,
  resetSearchParams
} = useTable({
  apiFn: apiConfigListAdapter,
  showTotal: true,
  apiParams: {
    current: 1,
    size: 10,
    projectId: props.projectId
  },
  columns: () => [
    {
      type: 'selection',
      align: 'center',
      width: 48
    },
    {
      key: 'name',
      title: $t('page.lowcode.apiConfig.name'),
      align: 'center',
      minWidth: 120
    },
    {
      key: 'path',
      title: $t('page.lowcode.apiConfig.path'),
      align: 'center',
      minWidth: 200,
      render: (row: any) => <code>{row.path}</code>
    },
    {
      key: 'method',
      title: $t('page.lowcode.apiConfig.method'),
      align: 'center',
      width: 80,
      render: (row: any) => {
        const methodMap: Record<Api.Lowcode.HttpMethod, NaiveUI.ThemeColor> = {
          GET: 'info',
          POST: 'success',
          PUT: 'warning',
          DELETE: 'error'
        };
        return <NTag type={methodMap[row.method as Api.Lowcode.HttpMethod]}>{row.method}</NTag>;
      }
    },
    {
      key: 'entityId',
      title: $t('page.lowcode.apiConfig.entity'),
      align: 'center',
      width: 120,
      render: (row: any) => row.entityId ? <NTag type="info">关联实体</NTag> : '-'
    },
    {
      key: 'hasAuthentication',
      title: $t('page.lowcode.apiConfig.authRequired'),
      align: 'center',
      width: 80,
      render: (row: any) => (
        <NTag type={row.hasAuthentication ? 'error' : 'success'}>
          {row.hasAuthentication ? $t('common.yesOrNo.yes') : $t('common.yesOrNo.no')}
        </NTag>
      )
    },
    {
      key: 'status',
      title: $t('common.status'),
      align: 'center',
      width: 100,
      render: (row: any) => {
        const tagMap: Record<Api.Lowcode.ApiConfigStatus, NaiveUI.ThemeColor> = {
          ACTIVE: 'success',
          INACTIVE: 'warning'
        };

        const label = $t(`page.lowcode.entity.status.${row.status}` as any);
        return <NTag type={tagMap[row.status as Api.Lowcode.ApiConfigStatus]}>{label}</NTag>;
      }
    },
    {
      key: 'description',
      title: $t('page.lowcode.apiConfig.description'),
      align: 'center',
      minWidth: 150,
      ellipsis: {
        tooltip: true
      }
    },
    {
      key: 'createdAt',
      title: $t('common.createdAt'),
      align: 'center',
      width: 180,
      render: (row: any) => new Date(row.createdAt).toLocaleString()
    },
    {
      key: 'operate',
      title: $t('common.operate'),
      align: 'center',
      width: 180,
      render: (row: any) => (
        <div class="flex-center gap-8px">
          <NButton type="primary" ghost size="small" onClick={() => handleTest(row.id)}>
            {$t('page.lowcode.apiConfig.test')}
          </NButton>
          <NButton type="primary" ghost size="small" onClick={() => handleEdit(row.id)}>
            {$t('common.edit')}
          </NButton>
          <NPopconfirm
            onPositiveClick={() => handleDelete(row.id)}
            v-slots={{
              default: () => $t('common.confirmDelete'),
              trigger: () => (
                <NButton type="error" ghost size="small">
                  {$t('common.delete')}
                </NButton>
              )
            }}
          />
        </div>
      )
    }
  ] as any
});

// 创建自定义的表格操作逻辑
const { bool: drawerVisible, setTrue: openDrawer } = useBoolean();
const operateType = ref<NaiveUI.TableOperateType>('add');
const editingData = ref<Api.Lowcode.ApiConfig | null>(null);
const checkedRowKeys = ref<string[]>([]);

function handleAdd() {
  operateType.value = 'add';
  editingData.value = null;
  openDrawer();
}

function handleEdit(id: string) {
  operateType.value = 'edit';
  const findItem = data.value.find((item: any) => item.id === id) || null;
  editingData.value = findItem as Api.Lowcode.ApiConfig | null;
  openDrawer();
}

async function onBatchDeleted() {
  window.$message?.success($t('common.deleteSuccess'));
  checkedRowKeys.value = [];
  await getDataByPage();
}

function handleSelectionChange(items: string[]) {
  checkedRowKeys.value = items;
}

// 性能优化相关
const searchDebounceTimer = ref<NodeJS.Timeout | null>(null);
const isSearching = ref(false);

// 防抖搜索函数
function debounceSearch(searchFn: () => void, delay: number = 300) {
  if (searchDebounceTimer.value) {
    clearTimeout(searchDebounceTimer.value);
  }

  isSearching.value = true;
  searchDebounceTimer.value = setTimeout(() => {
    searchFn();
    isSearching.value = false;
  }, delay);
}

// 优化的搜索函数
function handleSearch() {
  debounceSearch(() => {
    getDataByPage();
  });
}

// 清理定时器
onUnmounted(() => {
  if (searchDebounceTimer.value) {
    clearTimeout(searchDebounceTimer.value);
  }
});

// 项目选择相关方法
function handleProjectSelect(projectId: string) {
  selectedProjectId.value = projectId;
}

function confirmProjectSelection() {
  if (selectedProjectId.value) {
    currentProjectId.value = selectedProjectId.value;
    const selectedProject = projectOptions.value.find(p => p.value === selectedProjectId.value);
    currentProjectName.value = selectedProject?.label || '';
  }
}

function changeProject() {
  currentProjectId.value = '';
  currentProjectName.value = '';
  selectedProjectId.value = '';
}

// 加载项目列表
async function loadProjects() {
  try {
    // 尝试使用现有的项目接口
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

      // 如果有传入的 projectId，设置为当前项目
      if (props.projectId && projects.find(p => p.id === props.projectId)) {
        currentProjectId.value = props.projectId;
        const project = projects.find(p => p.id === props.projectId);
        currentProjectName.value = project?.name || project?.title || `项目 ${props.projectId}`;
      }
    } else {
      // 如果没有项目数据，使用模拟数据
      console.warn('No projects found, using mock data');
      projectOptions.value = [
        { label: '示例项目1', value: 'project-1' },
        { label: '示例项目2', value: 'project-2' },
        { label: '示例项目3', value: 'project-3' }
      ];

      // 如果有传入的 projectId，直接使用
      if (props.projectId) {
        currentProjectId.value = props.projectId;
        currentProjectName.value = `项目 ${props.projectId}`;
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

    // 如果有传入的 projectId，直接使用
    if (props.projectId) {
      currentProjectId.value = props.projectId;
      currentProjectName.value = `项目 ${props.projectId}`;
    }

    // 显示友好的错误提示
    window.$message?.warning('项目列表加载失败，已使用示例数据。请检查网络连接或联系管理员。');
  }
}

// 键盘快捷键支持
function handleKeydown(event: KeyboardEvent) {
  // Ctrl/Cmd + N: 新增API配置
  if ((event.ctrlKey || event.metaKey) && event.key === 'n') {
    event.preventDefault();
    if (currentProjectId.value) {
      handleAdd();
    }
  }

  // Ctrl/Cmd + F: 聚焦搜索框
  if ((event.ctrlKey || event.metaKey) && event.key === 'f') {
    event.preventDefault();
    const searchInput = document.querySelector('input[placeholder*="搜索"]') as HTMLInputElement;
    if (searchInput) {
      searchInput.focus();
    }
  }

  // Ctrl/Cmd + E: 快速导出
  if ((event.ctrlKey || event.metaKey) && event.key === 'e') {
    event.preventDefault();
    if (currentProjectId.value && !exportLoading.value) {
      handleQuickExport();
    }
  }

  // Ctrl/Cmd + R: 刷新数据
  if ((event.ctrlKey || event.metaKey) && event.key === 'r') {
    event.preventDefault();
    if (currentProjectId.value) {
      getData();
    }
  }

  // Escape: 关闭高级搜索
  if (event.key === 'Escape') {
    if (showAdvancedSearch.value) {
      showAdvancedSearch.value = false;
    }
  }
}

// 初始化
onMounted(() => {
  loadProjects();

  // 如果有传入的 projectId，直接使用
  if (props.projectId) {
    currentProjectId.value = props.projectId;
    // 这里可以根据 projectId 获取项目名称
    currentProjectName.value = `项目 ${props.projectId}`;
  }

  // 添加键盘事件监听
  document.addEventListener('keydown', handleKeydown);
});

// 清理事件监听器
onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown);

  // 清理防抖定时器
  if (searchDebounceTimer.value) {
    clearTimeout(searchDebounceTimer.value);
  }
});

// 高级搜索相关方法
function handleAdvancedSearch() {
  // 合并高级搜索参数到主搜索参数
  const params = { ...searchParams };

  if (advancedSearchParams.value.method) {
    params.method = advancedSearchParams.value.method;
  }

  if (advancedSearchParams.value.status) {
    params.status = advancedSearchParams.value.status;
  }

  if (advancedSearchParams.value.hasAuthentication !== null) {
    params.hasAuthentication = advancedSearchParams.value.hasAuthentication === 'true';
  }

  if (advancedSearchParams.value.dateRange) {
    params.startDate = new Date(advancedSearchParams.value.dateRange[0]).toISOString();
    params.endDate = new Date(advancedSearchParams.value.dateRange[1]).toISOString();
  }

  // 执行搜索
  handleSearch();
}

function resetAdvancedSearch() {
  advancedSearchParams.value = {
    method: null,
    status: null,
    hasAuthentication: null,
    dateRange: null
  };

  // 重置搜索参数
  resetSearchParams();
  handleSearch();
}

// 快速导出功能
async function handleQuickExport() {
  try {
    exportLoading.value = true;

    // 获取当前筛选的数据
    const exportData = data.value.map((item: any) => ({
      名称: item.name,
      路径: item.path,
      方法: item.method,
      描述: item.description,
      状态: item.status,
      需要认证: item.hasAuthentication ? '是' : '否',
      创建时间: new Date(item.createdAt).toLocaleString(),
      创建者: item.createdBy
    }));

    // 转换为CSV格式
    const headers = Object.keys(exportData[0] || {});
    const csvContent = [
      headers.join(','),
      ...exportData.map(row =>
        headers.map(header => `"${(row as any)[header] || ''}"`).join(',')
      )
    ].join('\n');

    // 创建下载链接
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `api-configs-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    window.$message?.success('导出成功');
  } catch (error) {
    console.error('Export failed:', error);
    window.$message?.error('导出失败');
  } finally {
    exportLoading.value = false;
  }
}

async function handleDelete(id: string) {
  await fetchDeleteApiConfig(id);
  await getDataByPage();
}

async function handleBatchDelete() {
  await Promise.all(checkedRowKeys.value.map(id => fetchDeleteApiConfig(id)));
  onBatchDeleted();
}

async function handleTest(id: string) {
  try {
    const result = await fetchTestApiConfig(id);
    window.$message?.success($t('page.lowcode.apiConfig.testSuccess'));
    console.log('API Test Result:', result);
  } catch (error) {
    window.$message?.error($t('page.lowcode.apiConfig.testFailed'));
    console.error('API Test Error:', error);
  }
}

// Watch for projectId changes
watch(() => props.projectId, () => {
  if (props.projectId) {
    searchParams.projectId = props.projectId;
    getDataByPage();
  }
}, { immediate: true });
</script>

<style scoped>
/* 主容器样式 */
.api-config-container {
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 16px;
  overflow: hidden;
  padding: 0;
}

/* 搜索工具栏样式 */
.search-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  margin-bottom: 16px;
}

.search-section {
  flex: 1;
  min-width: 0;
}

.action-section {
  flex-shrink: 0;
}

/* 表格卡片样式 */
.table-card {
  position: relative;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.table-card :deep(.n-card-header) {
  padding: 16px 20px;
  border-bottom: 1px solid var(--n-border-color);
  flex-shrink: 0;
}

.table-card :deep(.n-card__content) {
  padding: 0;
  flex: 1;
  overflow: hidden;
}

.table-container {
  height: 100%;
  overflow: hidden;
}

.api-config-table {
  height: 100%;
}

.api-config-table :deep(.n-data-table) {
  border-radius: 0;
  height: 100%;
}

.api-config-table :deep(.n-data-table-base-table) {
  height: 100%;
}

/* 高级搜索面板样式 */
.n-collapse :deep(.n-collapse-item__header) {
  padding: 12px 0;
  font-weight: 500;
}

.n-collapse :deep(.n-collapse-item__content-wrapper) {
  padding: 16px 0;
}

/* 统计信息样式 */
.n-statistic {
  text-align: center;
}

.n-statistic :deep(.n-statistic-value) {
  font-size: 18px;
  font-weight: 600;
  color: var(--n-text-color);
}

.n-statistic :deep(.n-statistic-label) {
  font-size: 12px;
  color: var(--n-text-color-2);
  margin-bottom: 4px;
}

/* 表格行悬停效果 */
:deep(.n-data-table-tbody .n-data-table-tr:hover) {
  background-color: var(--n-table-color-hover);
}

/* 操作按钮组样式 */
.flex-center {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .search-toolbar {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }

  .action-section {
    display: flex;
    justify-content: center;
  }

  .table-card :deep(.n-card-header) {
    padding: 12px 16px;
  }

  .n-statistic :deep(.n-statistic-value) {
    font-size: 16px;
  }

  .flex-center {
    gap: 4px;
  }

  .flex-center .n-button {
    padding: 0 8px;
    font-size: 12px;
  }

  .api-config-table {
    font-size: 12px;
  }
}

/* 加载状态样式 */
.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
}



/* 高级搜索动画 */
.n-collapse :deep(.n-collapse-item__content-wrapper) {
  transition: all 0.3s ease;
}

/* 表格选中行样式 */
:deep(.n-data-table-tbody .n-data-table-tr--checked) {
  background-color: var(--n-primary-color-suppl);
}

/* 标签样式优化 */
.n-tag {
  font-weight: 500;
}

/* 代码样式 */
code {
  background: var(--n-code-color);
  padding: 2px 6px;
  border-radius: 3px;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 13px;
}
</style>
