<script setup lang="ts">
import { reactive, ref } from 'vue';
import type { FormInst, FormRules } from 'naive-ui';
import {
  NButton,
  NCard,
  NCheckbox,
  NDivider,
  NEmpty,
  NForm,
  NFormItem,
  NIcon,
  NInput,
  NModal,
  NSelect,
  NSpace,
  NTag
} from 'naive-ui';
// Entity type definition moved inline
interface Entity {
  id: string;
  projectId: string;
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

/** 初始字段接口 */
interface InitialField {
  name: string;
  code: string;
  dataType: string;
  isRequired: boolean;
}

/** 表单数据接口 */
interface FormData {
  name: string;
  code: string;
  tableName: string;
  category: string;
  description: string;
  commonFieldOptions: {
    enableCommonFields: boolean;
    autoCreateTable: boolean;
  };
  initialFields: InitialField[];
}

interface Props {
  visible: boolean;
  projectId: string;
}

interface Emits {
  (e: 'update:visible', value: boolean): void;
  (e: 'create', entity: Entity): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

// 表单引用和状态
const formRef = ref<FormInst | null>(null);
const creating = ref(false);

// 表单数据
const formData = reactive<FormData>({
  name: '',
  code: '',
  tableName: '',
  category: 'business',
  description: '',
  commonFieldOptions: {
    enableCommonFields: true,
    autoCreateTable: true
  },
  initialFields: []
});

// 分类选项
const categoryOptions = [
  { label: '核心', value: 'core' },
  { label: '业务', value: 'business' },
  { label: '系统', value: 'system' },
  { label: '配置', value: 'config' }
];

// 数据类型选项
const dataTypeOptions = [
  { label: '字符串', value: 'STRING' },
  { label: '整数', value: 'INTEGER' },
  { label: '长整数', value: 'BIGINT' },
  { label: '小数', value: 'DECIMAL' },
  { label: '布尔值', value: 'BOOLEAN' },
  { label: '日期', value: 'DATE' },
  { label: '日期时间', value: 'DATETIME' },
  { label: '文本', value: 'TEXT' },
  { label: 'JSON', value: 'JSON' }
];

// 通用字段定义
const commonFields = [
  { name: 'ID', code: 'id', type: 'STRING', description: '主键标识符' },
  { name: '创建人', code: 'createdBy', type: 'STRING', description: '记录创建人' },
  { name: '创建时间', code: 'createdAt', type: 'DATETIME', description: '记录创建时间' },
  { name: '更新人', code: 'updatedBy', type: 'STRING', description: '记录更新人' },
  { name: '更新时间', code: 'updatedAt', type: 'DATETIME', description: '记录更新时间' }
];

// 表单验证规则
const rules: FormRules = {
  name: {
    required: true,
    message: '请输入实体名称',
    trigger: 'blur'
  },
  code: {
    required: true,
    message: '请输入实体代码',
    trigger: 'blur'
  },
  tableName: {
    required: true,
    message: '请输入表名',
    trigger: 'blur'
  },
  category: {
    required: true,
    message: '请选择分类',
    trigger: 'change'
  }
};

/** 获取字段类型颜色 */
function getFieldTypeColor(dataType: string): 'default' | 'primary' | 'info' | 'success' | 'warning' | 'error' {
  const colorMap: Record<string, 'default' | 'primary' | 'info' | 'success' | 'warning' | 'error'> = {
    STRING: 'default',
    INTEGER: 'primary',
    BIGINT: 'info',
    DECIMAL: 'warning',
    BOOLEAN: 'success',
    DATE: 'error',
    DATETIME: 'error',
    TEXT: 'default',
    JSON: 'info'
  };
  return colorMap[dataType] || 'default';
}

/** 处理名称变化，自动生成代码和表名 */
function handleNameChange(value: string) {
  if (!formData.code) {
    formData.code = value.toLowerCase().replace(/\s+/g, '_');
  }
  if (!formData.tableName) {
    formData.tableName = value.toLowerCase().replace(/\s+/g, '_');
  }
}

/** 处理代码变化，自动生成表名 */
function handleCodeChange(value: string) {
  if (!formData.tableName) {
    formData.tableName = value.toLowerCase();
  }
}

/** 添加字段 */
function handleAddField() {
  formData.initialFields.push({
    name: '',
    code: '',
    dataType: 'STRING',
    isRequired: false
  });
}

/** 移除字段 */
function handleRemoveField(index: number) {
  formData.initialFields.splice(index, 1);
}

/** 重置表单 */
function resetForm() {
  Object.assign(formData, {
    name: '',
    code: '',
    tableName: '',
    category: 'business',
    description: '',
    commonFieldOptions: {
      enableCommonFields: true,
      autoCreateTable: true
    },
    initialFields: []
  });
}

/** 处理取消 */
function handleCancel() {
  emit('update:visible', false);
  resetForm();
}

/** 处理创建 */
async function handleCreate() {
  if (!formRef.value) return;

  try {
    await formRef.value.validate();
    creating.value = true;

    const newEntity: Entity = {
      id: `entity_${Date.now()}`,
      projectId: props.projectId,
      name: formData.name,
      code: formData.code,
      tableName: formData.tableName,
      category: formData.category,
      description: formData.description,
      status: 'DRAFT',
      fieldCount:
        formData.initialFields.length + (formData.commonFieldOptions.enableCommonFields ? commonFields.length : 0)
    };

    emit('create', newEntity);
    emit('update:visible', false);
    resetForm();

    window.$message?.success('实体创建成功');
  } catch (error) {
    console.error('表单验证失败:', error);
  } finally {
    creating.value = false;
  }
}
</script>

<template>
  <NModal v-model:show="visible" preset="dialog" title="创建实体" style="width: 700px">
    <NForm ref="formRef" :model="formData" :rules="rules" label-placement="left" label-width="120px">
      <!-- 基本信息 -->
      <NDivider title-placement="left">基本信息</NDivider>

