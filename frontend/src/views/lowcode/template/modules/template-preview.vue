<template>
  <NModal :show="visible" @update:show="(value) => emit('update:visible', value)" preset="card" :title="$t('page.lowcode.template.preview')" class="w-95vw h-90vh">
    <template #header-extra>
      <NSpace>
        <NButton type="primary" @click="handlePreview" :loading="previewing">
          {{ $t('page.lowcode.template.preview') }}
        </NButton>
        <NButton @click="handleValidate" :loading="validating">
          {{ $t('page.lowcode.template.validate') }}
        </NButton>
        <NButton @click="handleTest" :loading="testing">
          {{ $t('page.lowcode.template.test') }}
        </NButton>
        <NButton @click="handleClose">
          {{ $t('common.close') }}
        </NButton>
      </NSpace>
    </template>
    
    <div class="h-full flex gap-4">
      <!-- 左侧：模板内容和变量配置 -->
      <div class="flex-1 flex flex-col gap-4">
        <NCard :title="$t('page.lowcode.template.content')" size="small" class="flex-1">
          <div class="h-300px border border-gray-200 rounded">
            <NInput
              v-model:value="templateContent"
              type="textarea"
              :rows="15"
              readonly
              class="h-full"
            />
          </div>
        </NCard>
        
        <NCard :title="$t('page.lowcode.template.variables')" size="small" class="flex-1">
          <div class="h-300px overflow-auto">
            <NSpace vertical>
              <div v-for="(variable, index) in templateVariables" :key="index" class="border border-gray-200 rounded p-3">
                <div class="flex items-center justify-between mb-2">
                  <span class="font-medium">{{ variable.name }}</span>
                  <NTag :type="getVariableTypeColor(variable.type)">{{ variable.type }}</NTag>
                </div>
                <div class="text-sm text-gray-600 mb-2">{{ variable.description }}</div>
                <NFormItem :label="$t('page.lowcode.template.variableValue')" size="small">
                  <component
                    :is="getVariableInput(variable.type)"
                    v-model:value="variableValues[variable.name]"
                    :placeholder="getVariablePlaceholder(variable)"
                    size="small"
                  />
                </NFormItem>
              </div>
            </NSpace>
          </div>
        </NCard>
      </div>
      
      <!-- 右侧：预览结果 -->
      <div class="flex-1 flex flex-col gap-4">
        <NCard :title="$t('page.lowcode.template.previewResult')" size="small" class="flex-1">
          <NTabs v-model:value="activeTab" type="line">
            <NTabPane name="output" :tab="$t('page.lowcode.template.output')">
              <div class="h-300px border border-gray-200 rounded">
                <NInput
                  v-model:value="previewOutput"
                  type="textarea"
                  :rows="15"
                  readonly
                  class="h-full"
                />
              </div>
            </NTabPane>
            
            <NTabPane name="validation" :tab="$t('page.lowcode.template.validation')">
              <div class="h-300px overflow-auto">
                <NSpace vertical>
                  <NAlert
                    v-if="validationResult"
                    :type="validationResult.isValid ? 'success' : 'error'"
                    :title="validationResult.isValid ? $t('page.lowcode.template.validationSuccess') : $t('page.lowcode.template.validationFailed')"
                  >
                    <div v-if="validationResult.errors.length > 0">
                      <div class="font-medium mb-2">{{ $t('page.lowcode.template.errors') }}:</div>
                      <ul class="list-disc list-inside">
                        <li v-for="error in validationResult.errors" :key="error" class="text-red-600">{{ error }}</li>
                      </ul>
                    </div>
                    <div v-if="validationResult.warnings.length > 0" class="mt-2">
                      <div class="font-medium mb-2">{{ $t('page.lowcode.template.warnings') }}:</div>
                      <ul class="list-disc list-inside">
                        <li v-for="warning in validationResult.warnings" :key="warning" class="text-orange-600">{{ warning }}</li>
                      </ul>
                    </div>
                  </NAlert>
                  
                  <div v-if="extractedVariables.length > 0">
                    <div class="font-medium mb-2">{{ $t('page.lowcode.template.extractedVariables') }}:</div>
                    <NSpace>
                      <NTag v-for="variable in extractedVariables" :key="variable" type="info">{{ variable }}</NTag>
                    </NSpace>
                  </div>
                  
                  <div v-if="suggestions.length > 0">
                    <div class="font-medium mb-2">{{ $t('page.lowcode.template.suggestions') }}:</div>
                    <ul class="list-disc list-inside">
                      <li v-for="suggestion in suggestions" :key="suggestion" class="text-blue-600">{{ suggestion }}</li>
                    </ul>
                  </div>
                </NSpace>
              </div>
            </NTabPane>
            
            <NTabPane name="test" :tab="$t('page.lowcode.template.testResult')">
              <div class="h-300px overflow-auto">
                <NSpace vertical>
                  <NAlert
                    v-if="testResult"
                    :type="testResult.testPassed ? 'success' : 'error'"
                    :title="testResult.testPassed ? $t('page.lowcode.template.testPassed') : $t('page.lowcode.template.testFailed')"
                  >
                    <div v-if="testResult.errors.length > 0">
                      <div class="font-medium mb-2">{{ $t('page.lowcode.template.errors') }}:</div>
                      <ul class="list-disc list-inside">
                        <li v-for="error in testResult.errors" :key="error" class="text-red-600">{{ error }}</li>
                      </ul>
                    </div>
                  </NAlert>
                  
                  <div v-if="testResult">
                    <div class="font-medium mb-2">{{ $t('page.lowcode.template.actualOutput') }}:</div>
                    <NCode :code="testResult.actualOutput" language="typescript" />
                  </div>
                </NSpace>
              </div>
            </NTabPane>
          </NTabs>
        </NCard>
        
        <NCard :title="$t('page.lowcode.template.variableAnalysis')" size="small">
          <NSpace vertical>
            <div v-if="usedVariables.length > 0">
              <span class="font-medium">{{ $t('page.lowcode.template.usedVariables') }}:</span>
              <NSpace class="mt-1">
                <NTag v-for="variable in usedVariables" :key="variable" type="success">{{ variable }}</NTag>
              </NSpace>
            </div>
            
            <div v-if="unusedVariables.length > 0">
              <span class="font-medium">{{ $t('page.lowcode.template.unusedVariables') }}:</span>
              <NSpace class="mt-1">
                <NTag v-for="variable in unusedVariables" :key="variable" type="warning">{{ variable }}</NTag>
              </NSpace>
            </div>
          </NSpace>
        </NCard>
      </div>
    </div>
  </NModal>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import type { Component } from 'vue';
