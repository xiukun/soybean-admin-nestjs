<template>
  <div class="g6-relationship-designer" :class="{ 'connect-mode': isConnectMode }">
    <!-- 工具栏组件 -->
    <Toolbar
      :is-connect-mode="isConnectMode"
      :has-selection="!!(selectedNode || selectedEdge)"
      :zoom-level="zoomLevel"
      :can-undo="canUndo"
      :can-redo="canRedo"
      :loading="loading"
      :layout-loading="layoutLoading"
      :save-loading="saveLoading"
      @toggle-connect-mode="toggleConnectMode"
      @add-entity="showAddEntityDialog"
      @delete-selected="deleteSelected"
      @auto-layout="autoLayout"
      @fit-view="fitView"
      @reset-zoom="resetZoom"
      @zoom-in="zoomIn"
      @zoom-out="zoomOut"
      @export="handleExport"
      @undo="undo"
      @redo="redo"
      @save="saveGraph"
    />

    <!-- 连线提示 -->
    <div v-if="isConnectMode" class="connect-hint">
      <NAlert type="info" :show-icon="false">
        <span v-if="!connectSourceNode">{{ $t('page.lowcode.relationship.selectSourceEntity') }}</span>
        <span v-else>{{ $t('page.lowcode.relationship.selectTargetEntity', { name: connectSourceNode.data?.name }) }}</span>
        <template #action>
          <NButton size="tiny" @click="cancelConnect">{{ $t('page.lowcode.relationship.cancelConnect') }}</NButton>
        </template>
      </NAlert>
    </div>

    <!-- G6画布容器 -->
    <div ref="containerRef" class="graph-container" :class="{ 'connect-mode': isConnectMode }"></div>

    <!-- 属性面板组件 -->
    <PropertyPanel
      :visible="!!(selectedNode || selectedEdge)"
      :selected-item="selectedNode || selectedEdge"
      :selected-type="selectedNode ? 'node' : selectedEdge ? 'edge' : null"
      @close="clearSelection"
      @update-entity="handleUpdateEntity"
      @update-relationship="handleUpdateRelationship"
      @update-entity-position="handleUpdateEntityPosition"
    />

    <!-- 添加实体对话框 -->
    <NModal v-model:show="addEntityModalVisible" preset="dialog" :title="$t('page.lowcode.entity.addEntity')">
      <NForm :model="newEntityForm" label-placement="left" label-width="80px">
        <NFormItem :label="$t('page.lowcode.entity.name')" required>
          <NInput v-model:value="newEntityForm.name" :placeholder="$t('page.lowcode.entity.form.name.placeholder')" />
        </NFormItem>
        <NFormItem :label="$t('page.lowcode.entity.code')" required>
          <NInput v-model:value="newEntityForm.code" :placeholder="$t('page.lowcode.entity.form.code.placeholder')" />
        </NFormItem>
        <NFormItem :label="$t('page.lowcode.entity.tableName')" required>
          <NInput v-model:value="newEntityForm.tableName" :placeholder="$t('page.lowcode.entity.form.tableName.placeholder')" />
        </NFormItem>
        <NFormItem :label="$t('page.lowcode.entity.description')">
          <NInput v-model:value="newEntityForm.description" type="textarea" :placeholder="$t('page.lowcode.entity.form.description.placeholder')" />
        </NFormItem>
      </NForm>
      
      <template #action>
        <NSpace>
          <NButton @click="addEntityModalVisible = false">{{ $t('common.cancel') }}</NButton>
          <NButton type="primary" @click="createEntity" :loading="createEntityLoading">{{ $t('common.add') }}</NButton>
        </NSpace>
      </template>
    </NModal>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick, h, reactive, computed, watch } from 'vue';
