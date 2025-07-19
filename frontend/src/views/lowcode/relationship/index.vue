<template>
  <div class="min-h-500px flex-col-stretch gap-16px overflow-hidden lt-sm:overflow-auto">
    <!-- Project selector when no projectId is provided -->
    <NCard v-if="!currentProjectId" :bordered="false" size="small">
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

    <RelationshipSearch v-if="currentProjectId" v-model:model="searchParams" @reset="resetSearchParams" @search="getTableData" />
    <NCard v-if="currentProjectId" :title="$t('page.lowcode.relation.title')" :bordered="false" size="small" class="sm:flex-1-hidden card-wrapper">
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
        :row-data="editingData as any"
        :project-id="currentProjectId"
        @submitted="getTableData"
      />
    </NCard>
  </div>
</template>

<script setup lang="tsx">
import { ref, watch, computed, onMounted } from 'vue';
import { NButton, NPopconfirm, NSpace, NTag } from 'naive-ui';
import { useRoute } from 'vue-router';
import { fetchDeleteRelationship, fetchGetRelationshipList, fetchGetProjectList } from '@/service/api';
import { $t } from '@/locales';
import { useAppStore } from '@/store/modules/app';
import { useTable, useTableOperate } from '@/hooks/common/table';
import RelationshipOperateDrawer from './modules/relationship-operate-drawer.vue';
import RelationshipSearch from './modules/relationship-search.vue';
import TableHeaderOperation from '@/components/advanced/table-header-operation.vue';

const appStore = useAppStore();

interface Props {
  projectId?: string;
}

const props = withDefaults(defineProps<Props>(), {
  projectId: undefined
});

// Project selection logic
const route = useRoute();
const selectedProjectId = ref<string>();
const projectOptions = ref<Array<{ label: string; value: string }>>([]);
const projectLoading = ref(false);

// Get current project ID from props, route query, or selected project
const currentProjectId = computed(() => {
  return props.projectId || route.query.projectId as string || selectedProjectId.value;
});

// Load projects for selection
async function loadProjects() {
  if (props.projectId) return; // Skip if projectId is provided via props

  try {
    projectLoading.value = true;
    const { data } = await fetchGetProjectList({ current: 1, size: 100 });
    if (data) {
      projectOptions.value = data.records.map((project: any) => ({
        label: project.name,
        value: project.id
      }));
    }
  } catch (error) {
    console.error('Failed to load projects:', error);
  } finally {
    projectLoading.value = false;
  }
}

function handleProjectChange(projectId: string | null) {
  selectedProjectId.value = projectId || undefined;
  // The watch will handle the data refresh
}

// Create a wrapper function that matches the expected API signature
const relationshipApiFn = (params: Api.Common.CommonSearchParams & { projectId?: string; type?: string; status?: string; search?: string; page?: number; limit?: number }) => {
  return fetchGetRelationshipList(params as Api.Lowcode.RelationshipSearchParams);
};

// Load projects on component mount
onMounted(() => {
  loadProjects();
  // Only load data if we have a project ID
  if (currentProjectId.value) {
    (searchParams as any).projectId = currentProjectId.value;
    getData();
  }
});

// Watch for project changes and refresh data
watch(currentProjectId, (newProjectId) => {
  if (newProjectId) {
    // Update search params with new project ID
    (searchParams as any).projectId = newProjectId;
    getData();
  }
});

const {
  columns,
  columnChecks,
  data,
  getData,
  loading,
  mobilePagination,
  searchParams,
  resetSearchParams
} = useTable({
  apiFn: relationshipApiFn,
  apiParams: {
    current: 1,
    size: 10,
    projectId: '',
    type: null,
    status: null,
    search: null
  } as any,
  immediate: false,
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
      title: $t('page.lowcode.relation.name'),
      align: 'center',
      minWidth: 120
    },
    {
      key: 'code',
      title: $t('page.lowcode.relation.code'),
      align: 'center',
      minWidth: 120
    },
    {
      key: 'type',
      title: $t('page.lowcode.relation.relationType'),
      align: 'center',
      width: 120,
      render: row => {
        const typeMap: Record<string, { label: string; color: string }> = {
          ONE_TO_ONE: { label: $t('page.lowcode.relation.relationTypes.ONE_TO_ONE'), color: 'info' },
          ONE_TO_MANY: { label: $t('page.lowcode.relation.relationTypes.ONE_TO_MANY'), color: 'success' },
          MANY_TO_ONE: { label: $t('page.lowcode.relation.relationTypes.MANY_TO_ONE'), color: 'warning' },
          MANY_TO_MANY: { label: $t('page.lowcode.relation.relationTypes.MANY_TO_MANY'), color: 'error' }
        };

        const typeInfo = typeMap[row.type];
        return typeInfo ? <NTag type={typeInfo.color as any}>{typeInfo.label}</NTag> : row.type;
      }
    },
    {
      key: 'sourceEntity',
      title: $t('page.lowcode.relation.sourceEntity'),
      align: 'center',
      minWidth: 120,
      render: row => row.sourceEntity?.name || row.sourceEntityId
    },
    {
      key: 'targetEntity',
      title: $t('page.lowcode.relation.targetEntity'),
      align: 'center',
      minWidth: 120,
      render: row => row.targetEntity?.name || row.targetEntityId
    },
    {
      key: 'description',
      title: $t('page.lowcode.relation.description'),
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

        const tagMap: Record<string, NaiveUI.ThemeColor> = {
          ACTIVE: 'success',
          INACTIVE: 'error'
        };

        const label = row.status === 'ACTIVE'
          ? $t('page.lowcode.common.status.active')
          : $t('page.lowcode.common.status.inactive');

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
      width: 130,
      render: row => (
        <NSpace justify={'center'}>
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
} = useTableOperate(data as any, getData);

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

function openDrawer(_operateType: NaiveUI.TableOperateType) {
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
