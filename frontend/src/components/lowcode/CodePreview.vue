<template>
  <div class="code-preview h-full">
    <div class="h-full flex flex-col">
      <!-- Header -->
      <div class="p-4 border-b">
        <NSpace justify="space-between" align="center">
          <NSpace align="center">
            <NText strong>{{ $t('page.lowcode.codeGeneration.preview') }}</NText>
            <NTag v-if="previewData" type="info" size="small">
              {{ previewData.files?.length || 0 }} {{ $t('page.lowcode.codeGeneration.files') }}
            </NTag>
          </NSpace>
          <NSpace>
            <NSelect
              v-model:value="viewMode"
              size="small"
              style="width: 120px"
              :options="viewModeOptions"
              @update:value="handleViewModeChange"
            />
            <NButton size="small" @click="handleRefresh" :loading="refreshing">
              <template #icon>
                <NIcon><icon-mdi-refresh /></NIcon>
              </template>
            </NButton>
            <NButton size="small" @click="handleDownload" :disabled="!previewData">
              <template #icon>
                <NIcon><icon-mdi-download /></NIcon>
              </template>
            </NButton>
          </NSpace>
        </NSpace>
      </div>

      <!-- Content -->
      <div class="flex-1 overflow-hidden">
        <!-- Files View -->
        <div v-if="viewMode === 'files'" class="h-full">
          <NSplit v-if="previewData?.files?.length" direction="horizontal" :default-size="0.3" :min="0.2" :max="0.5">
            <template #1>
              <!-- File Tree -->
              <div class="h-full border-r">
                <div class="p-2 border-b">
                  <NInput
                    v-model:value="fileSearchQuery"
                    size="small"
                    :placeholder="$t('page.lowcode.codeGeneration.searchFiles')"
                    clearable
                  >
                    <template #prefix>
                      <NIcon><icon-mdi-magnify /></NIcon>
                    </template>
                  </NInput>
                </div>
                <div class="flex-1 overflow-auto">
                  <NTree
                    :data="filteredFileTree"
                    key-field="path"
                    label-field="name"
                    children-field="children"
                    selectable
                    :selected-keys="selectedFileKeys"
                    @update:selected-keys="handleFileSelect"
                  >
                    <template #prefix="{ option }">
                      <NIcon :color="getFileIconColor(option.name)">
                        <component :is="getFileIcon(option.name)" />
                      </NIcon>
                    </template>
                  </NTree>
                </div>
              </div>
            </template>

            <template #2>
              <!-- File Content -->
              <div class="h-full flex flex-col">
                <div v-if="selectedFile" class="p-2 border-b">
                  <NSpace align="center">
                    <NIcon :color="getFileIconColor(selectedFile.name)">
                      <component :is="getFileIcon(selectedFile.name)" />
                    </NIcon>
                    <NText strong>{{ selectedFile.name }}</NText>
                    <NTag size="small">{{ getFileLanguage(selectedFile.name) }}</NTag>
                    <NText depth="3">{{ formatFileSize(selectedFile.size) }}</NText>
                  </NSpace>
                </div>
                <div class="flex-1 overflow-hidden">
                  <NScrollbar v-if="selectedFile" class="h-full">
                    <NCode
                      :code="selectedFile.content"
                      :language="getFileLanguage(selectedFile.name)"
                      :theme="isDark ? 'dark' : 'light'"
                      show-line-numbers
                      word-wrap
                    />
                  </NScrollbar>
                  <div v-else class="h-full flex items-center justify-center">
                    <NEmpty :description="$t('page.lowcode.codeGeneration.selectFile')" />
                  </div>
                </div>
              </div>
            </template>
          </NSplit>
          <div v-else class="h-full flex items-center justify-center">
            <NEmpty :description="$t('page.lowcode.codeGeneration.noFiles')" />
          </div>
        </div>

        <!-- Structure View -->
        <div v-else-if="viewMode === 'structure'" class="h-full p-4">
          <div v-if="previewData?.structure" class="h-full">
            <NTree
              :data="previewData.structure"
              key-field="path"
              label-field="name"
              children-field="children"
              block-line
              expand-on-click
              :default-expanded-keys="getDefaultExpandedKeys(previewData.structure)"
            >
              <template #prefix="{ option }">
                <NIcon :color="option.type === 'folder' ? '#ffa500' : getFileIconColor(option.name)">
                  <component :is="option.type === 'folder' ? 'icon-mdi-folder' : getFileIcon(option.name)" />
                </NIcon>
              </template>
              <template #suffix="{ option }">
                <NSpace v-if="option.type === 'file'" size="small">
                  <NTag size="tiny">{{ getFileLanguage(option.name) }}</NTag>
                  <NText depth="3" style="font-size: 12px">{{ formatFileSize(option.size) }}</NText>
                </NSpace>
              </template>
            </NTree>
          </div>
          <NEmpty v-else :description="$t('page.lowcode.codeGeneration.noStructure')" />
        </div>

        <!-- Validation View -->
        <div v-else-if="viewMode === 'validation'" class="h-full p-4">
          <div v-if="previewData?.validation" class="space-y-4">
            <NAlert
              v-for="(issue, index) in previewData.validation"
              :key="index"
              :type="issue.type"
              :title="issue.title"
              :show-icon="true"
            >
              {{ issue.message }}
              <template v-if="issue.suggestion" #footer>
                <NText depth="3">{{ $t('page.lowcode.codeGeneration.suggestion') }}: {{ issue.suggestion }}</NText>
              </template>
            </NAlert>
          </div>
          <NEmpty v-else :description="$t('page.lowcode.codeGeneration.noValidation')" />
        </div>

        <!-- Statistics View -->
        <div v-else-if="viewMode === 'stats'" class="h-full p-4">
          <div v-if="previewData" class="space-y-6">
            <!-- Overview Cards -->
            <NGrid :cols="4" :x-gap="16">
              <NGridItem>
                <NStatistic :label="$t('page.lowcode.codeGeneration.totalFiles')" :value="previewData.files?.length || 0" />
              </NGridItem>
              <NGridItem>
                <NStatistic :label="$t('page.lowcode.codeGeneration.totalLines')" :value="getTotalLines()" />
              </NGridItem>
              <NGridItem>
                <NStatistic :label="$t('page.lowcode.codeGeneration.totalSize')" :value="getTotalSize()" suffix="KB" />
              </NGridItem>
              <NGridItem>
                <NStatistic :label="$t('page.lowcode.codeGeneration.languages')" :value="getLanguageCount()" />
              </NGridItem>
            </NGrid>

            <!-- Language Distribution -->
            <NCard :title="$t('page.lowcode.codeGeneration.languageDistribution')" size="small">
              <div class="space-y-2">
                <div v-for="(count, language) in getLanguageDistribution()" :key="language" class="flex items-center justify-between">
                  <NSpace align="center">
                    <NIcon :color="getLanguageColor(language)">
                      <component :is="getLanguageIcon(language)" />
                    </NIcon>
                    <NText>{{ language }}</NText>
                  </NSpace>
                  <NSpace align="center">
                    <NText>{{ count }} {{ $t('page.lowcode.codeGeneration.files') }}</NText>
                    <NProgress
                      type="line"
                      :percentage="(count / (previewData.files?.length || 1)) * 100"
                      :height="6"
                      :show-indicator="false"
                      style="width: 100px"
                    />
                  </NSpace>
                </div>
              </div>
            </NCard>

            <!-- File Size Distribution -->
            <NCard :title="$t('page.lowcode.codeGeneration.fileSizeDistribution')" size="small">
              <NList>
                <NListItem v-for="file in getSortedFilesBySize()" :key="file.path">
                  <NThing>
                    <template #header>{{ file.name }}</template>
                    <template #description>{{ file.path }}</template>
                  </NThing>
                  <template #suffix>
                    <NSpace align="center">
                      <NText>{{ formatFileSize(file.size) }}</NText>
                      <NProgress
                        type="line"
                        :percentage="(file.size / getMaxFileSize()) * 100"
                        :height="6"
                        :show-indicator="false"
                        style="width: 80px"
                      />
                    </NSpace>
                  </template>
                </NListItem>
              </NList>
            </NCard>
          </div>
          <NEmpty v-else :description="$t('page.lowcode.codeGeneration.noStats')" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useThemeStore } from '@/store/modules/theme';
