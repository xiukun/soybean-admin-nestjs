<script setup lang="ts">
import { nextTick, onMounted, onUnmounted, ref, watch } from 'vue';
import { NButton, NButtonGroup, NCheckbox, NDropdown, NIcon, NSpace, NText } from 'naive-ui';
import type { Edge, Node } from '@antv/x6';
import { Graph, Shape } from '@antv/x6';
import { Selection } from '@antv/x6-plugin-selection';
import { Snapline } from '@antv/x6-plugin-snapline';
import { Keyboard } from '@antv/x6-plugin-keyboard';
import { Clipboard } from '@antv/x6-plugin-clipboard';
import { History } from '@antv/x6-plugin-history';
import { Transform } from '@antv/x6-plugin-transform';
import { MiniMap } from '@antv/x6-plugin-minimap';
import { Scroller } from '@antv/x6-plugin-scroller';
import { DagreLayout } from '@antv/layout';
import type { Entity, EntityRelationship } from '../types';

// 图标导入
import IconMdiPlus from '~icons/mdi/plus';
import IconMdiMinus from '~icons/mdi/minus';
import IconMdiFitToPage from '~icons/mdi/fit-to-page';
import IconMdiHome from '~icons/mdi/home';
import IconMdiAutoFix from '~icons/mdi/auto-fix';

// 实体字段接口定义
interface EntityField {
  id: string;
  name: string;
  type: string;
  isPrimaryKey?: boolean;
  isRequired?: boolean;
  description?: string;
}

/**
 * X6图形画布组件
 *
 * 基于AntV X6的实体关系图渲染引擎，支持拖拽、缩放、布局等功能
 */

interface Props {
  /** 实体数据 */
  entities?: Entity[];
  /** 关系数据 */
  relationships?: EntityRelationship[];
  /** 是否为连接模式 */
  isConnectMode?: boolean;
  /** 连接源节点 */
  connectSourceNode?: Node | null;
  /** 显示网格 */
  showGrid?: boolean;
  /** 显示连接点 */
  showConnectionPoints?: boolean;
  /** 显示小地图 */
  showMinimap?: boolean;
  /** 小地图容器 */
  minimapContainer?: HTMLElement;
  /** 是否只读 */
  readonly?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  entities: () => [],
  relationships: () => [],
  isConnectMode: false,
  connectSourceNode: null,
  showGrid: true,
  showConnectionPoints: false,
  showMinimap: false,
  minimapContainer: undefined,
  readonly: false
});

const emit = defineEmits<{
  /** 图形实例准备就绪 */
  'graph-ready': [graph: Graph];
  /** 节点选中事件 */
  'node-selected': [node: Node];
  /** 边选中事件 */
  'edge-selected': [edge: Edge];
  /** 选择清空事件 */
  'selection-cleared': [];
  /** 节点点击事件 */
  'node-clicked': [node: Node];
  /** 创建关系事件 */
  'create-relationship': [sourceNode: Node, targetNode: Node];
  /** 节点位置变化事件 */
  'node-moved': [node: Node, position: { x: number; y: number }];
  /** 实体更新事件 */
  'entity-updated': [entity: Entity];
}>();

// 组件引用
const graphContainer = ref<HTMLElement>();
const minimapContainer = ref<HTMLElement>();

// 图形实例
let graph: Graph | null = null;
let minimap: MiniMap | null = null;

// 状态
const currentZoom = ref(1);
const showGrid = ref(props.showGrid);

// 布局选项
const layoutOptions = [
  { label: '层次布局', key: 'dagre' },
  { label: '力导向布局', key: 'force' },
  { label: '网格布局', key: 'grid' },
  { label: '环形布局', key: 'circular' }
];

/** 注册自定义实体节点 */
function registerEntityNode() {
  Graph.registerNode(
    'entity-node',
    {
      inherit: 'rect',
      width: 200,
      height: 120,
      attrs: {
        body: {
          strokeWidth: 2,
          stroke: '#2563eb',
          fill: '#ffffff',
          rx: 8,
          ry: 8
        },
        text: {
          fontSize: 14,
          fill: '#1f2937',
          textAnchor: 'middle',
          textVerticalAnchor: 'top'
        }
      },
      markup: [
        {
          tagName: 'rect',
          selector: 'body'
        },
        {
          tagName: 'text',
          selector: 'title'
        },
        {
          tagName: 'foreignObject',
          selector: 'content'
        }
      ]
    },
    true
  );
}

