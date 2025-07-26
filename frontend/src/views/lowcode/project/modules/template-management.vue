<template>
  <div class="template-management">
    <!-- 操作栏 -->
    <div class="mb-4">
      <NSpace justify="space-between" align="center">
        <NSpace>
          <NInput
            v-model:value="searchQuery"
            :placeholder="$t('page.lowcode.template.searchPlaceholder')"
            style="width: 300px"
            clearable
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
          />
          <NSelect
            v-model:value="languageFilter"
            :placeholder="$t('page.lowcode.template.filterByLanguage')"
            :options="languageOptions"
            style="width: 150px"
            clearable
          />
        </NSpace>
        <NSpace>
          <NButton type="primary" @click="handleCreateTemplate">
            <template #icon>
              <NIcon><icon-mdi-plus /></NIcon>
            </template>
            {{ $t('page.lowcode.template.create') }}
          </NButton>
          <NButton @click="handleImportTemplates">
            <template #icon>
              <NIcon><icon-mdi-import /></NIcon>
            </template>
            {{ $t('page.lowcode.template.import') }}
          </NButton>
        </NSpace>
      </NSpace>
    </div>

    <!-- 模板列表 -->
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

    <!-- 模板预览模态框 -->
    <NModal v-model:show="showPreviewModal" preset="card" style="width: 1000px; height: 80vh">
      <template #header>
        {{ $t('page.lowcode.template.preview') }} - {{ previewTemplate?.name }}
      </template>
      
      <div class="h-full flex flex-col">
        <div class="mb-4">
          <NSpace>
            <NTag type="info">{{ previewTemplate?.language }}</NTag>
            <NTag type="success">{{ previewTemplate?.category }}</NTag>
            <NTag>{{ previewTemplate?.framework }}</NTag>
          </NSpace>
        </div>
        
        <div class="flex-1 border border-gray-200 rounded">
          <NInput
            v-model:value="previewContent"
            type="textarea"
            :rows="20"
            readonly
            class="h-full"
          />
        </div>
      </div>

      <template #footer>
        <NSpace justify="end">
          <NButton @click="showPreviewModal = false">{{ $t('common.close') }}</NButton>
          <NButton type="primary" @click="handleUseTemplate">{{ $t('page.lowcode.template.use') }}</NButton>
        </NSpace>
      </template>
    </NModal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, h } from 'vue';
import type { DataTableColumns } from 'naive-ui';
import { $t } from '@/locales';
import { formatDate } from '@/utils/common';
// import MonacoEditor from '@/components/common/monaco-editor.vue';

interface Props {
  projectId: string;
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
  content: string;
  variables: TemplateVariable[];
  tags: string[];
  version: string;
  status: 'ACTIVE' | 'INACTIVE' | 'DRAFT';
  usageCount: number;
  createdAt: string;
  updatedAt: string;
}

interface TemplateVariable {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  required: boolean;
  defaultValue?: any;
  description?: string;
}

// State
const loading = ref(false);
const templates = ref<Template[]>([]);
const searchQuery = ref('');
const categoryFilter = ref('');
const languageFilter = ref('');
const showPreviewModal = ref(false);
const previewTemplate = ref<Template | null>(null);
const previewContent = ref('');

const pagination = ref({
  page: 1,
  pageSize: 10,
  itemCount: 0,
  showSizePicker: true,
  pageSizes: [10, 20, 50, 100]
});

// Computed
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
  { label: $t('page.lowcode.template.categories.DTO'), value: 'DTO' },
  { label: $t('page.lowcode.template.categories.COMPONENT'), value: 'COMPONENT' },
  { label: $t('page.lowcode.template.categories.PAGE'), value: 'PAGE' }
];

const languageOptions = [
  { label: $t('page.lowcode.template.languages.TYPESCRIPT'), value: 'TYPESCRIPT' },
  { label: $t('page.lowcode.template.languages.JAVASCRIPT'), value: 'JAVASCRIPT' },
  { label: $t('page.lowcode.template.languages.JAVA'), value: 'JAVA' },
  { label: $t('page.lowcode.template.languages.PYTHON'), value: 'PYTHON' }
];

