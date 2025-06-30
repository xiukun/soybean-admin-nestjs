<script setup lang="ts">
import { computed, reactive, watch } from 'vue';
import type { FormRules } from 'naive-ui';
import { enableStatusOptions } from '@/constants/business';
import { fetchAddLowcodeModel, fetchUpdateLowcodeModel } from '@/service/api';
import { useNaiveForm } from '@/hooks/common/form';
import { createRequiredFormRule } from '@/utils/form';
import { $t } from '@/locales';

defineOptions({
  name: 'LowcodeModelOperateDrawer'
});

interface Props {
  /** the type of operation */
  operateType: NaiveUI.TableOperateType;
  /** the edit row data */
  rowData?: Api.LowcodeModel.Model | null;
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
    add: $t('page.lowcode.model.addModel'),
    edit: $t('page.lowcode.model.editModel')
  };
  return titles[props.operateType];
});

const formModel = reactive<Api.LowcodeModel.ModelEdit>(createDefaultFormModel());

function createDefaultFormModel(): Api.LowcodeModel.ModelEdit {
  return {
    name: '',
    code: '',
    tableName: '',
    description: '',
    status: 'ENABLED',
    properties: []
  };
}

const dataTypeOptions = [
  { label: 'VARCHAR', value: 'VARCHAR' },
  { label: 'TEXT', value: 'TEXT' },
  { label: 'INTEGER', value: 'INTEGER' },
  { label: 'BIGINT', value: 'BIGINT' },
  { label: 'DECIMAL', value: 'DECIMAL' },
  { label: 'BOOLEAN', value: 'BOOLEAN' },
  { label: 'DATE', value: 'DATE' },
  { label: 'TIMESTAMP', value: 'TIMESTAMP' },
  { label: 'JSON', value: 'JSON' }
];

const rules: FormRules = {
  name: createRequiredFormRule($t('page.lowcode.model.form.name')),
  code: createRequiredFormRule($t('page.lowcode.model.form.code')),
  tableName: createRequiredFormRule($t('page.lowcode.model.form.tableName')),
  status: createRequiredFormRule($t('page.lowcode.model.form.status'))
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

function addProperty() {
  formModel.properties ||= [];
  formModel.properties.push({
    name: '',
    code: '',
    type: 'VARCHAR',
    nullable: true,
    isPrimaryKey: false,
    isUnique: false,
    isIndex: false
  });
}

function removeProperty(index: number) {
  formModel.properties?.splice(index, 1);
}

async function handleSubmit() {
  await validate();

  if (props.operateType === 'add') {
    await fetchAddLowcodeModel(formModel);
  } else if (props.operateType === 'edit' && props.rowData) {
    await fetchUpdateLowcodeModel(props.rowData.id, formModel);
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
    Object.assign(formModel, {
      ...props.rowData,
      properties: props.rowData.properties || []
    });
  }
}
</script>

<template>
  <NDrawer v-model:show="drawerVisible" display-directive="show" :width="800">
    <NDrawerContent :title="title" :native-scrollbar="false" closable>
      <NForm ref="formRef" :model="formModel" :rules="rules" label-placement="left" :label-width="100">
        <NFormItem :label="$t('page.lowcode.model.name')" path="name">
          <NInput v-model:value="formModel.name" :placeholder="$t('page.lowcode.model.form.name')" />
        </NFormItem>
        <NFormItem :label="$t('page.lowcode.model.code')" path="code">
          <NInput v-model:value="formModel.code" :placeholder="$t('page.lowcode.model.form.code')" />
        </NFormItem>
        <NFormItem :label="$t('page.lowcode.model.tableName')" path="tableName">
          <NInput v-model:value="formModel.tableName" :placeholder="$t('page.lowcode.model.form.tableName')" />
        </NFormItem>
        <NFormItem :label="$t('page.lowcode.model.description')" path="description">
          <NInput
            v-model:value="formModel.description"
            type="textarea"
            :placeholder="$t('page.lowcode.model.form.description')"
          />
        </NFormItem>
        <NFormItem :label="$t('common.status')" path="status">
          <NRadioGroup v-model:value="formModel.status">
            <NRadio v-for="item in enableStatusOptions" :key="item.value" :value="item.value" :label="item.label" />
          </NRadioGroup>
        </NFormItem>

        <!-- 模型属性配置 -->
        <NDivider title-placement="left">模型属性</NDivider>
        <NFormItem path="properties">
          <NSpace vertical class="w-full">
            <NButton type="default" dashed @click="addProperty">
              <template #icon>
                <icon-ic-round-add class="text-icon" />
              </template>
              添加属性
            </NButton>
            <NCard v-for="(property, index) in formModel.properties" :key="index" size="small" class="w-full">
              <template #header>
                <span>属性 {{ index + 1 }}</span>
              </template>
              <template #header-extra>
                <NButton type="error" text @click="removeProperty(index)">
                  <template #icon>
                    <icon-ic-round-delete class="text-icon" />
                  </template>
                </NButton>
              </template>
              <NGrid :cols="2" :x-gap="12" :y-gap="8">
                <NGridItem>
                  <NFormItem label="属性名称" :path="`properties[${index}].name`">
                    <NInput v-model:value="property.name" placeholder="请输入属性名称" />
                  </NFormItem>
                </NGridItem>
                <NGridItem>
                  <NFormItem label="属性编码" :path="`properties[${index}].code`">
                    <NInput v-model:value="property.code" placeholder="请输入属性编码" />
                  </NFormItem>
                </NGridItem>
                <NGridItem>
                  <NFormItem label="数据类型" :path="`properties[${index}].type`">
                    <NSelect v-model:value="property.type" :options="dataTypeOptions" placeholder="请选择数据类型" />
                  </NFormItem>
                </NGridItem>
                <NGridItem>
                  <NFormItem label="长度" :path="`properties[${index}].length`">
                    <NInputNumber v-model:value="property.length" placeholder="长度" :min="0" />
                  </NFormItem>
                </NGridItem>
                <NGridItem :span="2">
                  <NFormItem label="描述" :path="`properties[${index}].description`">
                    <NInput v-model:value="property.description" placeholder="请输入属性描述" />
                  </NFormItem>
                </NGridItem>
                <NGridItem :span="2">
                  <NSpace>
                    <NCheckbox v-model:checked="property.nullable">可为空</NCheckbox>
                    <NCheckbox v-model:checked="property.isPrimaryKey">主键</NCheckbox>
                    <NCheckbox v-model:checked="property.isUnique">唯一</NCheckbox>
                    <NCheckbox v-model:checked="property.isIndex">索引</NCheckbox>
                  </NSpace>
                </NGridItem>
              </NGrid>
            </NCard>
          </NSpace>
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