/** 注册自定义关系边 */
function registerRelationshipEdge() {
  Graph.registerEdge(
    'relationship-edge',
    {
      inherit: 'edge',
      attrs: {
        line: {
          stroke: '#6b7280',
          strokeWidth: 2,
          targetMarker: {
            name: 'classic',
            size: 8
          }
        }
      },
      labels: [
        {
          attrs: {
            text: {
              fontSize: 12,
              fill: '#6b7280'
            },
            rect: {
              fill: '#ffffff',
              stroke: '#e5e7eb',
              strokeWidth: 1,
              rx: 4,
              ry: 4
            }
          }
        }
      ]
    },
    true
  );
}

/** 初始化图形实例 */
function initGraph() {
  if (!graphContainer.value) return;

  // 注册自定义节点和边
  registerEntityNode();
  registerRelationshipEdge();

  // 创建图形实例
  graph = new Graph({
    container: graphContainer.value,
    width: graphContainer.value.clientWidth,
    height: graphContainer.value.clientHeight,
    grid: {
      visible: showGrid.value,
      type: 'doubleMesh',
      args: [
        {
          color: '#e5e7eb',
          thickness: 1
        },
        {
          color: '#d1d5db',
          thickness: 1,
          factor: 4
        }
      ]
    },
    panning: {
      enabled: true,
      eventTypes: ['leftMouseDown', 'mouseWheel']
    },
    mousewheel: {
      enabled: true,
      modifiers: 'ctrl',
      factor: 1.1,
      maxScale: 3,
      minScale: 0.2
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
          shape: 'relationship-edge'
        });
      },
      validateConnection({ targetMagnet }) {
        return Boolean(targetMagnet);
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
    }
    // resizing和rotating配置移到Transform插件中
  });

  // 使用插件
  graph
    .use(
      new Selection({
        rubberband: true,
        showNodeSelectionBox: true
      })
    )
    .use(new Snapline())
    .use(new Keyboard())
    .use(new Clipboard())
    .use(new History())
    .use(
      new Transform({
        resizing: !props.readonly,
        rotating: !props.readonly
      })
    )
    .use(
      new Scroller({
        enabled: true,
        pannable: true,
        autoResize: true
      })
    );

  // 初始化小地图
  if (props.showMinimap && (props.minimapContainer || minimapContainer.value)) {
    const container = props.minimapContainer || minimapContainer.value;
    minimap = new MiniMap({
      container: container!,
      width: 200,
      height: 120,
      padding: 10
    });
    graph.use(minimap);
  }

  // 绑定事件
  bindEvents();

  // 渲染数据
  renderData();

  // 通知父组件图形实例已准备就绪
  emit('graph-ready', graph);
}

/** 绑定图形事件 */
function bindEvents() {
  if (!graph) return;

  // 节点选中事件
  graph.on('node:selected', ({ node }) => {
    emit('node-selected', node);
  });

  // 边选中事件
  graph.on('edge:selected', ({ edge }) => {
    emit('edge-selected', edge);
  });

  // 选择清空事件
  graph.on('selection:cleared', () => {
    emit('selection-cleared');
  });

  // 节点点击事件
  graph.on('node:click', ({ node }) => {
    emit('node-clicked', node);
  });

  // 节点移动事件
  graph.on('node:moved', ({ node }) => {
    const position = node.getPosition();
    emit('node-moved', node, position);
  });

  // 缩放变化事件
  graph.on('scale', ({ sx }) => {
    currentZoom.value = sx;
  });

  // 连接创建事件
  graph.on('edge:connected', ({ edge }) => {
    const sourceNode = edge.getSourceNode();
    const targetNode = edge.getTargetNode();
    if (sourceNode && targetNode) {
      emit('create-relationship', sourceNode, targetNode);
    }
  });
}

/** 渲染实体和关系数据 */
function renderData() {
  if (!graph) return;

  // 清空现有内容
  graph.clearCells();

  // 渲染实体节点
  const nodes = props.entities.map((entity, index) => {
    return createEntityNode(entity, index);
  });

  // 渲染关系边
  const edges = props.relationships.map(relationship => {
    return createRelationshipEdge(relationship);
  });

  // 添加到图形中
  graph.addNodes(nodes);
  const validEdges = edges.filter(edge => edge !== null);
  if (validEdges.length > 0) {
    graph.addEdges(validEdges);
  }

  // 自动布局
  nextTick(() => {
    autoLayout();
  });
}

/**
 * 创建实体节点
 *
 * @param entity - 实体数据
 * @param index - 索引
 */
