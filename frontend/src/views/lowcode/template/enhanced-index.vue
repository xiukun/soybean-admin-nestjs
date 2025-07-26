<template>
  <div class="enhanced-template-management">
    <!-- Header with Project Selector -->
    <div class="mb-6">
      <NSpace justify="space-between" align="center">
        <div>
          <NText tag="h1" class="text-2xl font-bold">{{ $t('page.lowcode.template.management') }}</NText>
          <NText depth="3">{{ $t('page.lowcode.template.managementDesc') }}</NText>
        </div>
        <NSpace>
          <NSelect
            v-if="!props.projectId"
            v-model:value="selectedProjectId"
            :options="projectOptions"
            placeholder="请选择项目"
            style="width: 300px"
            :loading="projectLoading"
            clearable
            @update:value="handleProjectChange"
          />
        </NSpace>
      </NSpace>
    </div>

    <!-- View Mode Tabs -->
    <div class="mb-4">
      <NTabs v-model:value="viewMode" type="line" animated>
        <NTabPane name="grid" :tab="$t('page.lowcode.template.gridView')">
          <!-- Template Grid View -->
          <div class="template-grid-view">
            <!-- Filters and Search -->
            <NCard class="mb-4">
              <NSpace justify="space-between" align="center">
                <NSpace>
                  <NInput
                    v-model:value="searchQuery"
                    :placeholder="$t('page.lowcode.template.searchPlaceholder')"
                    style="width: 300px"
                    clearable
                    @input="handleSearch"
                  >
                    <template #prefix>
                      <NIcon><icon-mdi-magnify /></NIcon>
                    </template>
                  </NInput>
                  <NSelect
                    v-model:value="categoryFilter"
                    :placeholder="$t('page.lowcode.template.filterByCategory')"
                    :options="categoryOptions"
                    style="width: 150px"
                    clearable
                    @update:value="handleFilterChange"
                  />
                  <NSelect
                    v-model:value="languageFilter"
                    :placeholder="$t('page.lowcode.template.filterByLanguage')"
                    :options="languageOptions"
                    style="width: 150px"
                    clearable
                    @update:value="handleFilterChange"
                  />
                </NSpace>
                <NSpace>
                  <NButton type="primary" :disabled="!currentProjectId" @click="handleCreateTemplate">
                    <template #icon>
                      <NIcon><icon-mdi-plus /></NIcon>
                    </template>
                    {{ $t('page.lowcode.template.create') }}
                  </NButton>
                  <NButton :disabled="!currentProjectId" @click="handleImportTemplates">
                    <template #icon>
                      <NIcon><icon-mdi-import /></NIcon>
                    </template>
                    {{ $t('page.lowcode.template.import') }}
                  </NButton>
                  <NButton @click="handleExportTemplates" :disabled="selectedTemplates.length === 0">
                    <template #icon>
                      <NIcon><icon-mdi-export /></NIcon>
                    </template>
                    {{ $t('page.lowcode.template.export') }}
                  </NButton>
                </NSpace>
              </NSpace>
            </NCard>

            <!-- Template Cards Grid -->
            <div class="template-cards-grid">
              <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                <NCard
                  v-for="template in filteredTemplates"
                  :key="template.id"
                  class="template-card cursor-pointer transition-all duration-200 hover:shadow-lg"
                  size="small"
                  hoverable
                  @click="handleViewTemplate(template)"
                >
                  <template #header>
                    <div class="flex justify-between items-center">
                      <div class="flex items-center space-x-2">
                        <NCheckbox
                          :checked="selectedTemplates.includes(template.id)"
                          @update:checked="(checked) => handleTemplateSelect(template.id, checked)"
                          @click.stop
                        />
                        <NText strong class="truncate">{{ template.name }}</NText>
                      </div>
                      <NDropdown :options="getTemplateActions(template)" @select="(key) => handleTemplateAction(key, template)">
                        <NButton size="small" quaternary circle @click.stop>
                          <template #icon>
                            <NIcon><icon-mdi-dots-vertical /></NIcon>
                          </template>
                        </NButton>
                      </NDropdown>
                    </div>
                  </template>

                  <div class="template-card-content">
                    <!-- Template Info -->
                    <div class="mb-3">
                      <NSpace size="small">
                        <NTag size="small" :type="getCategoryType(template.category)">
                          {{ $t(`page.lowcode.template.categories.${template.category}`) }}
                        </NTag>
                        <NTag size="small" type="info">
                          {{ $t(`page.lowcode.template.languages.${template.language}`) }}
                        </NTag>
                        <NTag size="small" :type="getStatusType(template.status)">
                          {{ $t(`page.lowcode.template.status.${template.status}`) }}
                        </NTag>
                      </NSpace>
                    </div>

                    <!-- Description -->
                    <div class="mb-3">
                      <NText depth="3" class="text-sm line-clamp-2">
                        {{ template.description || $t('page.lowcode.template.noDescription') }}
                      </NText>
                    </div>

                    <!-- Stats -->
                    <div class="template-stats">
                      <NSpace justify="space-between" size="small">
                        <div class="flex items-center space-x-1">
                          <NIcon size="14"><icon-mdi-eye /></NIcon>
                          <NText depth="3" class="text-xs">{{ template.usageCount || 0 }}</NText>
                        </div>
                        <div class="flex items-center space-x-1">
                          <NIcon size="14"><icon-mdi-star /></NIcon>
                          <NText depth="3" class="text-xs">{{ template.rating || 0 }}</NText>
                        </div>
                        <div class="flex items-center space-x-1">
                          <NIcon size="14"><icon-mdi-clock /></NIcon>
                          <NText depth="3" class="text-xs">{{ formatDate(template.updatedAt) }}</NText>
                        </div>
                      </NSpace>
                    </div>
                  </div>

                  <template #footer>
                    <NSpace justify="space-between" align="center">
                      <NText depth="3" class="text-xs">v{{ template.version }}</NText>
                      <NSpace size="small">
                        <NButton size="tiny" @click.stop="handlePreviewTemplate(template)">
                          {{ $t('page.lowcode.template.preview') }}
                        </NButton>
                        <NButton size="tiny" type="primary" @click.stop="handleEditTemplate(template)">
                          {{ $t('common.edit') }}
                        </NButton>
                      </NSpace>
                    </NSpace>
                  </template>
                </NCard>
              </div>

              <!-- Empty State -->
              <div v-if="filteredTemplates.length === 0" class="text-center py-12">
                <NEmpty :description="$t('page.lowcode.template.noTemplates')">
                  <template #extra>
                    <NButton type="primary" @click="handleCreateTemplate">
                      {{ $t('page.lowcode.template.createFirst') }}
                    </NButton>
                  </template>
                </NEmpty>
              </div>
            </div>

            <!-- Pagination -->
            <div v-if="filteredTemplates.length > 0" class="mt-6 flex justify-center">
              <NPagination
                v-model:page="pagination.page"
                v-model:page-size="pagination.pageSize"
                :item-count="pagination.itemCount"
                :page-sizes="pagination.pageSizes"
                show-size-picker
                @update:page="handlePageChange"
                @update:page-size="handlePageSizeChange"
              />
            </div>
          </div>
        </NTabPane>

        <NTabPane name="list" :tab="$t('page.lowcode.template.listView')">
          <!-- Template List View -->
          <div class="template-list-view">
            <NDataTable
              :columns="columns"
              :data="filteredTemplates"
              :pagination="pagination"
              :loading="loading"
              size="small"
              striped
              @update:page="handlePageChange"
              @update:page-size="handlePageSizeChange"
            />
          </div>
        </NTabPane>

        <NTabPane name="marketplace" :tab="$t('page.lowcode.template.marketplace')">
          <!-- Template Marketplace -->
          <div class="template-marketplace">
            <NEmpty :description="$t('page.lowcode.template.marketplaceComingSoon')" />
          </div>
        </NTabPane>
      </NTabs>
    </div>

    <!-- Template Editor Modal -->
    <NModal v-model:show="showEditorModal" preset="card" style="width: 95vw; height: 90vh">
      <template #header>
        {{ editingTemplate ? $t('page.lowcode.template.edit') : $t('page.lowcode.template.create') }}
      </template>
      
      <TemplateEditor
        :template-data="editingTemplate"
        @save="handleSaveTemplate"
        @cancel="showEditorModal = false"
      />
    </NModal>

    <!-- Template Preview Modal -->
    <NModal v-model:show="showPreviewModal" preset="card" style="width: 80vw; height: 80vh">
      <template #header>
        {{ $t('page.lowcode.template.preview') }} - {{ previewTemplate?.name }}
      </template>
      
      <TemplatePreview
        v-if="previewTemplate"
        :template-data="previewTemplate"
      />
    </NModal>

    <!-- Batch Operations Modal -->
    <NModal v-model:show="showBatchModal" preset="card" style="width: 600px">
      <template #header>
        {{ $t('page.lowcode.template.batchOperations') }}
      </template>
      
      <div class="space-y-4">
        <NText>{{ $t('page.lowcode.template.selectedTemplatesCount', { count: selectedTemplates.length }) }}</NText>
        
        <div class="space-y-2">
          <NButton block @click="handleBatchPublish">
            {{ $t('page.lowcode.template.batchPublish') }}
          </NButton>
          <NButton block @click="handleBatchUnpublish">
            {{ $t('page.lowcode.template.batchUnpublish') }}
          </NButton>
          <NButton block @click="handleBatchExport">
            {{ $t('page.lowcode.template.batchExport') }}
          </NButton>
          <NButton block type="error" @click="handleBatchDelete">
            {{ $t('page.lowcode.template.batchDelete') }}
          </NButton>
        </div>
      </div>

      <template #footer>
        <NSpace justify="end">
          <NButton @click="showBatchModal = false">{{ $t('common.cancel') }}</NButton>
        </NSpace>
      </template>
    </NModal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, h } from 'vue';
