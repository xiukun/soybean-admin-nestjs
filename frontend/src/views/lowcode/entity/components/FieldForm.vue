<template>
  <NModal :show="visible" @update:show="emit('update:visible', $event)" preset="dialog" title="字段编辑" style="width: 600px">
    <NForm ref="formRef" :model="formData" :rules="rules" label-placement="left" label-width="100px">
      <NFormItem label="字段名称" path="name">
        <NInput v-model:value="formData.name" placeholder="请输入字段名称" />
      </NFormItem>
      
      <NFormItem label="字段代码" path="code">
        <NInput v-model:value="formData.code" placeholder="请输入字段代码" />
      </NFormItem>
      
      <NFormItem label="数据类型" path="dataType">
        <NSelect 
          v-model:value="formData.dataType" 
          :options="dataTypeOptions" 
          placeholder="请选择数据类型"
        />
      </NFormItem>
      
      <NFormItem label="字段描述" path="description">
        <NInput 
          v-model:value="formData.description" 
          type="textarea" 
          placeholder="请输入字段描述"
          :rows="3"
        />
      </NFormItem>
      
      <NFormItem label="字段属性">
        <NSpace>
          <NCheckbox v-model:checked="formData.isPrimaryKey">主键</NCheckbox>
          <NCheckbox v-model:checked="formData.isRequired">必填</NCheckbox>
          <NCheckbox v-model:checked="formData.isUnique">唯一</NCheckbox>
        </NSpace>
      </NFormItem>
      
      <NFormItem label="默认值" path="defaultValue">
        <NInput v-model:value="formData.defaultValue" placeholder="请输入默认值" />
      </NFormItem>
    </NForm>
    
    <template #action>
      <NSpace>
        <NButton @click="handleCancel">取消</NButton>
        <NButton type="primary" @click="handleSave" :loading="saving">保存</NButton>
      </NSpace>
    </template>
  </NModal>
</template>

<script setup lang="ts">
import { ref, reactive, watch } from 'vue';
import type { FormInst, FormRules } from 'naive-ui';
import { NModal, NForm, NFormItem, NInput, NSelect, NCheckbox, NSpace, NButton } from 'naive-ui';

/**
 * 字段数据接口
 */
export interface FieldData {
  id?: string;
  name: string;
  code: string;
  dataType: string;
  description?: string;
  isPrimaryKey: boolean;
  isRequired: boolean;
  isUnique: boolean;
  defaultValue?: string;
}

interface Props {
  visible: boolean;
  fieldData?: FieldData | null;
}

interface Emits {
  (e: 'update:visible', value: boolean): void;
  (e: 'save', data: FieldData): void;
}

const props = withDefaults(defineProps<Props>(), {
  visible: false,
  fieldData: null
});

const emit = defineEmits<Emits>();

// 表单引用
const formRef = ref<FormInst | null>(null);
const saving = ref(false);

// 表单数据
const formData = reactive<FieldData>({
  name: '',
  code: '',
  dataType: 'STRING',
  description: '',
  isPrimaryKey: false,
  isRequired: false,
  isUnique: false,
  defaultValue: ''
});

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

// 表单验证规则
const rules: FormRules = {
  name: {
    required: true,
    message: '请输入字段名称',
    trigger: 'blur'
  },
  code: {
    required: true,
    message: '请输入字段代码',
    trigger: 'blur'
  },
  dataType: {
    required: true,
    message: '请选择数据类型',
    trigger: 'change'
  }
};

/**
 * 重置表单数据
 */
function resetForm() {
  Object.assign(formData, {
    name: '',
    code: '',
    dataType: 'STRING',
    description: '',
    isPrimaryKey: false,
    isRequired: false,
    isUnique: false,
    defaultValue: ''
  });
}

/**
 * 处理取消操作
 */
function handleCancel() {
  emit('update:visible', false);
  resetForm();
}

/**
 * 处理保存操作
 */
async function handleSave() {
  if (!formRef.value) return;
  
  try {
    await formRef.value.validate();
    saving.value = true;
    
    const fieldToSave: FieldData = {
      ...formData,
      id: props.fieldData?.id || `field_${Date.now()}`
    };
    
    emit('save', fieldToSave);
    emit('update:visible', false);
    resetForm();
  } catch (error) {
    console.error('表单验证失败:', error);
  } finally {
    saving.value = false;
  }
}

// 监听字段数据变化，更新表单
watch(
  () => props.fieldData,
  (newData) => {
    if (newData) {
      Object.assign(formData, newData);
    } else {
      resetForm();
    }
  },
  { immediate: true }
);
</script>

<style scoped>
/* 组件样式 */
</style>