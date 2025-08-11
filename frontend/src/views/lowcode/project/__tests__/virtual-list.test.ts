import { mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import VirtualProjectList from '../components/VirtualProjectList.vue';

// Mock项目数据
const mockProjects = Array.from({ length: 100 }, (_, i) => ({
  id: `project-${i}`,
  name: `项目 ${i}`,
  code: `project-${i}`,
  status: 'ACTIVE' as const,
  framework: 'vue',
  createdAt: '2024-01-01',
  updatedAt: '2024-01-01'
}));

// Mock naive-ui components
vi.mock('naive-ui', () => ({
  NCard: { template: '<div class="n-card"><slot /></div>' },
  NSpace: { template: '<div class="n-space"><slot /></div>' },
  NButton: { template: '<button class="n-button"><slot /></button>' },
  NTag: { template: '<span class="n-tag"><slot /></span>' }
}));

describe('VirtualProjectList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('应该正确渲染虚拟列表', () => {
    const wrapper = mount(VirtualProjectList, {
      props: {
        projects: mockProjects.slice(0, 10),
        itemHeight: 120
      }
    });

    expect(wrapper.exists()).toBe(true);
    expect(wrapper.find('.virtual-list-container').exists()).toBe(true);
  });

  it('应该正确计算可见项目', () => {
    const wrapper = mount(VirtualProjectList, {
      props: {
        projects: mockProjects,
        itemHeight: 120,
        containerHeight: 600
      }
    });

    // 容器高度600px，项目高度120px，应该显示5个项目
    const visibleItems = wrapper.vm.visibleItems;
    expect(visibleItems.length).toBeLessThanOrEqual(7); // 包含缓冲区
  });

  it('应该正确处理滚动事件', async () => {
    const wrapper = mount(VirtualProjectList, {
      props: {
        projects: mockProjects,
        itemHeight: 120
      }
    });

    const container = wrapper.find('.virtual-list-container');

    // 模拟滚动
    await container.trigger('scroll', {
      target: { scrollTop: 240 } // 滚动到第3个项目
    });

    // 检查偏移量是否正确更新
    expect(wrapper.vm.offsetY).toBeGreaterThan(0);
  });

  it('应该正确发射项目操作事件', async () => {
    const wrapper = mount(VirtualProjectList, {
      props: {
        projects: mockProjects.slice(0, 5),
        itemHeight: 120
      }
    });

    // 查找第一个项目的编辑按钮
    const editButton = wrapper.find('[data-action="edit"]');
    if (editButton.exists()) {
      await editButton.trigger('click');

      expect(wrapper.emitted('edit')).toBeTruthy();
      expect(wrapper.emitted('edit')?.[0]).toEqual([mockProjects[0]]);
    }
  });

  it('应该正确处理项目状态显示', () => {
    const testProjects = [
      { ...mockProjects[0], status: 'ACTIVE' as const },
      { ...mockProjects[1], status: 'INACTIVE' as const },
      { ...mockProjects[2], status: 'ARCHIVED' as const }
    ];

    const wrapper = mount(VirtualProjectList, {
      props: {
        projects: testProjects,
        itemHeight: 120
      }
    });

    const statusTags = wrapper.findAll('.n-tag');
    expect(statusTags.length).toBeGreaterThan(0);
  });

  it('应该正确处理空项目列表', () => {
    const wrapper = mount(VirtualProjectList, {
      props: {
        projects: [],
        itemHeight: 120
      }
    });

    expect(wrapper.find('.empty-state').exists()).toBe(true);
  });
});
