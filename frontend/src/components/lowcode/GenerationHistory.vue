<template>
  <div class="generation-history">
    <div class="mb-4">
      <NSpace justify="space-between" align="center">
        <NText strong>{{ $t('page.lowcode.codeGeneration.history') }}</NText>
        <NSpace>
          <NSelect
            v-model:value="statusFilter"
            :placeholder="$t('page.lowcode.codeGeneration.filterByStatus')"
            :options="statusOptions"
            clearable
            style="width: 150px"
            @update:value="handleFilterChange"
          />
          <NDatePicker
            v-model:value="dateRange"
            type="daterange"
            :placeholder="[$t('common.startDate'), $t('common.endDate')]"
            clearable
            @update:value="handleFilterChange"
          />
          <NButton @click="handleRefresh">
            <template #icon>
              <NIcon><icon-mdi-refresh /></NIcon>
            </template>
            {{ $t('common.refresh') }}
          </NButton>
        </NSpace>
      </NSpace>
    </div>

    <!-- History Table -->
    <NDataTable
      :columns="columns"
      :data="filteredHistory"
      :pagination="pagination"
      :loading="loading"
      size="small"
      striped
      remote
      @update:page="handlePageChange"
      @update:page-size="handlePageSizeChange"
    />

    <!-- Detail Modal -->
    <NModal v-model:show="showDetailModal" preset="card" style="width: 90%; max-width: 1200px">
      <template #header>
        {{ $t('page.lowcode.codeGeneration.generationDetail') }}
      </template>
      
      <div v-if="selectedRecord" class="space-y-4">
        <!-- Basic Info -->
        <NCard :title="$t('page.lowcode.codeGeneration.basicInfo')" size="small">
          <NDescriptions :column="2" bordered>
            <NDescriptionsItem :label="$t('page.lowcode.codeGeneration.generationId')">
              {{ selectedRecord.id }}
            </NDescriptionsItem>
            <NDescriptionsItem :label="$t('page.lowcode.codeGeneration.status')">
              <NTag :type="getStatusType(selectedRecord.status)">
                {{ $t(`page.lowcode.codeGeneration.status.${selectedRecord.status.toLowerCase()}`) }}
              </NTag>
            </NDescriptionsItem>
            <NDescriptionsItem :label="$t('page.lowcode.codeGeneration.startTime')">
              {{ formatDate(selectedRecord.startTime) }}
            </NDescriptionsItem>
            <NDescriptionsItem :label="$t('page.lowcode.codeGeneration.endTime')">
              {{ selectedRecord.endTime ? formatDate(selectedRecord.endTime) : '-' }}
            </NDescriptionsItem>
            <NDescriptionsItem :label="$t('page.lowcode.codeGeneration.duration')">
              {{ getDuration(selectedRecord) }}
            </NDescriptionsItem>
            <NDescriptionsItem :label="$t('page.lowcode.codeGeneration.filesGenerated')">
              {{ selectedRecord.filesGenerated }}
            </NDescriptionsItem>
          </NDescriptions>
        </NCard>

        <!-- Templates and Entities -->
        <NGrid :cols="2" :x-gap="16">
          <NGridItem>
            <NCard :title="$t('page.lowcode.codeGeneration.templates')" size="small">
              <NList>
                <NListItem v-for="templateId in selectedRecord.templateIds" :key="templateId">
                  <NThing>
                    <template #header>{{ getTemplateName(templateId) }}</template>
                    <template #description>{{ templateId }}</template>
                  </NThing>
                </NListItem>
              </NList>
            </NCard>
          </NGridItem>
          <NGridItem>
            <NCard :title="$t('page.lowcode.codeGeneration.entities')" size="small">
              <NList>
                <NListItem v-for="entityId in selectedRecord.entityIds" :key="entityId">
                  <NThing>
                    <template #header>{{ getEntityName(entityId) }}</template>
                    <template #description>{{ entityId }}</template>
                  </NThing>
                </NListItem>
              </NList>
            </NCard>
          </NGridItem>
        </NGrid>

        <!-- Variables and Options -->
        <NGrid :cols="2" :x-gap="16">
          <NGridItem>
            <NCard :title="$t('page.lowcode.codeGeneration.variables')" size="small">
              <NCode :code="JSON.stringify(selectedRecord.variables, null, 2)" language="json" />
            </NCard>
          </NGridItem>
          <NGridItem>
            <NCard :title="$t('page.lowcode.codeGeneration.options')" size="small">
              <NCode :code="JSON.stringify(selectedRecord.options, null, 2)" language="json" />
            </NCard>
          </NGridItem>
        </NGrid>

        <!-- Errors (if any) -->
        <NCard v-if="selectedRecord.errors && selectedRecord.errors.length > 0" :title="$t('page.lowcode.codeGeneration.errors')" size="small">
          <NAlert
            v-for="(error, index) in selectedRecord.errors"
            :key="index"
            type="error"
            :title="`Error ${index + 1}`"
            class="mb-2"
          >
            {{ error }}
          </NAlert>
        </NCard>

        <!-- Generated Files -->
        <NCard v-if="selectedRecord.generatedFiles" :title="$t('page.lowcode.codeGeneration.generatedFiles')" size="small">
          <NTree
            :data="selectedRecord.generatedFiles"
            key-field="path"
            label-field="name"
            children-field="children"
            selectable
            @update:selected-keys="handleFileSelect"
          />
        </NCard>

        <!-- File Content -->
        <NCard v-if="selectedFileContent" :title="$t('page.lowcode.codeGeneration.fileContent')" size="small">
          <NCode :code="selectedFileContent" :language="getFileLanguage(selectedFileName)" />
        </NCard>
      </div>

      <template #footer>
        <NSpace justify="end">
          <NButton @click="showDetailModal = false">{{ $t('common.close') }}</NButton>
          <NButton v-if="selectedRecord?.status === 'SUCCESS'" type="primary" @click="handleRegenerate">
            {{ $t('page.lowcode.codeGeneration.regenerate') }}
          </NButton>
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

