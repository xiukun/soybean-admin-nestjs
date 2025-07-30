<template>
  <div class="enhanced-relationship-designer">
    <!-- 工具栏 -->
    <div class="toolbar mb-4">
      <NSpace justify="space-between" align="center">
        <NSpace>
          <NButton type="primary" @click="addEntity">
            <template #icon>
              <NIcon><icon-mdi-plus /></NIcon>
            </template>
            添加实体
          </NButton>
          <NButton @click="addRelationship" :disabled="selectedEntities.length < 2">
            <template #icon>
              <NIcon><icon-mdi-link /></NIcon>
            </template>
            添加关系
          </NButton>
          <NButton @click="autoLayout">
            <template #icon>
              <NIcon><icon-mdi-auto-fix /></NIcon>
            </template>
            自动布局
          </NButton>
        </NSpace>
        <NSpace>
          <NButton @click="exportSchema">
            <template #icon>
              <NIcon><icon-mdi-export /></NIcon>
            </template>
            导出模式
          </NButton>
          <NButton @click="generateCode">
            <template #icon>
              <NIcon><icon-mdi-code-braces /></NIcon>
            </template>
            生成代码
          </NButton>
        </NSpace>
      </NSpace>
    </div>

    <!-- 设计画布 -->
    <div class="design-canvas" ref="canvasRef">
      <svg 
        :width="canvasWidth" 
        :height="canvasHeight"
        @click="handleCanvasClick"
        @mousemove="handleMouseMove"
        @mouseup="handleMouseUp"
      >
        <!-- 网格背景 -->
        <defs>
          <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#e0e0e0" stroke-width="1"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />

        <!-- 关系连线 -->
        <g class="relationships">
          <line
            v-for="relationship in relationships"
            :key="relationship.id"
            :x1="getEntityCenter(relationship.sourceEntity).x"
            :y1="getEntityCenter(relationship.sourceEntity).y"
            :x2="getEntityCenter(relationship.targetEntity).x"
            :y2="getEntityCenter(relationship.targetEntity).y"
            :stroke="getRelationshipColor(relationship.type)"
            stroke-width="2"
            :marker-end="getRelationshipMarker(relationship.type)"
            @click="selectRelationship(relationship)"
            class="relationship-line"
          />
          
          <!-- 关系标签 -->
          <text
            v-for="relationship in relationships"
            :key="`label-${relationship.id}`"
            :x="getRelationshipLabelPosition(relationship).x"
            :y="getRelationshipLabelPosition(relationship).y"
            text-anchor="middle"
            class="relationship-label"
            @click="editRelationship(relationship)"
          >
            {{ getRelationshipLabel(relationship.type) }}
          </text>
        </g>

        <!-- 实体节点 -->
        <g class="entities">
          <g
            v-for="entity in entities"
            :key="entity.id"
            :transform="`translate(${entity.x}, ${entity.y})`"
            @mousedown="handleEntityMouseDown(entity, $event)"
            @click="selectEntity(entity)"
            :class="{ 'selected': selectedEntities.includes(entity.id) }"
            class="entity-node"
          >
            <!-- 实体框 -->
            <rect
              :width="entityWidth"
              :height="getEntityHeight(entity)"
              rx="8"
              :fill="entity.color || '#ffffff'"
              stroke="#d0d0d0"
              stroke-width="2"
              class="entity-rect"
            />
            
            <!-- 实体标题 -->
            <rect
              :width="entityWidth"
              height="40"
              rx="8"
              :fill="entity.color || '#f5f5f5'"
              stroke="none"
              class="entity-header"
            />
            <text
              :x="entityWidth / 2"
              y="25"
              text-anchor="middle"
              class="entity-title"
              font-weight="bold"
            >
              {{ entity.name }}
            </text>
            
            <!-- 字段列表 -->
            <g class="entity-fields">
              <g
                v-for="(field, index) in entity.fields"
                :key="field.id"
                :transform="`translate(0, ${40 + index * 25})`"
              >
                <rect
                  :width="entityWidth"
                  height="25"
                  fill="transparent"
                  class="field-row"
                />
                <text
                  x="10"
                  y="17"
                  class="field-name"
                  :class="{ 'primary-key': field.isPrimaryKey, 'foreign-key': field.isForeignKey }"
                >
                  {{ field.name }}
                </text>
                <text
                  :x="entityWidth - 10"
                  y="17"
                  text-anchor="end"
                  class="field-type"
                >
                  {{ field.dataType }}
                </text>
              </g>
            </g>
          </g>
        </g>
      </svg>
    </div>

    <!-- 属性面板 -->
    <div class="property-panel" v-if="selectedEntity || selectedRelationship">
      <NCard title="属性设置" size="small">
        <!-- 实体属性 -->
        <div v-if="selectedEntity">
          <NForm :model="selectedEntity" label-placement="left" :label-width="80">
            <NFormItem label="实体名称">
              <NInput v-model:value="selectedEntity.name" />
            </NFormItem>
            <NFormItem label="表名">
              <NInput v-model:value="selectedEntity.tableName" />
            </NFormItem>
            <NFormItem label="颜色">
              <NColorPicker v-model:value="selectedEntity.color" />
            </NFormItem>
            <NFormItem label="描述">
              <NInput v-model:value="selectedEntity.description" type="textarea" :rows="3" />
            </NFormItem>
          </NForm>
        </div>

        <!-- 关系属性 -->
        <div v-if="selectedRelationship">
          <NForm :model="selectedRelationship" label-placement="left" :label-width="80">
            <NFormItem label="关系类型">
              <NSelect 
                v-model:value="selectedRelationship.type" 
                :options="relationshipTypeOptions"
              />
            </NFormItem>
            <NFormItem label="关系名称">
              <NInput v-model:value="selectedRelationship.name" />
            </NFormItem>
            <NFormItem label="级联删除">
              <NSwitch v-model:value="selectedRelationship.cascadeDelete" />
            </NFormItem>
            <NFormItem label="级联更新">
              <NSwitch v-model:value="selectedRelationship.cascadeUpdate" />
            </NFormItem>
          </NForm>
        </div>
      </NCard>
    </div>

    <!-- 关系创建对话框 -->
    <NModal v-model:show="showRelationshipModal" preset="card" title="创建关系" style="width: 600px">
      <NForm ref="relationshipFormRef" :model="relationshipForm" :rules="relationshipRules">
        <NFormItem label="源实体" path="sourceEntity">
          <NSelect 
            v-model:value="relationshipForm.sourceEntity" 
            :options="entityOptions"
            placeholder="选择源实体"
          />
        </NFormItem>
        <NFormItem label="目标实体" path="targetEntity">
          <NSelect 
            v-model:value="relationshipForm.targetEntity" 
            :options="entityOptions"
            placeholder="选择目标实体"
          />
        </NFormItem>
        <NFormItem label="关系类型" path="type">
          <NSelect 
            v-model:value="relationshipForm.type" 
            :options="relationshipTypeOptions"
            placeholder="选择关系类型"
          />
        </NFormItem>
        <NFormItem label="关系名称" path="name">
          <NInput v-model:value="relationshipForm.name" placeholder="输入关系名称" />
        </NFormItem>
        <NFormItem label="外键字段名" path="foreignKeyField">
          <NInput v-model:value="relationshipForm.foreignKeyField" placeholder="自动生成" />
        </NFormItem>
        <NGrid :cols="2" :x-gap="16">
          <NGridItem>
            <NFormItem label="级联删除">
              <NSwitch v-model:value="relationshipForm.cascadeDelete" />
            </NFormItem>
          </NGridItem>
          <NGridItem>
            <NFormItem label="级联更新">
              <NSwitch v-model:value="relationshipForm.cascadeUpdate" />
            </NFormItem>
          </NGridItem>
        </NGrid>
      </NForm>
      
      <template #footer>
        <NSpace justify="end">
          <NButton @click="showRelationshipModal = false">取消</NButton>
          <NButton type="primary" @click="handleCreateRelationship">创建</NButton>
        </NSpace>
      </template>
    </NModal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, nextTick } from 'vue';
