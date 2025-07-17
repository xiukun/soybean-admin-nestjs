<template>
  <div class="min-h-500px flex-col-stretch gap-16px overflow-hidden lt-sm:overflow-auto">
    <NCard :title="$t('page.lowcode.field.title')" :bordered="false" size="small" class="sm:flex-1-hidden card-wrapper">
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
    <FieldOperateDrawer
      v-model:visible="drawerVisible"
      :operate-type="operateType"
      :row-data="editingData"
      :entity-id="entityId"
      @submitted="getData"
    />
  </div>
</template>

<script setup lang="tsx">
import { reactive, ref, watch } from 'vue';
import type { Ref } from 'vue';
import { NButton, NPopconfirm, NSpace, NTag } from 'naive-ui';
import type { DataTableColumns, PaginationProps } from 'naive-ui';
import { fetchDeleteField, fetchGetFieldList, fetchMoveField } from '@/service/api';
import { $t } from '@/locales';
import { useAppStore } from '@/store/modules/app';
import { useTable, useTableOperate } from '@/hooks/common/table';
import { enableStatusRecord, enableStatusTag } from '@/constants/business';
import FieldOperateDrawer from './modules/field-operate-drawer.vue';
import TableHeaderOperation from '@/components/advanced/table-header-operation.vue';

const appStore = useAppStore();

const props = defineProps<{
  entityId: string;
}>();

const {
  columns,
  columnChecks,
  data,
  loading,
  getData,
  mobilePagination,
  searchParams,
  resetSearchParams
} = useTable({
  apiFn: () => fetchGetFieldList(props.entityId),
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
      key: 'order',
      title: $t('page.lowcode.field.order'),
      align: 'center',
      width: 80,
      render: (row, index) => {
        return (
          <NSpace justify="center">
            <span>{index + 1}</span>
            <NSpace vertical size={2}>
              <NButton
                size="tiny"
                type="primary"
                text
                disabled={index === 0}
                onClick={() => handleMoveField(row.id, 'up')}
              >
                ↑
              </NButton>
              <NButton
                size="tiny"
                type="primary"
                text
                disabled={index === data.value.length - 1}
                onClick={() => handleMoveField(row.id, 'down')}
              >
                ↓
              </NButton>
            </NSpace>
          </NSpace>
        );
      }
    },
    {
      key: 'name',
      title: $t('page.lowcode.field.name'),
      align: 'center',
      minWidth: 100
    },
    {
      key: 'code',
      title: $t('page.lowcode.field.code'),
      align: 'center',
      width: 120,
      render: row => <code>{row.code}</code>
    },
    {
      key: 'type',
      title: $t('page.lowcode.field.type'),
      align: 'center',
      width: 120,
      render: row => {
        let typeDisplay = row.type;
        if (row.length && ['VARCHAR', 'CHAR'].includes(row.type)) {
          typeDisplay += `(${row.length})`;
        } else if (row.precision && row.scale && row.type === 'DECIMAL') {
          typeDisplay += `(${row.precision},${row.scale})`;
        }
        return <NTag type="info">{typeDisplay}</NTag>;
      }
    },
    {
      key: 'attributes',
      title: $t('page.lowcode.field.attributes'),
      align: 'center',
      width: 200,
      render: row => {
        const attributes = [];
        if (row.primaryKey) attributes.push(<NTag type="error" size="small">PK</NTag>);
        if (row.unique) attributes.push(<NTag type="warning" size="small">UK</NTag>);
        if (row.autoIncrement) attributes.push(<NTag type="success" size="small">AI</NTag>);
        if (!row.nullable) attributes.push(<NTag type="info" size="small">NN</NTag>);
        return <NSpace>{attributes}</NSpace>;
      }
    },
    {
      key: 'defaultValue',
      title: $t('page.lowcode.field.defaultValue'),
      align: 'center',
      width: 100,
      render: row => row.defaultValue ? <code>{String(row.defaultValue)}</code> : '-'
    },
    {
      key: 'comment',
      title: $t('page.lowcode.field.comment'),
      align: 'center',
      minWidth: 150,
      ellipsis: {
        tooltip: true
      }
    },
    {
      key: 'operate',
      title: $t('common.operate'),
      align: 'center',
      width: 130,
      render: row => (
        <div class="flex-center gap-8px">
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
  await fetchDeleteField(id);
  await getData();
}

async function handleBatchDelete() {
  await Promise.all(checkedRowKeys.value.map(id => fetchDeleteField(id)));
  onBatchDeleted();
}

async function handleMoveField(id: string, direction: 'up' | 'down') {
  await fetchMoveField(id, direction);
  await getData();
}

// Watch for entityId changes
watch(() => props.entityId, () => {
  if (props.entityId) {
    getData();
  }
}, { immediate: true });
</script>

<style scoped></style>