function createEntityNode(entity: Entity, index: number) {
  // 模拟字段数据，实际应从API获取
  const mockFields: EntityField[] = [
    { id: '1', name: 'id', type: 'bigint', isPrimaryKey: true, isRequired: true },
    { id: '2', name: 'name', type: 'varchar', isRequired: true },
    { id: '3', name: 'created_at', type: 'timestamp', isRequired: true }
  ];

  const fieldsHtml = mockFields
    .map(
      field =>
        `<div class="field-item">
      <span class="field-name">${field.name}</span>
      <span class="field-type">${field.type}</span>
      ${field.isPrimaryKey ? '<span class="field-key">🔑</span>' : ''}
      ${field.isRequired ? '<span class="field-required">*</span>' : ''}
    </div>`
    )
    .join('');

  const contentHtml = `
    <div class="entity-content">
      <div class="entity-header">
        <h3 class="entity-title">${entity.name}</h3>
        <p class="entity-description">${entity.description || ''}</p>
      </div>
      <div class="entity-fields">
        ${fieldsHtml}
      </div>
    </div>
  `;

  return graph!.createNode({
    shape: 'entity-node',
    x: 100 + (index % 4) * 250,
    y: 100 + Math.floor(index / 4) * 200,
    width: 220,
    height: Math.max(120, 80 + mockFields.length * 24),
    data: {
      id: entity.id,
      type: 'entity',
      entity
    },
    attrs: {
      content: {
        width: 220,
        height: Math.max(120, 80 + mockFields.length * 24),
        html: contentHtml
      }
    },
    ports: {
      groups: {
        top: {
          position: 'top',
          attrs: {
            circle: {
              r: 4,
              magnet: true,
              stroke: '#5F95FF',
              strokeWidth: 1,
              fill: '#fff',
              style: {
                visibility: props.showConnectionPoints ? 'visible' : 'hidden'
              }
            }
          }
        },
        right: {
          position: 'right',
          attrs: {
            circle: {
              r: 4,
              magnet: true,
              stroke: '#5F95FF',
              strokeWidth: 1,
              fill: '#fff',
              style: {
                visibility: props.showConnectionPoints ? 'visible' : 'hidden'
              }
            }
          }
        },
        bottom: {
          position: 'bottom',
          attrs: {
            circle: {
              r: 4,
              magnet: true,
              stroke: '#5F95FF',
              strokeWidth: 1,
              fill: '#fff',
              style: {
                visibility: props.showConnectionPoints ? 'visible' : 'hidden'
              }
            }
          }
        },
        left: {
          position: 'left',
          attrs: {
            circle: {
              r: 4,
              magnet: true,
              stroke: '#5F95FF',
              strokeWidth: 1,
              fill: '#fff',
              style: {
                visibility: props.showConnectionPoints ? 'visible' : 'hidden'
              }
            }
          }
        }
      },
      items: [{ group: 'top' }, { group: 'right' }, { group: 'bottom' }, { group: 'left' }]
    }
  });
}

/**
 * 创建关系边
 *
 * @param relationship - 关系数据
 */
function createRelationshipEdge(relationship: EntityRelationship) {
  const sourceEntity = props.entities.find(e => e.id === relationship.sourceEntityId);
  const targetEntity = props.entities.find(e => e.id === relationship.targetEntityId);

  if (!sourceEntity || !targetEntity) {
    return null;
  }

  return graph!.createEdge({
    shape: 'relationship-edge',
    source: { cell: sourceEntity.id },
    target: { cell: targetEntity.id },
    data: {
      id: relationship.id,
      type: 'relationship',
      relationship
    },
    labels: [
      {
        markup: [
          {
            tagName: 'rect',
            selector: 'body'
          },
          {
            tagName: 'text',
            selector: 'label'
          }
        ],
        attrs: {
          label: {
            text: relationship.type || '关联',
            fontSize: 12,
            fill: '#6b7280'
          },
          body: {
            ref: 'label',
            refX: -4,
            refY: -2,
            refWidth: '100%',
            refHeight: '100%',
            refWidth2: 8,
            refHeight2: 4,
            stroke: '#e5e7eb',
            fill: '#ffffff',
            strokeWidth: 1,
            rx: 4,
            ry: 4
          }
        }
      }
    ]
  });
}

/** 自动布局 */
function autoLayout() {
  if (!graph) return;

  const nodes = graph.getNodes();
  const edges = graph.getEdges();

  if (nodes.length === 0) return;

  // 简单的网格布局
  const cols = Math.ceil(Math.sqrt(nodes.length));
  nodes.forEach((node, index) => {
    const col = index % cols;
    const row = Math.floor(index / cols);
    const x = 100 + col * 250;
    const y = 100 + row * 200;
    node.setPosition(x, y);
  });
}

/** 缩放控制函数 */
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

function zoomToFit() {
  if (graph) {
    graph.zoomToFit({ padding: 20 });
  }
}

function zoomToOrigin() {
  if (graph) {
    graph.zoomTo(1);
    graph.centerContent();
  }
}

/** 切换网格显示 */
function toggleGrid() {
  if (graph) {
    if (showGrid.value) {
      graph.showGrid();
    } else {
      graph.hideGrid();
    }
  }
}

/**
 * 处理布局选择
 *
 * @param layoutKey - 布局类型
 */
