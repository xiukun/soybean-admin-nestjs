<template>
  <div class="api-config-batch-operations">
    <NCard :title="$t('page.lowcode.apiConfig.batchOperations.title')" :bordered="false" size="small">
      <NSpace vertical :size="16">
        <!-- 批量导出 -->
        <div>
          <h3 class="text-lg font-semibold mb-3">{{ $t('page.lowcode.apiConfig.batchOperations.export.title') }}</h3>
          <NSpace>
            <NButton type="primary" @click="handleExportAll" :loading="exportLoading">
              <template #icon>
                <SvgIcon icon="ic:round-download" />
              </template>
              {{ $t('page.lowcode.apiConfig.batchOperations.export.all') }}
            </NButton>
            <NButton @click="handleExportSelected" :disabled="!hasSelectedItems" :loading="exportLoading">
              <template #icon>
                <SvgIcon icon="ic:round-download" />
              </template>
              {{ $t('page.lowcode.apiConfig.batchOperations.export.selected') }}
              <span v-if="selectedCount > 0">({{ selectedCount }})</span>
            </NButton>
            <NSelect
              v-model:value="exportFormat"
              :options="exportFormatOptions"
              style="width: 120px"
              size="small"
            />
          </NSpace>
        </div>

        <!-- 批量导入 -->
        <div>
          <h3 class="text-lg font-semibold mb-3">{{ $t('page.lowcode.apiConfig.batchOperations.import.title') }}</h3>
          <NSpace vertical :size="12">
            <NUpload
              ref="uploadRef"
              :file-list="fileList"
              :max="1"
              accept=".json,.yaml,.yml"
              :before-upload="handleBeforeUpload"
              @update:file-list="handleFileListChange"
              @remove="handleFileRemove"
            >
              <NUploadDragger>
                <div style="margin-bottom: 12px">
                  <SvgIcon icon="ic:round-cloud-upload" :size="48" class="text-primary" />
                </div>
                <NText style="font-size: 16px">
                  {{ $t('page.lowcode.apiConfig.batchOperations.import.dragText') }}
                </NText>
                <NP depth="3" style="margin: 8px 0 0 0">
                  {{ $t('page.lowcode.apiConfig.batchOperations.import.hintText') }}
                </NP>
              </NUploadDragger>
            </NUpload>
            
            <NSpace>
              <NButton type="primary" @click="handleImport" :disabled="!canImport" :loading="importLoading">
                <template #icon>
                  <SvgIcon icon="ic:round-upload" />
                </template>
                {{ $t('page.lowcode.apiConfig.batchOperations.import.button') }}
              </NButton>
              <NCheckbox v-model:checked="overwriteExisting">
                {{ $t('page.lowcode.apiConfig.batchOperations.import.overwrite') }}
              </NCheckbox>
            </NSpace>
          </NSpace>
        </div>

        <!-- 批量删除 -->
        <div>
          <h3 class="text-lg font-semibold mb-3">{{ $t('page.lowcode.apiConfig.batchOperations.delete.title') }}</h3>
          <NSpace>
            <NPopconfirm
              :positive-text="$t('common.confirm')"
              :negative-text="$t('common.cancel')"
              @positive-click="handleBatchDelete"
            >
              <template #trigger>
                <NButton type="error" :disabled="!hasSelectedItems" :loading="deleteLoading">
                  <template #icon>
                    <SvgIcon icon="ic:round-delete" />
                  </template>
                  {{ $t('page.lowcode.apiConfig.batchOperations.delete.selected') }}
                  <span v-if="selectedCount > 0">({{ selectedCount }})</span>
                </NButton>
              </template>
              {{ $t('page.lowcode.apiConfig.batchOperations.delete.confirm', { count: selectedCount }) }}
            </NPopconfirm>
          </NSpace>
        </div>

        <!-- 模板下载 -->
        <div>
          <h3 class="text-lg font-semibold mb-3">{{ $t('page.lowcode.apiConfig.batchOperations.template.title') }}</h3>
          <NSpace>
            <NButton @click="handleDownloadTemplate('json')">
              <template #icon>
                <SvgIcon icon="ic:round-description" />
              </template>
              {{ $t('page.lowcode.apiConfig.batchOperations.template.json') }}
            </NButton>
            <NButton @click="handleDownloadTemplate('yaml')">
              <template #icon>
                <SvgIcon icon="ic:round-description" />
              </template>
              {{ $t('page.lowcode.apiConfig.batchOperations.template.yaml') }}
            </NButton>
          </NSpace>
        </div>

        <!-- 操作结果 -->
        <div v-if="operationResult" class="mt-4">
          <NAlert
            :type="operationResult.type"
            :title="operationResult.title"
            :show-icon="true"
            closable
            @close="clearOperationResult"
          >
            {{ operationResult.message }}
            <div v-if="operationResult.details" class="mt-2">
              <NCollapse>
                <NCollapseItem :title="$t('common.details')" name="details">
                  <pre class="text-sm">{{ operationResult.details }}</pre>
                </NCollapseItem>
              </NCollapse>
            </div>
          </NAlert>
        </div>
      </NSpace>
    </NCard>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import {
  NCard, NSpace, NButton, NSelect, NUpload, NUploadDragger, NText, NP,
  NCheckbox, NPopconfirm, NAlert, NCollapse, NCollapseItem
} from 'naive-ui';
import type { UploadFileInfo } from 'naive-ui';
import { $t } from '@/locales';
import SvgIcon from '@/components/custom/svg-icon.vue';

