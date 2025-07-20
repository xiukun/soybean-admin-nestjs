<template>
  <div class="min-h-500px flex-col-stretch gap-16px overflow-hidden lt-sm:overflow-auto">
    <NCard :title="$t('page.lowcode.codeGeneration.title')" :bordered="false" size="small" class="card-wrapper">
      <NForm ref="formRef" :model="generationForm" :rules="rules" label-placement="left" :label-width="120">
        <NFormItem :label="$t('page.lowcode.codeGeneration.project')" path="projectId">
          <NSelect 
            v-model:value="generationForm.projectId" 
            :placeholder="$t('page.lowcode.codeGeneration.form.project.placeholder')"
            :options="projectOptions"
            @update:value="handleProjectChange"
          />
        </NFormItem>
        
        <NFormItem :label="$t('page.lowcode.codeGeneration.template')" path="templateId">
          <NSelect 
            v-model:value="generationForm.templateId" 
            :placeholder="$t('page.lowcode.codeGeneration.form.template.placeholder')"
            :options="templateOptions"
            :loading="templateLoading"
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
          />
        </NFormItem>
        
        <NFormItem :label="$t('page.lowcode.codeGeneration.outputPath')" path="outputPath">
          <NInput 
            v-model:value="generationForm.outputPath" 
            :placeholder="$t('page.lowcode.codeGeneration.form.outputPath.placeholder')" 
          />
        </NFormItem>
        
        <NDivider title-placement="left">{{ $t('page.lowcode.codeGeneration.templateVariables') }}</NDivider>
        
        <div v-if="templateVariables.length > 0">
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
              </NSpace>
            </template>
            
            <NInput 
              v-if="variable.type === 'string'"
              v-model:value="generationForm.variables[variable.name]"
              :placeholder="variable.defaultValue || `Enter ${variable.name}`"
            />
            <NInputNumber 
              v-else-if="variable.type === 'number'"
              v-model:value="generationForm.variables[variable.name]"
              :placeholder="variable.defaultValue || `Enter ${variable.name}`"
              style="width: 100%"
            />
            <NSwitch 
              v-else-if="variable.type === 'boolean'"
              v-model:value="generationForm.variables[variable.name]"
            />
            <NSelect 
              v-else-if="variable.type === 'array'"
              v-model:value="generationForm.variables[variable.name]"
              :placeholder="variable.defaultValue || `Select ${variable.name}`"
              multiple
              tag
            />
            <NInput 
              v-else
              v-model:value="generationForm.variables[variable.name]"
              :placeholder="variable.defaultValue || `Enter ${variable.name}`"
              type="textarea"
              :rows="3"
            />
          </NFormItem>
        </div>
        <NEmpty v-else :description="$t('page.lowcode.codeGeneration.noVariables')" />
        
        <NDivider title-placement="left">{{ $t('page.lowcode.codeGeneration.options') }}</NDivider>
        
        <NFormItem :label="$t('page.lowcode.codeGeneration.overwriteExisting')" path="overwriteExisting">
          <NSwitch v-model:value="generationForm.overwriteExisting" />
        </NFormItem>
        
        <NFormItem :label="$t('page.lowcode.codeGeneration.generateTests')" path="generateTests">
          <NSwitch v-model:value="generationForm.generateTests" />
        </NFormItem>
        
        <NFormItem :label="$t('page.lowcode.codeGeneration.generateDocs')" path="generateDocs">
          <NSwitch v-model:value="generationForm.generateDocs" />
        </NFormItem>
        
        <NFormItem>
          <NSpace>
            <NButton type="primary" :loading="generating" @click="handleGenerate">
              {{ $t('page.lowcode.codeGeneration.generate') }}
            </NButton>
            <NButton @click="handleReset">
              {{ $t('common.reset') }}
            </NButton>
            <NButton type="info" @click="handlePreview">
              {{ $t('page.lowcode.codeGeneration.preview') }}
            </NButton>
          </NSpace>
        </NFormItem>
      </NForm>
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
import { reactive, ref, watch, onMounted } from 'vue';
import type { FormInst, FormRules } from 'naive-ui';
import {
  fetchGetAllProjects,
  fetchGetAllTemplates,
  fetchGetAllEntities,
  fetchGenerateCode,
  fetchGetGenerationProgress,
  fetchGetGeneratedFileContent,
  fetchGetTemplateVariables
} from '@/service/api';
import { $t } from '@/locales';
import { createRequiredFormRule } from '@/utils/form/rule';

