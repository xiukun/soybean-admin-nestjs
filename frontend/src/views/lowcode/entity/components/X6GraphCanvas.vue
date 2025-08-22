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
      ],
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
                fill: '#fff'
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
                fill: '#fff'
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
                fill: '#fff'
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
                fill: '#fff'
              }
            }
          }
        },
        items: [{ group: 'top' }, { group: 'right' }, { group: 'bottom' }, { group: 'left' }]
      }
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
    // 当节点被移动时，更新实体的位置信息
    const position = node.getPosition();
    const data = node.getData();
    
    if (data && data.entity) {
      const updatedEntity = {
        ...data.entity,
        x: position.x,
        y: position.y
      };
      
      // 发送实体更新事件，包含新的位置信息
      emit('entity-updated', updatedEntity);
    }
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
async function createEntityNode(entity: Entity, index: number) {
  // 从API获取真实字段数据
  let fields: any[] = [];
  try {
    // 这里应该调用字段API，暂时使用模拟数据
    const response = await import('@/service/api/lowcode-field').then(module => 
      module.fetchGetFieldList(entity.id)
    );
    fields = response.data || [];
  } catch (error) {
    console.warn('获取字段数据失败，使用默认字段:', error);
    // 提供默认字段结构
    fields = [
      { id: '1', name: 'id', code: 'id', dataType: 'BIGINT', isPrimaryKey: true, isRequired: true, description: '主键' },
      { id: '2', name: '名称', code: 'name', dataType: 'STRING', isRequired: true, description: '实体名称' },
      { id: '3', name: '创建时间', code: 'created_at', dataType: 'DATETIME', isRequired: true, description: '创建时间' },
      { id: '4', name: '更新时间', code: 'updated_at', dataType: 'DATETIME', isRequired: true, description: '更新时间' }
    ];
  }

  // 如果没有字段，提供基本字段
  if (!fields || fields.length === 0) {
    fields = [
      { id: 'default_id', name: 'ID', code: 'id', dataType: 'BIGINT', isPrimaryKey: true, isRequired: true, description: '主键标识' }
    ];
  }

  // 限制显示的字段数量，避免节点过高
  const maxFields = 8;
  const displayFields = fields.slice(0, maxFields);
  const hasMoreFields = fields.length > maxFields;

  // 生成字段HTML
  const fieldsHtml = displayFields
    .map(
      field => {
        const typeLabel = getFieldTypeLabel(field.dataType);
        const keyIcon = field.isPrimaryKey ? '<span class="field-key" title="主键">🔑</span>' : '';
        const requiredIcon = field.isRequired ? '<span class="field-required" title="必填">*</span>' : '';
        const foreignKeyIcon = field.isForeignKey ? '<span class="field-foreign" title="外键">🔗</span>' : '';
        
        return `<div class="field-item ${field.isPrimaryKey ? 'primary-key' : ''}">
          <div class="field-info">
            <span class="field-name">${field.name}</span>
            <span class="field-code">(${field.code})</span>
          </div>
          <div class="field-meta">
            <span class="field-type">${typeLabel}</span>
            ${keyIcon}${foreignKeyIcon}${requiredIcon}
          </div>
        </div>`;
      }
    )
    .join('');

  // 如果有更多字段，显示省略信息
  const moreFieldsHtml = hasMoreFields 
    ? `<div class="field-item more-fields">
        <span class="more-text">...还有 ${fields.length - maxFields} 个字段</span>
      </div>` 
    : '';

  // 生成实体内容HTML
  const contentHtml = `
    <div class="entity-content">
      <div class="entity-header">
        <div class="entity-title-area">
          <h3 class="entity-title">${entity.name}</h3>
          <span class="entity-code">${entity.code || ''}</span>
        </div>
        ${entity.description ? `<p class="entity-description">${entity.description}</p>` : ''}
        <div class="entity-stats">
          <span class="stat-item">表: ${entity.tableName || 'N/A'}</span>
          <span class="stat-item">字段: ${fields.length}</span>
        </div>
      </div>
      <div class="entity-fields">
        <div class="fields-header">
          <span class="fields-title">字段列表</span>
        </div>
        <div class="fields-list">
          ${fieldsHtml}
          ${moreFieldsHtml}
        </div>
      </div>
    </div>
  `;

  // 根据内容动态计算节点高度
  const baseHeight = 140; // 头部基础高度
  const fieldHeight = 24; // 每个字段的高度
  const actualFieldCount = Math.min(displayFields.length + (hasMoreFields ? 1 : 0), maxFields + 1);
  const calculatedHeight = Math.max(baseHeight + actualFieldCount * fieldHeight, 180);

  // 修复实体位置计算逻辑 - 优先使用实体已保存的坐标，如果没有则使用合理的默认布局
  const defaultX = 100 + (index % 4) * 300;
  const defaultY = 100 + Math.floor(index / 4) * 250;
  
  return graph!.createNode({
    shape: 'entity-node',
    x: entity.x ?? defaultX,
    y: entity.y ?? defaultY,
    width: 260,
    height: calculatedHeight,
    data: {
      id: entity.id,
      type: 'entity',
      entity,
      fields // 保存字段数据以供其他组件使用
    },
    attrs: {
      content: {
        width: 260,
        height: calculatedHeight,
        html: contentHtml
      }
    }
  });
}

