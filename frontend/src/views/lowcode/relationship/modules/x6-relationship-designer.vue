<template>
  <div class="x6-relationship-designer" :class="{ 'connect-mode': isConnectMode, 'with-property-panel': !!selectedCell, 'loading': loading }">
    <!-- 加载遮罩 -->
    <div v-if="loading" class="loading-mask">
      <n-spin size="large" />
    </div>
    <!-- 工具栏 -->
    <div class="toolbar">
      <n-space>
        <n-tooltip placement="bottom">
          <template #trigger>
            <n-button 
              quaternary 
              circle 
              :type="isConnectMode ? 'primary' : 'default'" 
              @click="toggleConnectMode"
            >
              <template #icon>
                <icon-mdi-connection class="text-16px" />
              </template>
            </n-button>
          </template>
          <span>{{ $t('page.lowcode.relationship.toolbar.connectMode') }}</span>
        </n-tooltip>

        <n-tooltip placement="bottom">
          <template #trigger>
            <n-button 
              quaternary 
              circle 
              :loading="layoutLoading"
              @click="autoLayout"
            >
              <template #icon>
                <icon-mdi-auto-fix class="text-16px" />
              </template>
            </n-button>
          </template>
          <span>{{ $t('page.lowcode.relationship.toolbar.autoLayout') }}</span>
        </n-tooltip>

        <n-tooltip placement="bottom">
          <template #trigger>
            <n-button 
              quaternary 
              circle 
              @click="toggleMinimap"
            >
              <template #icon>
                <icon-mdi-map class="text-16px" />
              </template>
            </n-button>
          </template>
          <span>{{ $t('page.lowcode.relationship.toolbar.minimap') || '小地图' }}</span>
        </n-tooltip>

        <n-tooltip placement="bottom">
          <template #trigger>
            <n-button 
              quaternary 
              circle 
              :type="showConnectionPoints ? 'primary' : 'default'"
              @click="toggleConnectionPoints"
            >
              <template #icon>
                <icon-mdi-circle-outline class="text-16px" />
              </template>
            </n-button>
          </template>
          <span>显示连接点</span>
        </n-tooltip>

        <n-divider vertical />

        <n-tooltip placement="bottom">
          <template #trigger>
            <n-button 
              quaternary 
              circle 
              @click="zoomIn"
            >
              <template #icon>
                <icon-mdi-magnify-plus-outline class="text-16px" />
              </template>
            </n-button>
          </template>
          <span>{{ $t('page.lowcode.relationship.toolbar.zoomIn') }}</span>
        </n-tooltip>

        <n-tooltip placement="bottom">
          <template #trigger>
            <n-button 
              quaternary 
              circle 
              @click="zoomOut"
            >
              <template #icon>
                <icon-mdi-magnify-minus-outline class="text-16px" />
              </template>
            </n-button>
          </template>
          <span>{{ $t('page.lowcode.relationship.toolbar.zoomOut') }}</span>
        </n-tooltip>

        <n-tooltip placement="bottom">
          <template #trigger>
            <n-button 
              quaternary 
              circle 
              @click="fitView"
            >
              <template #icon>
                <icon-mdi-fit-to-page-outline class="text-16px" />
              </template>
            </n-button>
          </template>
          <span>{{ $t('page.lowcode.relationship.toolbar.fitCanvas') }}</span>
        </n-tooltip>

        <n-divider vertical />

        <n-tooltip placement="bottom">
          <template #trigger>
            <n-button 
              quaternary 
              circle 
              @click="toggleGridVisible"
            >
              <template #icon>
                <icon-mdi-grid class="text-16px" />
              </template>
            </n-button>
          </template>
          <span>{{ $t('page.lowcode.relationship.toolbar.toggleGrid') || '显示/隐藏网格' }}</span>
        </n-tooltip>

        <n-tooltip placement="bottom">
          <template #trigger>
            <n-button 
              quaternary 
              circle 
              @click="toggleSnapToGrid"
            >
              <template #icon>
                <icon-mdi-magnet class="text-16px" />
              </template>
            </n-button>
          </template>
          <span>{{ $t('page.lowcode.relationship.toolbar.snapToGrid') || '对齐网格' }}</span>
        </n-tooltip>

        <n-divider vertical />

        <n-dropdown 
          trigger="click" 
          :options="exportOptions" 
          @select="handleExport"
        >
          <n-tooltip placement="bottom">
            <template #trigger>
              <n-button quaternary circle>
                <template #icon>
                  <icon-mdi-export class="text-16px" />
                </template>
              </n-button>
            </template>
            <span>{{ $t('page.lowcode.relationship.toolbar.export') }}</span>
          </n-tooltip>
        </n-dropdown>

        <n-tooltip placement="bottom">
          <template #trigger>
            <n-button 
              quaternary 
              circle 
              @click="saveGraphState"
            >
              <template #icon>
                <icon-mdi-content-save class="text-16px" />
              </template>
            </n-button>
          </template>
          <span>{{ $t('page.lowcode.relationship.toolbar.saveState') || '保存状态' }}</span>
        </n-tooltip>
      </n-space>

      <div class="zoom-display">
        {{ Math.round(zoomLevel * 100) }}%
      </div>
    </div>

    <!-- 连线提示 -->
    <div v-if="isConnectMode" class="connect-hint">
      <n-alert type="info" :show-icon="false">
        <span v-if="!connectSourceNode">{{ $t('page.lowcode.relationship.selectSourceEntity') }}</span>
        <span v-else>{{ $t('page.lowcode.relationship.selectTargetEntity', { name: connectSourceNode.getData().name }) }}</span>
        <template #action>
          <n-button size="tiny" @click="cancelConnect">{{ $t('page.lowcode.relationship.cancelConnect') }}</n-button>
        </template>
      </n-alert>
    </div>

    <!-- X6画布容器 -->
    <div ref="containerRef" class="graph-container" :class="{ 'connect-mode': isConnectMode }"></div>

    <!-- 实体列表 -->
    <div class="entity-list">
      <div class="entity-list-header">
        <h3>{{ $t('page.lowcode.relationship.entityList') }}</h3>
        <n-input 
          v-model:value="entitySearchKeyword" 
          :placeholder="$t('page.lowcode.common.search.placeholder')" 
          size="small"
          clearable
        >
          <template #prefix>
            <icon-mdi-magnify class="text-14px" />
          </template>
        </n-input>
      </div>
      <div class="entity-list-content">
        <n-spin :show="entitiesLoading">
          <n-empty v-if="filteredEntities.length === 0" :description="$t('page.lowcode.common.messages.noData')" />
          <div v-else class="entity-items">
            <div 
              v-for="entity in filteredEntities" 
              :key="entity.id" 
              class="entity-item"
              :class="{ 'is-in-graph': isEntityInGraph(entity.id) }"
              @click="handleEntityClick(entity)"
            >
              <div class="entity-item-content">
                <div class="entity-name">{{ entity.name }}</div>
                <div class="entity-code">{{ entity.code }}</div>
              </div>
              <div class="entity-actions">
                <n-button 
                  v-if="isEntityInGraph(entity.id)" 
                  quaternary 
                  circle 
                  size="small"
                  @click.stop="locateEntity(entity.id)"
                >
                  <template #icon>
                    <icon-mdi-crosshairs-gps class="text-14px" />
                  </template>
                </n-button>
                <n-button 
                  v-if="isEntityInGraph(entity.id)" 
                  quaternary 
                  circle 
                  size="small"
                  @click.stop="removeEntityFromGraph(entity.id)"
                >
                  <template #icon>
                    <icon-mdi-close class="text-14px" />
                  </template>
                </n-button>
                <n-button 
                  v-else
                  quaternary 
                  circle 
                  size="small"
                  @click.stop="addEntityToGraph(entity)"
                >
                  <template #icon>
                    <icon-mdi-plus class="text-14px" />
                  </template>
                </n-button>
              </div>
            </div>
          </div>
        </n-spin>
      </div>
    </div>

    <!-- 属性面板 -->
    <div v-if="selectedCell" class="property-panel">
      <div class="property-panel-header">
        <h3>{{ $t('page.lowcode.relationship.propertyPanel.title') }}</h3>
        <n-button quaternary circle size="small" @click="clearSelection">
          <template #icon>
            <icon-mdi-close class="text-16px" />
          </template>
        </n-button>
      </div>

      <div class="property-panel-content">
        <!-- 实体属性 -->
        <template v-if="selectedNode">
          <n-tabs type="line" animated>
            <n-tab-pane name="basic" :tab="$t('page.lowcode.relationship.propertyPanel.basicInfo')">
              <n-form label-placement="left" label-width="80px" size="small">
                <n-form-item :label="$t('page.lowcode.entity.name')">
                  <n-input v-model:value="selectedNodeData.name" @blur="handleUpdateEntity" />
                </n-form-item>
                <n-form-item :label="$t('page.lowcode.entity.code')">
                  <n-input v-model:value="selectedNodeData.code" disabled />
                </n-form-item>
                <n-form-item :label="$t('page.lowcode.entity.tableName')">
                  <n-input v-model:value="selectedNodeData.tableName" @blur="handleUpdateEntity" />
                </n-form-item>
                <n-form-item :label="$t('page.lowcode.entity.description')">
                  <n-input v-model:value="selectedNodeData.description" type="textarea" rows="3" @blur="handleUpdateEntity" />
                </n-form-item>
              </n-form>
            </n-tab-pane>
            
            <n-tab-pane name="visual" :tab="$t('page.lowcode.relationship.propertyPanel.visualStyle')">
              <n-form label-placement="left" label-width="80px" size="small">
                <n-form-item :label="$t('page.lowcode.relationship.propertyPanel.color')">
                  <n-color-picker v-model:value="selectedNodeVisual.color" @update:value="handleUpdateEntityVisual" />
                </n-form-item>
                <n-form-item :label="$t('page.lowcode.relationship.propertyPanel.position')">
                  <div class="flex space-x-2">
                    <n-input-number v-model:value="selectedNodeVisual.x" size="small" @update:value="handleUpdateEntityPosition" />
                    <n-input-number v-model:value="selectedNodeVisual.y" size="small" @update:value="handleUpdateEntityPosition" />
                  </div>
                </n-form-item>
                <n-form-item :label="$t('page.lowcode.relationship.propertyPanel.size')">
                  <div class="flex space-x-2">
                    <n-input-number v-model:value="selectedNodeVisual.width" size="small" @update:value="handleUpdateEntitySize" />
                    <n-input-number v-model:value="selectedNodeVisual.height" size="small" @update:value="handleUpdateEntitySize" />
                  </div>
                </n-form-item>
              </n-form>
            </n-tab-pane>
            
            <n-tab-pane name="fields" :tab="$t('page.lowcode.relationship.propertyPanel.fieldManagement')">
              <div class="mb-2 flex justify-between items-center">
                <span class="text-sm font-medium">{{ $t('page.lowcode.relationship.propertyPanel.fields') }}</span>
                <n-button size="small" @click="navigateToEntityFields">
                  {{ $t('page.lowcode.entity.designFields') }}
                </n-button>
              </div>
              
              <n-spin :show="fieldsLoading">
                <n-empty v-if="entityFields.length === 0" :description="$t('page.lowcode.common.messages.noData')" />
                <n-list v-else size="small">
                  <n-list-item v-for="field in entityFields" :key="field.id">
                    <div class="flex justify-between items-center">
                      <div>
                        <div class="text-sm font-medium">{{ field.name }}</div>
                        <div class="text-xs text-gray-500">{{ field.code }} ({{ getFieldTypeName(field.dataType) }})</div>
                      </div>
                      <div class="flex space-x-1">
                        <n-tag v-if="field.isPrimaryKey" size="small" type="success">PK</n-tag>
                        <n-tag v-if="field.isRequired" size="small" type="warning">{{ $t('page.lowcode.field.required') }}</n-tag>
                        <n-tag v-if="field.isUnique" size="small" type="info">{{ $t('page.lowcode.field.unique') }}</n-tag>
                      </div>
                    </div>
                  </n-list-item>
                </n-list>
              </n-spin>
            </n-tab-pane>
          </n-tabs>
        </template>

        <!-- 关系属性 -->
        <template v-else-if="selectedEdge">
          <n-tabs type="line" animated>
            <n-tab-pane name="basic" :tab="$t('page.lowcode.relationship.propertyPanel.basicInfo')">
              <n-form label-placement="left" label-width="80px" size="small">
                <n-form-item :label="$t('page.lowcode.relationship.name')">
                  <n-input v-model:value="selectedEdgeData.name" @blur="handleUpdateRelationship" />
                </n-form-item>
                <n-form-item :label="$t('page.lowcode.relationship.code')">
                  <n-input v-model:value="selectedEdgeData.code" disabled />
                </n-form-item>
                <n-form-item :label="$t('page.lowcode.relationship.relationType')">
                  <n-select 
                    v-model:value="selectedEdgeData.type" 
                    :options="relationshipTypeOptions" 
                    @update:value="handleUpdateRelationship" 
                  />
                </n-form-item>
                <n-form-item :label="$t('page.lowcode.relationship.description')">
                  <n-input v-model:value="selectedEdgeData.description" type="textarea" rows="3" @blur="handleUpdateRelationship" />
                </n-form-item>
              </n-form>
            </n-tab-pane>
            
            <n-tab-pane name="visual" :tab="$t('page.lowcode.relationship.propertyPanel.visualStyle')">
              <n-form label-placement="left" label-width="80px" size="small">
                <n-form-item :label="$t('page.lowcode.relationship.propertyPanel.lineStyle')">
                  <n-select 
                    v-model:value="selectedEdgeVisual.lineStyle" 
                    :options="lineStyleOptions" 
                    @update:value="handleUpdateEdgeVisual" 
                  />
                </n-form-item>
                <n-form-item :label="$t('page.lowcode.relationship.propertyPanel.lineColor')">
                  <n-color-picker v-model:value="selectedEdgeVisual.lineColor" @update:value="handleUpdateEdgeVisual" />
                </n-form-item>
                <n-form-item :label="$t('page.lowcode.relationship.onDelete')">
                  <n-select 
                    v-model:value="selectedEdgeData.onDelete" 
                    :options="cascadeActionOptions" 
                    @update:value="handleUpdateRelationship" 
                  />
                </n-form-item>
                <n-form-item :label="$t('page.lowcode.relationship.onUpdate')">
                  <n-select 
                    v-model:value="selectedEdgeData.onUpdate" 
                    :options="cascadeActionOptions" 
                    @update:value="handleUpdateRelationship" 
                  />
                </n-form-item>
              </n-form>
            </n-tab-pane>
            
            <n-tab-pane name="advanced" :tab="$t('page.lowcode.project.advancedConfig')">
              <n-form label-placement="left" label-width="80px" size="small">
                <n-form-item :label="$t('page.lowcode.relationship.foreignKeyField')">
                  <n-input v-model:value="selectedEdgeData.foreignKeyField" @blur="handleUpdateRelationship" />
                </n-form-item>
                <n-form-item :label="$t('page.lowcode.relationship.cascadeDelete')">
                  <n-switch v-model:value="selectedEdgeData.cascadeDelete" @update:value="handleUpdateRelationship" />
                </n-form-item>
                <n-form-item :label="$t('page.lowcode.relationship.cascadeUpdate')">
                  <n-switch v-model:value="selectedEdgeData.cascadeUpdate" @update:value="handleUpdateRelationship" />
                </n-form-item>
                <n-form-item :label="$t('page.lowcode.relationship.required')">
                  <n-switch v-model:value="selectedEdgeData.required" @update:value="handleUpdateRelationship" />
                </n-form-item>
              </n-form>
            </n-tab-pane>
          </n-tabs>
        </template>
      </div>
    </div>

    <!-- 创建关系对话框 -->
    <n-modal v-model:show="createRelationshipModalVisible" preset="dialog" :title="$t('page.lowcode.relationship.createRelationshipDialog')">
      <div class="mb-4">
        <span class="text-sm text-gray-600">
          {{ $t('page.lowcode.relationship.sourceEntity') }}: {{ sourceEntityName }} → {{ $t('page.lowcode.relationship.targetEntity') }}: {{ targetEntityName }}
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
          <n-button @click="cancelCreateRelationship">{{ $t('page.lowcode.common.actions.cancel') }}</n-button>
          <n-button type="primary" @click="confirmCreateRelationship" :loading="createRelationshipLoading">
            {{ $t('page.lowcode.common.actions.confirm') }}
          </n-button>
        </n-space>
      </template>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick, reactive, computed } from 'vue';
