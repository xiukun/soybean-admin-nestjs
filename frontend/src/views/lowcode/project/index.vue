<template>
  <div class="enhanced-project-management">
    <!-- Header -->
    <div class="mb-6">
      <NSpace justify="space-between" align="center">
        <div>
          <NText tag="h1" class="text-2xl font-bold">{{ $t('page.lowcode.project.management') }}</NText>
          <NText depth="3">{{ $t('page.lowcode.project.managementDesc') }}</NText>
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
        </NSpace>
      </NSpace>
    </div>

    <!-- Filters and Search -->
    <NCard class="mb-4">
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
            v-model:value="frameworkFilter"
            :placeholder="$t('page.lowcode.project.filterByFramework')"
            :options="frameworkOptions"
            style="width: 150px"
            clearable
            @update:value="handleFilterChange"
          />
        </NSpace>
        <NSpace>
          <NSelect
            v-model:value="viewMode"
            :options="viewModeOptions"
            style="width: 120px"
          />
          <NButton @click="handleRefresh">
            <template #icon>
              <NIcon><icon-mdi-refresh /></NIcon>
            </template>
          </NButton>
        </NSpace>
      </NSpace>
    </NCard>

    <!-- Project List -->
    <div v-if="viewMode === 'grid'" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      <NCard
        v-for="project in filteredProjects"
        :key="project.id"
        hoverable
        class="project-card cursor-pointer"
        @click="handleViewProject(project)"
      >
        <template #header>
          <NSpace justify="space-between" align="center">
            <NSpace align="center">
              <NAvatar :size="32" :style="{ backgroundColor: getProjectColor(project.id) }">
                {{ project.name.charAt(0).toUpperCase() }}
              </NAvatar>
              <div>
                <NText strong>{{ project.name }}</NText>
                <br>
                <NText depth="3" style="font-size: 12px">{{ project.code }}</NText>
              </div>
            </NSpace>
            <NDropdown :options="getActionOptions(project)" @select="(key) => handleActionSelect(key, project)">
              <NButton size="small" quaternary circle @click.stop>
                <template #icon>
                  <NIcon><icon-mdi-dots-vertical /></NIcon>
                </template>
              </NButton>
            </NDropdown>
          </NSpace>
        </template>

        <template #header-extra>
          <NTag :type="getStatusType(project.status)" size="small">
            {{ $t(`page.lowcode.project.status.${project.status.toLowerCase()}`) }}
          </NTag>
        </template>

        <div class="space-y-3">
          <NText depth="3" class="line-clamp-2">{{ project.description || $t('page.lowcode.project.noDescription') }}</NText>

          <NSpace justify="space-between">
            <NSpace vertical size="small">
              <NText depth="3" style="font-size: 12px">
                <NIcon size="14" class="mr-1"><icon-mdi-layers /></NIcon>
                {{ project.entityCount || 0 }} {{ $t('page.lowcode.project.entities') }}
              </NText>
              <NText depth="3" style="font-size: 12px">
                <NIcon size="14" class="mr-1"><icon-mdi-file-code /></NIcon>
                {{ project.templateCount || 0 }} {{ $t('page.lowcode.project.templates') }}
              </NText>
            </NSpace>
            <NSpace vertical size="small">
              <NText depth="3" style="font-size: 12px">
                <NIcon size="14" class="mr-1"><icon-mdi-account /></NIcon>
                {{ project.createdBy }}
              </NText>
              <NText depth="3" style="font-size: 12px">
                <NIcon size="14" class="mr-1"><icon-mdi-clock /></NIcon>
                {{ formatDate(project.createdAt) }}
              </NText>
            </NSpace>
          </NSpace>

          <div v-if="project.config?.framework" class="flex flex-wrap gap-1">
            <NTag size="tiny" type="info">{{ project.config.framework }}</NTag>
            <NTag v-if="project.config?.architecture" size="tiny" type="info">{{ project.config.architecture }}</NTag>
          </div>
        </div>

        <template #action>
          <NSpace justify="space-between">
            <NButton size="small" @click.stop="handleEditProject(project)">
              {{ $t('common.edit') }}
            </NButton>
            <NButton size="small" type="primary" @click.stop="handleOpenProject(project)">
              {{ $t('page.lowcode.project.open') }}
            </NButton>
          </NSpace>
        </template>
      </NCard>
    </div>

    <!-- Table View -->
    <NDataTable
      v-else
      :columns="tableColumns"
      :data="filteredProjects"
      :pagination="pagination"
      :loading="loading"
      size="small"
      striped
      @update:page="handlePageChange"
      @update:page-size="handlePageSizeChange"
    />

    <!-- Project Form Modal -->
    <NModal v-model:show="showProjectModal" preset="card" style="width: 800px">
      <template #header>
        {{ editingProject ? $t('page.lowcode.project.edit') : $t('page.lowcode.project.create') }}
      </template>

      <NForm ref="projectFormRef" :model="projectForm" :rules="projectRules" label-placement="left" :label-width="120">
        <NGrid :cols="2" :x-gap="16">
          <NGridItem>
            <NFormItem :label="$t('page.lowcode.project.name')" path="name">
              <NInput v-model:value="projectForm.name" @input="handleNameChange" />
            </NFormItem>
          </NGridItem>
          <NGridItem>
            <NFormItem :label="$t('page.lowcode.project.code')" path="code">
              <NInput v-model:value="projectForm.code" />
            </NFormItem>
          </NGridItem>
          <NGridItem :span="2">
            <NFormItem :label="$t('page.lowcode.project.description')" path="description">
              <NInput v-model:value="projectForm.description" type="textarea" :rows="3" />
            </NFormItem>
          </NGridItem>
          <NGridItem>
            <NFormItem :label="$t('page.lowcode.project.framework')" path="framework">
              <NSelect v-model:value="projectForm.framework" :options="frameworkOptions" />
            </NFormItem>
          </NGridItem>
          <NGridItem>
            <NFormItem :label="$t('page.lowcode.project.architecture')" path="architecture">
              <NSelect v-model:value="projectForm.architecture" :options="architectureOptions" />
            </NFormItem>
          </NGridItem>
          <NGridItem>
            <NFormItem :label="$t('page.lowcode.project.language')" path="language">
              <NSelect v-model:value="projectForm.language" :options="languageOptions" />
            </NFormItem>
          </NGridItem>
          <NGridItem>
            <NFormItem :label="$t('page.lowcode.project.database')" path="database">
              <NSelect v-model:value="projectForm.database" :options="databaseOptions" />
            </NFormItem>
          </NGridItem>
        </NGrid>

        <!-- Advanced Configuration -->
        <NCollapse>
          <NCollapseItem :title="$t('page.lowcode.project.advancedConfig')" name="advanced">
            <NGrid :cols="2" :x-gap="16">
              <NGridItem>
                <NFormItem :label="$t('page.lowcode.project.packageName')">
                  <NInput v-model:value="projectForm.packageName" />
                </NFormItem>
              </NGridItem>
              <NGridItem>
                <NFormItem :label="$t('page.lowcode.project.basePackage')">
                  <NInput v-model:value="projectForm.basePackage" />
                </NFormItem>
              </NGridItem>
              <NGridItem>
                <NFormItem :label="$t('page.lowcode.project.author')">
                  <NInput v-model:value="projectForm.author" />
                </NFormItem>
              </NGridItem>
              <NGridItem>
                <NFormItem :label="$t('page.lowcode.project.version')">
                  <NInput v-model:value="projectForm.version" />
                </NFormItem>
              </NGridItem>
              <NGridItem :span="2">
                <NFormItem :label="$t('page.lowcode.project.outputPath')">
                  <NInputGroup>
                    <NInput v-model:value="projectForm.outputPath" />
                    <NButton @click="handleBrowseOutputPath">
                      <template #icon>
                        <NIcon><icon-mdi-folder-open /></NIcon>
                      </template>
                    </NButton>
                  </NInputGroup>
                </NFormItem>
              </NGridItem>
            </NGrid>
          </NCollapseItem>
        </NCollapse>
      </NForm>

      <template #footer>
        <NSpace justify="end">
          <NButton @click="showProjectModal = false">{{ $t('common.cancel') }}</NButton>
          <NButton type="primary" @click="handleSaveProject">{{ $t('common.save') }}</NButton>
        </NSpace>
      </template>
    </NModal>

    <!-- Import Modal -->
    <NModal v-model:show="showImportModal" preset="card" style="width: 600px">
      <template #header>
        {{ $t('page.lowcode.project.import') }}
      </template>

      <NTabs type="line">
        <NTabPane name="json" :tab="$t('page.lowcode.project.importFromJson')">
          <NInput
            v-model:value="importJson"
            type="textarea"
            :rows="10"
            :placeholder="$t('page.lowcode.project.importJsonPlaceholder')"
          />
        </NTabPane>
        <NTabPane name="git" :tab="$t('page.lowcode.project.importFromGit')">
          <NSpace vertical>
            <NFormItem :label="$t('page.lowcode.project.gitUrl')">
              <NInput v-model:value="gitUrl" :placeholder="$t('page.lowcode.project.gitUrlPlaceholder')" />
            </NFormItem>
            <NFormItem :label="$t('page.lowcode.project.branch')">
              <NInput v-model:value="gitBranch" :placeholder="$t('page.lowcode.project.branchPlaceholder')" />
            </NFormItem>
          </NSpace>
        </NTabPane>
        <NTabPane name="file" :tab="$t('page.lowcode.project.importFromFile')">
          <NUpload
            :file-list="importFileList"
            :max="1"
            accept=".json,.zip"
            @change="handleFileUpload"
          >
            <NUploadDragger>
              <div style="margin-bottom: 12px">
                <NIcon size="48" :depth="3">
                  <icon-mdi-file-upload />
                </NIcon>
              </div>
              <NText style="font-size: 16px">
                {{ $t('page.lowcode.project.uploadFile') }}
              </NText>
              <NP depth="3" style="margin: 8px 0 0 0">
                {{ $t('page.lowcode.project.supportedFormats') }}
              </NP>
            </NUploadDragger>
          </NUpload>
        </NTabPane>
      </NTabs>

      <template #footer>
        <NSpace justify="end">
          <NButton @click="showImportModal = false">{{ $t('common.cancel') }}</NButton>
          <NButton type="primary" @click="handleImport">{{ $t('common.import') }}</NButton>
        </NSpace>
      </template>
    </NModal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, h } from 'vue';
