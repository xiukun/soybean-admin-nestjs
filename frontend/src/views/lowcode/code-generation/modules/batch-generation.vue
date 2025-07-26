<template>
  <div class="batch-generation">
    <!-- 批量生成配置 -->
    <NCard :title="$t('page.lowcode.codeGeneration.batchGeneration')" size="small" class="mb-4">
      <NForm ref="batchFormRef" :model="batchForm" :rules="batchRules" label-placement="left" :label-width="120">
        <NGrid :cols="2" :x-gap="16">
          <NGridItem>
            <NFormItem :label="$t('page.lowcode.codeGeneration.batchMode')" path="mode">
              <NSelect v-model:value="batchForm.mode" :options="batchModeOptions" @update:value="handleModeChange" />
            </NFormItem>
          </NGridItem>
          <NGridItem>
            <NFormItem :label="$t('page.lowcode.codeGeneration.concurrency')" path="concurrency">
              <NInputNumber v-model:value="batchForm.concurrency" :min="1" :max="10" />
            </NFormItem>
          </NGridItem>
        </NGrid>

        <!-- 项目批量生成 -->
        <div v-if="batchForm.mode === 'projects'">
          <NFormItem :label="$t('page.lowcode.codeGeneration.selectProjects')" path="projectIds">
            <NTransfer
              v-model:value="batchForm.projectIds"
              :options="projectTransferOptions"
              :render-source-label="renderProjectLabel"
              :render-target-label="renderProjectLabel"
            />
          </NFormItem>
        </div>

        <!-- 实体批量生成 -->
        <div v-if="batchForm.mode === 'entities'">
          <NFormItem :label="$t('page.lowcode.codeGeneration.selectEntities')" path="entityIds">
            <NTransfer
              v-model:value="batchForm.entityIds"
              :options="entityTransferOptions"
              :render-source-label="renderEntityLabel"
              :render-target-label="renderEntityLabel"
            />
          </NFormItem>
        </div>

        <!-- 模板批量生成 -->
        <div v-if="batchForm.mode === 'templates'">
          <NFormItem :label="$t('page.lowcode.codeGeneration.selectTemplates')" path="templateIds">
            <NTransfer
              v-model:value="batchForm.templateIds"
              :options="templateTransferOptions"
              :render-source-label="renderTemplateLabel"
              :render-target-label="renderTemplateLabel"
            />
          </NFormItem>
        </div>

        <NFormItem :label="$t('page.lowcode.codeGeneration.outputStrategy')" path="outputStrategy">
          <NRadioGroup v-model:value="batchForm.outputStrategy">
            <NSpace direction="vertical">
              <NRadio value="separate">
                {{ $t('page.lowcode.codeGeneration.separateDirectories') }}
                <NText depth="3" class="ml-2">{{ $t('page.lowcode.codeGeneration.separateDirectoriesDesc') }}</NText>
              </NRadio>
              <NRadio value="merged">
                {{ $t('page.lowcode.codeGeneration.mergedDirectory') }}
                <NText depth="3" class="ml-2">{{ $t('page.lowcode.codeGeneration.mergedDirectoryDesc') }}</NText>
              </NRadio>
            </NSpace>
          </NRadioGroup>
        </NFormItem>

        <NFormItem :label="$t('page.lowcode.codeGeneration.baseOutputPath')" path="baseOutputPath">
          <NInputGroup>
            <NInput v-model:value="batchForm.baseOutputPath" />
            <NButton @click="handleBrowseBaseOutputPath">
              <template #icon>
                <NIcon><icon-mdi-folder-open /></NIcon>
              </template>
            </NButton>
          </NInputGroup>
        </NFormItem>

        <!-- 高级选项 -->
        <NCollapse>
          <NCollapseItem :title="$t('page.lowcode.codeGeneration.advancedOptions')" name="advanced">
            <NGrid :cols="2" :x-gap="16">
              <NGridItem>
                <NFormItem :label="$t('page.lowcode.codeGeneration.overwriteExisting')">
                  <NSwitch v-model:value="batchForm.options.overwriteExisting" />
                </NFormItem>
              </NGridItem>
              <NGridItem>
                <NFormItem :label="$t('page.lowcode.codeGeneration.generateTests')">
                  <NSwitch v-model:value="batchForm.options.generateTests" />
                </NFormItem>
              </NGridItem>
              <NGridItem>
                <NFormItem :label="$t('page.lowcode.codeGeneration.generateDocs')">
                  <NSwitch v-model:value="batchForm.options.generateDocs" />
                </NFormItem>
              </NGridItem>
              <NGridItem>
                <NFormItem :label="$t('page.lowcode.codeGeneration.enableLinting')">
                  <NSwitch v-model:value="batchForm.options.enableLinting" />
                </NFormItem>
              </NGridItem>
              <NGridItem>
                <NFormItem :label="$t('page.lowcode.codeGeneration.createGitRepo')">
                  <NSwitch v-model:value="batchForm.options.createGitRepo" />
                </NFormItem>
              </NGridItem>
              <NGridItem>
                <NFormItem :label="$t('page.lowcode.codeGeneration.autoCommit')">
                  <NSwitch v-model:value="batchForm.options.autoCommit" :disabled="!batchForm.options.createGitRepo" />
                </NFormItem>
              </NGridItem>
            </NGrid>
          </NCollapseItem>
        </NCollapse>

        <div class="mt-6">
          <NSpace justify="end">
            <NButton @click="handleReset">{{ $t('common.reset') }}</NButton>
            <NButton @click="handlePreview">{{ $t('page.lowcode.codeGeneration.preview') }}</NButton>
            <NButton type="primary" :loading="generating" @click="handleStartBatchGeneration">
              {{ $t('page.lowcode.codeGeneration.startBatchGeneration') }}
            </NButton>
          </NSpace>
        </div>
      </NForm>
    </NCard>

    <!-- 批量生成进度 -->
    <NCard v-if="batchProgress.length > 0" :title="$t('page.lowcode.codeGeneration.batchProgress')" size="small" class="mb-4">
      <div class="space-y-3">
        <div
          v-for="(progress, index) in batchProgress"
          :key="index"
          class="progress-item p-3 border border-gray-200 rounded"
        >
          <div class="flex justify-between items-center mb-2">
            <NText strong>{{ progress.name }}</NText>
            <NTag :type="getProgressStatusType(progress.status)">
              {{ $t(`page.lowcode.codeGeneration.status.${progress.status.toLowerCase()}`) }}
            </NTag>
          </div>
          <NProgress
            :percentage="progress.percentage"
            :status="progress.status === 'FAILED' ? 'error' : progress.status === 'SUCCESS' ? 'success' : undefined"
          />
          <div class="mt-2 text-sm text-gray-600">
            {{ progress.currentTask }}
          </div>
        </div>
      </div>
    </NCard>

    <!-- 批量生成结果 -->
    <NCard v-if="batchResults.length > 0" :title="$t('page.lowcode.codeGeneration.batchResults')" size="small">
      <NDataTable
        :columns="resultColumns"
        :data="batchResults"
        size="small"
        :pagination="false"
        :max-height="400"
      />
      
      <div class="mt-4">
        <NSpace>
          <NButton @click="handleDownloadAll">
            <template #icon>
              <NIcon><icon-mdi-download /></NIcon>
            </template>
            {{ $t('page.lowcode.codeGeneration.downloadAll') }}
          </NButton>
          <NButton @click="handleOpenOutputDirectory">
            <template #icon>
              <NIcon><icon-mdi-folder-open /></NIcon>
            </template>
            {{ $t('page.lowcode.codeGeneration.openOutputDirectory') }}
          </NButton>
          <NButton @click="handleClearResults">
            <template #icon>
              <NIcon><icon-mdi-delete-sweep /></NIcon>
            </template>
            {{ $t('page.lowcode.codeGeneration.clearResults') }}
          </NButton>
        </NSpace>
      </div>
    </NCard>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, h } from 'vue';
