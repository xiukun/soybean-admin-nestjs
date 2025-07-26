<template>
  <div class="enhanced-entity-management">
    <!-- Header with Project Selector -->
    <div class="mb-6">
      <ProjectSelector 
        :show-quick-actions="true"
        @change="handleProjectChange"
      />
    </div>

    <!-- Entity Management Header -->
    <div class="mb-6">
      <NSpace justify="space-between" align="center">
        <div>
          <NText tag="h2" class="text-xl font-bold">{{ $t('page.lowcode.entity.management') }}</NText>
          <NText depth="3">{{ $t('page.lowcode.entity.managementDesc') }}</NText>
        </div>
        <NSpace>
          <NButton type="primary" :disabled="!currentProjectId" @click="handleCreateEntity">
            <template #icon>
              <NIcon><icon-mdi-plus /></NIcon>
            </template>
            {{ $t('page.lowcode.entity.create') }}
          </NButton>
          <NButton :disabled="!currentProjectId" @click="handleImportEntities">
            <template #icon>
              <NIcon><icon-mdi-import /></NIcon>
            </template>
            {{ $t('page.lowcode.entity.import') }}
          </NButton>
          <NButton :disabled="!currentProjectId" @click="handleGenerateFromDatabase">
            <template #icon>
              <NIcon><icon-mdi-database /></NIcon>
            </template>
            {{ $t('page.lowcode.entity.generateFromDb') }}
          </NButton>
        </NSpace>
      </NSpace>
    </div>

    <!-- Filters and Search -->
    <NCard v-if="currentProjectId" class="mb-4">
      <NSpace justify="space-between" align="center">
        <NSpace>
          <NInput
            v-model:value="searchQuery"
            :placeholder="$t('page.lowcode.entity.searchPlaceholder')"
            style="width: 300px"
            clearable
            @input="handleSearch"
          >
            <template #prefix>
              <NIcon><icon-mdi-magnify /></NIcon>
            </template>
          </NInput>
          <NSelect
            v-model:value="categoryFilter"
            :placeholder="$t('page.lowcode.entity.filterByCategory')"
            :options="categoryOptions"
            style="width: 150px"
            clearable
            @update:value="handleFilterChange"
          />
          <NSelect
            v-model:value="statusFilter"
            :placeholder="$t('page.lowcode.entity.filterByStatus')"
            :options="statusOptions"
            style="width: 150px"
            clearable
            @update:value="handleFilterChange"
          />
        </NSpace>
        <NSpace>
          <NSelect
            v-model:value="viewMode"
            :options="viewModeOptions"
            style="width: 120px"
          />
          <NButton @click="handleRefresh">
            <template #icon>
              <NIcon><icon-mdi-refresh /></NIcon>
            </template>
          </NButton>
        </NSpace>
      </NSpace>
    </NCard>

    <!-- No Project Selected -->
    <div v-if="!currentProjectId" class="text-center py-20">
      <NEmpty :description="$t('page.lowcode.entity.selectProjectFirst')" />
    </div>

    <!-- Entity List -->
    <div v-else-if="viewMode === 'grid'" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      <NCard
        v-for="entity in filteredEntities"
        :key="entity.id"
        hoverable
        class="entity-card cursor-pointer"
        @click="handleViewEntity(entity)"
      >
        <template #header>
          <NSpace justify="space-between" align="center">
            <NSpace align="center">
              <NIcon size="24" :color="getCategoryColor(entity.category)">
                <component :is="getCategoryIcon(entity.category)" />
              </NIcon>
              <div>
                <NText strong>{{ entity.name }}</NText>
                <br>
                <NText depth="3" style="font-size: 12px">{{ entity.tableName }}</NText>
              </div>
            </NSpace>
            <NDropdown :options="getEntityActions(entity)" @select="(key) => handleEntityAction(key, entity)">
              <NButton size="small" quaternary circle @click.stop>
                <template #icon>
                  <NIcon><icon-mdi-dots-vertical /></NIcon>
                </template>
              </NButton>
            </NDropdown>
          </NSpace>
        </template>

        <template #header-extra>
          <NTag :type="getStatusType(entity.status)" size="small">
            {{ $t(`page.lowcode.entity.status.${entity.status.toLowerCase()}`) }}
          </NTag>
        </template>

        <div class="space-y-3">
          <NText depth="3" class="line-clamp-2">{{ entity.description || $t('page.lowcode.entity.noDescription') }}</NText>
          
          <NSpace justify="space-between">
            <NSpace vertical size="small">
              <NText depth="3" style="font-size: 12px">
                <NIcon size="14" class="mr-1"><icon-mdi-table-column /></NIcon>
                {{ entity.fieldCount || 0 }} {{ $t('page.lowcode.entity.fields') }}
              </NText>
              <NText depth="3" style="font-size: 12px">
                <NIcon size="14" class="mr-1"><icon-mdi-link-variant /></NIcon>
                {{ entity.relationshipCount || 0 }} {{ $t('page.lowcode.entity.relationships') }}
              </NText>
            </NSpace>
            <NSpace vertical size="small">
              <NText depth="3" style="font-size: 12px">
                <NIcon size="14" class="mr-1"><icon-mdi-account /></NIcon>
                {{ entity.createdBy }}
              </NText>
              <NText depth="3" style="font-size: 12px">
                <NIcon size="14" class="mr-1"><icon-mdi-clock /></NIcon>
                {{ formatDate(entity.createdAt) }}
              </NText>
            </NSpace>
          </NSpace>

          <div class="flex flex-wrap gap-1">
            <NTag size="tiny" :type="getCategoryTagType(entity.category)">{{ entity.category }}</NTag>
            <NTag v-if="entity.hasValidation" size="tiny" type="info">Validation</NTag>
            <NTag v-if="entity.hasIndex" size="tiny" type="info">Indexed</NTag>
          </div>
        </div>

        <template #action>
          <NSpace justify="space-between">
            <NButton size="small" @click.stop="handleEditEntity(entity)">
              {{ $t('common.edit') }}
            </NButton>
            <NButton size="small" type="primary" @click.stop="handleManageFields(entity)">
              {{ $t('page.lowcode.entity.manageFields') }}
            </NButton>
          </NSpace>
        </template>
      </NCard>
    </div>

    <!-- Table View -->
    <NDataTable
      v-else-if="currentProjectId"
      :columns="tableColumns"
      :data="filteredEntities"
      :pagination="pagination"
      :loading="loading"
      size="small"
      striped
      @update:page="handlePageChange"
      @update:page-size="handlePageSizeChange"
    />

    <!-- Entity Form Modal -->
    <NModal v-model:show="showEntityModal" preset="card" style="width: 800px">
      <template #header>
        {{ editingEntity ? $t('page.lowcode.entity.edit') : $t('page.lowcode.entity.create') }}
      </template>
      
      <NForm ref="entityFormRef" :model="entityForm" :rules="entityRules" label-placement="left" :label-width="120">
        <NGrid :cols="2" :x-gap="16">
          <NGridItem>
            <NFormItem :label="$t('page.lowcode.entity.name')" path="name">
              <NInput v-model:value="entityForm.name" @input="handleNameChange" />
            </NFormItem>
          </NGridItem>
          <NGridItem>
            <NFormItem :label="$t('page.lowcode.entity.code')" path="code">
              <NInput v-model:value="entityForm.code" />
            </NFormItem>
          </NGridItem>
          <NGridItem>
            <NFormItem :label="$t('page.lowcode.entity.tableName')" path="tableName">
              <NInput v-model:value="entityForm.tableName" />
            </NFormItem>
          </NGridItem>
          <NGridItem>
            <NFormItem :label="$t('page.lowcode.entity.category')" path="category">
              <NSelect v-model:value="entityForm.category" :options="categoryOptions" />
            </NFormItem>
          </NGridItem>
          <NGridItem :span="2">
            <NFormItem :label="$t('page.lowcode.entity.description')" path="description">
              <NInput v-model:value="entityForm.description" type="textarea" :rows="3" />
            </NFormItem>
          </NGridItem>
        </NGrid>

        <!-- Advanced Options -->
        <NCollapse>
          <NCollapseItem :title="$t('page.lowcode.entity.advancedOptions')" name="advanced">
            <NGrid :cols="3" :x-gap="16">
              <NGridItem>
                <NFormItem :label="$t('page.lowcode.entity.enableSoftDelete')">
                  <NSwitch v-model:value="entityForm.enableSoftDelete" />
                </NFormItem>
              </NGridItem>
              <NGridItem>
                <NFormItem :label="$t('page.lowcode.entity.enableAudit')">
                  <NSwitch v-model:value="entityForm.enableAudit" />
                </NFormItem>
              </NGridItem>
              <NGridItem>
                <NFormItem :label="$t('page.lowcode.entity.enableVersioning')">
                  <NSwitch v-model:value="entityForm.enableVersioning" />
                </NFormItem>
              </NGridItem>
              <NGridItem>
                <NFormItem :label="$t('page.lowcode.entity.enableCache')">
                  <NSwitch v-model:value="entityForm.enableCache" />
                </NFormItem>
              </NGridItem>
              <NGridItem>
                <NFormItem :label="$t('page.lowcode.entity.enableSearch')">
                  <NSwitch v-model:value="entityForm.enableSearch" />
                </NFormItem>
              </NGridItem>
              <NGridItem>
                <NFormItem :label="$t('page.lowcode.entity.enableExport')">
                  <NSwitch v-model:value="entityForm.enableExport" />
                </NFormItem>
              </NGridItem>
            </NGrid>
          </NCollapseItem>
        </NCollapse>
      </NForm>

      <template #footer>
        <NSpace justify="end">
          <NButton @click="showEntityModal = false">{{ $t('common.cancel') }}</NButton>
          <NButton type="primary" @click="handleSaveEntity">{{ $t('lowcode.common.active.save') }}</NButton>
        </NSpace>
      </template>
    </NModal>

    <!-- Field Management Modal -->
    <NModal v-model:show="showFieldModal" preset="card" style="width: 95%; max-width: 1400px">
      <template #header>
        {{ $t('page.lowcode.entity.fieldManagement') }} - {{ selectedEntity?.name }}
      </template>
      
      <EntityFieldManager
        v-if="selectedEntity"
        :entity-id="selectedEntity.id"
        :fields="selectedEntity.fields || []"
        @update:fields="handleFieldsUpdate"
        @field-added="handleFieldAdded"
        @field-updated="handleFieldUpdated"
        @field-deleted="handleFieldDeleted"
      />

      <template #footer>
        <NSpace justify="end">
          <NButton @click="showFieldModal = false">{{ $t('common.close') }}</NButton>
        </NSpace>
      </template>
    </NModal>

    <!-- Import Modal -->
    <NModal v-model:show="showImportModal" preset="card" style="width: 800px">
      <template #header>
        {{ $t('page.lowcode.entity.import') }}
      </template>
      
      <NTabs type="line">
        <NTabPane name="database" :tab="$t('page.lowcode.entity.importFromDatabase')">
          <NSpace vertical>
            <NFormItem :label="$t('page.lowcode.entity.databaseConnection')">
              <NSelect v-model:value="dbConnection" :options="dbConnectionOptions" />
            </NFormItem>
            <NFormItem :label="$t('page.lowcode.entity.selectTables')">
              <NTransfer
                v-model:value="selectedTables"
                :options="availableTables"
                :render-source-label="renderTableLabel"
                :render-target-label="renderTableLabel"
              />
            </NFormItem>
          </NSpace>
        </NTabPane>
        <NTabPane name="json" :tab="$t('page.lowcode.entity.importFromJson')">
          <NInput 
            v-model:value="importJson" 
            type="textarea" 
            :rows="15" 
            :placeholder="$t('page.lowcode.entity.importJsonPlaceholder')"
          />
        </NTabPane>
        <NTabPane name="sql" :tab="$t('page.lowcode.entity.importFromSql')">
          <NInput 
            v-model:value="importSql" 
            type="textarea" 
            :rows="15" 
            :placeholder="$t('page.lowcode.entity.importSqlPlaceholder')"
          />
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
import { ref, reactive, computed, onMounted, h } from 'vue';
import { useRouter } from 'vue-router';
import type { FormInst, FormRules, DataTableColumns } from 'naive-ui';
import { $t } from '@/locales';
import { createRequiredFormRule } from '@/utils/form/rule';
import { formatDate } from '@/utils/common';
import { useLowcodeStore } from '@/store/modules/lowcode';
import ProjectSelector from '@/components/common/ProjectSelector.vue';
import EntityFieldManager from '@/components/lowcode/EntityFieldManager.vue';

