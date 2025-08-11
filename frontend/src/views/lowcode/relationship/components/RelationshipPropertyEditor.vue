<script setup lang="ts">
import { computed, reactive, watch } from 'vue';
import { NColorPicker, NForm, NFormItem, NInput, NSelect, NSwitch, NTabPane, NTabs } from 'naive-ui';
import { useI18n } from 'vue-i18n';

/**
 * 关系属性编辑器组件
 *
 * 用于编辑关系的基本信息、视觉样式和高级配置
 */

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
  lineStyle?: string;
  lineColor?: string;
}

interface Props {
  /** 关系数据 */
  relationshipData: RelationshipData;
  /** 视觉样式数据 */
  visualData: VisualData;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  /** 更新关系数据 */
  'update-relationship': [data: Partial<RelationshipData>];
  /** 更新视觉样式 */
  'update-visual': [data: Partial<VisualData>];
}>();

const { t } = useI18n();

// 本地数据副本
const localRelationshipData = reactive({ ...props.relationshipData });
const localVisualData = reactive({ ...props.visualData });

// 监听props变化，同步到本地数据
watch(
  () => props.relationshipData,
  newData => {
    Object.assign(localRelationshipData, newData);
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

/**
 * 关系类型选项
 *
 * @returns 关系类型下拉选项
 */
const relationshipTypeOptions = computed(() => [
  { label: t('page.lowcode.relationship.relationTypes.oneToOne'), value: 'ONE_TO_ONE' },
  { label: t('page.lowcode.relationship.relationTypes.oneToMany'), value: 'ONE_TO_MANY' },
  { label: t('page.lowcode.relationship.relationTypes.manyToOne'), value: 'MANY_TO_ONE' },
  { label: t('page.lowcode.relationship.relationTypes.manyToMany'), value: 'MANY_TO_MANY' }
]);

/**
 * 线条样式选项
 *
 * @returns 线条样式下拉选项
 */
const lineStyleOptions = computed(() => [
  { label: t('page.lowcode.relationship.lineStyles.solid'), value: 'solid' },
  { label: t('page.lowcode.relationship.lineStyles.dashed'), value: 'dashed' },
  { label: t('page.lowcode.relationship.lineStyles.dotted'), value: 'dotted' }
]);

/**
 * 级联操作选项
 *
 * @returns 级联操作下拉选项
 */
const cascadeActionOptions = computed(() => [
  { label: t('page.lowcode.relationship.cascadeActions.restrict'), value: 'RESTRICT' },
  { label: t('page.lowcode.relationship.cascadeActions.cascade'), value: 'CASCADE' },
  { label: t('page.lowcode.relationship.cascadeActions.setNull'), value: 'SET_NULL' },
  { label: t('page.lowcode.relationship.cascadeActions.noAction'), value: 'NO_ACTION' }
]);

/** 处理关系数据更新 */
function handleUpdate() {
  emit('update-relationship', { ...localRelationshipData });
}

/** 处理视觉样式更新 */
function handleVisualUpdate() {
  emit('update-visual', { ...localVisualData });
}
</script>

<template>
  <div class="relationship-property-editor">
    <NTabs type="line" animated>
      <!-- 基本信息 -->
      <NTabPane name="basic" :tab="$t('page.lowcode.relationship.propertyPanel.basicInfo')">
        <div class="tab-content">
          <NForm label-placement="left" label-width="80px" size="small">
            <NFormItem :label="$t('page.lowcode.relationship.name')">
              <NInput v-model:value="localRelationshipData.name" placeholder="请输入关系名称" @blur="handleUpdate" />
            </NFormItem>
            <NFormItem :label="$t('page.lowcode.relationship.code')">
              <NInput v-model:value="localRelationshipData.code" disabled placeholder="关系代码" />
            </NFormItem>
            <NFormItem :label="$t('page.lowcode.relationship.relationType')">
              <NSelect
                v-model:value="localRelationshipData.type"
                :options="relationshipTypeOptions"
                placeholder="请选择关系类型"
                @update:value="handleUpdate"
              />
            </NFormItem>
            <NFormItem :label="$t('page.lowcode.relationship.description')">
              <NInput
                v-model:value="localRelationshipData.description"
                type="textarea"
                rows="3"
                placeholder="请输入关系描述"
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
            <NFormItem :label="$t('page.lowcode.relationship.propertyPanel.lineStyle')">
              <NSelect
                v-model:value="localVisualData.lineStyle"
                :options="lineStyleOptions"
                placeholder="请选择线条样式"
                @update:value="handleVisualUpdate"
              />
            </NFormItem>
            <NFormItem :label="$t('page.lowcode.relationship.propertyPanel.lineColor')">
              <NColorPicker v-model:value="localVisualData.lineColor" @update:value="handleVisualUpdate" />
            </NFormItem>
            <NFormItem :label="$t('page.lowcode.relationship.onDelete')">
              <NSelect
                v-model:value="localRelationshipData.onDelete"
                :options="cascadeActionOptions"
                placeholder="请选择删除操作"
                @update:value="handleUpdate"
              />
            </NFormItem>
            <NFormItem :label="$t('page.lowcode.relationship.onUpdate')">
              <NSelect
                v-model:value="localRelationshipData.onUpdate"
                :options="cascadeActionOptions"
                placeholder="请选择更新操作"
                @update:value="handleUpdate"
              />
            </NFormItem>
          </NForm>
        </div>
      </NTabPane>

      <!-- 高级配置 -->
      <NTabPane name="advanced" :tab="$t('page.lowcode.project.advancedConfig')">
        <div class="tab-content">
          <NForm label-placement="left" label-width="80px" size="small">
            <NFormItem :label="$t('page.lowcode.relationship.foreignKeyField')">
              <NInput
                v-model:value="localRelationshipData.foreignKeyField"
                placeholder="请输入外键字段名"
                @blur="handleUpdate"
              />
            </NFormItem>
            <NFormItem :label="$t('page.lowcode.relationship.cascadeDelete')">
              <NSwitch v-model:value="localRelationshipData.cascadeDelete" @update:value="handleUpdate" />
            </NFormItem>
            <NFormItem :label="$t('page.lowcode.relationship.cascadeUpdate')">
              <NSwitch v-model:value="localRelationshipData.cascadeUpdate" @update:value="handleUpdate" />
            </NFormItem>
            <NFormItem :label="$t('page.lowcode.relationship.required')">
              <NSwitch v-model:value="localRelationshipData.required" @update:value="handleUpdate" />
            </NFormItem>
          </NForm>
        </div>
      </NTabPane>
    </NTabs>
  </div>
</template>

<style scoped>
.relationship-property-editor {
  @apply h-full;
}

.tab-content {
  @apply p-4;
}
</style>
