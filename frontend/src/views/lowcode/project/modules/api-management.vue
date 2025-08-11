<script setup lang="ts">
import { computed, h, onMounted, ref } from 'vue';
import type { DataTableColumns } from 'naive-ui';
import { formatDate } from '@/utils/common';
import { $t } from '@/locales';

interface Props {
  projectId: string;
}

const props = defineProps<Props>();

interface Api {
  id: string;
  projectId: string;
  name: string;
  code: string;
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  description?: string;
  entityId?: string;
  entityName?: string;
  authRequired: boolean;
  status: 'ACTIVE' | 'INACTIVE' | 'DRAFT';
  version: string;
  createdAt: string;
  updatedAt: string;
}

interface TestResult {
  status: number;
  time: number;
  data: any;
}

// State
const loading = ref(false);
const apis = ref<Api[]>([]);
const searchQuery = ref('');
const methodFilter = ref('');
const statusFilter = ref('');
const showTestModal = ref(false);
const testingApi = ref<Api | null>(null);
const testParams = ref('{}');
const testResult = ref<TestResult | null>(null);
const testing = ref(false);

const pagination = ref({
  page: 1,
  pageSize: 10,
  itemCount: 0,
  showSizePicker: true,
  pageSizes: [10, 20, 50, 100]
});

// Computed
const filteredApis = computed(() => {
  let filtered = apis.value;

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    filtered = filtered.filter(
      api =>
        api.name.toLowerCase().includes(query) ||
        api.path.toLowerCase().includes(query) ||
        api.description?.toLowerCase().includes(query)
    );
  }

  if (methodFilter.value) {
    filtered = filtered.filter(api => api.method === methodFilter.value);
  }

  if (statusFilter.value) {
    filtered = filtered.filter(api => api.status === statusFilter.value);
  }

  return filtered;
});

// Options
const methodOptions = [
  { label: 'GET', value: 'GET' },
  { label: 'POST', value: 'POST' },
  { label: 'PUT', value: 'PUT' },
  { label: 'DELETE', value: 'DELETE' },
  { label: 'PATCH', value: 'PATCH' }
];

const statusOptions = [
  { label: $t('page.lowcode.api.status.active'), value: 'ACTIVE' },
  { label: $t('page.lowcode.api.status.inactive'), value: 'INACTIVE' },
  { label: $t('page.lowcode.api.status.draft'), value: 'DRAFT' }
];

// Table columns
const columns: DataTableColumns<Api> = [
  { title: $t('page.lowcode.api.name'), key: 'name', width: 150, fixed: 'left' },
  {
    title: $t('page.lowcode.api.method'),
    key: 'method',
    width: 80,
    render: row => h('NTag', { type: getMethodType(row.method), size: 'small' }, row.method)
  },
  { title: $t('page.lowcode.api.path'), key: 'path', width: 200 },
  { title: $t('page.lowcode.api.entity'), key: 'entityName', width: 120 },
  {
    title: $t('page.lowcode.api.authRequired'),
    key: 'authRequired',
    width: 100,
    render: row =>
      h(
        'NTag',
        { type: row.authRequired ? 'warning' : 'success', size: 'small' },
        row.authRequired ? $t('common.yes') : $t('common.no')
      )
  },
  {
    title: $t('page.lowcode.api.status'),
    key: 'status',
    width: 100,
    render: row =>
      h('NTag', { type: getStatusType(row.status) }, $t(`page.lowcode.api.status.${row.status.toLowerCase()}`))
  },
  { title: $t('page.lowcode.api.version'), key: 'version', width: 80 },
  {
    title: $t('page.lowcode.api.createdAt'),
    key: 'createdAt',
    width: 150,
    render: row => formatDate(row.createdAt)
  },
  {
    title: $t('common.actions'),
    key: 'actions',
    width: 200,
    fixed: 'right',
    render: row => [
      h(
        'NButton',
        {
          size: 'small',
          onClick: () => handleTestApi(row),
          style: { marginRight: '8px' }
        },
        $t('page.lowcode.api.test')
      ),
      h(
        'NButton',
        {
          size: 'small',
          onClick: () => handleEditApi(row),
          style: { marginRight: '8px' }
        },
        $t('common.edit')
      ),
      h(
        'NButton',
        {
          size: 'small',
          type: 'error',
          onClick: () => handleDeleteApi(row)
        },
        $t('common.delete')
      )
    ]
  }
];

