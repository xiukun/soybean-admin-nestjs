<template>
  <div class="project-management-v2">
    <!-- 页面头部 -->
    <div class="page-header mb-6">
      <NSpace justify="space-between" align="center">
        <div>
          <NText tag="h1" class="text-2xl font-bold">{{ $t('page.lowcode.project.management') }}</NText>
          <NText depth="3" class="mt-1">{{ $t('page.lowcode.project.managementDesc') }}</NText>
        </div>
        <NSpace>
          <NButton type="primary" @click="handleCreateProject">
            <template #icon>
              <NIcon><icon-mdi-plus /></NIcon>
            </template>
            {{ $t('page.lowcode.project.create') }}
          </NButton>
          <NButton @click="handleImportProject">
            <template #icon>
              <NIcon><icon-mdi-import /></NIcon>
            </template>
            {{ $t('page.lowcode.project.import') }}
          </NButton>
          <NButton @click="handleRefresh">
            <template #icon>
              <NIcon><icon-mdi-refresh /></NIcon>
            </template>
            {{ $t('common.refresh') }}
          </NButton>
        </NSpace>
      </NSpace>
    </div>

    <!-- 搜索和筛选 -->
    <NCard class="search-card mb-4">
      <NSpace justify="space-between" align="center">
        <NSpace>
          <NInput
            v-model:value="searchQuery"
            :placeholder="$t('page.lowcode.project.searchPlaceholder')"
            style="width: 300px"
            clearable
            @input="handleSearch"
          >
            <template #prefix>
              <NIcon><icon-mdi-magnify /></NIcon>
            </template>
          </NInput>
          <NSelect
            v-model:value="statusFilter"
            :placeholder="$t('page.lowcode.project.filterByStatus')"
            :options="statusOptions"
            style="width: 150px"
            clearable
            @update:value="handleFilterChange"
          />
          <NSelect
            v-model:value="sortBy"
            :placeholder="$t('page.lowcode.project.sortBy')"
            :options="sortOptions"
            style="width: 150px"
            @update:value="handleSortChange"
          />
        </NSpace>
        <NSpace>
          <NButton @click="handleExport">
            <template #icon>
              <NIcon><icon-mdi-export /></NIcon>
            </template>
            {{ $t('page.lowcode.project.export') }}
          </NButton>
          <NSwitch v-model:value="viewMode" @update:value="handleViewModeChange">
            <template #checked>{{ $t('page.lowcode.project.cardView') }}</template>
            <template #unchecked>{{ $t('page.lowcode.project.tableView') }}</template>
          </NSwitch>
        </NSpace>
      </NSpace>
    </NCard>

    <!-- 项目统计 -->
    <div class="stats-section mb-6">
      <NGrid :cols="4" :x-gap="16">
        <NGridItem>
          <NCard>
            <NStatistic :label="$t('page.lowcode.project.stats.total')" :value="stats.total">
              <template #prefix>
                <NIcon color="#18a058"><icon-mdi-folder-multiple /></NIcon>
              </template>
            </NStatistic>
          </NCard>
        </NGridItem>
        <NGridItem>
          <NCard>
            <NStatistic :label="$t('page.lowcode.project.stats.active')" :value="stats.active">
              <template #prefix>
                <NIcon color="#2080f0"><icon-mdi-folder-check /></NIcon>
              </template>
            </NStatistic>
          </NCard>
        </NGridItem>
        <NGridItem>
          <NCard>
            <NStatistic :label="$t('page.lowcode.project.stats.entities')" :value="stats.entities">
              <template #prefix>
                <NIcon color="#f0a020"><icon-mdi-database /></NIcon>
              </template>
            </NStatistic>
          </NCard>
        </NGridItem>
        <NGridItem>
          <NCard>
            <NStatistic :label="$t('page.lowcode.project.stats.generated')" :value="stats.generated">
              <template #prefix>
                <NIcon color="#d03050"><icon-mdi-code-braces /></NIcon>
              </template>
            </NStatistic>
          </NCard>
        </NGridItem>
      </NGrid>
    </div>

    <!-- 项目列表 -->
    <div class="projects-section">
      <!-- 卡片视图 -->
      <div v-if="viewMode" class="card-view">
        <NGrid :cols="3" :x-gap="16" :y-gap="16">
          <NGridItem v-for="project in filteredProjects" :key="project.id">
            <ProjectCard
              :project="project"
              @edit="handleEditProject"
              @delete="handleDeleteProject"
              @configure="handleConfigureProject"
              @design="handleDesignEntities"
              @generate="handleGenerateCode"
              @view="handleViewProject"
            />
          </NGridItem>
        </NGrid>
      </div>

      <!-- 表格视图 -->
      <div v-else class="table-view">
        <NCard>
          <NDataTable
            v-model:checked-row-keys="checkedRowKeys"
            :columns="tableColumns"
            :data="filteredProjects"
            :loading="loading"
            :pagination="pagination"
            :row-key="row => row.id"
            size="small"
            remote
            @update:page="handlePageChange"
            @update:page-size="handlePageSizeChange"
          />
        </NCard>
      </div>
    </div>

    <!-- 项目操作抽屉 -->
    <ProjectOperateDrawer
      v-model:visible="drawerVisible"
      :operate-type="operateType"
      :row-data="editingData"
      @submitted="handleRefresh"
    />

    <!-- 项目配置模态框 -->
    <ProjectConfigModal
      v-model:visible="configModalVisible"
      :project="selectedProject"
      @saved="handleRefresh"
    />

    <!-- 实体设计器模态框 -->
    <EntityDesignerModal
      v-model:visible="designerModalVisible"
      :project="selectedProject"
      @saved="handleRefresh"
    />

    <!-- 代码生成模态框 -->
    <CodeGenerationModal
      v-model:visible="codeGenModalVisible"
      :project="selectedProject"
      @generated="handleRefresh"
    />
  </div>
