<template>
  <div class="relationship-edge" :class="{ 'selected': isSelected }">
    <!-- 关系标签 -->
    <div class="relationship-label" :style="labelStyle">
      <div class="relationship-info">
        <div class="relationship-name">{{ relationship.name }}</div>
        <div class="relationship-type">
          <NTag size="tiny" :type="getRelationshipTypeColor(relationship.type)">
            {{ getRelationshipTypeText(relationship.type) }}
          </NTag>
        </div>
      </div>
      
      <!-- 关系详情 -->
      <div class="relationship-details" v-if="showDetails">
        <div class="detail-item" v-if="relationship.foreignKeyField">
          <NIcon><icon-mdi-key /></NIcon>
          <span>{{ relationship.foreignKeyField }}</span>
        </div>
        <div class="detail-item" v-if="relationship.onDelete">
          <NIcon><icon-mdi-delete /></NIcon>
          <span>{{ relationship.onDelete }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
// Relationship type definition moved inline
interface Relationship {
  id: string;
  name: string;
  sourceEntityId: string;
  targetEntityId: string;
  type: 'ONE_TO_ONE' | 'ONE_TO_MANY' | 'MANY_TO_ONE' | 'MANY_TO_MANY';
  description?: string;
  foreignKeyField?: string;
  onDelete?: 'CASCADE' | 'RESTRICT' | 'SET_NULL' | 'NO_ACTION';
  onUpdate?: 'CASCADE' | 'RESTRICT' | 'SET_NULL' | 'NO_ACTION';
}

/**
 * 关系连线组件 - 用于在X6画布中渲染实体关系
 * @props {Relationship} relationship - 关系数据
 * @props {boolean} isSelected - 是否选中
 * @props {boolean} showDetails - 是否显示详细信息
 * @props {Object} position - 标签位置
 */
interface Props {
  relationship: Relationship;
  isSelected?: boolean;
  showDetails?: boolean;
  position?: {
    x: number;
    y: number;
  };
}

const props = withDefaults(defineProps<Props>(), {
  isSelected: false,
  showDetails: false,
  position: () => ({ x: 0, y: 0 })
});

/**
 * 标签样式
 */
const labelStyle = computed(() => ({
  transform: `translate(${props.position.x}px, ${props.position.y}px)`
}));

/**
 * 获取关系类型颜色
 * @param type - 关系类型
 * @returns 标签类型
 */
function getRelationshipTypeColor(type: string): 'default' | 'primary' | 'info' | 'success' | 'warning' | 'error' {
  const typeColorMap: Record<string, 'default' | 'primary' | 'info' | 'success' | 'warning' | 'error'> = {
    'ONE_TO_ONE': 'primary',
    'ONE_TO_MANY': 'success',
    'MANY_TO_ONE': 'warning',
    'MANY_TO_MANY': 'error'
  };
  return typeColorMap[type] || 'default';
}

/**
 * 获取关系类型文本
 * @param type - 关系类型
 * @returns 显示文本
 */
function getRelationshipTypeText(type: string): string {
  const typeTextMap: Record<string, string> = {
    'ONE_TO_ONE': '1:1',
    'ONE_TO_MANY': '1:N',
    'MANY_TO_ONE': 'N:1',
    'MANY_TO_MANY': 'N:N'
  };
  return typeTextMap[type] || type;
}
</script>

<style scoped>
.relationship-edge {
  @apply relative;
}

.relationship-label {
  @apply absolute bg-white border border-gray-300 rounded-md px-2 py-1 shadow-sm;
  transform-origin: center;
  transition: all 0.2s ease;
  z-index: 10;
}

.relationship-edge.selected .relationship-label {
  @apply border-blue-500 shadow-md;
}

.relationship-info {
  @apply flex items-center space-x-2;
}

.relationship-name {
  @apply text-xs font-medium text-gray-800;
}

.relationship-type {
  @apply flex-shrink-0;
}

.relationship-details {
  @apply mt-1 pt-1 border-t border-gray-200 space-y-1;
}

.detail-item {
  @apply flex items-center space-x-1 text-xs text-gray-600;
}

.detail-item .n-icon {
  @apply text-sm;
}
</style>