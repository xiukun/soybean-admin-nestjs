<template>
  <div class="x6-graph-canvas">
    <!-- 连线提示 -->
    <div v-if="isConnectMode" class="connect-hint">
      <n-alert type="info" :show-icon="false">
        <span v-if="!connectSourceNode">
          {{ $t('page.lowcode.relationship.selectSourceEntity') }}
        </span>
        <span v-else>
          {{ $t('page.lowcode.relationship.selectTargetEntity', { name: connectSourceNode.getData().name }) }}
        </span>
        <div class="mt-2">
          <n-button size="tiny" @click="$emit('cancel-connect')">
            {{ $t('page.lowcode.relationship.cancelConnect') }}
          </n-button>
        </div>
      </n-alert>
    </div>

    <!-- X6画布容器 -->
    <div 
      ref="containerRef" 
      class="graph-container" 
      :class="{ 'connect-mode': isConnectMode }"
    ></div>

    <!-- 小地图容器 -->
    <div 
      ref="minimapRef" 
      class="minimap-container"
      v-show="showMinimap"
    >
      <div class="minimap-header">
        <span class="minimap-title">导航</span>
        <n-button 
          size="tiny" 
          quaternary 
          @click="toggleMinimap"
          class="minimap-toggle"
        >
          <template #icon>
            <n-icon><icon-mdi-close /></n-icon>
          </template>
        </n-button>
      </div>
      <div ref="minimapContentRef" class="minimap-content"></div>
    </div>

    <!-- 小地图切换按钮 -->
    <div class="minimap-toggle-btn" v-show="!showMinimap">
      <n-button 
        size="small" 
        @click="toggleMinimap"
        title="显示导航地图"
      >
        <template #icon>
          <n-icon><icon-mdi-map /></n-icon>
        </template>
      </n-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick, watch } from 'vue';
import { Graph, Shape, Node, Edge, Cell } from '@antv/x6';
import { Scroller } from '@antv/x6-plugin-scroller';
import { MiniMap } from '@antv/x6-plugin-minimap';
import { useI18n } from 'vue-i18n';
import { NAlert, NButton, NIcon } from 'naive-ui';
import { X6ConnectionManager } from '../modules/X6ConnectionManager';

// 图标导入
import IconMdiClose from '~icons/mdi/close';
import IconMdiMap from '~icons/mdi/map';

/**
 * X6图形画布组件
 * @description 负责X6图形的初始化、渲染和基本交互
 */

interface Props {
  /** 是否处于连线模式 */
  isConnectMode: boolean;
  /** 连线源节点 */
  connectSourceNode: Node | null;
  /** 是否显示网格 */
  showGrid: boolean;
  /** 是否启用网格对齐 */
  snapToGrid: boolean;
  /** 是否显示连接点 */
  showConnectionPoints: boolean;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  /** 图形实例初始化完成 */
  'graph-ready': [graph: Graph];
  /** 节点被选中 */
  'node-selected': [node: Node];
  /** 边被选中 */
  'edge-selected': [edge: Edge];
  /** 清除选择 */
  'selection-cleared': [];
  /** 节点被点击（连线模式下） */
  'node-clicked': [node: Node];
  /** 取消连线 */
  'cancel-connect': [];
  /** 创建关系 */
  'create-relationship': [sourceNode: Node, targetNode: Node];
}>();

const { t } = useI18n();
const containerRef = ref<HTMLDivElement>();
const minimapRef = ref<HTMLDivElement>();
const minimapContentRef = ref<HTMLDivElement>();
const showMinimap = ref(true);
let graph: Graph | null = null;
let connectionManager: X6ConnectionManager | null = null;
let minimapInstance: MiniMap | null = null;

/**
 * 注册自定义节点
 */