import type { FormInst, FormRules, DataTableColumns } from 'naive-ui';
import { $t } from '@/locales';
import { createRequiredFormRule } from '@/utils/form/rule';

interface BatchProgress {
  name: string;
  status: 'PENDING' | 'RUNNING' | 'SUCCESS' | 'FAILED';
  percentage: number;
  currentTask: string;
}

interface BatchResult {
  name: string;
  status: 'SUCCESS' | 'FAILED';
  filesGenerated: number;
  outputPath: string;
  duration: number;
  errors?: string[];
}

// State
const batchFormRef = ref<FormInst | null>(null);
const generating = ref(false);
const batchProgress = ref<BatchProgress[]>([]);
const batchResults = ref<BatchResult[]>([]);

// Form
const batchForm = reactive({
  mode: 'projects',
  concurrency: 3,
  projectIds: [],
  entityIds: [],
  templateIds: [],
  outputStrategy: 'separate',
  baseOutputPath: './batch-generated',
  options: {
    overwriteExisting: false,
    generateTests: true,
    generateDocs: true,
    enableLinting: true,
    createGitRepo: false,
    autoCommit: false
  }
});

// Options
const batchModeOptions = [
  { label: $t('page.lowcode.codeGeneration.batchByProjects'), value: 'projects' },
  { label: $t('page.lowcode.codeGeneration.batchByEntities'), value: 'entities' },
  { label: $t('page.lowcode.codeGeneration.batchByTemplates'), value: 'templates' }
];

