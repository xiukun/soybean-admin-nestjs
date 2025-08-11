<script setup lang="ts">
import { nextTick, ref, watch } from 'vue';
import { NAlert, NButton } from 'naive-ui';
import { useI18n } from 'vue-i18n';
import X6RelationshipDesigner from './x6-relationship-designer.vue';

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
watch(
  () => props.projectId,
  async newProjectId => {
    if (newProjectId) {
      error.value = false;
      errorMessage.value = '';
      await nextTick();
      console.log('Visual designer projectId changed:', newProjectId);
    }
  },
  { immediate: true }
);
</script>

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
    <div v-else-if="error" class="h-full flex flex-col items-center justify-center">
      <NAlert type="error" :title="t('page.lowcode.common.messages.error')" class="mb-4">
        {{ errorMessage }}
      </NAlert>
      <NButton @click="retryLoading">{{ t('page.lowcode.common.actions.retry') }}</NButton>
    </div>
    <div v-else class="h-full flex items-center justify-center text-gray-500">
      {{ t('page.lowcode.template.selectProject') }}
    </div>
  </div>
</template>

<style scoped>
.visual-relationship-designer {
  @apply h-full min-h-600px;
  display: flex;
  flex-direction: column;
  position: relative;
}
</style>
