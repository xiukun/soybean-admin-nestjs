<script setup lang="ts">
import { computed, h, onMounted, reactive, ref } from 'vue';
import type { DataTableColumns, FormInst, FormRules } from 'naive-ui';
import { createRequiredFormRule } from '@/utils/form/rule';
import { $t } from '@/locales';
import GenerationHistory from '@/components/lowcode/GenerationHistory.vue';

interface Props {
  projectId: string;
}

const props = defineProps<Props>();

interface GenerationForm {
  entityIds: string[];
  templateIds: string[];
  outputPath: string;
  architecture: string;
  options: {
    overwriteExisting: boolean;
    generateTests: boolean;
    generateDocs: boolean;
    enableLinting: boolean;
  };
}

interface GenerationProgress {
  status: 'PENDING' | 'RUNNING' | 'SUCCESS' | 'FAILED';
  percentage: number;
  currentTask: string;
  filesGenerated: number;
  totalFiles: number;
  logs: Array<{
    level: 'info' | 'warn' | 'error';
    timestamp: string;
    message: string;
  }>;
}

interface GenerationResult {
  outputPath: string;
  duration: number;
  files: Array<{
    path: string;
    size: number;
    type: string;
  }>;
}

// State
const formRef = ref<FormInst | null>(null);
const generating = ref(false);
const generationProgress = ref<GenerationProgress | null>(null);
const generationResult = ref<GenerationResult | null>(null);
const entityOptions = ref<Array<{ label: string; value: string }>>([]);
const templateOptions = ref<Array<{ label: string; value: string }>>([]);

// Form
const generationForm = reactive<GenerationForm>({
  entityIds: [],
  templateIds: [],
  outputPath: './generated',
  architecture: 'base-biz',
  options: {
    overwriteExisting: false,
    generateTests: true,
    generateDocs: true,
    enableLinting: true
  }
});

// Options
const architectureOptions = [
  { label: 'Base-Biz', value: 'base-biz' },
  { label: 'DDD', value: 'ddd' },
  { label: 'Clean Architecture', value: 'clean' },
  { label: 'Hexagonal', value: 'hexagonal' }
];

// Form rules
const rules: FormRules = {
  entityIds: createRequiredFormRule($t('page.lowcode.codeGeneration.selectEntitiesRequired')),
  templateIds: createRequiredFormRule($t('page.lowcode.codeGeneration.selectTemplatesRequired')),
  outputPath: createRequiredFormRule($t('page.lowcode.codeGeneration.outputPathRequired'))
};

// File table columns
const fileColumns: DataTableColumns = [
  { title: $t('page.lowcode.codeGeneration.fileName'), key: 'path', width: 300 },
  { title: $t('page.lowcode.codeGeneration.fileType'), key: 'type', width: 100 },
  {
    title: $t('page.lowcode.codeGeneration.fileSize'),
    key: 'size',
    width: 100,
    render: (row: any) => `${(row.size / 1024).toFixed(2)} KB`
  }
];

// Methods
function getStatusType(status: string): 'success' | 'warning' | 'error' | 'info' {
  const statusMap: Record<string, 'success' | 'warning' | 'error' | 'info'> = {
    SUCCESS: 'success',
    RUNNING: 'info',
    PENDING: 'warning',
    FAILED: 'error'
  };
  return statusMap[status] || 'info';
}

function getLogTagType(level: string): 'info' | 'warning' | 'error' {
  const levelMap: Record<string, 'info' | 'warning' | 'error'> = {
    info: 'info',
    warn: 'warning',
    error: 'error'
  };
  return levelMap[level] || 'info';
}

function handleBrowseOutputPath() {
  window.$message?.info('文件浏览器功能开发中');
}

async function handleGenerate() {
  await formRef.value?.validate();

  try {
    generating.value = true;
    generationProgress.value = {
      status: 'RUNNING',
      percentage: 0,
      currentTask: '初始化生成器...',
      filesGenerated: 0,
      totalFiles: 10,
      logs: []
    };

    // Mock generation process
    const tasks = [
      '分析实体结构...',
      '加载模板文件...',
      '生成控制器文件...',
      '生成服务文件...',
      '生成DTO文件...',
      '生成测试文件...',
      '生成文档文件...',
      '执行代码检查...',
      '完成生成过程...'
    ];

    for (let i = 0; i < tasks.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 500));

      generationProgress.value.currentTask = tasks[i];
      generationProgress.value.percentage = Math.round(((i + 1) / tasks.length) * 100);
      generationProgress.value.filesGenerated = i + 1;
      generationProgress.value.logs.push({
        level: 'info',
        timestamp: new Date().toLocaleTimeString(),
        message: tasks[i]
      });
    }

    generationProgress.value.status = 'SUCCESS';

    // Mock generation result
    generationResult.value = {
      outputPath: generationForm.outputPath,
      duration: 4500,
      files: [
        { path: 'src/controllers/user.controller.ts', size: 2048, type: 'TypeScript' },
        { path: 'src/services/user.service.ts', size: 3072, type: 'TypeScript' },
        { path: 'src/dto/user.dto.ts', size: 1024, type: 'TypeScript' },
        { path: 'test/user.controller.spec.ts', size: 1536, type: 'TypeScript' }
      ]
    };

    window.$message?.success($t('page.lowcode.codeGeneration.generateSuccess'));
  } catch (error) {
    if (generationProgress.value) {
      generationProgress.value.status = 'FAILED';
    }
    window.$message?.error($t('page.lowcode.codeGeneration.generateFailed'));
  } finally {
    generating.value = false;
  }
}

