<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { NButton, NCard, NIcon, NSpace, NTag, NText } from 'naive-ui';
import { fetchGetAllProjects, fetchGetProjectStats } from '@/service/api/lowcode-project';
import { formatDate } from '@/utils/common';
import { $t } from '@/locales';

const router = useRouter();

// Data
const stats = ref({
  totalProjects: 0,
  activeProjects: 0,
  totalEntities: 0,
  totalTemplates: 0
});

const recentProjects = ref<Api.Lowcode.Project[]>([]);

// Methods
function getStatusType(status: string) {
  switch (status) {
    case 'ACTIVE':
      return 'success';
    case 'INACTIVE':
      return 'warning';
    case 'ARCHIVED':
      return 'default';
    default:
      return 'default';
  }
}

function handleCreateProject() {
  router.push('/lowcode/project');
}

function handleImportProject() {
  router.push('/lowcode/project');
}

function handleViewAllProjects() {
  router.push('/lowcode/project');
}

function handleViewTemplates() {
  router.push('/lowcode/template');
}

function handleViewDocumentation() {
  window.open('https://docs.lowcode.com', '_blank');
}

function handleOpenProject(project: Api.Lowcode.Project) {
  // 这里可以跳转到项目详情页面或项目编辑器
  router.push(`/lowcode/project/${project.id}`);
}

async function loadStats() {
  try {
    const response = await fetchGetProjectStats();
    stats.value = response.data || {
      totalProjects: 0,
      activeProjects: 0,
      totalEntities: 0,
      totalTemplates: 0
    };
  } catch (error) {
    console.error('Failed to load stats:', error);
  }
}

async function loadRecentProjects() {
  try {
    const response = await fetchGetAllProjects();
    // 取最近更新的5个项目
    recentProjects.value = (response.data || [])
      .sort((a, b) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime())
      .slice(0, 6);
  } catch (error) {
    console.error('Failed to load recent projects:', error);
  }
}

// Lifecycle
onMounted(() => {
  loadStats();
  loadRecentProjects();
});
</script>

