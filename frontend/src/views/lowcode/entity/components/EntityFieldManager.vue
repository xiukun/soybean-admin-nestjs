<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { NButton, NEmpty, NIcon, NModal, NPopconfirm, NTag, NText, useMessage } from 'naive-ui';
import { fetchGetFieldList } from '@/service/api/lowcode-field';
import FieldForm from './FieldForm.vue';

// 图标导入
import IconMdiPlus from '~icons/mdi/plus';
import IconMdiKey from '~icons/mdi/key';
import IconMdiLink from '~icons/mdi/link';
import IconMdiPencil from '~icons/mdi/pencil';
import IconMdiDelete from '~icons/mdi/delete';
import IconMdiArrowUp from '~icons/mdi/arrow-up';
import IconMdiArrowDown from '~icons/mdi/arrow-down';
import IconMdiLoading from '~icons/mdi/loading';
import IconMdiCircleSmall from '~icons/mdi/circle-small';

/**
 * 实体字段管理组件
 *
 * @fires {Function} update:fields - 字段列表更新事件
 * @fires {Function} field-add - 字段添加事件
 * @fires {Function} field-update - 字段更新事件
 * @fires {Function} field-delete - 字段删除事件
 * @props {string} entityId - 实体ID
 * @props {Array} fields - 字段列表
 */
interface Field {
  id?: string;
  entityId: string;
  name: string;
  code: string;
  dataType: string;
  length?: number;
  precision?: number;
  scale?: number;
  defaultValue?: string;
  description?: string;
  isPrimaryKey: boolean;
  isRequired: boolean;
  isUnique: boolean;
  isForeignKey?: boolean;
  foreignKeyEntityId?: string;
  foreignKeyFieldId?: string;
}

interface Props {
  entityId: string;
  fields: Field[];
}

const props = defineProps<Props>();

const emit = defineEmits<{
  'update:fields': [fields: Field[]];
  'field-add': [field: Field];
  'field-update': [field: Field, index: number];
  'field-delete': [index: number];
}>();

// 响应式数据
const message = useMessage();
const loading = ref(false);
const localFields = ref<Field[]>([]);

// 字段编辑状态
const showFieldModal = ref(false);
const editingField = ref<Field | null>(null);
const editingIndex = ref(-1);

// 计算属性 - 使用本地字段数据或传入的props
const currentFields = computed(() => {
  return localFields.value.length > 0 ? localFields.value : props.fields;
});

// 计算字段数量统计
const fieldStats = computed(() => {
  const fields = currentFields.value;
  return {
    total: fields.length,
    primaryKeys: fields.filter(f => f.isPrimaryKey).length,
    foreignKeys: fields.filter(f => f.isForeignKey).length,
    required: fields.filter(f => f.isRequired).length,
    unique: fields.filter(f => f.isUnique).length
  };
});

/** 从API加载字段数据 */
async function loadFieldsFromAPI() {
  if (!props.entityId) return;
  
  loading.value = true;
  try {
    const response = await fetchGetFieldList(props.entityId);
    if (response.data) {
      // 转换API数据格式到本地Field接口格式
      localFields.value = response.data.map((apiField: any) => ({
        id: apiField.id,
        entityId: apiField.entityId,
        name: apiField.name,
        code: apiField.code,
        dataType: apiField.dataType,
        length: apiField.length,
        precision: apiField.precision,
        scale: apiField.scale,
        defaultValue: apiField.defaultValue,
        description: apiField.description,
        isPrimaryKey: apiField.isPrimaryKey || false,
        isRequired: apiField.isRequired || false,
        isUnique: apiField.isUnique || false,
        isForeignKey: apiField.isForeignKey || false,
        foreignKeyEntityId: apiField.foreignKeyEntityId,
        foreignKeyFieldId: apiField.foreignKeyFieldId
      }));
      console.log('加载字段数据成功:', localFields.value.length);
    }
  } catch (error) {
    console.error('加载字段数据失败:', error);
    message.error('加载字段数据失败');
  } finally {
    loading.value = false;
  }
}

// 组件挂载时加载字段数据
onMounted(() => {
  if (props.entityId && (!props.fields || props.fields.length === 0)) {
    loadFieldsFromAPI();
  } else {
    localFields.value = [...props.fields];
  }
});
/**
 * 获取字段图标样式类
 *
 * @param field - 字段对象
 * @returns 样式类名
 */
function getFieldIconClass(field: Field): string {
  if (field.isPrimaryKey) return 'text-yellow-500';
  if (field.isForeignKey) return 'text-blue-500';
  return 'text-gray-400';
}

/**
 * 获取字段类型颜色
 *
 * @param dataType - 数据类型
 * @returns 标签类型
 */
