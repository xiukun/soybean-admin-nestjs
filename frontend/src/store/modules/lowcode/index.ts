import { computed, ref } from 'vue';
import { defineStore } from 'pinia';
import { fetchGetAllProjects, fetchGetProject } from '@/service/api';

export interface Project {
  id: string;
  name: string;
  code: string;
  description?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';
  config?: Record<string, any>;
  createdAt: string;
  updatedAt?: string;
}

export interface Entity {
  id: string;
  projectId: string;
  name: string;
  code: string;
  tableName: string;
  description?: string;
  category: string;
  status: 'DRAFT' | 'ACTIVE' | 'INACTIVE';
  fields?: Field[];
}

export interface Field {
  id: string;
  entityId: string;
  name: string;
  code: string;
  type: string;
  length?: number;
  nullable: boolean;
  primaryKey: boolean;
  uniqueConstraint: boolean;
  defaultValue?: any;
  comment?: string;
  sortOrder: number;
}

export interface Template {
  id: string;
  projectId: string;
  name: string;
  code: string;
  description?: string;
  type: 'ENTITY' | 'PROJECT' | 'CUSTOM';
  language: string;
  framework?: string;
  category: string;
  content: string;
  variables: TemplateVariable[];
  tags: string[];
  version: string;
  status: 'ACTIVE' | 'INACTIVE' | 'DRAFT';
}

export interface TemplateVariable {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  required: boolean;
  defaultValue?: any;
  description?: string;
  options?: string[];
}

export interface GenerationHistory {
  id: string;
  projectId: string;
  templateIds: string[];
  entityIds: string[];
  status: 'PENDING' | 'RUNNING' | 'SUCCESS' | 'FAILED';
  filesGenerated: number;
  outputPath: string;
  variables: Record<string, any>;
  options: GenerationOptions;
  startTime: string;
  endTime?: string;
  errors?: string[];
}

export interface GenerationOptions {
  overwriteExisting: boolean;
  generateTests: boolean;
  generateDocs: boolean;
  architecture: string;
  framework: string;
}

export const useLowcodeStore = defineStore('lowcode', () => {
  // State
  const currentProject = ref<Project | null>(null);
  const projects = ref<Project[]>([]);
  const entities = ref<Entity[]>([]);
  const templates = ref<Template[]>([]);
  const generationHistory = ref<GenerationHistory[]>([]);

  const loading = ref({
    projects: false,
    entities: false,
    templates: false,
    generation: false,
    history: false
  });

  // Computed
  const currentProjectId = computed(() => currentProject.value?.id || '');
  const activeProjects = computed(() => projects.value.filter(p => p.status === 'ACTIVE'));
  const currentProjectEntities = computed(() => entities.value.filter(e => e.projectId === currentProjectId.value));
  const currentProjectTemplates = computed(() => templates.value.filter(t => t.projectId === currentProjectId.value));

  // Actions
  async function loadProjects() {
    try {
      loading.value.projects = true;
      const { data } = await fetchGetAllProjects();
      if (data) {
        projects.value = data;

        // Only restore from localStorage, don't auto-select first project
        // This prevents unwanted automatic navigation to demo-project-1
      }
    } catch (error) {
      console.error('Failed to load projects:', error);
      throw error;
    } finally {
      loading.value.projects = false;
    }
  }

  async function setCurrentProject(projectId: string) {
    try {
      const project = projects.value.find(p => p.id === projectId);
      if (project) {
        currentProject.value = project;
        // Store in localStorage for persistence
        localStorage.setItem('lowcode_current_project', projectId);

        // Load project-specific data
        await Promise.all([
          loadProjectEntities(projectId),
          loadProjectTemplates(projectId),
          loadGenerationHistory(projectId)
        ]);
      } else {
        // Fetch project details if not in cache
        const { data } = await fetchGetProject(projectId);
        if (data) {
          currentProject.value = data;
          localStorage.setItem('lowcode_current_project', projectId);

          await Promise.all([
            loadProjectEntities(projectId),
            loadProjectTemplates(projectId),
            loadGenerationHistory(projectId)
          ]);
        }
      }
    } catch (error) {
      console.error('Failed to set current project:', error);
      throw error;
    }
  }

  async function loadProjectEntities(projectId: string) {
    try {
      loading.value.entities = true;
      // This would be implemented based on your API
      // const { data } = await fetchGetProjectEntities(projectId);
      // entities.value = data || [];
    } catch (error) {
      console.error('Failed to load project entities:', error);
    } finally {
      loading.value.entities = false;
    }
  }

  async function loadProjectTemplates(projectId: string) {
    try {
      loading.value.templates = true;
      // This would be implemented based on your API
      // const { data } = await fetchGetProjectTemplates(projectId);
      // templates.value = data || [];
    } catch (error) {
      console.error('Failed to load project templates:', error);
    } finally {
      loading.value.templates = false;
    }
  }

  async function loadGenerationHistory(projectId: string) {
    try {
      loading.value.history = true;
      // This would be implemented based on your API
      // const { data } = await fetchGetGenerationHistory(projectId);
      // generationHistory.value = data || [];
    } catch (error) {
      console.error('Failed to load generation history:', error);
    } finally {
      loading.value.history = false;
    }
  }

  function addGenerationRecord(record: GenerationHistory) {
    generationHistory.value.unshift(record);
  }

  function updateGenerationRecord(id: string, updates: Partial<GenerationHistory>) {
    const index = generationHistory.value.findIndex(r => r.id === id);
    if (index !== -1) {
      generationHistory.value[index] = { ...generationHistory.value[index], ...updates };
    }
  }

  function clearCurrentProject() {
    currentProject.value = null;
    entities.value = [];
    templates.value = [];
    generationHistory.value = [];
    localStorage.removeItem('lowcode_current_project');
  }

  // Initialize from localStorage
  function initializeFromStorage() {
    const savedProjectId = localStorage.getItem('lowcode_current_project');
    if (savedProjectId) {
      // Will be set after projects are loaded
      return savedProjectId;
    }
    return null;
  }

  return {
    // State
    currentProject,
    projects,
    entities,
    templates,
    generationHistory,
    loading,

    // Computed
    currentProjectId,
    activeProjects,
    currentProjectEntities,
    currentProjectTemplates,

    // Actions
    loadProjects,
    setCurrentProject,
    loadProjectEntities,
    loadProjectTemplates,
    loadGenerationHistory,
    addGenerationRecord,
    updateGenerationRecord,
    clearCurrentProject,
    initializeFromStorage
  };
});

export type LowcodeStore = ReturnType<typeof useLowcodeStore>;
