<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { NAlert, NButton, NEmpty, NIcon, NNotificationProvider, NResult, NSpin, useNotification } from 'naive-ui';
import { Information as InfoIcon } from '@vicons/ionicons5';

interface Props {
  loading?: boolean;
  error?: Error | null;
  isEmpty?: boolean;
  itemCount?: number;
  loadingText?: string;
  errorTitle?: string;
  errorDescription?: string;
  emptyDescription?: string;
  createButtonText?: string;
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  error: null,
  isEmpty: false,
  itemCount: 0,
  loadingText: '正在加载项目数据...',
  errorTitle: '加载失败',
  errorDescription: '无法加载项目数据，请检查网络连接',
  emptyDescription: '暂无项目数据',
  createButtonText: '创建项目'
});

const emit = defineEmits<{
  retry: [];
  create: [];
}>();

const showPerformanceTip = ref(false);
const notification = useNotification();

// 计算属性
const shouldShowPerformanceTip = computed(() => {
  return props.itemCount > 100 && !showPerformanceTip.value;
});

// 方法
const handleRetry = () => {
  emit('retry');
};

const handleCreate = () => {
  emit('create');
};

const hidePerformanceTip = () => {
  showPerformanceTip.value = false;
  localStorage.setItem('hidePerformanceTip', 'true');
};

const showSuccessNotification = (message: string) => {
  notification.success({
    title: '操作成功',
    content: message,
    duration: 3000
  });
};

const showErrorNotification = (message: string) => {
  notification.error({
    title: '操作失败',
    content: message,
    duration: 5000
  });
};

// 生命周期
onMounted(() => {
  const hidePerformanceTipSetting = localStorage.getItem('hidePerformanceTip');
  if (!hidePerformanceTipSetting && shouldShowPerformanceTip.value) {
    setTimeout(() => {
      showPerformanceTip.value = true;
    }, 2000);
  }
});

// 暴露方法给父组件
defineExpose({
  showSuccessNotification,
  showErrorNotification
});
</script>

<template>
  <div class="ux-optimizations">
    <!-- 加载状态优化 -->
    <div v-if="loading" class="loading-container">
      <NSpin size="large">
        <template #description>
          <div class="loading-text">
            {{ loadingText }}
          </div>
        </template>
      </NSpin>
    </div>

    <!-- 错误状态优化 -->
    <div v-else-if="error" class="error-container">
      <NResult status="error" :title="errorTitle" :description="errorDescription">
        <template #footer>
          <NButton type="primary" @click="handleRetry">重试</NButton>
        </template>
      </NResult>
    </div>

    <!-- 空状态优化 -->
    <div v-else-if="isEmpty" class="empty-container">
      <NEmpty :description="emptyDescription">
        <template #extra>
          <NButton type="primary" @click="handleCreate">
            {{ createButtonText }}
          </NButton>
        </template>
      </NEmpty>
    </div>

    <!-- 内容区域 -->
    <div v-else class="content-container">
      <slot />
    </div>

    <!-- 性能提示 -->
    <div v-if="showPerformanceTip" class="performance-tip">
      <NAlert type="info" closable @close="hidePerformanceTip">
        <template #header>
          <NIcon :component="InfoIcon" />
          性能提示
        </template>
        当前显示 {{ itemCount }} 个项目，使用虚拟滚动优化性能
      </NAlert>
    </div>

    <!-- 操作反馈 -->
    <NNotificationProvider>
      <div ref="notificationRef" />
    </NNotificationProvider>
  </div>
</template>

<style scoped>
.ux-optimizations {
  position: relative;
  min-height: 200px;
}

.loading-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 300px;
}

.loading-text {
  margin-top: 16px;
  color: #666;
  font-size: 14px;
}

.error-container,
.empty-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 300px;
}

.content-container {
  position: relative;
}

.performance-tip {
  position: fixed;
  top: 80px;
  right: 20px;
  z-index: 1000;
  max-width: 300px;
}

@media (max-width: 768px) {
  .performance-tip {
    position: relative;
    top: auto;
    right: auto;
    margin: 16px 0;
    max-width: none;
  }
}
</style>
