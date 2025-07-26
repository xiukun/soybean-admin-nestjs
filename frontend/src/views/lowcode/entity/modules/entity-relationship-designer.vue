<template>
  <div class="entity-relationship-designer">
    <!-- 头部工具栏 -->
    <div class="designer-toolbar mb-4">
      <NSpace justify="space-between" align="center">
        <div>
          <NText tag="h2" class="text-xl font-bold">{{ $t('page.lowcode.entity.relationshipDesigner') }}</NText>
          <NText depth="3">{{ $t('page.lowcode.entity.relationshipDesignerDesc') }}</NText>
        </div>
        <NSpace>
          <NButton @click="handleAutoLayout">
            <template #icon>
              <NIcon><icon-mdi-auto-fix /></NIcon>
            </template>
            {{ $t('page.lowcode.entity.autoLayout') }}
          </NButton>
          <NButton @click="handleZoomIn">
            <template #icon>
              <NIcon><icon-mdi-magnify-plus /></NIcon>
            </template>
          </NButton>
          <NButton @click="handleZoomOut">
            <template #icon>
              <NIcon><icon-mdi-magnify-minus /></NIcon>
            </template>
          </NButton>
          <NButton @click="handleResetZoom">
            <template #icon>
              <NIcon><icon-mdi-magnify /></NIcon>
            </template>
          </NButton>
          <NButton type="primary" @click="handleSave" :loading="saving">
            <template #icon>
              <NIcon><icon-mdi-content-save /></NIcon>
            </template>
            {{ $t('lowcode.common.active.save') }}
          </NButton>
        </NSpace>
      </NSpace>
    </div>

    <!-- 主要设计区域 -->
    <div class="designer-main">
      <NGrid :cols="4" :x-gap="16">
        <!-- 实体列表面板 -->
        <NGridItem>
          <NCard :title="$t('page.lowcode.entity.entityList')" size="small" class="h-full">
            <template #header-extra>
              <NButton size="small" @click="handleAddEntity">
                <template #icon>
                  <NIcon><icon-mdi-plus /></NIcon>
                </template>
              </NButton>
            </template>
            
            <div class="entity-list">
              <div
                v-for="entity in entities"
                :key="entity.id"
                class="entity-item"
                :class="{ active: selectedEntityId === entity.id }"
                @click="handleSelectEntity(entity.id)"
                draggable="true"
                @dragstart="handleEntityDragStart(entity, $event)"
              >
                <div class="entity-header">
                  <NIcon class="entity-icon"><icon-mdi-table /></NIcon>
                  <span class="entity-name">{{ entity.name }}</span>
                </div>
                <div class="entity-fields">
                  <div
                    v-for="field in entity.fields.slice(0, 5)"
                    :key="field.id"
                    class="field-item"
                  >
                    <NIcon v-if="field.primaryKey" class="field-icon pk"><icon-mdi-key /></NIcon>
                    <NIcon v-else class="field-icon"><icon-mdi-circle-small /></NIcon>
                    <span class="field-name">{{ field.name }}</span>
                    <span class="field-type">{{ field.dataType }}</span>
                  </div>
                  <div v-if="entity.fields.length > 5" class="field-more">
                    +{{ entity.fields.length - 5 }} more...
                  </div>
                </div>
              </div>
            </div>
          </NCard>
        </NGridItem>

        <!-- 设计画布 -->
        <NGridItem :span="2">
          <NCard :title="$t('page.lowcode.entity.designCanvas')" size="small" class="h-full">
            <div
              ref="canvasRef"
              class="design-canvas"
              @drop="handleCanvasDrop"
              @dragover="handleCanvasDragOver"
              @click="handleCanvasClick"
            >
              <!-- 实体节点 -->
              <div
                v-for="entityNode in canvasEntities"
                :key="entityNode.id"
                class="entity-node"
                :style="{ left: entityNode.x + 'px', top: entityNode.y + 'px' }"
                @mousedown="handleEntityMouseDown(entityNode, $event)"
                @click.stop="handleEntityNodeClick(entityNode)"
              >
                <div class="entity-node-header">
                  <span class="entity-node-name">{{ entityNode.name }}</span>
                  <NButton size="tiny" quaternary @click.stop="handleRemoveEntityFromCanvas(entityNode)">
                    <template #icon>
                      <NIcon><icon-mdi-close /></NIcon>
                    </template>
                  </NButton>
                </div>
                <div class="entity-node-fields">
                  <div
                    v-for="field in entityNode.fields"
                    :key="field.id"
                    class="entity-node-field"
                    :class="{ pk: field.primaryKey }"
                  >
                    <NIcon v-if="field.primaryKey" class="field-icon"><icon-mdi-key /></NIcon>
                    <span class="field-name">{{ field.name }}</span>
                    <span class="field-type">{{ field.dataType }}</span>
                  </div>
                </div>
              </div>

              <!-- 关系连线 -->
              <svg class="relationship-lines" :width="canvasWidth" :height="canvasHeight">
                <defs>
                  <marker
                    id="arrowhead"
                    markerWidth="10"
                    markerHeight="7"
                    refX="9"
                    refY="3.5"
                    orient="auto"
                  >
                    <polygon points="0 0, 10 3.5, 0 7" fill="#666" />
                  </marker>
                </defs>
                <line
                  v-for="relationship in relationships"
                  :key="relationship.id"
                  :x1="relationship.startX"
                  :y1="relationship.startY"
                  :x2="relationship.endX"
                  :y2="relationship.endY"
                  stroke="#666"
                  stroke-width="2"
                  marker-end="url(#arrowhead)"
                  @click="handleRelationshipClick(relationship)"
                />
                <text
                  v-for="relationship in relationships"
                  :key="`label-${relationship.id}`"
                  :x="(relationship.startX + relationship.endX) / 2"
                  :y="(relationship.startY + relationship.endY) / 2 - 5"
                  text-anchor="middle"
                  class="relationship-label"
                  @click="handleRelationshipClick(relationship)"
                >
                  {{ relationship.type }}
                </text>
              </svg>
            </div>
          </NCard>
        </NGridItem>

        <!-- 属性面板 -->
        <NGridItem>
          <NCard :title="$t('page.lowcode.entity.properties')" size="small" class="h-full">
            <!-- 实体属性 -->
            <div v-if="selectedEntity">
              <NText strong>{{ $t('page.lowcode.entity.entityProperties') }}</NText>
              <NForm :model="selectedEntity" size="small" class="mt-4">
                <NFormItem :label="$t('page.lowcode.entity.name')">
                  <NInput v-model:value="selectedEntity.name" />
                </NFormItem>
                <NFormItem :label="$t('page.lowcode.entity.tableName')">
                  <NInput v-model:value="selectedEntity.tableName" />
                </NFormItem>
                <NFormItem :label="$t('page.lowcode.entity.description')">
                  <NInput v-model:value="selectedEntity.description" type="textarea" :rows="3" />
                </NFormItem>
              </NForm>
            </div>

            <!-- 关系属性 -->
            <div v-else-if="selectedRelationship">
              <NText strong>{{ $t('page.lowcode.entity.relationshipProperties') }}</NText>
              <NForm :model="selectedRelationship" size="small" class="mt-4">
                <NFormItem :label="$t('page.lowcode.entity.relationshipType')">
                  <NSelect v-model:value="selectedRelationship.type" :options="relationshipTypeOptions" />
                </NFormItem>
                <NFormItem :label="$t('page.lowcode.entity.sourceEntity')">
                  <NSelect v-model:value="selectedRelationship.sourceEntityId" :options="entityOptions" />
                </NFormItem>
                <NFormItem :label="$t('page.lowcode.entity.targetEntity')">
                  <NSelect v-model:value="selectedRelationship.targetEntityId" :options="entityOptions" />
                </NFormItem>
                <NFormItem :label="$t('page.lowcode.entity.sourceField')">
                  <NSelect v-model:value="selectedRelationship.sourceFieldId" :options="getFieldOptions(selectedRelationship.sourceEntityId)" />
                </NFormItem>
                <NFormItem :label="$t('page.lowcode.entity.targetField')">
                  <NSelect v-model:value="selectedRelationship.targetFieldId" :options="getFieldOptions(selectedRelationship.targetEntityId)" />
                </NFormItem>
                <NFormItem :label="$t('page.lowcode.entity.relationshipName')">
                  <NInput v-model:value="selectedRelationship.name" />
                </NFormItem>
              </NForm>
            </div>

            <!-- 空状态 -->
            <div v-else class="text-center py-8">
              <NEmpty :description="$t('page.lowcode.entity.selectEntityOrRelationship')" />
            </div>
          </NCard>
        </NGridItem>
      </NGrid>
    </div>

    <!-- 关系创建模态框 -->
    <NModal v-model:show="showRelationshipModal" preset="card" style="width: 600px">
      <template #header>
        {{ $t('page.lowcode.entity.createRelationship') }}
      </template>
      
      <NForm ref="relationshipFormRef" :model="newRelationship" :rules="relationshipRules" label-placement="left" :label-width="120">
        <NFormItem :label="$t('page.lowcode.entity.relationshipType')" path="type">
          <NSelect v-model:value="newRelationship.type" :options="relationshipTypeOptions" />
        </NFormItem>
        <NFormItem :label="$t('page.lowcode.entity.sourceEntity')" path="sourceEntityId">
          <NSelect v-model:value="newRelationship.sourceEntityId" :options="entityOptions" />
        </NFormItem>
        <NFormItem :label="$t('page.lowcode.entity.targetEntity')" path="targetEntityId">
          <NSelect v-model:value="newRelationship.targetEntityId" :options="entityOptions" />
        </NFormItem>
        <NFormItem :label="$t('page.lowcode.entity.sourceField')" path="sourceFieldId">
          <NSelect v-model:value="newRelationship.sourceFieldId" :options="getFieldOptions(newRelationship.sourceEntityId)" />
        </NFormItem>
        <NFormItem :label="$t('page.lowcode.entity.targetField')" path="targetFieldId">
          <NSelect v-model:value="newRelationship.targetFieldId" :options="getFieldOptions(newRelationship.targetEntityId)" />
        </NFormItem>
        <NFormItem :label="$t('page.lowcode.entity.relationshipName')" path="name">
          <NInput v-model:value="newRelationship.name" />
        </NFormItem>
      </NForm>

      <template #footer>
        <NSpace justify="end">
          <NButton @click="showRelationshipModal = false">{{ $t('common.cancel') }}</NButton>
          <NButton type="primary" @click="handleCreateRelationship">{{ $t('common.create') }}</NButton>
        </NSpace>
      </template>
    </NModal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, nextTick } from 'vue';