import { Graph } from '@antv/g6';
import { PERFORMANCE_CONFIG } from '../config/performance';
<template>
  <div class="g6-relationship-designer" :class="{ 'connect-mode': isConnectMode }">
    <!-- 工具栏组件 -->
    <Toolbar
      :is-connect-mode="isConnectMode"
      :has-selection="!!(selectedNode || selectedEdge)"
      :zoom-level="zoomLevel"
      :can-undo="canUndo"
      :can-redo="canRedo"
      :loading="loading"
      :layout-loading="layoutLoading"
      :save-loading="saveLoading"
      @toggle-connect-mode="toggleConnectMode"
      @add-entity="showAddEntityDialog"
      @delete-selected="deleteSelected"
      @auto-layout="autoLayout"
      @fit-view="fitView"
      @reset-zoom="resetZoom"
      @zoom-in="zoomIn"
      @zoom-out="zoomOut"
      @export="handleExport"
      @undo="undo"
      @redo="redo"
      @save="saveGraph"
    />

    <!-- 连线提示 -->
    <div v-if="isConnectMode" class="connect-hint">
      <NAlert type="info" :show-icon="false">
        <span v-if="!connectSourceNode">{{ $t('page.lowcode.relationship.selectSourceEntity') }}</span>
        <span v-else>{{ $t('page.lowcode.relationship.selectTargetEntity', { name: connectSourceNode.data?.name }) }}</span>
        <template #action>
          <NButton size="tiny" @click="cancelConnect">{{ $t('page.lowcode.relationship.cancelConnect') }}</NButton>
        </template>
      </NAlert>
    </div>

    <!-- G6画布容器 -->
    <div ref="containerRef" class="graph-container" :class="{ 'connect-mode': isConnectMode }"></div>

    <!-- 属性面板组件 -->
    <PropertyPanel
      :visible="!!(selectedNode || selectedEdge)"
      :selected-item="selectedNode || selectedEdge"
      :selected-type="selectedNode ? 'node' : selectedEdge ? 'edge' : null"
      @close="clearSelection"
      @update-entity="handleUpdateEntity"
      @update-relationship="handleUpdateRelationship"
      @update-entity-position="handleUpdateEntityPosition"
    />

    <!-- 添加实体对话框 -->
    <NModal v-model:show="addEntityModalVisible" preset="dialog" :title="$t('page.lowcode.entity.addEntity')">
      <NForm :model="newEntityForm" label-placement="left" label-width="80px">
        <NFormItem :label="$t('page.lowcode.entity.name')" required>
          <NInput v-model:value="newEntityForm.name" :placeholder="$t('page.lowcode.entity.form.name.placeholder')" />
        </NFormItem>
        <NFormItem :label="$t('page.lowcode.entity.code')" required>
          <NInput v-model:value="newEntityForm.code" :placeholder="$t('page.lowcode.entity.form.code.placeholder')" />
        </NFormItem>
        <NFormItem :label="$t('page.lowcode.entity.tableName')" required>
          <NInput v-model:value="newEntityForm.tableName" :placeholder="$t('page.lowcode.entity.form.tableName.placeholder')" />
        </NFormItem>
        <NFormItem :label="$t('page.lowcode.entity.description')">
          <NInput v-model:value="newEntityForm.description" type="textarea" :placeholder="$t('page.lowcode.entity.form.description.placeholder')" />
        </NFormItem>
      </NForm>
      
      <template #action>
        <NSpace>
          <NButton @click="addEntityModalVisible = false">{{ $t('common.cancel') }}</NButton>
          <NButton type="primary" @click="createEntity" :loading="createEntityLoading">{{ $t('common.add') }}</NButton>
        </NSpace>
      </template>
    </NModal>
  </div>
</template>

<script setup lang="ts">
<template>
  <div class="g6-relationship-designer" :class="{ 'connect-mode': isConnectMode }">
    <!-- 工具栏组件 -->
    <Toolbar
      :is-connect-mode="isConnectMode"
      :has-selection="!!(selectedNode || selectedEdge)"
      :zoom-level="zoomLevel"
      :can-undo="canUndo"
      :can-redo="canRedo"
      :loading="loading"
      :layout-loading="layoutLoading"
      :save-loading="saveLoading"
      @toggle-connect-mode="toggleConnectMode"
      @add-entity="showAddEntityDialog"
      @delete-selected="deleteSelected"
      @auto-layout="autoLayout"
      @fit-view="fitView"
      @reset-zoom="resetZoom"
      @zoom-in="zoomIn"
      @zoom-out="zoomOut"
      @export="handleExport"
      @undo="undo"
      @redo="redo"
      @save="saveGraph"
    />

    <!-- 连线提示 -->
    <div v-if="isConnectMode" class="connect-hint">
      <NAlert type="info" :show-icon="false">
        <span v-if="!connectSourceNode">{{ $t('page.lowcode.relationship.selectSourceEntity') }}</span>
        <span v-else>{{ $t('page.lowcode.relationship.selectTargetEntity', { name: connectSourceNode.data?.name }) }}</span>
        <template #action>
          <NButton size="tiny" @click="cancelConnect">{{ $t('page.lowcode.relationship.cancelConnect') }}</NButton>
        </template>
      </NAlert>
    </div>

    <!-- G6画布容器 -->
    <div ref="containerRef" class="graph-container" :class="{ 'connect-mode': isConnectMode }"></div>

    <!-- 属性面板组件 -->
    <PropertyPanel
      :visible="!!(selectedNode || selectedEdge)"
      :selected-item="selectedNode || selectedEdge"
      :selected-type="selectedNode ? 'node' : selectedEdge ? 'edge' : null"
      @close="clearSelection"
      @update-entity="handleUpdateEntity"
      @update-relationship="handleUpdateRelationship"
      @update-entity-position="handleUpdateEntityPosition"
    />

    <!-- 添加实体对话框 -->
    <NModal v-model:show="addEntityModalVisible" preset="dialog" :title="$t('page.lowcode.entity.addEntity')">
      <NForm :model="newEntityForm" label-placement="left" label-width="80px">
        <NFormItem :label="$t('page.lowcode.entity.name')" required>
          <NInput v-model:value="newEntityForm.name" :placeholder="$t('page.lowcode.entity.form.name.placeholder')" />
        </NFormItem>
        <NFormItem :label="$t('page.lowcode.entity.code')" required>
          <NInput v-model:value="newEntityForm.code" :placeholder="$t('page.lowcode.entity.form.code.placeholder')" />
        </NFormItem>
        <NFormItem :label="$t('page.lowcode.entity.tableName')" required>
          <NInput v-model:value="newEntityForm.tableName" :placeholder="$t('page.lowcode.entity.form.tableName.placeholder')" />
        </NFormItem>
        <NFormItem :label="$t('page.lowcode.entity.description')">
          <NInput v-model:value="newEntityForm.description" type="textarea" :placeholder="$t('page.lowcode.entity.form.description.placeholder')" />
        </NFormItem>
      </NForm>
      
      <template #action>
        <NSpace>
          <NButton @click="addEntityModalVisible = false">{{ $t('common.cancel') }}</NButton>
          <NButton type="primary" @click="createEntity" :loading="createEntityLoading">{{ $t('common.add') }}</NButton>
        </NSpace>
      </template>
    </NModal>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick, h, reactive, computed, watch } from 'vue';
