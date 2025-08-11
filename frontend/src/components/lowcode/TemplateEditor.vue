<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import { useThemeStore } from '@/store/modules/theme';
import { $t } from '@/locales';

interface Template {
  id: string;
  name: string;
  code: string;
  description?: string;
  language: string;
  framework?: string;
  category: string;
  content: string;
  variables: TemplateVariable[];
  tags: string[];
  version: string;
  status: 'ACTIVE' | 'INACTIVE' | 'DRAFT';
}

interface TemplateVariable {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  required: boolean;
  defaultValue?: any;
  description?: string;
}

const themeStore = useThemeStore();
const isDark = computed(() => themeStore.darkMode);

// State
const templates = ref<Template[]>([]);
const selectedTemplate = ref<Template | null>(null);
const showVariableModal = ref(false);
const editingVariable = ref<TemplateVariable | null>(null);
const previewContent = ref('');
const editorLanguage = ref('typescript');

// Forms
const templateForm = reactive<Partial<Template>>({
  name: '',
  code: '',
  description: '',
  language: 'TYPESCRIPT',
  framework: 'NESTJS',
  category: 'service',
  content: '',
  variables: [],
  tags: [],
  version: '1.0.0',
  status: 'DRAFT'
});

const variableForm = reactive<TemplateVariable>({
  name: '',
  type: 'string',
  required: false,
  defaultValue: '',
  description: ''
});

// Options
const languageOptions = [
  { label: 'TypeScript', value: 'TYPESCRIPT' },
  { label: 'JavaScript', value: 'JAVASCRIPT' },
  { label: 'Java', value: 'JAVA' },
  { label: 'Python', value: 'PYTHON' },
  { label: 'Go', value: 'GO' },
  { label: 'Rust', value: 'RUST' },
  { label: 'PHP', value: 'PHP' },
  { label: 'C#', value: 'CSHARP' }
];

const frameworkOptions = [
  { label: 'NestJS', value: 'NESTJS' },
  { label: 'Express', value: 'EXPRESS' },
  { label: 'Fastify', value: 'FASTIFY' },
  { label: 'Spring Boot', value: 'SPRING_BOOT' },
  { label: 'Django', value: 'DJANGO' },
  { label: 'FastAPI', value: 'FASTAPI' },
  { label: 'Gin', value: 'GIN' },
  { label: 'Actix', value: 'ACTIX' }
];

const categoryOptions = [
  { label: 'Service', value: 'service' },
  { label: 'Controller', value: 'controller' },
  { label: 'Model', value: 'model' },
  { label: 'Repository', value: 'repository' },
  { label: 'DTO', value: 'dto' },
  { label: 'Test', value: 'test' },
  { label: 'Config', value: 'config' },
  { label: 'Util', value: 'util' }
];

const editorLanguageOptions = [
  { label: 'TypeScript', value: 'typescript' },
  { label: 'JavaScript', value: 'javascript' },
  { label: 'Java', value: 'java' },
  { label: 'Python', value: 'python' },
  { label: 'Go', value: 'go' },
  { label: 'Rust', value: 'rust' },
  { label: 'PHP', value: 'php' },
  { label: 'C#', value: 'csharp' }
];

const variableTypeOptions = [
  { label: 'String', value: 'string' },
  { label: 'Number', value: 'number' },
  { label: 'Boolean', value: 'boolean' },
  { label: 'Array', value: 'array' },
  { label: 'Object', value: 'object' }
];

// Table columns for variables
const variableColumns = [
  { title: $t('page.lowcode.template.variableName'), key: 'name' },
  { title: $t('page.lowcode.template.variableType'), key: 'type' },
  {
    title: $t('page.lowcode.template.required'),
    key: 'required',
    render: (row: TemplateVariable) => (row.required ? 'Yes' : 'No')
  },
  { title: $t('page.lowcode.template.defaultValue'), key: 'defaultValue' },
  {
    title: $t('common.actions'),
    key: 'actions',
    render: (row: TemplateVariable, index: number) => [
      h('NButton', { size: 'small', onClick: () => handleEditVariable(row, index) }, 'Edit'),
      h('NButton', { size: 'small', type: 'error', onClick: () => handleDeleteVariable(index) }, 'Delete')
    ]
  }
];

