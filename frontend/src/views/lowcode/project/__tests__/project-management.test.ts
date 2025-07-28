import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import ProjectManagement from '../components/ProjectManagement.vue';

// Mock naive-ui components
vi.mock('naive-ui', () => ({
  NCard: { template: '<div><slot /></div>' },
  NSpace: { template: '<div><slot /></div>' },
  NInput: { template: '<input />' },
  NSelect: { template: '<select><slot /></select>' },
  NButton: { template: '<button><slot /></button>' },
  NDataTable: { template: '<table><slot /></table>' },
  NPagination: { template: '<div><slot /></div>' },
  useMessage: () => ({
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn()
  })
}));

// Mock i18n
vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: (key: string) => key
  })
}));

describe('ProjectManagement', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('应该正确渲染项目管理组件', () => {
    const wrapper = mount(ProjectManagement);
    expect(wrapper.exists()).toBe(true);
  });

  it('应该包含搜索输入框', () => {
    const wrapper = mount(ProjectManagement);
    const searchInput = wrapper.find('input');
    expect(searchInput.exists()).toBe(true);
  });

  it('应该包含状态过滤选择器', () => {
    const wrapper = mount(ProjectManagement);
    const selects = wrapper.findAll('select');
    expect(selects.length).toBeGreaterThan(0);
  });

  it('应该包含数据表格', () => {
    const wrapper = mount(ProjectManagement);
    const table = wrapper.find('table');
    expect(table.exists()).toBe(true);
  });

  it('应该包含分页组件', () => {
    const wrapper = mount(ProjectManagement);
    // 检查是否有分页相关的元素
    expect(wrapper.html()).toContain('pagination');
  });
});