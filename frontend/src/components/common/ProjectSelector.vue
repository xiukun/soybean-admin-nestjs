<script setup lang="ts">
import { computed, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useLowcodeStore } from '@/store/modules/lowcode';
import { formatDate } from '@/utils/common';
import { $t } from '@/locales';

interface Props {
  disabled?: boolean;
  showQuickActions?: boolean;
  autoLoad?: boolean;
}

interface Emits {
  (e: 'change', projectId: string | null): void;
  (e: 'create'): void;
  (e: 'settings', projectId: string): void;
  (e: 'stats', projectId: string): void;
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
  showQuickActions: true,
  autoLoad: true
});

const emit = defineEmits<Emits>();

const router = useRouter();
const lowcodeStore = useLowcodeStore();

// Computed
const selectedProjectId = computed({
  get: () => lowcodeStore.currentProjectId,
  set: (value: string) => {
    if (value) {
      lowcodeStore.setCurrentProject(value);
    } else {
      lowcodeStore.clearCurrentProject();
    }
  }
});

const currentProject = computed(() => lowcodeStore.currentProject);
const loading = computed(() => lowcodeStore.loading.projects);

const projectOptions = computed(() =>
  lowcodeStore.activeProjects.map(project => ({
    label: project.name,
    value: project.id,
    disabled: project.status !== 'ACTIVE'
  }))
);

// Methods
function getProjectStatusType(status: string): 'success' | 'warning' | 'error' | 'info' {
  const statusMap: Record<string, 'success' | 'warning' | 'error' | 'info'> = {
    ACTIVE: 'success',
    INACTIVE: 'warning',
    ARCHIVED: 'error'
  };
  return statusMap[status] || 'info';
}

async function handleProjectChange(projectId: string | null) {
  try {
    if (projectId) {
      await lowcodeStore.setCurrentProject(projectId);
      window.$message?.success($t('common.projectSwitched', { name: currentProject.value?.name }));
    } else {
      lowcodeStore.clearCurrentProject();
    }
    emit('change', projectId);
  } catch (error) {
    console.error('Failed to change project:', error);
    window.$message?.error($t('common.projectSwitchFailed'));
  }
}

function handleCreateProject() {
  emit('create');
  // Navigate to project creation page
  router.push('/lowcode/project');
}

async function handleRefreshProject() {
  if (!currentProject.value) return;

  try {
    await Promise.all([
      lowcodeStore.loadProjectEntities(currentProject.value.id),
      lowcodeStore.loadProjectTemplates(currentProject.value.id),
      lowcodeStore.loadGenerationHistory(currentProject.value.id)
    ]);
    window.$message?.success($t('common.refreshed'));
  } catch (error) {
    console.error('Failed to refresh project:', error);
    window.$message?.error($t('common.refreshFailed'));
  }
}

function handleProjectSettings() {
  if (!currentProject.value) return;

  emit('settings', currentProject.value.id);
  // Navigate to project settings
  router.push(`/lowcode/project?id=${currentProject.value.id}&action=edit`);
}

function handleProjectStats() {
  if (!currentProject.value) return;

  emit('stats', currentProject.value.id);
  // Navigate to project statistics
  router.push(`/lowcode/project/stats?id=${currentProject.value.id}`);
}

// Lifecycle
onMounted(async () => {
  if (props.autoLoad) {
    try {
      await lowcodeStore.loadProjects();

      // Try to restore from localStorage
      const savedProjectId = lowcodeStore.initializeFromStorage();
      if (savedProjectId && lowcodeStore.projects.some(p => p.id === savedProjectId)) {
        await lowcodeStore.setCurrentProject(savedProjectId);
      }
    } catch (error) {
      console.error('Failed to initialize project selector:', error);
    }
  }
});

// Watch for external project changes
watch(
  () => lowcodeStore.currentProjectId,
  (newProjectId, oldProjectId) => {
    if (newProjectId !== oldProjectId) {
      emit('change', newProjectId || null);
    }
  }
);
</script>

<template>
  <div class="project-selector">
    <NSpace align="center" :size="12">
      <NIcon size="18" class="text-primary">
        <icon-mdi-folder-outline />
      </NIcon>
      <NText strong>{{ $t('common.project') }}:</NText>
      <NSelect
        v-model:value="selectedProjectId"
        :placeholder="$t('common.selectProject')"
        :options="projectOptions"
        :loading="loading"
        :disabled="disabled"
        style="min-width: 200px"
        clearable
        filterable
        @update:value="handleProjectChange"
      >
        <template #empty>
          <NEmpty :description="$t('common.noProjects')" size="small">
            <template #extra>
              <NButton size="small" @click="handleCreateProject">
                {{ $t('common.createProject') }}
              </NButton>
            </template>
          </NEmpty>
        </template>
      </NSelect>

      <!-- Project Info -->
      <template v-if="currentProject">
        <NDivider vertical />
        <NSpace align="center" :size="8">
          <NTag :type="getProjectStatusType(currentProject.status)" size="small">
            {{ $t(`common.projectStatus.${currentProject.status.toLowerCase()}`) }}
          </NTag>
          <NTooltip>
            <template #trigger>
              <NIcon size="16" class="cursor-help text-gray-400">
                <icon-mdi-information-outline />
              </NIcon>
            </template>
            <div class="max-w-300px">
              <div>
                <strong>{{ $t('common.projectName') }}:</strong>
                {{ currentProject.name }}
              </div>
              <div>
                <strong>{{ $t('common.projectCode') }}:</strong>
                {{ currentProject.code }}
              </div>
              <div v-if="currentProject.description">
                <strong>{{ $t('common.description') }}:</strong>
                {{ currentProject.description }}
              </div>
              <div>
                <strong>{{ $t('common.createdAt') }}:</strong>
                {{ formatDate(currentProject.createdAt) }}
              </div>
            </div>
          </NTooltip>
        </NSpace>
      </template>

      <!-- Quick Actions -->
      <template v-if="showQuickActions && currentProject">
        <NDivider vertical />
        <NSpace :size="4">
          <NTooltip>
            <template #trigger>
              <NButton size="small" quaternary circle @click="handleRefreshProject">
                <template #icon>
                  <NIcon><icon-mdi-refresh /></NIcon>
                </template>
              </NButton>
            </template>
            {{ $t('common.refresh') }}
          </NTooltip>

          <NTooltip>
            <template #trigger>
              <NButton size="small" quaternary circle @click="handleProjectSettings">
                <template #icon>
                  <NIcon><icon-mdi-cog /></NIcon>
                </template>
              </NButton>
            </template>
            {{ $t('common.projectSettings') }}
          </NTooltip>

          <NTooltip>
            <template #trigger>
              <NButton size="small" quaternary circle @click="handleProjectStats">
                <template #icon>
                  <NIcon><icon-mdi-chart-line /></NIcon>
                </template>
              </NButton>
            </template>
            {{ $t('common.projectStats') }}
          </NTooltip>
        </NSpace>
      </template>
    </NSpace>
  </div>
</template>

<style scoped>
.project-selector {
  @apply flex items-center;
}

.project-selector :deep(.n-base-selection) {
  --n-border-radius: 6px;
}

.project-selector :deep(.n-base-selection-label) {
  font-weight: 500;
}
</style>
