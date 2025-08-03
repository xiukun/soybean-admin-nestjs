<template>
  <div class="entity-designer">
    <!-- Designer Toolbar -->
    <div class="designer-toolbar">
      <div class="toolbar-left">
        <NSpace>
          <NButton size="small" @click="handleZoomIn">
            <template #icon>
              <NIcon><icon-mdi-magnify-plus /></NIcon>
            </template>
          </NButton>
          <NButton size="small" @click="handleZoomOut">
            <template #icon>
              <NIcon><icon-mdi-magnify-minus /></NIcon>
            </template>
          </NButton>
          <NButton size="small" @click="handleZoomToFit">
            <template #icon>
              <NIcon><icon-mdi-fit-to-page /></NIcon>
            </template>
            适应画布
          </NButton>
          <NButton size="small" @click="handleAutoLayout">
            <template #icon>
              <NIcon><icon-mdi-auto-fix /></NIcon>
            </template>
            自动布局
          </NButton>
        </NSpace>
      </div>
      
      <div class="toolbar-right">
        <NSpace>
          <NText class="text-sm text-gray-500">
            实体数量: {{ entities.length }}
          </NText>
          <NButton size="small" type="primary" @click="handleSave">
            <template #icon>
              <NIcon><icon-mdi-content-save /></NIcon>
            </template>
            保存布局
          </NButton>
        </NSpace>
      </div>
    </div>

    <!-- Designer Canvas -->
    <div class="designer-canvas">
      <div ref="canvasContainer" class="canvas-container">
        <!-- 简化版实体节点展示 -->
        <div 
          v-for="entity in entities" 
          :key="entity.id"
          class="entity-node"
          :class="{ 'selected': selectedEntityId === entity.id }"
          :style="getEntityNodeStyle(entity)"
          @click="handleEntityClick(entity)"
          @mousedown="handleMouseDown($event, entity)"
        >
          <div class="entity-header" :style="{ backgroundColor: entity.color || '#5F95FF' }">
            <span class="entity-title">{{ entity.name }}</span>
          </div>
          <div class="entity-body">
            <div class="entity-info">
              <div class="entity-code">{{ entity.code }}</div>
              <div class="entity-table">表名: {{ entity.tableName }}</div>
              <div class="entity-fields">字段: {{ entity.fieldCount || 0 }}</div>
            </div>
            <div class="entity-category">{{ entity.category }}</div>
          </div>
        </div>
      </div>
      
      <!-- Loading Overlay -->
      <div v-if="loading" class="loading-overlay">
        <NSpin size="large">
          <template #description>
            正在加载实体设计器...
          </template>
        </NSpin>
      </div>
      
      <!-- Empty State -->
      <div v-if="!loading && entities.length === 0" class="empty-state">
        <div class="empty-content">
          <NIcon size="64" class="text-gray-400">
            <icon-mdi-vector-polyline />
          </NIcon>
          <NText class="text-lg font-medium mt-4">暂无实体</NText>
          <NText class="text-gray-500 mt-2">请先创建实体，然后在此设计实体关系</NText>
          <NButton type="primary" class="mt-4" @click="$emit('entity-create')">
            <template #icon>
              <NIcon><icon-mdi-plus /></NIcon>
            </template>
            创建实体
          </NButton>
        </div>
      </div>
    </div>

    <!-- Property Panel -->
    <div v-if="selectedEntity" class="property-panel">
      <EntityPropertyPanel
        :entity="selectedEntity"
        @update="handleEntityUpdate"
        @close="handleClosePropertyPanel"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { NButton, NSpace, NText, NSpin, NIcon } from 'naive-ui';
import EntityPropertyPanel from './EntityPropertyPanel.vue';

// 图标导入
import IconMdiMagnifyPlus from '~icons/mdi/magnify-plus';
import IconMdiMagnifyMinus from '~icons/mdi/magnify-minus';
import IconMdiFitToPage from '~icons/mdi/fit-to-page';
import IconMdiAutoFix from '~icons/mdi/auto-fix';
import IconMdiContentSave from '~icons/mdi/content-save';
import IconMdiVectorPolyline from '~icons/mdi/vector-polyline';
import IconMdiPlus from '~icons/mdi/plus';

interface Entity {
  id: string;
  name: string;
  code: string;
  tableName: string;
  category: string;
  description?: string;
  status: string;
  fieldCount?: number;
  createdAt: string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  color?: string;
}

interface Props {
  projectId?: string;
  entities: Entity[];
}

