<script setup lang="ts">
import { computed, h } from 'vue';
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
    status: 'ACTIVE' | 'INACTIVE' | 'ARCHIVED' | 'active' | 'inactive' | 'archived';
    deploymentStatus?: 'INACTIVE' | 'DEPLOYING' | 'DEPLOYED' | 'FAILED';
    deploymentPort?: number;
    lastDeployedAt?: string;
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
  (e: 'deploy', project: any): void;
  (e: 'stop-deployment', project: any): void;
  (e: 'relationship', project: any): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

// 计算属性
const statusType = computed<'success' | 'warning' | 'error' | 'info' | 'default'>(() => {
  const statusMap: Record<string, 'success' | 'warning' | 'error' | 'info' | 'default'> = {
    ACTIVE: 'success',
    INACTIVE: 'warning', 
    ARCHIVED: 'error',
    active: 'success',
    inactive: 'warning',
    archived: 'error'
  };
  return statusMap[props.project.status] || 'default';
});

const statusText = computed(() => {
  const statusMap: Record<string, string> = {
    ACTIVE: '活跃',
    INACTIVE: '非活跃',
    ARCHIVED: '已归档',
    active: '活跃',
    inactive: '非活跃',
    archived: '已归档'
  };
  return statusMap[props.project.status] || '未知状态';
});

// 调试：打印项目数据
console.log('Project data:', props.project);
console.log('Status type:', statusType.value);
console.log('Status text:', statusText.value);

const lastUpdated = computed(() => {
  if (!props.project?.updatedAt) return '-';
  
  try {
    const now = new Date();
    const updateTime = new Date(props.project.updatedAt);
    
    // 检查日期是否有效
    if (isNaN(updateTime.getTime())) {
      return '-';
    }
    
    const diffMs = now.getTime() - updateTime.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) {
      return '刚刚更新';
    } else if (diffMins < 60) {
      return `${diffMins}分钟前更新`;
    } else if (diffHours < 24) {
      return `${diffHours}小时前更新`;
    } else if (diffDays < 7) {
      return `${diffDays}天前更新`;
    } else {
      return updateTime.toLocaleDateString('zh-CN');
    }
  } catch (error) {
    console.warn('Error parsing date:', error);
    return '-';
  }
});

