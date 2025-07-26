<template>
  <div class="entity-field-designer">
    <!-- 头部信息 -->
    <div class="designer-header mb-6">
      <NSpace justify="space-between" align="center">
        <div>
          <NSpace align="center">
            <NButton quaternary circle @click="handleGoBack">
              <template #icon>
                <NIcon><icon-mdi-arrow-left /></NIcon>
              </template>
            </NButton>
            <div>
              <NText tag="h1" class="text-2xl font-bold">{{ entity?.name }} - {{ $t('page.lowcode.entity.fieldDesigner') }}</NText>
              <NText depth="3">{{ entity?.description || $t('page.lowcode.entity.noDescription') }}</NText>
            </div>
          </NSpace>
        </div>
        <NSpace>
          <NButton @click="handlePreview">
            <template #icon>
              <NIcon><icon-mdi-eye /></NIcon>
            </template>
            {{ $t('page.lowcode.entity.preview') }}
          </NButton>
          <NButton @click="handleSave" :loading="saving">
            <template #icon>
              <NIcon><icon-mdi-content-save /></NIcon>
            </template>
            {{ $t('page.lowcode.common.actions.save') }}
          </NButton>
        </NSpace>
      </NSpace>
    </div>

    <!-- 主要内容区域 -->
    <div class="designer-content">
      <NGrid :cols="4" :x-gap="16">
        <!-- 字段列表 -->
        <NGridItem :span="3">
          <NCard :title="$t('page.lowcode.entity.fieldList')" size="small">
            <template #header-extra>
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
              </NSpace>
            </template>

            <!-- 字段表格 -->
            <NDataTable
              :columns="fieldColumns"
              :data="fields"
              size="small"
              :pagination="false"
              :max-height="600"
              :row-key="row => row.id"
              @update:sorter="handleSort"
            />
          </NCard>
        </NGridItem>

        <!-- 字段属性面板 -->
        <NGridItem>
          <NCard :title="$t('page.lowcode.entity.fieldProperties')" size="small">
            <div v-if="selectedField">
              <NForm
                ref="fieldFormRef"
                :model="selectedField"
                :rules="fieldRules"
                label-placement="top"
                size="small"
              >
                <NFormItem :label="$t('page.lowcode.entity.fieldName')" path="name">
                  <NInput v-model:value="selectedField.name" @input="handleFieldNameChange" />
                </NFormItem>

                <NFormItem :label="$t('page.lowcode.entity.fieldCode')" path="code">
                  <NInput v-model:value="selectedField.code" />
                </NFormItem>

                <NFormItem :label="$t('page.lowcode.entity.dataType')" path="dataType">
                  <NSelect v-model:value="selectedField.dataType" :options="dataTypeOptions" @update:value="handleDataTypeChange" />
                </NFormItem>

                <NFormItem v-if="showLengthField" :label="$t('page.lowcode.entity.length')" path="length">
                  <NInputNumber v-model:value="selectedField.length" :min="1" :max="65535" />
                </NFormItem>

                <NFormItem v-if="showPrecisionField" :label="$t('page.lowcode.entity.precision')" path="precision">
                  <NInputNumber v-model:value="selectedField.precision" :min="0" :max="30" />
                </NFormItem>

                <NFormItem :label="$t('page.lowcode.entity.required')" path="required">
                  <NSwitch v-model:value="selectedField.required" />
                </NFormItem>

                <NFormItem :label="$t('page.lowcode.entity.unique')" path="unique">
                  <NSwitch v-model:value="selectedField.unique" />
                </NFormItem>

                <NFormItem :label="$t('page.lowcode.entity.primaryKey')" path="primaryKey">
                  <NSwitch v-model:value="selectedField.primaryKey" @update:value="handlePrimaryKeyChange" />
                </NFormItem>

                <NFormItem :label="$t('page.lowcode.entity.autoIncrement')" path="autoIncrement">
                  <NSwitch v-model:value="selectedField.autoIncrement" :disabled="!selectedField.primaryKey" />
                </NFormItem>

                <NFormItem :label="$t('page.lowcode.entity.defaultValue')" path="defaultValue">
                  <NInput v-model:value="selectedField.defaultValue" />
                </NFormItem>

                <NFormItem :label="$t('page.lowcode.entity.comment')" path="comment">
                  <NInput v-model:value="selectedField.comment" type="textarea" :rows="3" />
                </NFormItem>

                <NFormItem :label="$t('page.lowcode.entity.displayOrder')" path="displayOrder">
                  <NInputNumber v-model:value="selectedField.displayOrder" :min="1" />
                </NFormItem>
              </NForm>
            </div>
            <div v-else class="text-center py-8">
              <NEmpty :description="$t('page.lowcode.entity.selectFieldToEdit')" />
            </div>
          </NCard>
        </NGridItem>
      </NGrid>
    </div>

    <!-- 字段预览模态框 -->
    <NModal v-model:show="showPreviewModal" preset="card" style="width: 800px">
      <template #header>
        {{ $t('page.lowcode.entity.entityPreview') }} - {{ entity?.name }}
      </template>
      
      <div class="space-y-4">
        <!-- 实体信息 -->
        <NDescriptions :column="2" bordered>
          <NDescriptionsItem :label="$t('page.lowcode.entity.name')">
            {{ entity?.name }}
          </NDescriptionsItem>
          <NDescriptionsItem :label="$t('page.lowcode.entity.tableName')">
            {{ entity?.tableName }}
          </NDescriptionsItem>
          <NDescriptionsItem :label="$t('page.lowcode.entity.fieldCount')">
            {{ fields.length }}
          </NDescriptionsItem>
          <NDescriptionsItem :label="$t('page.lowcode.entity.primaryKeyCount')">
            {{ fields.filter(f => f.primaryKey).length }}
          </NDescriptionsItem>
        </NDescriptions>

        <!-- 字段列表 -->
        <div>
          <NText strong>{{ $t('page.lowcode.entity.fieldList') }}:</NText>
          <NDataTable
            :columns="previewColumns"
            :data="fields"
            size="small"
            :pagination="false"
            :max-height="400"
            class="mt-2"
          />
        </div>

        <!-- SQL预览 -->
        <div>
          <NText strong>{{ $t('page.lowcode.entity.sqlPreview') }}:</NText>
          <NCode :code="generateCreateTableSQL()" language="sql" class="mt-2" />
        </div>
      </div>

      <template #footer>
        <NSpace justify="end">
          <NButton @click="showPreviewModal = false">{{ $t('common.close') }}</NButton>
          <NButton type="primary" @click="handleExportSQL">{{ $t('page.lowcode.entity.exportSQL') }}</NButton>
        </NSpace>
      </template>
    </NModal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, h, nextTick } from 'vue';
