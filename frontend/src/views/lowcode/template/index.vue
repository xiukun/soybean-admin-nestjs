<script setup lang="tsx">
import { computed, onMounted, ref, watch } from 'vue';
import { NButton, NPopconfirm, NSelect, NSpace, NTag } from 'naive-ui';
import { fetchDeleteTemplate, fetchGetAllProjects, fetchGetTemplateList, fetchPublishTemplate } from '@/service/api';
import { useAppStore } from '@/store/modules/app';
import { useTable, useTableOperate } from '@/hooks/common/table';
import { $t } from '@/locales';
import TableHeaderOperation from '@/components/advanced/table-header-operation.vue';
import TemplateOperateDrawer from './modules/template-operate-drawer.vue';
import TemplatePreview from './modules/template-preview.vue';
import TemplateSearch from './modules/template-search.vue';

const appStore = useAppStore();

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
const getTemplateListApi = (params: any): Promise<NaiveUI.FlatResponseData<Api.Lowcode.TemplateList>> => {
  const projectId = currentProjectId.value;
  if (!projectId) {
    return Promise.resolve({
      data: {
        records: [] as Api.Lowcode.CodeTemplate[],
        total: 0,
        current: 1,
        size: 10
      },
      error: null,
      response: {} as any
    });
  }
  return fetchGetTemplateList(projectId, params);
};

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
  apiFn: getTemplateListApi,
  showTotal: true,
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
      key: 'name',
      title: $t('page.lowcode.template.name'),
      align: 'center',
      minWidth: 120
    },
    {
      key: 'category',
      title: $t('page.lowcode.template.category'),
      align: 'center',
      width: 100,
      render: row => <NTag type="info">{row.category}</NTag>
    },
    {
      key: 'language',
      title: $t('page.lowcode.template.language'),
      align: 'center',
      width: 100,
      render: row => <NTag type="success">{row.language}</NTag>
    },
    {
      key: 'framework',
      title: $t('page.lowcode.template.framework'),
      align: 'center',
      width: 100,
      render: row => (row.framework ? <NTag type="warning">{row.framework}</NTag> : '-')
    },
    {
      key: 'tags',
      title: $t('page.lowcode.template.tags'),
      align: 'center',
      width: 150,
      render: row => (
        <NSpace>
          {row.tags?.slice(0, 3).map((tag: string) => (
            <NTag key={tag} size="small" type="default">
              {tag}
            </NTag>
          ))}
          {row.tags?.length > 3 && <span>...</span>}
        </NSpace>
      )
    },
    {
      key: 'status',
      title: $t('common.status'),
      align: 'center',
      width: 100,
      render: row => {
        const tagMap: Record<Api.Lowcode.TemplateStatus, NaiveUI.ThemeColor> = {
          DRAFT: 'warning',
          PUBLISHED: 'success',
          DEPRECATED: 'error'
        };

        const label = $t(`page.lowcode.template.status.${row.status}`);
        return <NTag type={tagMap[row.status]}>{label}</NTag>;
      }
    },
    {
      key: 'usageCount',
      title: $t('page.lowcode.template.usageCount'),
      align: 'center',
      width: 80,
      render: row => row.usageCount || 0
    },
    {
      key: 'isPublic',
      title: $t('page.lowcode.template.isPublic'),
      align: 'center',
      width: 80,
      render: row => <NTag type={row.isPublic ? 'success' : 'default'}>{row.isPublic ? '是' : '否'}</NTag>
    },
    {
      key: 'description',
      title: $t('page.lowcode.template.description'),
      align: 'center',
      minWidth: 150,
      ellipsis: {
        tooltip: true
      }
    },
    {
      key: 'createdAt',
      title: $t('common.createdAt'),
      align: 'center',
      width: 180,
      render: row => new Date(row.createdAt).toLocaleString()
    },
    {
      key: 'operate',
      title: $t('common.operate'),
      align: 'center',
      width: 280,
      render: row => (
        <div class="flex-center gap-8px">
          <NButton type="info" ghost size="small" onClick={() => handlePreview(row)}>
            {$t('page.lowcode.template.preview')}
          </NButton>
          {row.status === 'DRAFT' && (
            <NButton type="success" ghost size="small" onClick={() => handlePublish(row.id)}>
              {$t('page.lowcode.template.publish')}
            </NButton>
          )}
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

const { drawerVisible, operateType, editingData, handleAdd, handleEdit, checkedRowKeys, onBatchDeleted } =
  useTableOperate(data as any, getData);

// 预览相关状态
const previewVisible = ref(false);
const previewData = ref<Api.Lowcode.Template | null>(null);

// 预览处理函数
function handlePreview(row: Api.Lowcode.Template) {
  previewData.value = row;
  previewVisible.value = true;
}

// 加载项目列表
async function loadProjects() {
  try {
    projectLoading.value = true;
    const response = await fetchGetAllProjects();
    const projects = response.data || response;
    if (Array.isArray(projects)) {
      projectOptions.value = projects.map(project => ({
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

// 处理项目选择变化
function handleProjectChange() {
  getData();
}

async function handleDelete(id: string) {
  await fetchDeleteTemplate(id);
  await getDataByPage();
}

async function handleBatchDelete() {
  await Promise.all(checkedRowKeys.value.map(id => fetchDeleteTemplate(id)));
  onBatchDeleted();
}

async function handlePublish(id: string) {
  try {
    await fetchPublishTemplate(id);
    window.$message?.success($t('page.lowcode.template.publishSuccess'));
    await getDataByPage();
  } catch (error) {
    window.$message?.error($t('page.lowcode.template.publishFailed'));
  }
}

// 初始化
onMounted(() => {
  if (!props.projectId) {
    loadProjects();
  }
});

// Watch for projectId changes
watch(
  () => currentProjectId.value,
  newProjectId => {
    if (newProjectId) {
      getData();
    }
  },
  { immediate: true }
);
</script>

<template>
  <div class="min-h-500px flex-col-stretch gap-16px overflow-hidden lt-sm:overflow-auto">
    <!-- 项目选择器 -->
    <NCard
      v-if="!props.projectId"
      :title="$t('page.lowcode.template.selectProject')"
      :bordered="false"
      size="small"
      class="card-wrapper"
    >
      <NSpace align="center">
        <span>{{ $t('page.lowcode.template.currentProject') }}:</span>
        <NSelect
          v-model:value="selectedProjectId"
          :placeholder="$t('page.lowcode.template.form.project.placeholder')"
          :options="projectOptions"
          :loading="projectLoading"
          style="width: 300px"
          clearable
          @update:value="handleProjectChange"
        />
      </NSpace>
    </NCard>

    <TemplateSearch v-model:model="searchParams" @reset="resetSearchParams" @search="getDataByPage" />
    <NCard
      :title="$t('page.lowcode.template.title')"
      :bordered="false"
      size="small"
      class="sm:flex-1-hidden card-wrapper"
    >
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
    <TemplateOperateDrawer
      v-model:visible="drawerVisible"
      :operate-type="operateType"
      :row-data="editingData"
      :project-id="projectId"
      @submitted="getDataByPage"
    />
    <TemplatePreview v-model:visible="previewVisible" :template-data="previewData" />
  </div>
</template>

<style scoped></style>
