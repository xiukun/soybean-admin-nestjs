<script setup lang="tsx">
import { NButton, NPopconfirm, NTag } from 'naive-ui';
import { enableStatusRecord } from '@/constants/business';
import { fetchDeleteLowcodeModel, fetchGetLowcodeModelList } from '@/service/api';
import { useAppStore } from '@/store/modules/app';
import { useTable, useTableOperate } from '@/hooks/common/table';
import { $t } from '@/locales';
import LowcodeModelOperateDrawer from './modules/lowcode-model-operate-drawer.vue';
import LowcodeModelSearch from './modules/lowcode-model-search.vue';

// 注意：handleEdit会在useTableOperate中定义

const appStore = useAppStore();

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
  apiFn: fetchGetLowcodeModelList as NaiveUI.TableApiFn<Api.LowcodeModel.Model, Api.LowcodeModel.ModelSearchParams>,
  apiParams: {
    current: 1,
    size: 10,
    name: null,
    status: null,
    withRelations: false
  } as unknown as Api.LowcodeModel.ModelSearchParams,
  columns: (): NaiveUI.TableColumn<Api.LowcodeModel.Model>[] => [
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
      title: $t('page.lowcode.model.name'),
      align: 'center',
      minWidth: 100
    },
    {
      key: 'code',
      title: $t('page.lowcode.model.code'),
      align: 'center',
      minWidth: 100
    },
    {
      key: 'tableName',
      title: $t('page.lowcode.model.tableName'),
      align: 'center',
      minWidth: 120
    },
    {
      key: 'description',
      title: $t('page.lowcode.model.description' as App.I18n.I18nKey),
      align: 'center',
      minWidth: 150,
      ellipsis: {
        tooltip: true
      }
    },
    {
      key: 'status',
      title: $t('common.status' as App.I18n.I18nKey),
      align: 'center',
      width: 100,
      render: (row: Api.LowcodeModel.Model) => {
        if (row.status === null) {
          return null;
        }

        const tagMap = {
          ENABLED: 'success' as NaiveUI.ThemeColor,
          DISABLED: 'warning' as NaiveUI.ThemeColor
        };

        const label = $t(enableStatusRecord[row.status]);

        return <NTag type={tagMap[row.status]}>{label}</NTag>;
      }
    },
    {
      key: 'createdAt',
      title: $t('common.createdAt' as App.I18n.I18nKey),
      align: 'center',
      width: 180,
      render: (row: Api.LowcodeModel.Model) => {
        return new Date(row.createdAt).toLocaleString();
      }
    },
    {
      key: 'operate',
      title: $t('common.operate'),
      align: 'center',
      width: 130,
      render: (row: Api.LowcodeModel.Model) => {
        // 定义一个内部函数来处理编辑操作
        const onEdit = (id: string) => {
          // 这里会在后面使用handleEdit函数
          // 由于闭包特性，这个函数会在render执行后才被调用
          // 此时handleEdit已经定义
          // eslint-disable-next-line @typescript-eslint/no-use-before-define
          handleEdit(id);
        };

        return (
          <div class="flex-center gap-8px">
            <NButton type="primary" ghost size="small" onClick={() => onEdit(row.id)}>
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
        );
      }
    }
  ]
});

const { drawerVisible, operateType, editingData, handleAdd, handleEdit, checkedRowKeys, onBatchDeleted, onDeleted } =
  useTableOperate(data, getData);

async function handleBatchDelete() {
  // 批量删除功能
  console.log('批量删除:', checkedRowKeys.value);
  await onBatchDeleted();
}

async function handleDelete(id: string) {
  await fetchDeleteLowcodeModel(id);
  await onDeleted();
}

function getTableData() {
  getDataByPage();
}

// 初始化
getTableData();
</script>

<template>
  <div class="min-h-500px flex-col-stretch gap-16px overflow-hidden lt-sm:overflow-auto">
    <LowcodeModelSearch v-model:model="searchParams" @reset="resetSearchParams" @search="getTableData" />
    <NCard :title="$t('page.lowcode.model.title')" :bordered="false" size="small" class="sm:flex-1-hidden card-wrapper">
      <template #header-extra>
        <TableHeaderOperation
          v-model:columns="columnChecks"
          :disabled-delete="checkedRowKeys.length === 0"
          :loading="loading"
          @add="handleAdd"
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
        :scroll-x="962"
        :loading="loading"
        remote
        :row-key="row => row.id"
        :pagination="mobilePagination"
        class="sm:h-full"
      />
      <LowcodeModelOperateDrawer
        v-model:visible="drawerVisible"
        :operate-type="operateType"
        :row-data="editingData"
        @submitted="getTableData"
      />
    </NCard>
  </div>
</template>

<style scoped></style>
