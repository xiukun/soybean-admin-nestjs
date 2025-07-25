<template>
  <NCard class="project-card" hoverable>
    <!-- 卡片头部 -->
    <template #header>
      <div class="card-header">
        <div class="project-info">
          <NText class="project-name" strong>{{ project.name }}</NText>
          <NText class="project-code" depth="3">{{ project.code }}</NText>
        </div>
        <div class="project-status">
          <NTag :type="statusType" size="small">{{ statusText }}</NTag>
        </div>
      </div>
    </template>

    <!-- 卡片内容 -->
    <div class="card-content">
      <!-- 项目描述 -->
      <div class="project-description mb-3">
        <NText depth="2">{{ project.description || $t('page.lowcode.project.noDescription') }}</NText>
      </div>

      <!-- 项目统计 -->
      <div class="project-stats mb-4">
        <NGrid :cols="2" :x-gap="8" :y-gap="8">
          <NGridItem>
            <div class="stat-item">
              <NIcon class="stat-icon" color="#2080f0"><icon-mdi-database /></NIcon>
              <div class="stat-content">
                <NText class="stat-value">{{ project.entityCount || 0 }}</NText>
                <NText class="stat-label" depth="3">{{ $t('page.lowcode.project.entities') }}</NText>
              </div>
            </div>
          </NGridItem>
          <NGridItem>
            <div class="stat-item">
              <NIcon class="stat-icon" color="#18a058"><icon-mdi-relation-many-to-many /></NIcon>
              <div class="stat-content">
                <NText class="stat-value">{{ project.relationshipCount || 0 }}</NText>
                <NText class="stat-label" depth="3">{{ $t('page.lowcode.project.relationships') }}</NText>
              </div>
            </div>
          </NGridItem>
          <NGridItem>
            <div class="stat-item">
              <NIcon class="stat-icon" color="#f0a020"><icon-mdi-code-braces /></NIcon>
              <div class="stat-content">
                <NText class="stat-value">{{ project.generatedFiles || 0 }}</NText>
                <NText class="stat-label" depth="3">{{ $t('page.lowcode.project.generatedFiles') }}</NText>
              </div>
            </div>
          </NGridItem>
          <NGridItem>
            <div class="stat-item">
              <NIcon class="stat-icon" color="#d03050"><icon-mdi-clock-outline /></NIcon>
              <div class="stat-content">
                <NText class="stat-value">{{ lastUpdated }}</NText>
                <NText class="stat-label" depth="3">{{ $t('page.lowcode.project.lastUpdated') }}</NText>
              </div>
            </div>
          </NGridItem>
        </NGrid>
      </div>

      <!-- 项目技术栈 -->
      <div class="project-tech mb-4" v-if="project.config?.techStack">
        <NText class="tech-label" depth="3">{{ $t('page.lowcode.project.techStack') }}:</NText>
        <NSpace class="tech-tags" size="small">
          <NTag 
            v-for="tech in project.config.techStack" 
            :key="tech" 
            size="small" 
            type="info"
          >
            {{ tech }}
          </NTag>
        </NSpace>
      </div>

      <!-- 项目进度 -->
      <div class="project-progress mb-4">
        <div class="progress-header mb-2">
          <NText depth="3">{{ $t('page.lowcode.project.progress') }}</NText>
          <NText class="progress-value">{{ progressPercentage }}%</NText>
        </div>
        <NProgress 
          :percentage="progressPercentage" 
          :color="progressColor"
          :show-indicator="false"
        />
      </div>
    </div>

    <!-- 卡片操作 -->
    <template #action>
      <div class="card-actions">
        <NSpace justify="space-between">
          <!-- 主要操作 -->
          <NSpace size="small">
            <NTooltip>
              <template #trigger>
                <NButton 
                  type="primary" 
                  size="small" 
                  @click="$emit('design', project)"
                >
                  <template #icon>
                    <NIcon><icon-mdi-database-edit /></NIcon>
                  </template>
                  {{ $t('page.lowcode.project.design') }}
                </NButton>
              </template>
              {{ $t('page.lowcode.project.designEntities') }}
            </NTooltip>
            
            <NTooltip>
              <template #trigger>
                <NButton 
                  type="info" 
                  size="small" 
                  @click="$emit('generate', project)"
                >
                  <template #icon>
                    <NIcon><icon-mdi-code-braces /></NIcon>
                  </template>
                  {{ $t('page.lowcode.project.generate') }}
                </NButton>
              </template>
              {{ $t('page.lowcode.project.generateCode') }}
            </NTooltip>
          </NSpace>

          <!-- 更多操作 -->
          <NDropdown :options="moreActions" @select="handleMoreAction">
            <NButton size="small" quaternary>
              <template #icon>
                <NIcon><icon-mdi-dots-vertical /></NIcon>
              </template>
            </NButton>
          </NDropdown>
        </NSpace>
      </div>
    </template>

    <!-- 项目封面/预览 -->
    <div v-if="project.preview" class="project-preview">
      <NImage 
        :src="project.preview" 
        :alt="project.name"
        object-fit="cover"
        height="120"
        preview-disabled
      />
    </div>
  </NCard>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { NIcon } from 'naive-ui';
import { $t } from '@/locales';

defineOptions({
  name: 'ProjectCard'
});

