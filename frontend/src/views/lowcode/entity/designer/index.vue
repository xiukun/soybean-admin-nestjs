<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { NButton, NButtonGroup, NCheckbox, NDivider, NDropdown, NIcon, NSpace, NText, useMessage } from 'naive-ui';
import type { Edge, Graph, Node } from '@antv/x6';
import EntityPropertyPanel from '../components/EntityPropertyPanel.vue';
import RelationshipPropertyPanel from '../components/RelationshipPropertyPanel.vue';
import X6GraphCanvas from '../../relationship/components/X6GraphCanvas.vue';
import ToolboxPanel from '../components/ToolboxPanel.vue';
import type { Entity, EntityRelationship } from '../types';

// 图标导入
import IconMdiArrowLeft from '~icons/mdi/arrow-left';
import IconMdiCursorDefault from '~icons/mdi/cursor-default';
import IconMdiVectorLine from '~icons/mdi/vector-line';
import IconMdiHandBackLeft from '~icons/mdi/hand-back-left';
import IconMdiVectorArrangeAbove from '~icons/mdi/vector-arrange-above';
import IconMdiChevronDown from '~icons/mdi/chevron-down';
import IconMdiMagnifyPlus from '~icons/mdi/magnify-plus';
import IconMdiMagnifyMinus from '~icons/mdi/magnify-minus';
import IconMdiFitToPage from '~icons/mdi/fit-to-page';
import IconMdiCrosshairsGps from '~icons/mdi/crosshairs-gps';
import IconMdiContentSave from '~icons/mdi/content-save';
import IconMdiImageOutline from '~icons/mdi/image-outline';
import IconMdiFullscreenExit from '~icons/mdi/fullscreen-exit';
import IconMdiChevronLeft from '~icons/mdi/chevron-left';
import IconMdiChevronRight from '~icons/mdi/chevron-right';
import IconMdiPlus from '~icons/mdi/plus';
import IconMdiImport from '~icons/mdi/import';

/**
 * 全屏实体关系设计器组件
 *
 * 提供大空间的实体关系设计体验，支持多种布局算法和丰富的交互功能
 */

interface Props {
  /** 项目ID */
  projectId: string;
  /** 项目名称 */
  projectName?: string;
  /** 实体列表 */
  entities: Entity[];
  /** 关系列表 */
  relationships?: EntityRelationship[];
}

const props = withDefaults(defineProps<Props>(), {
  projectName: '未命名项目',
  relationships: () => []
});

const emit = defineEmits<{
  /** 退出全屏事件 */
  'exit-fullscreen': [];
  /** 实体选择事件 */
  'entity-select': [entity: Entity | null];
  /** 实体创建事件 */
  'entity-create': [];
  /** 实体更新事件 */
  'entity-update': [entity: Entity];
  /** 关系更新事件 */
  'relationship-update': [relationship: EntityRelationship];
}>();

const router = useRouter();
const message = useMessage();

// 组件引用
const canvasContainer = ref<HTMLElement>();
const minimapContainer = ref<HTMLElement>();
const graphCanvasRef = ref<InstanceType<typeof X6GraphCanvas>>();
const toolboxPanelRef = ref<InstanceType<typeof ToolboxPanel>>();

// 图形实例
let graph: Graph | null = null;

// 状态管理
const currentMode = ref<'select' | 'connect' | 'pan'>('select');
const saving = ref(false);
const zoomLevel = ref(1);

// 面板状态
const leftPanelCollapsed = ref(false);
const rightPanelCollapsed = ref(false);

// 显示选项
const showGrid = ref(true);
const showConnectionPoints = ref(false);
const showMinimap = ref(true);
const showEntities = ref(true);
const showRelationships = ref(true);
const showLabels = ref(true);

// 选中状态
const selectedEntity = ref<Entity | null>(null);
const selectedRelationship = ref<EntityRelationship | null>(null);
const connectSourceNode = ref<any>(null);
const selectedRelationType = ref('one-to-many');

// 布局选项
const layoutOptions = [
  { label: '力导向布局', key: 'force' },
  { label: '层次布局', key: 'hierarchy' },
  { label: '网格布局', key: 'grid' },
  { label: '环形布局', key: 'circular' },
  { label: '自由布局', key: 'free' }
];