import { useRouter } from 'vue-router';
import type { DataTableColumns } from 'naive-ui';
import { $t } from '@/locales';
import { formatDate } from '@/utils/common';
import TemplateEditor from './modules/template-editor.vue';
import TemplatePreview from './modules/template-preview.vue';
// import TemplateMarketplace from './modules/template-marketplace.vue';

interface Props {
  projectId?: string;
}

const props = defineProps<Props>();

interface Template {
  id: string;
  projectId: string;
  name: string;
  code: string;
  description?: string;
  category: string;
  language: string;
  framework?: string;
  version: string;
  status: 'DRAFT' | 'PUBLISHED' | 'DEPRECATED';
  usageCount: number;
  rating: number;
  tags: string[];
  isPublic: boolean;
  content: string;
  variables: any[];
  createdAt: string;
  updatedAt: string;
}

const router = useRouter();

// State
const viewMode = ref<'grid' | 'list' | 'marketplace'>('grid');
const loading = ref(false);
const templates = ref<Template[]>([]);
const searchQuery = ref('');
const categoryFilter = ref('');
const languageFilter = ref('');
const selectedTemplates = ref<string[]>([]);
const showEditorModal = ref(false);
const showPreviewModal = ref(false);
const showBatchModal = ref(false);
const editingTemplate = ref<Template | null>(null);
const previewTemplate = ref<Template | null>(null);
const selectedProjectId = ref<string>(props.projectId || '');
const projectOptions = ref<Array<{ label: string; value: string }>>([]);
const projectLoading = ref(false);