import type { FormInst, FormRules } from 'naive-ui';

interface Entity {
  id: string;
  name: string;
  tableName: string;
  description?: string;
  color?: string;
  x: number;
  y: number;
  fields: EntityField[];
}

interface EntityField {
  id: string;
  name: string;
  dataType: string;
  isPrimaryKey: boolean;
  isForeignKey: boolean;
  isRequired: boolean;
}

interface Relationship {
  id: string;
  name: string;
  type: 'ONE_TO_ONE' | 'ONE_TO_MANY' | 'MANY_TO_ONE' | 'MANY_TO_MANY';
  sourceEntity: string;
  targetEntity: string;
  foreignKeyField?: string;
  cascadeDelete: boolean;
  cascadeUpdate: boolean;
}

const props = defineProps<{
  projectId?: string;
}>();

// 响应式数据
const canvasRef = ref<HTMLElement>();
const canvasWidth = ref(1200);
const canvasHeight = ref(800);
const entityWidth = 200;

const entities = ref<Entity[]>([]);
const relationships = ref<Relationship[]>([]);
const selectedEntities = ref<string[]>([]);
const selectedEntity = ref<Entity | null>(null);
const selectedRelationship = ref<Relationship | null>(null);

const showRelationshipModal = ref(false);
const relationshipFormRef = ref<FormInst>();
const relationshipForm = reactive({
  sourceEntity: '',
  targetEntity: '',
  type: 'ONE_TO_MANY' as const,
  name: '',
  foreignKeyField: '',
  cascadeDelete: false,
  cascadeUpdate: false
});

