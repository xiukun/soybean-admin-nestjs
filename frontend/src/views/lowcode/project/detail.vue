<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useLowcodeStore } from '@/store/modules/lowcode';
import { $t } from '@/locales';
import EntityManagement from './modules/entity-management.vue';
import TemplateManagement from './modules/template-management.vue';
import ApiManagement from './modules/api-management.vue';
import CodeGeneration from './modules/code-generation.vue';
import ProjectConfiguration from './modules/project-configuration.vue';

interface Props {
  id: string;
}

const props = defineProps<Props>();

const router = useRouter();
const route = useRoute();
const lowcodeStore = useLowcodeStore();

// State
const loading = ref(false);
const project = ref(null);
const entityCount = ref(0);
const templateCount = ref(0);
const apiCount = ref(0);
const generatedCount = ref(0);

// Computed
const projectId = computed(() => props.id || (route.params.id as string));

// Methods
function getStatusType(status?: string): 'success' | 'warning' | 'error' | 'info' {
  const statusMap: Record<string, 'success' | 'warning' | 'error' | 'info'> = {
    ACTIVE: 'success',
    INACTIVE: 'warning',
    ARCHIVED: 'error'
  };
  return statusMap[status || ''] || 'info';
}

function handleGoBack() {
  router.push('/lowcode/project');
}

function handleEditProject() {
  // 打开编辑项目模态框
  window.$message?.info('编辑项目功能开发中');
}

function handleOpenDesigner() {
  // 打开设计器
  window.$message?.info('设计器功能开发中');
}

function handleProjectUpdate(updatedProject: any) {
  project.value = updatedProject;
}

async function loadProjectDetail() {
  try {
    loading.value = true;

    // Mock data - 在实际实现中，这里会调用API
    const mockProject = {
      id: projectId.value,
      name: 'E-commerce Platform',
      code: 'ecommerce-platform',
      description: 'A comprehensive e-commerce platform with user management, product catalog, and order processing.',
      status: 'ACTIVE',
      config: {
        framework: 'nestjs',
        architecture: 'base-biz',
        language: 'typescript',
        database: 'postgresql',
        version: '1.0.0'
      },
      createdBy: 'admin',
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date().toISOString()
    };

    project.value = mockProject;

    // 加载统计数据
    entityCount.value = 15;
    templateCount.value = 8;
    apiCount.value = 32;
    generatedCount.value = 156;

    // 设置为当前项目
    lowcodeStore.setCurrentProject(projectId.value);
  } catch (error) {
    console.error('Failed to load project detail:', error);
    window.$message?.error($t('page.lowcode.project.loadFailed'));
  } finally {
    loading.value = false;
  }
}

// Lifecycle
onMounted(() => {
  loadProjectDetail();
});
</script>

