<template>
  <div class="entity-list-panel">
    <!-- 头部搜索 -->
    <div class="entity-list-header">
      <h3 class="panel-title">{{ $t('page.lowcode.relationship.entityList') }}</h3>
      <n-input 
        v-model:value="searchKeyword" 
        :placeholder="$t('page.lowcode.common.search.placeholder')" 
        size="small"
        clearable
        @update:value="handleSearch"
      >
        <template #prefix>
          <icon-mdi-magnify class="text-14px" />
        </template>
      </n-input>
    </div>

    <!-- 实体列表内容 -->
    <div class="entity-list-content">
      <n-spin :show="loading">
        <n-empty 
          v-if="filteredEntities.length === 0" 
          :description="$t('page.lowcode.common.messages.noData')" 
        />
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
              <div v-if="entity.tableName" class="entity-table">{{ entity.tableName }}</div>
            </div>
            <div class="entity-actions">
              <!-- 已在图中的实体操作 -->
              <template v-if="isEntityInGraph(entity.id)">
                <n-tooltip placement="top">
                  <template #trigger>
                    <n-button 
                      quaternary 
                      circle 
                      size="small"
                      @click.stop="$emit('locate-entity', entity.id)"
                    >
                      <template #icon>
                        <icon-mdi-crosshairs-gps class="text-14px" />
                      </template>
                    </n-button>
                  </template>
                  <span>定位实体</span>
                </n-tooltip>
                
                <n-tooltip placement="top">
                  <template #trigger>
                    <n-button 
                      quaternary 
                      circle 
                      size="small"
                      type="error"
                      @click.stop="$emit('remove-entity', entity.id)"
                    >
                      <template #icon>
                        <icon-mdi-close class="text-14px" />
                      </template>
                    </n-button>
                  </template>
                  <span>移除实体</span>
                </n-tooltip>
              </template>
              
              <!-- 未在图中的实体操作 -->
              <template v-else>
                <n-tooltip placement="top">
                  <template #trigger>
                    <n-button 
                      quaternary 
                      circle 
                      size="small"
                      type="primary"
                      @click.stop="$emit('add-entity', entity)"
                    >
                      <template #icon>
                        <icon-mdi-plus class="text-14px" />
                      </template>
                    </n-button>
                  </template>
                  <span>添加到图中</span>
                </n-tooltip>
              </template>
            </div>
          </div>
        </div>
      </n-spin>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { NInput, NSpin, NEmpty, NButton, NTooltip } from 'naive-ui';
import { debounce } from 'lodash-es';

/**
 * 实体列表面板组件
 * @description 显示项目中的所有实体，支持搜索、添加到图中、定位和移除等操作
 */

interface Entity {
  id: string;
  name: string;
  code: string;
  tableName?: string;
  description?: string;
}

interface Props {
  /** 实体列表数据 */
  entities: Entity[];
  /** 图中已存在的实体ID集合 */
  graphEntityIds: Set<string>;
  /** 是否正在加载 */
  loading: boolean;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  /** 点击实体项 */
  'entity-click': [entity: Entity];
  /** 添加实体到图中 */
  'add-entity': [entity: Entity];
  /** 从图中移除实体 */
  'remove-entity': [entityId: string];
  /** 定位实体 */
  'locate-entity': [entityId: string];
  /** 搜索关键词变化 */
  'search': [keyword: string];
}>();

const { t } = useI18n();
const searchKeyword = ref('');

/**
 * 检查实体是否已在图中
 * @param entityId - 实体ID
 * @returns 是否在图中
 */
function isEntityInGraph(entityId: string): boolean {
  return props.graphEntityIds.has(entityId);
}

/**
 * 过滤后的实体列表
 * @returns 根据搜索关键词过滤的实体列表
 */
const filteredEntities = computed(() => {
  if (!searchKeyword.value) {
    return props.entities;
  }
  const keyword = searchKeyword.value.toLowerCase();
  return props.entities.filter(entity => 
    entity.name.toLowerCase().includes(keyword) || 
    entity.code.toLowerCase().includes(keyword) || 
    (entity.tableName && entity.tableName.toLowerCase().includes(keyword))
  );
});

/**
 * 处理实体项点击事件
 * @param entity - 被点击的实体
 */
function handleEntityClick(entity: Entity) {
  emit('entity-click', entity);
}

/**
 * 处理搜索输入变化（防抖）
 * @param keyword - 搜索关键词
 */
const handleSearch = debounce((keyword: string) => {
  emit('search', keyword);
}, 300);
</script>

<style scoped>
.entity-list-panel {
  @apply w-80 bg-white border-r border-gray-200 flex flex-col h-full;
}

.entity-list-header {
  @apply p-4 border-b border-gray-200 space-y-3;
}

.panel-title {
  @apply text-lg font-semibold text-gray-800 m-0;
}

.entity-list-content {
  @apply flex-1 overflow-hidden;
}

.entity-items {
  @apply h-full overflow-y-auto;
}

.entity-item {
  @apply p-3 border-b border-gray-100 cursor-pointer transition-all duration-200 hover:bg-gray-50 flex items-center justify-between;
}

.entity-item.is-in-graph {
  @apply bg-blue-50 border-blue-200;
}

.entity-item:hover {
  @apply bg-gray-100;
}

.entity-item.is-in-graph:hover {
  @apply bg-blue-100;
}

.entity-item-content {
  @apply flex-1 min-w-0;
}

.entity-name {
  @apply text-sm font-medium text-gray-900 truncate;
}

.entity-code {
  @apply text-xs text-gray-500 truncate mt-1;
}

.entity-table {
  @apply text-xs text-blue-600 truncate mt-1;
}

.entity-actions {
  @apply flex items-center space-x-1 ml-2;
}
</style>