<template>
  <div class="lowcode-dashboard">
    <!-- Header -->
    <div class="mb-6">
      <NSpace justify="space-between" align="center">
        <div>
          <NText tag="h1" class="text-2xl font-bold">{{ $t('page.lowcode.dashboard.title') }}</NText>
          <NText depth="3">{{ $t('page.lowcode.dashboard.description') }}</NText>
        </div>
        <NSpace>
          <NButton type="primary" @click="handleCreateProject">
            <template #icon>
              <NIcon><icon-mdi-plus /></NIcon>
            </template>
            {{ $t('page.lowcode.project.create') }}
          </NButton>
        </NSpace>
      </NSpace>
    </div>

    <!-- Statistics Cards -->
    <div class="grid grid-cols-1 mb-6 gap-4 lg:grid-cols-4 md:grid-cols-2">
      <NCard>
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <div class="h-12 w-12 flex items-center justify-center rounded-lg bg-blue-100">
              <NIcon size="24" color="#3b82f6">
                <icon-mdi-folder-multiple />
              </NIcon>
            </div>
          </div>
          <div class="ml-4">
            <div class="text-sm text-gray-500 font-medium">{{ $t('page.lowcode.dashboard.totalProjects') }}</div>
            <div class="text-2xl text-gray-900 font-bold">{{ stats.totalProjects }}</div>
          </div>
        </div>
      </NCard>

      <NCard>
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <div class="h-12 w-12 flex items-center justify-center rounded-lg bg-green-100">
              <NIcon size="24" color="#10b981">
                <icon-mdi-check-circle />
              </NIcon>
            </div>
          </div>
          <div class="ml-4">
            <div class="text-sm text-gray-500 font-medium">{{ $t('page.lowcode.dashboard.activeProjects') }}</div>
            <div class="text-2xl text-gray-900 font-bold">{{ stats.activeProjects }}</div>
          </div>
        </div>
      </NCard>

      <NCard>
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <div class="h-12 w-12 flex items-center justify-center rounded-lg bg-yellow-100">
              <NIcon size="24" color="#f59e0b">
                <icon-mdi-layers />
              </NIcon>
            </div>
          </div>
          <div class="ml-4">
            <div class="text-sm text-gray-500 font-medium">{{ $t('page.lowcode.dashboard.totalEntities') }}</div>
            <div class="text-2xl text-gray-900 font-bold">{{ stats.totalEntities }}</div>
          </div>
        </div>
      </NCard>

      <NCard>
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <div class="h-12 w-12 flex items-center justify-center rounded-lg bg-purple-100">
              <NIcon size="24" color="#8b5cf6">
                <icon-mdi-file-code />
              </NIcon>
            </div>
          </div>
          <div class="ml-4">
            <div class="text-sm text-gray-500 font-medium">{{ $t('page.lowcode.dashboard.totalTemplates') }}</div>
            <div class="text-2xl text-gray-900 font-bold">{{ stats.totalTemplates }}</div>
          </div>
        </div>
      </NCard>
    </div>

    <!-- Recent Projects -->
    <NCard class="mb-6">
      <template #header>
        <div class="flex items-center justify-between">
          <NText tag="h2" class="text-lg font-semibold">{{ $t('page.lowcode.dashboard.recentProjects') }}</NText>
          <NButton text @click="handleViewAllProjects">
            {{ $t('page.lowcode.dashboard.viewAll') }}
          </NButton>
        </div>
      </template>

      <div class="grid grid-cols-1 gap-4 lg:grid-cols-3 md:grid-cols-2">
        <NCard
          v-for="project in recentProjects"
          :key="project.id"
          hoverable
          class="cursor-pointer"
          @click="handleOpenProject(project)"
        >
          <div class="space-y-3">
            <div class="flex items-start justify-between">
              <div>
                <NText tag="h3" class="font-medium">{{ project.name }}</NText>
                <NText depth="3" class="text-sm">{{ project.code }}</NText>
              </div>
              <NTag :type="getStatusType(project.status)" size="small">
                {{ $t(`page.lowcode.project.status.${project.status.toLowerCase()}`) }}
              </NTag>
            </div>

            <NText depth="3" class="line-clamp-2 text-sm">
              {{ project.description || $t('page.lowcode.project.noDescription') }}
            </NText>

            <div class="flex items-center justify-between text-xs text-gray-500">
              <span>{{ formatDate(project.updatedAt) }}</span>
              <span>{{ project.createdBy }}</span>
            </div>
          </div>
        </NCard>
      </div>
    </NCard>

    <!-- Quick Actions -->
    <NCard>
      <template #header>
        <NText tag="h2" class="text-lg font-semibold">{{ $t('page.lowcode.dashboard.quickActions') }}</NText>
      </template>

      <div class="grid grid-cols-1 gap-4 lg:grid-cols-4 md:grid-cols-2">
        <NButton size="large" class="h-20 flex flex-col items-center justify-center" @click="handleCreateProject">
          <NIcon size="24" class="mb-2">
            <icon-mdi-plus />
          </NIcon>
          {{ $t('page.lowcode.project.create') }}
        </NButton>

        <NButton size="large" class="h-20 flex flex-col items-center justify-center" @click="handleImportProject">
          <NIcon size="24" class="mb-2">
            <icon-mdi-import />
          </NIcon>
          {{ $t('page.lowcode.project.import') }}
        </NButton>

        <NButton size="large" class="h-20 flex flex-col items-center justify-center" @click="handleViewTemplates">
          <NIcon size="24" class="mb-2">
            <icon-mdi-file-code />
          </NIcon>
          {{ $t('page.lowcode.template.management') }}
        </NButton>

        <NButton size="large" class="h-20 flex flex-col items-center justify-center" @click="handleViewDocumentation">
          <NIcon size="24" class="mb-2">
            <icon-mdi-book-open />
          </NIcon>
          {{ $t('page.lowcode.dashboard.documentation') }}
        </NButton>
      </div>
    </NCard>
  </div>
</template>

<style scoped>
.lowcode-dashboard {
  padding: 16px;
}

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
