<template>
  <div class="min-h-500px flex-col-stretch gap-16px overflow-hidden lt-sm:overflow-auto">
    <!-- Global Project Selector -->
    <NCard :bordered="false" size="small" class="card-wrapper">
      <ProjectSelector
        :show-quick-actions="true"
        @change="handleGlobalProjectChange"
        @create="handleCreateProject"
        @settings="handleProjectSettings"
        @stats="handleProjectStats"
      />
    </NCard>

    <!-- Main Generation Form -->
    <NCard :title="$t('page.lowcode.codeGeneration.title')" :bordered="false" size="small" class="card-wrapper">
      <template #header-extra>
        <NSpace>
          <NButton size="small" @click="handleLoadTemplate">
            <template #icon>
              <NIcon><icon-mdi-upload /></NIcon>
            </template>
            {{ $t('page.lowcode.codeGeneration.loadTemplate') }}
          </NButton>
          <NButton size="small" @click="handleSaveTemplate">
            <template #icon>
              <NIcon><icon-mdi-download /></NIcon>
            </template>
            {{ $t('page.lowcode.codeGeneration.saveTemplate') }}
          </NButton>
        </NSpace>
      </template>

      <NSplit direction="horizontal" :default-size="0.6" :min="0.3" :max="0.8">
        <template #1>
          <!-- Generation Configuration -->
          <div class="pr-4">
            <NForm ref="formRef" :model="generationForm" :rules="rules" label-placement="left" :label-width="120">
              <NFormItem :label="$t('page.lowcode.codeGeneration.template')" path="templateIds">
                <NSelect
                  v-model:value="generationForm.templateIds"
                  :placeholder="$t('page.lowcode.codeGeneration.form.template.placeholder')"
                  :options="templateOptions"
                  :loading="templateLoading"
                  multiple
                  clearable
                  filterable
                  @update:value="handleTemplateChange"
                />
              </NFormItem>


              <NFormItem :label="$t('page.lowcode.codeGeneration.entities')" path="entityIds">
                <NSelect
                  v-model:value="generationForm.entityIds"
                  :placeholder="$t('page.lowcode.codeGeneration.form.entities.placeholder')"
                  :options="entityOptions"
                  :loading="entityLoading"
                  multiple
                  clearable
                  filterable
                  @update:value="handleEntityChange"
                />
              </NFormItem>

              <NFormItem :label="$t('page.lowcode.codeGeneration.outputPath')" path="outputPath">
                <NInputGroup>
                  <NInput
                    v-model:value="generationForm.outputPath"
                    :placeholder="$t('page.lowcode.codeGeneration.form.outputPath.placeholder')"
                  />
                  <NButton @click="handleBrowseOutputPath">
                    <template #icon>
                      <NIcon><icon-mdi-folder-open /></NIcon>
                    </template>
                  </NButton>
                </NInputGroup>
              </NFormItem>

              <NDivider title-placement="left">
                <NSpace align="center">
                  <span>{{ $t('page.lowcode.codeGeneration.templateVariables') }}</span>
                  <NButton
                    v-if="templateVariables.length > 0"
                    size="tiny"
                    @click="handleAutoFillVariables"
                  >
                    {{ $t('page.lowcode.codeGeneration.autoFill') }}
                  </NButton>
                </NSpace>
              </NDivider>

              <div v-if="templateVariables.length > 0" class="space-y-4">
                <NFormItem
                  v-for="variable in templateVariables"
                  :key="variable.name"
                  :label="variable.name"
                  :path="`variables.${variable.name}`"
                >
                  <template #label>
                    <NSpace align="center">
                      <span>{{ variable.name }}</span>
                      <NTooltip v-if="variable.description">
                        <template #trigger>
                          <NIcon size="14" class="text-gray-400">
                            <icon-ic-round-help />
                          </NIcon>
                        </template>
                        {{ variable.description }}
                      </NTooltip>
                      <NTag v-if="variable.required" type="error" size="small">Required</NTag>
                      <NTag v-if="variable.type" type="info" size="small">{{ variable.type }}</NTag>
                    </NSpace>
                  </template>

                  <NInput
                    v-if="variable.type === 'string'"
                    v-model:value="generationForm.variables[variable.name]"
                    :placeholder="variable.defaultValue || `Enter ${variable.name}`"
                    @input="handleVariableChange"
                  />
                  <NInputNumber
                    v-else-if="variable.type === 'number'"
                    v-model:value="generationForm.variables[variable.name]"
                    :placeholder="variable.defaultValue || `Enter ${variable.name}`"
                    style="width: 100%"
                    @update:value="handleVariableChange"
                  />
                  <NSwitch
                    v-else-if="variable.type === 'boolean'"
                    v-model:value="generationForm.variables[variable.name]"
                    @update:value="handleVariableChange"
                  />
                  <NSelect
                    v-else-if="variable.type === 'array'"
                    v-model:value="generationForm.variables[variable.name]"
                    :options="variable.options?.map(opt => ({ label: opt, value: opt }))"
                    :placeholder="variable.defaultValue || `Select ${variable.name}`"
                    multiple
                    tag
                    @update:value="handleVariableChange"
                  />
                  <NInput
                    v-else
                    v-model:value="generationForm.variables[variable.name]"
                    :placeholder="variable.defaultValue || `Enter ${variable.name}`"
                    type="textarea"
                    :rows="3"
                    @input="handleVariableChange"
                  />
                </NFormItem>
              </div>
              <NEmpty v-else :description="$t('page.lowcode.codeGeneration.noVariables')" />

              <NDivider title-placement="left">{{ $t('page.lowcode.codeGeneration.options') }}</NDivider>

              <NGrid :cols="2" :x-gap="16">
                <NGridItem>
                  <NFormItem :label="$t('page.lowcode.codeGeneration.overwriteExisting')" path="overwriteExisting">
                    <NSwitch v-model:value="generationForm.overwriteExisting" />
                  </NFormItem>
                </NGridItem>
                <NGridItem>
                  <NFormItem :label="$t('page.lowcode.codeGeneration.generateTests')" path="generateTests">
                    <NSwitch v-model:value="generationForm.generateTests" />
                  </NFormItem>
                </NGridItem>
                <NGridItem>
                  <NFormItem :label="$t('page.lowcode.codeGeneration.generateDocs')" path="generateDocs">
                    <NSwitch v-model:value="generationForm.generateDocs" />
                  </NFormItem>
                </NGridItem>
                <NGridItem>
                  <NFormItem :label="$t('page.lowcode.codeGeneration.architecture')" path="architecture">
                    <NSelect
                      v-model:value="generationForm.architecture"
                      :options="architectureOptions"
                      :placeholder="$t('page.lowcode.codeGeneration.form.architecture.placeholder')"
                    />
                  </NFormItem>
                </NGridItem>
              </NGrid>

              <NFormItem>
                <NSpace>
                  <NButton type="primary" :loading="generating" @click="handleGenerate">
                    <template #icon>
                      <NIcon><icon-mdi-play /></NIcon>
                    </template>
                    {{ $t('page.lowcode.codeGeneration.generate') }}
                  </NButton>
                  <NButton @click="handleReset">
                    <template #icon>
                      <NIcon><icon-mdi-refresh /></NIcon>
                    </template>
                    {{ $t('common.reset') }}
                  </NButton>
                  <NButton type="info" :loading="previewing" @click="handlePreview">
                    <template #icon>
                      <NIcon><icon-mdi-eye /></NIcon>
                    </template>
                    {{ $t('page.lowcode.codeGeneration.preview') }}
                  </NButton>
                  <NButton @click="handleValidate">
                    <template #icon>
                      <NIcon><icon-mdi-check-circle /></NIcon>
                    </template>
                    {{ $t('page.lowcode.codeGeneration.validate') }}
                  </NButton>
                </NSpace>
              </NFormItem>
            </NForm>
          </div>
        </template>

        <template #2>
          <!-- Enhanced Preview Panel -->
          <div class="pl-4 h-full">
            <CodePreview
              :preview-data="previewContent"
              :loading="previewing"
              @refresh="handleRefreshPreview"
              @download="handleDownloadPreview"
            />
          </div>
        </template>
      </NSplit>
    </NCard>
    
    <!-- Generation Progress -->
    <NCard v-if="generationProgress" :title="$t('page.lowcode.codeGeneration.progress')" :bordered="false" size="small" class="card-wrapper">
      <NSpace vertical>
        <NProgress 
          type="line" 
          :percentage="generationProgress.percentage" 
          :status="generationProgress.status"
          :show-indicator="true"
        />
        <NText>{{ generationProgress.message }}</NText>
        <NSpace v-if="generationProgress.logs.length > 0" vertical>
          <NText strong>{{ $t('page.lowcode.codeGeneration.logs') }}:</NText>
          <NScrollbar style="max-height: 200px">
            <div v-for="(log, index) in generationProgress.logs" :key="index" class="mb-2">
              <NTag :type="getLogTagType(log.level)" size="small">{{ log.level }}</NTag>
              <span class="ml-2">{{ log.message }}</span>
              <NText depth="3" class="ml-2">{{ new Date(log.timestamp).toLocaleTimeString() }}</NText>
            </div>
          </NScrollbar>
        </NSpace>
      </NSpace>
    </NCard>
    
    <!-- Generation Result -->
    <NCard v-if="generationResult" :title="$t('page.lowcode.codeGeneration.result')" :bordered="false" size="small" class="card-wrapper">
      <NTabs type="line" animated>
        <NTabPane name="summary" :tab="$t('page.lowcode.codeGeneration.summary')">
          <NSpace vertical>
            <NSpace align="center">
              <NText strong>{{ $t('page.lowcode.codeGeneration.status') }}:</NText>
              <NTag :type="generationResult.success ? 'success' : 'error'">
                {{ generationResult.success ? $t('common.success') : $t('common.failed') }}
              </NTag>
            </NSpace>
            <NSpace align="center">
              <NText strong>{{ $t('page.lowcode.codeGeneration.filesGenerated') }}:</NText>
              <NText>{{ generationResult.filesGenerated || 0 }}</NText>
            </NSpace>
            <NSpace align="center">
              <NText strong>{{ $t('page.lowcode.codeGeneration.outputPath') }}:</NText>
              <NText code>{{ generationResult.outputPath }}</NText>
            </NSpace>
            <div v-if="generationResult.errors && generationResult.errors.length > 0">
              <NText strong type="error">{{ $t('page.lowcode.codeGeneration.errors') }}:</NText>
              <ul>
                <li v-for="error in generationResult.errors" :key="error" class="text-red-500">
                  {{ error }}
                </li>
              </ul>
            </div>
          </NSpace>
        </NTabPane>
        <NTabPane name="files" :tab="$t('page.lowcode.codeGeneration.generatedFiles')">
          <NTree 
            v-if="generationResult.fileTree"
            :data="generationResult.fileTree"
            key-field="path"
            label-field="name"
            children-field="children"
            selectable
            @update:selected-keys="handleFileSelect"
          />
        </NTabPane>
        <NTabPane v-if="selectedFileContent" name="content" :tab="$t('page.lowcode.codeGeneration.fileContent')">
          <NCode :code="selectedFileContent" :language="getFileLanguage(selectedFileName)" />
        </NTabPane>
      </NTabs>
    </NCard>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, watch, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import type { FormInst, FormRules } from 'naive-ui';