const pagination = ref({
  page: 1,
  pageSize: 12,
  itemCount: 0,
  showSizePicker: true,
  pageSizes: [12, 24, 48, 96]
});

// Computed
const currentProjectId = computed(() => props.projectId || selectedProjectId.value);

const filteredTemplates = computed(() => {
  let filtered = templates.value;

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    filtered = filtered.filter(template => 
      template.name.toLowerCase().includes(query) ||
      template.code.toLowerCase().includes(query) ||
      template.description?.toLowerCase().includes(query)
    );
  }

  if (categoryFilter.value) {
    filtered = filtered.filter(template => template.category === categoryFilter.value);
  }

  if (languageFilter.value) {
    filtered = filtered.filter(template => template.language === languageFilter.value);
  }

  return filtered;
});

// Options
const categoryOptions = [
  { label: $t('page.lowcode.template.categories.CONTROLLER'), value: 'CONTROLLER' },
  { label: $t('page.lowcode.template.categories.SERVICE'), value: 'SERVICE' },
  { label: $t('page.lowcode.template.categories.MODEL'), value: 'MODEL' },
  { label: $t('page.lowcode.template.categories.DTO'), value: 'DTO' }
];

const languageOptions = [
  { label: $t('page.lowcode.template.languages.TYPESCRIPT'), value: 'TYPESCRIPT' },
  { label: $t('page.lowcode.template.languages.JAVASCRIPT'), value: 'JAVASCRIPT' },
  { label: $t('page.lowcode.template.languages.JAVA'), value: 'JAVA' },
  { label: $t('page.lowcode.template.languages.PYTHON'), value: 'PYTHON' }
];

