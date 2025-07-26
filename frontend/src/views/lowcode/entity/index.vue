<template>
  <div class="enhanced-entity-management">
    <!-- Header with Project Selector -->
    <div class="mb-6">
      <NSpace justify="space-between" align="center">
        <div>
          <NText tag="h1" class="text-2xl font-bold">{{ $t('page.lowcode.entity.management') }}</NText>
          <NText depth="3">{{ $t('page.lowcode.entity.managementDesc') }}</NText>
        </div>
        <NSpace>
          <NSelect
            v-if="!props.projectId"
            v-model:value="selectedProjectId"
            :options="projectOptions"
            placeholder="请选择项目"
            style="width: 300px"
            :loading="projectLoading"
            clearable
            @update:value="handleProjectChange"
          />
        </NSpace>
      </NSpace>
    </div>

    <!-- View Mode Tabs -->
    <div class="mb-4">
      <NTabs v-model:value="viewMode" type="line" animated>
        <NTabPane name="list" :tab="$t('page.lowcode.entity.listView')">
          <!-- Entity List View -->
          <div class="entity-list-view">
            <!-- Filters and Search -->
            <NCard class="mb-4">
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
                </NSpace>
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
                </NSpace>
              </NSpace>
            </NCard>

            <!-- Entity Table -->
            <NDataTable
              :columns="columns"
              :data="filteredEntities"
              :pagination="pagination"
              :loading="loading"
              size="small"
              striped
              @update:page="handlePageChange"
              @update:page-size="handlePageSizeChange"
            />
          </div>
        </NTabPane>

        <NTabPane name="designer" :tab="$t('page.lowcode.entity.designerView')">
          <!-- Entity Relationship Designer -->
          <EntityRelationshipDesigner :project-id="currentProjectId" />
        </NTabPane>
      </NTabs>
    </div>

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
      </NForm>

      <template #footer>
        <NSpace justify="end">
          <NButton @click="showEntityModal = false">{{ $t('common.cancel') }}</NButton>
          <NButton type="primary" @click="handleSaveEntity">{{ $t('page.lowcode.common.actions.save') }}</NButton>
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
import EntityRelationshipDesigner from './modules/entity-relationship-designer.vue';

interface Props {
  projectId?: string;
}

const props = defineProps<Props>();

interface Entity {
  id: string;
  projectId: string;
  name: string;
  code: string;
  tableName: string;
  description?: string;
  category: string;
  status: 'DRAFT' | 'ACTIVE' | 'INACTIVE';
  fieldCount: number;
  createdAt: string;
  updatedAt: string;
}

const router = useRouter();

// State
const viewMode = ref<'list' | 'designer'>('list');
const loading = ref(false);
const entities = ref<Entity[]>([]);
const searchQuery = ref('');
const categoryFilter = ref('');
const showEntityModal = ref(false);
const editingEntity = ref<Entity | null>(null);
const entityFormRef = ref<FormInst | null>(null);
const selectedProjectId = ref<string>(props.projectId || '');
const projectOptions = ref<Array<{ label: string; value: string }>>([]);
const projectLoading = ref(false);

const pagination = ref({
  page: 1,
  pageSize: 10,
  itemCount: 0,
  showSizePicker: true,
  pageSizes: [10, 20, 50, 100]
});

// Form
const entityForm = reactive({
  name: '',
  code: '',
  tableName: '',
  category: 'business',
  description: ''
});

// Computed
const currentProjectId = computed(() => props.projectId || selectedProjectId.value);

const filteredEntities = computed(() => {
  let filtered = entities.value;

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    filtered = filtered.filter(entity =>
      entity.name.toLowerCase().includes(query) ||
      entity.code.toLowerCase().includes(query) ||
      entity.tableName.toLowerCase().includes(query)
    );
  }

  if (categoryFilter.value) {
    filtered = filtered.filter(entity => entity.category === categoryFilter.value);
  }

  return filtered;
});

// Options
const categoryOptions = [
  { label: $t('page.lowcode.entity.categories.core'), value: 'core' },
  { label: $t('page.lowcode.entity.categories.business'), value: 'business' },
  { label: $t('page.lowcode.entity.categories.system'), value: 'system' },
  { label: $t('page.lowcode.entity.categories.config'), value: 'config' }
];

// Form rules
const entityRules: FormRules = {
  name: createRequiredFormRule($t('page.lowcode.entity.nameRequired')),
  code: createRequiredFormRule($t('page.lowcode.entity.codeRequired')),
  tableName: createRequiredFormRule($t('page.lowcode.entity.tableNameRequired')),
  category: createRequiredFormRule($t('page.lowcode.entity.categoryRequired'))
};