function registerCustomNodes() {
  // 注册实体节点
  Graph.registerNode(
    'entity-node',
    {
      inherit: 'rect',
      width: 200,
      height: 120,
      attrs: {
        body: {
          strokeWidth: 2,
          stroke: '#1976d2',
          fill: '#ffffff',
          rx: 8,
          ry: 8,
        },
        text: {
          fontSize: 14,
          fontWeight: 'bold',
          fill: '#333333',
          textAnchor: 'middle',
          textVerticalAnchor: 'top',
          refY: 10,
        },
      },
      ports: {
        groups: {
          top: {
            position: 'top',
            attrs: {
              circle: {
                r: 4,
                magnet: true,
                stroke: '#31d0c6',
                strokeWidth: 2,
                fill: '#fff',
                style: {
                  visibility: 'hidden',
                },
              },
            },
          },
          right: {
            position: 'right',
            attrs: {
              circle: {
                r: 4,
                magnet: true,
                stroke: '#31d0c6',
                strokeWidth: 2,
                fill: '#fff',
                style: {
                  visibility: 'hidden',
                },
              },
            },
          },
          bottom: {
            position: 'bottom',
            attrs: {
              circle: {
                r: 4,
                magnet: true,
                stroke: '#31d0c6',
                strokeWidth: 2,
                fill: '#fff',
                style: {
                  visibility: 'hidden',
                },
              },
            },
          },
          left: {
            position: 'left',
            attrs: {
              circle: {
                r: 4,
                magnet: true,
                stroke: '#31d0c6',
                strokeWidth: 2,
                fill: '#fff',
                style: {
                  visibility: 'hidden',
                },
              },
            },
          },
        },
        items: [
          { group: 'top', id: 'top' },
          { group: 'right', id: 'right' },
          { group: 'bottom', id: 'bottom' },
          { group: 'left', id: 'left' },
        ],
      },
    },
    true
  );
}

/**
 * 初始化X6图形
 */
