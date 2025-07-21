<template>
  <NModal
    v-model:show="visible"
    :mask-closable="false"
    preset="card"
    :title="$t('page.lowcode.codeGeneration.preview.title')"
    class="w-[90vw] h-[85vh]"
    :segmented="true"
  >
    <template #header-extra>
      <NSpace>
        <NButton size="small" @click="handleRefresh" :loading="refreshing">
          <template #icon>
            <NIcon><icon-mdi-refresh /></NIcon>
          </template>
          {{ $t('common.refresh') }}
        </NButton>
        <NButton size="small" @click="handleDownload" :loading="downloading">
          <template #icon>
            <NIcon><icon-mdi-download /></NIcon>
          </template>
          {{ $t('common.download') }}
        </NButton>
      </NSpace>
    </template>

    <div class="h-full flex">
      <!-- File Tree -->
      <div class="w-80 border-r border-gray-200 dark:border-gray-700 flex flex-col">
        <div class="p-3 border-b border-gray-200 dark:border-gray-700">
          <NSpace justify="space-between" align="center">
            <span class="font-medium">{{ $t('page.lowcode.codeGeneration.preview.fileTree') }}</span>
            <NSpace>
              <NButton size="tiny" @click="expandAll">
                <template #icon>
                  <NIcon><icon-mdi-unfold-more-horizontal /></NIcon>
                </template>
              </NButton>
              <NButton size="tiny" @click="collapseAll">
                <template #icon>
                  <NIcon><icon-mdi-unfold-less-horizontal /></NIcon>
                </template>
              </NButton>
            </NSpace>
          </NSpace>
        </div>
        
        <div class="flex-1 overflow-auto p-2">
          <NTree
            v-if="fileTreeData.length > 0"
            :data="fileTreeData"
            :expanded-keys="expandedKeys"
            :selected-keys="selectedKeys"
            key-field="key"
            label-field="label"
            children-field="children"
            block-line
            @update:selected-keys="handleFileSelect"
            @update:expanded-keys="handleExpandedKeysChange"
          >
            <template #prefix="{ option }">
              <NIcon>
                <icon-mdi-file v-if="!option.children" />
                <icon-mdi-folder v-else />
              </NIcon>
            </template>
            <template #suffix="{ option }">
              <NTag v-if="option.size" size="small" type="info">
                {{ formatFileSize(option.size) }}
              </NTag>
            </template>
          </NTree>
          <NEmpty v-else :description="$t('page.lowcode.codeGeneration.preview.noFiles')" />
        </div>

        <!-- File Statistics -->
        <div class="p-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
          <div class="text-xs text-gray-600 dark:text-gray-400 space-y-1">
            <div>{{ $t('page.lowcode.codeGeneration.preview.totalFiles') }}: {{ fileStats.totalFiles }}</div>
            <div>{{ $t('page.lowcode.codeGeneration.preview.totalSize') }}: {{ formatFileSize(fileStats.totalSize) }}</div>
            <div>{{ $t('page.lowcode.codeGeneration.preview.totalLines') }}: {{ fileStats.totalLines }}</div>
          </div>
        </div>
      </div>

      <!-- Code Editor -->
      <div class="flex-1 flex flex-col">
        <!-- Editor Header -->
        <div class="p-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
          <NSpace justify="space-between" align="center">
            <div class="flex items-center space-x-2">
              <NIcon>
                <icon-mdi-file-code />
              </NIcon>
              <span class="font-medium">{{ currentFile?.label || $t('page.lowcode.codeGeneration.preview.selectFile') }}</span>
              <NTag v-if="currentFile?.language" size="small" type="primary">
                {{ currentFile.language }}
              </NTag>
            </div>
            <NSpace>
              <NButton size="tiny" @click="handleCopyCode" :disabled="!currentFileContent">
                <template #icon>
                  <NIcon><icon-mdi-content-copy /></NIcon>
                </template>
                {{ $t('common.copy') }}
              </NButton>
              <NButton size="tiny" @click="handleFormatCode" :disabled="!currentFileContent">
                <template #icon>
                  <NIcon><icon-mdi-code-braces /></NIcon>
                </template>
                {{ $t('page.lowcode.codeGeneration.preview.format') }}
              </NButton>
            </NSpace>
          </NSpace>
        </div>

        <!-- Code Content -->
        <div class="flex-1 relative">
          <div v-if="currentFileContent" class="h-full">
            <!-- Monaco Editor -->
            <div ref="editorContainer" class="h-full w-full"></div>
          </div>
          <div v-else class="h-full flex items-center justify-center">
            <NEmpty :description="$t('page.lowcode.codeGeneration.preview.selectFileToPreview')" />
          </div>
        </div>

        <!-- Editor Footer -->
        <div class="p-2 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
          <NSpace justify="space-between" align="center" class="text-xs text-gray-600 dark:text-gray-400">
            <div v-if="currentFile">
              {{ $t('page.lowcode.codeGeneration.preview.fileSize') }}: {{ formatFileSize(currentFile.size || 0) }}
            </div>
            <div v-if="currentFileContent">
              {{ $t('page.lowcode.codeGeneration.preview.lines') }}: {{ currentFileContent.split('\n').length }}
            </div>
            <div v-if="editorCursorPosition">
              {{ $t('page.lowcode.codeGeneration.preview.position') }}: {{ editorCursorPosition.line }}:{{ editorCursorPosition.column }}
            </div>
          </NSpace>
        </div>
      </div>
    </div>

    <!-- Validation Results -->
    <div v-if="validationResults.length > 0" class="mt-4">
      <NDivider title-placement="left">
        {{ $t('page.lowcode.codeGeneration.preview.validation') }}
      </NDivider>
      <div class="space-y-2 max-h-32 overflow-auto">
        <NAlert
          v-for="(result, index) in validationResults"
          :key="index"
          :type="result.type"
          :title="result.title"
          size="small"
          closable
        >
          {{ result.message }}
          <div v-if="result.suggestion" class="mt-1 text-sm opacity-80">
            <strong>{{ $t('page.lowcode.codeGeneration.preview.suggestion') }}:</strong> {{ result.suggestion }}
          </div>
        </NAlert>
      </div>
    </div>

    <template #action>
      <NSpace justify="end">
        <NButton @click="handleClose">
          {{ $t('common.close') }}
        </NButton>
        <NButton type="primary" @click="handleGenerate" :loading="generating">
          <template #icon>
            <NIcon><icon-mdi-play /></NIcon>
          </template>
          {{ $t('page.lowcode.codeGeneration.generateFromPreview') }}
        </NButton>
      </NSpace>
    </template>
  </NModal>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue';