function getFieldTypeColor(dataType: string): 'default' | 'primary' | 'info' | 'success' | 'warning' | 'error' {
  const typeColorMap: Record<string, 'default' | 'primary' | 'info' | 'success' | 'warning' | 'error'> = {
    STRING: 'default',
    TEXT: 'default',
    INTEGER: 'primary',
    BIGINT: 'primary',
    DECIMAL: 'info',
    FLOAT: 'info',
    BOOLEAN: 'success',
    DATE: 'warning',
    DATETIME: 'warning',
    TIMESTAMP: 'warning',
    JSON: 'error'
  };
  return typeColorMap[dataType] || 'default';
}

/** 添加字段 */
function handleAddField() {
  editingField.value = {
    entityId: props.entityId,
    name: '',
    code: '',
    dataType: 'STRING',
    isPrimaryKey: false,
    isRequired: false,
    isUnique: false
  };
  editingIndex.value = -1;
  showFieldModal.value = true;
}

/**
 * 编辑字段
 *
 * @param field - 字段对象
 * @param index - 字段索引
 */
function handleEditField(field: Field, index: number) {
  editingField.value = { ...field };
  editingIndex.value = index;
  showFieldModal.value = true;
}

/**
 * 字段保存
 *
 * @param fieldData - 字段数据
 */
function handleFieldSave(fieldData: any) {
  const field: Field = {
    ...fieldData,
    entityId: props.entityId
  };

  const updatedFields = [...currentFields.value];
  
  if (editingIndex.value === -1) {
    // 新增字段
    updatedFields.push(field);
    localFields.value = updatedFields;
    emit('update:fields', updatedFields);
    emit('field-add', field);
    message.success('字段添加成功');
  } else {
    // 更新字段
    updatedFields[editingIndex.value] = field;
    localFields.value = updatedFields;
    emit('update:fields', updatedFields);
    emit('field-update', field, editingIndex.value);
    message.success('字段更新成功');
  }

  showFieldModal.value = false;
  editingField.value = null;
  editingIndex.value = -1;
}

/** 取消字段编辑 */
function handleFieldCancel() {
  showFieldModal.value = false;
  editingField.value = null;
  editingIndex.value = -1;
}

/**
 * 删除字段
 *
 * @param index - 字段索引
 */
function handleDeleteField(index: number) {
  const updatedFields = currentFields.value.filter((_, i) => i !== index);
  localFields.value = updatedFields;
  emit('update:fields', updatedFields);
  emit('field-delete', index);
  message.success('字段删除成功');
}

/**
 * 移动字段位置
 *
 * @param index - 当前索引
 * @param direction - 移动方向
 */
function handleMoveField(index: number, direction: 'up' | 'down') {
  const updatedFields = [...currentFields.value];
  const targetIndex = direction === 'up' ? index - 1 : index + 1;

  if (targetIndex >= 0 && targetIndex < updatedFields.length) {
    [updatedFields[index], updatedFields[targetIndex]] = [updatedFields[targetIndex], updatedFields[index]];
    localFields.value = updatedFields;
    emit('update:fields', updatedFields);
  }
}
</script>