function handleLayoutSelect(layoutKey: string) {
  // 实现不同布局算法
  console.log('选择布局:', layoutKey);
  autoLayout();
}

// 监听属性变化
watch(
  () => props.entities,
  () => {
    renderData();
  },
  { deep: true }
);

watch(
  () => props.relationships,
  () => {
    renderData();
  },
  { deep: true }
);

watch(
  () => props.showGrid,
  newVal => {
    showGrid.value = newVal;
    toggleGrid();
  }
);

watch(
  () => props.showConnectionPoints,
  newVal => {
    if (graph) {
      const nodes = graph.getNodes();
      nodes.forEach(node => {
        const ports = node.getPorts();
        ports.forEach(port => {
          node.setPortProp(port.id!, 'attrs/circle/style/visibility', newVal ? 'visible' : 'hidden');
        });
      });
    }
  }
);

// 组件挂载
onMounted(() => {
  nextTick(() => {
    initGraph();
  });
});

// 组件卸载
onUnmounted(() => {
  if (graph) {
    graph.dispose();
    graph = null;
  }
  if (minimap) {
    minimap = null;
  }
});

// 简化的小地图节点视图
const SimpleNodeView = Shape.Rect.define({
  attrs: {
    body: {
      fill: '#2563eb',
      stroke: 'transparent'
    }
  }
});
</script>

<template>
  <div class="x6-graph-canvas">
    <!-- X6画布容器 -->
    <div ref="graphContainer" class="graph-container"></div>

    <!-- 工具栏 -->
    <div class="graph-toolbar">
      <NSpace>
        <!-- 缩放控制 -->
        <NButtonGroup size="small">
          <NButton @click="zoomIn">
            <template #icon>
              <NIcon><icon-mdi-plus /></NIcon>
            </template>
          </NButton>
          <NButton @click="zoomOut">
            <template #icon>
              <NIcon><icon-mdi-minus /></NIcon>
            </template>
          </NButton>
          <NButton @click="zoomToFit">
            <template #icon>
              <NIcon><icon-mdi-fit-to-page /></NIcon>
            </template>
          </NButton>
          <NButton @click="zoomToOrigin">
            <template #icon>
              <NIcon><icon-mdi-home /></NIcon>
            </template>
          </NButton>
        </NButtonGroup>

        <!-- 布局控制 -->
        <NDropdown :options="layoutOptions" @select="handleLayoutSelect">
          <NButton size="small">
            <template #icon>
              <NIcon><icon-mdi-auto-fix /></NIcon>
            </template>
            自动布局
          </NButton>
        </NDropdown>

        <!-- 显示控制 -->
        <NCheckbox v-model:checked="showGrid" size="small" @update:checked="toggleGrid">网格</NCheckbox>

        <!-- 缩放显示 -->
        <NText depth="3" class="text-xs">{{ Math.round(currentZoom * 100) }}%</NText>
      </NSpace>
    </div>

    <!-- 小地图 -->
    <div v-if="showMinimap" class="minimap-wrapper">
      <div ref="minimapContainer" class="minimap"></div>
    </div>
  </div>
</template>

<style scoped>
.x6-graph-canvas {
  @apply relative w-full h-full;
}

.graph-container {
  @apply w-full h-full;
}

.graph-toolbar {
  @apply absolute top-4 left-4 bg-white rounded-lg shadow-md p-2 z-10;
}

.minimap-wrapper {
  @apply absolute bottom-4 right-4 bg-white rounded-lg shadow-md overflow-hidden z-10;
}

.minimap {
  @apply w-48 h-32;
}

/* 实体节点样式 */
:deep(.entity-content) {
  @apply p-3 h-full;
}

:deep(.entity-header) {
  @apply border-b border-gray-200 pb-2 mb-2;
}

:deep(.entity-title) {
  @apply text-sm font-semibold text-gray-900 m-0;
}

:deep(.entity-description) {
  @apply text-xs text-gray-500 mt-1 m-0;
}

:deep(.entity-fields) {
  @apply space-y-1;
}

:deep(.field-item) {
  @apply flex items-center justify-between text-xs;
}

:deep(.field-name) {
  @apply font-medium text-gray-700;
}

:deep(.field-type) {
  @apply text-gray-500 text-xs;
}

:deep(.field-key) {
  @apply text-yellow-500;
}

:deep(.field-required) {
  @apply text-red-500 font-bold;
}

/* 修复X6图形容器的触摸事件问题 */
:deep(.x6-graph) {
  touch-action: none;
}

:deep(.x6-graph-svg) {
  touch-action: none;
}

/* 为X6图形元素添加被动事件监听器支持 */
:deep(.x6-graph-svg-viewport) {
  touch-action: none;
}

:deep(.x6-graph-svg-stage) {
  touch-action: none;
}
</style>
