<template>
  <NDrawer v-model:show="drawerVisible" display-directive="show" :width="360">
    <NDrawerContent :title="title" :native-scrollbar="false" closable>
      <NForm ref="formRef" :model="formModel" :rules="rules">
        <NFormItem :label="$t('page.lowcode.entity.name')" path="name">
          <NInput v-model:value="formModel.name" :placeholder="$t('page.lowcode.entity.form.name.placeholder')" />
        </NFormItem>
        <NFormItem :label="$t('page.lowcode.entity.code')" path="code">
          <NInput 
            v-model:value="formModel.code" 
            :placeholder="$t('page.lowcode.entity.form.code.placeholder')"
            :disabled="operateType === 'edit'"
          />
        </NFormItem>
        <NFormItem :label="$t('page.lowcode.entity.tableName')" path="tableName">
          <NInput 
            v-model:value="formModel.tableName" 
            :placeholder="$t('page.lowcode.entity.form.tableName.placeholder')"
          />
        </NFormItem>
        <NFormItem :label="$t('page.lowcode.entity.category')" path="category">
          <NSelect
            v-model:value="formModel.category"
            :placeholder="$t('page.lowcode.entity.form.category.placeholder')"
            :options="categoryOptions"
          />
        </NFormItem>
        <NFormItem :label="$t('page.lowcode.entity.description')" path="description">
          <NInput
            v-model:value="formModel.description"
            :placeholder="$t('page.lowcode.entity.form.description.placeholder')"
            type="textarea"
            :rows="3"
          />
        </NFormItem>
        <NFormItem :label="$t('common.status')" path="status">
          <NRadioGroup v-model:value="formModel.status">
            <NSpace>
              <NRadio value="DRAFT">
                {{ $t('page.lowcode.entity.status.DRAFT') }}
              </NRadio>
              <NRadio value="PUBLISHED">
                {{ $t('page.lowcode.entity.status.PUBLISHED') }}
              </NRadio>
            </NSpace>
          </NRadioGroup>
        </NFormItem>
      </NForm>
      <template #footer>
        <NSpace :size="16">
          <NButton @click="closeDrawer">{{ $t('common.cancel') }}</NButton>
          <NButton type="primary" :loading="submitLoading" @click="handleSubmit">
            {{ $t('common.confirm') }}
          </NButton>
        </NSpace>
      </template>
    </NDrawerContent>
  </NDrawer>
</template>

<script setup lang="ts">
import { computed, reactive, watch, ref } from 'vue';
import type { FormInst, FormRules } from 'naive-ui';
import { fetchAddEntity, fetchGetEntity, fetchUpdateEntity } from '@/service/api';
import { $t } from '@/locales';
import { createRequiredFormRule } from '@/utils/form/rule';

defineOptions({
  name: 'EntityOperateDrawer'
});

interface Props {
  /** the type of operation */
  operateType: NaiveUI.TableOperateType;
  /** the edit row data */
  rowData?: Api.Lowcode.Entity | null;
  /** project id */
  projectId: string;
  visible: boolean;
}

interface Emits {
  (e: 'submitted'): void;
  (e: 'update:visible', visible: boolean): void;
}

const props = withDefaults(defineProps<Props>(), {
  rowData: null
});

const emit = defineEmits<Emits>();

const drawerVisible = computed({
  get() {
    return props.visible;
  },
  set(visible) {
    emit('update:visible', visible);
  }
});

const title = computed(() => {
  const titles: Record<NaiveUI.TableOperateType, string> = {
    add: $t('page.lowcode.entity.addEntity'),
    edit: $t('page.lowcode.entity.editEntity')
  };
  return titles[props.operateType];
});

const formRef = ref<FormInst | null>(null);

const formModel = reactive<Api.Lowcode.EntityEdit>(createDefaultFormModel());

function createDefaultFormModel(): Api.Lowcode.EntityEdit {
  return {
    projectId: props.projectId,
    name: '',
    code: '',
    tableName: '',
    category: 'core',
    description: '',
    status: 'DRAFT'
  };
}

const categoryOptions = [
  { label: $t('page.lowcode.entity.categories.core'), value: 'core' },
  { label: $t('page.lowcode.entity.categories.business'), value: 'business' },
  { label: $t('page.lowcode.entity.categories.system'), value: 'system' },
  { label: $t('page.lowcode.entity.categories.config'), value: 'config' }
];

const rules: FormRules = {
  name: createRequiredFormRule($t('page.lowcode.entity.form.name.required')),
  code: createRequiredFormRule($t('page.lowcode.entity.form.code.required')),
  tableName: createRequiredFormRule($t('page.lowcode.entity.form.tableName.required')),
  category: createRequiredFormRule($t('page.lowcode.entity.form.category.required'))
};

const submitLoading = ref(false);

function handleUpdateFormModel(model: Partial<Api.Lowcode.EntityEdit>) {
  Object.assign(formModel, model);
}

function handleUpdateFormModelByRowData() {
  if (props.operateType === 'add') {
    const defaultFormModel = createDefaultFormModel();
    handleUpdateFormModel(defaultFormModel);
    return;
  }

  if (props.operateType === 'edit' && props.rowData) {
    handleUpdateFormModel({
      ...props.rowData,
      projectId: props.projectId
    });
  }
}

async function handleSubmit() {
  await formRef.value?.validate();
  submitLoading.value = true;

  try {
    if (props.operateType === 'add') {
      await fetchAddEntity(formModel);
    } else if (props.operateType === 'edit' && props.rowData) {
      await fetchUpdateEntity(props.rowData.id, formModel);
    }

    window.$message?.success($t('common.updateSuccess'));
    closeDrawer();
    emit('submitted');
  } catch (error) {
    // 错误处理已在 service 层处理
  } finally {
    submitLoading.value = false;
  }
}

function closeDrawer() {
  drawerVisible.value = false;
}

watch(
  () => props.visible,
  newValue => {
    if (newValue) {
      handleUpdateFormModelByRowData();
    }
  }
);

watch(
  () => props.projectId,
  newValue => {
    formModel.projectId = newValue;
  }
);
</script>

<style scoped></style>