import { Graph, Extensions } from '@antv/g6';
import { 
  NButton, NSpace, NIcon, NCard, NForm, NFormItem, NInput, NSelect, NText, 
  NAlert, NModal, useMessage, useDialog 
} from 'naive-ui';
import { $t } from '@/locales';
import { debounce, throttle } from 'lodash-es';
import Toolbar from './toolbar.vue';
import PropertyPanel from './property-panel.vue';
import { fetchGetAllEntities, fetchAddEntity, fetchUpdateEntity, fetchDeleteEntity } from '@/service/api/lowcode-entity';
import { fetchGetAllFields } from '@/service/api/lowcode-field';
import { fetchGetRelationshipList, fetchUpdateRelationship, fetchDeleteRelationship, fetchAddRelationship } from '@/service/api/lowcode-relationship';

interface Props {
  projectId: string;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  relationshipUpdated: [];
}>();

const message = useMessage();
const dialog = useDialog();
const containerRef = ref<HTMLDivElement>();
let graph: Graph | null = null;

// 状态管理
const loading = ref(false);
const layoutLoading = ref(false);
const saveLoading = ref(false);
const createEntityLoading = ref(false);
const zoomLevel = ref(1);
const canUndo = ref(false);
const canRedo = ref(false);

// 选中状态
const selectedNode = ref<any>(null);
const selectedEdge = ref<any>(null);

// 数据
const entities = ref<any[]>([]);
const relationships = ref<any[]>([]);
const fields = ref<any[]>([]);

// 连线模式状态
const isConnectMode = ref(false);
const connectSourceNode = ref<any>(null);
const tempEdge = ref<any>(null);

// 添加实体对话框
const addEntityModalVisible = ref(false);
const newEntityForm = reactive({
  name: '',
  code: '',
  tableName: '',
  description: ''
});

// 历史记录 - 优化存储策略
const history = ref<any[]>([]);
const historyIndex = ref(-1);
const MAX_HISTORY_SIZE = 20; // 减少历史记录数量

// 性能优化：防抖和节流函数
const debouncedSaveToHistory = debounce(saveToHistory, 500);
const throttledUpdateGraphData = throttle(updateGraphData, 100);

const relationshipTypeOptions = [
  { label: '一对一', value: 'ONE_TO_ONE' },
  { label: '一对多', value: 'ONE_TO_MANY' },
  { label: '多对一', value: 'MANY_TO_ONE' },
  { label: '多对多', value: 'MANY_TO_MANY' }
];

// 计算属性 - 添加缓存
const currentGraphData = computed(() => {
  const nodes = entities.value.map(entity => ({
    id: entity.id,
    data: {
      ...entity,
      fieldCount: fields.value.filter(f => f.entityId === entity.id).length
    }
  }));

  const edges = relationships.value.map(rel => ({
    id: rel.id,
    source: rel.sourceEntityId,
    target: rel.targetEntityId,
    data: rel
  }));

  return { nodes, edges };
});