      <NFormItem label="实体名称" path="name">
        <NInput v-model:value="formData.name" placeholder="请输入实体名称" @input="handleNameChange" />
      </NFormItem>

      <NFormItem label="实体代码" path="code">
        <NInput v-model:value="formData.code" placeholder="请输入实体代码" @input="handleCodeChange" />
      </NFormItem>

      <NFormItem label="表名" path="tableName">
        <NInput v-model:value="formData.tableName" placeholder="请输入表名" />
      </NFormItem>

      <NFormItem label="分类" path="category">
        <NSelect v-model:value="formData.category" :options="categoryOptions" placeholder="请选择分类" />
      </NFormItem>

      <NFormItem label="描述" path="description">
        <NInput v-model:value="formData.description" type="textarea" placeholder="请输入实体描述" :rows="3" />
      </NFormItem>

      <!-- 通用字段配置 -->
      <NDivider title-placement="left">通用字段配置</NDivider>

      <NFormItem label="通用字段">
        <NSpace vertical>
          <NCheckbox v-model:checked="formData.commonFieldOptions.enableCommonFields">自动添加通用字段</NCheckbox>
          <NCheckbox v-model:checked="formData.commonFieldOptions.autoCreateTable">自动创建数据库表</NCheckbox>
        </NSpace>
      </NFormItem>

      <!-- 通用字段预览 -->
      <NFormItem v-if="formData.commonFieldOptions.enableCommonFields" label="通用字段预览">
        <NCard size="small">
          <div class="common-fields-preview">
            <div v-for="field in commonFields" :key="field.code" class="field-item">
              <div class="field-info">
                <span class="field-name">{{ field.name }}</span>
                <NTag size="small" :type="getFieldTypeColor(field.type)">{{ field.type }}</NTag>
              </div>
              <div class="field-description">{{ field.description }}</div>
            </div>
          </div>
        </NCard>
      </NFormItem>

      <!-- 初始字段 -->
      <NDivider title-placement="left">初始字段</NDivider>

      <NFormItem label="字段列表">
        <div class="initial-fields">
          <div class="fields-header">
            <span>字段列表</span>
            <NButton size="small" type="primary" @click="handleAddField">
              <template #icon>
                <NIcon><icon-mdi-plus /></NIcon>
              </template>
              添加字段
            </NButton>
          </div>

          <div v-if="formData.initialFields.length === 0" class="no-fields">
            <NEmpty description="暂无字段" size="small" />
          </div>

          <div v-else class="fields-list">
            <div v-for="(field, index) in formData.initialFields" :key="index" class="field-row">
              <NInput v-model:value="field.name" placeholder="字段名称" style="width: 120px" />
              <NInput v-model:value="field.code" placeholder="字段代码" style="width: 120px" />
              <NSelect
                v-model:value="field.dataType"
                :options="dataTypeOptions"
                placeholder="类型"
                style="width: 100px"
              />
              <NCheckbox v-model:checked="field.isRequired" size="small">必填</NCheckbox>
              <NButton size="small" quaternary type="error" @click="handleRemoveField(index)">
                <template #icon>
                  <NIcon><icon-mdi-delete /></NIcon>
                </template>
              </NButton>
            </div>
          </div>
        </div>
      </NFormItem>
    </NForm>

    <template #action>
      <NSpace>
        <NButton @click="handleCancel">取消</NButton>
        <NButton type="primary" :loading="creating" @click="handleCreate">创建</NButton>
      </NSpace>
    </template>
  </NModal>
</template>

<style scoped>
.common-fields-preview {
  max-height: 200px;
  overflow-y: auto;
}

.field-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid #f0f0f0;
}

.field-item:last-child {
  border-bottom: none;
}

.field-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.field-name {
  font-weight: 500;
}

.field-description {
  font-size: 12px;
  color: #666;
}

.initial-fields {
  border: 1px solid #e0e0e6;
  border-radius: 6px;
  padding: 12px;
}

.fields-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
  font-weight: 500;
}

.no-fields {
  text-align: center;
  padding: 20px;
}

.fields-list {
  max-height: 300px;
  overflow-y: auto;
}

.field-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.field-row:last-child {
  margin-bottom: 0;
}
</style>