async function initGraph() {
  if (!containerRef.value) {
    console.warn('容器引用不存在，无法初始化图形');
    return;
  }

  // 注册自定义节点
  registerCustomNodes();

  try {
    // 获取容器尺寸
    const rect = containerRef.value.getBoundingClientRect();
    const containerWidth = Math.max(rect.width, containerRef.value.clientWidth, 800);
    const containerHeight = Math.max(rect.height, containerRef.value.clientHeight, 600);
    
    // 验证容器尺寸
    if (containerWidth < 100 || containerHeight < 100) {
      console.warn('容器尺寸异常，延迟初始化:', { width: containerWidth, height: containerHeight });
      setTimeout(() => initGraph(), 200);
      return;
    }
    
    console.log('初始化X6图形，容器尺寸:', containerWidth, containerHeight);
    
    // 创建X6图形实例
    graph = new Graph({
      container: containerRef.value,
      width: containerWidth,
      height: containerHeight,
      grid: {
        visible: props.showGrid,
        type: 'dot',
        size: 10,
        args: {
          color: '#cccccc',
          thickness: 1,
        },
      },
      connecting: {
        router: 'manhattan',
        connector: {
          name: 'rounded',
          args: {
            radius: 8
          }
        },
        anchor: 'center',
        connectionPoint: 'anchor',
        allowBlank: false,
        snap: {
          radius: 20
        },
        createEdge() {
          return graph!.createEdge({
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
        },
        validateConnection({ targetMagnet }) {
          return !!targetMagnet;
        }
      },
      highlighting: {
        magnetAdsorbed: {
          name: 'stroke',
          args: {
            attrs: {
              fill: '#5F95FF',
              stroke: '#5F95FF'
            }
          }
        }
      },
      interacting: {
        nodeMovable: true,
        magnetConnectable: true,
        edgeMovable: false,
        edgeLabelMovable: false,
        arrowheadMovable: false,
        vertexMovable: false,
        vertexAddable: false,
        vertexDeletable: false
      },
      keyboard: true,
      clipboard: true,
    });

    // 添加滚动插件
    graph.use(
      new Scroller({
        enabled: true,
        pannable: true,
        modifiers: ['ctrl', 'meta'],
        pageVisible: false,
        pageBreak: false,
        autoResize: true,
      })
    );

    // 等待下一个 tick 后添加小地图
    await nextTick();
    if (minimapContentRef.value) {
      minimapInstance = new MiniMap({
        container: minimapContentRef.value,
        width: 200,
        height: 160,
        padding: 10,
        scalable: false,
        minScale: 0.01,
        maxScale: 16,
      });
      graph.use(minimapInstance);
    }

    // 初始化连接管理器
    connectionManager = new X6ConnectionManager(graph);

    // 绑定事件
    bindGraphEvents();

    // 通知父组件图形已准备就绪
    emit('graph-ready', graph);

    console.log('X6图形初始化完成');
  } catch (error) {
    console.error('初始化X6图形失败:', error);
  }
}

/**
 * 绑定图形事件
 */
function bindGraphEvents() {
  if (!graph) return;

  // 节点选择事件
  graph.on('node:selected', ({ node }) => {
    emit('node-selected', node);
  });

  // 边选择事件
  graph.on('edge:selected', ({ edge }) => {
    emit('edge-selected', edge);
  });

  // 清除选择事件
  graph.on('blank:click', () => {
    emit('selection-cleared');
  });

  // 节点点击事件（连线模式）
  graph.on('node:click', ({ node }) => {
    if (props.isConnectMode) {
      emit('node-clicked', node);
    }
  });

  // 连接完成事件
  graph.on('edge:connected', ({ edge }) => {
    const sourceNode = edge.getSourceNode();
    const targetNode = edge.getTargetNode();
    if (sourceNode && targetNode) {
      // 移除临时边
      graph?.removeCell(edge);
      // 触发创建关系事件
      emit('create-relationship', sourceNode, targetNode);
    }
  });
}

/**
 * 监听连接点显示状态变化
 */
watch(() => props.showConnectionPoints, (show) => {
  if (!graph) return;
  
  const nodes = graph.getNodes();
  nodes.forEach(node => {
    const ports = node.getPorts();
    ports.forEach(port => {
      node.setPortProp(port.id!, 'attrs/circle/style/visibility', show ? 'visible' : 'hidden');
    });
  });
});

/**
 * 监听网格显示状态变化
 */
watch(() => props.showGrid, (visible) => {
  if (!graph) return;
  if (visible) {
    graph.drawGrid();
    graph.showGrid();
  } else {
    graph.hideGrid();
  }
});

/**
 * 获取图形实例
 * @returns 图形实例
 */
function getGraph(): Graph | null {
  return graph;
}

/**
 * 获取连接管理器实例
 * @returns 连接管理器实例
 */
function getConnectionManager(): X6ConnectionManager | null {
  return connectionManager;
}

/**
 * 切换小地图显示状态
 */
function toggleMinimap() {
  showMinimap.value = !showMinimap.value;
}

// 暴露方法给父组件
defineExpose({
  getGraph,
  getConnectionManager,
  toggleMinimap,
});

// 生命周期
onMounted(async () => {
  await nextTick();
  await initGraph();
});

onUnmounted(() => {
  if (minimapInstance) {
    minimapInstance = null;
  }
  if (graph) {
    graph.dispose();
    graph = null;
  }
  connectionManager = null;
});
</script>

<style scoped>
.x6-graph-canvas {
  @apply relative flex-1 overflow-hidden;
}

.connect-hint {
  @apply absolute top-4 left-1/2 transform -translate-x-1/2 z-10 w-96;
}

.graph-container {
  @apply w-full h-full;
}

.graph-container.connect-mode {
  @apply cursor-crosshair;
}

/* 小地图容器样式 */
.minimap-container {
  @apply absolute bottom-4 right-4 bg-white border border-gray-200 rounded-lg shadow-lg z-20;
  width: 220px;
  height: 200px;
}

.minimap-header {
  @apply flex items-center justify-between px-3 py-2 border-b border-gray-100 bg-gray-50 rounded-t-lg;
}

.minimap-title {
  @apply text-sm font-medium text-gray-700;
}

.minimap-toggle {
  @apply p-1;
}

.minimap-content {
  @apply w-full;
  height: 160px;
}

/* 小地图切换按钮样式 */
.minimap-toggle-btn {
  @apply absolute bottom-4 right-4 z-20;
}

/* 深色模式适配 */
.dark .minimap-container {
  @apply bg-gray-800 border-gray-600;
}

.dark .minimap-header {
  @apply bg-gray-700 border-gray-600;
}

.dark .minimap-title {
  @apply text-gray-200;
}

/* 小地图内部样式覆盖 */
:deep(.x6-widget-minimap) {
  border: none !important;
  border-radius: 0 !important;
}

:deep(.x6-widget-minimap-viewport) {
  border: 2px solid #1976d2 !important;
  background-color: rgba(25, 118, 210, 0.1) !important;
}
</style>