// 监听数据变化，优化渲染
watch(
  () => [entities.value.length, relationships.value.length],
  () => {
    throttledUpdateGraphData();
  },
  { deep: false }
);

// 初始化G6图 - 修复G6 v5配置
function initGraph() {
  if (!containerRef.value) return;

  // 销毁旧图实例
  if (graph) {
    graph.destroy();
  }

  try {
    // 确保容器尺寸有效
    const containerWidth = containerRef.value.clientWidth || 800;
    const containerHeight = containerRef.value.clientHeight || 600;
    
    console.log('Initializing G6 graph with size:', containerWidth, containerHeight);
    
    graph = new Graph({
      container: containerRef.value,
      width: containerWidth,
      height: containerHeight,
      modes: {
        default: ['drag-canvas', 'zoom-canvas', 'drag-node', 'click-select']
      },
      layout: {
        type: 'force',
        preventOverlap: true,
        nodeSize: 200,
        linkDistance: 300,
        nodeStrength: -300,
        edgeStrength: 0.2
      },
      node: {
        style: {
          type: 'rect',
          size: [200, 120],
          radius: 8,
          fill: '#f8f9fa',
          stroke: '#dee2e6',
          lineWidth: 2,
          shadowColor: 'rgba(0, 0, 0, 0.1)',
          shadowBlur: 4,
          shadowOffsetX: 2,
          shadowOffsetY: 2,
          labelText: (d: any) => d.data?.name || d.id,
          labelFontSize: 14,
          labelFontWeight: 'bold',
          labelFill: '#212529',
          labelMaxWidth: 180,
          labelWordWrap: true,
          labelWordWrapWidth: 180
        }
      },
      edge: {
        style: {
          type: 'line',
          stroke: '#6c757d',
          lineWidth: 2,
          endArrow: {
            type: 'triangle',
            size: 10,
            fill: '#6c757d'
          },
          shadowColor: 'rgba(0, 0, 0, 0.1)',
          shadowBlur: 2,
          labelText: (d: any) => getRelationshipLabel(d.data?.type),
          labelFontSize: 12,
          labelFill: '#495057',
          labelBackgroundFill: '#ffffff',
          labelBackgroundStroke: '#dee2e6',
          labelBackgroundRadius: 4,
          labelPadding: [2, 4]
        }
      }
    });

    // 事件监听
    setupEventListeners();
    
    // 监听缩放变化 - 节流处理
    graph.on('viewportchange', throttle(() => {
      zoomLevel.value = graph?.getZoom() || 1;
    }, 100));
    
    console.log('G6 graph initialized successfully');
  } catch (error) {
    console.error('Failed to initialize G6 graph:', error);
    message.error('图形初始化失败');
  }
}

// 设置事件监听器 - 优化事件处理
function setupEventListeners() {
  if (!graph) return;

  // 节点点击事件 - 防抖处理
  graph.on('node:click', debounce((event) => {
    if (isConnectMode.value) {
      handleConnectModeNodeClick(event);
    } else {
      selectedNode.value = event.itemId ? graph?.getNodeData(event.itemId) : null;
      selectedEdge.value = null;
    }
  }, 150));

  // 边点击事件 - 防抖处理
  graph.on('edge:click', debounce((event) => {
    if (!isConnectMode.value) {
      selectedEdge.value = event.itemId ? graph?.getEdgeData(event.itemId) : null;
      selectedNode.value = null;
    }
  }, 150));

  // 画布点击事件
  graph.on('canvas:click', () => {
    if (isConnectMode.value) {
      cancelConnect();
    } else {
      clearSelection();
    }
  });

  // 连线模式相关事件 - 节流处理
  graph.on('pointermove', throttle((event) => {
    if (isConnectMode.value && connectSourceNode.value && tempEdge.value) {
      updateTempEdge(event);
    }
  }, 50));

  graph.on('node:pointerenter', (event) => {
    if (isConnectMode.value && connectSourceNode.value) {
      highlightConnectableNode(event.itemId, true);
    }
  });

  graph.on('node:pointerleave', (event) => {
    if (isConnectMode.value && connectSourceNode.value) {
      highlightConnectableNode(event.itemId, false);
    }
  });

  // 节点拖拽事件 - 防抖保存历史
  graph.on('node:dragend', () => {
    debouncedSaveToHistory();
  });
}