import { Graph, Shape, Node, Edge, Cell } from '@antv/x6';
import { useI18n } from 'vue-i18n';
// 使用动态导入替代静态导入，解决模块导出问题
import { 
  NButton, NSpace, NForm, NFormItem, NInput, NSelect, NInputNumber,
  NAlert, NTooltip, NDivider, NDropdown, NModal, NTabs, NTabPane,
  NColorPicker, NSwitch, NList, NListItem, NTag, NSpin, NEmpty, useMessage
} from 'naive-ui';
import { debounce } from 'lodash-es';
import { fetchGetAllEntities, fetchUpdateEntity } from '@/service/api/lowcode-entity';
import { fetchGetAllFields } from '@/service/api/lowcode-field';
import { fetchGetAllRelationships, fetchUpdateRelationship, fetchAddRelationship } from '@/service/api/lowcode-relationship';
import { X6ConnectionManager } from './X6ConnectionManager';

interface Props {
  projectId: string;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  relationshipUpdated: [];
  error: [message: string];
}>();

const message = useMessage();
const { t } = useI18n();
const containerRef = ref<HTMLDivElement>();
let graph: Graph | null = null;
let connectionManager: X6ConnectionManager | null = null;

// 状态管理
const loading = ref(false);
const layoutLoading = ref(false);
const entitiesLoading = ref(false);
const zoomLevel = ref(1);
const createRelationshipLoading = ref(false);
const entitySearchKeyword = ref('');
const isMinimapVisible = ref(false);
const isGridVisible = ref(true);
const isSnapToGridEnabled = ref(false);
const showConnectionPoints = ref(false);

