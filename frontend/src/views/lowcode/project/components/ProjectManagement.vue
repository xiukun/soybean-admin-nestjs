<template>
  <div class="project-management">
    <!-- 搜索和过滤区域 -->
    <div class="search-filter-section mb-4">
      <NSpace>
        <NInput
          v-model:value="searchQuery"
          placeholder="搜索项目名称、代码或描述"
          style="width: 300px"
          @input="handleSearch"
        >
          <template #prefix>
            <NIcon :component="SearchOutlined" />
          </template>
        </NInput>
        
        <NSelect
          v-model:value="statusFilter"
          placeholder="按状态筛选"
          :options="statusOptions"
          style="width: 150px"
          clearable
          @update:value="handleFilterChange"
        />
        
        <NSelect
          v-model:value="frameworkFilter"
          placeholder="按框架筛选"
          :options="frameworkOptions"
          style="width: 150px"
          clearable
          @update:value="handleFilterChange"
        />
        
        <NButton @click="handleRefresh">
          <template #icon>
            <NIcon :component="ReloadOutlined" />
          </template>
          刷新
        </NButton>
      </NSpace>
    </div>

    <!-- 项目列表 -->
    <div class="project-list">
      <NDataTable
        :columns="columns"
        :data="paginatedProjects"
        :pagination="paginationConfig"
        :loading="loading"
        @update:page="handlePageChange"
        @update:page-size="handlePageSizeChange"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
// @ts-nocheck
import { ref, computed, onMounted } from 'vue';
import { NSpace, NInput, NSelect, NButton, NIcon, NDataTable, NTag } from 'naive-ui';
import { SearchOutlined, ReloadOutlined } from '@vicons/antd';
import { useProjectPerformance } from '../composables/useProjectPerformance';
import type { Project } from '../composables/useProjectPerformance';

// 使用性能优化组合式函数
const {
  searchQuery,
  statusFilter,
  frameworkFilter,
  pagination,
  filterProjects,
  paginateProjects,
  handleSearch,
  handleFilterChange,
  handlePageChange,
  handlePageSizeChange
} = useProjectPerformance();

// 数据状态
const projects = ref<Project[]>([]);
const loading = ref(false);

// 状态选项
const statusOptions = [
  { label: '活跃', value: 'ACTIVE' },
  { label: '非活跃', value: 'INACTIVE' },
  { label: '已归档', value: 'ARCHIVED' }
];

// 框架选项
const frameworkOptions = [
  { label: 'Vue', value: 'vue' },
  { label: 'React', value: 'react' },
  { label: 'Angular', value: 'angular' },
  { label: 'NestJS', value: 'nestjs' }
];

// 表格列配置
const columns = [
  {
    title: '项目名称',
    key: 'name',
    width: 200
  },
  {
    title: '项目代码',
    key: 'code',
    width: 150
  },
  {
    title: '状态',
    key: 'status',
    width: 100,
    render: (row: Project) => {
      const statusMap = {
        ACTIVE: { type: 'success', text: '活跃' },
        INACTIVE: { type: 'warning', text: '非活跃' },
        ARCHIVED: { type: 'default', text: '已归档' }
      };
      const status = statusMap[row.status] || { type: 'default', text: '未知' };
      return h(NTag, { type: status.type as any }, () => status.text);
    }
  },
  {
    title: '框架',
    key: 'framework',
    width: 120,
    render: (row: Project) => row.config?.framework || '-'
  },
  {
    title: '实体数量',
    key: 'entityCount',
    width: 100,
    render: (row: Project) => row.entityCount || 0
  },
  {
    title: '模板数量',
    key: 'templateCount',
    width: 100,
    render: (row: Project) => row.templateCount || 0
  },
  {
    title: '创建时间',
    key: 'createdAt',
    width: 180,
    render: (row: Project) => new Date(row.createdAt).toLocaleString()
  }
];

// 过滤后的项目
const filteredProjects = computed(() => {
  return filterProjects(projects.value);
});

// 分页后的项目
const paginatedProjects = computed(() => {
  return paginateProjects(filteredProjects.value);
});

// 分页配置
const paginationConfig = computed(() => ({
  page: pagination.value.page,
  pageSize: pagination.value.pageSize,
  itemCount: pagination.value.itemCount,
  pageSizes: pagination.value.pageSizes,
  showSizePicker: true,
  showQuickJumper: true
}));

// 刷新数据
const handleRefresh = async () => {
  loading.value = true;
  try {
    // 这里应该调用实际的API
    // const response = await fetchProjects();
    // projects.value = response.data;
    
    // 模拟数据
    projects.value = [
      {
        id: '1',
        name: '示例项目1',
        code: 'demo-project-1',
        description: '这是一个示例项目',
        status: 'ACTIVE',
        config: { framework: 'vue' },
        entityCount: 5,
        templateCount: 3,
        createdBy: 'admin',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z'
      }
    ];
    
    pagination.value.itemCount = projects.value.length;
  } catch (error) {
    console.error('加载项目失败:', error);
  } finally {
    loading.value = false;
  }
};

// 组件挂载时加载数据
onMounted(() => {
  handleRefresh();
});
</script>

<style scoped>
.project-management {
  padding: 16px;
}

.search-filter-section {
  background: white;
  padding: 16px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.project-list {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}
</style>