// 关系类型
const relationshipTypes = [
  { label: '一对一', value: 'one-to-one', icon: 'mdi:numeric-1' },
  { label: '一对多', value: 'one-to-many', icon: 'mdi:numeric-1-box-multiple' },
  { label: '多对多', value: 'many-to-many', icon: 'mdi:vector-intersection' }
];

/**
 * 设置当前操作模式
 *
 * @param mode - 操作模式
 */
function setMode(mode: 'select' | 'connect' | 'pan') {
  currentMode.value = mode;
  if (mode === 'select') {
    connectSourceNode.value = null;
  }
}

/**
 * 应用布局算法
 *
 * @param layoutKey - 布局类型
 */
function applyLayout(layoutKey: string) {
  if (!graph) return;

  // 这里将实现不同的布局算法
  console.log('应用布局:', layoutKey);
  message.info(`正在应用${layoutOptions.find(l => l.key === layoutKey)?.label}...`);
}

/** 缩放控制 */
function zoomIn() {
  if (graph) {
    graph.zoom(0.1);
    zoomLevel.value = graph.zoom();
  }
}

function zoomOut() {
  if (graph) {
    graph.zoom(-0.1);
    zoomLevel.value = graph.zoom();
  }
}

function fitToScreen() {
  if (graph) {
    graph.zoomToFit({ padding: 20 });
    zoomLevel.value = graph.zoom();
  }
}

function centerView() {
  if (graph) {
    graph.centerContent();
  }
}

/** 显示选项切换 */
function toggleGrid() {
  // 实现网格显示切换
}
function toggleConnectionPoints() {
  // 根据当前开关更新所有节点的连线端口可见性
  if (!graph) return;
  const nodes = graph.getNodes();
  const visibility = showConnectionPoints.value ? 'visible' : 'hidden';
  nodes.forEach(node => {
    node.getPorts().forEach(port => {
      node.setPortProp(port.id!, 'attrs/circle/style/visibility', visibility);
    });
  });
}
function toggleMinimap() {
  // 实现小地图显示切换
}

/** 操作函数 */
function createEntity() {
  emit('entity-create');
}

function importEntities() {
  // 实现实体导入功能
  message.info('导入实体功能开发中...');
}

function selectRelationType(type: string) {
  selectedRelationType.value = type;
}

/** 删除选中项 */
function handleDeleteSelected() {
  message.warning('删除选中项功能开发中...');
}

/**
 * 处理显示选项变更
 *
 * @param option - 选项名称
 * @param value - 选项值
 */
function handleDisplayOptionChange(option: string, value: boolean) {
  switch (option) {
    case 'grid':
      showGrid.value = value;
      break;
    case 'ports':
      showConnectionPoints.value = value;
      toggleConnectionPoints();
      break;
    case 'minimap':
      showMinimap.value = value;
      break;
    case 'entities':
      showEntities.value = value;
      break;
    case 'relationships':
      showRelationships.value = value;
      break;
    case 'labels':
      showLabels.value = value;
      break;
  }
}

/**
 * 处理布局操作
 *
 * @param action - 布局操作类型
 */
function handleLayoutAction(action: string) {
  switch (action) {
    case 'auto':
      applyLayout('force');
      break;
    case 'align-left':
    case 'align-center':
    case 'distribute-horizontal':
    case 'distribute-vertical':
      message.info(`${action}功能开发中...`);
      break;
  }
}

/**
 * 处理导入导出操作
 *
 * @param action - 操作类型
 */
function handleImportExport(action: string) {
  switch (action) {
    case 'import-entities':
      importEntities();
      break;
    case 'export-entities':
      message.info('导出实体功能开发中...');
      break;
    case 'export-sql':
      message.info('导出SQL功能开发中...');
      break;
    case 'export-image':
      exportImage();
      break;
  }
}

function saveLayout() {
  saving.value = true;
  // 实现布局保存功能
  setTimeout(() => {
    saving.value = false;
    message.success('布局已保存');
  }, 1000);
}

function exportImage() {
  // 实现图片导出功能
  message.info('图片导出功能开发中...');
}

function toggleFullscreen() {
  exitFullscreen();
}