// Methods
function getMethodType(method: string): 'success' | 'warning' | 'error' | 'info' {
  const methodMap: Record<string, 'success' | 'warning' | 'error' | 'info'> = {
    GET: 'success',
    POST: 'info',
    PUT: 'warning',
    DELETE: 'error',
    PATCH: 'warning'
  };
  return methodMap[method] || 'info';
}

function getStatusType(status: string): 'success' | 'warning' | 'error' | 'info' {
  const statusMap: Record<string, 'success' | 'warning' | 'error' | 'info'> = {
    ACTIVE: 'success',
    DRAFT: 'warning',
    INACTIVE: 'error'
  };
  return statusMap[status] || 'info';
}

function handlePageChange(page: number) {
  pagination.value.page = page;
}

function handlePageSizeChange(pageSize: number) {
  pagination.value.pageSize = pageSize;
  pagination.value.page = 1;
}

function handleCreateApi() {
  window.$message?.info('创建API功能开发中');
}

function handleEditApi(api: Api) {
  window.$message?.info(`编辑API: ${api.name}`);
}

function handleTestApi(api: Api) {
  testingApi.value = api;
  testParams.value = '{}';
  testResult.value = null;
  showTestModal.value = true;
}

async function handleRunTest() {
  if (!testingApi.value) return;

  try {
    testing.value = true;

    // Mock API test
    await new Promise(resolve => setTimeout(resolve, 1000));

    testResult.value = {
      status: 200,
      time: 156,
      data: {
        success: true,
        message: 'API test successful',
        data: {
          id: '1',
          name: 'Test Result',
          timestamp: new Date().toISOString()
        }
      }
    };

    window.$message?.success($t('page.lowcode.api.testSuccess'));
  } catch (error) {
    window.$message?.error($t('page.lowcode.api.testFailed'));
  } finally {
    testing.value = false;
  }
}

function handleDeleteApi(api: Api) {
  window.$dialog?.error({
    title: $t('common.confirm'),
    content: $t('page.lowcode.api.deleteConfirm'),
    positiveText: $t('common.delete'),
    negativeText: $t('common.cancel'),
    onPositiveClick: () => {
      window.$message?.success($t('common.deleteSuccess'));
    }
  });
}

function handleGenerateApis() {
  window.$message?.info('生成API功能开发中');
}

function handleExportApis() {
  window.$message?.info('导出API功能开发中');
}

