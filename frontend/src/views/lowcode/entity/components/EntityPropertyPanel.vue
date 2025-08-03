<template>
  <div class="entity-property-panel">
    <!-- Panel Header -->
    <div class="panel-header">
      <div class="header-title">
        <NIcon class="mr-2">
          <icon-mdi-cog />
        </NIcon>
        <NText class="font-medium">实体属性</NText>
      </div>
      <NButton size="small" quaternary @click="$emit('close')">
        <template #icon>
          <NIcon><icon-mdi-close /></NIcon>
        </template>
      </NButton>
    </div>

    <!-- Panel Content -->
    <div class="panel-content">
      <NScrollbar class="h-full">
        <div class="p-4 space-y-6">
          <!-- Basic Information -->
          <div class="section">
            <NText class="section-title">基本信息</NText>
            <div class="section-content">
              <NForm
                ref="formRef"
                :model="formData"
                :rules="rules"
                label-placement="top"
                size="small"
              >
                <NFormItem label="实体名称" path="name">
                  <NInput
                    v-model:value="formData.name"
                    placeholder="请输入实体名称"
                    @blur="handleNameChange"
                  />
                </NFormItem>
                
                <NFormItem label="实体编码" path="code">
                  <NInput
                    v-model:value="formData.code"
                    placeholder="请输入实体编码"
                  />
                </NFormItem>
                
                <NFormItem label="数据表名" path="tableName">
                  <NInput
                    v-model:value="formData.tableName"
                    placeholder="请输入数据表名"
                  />
                </NFormItem>
                
                <NFormItem label="分类" path="category">
                  <NSelect
                    v-model:value="formData.category"
                    :options="categoryOptions"
                    placeholder="请选择分类"
                  />
                </NFormItem>
                
                <NFormItem label="状态" path="status">
                  <NSelect
                    v-model:value="formData.status"
                    :options="statusOptions"
                    placeholder="请选择状态"
                  />
                </NFormItem>
                
                <NFormItem label="描述" path="description">
                  <NInput
                    v-model:value="formData.description"
                    type="textarea"
                    placeholder="请输入实体描述"
                    :rows="3"
                  />
                </NFormItem>
              </NForm>
            </div>
          </div>

          <!-- Statistics -->
          <div class="section">
            <NText class="section-title">统计信息</NText>
            <div class="section-content">
              <div class="stats-grid">
                <div class="stat-item">
                  <NText class="stat-label">字段数量</NText>
                  <NText class="stat-value">{{ entity.fieldCount || 0 }}</NText>
                </div>
                <div class="stat-item">
                  <NText class="stat-label">创建时间</NText>
                  <NText class="stat-value text-xs">{{ formatDate(entity.createdAt) }}</NText>
                </div>
              </div>
            </div>
          </div>

          <!-- Appearance Settings -->
          <div class="section">
            <NText class="section-title">外观设置</NText>
            <div class="section-content">
              <NForm label-placement="top" size="small">
                <NFormItem label="颜色">
                  <NColorPicker v-model:value="formData.color" :show-alpha="false" />
                </NFormItem>
                
                <NGrid cols="2" x-gap="12">
                  <NGridItem>
                    <NFormItem label="宽度">
                      <NInputNumber v-model:value="formData.width" :min="100" :max="400" size="small" />
                    </NFormItem>
                  </NGridItem>
                  <NGridItem>
                    <NFormItem label="高度">
                      <NInputNumber v-model:value="formData.height" :min="60" :max="300" size="small" />
                    </NFormItem>
                  </NGridItem>
                </NGrid>
              </NForm>
            </div>
          </div>

          <!-- Position Settings -->
          <div class="section">
            <NText class="section-title">位置设置</NText>
            <div class="section-content">
              <NSpace>
                <NInputNumber
                  v-model:value="positionX"
                  placeholder="X坐标"
                  size="small"
                  style="width: 80px"
                  @update:value="handlePositionChange"
                />
                <NInputNumber
                  v-model:value="positionY"
                  placeholder="Y坐标"
                  size="small"
                  style="width: 80px"
                  @update:value="handlePositionChange"
                />
              </NSpace>
            </div>
          </div>

          <!-- Quick Actions -->
          <div class="section">
            <NText class="section-title">快速操作</NText>
            <div class="section-content">
              <NSpace vertical class="w-full">
                <NButton block size="small" @click="handleDesignFields">
                  <template #icon>
                    <NIcon><icon-mdi-table-edit /></NIcon>
                  </template>
                  设计字段
                </NButton>
                <NButton block size="small" @click="handleViewCode">
                  <template #icon>
                    <NIcon><icon-mdi-code-braces /></NIcon>
                  </template>
                  查看代码
                </NButton>
                <NButton block size="small" @click="handleExport">
                  <template #icon>
                    <NIcon><icon-mdi-export /></NIcon>
                  </template>
                  导出配置
                </NButton>
                <NPopconfirm @positive-click="handleDeleteEntity">
                  <template #trigger>
                    <NButton block size="small" type="error">
                      <template #icon>
                        <NIcon><icon-mdi-delete /></NIcon>
                      </template>
                      删除实体
                    </NButton>
                  </template>
                  确定要删除这个实体吗？
                </NPopconfirm>
              </NSpace>
            </div>
          </div>
        </div>
      </NScrollbar>
    </div>

    <!-- Panel Footer -->
    <div class="panel-footer">
      <NSpace justify="end">
        <NButton size="small" @click="handleReset">
          重置
        </NButton>
        <NButton type="primary" size="small" @click="handleSave">
          保存
        </NButton>
      </NSpace>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, watch } from 'vue';
