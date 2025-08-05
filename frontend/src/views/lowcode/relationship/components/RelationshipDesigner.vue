<template>
  <div class="relationship-designer" :class="{ 'loading': loading }">
    <!-- 加载遮罩 -->
    <div v-if="loading" class="loading-mask">
      <n-spin size="large" />
    </div>

    <!-- 工具栏 -->
    <RelationshipDesignerToolbar
      :is-connect-mode="isConnectMode"
      :layout-loading="layoutLoading"
      :show-connection-points="showConnectionPoints"
      :zoom-level="zoomLevel"
      @toggle-connect-mode="toggleConnectMode"
      @auto-layout="autoLayout"
      @toggle-minimap="toggleMinimap"
      @toggle-connection-points="toggleConnectionPoints"
      @zoom-in="zoomIn"
      @zoom-out="zoomOut"
      @fit-view="fitView"
      @toggle-grid="toggleGridVisible"
      @toggle-snap-to-grid="toggleSnapToGrid"
      @export="handleExport"
      @save-state="saveGraphState"
    />

    <!-- 主要内容区域 -->
    <div class="designer-content">
      <!-- 实体列表面板 -->
      <EntityListPanel
        :entities="entities"
        :graph-entity-ids="graphEntityIds"
        :loading="entitiesLoading"
        @entity-click="handleEntityClick"
        @add-entity="addEntityToGraph"
        @remove-entity="removeEntityFromGraph"
        @locate-entity="locateEntity"
        @search="handleEntitySearch"
      />

      <!-- X6画布 -->
      <X6GraphCanvas
        ref="graphCanvasRef"
        :is-connect-mode="isConnectMode"
        :connect-source-node="connectSourceNode"
        :show-grid="isGridVisible"
        :snap-to-grid="isSnapToGridEnabled"
        :show-connection-points="showConnectionPoints"
        @graph-ready="handleGraphReady"
        @node-selected="handleNodeSelected"
        @edge-selected="handleEdgeSelected"
        @selection-cleared="clearSelection"
        @node-clicked="handleNodeClicked"
        @cancel-connect="cancelConnect"
        @create-relationship="handleCreateRelationship"
      />

      <!-- 属性面板 -->
      <PropertyPanel
        :selected-cell="selectedCell"
        :entity-data="selectedNodeData"
        :relationship-data="selectedEdgeData"
        :visual-data="selectedVisualData"
        :fields="entityFields"
        :fields-loading="fieldsLoading"
        @close="clearSelection"
        @update-entity="handleUpdateEntity"
        @update-relationship="handleUpdateRelationship"
        @update-visual="handleUpdateVisual"
        @update-position="handleUpdateEntityPosition"
        @update-size="handleUpdateEntitySize"
        @navigate-to-fields="navigateToEntityFields"
      />
    </div>

    <!-- 创建关系对话框 -->
    <n-modal 
      v-model:show="createRelationshipModalVisible" 
      preset="dialog" 
      :title="$t('page.lowcode.relationship.createRelationshipDialog')"
    >
      <div class="mb-4">
        <span class="text-sm text-gray-600">
          {{ $t('page.lowcode.relationship.sourceEntity') }}: {{ sourceEntityName }} → 
          {{ $t('page.lowcode.relationship.targetEntity') }}: {{ targetEntityName }}
        </span>
      </div>
      <n-form :model="newRelationshipForm" label-placement="left" label-width="80px">
        <n-form-item :label="$t('page.lowcode.relationship.name')" required>
          <n-input 
            v-model:value="newRelationshipForm.name" 
            :placeholder="$t('page.lowcode.relationship.form.name.placeholder')" 
          />
        </n-form-item>
        <n-form-item :label="$t('page.lowcode.relationship.relationType')" required>
          <n-select 
            v-model:value="newRelationshipForm.type" 
            :options="relationshipTypeOptions" 
            :placeholder="$t('page.lowcode.relationship.form.relationType.placeholder')" 
          />
        </n-form-item>
        <n-form-item :label="$t('page.lowcode.relationship.description')">
          <n-input 
            v-model:value="newRelationshipForm.description" 
            type="textarea" 
            :placeholder="$t('page.lowcode.relationship.form.description.placeholder')" 
          />
        </n-form-item>
      </n-form>
      
      <template #action>
        <n-space>
          <n-button @click="cancelCreateRelationship">
            {{ $t('page.lowcode.common.actions.cancel') }}
          </n-button>
          <n-button type="primary" @click="confirmCreateRelationship" :loading="createRelationshipLoading">
            {{ $t('page.lowcode.common.actions.confirm') }}
          </n-button>
        </n-space>
      </template>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue';
