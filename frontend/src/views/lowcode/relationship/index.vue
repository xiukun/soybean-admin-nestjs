<template>
  <div class="min-h-500px flex-col-stretch gap-16px overflow-hidden lt-sm:overflow-auto">
    <!-- Project selector when no projectId is provided -->
    <NCard v-if="!currentProjectId" :bordered="false" size="small">
      <NSpace align="center">
        <span>{{ $t('page.lowcode.template.selectProject') }}：</span>
        <NSelect
          v-model:value="selectedProjectId"
          :options="projectOptions"
          :placeholder="$t('page.lowcode.project.form.name.placeholder')"
          style="width: 300px"
          :loading="projectLoading"
          clearable
          @update:value="handleProjectChange"
        />
      </NSpace>
    </NCard>

    <!-- 视图切换工具栏 -->
    <NCard v-if="currentProjectId" :bordered="false" size="small">
      <NSpace align="center" justify="space-between">
        <NSpace>
          <NButtonGroup>
            <NButton 
              :type="currentView === 'list' ? 'primary' : 'default'"
              @click="currentView = 'list'"
            >
              <template #icon>
                <NIcon><icon-mdi-view-list /></NIcon>
              </template>
              {{ $t('page.lowcode.relationship.listView') }}
            </NButton>
            <NButton 
              :type="currentView === 'designer' ? 'primary' : 'default'"
              @click="currentView = 'designer'"
            >
              <template #icon>
                <NIcon><icon-mdi-graph /></NIcon>
              </template>
              {{ $t('page.lowcode.relationship.designerView') }}
            </NButton>
          </NButtonGroup>
        </NSpace>
        <NSpace v-if="currentView === 'list'">
          <NButton @click="openDrawer('add')">
            <template #icon>
              <NIcon><icon-mdi-plus /></NIcon>
            </template>
            {{ $t('page.lowcode.relationship.addRelationship') }}
          </NButton>
        </NSpace>
      </NSpace>
    </NCard>

    <!-- 列表视图 -->
    <div v-if="currentProjectId && currentView === 'list'" class="flex-1 flex flex-col gap-4">
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
      </NCard>
    </div>

    <!-- 可视化设计器视图 -->
    <div v-if="currentProjectId && currentView === 'designer'" class="flex-1 h-full min-h-600px">
      <RelationshipDesigner :project-id="currentProjectId" @relationship-updated="getTableData" @error="handleDesignerError" />
    </div>

    <!-- 关系操作抽屉 -->
    <RelationshipOperateDrawer
      v-if="currentProjectId"
      v-model:visible="drawerVisible"
      :operate-type="operateType"
      :row-data="editingData as any"
      :project-id="currentProjectId"
      @submitted="getTableData"
    />
  </div>
</template>

<script setup lang="tsx">
import { ref, watch, computed, onMounted, h } from 'vue';
import { NButton, NPopconfirm, NSpace, NTag, NButtonGroup, NIcon, useMessage } from 'naive-ui';
import { useRoute } from 'vue-router';
import { fetchDeleteRelationship, fetchGetRelationshipList, fetchGetProjectList } from '@/service/api';
import { $t } from '@/locales';
import { useAppStore } from '@/store/modules/app';
import { useTable, useTableOperate } from '@/hooks/common/table';
import RelationshipOperateDrawer from './modules/relationship-operate-drawer.vue';
import RelationshipSearch from './modules/relationship-search.vue';
import TableHeaderOperation from '@/components/advanced/table-header-operation.vue';
import RelationshipDesigner from './components/RelationshipDesigner.vue';

const appStore = useAppStore();
const message = useMessage();

interface Props {
  projectId?: string;
}

const props = withDefaults(defineProps<Props>(), {
  projectId: undefined
});

