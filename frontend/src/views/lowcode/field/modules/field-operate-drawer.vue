<template>
  <NDrawer v-model:show="drawerVisible" display-directive="show" :width="640">
    <NDrawerContent :title="title" :native-scrollbar="false" closable>
      <NForm ref="formRef" :model="formModel" :rules="rules" label-placement="left" :label-width="100">
        <NFormItem label="字段名称" path="name">
          <NInput v-model:value="formModel.name" placeholder="请输入字段名称" />
        </NFormItem>
        <NFormItem label="字段代码" path="code">
          <NInput v-model:value="formModel.code" placeholder="请输入字段代码" />
        </NFormItem>
        <NFormItem label="数据类型" path="dataType">
          <NSelect
            v-model:value="formModel.dataType"
            placeholder="请选择数据类型"
            :options="fieldTypeOptions"
            @update:value="handleTypeChange"
          />
        </NFormItem>
        <NFormItem v-if="showLengthField" label="字段长度" path="length">
          <NInputNumber
            v-model:value="formModel.length"
            placeholder="请输入字段长度"
            :min="1"
            :max="65535"
            style="width: 100%"
          />
        </NFormItem>
        <NFormItem v-if="showPrecisionFields" label="精度" path="precision">
          <NInputNumber
            v-model:value="formModel.precision"
            placeholder="请输入精度"
            :min="1"
            :max="65"
            style="width: 100%"
          />
        </NFormItem>
        <NFormItem label="描述" path="description">
          <NInput
            v-model:value="formModel.description"
            placeholder="请输入字段描述"
            type="textarea"
            :rows="3"
          />
        </NFormItem>
        <NFormItem label="属性">
          <NSpace vertical>
            <NCheckbox v-model:checked="formModel.required">
              必填
            </NCheckbox>
            <NCheckbox v-model:checked="formModel.unique">
              唯一
            </NCheckbox>
          </NSpace>
        </NFormItem>
        <NFormItem label="默认值" path="defaultValue">
          <NInput
            v-model:value="formModel.defaultValue"
            placeholder="请输入默认值"
          />
        </NFormItem>
        <NFormItem label="显示顺序" path="displayOrder">
          <NInputNumber
            v-model:value="formModel.displayOrder"
            placeholder="请输入显示顺序"
            :min="0"
            style="width: 100%"
          />
        </NFormItem>
      </NForm>
      <template #footer>
        <NSpace :size="16">
          <NButton @click="closeDrawer">{{ $t('common.cancel') }}</NButton>
          <NButton type="primary" @click="handleSubmit">{{ $t('common.confirm') }}</NButton>
        </NSpace>
      </template>
    </NDrawerContent>
  </NDrawer>
</template>

<script setup lang="ts">
import { computed, reactive, watch } from 'vue';
import type { FormInst, FormRules } from 'naive-ui';
import { fetchAddField, fetchUpdateField } from '@/service/api';
import { $t } from '@/locales';
import { createRequiredFormRule } from '@/utils/form/rule';
import { useNaiveForm, useFormRules } from '@/hooks/common/form';

export interface Props {
  /** the type of operation */
  operateType: NaiveUI.TableOperateType;
  /** the edit row data */
  rowData?: Api.Lowcode.Field | null;
  /** entity id */
  entityId: string;
}

export interface Emits {
  (e: 'submitted'): void;
}

const props = withDefaults(defineProps<Props>(), {
  rowData: null
});

const emit = defineEmits<Emits>();

const visible = defineModel<boolean>('visible', {
  default: false
});

const { formRef, validate, restoreValidation } = useNaiveForm();
const { defaultRequiredRule } = useFormRules();

const title = computed(() => {
  const titles: Record<NaiveUI.TableOperateType, string> = {
    add: $t('page.lowcode.field.addField'),
    edit: $t('page.lowcode.field.editField')
  };
  return titles[props.operateType];
});

const fieldTypeOptions = [
  { label: 'STRING', value: 'STRING' },
  { label: 'INTEGER', value: 'INTEGER' },
  { label: 'DECIMAL', value: 'DECIMAL' },
  { label: 'BOOLEAN', value: 'BOOLEAN' },
  { label: 'DATE', value: 'DATE' },
  { label: 'DATETIME', value: 'DATETIME' },
  { label: 'TEXT', value: 'TEXT' },
  { label: 'JSON', value: 'JSON' }
];

const showLengthField = computed(() => {
  return ['STRING'].includes(formModel.dataType);
});

const showPrecisionFields = computed(() => {
  return formModel.dataType === 'DECIMAL';
});

function createDefaultFormModel() {
  return {
    entityId: props.entityId,
    name: '',
    code: '',
    dataType: 'STRING' as Api.Lowcode.FieldDataType,
    description: '',
    length: undefined,
    precision: undefined,
    required: false,
    unique: false,
    defaultValue: '',
    config: {},
    displayOrder: 0
  };
}

const formModel = reactive(createDefaultFormModel());

const rules: FormRules = {
  name: createRequiredFormRule('字段名称不能为空'),
  code: [
    createRequiredFormRule('字段代码不能为空'),
    {
      pattern: /^[a-zA-Z][a-zA-Z0-9_]*$/,
      message: '字段代码必须以字母开头，只能包含字母、数字和下划线',
      trigger: 'blur'
    }
  ],
  dataType: createRequiredFormRule('数据类型不能为空'),
  length: {
    type: 'number',
    required: showLengthField.value,
    message: '字段长度不能为空',
    trigger: 'blur'
  },
  precision: {
    type: 'number',
    required: showPrecisionFields.value,
    message: '精度不能为空',
    trigger: 'blur'
  }
};

function handleUpdateFormModel(model: Partial<Api.Lowcode.FieldEdit>) {
  Object.assign(formModel, model);
}

function handleUpdateFormModelByModalType() {
  const handlers: Record<NaiveUI.TableOperateType, () => void> = {
    add: () => {
      const defaultFormModel = createDefaultFormModel();
      handleUpdateFormModel(defaultFormModel);
    },
    edit: () => {
      if (props.rowData) {
        handleUpdateFormModel(props.rowData);
      }
    }
  };

  handlers[props.operateType]();
}

function handleTypeChange() {
  // Clear length/precision fields when type changes
  formModel.length = undefined;
  formModel.precision = undefined;
}

async function handleSubmit() {
  await validate();
  
  const handlers: Record<NaiveUI.TableOperateType, () => Promise<void>> = {
    add: async () => {
      await fetchAddField(formModel as any);
    },
    edit: async () => {
      if (props.rowData) {
        await fetchUpdateField(props.rowData.id, formModel as any);
      }
    }
  };

  await handlers[props.operateType]();
  
  window.$message?.success($t('common.updateSuccess'));
  closeDrawer();
  emit('submitted');
}

function closeDrawer() {
  visible.value = false;
}

const drawerVisible = computed({
  get() {
    return visible.value;
  },
  set(value) {
    visible.value = value;
  }
});

watch(visible, () => {
  if (visible.value) {
    handleUpdateFormModelByModalType();
    restoreValidation();
  }
});
</script>

<style scoped></style>
