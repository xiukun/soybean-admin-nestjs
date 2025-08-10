<template>
  <div class="relationship-property-panel">
    <div class="panel-header">
      <div class="header-title">
        <NIcon size="18" class="text-blue-500">
          <icon-mdi-connection />
        </NIcon>
        <span class="font-medium">关系属性</span>
      </div>
      <NButton size="small" quaternary circle @click="$emit('close')">
        <template #icon>
          <NIcon><icon-mdi-close /></NIcon>
        </template>
      </NButton>
    </div>

    <div class="panel-content">
      <!-- 基本信息 -->
      <div class="property-section">
        <div class="section-title">
          <NIcon size="16"><icon-mdi-information-outline /></NIcon>
          <span>基本信息</span>
        </div>
        <div class="section-content">
          <NForm :model="formData" label-placement="left" :label-width="80">
            <NFormItem label="关系名称">
              <NInput v-model:value="formData.name" @blur="handleUpdate" />
            </NFormItem>
            <NFormItem label="关系类型">
              <NSelect 
                v-model:value="formData.type" 
                :options="relationshipTypeOptions"
                @update:value="handleUpdate"
              />
            </NFormItem>
            <NFormItem label="描述">
              <NInput 
                v-model:value="formData.description" 
                type="textarea" 
                :rows="3"
                @blur="handleUpdate"
              />
            </NFormItem>
          </NForm>
        </div>
      </div>

      <!-- 实体信息 -->
      <div class="property-section">
        <div class="section-title">
          <NIcon size="16"><icon-mdi-database /></NIcon>
          <span>实体信息</span>
        </div>
        <div class="section-content">
          <div class="entity-info">
            <div class="entity-item">
              <span class="label">源实体:</span>
              <span class="value">{{ sourceEntityName }}</span>
            </div>
            <div class="entity-item">
              <span class="label">目标实体:</span>
              <span class="value">{{ targetEntityName }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 视觉样式 -->
      <div class="property-section">
        <div class="section-title">
          <NIcon size="16"><icon-mdi-palette /></NIcon>
          <span>视觉样式</span>
        </div>
        <div class="section-content">
          <NForm :model="styleData" label-placement="left" :label-width="80">
            <NFormItem label="线条颜色">
              <NColorPicker v-model:value="styleData.lineColor" @update:value="handleStyleUpdate" />
            </NFormItem>
            <NFormItem label="线条宽度">
              <NSlider 
                v-model:value="styleData.lineWidth" 
                :min="1" 
                :max="5" 
                :step="1"
                @update:value="handleStyleUpdate"
              />
            </NFormItem>
            <NFormItem label="线条样式">
              <NSelect 
                v-model:value="styleData.lineStyle" 
                :options="lineStyleOptions"
                @update:value="handleStyleUpdate"
              />
            </NFormItem>
          </NForm>
        </div>
      </div>

      <!-- 操作按钮 -->
      <div class="property-section">
        <div class="section-title">
          <NIcon size="16"><icon-mdi-cog /></NIcon>
          <span>操作</span>
        </div>
        <div class="section-content">
          <NSpace vertical>
            <NButton block secondary @click="handleEdit">
              <template #icon>
                <NIcon><icon-mdi-pencil /></NIcon>
              </template>
              编辑关系
            </NButton>
            <NButton block secondary @click="handleViewSQL">
              <template #icon>
                <NIcon><icon-mdi-code-tags /></NIcon>
              </template>
              查看SQL
            </NButton>
            <NButton block type="error" secondary @click="handleDelete">
              <template #icon>
                <NIcon><icon-mdi-delete /></NIcon>
              </template>
              删除关系
            </NButton>
          </NSpace>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue';
import { 
  NButton, 
  NIcon, 
  NForm, 
  NFormItem, 
  NInput, 
  NSelect, 
  NColorPicker, 
  NSlider, 
  NSpace,
  useDialog,
  useMessage
} from 'naive-ui';

// 图标导入
import IconMdiConnection from '~icons/mdi/connection';
import IconMdiClose from '~icons/mdi/close';
import IconMdiInformationOutline from '~icons/mdi/information-outline';
import IconMdiDatabase from '~icons/mdi/database';
import IconMdiPalette from '~icons/mdi/palette';
import IconMdiCog from '~icons/mdi/cog';
import IconMdiPencil from '~icons/mdi/pencil';
import IconMdiCodeTags from '~icons/mdi/code-tags';
import IconMdiDelete from '~icons/mdi/delete';

import type { EntityRelationship, Entity } from '../types';

interface Props {
  relationship: EntityRelationship;
  entities?: Entity[];
}

interface Emits {
  (e: 'update', relationship: EntityRelationship): void;
  (e: 'delete', relationshipId: string): void;
  (e: 'close'): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();
const dialog = useDialog();
const message = useMessage();

// 表单数据
const formData = reactive({
  name: '',
  type: 'ONE_TO_MANY' as EntityRelationship['type'],
  description: ''
});

// 样式数据
const styleData = reactive({
  lineColor: '#5F95FF',
  lineWidth: 2,
  lineStyle: 'solid' as EntityRelationship['lineStyle']
});

// 选项配置
const relationshipTypeOptions = [
  { label: '一对一', value: 'ONE_TO_ONE' },
  { label: '一对多', value: 'ONE_TO_MANY' },
  { label: '多对多', value: 'MANY_TO_MANY' }
];

const lineStyleOptions = [
  { label: '实线', value: 'solid' },
  { label: '虚线', value: 'dashed' },
  { label: '点线', value: 'dotted' }
];

// 计算属性
const sourceEntityName = computed(() => {
  // 这里应该从父组件传入实体列表或通过API获取
  return '源实体'; // 临时值
});

const targetEntityName = computed(() => {
  // 这里应该从父组件传入实体列表或通过API获取
  return '目标实体'; // 临时值
});

/**
 * 初始化表单数据
 */
function initFormData() {
  formData.name = props.relationship.name;
  formData.type = props.relationship.type;
  formData.description = props.relationship.description || '';
  
  styleData.lineColor = props.relationship.lineColor || '#5F95FF';
  styleData.lineWidth = props.relationship.lineWidth || 2;
  styleData.lineStyle = props.relationship.lineStyle || 'solid';
}

/**
 * 处理基本信息更新
 */
function handleUpdate() {
  const updatedRelationship: EntityRelationship = {
    ...props.relationship,
    name: formData.name,
    type: formData.type,
    description: formData.description
  };
  
  emit('update', updatedRelationship);
}

/**
 * 处理样式更新
 */
function handleStyleUpdate() {
  const updatedRelationship: EntityRelationship = {
    ...props.relationship,
    lineColor: styleData.lineColor,
    lineWidth: styleData.lineWidth,
    lineStyle: styleData.lineStyle
  };
  
  emit('update', updatedRelationship);
}

/**
 * 处理编辑关系
 */
function handleEdit() {
  message.info('编辑关系功能开发中...');
}

/**
 * 处理查看SQL
 */
function handleViewSQL() {
  message.info('查看SQL功能开发中...');
}

/**
 * 处理删除关系
 */
function handleDelete() {
  dialog.warning({
    title: '确认删除',
    content: `确定要删除关系 "${props.relationship.name}" 吗？此操作不可撤销。`,
    positiveText: '删除',
    negativeText: '取消',
    onPositiveClick: () => {
      emit('delete', props.relationship.id);
      message.success('关系删除成功');
    }
  });
}

// 监听关系变化
watch(() => props.relationship, () => {
  initFormData();
}, { immediate: true, deep: true });
</script>

<style scoped>
.relationship-property-panel {
  @apply h-full flex flex-col bg-white;
}

.panel-header {
  @apply flex justify-between items-center p-4 border-b border-gray-200;
}

.header-title {
  @apply flex items-center space-x-2;
}

.panel-content {
  @apply flex-1 overflow-y-auto p-4 space-y-6;
}

.property-section {
  @apply space-y-3;
}

.section-title {
  @apply flex items-center space-x-2 text-sm font-medium text-gray-700 pb-2 border-b border-gray-100;
}

.section-content {
  @apply space-y-3;
}

.entity-info {
  @apply space-y-2;
}

.entity-item {
  @apply flex justify-between items-center;
}

.label {
  @apply text-sm text-gray-600;
}

.value {
  @apply text-sm font-medium text-gray-900;
}
</style>