<template>
  <NDrawer v-model:show="drawerVisible" :width="640" :title="title">
    <NDrawerContent :title="title" closable>
      <NForm ref="formRef" :model="formModel" :rules="rules" label-placement="left" :label-width="100">
        <NFormItem :label="$t('page.lowcode.query.name')" path="name">
          <NInput v-model:value="formModel.name" :placeholder="$t('page.lowcode.query.form.name.placeholder')" />
        </NFormItem>
        <NFormItem :label="$t('page.lowcode.query.description')" path="description">
          <NInput
            v-model:value="formModel.description"
            type="textarea"
            :placeholder="$t('page.lowcode.query.form.description.placeholder')"
          />
        </NFormItem>
        <NFormItem :label="$t('page.lowcode.query.sql')" path="sql">
          <NInput
            v-model:value="formModel.sql"
            type="textarea"
            :rows="8"
            :placeholder="$t('page.lowcode.query.form.sql.placeholder')"
          />
        </NFormItem>
        <NFormItem :label="$t('common.status')" path="status">
          <NRadioGroup v-model:value="formModel.status">
            <NRadio v-for="item in queryStatusOptions" :key="item.value" :value="item.value" :label="item.label" />
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
import { queryStatusOptions } from '@/constants/business';

export interface Props {
  /** the type of operation */
  operateType: NaiveUI.TableOperateType;
  /** the edit row data */
  rowData?: Api.Lowcode.MultiTableQuery | null;
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
    add: $t('page.lowcode.query.addQuery'),
    edit: $t('page.lowcode.query.editQuery')
  };
  return titles[props.operateType];
});

const formModel = reactive<Api.Lowcode.QueryEdit>(createDefaultModel());

function createDefaultModel(): Api.Lowcode.QueryEdit {
  return {
    projectId: '',
    name: '',
    description: '',
    baseEntityId: '',
    baseEntityAlias: 'main',
    joins: [],
    fields: [],
    filters: [],
    sorting: [],
    groupBy: [],
    having: [],
    sql: '',
    status: 'DRAFT'
  };
}

const rules: FormRules = {
  name: defaultRequiredRule,
  sql: defaultRequiredRule,
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
