<template>
  <div class="entity-field-manager">
    <div class="mb-4">
      <NSpace justify="space-between" align="center">
        <NText strong>{{ $t('page.lowcode.entity.fields') }}</NText>
        <NSpace>
          <NButton size="small" @click="handleAddField">
            <template #icon>
              <NIcon><icon-mdi-plus /></NIcon>
            </template>
            {{ $t('page.lowcode.entity.addField') }}
          </NButton>
          <NButton size="small" @click="handleImportFields">
            <template #icon>
              <NIcon><icon-mdi-import /></NIcon>
            </template>
            {{ $t('page.lowcode.entity.importFields') }}
          </NButton>
          <NButton size="small" @click="handleExportFields">
            <template #icon>
              <NIcon><icon-mdi-export /></NIcon>
            </template>
            {{ $t('page.lowcode.entity.exportFields') }}
          </NButton>
        </NSpace>
      </NSpace>
    </div>

    <!-- Field List -->
    <NDataTable
      :columns="columns"
      :data="fields"
      :pagination="false"
      :max-height="400"
      :scroll-x="1200"
      size="small"
      striped
    />

    <!-- Field Editor Modal -->
    <NModal v-model:show="showFieldModal" preset="card" style="width: 800px">
      <template #header>
        {{ editingField ? $t('page.lowcode.entity.editField') : $t('page.lowcode.entity.addField') }}
      </template>
      
      <NForm ref="fieldFormRef" :model="fieldForm" :rules="fieldRules" label-placement="left" :label-width="120">
        <NGrid :cols="2" :x-gap="16">
          <NGridItem>
            <NFormItem :label="$t('page.lowcode.entity.fieldName')" path="name">
              <NInput v-model:value="fieldForm.name" @input="handleNameChange" />
            </NFormItem>
          </NGridItem>
          <NGridItem>
            <NFormItem :label="$t('page.lowcode.entity.fieldCode')" path="code">
              <NInput v-model:value="fieldForm.code" />
            </NFormItem>
          </NGridItem>
          <NGridItem>
            <NFormItem :label="$t('page.lowcode.entity.fieldType')" path="type">
              <NSelect v-model:value="fieldForm.type" :options="fieldTypeOptions" @update:value="handleTypeChange" />
            </NFormItem>
          </NGridItem>
          <NGridItem>
            <NFormItem :label="$t('page.lowcode.entity.fieldLength')" path="length">
              <NInputNumber 
                v-model:value="fieldForm.length" 
                :disabled="!needsLength(fieldForm.type)"
                :min="1"
                :max="65535"
                style="width: 100%"
              />
            </NFormItem>
          </NGridItem>
          <NGridItem>
            <NFormItem :label="$t('page.lowcode.entity.nullable')">
              <NSwitch v-model:value="fieldForm.nullable" />
            </NFormItem>
          </NGridItem>
          <NGridItem>
            <NFormItem :label="$t('page.lowcode.entity.primaryKey')">
              <NSwitch v-model:value="fieldForm.primaryKey" @update:value="handlePrimaryKeyChange" />
            </NFormItem>
          </NGridItem>
          <NGridItem>
            <NFormItem :label="$t('page.lowcode.entity.uniqueConstraint')">
              <NSwitch v-model:value="fieldForm.uniqueConstraint" />
            </NFormItem>
          </NGridItem>
          <NGridItem>
            <NFormItem :label="$t('page.lowcode.entity.autoIncrement')">
              <NSwitch 
                v-model:value="fieldForm.autoIncrement" 
                :disabled="!canAutoIncrement(fieldForm.type)"
              />
            </NFormItem>
          </NGridItem>
          <NGridItem :span="2">
            <NFormItem :label="$t('page.lowcode.entity.defaultValue')">
              <NInput v-model:value="fieldForm.defaultValue" />
            </NFormItem>
          </NGridItem>
          <NGridItem :span="2">
            <NFormItem :label="$t('page.lowcode.entity.comment')">
              <NInput v-model:value="fieldForm.comment" type="textarea" :rows="3" />
            </NFormItem>
          </NGridItem>
        </NGrid>

        <!-- Advanced Options -->
        <NCollapse>
          <NCollapseItem :title="$t('page.lowcode.entity.advancedOptions')" name="advanced">
            <NGrid :cols="2" :x-gap="16">
              <NGridItem>
                <NFormItem :label="$t('page.lowcode.entity.index')">
                  <NSwitch v-model:value="fieldForm.index" />
                </NFormItem>
              </NGridItem>
              <NGridItem>
                <NFormItem :label="$t('page.lowcode.entity.searchable')">
                  <NSwitch v-model:value="fieldForm.searchable" />
                </NFormItem>
              </NGridItem>
              <NGridItem>
                <NFormItem :label="$t('page.lowcode.entity.sortable')">
                  <NSwitch v-model:value="fieldForm.sortable" />
                </NFormItem>
              </NGridItem>
              <NGridItem>
                <NFormItem :label="$t('page.lowcode.entity.filterable')">
                  <NSwitch v-model:value="fieldForm.filterable" />
                </NFormItem>
              </NGridItem>
              <NGridItem>
                <NFormItem :label="$t('page.lowcode.entity.displayInList')">
                  <NSwitch v-model:value="fieldForm.displayInList" />
                </NFormItem>
              </NGridItem>
              <NGridItem>
                <NFormItem :label="$t('page.lowcode.entity.displayInForm')">
                  <NSwitch v-model:value="fieldForm.displayInForm" />
                </NFormItem>
              </NGridItem>
              <NGridItem :span="2">
                <NFormItem :label="$t('page.lowcode.entity.validationRules')">
                  <NInput v-model:value="fieldForm.validationRules" type="textarea" :rows="2" />
                </NFormItem>
              </NGridItem>
            </NGrid>
          </NCollapseItem>
        </NCollapse>
      </NForm>

      <template #footer>
        <NSpace justify="end">
          <NButton @click="showFieldModal = false">{{ $t('common.cancel') }}</NButton>
          <NButton type="primary" @click="handleSaveField">{{ $t('lowcode.common.active.save') }}</NButton>
        </NSpace>
      </template>
    </NModal>

    <!-- Import Fields Modal -->
    <NModal v-model:show="showImportModal" preset="card" style="width: 600px">
      <template #header>
        {{ $t('page.lowcode.entity.importFields') }}
      </template>
      
      <NTabs type="line">
        <NTabPane name="json" :tab="$t('page.lowcode.entity.importFromJson')">
          <NInput 
            v-model:value="importJson" 
            type="textarea" 
            :rows="10" 
            :placeholder="$t('page.lowcode.entity.importJsonPlaceholder')"
          />
        </NTabPane>
        <NTabPane name="sql" :tab="$t('page.lowcode.entity.importFromSql')">
          <NInput 
            v-model:value="importSql" 
            type="textarea" 
            :rows="10" 
            :placeholder="$t('page.lowcode.entity.importSqlPlaceholder')"
          />
        </NTabPane>
        <NTabPane name="csv" :tab="$t('page.lowcode.entity.importFromCsv')">
          <NUpload
            :file-list="csvFileList"
            :max="1"
            accept=".csv"
            @change="handleCsvUpload"
          >
            <NUploadDragger>
              <div style="margin-bottom: 12px">
                <NIcon size="48" :depth="3">
                  <icon-mdi-file-upload />
                </NIcon>
              </div>
              <NText style="font-size: 16px">
                {{ $t('page.lowcode.entity.uploadCsv') }}
              </NText>
              <NP depth="3" style="margin: 8px 0 0 0">
                {{ $t('page.lowcode.entity.csvFormat') }}
              </NP>
            </NUploadDragger>
          </NUpload>
        </NTabPane>
      </NTabs>

      <template #footer>
        <NSpace justify="end">
          <NButton @click="showImportModal = false">{{ $t('common.cancel') }}</NButton>
          <NButton type="primary" @click="handleImport">{{ $t('common.import') }}</NButton>
        </NSpace>
      </template>
    </NModal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, h } from 'vue';