<template>
  <div class="project-detail">
    <!-- 页面头部 -->
    <div class="page-header mb-6">
      <NSpace justify="space-between" align="center">
        <div>
          <NSpace align="center">
            <NButton quaternary circle @click="handleGoBack">
              <template #icon>
                <NIcon><icon-mdi-arrow-left /></NIcon>
              </template>
            </NButton>
            <div>
              <NText tag="h1" class="text-2xl font-bold">
                {{ project?.name || $t('page.lowcode.project.detail') }}
              </NText>
              <NText depth="3">{{ project?.description || $t('page.lowcode.project.noDescription') }}</NText>
            </div>
          </NSpace>
        </div>
        <NSpace>
          <NButton @click="handleEditProject">
            <template #icon>
              <NIcon><icon-mdi-pencil /></NIcon>
            </template>
            {{ $t('common.edit') }}
          </NButton>
          <NButton type="primary" @click="handleOpenDesigner">
            <template #icon>
              <NIcon><icon-mdi-design /></NIcon>
            </template>
            {{ $t('page.lowcode.project.openDesigner') }}
          </NButton>
        </NSpace>
      </NSpace>
    </div>

    <!-- 项目信息卡片 -->
    <div class="project-info-section mb-6">
      <NCard :title="$t('page.lowcode.project.basicInfo')" size="small">
        <NDescriptions :column="3" bordered>
          <NDescriptionsItem :label="$t('page.lowcode.project.name')">
            {{ project?.name }}
          </NDescriptionsItem>
          <NDescriptionsItem :label="$t('page.lowcode.project.code')">
            {{ project?.code }}
          </NDescriptionsItem>
          <NDescriptionsItem :label="$t('page.lowcode.project.status')">
            <NTag :type="getStatusType(project?.status)">
              {{ $t(`page.lowcode.project.status.${project?.status?.toLowerCase()}`) }}
            </NTag>
          </NDescriptionsItem>
          <NDescriptionsItem :label="$t('page.lowcode.project.framework')">
            {{ project?.config?.framework || '-' }}
          </NDescriptionsItem>
          <NDescriptionsItem :label="$t('page.lowcode.project.architecture')">
            {{ project?.config?.architecture || '-' }}
          </NDescriptionsItem>
          <NDescriptionsItem :label="$t('page.lowcode.project.language')">
            {{ project?.config?.language || '-' }}
          </NDescriptionsItem>
          <NDescriptionsItem :label="$t('page.lowcode.project.database')">
            {{ project?.config?.database || '-' }}
          </NDescriptionsItem>
          <NDescriptionsItem :label="$t('page.lowcode.project.version')">
            {{ project?.config?.version || '-' }}
          </NDescriptionsItem>
          <NDescriptionsItem :label="$t('page.lowcode.project.createdBy')">
            {{ project?.createdBy }}
          </NDescriptionsItem>
        </NDescriptions>
      </NCard>
    </div>

    <!-- 统计信息 -->
    <div class="stats-section mb-6">
      <NGrid :cols="4" :x-gap="16">
        <NGridItem>
          <NCard>
            <NStatistic :label="$t('page.lowcode.project.entities')" :value="entityCount">
              <template #prefix>
                <NIcon color="#18a058"><icon-mdi-database /></NIcon>
              </template>
            </NStatistic>
          </NCard>
        </NGridItem>
        <NGridItem>
          <NCard>
            <NStatistic :label="$t('page.lowcode.project.templates')" :value="templateCount">
              <template #prefix>
                <NIcon color="#2080f0"><icon-mdi-file-code /></NIcon>
              </template>
            </NStatistic>
          </NCard>
        </NGridItem>
        <NGridItem>
          <NCard>
            <NStatistic :label="$t('page.lowcode.project.apis')" :value="apiCount">
              <template #prefix>
                <NIcon color="#f0a020"><icon-mdi-api /></NIcon>
              </template>
            </NStatistic>
          </NCard>
        </NGridItem>
        <NGridItem>
          <NCard>
            <NStatistic :label="$t('page.lowcode.project.generated')" :value="generatedCount">
              <template #prefix>
                <NIcon color="#d03050"><icon-mdi-code-braces /></NIcon>
              </template>
            </NStatistic>
          </NCard>
        </NGridItem>
      </NGrid>
    </div>

    <!-- 主要内容区域 -->
    <div class="main-content">
      <NTabs type="line" animated>
        <!-- 实体管理 -->
        <NTabPane name="entities" :tab="$t('page.lowcode.project.entities')">
          <EntityManagement :project-id="projectId" />
        </NTabPane>

        <!-- 模板管理 -->
        <NTabPane name="templates" :tab="$t('page.lowcode.project.templates')">
          <TemplateManagement :project-id="projectId" />
        </NTabPane>

        <!-- API配置 -->
        <NTabPane name="apis" :tab="$t('page.lowcode.project.apis')">
          <ApiManagement :project-id="projectId" />
        </NTabPane>

        <!-- 代码生成 -->
        <NTabPane name="generation" :tab="$t('page.lowcode.project.codeGeneration')">
          <CodeGeneration :project-id="projectId" />
        </NTabPane>

        <!-- 项目配置 -->
        <NTabPane name="config" :tab="$t('page.lowcode.project.configuration')">
          <ProjectConfiguration :project="project" @update="handleProjectUpdate" />
        </NTabPane>
      </NTabs>
    </div>
  </div>
</template>

<style scoped>
.project-detail {
  @apply p-6;
}

.page-header {
  @apply border-b border-gray-200 pb-4;
}

.stats-section .n-statistic {
  text-align: center;
}
</style>
