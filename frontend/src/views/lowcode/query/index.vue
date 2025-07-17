<template>
  <div class="min-h-500px flex-col-stretch gap-16px overflow-hidden lt-sm:overflow-auto">
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
      :query-result="queryResult"
      :loading="resultLoading"
    />
  </div>
</template>

<script setup lang="tsx">
import { reactive, ref, watch } from 'vue';
import type { Ref } from 'vue';
import { NButton, NPopconfirm, NSpace, NTag } from 'naive-ui';
import type { DataTableColumns, PaginationProps } from 'naive-ui';
import { fetchDeleteQuery, fetchGetQueryList, fetchExecuteQuery } from '@/service/api';
import { $t } from '@/locales';
import { useAppStore } from '@/store/modules/app';
import { useTable, useTableOperate } from '@/hooks/common/table';
import { enableStatusRecord, enableStatusTag } from '@/constants/business';
import QueryOperateDrawer from './modules/query-operate-drawer.vue';
import QuerySearch from './modules/query-search.vue';
import QueryResultModal from './modules/query-result-modal.vue';
import TableHeaderOperation from '@/components/advanced/table-header-operation.vue';

const appStore = useAppStore();

const props = defineProps<{
  projectId: string;
}>();

const resultModalVisible = ref(false);
const queryResult = ref<any>(null);
const resultLoading = ref(false);

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
  apiFn: fetchGetQueryList,
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
      title: $t('page.lowcode.query.name'),
      align: 'center',
      minWidth: 120
    },
    {
      key: 'baseEntity',
      title: $t('page.lowcode.query.baseEntity'),
      align: 'center',
      width: 120,
      render: row => row.baseEntity?.name || '-'
    },
    {
      key: 'joinCount',
      title: $t('page.lowcode.query.joinCount'),
      align: 'center',
      width: 80,
      render: row => row.joins?.length || 0
    },
    {
      key: 'fieldCount',
      title: $t('page.lowcode.query.fieldCount'),
      align: 'center',
      width: 80,
      render: row => row.fields?.length || 0
    },
    {
      key: 'filterCount',
      title: $t('page.lowcode.query.filterCount'),
      align: 'center',
      width: 80,
      render: row => row.filters?.length || 0
    },
    {
      key: 'status',
      title: $t('common.status'),
      align: 'center',
      width: 100,
      render: row => {
        const tagMap: Record<string, NaiveUI.ThemeColor> = {
          DRAFT: 'warning',
          ACTIVE: 'success',
          INACTIVE: 'default'
        };
        
        const label = $t(`page.lowcode.query.status.${row.status}`);
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
      title: $t('common.createTime'),
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
} = useTableOperate(data, getData);

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
    
    const result = await fetchExecuteQuery(id);
    queryResult.value = result;
    
    window.$message?.success($t('page.lowcode.query.executeSuccess'));
  } catch (error) {
    window.$message?.error($t('page.lowcode.query.executeFailed'));
    console.error('Query execution error:', error);
  } finally {
    resultLoading.value = false;
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

<style scoped></style>
