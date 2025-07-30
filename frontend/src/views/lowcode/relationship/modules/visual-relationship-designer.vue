<template>
  <div class="visual-relationship-designer">
    <!-- 工具栏 -->
    <div class="toolbar">
      <NSpace align="center" justify="space-between">
        <NSpace>
          <NButton size="small" @click="autoLayout">
            <template #icon>
              <NIcon><icon-mdi-auto-fix-high /></NIcon>
            </template>
            {{ $t('page.lowcode.relationship.autoLayout') }}
          </NButton>
          <NButton size="small" @click="zoomIn">
            <template #icon>
              <NIcon><icon-mdi-magnify-plus /></NIcon>
            </template>
            {{ $t('page.lowcode.relationship.zoomIn') }}
          </NButton>
          <NButton size="small" @click="zoomOut">
            <template #icon>
              <NIcon><icon-mdi-magnify-minus /></NIcon>
            </template>
            {{ $t('page.lowcode.relationship.zoomOut') }}
          </NButton>
          <NButton size="small" @click="resetZoom">
            <template #icon>
              <NIcon><icon-mdi-magnify /></NIcon>
            </template>
            {{ $t('page.lowcode.relationship.resetZoom') }}
          </NButton>
          <NButton size="small" @click="fitToScreen">
            <template #icon>
              <NIcon><icon-mdi-fit-to-screen /></NIcon>
            </template>
            {{ $t('page.lowcode.relationship.fitToScreen') }}
          </NButton>
        </NSpace>
        <NSpace>
          <NButton size="small" @click="showRecommendations = true">
            <template #icon>
              <NIcon><icon-mdi-lightbulb /></NIcon>
            </template>
            {{ $t('page.lowcode.relationship.smartRecommendations') }}
          </NButton>
          <NButton size="small" @click="generateOptimizationReport">
            <template #icon>
              <NIcon><icon-mdi-chart-line /></NIcon>
            </template>
            {{ $t('page.lowcode.relationship.performanceAnalysis') }}
          </NButton>
          <NButton size="small" @click="exportImage">
            <template #icon>
              <NIcon><icon-mdi-download /></NIcon>
            </template>
            {{ $t('page.lowcode.relationship.exportImage') }}
          </NButton>
        </NSpace>
      </NSpace>
    </div>

    <!-- 设计画布 -->
    <div class="canvas-container" ref="canvasContainer">
      <svg
        ref="svgCanvas"
        class="design-canvas"
        :width="canvasWidth"
        :height="canvasHeight"
        :viewBox="`0 0 ${canvasWidth} ${canvasHeight}`"
        @mousedown="handleCanvasMouseDown"
        @mousemove="handleCanvasMouseMove"
        @mouseup="handleCanvasMouseUp"
      >
        <!-- 网格背景 -->
        <defs>
          <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#e0e0e0" stroke-width="1"/>
          </pattern>
          <!-- 关系箭头标记 -->
          <marker id="arrowhead" markerWidth="10" markerHeight="7" 
                  refX="9" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" fill="#666" />
          </marker>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />

        <!-- 关系连线 -->
        <g class="relationships">
          <line
            v-for="relationship in relationships"
            :key="relationship.id"
            :x1="getEntityCenter(relationship.sourceEntityId).x"
            :y1="getEntityCenter(relationship.sourceEntityId).y"
            :x2="getEntityCenter(relationship.targetEntityId).x"
            :y2="getEntityCenter(relationship.targetEntityId).y"
            :stroke="getRelationshipColor(relationship.type)"
            stroke-width="2"
            marker-end="url(#arrowhead)"
            @click="selectRelationship(relationship)"
            class="relationship-line"
            :class="{ selected: selectedRelationship?.id === relationship.id }"
          />
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
            class="entity-node"
            :class="{ selected: selectedEntity?.id === entity.id }"
          >
            <rect
              width="200"
              height="120"
              rx="8"
              :fill="getEntityColor(entity.category)"
              stroke="#333"
              stroke-width="2"
              class="entity-rect"
            />
            <text x="100" y="20" text-anchor="middle" class="entity-title">
              {{ entity.name }}
            </text>
            <text x="100" y="40" text-anchor="middle" class="entity-code">
              {{ entity.code }}
            </text>
            <line x1="10" y1="50" x2="190" y2="50" stroke="#ccc" stroke-width="1" />
            
            <!-- 字段列表 -->
            <g class="entity-fields">
              <text
                v-for="(field, index) in getEntityFields(entity.id).slice(0, 4)"
                :key="field.id"
                :x="15"
                :y="70 + index * 12"
                class="field-text"
              >
                {{ field.name }} ({{ field.dataType }})
              </text>
              <text
                v-if="getEntityFields(entity.id).length > 4"
                x="15"
                y="118"
                class="field-text more-fields"
              >
                +{{ getEntityFields(entity.id).length - 4 }} more...
              </text>
            </g>
          </g>
        </g>
      </svg>
    </div>

    <!-- 属性面板 -->
    <div class="properties-panel" v-if="selectedEntity || selectedRelationship">
      <NCard size="small" :title="selectedEntity ? '实体属性' : '关系属性'">
        <!-- 实体属性 -->
        <div v-if="selectedEntity">
          <NForm :model="selectedEntity" size="small">
            <NFormItem label="实体名称">
              <NInput v-model:value="selectedEntity.name" readonly />
            </NFormItem>
            <NFormItem label="实体代码">
              <NInput v-model:value="selectedEntity.code" readonly />
            </NFormItem>
            <NFormItem label="表名">
              <NInput v-model:value="selectedEntity.tableName" readonly />
            </NFormItem>
            <NFormItem label="分类">
              <NTag>{{ getCategoryLabel(selectedEntity.category) }}</NTag>
            </NFormItem>
            <NFormItem label="字段数量">
              <NText>{{ getEntityFields(selectedEntity.id).length }}</NText>
            </NFormItem>
          </NForm>
        </div>

        <!-- 关系属性 -->
        <div v-if="selectedRelationship">
          <NForm :model="selectedRelationship" size="small">
            <NFormItem label="关系名称">
              <NInput v-model:value="selectedRelationship.name" @blur="updateRelationship" />
            </NFormItem>
            <NFormItem label="关系类型">
              <NSelect
                v-model:value="selectedRelationship.type"
                :options="relationshipTypeOptions"
                @update:value="updateRelationship"
              />
            </NFormItem>
            <NFormItem label="源实体">
              <NText>{{ getEntityName(selectedRelationship.sourceEntityId) }}</NText>
            </NFormItem>
            <NFormItem label="目标实体">
              <NText>{{ getEntityName(selectedRelationship.targetEntityId) }}</NText>
            </NFormItem>
            <NFormItem label="外键字段">
              <NInput v-model:value="selectedRelationship.foreignKeyField" @blur="updateRelationship" />
            </NFormItem>
            <NFormItem label="级联删除">
              <NSwitch v-model:value="selectedRelationship.cascadeDelete" @update:value="updateRelationship" />
            </NFormItem>
            <NFormItem label="级联更新">
              <NSwitch v-model:value="selectedRelationship.cascadeUpdate" @update:value="updateRelationship" />
            </NFormItem>
          </NForm>
          <NSpace class="mt-4">
            <NButton size="small" type="primary" @click="saveRelationship">
              保存
            </NButton>
            <NButton size="small" @click="deleteRelationship">
              删除
            </NButton>
          </NSpace>
        </div>
      </NCard>
    </div>

    <!-- 关系推荐模态框 -->
    <NModal v-model:show="showRecommendations" preset="card" title="智能关系推荐" style="width: 800px">
      <div v-if="loadingRecommendations" class="text-center py-8">
        <NSpin size="large" />
        <div class="mt-4">正在分析关系模式...</div>
      </div>
      <div v-else-if="recommendations.length > 0">
        <div class="mb-4">
          <NAlert type="info" :show-icon="false">
            基于实体命名模式和业务逻辑，为您推荐以下关系：
          </NAlert>
        </div>
        <div class="space-y-4">
          <NCard
            v-for="rec in recommendations"
            :key="`${rec.sourceEntityId}-${rec.targetEntityId}`"
            size="small"
            class="recommendation-card"
          >
            <div class="flex justify-between items-start">
              <div class="flex-1">
                <div class="flex items-center gap-2 mb-2">
                  <NTag :type="getConfidenceColor(rec.confidence)">
                    置信度: {{ Math.round(rec.confidence * 100) }}%
                  </NTag>
                  <NTag>{{ rec.recommendedType }}</NTag>
                </div>
                <div class="text-sm text-gray-600 mb-2">
                  {{ getEntityName(rec.sourceEntityId) }} → {{ getEntityName(rec.targetEntityId) }}
                </div>
                <div class="text-sm">{{ rec.reason }}</div>
                <div class="text-xs text-gray-500 mt-1">
                  建议外键: {{ rec.suggestedForeignKey }}
                </div>
              </div>
              <NButton size="small" type="primary" @click="applyRecommendation(rec)">
                应用
              </NButton>
            </div>
          </NCard>
        </div>
      </div>
      <div v-else class="text-center py-8">
        <NEmpty description="暂无推荐关系" />
      </div>
    </NModal>

    <!-- 优化报告模态框 -->
    <NModal v-model:show="showOptimizationReport" preset="card" title="关系优化报告" style="width: 900px">
      <div v-if="loadingReport" class="text-center py-8">
        <NSpin size="large" />
        <div class="mt-4">正在生成优化报告...</div>
      </div>
      <div v-else-if="optimizationReport">
        <!-- 概览 -->
        <div class="grid grid-cols-4 gap-4 mb-6">
          <NStatistic label="实体数量" :value="optimizationReport.entityCount" />
          <NStatistic label="关系数量" :value="optimizationReport.relationshipCount" />
          <NStatistic label="问题数量" :value="optimizationReport.issues.length" />
          <NStatistic label="建议数量" :value="optimizationReport.recommendations.length" />
        </div>

        <!-- 性能指标 -->
        <NCard title="性能指标" size="small" class="mb-4">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <div class="text-sm text-gray-600">查询复杂度</div>
              <NProgress :percentage="optimizationReport.performanceMetrics.queryComplexity * 10" />
            </div>
            <div>
              <div class="text-sm text-gray-600">索引覆盖率</div>
              <NProgress :percentage="optimizationReport.performanceMetrics.indexCoverage" />
            </div>
          </div>
        </NCard>

        <!-- 问题列表 -->
        <NCard title="发现的问题" size="small" class="mb-4" v-if="optimizationReport.issues.length > 0">
          <div class="space-y-2">
            <div
              v-for="issue in optimizationReport.issues"
              :key="issue.entityId + issue.type"
              class="p-3 border rounded"
            >
              <div class="flex items-center gap-2 mb-1">
                <NTag :type="getSeverityColor(issue.severity)">{{ issue.severity }}</NTag>
                <span class="font-medium">{{ issue.description }}</span>
              </div>
              <div class="text-sm text-gray-600">{{ issue.solution }}</div>
            </div>
          </div>
        </NCard>

        <!-- 优化建议 -->
        <NCard title="优化建议" size="small" v-if="optimizationReport.recommendations.length > 0">
          <div class="space-y-2">
            <div
              v-for="rec in optimizationReport.recommendations"
              :key="rec.type + rec.priority"
              class="p-3 border rounded"
            >
              <div class="flex items-center gap-2 mb-1">
                <NTag>优先级 {{ rec.priority }}</NTag>
                <span class="font-medium">{{ rec.description }}</span>
              </div>
              <div class="text-sm text-gray-600 mb-1">{{ rec.expectedBenefit }}</div>
              <div class="text-xs text-gray-500">{{ rec.implementation }}</div>
            </div>
          </div>
        </NCard>
      </div>
    </NModal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue';