// 选中状态
const selectedCell = ref<Cell | null>(null);
const selectedNode = ref<Node | null>(null);
const selectedEdge = ref<Edge | null>(null);
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
const selectedNodeVisual = reactive({
  color: '#1976d2',
  x: 0,
  y: 0,
  width: 200,
  height: 120
});
const selectedEdgeVisual = reactive({
  lineStyle: 'solid',
  lineColor: '#5F95FF'
});

// 实体字段
const entityFields = ref<any[]>([]);
const fieldsLoading = ref(false);

// 数据
const entities = ref<any[]>([]);
const relationships = ref<any[]>([]);
const fields = ref<any[]>([]);

// 过滤后的实体列表
const filteredEntities = computed(() => {
  if (!entitySearchKeyword.value) {
    return entities.value;
  }
  const keyword = entitySearchKeyword.value.toLowerCase();
  return entities.value.filter(entity => 
    entity.name.toLowerCase().includes(keyword) || 
    entity.code.toLowerCase().includes(keyword) || 
    (entity.tableName && entity.tableName.toLowerCase().includes(keyword))
  );
});

// 图中的实体ID集合
const graphEntityIds = computed(() => {
  if (!graph) return new Set<string>();
  return new Set(graph.getNodes().map(node => node.id as string));
});

// 连线模式状态
const isConnectMode = ref(false);
const connectSourceNode = ref<Node | null>(null);
const connectTargetNode = ref<Node | null>(null);

// 创建关系对话框
const createRelationshipModalVisible = ref(false);
const newRelationshipForm = reactive({
  name: '',
  type: 'ONE_TO_MANY',
  description: ''
});
const sourceEntityName = ref('');
const targetEntityName = ref('');

// 下拉选项
const relationshipTypeOptions = computed(() => [
  { label: t('page.lowcode.relationship.relationTypes.oneToOne'), value: 'ONE_TO_ONE' },
  { label: t('page.lowcode.relationship.relationTypes.oneToMany'), value: 'ONE_TO_MANY' },
  { label: t('page.lowcode.relationship.relationTypes.manyToOne'), value: 'MANY_TO_ONE' },
  { label: t('page.lowcode.relationship.relationTypes.manyToMany'), value: 'MANY_TO_MANY' }
]);

const exportOptions = computed(() => [
  { label: t('page.lowcode.relationship.exportOptions.png'), key: 'png' },
  { label: t('page.lowcode.relationship.exportOptions.jpg'), key: 'jpg' },
  { label: t('page.lowcode.relationship.exportOptions.svg'), key: 'svg' },
  { label: t('page.lowcode.relationship.exportOptions.json'), key: 'json' }
]);

const lineStyleOptions = computed(() => [
  { label: t('page.lowcode.relationship.lineStyles.solid'), value: 'solid' },
  { label: t('page.lowcode.relationship.lineStyles.dashed'), value: 'dashed' },
  { label: t('page.lowcode.relationship.lineStyles.dotted'), value: 'dotted' }
]);

const cascadeActionOptions = computed(() => [
  { label: t('page.lowcode.relationship.cascadeActions.restrict'), value: 'RESTRICT' },
  { label: t('page.lowcode.relationship.cascadeActions.cascade'), value: 'CASCADE' },
  { label: t('page.lowcode.relationship.cascadeActions.setNull'), value: 'SET_NULL' },
  { label: t('page.lowcode.relationship.cascadeActions.noAction'), value: 'NO_ACTION' }
]);

// 初始化X6图
async function initGraph() {
  if (!containerRef.value) {
    console.warn('容器引用不存在，无法初始化图形');
    return;
  }

  // 注册自定义节点
  registerCustomNodes();

  try {
    // 增强的容器尺寸检测
    const rect = containerRef.value.getBoundingClientRect();
    const containerWidth = Math.max(rect.width, containerRef.value.clientWidth, 800);
    const containerHeight = Math.max(rect.height, containerRef.value.clientHeight, 600);
    
    // 验证容器尺寸的有效��
    if (containerWidth < 100 || containerHeight < 100) {
      console.warn('容器尺寸异常，延迟初始化:', { width: containerWidth, height: containerHeight });
      // 延迟重试
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
        visible: isGridVisible.value,
        type: 'dot',
        size: 10,
        args: {
          color: '#cccccc',
          thickness: 1,
        },
      },
      connecting: {
        router: {
          name: 'orth',
        },
        connector: {
          name: 'rounded',
          args: {
            radius: 8,
          },
        },
        anchor: 'center',
        connectionPoint: 'boundary',
        allowBlank: false,
        snap: {
          radius: 20,
        },
        createEdge() {
          return new Shape.Edge({
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
            router: {
              name: 'orth',
            },
            connector: {
              name: 'rounded',
              args: {
                radius: 8,
              },
            },
          });
        },
        validateConnection({ sourceCell, targetCell }) {
          // 不允许连接到自己
          if (sourceCell === targetCell) {
            return false;
          }
          return true;
        },
      },
      mousewheel: {
        enabled: true,
        modifiers: ['ctrl', 'meta'],
        minScale: 0.5,
        maxScale: 3,
      },
      interacting: {
        nodeMovable: true,
        edgeMovable: true,
        edgeLabelMovable: true,
        arrowheadMovable: true,
        vertexMovable: true,
        vertexAddable: true,
        vertexDeletable: true,
      },
      snapline: {
        enabled: true,
        sharp: true,
      },
      history: {
        enabled: true,
        beforeAddCommand(event, args) {
          if (args.key === 'tools') return false;
          return true;
        },
      },
      clipboard: {
        enabled: true,
      },
      keyboard: {
        enabled: true,
        global: false,
      },
      selecting: {
        enabled: true,
        rubberband: true,
        showNodeSelectionBox: true,
        showEdgeSelectionBox: true,
      },
      scroller: {
        enabled: true,
        pannable: true,
        autoResize: true,
      },
      translating: {
        restrict: isSnapToGridEnabled.value ? {
          grid: true,
          gridSize: 10,
        } : false,
      },
    });

    // 注册插件
    await registerPlugins();
    
    // 事件监听
    setupEventListeners();
    
    // 创建连接管理器
    connectionManager = new X6ConnectionManager(graph);
    
    // 加载保存的状态
    loadGraphState();
    
    console.log('X6图形初始化成功');
  } catch (error) {
    console.error('X6图形初始化失败:', error);
    message.error('图形初始化失败: ' + (error instanceof Error ? error.message : String(error)));
  }
}

