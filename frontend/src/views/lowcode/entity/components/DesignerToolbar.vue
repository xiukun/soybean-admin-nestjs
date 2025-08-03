<template>
  <div class="designer-toolbar">
    <!-- 左侧工具组 -->
    <div class="toolbar-section">
      <NSpace>
        <!-- 返回按钮 -->
        <NButton quaternary @click="$emit('back')" v-if="!isFullscreen">
          <template #icon>
            <NIcon><icon-mdi-arrow-left /></NIcon>
          </template>
          返回
        </NButton>
        
        <!-- 项目信息 -->
        <div class="project-info" v-if="projectInfo">
          <NText strong>{{ projectInfo.name }}</NText>
          <NText depth="3" class="ml-2">实体设计器</NText>
        </div>
      </NSpace>
    </div>
    
    <!-- 中央工具组 -->
    <div class="toolbar-section">
      <NSpace>
        <!-- 布局选择 -->
        <NSelect 
          v-model:value="currentLayout" 
          :options="layoutOptions" 
          style="width: 120px"
          @update:value="$emit('layout-change', $event)"
        />
        
        <!-- 自动布局 -->
        <NButton 
          @click="$emit('auto-layout')" 
          :loading="layoutLoading"
          type="primary"
          ghost
        >
          <template #icon>
            <NIcon><icon-mdi-auto-fix /></NIcon>
          </template>
          自动布局
        </NButton>
        
        <!-- 连线模式 -->
        <NButton 
          @click="$emit('toggle-connect-mode')" 
          :type="isConnectMode ? 'primary' : 'default'"
        >
          <template #icon>
            <NIcon><icon-mdi-connection /></NIcon>
          </template>
          连线模式
        </NButton>
        
        <!-- 分隔线 -->
        <NDivider vertical />
        
        <!-- 网格切换 -->
        <NButton 
          @click="$emit('toggle-grid')" 
          :type="showGrid ? 'primary' : 'default'"
          ghost
        >
          <template #icon>
            <NIcon><icon-mdi-grid /></NIcon>
          </template>
          网格
        </NButton>
        
        <!-- 对齐线切换 -->
        <NButton 
          @click="$emit('toggle-snapline')" 
          :type="showSnapline ? 'primary' : 'default'"
          ghost
        >
          <template #icon>
            <NIcon><icon-mdi-vector-line /></NIcon>
          </template>
          对齐线
        </NButton>
      </NSpace>
    </div>
    
    <!-- 右侧工具组 -->
    <div class="toolbar-section">
      <NSpace>
        <!-- 撤销重做 -->
        <NButtonGroup>
          <NButton @click="$emit('undo')" :disabled="!canUndo">
            <template #icon>
              <NIcon><icon-mdi-undo /></NIcon>
            </template>
          </NButton>
          <NButton @click="$emit('redo')" :disabled="!canRedo">
            <template #icon>
              <NIcon><icon-mdi-redo /></NIcon>
            </template>
          </NButton>
        </NButtonGroup>
        
        <!-- 缩放控制 -->
        <NButtonGroup>
          <NButton @click="$emit('zoom-out')" :disabled="zoomLevel <= 0.1">
            <template #icon>
              <NIcon><icon-mdi-magnify-minus /></NIcon>
            </template>
          </NButton>
          <NButton class="zoom-display">{{ Math.round(zoomLevel * 100) }}%</NButton>
          <NButton @click="$emit('zoom-in')" :disabled="zoomLevel >= 3">
            <template #icon>
              <NIcon><icon-mdi-magnify-plus /></NIcon>
            </template>
          </NButton>
        </NButtonGroup>
        
        <!-- 视图控制 -->
        <NButton @click="$emit('fit-view')">
          <template #icon>
            <NIcon><icon-mdi-fit-to-page /></NIcon>
          </template>
          适应视图
        </NButton>
        
        <!-- 小地图 -->
        <NButton 
          @click="$emit('toggle-minimap')" 
          :type="showMinimap ? 'primary' : 'default'" 
          ghost
        >
          <template #icon>
            <NIcon><icon-mdi-map /></NIcon>
          </template>
          小地图
        </NButton>
        
        <!-- 分隔线 -->
        <NDivider vertical />
        
        <!-- 导出 -->
        <NDropdown :options="exportOptions" @select="handleExport">
          <NButton>
            <template #icon>
              <NIcon><icon-mdi-export /></NIcon>
            </template>
            导出
          </NButton>
        </NDropdown>
        
        <!-- 全屏切换 -->
        <NButton @click="$emit('toggle-fullscreen')">
          <template #icon>
            <NIcon>
              <icon-mdi-fullscreen v-if="!isFullscreen" />
              <icon-mdi-fullscreen-exit v-else />
            </NIcon>
          </template>
        </NButton>
        
        <!-- 保存 -->
        <NButton type="primary" @click="$emit('save')" :loading="saving">
          <template #icon>
            <NIcon><icon-mdi-content-save /></NIcon>
          </template>
          保存
        </NButton>
      </NSpace>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useMessage } from 'naive-ui';