import type { FormInst, FormRules, DataTableColumns, UploadFileInfo } from 'naive-ui';
import { $t } from '@/locales';
import { createRequiredFormRule } from '@/utils/form/rule';

interface Field {
  id?: string;
  name: string;
  code: string;
  type: string;
  length?: number;
  nullable: boolean;
  primaryKey: boolean;
  uniqueConstraint: boolean;
  autoIncrement: boolean;
  defaultValue?: string;
  comment?: string;
  sortOrder: number;
  index?: boolean;
  searchable?: boolean;
  sortable?: boolean;
  filterable?: boolean;
  displayInList?: boolean;
  displayInForm?: boolean;
  validationRules?: string;
}

interface Props {
  entityId?: string;
  fields: Field[];
}

interface Emits {
  (e: 'update:fields', fields: Field[]): void;
  (e: 'field-added', field: Field): void;
  (e: 'field-updated', field: Field): void;
  (e: 'field-deleted', fieldId: string): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

// State
const showFieldModal = ref(false);
const showImportModal = ref(false);
const editingField = ref<Field | null>(null);
const fieldFormRef = ref<FormInst | null>(null);
const importJson = ref('');
const importSql = ref('');
const csvFileList = ref<UploadFileInfo[]>([]);

// Form
const fieldForm = reactive<Field>({
  name: '',
  code: '',
  type: 'STRING',
  length: 255,
  nullable: true,
  primaryKey: false,
  uniqueConstraint: false,
  autoIncrement: false,
  defaultValue: '',
  comment: '',
  sortOrder: 0,
  index: false,
  searchable: true,
  sortable: true,
  filterable: true,
  displayInList: true,
  displayInForm: true,
  validationRules: ''
});

// Computed
const fields = computed(() => props.fields);

// Options
const fieldTypeOptions = [
  { label: 'String', value: 'STRING' },
  { label: 'Text', value: 'TEXT' },
  { label: 'Integer', value: 'INTEGER' },
  { label: 'BigInt', value: 'BIGINT' },
  { label: 'Decimal', value: 'DECIMAL' },
  { label: 'Float', value: 'FLOAT' },
  { label: 'Double', value: 'DOUBLE' },
  { label: 'Boolean', value: 'BOOLEAN' },
  { label: 'Date', value: 'DATE' },
  { label: 'DateTime', value: 'DATETIME' },
  { label: 'Timestamp', value: 'TIMESTAMP' },
  { label: 'UUID', value: 'UUID' },
  { label: 'JSON', value: 'JSON' },
  { label: 'Enum', value: 'ENUM' }
];

// Form rules
const fieldRules: FormRules = {
  name: createRequiredFormRule($t('page.lowcode.entity.fieldNameRequired')),
  code: createRequiredFormRule($t('page.lowcode.entity.fieldCodeRequired')),
  type: createRequiredFormRule($t('page.lowcode.entity.fieldTypeRequired'))
};

// Table columns
const columns: DataTableColumns<Field> = [
  { title: $t('page.lowcode.entity.fieldName'), key: 'name', width: 120, fixed: 'left' },
  { title: $t('page.lowcode.entity.fieldCode'), key: 'code', width: 120 },
  { title: $t('page.lowcode.entity.fieldType'), key: 'type', width: 100 },
  { title: $t('page.lowcode.entity.fieldLength'), key: 'length', width: 80 },
  { 
    title: $t('page.lowcode.entity.nullable'), 
    key: 'nullable', 
    width: 80,
    render: (row) => row.nullable ? '✓' : '✗'
  },
  { 
    title: $t('page.lowcode.entity.primaryKey'), 
    key: 'primaryKey', 
    width: 80,
    render: (row) => row.primaryKey ? '✓' : '✗'
  },
  { 
    title: $t('page.lowcode.entity.uniqueConstraint'), 
    key: 'uniqueConstraint', 
    width: 80,
    render: (row) => row.uniqueConstraint ? '✓' : '✗'
  },
  { title: $t('page.lowcode.entity.defaultValue'), key: 'defaultValue', width: 120 },
  { title: $t('page.lowcode.entity.comment'), key: 'comment', width: 150 },
  {
    title: $t('common.actions'),
    key: 'actions',
    width: 120,
    fixed: 'right',
    render: (row, index) => [
      h('NButton', 
        { 
          size: 'small', 
          onClick: () => handleEditField(row, index),
          style: { marginRight: '8px' }
        }, 
        $t('common.edit')
      ),
      h('NButton', 
        { 
          size: 'small', 
          type: 'error', 
          onClick: () => handleDeleteField(row, index) 
        }, 
        $t('common.delete')
      )
    ]
  }
];

// Methods
function needsLength(type: string): boolean {
  return ['STRING', 'DECIMAL'].includes(type);
}

function canAutoIncrement(type: string): boolean {
  return ['INTEGER', 'BIGINT'].includes(type);
}

function handleNameChange() {
  // Auto-generate code from name
  if (fieldForm.name && !editingField.value) {
    fieldForm.code = fieldForm.name
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '');
  }
}

