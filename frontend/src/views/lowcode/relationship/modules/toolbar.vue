<template>
  <div class="toolbar">
    <div class="toolbar-section">
      <n-button-group>
        <n-button 
          :type="isConnectMode ? 'primary' : 'default'"
          @click="$emit('toggle-connect-mode')"
          :disabled="loading"
        >
          <n-icon :component="LinkIcon" />
          {{ isConnectMode ? '退出连线' : '连线模式' }}
        </n-button>
        
        <n-button @click="$emit('add-entity')" :disabled="loading">
          <n-icon :component="PlusIcon" />
          添加实体
        </n-button>
        
        <n-button @click="$emit('delete-selected')" :disabled="!hasSelection || loading">
          <n-icon :component="DeleteIcon" />
          删除
        </n-button>
      </n-button-group>
    </div>

    <div class="toolbar-section">
      <n-button-group>
        <n-button @click="$emit('auto-layout')" :loading="layoutLoading">
          <n-icon :component="LayoutIcon" />
          自动布局
        </n-button>
        
        <n-button @click="$emit('fit-view')">
          <n-icon :component="FitViewIcon" />
          适应画布
        </n-button>
        
        <n-button @click="$emit('reset-zoom')">
          <n-icon :component="ResetZoomIcon" />
          重置缩放
        </n-button>
      </n-button-group>
    </div>

    <div class="toolbar-section">
      <n-space align="center">
        <span class="zoom-label">缩放:</span>
        <n-button size="small" @click="$emit('zoom-out')" :disabled="zoomLevel <= 0.1">
          <n-icon :component="ZoomOutIcon" />
        </n-button>
        
        <span class="zoom-value">{{ Math.round(zoomLevel * 100) }}%</span>
        
        <n-button size="small" @click="$emit('zoom-in')" :disabled="zoomLevel >= 3">
          <n-icon :component="ZoomInIcon" />
        </n-button>
      </n-space>
    </div>

    <div class="toolbar-section">
      <n-dropdown :options="exportOptions" @select="handleExport">
        <n-button>
          <n-icon :component="ExportIcon" />
          导出
          <n-icon :component="ChevronDownIcon" />
        </n-button>
      </n-dropdown>
    </div>

    <div class="toolbar-section">
      <n-button-group>
        <n-button @click="$emit('undo')" :disabled="!canUndo">
          <n-icon :component="UndoIcon" />
        </n-button>
        
        <n-button @click="$emit('redo')" :disabled="!canRedo">
          <n-icon :component="RedoIcon" />
        </n-button>
      </n-button-group>
    </div>

    <div class="toolbar-section">
      <n-button @click="$emit('save')" type="primary" :loading="saveLoading">
        <n-icon :component="SaveIcon" />
        保存
      </n-button>
    </div>

    <!-- 图例 -->
    <div class="toolbar-section legend-section">
      <n-popover trigger="hover" placement="bottom">
        <template #trigger>
          <n-button quaternary>
            <n-icon :component="InfoIcon" />
            图例
          </n-button>
        </template>
        
        <div class="legend-content">
          <div class="legend-item">
            <div class="legend-node entity-node"></div>
            <span>实体</span>
          </div>
          <div class="legend-item">
            <div class="legend-line one-to-one"></div>
            <span>一对一关系</span>
          </div>
          <div class="legend-item">
            <div class="legend-line one-to-many"></div>
            <span>一对多关系</span>
          </div>
          <div class="legend-item">
            <div class="legend-line many-to-many"></div>
            <span>多对多关系</span>
          </div>
        </div>
      </n-popover>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, h } from 'vue';
import { 
  NButton, NButtonGroup, NIcon, NSpace, NDropdown, NPopover,
  useMessage 
} from 'naive-ui';
import { Icon } from '@iconify/vue';

// 定义图标组件
const LinkIcon = () => h(Icon, { icon: 'mdi:link' });
const PlusIcon = () => h(Icon, { icon: 'mdi:plus' });
const DeleteIcon = () => h(Icon, { icon: 'mdi:delete' });
const LayoutIcon = () => h(Icon, { icon: 'mdi:auto-fix' });
const FitViewIcon = () => h(Icon, { icon: 'mdi:fit-to-screen' });
const ResetZoomIcon = () => h(Icon, { icon: 'mdi:refresh' });
const ZoomOutIcon = () => h(Icon, { icon: 'mdi:magnify-minus' });
const ZoomInIcon = () => h(Icon, { icon: 'mdi:magnify-plus' });
const ExportIcon = () => h(Icon, { icon: 'mdi:download' });
const ChevronDownIcon = () => h(Icon, { icon: 'mdi:chevron-down' });
const UndoIcon = () => h(Icon, { icon: 'mdi:undo' });
const RedoIcon = () => h(Icon, { icon: 'mdi:redo' });
const SaveIcon = () => h(Icon, { icon: 'mdi:content-save' });
const InfoIcon = () => h(Icon, { icon: 'mdi:information' });