import { Graph, Node, Edge, Cell } from '@antv/x6';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import { NSpin, NModal, NForm, NFormItem, NInput, NSelect, NButton, NSpace, useMessage } from 'naive-ui';
import { debounce } from 'lodash-es';

// 组件导入
import RelationshipDesignerToolbar from './RelationshipDesignerToolbar.vue';
import EntityListPanel from './EntityListPanel.vue';
import X6GraphCanvas from './X6GraphCanvas.vue';
import PropertyPanel from './PropertyPanel.vue';

// API导入
import { fetchGetAllEntities, fetchUpdateEntity } from '@/service/api/lowcode-entity';
import { fetchGetAllFields } from '@/service/api/lowcode-field';
import { fetchGetAllRelationships, fetchUpdateRelationship, fetchAddRelationship } from '@/service/api/lowcode-relationship';

/**
 * 关系设计器主组件
 * @description 整合所有子组件，提供完整的实体关系设计功能
 */

interface Props {
  /** 项目ID */
  projectId: string;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  /** 关系更新事件 */
  'relationship-updated': [];
  /** 错误事件 */
  'error': [message: string];
}>();

const { t } = useI18n();
const router = useRouter();
const message = useMessage();

// 组件引用
const graphCanvasRef = ref<InstanceType<typeof X6GraphCanvas>>();

// 图形实例
let graph: Graph | null = null;

// 状态管理
const loading = ref(false);
const layoutLoading = ref(false);
const entitiesLoading = ref(false);
const fieldsLoading = ref(false);
const createRelationshipLoading = ref(false);
const zoomLevel = ref(1);
const isMinimapVisible = ref(false);
const isGridVisible = ref(true);
const isSnapToGridEnabled = ref(false);
const showConnectionPoints = ref(false);

// 连线模式状态
const isConnectMode = ref(false);
const connectSourceNode = ref<any>(null);

// 选中状态
const selectedCell = ref<any>(null);
const selectedNodeData = reactive({
  name: '',
  code: '',
  tableName: '',
  description: ''
});
const selectedEdgeData = reactive({
  name: '',
  code: '',
  type: 'ONE_TO_MANY',
  description: '',
  onDelete: 'RESTRICT',
  onUpdate: 'RESTRICT',
  foreignKeyField: '',
  cascadeDelete: false,
  cascadeUpdate: false,
  required: false
});
const selectedVisualData = reactive({
  color: '#1976d2',
  x: 0,
  y: 0,
  width: 200,
  height: 120,
  lineStyle: 'solid',
  lineColor: '#5F95FF'
});

// 数据
const entities = ref<any[]>([]);
const relationships = ref<any[]>([]);
const entityFields = ref<any[]>([]);

// 创建关系对话框
const createRelationshipModalVisible = ref(false);
const newRelationshipForm = reactive({
  name: '',
  type: 'ONE_TO_MANY',
  description: ''
});
const sourceEntityName = ref('');
const targetEntityName = ref('');
const pendingSourceNode = ref<any>(null);
const pendingTargetNode = ref<any>(null);

/**
 * 图中的实体ID集合
 * @returns 实体ID集合
 */
const graphEntityIds = computed(() => {
  if (!graph) return new Set<string>();
  return new Set(graph.getNodes().map(node => node.id as string));
});

/**
 * 关系类型选项
 * @returns 关系类型下拉选项
 */
const relationshipTypeOptions = computed(() => [
  { label: t('page.lowcode.relationship.relationTypes.oneToOne'), value: 'ONE_TO_ONE' },
  { label: t('page.lowcode.relationship.relationTypes.oneToMany'), value: 'ONE_TO_MANY' },
  { label: t('page.lowcode.relationship.relationTypes.manyToOne'), value: 'MANY_TO_ONE' },
  { label: t('page.lowcode.relationship.relationTypes.manyToMany'), value: 'MANY_TO_MANY' }
]);