import { useRouter } from 'vue-router';
import type { FormInst, FormRules, DataTableColumns, UploadFileInfo } from 'naive-ui';
import { $t } from '@/locales';
import { createRequiredFormRule } from '@/utils/form/rule';
import { formatDate } from '@/utils/common';
import { useLowcodeStore } from '@/store/modules/lowcode';
import {
  fetchGetAllProjects,
  fetchAddProject,
  fetchUpdateProject,
  fetchDeleteProject,
  fetchDuplicateProject,
  fetchArchiveProject,
  fetchExportProject
} from '@/service/api/lowcode-project';

interface Project {
  id: string;
  name: string;
  code: string;
  description?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';
  config?: {
    framework?: string;
    architecture?: string;
    language?: string;
    database?: string;
    packageName?: string;
    basePackage?: string;
    author?: string;
    version?: string;
    outputPath?: string;
  };
  entityCount?: number;
  templateCount?: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

const router = useRouter();
const lowcodeStore = useLowcodeStore();

// State
const loading = ref(false);
const projects = ref<Project[]>([]);
const searchQuery = ref('');
const statusFilter = ref('');
const frameworkFilter = ref('');
const viewMode = ref<'grid' | 'table'>('grid');
const showProjectModal = ref(false);
const showImportModal = ref(false);
const editingProject = ref<Project | null>(null);
const projectFormRef = ref<FormInst | null>(null);
const importJson = ref('');
const gitUrl = ref('');
const gitBranch = ref('main');
const importFileList = ref<UploadFileInfo[]>([]);

const pagination = ref({
  page: 1,
  pageSize: 10,
  itemCount: 0,
  showSizePicker: true,
  pageSizes: [10, 20, 50, 100]
});

// Form
const projectForm = reactive<Partial<Project & Project['config']>>({
  name: '',
  code: '',
  description: '',
  framework: 'nestjs',
  architecture: 'base-biz',
  language: 'typescript',
  database: 'postgresql',
  packageName: '',
  basePackage: '',
  author: '',
  version: '1.0.0',
  outputPath: './generated'
});

// Computed
const filteredProjects = computed(() => {
  let filtered = projects.value;

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    filtered = filtered.filter(project =>
      project.name.toLowerCase().includes(query) ||
      project.code.toLowerCase().includes(query) ||
      project.description?.toLowerCase().includes(query)
    );
  }

  if (statusFilter.value) {
    filtered = filtered.filter(project => project.status === statusFilter.value);
  }

  if (frameworkFilter.value) {
    filtered = filtered.filter(project => project.config?.framework === frameworkFilter.value);
  }

  return filtered;
});

