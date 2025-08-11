<script setup lang="ts">
import { Teleport, computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue';
import { NButton, NButtonGroup, NCheckbox, NDivider, NIcon, NSpace, NSpin, NText, useMessage } from 'naive-ui';
import type { Edge, Graph, Node } from '@antv/x6';
import X6GraphCanvas from '../../relationship/components/X6GraphCanvas.vue';
import type { Entity, EntityRelationship, LayoutConfig } from '../types';
import { layoutPersistenceService } from '../services/LayoutPersistenceService';
import { useRelationshipManager } from '../hooks/useRelationshipManager';
import EntityPropertyPanel from './EntityPropertyPanel.vue';
import CreateRelationshipModal from './CreateRelationshipModal.vue';

// 图标导入
import IconMdiVectorArrangeAbove from '~icons/mdi/vector-arrange-above';
import IconMdiGrid from '~icons/mdi/grid';
import IconMdiFileTree from '~icons/mdi/file-tree';
import IconMdiCircleOutline from '~icons/mdi/circle-outline';
import IconMdiCursorDefault from '~icons/mdi/cursor-default';
import IconMdiVectorLine from '~icons/mdi/vector-line';
import IconMdiMagnifyPlus from '~icons/mdi/magnify-plus';
import IconMdiMagnifyMinus from '~icons/mdi/magnify-minus';
import IconMdiFitToPage from '~icons/mdi/fit-to-page';
import IconMdiContentSave from '~icons/mdi/content-save';
import IconMdiVectorPolyline from '~icons/mdi/vector-polyline';
import IconMdiPlus from '~icons/mdi/plus';
import IconMdiCrosshairsGps from '~icons/mdi/crosshairs-gps';
import IconMdiBackupRestore from '~icons/mdi/backup-restore';

/**
 * 基于X6的实体设计器组件
 *
 * 使用X6图形库渲染实体和关系，提供更好的交互体验和一致的坐标系统
 */

interface Props {
  /** 项目ID */
  projectId?: string;
  /** 实体列表 */
  entities: Entity[];
  /** 关系列表 */
  relationships?: EntityRelationship[];
}

const props = withDefaults(defineProps<Props>(), {
  relationships: () => []
});

const emit = defineEmits<{
  /** 实体选择事件 */
  'entity-select': [entity: Entity | null];
  /** 实体创建事件 */
  'entity-create': [];
  /** 实体更新事件 */
  'entity-update': [entity: Entity];
  /** 实体删除事件 */
  'entity-delete': [entityId: string];
  /** 关系选择事件 */
  'relationship-select': [relationship: EntityRelationship | null];
  /** 关系更新事件 */
  'relationship-update': [relationship: EntityRelationship];
}>();

const message = useMessage();

// 组件引用
const graphCanvasRef = ref<InstanceType<typeof X6GraphCanvas>>();

// 图形实例
let graph: Graph | null = null;

// 状态管理
const loading = ref(false);
const layouting = ref(false);
const saving = ref(false);
const currentMode = ref<'select' | 'connect'>('select');
const layoutType = ref<'force' | 'grid' | 'hierarchy' | 'circular'>('force');

// 显示选项
const showGrid = ref(true);
const snapToGrid = ref(false);
const showConnectionPoints = ref(false);
const showRelationshipLabels = ref(true);

// 连接模式状态
const connectSourceNode = ref<any>(null);
const connectingSourceEntity = ref<Entity | null>(null);
const connectingTargetEntity = ref<Entity | null>(null);
const showCreateRelationshipModal = ref(false);

// 选中状态
const selectedNode = ref<any>(null);
const selectedEdge = ref<Edge | null>(null);
const selectedRelationship = ref<EntityRelationship | null>(null);

// 关系管理
const {
  relationships,
  loading: loadingRelationships,
  loadRelationships: loadRelationshipsData,
  createRelationship,
  updateRelationship,
  deleteRelationship
} = useRelationshipManager(props.projectId || '');

// 计算属性
const selectedEntity = computed(() => {
  if (!selectedNode.value) return null;
  const data = selectedNode.value.getData();
  return props.entities.find(e => e.id === data.id) || null;
});

/** 设置当前模式 */
function setMode(mode: 'select' | 'connect') {
  currentMode.value = mode;
  if (mode === 'select') {
    // 重置连接状态
    connectSourceNode.value = null;
    connectingSourceEntity.value = null;
    connectingTargetEntity.value = null;
  }
}

/** 处理图形准备就绪 */
function handleGraphReady(graphInstance: Graph) {
  graph = graphInstance;

  // 添加所有实体到图形中
  props.entities.forEach(entity => {
    addEntityToGraph(entity);
  });

  // 添加所有关系到图形中
  relationships.value.forEach(relationship => {
    addRelationshipToGraph(relationship);
  });

  // 应用默认布局
  nextTick(() => {
    applyLayout(layoutType.value);
  });
}

/** 添加实体到图形 */
function addEntityToGraph(entity: Entity) {
  if (!graph) return;

  // 检查节点是否已存在
  const existingCell = graph.getCellById(entity.id);
  if (existingCell && existingCell.isNode()) {
    // 更新现有节点数据
    const existingNode = existingCell as Node;
    existingNode.setData(entity);
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

  // 更新连接点显示状态
  updateNodeConnectionPoints(node);
}

/** 添加关系到图形 */
function addRelationshipToGraph(relationship: EntityRelationship) {
  if (!graph) return;

  const sourceNode = graph.getCellById(relationship.sourceEntityId);
  const targetNode = graph.getCellById(relationship.targetEntityId);

  if (!sourceNode || !targetNode) {
    console.warn('无法找到关系的源节点或目标节点:', relationship);
    return;
  }

  // 检查边是否已存在
  const existingCell = graph.getCellById(relationship.id);
  if (existingCell && existingCell.isEdge()) {
    // 更新现有边数据
    const existingEdge = existingCell as Edge;
    existingEdge.setData(relationship);
    return;
  }

  const edge = graph.addEdge({
    id: relationship.id,
    source: { cell: sourceNode.id, port: 'right' },
    target: { cell: targetNode.id, port: 'left' },
    data: relationship,
    label: relationship.name,
    attrs: {
      line: {
        stroke: '#5F95FF',
        strokeWidth: 2,
        targetMarker: {
          name: 'classic',
          size: 8
        }
      }
    }
  });
}

/** 更新节点连接点显示 */
function updateNodeConnectionPoints(node: Node) {
  if (!node) return;

  const ports = node.getPorts();
  const visibility = showConnectionPoints.value ? 'visible' : 'hidden';

  ports.forEach(port => {
    node.setPortProp(port.id!, 'attrs/circle/style/visibility', visibility);
  });
}

/** 应用布局算法 */
async function applyLayout(type: 'force' | 'grid' | 'hierarchy' | 'circular') {
  if (!graph || props.entities.length === 0) return;

  layouting.value = true;
  layoutType.value = type;

  try {
    const nodes = graph.getNodes();

    switch (type) {
      case 'grid':
        applyGridLayout(nodes);
        break;
      case 'force':
        await applyForceLayout(nodes);
        break;
      case 'hierarchy':
        applyHierarchyLayout(nodes);
        break;
      case 'circular':
        applyCircularLayout(nodes);
        break;
    }

    // 适应视图
    setTimeout(() => {
      fitView();
    }, 100);
  } catch (error) {
    console.error('布局应用失败:', error);
    message.error('布局应用失败');
  } finally {
    layouting.value = false;
  }
}

/** 网格布局 */
function applyGridLayout(nodes: Node[]) {
  const cols = Math.ceil(Math.sqrt(nodes.length));
  const spacing = 250;

  nodes.forEach((node, index) => {
    const row = Math.floor(index / cols);
    const col = index % cols;

    node.setPosition({
      x: col * spacing + 100,
      y: row * spacing + 100
    });
  });
}

/** 力导向布局 */
async function applyForceLayout(nodes: Node[]) {
  // 简化的力导向布局实现
  const centerX = 400;
  const centerY = 300;
  const radius = 200;

  nodes.forEach((node, index) => {
    const angle = (index / nodes.length) * 2 * Math.PI;
    const x = centerX + Math.cos(angle) * radius;
    const y = centerY + Math.sin(angle) * radius;

    node.setPosition({ x, y });
  });
}

/** 层次布局 */
function applyHierarchyLayout(nodes: Node[]) {
  const levels = Math.ceil(nodes.length / 3);
  const spacing = 250;

  nodes.forEach((node, index) => {
    const level = Math.floor(index / 3);
    const position = index % 3;

    node.setPosition({
      x: position * spacing + 100,
      y: level * spacing + 100
    });
  });
}

/** 圆形布局 */
function applyCircularLayout(nodes: Node[]) {
  const centerX = 400;
  const centerY = 300;
  const radius = 200;

  nodes.forEach((node, index) => {
    const angle = (index / nodes.length) * 2 * Math.PI;
    const x = centerX + Math.cos(angle) * radius;
    const y = centerY + Math.sin(angle) * radius;

    node.setPosition({ x, y });
  });
}

/** 视图控制函数 */
function zoomIn() {
  if (graph) {
    graph.zoom(0.1);
  }
}

function zoomOut() {
  if (graph) {
    graph.zoom(-0.1);
  }
}

function fitView() {
  if (graph) {
    graph.zoomToFit({ padding: 20 });
  }
}

/** 居中视图 */
function centerView() {
  if (graph) {
    graph.centerContent();
  }
}

/** 重置视图 */
function resetView() {
  if (graph) {
    graph.zoomTo(1);
    graph.centerContent();
  }
}

/** 切换网格显示 */
function toggleGrid() {
  // 网格显示状态已通过 v-model 绑定到 X6GraphCanvas
}

/** 切换连接点显示 */
function toggleConnectionPoints() {
  if (!graph) return;

  const nodes = graph.getNodes();
  nodes.forEach(node => {
    updateNodeConnectionPoints(node);
  });
}

/** 事件处理函数 */
function handleNodeSelected(node: Node) {
  selectedNode.value = node;
  selectedEdge.value = null;
  selectedRelationship.value = null;

  const data = node.getData();
  const entity = props.entities.find(e => e.id === data.id);
  if (entity) {
    emit('entity-select', entity);
  }
}

function handleEdgeSelected(edge: Edge) {
  selectedEdge.value = edge;
  selectedNode.value = null;

  const data = edge.getData();
  const relationship = relationships.value.find(r => r.id === data.id);
  if (relationship) {
    selectedRelationship.value = relationship;
    emit('relationship-select', relationship);
  }
}

function handleSelectionCleared() {
  selectedNode.value = null;
  selectedEdge.value = null;
  selectedRelationship.value = null;
  emit('entity-select', null);
  emit('relationship-select', null);
}

function handleNodeClicked(node: Node) {
  if (currentMode.value === 'connect') {
    if (!connectSourceNode.value) {
      // 选择源节点
      connectSourceNode.value = node;
      const data = node.getData();
      connectingSourceEntity.value = props.entities.find(e => e.id === data.id) || null;
      message.info(`已选择源实体: ${data.name}，请选择目标实体`);
    } else {
      // 选择目标节点
      const data = node.getData();
      connectingTargetEntity.value = props.entities.find(e => e.id === data.id) || null;

      if (connectSourceNode.value.id === node.id) {
        message.warning('不能连接到自身');
        return;
      }

      // 显示创建关系弹窗
      showCreateRelationshipModal.value = true;
    }
  }
}

function handleCancelConnect() {
  connectSourceNode.value = null;
  connectingSourceEntity.value = null;
  connectingTargetEntity.value = null;
  setMode('select');
}

function handleCreateRelationship(sourceNode: Node, targetNode: Node) {
  // 这个事件由 X6GraphCanvas 触发，但我们使用自己的逻辑
}

/** 关系管理函数 */
async function handleCreateRelationshipConfirm(relationshipData: Partial<EntityRelationship>) {
  try {
    if (!relationshipData.name || !relationshipData.sourceEntityId || !relationshipData.targetEntityId) {
      message.error('关系数据不完整，请检查表单');
      return;
    }

    const completeData = {
      ...relationshipData,
      projectId: props.projectId || ''
    };

    await createRelationship(completeData);
    message.success(`成功创建关系: ${relationshipData.name}`);

    // 添加关系到图形
    const newRelationship = relationships.value.find(
      r =>
        r.sourceEntityId === relationshipData.sourceEntityId &&
        r.targetEntityId === relationshipData.targetEntityId &&
        r.name === relationshipData.name
    );

    if (newRelationship) {
      addRelationshipToGraph(newRelationship);
    }

    // 关闭弹窗并重置状态
    showCreateRelationshipModal.value = false;
    handleCancelConnect();
  } catch (error: any) {
    console.error('创建关系失败:', error);
    message.error(`创建关系失败: ${error?.message || '未知错误'}`);
  }
}

function handleCreateRelationshipCancel() {
  showCreateRelationshipModal.value = false;
  handleCancelConnect();
  message.info('已取消创建关系');
}

/** 属性面板处理函数 */
function handleEntityUpdate(entity: Entity) {
  // 更新图形中的节点
  if (graph) {
    const cell = graph.getCellById(entity.id);
    if (cell && cell.isNode()) {
      const node = cell as Node;
      node.setData(entity);
      // 更新节点位置和尺寸
      if (entity.x !== undefined && entity.y !== undefined) {
        node.setPosition({ x: entity.x, y: entity.y });
      }
      if (entity.width !== undefined && entity.height !== undefined) {
        node.setSize({ width: entity.width, height: entity.height });
      }
    }
  }

  emit('entity-update', entity);
}

function handleRelationshipUpdate(relationship: EntityRelationship) {
  // 更新图形中的边
  if (graph) {
    const cell = graph.getCellById(relationship.id);
    if (cell && cell.isEdge()) {
      const edge = cell as Edge;
      edge.setData(relationship);
      edge.setLabels([{ attrs: { text: { text: relationship.name } } }]);
    }
  }

  emit('relationship-update', relationship);
}

function handleClosePropertyPanel() {
  selectedNode.value = null;
  selectedEdge.value = null;
  selectedRelationship.value = null;
  emit('entity-select', null);
  emit('relationship-select', null);
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

/** 保存布局 */
async function saveLayout() {
  if (!graph || !props.projectId) return;

  saving.value = true;
  try {
    // 收集所有节点的位置信息
    const nodes = graph.getNodes();
    const updatedEntities = nodes.map(node => {
      const data = node.getData();
      const position = node.getPosition();
      const size = node.getSize();

      return {
        ...data,
        x: position.x,
        y: position.y,
        width: size.width,
        height: size.height
      };
    });

    // 保存到持久化服务
    await layoutPersistenceService.saveLayout(
      props.projectId,
      updatedEntities,
      relationships.value,
      { type: layoutType.value, options: {} } as LayoutConfig,
      {
        x: 0,
        y: 0,
        zoom: graph.zoom()
      }
    );

    message.success('布局保存成功');
  } catch (error) {
    console.error('保存布局失败:', error);
    message.error('布局保存失败');
  } finally {
    saving.value = false;
  }
}

// 监听实体变化
watch(
  () => props.entities,
  newEntities => {
    if (!graph) return;

    // 添加新实体
    newEntities.forEach(entity => {
      const existingNode = graph!.getCellById(entity.id);
      if (!existingNode) {
        addEntityToGraph(entity);
      }
    });

    // 移除不存在的实体
    const entityIds = new Set(newEntities.map(e => e.id));
    const nodes = graph!.getNodes();
    nodes.forEach(node => {
      const data = node.getData();
      if (!entityIds.has(data.id)) {
        graph!.removeCell(node);
      }
    });
  },
  { deep: true }
);

// 监听关系变化
watch(
  () => relationships.value,
  newRelationships => {
    if (!graph) return;

    // 添加新关系
    newRelationships.forEach(relationship => {
      const existingEdge = graph!.getCellById(relationship.id);
      if (!existingEdge) {
        addRelationshipToGraph(relationship);
      }
    });

    // 移除不存在的关系
    const relationshipIds = new Set(newRelationships.map(r => r.id));
    const edges = graph!.getEdges();
    edges.forEach(edge => {
      const data = edge.getData();
      if (data && !relationshipIds.has(data.id)) {
        graph!.removeCell(edge);
      }
    });
  },
  { deep: true }
);

// 监听项目ID变化
watch(
  () => props.projectId,
  async (newProjectId, oldProjectId) => {
    if (newProjectId && newProjectId !== oldProjectId) {
      // 项目切换时重新加载关系数据
      await loadRelationshipsData();

      // 清空当前图形
      if (graph) {
        graph.clearCells();

        // 重新添加实体
        props.entities.forEach(entity => {
          addEntityToGraph(entity);
        });

        // 重新添加关系
        relationships.value.forEach(relationship => {
          addRelationshipToGraph(relationship);
        });

        // 重新应用布局
        nextTick(() => {
          applyLayout(layoutType.value);
        });
      }
    }
  },
  { immediate: false }
);

// 组件挂载时初始化
onMounted(async () => {
  // 加载关系数据
  if (props.projectId) {
    await loadRelationshipsData();
  }
});

// 组件卸载时清理
onUnmounted(() => {
  if (graph) {
    graph.dispose();
    graph = null;
  }
});
</script>

<template>
  <div class="x6-entity-designer">
    <!-- Designer Toolbar -->
    <div class="designer-toolbar">
      <div class="toolbar-left">
        <NSpace>
          <!-- Mode Controls -->
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
          </NButtonGroup>

          <NDivider vertical />

          <!-- Layout Controls -->
          <NButtonGroup>
            <NButton size="small" :type="layoutType === 'force' ? 'primary' : 'default'" @click="applyLayout('force')">
              <template #icon>
                <NIcon><icon-mdi-vector-arrange-above /></NIcon>
              </template>
              力导向
            </NButton>
            <NButton size="small" :type="layoutType === 'grid' ? 'primary' : 'default'" @click="applyLayout('grid')">
              <template #icon>
                <NIcon><icon-mdi-grid /></NIcon>
              </template>
              网格
            </NButton>
            <NButton
              size="small"
              :type="layoutType === 'hierarchy' ? 'primary' : 'default'"
              @click="applyLayout('hierarchy')"
            >
              <template #icon>
                <NIcon><icon-mdi-file-tree /></NIcon>
              </template>
              层次
            </NButton>
            <NButton
              size="small"
              :type="layoutType === 'circular' ? 'primary' : 'default'"
              @click="applyLayout('circular')"
            >
              <template #icon>
                <NIcon><icon-mdi-circle-outline /></NIcon>
              </template>
              圆形
            </NButton>
          </NButtonGroup>

          <NDivider vertical />

          <!-- View Controls -->
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
            <NButton size="small" @click="fitView">
              <template #icon>
                <NIcon><icon-mdi-fit-to-page /></NIcon>
              </template>
              适应画布
            </NButton>
            <NButton size="small" @click="centerView">
              <template #icon>
                <NIcon><icon-mdi-crosshairs-gps /></NIcon>
              </template>
              居中
            </NButton>
            <NButton size="small" @click="resetView">
              <template #icon>
                <NIcon><icon-mdi-backup-restore /></NIcon>
              </template>
              重置视图
            </NButton>
          </NButtonGroup>

          <NDivider vertical />

          <!-- Display Options -->
          <NSpace>
            <NCheckbox v-model:checked="showGrid" @update:checked="toggleGrid">显示网格</NCheckbox>
            <NCheckbox v-model:checked="showConnectionPoints" @update:checked="toggleConnectionPoints">
              显示连接点
            </NCheckbox>
            <NCheckbox v-model:checked="showRelationshipLabels">显示关系标签</NCheckbox>
          </NSpace>
        </NSpace>
      </div>

      <div class="toolbar-right">
        <NSpace>
          <NButton size="small" :loading="saving" @click="saveLayout">
            <template #icon>
              <NIcon><icon-mdi-content-save /></NIcon>
            </template>
            保存布局
          </NButton>
        </NSpace>
      </div>
    </div>

    <!-- X6 Graph Canvas -->
    <div class="designer-canvas">
      <X6GraphCanvas
        ref="graphCanvasRef"
        :is-connect-mode="currentMode === 'connect'"
        :connect-source-node="connectSourceNode"
        :show-grid="showGrid"
        :snap-to-grid="snapToGrid"
        :show-connection-points="showConnectionPoints"
        @graph-ready="handleGraphReady"
        @node-selected="handleNodeSelected"
        @edge-selected="handleEdgeSelected"
        @selection-cleared="handleSelectionCleared"
        @node-clicked="handleNodeClicked"
        @cancel-connect="handleCancelConnect"
        @create-relationship="handleCreateRelationship"
      />

      <!-- Loading Overlay -->
      <div v-if="loading" class="loading-overlay">
        <NSpin size="large">
          <template #description>正在{{ layouting ? '布局' : '加载' }}实体设计器...</template>
        </NSpin>
      </div>

      <!-- Empty State -->
      <div v-if="!loading && entities.length === 0" class="empty-state">
        <div class="empty-content">
          <NIcon size="64" class="text-gray-400">
            <icon-mdi-vector-polyline />
          </NIcon>
          <NText class="mt-4 text-lg font-medium">暂无实体</NText>
          <NText class="mt-2 text-gray-500">请先创建实体，然后在此设计实体关系</NText>
          <NButton type="primary" class="mt-4" @click="$emit('entity-create')">
            <template #icon>
              <NIcon><icon-mdi-plus /></NIcon>
            </template>
            创建实体
          </NButton>
        </div>
      </div>
    </div>

    <!-- Property Panel - 使用 Teleport 传送到 body -->
    <Teleport to="body">
      <div v-if="selectedEntity" class="property-panel-overlay">
        <div class="property-panel-container">
          <EntityPropertyPanel
            :entity="selectedEntity"
            @update="handleEntityUpdate"
            @close="handleClosePropertyPanel"
            @fields-update="handleFieldsUpdate"
            @field-add="handleFieldAdd"
            @field-update="handleFieldUpdate"
            @field-delete="handleFieldDelete"
          />
        </div>
      </div>
    </Teleport>

    <!-- 创建关系弹窗 -->
    <CreateRelationshipModal
      v-model:visible="showCreateRelationshipModal"
      :source-entity="connectingSourceEntity"
      :target-entity="connectingTargetEntity"
      :loading="loadingRelationships"
      @confirm="handleCreateRelationshipConfirm"
      @cancel="handleCreateRelationshipCancel"
    />
  </div>
</template>

<style scoped>
.x6-entity-designer {
  @apply flex flex-col h-full;
}

.designer-toolbar {
  @apply flex items-center justify-between p-4 bg-white border-b border-gray-200;
}

.toolbar-left {
  @apply flex items-center;
}

.toolbar-right {
  @apply flex items-center;
}

.designer-canvas {
  @apply flex-1 relative;
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

/* 属性面板覆盖层样式 */
.property-panel-overlay {
  @apply fixed inset-0 z-[1000] pointer-events-none;
}

.property-panel-container {
  @apply absolute top-0 right-0 w-80 h-full bg-white border-l border-gray-200 shadow-lg pointer-events-auto;
}
</style>
