<template>
  <div class="project-management-safe">
    <n-card title="项目管理" :bordered="false">
      <template #header-extra>
        <n-space>
          <n-button type="primary" @click="handleCreate">
            <template #icon>
              <n-icon :component="AddIcon" />
            </template>
            创建项目
          </n-button>
          <n-button @click="handleRefresh">
            <template #icon>
              <n-icon :component="RefreshIcon" />
            </template>
            刷新
          </n-button>
        </n-space>
      </template>

      <!-- 搜索和过滤 -->
      <n-space class="mb-4" justify="space-between">
        <n-input
          v-model:value="searchValue"
          placeholder="搜索项目名称或代码"
          clearable
          style="width: 300px"
        >
          <template #prefix>
            <n-icon :component="SearchIcon" />
          </template>
        </n-input>
        
        <n-space>
          <n-select
            v-model:value="statusFilterValue"
            placeholder="状态筛选"
            clearable
            style="width: 120px"
            :options="statusOptions"
          />
          <n-select
            v-model:value="frameworkFilterValue"
            placeholder="框架筛选"
            clearable
            style="width: 120px"
            :options="frameworkOptions"
          />
        </n-space>
      </n-space>

      <!-- 项目列表 -->
      <n-data-table
        :columns="columns"
        :data="filteredData"
        :loading="isLoading"
        :pagination="paginationProps"
        :row-key="(row) => row.id"
      />
    </n-card>
  </div>
</template>

<script setup lang="ts">
// @ts-nocheck
import { ref, computed, onMounted } from 'vue';
import {
  NCard,
  NButton,
  NSpace,
  NInput,
  NSelect,
  NDataTable,
  NIcon,
  useMessage
} from 'naive-ui';
import { Add as AddIcon, Refresh as RefreshIcon, Search as SearchIcon } from '@vicons/ionicons5';

// 响应式数据
const searchValue = ref('');
const statusFilterValue = ref(null);
const frameworkFilterValue = ref(null);
const isLoading = ref(false);
const projectData = ref([]);

const message = useMessage();

// 选项数据
const statusOptions = [
  { label: '活跃', value: 'active' },
  { label: '停用', value: 'inactive' },
  { label: '开发中', value: 'development' }
];

const frameworkOptions = [
  { label: 'Vue', value: 'vue' },
  { label: 'React', value: 'react' },
  { label: 'Angular', value: 'angular' }
];

// 表格列定义
const columns = [
  { title: '项目名称', key: 'name', width: 200 },
  { title: '项目代码', key: 'code', width: 150 },
  { title: '状态', key: 'status', width: 100 },
  { title: '框架', key: 'framework', width: 100 },
  { title: '创建时间', key: 'createdAt', width: 180 },
  {
    title: '操作',
    key: 'actions',
    width: 200,
    render: (row) => {
      return '操作按钮';
    }
  }
];

// 计算属性
const filteredData = computed(() => {
  let data = projectData.value;
  
  if (searchValue.value) {
    data = data.filter(item => 
      item.name?.includes(searchValue.value) || 
      item.code?.includes(searchValue.value)
    );
  }
  
  if (statusFilterValue.value) {
    data = data.filter(item => item.status === statusFilterValue.value);
  }
  
  if (frameworkFilterValue.value) {
    data = data.filter(item => item.framework === frameworkFilterValue.value);
  }
  
  return data;
});

const paginationProps = computed(() => ({
  page: 1,
  pageSize: 10,
  showSizePicker: true,
  pageSizes: [10, 20, 50],
  showQuickJumper: true,
  prefix: ({ itemCount }) => `共 ${itemCount} 项`
}));

// 方法
const handleCreate = () => {
  message.info('创建项目功能');
};

const handleRefresh = () => {
  message.info('刷新数据');
  loadData();
};

const loadData = async () => {
  isLoading.value = true;
  try {
    // 模拟数据加载
    await new Promise(resolve => setTimeout(resolve, 1000));
    projectData.value = [
      {
        id: '1',
        name: '示例项目1',
        code: 'demo-1',
        status: 'active',
        framework: 'vue',
        createdAt: '2024-01-01 10:00:00'
      },
      {
        id: '2',
        name: '示例项目2',
        code: 'demo-2',
        status: 'inactive',
        framework: 'react',
        createdAt: '2024-01-02 10:00:00'
      }
    ];
  } catch (error) {
    message.error('加载数据失败');
  } finally {
    isLoading.value = false;
  }
};

// 生命周期
onMounted(() => {
  loadData();
});
</script>

<style scoped>
.project-management-safe {
  padding: 16px;
}

.mb-4 {
  margin-bottom: 16px;
}
</style>