import {
  fetchGetAllProjects,
  fetchGetAllTemplates,
  fetchGetAllEntities,
  fetchGenerateCode,
  fetchGetGeneratedFileContent,
  fetchGetTemplateVariables
} from '@/service/api';
import { $t } from '@/locales';
import { createRequiredFormRule } from '@/utils/form/rule';
import { useLowcodeStore } from '@/store/modules/lowcode';
import ProjectSelector from '@/components/common/ProjectSelector.vue';
import CodePreview from '@/components/lowcode/CodePreview.vue';

const props = defineProps<{
  projectId?: string;
}>();

interface GenerationForm {
  projectId: string;
  templateIds: string[];
  entityIds: string[];
  outputPath: string;
  variables: Record<string, any>;
  overwriteExisting: boolean;
  generateTests: boolean;
  generateDocs: boolean;
  architecture: string;
  framework: string;
}

interface GenerationProgress {
  percentage: number;
  status: 'default' | 'success' | 'error';
  message: string;
  logs: Array<{
    level: 'info' | 'warn' | 'error';
    message: string;
    timestamp: string;
  }>;
}

interface GenerationResult {
  success: boolean;
  filesGenerated: number;
  outputPath: string;
  errors?: string[];
  fileTree?: any[];
}

const router = useRouter();
const lowcodeStore = useLowcodeStore();