// 拖拽相关
const isDragging = ref(false);
const dragEntity = ref<Entity | null>(null);
const dragOffset = ref({ x: 0, y: 0 });

// 计算属性
const entityOptions = computed(() => 
  entities.value.map(entity => ({
    label: entity.name,
    value: entity.id
  }))
);

const relationshipTypeOptions = [
  { label: '一对一', value: 'ONE_TO_ONE' },
  { label: '一对多', value: 'ONE_TO_MANY' },
  { label: '多对一', value: 'MANY_TO_ONE' },
  { label: '多对多', value: 'MANY_TO_MANY' }
];

const relationshipRules: FormRules = {
  sourceEntity: { required: true, message: '请选择源实体' },
  targetEntity: { required: true, message: '请选择目标实体' },
  type: { required: true, message: '请选择关系类型' },
  name: { required: true, message: '请输入关系名称' }
};

// 方法
const getEntityHeight = (entity: Entity) => {
  return 40 + entity.fields.length * 25 + 10;
};

const getEntityCenter = (entityId: string) => {
  const entity = entities.value.find(e => e.id === entityId);
  if (!entity) return { x: 0, y: 0 };
  return {
    x: entity.x + entityWidth / 2,
    y: entity.y + getEntityHeight(entity) / 2
  };
};

const getRelationshipColor = (type: string) => {
  const colors = {
    'ONE_TO_ONE': '#52c41a',
    'ONE_TO_MANY': '#1890ff',
    'MANY_TO_ONE': '#fa8c16',
    'MANY_TO_MANY': '#eb2f96'
  };
  return colors[type] || '#666666';
};

const getRelationshipMarker = (type: string) => {
  return 'url(#arrow)';
};

const getRelationshipLabel = (type: string) => {
  const labels = {
    'ONE_TO_ONE': '1:1',
    'ONE_TO_MANY': '1:N',
    'MANY_TO_ONE': 'N:1',
    'MANY_TO_MANY': 'N:N'
  };
  return labels[type] || '';
};

const getRelationshipLabelPosition = (relationship: Relationship) => {
  const source = getEntityCenter(relationship.sourceEntity);
  const target = getEntityCenter(relationship.targetEntity);
  return {
    x: (source.x + target.x) / 2,
    y: (source.y + target.y) / 2 - 5
  };
};

const addEntity = () => {
  const newEntity: Entity = {
    id: `entity_${Date.now()}`,
    name: `新实体${entities.value.length + 1}`,
    tableName: `new_entity_${entities.value.length + 1}`,
    x: Math.random() * (canvasWidth.value - entityWidth),
    y: Math.random() * (canvasHeight.value - 200),
    color: '#ffffff',
    fields: [
      {
        id: 'id',
        name: 'id',
        dataType: 'UUID',
        isPrimaryKey: true,
        isForeignKey: false,
        isRequired: true
      }
    ]
  };
  entities.value.push(newEntity);
};

const addRelationship = () => {
  if (selectedEntities.value.length >= 2) {
    relationshipForm.sourceEntity = selectedEntities.value[0];
    relationshipForm.targetEntity = selectedEntities.value[1];
    showRelationshipModal.value = true;
  }
};

