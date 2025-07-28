import { ref, computed, onUnmounted } from 'vue';
import { debounce } from 'lodash-es';

export interface Project {
  id: string;
  name: string;
  code: string;
  description?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';
  deploymentStatus?: 'INACTIVE' | 'DEPLOYING' | 'DEPLOYED' | 'FAILED';
  deploymentPort?: number;
  config?: {
    framework?: string;
    architecture?: string;
    language?: string;
    database?: string;
  };
  entityCount?: number;
  templateCount?: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaginationConfig {
  page: number;
  pageSize: number;
  itemCount: number;
  pageSizes: number[];
}

export function useProjectPerformance() {
  // 搜索和过滤状态
  const searchQuery = ref('');
  const statusFilter = ref('');
  const frameworkFilter = ref('');
  
  // 分页状态
  const pagination = ref<PaginationConfig>({
    page: 1,
    pageSize: 10,
    itemCount: 0,
    pageSizes: [10, 20, 50, 100]
  });

  // 防抖搜索
  const debouncedSearch = debounce((callback: () => void) => {
    pagination.value.page = 1; // 重置到第一页
    callback();
  }, 300);

  // 过滤项目
  const filterProjects = (projects: Project[]) => {
    let filtered = projects;

    // 搜索过滤
    if (searchQuery.value) {
      const query = searchQuery.value.toLowerCase();
      filtered = filtered.filter(project =>
        project.name.toLowerCase().includes(query) ||
        project.code.toLowerCase().includes(query) ||
        project.description?.toLowerCase().includes(query)
      );
    }

    // 状态过滤
    if (statusFilter.value) {
      filtered = filtered.filter(project => project.status === statusFilter.value);
    }

    // 框架过滤
    if (frameworkFilter.value) {
      filtered = filtered.filter(project => project.config?.framework === frameworkFilter.value);
    }

    // 更新总数
    pagination.value.itemCount = filtered.length;

    return filtered;
  };

  // 分页处理
  const paginateProjects = (projects: Project[]) => {
    const start = (pagination.value.page - 1) * pagination.value.pageSize;
    const end = start + pagination.value.pageSize;
    return projects.slice(start, end);
  };

  // 搜索处理
  const handleSearch = (callback: () => void) => {
    debouncedSearch(callback);
  };

  // 过滤变更处理
  const handleFilterChange = () => {
    pagination.value.page = 1;
  };

  // 分页变更处理
  const handlePageChange = (page: number) => {
    pagination.value.page = page;
  };

  const handlePageSizeChange = (pageSize: number) => {
    pagination.value.pageSize = pageSize;
    pagination.value.page = 1;
  };

  // 清理资源
  onUnmounted(() => {
    debouncedSearch.cancel();
  });

  return {
    // 状态
    searchQuery,
    statusFilter,
    frameworkFilter,
    pagination,
    
    // 方法
    filterProjects,
    paginateProjects,
    handleSearch,
    handleFilterChange,
    handlePageChange,
    handlePageSizeChange
  };
}