const props = defineProps<{
  projectId?: string;
}>();

interface GenerationForm {
  projectId: string;
  templateId: string;
  entityIds: string[];
  outputPath: string;
  variables: Record<string, any>;
  overwriteExisting: boolean;
  generateTests: boolean;
  generateDocs: boolean;
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

const formRef = ref<FormInst | null>(null);
const generating = ref(false);
const templateLoading = ref(false);
const entityLoading = ref(false);

const projectOptions = ref<Array<{ label: string; value: string }>>([]);
const templateOptions = ref<Array<{ label: string; value: string }>>([]);
const entityOptions = ref<Array<{ label: string; value: string }>>([]);
const templateVariables = ref<Api.Lowcode.TemplateVariable[]>([]);

const generationForm = reactive<GenerationForm>({
  projectId: props.projectId || '',
  templateId: '',
  entityIds: [],
  outputPath: './generated',
  variables: {},
  overwriteExisting: false,
  generateTests: true,
  generateDocs: true
});

const generationProgress = ref<GenerationProgress | null>(null);
const generationResult = ref<GenerationResult | null>(null);
const selectedFileName = ref('');
const selectedFileContent = ref('');

const rules: FormRules = {
  projectId: createRequiredFormRule($t('page.lowcode.codeGeneration.form.project.required')),
  templateId: createRequiredFormRule($t('page.lowcode.codeGeneration.form.template.required')),
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

function handleProjectChange(projectId: string) {
  generationForm.templateId = '';
  generationForm.entityIds = [];
  templateVariables.value = [];
  generationForm.variables = {};
  
  loadTemplates(projectId);
  loadEntities(projectId);
}

async function handleTemplateChange(templateId: string) {
  // Load template variables
  try {
    const { data: variables } = await fetchGetTemplateVariables(templateId);
    templateVariables.value = variables || [];

    // Initialize variables with default values
    generationForm.variables = {};
    templateVariables.value.forEach((variable: any) => {
      if (variable.defaultValue !== undefined) {
        generationForm.variables[variable.name] = variable.defaultValue;
      }
    });
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
      templateId: generationForm.templateId,
      entityIds: generationForm.entityIds,
      outputPath: generationForm.outputPath,
      variables: generationForm.variables,
      options: {
        overwriteExisting: generationForm.overwriteExisting,
        generateTests: generationForm.generateTests,
        generateDocs: generationForm.generateDocs,
        architecture: 'base-biz',
        framework: 'nestjs'
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
  generationForm.entityIds = [];
  generationForm.outputPath = './generated';
  generationForm.variables = {};
  generationForm.overwriteExisting = false;
  generationForm.generateTests = true;
  generationForm.generateDocs = true;
  
  generationProgress.value = null;
  generationResult.value = null;
  selectedFileContent.value = '';
  selectedFileName.value = '';
}

function handlePreview() {
  // TODO: Implement preview functionality
  window.$message?.info($t('page.lowcode.codeGeneration.previewNotImplemented'));
}

async function handleFileSelect(selectedKeys: string[]) {
  if (selectedKeys.length === 0) return;
  
  const filePath = selectedKeys[0];
  selectedFileName.value = filePath.split('/').pop() || '';
  
  try {
    selectedFileContent.value = await fetchGetGeneratedFileContent(filePath);
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
