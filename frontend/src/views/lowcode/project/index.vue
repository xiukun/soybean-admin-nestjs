<script setup lang="ts">
// @ts-nocheck
import { computed, h, onMounted, onUnmounted, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import type { DataTableColumns, FormInst, FormRules, UploadFileInfo } from 'naive-ui';
import {
  fetchAddProject,
  fetchArchiveProject,
  fetchDeleteProject,
  fetchDuplicateProject,
  fetchExportProject,
  fetchGetAllProjects,
  fetchUpdateProject
} from '@/service/api/lowcode-project';
import { useLowcodeStore } from '@/store/modules/lowcode';
import { createRequiredFormRule } from '@/utils/form/rule';
import { formatDate } from '@/utils/common';
import { $t } from '@/locales';
import ProjectCard from './modules/project-card.vue';

interface Project {
  id: string;
  name: string;
  code: string;
  description?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';
  // 新增部署相关字段
  deploymentStatus?: 'INACTIVE' | 'DEPLOYING' | 'DEPLOYED' | 'FAILED';
  deploymentPort?: number;
  deploymentConfig?: any;
  lastDeployedAt?: string;
  deploymentLogs?: string;
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

// 部署相关状态
const deployingProjects = ref(new Set<string>());
const stoppingProjects = ref(new Set<string>());
const showDeployModal = ref(false);
const deployingProject = ref<Project | null>(null);
const deployForm = reactive({
  port: 9522,
  config: {
    autoRestart: true,
    environment: 'development'
  }
});

// 防抖搜索
const searchDebounceTimer = ref<NodeJS.Timeout | null>(null);

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
    filtered = filtered.filter(
      project =>
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

  // Update pagination item count
  pagination.value.itemCount = filtered.length;

  return filtered;
});

// Paginated projects for grid view
const paginatedProjects = computed(() => {
  if (viewMode.value === 'table') {
    return filteredProjects.value; // Table handles its own pagination
  }

  const start = (pagination.value.page - 1) * pagination.value.pageSize;
  const end = start + pagination.value.pageSize;
  return filteredProjects.value.slice(start, end);
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
    render: row => h('NTag', { type: getStatusType(row.status) }, $t(`page.lowcode.project.status.${row.status}`))
  },
  {
    title: $t('page.lowcode.project.framework'),
    key: 'framework',
    width: 120,
    render: row => row.config?.framework || '-'
  },
  { title: $t('page.lowcode.project.entities'), key: 'entityCount', width: 80, align: 'center' },
  { title: $t('page.lowcode.project.relationships'), key: 'relationshipCount', width: 80, align: 'center' },
  { title: $t('page.lowcode.project.generatedFiles'), key: 'generatedFiles', width: 80, align: 'center' },
  { title: $t('page.lowcode.project.templates'), key: 'templateCount', width: 80, align: 'center' },
  {
    title: $t('page.lowcode.project.deploymentStatus'),
    key: 'deploymentStatus',
    width: 120,
    render: row => {
      const statusMap = {
        INACTIVE: { type: 'default', text: $t('page.lowcode.project.deploymentStatus.inactive') },
        DEPLOYING: { type: 'warning', text: $t('page.lowcode.project.deploymentStatus.deploying') },
        DEPLOYED: { type: 'success', text: $t('page.lowcode.project.deploymentStatus.deployed') },
        FAILED: { type: 'error', text: $t('page.lowcode.project.deploymentStatus.failed') }
      };
      const status = statusMap[row.deploymentStatus || 'INACTIVE'];
      return h('NTag', { type: status.type as any }, status.text);
    }
  },
  { title: $t('page.lowcode.project.createdBy'), key: 'createdBy', width: 120 },
  {
    title: $t('page.lowcode.project.createdAt'),
    key: 'createdAt',
    width: 150,
    render: row => formatDate(row.createdAt)
  },
  {
    title: $t('page.lowcode.project.updatedAt'),
    key: 'updatedAt',
    width: 150,
    render: row => {
      const updateTime = formatDate(row.updatedAt);
      const isRecent = new Date().getTime() - new Date(row.updatedAt).getTime() < 24 * 60 * 60 * 1000;
      return h('div', {
        style: isRecent ? { color: '#18a058', fontWeight: 'bold' } : {}
      }, updateTime);
    }
  },
  {
    title: $t('common.actions'),
    key: 'actions',
    width: 280,
    fixed: 'right',
    render: row =>
      h('NSpace', { size: 'small' }, [
        h(
          'NButton',
          {
            size: 'small',
            type: 'info',
            onClick: () => handleViewProject(row)
          },
          $t('common.view')
        ),
        h(
          'NButton',
          {
            size: 'small',
            type: 'primary',
            onClick: () => handleEditProject(row)
          },
          $t('common.edit')
        ),
        h(
          'NButton',
          {
            size: 'small',
            onClick: () => handleOpenProject(row)
          },
          $t('common.open')
        ),
        h(
          'NDropdown',
          {
            trigger: 'click',
            options: getActionOptions(row),
            onSelect: (key: string) => handleActionSelect(key, row)
          },
          h(
            'NButton',
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
  const baseOptions = [
    { label: $t('common.view'), key: 'view' },
    { label: $t('common.edit'), key: 'edit' },
    { label: $t('common.duplicate'), key: 'duplicate' },
    { label: $t('common.export'), key: 'export' }
  ];

  // 添加部署相关选项
  const deploymentOptions = [];
  if (project.deploymentStatus === 'INACTIVE' || project.deploymentStatus === 'FAILED') {
    deploymentOptions.push({
      label: '部署项目',
      key: 'deploy',
      icon: 'rocket-launch'
    });
  } else if (project.deploymentStatus === 'DEPLOYED') {
    deploymentOptions.push({
      label: '停止部署',
      key: 'stop-deployment',
      icon: 'stop'
    });
  }

  const endOptions = [
    { label: $t('common.archive'), key: 'archive', disabled: project.status === 'ARCHIVED' },
    { label: $t('common.delete'), key: 'delete' }
  ];

  return [...baseOptions, ...deploymentOptions, ...endOptions];
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
    case 'deploy':
      handleDeployProject(project);
      break;
    case 'stop-deployment':
      handleStopDeployment(project);
      break;
  }
}

// 部署相关方法
// 部署项目
async function handleDeployProject(project: Project) {
  try {
    deployingProjects.value.add(project.id);
    
    // 检查项目是否可以部署
    if (project.deploymentStatus === 'DEPLOYING' || project.deploymentStatus === 'DEPLOYED') {
      window.$message?.warning('项目已在部署中或已部署');
      return;
    }

    // 显示部署配置对话框
    deployingProject.value = project;
    showDeployModal.value = true;
  } catch (error) {
    window.$message?.error(`部署项目失败: ${error.message}`);
  } finally {
    deployingProjects.value.delete(project.id);
  }
}

async function confirmDeploy() {
  if (!deployingProject.value) return;

  try {
    deployingProjects.value.add(deployingProject.value.id);

    // 更新项目状态为部署中
    const projectIndex = projects.value.findIndex(p => p.id === deployingProject.value!.id);
    if (projectIndex !== -1) {
      projects.value[projectIndex].deploymentStatus = 'DEPLOYING';
    }

    // 调用部署 API
    const response = await fetch(`/api/v1/projects/${deployingProject.value.id}/deploy`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        port: deployForm.port,
        config: deployForm.config
      })
    });

    if (!response.ok) {
      throw new Error('部署请求失败');
    }

    const result = await response.json();

    if (result.success) {
      window.$message?.success('项目部署已启动');
      showDeployModal.value = false;
      
      // 启动部署状态轮询
      startDeploymentPolling(deployingProject.value.id);
    } else {
      throw new Error(result.message || '部署失败');
    }
  } catch (error) {
    window.$message?.error(`部署项目失败: ${error.message}`);
    
    // 失败时更新状态
    const projectIndex = projects.value.findIndex(p => p.id === deployingProject.value!.id);
    if (projectIndex !== -1) {
      projects.value[projectIndex].deploymentStatus = 'FAILED';
    }
  } finally {
    deployingProjects.value.delete(deployingProject.value.id);
  }
}

// 部署状态轮询
function startDeploymentPolling(projectId: string) {
  const pollInterval = setInterval(async () => {
    try {
      const response = await fetch(`/api/v1/projects/${projectId}/deployment-status`);
      if (response.ok) {
        const deploymentInfo = await response.json();
        
        const projectIndex = projects.value.findIndex(p => p.id === projectId);
        if (projectIndex !== -1) {
          projects.value[projectIndex].deploymentStatus = deploymentInfo.status;
          projects.value[projectIndex].deploymentPort = deploymentInfo.port;
          projects.value[projectIndex].lastDeployedAt = deploymentInfo.lastDeployedAt;
        }
        
        // 如果部署完成或失败，停止轮询
        if (deploymentInfo.status === 'DEPLOYED' || deploymentInfo.status === 'FAILED') {
          clearInterval(pollInterval);
          
          if (deploymentInfo.status === 'DEPLOYED') {
            window.$message?.success(`项目部署成功，运行在端口 ${deploymentInfo.port}`);
          } else {
            window.$message?.error('项目部署失败');
          }
        }
      }
    } catch (error) {
      console.error('轮询部署状态失败:', error);
    }
  }, 2000); // 每2秒轮询一次

  // 30秒后自动停止轮询以防止无限轮询
  setTimeout(() => {
    clearInterval(pollInterval);
  }, 30000);
}

async function handleStopDeployment(project: Project) {
  try {
    stoppingProjects.value.add(project.id);

    // 显示确认对话框
    window.$dialog?.warning({
      title: '确认停止部署',
      content: `确定要停止项目 "${project.name}" 的部署吗？`,
      positiveText: '确认',
      negativeText: '取消',
      onPositiveClick: async () => {
        try {
          // 调用停止部署 API
          const response = await fetch(`/api/v1/projects/${project.id}/stop-deployment`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            }
          });

          if (!response.ok) {
            throw new Error('停止部署请求失败');
          }

          const result = await response.json();

          if (result.success) {
            window.$message?.success('项目部署已停止');
            // 更新项目状态
            const projectIndex = projects.value.findIndex(p => p.id === project.id);
            if (projectIndex !== -1) {
              projects.value[projectIndex].deploymentStatus = 'INACTIVE';
              projects.value[projectIndex].deploymentPort = undefined;
            }
          } else {
            throw new Error(result.message || '停止部署失败');
          }
        } catch (error) {
          window.$message?.error(`停止部署失败: ${error.message}`);
        }
      }
    });
  } catch (error) {
    window.$message?.error(`停止部署失败: ${error.message}`);
  } finally {
    stoppingProjects.value.delete(project.id);
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

function getDeploymentStatusType(deploymentStatus?: string): 'success' | 'warning' | 'error' | 'info' {
  const statusMap: Record<string, 'success' | 'warning' | 'error' | 'info'> = {
    DEPLOYED: 'success',
    DEPLOYING: 'info',
    FAILED: 'error',
    INACTIVE: 'warning'
  };
  return statusMap[deploymentStatus || 'INACTIVE'] || 'warning';
}

function getDeploymentStatusText(deploymentStatus?: string): string {
  const statusMap: Record<string, string> = {
    DEPLOYED: '已部署',
    DEPLOYING: '部署中',
    FAILED: '部署失败',
    INACTIVE: '未部署'
  };
  return statusMap[deploymentStatus || 'INACTIVE'] || '未知';
}

function getProjectColor(projectId: string): string {
  const colors = ['#1890ff', '#52c41a', '#faad14', '#f5222d', '#722ed1', '#13c2c2'];
  const index = projectId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length;
  return colors[index];
}

// 相对时间显示函数
function getRelativeTime(dateString: string): string {
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) {
    return '刚刚';
  } else if (diffMins < 60) {
    return `${diffMins}分钟前`;
  } else if (diffHours < 24) {
    return `${diffHours}小时前`;
  } else if (diffDays < 7) {
    return `${diffDays}天前`;
  } else {
    return formatDate(dateString);
  }
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

// 防抖搜索实现
function handleSearch() {
  if (searchDebounceTimer.value) {
    clearTimeout(searchDebounceTimer.value);
  }

  searchDebounceTimer.value = setTimeout(() => {
    // 重置到第一页
    pagination.value.page = 1;
    // 触发搜索逻辑已在 computed 中实现
  }, 300);
}

// 清理定时器
onUnmounted(() => {
  if (searchDebounceTimer.value) {
    clearTimeout(searchDebounceTimer.value);
  }
});

function handleFilterChange() {
  // 重置到第一页
  pagination.value.page = 1;
  // 过滤逻辑已在 computed 中实现
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
      // 为每个项目补充统计数据
      projects.value = await Promise.all(
        data.map(async (project) => {
          try {
            // 获取项目详细统计信息
            const statsResponse = await fetch(`/api/v1/projects/${project.id}/stats`);
            if (statsResponse.ok) {
              const stats = await statsResponse.json();
              return {
                ...project,
                entityCount: stats.entityCount || project.entityCount || 0,
                relationshipCount: stats.relationshipCount || 0,
                generatedFiles: stats.generatedFiles || 0,
                templateCount: stats.templateCount || project.templateCount || 0,
                config: project.config || {}
              };
            }
            // 如果获取统计失败，使用默认值
            return {
              ...project,
              entityCount: project.entityCount || 0,
              relationshipCount: 0,
              generatedFiles: 0,
              templateCount: project.templateCount || 0,
              config: project.config || {}
            };
          } catch (error) {
            console.warn(`Failed to fetch stats for project ${project.id}:`, error);
            return {
              ...project,
              entityCount: project.entityCount || 0,
              relationshipCount: 0,
              generatedFiles: 0,
              templateCount: project.templateCount || 0,
              config: project.config || {}
            };
          }
        })
      );
      pagination.value.itemCount = projects.value.length;
    } else {
      projects.value = [];
      pagination.value.itemCount = 0;
    }
  } catch (error) {
    console.error('Failed to load projects:', error);
    window.$message?.error($t('common.loadFailed'));
    
    // 在错误情况下使用模拟数据，以便测试界面
    projects.value = [
      {
        id: '1',
        name: '示例项目',
        code: 'sample-project',
        description: '这是一个示例项目，用于测试项目卡片显示',
        status: 'ACTIVE',
        deploymentStatus: 'DEPLOYED',
        deploymentPort: 9522,
        lastDeployedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        entityCount: 5,
        relationshipCount: 3,
        generatedFiles: 12,
        templateCount: 4,
        config: {
          framework: 'nestjs',
          architecture: 'base-biz',
          language: 'typescript',
          database: 'postgresql'
        },
        createdBy: 'admin',
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString()
      },
      {
        id: '2',
        name: '电商平台',
        code: 'ecommerce-platform',
        description: '一个全面的电子商务平台，包含用户管理、商品目录和订单处理',
        status: 'INACTIVE',
        deploymentStatus: 'INACTIVE',
        entityCount: 8,
        relationshipCount: 6,
        generatedFiles: 24,
        templateCount: 7,
        config: {
          framework: 'spring-boot',
          architecture: 'ddd',
          language: 'java',
          database: 'mysql'
        },
        createdBy: 'developer',
        createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
      }
    ];
    pagination.value.itemCount = projects.value.length;
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

// 添加缺失的处理函数
function handleConfigureProject(project: Project) {
  // 配置项目 - 可以打开项目配置页面或模态框
  router.push(`/lowcode/project/${project.id}/config`);
}

function handleDesignProject(project: Project) {
  // 设计实体 - 跳转到实体设计页面
  router.push(`/lowcode/entity?projectId=${project.id}`);
}

function handleGenerateProject(project: Project) {
  // 生成代码 - 跳转到代码生成页面
  router.push(`/lowcode/code-generation?projectId=${project.id}`);
}

function handleRelationshipManagement(project: Project) {
  // 关系管理 - 跳转到实体关系图页面
  // 使用查询参数传递项目ID
  router.push({
    path: '/lowcode/relationship',
    query: { projectId: project.id }
  });
}

// Lifecycle
onMounted(() => {
  loadProjects();
});
</script>

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
          <NSelect v-model:value="viewMode" :options="viewModeOptions" style="width: 120px" />
          <NButton @click="handleRefresh">
            <template #icon>
              <NIcon><icon-mdi-refresh /></NIcon>
            </template>
          </NButton>
        </NSpace>
      </NSpace>
    </NCard>

    <!-- Project List -->
    <div v-if="viewMode === 'grid'">
      <div class="grid grid-cols-1 mb-6 gap-4 lg:grid-cols-3 md:grid-cols-2 xl:grid-cols-4">
        <ProjectCard
          v-for="project in paginatedProjects"
          :key="project.id"
          :project="project"
          @edit="handleEditProject"
          @delete="handleDeleteProject"
          @configure="handleConfigureProject"
          @design="handleDesignProject"
          @generate="handleGenerateProject"
          @view="handleViewProject"
          @deploy="handleDeployProject"
          @stop-deployment="handleStopDeployment"
          @relationship="handleRelationshipManagement"
        />
      </div>

      <!-- Grid Pagination -->
      <div class="flex justify-center">
        <NPagination
          v-model:page="pagination.page"
          v-model:page-size="pagination.pageSize"
          :item-count="pagination.itemCount"
          :page-sizes="pagination.pageSizes"
          show-size-picker
          show-quick-jumper
          :page-slot="7"
          @update:page="handlePageChange"
          @update:page-size="handlePageSizeChange"
        >
          <template #prefix="{ itemCount }">
            <span class="text-sm text-gray-500">{{ $t('common.total') }} {{ itemCount }} {{ $t('common.items') }}</span>
          </template>
        </NPagination>
      </div>
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
          <NUpload :file-list="importFileList" :max="1" accept=".json,.zip" @change="handleFileUpload">
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

    <!-- Deploy Configuration Modal -->
    <NModal v-model:show="showDeployModal" preset="card" style="width: 500px">
      <template #header>
        <NSpace align="center">
          <NIcon size="20" color="#18a058">
            <icon-mdi-rocket-launch />
          </NIcon>
          部署项目: {{ deployingProject?.name }}
        </NSpace>
      </template>

      <NForm :model="deployForm" label-placement="left" label-width="100px">
        <NFormItem label="部署端口" path="port">
          <NInputNumber
            v-model:value="deployForm.port"
            :min="1024"
            :max="65535"
            placeholder="请输入端口号"
            style="width: 100%"
          />
          <template #feedback>
            <NText depth="3" style="font-size: 12px">建议使用 9522-9600 范围内的端口</NText>
          </template>
        </NFormItem>

        <NFormItem label="自动重启">
          <NSwitch v-model:value="deployForm.config.autoRestart" />
          <template #feedback>
            <NText depth="3" style="font-size: 12px">启用后，服务异常退出时会自动重启</NText>
          </template>
        </NFormItem>

        <NFormItem label="运行环境" path="config.environment">
          <NSelect
            v-model:value="deployForm.config.environment"
            :options="[
              { label: '开发环境', value: 'development' },
              { label: '测试环境', value: 'testing' },
              { label: '生产环境', value: 'production' }
            ]"
            placeholder="选择运行环境"
          />
        </NFormItem>

        <NFormItem label="部署信息">
          <NAlert type="info" style="margin-bottom: 12px">
            <template #icon>
              <NIcon><icon-mdi-information /></NIcon>
            </template>
            部署将会：
            <ul style="margin: 8px 0 0 20px; padding: 0">
              <li>生成项目代码</li>
              <li>更新 amis-lowcode-backend 配置</li>
              <li>启动服务在指定端口</li>
            </ul>
          </NAlert>
        </NFormItem>
      </NForm>

      <template #footer>
        <NSpace justify="end">
          <NButton @click="showDeployModal = false">取消</NButton>
          <NButton type="primary" :loading="deployingProjects.has(deployingProject?.id || '')" @click="confirmDeploy">
            <template #icon>
              <NIcon><icon-mdi-rocket-launch /></NIcon>
            </template>
            开始部署
          </NButton>
        </NSpace>
      </template>
    </NModal>
  </div>
</template>

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
