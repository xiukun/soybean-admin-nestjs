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
import { PERFORMANCE_CONFIG } from '../config/performance';

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
const MAX_HISTORY_SIZE = PERFORMANCE_CONFIG.HISTORY.MAX_SIZE;

// 性能优化：防抖和节流函数
const debouncedSaveToHistory = debounce(saveToHistory, PERFORMANCE_CONFIG.HISTORY.SAVE_DEBOUNCE_DELAY);
const throttledUpdateGraphData = throttle(updateGraphData, PERFORMANCE_CONFIG.GRAPH.EVENTS.THROTTLE_DELAY);

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

// 监听项目ID变化，重新加载数据
watch(
  () => props.projectId,
  async (newProjectId) => {
    if (newProjectId) {
      console.log('项目ID变更，重新加载数据:', newProjectId);
      await nextTick();
      if (!graph) {
        initGraph();
      }
      loadData();
    }
  },
  { immediate: true }
);

// 初始化G6图 - 完全重构G6 v5配置
function initGraph() {
  if (!containerRef.value) {
    console.error('容器元素不存在，无法初始化图形');
    return;
  }

  // 销毁旧图实例
  if (graph) {
    try {
      graph.destroy();
      graph = null;
    } catch (error) {
      console.error('销毁旧图形实例失败:', error);
    }
  }

  try {
    // 确保容器尺寸有效
    const containerWidth = containerRef.value.clientWidth || 800;
    const containerHeight = containerRef.value.clientHeight || 600;
    
    console.log('初始化G6图形，容器尺寸:', containerWidth, containerHeight);
    
    // 创建G6图形实例 - 使用简化配置避免类型错误
    graph = new Graph({
      container: containerRef.value,
      width: containerWidth,
      height: containerHeight,
      // 基本交互模式
      modes: {
        default: ['drag-canvas', 'zoom-canvas', 'drag-node', 'click-select']
      },
      // 布局配置
      layout: {
        type: 'force',
        preventOverlap: true,
        nodeSize: 200,
        linkDistance: 300,
        nodeStrength: -300,
        edgeStrength: 0.2,
        maxIteration: PERFORMANCE_CONFIG.GRAPH.RENDER.maxLayoutIteration,
        minMovement: PERFORMANCE_CONFIG.GRAPH.RENDER.minMovement
      },
      // 节点样式
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
          shadowOffsetY: 2
        },
        labelCfg: {
          style: {
            fontSize: 14,
            fontWeight: 'bold',
            fill: '#212529',
            maxWidth: 180
          }
        }
      },
      // 边样式
      edge: {
        style: {
          stroke: '#6c757d',
          lineWidth: 2,
          endArrow: true
        },
        labelCfg: {
          style: {
            fontSize: 12,
            fill: '#495057',
            background: {
              fill: '#ffffff',
              stroke: '#dee2e6',
              radius: 4,
              padding: [2, 4]
            }
          }
        }
      },
      // 渲染器配置
      renderer: PERFORMANCE_CONFIG.GRAPH.RENDER.renderer
    });

    // 自定义节点和边的渲染
    customizeNodeAndEdgeRender();
    
    // 事件监听
    setupEventListeners();
    
    console.log('G6图形初始化成功');
  } catch (error) {
    console.error('G6图形初始化失败:', error);
    message.error('图形初始化失败');
  }
}

// 自定义节点和边的渲染
function customizeNodeAndEdgeRender() {
  if (!graph) return;
  
  // 自定义节点标签渲染
  graph.node((node) => {
    const data = node.data;
    return {
      id: node.id,
      label: data?.name || node.id,
      style: {
        // 如果有保存的位置信息，使用它
        x: data?.config?.position?.x,
        y: data?.config?.position?.y
      }
    };
  });
  
  // 自定义边标签渲染
  graph.edge((edge) => {
    const data = edge.data;
    return {
      id: edge.id,
      label: getRelationshipLabel(data?.type),
      style: {
        // 自定义边样式
        stroke: getRelationshipColor(data?.type),
        endArrow: {
          fill: getRelationshipColor(data?.type)
        }
      }
    };
  });
}

