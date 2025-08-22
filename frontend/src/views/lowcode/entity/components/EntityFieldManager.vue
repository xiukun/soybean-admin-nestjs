<script setup lang="ts">
import { computed, h, onMounted, ref } from 'vue';
import { NButton, NDropdown, NEmpty, NIcon, NModal, NPopconfirm, NTag, NText, useMessage } from 'naive-ui';
import { fetchGetFieldList, fetchAddField, fetchUpdateField, fetchDeleteField, fetchMoveField } from '@/service/api/lowcode-field';
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
const saving = ref(false);
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

/** 添加字段到API */
async function addFieldToAPI(fieldData: any) {
  if (!props.entityId) return;
  
  saving.value = true;
  try {
    // 转换字段数据格式以匹配API要求
    const apiFieldData = {
      entityId: props.entityId,
      name: fieldData.name,
      code: fieldData.code,
      dataType: fieldData.dataType,
      length: fieldData.length,
      precision: fieldData.precision,
      scale: fieldData.scale,
      defaultValue: fieldData.defaultValue,
      description: fieldData.description,
      isPrimaryKey: fieldData.isPrimaryKey || false,
      isRequired: fieldData.isRequired || false,
      isUnique: fieldData.isUnique || false
    };

    const response = await fetchAddField(apiFieldData);
    if (response.data) {
      // 转换API响应数据格式到本地Field接口格式
      const newField: Field = {
        id: response.data.id,
        entityId: response.data.entityId,
        name: response.data.name,
        code: response.data.code,
        dataType: response.data.dataType,
        length: response.data.length,
        precision: response.data.precision,
        scale: response.data.scale,
        defaultValue: response.data.defaultValue,
        description: response.data.description,
        isPrimaryKey: response.data.isPrimaryKey || false,
        isRequired: response.data.isRequired || false,
        isUnique: response.data.isUnique || false,
        isForeignKey: response.data.isForeignKey || false,
        foreignKeyEntityId: response.data.foreignKeyEntityId,
        foreignKeyFieldId: response.data.foreignKeyFieldId
      };

      // 更新本地字段列表
      const updatedFields = [...localFields.value, newField];
      localFields.value = updatedFields;
      emit('update:fields', updatedFields);
      emit('field-add', newField);
      message.success('字段添加成功');
    }
  } catch (error) {
    console.error('添加字段失败:', error);
    message.error('添加字段失败');
  } finally {
    saving.value = false;
  }
}

/** 更新字段到API */
async function updateFieldInAPI(fieldData: any, index: number) {
  if (!fieldData.id) return;
  
  saving.value = true;
  try {
    // 转换字段数据格式以匹配API要求
    const apiFieldData = {
      entityId: props.entityId,
      name: fieldData.name,
      code: fieldData.code,
      dataType: fieldData.dataType,
      length: fieldData.length,
      precision: fieldData.precision,
      scale: fieldData.scale,
      defaultValue: fieldData.defaultValue,
      description: fieldData.description,
      isPrimaryKey: fieldData.isPrimaryKey || false,
      isRequired: fieldData.isRequired || false,
      isUnique: fieldData.isUnique || false
    };

    const response = await fetchUpdateField(fieldData.id, apiFieldData);
    if (response.data) {
      // 转换API响应数据格式到本地Field接口格式
      const updatedField: Field = {
        id: response.data.id,
        entityId: response.data.entityId,
        name: response.data.name,
        code: response.data.code,
        dataType: response.data.dataType,
        length: response.data.length,
        precision: response.data.precision,
        scale: response.data.scale,
        defaultValue: response.data.defaultValue,
        description: response.data.description,
        isPrimaryKey: response.data.isPrimaryKey || false,
        isRequired: response.data.isRequired || false,
        isUnique: response.data.isUnique || false,
        isForeignKey: response.data.isForeignKey || false,
        foreignKeyEntityId: response.data.foreignKeyEntityId,
        foreignKeyFieldId: response.data.foreignKeyFieldId
      };

      // 更新本地字段列表
      const updatedFields = [...localFields.value];
      updatedFields[index] = updatedField;
      localFields.value = updatedFields;
      emit('update:fields', updatedFields);
      emit('field-update', updatedField, index);
      message.success('字段更新成功');
    }
  } catch (error) {
    console.error('更新字段失败:', error);
    message.error('更新字段失败');
  } finally {
    saving.value = false;
  }
}

