<template>
  <div class="min-h-500px flex-col-stretch gap-16px overflow-hidden lt-sm:overflow-auto">
    <ProjectSearch v-model:model="searchParams" @reset="resetSearchParams" @search="getTableData" />
    <NCard :title="$t('page.lowcode.project.title')" :bordered="false" size="small" class="sm:flex-1-hidden card-wrapper">
      <template #header-extra>
        <TableHeaderOperation
          v-model:columns="columnChecks"
          :disabled-delete="checkedRowKeys.length === 0"
          :loading="loading"
          @add="openDrawer('add')"
          @delete="handleBatchDelete"
          @refresh="getTableData"
        >
          <template #prefix>
            <NSpace>
              <NButton
                v-if="checkedRowKeys.length > 0"
                size="small"
                type="warning"
                @click="handleBatchDeactivate"
              >
                批量禁用
              </NButton>
            </NSpace>
          </template>
        </TableHeaderOperation>
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
      <ProjectOperateDrawer
        v-model:visible="drawerVisible"
        :operate-type="operateType"
        :row-data="editingData"
        @submitted="getTableData"
      />
    </NCard>
  </div>
</template>

<script setup lang="tsx">
import { NButton, NPopconfirm, NSpace, NTag } from 'naive-ui';
import { fetchDeleteProject, fetchGetProjectList, fetchUpdateProjectStatus } from '@/service/api';
import { $t } from '@/locales';
import { useAppStore } from '@/store/modules/app';
import { useTable, useTableOperate } from '@/hooks/common/table';
import ProjectOperateDrawer from './modules/project-operate-drawer.vue';
import ProjectSearch from './modules/project-search.vue';
import TableHeaderOperation from '@/components/advanced/table-header-operation.vue';

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
  apiFn: fetchGetProjectList,
  apiParams: {
    current: 1,
    size: 10,
    status: null,
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
      title: $t('page.lowcode.project.name'),
      align: 'center',
      minWidth: 100
    },
    {
      key: 'code',
      title: $t('page.lowcode.project.code'),
      align: 'center',
      minWidth: 120
    },
    {
      key: 'description',
      title: $t('page.lowcode.project.description'),
      align: 'center',
      minWidth: 150
    },
    {
      key: 'version',
      title: $t('page.lowcode.project.version'),
      align: 'center',
      width: 100
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

        const tagMap: Record<Api.Common.ObjectEnableStatus, NaiveUI.ThemeColor> = {
          ACTIVE: 'success',
          INACTIVE: 'warning',
          ARCHIVED: 'error'
        };

        const label = $t(`page.lowcode.project.status.${row.status}`);

        return <NTag type={tagMap[row.status]}>{label}</NTag>;
      }
    },
    {
      key: 'createdAt',
      title: $t('common.createdAt'),
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
      width: 200,
      render: row => (
        <NSpace justify={'center'}>
          <NButton size={'small'} type={'primary'} onClick={() => handleEdit(row.id)}>
            {$t('common.edit')}
          </NButton>
          <NButton
            size={'small'}
            type={row.status === 'ACTIVE' ? 'warning' : 'success'}
            onClick={() => handleToggleStatus(row.id, row.status)}
          >
            {row.status === 'ACTIVE' ? '禁用' : '启用'}
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
} = useTableOperate(data as any, getData);

async function handleBatchDelete() {
  // NaiveUI的 data-table 组件的 checked-row-keys 类型是 DataTableRowKey[]
  // 但实际上这里的 keys 是 string[]，因为我们设置了 row-key="row => row.id"
  const keys = checkedRowKeys.value as string[];

  // 检查是否有活跃状态的项目
  const selectedProjects = data.value.filter(project => keys.includes(project.id));
  const activeProjects = selectedProjects.filter(project => project.status === 'ACTIVE');

  if (activeProjects.length > 0) {
    const activeProjectNames = activeProjects.map(p => p.name).join('、');
    window.$dialog?.warning({
      title: '无法删除活跃项目',
      content: `以下项目处于活跃状态，无法直接删除：${activeProjectNames}。`,
      positiveText: '先禁用再删除',
      negativeText: '取消',
      onPositiveClick: async () => {
        // 先禁用活跃项目
        await Promise.all(activeProjects.map(project =>
          fetchUpdateProjectStatus(project.id, { status: 'INACTIVE' })
        ));
        // 然后删除所有选中的项目
        await Promise.all(keys.map(key => fetchDeleteProject(key)));
        onBatchDeleted();
      }
    });
    return;
  }

  try {
    await Promise.all(keys.map(key => fetchDeleteProject(key)));
    onBatchDeleted();
    // window.$message?.success('删除成功');
  } catch (error) {
    // 错误处理已在 service 层处理
  }
}

async function handleDelete(id: string) {
  // 检查项目状态
  const project = data.value.find(p => p.id === id);
  if (project && project.status === 'ACTIVE') {
    window.$dialog?.warning({
      title: '无法删除活跃项目',
      content: `项目"${project.name}"处于活跃状态，无法直接删除。`,
      positiveText: '先禁用再删除',
      negativeText: '取消',
      onPositiveClick: async () => {
        // 先禁用项目
        await fetchUpdateProjectStatus(id, { status: 'INACTIVE' });
        // 然后删除项目
        await fetchDeleteProject(id);
        onDeleted();
        // window.$message?.success('删除成功');
      }
    });
    return;
  }

  try {
    await fetchDeleteProject(id);
    onDeleted();
    // window.$message?.success('删除成功');
  } catch (error) {
    // 错误处理已在 service 层处理
  }
}

async function handleToggleStatus(id: string, currentStatus: string) {
  const newStatus = currentStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
  await fetchUpdateProjectStatus(id, { status: newStatus });
  getTableData();
  window.$message?.success($t('common.updateSuccess'));
}

async function handleBatchDeactivate() {
  const keys = checkedRowKeys.value as string[];
  const selectedProjects = data.value.filter(project => keys.includes(project.id));
  const activeProjects = selectedProjects.filter(project => project.status === 'ACTIVE');

  if (activeProjects.length === 0) {
    window.$message?.info('所选项目中没有活跃状态的项目');
    return;
  }

  try {
    await Promise.all(activeProjects.map(project =>
      fetchUpdateProjectStatus(project.id, { status: 'INACTIVE' })
    ));
    getTableData();
    window.$message?.success(`成功禁用 ${activeProjects.length} 个项目`);
  } catch (error) {
    // 错误处理已在 service 层处理
  }
}

function openDrawer(operateType: NaiveUI.TableOperateType) {
  handleAdd();
}

function getTableData() {
  getData();
}

// 初始化数据
getTableData();
</script>

<style scoped></style>