</template>

<script setup lang="tsx">
import { ref, reactive, computed, onMounted, watch } from 'vue';
import type { DataTableColumns, PaginationProps } from 'naive-ui';
import { NButton, NTag, NSpace, NPopconfirm, NIcon, NTooltip } from 'naive-ui';
import { $t } from '@/locales';
import { useMessage } from '@/hooks/common/message';
import { fetchGetProjectList, fetchDeleteProject, fetchGetProjectStats } from '@/service/api';
import ProjectCard from './modules/project-card.vue';
import ProjectOperateDrawer from './modules/project-operate-drawer.vue';
import ProjectConfigModal from './modules/project-config-modal.vue';
import EntityDesignerModal from './modules/entity-designer-modal.vue';
import CodeGenerationModal from './modules/code-generation-modal.vue';

defineOptions({
  name: 'ProjectManagementV2'
});

// 响应式数据
const loading = ref(false);
const searchQuery = ref('');
const statusFilter = ref<string | null>(null);
const sortBy = ref<string>('updatedAt');
const viewMode = ref(true); // true: 卡片视图, false: 表格视图
const checkedRowKeys = ref<string[]>([]);

// 项目数据
const projects = ref<any[]>([]);
const stats = reactive({
  total: 0,
  active: 0,
  entities: 0,
  generated: 0
});

// 操作状态
const drawerVisible = ref(false);
const configModalVisible = ref(false);
const designerModalVisible = ref(false);
const codeGenModalVisible = ref(false);
const operateType = ref<'add' | 'edit'>('add');
const editingData = ref<any>(null);
const selectedProject = ref<any>(null);

// 分页
const pagination = reactive<PaginationProps>({
  page: 1,
  pageSize: 10,
  itemCount: 0,
  showSizePicker: true,
  pageSizes: [10, 20, 50, 100]
});

// 消息提示
const { createMessage } = useMessage();