// Methods
function getLanguageColor(language: string): string {
  const colors: Record<string, string> = {
    TYPESCRIPT: '#3178c6',
    JAVASCRIPT: '#f7df1e',
    JAVA: '#ed8b00',
    PYTHON: '#3776ab',
    GO: '#00add8',
    RUST: '#000000',
    PHP: '#777bb4',
    CSHARP: '#239120'
  };
  return colors[language] || '#666666';
}

function getLanguageIcon(language: string) {
  // Return appropriate icon component based on language
  return 'icon-mdi-code-tags';
}

function getStatusType(status: string): 'success' | 'warning' | 'error' | 'info' {
  const statusMap: Record<string, 'success' | 'warning' | 'error' | 'info'> = {
    ACTIVE: 'success',
    INACTIVE: 'warning',
    DRAFT: 'info'
  };
  return statusMap[status] || 'info';
}

function getTemplateActions(template: Template) {
  return [
    { label: $t('common.edit'), key: 'edit' },
    { label: $t('common.duplicate'), key: 'duplicate' },
    { label: $t('common.export'), key: 'export' },
    { label: $t('common.delete'), key: 'delete' }
  ];
}

function handleCreateTemplate() {
  // Reset form and create new template
  Object.assign(templateForm, {
    name: '',
    code: '',
    description: '',
    language: 'TYPESCRIPT',
    framework: 'NESTJS',
    category: 'service',
    content: '',
    variables: [],
    tags: [],
    version: '1.0.0',
    status: 'DRAFT'
  });
  selectedTemplate.value = null;
}

function handleSelectTemplate(template: Template) {
  selectedTemplate.value = template;
  Object.assign(templateForm, template);
  editorLanguage.value = template.language.toLowerCase();
}

function handleTemplateAction(key: string) {
  switch (key) {
    case 'edit':
      // Already handled by selection
      break;
    case 'duplicate':
      handleDuplicateTemplate();
      break;
    case 'export':
      handleExportTemplate();
      break;
    case 'delete':
      handleDeleteTemplate();
      break;
  }
}

function handleDuplicateTemplate() {
  if (selectedTemplate.value) {
    const duplicated = { ...selectedTemplate.value };
    duplicated.name += ' (Copy)';
    duplicated.code += '_copy';
    duplicated.id = ''; // Will be generated on save
    Object.assign(templateForm, duplicated);
    selectedTemplate.value = null;
  }
}