// Table columns for list view
const columns: DataTableColumns<Template> = [
  { title: $t('page.lowcode.template.name'), key: 'name', width: 200, fixed: 'left' },
  { title: $t('page.lowcode.template.category'), key: 'category', width: 120 },
  { title: $t('page.lowcode.template.language'), key: 'language', width: 120 },
  {
    title: $t('page.lowcode.template.status'),
    key: 'status',
    width: 100,
    render: (row) => h('NTag', { type: getStatusType(row.status) }, 
      $t(`page.lowcode.template.status.${row.status}`)
    )
  },
  { title: $t('page.lowcode.template.usageCount'), key: 'usageCount', width: 100, align: 'center' },
  { title: $t('page.lowcode.template.version'), key: 'version', width: 80 },
  {
    title: $t('page.lowcode.template.updatedAt'),
    key: 'updatedAt',
    width: 150,
    render: (row) => formatDate(row.updatedAt)
  },
  {
    title: $t('common.actions'),
    key: 'actions',
    width: 200,
    fixed: 'right',
    render: (row) => [
      h('NButton', 
        { 
          size: 'small', 
          onClick: () => handlePreviewTemplate(row),
          style: { marginRight: '8px' }
        }, 
        $t('page.lowcode.template.preview')
      ),
      h('NButton', 
        { 
          size: 'small', 
          type: 'primary',
          onClick: () => handleEditTemplate(row),
          style: { marginRight: '8px' }
        }, 
        $t('common.edit')
      ),
      h('NButton', 
        { 
          size: 'small', 
          type: 'error',
          onClick: () => handleDeleteTemplate(row)
        }, 
        $t('common.delete')
      )
    ]
  }
];

// Methods
function getCategoryType(category: string): 'success' | 'warning' | 'error' | 'info' {
  const categoryMap: Record<string, 'success' | 'warning' | 'error' | 'info'> = {
    CONTROLLER: 'success',
    SERVICE: 'info',
    MODEL: 'warning',
    DTO: 'error'
  };
  return categoryMap[category] || 'info';
}

function getStatusType(status: string): 'success' | 'warning' | 'error' | 'info' {
  const statusMap: Record<string, 'success' | 'warning' | 'error' | 'info'> = {
    PUBLISHED: 'success',
    DRAFT: 'warning',
    DEPRECATED: 'error'
  };
  return statusMap[status] || 'info';
}

