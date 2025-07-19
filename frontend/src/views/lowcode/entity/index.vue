<template>
  <div class="min-h-500px flex-col-stretch gap-16px overflow-hidden lt-sm:overflow-auto">
    <!-- 项目选择器 -->
    <NCard v-if="!props.projectId" :bordered="false" size="small">
      <NSpace align="center">
        <span>选择项目：</span>
        <NSelect
          v-model:value="selectedProjectId"
          :options="projectOptions"
          placeholder="请选择项目"
          style="width: 300px"
          :loading="projectLoading"
          clearable
          @update:value="handleProjectChange"
        />
      </NSpace>
    </NCard>

    <EntitySearch v-model:model="searchParams" @reset="resetSearchParams" @search="getTableData" />
    <NCard :title="$t('page.lowcode.entity.title')" :bordered="false" size="small" class="sm:flex-1-hidden card-wrapper">
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
        :scroll-x="962"
        :loading="loading"
        remote
        :row-key="row => row.id"
        :pagination="mobilePagination"
        class="sm:h-full"
      />
      <EntityOperateDrawer
        v-model:visible="drawerVisible"
        :operate-type="operateType"
        :row-data="editingData"
        :project-id="currentProjectId"
        @submitted="getTableData"
      />
    </NCard>
  </div>
</template>

<script setup lang="tsx">
import { computed, reactive, ref, watch } from 'vue';
import type { Ref } from 'vue';
import { NButton, NCard, NPopconfirm, NSelect, NSpace, NTag } from 'naive-ui';
import type { DataTableColumns, PaginationProps } from 'naive-ui';
import { fetchDeleteEntity, fetchGetEntityList, fetchGetAllProjects } from '@/service/api';
import { $t } from '@/locales';
import { useAppStore } from '@/store/modules/app';
import { useTable, useTableOperate } from '@/hooks/common/table';
import EntityOperateDrawer from './modules/entity-operate-drawer.vue';
import EntitySearch from './modules/entity-search.vue';
import TableHeaderOperation from '@/components/advanced/table-header-operation.vue';
import { useRouter } from 'vue-router';

const appStore = useAppStore();
const router = useRouter();

interface Props {
  projectId?: string;
}

const props = withDefaults(defineProps<Props>(), {
  projectId: ''
});

// 项目选择相关状态
const selectedProjectId = ref<string>(props.projectId || '');
const projectOptions = ref<Array<{ label: string; value: string }>>([]);
const projectLoading = ref(false);

// 当前有效的项目ID
const currentProjectId = computed(() => props.projectId || selectedProjectId.value);

// Create a wrapper function for the API call
const getEntityListApi = (params: any) => {
  const projectId = currentProjectId.value;
  if (!projectId) {
    return Promise.resolve({
      records: [] as Api.Lowcode.Entity[],
      total: 0,
      current: 1,
      size: 10
    } as Api.Lowcode.EntityList);
  }
  return fetchGetEntityList({
    ...params,
    projectId
  });
};

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
  apiFn: getEntityListApi,
  apiParams: {
    current: 1,
    size: 10
  } as any,
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
      title: $t('page.lowcode.entity.name'),
      align: 'center',
      minWidth: 100
    },
    {
      key: 'code',
      title: $t('page.lowcode.entity.code'),
      align: 'center',
      minWidth: 120
    },
    {
      key: 'tableName',
      title: $t('page.lowcode.entity.tableName'),
      align: 'center',
      minWidth: 120
    },
    {
      key: 'category',
      title: $t('page.lowcode.entity.category'),
      align: 'center',
      width: 100,
      render: row => {
        const categoryMap: Record<string, NaiveUI.ThemeColor> = {
          core: 'primary',
          business: 'info',
          system: 'warning',
          config: 'success'
        };

        const label = row.category || '未知';
        return <NTag type={categoryMap[row.category] || 'default'}>{label}</NTag>;
      }
    },
    {
      key: 'description',
      title: $t('page.lowcode.entity.description'),
      align: 'center',
      minWidth: 150
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

        const tagMap: Record<Api.Lowcode.EntityStatus, NaiveUI.ThemeColor> = {
          DRAFT: 'warning',
          PUBLISHED: 'success',
          DEPRECATED: 'error'
        };

        const label = row.status || '未知';

        return <NTag type={row.status ? (tagMap[row.status] || 'default') : 'default'}>{label}</NTag>;
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
      minWidth: 160,
      render: row => (
        <NSpace justify={'center'}>
          <NButton size={'small'} type={'primary'} onClick={() => handleViewFields(row.id)}>
            字段
          </NButton>
          <NButton size={'small'} type={'primary'} onClick={() => handleEdit(row.id)}>
            {$t('common.edit')}
          </NButton>
          <NPopconfirm
            onPositiveClick={() => handleDelete(row.id)}
            v-slots={{
              default: () => $t('common.confirmDelete'),
              trigger: () => (
                <NButton size={'small'} type={'error'}>
                  {$t('common.delete')}
                </NButton>
              )
            }}
          />
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

  await Promise.all(keys.map(key => fetchDeleteEntity(key)));

  onBatchDeleted();
}

async function handleDelete(id: string) {
  await fetchDeleteEntity(id);
  onDeleted();
}

function handleViewFields(entityId: string) {
  router.push({
    path: '/lowcode/field',
    query: { entityId }
  });
}

function openDrawer(operateType: any) {
  // 验证是否选择了项目
  if (!currentProjectId.value) {
    window.$message?.warning('请先选择一个项目');
    return;
  }

  // 验证项目ID是否为有效的UUID格式
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(currentProjectId.value)) {
    window.$message?.error('项目ID格式无效，请重新选择项目');
    return;
  }

  handleAdd();
}

function getTableData() {
  getData();
}

// 加载项目列表
async function loadProjects() {
  if (props.projectId) return; // 如果已经有项目ID，不需要加载

  try {
    projectLoading.value = true;
    const response = await fetchGetAllProjects();

    // Handle different response structures
    let projects: any[] = [];
    if (Array.isArray(response)) {
      projects = response;
    } else if (response && Array.isArray((response as any).data)) {
      projects = (response as any).data;
    } else if (response && Array.isArray((response as any).records)) {
      projects = (response as any).records;
    } else {
      console.warn('Unexpected response structure:', response);
      projects = [];
    }

    projectOptions.value = projects.map((project: any) => ({
      label: project.name,
      value: project.id
    }));
  } catch (error) {
    console.error('Failed to load projects:', error);
  } finally {
    projectLoading.value = false;
  }
}

// 处理项目选择变化
function handleProjectChange(projectId: string | null) {
  selectedProjectId.value = projectId || '';
  if (projectId) {
    (searchParams as any).projectId = projectId;
    getTableData();
  }
}

// 监听项目ID变化，重新获取数据
watch(
  () => props.projectId,
  () => {
    if (props.projectId) {
      (searchParams as any).projectId = props.projectId;
      getTableData();
    }
  },
  { immediate: true }
);

// 组件挂载时加载项目列表
loadProjects();
</script>

<style scoped></style>
