<template>
  <div class="min-h-500px flex-col-stretch gap-16px overflow-hidden lt-sm:overflow-auto">
    <!-- 项目选择器 (仅在没有传入projectId时显示) -->
    <NCard v-if="!props.projectId" title="项目选择" :bordered="false" size="small">
      <NSelect
        v-model:value="selectedProjectId"
        :options="projectOptions"
        :loading="projectLoading"
        placeholder="请选择项目"
        clearable
        @update:value="getDataByPage"
      />
    </NCard>

    <QuerySearch v-model:model="searchParams" @reset="resetSearchParams" @search="getDataByPage" />
    <NCard :title="$t('page.lowcode.query.title')" :bordered="false" size="small" class="sm:flex-1-hidden card-wrapper">
      <template #header-extra>
        <TableHeaderOperation
          v-model:columns="columnChecks"
          :disabled-delete="checkedRowKeys.length === 0"
          :loading="loading"
          @add="handleAdd"
          @delete="handleBatchDelete"
          @refresh="getData"
        />
      </template>
      <NDataTable
        v-model:checked-row-keys="checkedRowKeys"
        :columns="columns"
        :data="data"
        size="small"
        :flex-height="!appStore.isMobile"
        :scroll-x="962"
        :loading="loading"
        remote
        :row-key="row => row.id"
        :pagination="mobilePagination"
        class="sm:h-full"
      />
    </NCard>
    <QueryOperateDrawer
      v-model:visible="drawerVisible"
      :operate-type="operateType"
      :row-data="editingData"
      :project-id="projectId"
      @submitted="getDataByPage"
    />
    <QueryResultModal
      v-model:visible="resultModalVisible"
      :data="modalData"
      :query-name="queryResult?.query?.name || ''"
      :execute-time="queryResult?.query?.executeTime || 0"
      :loading="resultLoading"
      :error="queryResult?.error"
    />
  </div>
</template>

<script setup lang="tsx">
import { computed, ref, watch } from 'vue';
import { NButton, NCard, NPopconfirm, NSelect, NTag } from 'naive-ui';
import { fetchDeleteQuery, fetchGetQueryList, fetchExecuteQuery, fetchGetAllProjects } from '@/service/api';
import { $t } from '@/locales';
import { useAppStore } from '@/store/modules/app';
import { useTable, useTableOperate } from '@/hooks/common/table';
import QueryOperateDrawer from './modules/query-operate-drawer.vue';
import QuerySearch from './modules/query-search.vue';
import QueryResultModal from './modules/query-result-modal.vue';
import TableHeaderOperation from '@/components/advanced/table-header-operation.vue';

const appStore = useAppStore();

interface Props {
  projectId?: string;
}

const props = withDefaults(defineProps<Props>(), {
  projectId: ''
});

const resultModalVisible = ref(false);
const queryResult = ref<any>(null);
const resultLoading = ref(false);

// 计算属性确保数据类型正确
const modalData = computed(() => {
  const result = queryResult.value;
  if (!result) return [];

  // 如果 result 本身就是数组，直接返回
  if (Array.isArray(result)) return result;

  // 如果 result 有 data 属性且是数组，返回 data
  if (result.data && Array.isArray(result.data)) return result.data;

  // 其他情况返回空数组
  return [];
});

// 项目选择相关状态
const selectedProjectId = ref<string>(props.projectId || '');
const projectOptions = ref<Array<{ label: string; value: string }>>([]);
const projectLoading = ref(false);

// 当前有效的项目ID
const currentProjectId = computed(() => props.projectId || selectedProjectId.value);

