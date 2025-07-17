<template>
  <NDrawer v-model:show="drawerVisible" display-directive="show" :width="640">
    <NDrawerContent :title="title" :native-scrollbar="false" closable>
      <NForm ref="formRef" :model="formModel" :rules="rules" label-placement="left" :label-width="100">
        <NFormItem :label="$t('page.lowcode.field.name')" path="name">
          <NInput v-model:value="formModel.name" :placeholder="$t('page.lowcode.field.form.name.placeholder')" />
        </NFormItem>
        <NFormItem :label="$t('page.lowcode.field.code')" path="code">
          <NInput v-model:value="formModel.code" :placeholder="$t('page.lowcode.field.form.code.placeholder')" />
        </NFormItem>
        <NFormItem :label="$t('page.lowcode.field.type')" path="type">
          <NSelect 
            v-model:value="formModel.type" 
            :placeholder="$t('page.lowcode.field.form.type.placeholder')"
            :options="fieldTypeOptions"
            @update:value="handleTypeChange"
          />
        </NFormItem>
        <NFormItem v-if="showLengthField" :label="$t('page.lowcode.field.length')" path="length">
          <NInputNumber 
            v-model:value="formModel.length" 
            :placeholder="$t('page.lowcode.field.form.length.placeholder')"
            :min="1"
            :max="65535"
            style="width: 100%"
          />
        </NFormItem>
        <NFormItem v-if="showPrecisionFields" :label="$t('page.lowcode.field.precision')" path="precision">
          <NInputNumber 
            v-model:value="formModel.precision" 
            :placeholder="$t('page.lowcode.field.form.precision.placeholder')"
            :min="1"
            :max="65"
            style="width: 100%"
          />
        </NFormItem>
        <NFormItem v-if="showPrecisionFields" :label="$t('page.lowcode.field.scale')" path="scale">
          <NInputNumber 
            v-model:value="formModel.scale" 
            :placeholder="$t('page.lowcode.field.form.scale.placeholder')"
            :min="0"
            :max="30"
            style="width: 100%"
          />
        </NFormItem>
        <NFormItem :label="$t('page.lowcode.field.attributes')">
          <NSpace vertical>
            <NCheckbox v-model:checked="formModel.primaryKey">
              {{ $t('page.lowcode.field.primaryKey') }}
            </NCheckbox>
            <NCheckbox v-model:checked="formModel.unique">
              {{ $t('page.lowcode.field.unique') }}
            </NCheckbox>
            <NCheckbox v-model:checked="formModel.nullable">
              {{ $t('page.lowcode.field.nullable') }}
            </NCheckbox>
            <NCheckbox v-model:checked="formModel.autoIncrement">
              {{ $t('page.lowcode.field.autoIncrement') }}
            </NCheckbox>
          </NSpace>
        </NFormItem>
        <NFormItem :label="$t('page.lowcode.field.defaultValue')" path="defaultValue">
          <NInput 
            v-model:value="formModel.defaultValue" 
            :placeholder="$t('page.lowcode.field.form.defaultValue.placeholder')" 
          />
        </NFormItem>
        <NFormItem :label="$t('page.lowcode.field.comment')" path="comment">
          <NInput
            v-model:value="formModel.comment"
            :placeholder="$t('page.lowcode.field.form.comment.placeholder')"
            type="textarea"
            :rows="3"
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
  { label: 'VARCHAR', value: 'VARCHAR' },
  { label: 'TEXT', value: 'TEXT' },
  { label: 'INT', value: 'INT' },
  { label: 'BIGINT', value: 'BIGINT' },
  { label: 'DECIMAL', value: 'DECIMAL' },
  { label: 'FLOAT', value: 'FLOAT' },
  { label: 'DOUBLE', value: 'DOUBLE' },
  { label: 'BOOLEAN', value: 'BOOLEAN' },
  { label: 'DATE', value: 'DATE' },
  { label: 'DATETIME', value: 'DATETIME' },
  { label: 'TIMESTAMP', value: 'TIMESTAMP' },
  { label: 'JSON', value: 'JSON' },
  { label: 'UUID', value: 'UUID' }
];

const showLengthField = computed(() => {
  return ['VARCHAR', 'CHAR'].includes(formModel.type);
});

const showPrecisionFields = computed(() => {
  return formModel.type === 'DECIMAL';
});

function createDefaultFormModel(): Api.Lowcode.FieldEdit {
  return {
    entityId: props.entityId,
    name: '',
    code: '',
    type: 'VARCHAR',
    length: undefined,
    precision: undefined,
    scale: undefined,
    nullable: true,
    unique: false,
    primaryKey: false,
    autoIncrement: false,
    defaultValue: '',
    comment: ''
  };
}

const formModel: Api.Lowcode.FieldEdit = reactive(createDefaultFormModel());

const rules: FormRules = {
  name: createRequiredFormRule($t('page.lowcode.field.form.name.required')),
  code: [
    createRequiredFormRule($t('page.lowcode.field.form.code.required')),
    {
      pattern: /^[a-zA-Z][a-zA-Z0-9_]*$/,
      message: $t('page.lowcode.field.form.code.invalid'),
      trigger: 'blur'
    }
  ],
  type: createRequiredFormRule($t('page.lowcode.field.form.type.required')),
  length: {
    type: 'number',
    required: showLengthField.value,
    message: $t('page.lowcode.field.form.length.required'),
    trigger: 'blur'
  },
  precision: {
    type: 'number',
    required: showPrecisionFields.value,
    message: $t('page.lowcode.field.form.precision.required'),
    trigger: 'blur'
  },
  scale: {
    type: 'number',
    required: showPrecisionFields.value,
    message: $t('page.lowcode.field.form.scale.required'),
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
  formModel.scale = undefined;
}

async function handleSubmit() {
  await validate();
  
  const handlers: Record<NaiveUI.TableOperateType, () => Promise<void>> = {
    add: async () => {
      await fetchAddField(formModel);
    },
    edit: async () => {
      if (props.rowData) {
        await fetchUpdateField(props.rowData.id, formModel);
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