function getTemplateActions(template: Template) {
  return [
    {
      label: $t('page.lowcode.template.preview'),
      key: 'preview',
      icon: () => h('NIcon', null, { default: () => h('icon-mdi-eye') })
    },
    {
      label: $t('common.edit'),
      key: 'edit',
      icon: () => h('NIcon', null, { default: () => h('icon-mdi-pencil') })
    },
    {
      label: template.status === 'PUBLISHED' ? $t('page.lowcode.template.unpublish') : $t('page.lowcode.template.publish'),
      key: 'publish',
      icon: () => h('NIcon', null, { default: () => h('icon-mdi-publish') })
    },
    {
      label: $t('page.lowcode.template.duplicate'),
      key: 'duplicate',
      icon: () => h('NIcon', null, { default: () => h('icon-mdi-content-copy') })
    },
    {
      label: $t('common.delete'),
      key: 'delete',
      icon: () => h('NIcon', null, { default: () => h('icon-mdi-delete') })
    }
  ];
}

function handleSearch() {
  // Debounced search implementation would go here
}

function handleFilterChange() {
  // Filter change logic
}

function handlePageChange(page: number) {
  pagination.value.page = page;
}

function handlePageSizeChange(pageSize: number) {
  pagination.value.pageSize = pageSize;
  pagination.value.page = 1;
}

function handleTemplateSelect(templateId: string, checked: boolean) {
  if (checked) {
    selectedTemplates.value.push(templateId);
  } else {
    const index = selectedTemplates.value.indexOf(templateId);
    if (index > -1) {
      selectedTemplates.value.splice(index, 1);
    }
  }
}

function handleViewTemplate(template: Template) {
  router.push(`/lowcode/template/${template.id}`);
}

function handleCreateTemplate() {
  if (!currentProjectId.value) {
    window.$message?.warning('请先选择一个项目');
    return;
  }
  
  editingTemplate.value = null;
  showEditorModal.value = true;
}

function handleEditTemplate(template: Template) {
  editingTemplate.value = template;
  showEditorModal.value = true;
}

function handlePreviewTemplate(template: Template) {
  previewTemplate.value = template;
  showPreviewModal.value = true;
}

function handleDeleteTemplate(template: Template) {
  window.$dialog?.error({
    title: $t('common.confirm'),
    content: $t('page.lowcode.template.deleteConfirm'),
    positiveText: $t('common.delete'),
    negativeText: $t('common.cancel'),
    onPositiveClick: () => {
      const index = templates.value.findIndex(t => t.id === template.id);
      if (index > -1) {
        templates.value.splice(index, 1);
        window.$message?.success($t('common.deleteSuccess'));
      }
    }
  });
}

function handleTemplateAction(key: string, template: Template) {
  switch (key) {
    case 'preview':
      handlePreviewTemplate(template);
      break;
    case 'edit':
      handleEditTemplate(template);
      break;
    case 'publish':
      handleTogglePublish(template);
      break;
    case 'duplicate':
      handleDuplicateTemplate(template);
      break;
    case 'delete':
      handleDeleteTemplate(template);
      break;
  }
}

function handleTogglePublish(template: Template) {
  template.status = template.status === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED';
  window.$message?.success($t('page.lowcode.template.statusUpdated'));
}

function handleDuplicateTemplate(template: Template) {
  const duplicated = {
    ...template,
    id: `${template.id}-copy`,
    name: `${template.name} (Copy)`,
    status: 'DRAFT' as const
  };
  templates.value.push(duplicated);
  window.$message?.success($t('page.lowcode.template.duplicated'));
}

function handleImportTemplates() {
  window.$message?.info('导入模板功能开发中');
}

function handleExportTemplates() {
  window.$message?.info('导出模板功能开发中');
}