/**
 * 处理图形准备就绪事件
 * @param graphInstance - 图形实例
 */
function handleGraphReady(graphInstance: Graph) {
  graph = graphInstance;
  loadData();
}

/**
 * 加载数据
 */
async function loadData() {
  loading.value = true;
  try {
    await Promise.all([
      loadEntities(),
      loadRelationships()
    ]);
    // 数据加载完成后，渲染实体和关系到图形中
    renderEntitiesAndRelationships();
  } catch (error) {
    console.error('加载数据失败:', error);
    emit('error', '加载数据失败');
  } finally {
    loading.value = false;
  }
}

/**
 * 加载实体数据
 */
async function loadEntities() {
  entitiesLoading.value = true;
  try {
    const response = await fetchGetAllEntities(props.projectId);
    entities.value = response.data || [];
  } catch (error) {
    console.error('加载实体失败:', error);
  } finally {
    entitiesLoading.value = false;
  }
}

/**
 * 加载关系数据
 */
async function loadRelationships() {
  try {
    const response = await fetchGetAllRelationships(props.projectId);
    relationships.value = response.data || [];
  } catch (error) {
    console.error('加载关系失败:', error);
  }
}

/**
 * 渲染实体和关系到图形中
 * @description 将已加载的实体和关系数据渲染为图形节点和边
 */