// 获取关系类型颜色
function getRelationshipColor(type: string): string {
  const colorMap: Record<string, string> = {
    'ONE_TO_ONE': '#1890ff',
    'ONE_TO_MANY': '#52c41a',
    'MANY_TO_ONE': '#fa8c16',
    'MANY_TO_MANY': '#f5222d'
  };
  return colorMap[type] || '#6c757d';
}

// 设置事件监听器 - 优化事件处理
function setupEventListeners() {
  if (!graph) return;

  // 节点点击事件 - 防抖处理
  graph.on('node:click', debounce((event) => {
    if (isConnectMode.value) {
      handleConnectModeNodeClick(event);
    } else {
      const nodeId = event.itemId || event.item?.getID();
      selectedNode.value = nodeId ? graph?.getNodeData(nodeId) : null;
      selectedEdge.value = null;
    }
  }, PERFORMANCE_CONFIG.GRAPH.EVENTS.DEBOUNCE_DELAY));

  // 边点击事件 - 防抖处理
  graph.on('edge:click', debounce((event) => {
    if (!isConnectMode.value) {
      const edgeId = event.itemId || event.item?.getID();
      selectedEdge.value = edgeId ? graph?.getEdgeData(edgeId) : null;
      selectedNode.value = null;
    }
  }, PERFORMANCE_CONFIG.GRAPH.EVENTS.DEBOUNCE_DELAY));

  // 画布点击事件
  graph.on('canvas:click', () => {
    if (isConnectMode.value) {
      cancelConnect();
    } else {
      clearSelection();
    }
  });

  // 连线模式相关事件 - 节流处理
  graph.on('mousemove', throttle((event) => {
    if (isConnectMode.value && connectSourceNode.value && tempEdge.value) {
      updateTempEdge(event);
    }
  }, PERFORMANCE_CONFIG.GRAPH.EVENTS.THROTTLE_DELAY));

  graph.on('node:mouseenter', (event) => {
    if (isConnectMode.value && connectSourceNode.value) {
      const nodeId = event.itemId || event.item?.getID();
      if (nodeId) {
        highlightConnectableNode(nodeId, true);
      }
    }
  });

  graph.on('node:mouseleave', (event) => {
    if (isConnectMode.value && connectSourceNode.value) {
      const nodeId = event.itemId || event.item?.getID();
      if (nodeId) {
        highlightConnectableNode(nodeId, false);
      }
    }
  });

  // 节点拖拽事件 - 防抖保存历史
  graph.on('node:dragend', () => {
    debouncedSaveToHistory();
  });
  
  // 监听缩放变化 - 节流处理
  graph.on('viewportchange', throttle(() => {
    zoomLevel.value = graph?.getZoom() || 1;
  }, PERFORMANCE_CONFIG.GRAPH.EVENTS.THROTTLE_DELAY));
}

// 加载数据 - 优化并发请求
async function loadData() {
  try {
    loading.value = true;
    
    console.log('开始加载数据，项目ID:', props.projectId);
    
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
      console.log('加载实体数据成功:', entities.value.length);
    } else {
      console.warn('加载实体数据失败:', entitiesRes);
      message.warning('加载实体数据失败');
    }

    // 处理字段数据
    if (fieldsRes.status === 'fulfilled' && fieldsRes.value.data) {
      fields.value = fieldsRes.value.data;
      console.log('加载字段数据成功:', fields.value.length);
    } else {
      console.warn('加载字段数据失败:', fieldsRes);
    }

    // 处理关系数据
    if (relationshipsRes.status === 'fulfilled' && relationshipsRes.value.data) {
      relationships.value = relationshipsRes.value.data.records || [];
      console.log('加载关系数据成功:', relationships.value.length);
    } else {
      console.warn('加载关系数据失败:', relationshipsRes);
      message.warning('加载关系数据失败');
    }

    // 更新图数据
    await nextTick();
    updateGraphData();
    saveToHistory();
  } catch (error) {
    console.error('加载数据失败:', error);
    message.error($t('page.lowcode.entity.loadFailed'));
  } finally {
    loading.value = false;
  }
}

