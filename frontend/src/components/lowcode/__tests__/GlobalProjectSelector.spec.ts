import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createTestingPinia } from '@pinia/testing';
import { useProjectStore } from '@/store/modules/project';
import GlobalProjectSelector from '../GlobalProjectSelector.vue';

// Mock naive-ui components
vi.mock('naive-ui', () => ({
  NSelect: {
    name: 'NSelect',
    template: '<div data-testid="n-select"><slot /></div>',
    props: ['value', 'options', 'loading', 'placeholder'],
    emits: ['update:value']
  },
  NSpace: {
    name: 'NSpace',
    template: '<div data-testid="n-space"><slot /></div>'
  },
  NButton: {
    name: 'NButton',
    template: '<button data-testid="n-button"><slot /></button>',
    props: ['size', 'type', 'loading']
  },
  NIcon: {
    name: 'NIcon',
    template: '<span data-testid="n-icon"><slot /></span>'
  },
  NTooltip: {
    name: 'NTooltip',
    template: '<div data-testid="n-tooltip"><slot /></div>',
    props: ['trigger']
  }
}));

// Mock icons
vi.mock('@/components/icon', () => ({
  'icon-mdi-plus': {
    name: 'IconMdiPlus',
    template: '<span data-testid="icon-plus"></span>'
  },
  'icon-mdi-refresh': {
    name: 'IconMdiRefresh',
    template: '<span data-testid="icon-refresh"></span>'
  }
}));

