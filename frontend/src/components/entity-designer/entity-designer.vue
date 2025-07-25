<template>
  <div class="entity-designer">
    <!-- 工具栏 -->
    <div class="designer-toolbar">
      <div class="toolbar-left">
        <n-button-group>
          <n-button @click="addEntity" type="primary" size="small">
            <template #icon>
              <svg-icon icon="ic:round-add" />
            </template>
            添加实体
          </n-button>
          <n-button @click="autoLayout" size="small">
            <template #icon>
              <svg-icon icon="ic:round-auto-fix-high" />
            </template>
            自动布局
          </n-button>
          <n-button @click="validateDesign" size="small">
            <template #icon>
              <svg-icon icon="ic:round-check-circle" />
            </template>
            验证设计
          </n-button>
        </n-button-group>
      </div>
      
      <div class="toolbar-center">
        <n-input
          v-model:value="canvasName"
          placeholder="画布名称"
          size="small"
          style="width: 200px"
          @blur="updateCanvasName"
        />
      </div>
      
      <div class="toolbar-right">
        <n-button-group>
          <n-button @click="saveCanvas" size="small" :loading="saving">
            <template #icon>
              <svg-icon icon="ic:round-save" />
            </template>
            保存
          </n-button>
          <n-button @click="generateCode" type="success" size="small">
            <template #icon>
              <svg-icon icon="ic:round-code" />
            </template>
            生成代码
          </n-button>
          <n-button @click="exportCanvas" size="small">
            <template #icon>
              <svg-icon icon="ic:round-download" />
            </template>
            导出
          </n-button>
        </n-button-group>
      </div>
    </div>

    <!-- 设计器画布 -->
    <div class="designer-canvas" ref="canvasContainer">
      <div
        class="canvas-viewport"
        :style="{
          transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${zoom})`,
          transformOrigin: '0 0'
        }"
      >
        <!-- 网格背景 -->
        <div
          v-if="canvasConfig.grid.enabled"
          class="canvas-grid"
          :style="{
            backgroundSize: `${canvasConfig.grid.size * zoom}px ${canvasConfig.grid.size * zoom}px`,
            backgroundImage: `
              linear-gradient(to right, ${canvasConfig.grid.color} 1px, transparent 1px),
              linear-gradient(to bottom, ${canvasConfig.grid.color} 1px, transparent 1px)
            `
          }"
        />

        <!-- 实体节点 -->
        <EntityNode
          v-for="entity in entities"
          :key="entity.id"
          :entity="entity"
          :selected="selectedEntityId === entity.id"
          @select="selectEntity"
          @update="updateEntity"
          @delete="deleteEntity"
          @field-add="addField"
          @field-update="updateField"
          @field-delete="deleteField"
        />

        <!-- 关系连线 -->
        <RelationshipEdge
          v-for="relationship in relationships"
          :key="relationship.id"
          :relationship="relationship"
          :entities="entities"
          :selected="selectedRelationshipId === relationship.id"
          @select="selectRelationship"
          @update="updateRelationship"
          @delete="deleteRelationship"
        />
      </div>
    </div>

    <!-- 属性面板 -->
    <div class="designer-properties" v-if="selectedEntity || selectedRelationship">
      <EntityProperties
        v-if="selectedEntity"
        :entity="selectedEntity"
        @update="updateEntity"
        @close="clearSelection"
      />
      <RelationshipProperties
        v-if="selectedRelationship"
        :relationship="selectedRelationship"
        :entities="entities"
        @update="updateRelationship"
        @close="clearSelection"
      />
    </div>

    <!-- 缩放控制 -->
    <div class="zoom-controls">
      <n-button-group vertical>
        <n-button size="small" @click="zoomIn">
          <svg-icon icon="ic:round-zoom-in" />
        </n-button>
        <n-button size="small" @click="resetZoom">
          {{ Math.round(zoom * 100) }}%
        </n-button>
        <n-button size="small" @click="zoomOut">
          <svg-icon icon="ic:round-zoom-out" />
        </n-button>
      </n-button-group>
    </div>

    <!-- 验证结果弹窗 -->
    <n-modal v-model:show="validationModalVisible" preset="card" title="设计验证结果" style="width: 600px">
      <ValidationResult
        v-if="validationResult"
        :result="validationResult"
        @fix-error="fixValidationError"
      />
    </n-modal>

    <!-- 代码生成配置弹窗 -->
    <n-modal v-model:show="codeGenModalVisible" preset="card" title="代码生成配置" style="width: 500px">
      <CodeGenerationConfig
        v-if="codeGenModalVisible"
        :canvas-id="canvasId"
        @generate="handleCodeGeneration"
        @cancel="codeGenModalVisible = false"
      />
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue';
import { useRoute } from 'vue-router';
import { 
  NButton, 
  NButtonGroup, 
  NInput, 
  NModal,
  useMessage,
  useDialog
} from 'naive-ui';
import { useBoolean } from '@sa/hooks';
import SvgIcon from '@/components/custom/svg-icon.vue';
import EntityNode from './components/entity-node.vue';
import RelationshipEdge from './components/relationship-edge.vue';
import EntityProperties from './components/entity-properties.vue';
import RelationshipProperties from './components/relationship-properties.vue';
import ValidationResult from './components/validation-result.vue';
import CodeGenerationConfig from './components/code-generation-config.vue';
import { unifiedApi } from '@/service/api/unified-api';

// 接口定义
interface EntityNodeData {
  id: string;
  code: string;
  name: string;
  description?: string;
  fields: FieldDefinition[];
  position: { x: number; y: number };
  size: { width: number; height: number };
  style?: Record<string, any>;
  collapsed?: boolean;
  metadata?: Record<string, any>;
}

interface FieldDefinition {
  name: string;
  type: string;
  required: boolean;
  unique?: boolean;
  defaultValue?: any;
  length?: number;
  description?: string;
  validation?: Record<string, any>;
}

interface RelationshipData {
  id: string;
  sourceEntityId: string;
  targetEntityId: string;
  sourceField: string;
  targetField: string;
  type: 'oneToOne' | 'oneToMany' | 'manyToOne' | 'manyToMany';
  name?: string;
  cascade?: boolean;
  style?: Record<string, any>;
  waypoints?: Array<{ x: number; y: number }>;
  metadata?: Record<string, any>;
}

interface CanvasConfig {
  size: { width: number; height: number };
  zoom: number;
  viewport: { x: number; y: number };
  grid: {
    enabled: boolean;
    size: number;
    color: string;
  };
  theme: {
    name: string;
    colors: Record<string, string>;
  };
  autoLayout: {
    enabled: boolean;
    algorithm: 'dagre' | 'force' | 'circular';
    direction: 'TB' | 'BT' | 'LR' | 'RL';
  };
}

// Props
interface Props {
  canvasId?: string;
  projectId?: string;
  readonly?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  readonly: false
});

// Composables
const route = useRoute();
const message = useMessage();
const dialog = useDialog();

// 响应式数据
const canvasContainer = ref<HTMLElement>();
const canvasName = ref('未命名画布');
const entities = ref<EntityNodeData[]>([]);
const relationships = ref<RelationshipData[]>([]);
const selectedEntityId = ref<string>('');
const selectedRelationshipId = ref<string>('');
const zoom = ref(1);
const viewport = reactive({ x: 0, y: 0 });

const canvasConfig = reactive<CanvasConfig>({
  size: { width: 2000, height: 1500 },
  zoom: 1,
  viewport: { x: 0, y: 0 },
  grid: {
    enabled: true,
    size: 20,
    color: '#f0f0f0',
  },
  theme: {
    name: 'default',
    colors: {
      primary: '#1890ff',
      secondary: '#52c41a',
      background: '#ffffff',
      border: '#d9d9d9',
      text: '#262626',
    },
  },
  autoLayout: {
    enabled: false,
    algorithm: 'dagre',
    direction: 'TB',
  },
});

const validationResult = ref<any>(null);
const { bool: saving, setTrue: startSaving, setFalse: stopSaving } = useBoolean(false);
const { bool: validationModalVisible, setTrue: showValidationModal, setFalse: hideValidationModal } = useBoolean(false);
const { bool: codeGenModalVisible, setTrue: showCodeGenModal, setFalse: hideCodeGenModal } = useBoolean(false);

// 计算属性
const canvasId = computed(() => props.canvasId || route.params.canvasId as string);
const selectedEntity = computed(() => entities.value.find(e => e.id === selectedEntityId.value));
const selectedRelationship = computed(() => relationships.value.find(r => r.id === selectedRelationshipId.value));

// 方法
async function loadCanvas() {
  if (!canvasId.value) return;

  try {
    const response = await unifiedApi.entityDesigner.getCanvas(canvasId.value);
    const canvas = response.data;

    canvasName.value = canvas.name;
    entities.value = canvas.canvasData.entities;
    relationships.value = canvas.canvasData.relationships;
    Object.assign(canvasConfig, canvas.canvasData.config);
    zoom.value = canvasConfig.zoom;
    viewport.x = canvasConfig.viewport.x;
    viewport.y = canvasConfig.viewport.y;
  } catch (error) {
    message.error('加载画布失败');
    console.error('Load canvas error:', error);
  }
}

async function saveCanvas() {
  if (!canvasId.value || props.readonly) return;

  try {
    startSaving();
    
    await unifiedApi.entityDesigner.updateCanvas(canvasId.value, {
      entities: entities.value,
      relationships: relationships.value,
      config: {
        ...canvasConfig,
        zoom: zoom.value,
        viewport: { x: viewport.x, y: viewport.y },
      },
    });

    message.success('画布保存成功');
  } catch (error) {
    message.error('保存画布失败');
    console.error('Save canvas error:', error);
  } finally {
    stopSaving();
  }
}

function addEntity() {
  const newEntity: EntityNodeData = {
    id: `entity_${Date.now()}`,
    code: `Entity${entities.value.length + 1}`,
    name: `实体${entities.value.length + 1}`,
    fields: [],
    position: { x: 100 + entities.value.length * 50, y: 100 + entities.value.length * 50 },
    size: { width: 200, height: 150 },
  };

  entities.value.push(newEntity);
  selectEntity(newEntity.id);
}

function selectEntity(entityId: string) {
  selectedEntityId.value = entityId;
  selectedRelationshipId.value = '';
}

function selectRelationship(relationshipId: string) {
  selectedRelationshipId.value = relationshipId;
  selectedEntityId.value = '';
}

function clearSelection() {
  selectedEntityId.value = '';
  selectedRelationshipId.value = '';
}

function updateEntity(entityId: string, updates: Partial<EntityNodeData>) {
  const index = entities.value.findIndex(e => e.id === entityId);
  if (index !== -1) {
    entities.value[index] = { ...entities.value[index], ...updates };
  }
}

function deleteEntity(entityId: string) {
  dialog.warning({
    title: '确认删除',
    content: '确定要删除这个实体吗？相关的关系也会被删除。',
    positiveText: '删除',
    negativeText: '取消',
    onPositiveClick: () => {
      entities.value = entities.value.filter(e => e.id !== entityId);
      relationships.value = relationships.value.filter(
        r => r.sourceEntityId !== entityId && r.targetEntityId !== entityId
      );
      if (selectedEntityId.value === entityId) {
        clearSelection();
      }
    },
  });
}

function addField(entityId: string) {
  const entity = entities.value.find(e => e.id === entityId);
  if (entity) {
    const newField: FieldDefinition = {
      name: `field${entity.fields.length + 1}`,
      type: 'string',
      required: false,
    };
    entity.fields.push(newField);
  }
}

function updateField(entityId: string, fieldIndex: number, updates: Partial<FieldDefinition>) {
  const entity = entities.value.find(e => e.id === entityId);
  if (entity && entity.fields[fieldIndex]) {
    entity.fields[fieldIndex] = { ...entity.fields[fieldIndex], ...updates };
  }
}

function deleteField(entityId: string, fieldIndex: number) {
  const entity = entities.value.find(e => e.id === entityId);
  if (entity) {
    entity.fields.splice(fieldIndex, 1);
  }
}

function updateRelationship(relationshipId: string, updates: Partial<RelationshipData>) {
  const index = relationships.value.findIndex(r => r.id === relationshipId);
  if (index !== -1) {
    relationships.value[index] = { ...relationships.value[index], ...updates };
  }
}

function deleteRelationship(relationshipId: string) {
  relationships.value = relationships.value.filter(r => r.id !== relationshipId);
  if (selectedRelationshipId.value === relationshipId) {
    clearSelection();
  }
}

async function validateDesign() {
  if (!canvasId.value) return;

  try {
    const response = await unifiedApi.entityDesigner.validateDesign(canvasId.value);
    validationResult.value = response.data;
    showValidationModal();
  } catch (error) {
    message.error('验证失败');
    console.error('Validation error:', error);
  }
}

function fixValidationError(error: any) {
  // TODO: 实现错误修复逻辑
  console.log('Fix error:', error);
}

function generateCode() {
  showCodeGenModal();
}

async function handleCodeGeneration(config: any) {
  try {
    const response = await unifiedApi.entityDesigner.generateCode(canvasId.value, config);
    message.success(`代码生成任务已创建: ${response.data.taskId}`);
    hideCodeGenModal();
  } catch (error) {
    message.error('创建代码生成任务失败');
    console.error('Code generation error:', error);
  }
}

function autoLayout() {
  // TODO: 实现自动布局算法
  message.info('自动布局功能开发中...');
}

function exportCanvas() {
  // TODO: 实现画布导出功能
  message.info('导出功能开发中...');
}

function updateCanvasName() {
  // TODO: 更新画布名称
}

function zoomIn() {
  zoom.value = Math.min(zoom.value * 1.2, 3);
}

function zoomOut() {
  zoom.value = Math.max(zoom.value / 1.2, 0.1);
}

function resetZoom() {
  zoom.value = 1;
  viewport.x = 0;
  viewport.y = 0;
}

// 生命周期
onMounted(() => {
  loadCanvas();
});

onUnmounted(() => {
  // 清理资源
});
</script>

<style scoped>
.entity-designer {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f5f5f5;
}

.designer-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 16px;
  background: white;
  border-bottom: 1px solid #e8e8e8;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.designer-canvas {
  flex: 1;
  position: relative;
  overflow: hidden;
  background: white;
}

.canvas-viewport {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

.canvas-grid {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.designer-properties {
  position: absolute;
  top: 60px;
  right: 0;
  width: 300px;
  height: calc(100% - 60px);
  background: white;
  border-left: 1px solid #e8e8e8;
  box-shadow: -2px 0 4px rgba(0, 0, 0, 0.1);
  z-index: 100;
}

.zoom-controls {
  position: absolute;
  bottom: 20px;
  right: 20px;
  z-index: 100;
}
</style>