/**
 * 获取字段类型显示标签
 */
function getFieldTypeLabel(dataType: string): string {
  const typeMap: Record<string, string> = {
    'STRING': '字符串',
    'TEXT': '文本',
    'INTEGER': '整数',
    'BIGINT': '长整数',
    'DECIMAL': '小数',
    'FLOAT': '浮点数',
    'BOOLEAN': '布尔值',
    'DATE': '日期',
    'DATETIME': '日期时间',
    'TIMESTAMP': '时间戳',
    'JSON': 'JSON',
    'UUID': 'UUID'
  };
  return typeMap[dataType] || dataType;
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
  @apply p-0 h-full bg-white border border-gray-200 rounded-lg shadow-sm;
}

:deep(.entity-header) {
  @apply bg-gradient-to-r from-blue-50 to-blue-100 border-b border-gray-200 p-3;
}

:deep(.entity-title-area) {
  @apply flex items-center justify-between mb-1;
}

:deep(.entity-title) {
  @apply text-sm font-semibold text-gray-900 m-0;
}

:deep(.entity-code) {
  @apply text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded;
}

:deep(.entity-description) {
  @apply text-xs text-gray-600 mt-1 mb-2 m-0 line-clamp-2;
}

:deep(.entity-stats) {
  @apply flex items-center space-x-3 text-xs text-gray-500;
}

:deep(.stat-item) {
  @apply flex items-center;
}

:deep(.entity-fields) {
  @apply flex flex-col h-full;
}

:deep(.fields-header) {
  @apply bg-gray-50 border-b border-gray-200 px-3 py-2;
}

:deep(.fields-title) {
  @apply text-xs font-medium text-gray-700;
}

:deep(.fields-list) {
  @apply flex-1 p-2 space-y-1 overflow-hidden;
}

:deep(.field-item) {
  @apply flex items-center justify-between p-2 rounded text-xs hover:bg-gray-50 transition-colors;
}

:deep(.field-item.primary-key) {
  @apply bg-yellow-50 border border-yellow-200;
}

:deep(.field-info) {
  @apply flex-1 min-w-0;
}

:deep(.field-name) {
  @apply font-medium text-gray-900 truncate;
}

:deep(.field-code) {
  @apply text-gray-500 ml-1;
}

:deep(.field-meta) {
  @apply flex items-center space-x-1 flex-shrink-0;
}

:deep(.field-type) {
  @apply bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs;
}

:deep(.field-key) {
  @apply text-yellow-600;
}

:deep(.field-foreign) {
  @apply text-blue-600;
}

:deep(.field-required) {
  @apply text-red-500 font-bold;
}

:deep(.more-fields) {
  @apply text-center py-2 text-gray-500 italic;
}

:deep(.more-text) {
  @apply text-xs;
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