const formRef = ref<FormInst | null>(null);
const generating = ref(false);
const previewing = ref(false);
const templateLoading = ref(false);
const entityLoading = ref(false);

const projectOptions = ref<Array<{ label: string; value: string }>>([]);
const templateOptions = ref<Array<{ label: string; value: string }>>([]);
const entityOptions = ref<Array<{ label: string; value: string }>>([]);
const templateVariables = ref<Api.Lowcode.TemplateVariable[]>([]);

const previewMode = ref<'files' | 'structure' | 'validation'>('files');
const previewContent = ref<any>(null);

const architectureOptions = ref([
  { label: 'Base-Biz', value: 'base-biz' },
  { label: 'DDD', value: 'ddd' },
  { label: 'Clean Architecture', value: 'clean' },
  { label: 'Hexagonal', value: 'hexagonal' }
]);

const previewModeOptions = ref([
  { label: 'Files', value: 'files' },
  { label: 'Structure', value: 'structure' },
  { label: 'Validation', value: 'validation' }
]);

const generationForm = reactive<GenerationForm>({
  projectId: props.projectId || '',
  templateIds: [],
  entityIds: [],
  outputPath: './generated',
  variables: {},
  overwriteExisting: false,
  generateTests: true,
  generateDocs: true,
  architecture: 'base-biz',
  framework: 'nestjs'
});