// Table columns
const columns: DataTableColumns<Entity> = [
  { title: $t('page.lowcode.entity.name'), key: 'name', width: 150, fixed: 'left' },
  { title: $t('page.lowcode.entity.code'), key: 'code', width: 120 },
  { title: $t('page.lowcode.entity.tableName'), key: 'tableName', width: 120 },
  { title: $t('page.lowcode.entity.category'), key: 'category', width: 100 },
  {
    title: $t('page.lowcode.entity.status'),
    key: 'status',
    width: 100,
    render: (row) => h('NTag', { type: getStatusType(row.status) },
      $t(`page.lowcode.entity.status.${row.status.toLowerCase()}`)
    )
  },
  { title: $t('page.lowcode.entity.fieldCount'), key: 'fieldCount', width: 80, align: 'center' },
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
          type: 'primary',
          onClick: () => handleDesignFields(row),
          style: { marginRight: '8px' }
        },
        $t('page.lowcode.entity.designFields')
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
          type: 'error',
          onClick: () => handleDeleteEntity(row)
        },
        $t('common.delete')
      )
    ]
  }
];

// Methods
function getStatusType(status: string): 'success' | 'warning' | 'error' | 'info' {
  const statusMap: Record<string, 'success' | 'warning' | 'error' | 'info'> = {
    ACTIVE: 'success',
    DRAFT: 'warning',
    INACTIVE: 'error'
  };
  return statusMap[status] || 'info';
}

function handleNameChange() {
  // Auto-generate code and table name from name
  if (entityForm.name && !editingEntity.value) {
    entityForm.code = entityForm.name
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '');

    entityForm.tableName = entityForm.code;
  }
}

function handleSearch() {
  // Debounced search implementation would go here
}

function handleFilterChange() {
  // Filter change logic
}

function handlePageChange(page: number) {
  pagination.value.page = page;
}

function handlePageSizeChange(pageSize: number) {
  pagination.value.pageSize = pageSize;
  pagination.value.page = 1;
}

function handleCreateEntity() {
  if (!currentProjectId.value) {
    window.$message?.warning('请先选择一个项目');
    return;
  }

  Object.assign(entityForm, {
    name: '',
    code: '',
    tableName: '',
    category: 'business',
    description: ''
  });
  editingEntity.value = null;
  showEntityModal.value = true;
}

function handleEditEntity(entity: Entity) {
  Object.assign(entityForm, entity);
  editingEntity.value = entity;
  showEntityModal.value = true;
}

function handleDesignFields(entity: Entity) {
  router.push(`/lowcode/entity/${entity.id}/fields`);
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

function handleImportEntities() {
  window.$message?.info('导入实体功能开发中');
}

async function handleSaveEntity() {
  await entityFormRef.value?.validate();

  // Save entity logic here
  showEntityModal.value = false;
  window.$message?.success($t('common.saveSuccess'));
}

async function loadProjects() {
  if (props.projectId) return;

  try {
    projectLoading.value = true;

    // Mock data
    const mockProjects = [
      { id: 'project-1', name: 'E-commerce Platform' },
      { id: 'project-2', name: 'CRM System' }
    ];

    projectOptions.value = mockProjects.map(project => ({
      label: project.name,
      value: project.id
    }));
  } catch (error) {
    console.error('Failed to load projects:', error);
  } finally {
    projectLoading.value = false;
  }
}

function handleProjectChange(projectId: string | null) {
  selectedProjectId.value = projectId || '';
  if (projectId) {
    loadEntities();
  }
}

async function loadEntities() {
  if (!currentProjectId.value) return;

  try {
    loading.value = true;

    // Mock data
    const mockEntities: Entity[] = [
      {
        id: 'entity-1',
        projectId: currentProjectId.value,
        name: 'User',
        code: 'user',
        tableName: 'users',
        description: 'User entity for authentication and profile management',
        category: 'core',
        status: 'ACTIVE',
        fieldCount: 8,
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'entity-2',
        projectId: currentProjectId.value,
        name: 'Product',
        code: 'product',
        tableName: 'products',
        description: 'Product catalog entity',
        category: 'business',
        status: 'ACTIVE',
        fieldCount: 12,
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
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
  loadProjects();
  if (currentProjectId.value) {
    loadEntities();
  }
});
</script>

<style scoped>
.enhanced-entity-management {
  @apply p-6;
}

.entity-list-view {
  @apply space-y-4;
}
</style>