defineOptions({
  name: 'ApiConfigBatchOperations'
});

interface Props {
  projectId: string;
  selectedItems: string[];
}

interface Emits {
  (e: 'refresh'): void;
  (e: 'selection-change', items: string[]): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

// 响应式数据
const exportFormat = ref<'json' | 'yaml'>('json');
const fileList = ref<UploadFileInfo[]>([]);
const overwriteExisting = ref(false);
const uploadRef = ref();

// 加载状态
const exportLoading = ref(false);
const importLoading = ref(false);
const deleteLoading = ref(false);

// 操作结果
const operationResult = ref<{
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  details?: string;
} | null>(null);

// 计算属性
const selectedCount = computed(() => props.selectedItems.length);
const hasSelectedItems = computed(() => selectedCount.value > 0);
const canImport = computed(() => fileList.value.length > 0);

const exportFormatOptions = [
  { label: 'JSON', value: 'json' },
  { label: 'YAML', value: 'yaml' }
];

// 方法
async function handleExportAll() {
  try {
    exportLoading.value = true;
    
    // 这里应该调用API获取所有API配置
    const response = await fetch(`/api/lowcode/api-configs/project/${props.projectId}/export?format=${exportFormat.value}`);
    
    if (!response.ok) {
      throw new Error('Export failed');
    }
    
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `api-configs-all.${exportFormat.value}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    
    showOperationResult('success', $t('common.exportSuccess'), $t('page.lowcode.apiConfig.batchOperations.export.allSuccess'));
  } catch (error) {
    console.error('Export all failed:', error);
    showOperationResult('error', $t('common.exportFailed'), String(error));
  } finally {
    exportLoading.value = false;
  }
}

async function handleExportSelected() {
  try {
    exportLoading.value = true;
    
    const response = await fetch(`/api/lowcode/api-configs/project/${props.projectId}/export`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        ids: props.selectedItems,
        format: exportFormat.value
      })
    });
    
    if (!response.ok) {
      throw new Error('Export failed');
    }
    
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `api-configs-selected.${exportFormat.value}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    
    showOperationResult('success', $t('common.exportSuccess'), $t('page.lowcode.apiConfig.batchOperations.export.selectedSuccess', { count: selectedCount.value }));
  } catch (error) {
    console.error('Export selected failed:', error);
    showOperationResult('error', $t('common.exportFailed'), String(error));
  } finally {
    exportLoading.value = false;
  }
}

function handleBeforeUpload(data: { file: UploadFileInfo }) {
  const file = data.file.file;
  if (!file) return false;
  
  const allowedTypes = ['application/json', 'text/yaml', 'application/x-yaml'];
  const allowedExtensions = ['.json', '.yaml', '.yml'];
  
  const isValidType = allowedTypes.includes(file.type) || 
    allowedExtensions.some(ext => file.name.toLowerCase().endsWith(ext));
  
  if (!isValidType) {
    showOperationResult('error', $t('common.uploadFailed'), $t('page.lowcode.apiConfig.batchOperations.import.invalidFormat'));
    return false;
  }
  
  return true;
}

function handleFileListChange(files: UploadFileInfo[]) {
  fileList.value = files;
}

function handleFileRemove() {
  fileList.value = [];
}

async function handleImport() {
  if (!canImport.value) return;
  
  try {
    importLoading.value = true;
    
    const file = fileList.value[0].file;
    if (!file) throw new Error('No file selected');
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('projectId', props.projectId);
    formData.append('overwrite', String(overwriteExisting.value));
    
    const response = await fetch('/api/lowcode/api-configs/import', {
      method: 'POST',
      body: formData
    });
    
    if (!response.ok) {
      throw new Error('Import failed');
    }
    
    const result = await response.json();
    
    showOperationResult('success', $t('common.importSuccess'), 
      $t('page.lowcode.apiConfig.batchOperations.import.success', { 
        created: result.created || 0, 
        updated: result.updated || 0 
      }), 
      JSON.stringify(result, null, 2)
    );
    
    // 清空文件列表
    fileList.value = [];
    
    // 刷新列表
    emit('refresh');
  } catch (error) {
    console.error('Import failed:', error);
    showOperationResult('error', $t('common.importFailed'), String(error));
  } finally {
    importLoading.value = false;
  }
}

async function handleBatchDelete() {
  try {
    deleteLoading.value = true;
    
    const response = await fetch('/api/lowcode/api-configs/batch-delete', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        ids: props.selectedItems
      })
    });
    
    if (!response.ok) {
      throw new Error('Batch delete failed');
    }
    
    showOperationResult('success', $t('common.deleteSuccess'), 
      $t('page.lowcode.apiConfig.batchOperations.delete.success', { count: selectedCount.value })
    );
    
    // 清空选择
    emit('selection-change', []);
    
    // 刷新列表
    emit('refresh');
  } catch (error) {
    console.error('Batch delete failed:', error);
    showOperationResult('error', $t('common.deleteFailed'), String(error));
  } finally {
    deleteLoading.value = false;
  }
}