// 计算属性
const filteredProjects = computed(() => {
  let result = [...projects.value];

  // 搜索过滤
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    result = result.filter(project => 
      project.name.toLowerCase().includes(query) ||
      project.code.toLowerCase().includes(query) ||
      project.description?.toLowerCase().includes(query)
    );
  }

  // 状态过滤
  if (statusFilter.value) {
    result = result.filter(project => project.status === statusFilter.value);
  }

  // 排序
  result.sort((a, b) => {
    const aValue = a[sortBy.value];
    const bValue = b[sortBy.value];
    if (sortBy.value === 'updatedAt' || sortBy.value === 'createdAt') {
      return new Date(bValue).getTime() - new Date(aValue).getTime();
    }
    return String(aValue).localeCompare(String(bValue));
  });

  return result;
});

// 选项数据
const statusOptions = [
  { label: $t('page.lowcode.project.status.active'), value: 'active' },
  { label: $t('page.lowcode.project.status.inactive'), value: 'inactive' },
  { label: $t('page.lowcode.project.status.archived'), value: 'archived' }
];

const sortOptions = [
  { label: $t('page.lowcode.project.sort.updatedAt'), value: 'updatedAt' },
  { label: $t('page.lowcode.project.sort.createdAt'), value: 'createdAt' },
  { label: $t('page.lowcode.project.sort.name'), value: 'name' },
  { label: $t('page.lowcode.project.sort.code'), value: 'code' }
];

// 表格列定义
const tableColumns: DataTableColumns<any> = [
  {
    type: 'selection'
  },
  {
    key: 'name',
    title: $t('page.lowcode.project.name'),
    minWidth: 120,
    ellipsis: {
      tooltip: true
    }
  },
  {
    key: 'code',
    title: $t('page.lowcode.project.code'),
    width: 120
  },
  {
    key: 'status',
    title: $t('page.lowcode.project.status.title'),
    width: 100,
    render: (row) => {
      const statusMap = {
        active: { type: 'success', text: $t('page.lowcode.project.status.active') },
        inactive: { type: 'warning', text: $t('page.lowcode.project.status.inactive') },
        archived: { type: 'error', text: $t('page.lowcode.project.status.archived') }
      };
      const status = statusMap[row.status] || statusMap.inactive;
      return <NTag type={status.type}>{status.text}</NTag>;
    }
  },
  {
    key: 'entityCount',
    title: $t('page.lowcode.project.entityCount'),
    width: 100,
    render: (row) => row.entityCount || 0
  },
  {
    key: 'updatedAt',
    title: $t('page.lowcode.project.updatedAt'),
    width: 180,
    render: (row) => new Date(row.updatedAt).toLocaleString()
  },
  {
    key: 'actions',
    title: $t('common.action'),
    width: 200,
    render: (row) => (
      <NSpace size={8}>
        <NTooltip trigger="hover">
          {{
            default: () => $t('page.lowcode.project.configure'),
            trigger: () => (
              <NButton size="small" onClick={() => handleConfigureProject(row)}>
                <NIcon><icon-mdi-cog /></NIcon>
              </NButton>
            )
          }}
        </NTooltip>
        <NTooltip trigger="hover">
          {{
            default: () => $t('page.lowcode.project.design'),
            trigger: () => (
              <NButton size="small" type="primary" onClick={() => handleDesignEntities(row)}>
                <NIcon><icon-mdi-database-edit /></NIcon>
              </NButton>
            )
          }}
        </NTooltip>
        <NTooltip trigger="hover">
          {{
            default: () => $t('page.lowcode.project.generate'),
            trigger: () => (
              <NButton size="small" type="info" onClick={() => handleGenerateCode(row)}>
                <NIcon><icon-mdi-code-braces /></NIcon>
              </NButton>
            )
          }}
        </NTooltip>
        <NTooltip trigger="hover">
          {{
            default: () => $t('common.edit'),
            trigger: () => (
              <NButton size="small" onClick={() => handleEditProject(row)}>
                <NIcon><icon-mdi-pencil /></NIcon>
              </NButton>
            )
          }}
        </NTooltip>
        <NPopconfirm onPositiveClick={() => handleDeleteProject(row)}>
          {{
            default: () => $t('common.confirmDelete'),
            trigger: () => (
              <NButton size="small" type="error">
                <NIcon><icon-mdi-delete /></NIcon>
              </NButton>
            )
          }}
        </NPopconfirm>
      </NSpace>
    )
  }
];