function handleSaveTemplate(templateData: any) {
  if (editingTemplate.value) {
    Object.assign(editingTemplate.value, templateData);
  } else {
    templates.value.push({
      ...templateData,
      id: `template-${Date.now()}`,
      projectId: currentProjectId.value,
      usageCount: 0,
      rating: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  }
  showEditorModal.value = false;
  window.$message?.success($t('common.saveSuccess'));
}

function handleProjectChange(projectId: string | null) {
  selectedProjectId.value = projectId || '';
  if (projectId) {
    loadTemplates();
  }
}

function handleBatchPublish() {
  selectedTemplates.value.forEach(id => {
    const template = templates.value.find(t => t.id === id);
    if (template) {
      template.status = 'PUBLISHED';
    }
  });
  window.$message?.success($t('page.lowcode.template.batchPublishSuccess'));
  showBatchModal.value = false;
}

function handleBatchUnpublish() {
  selectedTemplates.value.forEach(id => {
    const template = templates.value.find(t => t.id === id);
    if (template) {
      template.status = 'DRAFT';
    }
  });
  window.$message?.success($t('page.lowcode.template.batchUnpublishSuccess'));
  showBatchModal.value = false;
}

function handleBatchExport() {
  window.$message?.info('批量导出功能开发中');
  showBatchModal.value = false;
}

function handleBatchDelete() {
  window.$dialog?.error({
    title: $t('common.confirm'),
    content: $t('page.lowcode.template.batchDeleteConfirm'),
    positiveText: $t('common.delete'),
    negativeText: $t('common.cancel'),
    onPositiveClick: () => {
      templates.value = templates.value.filter(t => !selectedTemplates.value.includes(t.id));
      selectedTemplates.value = [];
      window.$message?.success($t('common.deleteSuccess'));
      showBatchModal.value = false;
    }
  });
}

async function loadProjects() {
  if (props.projectId) return;

  try {
    projectLoading.value = true;
    
    // Mock data
    const mockProjects = [
      { id: 'project-1', name: 'E-commerce Platform' },
      { id: 'project-2', name: 'CRM System' }
    ];
    
    projectOptions.value = mockProjects.map(project => ({
      label: project.name,
      value: project.id
    }));
  } catch (error) {
    console.error('Failed to load projects:', error);
  } finally {
    projectLoading.value = false;
  }
}

async function loadTemplates() {
  if (!currentProjectId.value) return;
  
  try {
    loading.value = true;
    
    // Mock data
    const mockTemplates: Template[] = [
      {
        id: 'template-1',
        projectId: currentProjectId.value,
        name: 'NestJS Controller',
        code: 'nestjs-controller',
        description: 'Standard NestJS controller template with CRUD operations',
        category: 'CONTROLLER',
        language: 'TYPESCRIPT',
        framework: 'NestJS',
        version: '1.0.0',
        status: 'PUBLISHED',
        usageCount: 25,
        rating: 4.5,
        tags: ['nestjs', 'controller', 'crud'],
        isPublic: true,
        content: '// Template content here',
        variables: [],
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'template-2',
        projectId: currentProjectId.value,
        name: 'Service Layer',
        code: 'service-layer',
        description: 'Business logic service layer template',
        category: 'SERVICE',
        language: 'TYPESCRIPT',
        framework: 'NestJS',
        version: '1.1.0',
        status: 'PUBLISHED',
        usageCount: 18,
        rating: 4.2,
        tags: ['service', 'business-logic'],
        isPublic: true,
        content: '// Service template content',
        variables: [],
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
      }
    ];
    
    templates.value = mockTemplates;
    pagination.value.itemCount = mockTemplates.length;
  } catch (error) {
    console.error('Failed to load templates:', error);
    window.$message?.error($t('page.lowcode.template.loadFailed'));
  } finally {
    loading.value = false;
  }
}

// Lifecycle
onMounted(() => {
  loadProjects();
  if (currentProjectId.value) {
    loadTemplates();
  }
});
</script>

<style scoped>
.enhanced-template-management {
  @apply p-6;
}

.template-grid-view {
  @apply space-y-4;
}

.template-card {
  @apply h-full;
}

.template-card-content {
  @apply space-y-3;
}

.template-stats {
  @apply pt-2 border-t border-gray-100;
}

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