// 加载数据 - 优化并发请求
async function loadData() {
  try {
    loading.value = true;
    
    // 并行加载数据，添加错误处理
    const [entitiesRes, fieldsRes, relationshipsRes] = await Promise.allSettled([
      fetchGetAllEntities(props.projectId),
      fetchGetAllFields({ projectId: props.projectId }),
      fetchGetRelationshipList({ 
        projectId: props.projectId,
        current: 1,
        size: 1000
      })
    ]);

    // 处理实体数据
    if (entitiesRes.status === 'fulfilled' && entitiesRes.value.data) {
      entities.value = entitiesRes.value.data;
    } else {
      console.warn('Failed to load entities:', entitiesRes);
    }

    // 处理字段数据
    if (fieldsRes.status === 'fulfilled' && fieldsRes.value.data) {
      fields.value = fieldsRes.value.data;
    } else {
      console.warn('Failed to load fields:', fieldsRes);
    }

    // 处理关系数据
    if (relationshipsRes.status === 'fulfilled' && relationshipsRes.value.data) {
      relationships.value = relationshipsRes.value.data.records || [];
    } else {
      console.warn('Failed to load relationships:', relationshipsRes);
    }

    updateGraphData();
    saveToHistory();
  } catch (error) {
    console.error('Failed to load data:', error);
    message.error($t('page.lowcode.entity.loadFailed'));
  } finally {
    loading.value = false;
  }
}

  // 更新图数据 - 修复G6 v5 API
function updateGraphData() {
  if (!graph) return;

  const graphData = currentGraphData.value;
  
  try {
    console.log('Updating graph data with nodes:', graphData.nodes.length, 'edges:', graphData.edges.length);
    
    // 清除现有数据
    graph.clear();
    
    // 先添加所有节点
    if (graphData.nodes.length > 0) {
      graph.addData('node', graphData.nodes);
    }
    
    // 再添加所有边
    if (graphData.edges.length > 0) {
      graph.addData('edge', graphData.edges);
    }
    
    // 强制重新渲染
    graph.render();
    
    // 自动适应视图
    setTimeout(() => {
      if (graph) {
        graph.fitView();
      }
    }, 100);
  } catch (error) {
    console.error('Failed to update graph data:', error);
  }
}

// 工具栏操作 - 优化布局算法
async function autoLayout() {
  if (!graph) return;
  
  layoutLoading.value = true;
  try {
    // 使用requestAnimationFrame优化布局动画
    await new Promise(resolve => {
      graph?.layout();
      // 减少等待时间
      setTimeout(resolve, 500);
    });
    debouncedSaveToHistory();
    message.success($t('page.lowcode.relationship.autoLayout') + '完成');
  } catch (error) {
    message.error($t('page.lowcode.relationship.autoLayout') + '失败');
  } finally {
    layoutLoading.value = false;
  }
}

function fitView() {
  if (!graph) return;
  graph.fitView();
  zoomLevel.value = graph.getZoom();
}

function resetZoom() {
  if (!graph) return;
  graph.zoomTo(1);
  zoomLevel.value = 1;
}

function zoomIn() {
  if (!graph) return;
  const zoom = Math.min(graph.getZoom() * 1.2, 3);
  graph.zoomTo(zoom);
  zoomLevel.value = zoom;
}

function zoomOut() {
  if (!graph) return;
  const zoom = Math.max(graph.getZoom() / 1.2, 0.1);
  graph.zoomTo(zoom);
  zoomLevel.value = zoom;
}

// 导出功能 - 优化导出性能
async function handleExport(type: string) {
  if (!graph) return;
  
  try {
    switch (type) {
      case 'png':
        await graph.downloadFullImage('relationship-graph', 'image/png');
        break;
      case 'jpg':
        await graph.downloadFullImage('relationship-graph', 'image/jpeg');
        break;
      case 'svg':
        const svgData = await graph.toSVG();
        downloadFile(svgData, 'relationship-graph.svg', 'image/svg+xml');
        break;
      case 'json':
        const jsonData = JSON.stringify(currentGraphData.value, null, 2);
        downloadFile(jsonData, 'relationship-graph.json', 'application/json');
        break;
    }
    message.success(`导出${type.toUpperCase()}成功`);
  } catch (error) {
    console.error('Export failed:', error);
    message.error('导出失败');
  }
}

// 下载文件辅助函数
function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// 历史记录管理 - 优化存储策略
function saveToHistory() {
  const currentState = JSON.parse(JSON.stringify(currentGraphData.value));
  
  // 移除当前索引之后的历史记录
  if (historyIndex.value < history.value.length - 1) {
    history.value = history.value.slice(0, historyIndex.value + 1);
  }
  
  history.value.push(currentState);
  historyIndex.value = history.value.length - 1;
  
  // 限制历史记录数量 - 减少内存占用
  if (history.value.length > MAX_HISTORY_SIZE) {
    history.value.shift();
    historyIndex.value--;
  }
  
  updateHistoryState();
}

function updateHistoryState() {
  canUndo.value = historyIndex.value > 0;
  canRedo.value = historyIndex.value < history.value.length - 1;
}