const handleCreateRelationship = async () => {
  try {
    await relationshipFormRef.value?.validate();
    
    const newRelationship: Relationship = {
      id: `rel_${Date.now()}`,
      ...relationshipForm
    };
    
    relationships.value.push(newRelationship);
    showRelationshipModal.value = false;
    
    // 重置表单
    Object.assign(relationshipForm, {
      sourceEntity: '',
      targetEntity: '',
      type: 'ONE_TO_MANY',
      name: '',
      foreignKeyField: '',
      cascadeDelete: false,
      cascadeUpdate: false
    });
    
    window.$message?.success('关系创建成功');
  } catch (error) {
    console.error('创建关系失败:', error);
  }
};

const selectEntity = (entity: Entity) => {
  selectedEntity.value = entity;
  selectedRelationship.value = null;
  
  if (selectedEntities.value.includes(entity.id)) {
    selectedEntities.value = selectedEntities.value.filter(id => id !== entity.id);
  } else {
    selectedEntities.value.push(entity.id);
  }
};

const selectRelationship = (relationship: Relationship) => {
  selectedRelationship.value = relationship;
  selectedEntity.value = null;
  selectedEntities.value = [];
};

const handleEntityMouseDown = (entity: Entity, event: MouseEvent) => {
  isDragging.value = true;
  dragEntity.value = entity;
  dragOffset.value = {
    x: event.clientX - entity.x,
    y: event.clientY - entity.y
  };
  event.preventDefault();
};

const handleMouseMove = (event: MouseEvent) => {
  if (isDragging.value && dragEntity.value) {
    const rect = canvasRef.value?.getBoundingClientRect();
    if (rect) {
      dragEntity.value.x = event.clientX - rect.left - dragOffset.value.x;
      dragEntity.value.y = event.clientY - rect.top - dragOffset.value.y;
    }
  }
};

const handleMouseUp = () => {
  isDragging.value = false;
  dragEntity.value = null;
};

const handleCanvasClick = (event: MouseEvent) => {
  if (event.target === event.currentTarget) {
    selectedEntity.value = null;
    selectedRelationship.value = null;
    selectedEntities.value = [];
  }
};

const autoLayout = () => {
  // 简单的自动布局算法
  const padding = 50;
  const cols = Math.ceil(Math.sqrt(entities.value.length));
  
  entities.value.forEach((entity, index) => {
    const row = Math.floor(index / cols);
    const col = index % cols;
    entity.x = padding + col * (entityWidth + padding);
    entity.y = padding + row * 250;
  });
};

const exportSchema = () => {
  const schema = {
    entities: entities.value,
    relationships: relationships.value
  };
  
  const blob = new Blob([JSON.stringify(schema, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'entity-schema.json';
  a.click();
  URL.revokeObjectURL(url);
};

const generateCode = () => {
  // 生成代码逻辑
  window.$message?.info('代码生成功能开发中...');
};

// 生命周期
onMounted(() => {
  // 初始化一些示例数据
  addEntity();
  addEntity();
});
</script>

<style scoped>
.enhanced-relationship-designer {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.design-canvas {
  flex: 1;
  border: 1px solid #d0d0d0;
  border-radius: 8px;
  overflow: hidden;
  position: relative;
}

.entity-node {
  cursor: move;
  transition: all 0.2s ease;
}

.entity-node:hover .entity-rect {
  stroke: #1890ff;
  stroke-width: 3px;
}

.entity-node.selected .entity-rect {
  stroke: #52c41a;
  stroke-width: 3px;
}

.entity-title {
  font-size: 14px;
  fill: #333;
}

.field-name {
  font-size: 12px;
  fill: #666;
}

.field-name.primary-key {
  fill: #52c41a;
  font-weight: bold;
}

.field-name.foreign-key {
  fill: #1890ff;
}

.field-type {
  font-size: 11px;
  fill: #999;
}

.relationship-line {
  cursor: pointer;
  transition: stroke-width 0.2s ease;
}

.relationship-line:hover {
  stroke-width: 3px;
}

.relationship-label {
  font-size: 12px;
  fill: #333;
  cursor: pointer;
  background: white;
  padding: 2px 4px;
  border-radius: 4px;
}

.property-panel {
  position: absolute;
  top: 60px;
  right: 20px;
  width: 300px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  z-index: 10;
}
</style>