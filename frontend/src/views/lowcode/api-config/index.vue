<template>
  <div class="min-h-500px flex-col-stretch gap-16px overflow-hidden lt-sm:overflow-auto">
    <ApiConfigSearch v-model:model="searchParams" @reset="resetSearchParams" @search="getDataByPage" />
    <NCard :title="$t('page.lowcode.apiConfig.title')" :bordered="false" size="small" class="sm:flex-1-hidden card-wrapper">
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
    <ApiConfigOperateDrawer
      v-model:visible="drawerVisible"
      :operate-type="operateType"
      :row-data="editingData"
      :project-id="projectId"
      @submitted="getDataByPage"
    />
  </div>
</template>

<script setup lang="tsx">
import { reactive, ref, watch } from 'vue';
import type { Ref } from 'vue';
import { NButton, NPopconfirm, NSpace, NTag } from 'naive-ui';
import type { DataTableColumns, PaginationProps } from 'naive-ui';
import { fetchDeleteApiConfig, fetchGetApiConfigList, fetchTestApiConfig } from '@/service/api';
import { $t } from '@/locales';
import { useAppStore } from '@/store/modules/app';
import { useTable, useTableOperate } from '@/hooks/common/table';
import { enableStatusRecord, enableStatusTag } from '@/constants/business';
import ApiConfigOperateDrawer from './modules/api-config-operate-drawer.vue';
import ApiConfigSearch from './modules/api-config-search.vue';
import TableHeaderOperation from '@/components/advanced/table-header-operation.vue';

const appStore = useAppStore();

const props = defineProps<{
  projectId: string;
}>();

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
  apiFn: fetchGetApiConfigList,
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
      render: row => <code>{row.path}</code>
    },
    {
      key: 'method',
      title: $t('page.lowcode.apiConfig.method'),
      align: 'center',
      width: 80,
      render: row => {
        const methodMap: Record<Api.Lowcode.HttpMethod, NaiveUI.ThemeColor> = {
          GET: 'info',
          POST: 'success',
          PUT: 'warning',
          DELETE: 'error'
        };
        return <NTag type={methodMap[row.method]}>{row.method}</NTag>;
      }
    },
    {
      key: 'entityId',
      title: $t('page.lowcode.apiConfig.entity'),
      align: 'center',
      width: 120,
      render: row => row.entityId ? <NTag type="info">关联实体</NTag> : '-'
    },
    {
      key: 'authRequired',
      title: $t('page.lowcode.apiConfig.authRequired'),
      align: 'center',
      width: 80,
      render: row => (
        <NTag type={row.authRequired ? 'error' : 'success'}>
          {row.authRequired ? $t('common.yes') : $t('common.no')}
        </NTag>
      )
    },
    {
      key: 'status',
      title: $t('common.status'),
      align: 'center',
      width: 100,
      render: row => {
        const tagMap: Record<Api.Lowcode.ApiConfigStatus, NaiveUI.ThemeColor> = {
          ACTIVE: 'success',
          INACTIVE: 'warning'
        };
        
        const label = $t(`page.lowcode.apiConfig.status.${row.status}`);
        return <NTag type={tagMap[row.status]}>{label}</NTag>;
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
      title: $t('common.createTime'),
      align: 'center',
      width: 180,
      render: row => new Date(row.createdAt).toLocaleString()
    },
    {
      key: 'operate',
      title: $t('common.operate'),
      align: 'center',
      width: 180,
      render: row => (
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

<style scoped></style>