<template>
  <div class="entity-field-manager">
    <!-- 字段统计信息 -->
    <div class="field-stats">
      <div class="stats-grid">
        <div class="stat-item">
          <NText class="stat-label">总字段</NText>
          <NText class="stat-value">{{ fieldStats.total }}</NText>
        </div>
        <div class="stat-item">
          <NText class="stat-label">主键</NText>
          <NText class="stat-value text-yellow-600">{{ fieldStats.primaryKeys }}</NText>
        </div>
        <div class="stat-item">
          <NText class="stat-label">外键</NText>
          <NText class="stat-value text-blue-600">{{ fieldStats.foreignKeys }}</NText>
        </div>
        <div class="stat-item">
          <NText class="stat-label">必填</NText>
          <NText class="stat-value text-red-600">{{ fieldStats.required }}</NText>
        </div>
      </div>
    </div>

    <!-- 字段列表 -->
    <div class="field-list">
      <div class="field-header">
        <NText strong>字段列表</NText>
        <NButton size="small" type="primary" @click="handleAddField">
          <template #icon>
            <NIcon><icon-mdi-plus /></NIcon>
          </template>
          添加字段
        </NButton>
      </div>

      <div v-if="loading" class="loading-state">
        <NIcon size="24" class="animate-spin">
          <icon-mdi-loading />
        </NIcon>
        <NText depth="3">加载字段数据中...</NText>
      </div>

      <div v-else-if="currentFields.length === 0" class="empty-state">
        <NEmpty description="暂无字段" size="small">
          <template #extra>
            <NButton size="small" @click="handleAddField">添加第一个字段</NButton>
          </template>
        </NEmpty>
      </div>

      <div v-else class="fields-container">
        <div
          v-for="(field, index) in currentFields"
          :key="field.id || index"
          class="field-item"
          :class="{
            'primary-key': field.isPrimaryKey,
            required: field.isRequired,
            unique: field.isUnique
          }"
        >
          <div class="field-content">
            <div class="field-main">
              <div class="field-info">
                <div class="field-name">
                  <NIcon class="field-icon" :class="getFieldIconClass(field)">
                    <icon-mdi-key v-if="field.isPrimaryKey" />
                    <icon-mdi-link v-else-if="field.isForeignKey" />
                    <icon-mdi-circle-small v-else />
                  </NIcon>
                  <span class="name-text">{{ field.name }}</span>
                  <NText depth="3" class="code-text">({{ field.code }})</NText>
                </div>
                <div class="field-type">
                  <NTag size="small" :type="getFieldTypeColor(field.dataType)">
                    {{ field.dataType }}
                  </NTag>
                  <span v-if="field.length" class="type-length">({{ field.length }})</span>
                </div>
              </div>

              <div class="field-attributes">
                <NTag v-if="field.isPrimaryKey" size="tiny" type="warning">主键</NTag>
                <NTag v-if="field.isRequired" size="tiny" type="error">必填</NTag>
                <NTag v-if="field.isUnique" size="tiny" type="info">唯一</NTag>
                <NTag v-if="field.isForeignKey" size="tiny" type="primary">外键</NTag>
              </div>
            </div>

            <div class="field-actions">
              <NButton size="tiny" quaternary @click="handleEditField(field, index)">
                <template #icon>
                  <NIcon><icon-mdi-pencil /></NIcon>
                </template>
              </NButton>

              <NButton size="tiny" quaternary :disabled="index === 0" @click="handleMoveField(index, 'up')">
                <template #icon>
                  <NIcon><icon-mdi-arrow-up /></NIcon>
                </template>
              </NButton>

              <NButton
                size="tiny"
                quaternary
                :disabled="index === currentFields.length - 1"
                @click="handleMoveField(index, 'down')"
              >
                <template #icon>
                  <NIcon><icon-mdi-arrow-down /></NIcon>
                </template>
              </NButton>

              <NPopconfirm @positive-click="handleDeleteField(index)">
                <template #trigger>
                  <NButton size="tiny" quaternary type="error">
                    <template #icon>
                      <NIcon><icon-mdi-delete /></NIcon>
                    </template>
                  </NButton>
                </template>
                确定要删除字段 "{{ field.name }}" 吗？
              </NPopconfirm>
            </div>
          </div>

          <!-- 字段描述 -->
          <div v-if="field.description" class="field-description">
            <NText depth="3" class="text-xs">{{ field.description }}</NText>
          </div>
        </div>
      </div>
    </div>

    <!-- 字段编辑对话框 -->
    <FieldForm
      v-if="showFieldModal"
      :visible="showFieldModal"
      :field-data="editingField"
      @update:visible="showFieldModal = $event"
      @save="handleFieldSave"
    />
  </div>
</template>

<style scoped>
.entity-field-manager {
  @apply w-full;
}

.field-header {
  @apply flex items-center justify-between mb-3 pb-2 border-b border-gray-200;
}

.empty-state {
  @apply py-8;
}

.fields-container {
  @apply space-y-2;
}

.field-item {
  @apply border border-gray-200 rounded-lg p-3 hover:bg-gray-50;
  transition: all 0.2s ease;
}

.field-item.primary-key {
  @apply border-yellow-300 bg-yellow-50;
}

.field-item.required {
  @apply border-l-4 border-l-red-400;
}

.field-item.unique {
  @apply border-l-4 border-l-blue-400;
}

.field-content {
  @apply flex items-start justify-between;
}

.field-main {
  @apply flex-1 min-w-0;
}

.field-info {
  @apply flex items-center justify-between mb-2;
}

.field-name {
  @apply flex items-center space-x-2 flex-1 min-w-0;
}

.field-icon {
  @apply text-sm flex-shrink-0;
}

.name-text {
  @apply font-medium text-gray-900 truncate;
}

.code-text {
  @apply text-xs flex-shrink-0;
}

.field-type {
  @apply flex items-center space-x-1 flex-shrink-0;
}

.type-length {
  @apply text-xs text-gray-500;
}

.field-attributes {
  @apply flex items-center space-x-1 flex-wrap;
}

.field-actions {
  @apply flex items-center space-x-1 flex-shrink-0 ml-3;
}

.field-description {
  @apply mt-2 pt-2 border-t border-gray-100;
}
</style>