// 注册插件
async function registerPlugins() {
  if (!graph) return;
  
  try {
    // 动态导入插件，使用try-catch单独处理每个插件的导入
    let Minimap, Snapline, Transform, Selection, Keyboard, History;
    
    try {
      const minimapModule = await import('@antv/x6-plugin-minimap');
      Minimap = minimapModule.Minimap;
    } catch (error) {
      console.error('小地图插件加载失败:', error);
      message.warning('小地图功能不可用');
    }
    
    try {
      const snaplineModule = await import('@antv/x6-plugin-snapline');
      Snapline = snaplineModule.Snapline;
    } catch (error) {
      console.error('对齐线插件加载失败:', error);
    }
    
    try {
      const transformModule = await import('@antv/x6-plugin-transform');
      Transform = transformModule.Transform;
    } catch (error) {
      console.error('变换插件加载失败:', error);
    }
    
    try {
      const selectionModule = await import('@antv/x6-plugin-selection');
      Selection = selectionModule.Selection;
    } catch (error) {
      console.error('选择插件加载失败:', error);
    }
    
    try {
      const keyboardModule = await import('@antv/x6-plugin-keyboard');
      Keyboard = keyboardModule.Keyboard;
    } catch (error) {
      console.error('键盘插件加载失败:', error);
    }
    
    try {
      const historyModule = await import('@antv/x6-plugin-history');
      History = historyModule.History;
    } catch (error) {
      console.error('历史记录插件加载失败:', error);
    }
    
    // 小地图插件
    if (Minimap) {
      try {
        graph.use(
          new Minimap({
            container: document.createElement('div'),
            width: 200,
            height: 150,
            padding: 10,
            graphOptions: {
              async: true,
              getCellView(cell) {
                if (cell.isNode()) {
                  return graph?.findViewByCell(cell);
                }
              },
            },
            createContainer() {
              const div = document.createElement('div');
              div.className = 'x6-minimap-container';
              div.style.position = 'absolute';
              div.style.bottom = '20px';
              div.style.right = '20px';
              div.style.background = '#fff';
              div.style.boxShadow = '0 0 10px rgba(0, 0, 0, 0.2)';
              div.style.border = '1px solid #ccc';
              div.style.borderRadius = '4px';
              div.style.overflow = 'hidden';
              div.style.zIndex = '999';
              div.style.display = isMinimapVisible.value ? 'block' : 'none';
              containerRef.value?.appendChild(div);
              return div;
            },
          })
        );
      } catch (error) {
        console.error('小地图插件注册失败:', error);
      }
    }
    
    // 对齐线插件
    if (Snapline) {
      try {
        graph.use(new Snapline());
      } catch (error) {
        console.error('对齐线插件注册失败:', error);
      }
    }
    
    // 变换插件
    if (Transform) {
      try {
        graph.use(new Transform({
          resizing: {
            enabled: true,
            minWidth: 100,
            minHeight: 50,
            orthogonal: false,
          },
          rotating: {
            enabled: false,
          },
        }));
      } catch (error) {
        console.error('变换插件注册失败:', error);
      }
    }
    
    // 选择插件
    if (Selection) {
      try {
        graph.use(new Selection({
          multiple: true,
          rubberband: true,
          showNodeSelectionBox: true,
          showEdgeSelectionBox: true,
        }));
      } catch (error) {
        console.error('选择插件注册失败:', error);
      }
    }
    
    // 键盘插件
    if (Keyboard) {
      try {
        graph.use(new Keyboard({
          global: false,
          enabled: true,
        }));
      } catch (error) {
        console.error('键盘插件注册失败:', error);
      }
    }
    
    // 历史记录插件
    if (History) {
      try {
        graph.use(new History({
          enabled: true,
        }));
      } catch (error) {
        console.error('历史记录插件注册失败:', error);
      }
    }
    
    console.log('X6插件注册成功');
  } catch (error) {
    console.error('X6插件注册失败:', error);
    message.error('图形插件加载失败: ' + (error instanceof Error ? error.message : String(error)));
  }
  
  // 注册键盘快捷键
  try {
    if (Keyboard) {
      graph.bindKey(['meta+c', 'ctrl+c'], () => {
        const cells = graph?.getSelectedCells();
        if (cells?.length) {
          graph?.copy(cells);
        }
        return false;
      });
      
      graph.bindKey(['meta+v', 'ctrl+v'], () => {
        if (!graph?.isClipboardEmpty()) {
          const cells = graph?.paste({ offset: 32 });
          graph?.cleanSelection();
          graph?.select(cells);
        }
        return false;
      });
      
      graph.bindKey(['meta+z', 'ctrl+z'], () => {
        if (graph?.canUndo()) {
          graph?.undo();
        }
        return false;
      });
      
      graph.bindKey(['meta+shift+z', 'ctrl+shift+z', 'meta+y', 'ctrl+y'], () => {
        if (graph?.canRedo()) {
          graph?.redo();
        }
        return false;
      });
      
      graph.bindKey('delete', () => {
        const cells = graph?.getSelectedCells();
        if (cells?.length) {
          graph?.removeCells(cells);
        }
        return false;
      });
    }
  } catch (error) {
    console.error('键盘快捷键绑定失败:', error);
  }
}

// 注册自定义节点
function registerCustomNodes() {
  try {
    // 使用try-catch来处理可能的重复注册
    try {
      // 实体节点 - 增强版本，使用X6原生连接桩
      Graph.registerNode('entity-node', {
        inherit: 'rect',
        width: 220,
        height: 140,
        // 配置连接桩（ports）- 使用X6原生连接点功能
        ports: {
          groups: {
            // 顶部连接桩组
            top: {
              position: 'top',
              attrs: {
                circle: {
                  r: 4,
                  magnet: true,
                  stroke: '#1976d2',
                  strokeWidth: 2,
                  fill: '#ffffff',
                  style: {
                    visibility: 'hidden',
                  },
                },
              },
            },
            // 右侧连接桩组
            right: {
              position: 'right',
              attrs: {
                circle: {
                  r: 4,
                  magnet: true,
                  stroke: '#1976d2',
                  strokeWidth: 2,
                  fill: '#ffffff',
                  style: {
                    visibility: 'hidden',
                  },
                },
              },
            },
            // 底部连接桩组
            bottom: {
              position: 'bottom',
              attrs: {
                circle: {
                  r: 4,
                  magnet: true,
                  stroke: '#1976d2',
                  strokeWidth: 2,
                  fill: '#ffffff',
                  style: {
                    visibility: 'hidden',
                  },
                },
              },
            },
            // 左侧连接桩组
            left: {
              position: 'left',
              attrs: {
                circle: {
                  r: 4,
                  magnet: true,
                  stroke: '#1976d2',
                  strokeWidth: 2,
                  fill: '#ffffff',
                  style: {
                    visibility: 'hidden',
                  },
                },
              },
            },
          },
          items: [
            // 顶部连接点
            { id: 'top-1', group: 'top', args: { x: '25%' } },
            { id: 'top-2', group: 'top', args: { x: '50%' } },
            { id: 'top-3', group: 'top', args: { x: '75%' } },
            // 右侧连接点
            { id: 'right-1', group: 'right', args: { y: '25%' } },
            { id: 'right-2', group: 'right', args: { y: '50%' } },
            { id: 'right-3', group: 'right', args: { y: '75%' } },
            // 底部连接点
            { id: 'bottom-1', group: 'bottom', args: { x: '25%' } },
            { id: 'bottom-2', group: 'bottom', args: { x: '50%' } },
            { id: 'bottom-3', group: 'bottom', args: { x: '75%' } },
            // 左侧连接点
            { id: 'left-1', group: 'left', args: { y: '25%' } },
            { id: 'left-2', group: 'left', args: { y: '50%' } },
            { id: 'left-3', group: 'left', args: { y: '75%' } },
          ],
        },
        attrs: {
          body: {
            fill: '#ffffff',
            stroke: '#1976d2',
            strokeWidth: 2,
            rx: 8,
            ry: 8,
            shadowColor: 'rgba(0,0,0,0.15)',
            shadowBlur: 8,
            shadowOffsetX: 2,
            shadowOffsetY: 2,
            cursor: 'move',
          },
          title: {
            text: '',
            refX: 0.5,
            refY: 20,
            textAnchor: 'middle',
            textVerticalAnchor: 'middle',
            fontSize: 16,
            fontWeight: 'bold',
            fill: '#333333',
            cursor: 'pointer',
          },
          subtitle: {
            text: '',
            refX: 0.5,
            refY: 40,
            textAnchor: 'middle',
            textVerticalAnchor: 'middle',
            fontSize: 12,
            fill: '#666666',
          },
          fieldCount: {
            text: '',
            refX: 0.5,
            refY: 60,
            textAnchor: 'middle',
            textVerticalAnchor: 'middle',
            fontSize: 11,
            fill: '#999999',
          },
          statusIcon: {
            text: '●',
            refX: 10,
            refY: 10,
            fontSize: 12,
            fill: '#4caf50',
          },
          code: {
            text: '',
            refX: 0.5,
            refY: 40,
            textAnchor: 'middle',
            textVerticalAnchor: 'middle',
            fontSize: 12,
            fill: '#666666',
          },
          fields: {
            text: '',
            refX: 0.5,
            refY: 60,
            textAnchor: 'middle',
            textVerticalAnchor: 'middle',
            fontSize: 12,
            fill: '#666666',
          },
          table: {
            text: '',
            refX: 0.5,
            refY: 80,
            textAnchor: 'middle',
            textVerticalAnchor: 'middle',
            fontSize: 12,
            fill: '#666666',
          },
        },
      });
    } catch (regError) {
      // 如果错误是因为节点已经注册，则忽略错误
      if (regError instanceof Error && regError.message.includes('already registered')) {
        console.log('实体节点已注册，跳过重复注册');
      } else {
        // 其他错误则抛出
        throw regError;
      }
    }
  } catch (error) {
    console.error('注册自定义节点失败:', error);
    throw new Error('注册自定义节点失败: ' + (error instanceof Error ? error.message : String(error)));
  }
}

// 切换连接点显示
function toggleConnectionPoints() {
  showConnectionPoints.value = !showConnectionPoints.value;
  if (connectionManager) {
    connectionManager.setConnectionPointsVisible(showConnectionPoints.value);
  }
}

// 控制连接桩显示
function togglePortsVisibility(visible: boolean) {
  if (!graph) return;
  
  const nodes = graph.getNodes();
  nodes.forEach(node => {
    const ports = node.getPorts();
    ports.forEach(port => {
      node.setPortProp(port.id!, 'attrs/circle/style/visibility', visible ? 'visible' : 'hidden');
    });
  });
}

// 鼠标悬停显示连接桩
function setupPortsHoverEffect() {
  if (!graph) return;
  
  graph.on('node:mouseenter', ({ node }) => {
    const ports = node.getPorts();
    ports.forEach(port => {
      node.setPortProp(port.id!, 'attrs/circle/style/visibility', 'visible');
    });
  });
  
  graph.on('node:mouseleave', ({ node }) => {
    const ports = node.getPorts();
    ports.forEach(port => {
      node.setPortProp(port.id!, 'attrs/circle/style/visibility', 'hidden');
    });
  });
}

