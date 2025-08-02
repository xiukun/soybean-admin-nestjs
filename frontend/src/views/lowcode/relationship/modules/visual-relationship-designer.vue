<template>
  <div class="visual-relationship-designer">
    <!-- 使用X6关系图设计器组件 -->
    <div v-if="projectId && !error">
      <X6RelationshipDesigner 
        :project-id="projectId" 
        @relationship-updated="$emit('relationshipUpdated')"
        @error="handleError"
      />
    </div>
    <div v-else-if="error" class="flex flex-col items-center justify-center h-full">
      <n-alert type="error" :title="t('page.lowcode.common.messages.error')" class="mb-4">
        {{ errorMessage }}
      </n-alert>
      <n-button @click="retryLoading">{{ t('page.lowcode.common.actions.retry') }}</n-button>
    </div>
    <div v-else class="flex items-center justify-center h-full text-gray-500">
      {{ t('page.lowcode.template.selectProject') }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick } from 'vue';
import { NAlert, NButton } from 'naive-ui';
import X6RelationshipDesigner from './x6-relationship-designer.vue';
import { useI18n } from 'vue-i18n';

interface Props {
  projectId: string;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  relationshipUpdated: [];
}>();

const { t } = useI18n();
const error = ref(false);
const errorMessage = ref('');

// 处理错误
function handleError(message: string) {
  error.value = true;
  errorMessage.value = message || t('page.lowcode.relationship.loadError');
  console.error('关系设计器错误:', message);
}

// 重试加载
function retryLoading() {
  error.value = false;
  errorMessage.value = '';
}

// 监听projectId变化，确保组件正确重新渲染
watch(() => props.projectId, async (newProjectId) => {
  if (newProjectId) {
    error.value = false;
    errorMessage.value = '';
    await nextTick();
    console.log('Visual designer projectId changed:', newProjectId);
  }
}, { immediate: true });
</script>

<style scoped>
.visual-relationship-designer {
  @apply h-full min-h-600px;
  display: flex;
  flex-direction: column;
  position: relative;
}
</style>
