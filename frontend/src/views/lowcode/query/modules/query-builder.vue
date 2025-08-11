<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue';
import type { FormInst, FormRules } from 'naive-ui';
import { fetchAddQuery, fetchGenerateQuerySQL, fetchGetAllEntities, fetchUpdateQuery } from '@/service/api';
import { createRequiredFormRule } from '@/utils/form/rule';
import { MonacoEditor } from '@/components/custom/monaco-editor';
import { $t } from '@/locales';

export interface Props {
  /** the type of operation */
  operateType: NaiveUI.TableOperateType;
  /** the edit row data */
  rowData?: Api.Lowcode.MultiTableQuery | null;
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

const activeTab = ref('basic');
const formRef = ref<FormInst | null>(null);
const submitting = ref(false);
const generatingSQL = ref(false);

const entityOptions = ref<Array<{ label: string; value: string }>>([]);
const generatedSQL = ref('');

const title = computed(() => {
  const titles: Record<NaiveUI.TableOperateType, string> = {
    add: $t('page.lowcode.query.addQuery'),
    edit: $t('page.lowcode.query.editQuery')
  };
  return titles[props.operateType];
});

const joinTypeOptions = [
  { label: 'INNER JOIN', value: 'INNER' },
  { label: 'LEFT JOIN', value: 'LEFT' },
  { label: 'RIGHT JOIN', value: 'RIGHT' },
  { label: 'FULL JOIN', value: 'FULL' }
];

const aggregationOptions = [
  { label: 'COUNT', value: 'COUNT' },
  { label: 'SUM', value: 'SUM' },
  { label: 'AVG', value: 'AVG' },
  { label: 'MIN', value: 'MIN' },
  { label: 'MAX', value: 'MAX' }
];

const operatorOptions = [
  { label: '=', value: 'eq' },
  { label: '!=', value: 'ne' },
  { label: '>', value: 'gt' },
  { label: '>=', value: 'gte' },
  { label: '<', value: 'lt' },
  { label: '<=', value: 'lte' },
  { label: 'LIKE', value: 'like' },
  { label: 'IN', value: 'in' },
  { label: 'NOT IN', value: 'not_in' },
  { label: 'IS NULL', value: 'is_null' },
  { label: 'IS NOT NULL', value: 'is_not_null' }
];

const directionOptions = [
  { label: 'ASC', value: 'ASC' },
  { label: 'DESC', value: 'DESC' }
];

const editorOptions = {
  theme: 'vs-dark',
  fontSize: 14,
  minimap: { enabled: false },
  scrollBeyondLastLine: false,
  automaticLayout: true,
  wordWrap: 'on' as const,
  lineNumbers: 'on' as const
};

function createDefaultFormModel(): Api.Lowcode.QueryEdit {
  return {
    projectId: props.projectId,
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
    limit: undefined,
    offset: undefined
  };
}

const queryForm = reactive<Api.Lowcode.QueryEdit>(createDefaultFormModel());

const rules: FormRules = {
  name: createRequiredFormRule($t('page.lowcode.query.form.name.required')),
  baseEntityId: createRequiredFormRule($t('page.lowcode.query.form.baseEntity.required')),
  baseEntityAlias: createRequiredFormRule($t('page.lowcode.query.form.baseEntityAlias.required'))
};

function addJoin() {
  queryForm.joins.push({
    type: 'INNER',
    targetEntityId: '',
    sourceField: '',
    targetField: '',
    alias: ''
  });
}

function removeJoin(index: number) {
  queryForm.joins.splice(index, 1);
}

function addField() {
  queryForm.fields.push({
    field: '',
    alias: '',
    entityAlias: queryForm.baseEntityAlias
  });
}

function removeField(index: number) {
  queryForm.fields.splice(index, 1);
}

function addFilter() {
  queryForm.filters.push({
    field: '',
    operator: 'eq',
    value: '',
    entityAlias: queryForm.baseEntityAlias
  });
}

function removeFilter(index: number) {
  queryForm.filters.splice(index, 1);
}

function addSort() {
  queryForm.sorting.push({
    field: '',
    direction: 'ASC',
    entityAlias: queryForm.baseEntityAlias
  });
}

function removeSort(index: number) {
  queryForm.sorting.splice(index, 1);
}

function handleBaseEntityChange() {
  // Reset entity aliases when base entity changes
  queryForm.fields.forEach(field => {
    if (!field.entityAlias) {
      field.entityAlias = queryForm.baseEntityAlias;
    }
  });
  queryForm.filters.forEach(filter => {
    if (!filter.entityAlias) {
      filter.entityAlias = queryForm.baseEntityAlias;
    }
  });
  queryForm.sorting.forEach(sort => {
    if (!sort.entityAlias) {
      sort.entityAlias = queryForm.baseEntityAlias;
    }
  });
}

async function generateSQL() {
  try {
    generatingSQL.value = true;
    const result = await fetchGenerateQuerySQL(queryForm);
    generatedSQL.value = result.sql;
  } catch (error) {
    window.$message?.error($t('page.lowcode.query.generateSQLFailed'));
  } finally {
    generatingSQL.value = false;
  }
}

function handleUpdateFormModel(model: Partial<Api.Lowcode.QueryEdit>) {
  Object.assign(queryForm, model);
}

function handleUpdateFormModelByModalType() {
  const handlers: Record<NaiveUI.TableOperateType, () => void> = {
    add: () => {
      const defaultFormModel = createDefaultFormModel();
      handleUpdateFormModel(defaultFormModel);
    },
    edit: () => {
      if (props.rowData) {
        handleUpdateFormModel({
          ...props.rowData,
          projectId: props.projectId
        });
      }
    }
  };

  handlers[props.operateType]();
}

async function handleSubmit() {
  await formRef.value?.validate();

  try {
    submitting.value = true;

    const handlers: Record<NaiveUI.TableOperateType, () => Promise<void>> = {
      add: async () => {
        await fetchAddQuery(queryForm);
      },
      edit: async () => {
        if (props.rowData) {
          await fetchUpdateQuery(props.rowData.id, queryForm);
        }
      }
    };

    await handlers[props.operateType]();

    window.$message?.success($t('common.updateSuccess'));
    closeDrawer();
    emit('submitted');
  } catch (error) {
    window.$message?.error($t('common.updateFailed'));
  } finally {
    submitting.value = false;
  }
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

async function loadEntities() {
  try {
    const entities = await fetchGetAllEntities(props.projectId);
    entityOptions.value = entities.map(entity => ({
      label: entity.name,
      value: entity.id
    }));
  } catch (error) {
    console.error('Failed to load entities:', error);
  }
}

watch(visible, () => {
  if (visible.value) {
    handleUpdateFormModelByModalType();
    loadEntities();
  } else {
    // Reset state
    activeTab.value = 'basic';
    generatedSQL.value = '';
  }
});

onMounted(() => {
  loadEntities();
});
</script>

<template>
  <NDrawer v-model:show="drawerVisible" display-directive="show" :width="800">
    <NDrawerContent :title="title" :native-scrollbar="false" closable>
      <div class="h-full flex flex-col">
        <NTabs v-model:value="activeTab" type="line" animated class="flex flex-col flex-1">
          <!-- Basic Info Tab -->
          <NTabPane name="basic" :tab="$t('page.lowcode.query.basicInfo')" class="flex-1">
            <NForm ref="formRef" :model="queryForm" :rules="rules" label-placement="left" :label-width="120">
              <NFormItem :label="$t('page.lowcode.query.name')" path="name">
                <NInput v-model:value="queryForm.name" :placeholder="$t('page.lowcode.query.form.name.placeholder')" />
              </NFormItem>

              <NFormItem :label="$t('page.lowcode.query.description')" path="description">
                <NInput
                  v-model:value="queryForm.description"
                  :placeholder="$t('page.lowcode.query.form.description.placeholder')"
                  type="textarea"
                  :rows="3"
                />
              </NFormItem>

              <NFormItem :label="$t('page.lowcode.query.baseEntity')" path="baseEntityId">
                <NSelect
                  v-model:value="queryForm.baseEntityId"
                  :placeholder="$t('page.lowcode.query.form.baseEntity.placeholder')"
                  :options="entityOptions"
                  @update:value="handleBaseEntityChange"
                />
              </NFormItem>

              <NFormItem :label="$t('page.lowcode.query.baseEntityAlias')" path="baseEntityAlias">
                <NInput
                  v-model:value="queryForm.baseEntityAlias"
                  :placeholder="$t('page.lowcode.query.form.baseEntityAlias.placeholder')"
                />
              </NFormItem>
            </NForm>
          </NTabPane>

          <!-- Joins Tab -->
          <NTabPane name="joins" :tab="$t('page.lowcode.query.joins')" class="flex-1">
            <div class="h-full flex flex-col">
              <NSpace class="mb-4">
                <NButton type="primary" @click="addJoin">
                  {{ $t('page.lowcode.query.addJoin') }}
                </NButton>
              </NSpace>

              <div class="flex-1 overflow-auto">
                <NSpace vertical>
                  <NCard
                    v-for="(join, index) in queryForm.joins"
                    :key="index"
                    size="small"
                    :title="`${$t('page.lowcode.query.join')} ${index + 1}`"
                    closable
                    @close="removeJoin(index)"
                  >
                    <NForm :model="join" label-placement="left" :label-width="120">
                      <NFormItem :label="$t('page.lowcode.query.joinType')" path="type">
                        <NSelect
                          v-model:value="join.type"
                          :options="joinTypeOptions"
                          :placeholder="$t('page.lowcode.query.form.joinType.placeholder')"
                        />
                      </NFormItem>

                      <NFormItem :label="$t('page.lowcode.query.targetEntity')" path="targetEntityId">
                        <NSelect
                          v-model:value="join.targetEntityId"
                          :options="entityOptions"
                          :placeholder="$t('page.lowcode.query.form.targetEntity.placeholder')"
                        />
                      </NFormItem>

                      <NFormItem :label="$t('page.lowcode.query.sourceField')" path="sourceField">
                        <NInput
                          v-model:value="join.sourceField"
                          :placeholder="$t('page.lowcode.query.form.sourceField.placeholder')"
                        />
                      </NFormItem>

                      <NFormItem :label="$t('page.lowcode.query.targetField')" path="targetField">
                        <NInput
                          v-model:value="join.targetField"
                          :placeholder="$t('page.lowcode.query.form.targetField.placeholder')"
                        />
                      </NFormItem>

                      <NFormItem :label="$t('page.lowcode.query.alias')" path="alias">
                        <NInput
                          v-model:value="join.alias"
                          :placeholder="$t('page.lowcode.query.form.alias.placeholder')"
                        />
                      </NFormItem>
                    </NForm>
                  </NCard>
                </NSpace>
              </div>
            </div>
          </NTabPane>

          <!-- Fields Tab -->
          <NTabPane name="fields" :tab="$t('page.lowcode.query.fields')" class="flex-1">
            <div class="h-full flex flex-col">
              <NSpace class="mb-4">
                <NButton type="primary" @click="addField">
                  {{ $t('page.lowcode.query.addField') }}
                </NButton>
              </NSpace>

              <div class="flex-1 overflow-auto">
                <NSpace vertical>
                  <NCard
                    v-for="(field, index) in queryForm.fields"
                    :key="index"
                    size="small"
                    :title="`${$t('page.lowcode.query.field')} ${index + 1}`"
                    closable
                    @close="removeField(index)"
                  >
                    <NForm :model="field" label-placement="left" :label-width="120">
                      <NFormItem :label="$t('page.lowcode.query.fieldName')" path="field">
                        <NInput
                          v-model:value="field.field"
                          :placeholder="$t('page.lowcode.query.form.fieldName.placeholder')"
                        />
                      </NFormItem>

                      <NFormItem :label="$t('page.lowcode.query.fieldAlias')" path="alias">
                        <NInput
                          v-model:value="field.alias"
                          :placeholder="$t('page.lowcode.query.form.fieldAlias.placeholder')"
                        />
                      </NFormItem>

                      <NFormItem :label="$t('page.lowcode.query.entityAlias')" path="entityAlias">
                        <NInput
                          v-model:value="field.entityAlias"
                          :placeholder="$t('page.lowcode.query.form.entityAlias.placeholder')"
                        />
                      </NFormItem>

                      <NFormItem :label="$t('page.lowcode.query.aggregation')" path="aggregation">
                        <NSelect
                          v-model:value="field.aggregation"
                          :options="aggregationOptions"
                          :placeholder="$t('page.lowcode.query.form.aggregation.placeholder')"
                          clearable
                        />
                      </NFormItem>
                    </NForm>
                  </NCard>
                </NSpace>
              </div>
            </div>
          </NTabPane>

          <!-- Filters Tab -->
          <NTabPane name="filters" :tab="$t('page.lowcode.query.filters')" class="flex-1">
            <div class="h-full flex flex-col">
              <NSpace class="mb-4">
                <NButton type="primary" @click="addFilter">
                  {{ $t('page.lowcode.query.addFilter') }}
                </NButton>
              </NSpace>

              <div class="flex-1 overflow-auto">
                <NSpace vertical>
                  <NCard
                    v-for="(filter, index) in queryForm.filters"
                    :key="index"
                    size="small"
                    :title="`${$t('page.lowcode.query.filter')} ${index + 1}`"
                    closable
                    @close="removeFilter(index)"
                  >
                    <NForm :model="filter" label-placement="left" :label-width="120">
                      <NFormItem :label="$t('page.lowcode.query.fieldName')" path="field">
                        <NInput
                          v-model:value="filter.field"
                          :placeholder="$t('page.lowcode.query.form.fieldName.placeholder')"
                        />
                      </NFormItem>

                      <NFormItem :label="$t('page.lowcode.query.operator')" path="operator">
                        <NSelect
                          v-model:value="filter.operator"
                          :options="operatorOptions"
                          :placeholder="$t('page.lowcode.query.form.operator.placeholder')"
                        />
                      </NFormItem>

                      <NFormItem :label="$t('page.lowcode.query.value')" path="value">
                        <NInput
                          v-model:value="filter.value"
                          :placeholder="$t('page.lowcode.query.form.value.placeholder')"
                        />
                      </NFormItem>

                      <NFormItem :label="$t('page.lowcode.query.entityAlias')" path="entityAlias">
                        <NInput
                          v-model:value="filter.entityAlias"
                          :placeholder="$t('page.lowcode.query.form.entityAlias.placeholder')"
                        />
                      </NFormItem>
                    </NForm>
                  </NCard>
                </NSpace>
              </div>
            </div>
          </NTabPane>

          <!-- Sorting Tab -->
          <NTabPane name="sorting" :tab="$t('page.lowcode.query.sorting')" class="flex-1">
            <div class="h-full flex flex-col">
              <NSpace class="mb-4">
                <NButton type="primary" @click="addSort">
                  {{ $t('page.lowcode.query.addSort') }}
                </NButton>
              </NSpace>

              <div class="flex-1 overflow-auto">
                <NSpace vertical>
                  <NCard
                    v-for="(sort, index) in queryForm.sorting"
                    :key="index"
                    size="small"
                    :title="`${$t('page.lowcode.query.sort')} ${index + 1}`"
                    closable
                    @close="removeSort(index)"
                  >
                    <NForm :model="sort" label-placement="left" :label-width="120">
                      <NFormItem :label="$t('page.lowcode.query.fieldName')" path="field">
                        <NInput
                          v-model:value="sort.field"
                          :placeholder="$t('page.lowcode.query.form.fieldName.placeholder')"
                        />
                      </NFormItem>

                      <NFormItem :label="$t('page.lowcode.query.direction')" path="direction">
                        <NSelect
                          v-model:value="sort.direction"
                          :options="directionOptions"
                          :placeholder="$t('page.lowcode.query.form.direction.placeholder')"
                        />
                      </NFormItem>

                      <NFormItem :label="$t('page.lowcode.query.entityAlias')" path="entityAlias">
                        <NInput
                          v-model:value="sort.entityAlias"
                          :placeholder="$t('page.lowcode.query.form.entityAlias.placeholder')"
                        />
                      </NFormItem>
                    </NForm>
                  </NCard>
                </NSpace>
              </div>
            </div>
          </NTabPane>

          <!-- SQL Preview Tab -->
          <NTabPane name="sql" :tab="$t('page.lowcode.query.sqlPreview')" class="flex-1">
            <div class="h-full flex flex-col">
              <NSpace class="mb-4">
                <NButton type="primary" :loading="generatingSQL" @click="generateSQL">
                  {{ $t('page.lowcode.query.generateSQL') }}
                </NButton>
              </NSpace>

              <div v-if="generatedSQL" class="flex-1 border border-gray-200 rounded">
                <MonacoEditor
                  :value="generatedSQL"
                  language="sql"
                  :options="{ ...editorOptions, readOnly: true }"
                  class="h-full"
                />
              </div>
              <NEmpty v-else :description="$t('page.lowcode.query.noSQL')" />
            </div>
          </NTabPane>
        </NTabs>
      </div>

      <template #footer>
        <NSpace :size="16">
          <NButton @click="closeDrawer">{{ $t('common.cancel') }}</NButton>
          <NButton type="primary" :loading="submitting" @click="handleSubmit">
            {{ $t('common.confirm') }}
          </NButton>
        </NSpace>
      </template>
    </NDrawerContent>
  </NDrawer>
</template>

<style scoped></style>