function handleTypeChange(type: string) {
  // Set default length based on type
  if (type === 'STRING') {
    fieldForm.length = 255;
  } else if (type === 'DECIMAL') {
    fieldForm.length = 10;
  } else {
    fieldForm.length = undefined;
  }

  // Reset auto increment if not applicable
  if (!canAutoIncrement(type)) {
    fieldForm.autoIncrement = false;
  }
}

function handlePrimaryKeyChange(isPrimaryKey: boolean) {
  if (isPrimaryKey) {
    fieldForm.nullable = false;
    fieldForm.uniqueConstraint = true;
  }
}

function handleAddField() {
  Object.assign(fieldForm, {
    name: '',
    code: '',
    type: 'STRING',
    length: 255,
    nullable: true,
    primaryKey: false,
    uniqueConstraint: false,
    autoIncrement: false,
    defaultValue: '',
    comment: '',
    sortOrder: fields.value.length,
    index: false,
    searchable: true,
    sortable: true,
    filterable: true,
    displayInList: true,
    displayInForm: true,
    validationRules: ''
  });
  editingField.value = null;
  showFieldModal.value = true;
}

function handleEditField(field: Field, index: number) {
  Object.assign(fieldForm, field);
  editingField.value = field;
  showFieldModal.value = true;
}

