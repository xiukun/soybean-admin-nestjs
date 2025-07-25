<template>
  <NModal v-model:show="visible" preset="card" :title="title" class="w-90vw h-90vh">
    <template #header-extra>
      <NSpace>
        <NButton type="primary" :loading="saving" @click="handleSave">
          {{ $t('common.save') }}
        </NButton>
        <NButton @click="handleClose">
          {{ $t('common.close') }}
        </NButton>
      </NSpace>
    </template>
    
    <div class="h-full flex flex-col">
      <NTabs v-model:value="activeTab" type="line" animated class="flex-1 flex flex-col">
        <NTabPane name="content" :tab="$t('page.lowcode.template.content')" class="flex-1 flex flex-col">
          <!-- 编辑器工具栏 -->
          <div class="mb-3 p-2 bg-gray-50 rounded flex justify-between items-center">
            <NSpace>
              <NButton size="small" @click="handleValidate" :loading="validating">
                <template #icon>
                  <icon-ic-round-check-circle />
                </template>
                {{ $t('page.lowcode.template.validate') }}
              </NButton>
              <NButton size="small" @click="handlePreview" :loading="previewing">
                <template #icon>
                  <icon-ic-round-preview />
                </template>
                {{ $t('page.lowcode.template.preview') }}
              </NButton>
              <NButton size="small" @click="handleFormat">
                <template #icon>
                  <icon-ic-round-format-align-left />
                </template>
                {{ $t('page.lowcode.template.format') }}
              </NButton>
            </NSpace>

            <NSpace>
              <NTag v-if="validationResult" :type="validationResult.isValid ? 'success' : 'error'" size="small">
                {{ validationResult.isValid ? $t('page.lowcode.template.validationSuccess') : $t('page.lowcode.template.validationError') }}
              </NTag>
            </NSpace>
          </div>

          <div class="flex-1 border border-gray-200 rounded">
            <MonacoEditor
              v-model:value="templateContent"
              :language="getEditorLanguage(templateData?.language)"
              :options="editorOptions"
              class="h-full"
            />
          </div>

          <!-- 验证结果 -->
          <div v-if="validationResult && !validationResult.isValid" class="mt-3">
            <NAlert type="error" :title="$t('page.lowcode.template.validationError')" closable>
              <div v-for="error in validationResult.errors" :key="error" class="text-sm">
                {{ error }}
              </div>
            </NAlert>
          </div>

          <!-- 警告信息 -->
          <div v-if="validationResult && validationResult.warnings && validationResult.warnings.length > 0" class="mt-2">
            <NAlert type="warning" :title="$t('page.lowcode.template.validationWarnings')" closable>
              <div v-for="warning in validationResult.warnings" :key="warning" class="text-sm">
                {{ warning }}
              </div>
            </NAlert>
          </div>
        </NTabPane>
        
        <NTabPane name="variables" :tab="$t('page.lowcode.template.variables')" class="flex-1">
          <div class="h-full overflow-auto">
            <NSpace vertical>
              <NButton type="dashed" @click="addVariable" class="w-full">
                {{ $t('page.lowcode.template.addVariable') }}
              </NButton>
              
              <NCard 
                v-for="(variable, index) in templateVariables" 
                :key="index"
                size="small"
                :title="variable.name || $t('page.lowcode.template.newVariable')"
                closable
                @close="removeVariable(index)"
              >
                <NForm :model="variable" label-placement="left" :label-width="100">
                  <NFormItem :label="$t('page.lowcode.template.variableName')" path="name">
                    <NInput v-model:value="variable.name" :placeholder="$t('page.lowcode.template.form.variableName.placeholder')" />
                  </NFormItem>
                  
                  <NFormItem :label="$t('page.lowcode.template.variableType')" path="type">
                    <NSelect 
                      v-model:value="variable.type" 
                      :options="variableTypeOptions"
                      :placeholder="$t('page.lowcode.template.form.variableType.placeholder')"
                    />
                  </NFormItem>
                  
                  <NFormItem :label="$t('page.lowcode.template.variableDescription')" path="description">
                    <NInput 
                      v-model:value="variable.description" 
                      :placeholder="$t('page.lowcode.template.form.variableDescription.placeholder')"
                      type="textarea"
                      :rows="2"
                    />
                  </NFormItem>
                  
                  <NFormItem :label="$t('page.lowcode.template.defaultValue')" path="defaultValue">
                    <NInput 
                      v-if="variable.type === 'string'"
                      v-model:value="variable.defaultValue" 
                      :placeholder="$t('page.lowcode.template.form.defaultValue.placeholder')"
                    />
                    <NInputNumber 
                      v-else-if="variable.type === 'number'"
                      v-model:value="variable.defaultValue" 
                      :placeholder="$t('page.lowcode.template.form.defaultValue.placeholder')"
                      style="width: 100%"
                    />
                    <NSwitch 
                      v-else-if="variable.type === 'boolean'"
                      v-model:value="variable.defaultValue"
                    />
                    <NInput 
                      v-else
                      v-model:value="variable.defaultValue" 
                      :placeholder="$t('page.lowcode.template.form.defaultValue.placeholder')"
                    />
                  </NFormItem>
                  
                  <NFormItem :label="$t('page.lowcode.template.required')" path="required">
                    <NSwitch v-model:value="variable.required" />
                  </NFormItem>
                </NForm>
              </NCard>
            </NSpace>
          </div>
        </NTabPane>
        
        <NTabPane name="preview" :tab="$t('page.lowcode.template.preview')" class="flex-1">
          <div class="h-full flex flex-col">
            <NSpace class="mb-4">
              <NButton type="primary" @click="handlePreview" :loading="previewing">
                {{ $t('page.lowcode.template.generatePreview') }}
              </NButton>
              <NSelect 
                v-model:value="previewEntityId" 
                :placeholder="$t('page.lowcode.template.selectEntity')"
                :options="entityOptions"
                style="width: 200px"
              />
            </NSpace>
            
            <div v-if="previewContent" class="flex-1 border border-gray-200 rounded">
              <MonacoEditor
                :value="previewContent"
                :language="getEditorLanguage(templateData?.language)"
                :options="{ ...editorOptions, readOnly: true }"
                class="h-full"
              />
            </div>
            <NEmpty v-else :description="$t('page.lowcode.template.noPreview')" />
          </div>
        </NTabPane>
        
        <NTabPane name="test" :tab="$t('page.lowcode.template.test')" class="flex-1">
          <div class="h-full flex flex-col">
            <NSpace class="mb-4">
              <NButton type="primary" @click="handleTest" :loading="testing">
                {{ $t('page.lowcode.template.runTest') }}
              </NButton>
            </NSpace>
            
            <div v-if="testResult" class="flex-1">
              <NAlert 
                :type="testResult.success ? 'success' : 'error'" 
                :title="testResult.success ? $t('page.lowcode.template.testPassed') : $t('page.lowcode.template.testFailed')"
                class="mb-4"
              />
              
              <div v-if="testResult.errors && testResult.errors.length > 0">
                <NText strong>{{ $t('page.lowcode.template.errors') }}:</NText>
                <ul class="mt-2">
                  <li v-for="error in testResult.errors" :key="error" class="text-red-500">
                    {{ error }}
                  </li>
                </ul>
              </div>
              
              <div v-if="testResult.output" class="mt-4">
                <NText strong>{{ $t('page.lowcode.template.output') }}:</NText>
                <NCode :code="testResult.output" :language="getEditorLanguage(templateData?.language)" class="mt-2" />
              </div>
            </div>
            <NEmpty v-else :description="$t('page.lowcode.template.noTestResult')" />
          </div>
        </NTabPane>
      </NTabs>
    </div>
  </NModal>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import { MonacoEditor } from '@/components/custom/monaco-editor';