async function loadApis() {
  try {
    loading.value = true;

    // Mock data
    const mockApis: Api[] = [
      {
        id: 'api-1',
        projectId: props.projectId,
        name: 'Get Users',
        code: 'get-users',
        path: '/api/users',
        method: 'GET',
        description: 'Get all users with pagination',
        entityId: 'entity-1',
        entityName: 'User',
        authRequired: true,
        status: 'ACTIVE',
        version: '1.0.0',
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'api-2',
        projectId: props.projectId,
        name: 'Create Product',
        code: 'create-product',
        path: '/api/products',
        method: 'POST',
        description: 'Create a new product',
        entityId: 'entity-2',
        entityName: 'Product',
        authRequired: true,
        status: 'ACTIVE',
        version: '1.0.0',
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];

    apis.value = mockApis;
    pagination.value.itemCount = mockApis.length;
  } catch (error) {
    console.error('Failed to load APIs:', error);
    window.$message?.error($t('page.lowcode.api.loadFailed'));
  } finally {
    loading.value = false;
  }
}

// Lifecycle
onMounted(() => {
  loadApis();
});
</script>

<template>
  <div class="api-management">
    <!-- 操作栏 -->
    <div class="mb-4">
      <NSpace justify="space-between" align="center">
        <NSpace>
          <NInput
            v-model:value="searchQuery"
            :placeholder="$t('page.lowcode.api.searchPlaceholder')"
            style="width: 300px"
            clearable
          >
            <template #prefix>
              <NIcon><icon-mdi-magnify /></NIcon>
            </template>
          </NInput>
          <NSelect
            v-model:value="methodFilter"
            :placeholder="$t('page.lowcode.api.filterByMethod')"
            :options="methodOptions"
            style="width: 120px"
            clearable
          />
          <NSelect
            v-model:value="statusFilter"
            :placeholder="$t('page.lowcode.api.filterByStatus')"
            :options="statusOptions"
            style="width: 120px"
            clearable
          />
        </NSpace>
        <NSpace>
          <NButton type="primary" @click="handleCreateApi">
            <template #icon>
              <NIcon><icon-mdi-plus /></NIcon>
            </template>
            {{ $t('page.lowcode.api.create') }}
          </NButton>
          <NButton @click="handleGenerateApis">
            <template #icon>
              <NIcon><icon-mdi-auto-fix /></NIcon>
            </template>
            {{ $t('page.lowcode.api.generate') }}
          </NButton>
          <NButton @click="handleExportApis">
            <template #icon>
              <NIcon><icon-mdi-export /></NIcon>
            </template>
            {{ $t('page.lowcode.api.export') }}
          </NButton>
        </NSpace>
      </NSpace>
    </div>

    <!-- API列表 -->
    <NDataTable
      :columns="columns"
      :data="filteredApis"
      :pagination="pagination"
      :loading="loading"
      size="small"
      striped
      @update:page="handlePageChange"
      @update:page-size="handlePageSizeChange"
    />

    <!-- API测试模态框 -->
    <NModal v-model:show="showTestModal" preset="card" style="width: 800px">
      <template #header>{{ $t('page.lowcode.api.test') }} - {{ testingApi?.name }}</template>

      <div class="space-y-4">
        <!-- 请求信息 -->
        <NCard :title="$t('page.lowcode.api.requestInfo')" size="small">
          <NDescriptions :column="2" bordered>
            <NDescriptionsItem :label="$t('page.lowcode.api.method')">
              <NTag :type="getMethodType(testingApi?.method)">{{ testingApi?.method }}</NTag>
            </NDescriptionsItem>
            <NDescriptionsItem :label="$t('page.lowcode.api.path')">
              {{ testingApi?.path }}
            </NDescriptionsItem>
          </NDescriptions>
        </NCard>

        <!-- 请求参数 -->
        <NCard :title="$t('page.lowcode.api.parameters')" size="small">
          <NInput
            v-model:value="testParams"
            type="textarea"
            :rows="6"
            :placeholder="$t('page.lowcode.api.parametersPlaceholder')"
          />
        </NCard>

        <!-- 响应结果 -->
        <NCard v-if="testResult" :title="$t('page.lowcode.api.response')" size="small">
          <div class="space-y-2">
            <div>
              <NText strong>{{ $t('page.lowcode.api.statusCode') }}:</NText>
              <NTag :type="testResult.status >= 200 && testResult.status < 300 ? 'success' : 'error'">
                {{ testResult.status }}
              </NTag>
            </div>
            <div>
              <NText strong>{{ $t('page.lowcode.api.responseTime') }}:</NText>
              <NText>{{ testResult.time }}ms</NText>
            </div>
            <div>
              <NText strong>{{ $t('page.lowcode.api.responseBody') }}:</NText>
              <NCode :code="JSON.stringify(testResult.data, null, 2)" language="json" />
            </div>
          </div>
        </NCard>
      </div>

      <template #footer>
        <NSpace justify="end">
          <NButton @click="showTestModal = false">{{ $t('common.close') }}</NButton>
          <NButton type="primary" :loading="testing" @click="handleRunTest">
            {{ $t('page.lowcode.api.runTest') }}
          </NButton>
        </NSpace>
      </template>
    </NModal>
  </div>
</template>

<style scoped>
.api-management {
  @apply space-y-4;
}
</style>
