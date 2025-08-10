<template>
  <div class="toolbox-panel">
    <!-- 面板头部 -->
    <div class="panel-header">
      <div class="header-title">
        <NIcon size="18" class="text-purple-500">
          <icon-mdi-toolbox />
        </NIcon>
        <NText class="font-medium ml-2">工具箱</NText>
      </div>
      <NButton text size="tiny" @click="collapsed = !collapsed">
        <NIcon>
          <icon-mdi-chevron-left v-if="!collapsed" />
          <icon-mdi-chevron-right v-if="collapsed" />
        </NIcon>
      </NButton>
    </div>
    
    <!-- 工具内容 -->
    <div v-if="!collapsed" class="panel-content">
      <!-- 实体操作 -->
      <div class="tool-section">
        <div class="section-header">
          <NIcon size="16" class="text-blue-500">
            <icon-mdi-cube-outline />
          </NIcon>
          <NText class="section-title">实体操作</NText>
        </div>
        
        <div class="tool-grid">
          <div 
            class="tool-item"
            :class="{ active: currentMode === 'select' }"
            @click="setMode('select')"
          >
            <NIcon size="20">
              <icon-mdi-cursor-default />
            </NIcon>
            <span class="tool-label">选择</span>
          </div>
          
          <div 
            class="tool-item"
            :class="{ active: currentMode === 'create' }"
            @click="setMode('create')"
          >
            <NIcon size="20">
              <icon-mdi-plus-box />
            </NIcon>
            <span class="tool-label">创建实体</span>
          </div>
          
          <div 
            class="tool-item"
            :class="{ active: currentMode === 'connect' }"
            @click="setMode('connect')"
          >
            <NIcon size="20">
              <icon-mdi-vector-line />
            </NIcon>
            <span class="tool-label">连接关系</span>
          </div>
          
          <div 
            class="tool-item"
            @click="handleDeleteSelected"
          >
            <NIcon size="20" class="text-red-500">
              <icon-mdi-delete />
            </NIcon>
            <span class="tool-label">删除</span>
          </div>
        </div>
      </div>
      
      <!-- 关系类型 -->
      <div class="tool-section">
        <div class="section-header">
          <NIcon size="16" class="text-green-500">
            <icon-mdi-connection />
          </NIcon>
          <NText class="section-title">关系类型</NText>
        </div>
        
        <div class="relationship-types">
          <div 
            v-for="type in relationshipTypes"
            :key="type.value"
            class="relationship-type"
            :class="{ active: currentRelationType === type.value }"
            @click="setRelationType(type.value)"
          >
            <div class="type-icon">
              <component :is="type.icon" />
            </div>
            <div class="type-info">
              <div class="type-name">{{ type.label }}</div>
              <div class="type-desc">{{ type.description }}</div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 实体模板 -->
      <div class="tool-section">
        <div class="section-header">
          <NIcon size="16" class="text-orange-500">
            <icon-mdi-file-document-multiple />
          </NIcon>
          <NText class="section-title">实体模板</NText>
        </div>
        
        <div class="template-list">
          <div 
            v-for="template in entityTemplates"
            :key="template.id"
            class="template-item"
            @click="createFromTemplate(template)"
          >
            <div class="template-icon">
              <NIcon size="16" :class="template.iconColor">
                <component :is="template.icon" />
              </NIcon>
            </div>
            <div class="template-info">
              <div class="template-name">{{ template.name }}</div>
              <div class="template-desc">{{ template.description }}</div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 图层控制 -->
      <div class="tool-section">
        <div class="section-header">
          <NIcon size="16" class="text-indigo-500">
            <icon-mdi-layers />
          </NIcon>
          <NText class="section-title">图层控制</NText>
        </div>
        
        <div class="layer-controls">
          <div class="control-item">
            <NText depth="3" class="text-sm">显示网格</NText>
            <NSwitch 
              v-model:value="showGrid" 
              size="small"
              @update:value="handleGridToggle"
            />
          </div>
          
          <div class="control-item">
            <NText depth="3" class="text-sm">显示连接点</NText>
            <NSwitch 
              v-model:value="showPorts" 
              size="small"
              @update:value="handlePortsToggle"
            />
          </div>
          
          <div class="control-item">
            <NText depth="3" class="text-sm">显示小地图</NText>
            <NSwitch 
              v-model:value="showMinimap" 
              size="small"
              @update:value="handleMinimapToggle"
            />
          </div>
          
          <div class="control-item">
            <NText depth="3" class="text-sm">显示标尺</NText>
            <NSwitch 
              v-model:value="showRuler" 
              size="small"
              @update:value="handleRulerToggle"
            />
          </div>
        </div>
      </div>
      
      <!-- 小地图 -->
      <div v-if="showMinimap" class="tool-section">
        <div class="section-header">
          <NIcon size="16" class="text-teal-500">
            <icon-mdi-map />
          </NIcon>
          <NText class="section-title">小地图</NText>
        </div>
        
        <div class="minimap-container">
          <div ref="minimapContainer" class="minimap"></div>
        </div>
      </div>
      
      <!-- 快捷操作 -->
      <div class="tool-section">
        <div class="section-header">
          <NIcon size="16" class="text-cyan-500">
            <icon-mdi-lightning-bolt />
          </NIcon>
          <NText class="section-title">快捷操作</NText>
        </div>
        
        <div class="quick-actions">
          <NButton block size="small" @click="handleAutoLayout">
            <template #icon>
              <NIcon><icon-mdi-auto-fix /></NIcon>
            </template>
            自动布局
          </NButton>
          
          <NButton block size="small" @click="handleAlignLeft">
            <template #icon>
              <NIcon><icon-mdi-format-align-left /></NIcon>
            </template>
            左对齐
          </NButton>
          
          <NButton block size="small" @click="handleAlignCenter">
            <template #icon>
              <NIcon><icon-mdi-format-align-center /></NIcon>
            </template>
            居中对齐
          </NButton>
          
          <NButton block size="small" @click="handleDistributeHorizontal">
            <template #icon>
              <NIcon><icon-mdi-distribute-horizontal-left /></NIcon>
            </template>
            水平分布
          </NButton>
          
          <NButton block size="small" @click="handleDistributeVertical">
            <template #icon>
              <NIcon><icon-mdi-distribute-vertical-top /></NIcon>
            </template>
            垂直分布
          </NButton>
        </div>
      </div>
      
      <!-- 导入导出 -->
      <div class="tool-section">
        <div class="section-header">
          <NIcon size="16" class="text-pink-500">
            <icon-mdi-import />
          </NIcon>
          <NText class="section-title">导入导出</NText>
        </div>
        
        <div class="import-export">
          <NButton block size="small" @click="handleImportEntities">
            <template #icon>
              <NIcon><icon-mdi-file-import /></NIcon>
            </template>
            导入实体
          </NButton>
          
          <NButton block size="small" @click="handleExportEntities">
            <template #icon>
              <NIcon><icon-mdi-file-export /></NIcon>
            </template>
            导出实体
          </NButton>
          
          <NButton block size="small" @click="handleExportSQL">
            <template #icon>
              <NIcon><icon-mdi-database-export /></NIcon>
            </template>
            导出SQL
          </NButton>
          
          <NButton block size="small" @click="handleExportImage">
            <template #icon>
              <NIcon><icon-mdi-image-outline /></NIcon>
            </template>
            导出图片
          </NButton>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';