import { useRouter } from 'vue-router';
import type { FormInst, FormRules, DataTableColumns } from 'naive-ui';
import { $t } from '@/locales';
import { createRequiredFormRule } from '@/utils/form/rule';

interface Props {
  entityId: string;
}

const props = defineProps<Props>();

interface Field {
  id: string;
  name: string;
  code: string;
  dataType: string;
  length?: number;
  precision?: number;
  required: boolean;
  unique: boolean;
  primaryKey: boolean;
  autoIncrement: boolean;
  defaultValue?: string;
  comment?: string;
  displayOrder: number;
}

interface Entity {
  id: string;
  name: string;
  code: string;
  tableName: string;
  description?: string;
}

const router = useRouter();

// State
const entity = ref<Entity | null>(null);
const fields = ref<Field[]>([]);
const selectedField = ref<Field | null>(null);
const showPreviewModal = ref(false);
const saving = ref(false);
const fieldFormRef = ref<FormInst | null>(null);

// Computed
const showLengthField = computed(() => {
  return selectedField.value && ['STRING', 'VARCHAR', 'CHAR'].includes(selectedField.value.dataType);
});

const showPrecisionField = computed(() => {
  return selectedField.value && ['DECIMAL', 'NUMERIC'].includes(selectedField.value.dataType);
});