import { useMessage } from 'naive-ui';
import { useClipboard } from '@vueuse/core';
import * as monaco from 'monaco-editor';

interface FileNode {
  key: string;
  label: string;
  children?: FileNode[];
  size?: number;
  language?: string;
  content?: string;
  path: string;
}

interface ValidationResult {
  type: 'success' | 'warning' | 'error' | 'info';
  title: string;
  message: string;
  suggestion?: string;
}

interface PreviewData {
  files: Array<{
    name: string;
    path: string;
    content: string;
    size: number;
    language: string;
  }>;
  structure: any[];
  validation: ValidationResult[];
  stats: {
    totalFiles: number;
    totalLines: number;
    totalSize: number;
    fileTypes: Record<string, number>;
    languages: Record<string, number>;
  };
}

const props = defineProps<{
  visible: boolean;
  previewData?: PreviewData;
  loading?: boolean;
}>();

const emit = defineEmits<{
  'update:visible': [value: boolean];
  'refresh': [];
  'download': [];
  'generate': [];
}>();

const message = useMessage();
const { copy } = useClipboard();

// Reactive data
const refreshing = ref(false);
const downloading = ref(false);
const generating = ref(false);
const expandedKeys = ref<string[]>([]);
const selectedKeys = ref<string[]>([]);
const currentFile = ref<FileNode | null>(null);
const currentFileContent = ref('');
const editorContainer = ref<HTMLElement>();
const editorInstance = ref<monaco.editor.IStandaloneCodeEditor>();
const editorCursorPosition = ref<{ line: number; column: number }>();

// Computed properties
const fileTreeData = computed(() => {
  if (!props.previewData?.structure) return [];
  return buildFileTree(props.previewData.structure);
});

const fileStats = computed(() => {
  return props.previewData?.stats || {
    totalFiles: 0,
    totalLines: 0,
    totalSize: 0,
    fileTypes: {},
    languages: {},
  };
});

const validationResults = computed(() => {
  return props.previewData?.validation || [];
});