import { 
  NText, NIcon, NButton, NSwitch, useMessage 
} from 'naive-ui';

// 图标导入
import IconMdiToolbox from '~icons/mdi/toolbox';
import IconMdiChevronLeft from '~icons/mdi/chevron-left';
import IconMdiChevronRight from '~icons/mdi/chevron-right';
import IconMdiCubeOutline from '~icons/mdi/cube-outline';
import IconMdiCursorDefault from '~icons/mdi/cursor-default';
import IconMdiPlusBox from '~icons/mdi/plus-box';
import IconMdiVectorLine from '~icons/mdi/vector-line';
import IconMdiDelete from '~icons/mdi/delete';
import IconMdiConnection from '~icons/mdi/connection';
import IconMdiFileDocumentMultiple from '~icons/mdi/file-document-multiple';
import IconMdiLayers from '~icons/mdi/layers';
import IconMdiLightningBolt from '~icons/mdi/lightning-bolt';
import IconMdiImport from '~icons/mdi/import';
import IconMdiAutoFix from '~icons/mdi/auto-fix';
import IconMdiFormatAlignLeft from '~icons/mdi/format-align-left';
import IconMdiFormatAlignCenter from '~icons/mdi/format-align-center';
import IconMdiDistributeHorizontalLeft from '~icons/mdi/distribute-horizontal-left';
import IconMdiDistributeVerticalTop from '~icons/mdi/distribute-vertical-top';
import IconMdiFileImport from '~icons/mdi/file-import';
import IconMdiFileExport from '~icons/mdi/file-export';
import IconMdiDatabaseExport from '~icons/mdi/database-export';
import IconMdiImageOutline from '~icons/mdi/image-outline';
import IconMdiNumeric1Box from '~icons/mdi/numeric-1-box';
import IconMdiVectorPolyline from '~icons/mdi/vector-polyline';
import IconMdiVectorSquare from '~icons/mdi/vector-square';
import IconMdiAccount from '~icons/mdi/account';
import IconMdiCart from '~icons/mdi/cart';
import IconMdiCog from '~icons/mdi/cog';
import IconMdiFileDocument from '~icons/mdi/file-document';
import IconMdiMap from '~icons/mdi/map';

