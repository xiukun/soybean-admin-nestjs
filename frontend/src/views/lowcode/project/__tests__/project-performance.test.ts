import { ref } from 'vue';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useProjectPerformance } from '../composables/useProjectPerformance';

// Mock项目数据
const mockProjects = [
  {
    id: '1',
    name: '测试项目1',
    code: 'test-1',
    status: 'ACTIVE' as const,
    framework: 'vue',
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01'
  },
  {
    id: '2',
    name: '测试项目2',
    code: 'test-2',
    status: 'INACTIVE' as const,
    framework: 'react',
    createdAt: '2024-01-02',
    updatedAt: '2024-01-02'
  }
];

describe('useProjectPerformance', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('应该正确初始化性能优化功能', () => {
    const projects = ref(mockProjects);
    const performance = useProjectPerformance(projects);

    expect(performance.searchQuery).toBeDefined();
    expect(performance.statusFilter).toBeDefined();
    expect(performance.frameworkFilter).toBeDefined();
    expect(performance.pagination).toBeDefined();
    expect(performance.filteredProjects).toBeDefined();
  });

  it('应该正确过滤项目', async () => {
    const projects = ref(mockProjects);
    const performance = useProjectPerformance(projects);

    // 测试名称搜索
    performance.searchQuery.value = '测试项目1';
    await performance.debouncedSearch();

    expect(performance.filteredProjects.value).toHaveLength(1);
    expect(performance.filteredProjects.value[0].name).toBe('测试项目1');
  });

  it('应该正确处理状态过滤', () => {
    const projects = ref(mockProjects);
    const performance = useProjectPerformance(projects);

    // 测试状态过滤
    performance.statusFilter.value = 'ACTIVE';

    expect(performance.filteredProjects.value).toHaveLength(1);
    expect(performance.filteredProjects.value[0].status).toBe('ACTIVE');
  });

  it('应该正确处理框架过滤', () => {
    const projects = ref(mockProjects);
    const performance = useProjectPerformance(projects);

    // 测试框架过滤
    performance.frameworkFilter.value = 'vue';

    expect(performance.filteredProjects.value).toHaveLength(1);
    expect(performance.filteredProjects.value[0].framework).toBe('vue');
  });

  it('应该正确处理分页', () => {
    const projects = ref(mockProjects);
    const performance = useProjectPerformance(projects);

    // 设置每页1条记录
    performance.pagination.value.pageSize = 1;

    expect(performance.paginatedProjects.value).toHaveLength(1);

    // 切换到第二页
    performance.pagination.value.page = 2;

    expect(performance.paginatedProjects.value).toHaveLength(1);
  });

  it('应该正确处理防抖搜索', async () => {
    const projects = ref(mockProjects);
    const performance = useProjectPerformance(projects);

    const searchSpy = vi.spyOn(performance, 'debouncedSearch');

    // 快速连续搜索
    performance.searchQuery.value = 'a';
    performance.searchQuery.value = 'ab';
    performance.searchQuery.value = 'abc';

    // 等待防抖延迟
    await new Promise(resolve => setTimeout(resolve, 350));

    // 应该只调用一次
    expect(searchSpy).toHaveBeenCalledTimes(1);
  });
});
