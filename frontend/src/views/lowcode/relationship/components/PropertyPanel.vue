<script setup lang="ts">
import { computed } from 'vue';
import { NButton } from 'naive-ui';
import { useI18n } from 'vue-i18n';
import type { Cell, Edge, Node } from '@antv/x6';
import EntityPropertyEditor from './EntityPropertyEditor.vue';
import RelationshipPropertyEditor from './RelationshipPropertyEditor.vue';

/**
 * 属性面板组件
 *
 * 根据选中的元素类型显示对应的属性编辑器
 */

interface EntityData {
  name: string;
  code: string;
  tableName: string;
  description: string;
}

interface RelationshipData {
  name: string;
  code: string;
  type: string;
  description: string;
  onDelete: string;
  onUpdate: string;
  foreignKeyField: string;
  cascadeDelete: boolean;
  cascadeUpdate: boolean;
  required: boolean;
}

interface VisualData {
  color?: string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  lineStyle?: string;
  lineColor?: string;
}

interface Field {
  id: string;
  name: string;
  code: string;
  dataType: string;
  isPrimaryKey: boolean;
  isRequired: boolean;
  isUnique: boolean;
}

interface Props {
  /** 选中的单元格 */
  selectedCell: Cell | null;
  /** 实体数据 */
  entityData?: EntityData;
  /** 关系数据 */
  relationshipData?: RelationshipData;
  /** 视觉样式数据 */
  visualData?: VisualData;
  /** 实体字段列表 */
  fields?: Field[];
  /** 字段加载状态 */
  fieldsLoading?: boolean;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  /** 关闭面板 */
  close: [];
  /** 更新实体数据 */
  'update-entity': [data: Partial<EntityData>];
  /** 更新关系数据 */
  'update-relationship': [data: Partial<RelationshipData>];
  /** 更新视觉样式 */
  'update-visual': [data: Partial<VisualData>];
  /** 更新位置 */
  'update-position': [position: { x: number; y: number }];
  /** 更新尺寸 */
  'update-size': [size: { width: number; height: number }];
  /** 导航到字段管理 */
  'navigate-to-fields': [];
}>();

const { t } = useI18n();

/**
 * 判断选中的是否为节点
 *
 * @returns 是否为节点
 */
const selectedNode = computed(() => {
  return props.selectedCell?.isNode() ? (props.selectedCell as Node) : null;
});

/**
 * 判断选中的是否为边
 *
 * @returns 是否为边
 */
const selectedEdge = computed(() => {
  return props.selectedCell?.isEdge() ? (props.selectedCell as Edge) : null;
});
</script>

<template>
  <div v-if="selectedCell" class="property-panel">
    <!-- 面板头部 -->
    <div class="property-panel-header">
      <h3 class="panel-title">{{ $t('page.lowcode.relationship.propertyPanel.title') }}</h3>
      <NButton quaternary circle size="small" @click="$emit('close')">
        <template #icon>
          <icon-mdi-close class="text-16px" />
        </template>
      </NButton>
    </div>

    <!-- 面板内容 -->
    <div class="property-panel-content">
      <!-- 实体属性编辑 -->
      <template v-if="selectedNode">
        <EntityPropertyEditor
          :entity-data="entityData"
          :visual-data="visualData"
          :fields="fields"
          :fields-loading="fieldsLoading"
          @update-entity="$emit('update-entity', $event)"
          @update-visual="$emit('update-visual', $event)"
          @update-position="$emit('update-position', $event)"
          @update-size="$emit('update-size', $event)"
          @navigate-to-fields="$emit('navigate-to-fields')"
        />
      </template>

      <!-- 关系属性编辑 -->
      <template v-else-if="selectedEdge">
        <RelationshipPropertyEditor
          :relationship-data="relationshipData"
          :visual-data="visualData"
          @update-relationship="$emit('update-relationship', $event)"
          @update-visual="$emit('update-visual', $event)"
        />
      </template>
    </div>
  </div>
</template>

<style scoped>
.property-panel {
  @apply w-80 bg-white border-l border-gray-200 flex flex-col h-full;
}

.property-panel-header {
  @apply flex items-center justify-between p-4 border-b border-gray-200;
}

.panel-title {
  @apply text-lg font-semibold text-gray-800 m-0;
}

.property-panel-content {
  @apply flex-1 overflow-y-auto;
}
</style>
