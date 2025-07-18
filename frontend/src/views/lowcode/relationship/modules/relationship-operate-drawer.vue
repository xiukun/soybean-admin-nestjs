<template>
  <NDrawer v-model:show="drawerVisible" display-directive="show" :width="480">
    <NDrawerContent :title="title" :native-scrollbar="false" closable>
      <NForm ref="formRef" :model="formModel" :rules="rules">
        <NFormItem :label="$t('page.lowcode.relationship.name')" path="name">
          <NInput v-model:value="formModel.name" :placeholder="$t('page.lowcode.relationship.form.name.placeholder')" />
        </NFormItem>
        <NFormItem :label="$t('page.lowcode.relationship.code')" path="code">
          <NInput 
            v-model:value="formModel.code" 
            :placeholder="$t('page.lowcode.relationship.form.code.placeholder')"
            :disabled="operateType === 'edit'"
          />
        </NFormItem>
        <NFormItem :label="$t('page.lowcode.relationship.typeLabel')" path="type">
          <NSelect
            v-model:value="formModel.type"
            :placeholder="$t('page.lowcode.relationship.form.type.placeholder')"
            :options="typeOptions"
            :disabled="operateType === 'edit'"
          />
        </NFormItem>
        <NFormItem :label="$t('page.lowcode.relationship.sourceEntity')" path="sourceEntityId">
          <NSelect
            v-model:value="formModel.sourceEntityId"
            :placeholder="$t('page.lowcode.relationship.form.sourceEntity.placeholder')"
            :options="entityOptions"
            :disabled="operateType === 'edit'"
            filterable
          />
        </NFormItem>
        <NFormItem :label="$t('page.lowcode.relationship.targetEntity')" path="targetEntityId">
          <NSelect
            v-model:value="formModel.targetEntityId"
            :placeholder="$t('page.lowcode.relationship.form.targetEntity.placeholder')"
            :options="entityOptions"
            :disabled="operateType === 'edit'"
            filterable
          />
        </NFormItem>
        <NFormItem :label="$t('page.lowcode.relationship.description')" path="description">
          <NInput
            v-model:value="formModel.description"
            :placeholder="$t('page.lowcode.relationship.form.description.placeholder')"
            type="textarea"
            :rows="3"
          />
        </NFormItem>
        <NFormItem :label="$t('page.lowcode.relationship.onDelete')" path="onDelete">
          <NSelect
            v-model:value="formModel.onDelete"
            :placeholder="$t('page.lowcode.relationship.form.onDelete.placeholder')"
            :options="cascadeOptions"
          />
        </NFormItem>
        <NFormItem :label="$t('page.lowcode.relationship.onUpdate')" path="onUpdate">
          <NSelect
            v-model:value="formModel.onUpdate"
            :placeholder="$t('page.lowcode.relationship.form.onUpdate.placeholder')"
            :options="cascadeOptions"
          />
        </NFormItem>
        <NFormItem :label="$t('common.status')" path="status">
          <NRadioGroup v-model:value="formModel.status">
            <NSpace>
              <NRadio value="ACTIVE">
                {{ $t('page.lowcode.relationship.status.ACTIVE') }}
              </NRadio>
              <NRadio value="INACTIVE">
                {{ $t('page.lowcode.relationship.status.INACTIVE') }}
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
import { computed, reactive, watch, onMounted } from 'vue';
import type { FormInst, FormRules } from 'naive-ui';
import { fetchAddRelationship, fetchGetRelationship, fetchUpdateRelationship, fetchGetAllEntities } from '@/service/api';
import { $t } from '@/locales';
import { createRequiredFormRule } from '@/utils/form/rule';

defineOptions({
  name: 'RelationshipOperateDrawer'
});

interface Props {
  /** the type of operation */
  operateType: AnyObject.OperateType;
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
  const titles: Record<AnyObject.OperateType, string> = {
    add: $t('page.lowcode.relationship.addRelationship'),
    edit: $t('page.lowcode.relationship.editRelationship')
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
  name: createRequiredFormRule($t('page.lowcode.relationship.form.name.required')),
  code: createRequiredFormRule($t('page.lowcode.relationship.form.code.required')),
  type: createRequiredFormRule($t('page.lowcode.relationship.form.type.required')),
  sourceEntityId: createRequiredFormRule($t('page.lowcode.relationship.form.sourceEntity.required')),
  targetEntityId: createRequiredFormRule($t('page.lowcode.relationship.form.targetEntity.required'))
};

const typeOptions = computed(() => [
  {
    label: $t('page.lowcode.relationship.type.oneToOne'),
    value: 'ONE_TO_ONE'
  },
  {
    label: $t('page.lowcode.relationship.type.oneToMany'),
    value: 'ONE_TO_MANY'
  },
  {
    label: $t('page.lowcode.relationship.type.manyToOne'),
    value: 'MANY_TO_ONE'
  },
  {
    label: $t('page.lowcode.relationship.type.manyToMany'),
    value: 'MANY_TO_MANY'
  }
]);

const cascadeOptions = computed(() => [
  {
    label: $t('page.lowcode.relationship.cascade.RESTRICT'),
    value: 'RESTRICT'
  },
  {
    label: $t('page.lowcode.relationship.cascade.CASCADE'),
    value: 'CASCADE'
  },
  {
    label: $t('page.lowcode.relationship.cascade.SET_NULL'),
    value: 'SET_NULL'
  },
  {
    label: $t('page.lowcode.relationship.cascade.NO_ACTION'),
    value: 'NO_ACTION'
  }
]);

const entityOptions = ref<{ label: string; value: string }[]>([]);

const submitLoading = ref(false);

async function loadEntities() {
  if (!props.projectId) return;
  
  try {
    const entities = await fetchGetAllEntities(props.projectId);
    entityOptions.value = entities.map(entity => ({
      label: `${entity.name} (${entity.code})`,
      value: entity.id
    }));
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
