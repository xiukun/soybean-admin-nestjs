<script setup lang="ts">
import { reactive, watch } from 'vue';
import {
  NButton,
  NColorPicker,
  NEmpty,
  NForm,
  NFormItem,
  NInput,
  NInputNumber,
  NList,
  NListItem,
  NSpin,
  NTabPane,
  NTabs,
  NTag
} from 'naive-ui';
import { useI18n } from 'vue-i18n';

/**
 * 实体属性编辑器组件
 *
 * 用于编辑实体的基本信息、视觉样式和字段管理
 */

interface EntityData {
  name: string;
  code: string;
  tableName: string;
  description: string;
}

interface VisualData {
  color?: string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
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
  /** 实体数据 */
  entityData: EntityData;
  /** 视觉样式数据 */
  visualData: VisualData;
  /** 字段列表 */
  fields: Field[];
  /** 字段加载状态 */
  fieldsLoading: boolean;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  /** 更新实体数据 */
  'update-entity': [data: Partial<EntityData>];
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

// 本地数据副本
const localEntityData = reactive({ ...props.entityData });
const localVisualData = reactive({ ...props.visualData });

// 监听props变化，同步到本地数据
watch(
  () => props.entityData,
  newData => {
    Object.assign(localEntityData, newData);
  },
  { deep: true }
);

watch(
  () => props.visualData,
  newData => {
    Object.assign(localVisualData, newData);
  },
  { deep: true }
);

/** 处理实体数据更新 */
function handleUpdate() {
  emit('update-entity', { ...localEntityData });
}

/** 处理视觉样式更新 */
function handleVisualUpdate() {
  emit('update-visual', { ...localVisualData });
}

/** 处理位置更新 */
function handlePositionUpdate() {
  if (localVisualData.x !== undefined && localVisualData.y !== undefined) {
    emit('update-position', { x: localVisualData.x, y: localVisualData.y });
  }
}

/** 处理尺寸更新 */
function handleSizeUpdate() {
  if (localVisualData.width !== undefined && localVisualData.height !== undefined) {
    emit('update-size', { width: localVisualData.width, height: localVisualData.height });
  }
}

/**
 * 获取字段类型显示名称
 *
 * @param dataType - 字段数据类型
 * @returns 类型显示名称
 */
function getFieldTypeName(dataType: string): string {
  const typeMap: Record<string, string> = {
    STRING: '字符串',
    INTEGER: '整数',
    DECIMAL: '小数',
    BOOLEAN: '布尔值',
    DATE: '日期',
    DATETIME: '日期时间',
    TEXT: '文本',
    JSON: 'JSON'
  };
  return typeMap[dataType] || dataType;
}
</script>

<template>
  <div class="entity-property-editor">
    <NTabs type="line" animated>
      <!-- 基本信息 -->
      <NTabPane name="basic" :tab="$t('page.lowcode.relationship.propertyPanel.basicInfo')">
        <div class="tab-content">
          <NForm label-placement="left" label-width="80px" size="small">
            <NFormItem :label="$t('page.lowcode.entity.name')">
              <NInput v-model:value="localEntityData.name" placeholder="请输入实体名称" @blur="handleUpdate" />
            </NFormItem>
            <NFormItem :label="$t('page.lowcode.entity.code')">
              <NInput v-model:value="localEntityData.code" disabled placeholder="实体代码" />
            </NFormItem>
            <NFormItem :label="$t('page.lowcode.entity.tableName')">
              <NInput v-model:value="localEntityData.tableName" placeholder="请输入表名" @blur="handleUpdate" />
            </NFormItem>
            <NFormItem :label="$t('page.lowcode.entity.description')">
              <NInput
                v-model:value="localEntityData.description"
                type="textarea"
                rows="3"
                placeholder="请输入实体描述"
                @blur="handleUpdate"
              />
            </NFormItem>
          </NForm>
        </div>
      </NTabPane>

      <!-- 视觉样式 -->
      <NTabPane name="visual" :tab="$t('page.lowcode.relationship.propertyPanel.visualStyle')">
        <div class="tab-content">
          <NForm label-placement="left" label-width="80px" size="small">
            <NFormItem :label="$t('page.lowcode.relationship.propertyPanel.color')">
              <NColorPicker v-model:value="localVisualData.color" @update:value="handleVisualUpdate" />
            </NFormItem>
            <NFormItem :label="$t('page.lowcode.relationship.propertyPanel.position')">
              <div class="flex space-x-2">
                <NInputNumber
                  v-model:value="localVisualData.x"
                  size="small"
                  placeholder="X"
                  @update:value="handlePositionUpdate"
                />
                <NInputNumber
                  v-model:value="localVisualData.y"
                  size="small"
                  placeholder="Y"
                  @update:value="handlePositionUpdate"
                />
              </div>
            </NFormItem>
            <NFormItem :label="$t('page.lowcode.relationship.propertyPanel.size')">
              <div class="flex space-x-2">
                <NInputNumber
                  v-model:value="localVisualData.width"
                  size="small"
                  placeholder="宽度"
                  :min="100"
                  @update:value="handleSizeUpdate"
                />
                <NInputNumber
                  v-model:value="localVisualData.height"
                  size="small"
                  placeholder="高度"
                  :min="80"
                  @update:value="handleSizeUpdate"
                />
              </div>
            </NFormItem>
          </NForm>
        </div>
      </NTabPane>

      <!-- 字段管理 -->
      <NTabPane name="fields" :tab="$t('page.lowcode.relationship.propertyPanel.fieldManagement')">
        <div class="tab-content">
          <div class="mb-3 flex items-center justify-between">
            <span class="text-sm font-medium">{{ $t('page.lowcode.relationship.propertyPanel.fields') }}</span>
            <NButton size="small" @click="$emit('navigate-to-fields')">
              {{ $t('page.lowcode.entity.designFields') }}
            </NButton>
          </div>

          <NSpin :show="fieldsLoading">
            <NEmpty v-if="fields.length === 0" :description="$t('page.lowcode.common.messages.noData')" />
            <NList v-else size="small">
              <NListItem v-for="field in fields" :key="field.id">
                <div class="w-full flex items-center justify-between">
                  <div class="flex-1">
                    <div class="text-sm font-medium">{{ field.name }}</div>
                    <div class="text-xs text-gray-500">{{ field.code }} ({{ getFieldTypeName(field.dataType) }})</div>
                  </div>
                  <div class="flex space-x-1">
                    <NTag v-if="field.isPrimaryKey" size="small" type="success">PK</NTag>
                    <NTag v-if="field.isRequired" size="small" type="warning">
                      {{ $t('page.lowcode.field.required') }}
                    </NTag>
                    <NTag v-if="field.isUnique" size="small" type="info">
                      {{ $t('page.lowcode.field.unique') }}
                    </NTag>
                  </div>
                </div>
              </NListItem>
            </NList>
          </NSpin>
        </div>
      </NTabPane>
    </NTabs>
  </div>
</template>

<style scoped>
.entity-property-editor {
  @apply h-full;
}

.tab-content {
  @apply p-4;
}
</style>