// Options
const dataTypeOptions = [
  { label: $t('page.lowcode.entity.dataTypes.STRING'), value: 'STRING' },
  { label: $t('page.lowcode.entity.dataTypes.INTEGER'), value: 'INTEGER' },
  { label: $t('page.lowcode.entity.dataTypes.BIGINT'), value: 'BIGINT' },
  { label: $t('page.lowcode.entity.dataTypes.DECIMAL'), value: 'DECIMAL' },
  { label: $t('page.lowcode.entity.dataTypes.BOOLEAN'), value: 'BOOLEAN' },
  { label: $t('page.lowcode.entity.dataTypes.DATE'), value: 'DATE' },
  { label: $t('page.lowcode.entity.dataTypes.DATETIME'), value: 'DATETIME' },
  { label: $t('page.lowcode.entity.dataTypes.TEXT'), value: 'TEXT' },
  { label: $t('page.lowcode.entity.dataTypes.JSON'), value: 'JSON' }
];

// Form rules
const fieldRules: FormRules = {
  name: createRequiredFormRule($t('page.lowcode.entity.fieldNameRequired')),
  code: createRequiredFormRule($t('page.lowcode.entity.fieldCodeRequired')),
  dataType: createRequiredFormRule($t('page.lowcode.entity.dataTypeRequired'))
};

// Table columns
const fieldColumns: DataTableColumns<Field> = [
  {
    title: $t('page.lowcode.entity.fieldName'),
    key: 'name',
    width: 120,
    render: (row) => h('span', { 
      class: selectedField.value?.id === row.id ? 'text-primary font-bold' : '',
      onClick: () => handleSelectField(row)
    }, row.name)
  },
  { title: $t('page.lowcode.entity.fieldCode'), key: 'code', width: 120 },
  { title: $t('page.lowcode.entity.dataType'), key: 'dataType', width: 100 },
  {
    title: $t('page.lowcode.entity.constraints'),
    key: 'constraints',
    width: 120,
    render: (row) => [
      row.primaryKey && h('NTag', { type: 'error', size: 'small', class: 'mr-1' }, 'PK'),
      row.required && h('NTag', { type: 'warning', size: 'small', class: 'mr-1' }, 'NOT NULL'),
      row.unique && h('NTag', { type: 'info', size: 'small', class: 'mr-1' }, 'UNIQUE'),
      row.autoIncrement && h('NTag', { type: 'success', size: 'small' }, 'AUTO')
    ]
  },
  {
    title: $t('common.actions'),
    key: 'actions',
    width: 100,
    render: (row) => [
      h('NButton', 
        { 
          size: 'small', 
          onClick: () => handleDeleteField(row),
          style: { marginRight: '8px' }
        }, 
        $t('common.delete')
      )
    ]
  }
];

const previewColumns: DataTableColumns<Field> = [
  { title: $t('page.lowcode.entity.fieldName'), key: 'name', width: 120 },
  { title: $t('page.lowcode.entity.fieldCode'), key: 'code', width: 120 },
  { title: $t('page.lowcode.entity.dataType'), key: 'dataType', width: 100 },
  { title: $t('page.lowcode.entity.length'), key: 'length', width: 80 },
  { title: $t('page.lowcode.entity.required'), key: 'required', width: 80, render: (row) => row.required ? $t('common.yes') : $t('common.no') },
  { title: $t('page.lowcode.entity.comment'), key: 'comment', ellipsis: { tooltip: true } }
];

// Methods
function handleGoBack() {
  router.go(-1);
}

function handleSelectField(field: Field) {
  selectedField.value = { ...field };
}

function handleFieldNameChange() {
  if (selectedField.value && !selectedField.value.code) {
    selectedField.value.code = selectedField.value.name
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '');
  }
}

function handleDataTypeChange() {
  if (selectedField.value) {
    // Reset length and precision when data type changes
    if (!showLengthField.value) {
      selectedField.value.length = undefined;
    }
    if (!showPrecisionField.value) {
      selectedField.value.precision = undefined;
    }
  }
}

function handlePrimaryKeyChange(value: boolean) {
  if (selectedField.value) {
    if (value) {
      // When setting as primary key, make it required and unique
      selectedField.value.required = true;
      selectedField.value.unique = true;
      
      // Remove primary key from other fields
      fields.value.forEach(field => {
        if (field.id !== selectedField.value!.id) {
          field.primaryKey = false;
          field.autoIncrement = false;
        }
      });
    } else {
      // When removing primary key, also remove auto increment
      selectedField.value.autoIncrement = false;
    }
  }
}

