<script setup lang="tsx">
import { NButton, NPopconfirm, NTag } from 'naive-ui';
import { enableStatusRecord } from '@/constants/business';
import { fetchDeleteLowcodePage, fetchGetLowcodePageList } from '@/service/api';
import { useAppStore } from '@/store/modules/app';
import { useTable, useTableOperate } from '@/hooks/common/table';
import { $t } from '@/locales';
import LowcodePageOperateDrawer from './modules/lowcode-page-operate-drawer.vue';
import LowcodePageSearch from './modules/lowcode-page-search.vue';

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
  apiFn: fetchGetLowcodePageList as NaiveUI.TableApiFn<Api.LowcodePage.Page, Api.LowcodePage.PageSearchParams>,
  apiParams: {
    current: 1,
    size: 10,
    name: null,
    status: null
  } as unknown as Api.LowcodePage.PageSearchParams,
  columns: (): NaiveUI.TableColumn<Api.LowcodePage.Page>[] => [
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
      title: $t('page.lowcode.page.name'),
      align: 'center',
      minWidth: 100
    },
    {
      key: 'title',
      title: $t('page.lowcode.page.title'),
      align: 'center',
      minWidth: 100
    },
    {
      key: 'code',
      title: $t('page.lowcode.page.code'),
      align: 'center',
      minWidth: 100
    },
    {
      key: 'path',
      title: $t('page.lowcode.page.path'),
      align: 'center',
      minWidth: 120
    },
    {
      key: 'status',
      title: $t('common.status' as App.I18n.I18nKey),
      align: 'center',
      width: 100,
      render: (row: Api.LowcodePage.Page) => {
        if (row.status === null) {
          return null;
        }

        const tagMap = {
          ENABLED: 'success' as NaiveUI.ThemeColor,
          DISABLED: 'warning' as NaiveUI.ThemeColor
        };

        const label = $t(enableStatusRecord[row.status] as App.I18n.I18nKey);

        return <NTag type={tagMap[row.status]}>{label}</NTag>;
      }
    },
    {
      key: 'createdAt',
      title: $t('common.createdAt' as App.I18n.I18nKey),
      align: 'center',
      width: 180,
      render: (row: Api.LowcodePage.Page) => {
        return new Date(row.createdAt).toLocaleString();
      }
    },
    {
      key: 'operate',
      title: $t('common.operate'),
      align: 'center',
      width: 130,
      render: (row: Api.LowcodePage.Page) => {
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
  await fetchDeleteLowcodePage(id);
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
    <LowcodePageSearch v-model:model="searchParams" @reset="resetSearchParams" @search="getTableData" />
    <NCard :title="$t('page.lowcode.page.title')" :bordered="false" size="small" class="sm:flex-1-hidden card-wrapper">
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
      <LowcodePageOperateDrawer
        v-model:visible="drawerVisible"
        :operate-type="operateType"
        :row-data="editingData"
        @submitted="getTableData"
      />
    </NCard>
  </div>
</template>

<style scoped></style>