import type { FormInst, FormRules } from 'naive-ui';
import { $t } from '@/locales';
import { createRequiredFormRule } from '@/utils/form/rule';

interface Props {
  projectId: string;
}

const props = defineProps<Props>();

interface Field {
  id: string;
  name: string;
  code: string;
  dataType: string;
  primaryKey: boolean;
}

interface Entity {
  id: string;
  name: string;
  code: string;
  tableName: string;
  description?: string;
  fields: Field[];
}

interface CanvasEntity extends Entity {
  x: number;
  y: number;
}

interface Relationship {
  id: string;
  type: string;
  sourceEntityId: string;
  targetEntityId: string;
  sourceFieldId: string;
  targetFieldId: string;
  name: string;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
}

// State
const entities = ref<Entity[]>([]);
const canvasEntities = ref<CanvasEntity[]>([]);
const relationships = ref<Relationship[]>([]);
const selectedEntityId = ref<string>('');
const selectedEntity = ref<Entity | null>(null);
const selectedRelationship = ref<Relationship | null>(null);
const showRelationshipModal = ref(false);
const saving = ref(false);
const canvasRef = ref<HTMLElement | null>(null);
const canvasWidth = ref(800);
const canvasHeight = ref(600);
const relationshipFormRef = ref<FormInst | null>(null);