interface GenerationRecord {
  id: string;
  projectId: string;
  templateIds: string[];
  entityIds: string[];
  status: 'PENDING' | 'RUNNING' | 'SUCCESS' | 'FAILED';
  filesGenerated: number;
  outputPath: string;
  variables: Record<string, any>;
  options: Record<string, any>;
  startTime: string;
  endTime?: string;
  errors?: string[];
  generatedFiles?: any[];
}

interface Props {
  projectId?: string;
}

interface Emits {
  (e: 'regenerate', record: GenerationRecord): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

// State
const loading = ref(false);
const history = ref<GenerationRecord[]>([]);
const statusFilter = ref<string>('');
const dateRange = ref<[number, number] | null>(null);
const showDetailModal = ref(false);
const selectedRecord = ref<GenerationRecord | null>(null);
const selectedFileName = ref('');
const selectedFileContent = ref('');

const pagination = ref({
  page: 1,
  pageSize: 10,
  itemCount: 0,
  showSizePicker: true,
  pageSizes: [10, 20, 50, 100]
});

// Computed
const filteredHistory = computed(() => {
  let filtered = history.value;

  if (statusFilter.value) {
    filtered = filtered.filter(record => record.status === statusFilter.value);
  }

  if (dateRange.value) {
    const [start, end] = dateRange.value;
    filtered = filtered.filter(record => {
      const recordTime = new Date(record.startTime).getTime();
      return recordTime >= start && recordTime <= end;
    });
  }

  return filtered;
});

// Options
const statusOptions = [
  { label: $t('page.lowcode.codeGeneration.status.pending'), value: 'PENDING' },
  { label: $t('page.lowcode.codeGeneration.status.running'), value: 'RUNNING' },
  { label: $t('page.lowcode.codeGeneration.status.success'), value: 'SUCCESS' },
  { label: $t('page.lowcode.codeGeneration.status.failed'), value: 'FAILED' }
];

// Table columns
const columns: DataTableColumns<GenerationRecord> = [
  { 
    title: $t('page.lowcode.codeGeneration.generationId'), 
    key: 'id', 
    width: 120,
    ellipsis: { tooltip: true }
  },
  {
    title: $t('page.lowcode.codeGeneration.status'),
    key: 'status',
    width: 100,
    render: (row) => h('NTag', { type: getStatusType(row.status) }, 
      $t(`page.lowcode.codeGeneration.status.${row.status.toLowerCase()}`)
    )
  },
  {
    title: $t('page.lowcode.codeGeneration.templates'),
    key: 'templateIds',
    width: 150,
    render: (row) => `${row.templateIds.length} template(s)`
  },
  {
    title: $t('page.lowcode.codeGeneration.entities'),
    key: 'entityIds',
    width: 150,
    render: (row) => `${row.entityIds.length} entity(s)`
  },
  {
    title: $t('page.lowcode.codeGeneration.filesGenerated'),
    key: 'filesGenerated',
    width: 120,
    align: 'center'
  },
  {
    title: $t('page.lowcode.codeGeneration.startTime'),
    key: 'startTime',
    width: 180,
    render: (row) => formatDate(row.startTime)
  },
  {
    title: $t('page.lowcode.codeGeneration.duration'),
    key: 'duration',
    width: 120,
    render: (row) => getDuration(row)
  },
  {
    title: $t('common.actions'),
    key: 'actions',
    width: 150,
    fixed: 'right',
    render: (row) => [
      h('NButton', 
        { 
          size: 'small', 
          onClick: () => handleViewDetail(row),
          style: { marginRight: '8px' }
        }, 
        $t('common.detail')
      ),
      h('NButton', 
        { 
          size: 'small', 
          type: 'primary',
          disabled: row.status !== 'SUCCESS',
          onClick: () => handleRegenerate(row)
        }, 
        $t('page.lowcode.codeGeneration.regenerate')
      )
    ]
  }
];

// Methods
function getStatusType(status: string): 'success' | 'warning' | 'error' | 'info' {
  const statusMap: Record<string, 'success' | 'warning' | 'error' | 'info'> = {
    PENDING: 'info',
    RUNNING: 'warning',
    SUCCESS: 'success',
    FAILED: 'error'
  };
  return statusMap[status] || 'info';
}

function getDuration(record: GenerationRecord): string {
  if (!record.endTime) {
    return record.status === 'RUNNING' ? 'Running...' : '-';
  }
  
  const start = new Date(record.startTime).getTime();
  const end = new Date(record.endTime).getTime();
  const duration = Math.round((end - start) / 1000);
  
  if (duration < 60) {
    return `${duration}s`;
  } else if (duration < 3600) {
    return `${Math.floor(duration / 60)}m ${duration % 60}s`;
  } else {
    const hours = Math.floor(duration / 3600);
    const minutes = Math.floor((duration % 3600) / 60);
    return `${hours}h ${minutes}m`;
  }
}

function getTemplateName(templateId: string): string {
  // In real implementation, this would fetch from template store
  return `Template ${templateId.slice(-8)}`;
}

function getEntityName(entityId: string): string {
  // In real implementation, this would fetch from entity store
  return `Entity ${entityId.slice(-8)}`;
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

async function loadHistory() {
  try {
    loading.value = true;
    
    // Mock data - in real implementation, this would call the API
    const mockHistory: GenerationRecord[] = [
      {
        id: 'gen-001',
        projectId: props.projectId || 'project-1',
        templateIds: ['tpl-001', 'tpl-002'],
        entityIds: ['entity-001'],
        status: 'SUCCESS',
        filesGenerated: 5,
        outputPath: './generated',
        variables: { entityName: 'User', tableName: 'users' },
        options: { architecture: 'base-biz', framework: 'nestjs' },
        startTime: new Date(Date.now() - 3600000).toISOString(),
        endTime: new Date(Date.now() - 3580000).toISOString(),
        generatedFiles: [
          { name: 'user.service.ts', path: 'src/services/user.service.ts' },
          { name: 'user.controller.ts', path: 'src/controllers/user.controller.ts' }
        ]
      },
      {
        id: 'gen-002',
        projectId: props.projectId || 'project-1',
        templateIds: ['tpl-003'],
        entityIds: ['entity-002', 'entity-003'],
        status: 'FAILED',
        filesGenerated: 0,
        outputPath: './generated',
        variables: { entityName: 'Product' },
        options: { architecture: 'ddd', framework: 'nestjs' },
        startTime: new Date(Date.now() - 1800000).toISOString(),
        endTime: new Date(Date.now() - 1790000).toISOString(),
        errors: ['Template compilation failed', 'Invalid entity structure']
      }
    ];
    
    history.value = mockHistory;
    pagination.value.itemCount = mockHistory.length;
  } catch (error) {
    console.error('Failed to load generation history:', error);
    window.$message?.error($t('page.lowcode.codeGeneration.loadHistoryFailed'));
  } finally {
    loading.value = false;
  }
}

function handleFilterChange() {
  // Trigger re-filtering
  pagination.value.page = 1;
}

function handleRefresh() {
  loadHistory();
}

function handlePageChange(page: number) {
  pagination.value.page = page;
}

function handlePageSizeChange(pageSize: number) {
  pagination.value.pageSize = pageSize;
  pagination.value.page = 1;
}

function handleViewDetail(record: GenerationRecord) {
  selectedRecord.value = record;
  selectedFileContent.value = '';
  selectedFileName.value = '';
  showDetailModal.value = true;
}

function handleFileSelect(selectedKeys: string[]) {
  if (selectedKeys.length === 0) return;
  
  const filePath = selectedKeys[0];
  selectedFileName.value = filePath.split('/').pop() || '';
  
  // Mock file content - in real implementation, this would fetch from API
  selectedFileContent.value = `// Generated file: ${selectedFileName.value}
export class UserService {
  constructor() {}
  
  async findAll(): Promise<User[]> {
    return [];
  }
}`;
}

function handleRegenerate(record?: GenerationRecord) {
  const targetRecord = record || selectedRecord.value;
  if (targetRecord) {
    emit('regenerate', targetRecord);
    showDetailModal.value = false;
  }
}

// Lifecycle
onMounted(() => {
  loadHistory();
});
</script>

<style scoped>
.generation-history {
  @apply w-full;
}
</style>