interface Emits {
  (e: 'entity-select', entity: Entity | null): void;
  (e: 'entity-create'): void;
  (e: 'entity-update', entity: Entity): void;
  (e: 'entity-delete', entityId: string): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

// 响应式数据
const canvasContainer = ref<HTMLDivElement>();
const loading = ref(false);
const selectedEntityId = ref<string | null>(null);
const isDragging = ref(false);
const dragOffset = ref({ x: 0, y: 0 });

// 计算属性
const selectedEntity = computed(() => {
  return props.entities.find(e => e.id === selectedEntityId.value) || null;
});

/**
 * 获取实体节点样式
 */
function getEntityNodeStyle(entity: Entity) {
  const x = entity.x ?? 100;
  const y = entity.y ?? 100;
  const width = entity.width ?? 200;
  const height = entity.height ?? 120;
  
  return {
    position: 'absolute',
    left: `${x}px`,
    top: `${y}px`,
    width: `${width}px`,
    height: `${height}px`,
    transform: isDragging.value && selectedEntityId.value === entity.id ? 'scale(1.05)' : 'scale(1)',
    transition: isDragging.value ? 'none' : 'all 0.2s ease'
  };
}

/**
 * 处理实体点击
 */
function handleEntityClick(entity: Entity) {
  selectedEntityId.value = entity.id;
  emit('entity-select', entity);
}

/**
 * 处理鼠标按下（开始拖拽）
 */
function handleMouseDown(event: MouseEvent, entity: Entity) {
  event.preventDefault();
  isDragging.value = true;
  selectedEntityId.value = entity.id;
  
  const rect = canvasContainer.value?.getBoundingClientRect();
  if (rect) {
    dragOffset.value = {
      x: event.clientX - rect.left - (entity.x ?? 100),
      y: event.clientY - rect.top - (entity.y ?? 100)
    };
  }
  
  document.addEventListener('mousemove', handleMouseMove);
  document.addEventListener('mouseup', handleMouseUp);
}

/**
 * 处理鼠标移动（拖拽中）
 */
function handleMouseMove(event: MouseEvent) {
  if (!isDragging.value || !selectedEntityId.value) return;
  
  const rect = canvasContainer.value?.getBoundingClientRect();
  if (rect) {
    const x = event.clientX - rect.left - dragOffset.value.x;
    const y = event.clientY - rect.top - dragOffset.value.y;
    
    const entity = props.entities.find(e => e.id === selectedEntityId.value);
    if (entity) {
      const updatedEntity = { ...entity, x: Math.max(0, x), y: Math.max(0, y) };
      emit('entity-update', updatedEntity);
    }
  }
}

/**
 * 处理鼠标释放（结束拖拽）
 */
function handleMouseUp() {
  isDragging.value = false;
  document.removeEventListener('mousemove', handleMouseMove);
  document.removeEventListener('mouseup', handleMouseUp);
}

/**
 * 工具栏事件处理
 */
function handleZoomIn() {
  console.log('放大功能');
}

function handleZoomOut() {
  console.log('缩小功能');
}

function handleZoomToFit() {
  console.log('适应画布功能');
}

function handleAutoLayout() {
  // 简单的自动布局
  const cols = Math.ceil(Math.sqrt(props.entities.length));
  props.entities.forEach((entity, index) => {
    const col = index % cols;
    const row = Math.floor(index / cols);
    const x = 100 + col * 250;
    const y = 100 + row * 200;
    
    const updatedEntity = { ...entity, x, y };
    emit('entity-update', updatedEntity);
  });
}

function handleSave() {
  console.log('保存布局');
}

/**
 * 属性面板事件处理
 */
function handleEntityUpdate(entity: Entity) {
  emit('entity-update', entity);
}

function handleClosePropertyPanel() {
  selectedEntityId.value = null;
  emit('entity-select', null);
}

// 生命周期
onMounted(() => {
  loading.value = false;
});
</script>

<style scoped>
.entity-designer {
  @apply h-full flex flex-col bg-white rounded-lg shadow-sm;
}

.designer-toolbar {
  @apply flex justify-between items-center p-3 border-b border-gray-200 bg-gray-50;
}

.toolbar-left,
.toolbar-right {
  @apply flex items-center;
}

.designer-canvas {
  @apply flex-1 relative overflow-hidden;
}

.canvas-container {
  @apply w-full h-full relative bg-gray-50;
  background-image: radial-gradient(circle, #ddd 1px, transparent 1px);
  background-size: 20px 20px;
}

.entity-node {
  @apply bg-white border border-gray-300 rounded-lg shadow-sm cursor-pointer;
  user-select: none;
}

.entity-node:hover {
  @apply shadow-md border-blue-400;
}

.entity-node.selected {
  @apply border-blue-500 shadow-lg;
}

.entity-header {
  @apply px-3 py-2 rounded-t-lg;
}

.entity-title {
  @apply text-white font-medium text-sm;
}

.entity-body {
  @apply p-3 flex flex-col justify-between h-20;
}

.entity-info {
  @apply space-y-1;
}

.entity-code {
  @apply text-sm font-medium text-gray-700;
}

.entity-table {
  @apply text-xs text-gray-500;
}

.entity-fields {
  @apply text-xs text-gray-500;
}

.entity-category {
  @apply text-xs text-gray-400 text-right;
}

.loading-overlay {
  @apply absolute inset-0 flex items-center justify-center bg-white bg-opacity-75 z-10;
}

.empty-state {
  @apply absolute inset-0 flex items-center justify-center;
}

.empty-content {
  @apply flex flex-col items-center text-center;
}

.property-panel {
  @apply absolute top-0 right-0 w-80 h-full bg-white border-l border-gray-200 shadow-lg z-20;
}
</style>