function handleExportTemplate() {
  if (selectedTemplate.value) {
    const dataStr = JSON.stringify(selectedTemplate.value, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${selectedTemplate.value.code}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }
}

function handleDeleteTemplate() {
  if (selectedTemplate.value) {
    window.$dialog?.warning({
      title: $t('common.confirm'),
      content: $t('page.lowcode.template.deleteConfirm'),
      positiveText: $t('common.delete'),
      negativeText: $t('common.cancel'),
      onPositiveClick: () => {
        // Delete template logic here
        window.$message?.success($t('common.deleteSuccess'));
      }
    });
  }
}

function handleSaveTemplate() {
  // Save template logic here
  window.$message?.success($t('common.saveSuccess'));
}

function handlePreviewTemplate() {
  // Generate preview with sample data
  previewContent.value = templateForm.content || '';
}

function handleFormatCode() {
  // Format code logic here
  window.$message?.info('Code formatting not implemented yet');
}

function handleInsertVariable() {
  // Insert variable placeholder at cursor
  if (templateForm.variables && templateForm.variables.length > 0) {
    const variable = templateForm.variables[0];
    const placeholder = `{{${variable.name}}}`;
    templateForm.content += placeholder;
  }
}

function handleAddVariable() {
  Object.assign(variableForm, {
    name: '',
    type: 'string',
    required: false,
    defaultValue: '',
    description: ''
  });
  editingVariable.value = null;
  showVariableModal.value = true;
}

function handleEditVariable(variable: TemplateVariable, index: number) {
  Object.assign(variableForm, variable);
  editingVariable.value = variable;
  showVariableModal.value = true;
}

function handleDeleteVariable(index: number) {
  templateForm.variables?.splice(index, 1);
}

function handleSaveVariable() {
  if (editingVariable.value) {
    // Update existing variable
    Object.assign(editingVariable.value, variableForm);
  } else {
    // Add new variable
    if (!templateForm.variables) {
      templateForm.variables = [];
    }
    templateForm.variables.push({ ...variableForm });
  }
  showVariableModal.value = false;
}

// Watch for language changes
watch(
  () => templateForm.language,
  newLanguage => {
    if (newLanguage) {
      editorLanguage.value = newLanguage.toLowerCase();
    }
  }
);
</script>

<template>
  <div class="template-editor h-full">
    <NSplit direction="horizontal" :default-size="0.3" :min="0.2" :max="0.5">
      <template #1>
        <!-- Template List -->
        <div class="h-full flex flex-col">
          <div class="border-b p-4">
            <NSpace justify="space-between" align="center">
              <NText strong>{{ $t('page.lowcode.template.templates') }}</NText>
              <NButton size="small" type="primary" @click="handleCreateTemplate">
                <template #icon>
                  <NIcon><icon-mdi-plus /></NIcon>
                </template>
                {{ $t('common.create') }}
              </NButton>
            </NSpace>
          </div>

          <div class="flex-1 overflow-auto">
            <NList hoverable clickable>
              <NListItem
                v-for="template in templates"
                :key="template.id"
                :class="{ 'bg-primary-50': selectedTemplate?.id === template.id }"
                @click="handleSelectTemplate(template)"
              >
                <template #prefix>
                  <NIcon size="20" :color="getLanguageColor(template.language)">
                    <component :is="getLanguageIcon(template.language)" />
                  </NIcon>
                </template>

                <NThing>
                  <template #header>
                    <NSpace align="center">
                      <span>{{ template.name }}</span>
                      <NTag size="small" :type="getStatusType(template.status)">
                        {{ template.status }}
                      </NTag>
                    </NSpace>
                  </template>
                  <template #description>
                    <NSpace>
                      <NText depth="3">{{ template.language }}</NText>
                      <NText depth="3">{{ template.framework }}</NText>
                      <NText depth="3">v{{ template.version }}</NText>
                    </NSpace>
                  </template>
                </NThing>

                <template #suffix>
                  <NDropdown :options="getTemplateActions(template)" @select="handleTemplateAction">
                    <NButton size="small" quaternary circle>
                      <template #icon>
                        <NIcon><icon-mdi-dots-vertical /></NIcon>
                      </template>
                    </NButton>
                  </NDropdown>
                </template>
              </NListItem>
            </NList>
          </div>
        </div>
      </template>

      <template #2>
        <!-- Template Editor -->
        <div v-if="selectedTemplate" class="h-full flex flex-col">
          <div class="border-b p-4">
            <NSpace justify="space-between" align="center">
              <NSpace align="center">
                <NText strong>{{ selectedTemplate.name }}</NText>
                <NTag :type="getStatusType(selectedTemplate.status)">
                  {{ selectedTemplate.status }}
                </NTag>
              </NSpace>
              <NSpace>
                <NButton size="small" @click="handlePreviewTemplate">
                  <template #icon>
                    <NIcon><icon-mdi-eye /></NIcon>
                  </template>
                  {{ $t('common.preview') }}
                </NButton>
                <NButton size="small" type="primary" @click="handleSaveTemplate">
                  <template #icon>
                    <NIcon><icon-mdi-content-save /></NIcon>
                  </template>
                  {{ $t('page.lowcode.common.actions.save') }}
                </NButton>
              </NSpace>
            </NSpace>
          </div>

          <div class="flex-1 overflow-hidden">
            <NTabs type="line" animated class="h-full">
              <NTabPane name="basic" :tab="$t('page.lowcode.template.basicInfo')">
                <div class="p-4">
                  <NForm :model="templateForm" label-placement="left" :label-width="120">
                    <NFormItem :label="$t('page.lowcode.template.name')">
                      <NInput v-model:value="templateForm.name" />
                    </NFormItem>
                    <NFormItem :label="$t('page.lowcode.template.code')">
                      <NInput v-model:value="templateForm.code" />
                    </NFormItem>
                    <NFormItem :label="$t('page.lowcode.template.description')">
                      <NInput v-model:value="templateForm.description" type="textarea" :rows="3" />
                    </NFormItem>
                    <NFormItem :label="$t('page.lowcode.template.language')">
                      <NSelect v-model:value="templateForm.language" :options="languageOptions" />
                    </NFormItem>
                    <NFormItem :label="$t('page.lowcode.template.framework')">
                      <NSelect v-model:value="templateForm.framework" :options="frameworkOptions" />
                    </NFormItem>
                    <NFormItem :label="$t('page.lowcode.template.category')">
                      <NSelect v-model:value="templateForm.category" :options="categoryOptions" />
                    </NFormItem>
                    <NFormItem :label="$t('page.lowcode.template.tags')">
                      <NSelect
                        v-model:value="templateForm.tags"
                        multiple
                        tag
                        :placeholder="$t('page.lowcode.template.tagsPlaceholder')"
                      />
                    </NFormItem>
                  </NForm>
                </div>
              </NTabPane>

              <NTabPane name="content" :tab="$t('page.lowcode.template.content')">
                <div class="h-full flex flex-col">
                  <div class="border-b p-2">
                    <NSpace>
                      <NSelect
                        v-model:value="editorLanguage"
                        size="small"
                        style="width: 120px"
                        :options="editorLanguageOptions"
                      />
                      <NButton size="small" @click="handleFormatCode">
                        <template #icon>
                          <NIcon><icon-mdi-code-braces /></NIcon>
                        </template>
                        {{ $t('page.lowcode.template.format') }}
                      </NButton>
                      <NButton size="small" @click="handleInsertVariable">
                        <template #icon>
                          <NIcon><icon-mdi-variable /></NIcon>
                        </template>
                        {{ $t('page.lowcode.template.insertVariable') }}
                      </NButton>
                    </NSpace>
                  </div>
                  <div class="flex-1">
                    <NCode
                      v-model:code="templateForm.content"
                      :language="editorLanguage"
                      :theme="isDark ? 'dark' : 'light'"
                      show-line-numbers
                      word-wrap
                    />
                  </div>
                </div>
              </NTabPane>

              <NTabPane name="variables" :tab="$t('page.lowcode.template.variables')">
                <div class="p-4">
                  <div class="mb-4">
                    <NButton @click="handleAddVariable">
                      <template #icon>
                        <NIcon><icon-mdi-plus /></NIcon>
                      </template>
                      {{ $t('page.lowcode.template.addVariable') }}
                    </NButton>
                  </div>

                  <NDataTable
                    :columns="variableColumns"
                    :data="templateForm.variables"
                    :pagination="false"
                    size="small"
                  />
                </div>
              </NTabPane>

              <NTabPane name="preview" :tab="$t('common.preview')">
                <div class="p-4">
                  <div v-if="previewContent" class="h-full">
                    <NCode :code="previewContent" :language="templateForm.language.toLowerCase()" />
                  </div>
                  <NEmpty v-else :description="$t('page.lowcode.template.noPreview')" />
                </div>
              </NTabPane>
            </NTabs>
          </div>
        </div>

        <div v-else class="h-full flex items-center justify-center">
          <NEmpty :description="$t('page.lowcode.template.selectTemplate')" />
        </div>
      </template>
    </NSplit>

    <!-- Variable Editor Modal -->
    <NModal v-model:show="showVariableModal" preset="card" style="width: 600px">
      <template #header>
        {{ editingVariable ? $t('page.lowcode.template.editVariable') : $t('page.lowcode.template.addVariable') }}
      </template>

      <NForm :model="variableForm" label-placement="left" :label-width="100">
        <NFormItem :label="$t('page.lowcode.template.variableName')" required>
          <NInput v-model:value="variableForm.name" />
        </NFormItem>
        <NFormItem :label="$t('page.lowcode.template.variableType')" required>
          <NSelect v-model:value="variableForm.type" :options="variableTypeOptions" />
        </NFormItem>
        <NFormItem :label="$t('page.lowcode.template.required')">
          <NSwitch v-model:value="variableForm.required" />
        </NFormItem>
        <NFormItem :label="$t('page.lowcode.template.defaultValue')">
          <NInput v-model:value="variableForm.defaultValue" />
        </NFormItem>
        <NFormItem :label="$t('page.lowcode.template.description')">
          <NInput v-model:value="variableForm.description" type="textarea" :rows="3" />
        </NFormItem>
      </NForm>

      <template #footer>
        <NSpace justify="end">
          <NButton @click="showVariableModal = false">{{ $t('common.cancel') }}</NButton>
          <NButton type="primary" @click="handleSaveVariable">{{ $t('page.lowcode.common.actions.save') }}</NButton>
        </NSpace>
      </template>
    </NModal>
  </div>
</template>

<style scoped>
.template-editor {
  @apply h-full;
}

.template-editor :deep(.n-split-pane) {
  @apply h-full;
}

.template-editor :deep(.n-code) {
  @apply h-full;
}
</style>