import { $t } from '@/locales';

interface PreviewFile {
  name: string;
  path: string;
  content: string;
  size: number;
  language?: string;
}

interface PreviewData {
  files?: PreviewFile[];
  structure?: any[];
  validation?: Array<{
    type: 'success' | 'warning' | 'error' | 'info';
    title: string;
    message: string;
    suggestion?: string;
  }>;
}

interface Props {
  previewData?: PreviewData | null;
  loading?: boolean;
}

interface Emits {
  (e: 'refresh'): void;
  (e: 'download'): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const themeStore = useThemeStore();
const isDark = computed(() => themeStore.darkMode);

// State
const viewMode = ref<'files' | 'structure' | 'validation' | 'stats'>('files');
const fileSearchQuery = ref('');
const selectedFileKeys = ref<string[]>([]);
const refreshing = ref(false);

// Computed
const selectedFile = computed(() => {
  if (selectedFileKeys.value.length === 0 || !props.previewData?.files) return null;
  return props.previewData.files.find(file => file.path === selectedFileKeys.value[0]) || null;
});

const filteredFileTree = computed(() => {
  if (!props.previewData?.files) return [];
  
  let files = props.previewData.files;
  
  if (fileSearchQuery.value) {
    files = files.filter(file => 
      file.name.toLowerCase().includes(fileSearchQuery.value.toLowerCase()) ||
      file.path.toLowerCase().includes(fileSearchQuery.value.toLowerCase())
    );
  }
  
  // Convert flat file list to tree structure
  return buildFileTree(files);
});

// Options
const viewModeOptions = [
  { label: $t('page.lowcode.codeGeneration.files'), value: 'files' },
  { label: $t('page.lowcode.codeGeneration.structure'), value: 'structure' },
  { label: $t('page.lowcode.codeGeneration.validation'), value: 'validation' },
  { label: $t('page.lowcode.codeGeneration.statistics'), value: 'stats' }
];

// Methods
function buildFileTree(files: PreviewFile[]): any[] {
  const tree: any[] = [];
  const pathMap = new Map();

  files.forEach(file => {
    const parts = file.path.split('/');
    let currentLevel = tree;
    let currentPath = '';

    parts.forEach((part, index) => {
      currentPath = currentPath ? `${currentPath}/${part}` : part;
      
      if (index === parts.length - 1) {
        // This is a file
        currentLevel.push({
          name: part,
          path: file.path,
          type: 'file',
          size: file.size,
          content: file.content
        });
      } else {
        // This is a directory
        let dir = pathMap.get(currentPath);
        if (!dir) {
          dir = {
            name: part,
            path: currentPath,
            type: 'folder',
            children: []
          };
          currentLevel.push(dir);
          pathMap.set(currentPath, dir);
        }
        currentLevel = dir.children;
      }
    });
  });

  return tree;
}

function getFileIcon(fileName: string): string {
  const ext = fileName.split('.').pop()?.toLowerCase();
  const iconMap: Record<string, string> = {
    js: 'icon-vscode-icons-file-type-js',
    ts: 'icon-vscode-icons-file-type-typescript',
    vue: 'icon-vscode-icons-file-type-vue',
    java: 'icon-vscode-icons-file-type-java',
    py: 'icon-vscode-icons-file-type-python',
    go: 'icon-vscode-icons-file-type-go',
    rs: 'icon-vscode-icons-file-type-rust',
    php: 'icon-vscode-icons-file-type-php',
    html: 'icon-vscode-icons-file-type-html',
    css: 'icon-vscode-icons-file-type-css',
    json: 'icon-vscode-icons-file-type-json',
    md: 'icon-vscode-icons-file-type-markdown'
  };
  return iconMap[ext || ''] || 'icon-mdi-file-document';
}

function getFileIconColor(fileName: string): string {
  const ext = fileName.split('.').pop()?.toLowerCase();
  const colorMap: Record<string, string> = {
    js: '#f7df1e',
    ts: '#3178c6',
    vue: '#4fc08d',
    java: '#ed8b00',
    py: '#3776ab',
    go: '#00add8',
    rs: '#000000',
    php: '#777bb4',
    html: '#e34f26',
    css: '#1572b6',
    json: '#000000',
    md: '#000000'
  };
  return colorMap[ext || ''] || '#666666';
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
    html: 'html',
    css: 'css',
    json: 'json',
    md: 'markdown'
  };
  return langMap[ext || ''] || 'text';
}