import { NButton, NSpace, NIcon, NCard, NForm, NFormItem, NInput, NSelect, NTag, NText, NSwitch, NModal, NSpin, NAlert, NEmpty, NStatistic, NProgress } from 'naive-ui';
import { $t } from '@/locales';
import { fetchGetAllEntities } from '@/service/api/lowcode-entity';
import { fetchGetAllFields } from '@/service/api/lowcode-field';
import { fetchGetRelationshipList, fetchUpdateRelationship, fetchDeleteRelationship } from '@/service/api/lowcode-relationship';

interface Props {
  projectId: string;
}

const props = defineProps<Props>();

// 响应式数据
const canvasContainer = ref<HTMLElement>();
const svgCanvas = ref<SVGElement>();
const canvasWidth = ref(1200);
const canvasHeight = ref(800);
const zoom = ref(1);

const entities = ref<any[]>([]);
const relationships = ref<any[]>([]);
const fields = ref<any[]>([]);
const selectedEntity = ref<any>(null);
const selectedRelationship = ref<any>(null);

const showRecommendations = ref(false);
const showOptimizationReport = ref(false);
const loadingRecommendations = ref(false);
const loadingReport = ref(false);
const recommendations = ref<any[]>([]);
const optimizationReport = ref<any>(null);

// 拖拽状态
const isDragging = ref(false);
const dragEntity = ref<any>(null);
const dragOffset = ref({ x: 0, y: 0 });