// 设置事件监听器
function setupEventListeners() {
  if (!graph) return;
  
  // 设置连接桩悬停效果
  setupPortsHoverEffect();

  // 节点点击事件
  graph.on('node:click', ({ node }) => {
    if (isConnectMode.value) {
      handleConnectModeNodeClick(node);
    } else {
      selectedCell.value = node;
      selectedNode.value = node;
      selectedEdge.value = null;
      
      // 更新选中节点数据
      const nodeData = node.getData() || {};
      selectedNodeData.name = nodeData.name || '';
      selectedNodeData.code = nodeData.code || '';
      selectedNodeData.tableName = nodeData.tableName || '';
      selectedNodeData.description = nodeData.description || '';
      
      // 更新选中节点视觉属性
      const position = node.getPosition();
      const size = node.getSize();
      selectedNodeVisual.x = position.x;
      selectedNodeVisual.y = position.y;
      selectedNodeVisual.width = size.width;
      selectedNodeVisual.height = size.height;
      
      // 获取节点颜色
      const color = node.attr('body/fill');
      selectedNodeVisual.color = color || '#1976d2';
      
      // 加载实体字段
      loadEntityFields(node.id as string);
    }
  });

  // 边点击事件
  graph.on('edge:click', ({ edge }) => {
    if (!isConnectMode.value) {
      selectedCell.value = edge;
      selectedEdge.value = edge;
      selectedNode.value = null;
      
      // 更新选中边数据
      const edgeData = edge.getData() || {};
      selectedEdgeData.name = edgeData.name || '';
      selectedEdgeData.code = edgeData.code || '';
      selectedEdgeData.type = edgeData.type || 'ONE_TO_MANY';
      selectedEdgeData.description = edgeData.description || '';
      selectedEdgeData.onDelete = edgeData.onDelete || 'RESTRICT';
      selectedEdgeData.onUpdate = edgeData.onUpdate || 'RESTRICT';
      selectedEdgeData.foreignKeyField = edgeData.foreignKeyField || '';
      selectedEdgeData.cascadeDelete = edgeData.cascadeDelete || false;
      selectedEdgeData.cascadeUpdate = edgeData.cascadeUpdate || false;
      selectedEdgeData.required = edgeData.required || false;
      
      // 更新选中边视觉属性
      const lineColor = edge.attr('line/stroke');
      selectedEdgeVisual.lineColor = lineColor || '#5F95FF';
      
      const dashArray = edge.attr('line/strokeDasharray');
      if (dashArray === '5,5') {
        selectedEdgeVisual.lineStyle = 'dashed';
      } else if (dashArray === '2,2') {
        selectedEdgeVisual.lineStyle = 'dotted';
      } else {
        selectedEdgeVisual.lineStyle = 'solid';
      }
    }
  });

  // 画布点击事件
  graph.on('blank:click', () => {
    if (isConnectMode.value) {
      cancelConnect();
    } else {
      clearSelection();
    }
  });

  // 缩放事件
  graph.on('scale', ({ sx }) => {
    zoomLevel.value = sx;
  });
  
  // 节点移动事件
  graph.on('node:moved', ({ node }) => {
    const position = node.getPosition();
    
    // 如果当前选中的是该节点，更新属性面板中的位置值
    if (selectedNode.value && selectedNode.value.id === node.id) {
      selectedNodeVisual.x = position.x;
      selectedNodeVisual.y = position.y;
    }
    
    // 保存位置到实体配置
    const entityId = node.id as string;
    const entity = entities.value.find(e => e.id === entityId);
    
    if (entity) {
      entity.config = entity.config || {};
      entity.config.position = position;
    }
  });
  
  // 节点大小改变事件
  graph.on('node:resized', ({ node }) => {
    const size = node.getSize();
    
    // 如果当前选中的是该节点，更新属性面板中的大小值
    if (selectedNode.value && selectedNode.value.id === node.id) {
      selectedNodeVisual.width = size.width;
      selectedNodeVisual.height = size.height;
    }
    
    // 保存大小到实体配置
    const entityId = node.id as string;
    const entity = entities.value.find(e => e.id === entityId);
    
    if (entity) {
      entity.config = entity.config || {};
      entity.config.size = size;
    }
  });
}

// 加载数据
async function loadData() {
  try {
    loading.value = true;
    entitiesLoading.value = true;
    
    // 分别加载数据，以便更好地处理错误
    let entitiesData = [];
    let fieldsData = [];
    let relationshipsData = [];
    let hasError = false;
    
    try {
      const entitiesRes = await fetchGetAllEntities(props.projectId);
      entitiesData = entitiesRes.data || [];
      console.log('加载实体数据成功:', entitiesData.length);
    } catch (error) {
      hasError = true;
      const errorMessage = '加载实体数据失败: ' + (error instanceof Error ? error.message : String(error));
      console.error(errorMessage, error);
      message.error(errorMessage);
      emit('error', errorMessage);
    }
    
    try {
      const fieldsRes = await fetchGetAllFields({ projectId: props.projectId });
      fieldsData = fieldsRes.data || [];
      console.log('加载字段数据成功:', fieldsData.length);
    } catch (error) {
      hasError = true;
      const errorMessage = '加载字段数据失败: ' + (error instanceof Error ? error.message : String(error));
      console.error(errorMessage, error);
      message.error(errorMessage);
      emit('error', errorMessage);
    }
    
    try {
      const relationshipsRes = await fetchGetAllRelationships(props.projectId);
      relationshipsData = relationshipsRes.data || [];
      console.log('加载关系数据成功:', relationshipsData.length);
    } catch (error) {
      hasError = true;
      const errorMessage = '加载关系数据失败: ' + (error instanceof Error ? error.message : String(error));
      console.error(errorMessage, error);
      message.error(errorMessage);
      emit('error', errorMessage);
    }
    
    entities.value = entitiesData;
    fields.value = fieldsData;
    relationships.value = relationshipsData;
    
    // 只有在有实体数据的情况下才更新图形
    if (entitiesData.length > 0) {
      updateGraphData();
    } else {
      const warningMessage = '没有实体数据可显示';
      console.warn(warningMessage);
      if (hasError) {
        emit('error', warningMessage);
      }
    }
  } catch (error) {
    const errorMessage = '加载数据失败: ' + (error instanceof Error ? error.message : String(error));
    console.error(errorMessage, error);
    message.error(errorMessage);
    emit('error', errorMessage);
  } finally {
    loading.value = false;
    entitiesLoading.value = false;
  }
}