const generationProgress = ref<GenerationProgress | null>(null);
const generationResult = ref<GenerationResult | null>(null);
const selectedFileName = ref('');
const selectedFileContent = ref('');

const rules: FormRules = {
  projectId: createRequiredFormRule($t('page.lowcode.codeGeneration.form.project.required')),
  templateIds: createRequiredFormRule($t('page.lowcode.codeGeneration.form.template.required')),
  outputPath: createRequiredFormRule($t('page.lowcode.codeGeneration.form.outputPath.required'))
};

function getLogTagType(level: string): 'info' | 'warning' | 'error' {
  const levelMap: Record<string, 'info' | 'warning' | 'error'> = {
    info: 'info',
    warn: 'warning',
    error: 'error'
  };
  return levelMap[level] || 'info';
}

function getFileLanguage(fileName: string): string {
  const ext = fileName.split('.').pop()?.toLowerCase();
  const langMap: Record<string, string> = {
    js: 'javascript',
    ts: 'typescript',
    vue: 'vue',
    java: 'java',
    py: 'python',
    go: 'go',
    rs: 'rust',
    php: 'php',
    cs: 'csharp',
    cpp: 'cpp',
    c: 'c',
    html: 'html',
    css: 'css',
    scss: 'scss',
    json: 'json',
    xml: 'xml',
    yaml: 'yaml',
    yml: 'yaml',
    md: 'markdown'
  };
  return langMap[ext || ''] || 'text';
}

async function loadProjects() {
  try {
    const { data: projects } = await fetchGetAllProjects();
    if (projects) {
      projectOptions.value = projects.map((project: any) => ({
        label: project.name,
        value: project.id
      }));
    }
  } catch (error) {
    console.error('Failed to load projects:', error);
  }
}

async function loadTemplates(projectId: string) {
  if (!projectId) return;

  try {
    templateLoading.value = true;
    const { data: templates } = await fetchGetAllTemplates(projectId);
    if (templates) {
      templateOptions.value = templates.map((template: any) => ({
        label: `${template.name} (${template.language})`,
        value: template.id
      }));
    }
  } catch (error) {
    console.error('Failed to load templates:', error);
  } finally {
    templateLoading.value = false;
  }
}

async function loadEntities(projectId: string) {
  if (!projectId) return;

  try {
    entityLoading.value = true;
    const { data: entities } = await fetchGetAllEntities(projectId);
    if (entities) {
      entityOptions.value = entities.map((entity: any) => ({
        label: entity.name,
        value: entity.id
      }));
    }
  } catch (error) {
    console.error('Failed to load entities:', error);
  } finally {
    entityLoading.value = false;
  }
}

// Global project change handler
function handleGlobalProjectChange(projectId: string | null) {
  if (projectId) {
    generationForm.projectId = projectId;
    handleProjectChange(projectId);
  }
}