function exitFullscreen() {
  emit('exit-fullscreen');
}

/** 添加实体到图形 */
function addEntityToGraph(entity: Entity) {
  if (!graph) return;
  const existing = graph.getCellById(entity.id);
  if (existing && existing.isNode()) {
    (existing as Node).setData(entity);
    return;
  }
  const node = graph.addNode({
    id: entity.id,
    shape: 'entity-node',
    x: entity.x ?? Math.random() * 400 + 100,
    y: entity.y ?? Math.random() * 300 + 100,
    width: entity.width ?? 200,
    height: entity.height ?? 120,
    data: entity,
    label: entity.name,
    ports: {
      groups: {
        top: { position: 'top' },
        right: { position: 'right' },
        bottom: { position: 'bottom' },
        left: { position: 'left' }
      },
      items: [
        { group: 'top', id: 'top' },
        { group: 'right', id: 'right' },
        { group: 'bottom', id: 'bottom' },
        { group: 'left', id: 'left' }
      ]
    }
  });
  // 初始化端口可见性
  updateNodeConnectionPoints(node);
}

/** 添加关系到图形 */
function addRelationshipToGraph(relationship: EntityRelationship) {
  if (!graph) return;
  const existing = graph.getCellById(relationship.id);
  if (existing && existing.isEdge()) {
    (existing as Edge).setData(relationship);
    return;
  }
  const source = relationship.sourceEntityId;
  const target = relationship.targetEntityId;
  if (!source || !target) return;
  graph.addEdge({
    id: relationship.id,
    source: { cell: source, port: 'right' },
    target: { cell: target, port: 'left' },
    data: relationship,
    label: relationship.name,
    attrs: {
      line: { stroke: '#5F95FF', strokeWidth: 2, targetMarker: { name: 'classic', size: 8 } }
    }
  });
}

/** 根据全局开关更新节点端口可见性 */
function updateNodeConnectionPoints(node: Node) {
  const visibility = showConnectionPoints.value ? 'visible' : 'hidden';
  node.getPorts().forEach(port => {
    node.setPortProp(port.id!, 'attrs/circle/style/visibility', visibility);
  });
}

/** 图形事件处理 */
function handleGraphReady(graphInstance: Graph) {
  graph = graphInstance;

  // 监听缩放变化
  graph.on('scale', ({ sx }) => {
    zoomLevel.value = sx;
  });

  // 将现有实体与关系渲染到画布
  props.entities.forEach(e => addEntityToGraph(e));
  (props.relationships || []).forEach(r => addRelationshipToGraph(r));

  // 初始自适应
  nextTick(() => {
    try {
      graph!.zoomToFit({ padding: 20 });
    } catch (e) {}
  });
}

function handleNodeSelected(node: any) {
  const data = node.getData();
  selectedEntity.value = props.entities.find(e => e.id === data.id) || null;
  selectedRelationship.value = null;
  emit('entity-select', selectedEntity.value);
}

function handleEdgeSelected(edge: any) {
  const data = edge.getData();
  selectedRelationship.value = props.relationships.find(r => r.id === data.id) || null;
  selectedEntity.value = null;
}

function handleSelectionCleared() {
  selectedEntity.value = null;
  selectedRelationship.value = null;
  emit('entity-select', null);
}

function handleNodeClicked(node: any) {
  if (currentMode.value === 'connect') {
    if (!connectSourceNode.value) {
      connectSourceNode.value = node;
    } else {
      // 创建连接
      handleCreateRelationship(connectSourceNode.value, node);
      connectSourceNode.value = null;
    }
  } else {
    // 正常选择模式下，点击节点应该选中实体并显示属性面板
    const data = node.getData();
    selectedEntity.value = props.entities.find(e => e.id === data.id) || null;
    selectedRelationship.value = null;
    emit('entity-select', selectedEntity.value);
  }
}

function handleCreateRelationship(sourceNode: any, targetNode: any) {
  // 实现关系创建逻辑
  console.log('创建关系:', sourceNode.getData(), '->', targetNode.getData());
}