function undo() {
  if (!canUndo.value || !graph) return;
  
  historyIndex.value--;
  const state = history.value[historyIndex.value];
  restoreState(state);
  updateHistoryState();
  message.info('撤销操作');
}

function redo() {
  if (!canRedo.value || !graph) return;
  
  historyIndex.value++;
  const state = history.value[historyIndex.value];
  restoreState(state);
  updateHistoryState();
  message.info('重做操作');
}

function restoreState(state: any) {
  if (!graph) return;
  
  // 更新数据但不触发历史记录
  entities.value = state.nodes.map((node: any) => node.data);
  relationships.value = state.edges.map((edge: any) => edge.data);
  
  graph.data(state);
  graph.render();
}

// 连线模式操作
function toggleConnectMode() {
  isConnectMode.value = !isConnectMode.value;
  if (!isConnectMode.value) {
    cancelConnect();
  }
  clearSelection();
}

function cancelConnect() {
  if (connectSourceNode.value && graph) {
    highlightSourceNode(connectSourceNode.value.id, false);
  }
  
  connectSourceNode.value = null;
  
  if (tempEdge.value && graph) {
    graph.removeData('edge', [tempEdge.value.id]);
    tempEdge.value = null;
  }
}

function handleConnectModeNodeClick(event: any) {
  const nodeId = event.itemId;
  const nodeData = graph?.getNodeData(nodeId);
  
  if (!connectSourceNode.value) {
    // 选择源节点
    connectSourceNode.value = nodeData;
    highlightSourceNode(nodeId, true);
    message.info('请选择目标实体');
  } else if (nodeId === connectSourceNode.value.id) {
    // 点击同一个节点，取消选择
    cancelConnect();
  } else {
    // 选择目标节点，创建关系
    createRelationship(connectSourceNode.value, nodeData);
  }
}

function highlightSourceNode(nodeId: string, highlight: boolean) {
  if (!graph) return;
  
  graph.updateNodeData([{
    id: nodeId,
    style: {
      stroke: highlight ? '#1890ff' : '#dee2e6',
      lineWidth: highlight ? 3 : 2,
      shadowColor: highlight ? '#1890ff' : 'rgba(0, 0, 0, 0.1)',
      shadowBlur: highlight ? 10 : 4
    }
  }]);
}

function highlightConnectableNode(nodeId: string, highlight: boolean) {
  if (!graph || !connectSourceNode.value || nodeId === connectSourceNode.value.id) return;
  
  graph.updateNodeData([{
    id: nodeId,
    style: {
      stroke: highlight ? '#52c41a' : '#dee2e6',
      lineWidth: highlight ? 2 : 2,
      shadowColor: highlight ? '#52c41a' : 'rgba(0, 0, 0, 0.1)',
      shadowBlur: highlight ? 8 : 4
    }
  }]);
}

function updateTempEdge(event: any) {
  if (!graph || !connectSourceNode.value) return;
  
  const canvasPosition = graph.getCanvasByViewport([event.canvas.x, event.canvas.y]);
  
  if (!tempEdge.value) {
    // 创建临时边
    const tempEdgeId = `temp-edge-${Date.now()}`;
    tempEdge.value = {
      id: tempEdgeId,
      source: connectSourceNode.value.id,
      target: canvasPosition,
      style: {
        stroke: '#1890ff',
        lineWidth: 2,
        lineDash: [5, 5],
        opacity: 0.6,
        endArrow: {
          type: 'triangle',
          size: 8,
          fill: '#1890ff'
        }
      }
    };
    graph.addData('edge', [tempEdge.value]);
  } else {
    // 更新临时边的目标位置
    graph.updateEdgeData([{
      id: tempEdge.value.id,
      target: canvasPosition
    }]);
  }
}

async function createRelationship(sourceNode: any, targetNode: any) {
  // 检查是否已存在关系
  const existingRelation = relationships.value.find(rel => 
    (rel.sourceEntityId === sourceNode.id && rel.targetEntityId === targetNode.id) ||
    (rel.sourceEntityId === targetNode.id && rel.targetEntityId === sourceNode.id)
  );
  
  if (existingRelation) {
    message.warning($t('page.lowcode.relationship.relationshipExists'));
    cancelConnect();
    return;
  }

  // 显示关系创建对话框
  showCreateRelationshipDialog(sourceNode, targetNode);
}