// Mock data for transfer options
const projectTransferOptions = ref([
  { label: 'E-commerce Platform', value: 'project-1' },
  { label: 'CRM System', value: 'project-2' }
]);

const entityTransferOptions = ref([
  { label: 'User', value: 'entity-1' },
  { label: 'Product', value: 'entity-2' },
  { label: 'Order', value: 'entity-3' }
]);

const templateTransferOptions = ref([
  { label: 'NestJS Controller', value: 'template-1' },
  { label: 'NestJS Service', value: 'template-2' },
  { label: 'DTO Template', value: 'template-3' }
]);

// Form rules
const batchRules: FormRules = {
  mode: createRequiredFormRule($t('page.lowcode.codeGeneration.batchModeRequired')),
  baseOutputPath: createRequiredFormRule($t('page.lowcode.codeGeneration.baseOutputPathRequired'))
};

// Table columns for results
const resultColumns: DataTableColumns<BatchResult> = [
  { title: $t('page.lowcode.codeGeneration.name'), key: 'name', width: 200 },
  {
    title: $t('page.lowcode.codeGeneration.status'),
    key: 'status',
    width: 100,
    render: (row) => h('NTag', { type: row.status === 'SUCCESS' ? 'success' : 'error' }, 
      $t(`page.lowcode.codeGeneration.status.${row.status.toLowerCase()}`)
    )
  },
  { title: $t('page.lowcode.codeGeneration.filesGenerated'), key: 'filesGenerated', width: 120, align: 'center' },
  { title: $t('page.lowcode.codeGeneration.outputPath'), key: 'outputPath', ellipsis: { tooltip: true } },
  { title: $t('page.lowcode.codeGeneration.duration'), key: 'duration', width: 100, render: (row) => `${row.duration}ms` },
  {
    title: $t('common.actions'),
    key: 'actions',
    width: 150,
    render: (row) => [
      h('NButton', 
        { 
          size: 'small', 
          onClick: () => handleViewResult(row),
          style: { marginRight: '8px' }
        }, 
        $t('common.view')
      ),
      h('NButton', 
        { 
          size: 'small', 
          onClick: () => handleDownloadResult(row)
        }, 
        $t('common.download')
      )
    ]
  }
];

// Methods
function renderProjectLabel(option: any) {
  return option.label;
}

function renderEntityLabel(option: any) {
  return option.label;
}