import { NInput, NInputNumber, NSwitch, NSelect } from 'naive-ui';
// import { MonacoEditor } from '@/components/custom/monaco-editor';
import { $t } from '@/locales';

interface Props {
  visible: boolean;
  templateData?: Api.Lowcode.CodeTemplate | null;
}

interface Emits {
  (e: 'update:visible', visible: boolean): void;
}

const props = withDefaults(defineProps<Props>(), {
  templateData: null
});

const emit = defineEmits<Emits>();

// 响应式数据
const activeTab = ref('output');
const previewing = ref(false);
const validating = ref(false);
const testing = ref(false);

const templateContent = ref('');
const templateVariables = ref<any[]>([]);
const variableValues = ref<Record<string, any>>({});

const previewOutput = ref('');
const validationResult = ref<any>(null);
const testResult = ref<any>(null);
const extractedVariables = ref<string[]>([]);
const suggestions = ref<string[]>([]);
const usedVariables = ref<string[]>([]);
const unusedVariables = ref<string[]>([]);

// 编辑器配置
const editorOptions = {
  minimap: { enabled: false },
  scrollBeyondLastLine: false,
  fontSize: 14,
  lineNumbers: 'on',
  roundedSelection: false,
  scrollbar: {
    vertical: 'auto',
    horizontal: 'auto'
  }
};

// 计算属性
const drawerVisible = computed({
  get() {
    return props.visible;
  },
  set(visible: boolean) {
    emit('update:visible', visible);
  }
});