// 方法定义
const getProjectList = async () => {
  loading.value = true;
  try {
    const { data } = await fetchGetProjectList({
      page: pagination.page,
      pageSize: pagination.pageSize
    });
    
    if (data.status === 0) {
      projects.value = data.data.options || [];
      pagination.itemCount = data.data.total || 0;
    }
  } catch (error) {
    createMessage.error($t('page.lowcode.project.fetchError'));
  } finally {
    loading.value = false;
  }
};

const getProjectStats = async () => {
  try {
    const { data } = await fetchGetProjectStats();
    if (data.status === 0) {
      Object.assign(stats, data.data);
    }
  } catch (error) {
    console.error('Failed to fetch project stats:', error);
  }
};

const handleCreateProject = () => {
  operateType.value = 'add';
  editingData.value = null;
  drawerVisible.value = true;
};

const handleEditProject = (project: any) => {
  operateType.value = 'edit';
  editingData.value = { ...project };
  drawerVisible.value = true;
};

const handleDeleteProject = async (project: any) => {
  try {
    const { data } = await fetchDeleteProject(project.id);
    if (data.status === 0) {
      createMessage.success($t('common.deleteSuccess'));
      await handleRefresh();
    }
  } catch (error) {
    createMessage.error($t('common.deleteError'));
  }
};

const handleConfigureProject = (project: any) => {
  selectedProject.value = project;
  configModalVisible.value = true;
};

const handleDesignEntities = (project: any) => {
  selectedProject.value = project;
  designerModalVisible.value = true;
};

const handleGenerateCode = (project: any) => {
  selectedProject.value = project;
  codeGenModalVisible.value = true;
};

const handleViewProject = (project: any) => {
  // 跳转到项目详情页面
  window.open(`/lowcode/project/${project.id}`, '_blank');
};

const handleImportProject = () => {
  // TODO: 实现项目导入功能
  createMessage.info($t('page.lowcode.project.importTip'));
};

const handleExport = () => {
  // TODO: 实现项目导出功能
  createMessage.info($t('page.lowcode.project.exportTip'));
};

const handleRefresh = async () => {
  await Promise.all([getProjectList(), getProjectStats()]);
};

const handleSearch = () => {
  // 搜索是通过计算属性实现的，这里可以添加防抖逻辑
};

const handleFilterChange = () => {
  // 过滤是通过计算属性实现的
};

const handleSortChange = () => {
  // 排序是通过计算属性实现的
};

const handleViewModeChange = () => {
  // 视图模式切换
};

const handlePageChange = (page: number) => {
  pagination.page = page;
  getProjectList();
};

const handlePageSizeChange = (pageSize: number) => {
  pagination.pageSize = pageSize;
  pagination.page = 1;
  getProjectList();
};

// 生命周期
onMounted(() => {
  handleRefresh();
});

// 监听搜索变化，添加防抖
watch(searchQuery, () => {
  // 这里可以添加防抖逻辑
}, { debounce: 300 });
</script>

<style scoped>
.project-management-v2 {
  padding: 16px;
}

.page-header {
  background: white;
  padding: 24px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.search-card {
  background: white;
}

.stats-section {
  margin-bottom: 24px;
}

.card-view {
  min-height: 400px;
}

.table-view {
  background: white;
  border-radius: 8px;
}
</style>