function renderTemplateLabel(option: any) {
  return option.label;
}

function getProgressStatusType(status: string): 'success' | 'warning' | 'error' | 'info' {
  const statusMap: Record<string, 'success' | 'warning' | 'error' | 'info'> = {
    SUCCESS: 'success',
    FAILED: 'error',
    RUNNING: 'info',
    PENDING: 'warning'
  };
  return statusMap[status] || 'info';
}

function handleModeChange() {
  // Reset selections when mode changes
  batchForm.projectIds = [];
  batchForm.entityIds = [];
  batchForm.templateIds = [];
}

function handleBrowseBaseOutputPath() {
  window.$message?.info('文件浏览器功能开发中');
}

function handleReset() {
  Object.assign(batchForm, {
    mode: 'projects',
    concurrency: 3,
    projectIds: [],
    entityIds: [],
    templateIds: [],
    outputStrategy: 'separate',
    baseOutputPath: './batch-generated',
    options: {
      overwriteExisting: false,
      generateTests: true,
      generateDocs: true,
      enableLinting: true,
      createGitRepo: false,
      autoCommit: false
    }
  });
  batchProgress.value = [];
  batchResults.value = [];
}

function handlePreview() {
  window.$message?.info('批量预览功能开发中');
}

async function handleStartBatchGeneration() {
  await batchFormRef.value?.validate();
  
  try {
    generating.value = true;
    
    // Mock batch generation
    const items = batchForm.mode === 'projects' ? batchForm.projectIds :
                  batchForm.mode === 'entities' ? batchForm.entityIds :
                  batchForm.templateIds;
    
    batchProgress.value = items.map((id: string) => ({
      name: `Item ${id}`,
      status: 'PENDING' as const,
      percentage: 0,
      currentTask: 'Waiting to start...'
    }));
    
    // Simulate concurrent generation
    for (let i = 0; i < items.length; i += batchForm.concurrency) {
      const batch = items.slice(i, i + batchForm.concurrency);
      
      await Promise.all(batch.map(async (id: string, index: number) => {
        const progressIndex = i + index;
        const progress = batchProgress.value[progressIndex];
        
        progress.status = 'RUNNING';
        progress.currentTask = 'Starting generation...';
        
        // Simulate generation steps
        const steps = ['Analyzing...', 'Generating...', 'Validating...', 'Finalizing...'];
        for (let step = 0; step < steps.length; step++) {
          await new Promise(resolve => setTimeout(resolve, 500));
          progress.currentTask = steps[step];
          progress.percentage = ((step + 1) / steps.length) * 100;
        }
        
        progress.status = 'SUCCESS';
        progress.currentTask = 'Completed';
        
        // Add to results
        batchResults.value.push({
          name: `Item ${id}`,
          status: 'SUCCESS',
          filesGenerated: Math.floor(Math.random() * 20) + 5,
          outputPath: `${batchForm.baseOutputPath}/item-${id}`,
          duration: Math.floor(Math.random() * 5000) + 1000
        });
      }));
    }
    
    window.$message?.success($t('page.lowcode.codeGeneration.batchGenerationCompleted'));
  } catch (error) {
    window.$message?.error($t('page.lowcode.codeGeneration.batchGenerationFailed'));
  } finally {
    generating.value = false;
  }
}

function handleViewResult(result: BatchResult) {
  window.$message?.info(`查看结果: ${result.name}`);
}

function handleDownloadResult(result: BatchResult) {
  window.$message?.info(`下载结果: ${result.name}`);
}

function handleDownloadAll() {
  window.$message?.info('下载所有结果功能开发中');
}

function handleOpenOutputDirectory() {
  window.$message?.info('打开输出目录功能开发中');
}

function handleClearResults() {
  batchResults.value = [];
  batchProgress.value = [];
}
</script>

<style scoped>
.batch-generation {
  @apply space-y-4;
}

.progress-item {
  @apply transition-all duration-200;
}

.progress-item:hover {
  @apply shadow-sm;
}
</style>