// 更新图数据
function updateGraphData() {
  if (!graph) {
    const errorMessage = '图形实例不存在，无法更新数据';
    console.warn(errorMessage);
    emit('error', errorMessage);
    return;
  }

  try {
    // 清除现有数据
    graph.clearCells();
    
    // 添加实体节点
    let addedNodeCount = 0;
    entities.value.forEach(entity => {
      try {
        if (!entity || !entity.id) {
          console.warn('跳过无效实体:', entity);
          return;
        }
        
        const fieldCount = fields.value.filter(f => f.entityId === entity.id).length;
        
        const node = graph.addNode({
          id: entity.id,
          shape: 'entity-node',
          x: entity.config?.position?.x || Math.random() * 600,
          y: entity.config?.position?.y || Math.random() * 400,
          attrs: {
            title: { text: entity.name || '未命名实体' },
            code: { text: entity.code || '无代码' },
            fields: { text: `字段数量: ${fieldCount}` },
            table: { text: `表名: ${entity.tableName || '无表名'}` },
          },
          ports: {
            groups: {
              'connection-port': {
                position: 'absolute',
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
              { id: 'top', group: 'connection-port', args: { x: '50%', y: 0 } },
              { id: 'right', group: 'connection-port', args: { x: '100%', y: '50%' } },
              { id: 'bottom', group: 'connection-port', args: { x: '50%', y: '100%' } },
              { id: 'left', group: 'connection-port', args: { x: 0, y: '50%' } },
            ],
          },
          data: entity,
        });
        
        addedNodeCount++;
      } catch (error) {
        const errorMessage = `添加实体节点失败: ${entity?.name || '未知实体'} - ${error instanceof Error ? error.message : String(error)}`;
        console.error(errorMessage, error, entity);
      }
    });
    
    if (addedNodeCount === 0 && entities.value.length > 0) {
      const errorMessage = '无法添加任何实体节点到图形中';
      console.error(errorMessage);
      emit('error', errorMessage);
    }
    
    // 添加关系边
    let addedEdgeCount = 0;
    relationships.value.forEach(relationship => {
      try {
        if (!relationship || !relationship.id || !relationship.sourceEntityId || !relationship.targetEntityId) {
          console.warn('跳过无效关系:', relationship);
          return;
        }
        
        // 检查源实体和目标实体是否存在
        const sourceNode = graph.getCellById(relationship.sourceEntityId);
        const targetNode = graph.getCellById(relationship.targetEntityId);
        
        if (!sourceNode || !targetNode) {
          console.warn(`关系 ${relationship.id} 的源实体或目标实体不存在，跳过`);
          return;
        }
        
        // 使用连接管理器找到最优连接点
        const connectionPoints = connectionManager?.findOptimalConnectionPoints(
          sourceNode as any,
          targetNode as any
        );
        
        const edge = graph.addEdge({
          id: relationship.id,
          source: {
            cell: relationship.sourceEntityId,
            port: connectionPoints?.source?.port || 'right'
          },
          target: {
            cell: relationship.targetEntityId,
            port: connectionPoints?.target?.port || 'left'
          },
          router: {
            name: 'orth',
          },
          attrs: {
            line: {
              stroke: relationship.config?.lineColor || '#5F95FF',
              strokeWidth: 2,
              strokeDasharray: getLineStyleDashArray(relationship.config?.lineStyle || 'solid'),
              targetMarker: {
                name: 'classic',
                size: 8,
              },
            },
          },
          labels: [
            {
              attrs: {
                text: {
                  text: getRelationshipLabel(relationship.type),
                },
                rect: {
                  fill: '#ffffff',
                  stroke: relationship.config?.lineColor || '#5F95FF',
                  strokeWidth: 1,
                  rx: 3,
                  ry: 3,
                },
              },
              position: {
                distance: 0.5,
              },
            },
          ],
          data: relationship,
        });
        
        addedEdgeCount++;
      } catch (error) {
        const errorMessage = `添加关系边失败: ${relationship?.name || '未知关系'} - ${error instanceof Error ? error.message : String(error)}`;
        console.error(errorMessage, error, relationship);
      }
    });
    
    // 自动适应视图
    setTimeout(() => {
      if (graph) {
        try {
          graph.zoomToFit({ padding: 20 });
        } catch (error) {
          console.error('自动适应视图失败:', error);
        }
      }
    }, 100);
  } catch (error) {
    const errorMessage = '更新图数据失败: ' + (error instanceof Error ? error.message : String(error));
    console.error(errorMessage, error);
    message.error(errorMessage);
    emit('error', errorMessage);
  }
}

// 工具栏操作
async function autoLayout() {
  if (!graph) return;
  
  layoutLoading.value = true;
  try {
    // 简单的力导向布局
    const nodes = graph.getNodes();
    const radius = Math.max(300, nodes.length * 50);
    
    nodes.forEach((node, i) => {
      const angle = (i / nodes.length) * 2 * Math.PI;
      const x = radius * Math.cos(angle) + 400;
      const y = radius * Math.sin(angle) + 300;
      node.position(x, y);
    });
    
    message.success('自动布局完成');
  } catch (error) {
    message.error('自动布局失败');
  } finally {
    layoutLoading.value = false;
  }
}

function fitView() {
  if (!graph) return;
  try {
    graph.zoomToFit({ padding: 20 });
  } catch (error) {
    console.error('适应视图失败:', error);
    message.error('适应视图失败');
  }
}

function zoomIn() {
  if (!graph) return;
  try {
    // 获取当前缩放级别
    const currentScale = graph.transform.getScale();
    const zoom = Math.min(currentScale.sx * 1.2, 3);
    // 设置新的缩放级别
    graph.scale(zoom);
    // 更新缩放级别显示
    zoomLevel.value = zoom;
  } catch (error) {
    console.error('放大失败:', error);
    message.error('放大失败');
  }
}

function zoomOut() {
  if (!graph) return;
  try {
    // 获取当前缩放级别
    const currentScale = graph.transform.getScale();
    const zoom = Math.max(currentScale.sx / 1.2, 0.1);
    // 设置新的缩放级别
    graph.scale(zoom);
    // 更新缩放级别显示
    zoomLevel.value = zoom;
  } catch (error) {
    console.error('缩小失败:', error);
    message.error('缩小失败');
  }
}

// 小地图控制
function toggleMinimap() {
  if (!graph) return;
  
  isMinimapVisible.value = !isMinimapVisible.value;
  
  const minimapContainer = document.querySelector('.x6-minimap-container') as HTMLElement;
  if (minimapContainer) {
    minimapContainer.style.display = isMinimapVisible.value ? 'block' : 'none';
  }
  
  message.success(isMinimapVisible.value ? '已显示小地图' : '已隐藏小地图');
}

// 网格控制
function toggleGridVisible() {
  if (!graph) return;
  
  isGridVisible.value = !isGridVisible.value;
  graph.drawGrid(isGridVisible.value);
  
  message.success(isGridVisible.value ? '已显示网格' : '已隐藏网格');
}

function toggleSnapToGrid() {
  if (!graph) return;
  
  isSnapToGridEnabled.value = !isSnapToGridEnabled.value;
  
  graph.options.translating.restrict = isSnapToGridEnabled.value ? {
    grid: true,
    gridSize: 10,
  } : false;
  
  message.success(isSnapToGridEnabled.value ? '已启用网格对齐' : '已禁用网格对齐');
}

// 状态保存和加载
function saveGraphState() {
  if (!graph) return;
  
  try {
    const graphData = {
      nodes: graph.getNodes().map(node => ({
        id: node.id,
        data: node.getData(),
        position: node.getPosition(),
        size: node.getSize(),
      })),
      edges: graph.getEdges().map(edge => ({
        id: edge.id,
        source: edge.getSourceCellId(),
        target: edge.getTargetCellId(),
        data: edge.getData(),
        vertices: edge.getVertices(),
      })),
      zoom: graph.zoom(),
      transform: graph.transform.getMatrix(),
    };
    
    // 保存到localStorage
    localStorage.setItem(`relationship-graph-state-${props.projectId}`, JSON.stringify(graphData));
    
    message.success('图形状态已保存');
  } catch (error) {
    console.error('保存图形状态失败:', error);
    message.error('保存图形状态失败');
  }
}

function loadGraphState() {
  if (!graph) return;
  
  try {
    const savedState = localStorage.getItem(`relationship-graph-state-${props.projectId}`);
    if (!savedState) return;
    
    const graphData = JSON.parse(savedState);
    
    // 恢复缩放和变换
    if (graphData.zoom) {
      graph.zoom(graphData.zoom);
      zoomLevel.value = graphData.zoom;
    }
    
    if (graphData.transform) {
      graph.transform.setMatrix(graphData.transform);
    }
    
    // 注意：节点和边的恢复在updateGraphData中处理
    // 这里只保存位置和大小信息，供updateGraphData使用
    
    // 将保存的位置信息应用到实体数据中
    graphData.nodes.forEach((nodeData: any) => {
      const entity = entities.value.find(e => e.id === nodeData.id);
      if (entity) {
        entity.config = entity.config || {};
        entity.config.position = nodeData.position;
        entity.config.size = nodeData.size;
      }
    });
  } catch (error) {
    console.error('加载图形状态失败:', error);
    // 静默失败，不影响正常使用
  }
}

// 导出功能
function handleExport(key: string) {
  if (!graph) return;
  
  try {
    switch (key) {
      case 'png':
        graph.exportPNG();
        break;
      case 'jpg':
        graph.exportJPEG();
        break;
      case 'svg':
        graph.exportSVG();
        break;
      case 'json':
        const jsonData = JSON.stringify({
          nodes: graph.getNodes().map(node => ({
            id: node.id,
            data: node.getData(),
            position: node.getPosition(),
          })),
          edges: graph.getEdges().map(edge => ({
            id: edge.id,
            source: edge.getSourceCellId(),
            target: edge.getTargetCellId(),
            data: edge.getData(),
          })),
        }, null, 2);
        downloadFile(jsonData, 'relationship-graph.json', 'application/json');
        break;
    }
    message.success(`导出${key.toUpperCase()}成功`);
  } catch (error) {
    console.error('导出失败:', error);
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

// 连线模式操作
function toggleConnectMode() {
  isConnectMode.value = !isConnectMode.value;
  if (!isConnectMode.value) {
    cancelConnect();
  }
  clearSelection();
}

function cancelConnect() {
  connectSourceNode.value = null;
  connectTargetNode.value = null;
}

function handleConnectModeNodeClick(node: Node) {
  if (!connectSourceNode.value) {
    // 选择源节点
    connectSourceNode.value = node;
    message.info('请选择目标实体');
  } else if (node.id === connectSourceNode.value.id) {
    // 点击同一个节点，取消选择
    cancelConnect();
  } else {
    // 选择目标节点，打开创建关系对话框
    connectTargetNode.value = node;
    openCreateRelationshipDialog(connectSourceNode.value, connectTargetNode.value);
  }
}

// 创建关系对话框
function openCreateRelationshipDialog(sourceNode: Node, targetNode: Node) {
  const sourceData = sourceNode.getData();
  const targetData = targetNode.getData();
  
  sourceEntityName.value = sourceData.name;
  targetEntityName.value = targetData.name;
  
  // 重置表单
  newRelationshipForm.name = `${sourceData.name}To${targetData.name}`;
  newRelationshipForm.type = 'ONE_TO_MANY';
  newRelationshipForm.description = '';
  
  createRelationshipModalVisible.value = true;
}

function cancelCreateRelationship() {
  createRelationshipModalVisible.value = false;
  cancelConnect();
}

async function confirmCreateRelationship() {
  if (!connectSourceNode.value || !connectTargetNode.value) return;
  
  try {
    createRelationshipLoading.value = true;
    
    const sourceData = connectSourceNode.value.getData();
    const targetData = connectTargetNode.value.getData();
    
    const relationshipData = {
      name: newRelationshipForm.name,
      code: newRelationshipForm.name.replace(/\s+/g, ''),
      type: newRelationshipForm.type,
      description: newRelationshipForm.description,
      projectId: props.projectId,
      sourceEntityId: sourceData.id,
      targetEntityId: targetData.id
    };
    
    const res = await fetchAddRelationship(relationshipData);
    
    if (res.code === 0) {
      message.success('创建关系成功');
      createRelationshipModalVisible.value = false;
      cancelConnect();
      
      // 重新加载数据
      await loadData();
      emit('relationshipUpdated');
    } else {
      message.error('创建关系失败: ' + res.message);
    }
  } catch (error) {
    console.error('创建关系失败:', error);
    message.error('创建关系失败');
  } finally {
    createRelationshipLoading.value = false;
  }
}

// 属性面板操作
function clearSelection() {
  selectedCell.value = null;
  selectedNode.value = null;
  selectedEdge.value = null;
  entityFields.value = [];
}

async function handleUpdateEntity() {
  if (!selectedNode.value) return;
  
  try {
    const entityId = selectedNode.value.id as string;
    const entity = entities.value.find(e => e.id === entityId);
    
    if (entity) {
      // 更新实体数据
      entity.name = selectedNodeData.name;
      entity.tableName = selectedNodeData.tableName;
      entity.description = selectedNodeData.description;
      
      // 更新节点显示
      selectedNode.value.attr('title/text', entity.name);
      selectedNode.value.attr('table/text', `表名: ${entity.tableName}`);
      
      // 保存到后端
      await fetchUpdateEntity(entityId, entity);
      message.success('实体更新成功');
    }
  } catch (error) {
    console.error('更新实体失败:', error);
    message.error('实体更新失败');
  }
}

function handleUpdateEntityVisual() {
  if (!selectedNode.value) return;
  
  try {
    // 更新节点样式
    selectedNode.value.attr('body/fill', selectedNodeVisual.color);
    selectedNode.value.attr('body/stroke', adjustColor(selectedNodeVisual.color, -20));
    
    // 保存样式到实体配置
    const entityId = selectedNode.value.id as string;
    const entity = entities.value.find(e => e.id === entityId);
    
    if (entity) {
      entity.config = entity.config || {};
      entity.config.color = selectedNodeVisual.color;
    }
  } catch (error) {
    console.error('更新实体样式失败:', error);
  }
}

function handleUpdateEntityPosition() {
  if (!selectedNode.value) return;
  
  try {
    // 更新节点位置
    selectedNode.value.position(selectedNodeVisual.x, selectedNodeVisual.y);
    
    // 保存位置到实体配置
    const entityId = selectedNode.value.id as string;
    const entity = entities.value.find(e => e.id === entityId);
    
    if (entity) {
      entity.config = entity.config || {};
      entity.config.position = { x: selectedNodeVisual.x, y: selectedNodeVisual.y };
    }
  } catch (error) {
    console.error('更新实体位置失败:', error);
  }
}

function handleUpdateEntitySize() {
  if (!selectedNode.value) return;
  
  try {
    // 更新节点大小
    selectedNode.value.resize(selectedNodeVisual.width, selectedNodeVisual.height);
    
    // 保存大小到实体配置
    const entityId = selectedNode.value.id as string;
    const entity = entities.value.find(e => e.id === entityId);
    
    if (entity) {
      entity.config = entity.config || {};
      entity.config.size = { width: selectedNodeVisual.width, height: selectedNodeVisual.height };
    }
  } catch (error) {
    console.error('更新实体大小失败:', error);
  }
}

async function handleUpdateRelationship() {
  if (!selectedEdge.value) return;
  
  try {
    const relationshipId = selectedEdge.value.id as string;
    const relationship = relationships.value.find(r => r.id === relationshipId);
    
    if (relationship) {
      // 更新关系数据
      relationship.name = selectedEdgeData.name;
      relationship.type = selectedEdgeData.type;
      relationship.description = selectedEdgeData.description;
      relationship.onDelete = selectedEdgeData.onDelete;
      relationship.onUpdate = selectedEdgeData.onUpdate;
      relationship.foreignKeyField = selectedEdgeData.foreignKeyField;
      relationship.cascadeDelete = selectedEdgeData.cascadeDelete;
      relationship.cascadeUpdate = selectedEdgeData.cascadeUpdate;
      relationship.required = selectedEdgeData.required;
      
      // 更新边标签
      selectedEdge.value.setLabels([
        {
          attrs: {
            text: {
              text: getRelationshipLabel(relationship.type),
            },
            rect: {
              fill: '#ffffff',
              stroke: selectedEdgeVisual.lineColor,
              strokeWidth: 1,
              rx: 3,
              ry: 3,
            },
          },
          position: {
            distance: 0.5,
          },
        },
      ]);
      
      // 保存到后端
      await fetchUpdateRelationship(relationshipId, relationship);
      message.success('关系更新成功');
      emit('relationshipUpdated');
    }
  } catch (error) {
    console.error('更新关系失败:', error);
    message.error('关系更新失败');
  }
}

function handleUpdateEdgeVisual() {
  if (!selectedEdge.value) return;
  
  try {
    // 更新边样式
    selectedEdge.value.attr('line/stroke', selectedEdgeVisual.lineColor);
    selectedEdge.value.attr('line/strokeDasharray', getLineStyleDashArray(selectedEdgeVisual.lineStyle));
    
    // 更新标签样式
    selectedEdge.value.prop('labels/0/attrs/rect/stroke', selectedEdgeVisual.lineColor);
    
    // 保存样式到关系配置
    const relationshipId = selectedEdge.value.id as string;
    const relationship = relationships.value.find(r => r.id === relationshipId);
    
    if (relationship) {
      relationship.config = relationship.config || {};
      relationship.config.lineStyle = selectedEdgeVisual.lineStyle;
      relationship.config.lineColor = selectedEdgeVisual.lineColor;
    }
  } catch (error) {
    console.error('更新关系样式失败:', error);
  }
}

// 加载实体字段
async function loadEntityFields(entityId: string) {
  if (!entityId) return;
  
  fieldsLoading.value = true;
  try {
    const res = await fetchGetAllFields({ entityId });
    entityFields.value = res.data || [];
  } catch (error) {
    console.error('加载实体字段失败:', error);
    message.error('加载实体字段失败');
    entityFields.value = [];
  } finally {
    fieldsLoading.value = false;
  }
}

// 导航到实体字段设计页面
function navigateToEntityFields() {
  if (!selectedNode.value) return;
  
  const entityId = selectedNode.value.id as string;
  const entity = entities.value.find(e => e.id === entityId);
  
  if (entity) {
    // 使用window.open打开新标签页
    const url = `/lowcode/entity/design?id=${entityId}&projectId=${props.projectId}`;
    window.open(url, '_blank');
  }
}

// 获取字段类型名称
function getFieldTypeName(type: string) {
  const typeMap: Record<string, string> = {
    'STRING': '字符串',
    'INTEGER': '整数',
    'DECIMAL': '小数',
    'BOOLEAN': '布尔',
    'DATE': '日期',
    'DATETIME': '日期时间',
    'TEXT': '文本',
    'JSON': 'JSON'
  };
  
  return typeMap[type] || type;
}

// 获取线条样式的虚线数组
function getLineStyleDashArray(style: string) {
  switch (style) {
    case 'dashed':
      return '5,5';
    case 'dotted':
      return '2,2';
    case 'solid':
    default:
      return '';
  }
}

// 调整颜色亮度
function adjustColor(color: string, amount: number) {
  let hex = color;
  
  // 如果是简写形式的十六进制颜色值，转换为完整形式
  if (hex.length === 4) {
    hex = '#' + hex[1] + hex[1] + hex[2] + hex[2] + hex[3] + hex[3];
  }
  
  // 解析RGB值
  const r = parseInt(hex.substring(1, 3), 16);
  const g = parseInt(hex.substring(3, 5), 16);
  const b = parseInt(hex.substring(5, 7), 16);
  
  // 调整亮度
  const newR = Math.max(0, Math.min(255, r + amount));
  const newG = Math.max(0, Math.min(255, g + amount));
  const newB = Math.max(0, Math.min(255, b + amount));
  
  // 转换回十六进制
  return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
}

// 实体列表操作
function isEntityInGraph(entityId: string) {
  return graphEntityIds.value.has(entityId);
}

function handleEntityClick(entity: any) {
  if (isConnectMode.value) return;
  
  if (isEntityInGraph(entity.id)) {
    locateEntity(entity.id);
  } else {
    addEntityToGraph(entity);
  }
}

function addEntityToGraph(entity: any) {
  if (!graph || isEntityInGraph(entity.id)) return;
  
  const fieldCount = fields.value.filter(f => f.entityId === entity.id).length;
  
  // 计算新节点的位置
  const center = graph.getGraphArea();
  const x = center.x || 300;
  const y = center.y || 200;
  
  // 添加节点
  const node = graph.addNode({
    id: entity.id,
    shape: 'entity-node',
    x: x + (Math.random() * 100 - 50),
    y: y + (Math.random() * 100 - 50),
    attrs: {
      title: { text: entity.name },
      code: { text: entity.code },
      fields: { text: `字段数量: ${fieldCount}` },
      table: { text: `表名: ${entity.tableName}` },
    },
    ports: {
      groups: {
        'connection-port': {
          position: 'absolute',
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
        { id: 'top', group: 'connection-port', args: { x: '50%', y: 0 } },
        { id: 'right', group: 'connection-port', args: { x: '100%', y: '50%' } },
        { id: 'bottom', group: 'connection-port', args: { x: '50%', y: '100%' } },
        { id: 'left', group: 'connection-port', args: { x: 0, y: '50%' } },
      ],
    },
    data: entity,
  });
  
  // 选中新添加的节点
  graph.cleanSelection();
  graph.select(node);
  
  // 更新选中状态
  selectedCell.value = node;
  selectedNode.value = node;
  selectedEdge.value = null;
  
  // 更新选中节点数据
  const nodeData = node.getData() || {};
  selectedNodeData.name = nodeData.name || '';
  selectedNodeData.code = nodeData.code || '';
  selectedNodeData.tableName = nodeData.tableName || '';
  selectedNodeData.description = nodeData.description || '';
  
  message.success(`已添加实体: ${entity.name}`);
}

function removeEntityFromGraph(entityId: string) {
  if (!graph || !isEntityInGraph(entityId)) return;
  
  // 查找与该实体相关的边
  const relatedEdges = graph.getEdges().filter(edge => {
    return edge.getSourceCellId() === entityId || edge.getTargetCellId() === entityId;
  });
  
  // 删除相关的边
  relatedEdges.forEach(edge => {
    graph?.removeCell(edge);
  });
  
  // 删除节点
  graph.removeCell(entityId);
  
  // 如果当前选中的是被删除的节点，清除选中状态
  if (selectedNode.value && selectedNode.value.id === entityId) {
    clearSelection();
  }
  
  message.success('已从图中移除实体');
}

function locateEntity(entityId: string) {
  if (!graph || !isEntityInGraph(entityId)) return;
  
  const node = graph.getCellById(entityId);
  if (node) {
    // 居中显示节点
    graph.centerCell(node);
    
    // 选中节点
    graph.cleanSelection();
    graph.select(node);
    
    // 更新选中状态
    selectedCell.value = node;
    selectedNode.value = node as Node;
    selectedEdge.value = null;
    
    // 更新选中节点数据
    const nodeData = node.getData() || {};
    selectedNodeData.name = nodeData.name || '';
    selectedNodeData.code = nodeData.code || '';
    selectedNodeData.tableName = nodeData.tableName || '';
    selectedNodeData.description = nodeData.description || '';
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

// 生命周期
onMounted(async () => {
  try {
    await nextTick();
    
    // 等待DOM完全渲染和CSS应用
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // 多次尝试初始化，确保容器尺寸正确
    let retryCount = 0;
    const maxRetries = 5;
    
    const tryInit = async () => {
      if (!containerRef.value) {
        if (retryCount < maxRetries) {
          retryCount++;
          setTimeout(tryInit, 200);
        }
        return;
      }
      
      const rect = containerRef.value.getBoundingClientRect();
      if (rect.height < 100 && retryCount < maxRetries) {
        retryCount++;
        console.log(`容器高度不足，重试初始化 (${retryCount}/${maxRetries}):`, rect);
        setTimeout(tryInit, 200);
        return;
      }
      
      await initGraph();
      await loadData();
    };
    
    await tryInit();
    window.addEventListener('resize', handleResize);
  } catch (error) {
    console.error('组件挂载时发生错误:', error);
    const errorMessage = '关系设计器初始化失败: ' + (error instanceof Error ? error.message : String(error));
    message.error(errorMessage);
    emit('error', errorMessage);
  }
});

onUnmounted(() => {
  window.removeEventListener('resize', handleResize);
  
  if (graph) {
    graph.dispose();
    graph = null;
  }
});

// 窗口大小变化处理
const handleResize = debounce(() => {
  if (graph && containerRef.value) {
    const rect = containerRef.value.getBoundingClientRect();
    const width = Math.max(rect.width, 400);
    const height = Math.max(rect.height, 300);
    
    console.log('窗口大小变化，调整图形尺寸:', { width, height });
    
    try {
      graph.resize(width, height);
      // 触发重新布局
      if (width > 0 && height > 0) {
        setTimeout(() => {
          if (graph) {
            graph.zoomToFit({ padding: 20 });
          }
        }, 100);
      }
    } catch (error) {
      console.error('调整图形尺寸失败:', error);
    }
  }
}, 200);
</script>

<style scoped>
.x6-relationship-designer {
  height: 100%;
  min-height: 600px;
  display: flex;
  flex-direction: column;
  background-color: #f9fafb;
  position: relative;
}

/* 加载遮罩 */
.loading-mask {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(255, 255, 255, 0.7);
  z-index: 50;
}

.x6-relationship-designer.loading .graph-container,
.x6-relationship-designer.loading .entity-list,
.x6-relationship-designer.loading .property-panel {
  pointer-events: none;
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 1rem;
  background-color: white;
  border-bottom: 1px solid #e5e7eb;
  z-index: 10;
}

.zoom-display {
  font-size: 0.875rem;
  color: #6b7280;
}

.connect-hint {
  padding: 0.5rem 1rem;
  background-color: #eff6ff;
  border-bottom: 1px solid #bfdbfe;
  z-index: 10;
}

.graph-container {
  flex: 1;
  position: relative;
  background-color: white;
  cursor: default;
  overflow: hidden;
}

.graph-container.connect-mode {
  cursor: crosshair;
}

.property-panel {
  position: absolute;
  top: 0;
  right: 0;
  width: 300px;
  height: 100%;
  background-color: white;
  border-left: 1px solid #e5e7eb;
  box-shadow: -4px 0 6px -1px rgba(0, 0, 0, 0.1);
  z-index: 10;
  overflow: auto;
}

.property-panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 1rem;
  border-bottom: 1px solid #e5e7eb;
}

.property-panel-content {
  padding: 1rem;
}

.property-panel-content h4 {
  margin-bottom: 1rem;
  color: #4b5563;
}

/* 实体列表样式 */
.entity-list {
  position: absolute;
  top: 0;
  left: 0;
  width: 250px;
  height: 100%;
  background-color: white;
  border-right: 1px solid #e5e7eb;
  box-shadow: 4px 0 6px -1px rgba(0, 0, 0, 0.1);
  z-index: 10;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.entity-list-header {
  display: flex;
  flex-direction: column;
  padding: 0.75rem;
  border-bottom: 1px solid #e5e7eb;
}

.entity-list-header h3 {
  margin-bottom: 0.5rem;
  font-size: 1rem;
  font-weight: 500;
}

.entity-list-content {
  flex: 1;
  overflow: auto;
  padding: 0.5rem;
}

.entity-items {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.entity-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem;
  border-radius: 0.375rem;
  border: 1px solid #e5e7eb;
  transition: background-color 0.2s;
}

.entity-item:hover {
  background-color: #f9fafb;
}

.entity-item.is-in-graph {
  background-color: #eff6ff;
  border-color: #bfdbfe;
}

.entity-item-content {
  flex: 1;
  overflow: hidden;
}

.entity-name {
  font-size: 0.875rem;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.entity-code {
  font-size: 0.75rem;
  color: #6b7280;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.entity-actions {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  margin-left: 0.5rem;
}

/* 适应布局 */
.graph-container {
  position: absolute;
  top: 40px; /* 工具栏高度 */
  left: 250px; /* 实体列表宽度 */
  right: 0;
  bottom: 0;
  min-height: 500px; /* 添加最小高度保障 */
  height: calc(100% - 40px); /* 确保高度正确 */
}

.x6-relationship-designer.with-property-panel .graph-container {
  right: 300px; /* 属性面板宽度 */
}

/* 确保实体列表从工具栏下方开始 */
.entity-list {
  top: 40px; /* 工具栏高度 */
  height: calc(100% - 40px); /* 减去工具栏高度 */
}

/* 确保属性面板从工具栏下方开始 */
.property-panel {
  top: 40px; /* 工具栏高度 */
  height: calc(100% - 40px); /* 减去工具栏高度 */
}

/* 响应式调整 */
@media (max-width: 1200px) {
  .entity-list {
    width: 200px;
  }
  
  .x6-relationship-designer .graph-container {
    left: 200px;
  }
  
  .property-panel {
    width: 250px;
  }
  
  .x6-relationship-designer.with-property-panel .graph-container {
    right: 250px;
  }
}

/* 修复事件监听器问题 */
.x6-relationship-designer * {
  touch-action: manipulation;
}

/* 修复滚动事件监听器问题 */
.graph-container {
  touch-action: none;
}

.entity-list-content {
  touch-action: pan-y;
}

.property-panel-content {
  touch-action: pan-y;
}
</style>