// 监听模板数据变化
watch(() => props.templateData, (newData) => {
  if (newData) {
    templateContent.value = newData.content || '';
    templateVariables.value = newData.variables || [];
    
    // 初始化变量值
    variableValues.value = {};
    templateVariables.value.forEach(variable => {
      variableValues.value[variable.name] = getDefaultValue(variable);
    });
  }
}, { immediate: true });

// 方法
function getDefaultValue(variable: any) {
  if (variable.defaultValue !== undefined) {
    return variable.defaultValue;
  }
  
  switch (variable.type) {
    case 'string':
      return 'example';
    case 'number':
      return 42;
    case 'boolean':
      return true;
    case 'array':
      return ['item1', 'item2'];
    case 'object':
      return { name: 'example', description: 'Example object' };
    default:
      return '';
  }
}

function getVariableInput(type: string): Component {
  switch (type) {
    case 'number':
      return NInputNumber;
    case 'boolean':
      return NSwitch;
    case 'array':
    case 'object':
      return NInput; // 使用JSON字符串输入
    default:
      return NInput;
  }
}

function getVariableTypeColor(type: string): 'success' | 'error' | 'warning' | 'default' | 'info' | 'primary' {
  const colorMap: Record<string, 'success' | 'error' | 'warning' | 'default' | 'info' | 'primary'> = {
    string: 'info',
    number: 'success',
    boolean: 'warning',
    array: 'error',
    object: 'default'
  };
  return colorMap[type] || 'default';
}

function getVariablePlaceholder(variable: any) {
  switch (variable.type) {
    case 'string':
      return $t('page.lowcode.template.form.variableValue.stringPlaceholder');
    case 'number':
      return $t('page.lowcode.template.form.variableValue.numberPlaceholder');
    case 'boolean':
      return '';
    case 'array':
      return $t('page.lowcode.template.form.variableValue.arrayPlaceholder');
    case 'object':
      return $t('page.lowcode.template.form.variableValue.objectPlaceholder');
    default:
      return '';
  }
}

function getOutputLanguage() {
  if (!props.templateData) return 'text';
  
  const languageMap: Record<string, string> = {
    TYPESCRIPT: 'typescript',
    JAVASCRIPT: 'javascript',
    JAVA: 'java',
    PYTHON: 'python'
  };
  
  return languageMap[props.templateData.language] || 'text';
}

async function handlePreview() {
  if (!props.templateData) return;
  
  previewing.value = true;
  try {
    // 调用预览API
    const response = await fetch(`/api/v1/templates/${props.templateData.id}/preview`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        variables: variableValues.value
      })
    });
    
    const result = await response.json();
    if (result.status === 0) {
      previewOutput.value = result.data.preview.output;
      usedVariables.value = result.data.preview.usedVariables;
      unusedVariables.value = result.data.preview.unusedVariables;
      activeTab.value = 'output';
    }
  } catch (error) {
    console.error('Preview failed:', error);
  } finally {
    previewing.value = false;
  }
}

async function handleValidate() {
  validating.value = true;
  try {
    // 调用验证API
    const response = await fetch('/api/v1/templates/validate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        content: templateContent.value,
        variables: templateVariables.value
      })
    });
    
    const result = await response.json();
    if (result.status === 0) {
      validationResult.value = result.data.validation;
      extractedVariables.value = result.data.extractedVariables;
      suggestions.value = result.data.suggestions;
      activeTab.value = 'validation';
    }
  } catch (error) {
    console.error('Validation failed:', error);
  } finally {
    validating.value = false;
  }
}

async function handleTest() {
  if (!props.templateData) return;
  
  testing.value = true;
  try {
    // 调用测试API
    const response = await fetch(`/api/v1/templates/${props.templateData.id}/test`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        variables: variableValues.value
      })
    });
    
    const result = await response.json();
    if (result.status === 0) {
      testResult.value = result.data.test;
      activeTab.value = 'test';
    }
  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    testing.value = false;
  }
}

function handleClose() {
  emit('update:visible', false);
}
</script>
