<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue';
import type { FormInst, FormRules } from 'naive-ui';
import { fetchAddApiConfig, fetchGetAllEntities, fetchUpdateApiConfig } from '@/service/api';
import { useNaiveForm } from '@/hooks/common/form';
import { createRequiredFormRule } from '@/utils/form/rule';
import { $t } from '@/locales';

export interface Props {
  /** the type of operation */
  operateType: NaiveUI.TableOperateType;
  /** the edit row data */
  rowData?: Api.Lowcode.ApiConfig | null;
  /** project id */
  projectId: string;
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

const title = computed(() => {
  const titles: Record<NaiveUI.TableOperateType, string> = {
    add: $t('page.lowcode.apiConfig.addApiConfig'),
    edit: $t('page.lowcode.apiConfig.editApiConfig')
  };
  return titles[props.operateType];
});

const methodOptions = [
  { label: 'GET', value: 'GET' },
  { label: 'POST', value: 'POST' },
  { label: 'PUT', value: 'PUT' },
  { label: 'DELETE', value: 'DELETE' }
];

const responseFormatOptions = [
  { label: 'JSON', value: 'json' },
  { label: 'XML', value: 'xml' }
];

const entityOptions = ref<Array<{ label: string; value: string }>>([]);

interface FormModel extends Api.Lowcode.ApiConfigEdit {
  paginationEnabled: boolean;
  defaultPageSize: number;
  maxPageSize: number;
  responseFormat: string;
  responseWrapper: string;
  rateLimitEnabled: boolean;
  rateLimitRequests: number;
  rateLimitWindow: number;
}

function createDefaultFormModel(): FormModel {
  return {
    projectId: props.projectId,
    name: '',
    path: '',
    method: 'GET',
    description: '',
    entityId: undefined,
    queryConfig: {},
    responseConfig: {},
    authRequired: false,
    rateLimit: {},
    status: 'ACTIVE',
    // Extended fields for form
    paginationEnabled: false,
    defaultPageSize: 20,
    maxPageSize: 100,
    responseFormat: 'json',
    responseWrapper: '',
    rateLimitEnabled: false,
    rateLimitRequests: 100,
    rateLimitWindow: 60
  };
}

const formModel: FormModel = reactive(createDefaultFormModel());

const rules: FormRules = {
  name: createRequiredFormRule($t('page.lowcode.apiConfig.form.name.required')),
  path: [
    createRequiredFormRule($t('page.lowcode.apiConfig.form.path.required')),
    {
      pattern: /^\/.*$/,
      message: $t('page.lowcode.apiConfig.form.path.invalid'),
      trigger: 'blur'
    }
  ],
  method: createRequiredFormRule($t('page.lowcode.apiConfig.form.method.required')),
  responseFormat: createRequiredFormRule($t('page.lowcode.apiConfig.form.responseFormat.required'))
};

function handleUpdateFormModel(model: Partial<FormModel>) {
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
        const editModel: FormModel = {
          ...props.rowData,
          // Parse extended fields from config objects
          paginationEnabled: props.rowData.queryConfig?.pagination?.enabled || false,
          defaultPageSize: props.rowData.queryConfig?.pagination?.defaultPageSize || 20,
          maxPageSize: props.rowData.queryConfig?.pagination?.maxPageSize || 100,
          responseFormat: props.rowData.responseConfig?.format || 'json',
          responseWrapper: props.rowData.responseConfig?.wrapper || '',
          rateLimitEnabled: props.rowData.rateLimit?.enabled || false,
          rateLimitRequests: props.rowData.rateLimit?.requests || 100,
          rateLimitWindow: props.rowData.rateLimit?.window || 60
        };
        handleUpdateFormModel(editModel);
      }
    }
  };

  handlers[props.operateType]();
}

async function loadEntities() {
  try {
    const response = await fetchGetAllEntities(props.projectId);
    // Handle different response structures
    let entities: any[] = [];
    if (Array.isArray(response)) {
      entities = response;
    } else if (response && Array.isArray((response as any).data)) {
      entities = (response as any).data;
    } else if (response && Array.isArray((response as any).records)) {
      entities = (response as any).records;
    } else {
      console.warn('Unexpected response structure:', response);
      entities = [];
    }

    entityOptions.value = entities.map((entity: any) => ({
      label: entity.name,
      value: entity.id
    }));
  } catch (error) {
    console.error('Failed to load entities:', error);
  }
}