// Form
const newRelationship = reactive({
  type: 'ONE_TO_MANY',
  sourceEntityId: '',
  targetEntityId: '',
  sourceFieldId: '',
  targetFieldId: '',
  name: ''
});

// Computed
const entityOptions = computed(() => 
  entities.value.map(entity => ({ label: entity.name, value: entity.id }))
);

// Options
const relationshipTypeOptions = [
  { label: $t('page.lowcode.entity.relationshipTypes.ONE_TO_ONE'), value: 'ONE_TO_ONE' },
  { label: $t('page.lowcode.entity.relationshipTypes.ONE_TO_MANY'), value: 'ONE_TO_MANY' },
  { label: $t('page.lowcode.entity.relationshipTypes.MANY_TO_ONE'), value: 'MANY_TO_ONE' },
  { label: $t('page.lowcode.entity.relationshipTypes.MANY_TO_MANY'), value: 'MANY_TO_MANY' }
];

// Form rules
const relationshipRules: FormRules = {
  type: createRequiredFormRule($t('page.lowcode.entity.relationshipTypeRequired')),
  sourceEntityId: createRequiredFormRule($t('page.lowcode.entity.sourceEntityRequired')),
  targetEntityId: createRequiredFormRule($t('page.lowcode.entity.targetEntityRequired')),
  sourceFieldId: createRequiredFormRule($t('page.lowcode.entity.sourceFieldRequired')),
  targetFieldId: createRequiredFormRule($t('page.lowcode.entity.targetFieldRequired')),
  name: createRequiredFormRule($t('page.lowcode.entity.relationshipNameRequired'))
};