// 创建适配器函数来处理API调用
const queryApiAdapter = async (params: any) => {
  const projectId = currentProjectId.value;
  if (!projectId || projectId === 'undefined' || projectId === '[object Object]') {
    return {
      data: {
        records: [],
        current: 1,
        size: 10,
        total: 0
      },
      error: null,
      response: {} as any
    };
  }
  return await fetchGetQueryList(projectId, params);
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
  apiFn: queryApiAdapter,
  showTotal: true,
  apiParams: {
    current: 1,
    size: 10
  },
  columns: () => [
    {
      type: 'selection',
      align: 'center',
      width: 48
    },
    {
      key: 'name',
      title: $t('page.lowcode.query.name'),
      align: 'center',
      minWidth: 120
    },
    {
      key: 'baseEntityId' as any,
      title: $t('page.lowcode.query.baseEntity'),
      align: 'center',
      width: 120,
      render: (row: any) => row.baseEntity?.name || row.baseEntityId || '-'
    },
    {
      key: 'joins' as any,
      title: $t('page.lowcode.query.joinCount'),
      align: 'center',
      width: 80,
      render: (row: any) => row.joins?.length || 0
    },
    {
      key: 'fields' as any,
      title: $t('page.lowcode.query.fieldCount'),
      align: 'center',
      width: 80,
      render: (row: any) => row.fields?.length || 0
    },
    {
      key: 'filters' as any,
      title: $t('page.lowcode.query.filterCount'),
      align: 'center',
      width: 80,
      render: (row: any) => row.filters?.length || 0
    },
    {
      key: 'status',
      title: $t('common.status'),
      align: 'center',
      width: 100,
      render: row => {
        const tagMap: Record<string, NaiveUI.ThemeColor> = {
          DRAFT: 'warning',
          PUBLISHED: 'success',
          DEPRECATED: 'error'
        };

        const statusKey = `page.lowcode.query.status.${row.status}`;
        const label = $t(statusKey as any) || row.status;
        return <NTag type={tagMap[row.status] || 'default'}>{label}</NTag>;
      }
    },
    {
      key: 'executionStats',
      title: $t('page.lowcode.query.lastExecuted'),
      align: 'center',
      width: 150,
      render: row => {
        if (row.executionStats?.lastExecuted) {
          return new Date(row.executionStats.lastExecuted).toLocaleString();
        }
        return '-';
      }
    },
    {
      key: 'description',
      title: $t('page.lowcode.query.description'),
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
      render: row => new Date(row.createdAt).toLocaleString()
    },
    {
      key: 'operate',
      title: $t('common.operate'),
      align: 'center',
      width: 200,
      render: row => (
        <div class="flex-center gap-8px">
          <NButton type="info" ghost size="small" onClick={() => handleExecute(row.id)}>
            {$t('page.lowcode.query.execute')}
          </NButton>
          <NButton type="primary" ghost size="small" onClick={() => handleEdit(row.id)}>
            {$t('common.edit')}
          </NButton>
          <NPopconfirm onPositiveClick={() => handleDelete(row.id)}>
            {{
              default: () => $t('common.confirmDelete'),
              trigger: () => (
                <NButton type="error" ghost size="small">
                  {$t('common.delete')}
                </NButton>
              )
            }}
          </NPopconfirm>
        </div>
      )
    }
  ]
});

const {
  drawerVisible,
  operateType,
  editingData,
  handleAdd,
  handleEdit,
  checkedRowKeys,
  onBatchDeleted
} = useTableOperate(data as any, getData);

async function handleDelete(id: string) {
  await fetchDeleteQuery(id);
  await getDataByPage();
}

async function handleBatchDelete() {
  await Promise.all(checkedRowKeys.value.map(id => fetchDeleteQuery(id)));
  onBatchDeleted();
}

async function handleExecute(id: string) {
  try {
    resultLoading.value = true;
    resultModalVisible.value = true;
    queryResult.value = null; // 清空之前的结果

    const startTime = Date.now();
    const result = await fetchExecuteQuery(id);
    const endTime = Date.now();

    // 添加执行时间到结果中
    if (result && typeof result === 'object' && 'query' in result && result.query) {
      (result as any).query.executeTime = endTime - startTime;
    }

    queryResult.value = result;

    window.$message?.success($t('page.lowcode.query.executeSuccess'));
  } catch (error: any) {
    // 设置错误状态，让弹窗显示错误信息
    queryResult.value = {
      data: [],
      query: null,
      error: error?.message || $t('page.lowcode.query.executeFailed')
    };
    window.$message?.error($t('page.lowcode.query.executeFailed'));
    console.error('Query execution error:', error);
  } finally {
    resultLoading.value = false;
  }
}



// 加载项目列表
async function loadProjects() {
  if (props.projectId) return; // 如果已有projectId，不需要加载项目列表

  try {
    projectLoading.value = true;
    const response = await fetchGetAllProjects();
    if (response.data) {
      projectOptions.value = response.data.map((project: any) => ({
        label: `${project.name} (${project.code})`,
        value: project.id
      }));

      // 如果只有一个项目，自动选择
      if (projectOptions.value.length === 1) {
        selectedProjectId.value = projectOptions.value[0].value;
      }
    }
  } catch (error) {
    console.error('Failed to load projects:', error);
  } finally {
    projectLoading.value = false;
  }
}

// Watch for projectId changes
watch(() => currentProjectId.value, () => {
  if (currentProjectId.value) {
    (searchParams as any).projectId = currentProjectId.value;
    getDataByPage();
  }
}, { immediate: true });

// 初始化时加载项目列表
loadProjects();
</script>

<style scoped></style>