// Methods
function buildFileTree(structure: any[]): FileNode[] {
  return structure.map(item => ({
    key: item.path,
    label: item.name,
    path: item.path,
    children: item.children ? buildFileTree(item.children) : undefined,
    size: item.isFile ? getFileSize(item.path) : undefined,
    language: item.isFile ? getFileLanguage(item.name) : undefined,
  }));
}

function getFileSize(path: string): number {
  const file = props.previewData?.files.find(f => f.path === path);
  return file?.size || 0;
}

function getFileLanguage(fileName: string): string {
  const ext = fileName.split('.').pop()?.toLowerCase();
  const languageMap: Record<string, string> = {
    'ts': 'typescript',
    'js': 'javascript',
    'json': 'json',
    'md': 'markdown',
    'yml': 'yaml',
    'yaml': 'yaml',
    'sql': 'sql',
    'prisma': 'prisma',
    'html': 'html',
    'css': 'css',
    'scss': 'scss',
    'vue': 'vue',
  };
  return languageMap[ext || ''] || 'text';
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function handleFileSelect(keys: string[]) {
  selectedKeys.value = keys;
  if (keys.length > 0) {
    const filePath = keys[0];
    const file = props.previewData?.files.find(f => f.path === filePath);
    if (file) {
      currentFile.value = {
        key: file.path,
        label: file.name,
        path: file.path,
        size: file.size,
        language: file.language,
      };
      currentFileContent.value = file.content;
      updateEditor();
    }
  }
}

function handleExpandedKeysChange(keys: string[]) {
  expandedKeys.value = keys;
}

function expandAll() {
  const allKeys: string[] = [];
  function collectKeys(nodes: FileNode[]) {
    nodes.forEach(node => {
      if (node.children) {
        allKeys.push(node.key);
        collectKeys(node.children);
      }
    });
  }
  collectKeys(fileTreeData.value);
  expandedKeys.value = allKeys;
}

function collapseAll() {
  expandedKeys.value = [];
}

async function updateEditor() {
  if (!editorContainer.value || !currentFileContent.value) return;

  await nextTick();

  if (editorInstance.value) {
    editorInstance.value.dispose();
  }

  editorInstance.value = monaco.editor.create(editorContainer.value, {
    value: currentFileContent.value,
    language: currentFile.value?.language || 'text',
    theme: 'vs-dark',
    readOnly: true,
    minimap: { enabled: true },
    scrollBeyondLastLine: false,
    automaticLayout: true,
    fontSize: 14,
    lineNumbers: 'on',
    wordWrap: 'on',
  });

  // Track cursor position
  editorInstance.value.onDidChangeCursorPosition((e) => {
    editorCursorPosition.value = {
      line: e.position.lineNumber,
      column: e.position.column,
    };
  });
}

async function handleCopyCode() {
  if (!currentFileContent.value) return;
  
  try {
    await copy(currentFileContent.value);
    message.success($t('common.copySuccess'));
  } catch (error) {
    message.error($t('common.copyFailed'));
  }
}

function handleFormatCode() {
  if (!editorInstance.value) return;
  
  editorInstance.value.getAction('editor.action.formatDocument')?.run();
  message.success($t('page.lowcode.codeGeneration.preview.formatSuccess'));
}

function handleRefresh() {
  refreshing.value = true;
  emit('refresh');
  setTimeout(() => {
    refreshing.value = false;
  }, 1000);
}

function handleDownload() {
  downloading.value = true;
  emit('download');
  setTimeout(() => {
    downloading.value = false;
  }, 1000);
}

function handleGenerate() {
  generating.value = true;
  emit('generate');
  setTimeout(() => {
    generating.value = false;
  }, 2000);
}

function handleClose() {
  emit('update:visible', false);
}

// Watch for visibility changes
watch(() => props.visible, (visible) => {
  if (visible && props.previewData?.files.length) {
    // Auto-select first file
    nextTick(() => {
      if (fileTreeData.value.length > 0) {
        const firstFile = findFirstFile(fileTreeData.value);
        if (firstFile) {
          handleFileSelect([firstFile.key]);
        }
      }
    });
  }
});

function findFirstFile(nodes: FileNode[]): FileNode | null {
  for (const node of nodes) {
    if (!node.children) {
      return node;
    }
    if (node.children) {
      const found = findFirstFile(node.children);
      if (found) return found;
    }
  }
  return null;
}

// Cleanup
onUnmounted(() => {
  if (editorInstance.value) {
    editorInstance.value.dispose();
  }
});
</script>

<style scoped>
.monaco-editor {
  height: 100%;
}
</style>
