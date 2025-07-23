<template>
  <NDrawer v-model:show="drawerVisible" :width="800" :title="title">
    <NDrawerContent :title="title" closable>
      <NForm ref="formRef" :model="formModel" :rules="rules" label-placement="left" :label-width="120">
        <NFormItem :label="$t('page.lowcode.template.name')" path="name">
          <NInput v-model:value="formModel.name" :placeholder="$t('page.lowcode.template.form.name.placeholder')" />
        </NFormItem>
        <NFormItem :label="$t('page.lowcode.template.description')" path="description">
          <NInput
            v-model:value="formModel.description"
            type="textarea"
            :placeholder="$t('page.lowcode.template.form.description.placeholder')"
          />
        </NFormItem>
        <NFormItem :label="$t('page.lowcode.template.category')" path="category">
          <NSelect
            v-model:value="formModel.category"
            :placeholder="$t('page.lowcode.template.form.category.placeholder')"
            :options="categoryOptions"
          />
        </NFormItem>
        <NFormItem :label="$t('page.lowcode.template.content')" path="content">
          <NInput
            v-model:value="formModel.content"
            type="textarea"
            :rows="10"
            :placeholder="$t('page.lowcode.template.form.content.placeholder')"
          />
        </NFormItem>
        <NFormItem :label="$t('common.status')" path="status">
          <NRadioGroup v-model:value="formModel.status">
            <NRadio v-for="item in enableStatusOptions" :key="item.value" :value="item.value" :label="item.label" />
          </NRadioGroup>
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
import { createRequiredFormRule } from '@/utils/form/rule';
import { useNaiveForm } from '@/hooks/common/form';
import { useFormRules } from '@/hooks/common/form';
import { $t } from '@/locales';
import { enableStatusOptions } from '@/constants/business';

export interface Props {
  /** the type of operation */
  operateType: AntDesign.TableOperateType;
  /** the edit row data */
  rowData?: Api.Lowcode.CodeTemplate | null;
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
  const titles: Record<AntDesign.TableOperateType, string> = {
    add: $t('page.lowcode.template.addTemplate'),
    edit: $t('page.lowcode.template.editTemplate')
  };
  return titles[props.operateType];
});

const formModel = reactive(createDefaultModel());

function createDefaultModel() {
  return {
    name: '',
    description: '',
    category: '',
    content: '',
    status: 'DRAFT'
  };
}

const categoryOptions = [
  { label: $t('page.lowcode.template.categories.PAGE'), value: 'PAGE' },
  { label: $t('page.lowcode.template.categories.COMPONENT'), value: 'COMPONENT' },
  { label: $t('page.lowcode.template.categories.CONTROLLER'), value: 'CONTROLLER' },
  { label: $t('page.lowcode.template.categories.SERVICE'), value: 'SERVICE' },
  { label: $t('page.lowcode.template.categories.MODEL'), value: 'MODEL' },
  { label: $t('page.lowcode.template.categories.DTO'), value: 'DTO' },
  { label: $t('page.lowcode.template.categories.CONFIG'), value: 'CONFIG' },
  { label: $t('page.lowcode.template.categories.TEST'), value: 'TEST' }
];

const rules: FormRules = {
  name: defaultRequiredRule,
  category: defaultRequiredRule,
  content: defaultRequiredRule,
  status: defaultRequiredRule
};

const drawerVisible = computed({
  get() {
    return visible.value;
  },
  set(value) {
    visible.value = value;
  }
});

function closeDrawer() {
  visible.value = false;
}

async function handleSubmit() {
  await validate();
  // TODO: submit form
  window.$message?.success($t('common.updateSuccess'));
  closeDrawer();
  emit('submitted');
}

watch(visible, () => {
  if (visible.value) {
    handleInitModel();
    restoreValidation();
  }
});

function handleInitModel() {
  Object.assign(formModel, createDefaultModel());

  if (props.operateType === 'edit' && props.rowData) {
    Object.assign(formModel, props.rowData);
  }
}
</script>

<style scoped></style>