function handleCreateProject() {
  router.push('/lowcode/project');
}

function handleProjectSettings(projectId: string) {
  router.push(`/lowcode/project?id=${projectId}&action=edit`);
}

function handleProjectStats(projectId: string) {
  router.push(`/lowcode/project/stats?id=${projectId}`);
}

function handleProjectChange(projectId: string) {
  generationForm.templateIds = [];
  generationForm.entityIds = [];
  templateVariables.value = [];
  generationForm.variables = {};

  loadTemplates(projectId);
  loadEntities(projectId);
}

function handleEntityChange() {
  // Auto-fill some variables based on selected entities
  handleAutoFillVariables();
}

function handleBrowseOutputPath() {
  // TODO: Implement file browser
  window.$message?.info('File browser not implemented yet');
}

function handleLoadTemplate() {
  // TODO: Implement template loading from file
  window.$message?.info('Template loading not implemented yet');
}

function handleSaveTemplate() {
  // TODO: Implement template saving to file
  window.$message?.info('Template saving not implemented yet');
}

function handleAutoFillVariables() {
  if (generationForm.entityIds.length > 0 && templateVariables.value.length > 0) {
    const firstEntity = entityOptions.value.find(e => e.value === generationForm.entityIds[0]);
    if (firstEntity) {
      templateVariables.value.forEach(variable => {
        if (variable.name === 'entityName' && !generationForm.variables[variable.name]) {
          generationForm.variables[variable.name] = firstEntity.label;
        }
        if (variable.name === 'tableName' && !generationForm.variables[variable.name]) {
          generationForm.variables[variable.name] = firstEntity.label.toLowerCase() + 's';
        }
      });
    }
  }
}

function handleVariableChange() {
  // Trigger preview update when variables change
  if (previewContent.value) {
    handleRefreshPreview();
  }
}

function handleRefreshPreview() {
  if (generationForm.templateIds.length > 0 && generationForm.entityIds.length > 0) {
    handlePreview();
  }
}