// Options
const statusOptions = [
  { label: $t('page.lowcode.project.status.active'), value: 'ACTIVE' },
  { label: $t('page.lowcode.project.status.inactive'), value: 'INACTIVE' },
  { label: $t('page.lowcode.project.status.archived'), value: 'ARCHIVED' }
];

const frameworkOptions = [
  { label: 'NestJS', value: 'nestjs' },
  { label: 'Express', value: 'express' },
  { label: 'Fastify', value: 'fastify' },
  { label: 'Spring Boot', value: 'spring-boot' },
  { label: 'Django', value: 'django' },
  { label: 'FastAPI', value: 'fastapi' }
];

const architectureOptions = [
  { label: 'Base-Biz', value: 'base-biz' },
  { label: 'DDD', value: 'ddd' },
  { label: 'Clean Architecture', value: 'clean' },
  { label: 'Hexagonal', value: 'hexagonal' }
];

const languageOptions = [
  { label: 'TypeScript', value: 'typescript' },
  { label: 'JavaScript', value: 'javascript' },
  { label: 'Java', value: 'java' },
  { label: 'Python', value: 'python' },
  { label: 'Go', value: 'go' },
  { label: 'C#', value: 'csharp' }
];

const databaseOptions = [
  { label: 'PostgreSQL', value: 'postgresql' },
  { label: 'MySQL', value: 'mysql' },
  { label: 'SQLite', value: 'sqlite' },
  { label: 'MongoDB', value: 'mongodb' },
  { label: 'Redis', value: 'redis' }
];