const progressPercentage = computed(() => {
  if (!props.project) return 0;
  
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

// 部署状态相关计算属性
const deploymentStatusType = computed<'success' | 'warning' | 'error' | 'info' | 'default'>(() => {
  const statusMap: Record<string, 'success' | 'warning' | 'error' | 'info' | 'default'> = {
    INACTIVE: 'default',
    DEPLOYING: 'warning',
    DEPLOYED: 'success',
    FAILED: 'error'
  };
  return statusMap[props.project.deploymentStatus || 'INACTIVE'];
});

const deploymentStatusText = computed(() => {
  const statusMap = {
    INACTIVE: '未部署',
    DEPLOYING: '部署中',
    DEPLOYED: '已部署',
    FAILED: '部署失败'
  };
  return statusMap[props.project.deploymentStatus || 'INACTIVE'];
});

const lastDeployedTime = computed(() => {
  if (!props.project?.lastDeployedAt) return '';
  
  try {
    const date = new Date(props.project.lastDeployedAt);
    if (isNaN(date.getTime())) {
      return '';
    }
    return date.toLocaleString();
  } catch (error) {
    console.warn('Error parsing deployment date:', error);
    return '';
  }
});

const isDeploying = computed(() => {
  return props.project.deploymentStatus === 'DEPLOYING';
});

const canDeploy = computed(() => {
  const activeStatus = props.project.status === 'active' || props.project.status === 'ACTIVE';
  const canDeployStatus = props.project.deploymentStatus === 'INACTIVE' || props.project.deploymentStatus === 'FAILED';
  return activeStatus && canDeployStatus;
});

const canStopDeployment = computed(() => {
  return props.project.deploymentStatus === 'DEPLOYING' || props.project.deploymentStatus === 'DEPLOYED';
});

// 更多操作菜单
const moreActions = computed(() => [
  {
    label: $t('page.lowcode.project.configure'),
    key: 'configure',
    icon: () => h(NIcon, null, { default: () => h('icon-mdi-cog') })
  },
  {
    label: $t('page.lowcode.project.view'),
    key: 'view',
    icon: () => h(NIcon, null, { default: () => h('icon-mdi-eye') })
  },
  {
    label: $t('common.edit'),
    key: 'edit',
    icon: () => h(NIcon, null, { default: () => h('icon-mdi-pencil') })
  },
  {
    type: 'divider',
    key: 'divider'
  },
  {
    label: $t('page.lowcode.project.export'),
    key: 'export',
    icon: () => h(NIcon, null, { default: () => h('icon-mdi-export') })
  },
  {
    label: $t('page.lowcode.project.duplicate'),
    key: 'duplicate',
    icon: () => h(NIcon, null, { default: () => h('icon-mdi-content-copy') })
  },
  {
    type: 'divider',
    key: 'divider2'
  },
  {
    label: $t('common.delete'),
    key: 'delete',
    icon: () => h(NIcon, null, { default: () => h('icon-mdi-delete') }),
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

<template>
  <NCard class="project-card" hoverable>
    <!-- 卡片头部 -->
    <template #header>
      <div class="card-header">
        <div class="project-info">
          <NText class="project-name" strong>{{ project?.name || '未命名项目' }}</NText>
          <NText class="project-code" depth="3">{{ project?.code || '无代码' }}</NText>
        </div>
        <div class="header-actions">
          <div class="project-status">
            <NTag :type="statusType" size="small">{{ statusText }}</NTag>
          </div>
          <!-- 更多操作 - 移动到头部右上角 -->
          <NDropdown :options="moreActions" @select="handleMoreAction">
            <NButton size="small" quaternary circle>
              <template #icon>
                <NIcon><icon-mdi-dots-vertical /></NIcon>
              </template>
            </NButton>
          </NDropdown>
        </div>
      </div>
    </template>

    <!-- 卡片内容 -->
    <div class="card-content">
      <!-- 项目描述 -->
      <div class="project-description mb-3">
        <NText depth="2">{{ project?.description || '暂无描述' }}</NText>
      </div>

      <!-- 项目统计 -->
      <div class="project-stats mb-4">
        <NGrid :cols="2" :x-gap="8" :y-gap="8">
          <NGridItem>
            <div class="stat-item">
              <NIcon class="stat-icon" color="#2080f0"><icon-mdi-database /></NIcon>
              <div class="stat-content">
                <NText class="stat-value">{{ project.entityCount || 0 }}</NText>
                <NText class="stat-label" depth="3">实体</NText>
              </div>
            </div>
          </NGridItem>
          <NGridItem>
            <div class="stat-item">
              <NIcon class="stat-icon" color="#18a058"><icon-mdi-relation-many-to-many /></NIcon>
              <div class="stat-content">
                <NText class="stat-value">{{ project.relationshipCount || 0 }}</NText>
                <NText class="stat-label" depth="3">关系</NText>
              </div>
            </div>
          </NGridItem>
          <NGridItem>
            <div class="stat-item">
              <NIcon class="stat-icon" color="#f0a020"><icon-mdi-code-braces /></NIcon>
              <div class="stat-content">
                <NText class="stat-value">{{ project.generatedFiles || 0 }}</NText>
                <NText class="stat-label" depth="3">生成文件</NText>
              </div>
            </div>
          </NGridItem>
          <NGridItem>
            <div class="stat-item">
              <NIcon class="stat-icon" color="#d03050"><icon-mdi-clock-outline /></NIcon>
              <div class="stat-content">
                <NText class="stat-value">{{ lastUpdated }}</NText>
                <NText class="stat-label" depth="3">最后更新</NText>
              </div>
            </div>
          </NGridItem>
        </NGrid>
      </div>

      <!-- 项目技术栈 -->
      <div v-if="project.config?.techStack" class="project-tech mb-4">
        <NText class="tech-label" depth="3">{{ $t('page.lowcode.project.techStack') }}:</NText>
        <NSpace class="tech-tags" size="small">
          <NTag v-for="tech in project.config.techStack" :key="tech" size="small" type="info">
            {{ tech }}
          </NTag>
        </NSpace>
      </div>

      <!-- 部署状态 -->
      <div class="deployment-status mb-4">
        <div class="deployment-header mb-2">
          <div class="deployment-title">
            <NIcon class="deployment-icon" :color="deploymentStatusType === 'success' ? '#18a058' : deploymentStatusType === 'warning' ? '#f0a020' : '#d03050'">
              <icon-mdi-rocket-launch />
            </NIcon>
            <NText depth="3">{{ $t('page.lowcode.project.deploymentStatusLabel') }}</NText>
          </div>
          <NTag :type="deploymentStatusType" size="small" :loading="isDeploying">
            {{ deploymentStatusText }}
          </NTag>
        </div>
        <div v-if="project.deploymentPort" class="deployment-info">
          <NIcon class="info-icon" size="12"><icon-mdi-lan /></NIcon>
          <NText depth="3" class="mr-2">{{ $t('page.lowcode.project.port') }}:</NText>
          <NText>{{ project.deploymentPort }}</NText>
        </div>
        <div v-if="project.lastDeployedAt" class="deployment-info">
          <NIcon class="info-icon" size="12"><icon-mdi-clock-outline /></NIcon>
          <NText depth="3" class="mr-2">{{ $t('page.lowcode.project.lastDeployed') }}:</NText>
          <NText>{{ lastDeployedTime }}</NText>
        </div>
      </div>

      <!-- 项目进度 -->
      <div class="project-progress mb-4">
        <div class="progress-header mb-2">
          <NText depth="3">{{ $t('page.lowcode.project.progress') }}</NText>
          <NText class="progress-value">{{ progressPercentage }}%</NText>
        </div>
        <NProgress :percentage="progressPercentage" :color="progressColor" :show-indicator="false" />
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
                <NButton type="primary" size="small" @click="$emit('design', project)">
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
                <NButton type="info" size="small" @click="$emit('generate', project)">
                  <template #icon>
                    <NIcon><icon-mdi-code-braces /></NIcon>
                  </template>
                  {{ $t('page.lowcode.project.generate') }}
                </NButton>
              </template>
              {{ $t('page.lowcode.project.generateCode') }}
            </NTooltip>

            <!-- 关系管理按钮 -->
            <NTooltip>
              <template #trigger>
                <NButton type="warning" size="small" @click="$emit('relationship', project)">
                  <template #icon>
                    <NIcon><icon-mdi-relation-many-to-many /></NIcon>
                  </template>
                  {{ $t('page.lowcode.project.relationship') }}
                </NButton>
              </template>
              {{ $t('page.lowcode.project.viewRelationships') }}
            </NTooltip>

            <!-- 部署按钮 -->
            <NTooltip v-if="canDeploy">
              <template #trigger>
                <NButton type="success" size="small" :loading="isDeploying" @click="$emit('deploy', project)">
                  <template #icon>
                    <NIcon><icon-mdi-rocket-launch /></NIcon>
                  </template>
                  {{ $t('page.lowcode.project.deploy') }}
                </NButton>
              </template>
              {{ $t('page.lowcode.project.deployProject') }}
            </NTooltip>

            <!-- 停止部署按钮 -->
            <NTooltip v-if="canStopDeployment">
              <template #trigger>
                <NButton type="error" size="small" @click="$emit('stop-deployment', project)">
                  <template #icon>
                    <NIcon><icon-mdi-stop /></NIcon>
                  </template>
                  {{ $t('page.lowcode.project.stopDeployment') }}
                </NButton>
              </template>
              {{ $t('page.lowcode.project.stopProjectDeployment') }}
            </NTooltip>
          </NSpace>

          <!-- 快速访问按钮 -->
          <NTooltip>
            <template #trigger>
              <NButton type="info" size="small" @click="$emit('view', project)">
                <template #icon>
                  <NIcon><icon-mdi-eye /></NIcon>
                </template>
                {{ $t('common.view') }}
              </NButton>
            </template>
            {{ $t('page.lowcode.project.viewProject') }}
          </NTooltip>
        </NSpace>
      </div>
    </template>

    <!-- 项目封面/预览 -->
    <div v-if="project.preview" class="project-preview">
      <NImage :src="project.preview" :alt="project.name" object-fit="cover" height="120" preview-disabled />
    </div>
  </NCard>
</template>

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
  min-width: 0;
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

.header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: 12px;
}

.project-status {
  flex-shrink: 0;
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

.deployment-status {
  border: 1px solid #e0e0e6;
  border-radius: 6px;
  padding: 12px;
  background: #fafafa;
}

.deployment-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.deployment-title {
  display: flex;
  align-items: center;
  gap: 6px;
}

.deployment-icon {
  font-size: 14px;
}

.deployment-info {
  display: flex;
  align-items: center;
  font-size: 12px;
  margin-bottom: 4px;
  gap: 4px;
}

.deployment-info:last-child {
  margin-bottom: 0;
}

.info-icon {
  color: #999;
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