function handleEntityUpdate(entity: Entity) {
  // 同步更新图形节点的视觉属性
  if (graph) {
    const node = graph.getCellById(entity.id);
    if (node && node.isNode()) {
      const nodeInstance = node as Node;

      // 更新节点数据
      nodeInstance.setData(entity);

      // 更新节点标签
      if (entity.name) {
        nodeInstance.setLabel(entity.name);
      }

      // 更新节点颜色
      if (entity.color) {
        nodeInstance.setAttrByPath('body/stroke', entity.color);
      }

      // 更新节点尺寸
      if (entity.width && entity.height) {
        nodeInstance.resize(entity.width, entity.height);
      }

      // 更新节点位置
      if (entity.x !== undefined && entity.y !== undefined) {
        nodeInstance.setPosition(entity.x, entity.y);
      }
    }
  }

  emit('entity-update', entity);
}

function handleRelationshipUpdate(relationship: EntityRelationship) {
  emit('relationship-update', relationship);
}

function handleClosePropertyPanel() {
  selectedEntity.value = null;
  selectedRelationship.value = null;
}

/** 字段管理事件处理函数 */
function handleFieldsUpdate(fields: any[]) {
  // 字段列表更新，可以在这里处理相关逻辑
  console.log('Fields updated:', fields);
}

function handleFieldAdd(field: any) {
  // 字段添加，可以在这里处理相关逻辑
  console.log('Field added:', field);
}

function handleFieldUpdate(field: any, index: number) {
  // 字段更新，可以在这里处理相关逻辑
  console.log('Field updated:', field, 'at index:', index);
}

function handleFieldDelete(index: number) {
  // 字段删除，可以在这里处理相关逻辑
  console.log('Field deleted at index:', index);
}

// 组件挂载时初始化
onMounted(() => {
  // 进入全屏模式
  if (canvasContainer.value) {
    canvasContainer.value.requestFullscreen?.();
  }
});
// 监听实体变化，同步增删节点
watch(
  () => props.entities,
  newEntities => {
    if (!graph) return;
    // 添加新增实体
    newEntities.forEach(e => {
      const existing = graph!.getCellById(e.id);
      if (!existing) addEntityToGraph(e);
    });
    // 移除已删除实体
    const ids = new Set(newEntities.map(e => e.id));
    graph!.getNodes().forEach(n => {
      const data = n.getData();
      if (!ids.has(data.id)) graph!.removeCell(n);
    });
  },
  { deep: true }
);

// 监听关系变化，同步增删边
watch(
  () => props.relationships,
  (newRels = []) => {
    if (!graph) return;
    newRels.forEach(r => {
      const existing = graph!.getCellById(r.id);
      if (!existing) addRelationshipToGraph(r);
    });
    const ids = new Set(newRels.map(r => r.id));
    graph!.getEdges().forEach(e => {
      const data = e.getData();
      if (data && !ids.has(data.id)) graph!.removeCell(e);
    });
  },
  { deep: true }
);

// 组件卸载时清理
onUnmounted(() => {
  if (graph) {
    graph.dispose();
    graph = null;
  }
});
</script>