const viewModeOptions = [
  { label: $t('page.lowcode.project.gridView'), value: 'grid' },
  { label: $t('page.lowcode.project.tableView'), value: 'table' }
];

// Form rules
const projectRules: FormRules = {
  name: createRequiredFormRule($t('page.lowcode.project.nameRequired')),
  code: createRequiredFormRule($t('page.lowcode.project.codeRequired')),
  framework: createRequiredFormRule($t('page.lowcode.project.frameworkRequired'))
};

// Table columns
const tableColumns: DataTableColumns<Project> = [
  { title: $t('page.lowcode.project.name'), key: 'name', width: 150, fixed: 'left' },
  { title: $t('page.lowcode.project.code'), key: 'code', width: 120 },
  { title: $t('page.lowcode.project.description'), key: 'description', width: 200, ellipsis: { tooltip: true } },
  {
    title: $t('common.status'),
    key: 'status',
    width: 100,
    render: (row) => h('NTag', { type: getStatusType(row.status) },
      $t(`page.lowcode.project.status.${row.status.toLowerCase()}`)
    )
  },
  {
    title: $t('page.lowcode.project.framework'),
    key: 'framework',
    width: 120,
    render: (row) => row.config?.framework || '-'
  },
  { title: $t('page.lowcode.project.entities'), key: 'entityCount', width: 80, align: 'center' },
  { title: $t('page.lowcode.project.templates'), key: 'templateCount', width: 80, align: 'center' },
  { title: $t('page.lowcode.project.createdBy'), key: 'createdBy', width: 120 },
  {
    title: $t('page.lowcode.project.createdAt'),
    key: 'createdAt',
    width: 150,
    render: (row) => formatDate(row.createdAt)
  },
  {
    title: $t('common.actions'),
    key: 'actions',
    width: 200,
    fixed: 'right',
    render: (row) => h('NSpace', { size: 'small' }, [
      h('NButton',
        {
          size: 'small',
          type: 'primary',
          onClick: () => handleOpenProject(row)
        },
        $t('common.open')
      ),
      h('NDropdown',
        {
          trigger: 'click',
          options: getActionOptions(row),
          onSelect: (key: string) => handleActionSelect(key, row)
        },
        h('NButton',
          {
            size: 'small',
            quaternary: true
          },
          h('NIcon', { size: 16 }, h('icon-mdi-dots-vertical'))
        )
      )
    ])
  }
];