// 选项
const relationshipTypeOptions = [
  { label: '一对一', value: 'ONE_TO_ONE' },
  { label: '一对多', value: 'ONE_TO_MANY' },
  { label: '多对一', value: 'MANY_TO_ONE' },
  { label: '多对多', value: 'MANY_TO_MANY' }
];

// 计算属性
const getEntityFields = (entityId: string) => {
  return fields.value.filter(field => field.entityId === entityId);
};

// 方法
async function loadData() {
  try {
    // 加载实体
    const entitiesRes = await fetchGetAllEntities(props.projectId);
    if (entitiesRes.data) {
      entities.value = entitiesRes.data.map((entity: any, index: number) => ({
        ...entity,
        x: 100 + (index % 4) * 250,
        y: 100 + Math.floor(index / 4) * 200
      }));
    }

    // 加载字段
    const fieldsRes = await fetchGetAllFields({ projectId: props.projectId });
    if (fieldsRes.data) {
      fields.value = fieldsRes.data;
    }

    // 加载关系
    const relationshipsRes = await fetchGetRelationshipList({ 
      projectId: props.projectId,
      current: 1,
      size: 1000
    });
    if (relationshipsRes.data) {
      relationships.value = relationshipsRes.data.records || [];
    }
  } catch (error) {
    console.error('Failed to load data:', error);
  }
}