/**
 * 工具箱面板组件
 * @description 提供实体设计器的各种工具和操作
 */

interface EntityTemplate {
  id: string;
  name: string;
  description: string;
  icon: any;
  iconColor: string;
  fields: Array<{
    name: string;
    type: string;
    required: boolean;
  }>;
}

interface RelationshipType {
  value: string;
  label: string;
  description: string;
  icon: any;
}

const emit = defineEmits<{
  /** 模式变更事件 */
  'mode-change': [mode: string];
  /** 关系类型变更事件 */
  'relationship-type-change': [type: string];
  /** 删除选中项事件 */
  'delete-selected': [];
  /** 创建实体事件 */
  'create-entity': [template?: EntityTemplate];
  /** 显示选项变更事件 */
  'display-option-change': [option: string, value: boolean];
  /** 布局操作事件 */
  'layout-action': [action: string];
  /** 导入导出事件 */
  'import-export': [action: string];
}>();

const message = useMessage();

// 模板引用
const minimapContainer = ref<HTMLDivElement>();

// 状态管理
const collapsed = ref(false);
const currentMode = ref('select');
const currentRelationType = ref('ONE_TO_MANY');
const showGrid = ref(true);
const showPorts = ref(true);
const showMinimap = ref(false);
const showRuler = ref(false);

// 暴露minimapContainer给父组件
defineExpose({
  minimapContainer
});

// 关系类型配置
const relationshipTypes: RelationshipType[] = [
  {
    value: 'ONE_TO_ONE',
    label: '一对一',
    description: '1:1',
    icon: IconMdiNumeric1Box
  },
  {
    value: 'ONE_TO_MANY',
    label: '一对多',
    description: '1:N',
    icon: IconMdiVectorPolyline
  },
  {
    value: 'MANY_TO_MANY',
    label: '多对多',
    description: 'N:N',
    icon: IconMdiVectorSquare
  }
];

// 实体模板配置
const entityTemplates: EntityTemplate[] = [
  {
    id: 'user',
    name: '用户',
    description: '用户实体模板',
    icon: IconMdiAccount,
    iconColor: 'text-blue-500',
    fields: [
      { name: 'id', type: 'bigint', required: true },
      { name: 'username', type: 'varchar', required: true },
      { name: 'email', type: 'varchar', required: true },
      { name: 'created_at', type: 'timestamp', required: true }
    ]
  },
  {
    id: 'order',
    name: '订单',
    description: '订单实体模板',
    icon: IconMdiCart,
    iconColor: 'text-green-500',
    fields: [
      { name: 'id', type: 'bigint', required: true },
      { name: 'order_no', type: 'varchar', required: true },
      { name: 'amount', type: 'decimal', required: true },
      { name: 'status', type: 'varchar', required: true },
      { name: 'created_at', type: 'timestamp', required: true }
    ]
  },
  {
    id: 'config',
    name: '配置',
    description: '配置实体模板',
    icon: IconMdiCog,
    iconColor: 'text-purple-500',
    fields: [
      { name: 'id', type: 'bigint', required: true },
      { name: 'key', type: 'varchar', required: true },
      { name: 'value', type: 'text', required: false },
      { name: 'description', type: 'varchar', required: false }
    ]
  },
  {
    id: 'log',
    name: '日志',
    description: '日志实体模板',
    icon: IconMdiFileDocument,
    iconColor: 'text-orange-500',
    fields: [
      { name: 'id', type: 'bigint', required: true },
      { name: 'level', type: 'varchar', required: true },
      { name: 'message', type: 'text', required: true },
      { name: 'timestamp', type: 'timestamp', required: true }
    ]
  }
];

/**
 * 设置操作模式
 * @param mode - 操作模式
 */
function setMode(mode: string) {
  currentMode.value = mode;
  emit('mode-change', mode);
}

/**
 * 设置关系类型
 * @param type - 关系类型
 */
function setRelationType(type: string) {
  currentRelationType.value = type;
  emit('relationship-type-change', type);
}

/**
 * 删除选中项
 */
function handleDeleteSelected() {
  emit('delete-selected');
}

/**
 * 从模板创建实体
 * @param template - 实体模板
 */
function createFromTemplate(template: EntityTemplate) {
  emit('create-entity', template);
  message.success(`已创建${template.name}实体`);
}

/**
 * 处理网格显示切换
 * @param value - 是否显示
 */
function handleGridToggle(value: boolean) {
  emit('display-option-change', 'grid', value);
}