function getLanguageIcon(language: string): string {
  const iconMap: Record<string, string> = {
    javascript: 'icon-vscode-icons-file-type-js',
    typescript: 'icon-vscode-icons-file-type-typescript',
    vue: 'icon-vscode-icons-file-type-vue',
    java: 'icon-vscode-icons-file-type-java',
    python: 'icon-vscode-icons-file-type-python',
    go: 'icon-vscode-icons-file-type-go',
    rust: 'icon-vscode-icons-file-type-rust',
    php: 'icon-vscode-icons-file-type-php'
  };
  return iconMap[language] || 'icon-mdi-code-tags';
}

function getLanguageColor(language: string): string {
  const colorMap: Record<string, string> = {
    javascript: '#f7df1e',
    typescript: '#3178c6',
    vue: '#4fc08d',
    java: '#ed8b00',
    python: '#3776ab',
    go: '#00add8',
    rust: '#000000',
    php: '#777bb4'
  };
  return colorMap[language] || '#666666';
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function getDefaultExpandedKeys(structure: any[]): string[] {
  const keys: string[] = [];
  function traverse(nodes: any[]) {
    nodes.forEach(node => {
      if (node.type === 'folder') {
        keys.push(node.path);
        if (node.children) {
          traverse(node.children);
        }
      }
    });
  }
  traverse(structure);
  return keys.slice(0, 5); // Expand first 5 folders
}

function getTotalLines(): number {
  if (!props.previewData?.files) return 0;
  return props.previewData.files.reduce((total, file) => {
    return total + (file.content.split('\n').length || 0);
  }, 0);
}

function getTotalSize(): number {
  if (!props.previewData?.files) return 0;
  return Math.round(props.previewData.files.reduce((total, file) => total + file.size, 0) / 1024);
}

function getLanguageCount(): number {
  if (!props.previewData?.files) return 0;
  const languages = new Set(props.previewData.files.map(file => getFileLanguage(file.name)));
  return languages.size;
}

function getLanguageDistribution(): Record<string, number> {
  if (!props.previewData?.files) return {};
  const distribution: Record<string, number> = {};
  props.previewData.files.forEach(file => {
    const language = getFileLanguage(file.name);
    distribution[language] = (distribution[language] || 0) + 1;
  });
  return distribution;
}

function getSortedFilesBySize(): PreviewFile[] {
  if (!props.previewData?.files) return [];
  return [...props.previewData.files].sort((a, b) => b.size - a.size).slice(0, 10);
}

function getMaxFileSize(): number {
  if (!props.previewData?.files) return 1;
  return Math.max(...props.previewData.files.map(file => file.size));
}

function handleViewModeChange() {
  // Reset selections when changing view mode
  selectedFileKeys.value = [];
}

function handleFileSelect(keys: string[]) {
  selectedFileKeys.value = keys;
}

async function handleRefresh() {
  refreshing.value = true;
  try {
    emit('refresh');
  } finally {
    setTimeout(() => {
      refreshing.value = false;
    }, 500);
  }
}

function handleDownload() {
  emit('download');
}

// Watch for preview data changes
watch(() => props.previewData, () => {
  // Auto-select first file when preview data changes
  if (props.previewData?.files?.length && selectedFileKeys.value.length === 0) {
    selectedFileKeys.value = [props.previewData.files[0].path];
  }
}, { immediate: true });
</script>

<style scoped>
.code-preview {
  @apply h-full;
}

.code-preview :deep(.n-tree-node-content) {
  @apply py-1;
}

.code-preview :deep(.n-code) {
  @apply h-full;
}
</style>