import { useRouter } from 'vue-router';
import {
  NButton,
  NText,
  NIcon,
  NScrollbar,
  NForm,
  NFormItem,
  NInput,
  NSelect,
  NSpace,
  NInputNumber,
  NColorPicker,
  NGrid,
  NGridItem,
  NPopconfirm,
  FormInst,
  FormRules,
  useMessage
} from 'naive-ui';
import { formatDate } from '@/utils/common';

// 图标导入
import IconMdiCog from '~icons/mdi/cog';
import IconMdiClose from '~icons/mdi/close';
import IconMdiTableEdit from '~icons/mdi/table-edit';
import IconMdiCodeBraces from '~icons/mdi/code-braces';
import IconMdiExport from '~icons/mdi/export';
import IconMdiDelete from '~icons/mdi/delete';

interface Entity {
  id: string;
  name: string;
  code: string;
  tableName: string;
  category: string;
  description?: string;
  status: string;
  fieldCount?: number;
  createdAt: string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  color?: string;
}

interface Props {
  entity: Entity;
}

interface Emits {
  (e: 'update', entity: Entity): void;
  (e: 'close'): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();
const router = useRouter();
const message = useMessage();

// 表单引用
const formRef = ref<FormInst>();

// 表单数据
const formData = reactive({
  name: '',
  code: '',
  tableName: '',
  category: '',
  status: '',
  description: '',
  color: '#5F95FF',
  width: 200,
  height: 120
});

// 位置数据
const positionX = ref<number>(0);
const positionY = ref<number>(0);

// 表单验证规则
const rules: FormRules = {
  name: [
    { required: true, message: '请输入实体名称', trigger: 'blur' },
    { min: 2, max: 50, message: '实体名称长度在 2 到 50 个字符', trigger: 'blur' }
  ],
  code: [
    { required: true, message: '请输入实体编码', trigger: 'blur' },
    { pattern: /^[a-zA-Z][a-zA-Z0-9_]*$/, message: '编码必须以字母开头，只能包含字母、数字和下划线', trigger: 'blur' }
  ],
  tableName: [
    { required: true, message: '请输入数据表名', trigger: 'blur' },
    { pattern: /^[a-zA-Z][a-zA-Z0-9_]*$/, message: '表名必须以字母开头，只能包含字母、数字和下划线', trigger: 'blur' }
  ],
  category: [
    { required: true, message: '请选择分类', trigger: 'change' }
  ],
  status: [
    { required: true, message: '请选择状态', trigger: 'change' }
  ]
};

// 选项数据
const categoryOptions = [
  { label: '业务实体', value: 'BUSINESS' },
  { label: '系统实体', value: 'SYSTEM' },
  { label: '配置实体', value: 'CONFIG' },
  { label: '日志实体', value: 'LOG' }
];

const statusOptions = [
  { label: '激活', value: 'ACTIVE' },
  { label: '草稿', value: 'DRAFT' },
  { label: '停用', value: 'INACTIVE' }
];

/**
 * 根据名称自动生成编码和表名
 */
function handleNameChange() {
  if (formData.name && !formData.code) {
    // 将中文名称转换为拼音或英文编码（这里简化处理）
    const code = formData.name
      .replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '')
      .toLowerCase();
    formData.code = code;
    
    if (!formData.tableName) {
      formData.tableName = `t_${code}`;
    }
  }
}