<template>
  <div class="fullscreen-entity-designer">
    <!-- 全屏设计器头部工具栏 -->
    <div class="designer-header">
      <div class="header-left">
        <NSpace>
          <!-- 返回按钮 -->
          <NButton size="small" @click="exitFullscreen">
            <template #icon>
              <NIcon><icon-mdi-arrow-left /></NIcon>
            </template>
            返回
          </NButton>

          <NDivider vertical />

          <!-- 项目信息 -->
          <div class="project-info">
            <NText class="text-lg font-medium">{{ projectName }}</NText>
            <NText depth="3" class="text-sm">实体关系设计器</NText>
          </div>
        </NSpace>
      </div>

      <div class="header-center">
        <NSpace>
          <!-- 模式切换 -->
          <NButtonGroup>
            <NButton size="small" :type="currentMode === 'select' ? 'primary' : 'default'" @click="setMode('select')">
              <template #icon>
                <NIcon><icon-mdi-cursor-default /></NIcon>
              </template>
              选择
            </NButton>
            <NButton size="small" :type="currentMode === 'connect' ? 'primary' : 'default'" @click="setMode('connect')">
              <template #icon>
                <NIcon><icon-mdi-vector-line /></NIcon>
              </template>
              连接
            </NButton>
            <NButton size="small" :type="currentMode === 'pan' ? 'primary' : 'default'" @click="setMode('pan')">
              <template #icon>
                <NIcon><icon-mdi-hand-back-left /></NIcon>
              </template>
              拖拽
            </NButton>
          </NButtonGroup>

          <NDivider vertical />

          <!-- 布局控制 -->
          <NDropdown :options="layoutOptions" @select="applyLayout">
            <NButton size="small">
              <template #icon>
                <NIcon><icon-mdi-vector-arrange-above /></NIcon>
              </template>
              布局算法
              <NIcon><icon-mdi-chevron-down /></NIcon>
            </NButton>
          </NDropdown>

          <!-- 视图控制 -->
          <NButtonGroup>
            <NButton size="small" @click="zoomIn">
              <template #icon>
                <NIcon><icon-mdi-magnify-plus /></NIcon>
              </template>
            </NButton>
            <NButton size="small" @click="zoomOut">
              <template #icon>
                <NIcon><icon-mdi-magnify-minus /></NIcon>
              </template>
            </NButton>
            <NButton size="small" @click="fitToScreen">
              <template #icon>
                <NIcon><icon-mdi-fit-to-page /></NIcon>
              </template>
              适应屏幕
            </NButton>
            <NButton size="small" @click="centerView">
              <template #icon>
                <NIcon><icon-mdi-crosshairs-gps /></NIcon>
              </template>
              居中
            </NButton>
          </NButtonGroup>
        </NSpace>
      </div>

      <div class="header-right">
        <NSpace>
          <!-- 显示选项 -->
          <NCheckbox v-model:checked="showGrid" @update:checked="toggleGrid">网格</NCheckbox>
          <NCheckbox v-model:checked="showConnectionPoints" @update:checked="toggleConnectionPoints">连接点</NCheckbox>
          <NCheckbox v-model:checked="showMinimap" @update:checked="toggleMinimap">小地图</NCheckbox>

          <NDivider vertical />

          <!-- 操作按钮 -->
          <NButton size="small" :loading="saving" @click="saveLayout">
            <template #icon>
              <NIcon><icon-mdi-content-save /></NIcon>
            </template>
            保存
          </NButton>

          <NButton size="small" @click="exportImage">
            <template #icon>
              <NIcon><icon-mdi-image-outline /></NIcon>
            </template>
            导出
          </NButton>

          <NButton size="small" @click="toggleFullscreen">
            <template #icon>
              <NIcon><icon-mdi-fullscreen-exit /></NIcon>
            </template>
            退出全屏
          </NButton>
        </NSpace>
      </div>
    </div>

    <!-- 主要设计区域 -->
    <div class="designer-main">
      <!-- 左侧工具面板 -->
      <ToolboxPanel
        ref="toolboxPanelRef"
        :collapsed="leftPanelCollapsed"
        @toggle-collapse="leftPanelCollapsed = !leftPanelCollapsed"
        @mode-change="(mode: string) => setMode(mode as 'select' | 'connect' | 'pan')"
        @relationship-type-change="selectRelationType"
        @delete-selected="handleDeleteSelected"
        @create-entity="createEntity"
        @display-option-change="handleDisplayOptionChange"
        @layout-action="handleLayoutAction"
        @import-export="handleImportExport"
      />

      <!-- 中央画布区域 -->
      <div class="canvas-area">
        <!-- X6 图形画布 -->
        <div ref="canvasContainer" class="canvas-container">
          <!-- 这里将集成优化后的X6画布组件 -->
          <X6GraphCanvas
            ref="graphCanvasRef"
            :is-connect-mode="currentMode === 'connect'"
            :connect-source-node="connectSourceNode"
            :show-grid="showGrid"
            :snap-to-grid="true"
            :show-connection-points="showConnectionPoints"
            :show-minimap="showMinimap"
            :minimap-container="toolboxPanelRef?.minimapContainer"
            @graph-ready="handleGraphReady"
            @node-selected="handleNodeSelected"
            @edge-selected="handleEdgeSelected"
            @selection-cleared="handleSelectionCleared"
            @node-clicked="handleNodeClicked"
            @create-relationship="handleCreateRelationship"
          />
        </div>

        <!-- 小地图移动到左侧工具面板中 -->

        <!-- 状态栏 -->
        <div class="status-bar">
          <NSpace>
            <NText depth="3" class="text-xs">缩放: {{ Math.round(zoomLevel * 100) }}%</NText>
            <NText depth="3" class="text-xs">实体: {{ entities.length }}</NText>
            <NText depth="3" class="text-xs">关系: {{ relationships.length }}</NText>
            <NText v-if="selectedEntity" depth="3" class="text-xs">选中: {{ selectedEntity.name }}</NText>
          </NSpace>
        </div>
      </div>

      <!-- 右侧属性面板 -->
      <div class="right-panel" :class="{ collapsed: rightPanelCollapsed }">
        <div class="panel-header">
          <NText class="font-medium">属性面板</NText>
          <NButton text size="tiny" @click="rightPanelCollapsed = !rightPanelCollapsed">
            <NIcon>
              <icon-mdi-chevron-right v-if="!rightPanelCollapsed" />
              <icon-mdi-chevron-left v-else />
            </NIcon>
          </NButton>
        </div>

        <div v-if="!rightPanelCollapsed" class="panel-content">
          <!-- 实体属性编辑 -->
          <EntityPropertyPanel
            v-if="selectedEntity"
            :entity="selectedEntity"
            @update="handleEntityUpdate"
            @close="handleClosePropertyPanel"
            @fields-update="handleFieldsUpdate"
            @field-add="handleFieldAdd"
            @field-update="handleFieldUpdate"
            @field-delete="handleFieldDelete"
          />

          <!-- 关系属性编辑 -->
          <RelationshipPropertyPanel
            v-else-if="selectedRelationship"
            :relationship="selectedRelationship"
            @update="handleRelationshipUpdate"
            @close="handleClosePropertyPanel"
          />

          <!-- 空状态 -->
          <div v-else class="empty-selection">
            <NIcon size="48" class="text-gray-300">
              <icon-mdi-cursor-default />
            </NIcon>
            <NText depth="3" class="mt-2 text-center">选择实体或关系以编辑属性</NText>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.fullscreen-entity-designer {
  @apply fixed inset-0 bg-gray-50 z-50 flex flex-col;
}