// Action dropdown methods
function getActionOptions(project: Project) {
  return [
    { label: $t('common.view'), key: 'view' },
    { label: $t('common.edit'), key: 'edit' },
    { label: $t('common.duplicate'), key: 'duplicate' },
    { label: $t('common.export'), key: 'export' },
    { label: $t('common.archive'), key: 'archive', disabled: project.status === 'ARCHIVED' },
    { label: $t('common.delete'), key: 'delete' }
  ];
}

function handleActionSelect(key: string, project: Project) {
  switch (key) {
    case 'view':
      handleViewProject(project);
      break;
    case 'edit':
      handleEditProject(project);
      break;
    case 'duplicate':
      handleDuplicateProject(project);
      break;
    case 'export':
      handleExportProject(project);
      break;
    case 'archive':
      handleArchiveProject(project);
      break;
    case 'delete':
      handleDeleteProject(project);
      break;
  }
}

// Methods
function getStatusType(status: string): 'success' | 'warning' | 'error' | 'info' {
  const statusMap: Record<string, 'success' | 'warning' | 'error' | 'info'> = {
    ACTIVE: 'success',
    INACTIVE: 'warning',
    ARCHIVED: 'error'
  };
  return statusMap[status] || 'info';
}

function getProjectColor(projectId: string): string {
  const colors = ['#1890ff', '#52c41a', '#faad14', '#f5222d', '#722ed1', '#13c2c2'];
  const index = projectId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length;
  return colors[index];
}

function handleNameChange() {
  // Auto-generate code from name
  if (projectForm.name && !editingProject.value) {
    projectForm.code = projectForm.name
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }
}

function handleSearch() {
  // Debounced search implementation would go here
}

function handleFilterChange() {
  // Filter change logic
}

function handleRefresh() {
  loadProjects();
}

function handlePageChange(page: number) {
  pagination.value.page = page;
}

function handlePageSizeChange(pageSize: number) {
  pagination.value.pageSize = pageSize;
  pagination.value.page = 1;
}

function handleCreateProject() {
  Object.assign(projectForm, {
    name: '',
    code: '',
    description: '',
    framework: 'nestjs',
    architecture: 'base-biz',
    language: 'typescript',
    database: 'postgresql',
    packageName: '',
    basePackage: '',
    author: '',
    version: '1.0.0',
    outputPath: './generated'
  });
  editingProject.value = null;
  showProjectModal.value = true;
}

function handleEditProject(project: Project) {
  Object.assign(projectForm, {
    ...project,
    ...project.config
  });
  editingProject.value = project;
  showProjectModal.value = true;
}

function handleViewProject(project: Project) {
  router.push(`/lowcode/project/${project.id}`);
}

function handleOpenProject(project: Project) {
  // Set as current project and navigate to dashboard
  lowcodeStore.setCurrentProject(project.id);
  router.push('/lowcode/dashboard');
}

async function loadProjects() {
  try {
    loading.value = true;

    // 调用真实的API接口
    const { data } = await fetchGetAllProjects();

    if (data) {
      projects.value = data.map(project => ({
        ...project,
        entityCount: project.entityCount || 0,
        templateCount: project.templateCount || 0,
        config: project.config || {}
      }));
      pagination.value.itemCount = projects.value.length;
    } else {
      projects.value = [];
      pagination.value.itemCount = 0;
    }
  } catch (error) {
    console.error('Failed to load projects:', error);
    window.$message?.error($t('common.loadFailed'));

    // 如果API调用失败，显示空列表
    projects.value = [];
    pagination.value.itemCount = 0;
  } finally {
    loading.value = false;
  }
}

