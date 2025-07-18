<template>
  <div class="min-h-500px flex-col-stretch gap-16px overflow-hidden lt-sm:overflow-auto">
    <RelationshipSearch v-model:model="searchParams" @reset="resetSearchParams" @search="getTableData" />
    <NCard :title="$t('page.lowcode.relationship.title')" :bordered="false" size="small" class="sm:flex-1-hidden card-wrapper">
      <template #header-extra>
        <TableHeaderOperation
          v-model:columns="columnChecks"
          :disabled-delete="checkedRowKeys.length === 0"
          :loading="loading"
          @add="openDrawer('add')"
          @delete="handleBatchDelete"
          @refresh="getTableData"
        />
      </template>
      <NDataTable
        v-model:checked-row-keys="checkedRowKeys"
        :columns="columns"
        :data="data"
        size="small"
        :flex-height="!appStore.isMobile"
        :scroll-x="1200"
        :loading="loading"
        remote
        :row-key="row => row.id"
        :pagination="mobilePagination"
        class="sm:h-full"
      />
      <RelationshipOperateDrawer
        v-model:visible="drawerVisible"
        :operate-type="operateType"
        :row-data="editingData"
        :project-id="projectId"
        @submitted="getTableData"
      />
    </NCard>
  </div>
</template>

<script setup lang="tsx">
import { reactive, ref, watch } from 'vue';
import type { Ref } from 'vue';
import { NButton, NPopconfirm, NSpace, NTag } from 'naive-ui';
import type { DataTableColumns, PaginationProps } from 'naive-ui';
import { fetchDeleteRelationship, fetchGetRelationshipList } from '@/service/api';
import { $t } from '@/locales';
import { useAppStore } from '@/store/modules/app';
import { useTable, useTableOperate } from '@/hooks/common/table';
import RelationshipOperateDrawer from './modules/relationship-operate-drawer.vue';
import RelationshipSearch from './modules/relationship-search.vue';
import TableHeaderOperation from '@/components/advanced/table-header-operation.vue';

const appStore = useAppStore();

interface Props {
  projectId: string;
}

const props = defineProps<Props>();

const {
  columns,
  columnChecks,
  data,
  getData,
  getDataByPage,
  loading,
  mobilePagination,
  searchParams,
  resetSearchParams
} = useTable({
  apiFn: fetchGetRelationshipList,
  apiParams: {
    projectId: props.projectId,
    page: 1,
    limit: 10,
    type: null,
    status: null,
    search: null
  },
  columns: () => [
    {
      type: 'selection',
      align: 'center',
      width: 48
    },
    {
      key: 'index',
      title: $t('common.index'),
      align: 'center',
      width: 64
    },
    {
      key: 'name',
      title: $t('page.lowcode.relationship.name'),
      align: 'center',
      minWidth: 120
    },
    {
      key: 'code',
      title: $t('page.lowcode.relationship.code'),
      align: 'center',
      minWidth: 120
    },
    {
      key: 'type',
      title: $t('page.lowcode.relationship.typeLabel'),
      align: 'center',
      width: 120,
      render: row => {
        const typeMap: Record<string, { label: string; color: string }> = {
          ONE_TO_ONE: { label: $t('page.lowcode.relationship.type.oneToOne'), color: 'info' },
          ONE_TO_MANY: { label: $t('page.lowcode.relationship.type.oneToMany'), color: 'success' },
          MANY_TO_ONE: { label: $t('page.lowcode.relationship.type.manyToOne'), color: 'warning' },
          MANY_TO_MANY: { label: $t('page.lowcode.relationship.type.manyToMany'), color: 'error' }
        };

        const typeInfo = typeMap[row.type];
        return typeInfo ? <NTag type={typeInfo.color as any}>{typeInfo.label}</NTag> : row.type;
      }
    },
    {
      key: 'sourceEntity',
      title: $t('page.lowcode.relationship.sourceEntity'),
      align: 'center',
      minWidth: 120,
      render: row => row.sourceEntity?.name || row.sourceEntityId
    },
    {
      key: 'targetEntity',
      title: $t('page.lowcode.relationship.targetEntity'),
      align: 'center',
      minWidth: 120,
      render: row => row.targetEntity?.name || row.targetEntityId
    },
    {
      key: 'description',
      title: $t('page.lowcode.relationship.description'),
      align: 'center',
      minWidth: 150,
      ellipsis: {
        tooltip: true
      }
    },
    {
      key: 'status',
      title: $t('common.status'),
      align: 'center',
      width: 100,
      render: row => {
        if (row.status === null) {
          return null;
        }

        const tagMap: Record<Api.Common.EnableStatus, NaiveUI.ThemeColor> = {
          ACTIVE: 'success',
          INACTIVE: 'error'
        };

        const label = $t(`page.lowcode.relationship.status.${row.status}`);

        return <NTag type={tagMap[row.status]}>{label}</NTag>;
      }
    },
    {
      key: 'createdAt',
      title: $t('common.createTime'),
      align: 'center',
      width: 180,
      render: row => {
        return new Date(row.createdAt).toLocaleString();
      }
    },
    {
      key: 'operate',
      title: $t('common.operate'),
      align: 'center',
      width: 130,
      render: row => (
        <NSpace justify={'center'}>
          <NButton size={'small'} type={'primary'} onClick={() => handleEdit(row.id)}>
            {$t('common.edit')}
          </NButton>
          <NPopconfirm onPositiveClick={() => handleDelete(row.id)}>
            {{
              default: () => $t('common.confirmDelete'),
              trigger: () => (
                <NButton size={'small'} type={'error'}>
                  {$t('common.delete')}
                </NButton>
              )
            }}
          </NPopconfirm>
        </NSpace>
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
  onBatchDeleted,
  onDeleted
  // closeDrawer
} = useTableOperate(data, getData);

async function handleBatchDelete() {
  // NaiveUI的 data-table 组件的 checked-row-keys 类型是 DataTableRowKey[]
  // 但实际上这里的 keys 是 string[]，因为我们设置了 row-key="row => row.id"
  const keys = checkedRowKeys.value as string[];

  await Promise.all(keys.map(key => fetchDeleteRelationship(key)));

  onBatchDeleted();
}

async function handleDelete(id: string) {
  await fetchDeleteRelationship(id);
  onDeleted();
}

function openDrawer(operateType: AnyObject.OperateType) {
  handleAdd();
}

function getTableData() {
  getData();
}

// 监听项目ID变化，重新获取数据
watch(
  () => props.projectId,
  () => {
    if (props.projectId) {
      searchParams.projectId = props.projectId;
      getTableData();
    }
  },
  { immediate: true }
);
</script>

<style scoped></style>