/**
 * 处理连接点显示切换
 * @param value - 是否显示
 */
function handlePortsToggle(value: boolean) {
  emit('display-option-change', 'ports', value);
}

/**
 * 处理小地图显示切换
 * @param value - 是否显示
 */
function handleMinimapToggle(value: boolean) {
  emit('display-option-change', 'minimap', value);
}

/**
 * 处理标尺显示切换
 * @param value - 是否显示
 */
function handleRulerToggle(value: boolean) {
  emit('display-option-change', 'ruler', value);
}

/**
 * 自动布局
 */
function handleAutoLayout() {
  emit('layout-action', 'auto');
  message.success('已应用自动布局');
}

/**
 * 左对齐
 */
function handleAlignLeft() {
  emit('layout-action', 'align-left');
  message.success('已左对齐选中实体');
}

/**
 * 居中对齐
 */
function handleAlignCenter() {
  emit('layout-action', 'align-center');
  message.success('已居中对齐选中实体');
}

/**
 * 水平分布
 */
function handleDistributeHorizontal() {
  emit('layout-action', 'distribute-horizontal');
  message.success('已水平分布选中实体');
}

/**
 * 垂直分布
 */
function handleDistributeVertical() {
  emit('layout-action', 'distribute-vertical');
  message.success('已垂直分布选中实体');
}

/**
 * 导入实体
 */
function handleImportEntities() {
  emit('import-export', 'import-entities');
}

/**
 * 导出实体
 */
function handleExportEntities() {
  emit('import-export', 'export-entities');
}

/**
 * 导出SQL
 */
function handleExportSQL() {
  emit('import-export', 'export-sql');
}

/**
 * 导出图片
 */
function handleExportImage() {
  emit('import-export', 'export-image');
}
</script>

<style scoped>
.toolbox-panel {
  @apply h-full flex flex-col bg-white border-r border-gray-200;
  width: 280px;
  transition: width 0.3s ease;
}

.toolbox-panel:has(.panel-content:not(:empty)) {
  width: 280px;
}

.collapsed .toolbox-panel {
  width: 48px;
}

.panel-header {
  @apply flex items-center justify-between p-3 border-b border-gray-100;
}

.header-title {
  @apply flex items-center;
}

.panel-content {
  @apply flex-1 overflow-y-auto p-3 space-y-4;
}

.tool-section {
  @apply space-y-3;
}

.section-header {
  @apply flex items-center space-x-2 pb-2 border-b border-gray-100;
}

.section-title {
  @apply text-sm font-medium text-gray-700;
}

.tool-grid {
  @apply grid grid-cols-2 gap-2;
}

.tool-item {
  @apply flex flex-col items-center p-3 rounded-lg border border-gray-200 cursor-pointer transition-all;
  @apply hover:border-blue-300 hover:bg-blue-50;
}

.tool-item.active {
  @apply border-blue-500 bg-blue-50 text-blue-600;
}

.tool-label {
  @apply text-xs mt-1 text-center;
}

.relationship-types {
  @apply space-y-2;
}

.relationship-type {
  @apply flex items-center p-2 rounded-lg border border-gray-200 cursor-pointer transition-all;
  @apply hover:border-green-300 hover:bg-green-50;
}

.relationship-type.active {
  @apply border-green-500 bg-green-50;
}

.type-icon {
  @apply flex items-center justify-center w-8 h-8 rounded bg-gray-100 mr-3;
}

.type-info {
  @apply flex-1;
}

.type-name {
  @apply text-sm font-medium;
}

.type-desc {
  @apply text-xs text-gray-500;
}

.template-list {
  @apply space-y-2;
}

.template-item {
  @apply flex items-center p-2 rounded-lg border border-gray-200 cursor-pointer transition-all;
  @apply hover:border-orange-300 hover:bg-orange-50;
}

.template-icon {
  @apply flex items-center justify-center w-8 h-8 rounded bg-gray-100 mr-3;
}

.template-info {
  @apply flex-1;
}

.template-name {
  @apply text-sm font-medium;
}

.template-desc {
  @apply text-xs text-gray-500;
}

.layer-controls {
  @apply space-y-3;
}

.control-item {
  @apply flex items-center justify-between;
}

.quick-actions {
  @apply space-y-2;
}

.import-export {
  @apply space-y-2;
}

.minimap-container {
  @apply bg-gray-50 border border-gray-200 rounded-lg overflow-hidden;
}

.minimap {
  @apply w-full h-32;
}

/* 响应式调整 */
@media (max-width: 1024px) {
  .toolbox-panel {
    width: 240px;
  }
  
  .tool-grid {
    @apply grid-cols-1;
  }
}
</style>