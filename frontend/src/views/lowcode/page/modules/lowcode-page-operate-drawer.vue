<script setup lang="ts">
import { computed, reactive, watch } from 'vue';
import type { FormRules } from 'naive-ui';
import { enableStatusOptions } from '@/constants/business';
import { fetchAddLowcodePage, fetchUpdateLowcodePage } from '@/service/api';
import { useNaiveForm } from '@/hooks/common/form';
import { createRequiredFormRule } from '@/utils/form';
import { $t } from '@/locales';

defineOptions({
  name: 'LowcodePageOperateDrawer'
});

interface Props {
  /** the type of operation */
  operateType: NaiveUI.TableOperateType;
  /** the edit row data */
  rowData?: Api.LowcodePage.Page | null;
}

interface Emits {
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

const title = computed(() => {
  const titles: Record<NaiveUI.TableOperateType, string> = {
    add: $t('page.lowcode.page.addPage'),
    edit: $t('page.lowcode.page.editPage')
  };
  return titles[props.operateType];
});

const formModel = reactive<Api.LowcodePage.PageEdit>(createDefaultFormModel());

function createDefaultFormModel(): Api.LowcodePage.PageEdit {
  return {
    name: '',
    title: '',
    code: '',
    path: '',
    description: '',
    schema: '{}',
    status: 'ENABLED'
  };
}

const rules: FormRules = {
  name: createRequiredFormRule($t('page.lowcode.page.form.name')),
  title: createRequiredFormRule($t('page.lowcode.page.form.title')),
  code: createRequiredFormRule($t('page.lowcode.page.form.code')),
  path: createRequiredFormRule($t('page.lowcode.page.form.path')),
  schema: createRequiredFormRule($t('page.lowcode.page.form.schema')),
  status: createRequiredFormRule($t('page.lowcode.page.form.status'))
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

  if (props.operateType === 'add') {
    await fetchAddLowcodePage(formModel);
  } else if (props.operateType === 'edit' && props.rowData) {
    await fetchUpdateLowcodePage(props.rowData.id, formModel);
  }

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
  Object.assign(formModel, createDefaultFormModel());

  if (props.operateType === 'edit' && props.rowData) {
    Object.assign(formModel, props.rowData);
  }
}
</script>

<template>
  <NDrawer v-model:show="drawerVisible" display-directive="show" :width="640">
    <NDrawerContent :title="title" :native-scrollbar="false" closable>
      <NForm ref="formRef" :model="formModel" :rules="rules" label-placement="left" :label-width="100">
        <NFormItem :label="$t('page.lowcode.page.name')" path="name">
          <NInput v-model:value="formModel.name" :placeholder="$t('page.lowcode.page.form.name')" />
        </NFormItem>
        <NFormItem :label="$t('page.lowcode.page.title')" path="title">
          <NInput v-model:value="formModel.title" :placeholder="$t('page.lowcode.page.form.title')" />
        </NFormItem>
        <NFormItem :label="$t('page.lowcode.page.code')" path="code">
          <NInput v-model:value="formModel.code" :placeholder="$t('page.lowcode.page.form.code')" />
        </NFormItem>
        <NFormItem :label="$t('page.lowcode.page.path')" path="path">
          <NInput v-model:value="formModel.path" :placeholder="$t('page.lowcode.page.form.path')" />
        </NFormItem>
        <NFormItem :label="$t('page.lowcode.page.description')" path="description">
          <NInput
            v-model:value="formModel.description"
            type="textarea"
            :placeholder="$t('page.lowcode.page.form.description')"
          />
        </NFormItem>
        <NFormItem :label="$t('page.lowcode.page.schema')" path="schema">
          <NInput
            v-model:value="formModel.schema"
            type="textarea"
            :rows="10"
            :placeholder="$t('page.lowcode.page.form.schema')"
          />
        </NFormItem>
        <NFormItem :label="$t('common.status')" path="status">
          <NRadioGroup v-model:value="formModel.status">
            <NRadio v-for="item in enableStatusOptions" :key="item.value" :value="item.value" :label="item.label" />
          </NRadioGroup>
        </NFormItem>
      </NForm>
      <template #footer>
        <NSpace justify="end">
          <NButton @click="closeDrawer">{{ $t('common.cancel') }}</NButton>
          <NButton type="primary" @click="handleSubmit">{{ $t('common.confirm') }}</NButton>
        </NSpace>
      </template>
    </NDrawerContent>
  </NDrawer>
</template>

<style scoped></style>