function handleDeleteField(field: Field, index: number) {
  window.$dialog?.warning({
    title: $t('common.confirm'),
    content: $t('page.lowcode.entity.deleteFieldConfirm', { name: field.name }),
    positiveText: $t('common.delete'),
    negativeText: $t('common.cancel'),
    onPositiveClick: () => {
      const newFields = [...fields.value];
      newFields.splice(index, 1);
      emit('update:fields', newFields);
      if (field.id) {
        emit('field-deleted', field.id);
      }
      window.$message?.success($t('common.deleteSuccess'));
    }
  });
}

async function handleSaveField() {
  await fieldFormRef.value?.validate();
  
  const newField = { ...fieldForm };
  
  if (editingField.value) {
    // Update existing field
    const index = fields.value.findIndex(f => f === editingField.value);
    if (index !== -1) {
      const newFields = [...fields.value];
      newFields[index] = newField;
      emit('update:fields', newFields);
      emit('field-updated', newField);
    }
  } else {
    // Add new field
    const newFields = [...fields.value, newField];
    emit('update:fields', newFields);
    emit('field-added', newField);
  }
  
  showFieldModal.value = false;
  window.$message?.success($t('common.saveSuccess'));
}

function handleImportFields() {
  importJson.value = '';
  importSql.value = '';
  csvFileList.value = [];
  showImportModal.value = true;
}

function handleExportFields() {
  const dataStr = JSON.stringify(fields.value, null, 2);
  const dataBlob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(dataBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'fields.json';
  link.click();
  URL.revokeObjectURL(url);
}

function handleCsvUpload(options: { fileList: UploadFileInfo[] }) {
  csvFileList.value = options.fileList;
}

function handleImport() {
  // Import logic based on active tab
  if (importJson.value) {
    try {
      const importedFields = JSON.parse(importJson.value);
      if (Array.isArray(importedFields)) {
        emit('update:fields', [...fields.value, ...importedFields]);
        window.$message?.success($t('common.importSuccess'));
        showImportModal.value = false;
      } else {
        window.$message?.error($t('page.lowcode.entity.invalidJsonFormat'));
      }
    } catch (error) {
      window.$message?.error($t('page.lowcode.entity.invalidJsonFormat'));
    }
  } else if (importSql.value) {
    // Parse SQL CREATE TABLE statement
    // This is a simplified implementation
    window.$message?.info($t('page.lowcode.entity.sqlImportNotImplemented'));
  } else if (csvFileList.value.length > 0) {
    // Parse CSV file
    window.$message?.info($t('page.lowcode.entity.csvImportNotImplemented'));
  }
}
</script>

<style scoped>
.entity-field-manager {
  @apply w-full;
}
</style>