interface Entity {
  id: string;
  projectId: string;
  name: string;
  code: string;
  tableName: string;
  description?: string;
  category: string;
  status: 'DRAFT' | 'ACTIVE' | 'INACTIVE';
  fieldCount?: number;
  relationshipCount?: number;
  hasValidation?: boolean;
  hasIndex?: boolean;
  enableSoftDelete?: boolean;
  enableAudit?: boolean;
  enableVersioning?: boolean;
  enableCache?: boolean;
  enableSearch?: boolean;
  enableExport?: boolean;
  fields?: any[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

const router = useRouter();
const lowcodeStore = useLowcodeStore();

// State
const loading = ref(false);
const entities = ref<Entity[]>([]);
const searchQuery = ref('');
const categoryFilter = ref('');
const statusFilter = ref('');
const viewMode = ref<'grid' | 'table'>('grid');
const showEntityModal = ref(false);
const showFieldModal = ref(false);
const showImportModal = ref(false);
const editingEntity = ref<Entity | null>(null);
const selectedEntity = ref<Entity | null>(null);
const entityFormRef = ref<FormInst | null>(null);

// Import state
const importJson = ref('');
const importSql = ref('');
const dbConnection = ref('');
const selectedTables = ref<string[]>([]);
const availableTables = ref<Array<{ label: string; value: string }>>([]);

const pagination = ref({
  page: 1,
  pageSize: 12,
  itemCount: 0,
  showSizePicker: true,
  pageSizes: [12, 24, 48, 96]
});

// Form
const entityForm = reactive<Partial<Entity>>({
  name: '',
  code: '',
  tableName: '',
  description: '',
  category: 'business',
  enableSoftDelete: true,
  enableAudit: true,
  enableVersioning: false,
  enableCache: false,
  enableSearch: true,
  enableExport: true
});

// Computed
const currentProjectId = computed(() => lowcodeStore.currentProjectId);

const filteredEntities = computed(() => {
  let filtered = entities.value;

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    filtered = filtered.filter(entity => 
      entity.name.toLowerCase().includes(query) ||
      entity.code.toLowerCase().includes(query) ||
      entity.tableName.toLowerCase().includes(query) ||
      entity.description?.toLowerCase().includes(query)
    );
  }

  if (categoryFilter.value) {
    filtered = filtered.filter(entity => entity.category === categoryFilter.value);
  }

  if (statusFilter.value) {
    filtered = filtered.filter(entity => entity.status === statusFilter.value);
  }

  return filtered;
});

// Options
const categoryOptions = [
  { label: $t('page.lowcode.entity.category.business'), value: 'business' },
  { label: $t('page.lowcode.entity.category.system'), value: 'system' },
  { label: $t('page.lowcode.entity.category.lookup'), value: 'lookup' },
  { label: $t('page.lowcode.entity.category.log'), value: 'log' },
  { label: $t('page.lowcode.entity.category.config'), value: 'config' }
];

const statusOptions = [
  { label: $t('page.lowcode.entity.status.draft'), value: 'DRAFT' },
  { label: $t('page.lowcode.entity.status.active'), value: 'ACTIVE' },
  { label: $t('page.lowcode.entity.status.inactive'), value: 'INACTIVE' }
];

const viewModeOptions = [
  { label: $t('page.lowcode.entity.gridView'), value: 'grid' },
  { label: $t('page.lowcode.entity.tableView'), value: 'table' }
];

const dbConnectionOptions = [
  { label: 'Local PostgreSQL', value: 'local-postgres' },
  { label: 'Local MySQL', value: 'local-mysql' },
  { label: 'Development DB', value: 'dev-db' }
];

// Form rules
const entityRules: FormRules = {
  name: createRequiredFormRule($t('page.lowcode.entity.nameRequired')),
  code: createRequiredFormRule($t('page.lowcode.entity.codeRequired')),
  tableName: createRequiredFormRule($t('page.lowcode.entity.tableNameRequired')),
  category: createRequiredFormRule($t('page.lowcode.entity.categoryRequired'))
};

// Table columns
const tableColumns: DataTableColumns<Entity> = [
  { title: $t('page.lowcode.entity.name'), key: 'name', width: 150, fixed: 'left' },
  { title: $t('page.lowcode.entity.code'), key: 'code', width: 120 },
  { title: $t('page.lowcode.entity.tableName'), key: 'tableName', width: 150 },
  { title: $t('page.lowcode.entity.category'), key: 'category', width: 100 },
  {
    title: $t('page.lowcode.entity.status'),
    key: 'status',
    width: 100,
    render: (row) => h('NTag', { type: getStatusType(row.status) }, 
      $t(`page.lowcode.entity.status.${row.status.toLowerCase()}`)
    )
  },
  { title: $t('page.lowcode.entity.fields'), key: 'fieldCount', width: 80, align: 'center' },
  { title: $t('page.lowcode.entity.relationships'), key: 'relationshipCount', width: 100, align: 'center' },
  { title: $t('page.lowcode.entity.createdBy'), key: 'createdBy', width: 120 },
  {
    title: $t('page.lowcode.entity.createdAt'),
    key: 'createdAt',
    width: 150,
    render: (row) => formatDate(row.createdAt)
  },
  {
    title: $t('common.actions'),
    key: 'actions',
    width: 200,
    fixed: 'right',
    render: (row) => [
      h('NButton', 
        { 
          size: 'small', 
          onClick: () => handleViewEntity(row),
          style: { marginRight: '8px' }
        }, 
        $t('common.view')
      ),
      h('NButton', 
        { 
          size: 'small', 
          onClick: () => handleEditEntity(row),
          style: { marginRight: '8px' }
        }, 
        $t('common.edit')
      ),
      h('NButton', 
        { 
          size: 'small', 
          type: 'primary',
          onClick: () => handleManageFields(row)
        }, 
        $t('page.lowcode.entity.fields')
      )
    ]
  }
];

// Methods
function getStatusType(status: string): 'success' | 'warning' | 'error' | 'info' {
  const statusMap: Record<string, 'success' | 'warning' | 'error' | 'info'> = {
    ACTIVE: 'success',
    DRAFT: 'info',
    INACTIVE: 'warning'
  };
  return statusMap[status] || 'info';
}

function getCategoryColor(category: string): string {
  const colorMap: Record<string, string> = {
    business: '#1890ff',
    system: '#52c41a',
    lookup: '#faad14',
    log: '#f5222d',
    config: '#722ed1'
  };
  return colorMap[category] || '#666666';
}

function getCategoryIcon(category: string): string {
  const iconMap: Record<string, string> = {
    business: 'icon-mdi-briefcase',
    system: 'icon-mdi-cog',
    lookup: 'icon-mdi-table-search',
    log: 'icon-mdi-file-document',
    config: 'icon-mdi-settings'
  };
  return iconMap[category] || 'icon-mdi-table';
}

function getCategoryTagType(category: string): 'success' | 'warning' | 'error' | 'info' {
  const typeMap: Record<string, 'success' | 'warning' | 'error' | 'info'> = {
    business: 'info',
    system: 'success',
    lookup: 'warning',
    log: 'error',
    config: 'info'
  };
  return typeMap[category] || 'info';
}

function getEntityActions(entity: Entity) {
  return [
    { label: $t('common.view'), key: 'view' },
    { label: $t('common.edit'), key: 'edit' },
    { label: $t('page.lowcode.entity.manageFields'), key: 'fields' },
    { label: $t('page.lowcode.entity.relationships'), key: 'relationships' },
    { label: $t('common.duplicate'), key: 'duplicate' },
    { label: $t('common.export'), key: 'export' },
    { label: $t('common.delete'), key: 'delete' }
  ];
}

function handleProjectChange(projectId: string | null) {
  if (projectId) {
    loadEntities(projectId);
  } else {
    entities.value = [];
  }
}

function handleNameChange() {
  // Auto-generate code and table name from name
  if (entityForm.name && !editingEntity.value) {
    entityForm.code = entityForm.name
      .replace(/[^a-zA-Z0-9]/g, '')
      .replace(/^./, entityForm.name.charAt(0).toUpperCase());
    
    entityForm.tableName = entityForm.name
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '');
  }
}