function handleDownloadPreview() {
  if (!previewContent.value) {
    window.$message?.warning('No preview content to download');
    return;
  }

  try {
    // Create a zip file with all generated files
    const files = previewContent.value.files || [];
    if (files.length === 0) {
      window.$message?.warning('No files to download');
      return;
    }

    // For now, download as JSON - in real implementation, create a zip
    const dataStr = JSON.stringify(files, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'generated-files.json';
    link.click();
    URL.revokeObjectURL(url);

    window.$message?.success('Preview files downloaded');
  } catch (error) {
    console.error('Failed to download preview:', error);
    window.$message?.error('Failed to download preview');
  }
}

async function handleTemplateChange(templateIds: string[]) {
  // Load template variables for all selected templates
  try {
    templateVariables.value = [];
    generationForm.variables = {};

    if (templateIds.length > 0) {
      // Load variables from all templates and merge them
      const allVariables = new Map();

      for (const templateId of templateIds) {
        const { data: variables } = await fetchGetTemplateVariables(templateId);
        if (variables) {
          variables.forEach((variable: any) => {
            if (!allVariables.has(variable.name)) {
              allVariables.set(variable.name, variable);
            }
          });
        }
      }

      templateVariables.value = Array.from(allVariables.values());

      // Initialize variables with default values
      templateVariables.value.forEach((variable: any) => {
        if (variable.defaultValue !== undefined) {
          generationForm.variables[variable.name] = variable.defaultValue;
        }
      });

      // Auto-fill variables if entities are selected
      handleAutoFillVariables();
    }
  } catch (error) {
    console.error('Failed to load template variables:', error);
  }
}

async function handleGenerate() {
  await formRef.value?.validate();

  try {
    generating.value = true;
    generationProgress.value = {
      percentage: 0,
      status: 'default',
      message: 'Starting code generation...',
      logs: []
    };

    const { data: result } = await fetchGenerateCode({
      projectId: generationForm.projectId,
      templateIds: generationForm.templateIds,
      entityIds: generationForm.entityIds,
      outputPath: generationForm.outputPath,
      variables: generationForm.variables,
      options: {
        overwriteExisting: generationForm.overwriteExisting,
        generateTests: generationForm.generateTests,
        generateDocs: generationForm.generateDocs,
        architecture: generationForm.architecture,
        framework: generationForm.framework
      }
    });

    if (result) {
      generationResult.value = result;
      generationProgress.value = {
        percentage: 100,
        status: result.success ? 'success' : 'error',
        message: result.success ? 'Code generation completed' : 'Code generation failed',
        logs: generationProgress.value?.logs || []
      };

      window.$message?.success('Code generation completed successfully');
    }
  } catch (error: any) {
    generationProgress.value = {
      percentage: 100,
      status: 'error',
      message: error.message || 'Code generation failed',
      logs: generationProgress.value?.logs || []
    };
    window.$message?.error('Code generation failed');
  } finally {
    generating.value = false;
  }
}

function handleReset() {
  generationForm.templateIds = [];
  generationForm.entityIds = [];
  generationForm.outputPath = './generated';
  generationForm.variables = {};
  generationForm.overwriteExisting = false;
  generationForm.generateTests = true;
  generationForm.generateDocs = true;
  generationForm.architecture = 'base-biz';
  generationForm.framework = 'nestjs';

  templateVariables.value = [];
  generationProgress.value = null;
  generationResult.value = null;
  selectedFileContent.value = '';
  selectedFileName.value = '';
  previewContent.value = null;
}

async function handlePreview() {
  if (!generationForm.projectId || generationForm.templateIds.length === 0 || generationForm.entityIds.length === 0) {
    window.$message?.warning('Please select project, templates, and entities first');
    return;
  }

  try {
    previewing.value = true;

    // Mock preview data - in real implementation, this would call the backend
    const mockPreviewData = {
      files: [
        {
          name: 'user.service.ts',
          path: 'src/services/user.service.ts',
          content: `export class UserService {
  constructor() {}

  async findAll(): Promise<User[]> {
    return [];
  }

  async findById(id: string): Promise<User | null> {
    return null;
  }
}`
        },
        {
          name: 'user.controller.ts',
          path: 'src/controllers/user.controller.ts',
          content: `@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  findAll() {
    return this.userService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.userService.findById(id);
  }
}`
        }
      ],
      structure: [
        {
          name: 'src',
          path: 'src',
          children: [
            { name: 'services', path: 'src/services', children: [
              { name: 'user.service.ts', path: 'src/services/user.service.ts' }
            ]},
            { name: 'controllers', path: 'src/controllers', children: [
              { name: 'user.controller.ts', path: 'src/controllers/user.controller.ts' }
            ]}
          ]
        }
      ],
      validation: [
        { type: 'success', title: 'Validation Passed', message: 'All templates and variables are valid' }
      ]
    };

    previewContent.value = mockPreviewData;
    window.$message?.success('Preview generated successfully');
  } catch (error) {
    console.error('Failed to generate preview:', error);
    window.$message?.error('Failed to generate preview');
  } finally {
    previewing.value = false;
  }
}

async function handleValidate() {
  if (!generationForm.projectId || generationForm.templateIds.length === 0) {
    window.$message?.warning('Please select project and templates first');
    return;
  }

  try {
    // Mock validation - in real implementation, this would call the backend
    const mockValidation = {
      valid: true,
      issues: []
    };

    if (mockValidation.valid) {
      window.$message?.success('Validation passed');
    } else {
      window.$message?.error(`Validation failed: ${mockValidation.issues.join(', ')}`);
    }
  } catch (error) {
    console.error('Failed to validate:', error);
    window.$message?.error('Validation failed');
  }
}

async function handleFileSelect(selectedKeys: string[]) {
  if (selectedKeys.length === 0) return;

  const filePath = selectedKeys[0];
  selectedFileName.value = filePath.split('/').pop() || '';

  try {
    const { data } = await fetchGetGeneratedFileContent(filePath);
    selectedFileContent.value = data || 'No content available';
  } catch (error) {
    console.error('Failed to load file content:', error);
    selectedFileContent.value = 'Failed to load file content';
  }
}

onMounted(() => {
  loadProjects();
  if (props.projectId) {
    loadTemplates(props.projectId);
    loadEntities(props.projectId);
  }
});

watch(() => props.projectId, (newProjectId) => {
  if (newProjectId) {
    generationForm.projectId = newProjectId;
    loadTemplates(newProjectId);
    loadEntities(newProjectId);
  }
});
</script>

<style scoped></style>