import { 
  fetchGetTemplate, 
  fetchUpdateTemplate, 
  fetchGetAllEntities,
  fetchPreviewTemplate,
  fetchTestTemplate
} from '@/service/api';
import { $t } from '@/locales';

interface Props {
  visible: boolean;
  templateId?: string;
  projectId: string;
}

interface Emits {
  (e: 'update:visible', visible: boolean): void;
  (e: 'saved'): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const activeTab = ref('content');
const saving = ref(false);
const previewing = ref(false);
const testing = ref(false);
const validating = ref(false);
const validationResult = ref<{
  isValid: boolean;
  errors: string[];
  warnings?: string[];
  usedVariables?: string[];
  definedVariables?: string[];
} | null>(null);

const templateData = ref<Api.Lowcode.CodeTemplate | null>(null);
const templateContent = ref('');
const templateVariables = ref<Api.Lowcode.TemplateVariable[]>([]);
const entityOptions = ref<Array<{ label: string; value: string }>>([]);
const previewEntityId = ref('');
const previewContent = ref('');
const testResult = ref<{
  success: boolean;
  errors?: string[];
  output?: string;
} | null>(null);

const title = computed(() => {
  return templateData.value 
    ? $t('page.lowcode.template.editTemplate', { name: templateData.value.name })
    : $t('page.lowcode.template.newTemplate');
});

const variableTypeOptions = [
  { label: 'String', value: 'string' },
  { label: 'Number', value: 'number' },
  { label: 'Boolean', value: 'boolean' },
  { label: 'Array', value: 'array' },
  { label: 'Object', value: 'object' }
];

const editorOptions = {
  theme: 'vs-dark',
  fontSize: 14,
  minimap: { enabled: false },
  scrollBeyondLastLine: false,
  automaticLayout: true,
  wordWrap: 'on' as const,
  lineNumbers: 'on' as const,
  folding: true,
  bracketMatching: 'always' as const
};

function getEditorLanguage(language?: string): string {
  const langMap: Record<string, string> = {
    javascript: 'javascript',
    typescript: 'typescript',
    java: 'java',
    python: 'python',
    go: 'go',
    rust: 'rust',
    php: 'php',
    csharp: 'csharp',
    cpp: 'cpp',
    c: 'c'
  };
  return langMap[language?.toLowerCase() || ''] || 'text';
}

function addVariable() {
  templateVariables.value.push({
    name: '',
    type: 'string',
    description: '',
    defaultValue: '',
    required: false
  });
}

function removeVariable(index: number) {
  templateVariables.value.splice(index, 1);
}

async function loadTemplate() {
  if (!props.templateId) return;
  
  try {
    templateData.value = await fetchGetTemplate(props.templateId);
    templateContent.value = templateData.value.content || '';
    templateVariables.value = templateData.value.variables || [];
  } catch (error) {
    console.error('Failed to load template:', error);
  }
}

async function loadEntities() {
  try {
    const entities = await fetchGetAllEntities(props.projectId);
    entityOptions.value = entities.map(entity => ({
      label: entity.name,
      value: entity.id
    }));
  } catch (error) {
    console.error('Failed to load entities:', error);
  }
}

async function handleSave() {
  if (!templateData.value) return;
  
  try {
    saving.value = true;
    
    await fetchUpdateTemplate(templateData.value.id, {
      projectId: props.projectId,
      name: templateData.value.name,
      description: templateData.value.description,
      category: templateData.value.category,
      language: templateData.value.language,
      framework: templateData.value.framework,
      content: templateContent.value,
      variables: templateVariables.value,
      tags: templateData.value.tags,
      isPublic: templateData.value.isPublic
    });
    
    window.$message?.success($t('common.saveSuccess'));
    emit('saved');
  } catch (error) {
    window.$message?.error($t('common.saveFailed'));
  } finally {
    saving.value = false;
  }
}

async function handlePreview() {
  if (!previewEntityId.value) {
    window.$message?.warning($t('page.lowcode.template.selectEntityFirst'));
    return;
  }
  
  try {
    previewing.value = true;
    
    const result = await fetchPreviewTemplate({
      templateId: props.templateId!,
      entityId: previewEntityId.value,
      variables: templateVariables.value.reduce((acc, variable) => {
        acc[variable.name] = variable.defaultValue;
        return acc;
      }, {} as Record<string, any>)
    });
    
    previewContent.value = result.content;
  } catch (error) {
    window.$message?.error($t('page.lowcode.template.previewFailed'));
  } finally {
    previewing.value = false;
  }
}

async function handleTest() {
  try {
    testing.value = true;
    
    testResult.value = await fetchTestTemplate({
      templateId: props.templateId!,
      content: templateContent.value,
      variables: templateVariables.value
    });
  } catch (error: any) {
    testResult.value = {
      success: false,
      errors: [error.message || $t('page.lowcode.template.testFailed')]
    };
  } finally {
    testing.value = false;
  }
}

async function handleValidate() {
  try {
    validating.value = true;

    // 调用后端验证API
    const response = await fetch(`/api/v1/templates/${props.templateId}/validate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({
        content: templateContent.value,
        variables: templateVariables.value
      })
    });

    const result = await response.json();

    if (result.status === 0) {
      validationResult.value = result.data;
      if (result.data.isValid) {
        window.$message?.success($t('page.lowcode.template.validationSuccess'));
      } else {
        window.$message?.error($t('page.lowcode.template.validationError'));
      }
    } else {
      validationResult.value = {
        isValid: false,
        errors: [result.msg || $t('page.lowcode.template.validationFailed')]
      };
      window.$message?.error($t('page.lowcode.template.validationFailed'));
    }
  } catch (error: any) {
    validationResult.value = {
      isValid: false,
      errors: [error.message || $t('page.lowcode.template.validationFailed')]
    };
    window.$message?.error($t('page.lowcode.template.validationFailed'));
  } finally {
    validating.value = false;
  }
}

function handleFormat() {
  try {
    // 简单的代码格式化
    let formatted = templateContent.value;

    // 移除多余的空行
    formatted = formatted.replace(/\n\s*\n\s*\n/g, '\n\n');

    // 统一缩进（假设使用2个空格）
    const lines = formatted.split('\n');
    let indentLevel = 0;
    const formattedLines = lines.map(line => {
      const trimmed = line.trim();
      if (!trimmed) return '';

      // 简单的缩进逻辑
      if (trimmed.includes('}') && !trimmed.includes('{')) {
        indentLevel = Math.max(0, indentLevel - 1);
      }

      const indentedLine = '  '.repeat(indentLevel) + trimmed;

      if (trimmed.includes('{') && !trimmed.includes('}')) {
        indentLevel++;
      }

      return indentedLine;
    });

    templateContent.value = formattedLines.join('\n');
    window.$message?.success($t('page.lowcode.template.formatSuccess'));
  } catch (error) {
    window.$message?.error($t('page.lowcode.template.formatFailed'));
  }
}

function handleClose() {
  emit('update:visible', false);
}

watch(() => props.visible, (visible) => {
  if (visible) {
    loadTemplate();
    loadEntities();
  } else {
    // Reset state
    activeTab.value = 'content';
    templateContent.value = '';
    templateVariables.value = [];
    previewContent.value = '';
    testResult.value = null;
    validationResult.value = null;
  }
});
</script>

<style scoped>
.w-90vw {
  width: 90vw;
}

.h-90vh {
  height: 90vh;
}
</style>