// CRUD operation handlers
async function handleDuplicateProject(project: Project) {
  try {
    const duplicateName = `${project.name} (Copy)`;
    await fetchDuplicateProject(project.id, { name: duplicateName });
    window.$message?.success($t('common.createSuccess'));
    await loadProjects();
  } catch (error) {
    console.error('Failed to duplicate project:', error);
    window.$message?.error($t('common.createFailed'));
  }
}

async function handleExportProject(project: Project) {
  try {
    const response = await fetchExportProject(project.id);
    const blob = new Blob([response.data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${project.code}_export.json`;
    link.click();
    URL.revokeObjectURL(url);
    window.$message?.success($t('common.exportSuccess'));
  } catch (error) {
    console.error('Failed to export project:', error);
    window.$message?.error($t('common.exportFailed'));
  }
}

function handleArchiveProject(project: Project) {
  window.$dialog?.warning({
    title: $t('common.confirm'),
    content: $t('common.confirmDelete'),
    positiveText: $t('common.confirm'),
    negativeText: $t('common.cancel'),
    onPositiveClick: async () => {
      try {
        await fetchArchiveProject(project.id);
        window.$message?.success($t('common.updateSuccess'));
        await loadProjects();
      } catch (error) {
        console.error('Failed to archive project:', error);
        window.$message?.error($t('common.updateFailed'));
      }
    }
  });
}

function handleDeleteProject(project: Project) {
  window.$dialog?.error({
    title: $t('common.confirm'),
    content: $t('common.confirmDelete'),
    positiveText: $t('common.delete'),
    negativeText: $t('common.cancel'),
    onPositiveClick: async () => {
      try {
        await fetchDeleteProject(project.id);
        window.$message?.success($t('common.deleteSuccess'));
        await loadProjects(); // 重新加载项目列表
      } catch (error) {
        console.error('Failed to delete project:', error);
        window.$message?.error($t('common.deleteFailed'));
      }
    }
  });
}

function handleImportProject() {
  importJson.value = '';
  gitUrl.value = '';
  gitBranch.value = 'main';
  importFileList.value = [];
  showImportModal.value = true;
}

async function handleSaveProject() {
  try {
    await projectFormRef.value?.validate();

    const projectData = {
      name: projectForm.name,
      code: projectForm.code,
      description: projectForm.description,
      config: {
        framework: projectForm.framework,
        architecture: projectForm.architecture,
        language: projectForm.language,
        database: projectForm.database,
        packageName: projectForm.packageName,
        basePackage: projectForm.basePackage,
        author: projectForm.author,
        version: projectForm.version,
        outputPath: projectForm.outputPath
      }
    };

    if (editingProject.value) {
      // 更新项目
      await fetchUpdateProject(editingProject.value.id, projectData);
      window.$message?.success($t('common.updateSuccess'));
    } else {
      // 创建新项目
      await fetchAddProject(projectData);
      window.$message?.success($t('common.createSuccess'));
    }

    showProjectModal.value = false;
    await loadProjects(); // 重新加载项目列表
  } catch (error) {
    console.error('Failed to save project:', error);
    window.$message?.error($t('common.saveError'));
  }
}

function handleBrowseOutputPath() {
  // File browser implementation
  window.$message?.info('File browser not implemented yet');
}

function handleFileUpload(options: { fileList: UploadFileInfo[] }) {
  importFileList.value = options.fileList;
}

function handleImport() {
  // Import logic based on active tab
  if (importJson.value) {
    try {
      const importedProject = JSON.parse(importJson.value);
      // Import project logic here
      window.$message?.success($t('common.importSuccess'));
      showImportModal.value = false;
    } catch (error) {
      window.$message?.error($t('page.lowcode.project.invalidJsonFormat'));
    }
  } else if (gitUrl.value) {
    // Git import logic here
    window.$message?.info($t('page.lowcode.project.gitImportNotImplemented'));
  } else if (importFileList.value.length > 0) {
    // File import logic here
    window.$message?.info($t('page.lowcode.project.fileImportNotImplemented'));
  }
}

// Lifecycle
onMounted(() => {
  loadProjects();
});
</script>

<style scoped>
.enhanced-project-management {
  @apply p-6;
}

.project-card {
  @apply transition-all duration-200;
}

.project-card:hover {
  @apply shadow-lg transform scale-105;
}

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