function renderEntitiesAndRelationships() {
  if (!graph) return;
  
  // 清空现有图形
  graph.clearCells();
  
  // 渲染实体为节点
  const entityPositions = new Map<string, { x: number; y: number }>();
  entities.value.forEach((entity, index) => {
    const x = (index % 4) * 250 + 100;
    const y = Math.floor(index / 4) * 200 + 100;
    entityPositions.set(entity.id, { x, y });
    
    graph!.addNode({
      id: entity.id,
      shape: 'entity-node',
      x,
      y,
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
  });
  
  // 渲染关系为边
  relationships.value.forEach(relationship => {
    const sourceNode = graph!.getCellById(relationship.sourceEntityId);
    const targetNode = graph!.getCellById(relationship.targetEntityId);
    
    if (sourceNode && targetNode) {
      graph!.addEdge({
        id: relationship.id,
        source: relationship.sourceEntityId,
        target: relationship.targetEntityId,
        data: relationship,
        label: relationship.name,
        attrs: {
          line: {
            stroke: '#5F95FF',
            strokeWidth: 2,
            targetMarker: {
              name: 'classic',
              size: 8,
            },
          },
          text: {
            text: relationship.name,
            fontSize: 12,
            fill: '#333'
          }
        },
      });
    }
  });
  
  // 适应视图
  setTimeout(() => {
    if (graph && graph.getNodes().length > 0) {
      graph.zoomToFit({ padding: 20 });
      zoomLevel.value = graph.zoom();
    }
  }, 100);
}

/**
 * 切换连线模式
 */
function toggleConnectMode() {
  isConnectMode.value = !isConnectMode.value;
  if (!isConnectMode.value) {
    connectSourceNode.value = null;
  }
}

/**
 * 切换连接点显示
 */
function toggleConnectionPoints() {
  showConnectionPoints.value = !showConnectionPoints.value;
}

/**
 * 切换小地图
 */
function toggleMinimap() {
  isMinimapVisible.value = !isMinimapVisible.value;
  // TODO: 实现小地图功能
}

/**
 * 切换网格显示
 */
function toggleGridVisible() {
  isGridVisible.value = !isGridVisible.value;
}

/**
 * 切换网格对齐
 */
function toggleSnapToGrid() {
  isSnapToGridEnabled.value = !isSnapToGridEnabled.value;
}

/**
 * 自动布局
 */
function autoLayout() {
  layoutLoading.value = true;
  // TODO: 实现自动布局功能
  setTimeout(() => {
    layoutLoading.value = false;
  }, 1000);
}

/**
 * 放大
 */
function zoomIn() {
  if (graph) {
    graph.zoom(0.1);
    zoomLevel.value = graph.zoom();
  }
}

/**
 * 缩小
 */
function zoomOut() {
  if (graph) {
    graph.zoom(-0.1);
    zoomLevel.value = graph.zoom();
  }
}

/**
 * 适应视图
 */
function fitView() {
  if (graph) {
    graph.zoomToFit({ padding: 20 });
    zoomLevel.value = graph.zoom();
  }
}

/**
 * 处理导出
 * @param type - 导出类型
 */
function handleExport(type: string) {
  // TODO: 实现导出功能
  console.log('导出类型:', type);
}

/**
 * 保存图形状态
 */
function saveGraphState() {
  // TODO: 实现保存状态功能
  console.log('保存图形状态');
}

/**
 * 处理实体点击
 * @param entity - 实体数据
 */
function handleEntityClick(entity: any) {
  if (graphEntityIds.value.has(entity.id)) {
    locateEntity(entity.id);
  } else {
    addEntityToGraph(entity);
  }
}

/**
 * 添加实体到图中
 * @param entity - 实体数据
 */
function addEntityToGraph(entity: any) {
  if (!graph) return;
  
  const node = graph.addNode({
    id: entity.id,
    shape: 'entity-node',
    x: Math.random() * 400 + 100,
    y: Math.random() * 300 + 100,
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
  if (showConnectionPoints.value) {
    const ports = node.getPorts();
    ports.forEach(port => {
      node.setPortProp(port.id!, 'attrs/circle/style/visibility', 'visible');
    });
  }
}

/**
 * 从图中移除实体
 * @param entityId - 实体ID
 */
function removeEntityFromGraph(entityId: string) {
  if (!graph) return;
  const node = graph.getCellById(entityId);
  if (node) {
    graph.removeCell(node);
  }
}

/**
 * 定位实体
 * @param entityId - 实体ID
 */
function locateEntity(entityId: string) {
  if (!graph) return;
  const node = graph.getCellById(entityId);
  if (node) {
    graph.centerCell(node);
    graph.select(node);
  }
}

/**
 * 处理实体搜索
 * @param keyword - 搜索关键词
 */
function handleEntitySearch(keyword: string) {
  // 搜索逻辑已在EntityListPanel中实现
  console.log('搜索关键词:', keyword);
}

/**
 * 处理节点选中
 * @param node - 选中的节点
 */
function handleNodeSelected(node: any) {
  selectedCell.value = node;
  const data = node.getData();
  Object.assign(selectedNodeData, data);
  
  const position = node.getPosition();
  const size = node.getSize();
  selectedVisualData.x = position.x;
  selectedVisualData.y = position.y;
  selectedVisualData.width = size.width;
  selectedVisualData.height = size.height;
  
  // 加载实体字段
  loadEntityFields(data.id);
}

/**
 * 处理边选中
 * @param edge - 选中的边
 */
function handleEdgeSelected(edge: any) {
  selectedCell.value = edge;
  const data = edge.getData();
  Object.assign(selectedEdgeData, data);
}

/**
 * 清除选择
 */
function clearSelection() {
  selectedCell.value = null;
  if (graph && typeof graph.cleanSelection === 'function') {
    graph.cleanSelection();
  }
}

/**
 * 处理节点点击（连线模式）
 * @param node - 被点击的节点
 */
function handleNodeClicked(node: any) {
  if (!isConnectMode.value) return;
  
  if (!connectSourceNode.value) {
    connectSourceNode.value = node;
  } else if (connectSourceNode.value.id !== node.id) {
    // 创建关系
    handleCreateRelationship(connectSourceNode.value, node);
  }
}

/**
 * 取消连线
 */
function cancelConnect() {
  isConnectMode.value = false;
  connectSourceNode.value = null;
}

/**
 * 处理创建关系
 * @param sourceNode - 源节点
 * @param targetNode - 目标节点
 */
function handleCreateRelationship(sourceNode: any, targetNode: any) {
  pendingSourceNode.value = sourceNode;
  pendingTargetNode.value = targetNode;
  sourceEntityName.value = sourceNode.getData().name;
  targetEntityName.value = targetNode.getData().name;
  
  // 重置表单
  newRelationshipForm.name = `${sourceEntityName.value}_${targetEntityName.value}`;
  newRelationshipForm.type = 'ONE_TO_MANY';
  newRelationshipForm.description = '';
  
  createRelationshipModalVisible.value = true;
}

/**
 * 确认创建关系
 */
async function confirmCreateRelationship() {
  if (!pendingSourceNode.value || !pendingTargetNode.value) return;
  
  createRelationshipLoading.value = true;
  try {
    const relationshipData = {
      projectId: props.projectId,
      sourceEntityId: pendingSourceNode.value.getData().id,
      targetEntityId: pendingTargetNode.value.getData().id,
      ...newRelationshipForm
    };
    
    await fetchAddRelationship(relationshipData);
    
    // 添加边到图中
    if (graph) {
      graph.addEdge({
        source: pendingSourceNode.value.id,
        target: pendingTargetNode.value.id,
        data: relationshipData,
        attrs: {
          line: {
            stroke: '#5F95FF',
            strokeWidth: 2,
            targetMarker: {
              name: 'classic',
              size: 8,
            },
          },
        },
      });
    }
    
    message.success('关系创建成功');
    emit('relationship-updated');
    cancelCreateRelationship();
  } catch (error) {
    console.error('创建关系失败:', error);
    message.error('创建关系失败');
  } finally {
    createRelationshipLoading.value = false;
  }
}

/**
 * 取消创建关系
 */
function cancelCreateRelationship() {
  createRelationshipModalVisible.value = false;
  pendingSourceNode.value = null;
  pendingTargetNode.value = null;
  isConnectMode.value = false;
  connectSourceNode.value = null;
}

/**
 * 加载实体字段
 * @param entityId - 实体ID
 */
async function loadEntityFields(entityId: string) {
  fieldsLoading.value = true;
  try {
    const response = await fetchGetAllFields({ projectId: props.projectId });
    entityFields.value = response.data || [];
  } catch (error) {
    console.error('加载字段失败:', error);
  } finally {
    fieldsLoading.value = false;
  }
}

/**
 * 处理更新实体
 * @param data - 实体数据
 */
async function handleUpdateEntity(data: any) {
  try {
    await fetchUpdateEntity(data.id, data);
    message.success('实体更新成功');
  } catch (error) {
    console.error('更新实体失败:', error);
    message.error('更新实体失败');
  }
}

/**
 * 处理更新关系
 * @param data - 关系数据
 */
async function handleUpdateRelationship(data: any) {
  try {
    await fetchUpdateRelationship(data.id, data);
    message.success('关系更新成功');
    emit('relationship-updated');
  } catch (error) {
    console.error('更新关系失败:', error);
    message.error('更新关系失败');
  }
}

/**
 * 处理更新视觉样式
 * @param data - 视觉数据
 */
function handleUpdateVisual(data: any) {
  Object.assign(selectedVisualData, data);
  // TODO: 应用视觉样式到图形元素
}

/**
 * 处理更新实体位置
 * @param position - 位置数据
 */
function handleUpdateEntityPosition(position: { x: number; y: number }) {
  if (selectedCell.value && selectedCell.value.isNode()) {
    selectedCell.value.setPosition(position);
  }
}

/**
 * 处理更新实体尺寸
 * @param size - 尺寸数据
 */
function handleUpdateEntitySize(size: { width: number; height: number }) {
  if (selectedCell.value && selectedCell.value.isNode()) {
    selectedCell.value.setSize(size);
  }
}

/**
 * 导航到实体字段管理
 */
function navigateToEntityFields() {
  if (selectedCell.value && selectedCell.value.isNode()) {
    const entityData = selectedCell.value.getData();
    router.push({
      name: 'lowcode-entity-field',
      params: {
        projectId: props.projectId,
        entityId: entityData.id
      }
    });
  }
}

// 生命周期
onMounted(() => {
  // 组件挂载后的初始化逻辑
});
</script>

<style scoped>
.relationship-designer {
  @apply h-full flex flex-col bg-gray-50;
}

.relationship-designer.loading {
  @apply relative;
}

.loading-mask {
  @apply absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-50;
}

.designer-content {
  @apply flex-1 flex overflow-hidden;
}
</style>