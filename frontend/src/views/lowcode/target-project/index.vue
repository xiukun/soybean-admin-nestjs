<script setup lang="ts">
import { h, onMounted, reactive, ref } from 'vue';
import type { Ref } from 'vue';
import { NButton, NPopconfirm, NSpace, NTag } from 'naive-ui';
import type { DataTableColumns, FormInst, FormRules } from 'naive-ui';
import { fetchDeleteProject } from '@/service/api';

defineOptions({
  name: 'TargetProjectManagement'
});

interface TargetProject {
  id: string;
  name: string;
  displayName: string;
  description: string;
  path: string;
  type: string;
  framework: string;
  language: string;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

interface ProjectForm {
  name: string;
  displayName: string;
  description: string;
  path: string;
  type: string;
  framework: string;
  language: string;
  status: 'active' | 'inactive';
}

const loading = ref(false);
const tableData = ref<TargetProject[]>([]);
const modalVisible = ref(false);
const modalTitle = ref('');
const isEdit = ref(false);
const editingId = ref('');
const statisticsVisible = ref(false);
const statisticsData = ref<any>(null);
const validationVisible = ref(false);
const validationResult = ref<any>(null);

const formRef = ref<FormInst | null>(null);
const formModel = reactive<ProjectForm>({
  name: '',
  displayName: '',
  description: '',
  path: '',
  type: 'nestjs',
  framework: 'NestJS',
  language: 'typescript',
  status: 'active'
});

const projectTypeOptions = [
  { label: 'NestJS', value: 'nestjs' },
  { label: 'React', value: 'react' },
  { label: 'Vue.js', value: 'vue' },
  { label: 'Angular', value: 'angular' },
  { label: '其他', value: 'other' }
];

const languageOptions = [
  { label: 'TypeScript', value: 'typescript' },
  { label: 'JavaScript', value: 'javascript' },
  { label: '其他', value: 'other' }
];

const statusOptions = [
  { label: '活跃', value: 'active' },
  { label: '非活跃', value: 'inactive' }
];

const rules: FormRules = {
  name: [{ required: true, message: '请输入项目名称' }],
  displayName: [{ required: true, message: '请输入显示名称' }],
  path: [{ required: true, message: '请输入项目路径' }],
  type: [{ required: true, message: '请选择项目类型' }],
  framework: [{ required: true, message: '请输入框架名称' }],
  language: [{ required: true, message: '请选择编程语言' }]
};

const columns: DataTableColumns<TargetProject> = [
  {
    title: '项目名称',
    key: 'displayName',
    minWidth: 120
  },
  {
    title: '项目标识',
    key: 'name',
    minWidth: 120
  },
  {
    title: '项目类型',
    key: 'type',
    minWidth: 100,
    render: row => {
      const typeMap: Record<string, { label: string; type: any }> = {
        nestjs: { label: 'NestJS', type: 'info' },
        react: { label: 'React', type: 'success' },
        vue: { label: 'Vue.js', type: 'warning' },
        angular: { label: 'Angular', type: 'error' },
        other: { label: '其他', type: 'default' }
      };
      const config = typeMap[row.type] || typeMap.other;
      return h(NTag, { type: config.type }, { default: () => config.label });
    }
  },
  {
    title: '框架',
    key: 'framework',
    minWidth: 100
  },
  {
    title: '语言',
    key: 'language',
    minWidth: 80
  },
  {
    title: '状态',
    key: 'status',
    minWidth: 80,
    render: row =>
      h(
        NTag,
        { type: row.status === 'active' ? 'success' : 'default' },
        { default: () => (row.status === 'active' ? '活跃' : '非活跃') }
      )
  },
  {
    title: '操作',
    key: 'actions',
    width: 200,
    render: row =>
      h(
        NSpace,
        { size: 8 },
        {
          default: () => [
            h(NButton, { size: 'small', onClick: () => handleEdit(row) }, { default: () => '编辑' }),
            h(
              NButton,
              { size: 'small', type: 'info', onClick: () => handleValidate(row.id) },
              { default: () => '验证' }
            ),
            h(
              NButton,
              { size: 'small', type: 'success', onClick: () => handleStatistics(row.id) },
              { default: () => '统计' }
            ),
            h(
              NPopconfirm,
              { onPositiveClick: () => handleDelete(row.id) },
              {
                default: () => '确认删除这个项目吗？',
                trigger: () => h(NButton, { size: 'small', type: 'error' }, { default: () => '删除' })
              }
            )
          ]
        }
      )
  }
];

const pagination = reactive({
  page: 1,
  pageSize: 10,
  showSizePicker: true,
  pageSizes: [10, 15, 20, 25, 30],
  onChange: (page: number) => {
    pagination.page = page;
    getTableData();
  },
  onUpdatePageSize: (pageSize: number) => {
    pagination.pageSize = pageSize;
    pagination.page = 1;
    getTableData();
  }
});

async function getTableData() {
  loading.value = true;
  try {
    const response = await fetch('/api/api/v1/target-projects');
    const result = await response.json();

    if (result.success && result.data?.projects) {
      tableData.value = result.data.projects;
    }
  } catch (error) {
    console.error('Failed to load target projects:', error);
    window.$message?.error('加载项目列表失败');
  } finally {
    loading.value = false;
  }
}

function handleAdd() {
  modalTitle.value = '新增项目';
  isEdit.value = false;
  resetForm();
  modalVisible.value = true;
}

function handleEdit(row: TargetProject) {
  modalTitle.value = '编辑项目';
  isEdit.value = true;
  editingId.value = row.id;

  Object.assign(formModel, {
    name: row.name,
    displayName: row.displayName,
    description: row.description,
    path: row.path,
    type: row.type,
    framework: row.framework,
    language: row.language,
    status: row.status
  });

  modalVisible.value = true;
}

async function handleDelete(id: string) {
  try {
    await fetchDeleteProject(id);
    window.$message?.success('删除成功');
    getTableData();
  } catch (error) {
    console.error('Failed to delete project:', error);
    window.$message?.error('删除失败');
  }
}

async function handleValidate(id: string) {
  try {
    const response = await fetch(`/api/api/v1/target-projects/${id}/validate`);
    const result = await response.json();

    if (result.success) {
      validationResult.value = result.data.validation;
      validationVisible.value = true;
    }
  } catch (error) {
    console.error('Failed to validate project:', error);
    window.$message?.error('验证失败');
  }
}

async function handleStatistics(id: string) {
  try {
    const response = await fetch(`/api/api/v1/target-projects/${id}/statistics`);
    const result = await response.json();

    if (result.success) {
      statisticsData.value = result.data.statistics;
      statisticsVisible.value = true;
    }
  } catch (error) {
    console.error('Failed to get statistics:', error);
    window.$message?.error('获取统计信息失败');
  }
}

async function handleSubmit() {
  await formRef.value?.validate();

  try {
    const url = isEdit.value ? `/api/api/v1/target-projects/${editingId.value}` : '/api/api/v1/target-projects';

    const method = isEdit.value ? 'PUT' : 'POST';

    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(formModel)
    });