function getEntityCenter(entityId: string) {
  const entity = entities.value.find(e => e.id === entityId);
  if (!entity) return { x: 0, y: 0 };
  return {
    x: entity.x + 100,
    y: entity.y + 60
  };
}

function getRelationshipColor(type: string) {
  const colors = {
    'ONE_TO_ONE': '#1890ff',
    'ONE_TO_MANY': '#52c41a',
    'MANY_TO_ONE': '#faad14',
    'MANY_TO_MANY': '#f5222d'
  };
  return colors[type as keyof typeof colors] || '#666';
}

function getRelationshipLabel(type: string) {
  const labels = {
    'ONE_TO_ONE': '1:1',
    'ONE_TO_MANY': '1:N',
    'MANY_TO_ONE': 'N:1',
    'MANY_TO_MANY': 'N:N'
  };
  return labels[type as keyof typeof labels] || type;
}

function getRelationshipLabelPosition(relationship: any) {
  const source = getEntityCenter(relationship.sourceEntityId);
  const target = getEntityCenter(relationship.targetEntityId);
  return {
    x: (source.x + target.x) / 2,
    y: (source.y + target.y) / 2
  };
}

function getEntityColor(category: string) {
  const colors = {
    'core': '#e6f7ff',
    'business': '#f6ffed',
    'system': '#fff2e8',
    'config': '#f9f0ff',
    'lookup': '#fff1f0',
    'log': '#f0f0f0'
  };
  return colors[category as keyof typeof colors] || '#f5f5f5';
}

function getCategoryLabel(category: string) {
  const categoryMap: Record<string, string> = {
    core: '核心',
    business: '业务',
    system: '系统',
    config: '配置',
    lookup: '查找',
    log: '日志'
  };
  return categoryMap[category] || category;
}

function getEntityName(entityId: string) {
  const entity = entities.value.find(e => e.id === entityId);
  return entity?.name || entityId;
}

function selectRelationship(relationship: any) {
  selectedRelationship.value = relationship;
  selectedEntity.value = null;
}

function selectEntity(entity: any) {
  selectedEntity.value = entity;
  selectedRelationship.value = null;
}

function editRelationship(relationship: any) {
  selectRelationship(relationship);
}

async function updateRelationship() {
  if (!selectedRelationship.value) return;
  
  try {
    await fetchUpdateRelationship(selectedRelationship.value.id, selectedRelationship.value);
  } catch (error) {
    console.error('Failed to update relationship:', error);
  }
}

async function saveRelationship() {
  await updateRelationship();
}

async function deleteRelationship() {
  if (!selectedRelationship.value) return;
  
  try {
    await fetchDeleteRelationship(selectedRelationship.value.id);
    relationships.value = relationships.value.filter(r => r.id !== selectedRelationship.value.id);
    selectedRelationship.value = null;
  } catch (error) {
    console.error('Failed to delete relationship:', error);
  }
}

// 画布操作函数
function handleCanvasMouseDown(event: MouseEvent) {
  selectedEntity.value = null;
  selectedRelationship.value = null;
}

function handleCanvasMouseMove(event: MouseEvent) {
  if (isDragging.value && dragEntity.value) {
    const rect = svgCanvas.value?.getBoundingClientRect();
    if (rect) {
      dragEntity.value.x = event.clientX - rect.left - dragOffset.value.x;
      dragEntity.value.y = event.clientY - rect.top - dragOffset.value.y;
    }
  }
}