function handleDownloadTemplate(format: 'json' | 'yaml') {
  const template = {
    apiConfigs: [
      {
        name: "示例API",
        code: "example_api",
        path: "/api/example",
        method: "GET",
        description: "这是一个示例API配置",
        status: "ACTIVE",
        version: "1.0.0",
        parameters: [],
        responses: {
          "200": {
            description: "成功响应",
            schema: {
              type: "object",
              properties: {
                id: { type: "string" },
                name: { type: "string" }
              }
            }
          }
        },
        security: [],
        config: {}
      }
    ]
  };
  
  let content: string;
  let filename: string;
  
  if (format === 'json') {
    content = JSON.stringify(template, null, 2);
    filename = 'api-config-template.json';
  } else {
    // 简单的YAML格式化（实际项目中应该使用专门的YAML库）
    content = `apiConfigs:
  - name: "示例API"
    code: "example_api"
    path: "/api/example"
    method: "GET"
    description: "这是一个示例API配置"
    status: "ACTIVE"
    version: "1.0.0"
    parameters: []
    responses:
      "200":
        description: "成功响应"
        schema:
          type: "object"
          properties:
            id:
              type: "string"
            name:
              type: "string"
    security: []
    config: {}`;
    filename = 'api-config-template.yaml';
  }
  
  const blob = new Blob([content], { type: 'text/plain' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
  
  showOperationResult('info', $t('common.downloadSuccess'), $t('page.lowcode.apiConfig.batchOperations.template.downloaded', { format: format.toUpperCase() }));
}

function showOperationResult(type: 'success' | 'error' | 'warning' | 'info', title: string, message: string, details?: string) {
  operationResult.value = { type, title, message, details };
}

function clearOperationResult() {
  operationResult.value = null;
}
</script>

<style scoped>
pre {
  background-color: #f5f5f5;
  padding: 12px;
  border-radius: 4px;
  overflow-x: auto;
  max-height: 200px;
}
</style>