// Table columns
const columns: DataTableColumns<Template> = [
  { title: $t('page.lowcode.template.name'), key: 'name', width: 150, fixed: 'left' },
  { title: $t('page.lowcode.template.code'), key: 'code', width: 120 },
  { title: $t('page.lowcode.template.category'), key: 'category', width: 100 },
  { title: $t('page.lowcode.template.language'), key: 'language', width: 100 },
  { title: $t('page.lowcode.template.framework'), key: 'framework', width: 100 },
  {
    title: $t('page.lowcode.template.status'),
    key: 'status',
    width: 100,
    render: (row) => h('NTag', { type: getStatusType(row.status) }, 
      $t(`page.lowcode.template.status.${row.status.toLowerCase()}`)
    )
  },
  { title: $t('page.lowcode.template.usageCount'), key: 'usageCount', width: 80, align: 'center' },
  { title: $t('page.lowcode.template.version'), key: 'version', width: 80 },
  {
    title: $t('page.lowcode.template.createdAt'),
    key: 'createdAt',
    width: 150,
    render: (row) => formatDate(row.createdAt)
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
function getStatusType(status: string): 'success' | 'warning' | 'error' | 'info' {
  const statusMap: Record<string, 'success' | 'warning' | 'error' | 'info'> = {
    ACTIVE: 'success',
    DRAFT: 'warning',
    INACTIVE: 'error'
  };
  return statusMap[status] || 'info';
}

function getEditorLanguage(language?: string): string {
  const languageMap: Record<string, string> = {
    TYPESCRIPT: 'typescript',
    JAVASCRIPT: 'javascript',
    JAVA: 'java',
    PYTHON: 'python'
  };
  return languageMap[language || ''] || 'text';
}

function handlePageChange(page: number) {
  pagination.value.page = page;
}

function handlePageSizeChange(pageSize: number) {
  pagination.value.pageSize = pageSize;
  pagination.value.page = 1;
}

function handleCreateTemplate() {
  window.$message?.info('创建模板功能开发中');
}

function handleEditTemplate(template: Template) {
  window.$message?.info(`编辑模板: ${template.name}`);
}

function handlePreviewTemplate(template: Template) {
  previewTemplate.value = template;
  previewContent.value = template.content;
  showPreviewModal.value = true;
}

function handleUseTemplate() {
  if (previewTemplate.value) {
    window.$message?.success(`使用模板: ${previewTemplate.value.name}`);
    showPreviewModal.value = false;
  }
}

function handleDeleteTemplate(template: Template) {
  window.$dialog?.error({
    title: $t('common.confirm'),
    content: $t('page.lowcode.template.deleteConfirm'),
    positiveText: $t('common.delete'),
    negativeText: $t('common.cancel'),
    onPositiveClick: () => {
      window.$message?.success($t('common.deleteSuccess'));
    }
  });
}

function handleImportTemplates() {
  window.$message?.info('导入模板功能开发中');
}

async function loadTemplates() {
  try {
    loading.value = true;
    
    // Mock data
    const mockTemplates: Template[] = [
      {
        id: 'template-1',
        projectId: props.projectId,
        name: 'NestJS Controller',
        code: 'nestjs-controller',
        description: 'Standard NestJS controller template with CRUD operations',
        category: 'CONTROLLER',
        language: 'TYPESCRIPT',
        framework: 'nestjs',
        content: `import { Controller, Get, Post, Put, Delete, Body, Param } from '@nestjs/common';
import { {{entityName}}Service } from './{{entityCode}}.service';
import { Create{{entityName}}Dto, Update{{entityName}}Dto } from './dto';

@Controller('{{entityCode}}')
export class {{entityName}}Controller {
  constructor(private readonly {{entityCode}}Service: {{entityName}}Service) {}

  @Get()
  findAll() {
    return this.{{entityCode}}Service.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.{{entityCode}}Service.findOne(id);
  }

  @Post()
  create(@Body() create{{entityName}}Dto: Create{{entityName}}Dto) {
    return this.{{entityCode}}Service.create(create{{entityName}}Dto);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() update{{entityName}}Dto: Update{{entityName}}Dto) {
    return this.{{entityCode}}Service.update(id, update{{entityName}}Dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.{{entityCode}}Service.remove(id);
  }
}`,
        variables: [
          { name: 'entityName', type: 'string', required: true, description: 'Entity name in PascalCase' },
          { name: 'entityCode', type: 'string', required: true, description: 'Entity code in camelCase' }
        ],
        tags: ['nestjs', 'controller', 'crud'],
        version: '1.0.0',
        status: 'ACTIVE',
        usageCount: 15,
        createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date().toISOString()
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
  loadTemplates();
});
</script>

<style scoped>
.template-management {
  @apply space-y-4;
}
</style>