    const result = await response.json();

    if (result.success) {
      window.$message?.success(isEdit.value ? '更新成功' : '创建成功');
      closeModal();
      getTableData();
    } else {
      throw new Error(result.message || '操作失败');
    }
  } catch (error: any) {
    console.error('Failed to submit:', error);
    window.$message?.error(error.message || '操作失败');
  }
}

function handleTypeChange(type: string) {
  const typeFrameworkMap: Record<string, string> = {
    nestjs: 'NestJS',
    react: 'React',
    vue: 'Vue.js',
    angular: 'Angular',
    other: 'Generic'
  };

  formModel.framework = typeFrameworkMap[type] || 'Generic';
}

function handleBrowsePath() {
  // 这里可以集成文件选择器
  window.$message?.info('文件选择器功能待实现');
}

function resetForm() {
  Object.assign(formModel, {
    name: '',
    displayName: '',
    description: '',
    path: '',
    type: 'nestjs',
    framework: 'NestJS',
    language: 'typescript',
    status: 'active'
  });
}

function closeModal() {
  modalVisible.value = false;
  resetForm();
}

onMounted(() => {
  getTableData();
});
</script>

<template>
  <div class="min-h-500px flex-col-stretch gap-16px overflow-hidden lt-sm:overflow-auto">
    <NCard title="目标项目管理" :bordered="false" size="small" class="sm:flex-1-hidden card-wrapper">
      <template #header-extra>
        <NButton type="primary" @click="handleAdd">
          <template #icon>
            <icon-ic-round-plus />
          </template>
          新增项目
        </NButton>
      </template>

      <NDataTable
        :columns="columns"
        :data="tableData"
        :loading="loading"
        :pagination="pagination"
        :row-key="row => row.id"
        flex-height
        remote
        class="sm:h-full"
      />
    </NCard>

    <!-- 新增/编辑项目弹窗 -->
    <NModal v-model:show="modalVisible" preset="dialog" :title="modalTitle">
      <NForm ref="formRef" :model="formModel" :rules="rules" label-placement="left" :label-width="100" class="w-600px">
        <NFormItem label="项目名称" path="name">
          <NInput v-model:value="formModel.name" placeholder="请输入项目标识名称" />
        </NFormItem>
        <NFormItem label="显示名称" path="displayName">
          <NInput v-model:value="formModel.displayName" placeholder="请输入项目显示名称" />
        </NFormItem>
        <NFormItem label="项目描述" path="description">
          <NInput v-model:value="formModel.description" type="textarea" placeholder="请输入项目描述" :rows="3" />
        </NFormItem>
        <NFormItem label="项目路径" path="path">
          <NInputGroup>
            <NInput v-model:value="formModel.path" placeholder="请输入项目路径" />
            <NButton @click="handleBrowsePath">
              <template #icon>
                <icon-mdi-folder-open />
              </template>
            </NButton>
          </NInputGroup>
        </NFormItem>
        <NFormItem label="项目类型" path="type">
          <NSelect
            v-model:value="formModel.type"
            :options="projectTypeOptions"
            placeholder="请选择项目类型"
            @update:value="handleTypeChange"
          />
        </NFormItem>
        <NFormItem label="框架" path="framework">
          <NInput v-model:value="formModel.framework" placeholder="请输入框架名称" />
        </NFormItem>
        <NFormItem label="语言" path="language">
          <NSelect v-model:value="formModel.language" :options="languageOptions" placeholder="请选择编程语言" />
        </NFormItem>
        <NFormItem label="状态" path="status">
          <NSelect v-model:value="formModel.status" :options="statusOptions" placeholder="请选择项目状态" />
        </NFormItem>
      </NForm>
      <template #action>
        <NSpace>
          <NButton @click="closeModal">取消</NButton>
          <NButton type="primary" @click="handleSubmit">确定</NButton>
        </NSpace>
      </template>
    </NModal>

    <!-- 项目统计弹窗 -->
    <NModal v-model:show="statisticsVisible" preset="dialog" title="项目统计信息">
      <div v-if="statisticsData" class="w-500px">
        <NDescriptions :column="2" bordered>
          <NDescriptionsItem label="项目名称">
            {{ statisticsData.projectName }}
          </NDescriptionsItem>
          <NDescriptionsItem label="项目路径">
            {{ statisticsData.projectPath }}
          </NDescriptionsItem>
          <NDescriptionsItem label="项目类型">
            {{ statisticsData.type }}
          </NDescriptionsItem>
          <NDescriptionsItem label="框架">
            {{ statisticsData.framework }}
          </NDescriptionsItem>
          <NDescriptionsItem label="语言">
            {{ statisticsData.language }}
          </NDescriptionsItem>
          <NDescriptionsItem label="状态">
            <NTag :type="statisticsData.status === 'active' ? 'success' : 'default'">
              {{ statisticsData.status === 'active' ? '活跃' : '非活跃' }}
            </NTag>
          </NDescriptionsItem>
          <NDescriptionsItem label="支持的模板数">
            {{ statisticsData.supportedTemplates }}
          </NDescriptionsItem>
          <NDescriptionsItem label="功能特性" :span="2">
            <NSpace>
              <NTag v-for="feature in statisticsData.features" :key="feature" size="small">
                {{ feature }}
              </NTag>
            </NSpace>
          </NDescriptionsItem>
        </NDescriptions>
      </div>
      <template #action>
        <NButton @click="statisticsVisible = false">关闭</NButton>
      </template>
    </NModal>

    <!-- 项目验证结果弹窗 -->
    <NModal v-model:show="validationVisible" preset="dialog" title="项目验证结果">
      <div v-if="validationResult" class="w-500px">
        <NAlert
          :type="validationResult.valid ? 'success' : 'error'"
          :title="validationResult.valid ? '验证通过' : '验证失败'"
          class="mb-16px"
        />
        <div v-if="!validationResult.valid && validationResult.errors.length > 0">
          <h4>错误详情：</h4>
          <ul>
            <li v-for="error in validationResult.errors" :key="error" class="text-red">
              {{ error }}
            </li>
          </ul>
        </div>
      </div>
      <template #action>
        <NButton @click="validationVisible = false">关闭</NButton>
      </template>
    </NModal>
  </div>
</template>

<style scoped>
.card-wrapper {
  @apply flex-col-stretch gap-16px overflow-hidden;
}
</style>