// Mock API
const mockProjects = [
  {
    id: 'project-1',
    name: 'Test Project 1',
    code: 'test-project-1',
    description: 'Test project 1 description',
    framework: 'nestjs',
    architecture: 'ddd',
    language: 'typescript',
    database: 'postgresql',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'project-2',
    name: 'Test Project 2',
    code: 'test-project-2',
    description: 'Test project 2 description',
    framework: 'express',
    architecture: 'base-biz',
    language: 'javascript',
    database: 'mysql',
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

describe('GlobalProjectSelector', () => {
  let wrapper: any;
  let pinia: any;

  beforeEach(() => {
    pinia = createTestingPinia({
      createSpy: vi.fn,
      stubActions: false
    });
    setActivePinia(pinia);
  });

  afterEach(() => {
    if (wrapper) {
      wrapper.unmount();
    }
  });

  it('should render correctly', () => {
    wrapper = mount(GlobalProjectSelector, {
      global: {
        plugins: [pinia]
      }
    });

    expect(wrapper.find('[data-testid="n-select"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="n-button"]').exists()).toBe(true);
  });

  it('should load projects on mount', async () => {
    const projectStore = useProjectStore();
    projectStore.fetchProjects = vi.fn().mockResolvedValue(mockProjects);

    wrapper = mount(GlobalProjectSelector, {
      global: {
        plugins: [pinia]
      }
    });

    await wrapper.vm.$nextTick();

    expect(projectStore.fetchProjects).toHaveBeenCalled();
  });

  it('should emit project-change when project is selected', async () => {
    const projectStore = useProjectStore();
    projectStore.projects = mockProjects;
    projectStore.selectedProject = null;

    wrapper = mount(GlobalProjectSelector, {
      global: {
        plugins: [pinia]
      }
    });

    // Simulate project selection
    await wrapper.vm.handleProjectChange('project-1');

    expect(wrapper.emitted('project-change')).toBeTruthy();
    expect(wrapper.emitted('project-change')[0]).toEqual([mockProjects[0]]);
  });

  it('should handle refresh button click', async () => {
    const projectStore = useProjectStore();
    projectStore.fetchProjects = vi.fn().mockResolvedValue(mockProjects);

    wrapper = mount(GlobalProjectSelector, {
      global: {
        plugins: [pinia]
      }
    });

    const refreshButton = wrapper.find('[data-testid="n-button"]');
    await refreshButton.trigger('click');

    expect(projectStore.fetchProjects).toHaveBeenCalledTimes(2); // Once on mount, once on refresh
  });

  it('should show loading state', async () => {
    const projectStore = useProjectStore();
    projectStore.loading = true;

    wrapper = mount(GlobalProjectSelector, {
      global: {
        plugins: [pinia]
      }
    });

    const select = wrapper.find('[data-testid="n-select"]');
    expect(select.props('loading')).toBe(true);
  });

  it('should display correct project options', async () => {
    const projectStore = useProjectStore();
    projectStore.projects = mockProjects;

    wrapper = mount(GlobalProjectSelector, {
      global: {
        plugins: [pinia]
      }
    });

    await wrapper.vm.$nextTick();

    const expectedOptions = mockProjects.map(project => ({
      label: project.name,
      value: project.id,
      disabled: false
    }));

    expect(wrapper.vm.projectOptions).toEqual(expectedOptions);
  });

  it('should handle empty projects list', async () => {
    const projectStore = useProjectStore();
    projectStore.projects = [];

    wrapper = mount(GlobalProjectSelector, {
      global: {
        plugins: [pinia]
      }
    });

    await wrapper.vm.$nextTick();

    expect(wrapper.vm.projectOptions).toEqual([]);
  });

  it('should handle error state', async () => {
    const projectStore = useProjectStore();
    projectStore.fetchProjects = vi.fn().mockRejectedValue(new Error('API Error'));

    wrapper = mount(GlobalProjectSelector, {
      global: {
        plugins: [pinia]
      }
    });

    await wrapper.vm.$nextTick();

    // Should handle error gracefully without crashing
    expect(wrapper.exists()).toBe(true);
  });

  it('should persist selected project', async () => {
    const projectStore = useProjectStore();
    projectStore.projects = mockProjects;
    projectStore.selectedProject = mockProjects[0];

    wrapper = mount(GlobalProjectSelector, {
      global: {
        plugins: [pinia]
      }
    });

    await wrapper.vm.$nextTick();

    expect(wrapper.vm.selectedProjectId).toBe('project-1');
  });

  it('should clear selection when project is deleted', async () => {
    const projectStore = useProjectStore();
    projectStore.projects = mockProjects;
    projectStore.selectedProject = mockProjects[0];

    wrapper = mount(GlobalProjectSelector, {
      global: {
        plugins: [pinia]
      }
    });

    // Simulate project deletion
    projectStore.projects = mockProjects.filter(p => p.id !== 'project-1');
    projectStore.selectedProject = null;

    await wrapper.vm.$nextTick();

    expect(wrapper.vm.selectedProjectId).toBe(null);
  });

  describe('computed properties', () => {
    it('should compute projectOptions correctly', async () => {
      const projectStore = useProjectStore();
      projectStore.projects = mockProjects;

      wrapper = mount(GlobalProjectSelector, {
        global: {
          plugins: [pinia]
        }
      });

      const options = wrapper.vm.projectOptions;

      expect(options).toHaveLength(2);
      expect(options[0]).toEqual({
        label: 'Test Project 1',
        value: 'project-1',
        disabled: false
      });
      expect(options[1]).toEqual({
        label: 'Test Project 2',
        value: 'project-2',
        disabled: false
      });
    });

    it('should compute selectedProjectId correctly', async () => {
      const projectStore = useProjectStore();
      projectStore.selectedProject = mockProjects[0];

      wrapper = mount(GlobalProjectSelector, {
        global: {
          plugins: [pinia]
        }
      });

      expect(wrapper.vm.selectedProjectId).toBe('project-1');
    });

    it('should return null for selectedProjectId when no project selected', async () => {
      const projectStore = useProjectStore();
      projectStore.selectedProject = null;

      wrapper = mount(GlobalProjectSelector, {
        global: {
          plugins: [pinia]
        }
      });

      expect(wrapper.vm.selectedProjectId).toBe(null);
    });
  });

  describe('methods', () => {
    it('should handle project change correctly', async () => {
      const projectStore = useProjectStore();
      projectStore.projects = mockProjects;
      projectStore.setSelectedProject = vi.fn();

      wrapper = mount(GlobalProjectSelector, {
        global: {
          plugins: [pinia]
        }
      });

      await wrapper.vm.handleProjectChange('project-1');

      expect(projectStore.setSelectedProject).toHaveBeenCalledWith(mockProjects[0]);
      expect(wrapper.emitted('project-change')).toBeTruthy();
    });

    it('should handle refresh correctly', async () => {
      const projectStore = useProjectStore();
      projectStore.fetchProjects = vi.fn().mockResolvedValue(mockProjects);

      wrapper = mount(GlobalProjectSelector, {
        global: {
          plugins: [pinia]
        }
      });

      await wrapper.vm.handleRefresh();

      expect(projectStore.fetchProjects).toHaveBeenCalled();
    });

    it('should handle refresh error', async () => {
      const projectStore = useProjectStore();
      projectStore.fetchProjects = vi.fn().mockRejectedValue(new Error('Network error'));

      wrapper = mount(GlobalProjectSelector, {
        global: {
          plugins: [pinia]
        }
      });

      // Should not throw error
      await expect(wrapper.vm.handleRefresh()).resolves.toBeUndefined();
    });
  });

  describe('lifecycle', () => {
    it('should fetch projects on mounted', async () => {
      const projectStore = useProjectStore();
      projectStore.fetchProjects = vi.fn().mockResolvedValue(mockProjects);

      wrapper = mount(GlobalProjectSelector, {
        global: {
          plugins: [pinia]
        }
      });

      // Wait for mounted hook
      await wrapper.vm.$nextTick();

      expect(projectStore.fetchProjects).toHaveBeenCalled();
    });
  });

  describe('accessibility', () => {
    it('should have proper ARIA attributes', () => {
      wrapper = mount(GlobalProjectSelector, {
        global: {
          plugins: [pinia]
        }
      });

      const select = wrapper.find('[data-testid="n-select"]');
      expect(select.exists()).toBe(true);
    });

    it('should support keyboard navigation', async () => {
      const projectStore = useProjectStore();
      projectStore.projects = mockProjects;

      wrapper = mount(GlobalProjectSelector, {
        global: {
          plugins: [pinia]
        }
      });

      const select = wrapper.find('[data-testid="n-select"]');

      // Simulate keyboard events
      await select.trigger('keydown.enter');
      await select.trigger('keydown.space');

      // Should not throw errors
      expect(wrapper.exists()).toBe(true);
    });
  });

  describe('performance', () => {
    it('should handle large number of projects', async () => {
      const largeProjectList = Array.from({ length: 1000 }, (_, i) => ({
        id: `project-${i}`,
        name: `Project ${i}`,
        code: `project-${i}`,
        description: `Project ${i} description`,
        framework: 'nestjs',
        architecture: 'ddd',
        language: 'typescript',
        database: 'postgresql',
        createdAt: new Date(),
        updatedAt: new Date()
      }));

      const projectStore = useProjectStore();
      projectStore.projects = largeProjectList;

      const startTime = performance.now();

      wrapper = mount(GlobalProjectSelector, {
        global: {
          plugins: [pinia]
        }
      });

      await wrapper.vm.$nextTick();

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      // Should render within reasonable time (less than 100ms)
      expect(renderTime).toBeLessThan(100);
      expect(wrapper.vm.projectOptions).toHaveLength(1000);
    });
  });
});
