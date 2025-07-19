<template>
  <NDrawer v-model:show="drawerVisible" display-directive="show" :width="480">
    <NDrawerContent :title="title" :native-scrollbar="false" closable>
      <NForm ref="formRef" :model="formModel" :rules="rules">
        <NFormItem :label="$t('page.lowcode.relation.name')" path="name">
          <NInput v-model:value="formModel.name" :placeholder="$t('page.lowcode.relation.form.name.placeholder')" />
        </NFormItem>
        <NFormItem :label="$t('page.lowcode.relation.code')" path="code">
          <NInput
            v-model:value="formModel.code"
            :placeholder="$t('page.lowcode.relation.form.code.placeholder')"
            :disabled="operateType === 'edit'"
          />
        </NFormItem>
        <NFormItem :label="$t('page.lowcode.relation.relationType')" path="type">
          <NSelect
            v-model:value="formModel.type"
            :placeholder="$t('page.lowcode.relation.form.relationType.placeholder')"
            :options="typeOptions"
            :disabled="operateType === 'edit'"
          />
        </NFormItem>
        <NFormItem :label="$t('page.lowcode.relation.sourceEntity')" path="sourceEntityId">
          <NSelect
            v-model:value="formModel.sourceEntityId"
            :placeholder="$t('page.lowcode.relation.form.sourceEntity.placeholder')"
            :options="entityOptions"
            :disabled="operateType === 'edit'"
            filterable
          />
        </NFormItem>
        <NFormItem :label="$t('page.lowcode.relation.targetEntity')" path="targetEntityId">
          <NSelect
            v-model:value="formModel.targetEntityId"
            :placeholder="$t('page.lowcode.relation.form.targetEntity.placeholder')"
            :options="entityOptions"
            :disabled="operateType === 'edit'"
            filterable
          />
        </NFormItem>
        <NFormItem :label="$t('page.lowcode.relation.description')" path="description">
          <NInput
            v-model:value="formModel.description"
            :placeholder="$t('page.lowcode.relation.form.description.placeholder')"
            type="textarea"
            :rows="3"
          />
        </NFormItem>
        <NFormItem :label="$t('page.lowcode.relation.onDelete')" path="onDelete">
          <NSelect
            v-model:value="formModel.onDelete"
            :placeholder="$t('page.lowcode.relation.form.onDelete.placeholder')"
            :options="cascadeOptions"
          />
        </NFormItem>
        <NFormItem :label="$t('page.lowcode.relation.onUpdate')" path="onUpdate">
          <NSelect
            v-model:value="formModel.onUpdate"
            :placeholder="$t('page.lowcode.relation.form.onUpdate.placeholder')"
            :options="cascadeOptions"
          />
        </NFormItem>
        <NFormItem :label="$t('common.status')" path="status">
          <NRadioGroup v-model:value="formModel.status">
            <NSpace>
              <NRadio value="ACTIVE">
                {{ $t('page.lowcode.common.status.active') }}
              </NRadio>
              <NRadio value="INACTIVE">
                {{ $t('page.lowcode.common.status.inactive') }}
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
import { computed, reactive, watch, onMounted, ref } from 'vue';
import type { FormInst, FormRules } from 'naive-ui';
import { fetchAddRelationship, fetchUpdateRelationship, fetchGetAllEntities } from '@/service/api';
import { $t } from '@/locales';
import { createRequiredFormRule } from '@/utils/form/rule';

defineOptions({
  name: 'RelationshipOperateDrawer'
});

interface Props {
  /** the type of operation */
  operateType: NaiveUI.TableOperateType;
  /** the edit row data */
  rowData?: Api.Lowcode.Relationship | null;
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
    add: $t('page.lowcode.relation.addRelation'),
    edit: $t('page.lowcode.relation.editRelation')
  };
  return titles[props.operateType];
});

const formRef = ref<FormInst | null>(null);

const formModel = reactive<Api.Lowcode.RelationshipEdit>(createDefaultFormModel());

function createDefaultFormModel(): Api.Lowcode.RelationshipEdit {
  return {
    projectId: props.projectId,
    name: '',
    code: '',
    type: 'ONE_TO_MANY',
    sourceEntityId: '',
    targetEntityId: '',
    description: '',
    onDelete: 'RESTRICT',
    onUpdate: 'RESTRICT',
    status: 'ACTIVE'
  };
}

const rules: FormRules = {
  name: createRequiredFormRule($t('page.lowcode.relation.form.name.required')),
  code: createRequiredFormRule($t('page.lowcode.relation.form.code.required')),
  type: createRequiredFormRule($t('page.lowcode.relation.form.relationType.required')),
  sourceEntityId: createRequiredFormRule($t('page.lowcode.relation.form.sourceEntity.required')),
  targetEntityId: createRequiredFormRule($t('page.lowcode.relation.form.targetEntity.required'))
};

const typeOptions = computed(() => [
  {
    label: $t('page.lowcode.relation.relationTypes.ONE_TO_ONE'),
    value: 'ONE_TO_ONE'
  },
  {
    label: $t('page.lowcode.relation.relationTypes.ONE_TO_MANY'),
    value: 'ONE_TO_MANY'
  },
  {
    label: $t('page.lowcode.relation.relationTypes.MANY_TO_ONE'),
    value: 'MANY_TO_ONE'
  },
  {
    label: $t('page.lowcode.relation.relationTypes.MANY_TO_MANY'),
    value: 'MANY_TO_MANY'
  }
]);

const cascadeOptions = computed(() => [
  {
    label: $t('page.lowcode.relation.cascadeActions.RESTRICT'),
    value: 'RESTRICT'
  },
  {
    label: $t('page.lowcode.relation.cascadeActions.CASCADE'),
    value: 'CASCADE'
  },
  {
    label: $t('page.lowcode.relation.cascadeActions.SET_NULL'),
    value: 'SET_NULL'
  },
  {
    label: $t('page.lowcode.relation.cascadeActions.NO_ACTION'),
    value: 'NO_ACTION'
  }
]);

const entityOptions = ref<{ label: string; value: string }[]>([]);

const submitLoading = ref(false);

async function loadEntities() {
  if (!props.projectId) return;

  try {
    const response = await fetchGetAllEntities(props.projectId);
    if (response.data) {
      entityOptions.value = response.data.map((entity: any) => ({
        label: `${entity.name} (${entity.code})`,
        value: entity.id
      }));
    }
  } catch (error) {
    console.error('Failed to load entities:', error);
  }
}

function handleUpdateFormModel(model: Partial<Api.Lowcode.RelationshipEdit>) {
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
      await fetchAddRelationship(formModel);
    } else if (props.operateType === 'edit' && props.rowData) {
      await fetchUpdateRelationship(props.rowData.id, formModel);
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
      loadEntities();
    }
  }
);

watch(
  () => props.projectId,
  newValue => {
    formModel.projectId = newValue;
    if (newValue) {
      loadEntities();
    }
  }
);

onMounted(() => {
  if (props.projectId) {
    loadEntities();
  }
});
</script>

<style scoped></style>