function handleAddField() {
  const newField: Field = {
    id: `field_${Date.now()}`,
    name: '',
    code: '',
    dataType: 'STRING',
    required: false,
    unique: false,
    primaryKey: false,
    autoIncrement: false,
    displayOrder: fields.value.length + 1
  };
  
  fields.value.push(newField);
  selectedField.value = newField;
}

function handleDeleteField(field: Field) {
  window.$dialog?.warning({
    title: $t('common.confirm'),
    content: $t('page.lowcode.entity.deleteFieldConfirm'),
    positiveText: $t('common.delete'),
    negativeText: $t('common.cancel'),
    onPositiveClick: () => {
      const index = fields.value.findIndex(f => f.id === field.id);
      if (index > -1) {
        fields.value.splice(index, 1);
        if (selectedField.value?.id === field.id) {
          selectedField.value = null;
        }
      }
    }
  });
}

function handleImportFields() {
  window.$message?.info('导入字段功能开发中');
}

function handlePreview() {
  showPreviewModal.value = true;
}

function handleSort() {
  // Sort implementation
}

async function handleSave() {
  try {
    saving.value = true;
    
    // Validate all fields
    for (const field of fields.value) {
      if (!field.name || !field.code || !field.dataType) {
        window.$message?.error($t('page.lowcode.entity.fieldValidationFailed'));
        return;
      }
    }
    
    // Mock save
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    window.$message?.success($t('common.saveSuccess'));
  } catch (error) {
    window.$message?.error($t('common.saveFailed'));
  } finally {
    saving.value = false;
  }
}

function generateCreateTableSQL(): string {
  if (!entity.value || fields.value.length === 0) {
    return '';
  }
  
  const fieldDefinitions = fields.value.map(field => {
    let definition = `  ${field.code} ${field.dataType}`;
    
    if (field.length) {
      definition += `(${field.length}${field.precision ? `,${field.precision}` : ''})`;
    }
    
    if (field.required) {
      definition += ' NOT NULL';
    }
    
    if (field.autoIncrement) {
      definition += ' AUTO_INCREMENT';
    }
    
    if (field.defaultValue) {
      definition += ` DEFAULT '${field.defaultValue}'`;
    }
    
    if (field.comment) {
      definition += ` COMMENT '${field.comment}'`;
    }
    
    return definition;
  });
  
  const primaryKeys = fields.value.filter(f => f.primaryKey).map(f => f.code);
  if (primaryKeys.length > 0) {
    fieldDefinitions.push(`  PRIMARY KEY (${primaryKeys.join(', ')})`);
  }
  
  return `CREATE TABLE ${entity.value.tableName} (\n${fieldDefinitions.join(',\n')}\n);`;
}

function handleExportSQL() {
  const sql = generateCreateTableSQL();
  const blob = new Blob([sql], { type: 'text/sql' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${entity.value?.tableName || 'table'}.sql`;
  link.click();
  URL.revokeObjectURL(url);
}

async function loadEntityAndFields() {
  try {
    // Mock data
    entity.value = {
      id: props.entityId,
      name: 'User',
      code: 'user',
      tableName: 'users',
      description: 'User entity for authentication and profile management'
    };
    
    fields.value = [
      {
        id: 'field_1',
        name: 'ID',
        code: 'id',
        dataType: 'BIGINT',
        required: true,
        unique: true,
        primaryKey: true,
        autoIncrement: true,
        comment: 'Primary key',
        displayOrder: 1
      },
      {
        id: 'field_2',
        name: 'Username',
        code: 'username',
        dataType: 'STRING',
        length: 50,
        required: true,
        unique: true,
        primaryKey: false,
        autoIncrement: false,
        comment: 'User login name',
        displayOrder: 2
      }
    ];
  } catch (error) {
    console.error('Failed to load entity and fields:', error);
    window.$message?.error($t('page.lowcode.entity.loadFailed'));
  }
}

// Lifecycle
onMounted(() => {
  loadEntityAndFields();
});
</script>

<style scoped>
.entity-field-designer {
  @apply p-6;
}

.designer-header {
  @apply border-b border-gray-200 pb-4;
}

.text-primary {
  color: var(--primary-color);
}
</style>