/** 从API删除字段 */
async function deleteFieldFromAPI(index: number) {
  const field = localFields.value[index];
  if (!field.id) {
    // 如果字段没有ID，直接从本地删除
    const updatedFields = localFields.value.filter((_, i) => i !== index);
    localFields.value = updatedFields;
    emit('update:fields', updatedFields);
    emit('field-delete', index);
    message.success('字段删除成功');
    return;
  }
  
  saving.value = true;
  try {
    await fetchDeleteField(field.id);
    
    // 更新本地字段列表
    const updatedFields = localFields.value.filter((_, i) => i !== index);
    localFields.value = updatedFields;
    emit('update:fields', updatedFields);
    emit('field-delete', index);
    message.success('字段删除成功');
  } catch (error) {
    console.error('删除字段失败:', error);
    message.error('删除字段失败');
  } finally {
    saving.value = false;
  }
}

/** 移动字段顺序 */
async function moveFieldInAPI(index: number, direction: 'up' | 'down') {
  const field = localFields.value[index];
  if (!field.id) return;
  
  saving.value = true;
  try {
    await fetchMoveField(field.id, direction);
    
    // 更新本地字段列表
    const updatedFields = [...localFields.value];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    if (targetIndex >= 0 && targetIndex < updatedFields.length) {
      [updatedFields[index], updatedFields[targetIndex]] = [updatedFields[targetIndex], updatedFields[index]];
      localFields.value = updatedFields;
      emit('update:fields', updatedFields);
      message.success('字段顺序调整成功');
    }
  } catch (error) {
    console.error('调整字段顺序失败:', error);
    message.error('调整字段顺序失败');
  } finally {
    saving.value = false;
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
  if (editingIndex.value === -1) {
    // 新增字段
    addFieldToAPI(fieldData);
  } else {
    // 更新字段
    updateFieldInAPI(fieldData, editingIndex.value);
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
  deleteFieldFromAPI(index);
}

/**
 * 移动字段位置
 *
 * @param index - 当前索引
 * @param direction - 移动方向
 */
function handleMoveField(index: number, direction: 'up' | 'down') {
  moveFieldInAPI(index, direction);
}

/**
 * 获取移动选项
 */
function getMoveOptions(index: number) {
  const options = [];
  
  if (index > 0) {
    options.push({
      label: '上移',
      key: 'up',
      icon: () => h(NIcon, null, { default: () => h(IconMdiArrowUp) })
    });
  }
  
  if (index < currentFields.value.length - 1) {
    options.push({
      label: '下移',
      key: 'down',
      icon: () => h(NIcon, null, { default: () => h(IconMdiArrowDown) })
    });
  }
  
  return options;
}
</script>

<template>
  <div class="entity-field-manager">
    <!-- 字段统计信息（紧凑版） -->
    <div class="field-stats-compact">
      <div class="stats-row">
        <span class="stat-item">共 <strong>{{ fieldStats.total }}</strong> 个字段</span>
        <span v-if="fieldStats.primaryKeys > 0" class="stat-badge primary-key">{{ fieldStats.primaryKeys }} 主键</span>
        <span v-if="fieldStats.foreignKeys > 0" class="stat-badge foreign-key">{{ fieldStats.foreignKeys }} 外键</span>
        <span v-if="fieldStats.required > 0" class="stat-badge required">{{ fieldStats.required }} 必填</span>
      </div>
    </div>

    <!-- 字段列表头部 -->
    <div class="field-header">
      <span class="header-title">字段列表</span>
      <NButton size="tiny" type="primary" @click="handleAddField">
        <template #icon>
          <NIcon><icon-mdi-plus /></NIcon>
        </template>
        添加
      </NButton>
    </div>

    <!-- 字段列表内容 -->
    <div class="field-content">
      <div v-if="loading" class="loading-state">
        <NIcon size="16" class="animate-spin">
          <icon-mdi-loading />
        </NIcon>
        <span class="text-xs text-gray-500">加载中...</span>
      </div>

      <div v-else-if="currentFields.length === 0" class="empty-state">
        <NIcon size="20" class="text-gray-300">
          <icon-mdi-circle-small />
        </NIcon>
        <span class="text-xs text-gray-500">暂无字段</span>
        <NButton size="tiny" text @click="handleAddField">添加第一个字段</NButton>
      </div>

      <div v-else class="fields-list">
        <div
          v-for="(field, index) in currentFields"
          :key="field.id || index"
          class="field-item"
          :class="{
            'is-primary': field.isPrimaryKey,
            'is-required': field.isRequired,
            'is-foreign': field.isForeignKey
          }"
        >
          <!-- 字段信息行 -->
          <div class="field-row">
            <div class="field-info">
              <div class="field-name-row">
                <NIcon class="field-icon" :class="getFieldIconClass(field)">
                  <icon-mdi-key v-if="field.isPrimaryKey" />
                  <icon-mdi-link v-else-if="field.isForeignKey" />
                  <icon-mdi-circle-small v-else />
                </NIcon>
                <span class="field-name">{{ field.name }}</span>
                <span class="field-code">({{ field.code }})</span>
              </div>
              <div class="field-meta-row">
                <NTag size="tiny" :type="getFieldTypeColor(field.dataType)">{{ field.dataType }}</NTag>
                <span v-if="field.length" class="field-length">({{ field.length }})</span>
                <div class="field-badges">
                  <span v-if="field.isPrimaryKey" class="badge primary">PK</span>
                  <span v-if="field.isRequired" class="badge required">*</span>
                  <span v-if="field.isUnique" class="badge unique">U</span>
                  <span v-if="field.isForeignKey" class="badge foreign">FK</span>
                </div>
              </div>
            </div>
            
            <!-- 操作按钮 -->
            <div class="field-actions">
              <NButton size="tiny" quaternary @click="handleEditField(field, index)">
                <template #icon>
                  <NIcon><icon-mdi-pencil /></NIcon>
                </template>
              </NButton>
              
              <NDropdown :options="getMoveOptions(index)" @select="(key) => handleMoveField(index, key)">
                <NButton size="tiny" quaternary>
                  <template #icon>
                    <NIcon><icon-mdi-arrow-up /></NIcon>
                  </template>
                </NButton>
              </NDropdown>

              <NPopconfirm @positive-click="handleDeleteField(index)">
                <template #trigger>
                  <NButton size="tiny" quaternary type="error">
                    <template #icon>
                      <NIcon><icon-mdi-delete /></NIcon>
                    </template>
                  </NButton>
                </template>
                确定删除字段 "{{ field.name }}" 吗？
              </NPopconfirm>
            </div>
          </div>

          <!-- 字段描述（如果有） -->
          <div v-if="field.description" class="field-description">
            <span class="text-xs text-gray-600">{{ field.description }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 字段编辑表单 -->
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
  @apply w-full h-full flex flex-col;
}

/* 紧凑统计信息 */
.field-stats-compact {
  @apply p-3 bg-gradient-to-r from-blue-50 to-green-50 border-b border-gray-200;
}

.stats-row {
  @apply flex items-center space-x-3 text-sm;
}

.stat-badge {
  @apply px-2 py-1 rounded text-xs font-medium;
}

.stat-badge.primary-key {
  @apply bg-yellow-100 text-yellow-800;
}

.stat-badge.foreign-key {
  @apply bg-blue-100 text-blue-800;
}

.stat-badge.required {
  @apply bg-red-100 text-red-800;
}

/* 字段列表头部 */
.field-header {
  @apply flex items-center justify-between p-3 border-b border-gray-200 bg-gray-50;
}

.header-title {
  @apply text-sm font-medium text-gray-700;
}

/* 字段列表内容 */
.field-content {
  @apply flex-1 overflow-hidden;
}

.loading-state {
  @apply flex items-center justify-center space-x-2 p-6 text-gray-500;
}

.empty-state {
  @apply flex flex-col items-center justify-center space-y-2 p-6 text-gray-500;
}

.fields-list {
  @apply divide-y divide-gray-200;
}

/* 字段项目 */
.field-item {
  @apply p-3 hover:bg-gray-50 transition-colors;
}

.field-item.is-primary {
  @apply bg-yellow-50 border-l-4 border-l-yellow-400;
}

.field-item.is-required {
  @apply border-l-4 border-l-red-300;
}

.field-item.is-foreign {
  @apply border-l-4 border-l-blue-300;
}

.field-row {
  @apply flex items-start justify-between;
}

.field-info {
  @apply flex-1 min-w-0 space-y-1;
}

.field-name-row {
  @apply flex items-center space-x-2;
}

.field-icon {
  @apply text-sm flex-shrink-0;
}

.field-name {
  @apply font-medium text-gray-900 text-sm;
}

.field-code {
  @apply text-xs text-gray-500;
}

.field-meta-row {
  @apply flex items-center space-x-2;
}

.field-length {
  @apply text-xs text-gray-500;
}

.field-badges {
  @apply flex items-center space-x-1;
}

.badge {
  @apply px-1 py-0.5 rounded text-xs font-mono text-white;
}

.badge.primary {
  @apply bg-yellow-500;
}

.badge.required {
  @apply bg-red-500;
}

.badge.unique {
  @apply bg-blue-500;
}

.badge.foreign {
  @apply bg-purple-500;
}

.field-actions {
  @apply flex items-center space-x-1 flex-shrink-0;
}

.field-description {
  @apply mt-2 pt-2 border-t border-gray-100;
}
</style>