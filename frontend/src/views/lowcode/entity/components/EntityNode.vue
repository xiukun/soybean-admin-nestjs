<template>
  <div class="entity-node" :class="{ 'selected': isSelected }">
    <!-- 实体头部 -->
    <div class="entity-header" :style="{ backgroundColor: entity.color || '#5F95FF' }">
      <div class="entity-title">
        <NIcon class="entity-icon">
          <icon-mdi-table />
        </NIcon>
        <span class="entity-name">{{ entity.name }}</span>
      </div>
      <div class="entity-code">{{ entity.code }}</div>
    </div>
    
    <!-- 字段列表 -->
    <div class="entity-fields">
      <div 
        v-for="field in displayFields" 
        :key="field.id" 
        class="field-item"
        :class="{
          'primary-key': field.isPrimaryKey,
          'foreign-key': field.isForeignKey,
          'required': field.isRequired
        }"
      >
        <div class="field-info">
          <NIcon class="field-icon" :class="getFieldIconClass(field)">
            <icon-mdi-key v-if="field.isPrimaryKey" />
            <icon-mdi-link v-else-if="field.isForeignKey" />
            <icon-mdi-circle-small v-else />
          </NIcon>
          <span class="field-name">{{ field.name }}</span>
        </div>
        <div class="field-type">
          <NTag size="tiny" :type="getFieldTypeColor(field.dataType)">
            {{ field.dataType }}
          </NTag>
        </div>
      </div>
      
      <!-- 更多字段提示 -->
      <div v-if="hasMoreFields" class="more-fields">
        <NText depth="3" class="text-xs">
          还有 {{ remainingFieldsCount }} 个字段...
        </NText>
      </div>
    </div>
    
    <!-- 实体统计 -->
    <div class="entity-stats">
      <div class="stat-item">
        <NIcon><icon-mdi-table-column /></NIcon>
        <span>{{ entity.fieldCount || 0 }} 字段</span>
      </div>
      <div class="stat-item" v-if="relationshipCount > 0">
        <NIcon><icon-mdi-relation-many-to-many /></NIcon>
        <span>{{ relationshipCount }} 关系</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
// Entity type definition moved inline
interface Entity {
  id: string;
  name: string;
  code: string;
  tableName: string;
  description?: string;
  category: string;
  status: 'DRAFT' | 'ACTIVE' | 'INACTIVE';
  fieldCount?: number;
  createdAt?: string;
  updatedAt?: string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  color?: string;
}

/**
 * 实体节点组件 - 用于在X6画布中渲染实体
 * @props {Entity} entity - 实体数据
 * @props {boolean} isSelected - 是否选中
 * @props {Array} fields - 字段列表
 * @props {number} relationshipCount - 关系数量
 */
interface Props {
  entity: Entity;
  isSelected?: boolean;
  fields?: any[];
  relationshipCount?: number;
}

const props = withDefaults(defineProps<Props>(), {
  isSelected: false,
  fields: () => [],
  relationshipCount: 0
});

// 显示的字段数量限制
const MAX_DISPLAY_FIELDS = 6;

/**
 * 计算显示的字段列表（限制数量）
 */
const displayFields = computed(() => {
  return props.fields.slice(0, MAX_DISPLAY_FIELDS);
});

/**
 * 是否有更多字段
 */
const hasMoreFields = computed(() => {
  return props.fields.length > MAX_DISPLAY_FIELDS;
});

/**
 * 剩余字段数量
 */
const remainingFieldsCount = computed(() => {
  return Math.max(0, props.fields.length - MAX_DISPLAY_FIELDS);
});

/**
 * 获取字段图标样式类
 * @param field - 字段对象
 * @returns 样式类名
 */
function getFieldIconClass(field: any) {
  if (field.isPrimaryKey) return 'text-yellow-500';
  if (field.isForeignKey) return 'text-blue-500';
  return 'text-gray-400';
}

/**
 * 获取字段类型颜色
 * @param dataType - 数据类型
 * @returns 标签类型
 */
function getFieldTypeColor(dataType: string): 'default' | 'primary' | 'info' | 'success' | 'warning' | 'error' {
  const typeColorMap: Record<string, 'default' | 'primary' | 'info' | 'success' | 'warning' | 'error'> = {
    'STRING': 'default',
    'TEXT': 'default',
    'INTEGER': 'primary',
    'BIGINT': 'primary',
    'DECIMAL': 'info',
    'FLOAT': 'info',
    'BOOLEAN': 'success',
    'DATE': 'warning',
    'DATETIME': 'warning',
    'TIMESTAMP': 'warning',
    'JSON': 'error'
  };
  return typeColorMap[dataType] || 'default';
}
</script>

<style scoped>
.entity-node {
  @apply w-full h-full bg-white border-2 border-gray-300 rounded-lg overflow-hidden;
  transition: all 0.2s ease;
  min-width: 200px;
  min-height: 120px;
}

.entity-node.selected {
  @apply border-blue-500 shadow-lg;
}

.entity-node:hover {
  @apply shadow-md;
}

.entity-header {
  @apply px-3 py-2 text-white;
  background: linear-gradient(135deg, var(--bg-color, #5F95FF) 0%, var(--bg-color, #5F95FF) 100%);
}

.entity-title {
  @apply flex items-center space-x-2;
}

.entity-icon {
  @apply text-lg;
}

.entity-name {
  @apply font-semibold text-sm;
}

.entity-code {
  @apply text-xs opacity-90 mt-1;
}

.entity-fields {
  @apply p-2 space-y-1 max-h-32 overflow-y-auto;
}

.field-item {
  @apply flex items-center justify-between px-2 py-1 rounded hover:bg-gray-50;
  transition: background-color 0.15s ease;
}

.field-item.primary-key {
  @apply bg-yellow-50 border-l-2 border-yellow-400;
}

.field-item.foreign-key {
  @apply bg-blue-50 border-l-2 border-blue-400;
}

.field-item.required .field-name {
  @apply font-medium;
}

.field-info {
  @apply flex items-center space-x-1 flex-1 min-w-0;
}

.field-icon {
  @apply text-sm flex-shrink-0;
}

.field-name {
  @apply text-xs truncate;
}

.field-type {
  @apply flex-shrink-0;
}

.more-fields {
  @apply text-center py-1;
}

.entity-stats {
  @apply flex items-center justify-between px-3 py-2 bg-gray-50 border-t border-gray-200;
}

.stat-item {
  @apply flex items-center space-x-1 text-xs text-gray-600;
}

.stat-item .n-icon {
  @apply text-sm;
}
</style>