// Methods
function getFieldOptions(entityId: string) {
  const entity = entities.value.find(e => e.id === entityId);
  return entity ? entity.fields.map(field => ({ label: field.name, value: field.id })) : [];
}

function handleSelectEntity(entityId: string) {
  selectedEntityId.value = entityId;
  selectedEntity.value = entities.value.find(e => e.id === entityId) || null;
  selectedRelationship.value = null;
}

function handleEntityDragStart(entity: Entity, event: DragEvent) {
  if (event.dataTransfer) {
    event.dataTransfer.setData('text/plain', entity.id);
  }
}

function handleCanvasDragOver(event: DragEvent) {
  event.preventDefault();
}

function handleCanvasDrop(event: DragEvent) {
  event.preventDefault();
  const entityId = event.dataTransfer?.getData('text/plain');
  if (entityId && canvasRef.value) {
    const rect = canvasRef.value.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    const entity = entities.value.find(e => e.id === entityId);
    if (entity && !canvasEntities.value.find(ce => ce.id === entityId)) {
      canvasEntities.value.push({
        ...entity,
        x: x - 100, // Center the entity
        y: y - 50
      });
    }
  }
}

function handleCanvasClick() {
  selectedEntity.value = null;
  selectedRelationship.value = null;
  selectedEntityId.value = '';
}

function handleEntityNodeClick(entityNode: CanvasEntity) {
  selectedEntity.value = entityNode;
  selectedRelationship.value = null;
  selectedEntityId.value = entityNode.id;
}

function handleRelationshipClick(relationship: Relationship) {
  selectedRelationship.value = relationship;
  selectedEntity.value = null;
  selectedEntityId.value = '';
}

function handleEntityMouseDown(entityNode: CanvasEntity, event: MouseEvent) {
  // Implement entity dragging logic
  const startX = event.clientX - entityNode.x;
  const startY = event.clientY - entityNode.y;
  
  function handleMouseMove(e: MouseEvent) {
    entityNode.x = e.clientX - startX;
    entityNode.y = e.clientY - startY;
    updateRelationshipLines();
  }
  
  function handleMouseUp() {
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  }
  
  document.addEventListener('mousemove', handleMouseMove);
  document.addEventListener('mouseup', handleMouseUp);
}

function handleRemoveEntityFromCanvas(entityNode: CanvasEntity) {
  const index = canvasEntities.value.findIndex(ce => ce.id === entityNode.id);
  if (index > -1) {
    canvasEntities.value.splice(index, 1);
    // Remove related relationships
    relationships.value = relationships.value.filter(
      r => r.sourceEntityId !== entityNode.id && r.targetEntityId !== entityNode.id
    );
  }
}

function handleAddEntity() {
  window.$message?.info('添加实体功能开发中');
}

function handleAutoLayout() {
  // Implement auto layout algorithm
  const padding = 50;
  const entityWidth = 200;
  const entityHeight = 150;
  const cols = Math.ceil(Math.sqrt(canvasEntities.value.length));
  
  canvasEntities.value.forEach((entity, index) => {
    const row = Math.floor(index / cols);
    const col = index % cols;
    entity.x = padding + col * (entityWidth + padding);
    entity.y = padding + row * (entityHeight + padding);
  });
  
  updateRelationshipLines();
}

function handleZoomIn() {
  // Implement zoom in
  window.$message?.info('放大功能开发中');
}

function handleZoomOut() {
  // Implement zoom out
  window.$message?.info('缩小功能开发中');
}

function handleResetZoom() {
  // Implement reset zoom
  window.$message?.info('重置缩放功能开发中');
}

async function handleSave() {
  try {
    saving.value = true;
    
    // Mock save
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    window.$message?.success($t('common.saveSuccess'));
  } catch (error) {
    window.$message?.error($t('common.saveFailed'));
  } finally {
    saving.value = false;
  }
}