/**
 * 处理位置变化
 */
function handlePositionChange() {
  // 实时更新位置（可以考虑防抖）
  const updatedEntity = {
    ...props.entity,
    x: positionX.value,
    y: positionY.value
  };
  emit('update', updatedEntity);
}

/**
 * 快速操作处理
 */
function handleDesignFields() {
  router.push({
    name: 'lowcode_field',
    query: { entityId: props.entity.id }
  });
}

function handleViewCode() {
  // 查看生成的代码
  message.info('查看代码功能开发中...');
}

function handleExport() {
  // 导出实体配置
  const config = {
    entity: props.entity,
    exportTime: new Date().toISOString()
  };
  
  const blob = new Blob([JSON.stringify(config, null, 2)], {
    type: 'application/json'
  });
  
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${props.entity.code}_config.json`;
  a.click();
  URL.revokeObjectURL(url);
  
  message.success('配置导出成功');
}

function handleDeleteEntity() {
  // 删除实体逻辑由父组件处理
  emit('close');
}

/**
 * 表单操作
 */
function handleReset() {
  // 重置为原始数据
  Object.assign(formData, {
    name: props.entity.name,
    code: props.entity.code,
    tableName: props.entity.tableName,
    category: props.entity.category,
    status: props.entity.status,
    description: props.entity.description || '',
    color: props.entity.color || '#5F95FF',
    width: props.entity.width || 200,
    height: props.entity.height || 120
  });
  
  positionX.value = props.entity.x || 0;
  positionY.value = props.entity.y || 0;
}

function handleSave() {
  formRef.value?.validate((errors) => {
    if (!errors) {
      const updatedEntity = {
        ...props.entity,
        ...formData,
        x: positionX.value,
        y: positionY.value
      };
      
      emit('update', updatedEntity);
      message.success('保存成功');
    }
  });
}

// 监听实体变化，更新表单数据
watch(
  () => props.entity,
  (newEntity) => {
    Object.assign(formData, {
      name: newEntity.name,
      code: newEntity.code,
      tableName: newEntity.tableName,
      category: newEntity.category,
      status: newEntity.status,
      description: newEntity.description || '',
      color: newEntity.color || '#5F95FF',
      width: newEntity.width || 200,
      height: newEntity.height || 120
    });
    
    positionX.value = newEntity.x || 0;
    positionY.value = newEntity.y || 0;
  },
  { immediate: true }
);
</script>

<style scoped>
.entity-property-panel {
  @apply h-full flex flex-col;
}

.panel-header {
  @apply flex justify-between items-center p-4 border-b border-gray-200 bg-gray-50;
}

.header-title {
  @apply flex items-center;
}

.panel-content {
  @apply flex-1 overflow-hidden;
}

.panel-footer {
  @apply p-4 border-t border-gray-200 bg-gray-50;
}

.section {
  @apply space-y-3;
}

.section-title {
  @apply text-sm font-medium text-gray-700 border-b border-gray-200 pb-2;
}

.section-content {
  @apply space-y-3;
}

.stats-grid {
  @apply grid grid-cols-1 gap-3;
}

.stat-item {
  @apply flex justify-between items-center p-2 bg-gray-50 rounded;
}

.stat-label {
  @apply text-xs text-gray-600;
}

.stat-value {
  @apply text-sm font-medium;
}
</style>