function handleSearch() {
  // Debounced search implementation would go here
}

function handleFilterChange() {
  // Filter change logic
}

function handleRefresh() {
  if (currentProjectId.value) {
    loadEntities(currentProjectId.value);
  }
}

function handlePageChange(page: number) {
  pagination.value.page = page;
}

function handlePageSizeChange(pageSize: number) {
  pagination.value.pageSize = pageSize;
  pagination.value.page = 1;
}

function handleCreateEntity() {
  Object.assign(entityForm, {
    name: '',
    code: '',
    tableName: '',
    description: '',
    category: 'business',
    enableSoftDelete: true,
    enableAudit: true,
    enableVersioning: false,
    enableCache: false,
    enableSearch: true,
    enableExport: true
  });
  editingEntity.value = null;
  showEntityModal.value = true;
}

function handleEditEntity(entity: Entity) {
  Object.assign(entityForm, entity);
  editingEntity.value = entity;
  showEntityModal.value = true;
}

function handleViewEntity(entity: Entity) {
  router.push(`/lowcode/entity/${entity.id}`);
}

function handleManageFields(entity: Entity) {
  selectedEntity.value = entity;
  showFieldModal.value = true;
}

function handleEntityAction(key: string, entity: Entity) {
  switch (key) {
    case 'view':
      handleViewEntity(entity);
      break;
    case 'edit':
      handleEditEntity(entity);
      break;
    case 'fields':
      handleManageFields(entity);
      break;
    case 'relationships':
      router.push(`/lowcode/entity/${entity.id}/relationships`);
      break;
    case 'duplicate':
      handleDuplicateEntity(entity);
      break;
    case 'export':
      handleExportEntity(entity);
      break;
    case 'delete':
      handleDeleteEntity(entity);
      break;
  }
}