.designer-header {
  @apply flex items-center justify-between px-4 py-2 bg-white border-b border-gray-200 shadow-sm;
  height: 60px;
}

.header-left {
  @apply flex items-center;
}

.header-center {
  @apply flex items-center;
}

.header-right {
  @apply flex items-center;
}

.project-info {
  @apply flex flex-col;
}

.designer-main {
  @apply flex-1 flex;
}

.left-panel {
  @apply bg-white border-r border-gray-200 transition-all duration-300;
  width: 280px;
}

.left-panel.collapsed {
  width: 48px;
}

.right-panel {
  @apply bg-white border-l border-gray-200 transition-all duration-300;
  width: 320px;
}

.right-panel.collapsed {
  width: 48px;
}

.panel-header {
  @apply flex items-center justify-between p-3 border-b border-gray-100;
}

.panel-content {
  @apply p-3 overflow-y-auto;
  height: calc(100vh - 120px);
}

.canvas-area {
  @apply flex-1 relative;
}

.canvas-container {
  @apply w-full h-full;
}

.minimap-container {
  @apply absolute bottom-4 right-4 w-48 h-32 bg-white border border-gray-200 rounded shadow-lg;
}

.minimap {
  @apply w-full h-full;
}

.status-bar {
  @apply absolute bottom-0 left-0 right-0 px-4 py-2 bg-white border-t border-gray-200;
}

.tool-section {
  @apply mb-6;
}

.section-title {
  @apply block text-sm font-medium text-gray-700 mb-2;
}

.tool-buttons {
  @apply space-y-2;
}

.relationship-types {
  @apply grid grid-cols-3 gap-2;
}

.relationship-type-item {
  @apply flex flex-col items-center p-2 border border-gray-200 rounded cursor-pointer hover:bg-gray-50 transition-colors;
}

.relationship-type-item.active {
  @apply border-blue-500 bg-blue-50;
}

.layer-controls {
  @apply space-y-2;
}

.empty-selection {
  @apply flex flex-col items-center justify-center h-64 text-center;
}
</style>