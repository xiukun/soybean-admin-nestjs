<template>
  <NDrawer v-model:show="drawerVisible" :width="800" :title="title">
    <NDrawerContent :title="title" closable>
      <NForm ref="formRef" :model="formModel" :rules="rules" label-placement="left" :label-width="120">
        <NFormItem :label="$t('page.manage.template.name')" path="name">
          <NInput v-model:value="formModel.name" :placeholder="$t('page.manage.template.form.name')" />
        </NFormItem>
        <NFormItem :label="$t('page.manage.template.description')" path="description">
          <NInput
            v-model:value="formModel.description"
            type="textarea"
            :placeholder="$t('page.manage.template.form.description')"
          />
        </NFormItem>
        <NFormItem :label="$t('page.manage.template.category')" path="category">
          <NSelect
            v-model:value="formModel.category"
            :placeholder="$t('page.manage.template.form.category')"
            :options="categoryOptions"
          />
        </NFormItem>
        <NFormItem :label="$t('page.manage.template.content')" path="content">
          <NInput
            v-model:value="formModel.content"
            type="textarea"
            :rows="10"
            :placeholder="$t('page.manage.template.form.content')"
          />
        </NFormItem>
        <NFormItem :label="$t('page.manage.template.status')" path="status">
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
import { $t } from '@/locales';
import { enableStatusOptions } from '@/constants/business';

export interface Props {
  /** the type of operation */
  operateType: AntDesign.TableOperateType;
  /** the edit row data */
  rowData?: Api.SystemManage.Template | null;
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
    add: $t('page.manage.template.addTemplate'),
    edit: $t('page.manage.template.editTemplate')
  };
  return titles[props.operateType];
});

const formModel = reactive<Api.SystemManage.TemplateEdit>(createDefaultModel());

function createDefaultModel(): Api.SystemManage.TemplateEdit {
  return {
    name: '',
    description: '',
    category: null,
    content: '',
    status: null
  };
}

const categoryOptions = [
  { label: $t('page.manage.template.category.page'), value: 'page' },
  { label: $t('page.manage.template.category.component'), value: 'component' },
  { label: $t('page.manage.template.category.layout'), value: 'layout' }
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