function handleCanvasMouseUp() {
  isDragging.value = false;
  dragEntity.value = null;
}

function handleEntityMouseDown(entity: any, event: MouseEvent) {
  event.stopPropagation();
  selectEntity(entity);
  
  isDragging.value = true;
  dragEntity.value = entity;
  
  const rect = svgCanvas.value?.getBoundingClientRect();
  if (rect) {
    dragOffset.value = {
      x: event.clientX - rect.left - entity.x,
      y: event.clientY - rect.top - entity.y
    };
  }
}

// 工具栏操作函数
function autoLayout() {
  entities.value.forEach((entity, index) => {
    entity.x = 100 + (index % 4) * 250;
    entity.y = 100 + Math.floor(index / 4) * 200;
  });
}

function zoomIn() {
  zoom.value = Math.min(zoom.value * 1.2, 3);
}

function zoomOut() {
  zoom.value = Math.max(zoom.value / 1.2, 0.3);
}

function resetZoom() {
  zoom.value = 1;
}

function fitToScreen() {
  resetZoom();
  autoLayout();
}

function exportImage() {
  console.log('Export image functionality to be implemented');
}


async function generateOptimizationReport() {
  loadingReport.value = true;
  showOptimizationReport.value = true;
  
  try {
    // TODO: 调用优化报告API
    // const report = await fetchOptimizationReport(props.projectId);
    // optimizationReport.value = report.data;
    
    // 模拟数据
    optimizationReport.value = {
      entityCount: entities.value.length,
      relationshipCount: relationships.value.length,
      issues: [
        {
          type: 'MISSING_INDEX',
          severity: 'HIGH',
          entityId: 'entity1',
          description: '外键字段缺少索引',
          solution: '为外键字段添加数据库索引'
        }
      ],
      recommendations: [
        {
          type: 'ADD_INDEX',
          priority: 1,
          description: '为外键字段添加索引',
          expectedBenefit: '查询性能提升30-50%',
          implementation: '在数据库迁移中添加索引'
        }
      ],
      performanceMetrics: {
        queryComplexity: 3,
        indexCoverage: 75,
        relationshipDepth: 2,
        estimatedQueryTime: 150
      }
    };
  } catch (error) {
    console.error('Failed to generate optimization report:', error);
  } finally {
    loadingReport.value = false;
  }
}

function getConfidenceColor(confidence: number) {
  if (confidence >= 0.8) return 'success';
  if (confidence >= 0.6) return 'warning';
  return 'error';
}

function getSeverityColor(severity: string): 'error' | 'warning' | 'info' | 'default' {
  const colors: Record<string, 'error' | 'warning' | 'info' | 'default'> = {
    'HIGH': 'error',
    'MEDIUM': 'warning',
    'LOW': 'info'
  };
  return colors[severity] || 'default';
}

function applyRecommendation(rec: any) {
  console.log('Apply recommendation:', rec);
}

onMounted(() => {
  loadData();
  
  nextTick(() => {
    if (canvasContainer.value) {
      canvasWidth.value = canvasContainer.value.clientWidth;
      canvasHeight.value = canvasContainer.value.clientHeight;
    }
  });
});
</script>

<style scoped>
.visual-relationship-designer {
  @apply h-full flex flex-col;
}

.toolbar {
  @apply p-4 border-b bg-gray-50;
}

.canvas-container {
  @apply flex-1 relative overflow-hidden;
}

.design-canvas {
  @apply w-full h-full cursor-grab;
}

.design-canvas:active {
  @apply cursor-grabbing;
}

.entity-node {
  @apply cursor-move;
}

.entity-node.selected .entity-rect {
  @apply stroke-blue-500;
  stroke-width: 3;
}

.entity-rect {
  @apply fill-white;
}

.entity-title {
  @apply text-sm font-bold fill-gray-800;
}

.entity-code {
  @apply text-xs fill-gray-600;
}

.field-text {
  @apply text-xs fill-gray-700;
}

.more-fields {
  @apply fill-gray-500;
}

.relationship-line {
  @apply cursor-pointer;
}

.relationship-line:hover {
  stroke-width: 3;
}

.relationship-line.selected {
  stroke-width: 3;
  stroke-dasharray: 5,5;
}

.relationship-label {
  @apply text-xs fill-gray-600 cursor-pointer;
}

.properties-panel {
  @apply absolute top-4 right-4 w-80 bg-white shadow-lg rounded-lg;
  z-index: 10;
}

.recommendation-card {
  @apply border border-gray-200;
}

.recommendation-card:hover {
  @apply border-blue-300;
}
</style>