function handlePreview() {
  window.$message?.info('预览功能开发中');
}

function handleReset() {
  Object.assign(generationForm, {
    entityIds: [],
    templateIds: [],
    outputPath: './generated',
    architecture: 'base-biz',
    options: {
      overwriteExisting: false,
      generateTests: true,
      generateDocs: true,
      enableLinting: true
    }
  });
  generationProgress.value = null;
  generationResult.value = null;
}

function handleDownload() {
  window.$message?.info('下载功能开发中');
}

function handleOpenInExplorer() {
  window.$message?.info('打开文件夹功能开发中');
}

async function loadOptions() {
  // Mock data
  entityOptions.value = [
    { label: 'User', value: 'entity-1' },
    { label: 'Product', value: 'entity-2' },
    { label: 'Order', value: 'entity-3' }
  ];

  templateOptions.value = [
    { label: 'NestJS Controller', value: 'template-1' },
    { label: 'NestJS Service', value: 'template-2' },
    { label: 'DTO Template', value: 'template-3' }
  ];
}

// Lifecycle
onMounted(() => {
  loadOptions();
});
</script>

<template>
  <div class="code-generation">
    <!-- 生成配置 -->
    <NCard :title="$t('page.lowcode.codeGeneration.configuration')" class="mb-4">
      <NForm ref="formRef" :model="generationForm" :rules="rules" label-placement="left" :label-width="120">
        <NGrid :cols="2" :x-gap="16">
          <NGridItem>
            <NFormItem :label="$t('page.lowcode.codeGeneration.selectEntities')" path="entityIds">
              <NSelect
                v-model:value="generationForm.entityIds"
                :options="entityOptions"
                multiple
                :placeholder="$t('page.lowcode.codeGeneration.selectEntitiesPlaceholder')"
              />
            </NFormItem>
          </NGridItem>
          <NGridItem>
            <NFormItem :label="$t('page.lowcode.codeGeneration.selectTemplates')" path="templateIds">
              <NSelect
                v-model:value="generationForm.templateIds"
                :options="templateOptions"
                multiple
                :placeholder="$t('page.lowcode.codeGeneration.selectTemplatesPlaceholder')"
              />
            </NFormItem>
          </NGridItem>
          <NGridItem>
            <NFormItem :label="$t('page.lowcode.codeGeneration.outputPath')" path="outputPath">
              <NInputGroup>
                <NInput v-model:value="generationForm.outputPath" />
                <NButton @click="handleBrowseOutputPath">
                  <template #icon>
                    <NIcon><icon-mdi-folder-open /></NIcon>
                  </template>
                </NButton>
              </NInputGroup>
            </NFormItem>
          </NGridItem>
          <NGridItem>
            <NFormItem :label="$t('page.lowcode.codeGeneration.architecture')" path="architecture">
              <NSelect v-model:value="generationForm.architecture" :options="architectureOptions" />
            </NFormItem>
          </NGridItem>
        </NGrid>

        <!-- 生成选项 -->
        <NCollapse>
          <NCollapseItem :title="$t('page.lowcode.codeGeneration.advancedOptions')" name="advanced">
            <NGrid :cols="2" :x-gap="16">
              <NGridItem>
                <NFormItem :label="$t('page.lowcode.codeGeneration.overwriteExisting')">
                  <NSwitch v-model:value="generationForm.options.overwriteExisting" />
                </NFormItem>
              </NGridItem>
              <NGridItem>
                <NFormItem :label="$t('page.lowcode.codeGeneration.generateTests')">
                  <NSwitch v-model:value="generationForm.options.generateTests" />
                </NFormItem>
              </NGridItem>
              <NGridItem>
                <NFormItem :label="$t('page.lowcode.codeGeneration.generateDocs')">
                  <NSwitch v-model:value="generationForm.options.generateDocs" />
                </NFormItem>
              </NGridItem>
              <NGridItem>
                <NFormItem :label="$t('page.lowcode.codeGeneration.enableLinting')">
                  <NSwitch v-model:value="generationForm.options.enableLinting" />
                </NFormItem>
              </NGridItem>
            </NGrid>
          </NCollapseItem>
        </NCollapse>

        <div class="mt-4">
          <NSpace>
            <NButton type="primary" :loading="generating" @click="handleGenerate">
              <template #icon>
                <NIcon><icon-mdi-play /></NIcon>
              </template>
              {{ $t('page.lowcode.codeGeneration.generate') }}
            </NButton>
            <NButton @click="handlePreview">
              <template #icon>
                <NIcon><icon-mdi-eye /></NIcon>
              </template>
              {{ $t('page.lowcode.codeGeneration.preview') }}
            </NButton>
            <NButton @click="handleReset">
              <template #icon>
                <NIcon><icon-mdi-refresh /></NIcon>
              </template>
              {{ $t('common.reset') }}
            </NButton>
          </NSpace>
        </div>
      </NForm>
    </NCard>

    <!-- 生成进度 -->
    <NCard v-if="generationProgress" :title="$t('page.lowcode.codeGeneration.progress')" class="mb-4">
      <div class="space-y-4">
        <div>
          <NText strong>{{ $t('page.lowcode.codeGeneration.status') }}:</NText>
          <NTag :type="getStatusType(generationProgress.status)">
            {{ $t(`page.lowcode.codeGeneration.status.${generationProgress.status.toLowerCase()}`) }}
          </NTag>
        </div>

        <div>
          <NText strong>{{ $t('page.lowcode.codeGeneration.progress') }}:</NText>
          <NProgress
            type="line"
            :percentage="generationProgress.percentage"
            :status="generationProgress.status === 'FAILED' ? 'error' : undefined"
          />
        </div>

        <div>
          <NText strong>{{ $t('page.lowcode.codeGeneration.currentTask') }}:</NText>
          <NText>{{ generationProgress.currentTask }}</NText>
        </div>

        <div>
          <NText strong>{{ $t('page.lowcode.codeGeneration.filesGenerated') }}:</NText>
          <NText>{{ generationProgress.filesGenerated }} / {{ generationProgress.totalFiles }}</NText>
        </div>

        <div v-if="generationProgress.logs.length > 0">
          <NText strong>{{ $t('page.lowcode.codeGeneration.logs') }}:</NText>
          <div class="mt-2 max-h-200px overflow-auto border border-gray-200 rounded p-2">
            <div v-for="(log, index) in generationProgress.logs" :key="index" class="text-sm">
              <NTag :type="getLogTagType(log.level)" size="tiny" class="mr-2">{{ log.level }}</NTag>
              <NText depth="3">{{ log.timestamp }}</NText>
              <NText class="ml-2">{{ log.message }}</NText>
            </div>
          </div>
        </div>
      </div>
    </NCard>

    <!-- 生成结果 -->
    <NCard v-if="generationResult" :title="$t('page.lowcode.codeGeneration.result')" class="mb-4">
      <div class="space-y-4">
        <div>
          <NText strong>{{ $t('page.lowcode.codeGeneration.totalFiles') }}:</NText>
          <NText>{{ generationResult.files.length }}</NText>
        </div>

        <div>
          <NText strong>{{ $t('page.lowcode.codeGeneration.outputPath') }}:</NText>
          <NText code>{{ generationResult.outputPath }}</NText>
        </div>

        <div>
          <NText strong>{{ $t('page.lowcode.codeGeneration.duration') }}:</NText>
          <NText>{{ generationResult.duration }}ms</NText>
        </div>

        <!-- 文件列表 -->
        <div>
          <NText strong>{{ $t('page.lowcode.codeGeneration.fileList') }}:</NText>
          <NDataTable
            :columns="fileColumns"
            :data="generationResult.files"
            size="small"
            max-height="300"
            class="mt-2"
          />
        </div>

        <div class="mt-4">
          <NSpace>
            <NButton type="primary" @click="handleDownload">
              <template #icon>
                <NIcon><icon-mdi-download /></NIcon>
              </template>
              {{ $t('page.lowcode.codeGeneration.download') }}
            </NButton>
            <NButton @click="handleOpenInExplorer">
              <template #icon>
                <NIcon><icon-mdi-folder-open /></NIcon>
              </template>
              {{ $t('page.lowcode.codeGeneration.openInExplorer') }}
            </NButton>
          </NSpace>
        </div>
      </div>
    </NCard>

    <!-- 生成历史 -->
    <NCard :title="$t('page.lowcode.codeGeneration.history')">
      <GenerationHistory :project-id="projectId" />
    </NCard>
  </div>
</template>

<style scoped>
.code-generation {
  @apply space-y-4;
}
</style>
