<script setup lang="ts">
// @ts-nocheck
import { computed, onMounted, ref } from 'vue';
import { NButton, NDataTable, NIcon, NInput, NSelect, useMessage } from 'naive-ui';
import { ImportOutlined, PlusOutlined, ReloadOutlined, SearchOutlined } from '@vicons/antd';
import type { ProjectDisplay } from '../types/project-types';
import { convertProjectStatus } from '../types/project-types';
import { safeT } from '../types/i18n-fixes';

// 响应式数据
const searchQuery = ref('');
const statusFilter = ref<string | null>(null);
const frameworkFilter = ref<string | null>(null);
const loading = ref(false);
const projects = ref<ProjectDisplay[]>([]);

const message = useMessage();

// 状态选项
const statusOptions = [
  { label: '激活', value: 'active' },
  { label: '停用', value: 'inactive' },
  { label: '归档', value: 'archived' }
];

// 框架选项
const frameworkOptions = [
  { label: 'React', value: 'react' },
  { label: 'Vue', value: 'vue' },
  { label: 'Angular', value: 'angular' }
];

// 表格列定义
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
    render: (row: ProjectDisplay) => {
      const statusMap = {
        active: '激活',
        inactive: '停用',
        archived: '归档'
      };
      return statusMap[row.status] || row.status;
    }
  },
  {
    title: '框架',
    key: 'framework',
    width: 100
  },
  {
    title: '创建时间',
    key: 'createdAt',
    width: 180
  },
  {
    title: '操作',
    key: 'actions',
    width: 200,
    render: (row: ProjectDisplay) => {
      return [
        h(
          NButton,
          {
            size: 'small',
            type: 'primary',
            onClick: () => handleEditProject(row)
          },
          { default: () => '编辑' }
        ),
        h(
          NButton,
          {
            size: 'small',
            type: 'error',
            style: { marginLeft: '8px' },
            onClick: () => handleDeleteProject(row)
          },
          { default: () => '删除' }
        )
      ];
    }
  }
];

// 分页配置
const paginationConfig = computed(() => ({
  page: 1,
  pageSize: 10,
  showSizePicker: true,
  pageSizes: [10, 20, 50, 100],
  showQuickJumper: true,
  prefix: ({ itemCount }: { itemCount: number }) => `共 ${itemCount} 项`
}));

// 过滤后的项目
const filteredProjects = computed(() => {
  let result = projects.value;

  if (searchQuery.value) {
    result = result.filter(
      project =>
        project.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
        project.code.toLowerCase().includes(searchQuery.value.toLowerCase())
    );
  }

  if (statusFilter.value) {
    result = result.filter(project => project.status === statusFilter.value);
  }

  if (frameworkFilter.value) {
    result = result.filter(project => project.framework === frameworkFilter.value);
  }

  return result;
});

// 分页后的项目
const paginatedProjects = computed(() => {
  return filteredProjects.value;
});

// 事件处理函数
const handleSearch = () => {
  // 搜索逻辑已在computed中处理
};

const handleFilterChange = () => {
  // 过滤逻辑已在computed中处理
};

const handlePageChange = (page: number) => {
  console.log('页码变更:', page);
};

const handlePageSizeChange = (pageSize: number) => {
  console.log('页面大小变更:', pageSize);
};

const handleCreateProject = () => {
  message.info('创建项目功能');
};

const handleImportProject = () => {
  message.info('导入项目功能');
};

const handleEditProject = (project: ProjectDisplay) => {
  message.info(`编辑项目: ${project.name}`);
};

const handleDeleteProject = (project: ProjectDisplay) => {
  message.warning(`删除项目: ${project.name}`);
};

const handleRefresh = async () => {
  loading.value = true;
  try {
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 1000));
    message.success('刷新成功');
  } catch (error) {
    message.error('刷新失败');
  } finally {
    loading.value = false;
  }
};

// 初始化数据
onMounted(() => {
  // 模拟项目数据
  projects.value = [
    {
      id: '1',
      name: '示例项目1',
      code: 'demo-project-1',
      description: '这是一个示例项目',
      status: 'active',
      framework: 'react',
      version: '1.0.0',
      createdAt: '2025-01-27 10:00:00',
      updatedAt: '2025-01-27 10:00:00',
      entityCount: 5,
      templateCount: 3
    },
    {
      id: '2',
      name: '示例项目2',
      code: 'demo-project-2',
      description: '这是另一个示例项目',
      status: 'inactive',
      framework: 'vue',
      version: '1.1.0',
      createdAt: '2025-01-26 15:30:00',
      updatedAt: '2025-01-26 15:30:00',
      entityCount: 8,
      templateCount: 2
    }
  ];
});
</script>

<template>
  <div class="project-management">
    <!-- 搜索和过滤区域 -->
    <div class="mb-4 space-y-4">
      <div class="flex items-center justify-between">
        <h1 class="text-2xl font-bold">项目管理</h1>
        <div class="flex space-x-2">
          <NButton type="primary" @click="handleCreateProject">
            <template #icon>
              <NIcon><PlusOutlined /></NIcon>
            </template>
            创建项目
          </NButton>
          <NButton @click="handleImportProject">
            <template #icon>
              <NIcon><ImportOutlined /></NIcon>
            </template>
            导入项目
          </NButton>
        </div>
      </div>

      <!-- 搜索栏 -->
      <div class="flex items-center space-x-4">
        <NInput
          v-model:value="searchQuery"
          placeholder="搜索项目名称或代码"
          clearable
          class="flex-1"
          @input="handleSearch"
        >
          <template #prefix>
            <NIcon><SearchOutlined /></NIcon>
          </template>
        </NInput>

        <!-- 状态过滤 -->
        <NSelect
          v-model:value="statusFilter"
          placeholder="按状态筛选"
          clearable
          :options="statusOptions"
          class="w-40"
          @update:value="handleFilterChange"
        />

        <!-- 框架过滤 -->
        <NSelect
          v-model:value="frameworkFilter"
          placeholder="按框架筛选"
          clearable
          :options="frameworkOptions"
          class="w-40"
          @update:value="handleFilterChange"
        />

        <NButton @click="handleRefresh">
          <template #icon>
            <NIcon><ReloadOutlined /></NIcon>
          </template>
          刷新
        </NButton>
      </div>
    </div>

    <!-- 项目列表 -->
    <NDataTable
      :columns="columns"
      :data="paginatedProjects"
      :loading="loading"
      :pagination="paginationConfig"
      @update:page="handlePageChange"
      @update:page-size="handlePageSizeChange"
    />
  </div>
</template>

<style scoped>
.project-management {
  padding: 16px;
}
</style>