// 视图切换
const currentView = ref<'list' | 'designer'>('list');

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
  // 转换参数格式以匹配后端API期望的格式
  const apiParams = {
    current: params.current || params.page || 1,
    size: params.size || params.limit || 10,
    projectId: params.projectId || currentProjectId.value,
    type: params.type,
    status: params.status,
    search: params.search
  };
  
  // fetchGetRelationshipList已经实现了正确的URL路径
  return fetchGetRelationshipList(apiParams as any);
};

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
    projectId: currentProjectId.value || '',
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
      width: 64,
      render: (_row: any, index: number) => index + 1
    },
    {
      key: 'name',
      title: $t('page.lowcode.entity.name'),
      align: 'center',
      minWidth: 120
    },
    {
      key: 'code',
      title: $t('page.lowcode.entity.code'),
      align: 'center',
      minWidth: 120
    },
    {
      key: 'type',
      title: $t('page.lowcode.relationship.relationType'),
      align: 'center',
      width: 120,
      render: (row: any) => {
        try {
          // 标准化关系类型，支持多种格式
          const normalizeType = (type: string) => {
            if (!type) return '';
            
            // 转换为统一的大写格式
            const typeStr = type.toString().toUpperCase();
            
            // 处理不同的命名格式
            if (typeStr.includes('ONE') && typeStr.includes('ONE') && !typeStr.includes('MANY')) {
              return 'ONE_TO_ONE';
            } else if (typeStr.includes('ONE') && typeStr.includes('MANY')) {
              if (typeStr.indexOf('ONE') < typeStr.indexOf('MANY')) {
                return 'ONE_TO_MANY';
              } else {
                return 'MANY_TO_ONE';
              }
            } else if (typeStr.includes('MANY') && typeStr.includes('MANY')) {
              return 'MANY_TO_MANY';
            }
            
            // 处理驼峰格式
            if (typeStr === 'ONETOMANY') return 'ONE_TO_MANY';
            if (typeStr === 'MANYTOONE') return 'MANY_TO_ONE';
            if (typeStr === 'MANYTOMANY') return 'MANY_TO_MANY';
            if (typeStr === 'ONETOONE') return 'ONE_TO_ONE';
            
            // 处理连字符格式
            return typeStr.replace(/-/g, '_');
          };

          const typeMap: Record<string, { label: string; color: string }> = {
            ONE_TO_ONE: { label: $t('page.lowcode.relationship.relationTypes.oneToOne'), color: 'info' },
            ONE_TO_MANY: { label: $t('page.lowcode.relationship.relationTypes.oneToMany'), color: 'success' },
            MANY_TO_ONE: { label: $t('page.lowcode.relationship.relationTypes.manyToOne'), color: 'warning' },
            MANY_TO_MANY: { label: $t('page.lowcode.relationship.relationTypes.manyToMany'), color: 'error' }
          };

          const normalizedType = normalizeType(row.type);
          const typeInfo = typeMap[normalizedType];
          
          if (typeInfo) {
            return h(NTag, { type: typeInfo.color as any }, () => typeInfo.label);
          }
          
          // 如果没有匹配的类型，直接显示原始值
          return row.type || '-';
        } catch (error) {
          console.error('Error rendering relationship type:', error, row);
          return row.type || '-';
        }
      }
    },
    {
      key: 'sourceEntity',
      title: $t('page.lowcode.relationship.sourceEntity'),
      align: 'center',
      minWidth: 120,
      render: (row: any) => row.sourceEntity?.name || row.sourceEntityId
    },
    {
      key: 'targetEntity',
      title: $t('page.lowcode.relationship.targetEntity'),
      align: 'center',
      minWidth: 120,
      render: (row: any) => row.targetEntity?.name || row.targetEntityId
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
      render: (row: any) => {
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

        return h(NTag, { type: tagMap[row.status] }, () => label);
      }
    },
    {
      key: 'createdAt',
      title: $t('common.createdAt'),
      align: 'center',
      width: 180,
      render: (row: any) => {
        return new Date(row.createdAt).toLocaleString();
      }
    },
    {
      key: 'operate',
      title: $t('common.operate'),
      align: 'center',
      width: 130,
      render: (row: any) => h(NSpace, { justify: 'center' }, () => [
        h(NButton, { 
          size: 'small', 
          type: 'primary', 
          onClick: () => handleEdit(row.id) 
        }, () => $t('common.edit')),
        h(NPopconfirm, {
          onPositiveClick: () => handleDelete(row.id)
        }, {
          default: () => $t('common.confirmDelete'),
          trigger: () => h(NButton, { 
            size: 'small', 
            type: 'error' 
          }, () => $t('common.delete'))
        })
      ])
    }
  ] as any
});

// Load projects on component mount
onMounted(async () => {
  await loadProjects();
  // Load data if we have a project ID
  if (currentProjectId.value) {
    // 确保searchParams有正确的projectId
    searchParams.projectId = currentProjectId.value;
    // 强制调用getData来加载数据
    await getData();
  }
});

// Watch for project changes and refresh data
watch(currentProjectId, async (newProjectId) => {
  if (newProjectId) {
    // Update search params with new project ID
    searchParams.projectId = newProjectId;
    // 强制刷新数据
    await getData();
  }
}, { immediate: true });

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

/**
 * 处理设计器错误
 * @param errorMessage - 错误信息
 */
function handleDesignerError(errorMessage: string) {
  message.error(errorMessage);
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