function showCreateRelationshipDialog(sourceNode: any, targetNode: any) {
  const relationshipData = ref({
    name: `${sourceNode.data.name}_${targetNode.data.name}`,
    type: 'ONE_TO_MANY',
    description: `${sourceNode.data.name}到${targetNode.data.name}的关系`
  });

  dialog.create({
    title: $t('page.lowcode.relationship.createRelationshipDialog'),
    content: () => h('div', [
      h('div', { class: 'mb-4' }, [
        h('span', { class: 'text-sm text-gray-600' }, 
          `源实体: ${sourceNode.data.name} → 目标实体: ${targetNode.data.name}`
        )
      ]),
      h(NForm, { model: relationshipData.value }, [
        h(NFormItem, { label: '关系名称' }, [
          h(NInput, { 
            value: relationshipData.value.name,
            'onUpdate:value': (val: string) => relationshipData.value.name = val
          })
        ]),
        h(NFormItem, { label: '关系类型' }, [
          h(NSelect, {
            value: relationshipData.value.type,
            options: relationshipTypeOptions,
            'onUpdate:value': (val: string) => relationshipData.value.type = val
          })
        ]),
        h(NFormItem, { label: '描述' }, [
          h(NInput, {
            type: 'textarea',
            value: relationshipData.value.description,
            'onUpdate:value': (val: string) => relationshipData.value.description = val
          })
        ])
      ])
    ]),
    positiveText: '创建',
    negativeText: '取消',
    onPositiveClick: async () => {
      try {
        const newRelationship = {
          projectId: props.projectId,
          name: relationshipData.value.name,
          type: relationshipData.value.type,
          description: relationshipData.value.description,
          sourceEntityId: sourceNode.id,
          targetEntityId: targetNode.id,
          config: {
            sourceField: null,
            targetField: null,
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE'
          }
        };

        await fetchAddRelationship(newRelationship);
        message.success('关系创建成功');
        cancelConnect();
        await loadData();
        emit('relationshipUpdated');
      } catch (error) {
        console.error('Failed to create relationship:', error);
        message.error('关系创建失败');
      }
    },
    onNegativeClick: () => {
      cancelConnect();
    }
  });
}

// 实体管理
function showAddEntityDialog() {
  Object.assign(newEntityForm, {
    name: '',
    code: '',
    tableName: '',
    description: ''
  });
  addEntityModalVisible.value = true;
}

async function createEntity() {
  if (!newEntityForm.name.trim() || !newEntityForm.code.trim() || !newEntityForm.tableName.trim()) {
    message.error('请填写必填字段');
    return;
  }

  try {
    createEntityLoading.value = true;
    
    const entityData = {
      projectId: props.projectId,
      name: newEntityForm.name,
      code: newEntityForm.code,
      tableName: newEntityForm.tableName,
      description: newEntityForm.description,
      config: {}
    };

    await fetchAddEntity(entityData);
    message.success('实体创建成功');
    addEntityModalVisible.value = false;
    await loadData();
    debouncedSaveToHistory();
  } catch (error) {
    console.error('Failed to create entity:', error);
    message.error('实体创建失败');
  } finally {
    createEntityLoading.value = false;
  }
}

async function deleteSelected() {
  if (selectedNode.value) {
    await deleteEntity(selectedNode.value.id);
  } else if (selectedEdge.value) {
    await deleteRelationship(selectedEdge.value.id);
  }
}

async function deleteEntity(entityId: string) {
  try {
    await fetchDeleteEntity(entityId);
    message.success('实体删除成功');
    clearSelection();
    await loadData();
    debouncedSaveToHistory();
  } catch (error) {
    console.error('Failed to delete entity:', error);
    message.error('实体删除失败');
  }
}

async function deleteRelationship(relationshipId: string) {
  try {
    await fetchDeleteRelationship(relationshipId);
    message.success('关系删除成功');
    clearSelection();
    await loadData();
    debouncedSaveToHistory();
    emit('relationshipUpdated');
  } catch (error) {
    console.error('Failed to delete relationship:', error);
    message.error('关系删除失败');
  }
}

// 属性面板事件处理
function clearSelection() {
  selectedNode.value = null;
  selectedEdge.value = null;
}

async function handleUpdateEntity(entityId: string, property: string, value: any) {
  try {
    const entity = entities.value.find(e => e.id === entityId);
    if (entity) {
      entity[property] = value;
      await fetchUpdateEntity(entityId, entity);
      throttledUpdateGraphData();
      debouncedSaveToHistory();
      message.success('实体更新成功');
    }
  } catch (error) {
    console.error('Failed to update entity:', error);
    message.error('实体更新失败');
  }
}

async function handleUpdateRelationship(relationshipId: string, property: string, value: any) {
  try {
    const relationship = relationships.value.find(r => r.id === relationshipId);
    if (relationship) {
      if (property === 'style') {
        relationship.config = { ...relationship.config, ...value };
      } else {
        relationship[property] = value;
      }
      await fetchUpdateRelationship(relationshipId, relationship);
      throttledUpdateGraphData();
      debouncedSaveToHistory();
      message.success('关系更新成功');
      emit('relationshipUpdated');
    }
  } catch (error) {
    console.error('Failed to update relationship:', error);
    message.error('关系更新失败');
  }
}

