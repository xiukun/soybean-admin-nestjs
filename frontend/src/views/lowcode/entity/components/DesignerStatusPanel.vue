<template>
  <div class="designer-status-panel">
    <div class="status-header">
      <NText strong>设计器状态</NText>
      <NButton size="tiny" quaternary @click="refreshStats">
        <template #icon>
          <NIcon><icon-mdi-refresh /></NIcon>
        </template>
      </NButton>
    </div>
    
    <div class="status-content">
      <!-- 基本统计 -->
      <div class="stats-section">
        <div class="stat-item">
          <div class="stat-icon">
            <NIcon color="#1890ff"><icon-mdi-table /></NIcon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ entityCount }}</div>
            <div class="stat-label">实体</div>
          </div>
        </div>
        
        <div class="stat-item">
          <div class="stat-icon">
            <NIcon color="#52c41a"><icon-mdi-relation-many-to-many /></NIcon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ relationshipCount }}</div>
            <div class="stat-label">关系</div>
          </div>
        </div>
        
        <div class="stat-item">
          <div class="stat-icon">
            <NIcon color="#fa8c16"><icon-mdi-table-column /></NIcon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ totalFieldCount }}</div>
            <div class="stat-label">字段</div>
          </div>
        </div>
      </div>
      
      <!-- 画布状态 -->
      <div class="canvas-section">
        <div class="section-title">
          <NText depth="2">画布状态</NText>
        </div>
        
        <div class="canvas-stats">
          <div class="canvas-stat">
            <span class="label">缩放级别:</span>
            <span class="value">{{ Math.round(zoomLevel * 100) }}%</span>
          </div>
          
          <div class="canvas-stat">
            <span class="label">选中元素:</span>
            <span class="value">{{ selectedElementType || '无' }}</span>
          </div>
          
          <div class="canvas-stat">
            <span class="label">连线模式:</span>
            <NBadge :type="isConnectMode ? 'success' : 'default'" dot>
              <span class="value">{{ isConnectMode ? '开启' : '关闭' }}</span>
            </NBadge>
          </div>
        </div>
      </div>
      
      <!-- 设计器配置 -->
      <div class="config-section">
        <div class="section-title">
          <NText depth="2">显示设置</NText>
        </div>
        
        <div class="config-items">
          <div class="config-item">
            <span class="config-label">网格</span>
            <NSwitch v-model:value="localShowGrid" @update:value="handleGridToggle" size="small" />
          </div>
          
          <div class="config-item">
            <span class="config-label">对齐线</span>
            <NSwitch v-model:value="localShowSnapline" @update:value="handleSnaplineToggle" size="small" />
          </div>
          
          <div class="config-item">
            <span class="config-label">小地图</span>
            <NSwitch v-model:value="localShowMinimap" @update:value="handleMinimapToggle" size="small" />
          </div>
        </div>
      </div>
      
      <!-- 操作历史 -->
      <div class="history-section">
        <div class="section-title">
          <NText depth="2">操作历史</NText>
        </div>
        
        <div class="history-actions">
          <NButton size="small" :disabled="!canUndo" @click="$emit('undo')">
            <template #icon>
              <NIcon><icon-mdi-undo /></NIcon>
            </template>
            撤销
          </NButton>
          
          <NButton size="small" :disabled="!canRedo" @click="$emit('redo')">
            <template #icon>
              <NIcon><icon-mdi-redo /></NIcon>
            </template>
            重做
          </NButton>
        </div>
      </div>
      
      <!-- 快捷操作 -->
      <div class="actions-section">
        <div class="section-title">
          <NText depth="2">快捷操作</NText>
        </div>
        
        <div class="quick-actions">
          <NButton size="small" block @click="$emit('auto-layout')" class="mb-2">
            <template #icon>
              <NIcon><icon-mdi-auto-fix /></NIcon>
            </template>
            自动布局
          </NButton>
          
          <NButton size="small" block @click="$emit('fit-view')" class="mb-2">
            <template #icon>
              <NIcon><icon-mdi-fit-to-page /></NIcon>
            </template>
            适应视图
          </NButton>
          
          <NButton size="small" block @click="$emit('clear-canvas')" type="warning">
            <template #icon>
              <NIcon><icon-mdi-delete-sweep /></NIcon>
            </template>
            清空画布
          </NButton>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';

