<template>
  <NDrawer v-model:show="drawerVisible" display-directive="show" :width="360">
    <NDrawerContent :title="title" :native-scrollbar="false" closable>
      <NForm ref="formRef" :model="formModel" :rules="rules">
        <NFormItem :label="$t('page.lowcode.project.name')" path="name">
          <NInput v-model:value="formModel.name" :placeholder="$t('page.lowcode.project.form.name.placeholder')" />
        </NFormItem>
        <NFormItem :label="$t('page.lowcode.project.code')" path="code">
          <NInput 
            v-model:value="formModel.code" 
            :placeholder="$t('page.lowcode.project.form.code.placeholder')"
            :disabled="operateType === 'edit'"
          />
        </NFormItem>
        <NFormItem :label="$t('page.lowcode.project.description')" path="description">
          <NInput
            v-model:value="formModel.description"
            :placeholder="$t('page.lowcode.project.form.description.placeholder')"
            type="textarea"
            :rows="3"
          />
        </NFormItem>
        <NFormItem :label="$t('page.lowcode.project.version')" path="version">
          <NInput v-model:value="formModel.version" :placeholder="$t('page.lowcode.project.form.version.placeholder')" />
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
import { fetchAddProject, fetchGetProject, fetchUpdateProject } from '@/service/api';
import { $t } from '@/locales';
import { createRequiredFormRule } from '@/utils/form/rule';

defineOptions({
  name: 'ProjectOperateDrawer'
});

interface Props {
  /** the type of operation */
  operateType: NaiveUI.TableOperateType;
  /** the edit row data */
  rowData?: any;
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
    add: $t('page.lowcode.project.addProject'),
    edit: $t('page.lowcode.project.editProject')
  };
  return titles[props.operateType];
});

const formRef = ref<FormInst | null>(null);

const formModel = reactive<Api.Lowcode.ProjectEditForm>(createDefaultFormModel());

function createDefaultFormModel(): Api.Lowcode.ProjectEditForm {
  return {
    name: '',
    code: '',
    description: '',
    version: '1.0.0'
  };
}

const rules: FormRules = {
  name: createRequiredFormRule($t('page.lowcode.project.form.name.required')),
  code: createRequiredFormRule($t('page.lowcode.project.form.code.required')),
  version: createRequiredFormRule($t('page.lowcode.project.form.version.required'))
};

const submitLoading = ref(false);

function handleUpdateFormModel(model: Partial<Api.Lowcode.ProjectEditForm>) {
  Object.assign(formModel, model);
}

function handleUpdateFormModelByRowData() {
  if (props.operateType === 'add') {
    const defaultFormModel = createDefaultFormModel();
    handleUpdateFormModel(defaultFormModel);
    return;
  }

  if (props.operateType === 'edit' && props.rowData) {
    // 只提取允许编辑的字段，排除系统管理字段
    const editableData: Api.Lowcode.ProjectEditForm = {
      name: props.rowData.name,
      code: props.rowData.code,
      description: props.rowData.description,
      version: props.rowData.version,
      config: props.rowData.config
    };
    handleUpdateFormModel(editableData);
  }
}

async function handleSubmit() {
  await formRef.value?.validate();
  submitLoading.value = true;

  try {
    if (props.operateType === 'add') {
      await fetchAddProject(formModel);
    } else if (props.operateType === 'edit' && props.rowData) {
      await fetchUpdateProject(props.rowData.id, formModel);
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
</script>

<style scoped></style>