// 更新图数据 - 修复G6 v5 API
function updateGraphData() {
  if (!graph) {
    console.error('图形实例不存在，无法更新数据');
    return;
  }

  const graphData = currentGraphData.value;
  
  try {
    console.log('更新图数据，节点:', graphData.nodes.length, '边:', graphData.edges.length);
    
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
      if (graph && !graph.destroyed) {
        graph.fitView();
        console.log('自动适应视图完成');
      }
    }, 100);
  } catch (error) {
    console.error('更新图数据失败:', error);
  }
}

// 工具栏操作 - 优化布局算法
async function autoLayout() {
  if (!graph) return;
  
  layoutLoading.value = true;
  try {
    console.log('开始自动布局');
    // 使用requestAnimationFrame优化布局动画
    await new Promise(resolve => {
      if (graph) {
        graph.updateLayout({
          type: 'force',
          preventOverlap: true,
          nodeSize: 200,
          linkDistance: 300,
          nodeStrength: -300,
          edgeStrength: 0.2,
          maxIteration: PERFORMANCE_CONFIG.GRAPH.RENDER.maxLayoutIteration,
          minMovement: PERFORMANCE_CONFIG.GRAPH.RENDER.minMovement
        });
      }
      // 减少等待时间
      setTimeout(resolve, 500);
    });
    debouncedSaveToHistory();
    message.success('自动布局完成');
  } catch (error) {
    console.error('自动布局失败:', error);
    message.error('自动布局失败');
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
        const pngDataUrl = await graph.toDataURL('image/png');
        downloadDataURL(pngDataUrl, 'relationship-graph.png');
        break;
      case 'jpg':
        const jpgDataUrl = await graph.toDataURL('image/jpeg');
        downloadDataURL(jpgDataUrl, 'relationship-graph.jpg');
        break;
      case 'svg':
        const svgStr = await graph.toFullSVGString();
        downloadFile(svgStr, 'relationship-graph.svg', 'image/svg+xml');
        break;
      case 'json':
        const jsonData = JSON.stringify(currentGraphData.value, null, 2);
        downloadFile(jsonData, 'relationship-graph.json', 'application/json');
        break;
    }
    message.success(`导出${type.toUpperCase()}成功`);
  } catch (error) {
    console.error('导出失败:', error);
    message.error('导出失败');
  }
}

// 下载DataURL
function downloadDataURL(dataURL: string, filename: string) {
  const link = document.createElement('a');
  link.href = dataURL;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
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
  
  // 清除现有数据
  graph.clear();
  
  // 添加节点数据
  if (state.nodes.length > 0) {
    graph.addData('node', state.nodes);
  }
  
  // 添加边数据
  if (state.edges.length > 0) {
    graph.addData('edge', state.edges);
  }
  
  // 渲染图形
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
  const nodeId = event.itemId || event.item?.getID();
  if (!nodeId) return;
  
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
  
  // 获取鼠标在画布上的位置
  const point = graph.getPointByClient(event.clientX, event.clientY);
  
  if (!tempEdge.value) {
    // 创建临时边
    const tempEdgeId = `temp-edge-${Date.now()}`;
    tempEdge.value = {
      id: tempEdgeId,
      source: connectSourceNode.value.id,
      target: { x: point.x, y: point.y },
      style: {
        stroke: '#1890ff',
        lineWidth: 2,
        lineDash: [5, 5],
        opacity: 0.6,
        endArrow: true
      }
    };
    graph.addData('edge', [tempEdge.value]);
  } else {
    // 更新临时边的目标位置
    graph.updateEdgeData([{
      id: tempEdge.value.id,
      target: { x: point.x, y: point.y }
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
    message.warning('关系已存在');
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
    title: '创建关系',
    content: () => h('div', [
      h('div', { class: 'mb-4' }, [
        h('span', { class: 'text-sm text-gray-600' }, 
          `源实体: ${sourceNode.data.name} → 目标实体: ${targetNode.data.