function handleDuplicateEntity(entity: Entity) {
  const duplicated = { ...entity };
  duplicated.name += ' (Copy)';
  duplicated.code += 'Copy';
  duplicated.tableName += '_copy';
  duplicated.id = ''; // Will be generated on save
  Object.assign(entityForm, duplicated);
  editingEntity.value = null;
  showEntityModal.value = true;
}

function handleExportEntity(entity: Entity) {
  const dataStr = JSON.stringify(entity, null, 2);
  const dataBlob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(dataBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${entity.code}.json`;
  link.click();
  URL.revokeObjectURL(url);
}

function handleDeleteEntity(entity: Entity) {
  window.$dialog?.error({
    title: $t('common.confirm'),
    content: $t('page.lowcode.entity.deleteConfirm'),
    positiveText: $t('common.delete'),
    negativeText: $t('common.cancel'),
    onPositiveClick: () => {
      // Delete entity logic here
      window.$message?.success($t('common.deleteSuccess'));
    }
  });
}

async function handleSaveEntity() {
  await entityFormRef.value?.validate();
  
  const entityData = {
    ...entityForm,
    projectId: currentProjectId.value
  };
  
  // Save entity logic here
  showEntityModal.value = false;
  window.$message?.success($t('common.saveSuccess'));
  
  if (currentProjectId.value) {
    loadEntities(currentProjectId.value);
  }
}

function handleFieldsUpdate(fields: any[]) {
  if (selectedEntity.value) {
    selectedEntity.value.fields = fields;
  }
}

function handleFieldAdded(field: any) {
  window.$message?.success($t('page.lowcode.entity.fieldAdded'));
}

function handleFieldUpdated(field: any) {
  window.$message?.success($t('page.lowcode.entity.fieldUpdated'));
}

function handleFieldDeleted(fieldId: string) {
  window.$message?.success($t('page.lowcode.entity.fieldDeleted'));
}

function handleImportEntities() {
  importJson.value = '';
  importSql.value = '';
  dbConnection.value = '';
  selectedTables.value = [];
  showImportModal.value = true;
}

function handleGenerateFromDatabase() {
  // Load available tables from database
  availableTables.value = [
    { label: 'users', value: 'users' },
    { label: 'products', value: 'products' },
    { label: 'orders', value: 'orders' },
    { label: 'categories', value: 'categories' }
  ];
  
  handleImportEntities();
}

function renderTableLabel(option: { label: string; value: string }) {
  return option.label;
}

function handleImport() {
  // Import logic based on active tab
  if (importJson.value) {
    try {
      const importedEntities = JSON.parse(importJson.value);
      // Import entities logic here
      window.$message?.success($t('common.importSuccess'));
      showImportModal.value = false;
      if (currentProjectId.value) {
        loadEntities(currentProjectId.value);
      }
    } catch (error) {
      window.$message?.error($t('page.lowcode.entity.invalidJsonFormat'));
    }
  } else if (importSql.value) {
    // SQL import logic here
    window.$message?.info($t('page.lowcode.entity.sqlImportNotImplemented'));
  } else if (selectedTables.value.length > 0) {
    // Database import logic here
    window.$message?.info($t('page.lowcode.entity.dbImportNotImplemented'));
  }
}

async function loadEntities(projectId: string) {
  try {
    loading.value = true;
    
    // Mock data - in real implementation, this would call the API
    const mockEntities: Entity[] = [
      {
        id: 'entity-1',
        projectId,
        name: 'User',
        code: 'User',
        tableName: 'users',
        description: 'User management entity with authentication and profile information.',
        category: 'business',
        status: 'ACTIVE',
        fieldCount: 12,
        relationshipCount: 3,
        hasValidation: true,
        hasIndex: true,
        enableSoftDelete: true,
        enableAudit: true,
        createdBy: 'admin',
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'entity-2',
        projectId,
        name: 'Product',
        code: 'Product',
        tableName: 'products',
        description: 'Product catalog entity with pricing and inventory management.',
        category: 'business',
        status: 'ACTIVE',
        fieldCount: 15,
        relationshipCount: 5,
        hasValidation: true,
        hasIndex: true,
        enableSoftDelete: true,
        enableAudit: true,
        createdBy: 'admin',
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'entity-3',
        projectId,
        name: 'Order',
        code: 'Order',
        tableName: 'orders',
        description: 'Order processing entity with payment and shipping tracking.',
        category: 'business',
        status: 'DRAFT',
        fieldCount: 8,
        relationshipCount: 2,
        hasValidation: false,
        hasIndex: false,
        enableSoftDelete: false,
        enableAudit: true,
        createdBy: 'developer',
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];
    
    entities.value = mockEntities;
    pagination.value.itemCount = mockEntities.length;
  } catch (error) {
    console.error('Failed to load entities:', error);
    window.$message?.error($t('page.lowcode.entity.loadFailed'));
  } finally {
    loading.value = false;
  }
}

// Lifecycle
onMounted(() => {
  if (currentProjectId.value) {
    loadEntities(currentProjectId.value);
  }
});
</script>

<style scoped>
.enhanced-entity-management {
  @apply p-6;
}

.entity-card {
  @apply transition-all duration-200;
}

.entity-card:hover {
  @apply shadow-lg transform scale-105;
}

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