async function handleCreateRelationship() {
  await relationshipFormRef.value?.validate();
  
  const sourceEntity = canvasEntities.value.find(e => e.id === newRelationship.sourceEntityId);
  const targetEntity = canvasEntities.value.find(e => e.id === newRelationship.targetEntityId);
  
  if (sourceEntity && targetEntity) {
    const relationship: Relationship = {
      id: `rel_${Date.now()}`,
      ...newRelationship,
      startX: sourceEntity.x + 100,
      startY: sourceEntity.y + 75,
      endX: targetEntity.x + 100,
      endY: targetEntity.y + 75
    };
    
    relationships.value.push(relationship);
    showRelationshipModal.value = false;
    
    // Reset form
    Object.assign(newRelationship, {
      type: 'ONE_TO_MANY',
      sourceEntityId: '',
      targetEntityId: '',
      sourceFieldId: '',
      targetFieldId: '',
      name: ''
    });
  }
}

function updateRelationshipLines() {
  relationships.value.forEach(relationship => {
    const sourceEntity = canvasEntities.value.find(e => e.id === relationship.sourceEntityId);
    const targetEntity = canvasEntities.value.find(e => e.id === relationship.targetEntityId);
    
    if (sourceEntity && targetEntity) {
      relationship.startX = sourceEntity.x + 100;
      relationship.startY = sourceEntity.y + 75;
      relationship.endX = targetEntity.x + 100;
      relationship.endY = targetEntity.y + 75;
    }
  });
}

async function loadEntities() {
  try {
    // Mock data
    entities.value = [
      {
        id: 'entity_1',
        name: 'User',
        code: 'user',
        tableName: 'users',
        description: 'User entity',
        fields: [
          { id: 'field_1', name: 'ID', code: 'id', dataType: 'BIGINT', primaryKey: true },
          { id: 'field_2', name: 'Username', code: 'username', dataType: 'STRING', primaryKey: false },
          { id: 'field_3', name: 'Email', code: 'email', dataType: 'STRING', primaryKey: false }
        ]
      },
      {
        id: 'entity_2',
        name: 'Order',
        code: 'order',
        tableName: 'orders',
        description: 'Order entity',
        fields: [
          { id: 'field_4', name: 'ID', code: 'id', dataType: 'BIGINT', primaryKey: true },
          { id: 'field_5', name: 'User ID', code: 'user_id', dataType: 'BIGINT', primaryKey: false },
          { id: 'field_6', name: 'Total', code: 'total', dataType: 'DECIMAL', primaryKey: false }
        ]
      }
    ];
  } catch (error) {
    console.error('Failed to load entities:', error);
    window.$message?.error($t('page.lowcode.entity.loadFailed'));
  }
}

// Lifecycle
onMounted(() => {
  loadEntities();
  
  // Set canvas size
  nextTick(() => {
    if (canvasRef.value) {
      canvasWidth.value = canvasRef.value.clientWidth;
      canvasHeight.value = canvasRef.value.clientHeight;
    }
  });
});
</script>

<style scoped>
.entity-relationship-designer {
  @apply p-6;
}

.entity-list {
  @apply space-y-2;
}

.entity-item {
  @apply p-3 border border-gray-200 rounded cursor-pointer hover:bg-gray-50;
}

.entity-item.active {
  @apply border-blue-500 bg-blue-50;
}

.entity-header {
  @apply flex items-center space-x-2 font-bold;
}

.entity-fields {
  @apply mt-2 space-y-1;
}

.field-item {
  @apply flex items-center space-x-1 text-sm text-gray-600;
}

.field-icon {
  @apply w-3 h-3;
}

.field-icon.pk {
  @apply text-red-500;
}

.field-more {
  @apply text-xs text-gray-400 italic;
}

.design-canvas {
  @apply relative w-full h-96 border border-gray-200 rounded overflow-hidden;
  background-image: radial-gradient(circle, #ccc 1px, transparent 1px);
  background-size: 20px 20px;
}

.entity-node {
  @apply absolute bg-white border border-gray-300 rounded shadow-md cursor-move;
  width: 200px;
  min-height: 150px;
}

.entity-node-header {
  @apply flex justify-between items-center p-2 bg-gray-100 border-b border-gray-200 font-bold;
}

.entity-node-fields {
  @apply p-2 space-y-1;
}

.entity-node-field {
  @apply flex items-center space-x-1 text-sm;
}

.entity-node-field.pk {
  @apply font-bold text-red-600;
}

.relationship-lines {
  @apply absolute top-0 left-0 pointer-events-none;
}

.relationship-lines line {
  @apply pointer-events-auto cursor-pointer;
}

.relationship-label {
  @apply text-xs fill-gray-600 pointer-events-auto cursor-pointer;
}
</style>