/**
 * 设计器状态面板组件
 * @props {number} entityCount - 实体数量
 * @props {number} relationshipCount - 关系数量
 * @props {number} totalFieldCount - 总字段数量
 * @props {number} zoomLevel - 缩放级别
 * @props {string} selectedElementType - 选中元素类型
 * @props {boolean} isConnectMode - 是否连线模式
 * @props {boolean} showGrid - 是否显示网格
 * @props {boolean} showSnapline - 是否显示对齐线
 * @props {boolean} showMinimap - 是否显示小地图
 * @props {boolean} canUndo - 是否可撤销
 * @props {boolean} canRedo - 是否可重做
 */
interface Props {
  entityCount: number;
  relationshipCount: number;
  totalFieldCount: number;
  zoomLevel: number;
  selectedElementType?: string;
  isConnectMode: boolean;
  showGrid: boolean;
  showSnapline: boolean;
  showMinimap: boolean;
  canUndo: boolean;
  canRedo: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  selectedElementType: ''
});

const emit = defineEmits<{
  'toggle-grid': [];
  'toggle-snapline': [];
  'toggle-minimap': [];
  'undo': [];
  'redo': [];
  'auto-layout': [];
  'fit-view': [];
  'clear-canvas': [];
  'refresh-stats': [];
}>();

// 本地状态，用于双向绑定
const localShowGrid = ref(props.showGrid);
const localShowSnapline = ref(props.showSnapline);
const localShowMinimap = ref(props.showMinimap);

// 监听props变化，更新本地状态
watch(() => props.showGrid, (newVal) => {
  localShowGrid.value = newVal;
});

watch(() => props.showSnapline, (newVal) => {
  localShowSnapline.value = newVal;
});

watch(() => props.showMinimap, (newVal) => {
  localShowMinimap.value = newVal;
});

/**
 * 处理网格切换
 */
function handleGridToggle() {
  emit('toggle-grid');
}

/**
 * 处理对齐线切换
 */
function handleSnaplineToggle() {
  emit('toggle-snapline');
}

/**
 * 处理小地图切换
 */
function handleMinimapToggle() {
  emit('toggle-minimap');
}

/**
 * 刷新统计信息
 */
function refreshStats() {
  emit('refresh-stats');
}
</script>

<style scoped>
.designer-status-panel {
  @apply w-full h-full flex flex-col;
}

.status-header {
  @apply flex items-center justify-between p-3 border-b border-gray-200;
}

.status-content {
  @apply flex-1 p-3 space-y-4 overflow-y-auto;
}

.stats-section {
  @apply grid grid-cols-1 gap-3;
}

.stat-item {
  @apply flex items-center space-x-3 p-3 bg-gray-50 rounded-lg;
}

.stat-icon {
  @apply text-xl;
}

.stat-info {
  @apply flex-1;
}

.stat-value {
  @apply text-lg font-semibold text-gray-900;
}

.stat-label {
  @apply text-sm text-gray-600;
}

.canvas-section,
.config-section,
.history-section,
.actions-section {
  @apply space-y-2;
}

.section-title {
  @apply pb-2 border-b border-gray-100;
}

.canvas-stats {
  @apply space-y-2;
}

.canvas-stat {
  @apply flex items-center justify-between text-sm;
}

.label {
  @apply text-gray-600;
}

.value {
  @apply font-medium text-gray-900;
}

.config-items {
  @apply space-y-3;
}

.config-item {
  @apply flex items-center justify-between;
}

.config-label {
  @apply text-sm text-gray-700;
}

.history-actions {
  @apply flex space-x-2;
}

.quick-actions {
  @apply space-y-2;
}
</style>