interface Props {
  isConnectMode?: boolean;
  hasSelection?: boolean;
  zoomLevel?: number;
  canUndo?: boolean;
  canRedo?: boolean;
  loading?: boolean;
  layoutLoading?: boolean;
  saveLoading?: boolean;
}

interface Emits {
  (e: 'toggle-connect-mode'): void;
  (e: 'add-entity'): void;
  (e: 'delete-selected'): void;
  (e: 'auto-layout'): void;
  (e: 'fit-view'): void;
  (e: 'reset-zoom'): void;
  (e: 'zoom-in'): void;
  (e: 'zoom-out'): void;
  (e: 'export', type: string): void;
  (e: 'undo'): void;
  (e: 'redo'): void;
  (e: 'save'): void;
}

const props = withDefaults(defineProps<Props>(), {
  isConnectMode: false,
  hasSelection: false,
  zoomLevel: 1,
  canUndo: false,
  canRedo: false,
  loading: false,
  layoutLoading: false,
  saveLoading: false
});

const emit = defineEmits<Emits>();
const message = useMessage();

// 导出选项
const exportOptions = [
  {
    label: '导出为PNG',
    key: 'png',
    icon: () => h(NIcon, { component: ExportIcon })
  },
  {
    label: '导出为JPG',
    key: 'jpg',
    icon: () => h(NIcon, { component: ExportIcon })
  },
  {
    label: '导出为SVG',
    key: 'svg',
    icon: () => h(NIcon, { component: ExportIcon })
  },
  {
    label: '导出为JSON',
    key: 'json',
    icon: () => h(NIcon, { component: ExportIcon })
  }
];

// 处理导出
function handleExport(key: string) {
  emit('export', key);
  message.info(`正在导出为 ${key.toUpperCase()} 格式...`);
}
</script>

<style scoped>
.toolbar {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px 16px;
  background: white;
  border-bottom: 1px solid #e8e8e8;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  flex-wrap: wrap;
  min-height: 56px;
}

.toolbar-section {
  display: flex;
  align-items: center;
  gap: 8px;
}

.zoom-label {
  font-size: 12px;
  color: #666;
  white-space: nowrap;
}

.zoom-value {
  font-size: 12px;
  color: #333;
  font-weight: 600;
  min-width: 40px;
  text-align: center;
}

.legend-section {
  margin-left: auto;
}

.legend-content {
  padding: 8px;
  min-width: 200px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
  font-size: 12px;
}

.legend-item:last-child {
  margin-bottom: 0;
}

.legend-node {
  width: 20px;
  height: 16px;
  border-radius: 4px;
  flex-shrink: 0;
}

.entity-node {
  background: #1890ff;
  border: 2px solid #0066cc;
}

.legend-line {
  width: 30px;
  height: 2px;
  flex-shrink: 0;
  position: relative;
}

.one-to-one {
  background: #52c41a;
}

.one-to-many {
  background: #1890ff;
}

.one-to-many::after {
  content: '';
  position: absolute;
  right: -4px;
  top: -2px;
  width: 0;
  height: 0;
  border-left: 4px solid #1890ff;
  border-top: 3px solid transparent;
  border-bottom: 3px solid transparent;
}

.many-to-many {
  background: #722ed1;
}

.many-to-many::before,
.many-to-many::after {
  content: '';
  position: absolute;
  top: -2px;
  width: 0;
  height: 0;
  border-top: 3px solid transparent;
  border-bottom: 3px solid transparent;
}

.many-to-many::before {
  left: -4px;
  border-right: 4px solid #722ed1;
}

.many-to-many::after {
  right: -4px;
  border-left: 4px solid #722ed1;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .toolbar {
    padding: 8px 12px;
    gap: 8px;
  }
  
  .toolbar-section {
    gap: 4px;
  }
  
  .zoom-label,
  .zoom-value {
    font-size: 11px;
  }
  
  .legend-section {
    margin-left: 0;
    order: -1;
    width: 100%;
    justify-content: center;
  }
}

@media (max-width: 480px) {
  .toolbar {
    flex-direction: column;
    align-items: stretch;
    gap: 8px;
  }
  
  .toolbar-section {
    justify-content: center;
  }
  
  .legend-section {
    order: 0;
  }
}
</style>