async function handleSubmit() {
  await validate();

  // Build the API config data from form model
  const apiConfigData: Api.Lowcode.ApiConfigEdit = {
    projectId: formModel.projectId,
    name: formModel.name,
    path: formModel.path,
    method: formModel.method,
    description: formModel.description,
    entityId: formModel.entityId,
    queryConfig: {
      pagination: formModel.paginationEnabled
        ? {
            enabled: true,
            defaultPageSize: formModel.defaultPageSize,
            maxPageSize: formModel.maxPageSize
          }
        : { enabled: false }
    },
    responseConfig: {
      format: formModel.responseFormat,
      wrapper: formModel.responseWrapper
    },
    authRequired: formModel.authRequired,
    rateLimit: formModel.rateLimitEnabled
      ? {
          enabled: true,
          requests: formModel.rateLimitRequests,
          window: formModel.rateLimitWindow
        }
      : { enabled: false },
    status: formModel.status
  };

  const handlers: Record<NaiveUI.TableOperateType, () => Promise<void>> = {
    add: async () => {
      await fetchAddApiConfig(apiConfigData);
    },
    edit: async () => {
      if (props.rowData) {
        await fetchUpdateApiConfig(props.rowData.id, apiConfigData);
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
    loadEntities();
  }
});

onMounted(() => {
  loadEntities();
});
</script>

<template>
  <NDrawer v-model:show="drawerVisible" display-directive="show" :width="720">
    <NDrawerContent :title="title" :native-scrollbar="false" closable>
      <NForm ref="formRef" :model="formModel" :rules="rules" label-placement="left" :label-width="120">
        <NFormItem :label="$t('page.lowcode.apiConfig.name')" path="name">
          <NInput v-model:value="formModel.name" :placeholder="$t('page.lowcode.apiConfig.form.name.placeholder')" />
        </NFormItem>
        <NFormItem :label="$t('page.lowcode.apiConfig.path')" path="path">
          <NInput v-model:value="formModel.path" :placeholder="$t('page.lowcode.apiConfig.form.path.placeholder')" />
        </NFormItem>
        <NFormItem :label="$t('page.lowcode.apiConfig.method')" path="method">
          <NSelect
            v-model:value="formModel.method"
            :placeholder="$t('page.lowcode.apiConfig.form.method.placeholder')"
            :options="methodOptions"
          />
        </NFormItem>
        <NFormItem :label="$t('page.lowcode.apiConfig.entity')" path="entityId">
          <NSelect
            v-model:value="formModel.entityId"
            :placeholder="$t('page.lowcode.apiConfig.form.entity.placeholder')"
            :options="entityOptions"
            clearable
            filterable
          />
        </NFormItem>
        <NFormItem :label="$t('page.lowcode.apiConfig.description')" path="description">
          <NInput
            v-model:value="formModel.description"
            :placeholder="$t('page.lowcode.apiConfig.form.description.placeholder')"
            type="textarea"
            :rows="3"
          />
        </NFormItem>

        <NDivider title-placement="left">{{ $t('page.lowcode.apiConfig.queryConfig') }}</NDivider>

        <NFormItem :label="$t('page.lowcode.apiConfig.paginationEnabled')" path="paginationEnabled">
          <NSwitch v-model:value="formModel.paginationEnabled" />
        </NFormItem>
        <NFormItem
          v-if="formModel.paginationEnabled"
          :label="$t('page.lowcode.apiConfig.defaultPageSize')"
          path="defaultPageSize"
        >
          <NInputNumber
            v-model:value="formModel.defaultPageSize"
            :placeholder="$t('page.lowcode.apiConfig.form.defaultPageSize.placeholder')"
            :min="1"
            :max="1000"
            style="width: 100%"
          />
        </NFormItem>
        <NFormItem
          v-if="formModel.paginationEnabled"
          :label="$t('page.lowcode.apiConfig.maxPageSize')"
          path="maxPageSize"
        >
          <NInputNumber
            v-model:value="formModel.maxPageSize"
            :placeholder="$t('page.lowcode.apiConfig.form.maxPageSize.placeholder')"
            :min="1"
            :max="1000"
            style="width: 100%"
          />
        </NFormItem>

        <NDivider title-placement="left">{{ $t('page.lowcode.apiConfig.responseConfig') }}</NDivider>

        <NFormItem :label="$t('page.lowcode.apiConfig.responseFormat')" path="responseFormat">
          <NSelect
            v-model:value="formModel.responseFormat"
            :placeholder="$t('page.lowcode.apiConfig.form.responseFormat.placeholder')"
            :options="responseFormatOptions"
          />
        </NFormItem>
        <NFormItem :label="$t('page.lowcode.apiConfig.responseWrapper')" path="responseWrapper">
          <NInput
            v-model:value="formModel.responseWrapper"
            :placeholder="$t('page.lowcode.apiConfig.form.responseWrapper.placeholder')"
          />
        </NFormItem>

        <NDivider title-placement="left">{{ $t('page.lowcode.apiConfig.securityConfig') }}</NDivider>

        <NFormItem :label="$t('page.lowcode.apiConfig.authRequired')" path="authRequired">
          <NSwitch v-model:value="formModel.authRequired" />
        </NFormItem>
        <NFormItem :label="$t('page.lowcode.apiConfig.rateLimitEnabled')" path="rateLimitEnabled">
          <NSwitch v-model:value="formModel.rateLimitEnabled" />
        </NFormItem>
        <NFormItem
          v-if="formModel.rateLimitEnabled"
          :label="$t('page.lowcode.apiConfig.rateLimitRequests')"
          path="rateLimitRequests"
        >
          <NInputNumber
            v-model:value="formModel.rateLimitRequests"
            :placeholder="$t('page.lowcode.apiConfig.form.rateLimitRequests.placeholder')"
            :min="1"
            style="width: 100%"
          />
        </NFormItem>
        <NFormItem
          v-if="formModel.rateLimitEnabled"
          :label="$t('page.lowcode.apiConfig.rateLimitWindow')"
          path="rateLimitWindow"
        >
          <NInputNumber
            v-model:value="formModel.rateLimitWindow"
            :placeholder="$t('page.lowcode.apiConfig.form.rateLimitWindow.placeholder')"
            :min="1"
            style="width: 100%"
          />
        </NFormItem>

        <NFormItem :label="$t('common.status')" path="status">
          <NRadioGroup v-model:value="formModel.status">
            <NRadio value="ACTIVE">{{ $t('page.lowcode.apiConfig.status.ACTIVE') }}</NRadio>
            <NRadio value="INACTIVE">{{ $t('page.lowcode.apiConfig.status.INACTIVE') }}</NRadio>
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

<style scoped></style>