/**
 * 设计器工具栏组件
 * @props {Object} projectInfo - 项目信息
 * @props {string} currentLayout - 当前布局类型
 * @props {boolean} layoutLoading - 布局加载状态
 * @props {boolean} isConnectMode - 是否连线模式
 * @props {boolean} showGrid - 是否显示网格
 * @props {boolean} showSnapline - 是否显示对齐线
 * @props {boolean} showMinimap - 是否显示小地图
 * @props {boolean} isFullscreen - 是否全屏
 * @props {number} zoomLevel - 缩放级别
 * @props {boolean} canUndo - 是否可撤销
 * @props {boolean} canRedo - 是否可重做
 * @props {boolean} saving - 是否保存中
 */
interface Props {
  projectInfo?: {
    name: string;
    description?: string;
  };
  currentLayout: string;
  layoutLoading?: boolean;
  isConnectMode?: boolean;
  showGrid?: boolean;
  showSnapline?: boolean;
  showMinimap?: boolean;
  isFullscreen?: boolean;
  zoomLevel: number;
  canUndo?: boolean;
  canRedo?: boolean;
  saving?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  layoutLoading: false,
  isConnectMode: false,
  showGrid: true,
  showSnapline: true,
  showMinimap: true,
  isFullscreen: false,
  canUndo: false,
  canRedo: false,
  saving: false
});

const emit = defineEmits<{
  'back': [];
  'layout-change': [layout: string];
  'auto-layout': [];
  'toggle-connect-mode': [];
  'toggle-grid': [];
  'toggle-snapline': [];
  'toggle-minimap': [];
  'toggle-fullscreen': [];
  'zoom-in': [];
  'zoom-out': [];
  'fit-view': [];
  'undo': [];
  'redo': [];
  'save': [];
  'export': [type: string];
}>();

const message = useMessage();

// 布局选项
const layoutOptions = [
  { label: '层次布局', value: 'hierarchical' },
  { label: '力导向布局', value: 'force' },
  { label: '环形布局', value: 'circular' },
  { label: '网格布局', value: 'grid' },
  { label: '自由布局', value: 'free' }
];

// 导出选项
const exportOptions = [
  {
    label: '导出为图片',
    key: 'image',
    children: [
      { label: 'PNG', key: 'png' },
      { label: 'JPG', key: 'jpg' },
      { label: 'SVG', key: 'svg' }
    ]
  },
  {
    label: '导出数据',
    key: 'data',
    children: [
      { label: 'JSON', key: 'json' },
      { label: 'XML', key: 'xml' }
    ]
  }
];

/**
 * 处理导出
 * @param key - 导出类型
 */
function handleExport(key: string) {
  emit('export', key);
  message.info(`导出为 ${key.toUpperCase()} 格式`);
}
</script>

<style scoped>
.designer-toolbar {
  @apply flex items-center justify-between px-4 py-2 bg-white border-b border-gray-200;
  height: 56px;
  min-height: 56px;
}

.toolbar-section {
  @apply flex items-center;
}

.project-info {
  @apply flex items-center;
}

.zoom-display {
  @apply min-w-16 text-center cursor-default;
}

.zoom-display:hover {
  @apply bg-transparent;
}
</style>