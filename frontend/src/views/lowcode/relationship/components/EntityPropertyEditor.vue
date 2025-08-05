<template>
  <div class="entity-property-editor">
    <n-tabs type="line" animated>
      <!-- 基本信息 -->
      <n-tab-pane name="basic" :tab="$t('page.lowcode.relationship.propertyPanel.basicInfo')">
        <div class="tab-content">
          <n-form label-placement="left" label-width="80px" size="small">
            <n-form-item :label="$t('page.lowcode.entity.name')">
              <n-input 
                v-model:value="localEntityData.name" 
                @blur="handleUpdate"
                placeholder="请输入实体名称"
              />
            </n-form-item>
            <n-form-item :label="$t('page.lowcode.entity.code')">
              <n-input 
                v-model:value="localEntityData.code" 
                disabled 
                placeholder="实体代码"
              />
            </n-form-item>
            <n-form-item :label="$t('page.lowcode.entity.tableName')">
              <n-input 
                v-model:value="localEntityData.tableName" 
                @blur="handleUpdate"
                placeholder="请输入表名"
              />
            </n-form-item>
            <n-form-item :label="$t('page.lowcode.entity.description')">
              <n-input 
                v-model:value="localEntityData.description" 
                type="textarea" 
                rows="3" 
                @blur="handleUpdate"
                placeholder="请输入实体描述"
              />
            </n-form-item>
          </n-form>
        </div>
      </n-tab-pane>
      
      <!-- 视觉样式 -->
      <n-tab-pane name="visual" :tab="$t('page.lowcode.relationship.propertyPanel.visualStyle')">
        <div class="tab-content">
          <n-form label-placement="left" label-width="80px" size="small">
            <n-form-item :label="$t('page.lowcode.relationship.propertyPanel.color')">
              <n-color-picker 
                v-model:value="localVisualData.color" 
                @update:value="handleVisualUpdate" 
              />
            </n-form-item>
            <n-form-item :label="$t('page.lowcode.relationship.propertyPanel.position')">
              <div class="flex space-x-2">
                <n-input-number 
                  v-model:value="localVisualData.x" 
                  size="small" 
                  @update:value="handlePositionUpdate"
                  placeholder="X"
                />
                <n-input-number 
                  v-model:value="localVisualData.y" 
                  size="small" 
                  @update:value="handlePositionUpdate"
                  placeholder="Y"
                />
              </div>
            </n-form-item>
            <n-form-item :label="$t('page.lowcode.relationship.propertyPanel.size')">
              <div class="flex space-x-2">
                <n-input-number 
                  v-model:value="localVisualData.width" 
                  size="small" 
                  @update:value="handleSizeUpdate"
                  placeholder="宽度"
                  :min="100"
                />
                <n-input-number 
                  v-model:value="localVisualData.height" 
                  size="small" 
                  @update:value="handleSizeUpdate"
                  placeholder="高度"
                  :min="80"
                />
              </div>
            </n-form-item>
          </n-form>
        </div>
      </n-tab-pane>
      
      <!-- 字段管理 -->
      <n-tab-pane name="fields" :tab="$t('page.lowcode.relationship.propertyPanel.fieldManagement')">
        <div class="tab-content">
          <div class="mb-3 flex justify-between items-center">
            <span class="text-sm font-medium">{{ $t('page.lowcode.relationship.propertyPanel.fields') }}</span>
            <n-button size="small" @click="$emit('navigate-to-fields')">
              {{ $t('page.lowcode.entity.designFields') }}
            </n-button>
          </div>
          
          <n-spin :show="fieldsLoading">
            <n-empty 
              v-if="fields.length === 0" 
              :description="$t('page.lowcode.common.messages.noData')" 
            />
            <n-list v-else size="small">
              <n-list-item v-for="field in fields" :key="field.id">
                <div class="flex justify-between items-center w-full">
                  <div class="flex-1">
                    <div class="text-sm font-medium">{{ field.name }}</div>
                    <div class="text-xs text-gray-500">
                      {{ field.code }} ({{ getFieldTypeName(field.dataType) }})
                    </div>
                  </div>
                  <div class="flex space-x-1">
                    <n-tag v-if="field.isPrimaryKey" size="small" type="success">PK</n-tag>
                    <n-tag v-if="field.isRequired" size="small" type="warning">
                      {{ $t('page.lowcode.field.required') }}
                    </n-tag>
                    <n-tag v-if="field.isUnique" size="small" type="info">
                      {{ $t('page.lowcode.field.unique') }}
                    </n-tag>
                  </div>
                </div>
              </n-list-item>
            </n-list>
          </n-spin>
        </div>
      </n-tab-pane>
    </n-tabs>
  </div>
</template>

<script setup lang="ts">
import { reactive, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { 
  NTabs, NTabPane, NForm, NFormItem, NInput, NInputNumber, 
  NColorPicker, NButton, NSpin, NEmpty, NList, NListItem, NTag 
} from 'naive-ui';

/**
 * 实体属性编辑器组件
 * @description 用于编辑实体的基本信息、视觉样式和字段管理
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
watch(() => props.entityData, (newData) => {
  Object.assign(localEntityData, newData);
}, { deep: true });

watch(() => props.visualData, (newData) => {
  Object.assign(localVisualData, newData);
}, { deep: true });

/**
 * 处理实体数据更新
 */
function handleUpdate() {
  emit('update-entity', { ...localEntityData });
}

/**
 * 处理视觉样式更新
 */
function handleVisualUpdate() {
  emit('update-visual', { ...localVisualData });
}

/**
 * 处理位置更新
 */
function handlePositionUpdate() {
  if (localVisualData.x !== undefined && localVisualData.y !== undefined) {
    emit('update-position', { x: localVisualData.x, y: localVisualData.y });
  }
}

/**
 * 处理尺寸更新
 */
function handleSizeUpdate() {
  if (localVisualData.width !== undefined && localVisualData.height !== undefined) {
    emit('update-size', { width: localVisualData.width, height: localVisualData.height });
  }
}

/**
 * 获取字段类型显示名称
 * @param dataType - 字段数据类型
 * @returns 类型显示名称
 */
function getFieldTypeName(dataType: string): string {
  const typeMap: Record<string, string> = {
    'STRING': '字符串',
    'INTEGER': '整数',
    'DECIMAL': '小数',
    'BOOLEAN': '布尔值',
    'DATE': '日期',
    'DATETIME': '日期时间',
    'TEXT': '文本',
    'JSON': 'JSON'
  };
  return typeMap[dataType] || dataType;
}
</script>

<style scoped>
.entity-property-editor {
  @apply h-full;
}

.tab-content {
  @apply p-4;
}
</style>