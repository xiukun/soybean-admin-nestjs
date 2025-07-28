<template>
  <div class="virtual-project-list" ref="containerRef">
    <div class="virtual-list-container" :style="{ height: `${totalHeight}px` }">
      <div
        class="virtual-list-content"
        :style="{ transform: `translateY(${offsetY}px)` }"
      >
        <div
          v-for="item in visibleItems"
          :key="item.data.id"
          class="virtual-list-item"
          :style="{ height: `${itemHeight}px` }"
        >
          <ProjectCard
            :project="item.data"
            @edit="$emit('edit', item.data)"
            @delete="$emit('delete', item.data)"
            @configure="$emit('configure', item.data)"
            @design="$emit('design', item.data)"
            @generate="$emit('generate', item.data)"
            @view="$emit('view', item.data)"
            @deploy="$emit('deploy', item.data)"
            @stop-deployment="$emit('stop-deployment', item.data)"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// @ts-nocheck
import { ref, computed, onMounted, onUnmounted } from 'vue';
import ProjectCard from '../modules/project-card.vue';
import type { Project } from '../composables/useProjectPerformance';

interface Props {
  items: Project[];
  itemHeight?: number;
  containerHeight?: number;
  overscan?: number;
}

interface Emits {
  (e: 'edit', project: Project): void;
  (e: 'delete', project: Project): void;
  (e: 'configure', project: Project): void;
  (e: 'design', project: Project): void;
  (e: 'generate', project: Project): void;
  (e: 'view', project: Project): void;
  (e: 'deploy', project: Project): void;
  (e: 'stop-deployment', project: Project): void;
}

const props = withDefaults(defineProps<Props>(), {
  itemHeight: 200,
  containerHeight: 600,
  overscan: 5
});

defineEmits<Emits>();

const containerRef = ref<HTMLElement>();
const scrollTop = ref(0);

// 计算可见区域
const visibleRange = computed(() => {
  const start = Math.floor(scrollTop.value / props.itemHeight);
  const end = Math.min(
    start + Math.ceil(props.containerHeight / props.itemHeight),
    props.items.length
  );
  
  return {
    start: Math.max(0, start - props.overscan),
    end: Math.min(props.items.length, end + props.overscan)
  };
});

// 可见项目
const visibleItems = computed(() => {
  const { start, end } = visibleRange.value;
  return props.items.slice(start, end).map((item, index) => ({
    data: item,
    index: start + index
  }));
});

// 总高度
const totalHeight = computed(() => props.items.length * props.itemHeight);

// 偏移量
const offsetY = computed(() => visibleRange.value.start * props.itemHeight);

// 滚动处理
const handleScroll = (event: Event) => {
  const target = event.target as HTMLElement;
  scrollTop.value = target.scrollTop;
};

onMounted(() => {
  if (containerRef.value) {
    containerRef.value.addEventListener('scroll', handleScroll);
  }
});

onUnmounted(() => {
  if (containerRef.value) {
    containerRef.value.removeEventListener('scroll', handleScroll);
  }
});
</script>

<style scoped>
.virtual-project-list {
  height: 100%;
  overflow-y: auto;
}

.virtual-list-container {
  position: relative;
}

.virtual-list-content {
  position: relative;
}

.virtual-list-item {
  position: relative;
}
</style>