function handleUpdateEntityPosition(entityId: string, x: number, y: number) {
  if (!graph) return;
  
  graph.updateNodeData([{
    id: entityId,
    style: { x, y }
  }]);
  
  debouncedSaveToHistory();
}

// 保存图形 - 优化批量保存
async function saveGraph() {
  try {
    saveLoading.value = true;
    
    // 获取当前节点位置
    const nodePositions = graph?.getAllNodesData().map(node => ({
      id: node.id,
      x: node.style?.x || 0,
      y: node.style?.y || 0
    })) || [];

    // 批量更新实体位置信息
    const updatePromises = nodePositions.map(async (pos) => {
      const entity = entities.value.find(e => e.id === pos.id);
      if (entity) {
        entity.config = {
          ...entity.config,
          position: { x: pos.x, y: pos.y }
        };
        return fetchUpdateEntity(entity.id, entity);
      }
    }).filter(Boolean);

    await Promise.allSettled(updatePromises);
    message.success('图形保存成功');
  } catch (error) {
    console.error('Failed to save graph:', error);
    message.error('图形保存失败');
  } finally {
    saveLoading.value = false;
  }
}

// 辅助函数
function getRelationshipLabel(type: string) {
  const labels: Record<string, string> = {
    'ONE_TO_ONE': '1:1',
    'ONE_TO_MANY': '1:N',
    'MANY_TO_ONE': 'N:1',
    'MANY_TO_MANY': 'N:N'
  };
  return labels[type] || type;
}

function getEntityName(entityId: string) {
  const entity = entities.value.find(e => e.id === entityId);
  return entity?.name || entityId;
}

// 清理函数 - 优化内存管理
function cleanup() {
  // 清理防抖和节流函数
  debouncedSaveToHistory.cancel();
  throttledUpdateGraphData.cancel();
  
  // 清理图实例
  if (graph) {
    graph.destroy();
    graph = null;
  }
  
  // 清理数据
  entities.value = [];
  relationships.value = [];
  fields.value = [];
  history.value = [];
}

// 生命周期 - 修复尺寸问题
let resizeHandler: (() => void) | null = null;

onMounted(async () => {
  await nextTick();
  
  // 确保容器有有效尺寸后再初始化
  if (containerRef.value) {
    const rect = containerRef.value.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) {
      initGraph();
      await loadData();
    } else {
      // 如果容器尺寸无效，延迟初始化
      setTimeout(async () => {
        if (containerRef.value) {
          const newRect = containerRef.value.getBoundingClientRect();
          if (newRect.width > 0 && newRect.height > 0) {
            initGraph();
            await loadData();
          }
        }
      }, 100);
    }
  }
  
  // 监听窗口大小变化 - 节流处理，添加尺寸验证和安全检查
  resizeHandler = throttle(() => {
    if (graph && containerRef.value && !graph.destroyed) {
      const rect = containerRef.value.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        try {
          // 使用更安全的方式调整大小
          requestAnimationFrame(() => {
            if (graph && !graph.destroyed) {
              graph.setSize([rect.width, rect.height]);
              // 重新渲染以确保显示正确
              graph.render();
            }
          });
        } catch (error) {
          console.warn('Failed to resize graph:', error);
        }
      }
    }
  }, 300);
  
  window.addEventListener('resize', resizeHandler);
});

// 组件卸载时清理
onUnmounted(() => {
  if (resizeHandler) {
    window.removeEventListener('resize', resizeHandler);
    resizeHandler = null;
  }
  cleanup();
});
</script>

<style scoped>
.g6-relationship-designer {
  @apply h-full flex flex-col bg-gray-50;
}

.connect-hint {
  @apply px-4 py-2 bg-blue-50 border-b border-blue-200;
}

.graph-container {
  @apply flex-1 relative bg-white;
  cursor: default;
}

.graph-container.connect-mode {
  cursor: crosshair;
}

/* 连线模式下的特殊样式 */
.g6-relationship-designer.connect-mode .graph-container {
  cursor: crosshair;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .connect-hint {
    @apply px-2 py-2 text-sm;
  }
}

/* 动画效果 */
.graph-container {
  transition: all 0.3s ease;
}

.connect-hint {
  transition: all 0.2s ease;
}

/* 加载状态 */
.graph-container.loading {
  opacity: 0.7;
  pointer-events: none;
}

/* 性能优化：减少重绘 */
.graph-container * {
  will-change: transform;
}
</style>