interface Props {
  project: {
    id: string;
    name: string;
    code: string;
    description?: string;
    status: 'active' | 'inactive' | 'archived';
    entityCount?: number;
    relationshipCount?: number;
    generatedFiles?: number;
    updatedAt: string;
    config?: {
      techStack?: string[];
    };
    preview?: string;
  };
}

interface Emits {
  (e: 'edit', project: any): void;
  (e: 'delete', project: any): void;
  (e: 'configure', project: any): void;
  (e: 'design', project: any): void;
  (e: 'generate', project: any): void;
  (e: 'view', project: any): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

// 计算属性
const statusType = computed(() => {
  const statusMap = {
    active: 'success',
    inactive: 'warning',
    archived: 'error'
  };
  return statusMap[props.project.status] || 'default';
});

const statusText = computed(() => {
  const statusMap = {
    active: $t('page.lowcode.project.status.active'),
    inactive: $t('page.lowcode.project.status.inactive'),
    archived: $t('page.lowcode.project.status.archived')
  };
  return statusMap[props.project.status] || '';
});

const lastUpdated = computed(() => {
  const date = new Date(props.project.updatedAt);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - date.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 1) {
    return $t('page.lowcode.project.yesterday');
  } else if (diffDays < 7) {
    return $t('page.lowcode.project.daysAgo', { days: diffDays });
  } else {
    return date.toLocaleDateString();
  }
});

const progressPercentage = computed(() => {
  const { entityCount = 0, relationshipCount = 0, generatedFiles = 0 } = props.project;
  
  // 简单的进度计算逻辑
  let progress = 0;
  if (entityCount > 0) progress += 30;
  if (relationshipCount > 0) progress += 20;
  if (generatedFiles > 0) progress += 50;
  
  return Math.min(progress, 100);
});

const progressColor = computed(() => {
  const percentage = progressPercentage.value;
  if (percentage < 30) return '#f56c6c';
  if (percentage < 70) return '#e6a23c';
  return '#67c23a';
});

// 更多操作菜单
const moreActions = computed(() => [
  {
    label: $t('page.lowcode.project.configure'),
    key: 'configure',
    icon: () => <NIcon><icon-mdi-cog /></NIcon>
  },
  {
    label: $t('page.lowcode.project.view'),
    key: 'view',
    icon: () => <NIcon><icon-mdi-eye /></NIcon>
  },
  {
    label: $t('common.edit'),
    key: 'edit',
    icon: () => <NIcon><icon-mdi-pencil /></NIcon>
  },
  {
    type: 'divider',
    key: 'divider'
  },
  {
    label: $t('page.lowcode.project.export'),
    key: 'export',
    icon: () => <NIcon><icon-mdi-export /></NIcon>
  },
  {
    label: $t('page.lowcode.project.duplicate'),
    key: 'duplicate',
    icon: () => <NIcon><icon-mdi-content-copy /></NIcon>
  },
  {
    type: 'divider',
    key: 'divider2'
  },
  {
    label: $t('common.delete'),
    key: 'delete',
    icon: () => <NIcon><icon-mdi-delete /></NIcon>,
    props: {
      style: 'color: #d03050'
    }
  }
]);

// 处理更多操作
const handleMoreAction = (key: string) => {
  switch (key) {
    case 'configure':
      emit('configure', props.project);
      break;
    case 'view':
      emit('view', props.project);
      break;
    case 'edit':
      emit('edit', props.project);
      break;
    case 'delete':
      emit('delete', props.project);
      break;
    case 'export':
      // TODO: 实现导出功能
      break;
    case 'duplicate':
      // TODO: 实现复制功能
      break;
  }
};
</script>

<style scoped>
.project-card {
  height: 100%;
  transition: all 0.3s ease;
}

.project-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.project-info {
  flex: 1;
}

.project-name {
  font-size: 16px;
  line-height: 1.4;
  margin-bottom: 4px;
  display: block;
}

.project-code {
  font-size: 12px;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
}

.project-status {
  margin-left: 12px;
}

.card-content {
  padding: 0;
}

.project-description {
  font-size: 14px;
  line-height: 1.5;
  max-height: 3em;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.project-stats {
  background: #fafafa;
  padding: 12px;
  border-radius: 6px;
  margin: 0 -16px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.stat-icon {
  font-size: 16px;
  flex-shrink: 0;
}

.stat-content {
  flex: 1;
  min-width: 0;
}

.stat-value {
  font-size: 14px;
  font-weight: 600;
  display: block;
  line-height: 1.2;
}

.stat-label {
  font-size: 11px;
  line-height: 1.2;
  display: block;
}

.project-tech {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.tech-label {
  font-size: 12px;
  flex-shrink: 0;
}

.tech-tags {
  flex: 1;
}

.project-progress {
  margin: 0 -16px;
  padding: 0 16px;
}

.progress-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.progress-value {
  font-size: 12px;
  font-weight: 600;
}

.card-actions {
  margin: 0 -16px -16px -16px;
  padding: 12px 16px;
  background: #fafafa;
  border-top: 1px solid #f0f0f0;
}

.project-preview {
  margin: 16px -16px -16px -16px;
  border-radius: 0 0 6px 6px;
  overflow: hidden;
}
</style>
