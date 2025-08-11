<script setup lang="ts">
import { computed, nextTick, reactive, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import type { FormInst, FormRules } from 'naive-ui';
import {
  NButton,
  NColorPicker,
  NForm,
  NFormItem,
  NGrid,
  NGridItem,
  NIcon,
  NInput,
  NInputNumber,
  NPopconfirm,
  NScrollbar,
  NSelect,
  NSpace,
  NText,
  useMessage
} from 'naive-ui';
import { formatDate } from '@/utils/common';
import type { Entity } from '../types';
import EntityFieldManager from './EntityFieldManager.vue';

// 图标导入
import IconMdiCog from '~icons/mdi/cog';
import IconMdiClose from '~icons/mdi/close';
import IconMdiInformation from '~icons/mdi/information';
import IconMdiTableColumn from '~icons/mdi/table-column';
import IconMdiChartLine from '~icons/mdi/chart-line';
import IconMdiClock from '~icons/mdi/clock';
import IconMdiPalette from '~icons/mdi/palette';
import IconMdiCrosshairsGps from '~icons/mdi/crosshairs-gps';
import IconMdiLightningBolt from '~icons/mdi/lightning-bolt';
import IconMdiTableEdit from '~icons/mdi/table-edit';
import IconMdiCodeBraces from '~icons/mdi/code-braces';
import IconMdiExport from '~icons/mdi/export';
import IconMdiDelete from '~icons/mdi/delete';

// 扩展Entity接口以包含fields属性
interface EntityWithFields extends Entity {
  fields?: Array<{
    id: string;
    entityId: string;
    name: string;
    code: string;
    dataType: string;
    length?: number;
    precision?: number;
    scale?: number;
    defaultValue?: string;
    description?: string;
    isPrimaryKey: boolean;
    isRequired: boolean;
    isUnique: boolean;
    isForeignKey?: boolean;
    foreignKeyEntityId?: string;
    foreignKeyFieldId?: string;
  }>;
}

interface Props {
  entity: EntityWithFields;
}

interface Emits {
  (e: 'update', entity: EntityWithFields): void;
  (e: 'close'): void;
  (e: 'fields-update', fields: any[]): void;
  (e: 'field-add', field: any): void;
  (e: 'field-update', field: any, index: number): void;
  (e: 'field-delete', index: number): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();
const router = useRouter();
const message = useMessage();

// 表单引用
const formRef = ref<FormInst>();
const saving = ref(false);

// 表单数据
const formData = reactive({
  name: '',
  code: '',
  tableName: '',
  category: 'BUSINESS' as 'BUSINESS' | 'SYSTEM' | 'CONFIG' | 'LOG',
  status: 'DRAFT' as 'DRAFT' | 'ACTIVE' | 'INACTIVE',
  description: '',
  color: '#5F95FF',
  width: 200,
  height: 120
});

// 位置数据
const positionX = ref<number>(0);
const positionY = ref<number>(0);

// 计算字段数量
const fieldCount = computed(() => {
  return props.entity.fields?.length || 0;
});

// 表单验证规则
const formRules: FormRules = {
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
  category: [{ required: true, message: '请选择分类', trigger: 'change' }],
  status: [{ required: true, message: '请选择状态', trigger: 'change' }]
};

// 选项数据
const categoryOptions = [
  { label: '业务实体', value: 'BUSINESS' },
  { label: '系统实体', value: 'SYSTEM' },
  { label: '配置实体', value: 'CONFIG' },
  { label: '日志实体', value: 'LOG' }
];

const statusOptions = [
  { label: '草稿', value: 'DRAFT' },
  { label: '激活', value: 'ACTIVE' },
  { label: '停用', value: 'INACTIVE' }
];

/** 根据名称自动生成编码和表名 */
function handleNameChange() {
  if (formData.name && !formData.code) {
    // 简化处理：将中文名称转换为拼音或英文编码
    const code = formData.name.replace(/[^a-zA-Z0-9\u4E00-\u9FA5]/g, '').toLowerCase();
    formData.code = code;

    if (!formData.tableName) {
      formData.tableName = `t_${code}`;
    }
  }
}

/** 处理颜色变化 */
function handleColorChange() {
  emitUpdate();
}

/** 处理尺寸变化 */
function handleSizeChange() {
  emitUpdate();
}

/** 处理位置变化 */
function handlePositionChange() {
  emitUpdate();
}

/** 发送更新事件 */
function emitUpdate() {
  const updatedEntity: EntityWithFields = {
    ...props.entity,
    x: positionX.value,
    y: positionY.value,
    name: formData.name,
    code: formData.code,
    tableName: formData.tableName,
    category: formData.category,
    status: formData.status,
    description: formData.description,
    color: formData.color,
    width: formData.width,
    height: formData.height
  };
  emit('update', updatedEntity);
}

/** 快速操作处理函数 */
function handleDesignFields() {
  router.push({
    name: 'lowcode_field',
    query: { entityId: props.entity.id }
  });
}

function handleViewCode() {
  message.info('查看代码功能开发中...');
}

function handleExport() {
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
  emit('close');
}

/** 表单操作 */
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
  formRef.value?.validate(errors => {
    if (!errors) {
      saving.value = true;

      // 模拟保存过程
      setTimeout(() => {
        emitUpdate();
        saving.value = false;
        message.success('保存成功');
      }, 500);
    }
  });
}

/** 处理字段相关事件 */
function handleFieldsUpdate(fields: any[]) {
  const updatedEntity: EntityWithFields = {
    ...props.entity,
    fields
  };
  emit('update', updatedEntity);
  emit('fields-update', fields);
}

function handleFieldAdd(field: any) {
  emit('field-add', field);
}

function handleFieldUpdate(field: any, index: number) {
  emit('field-update', field, index);
}

function handleFieldDelete(index: number) {
  emit('field-delete', index);
}

// 监听实体变化，更新表单数据
watch(
  () => props.entity,
  newEntity => {
    if (newEntity) {
      Object.assign(formData, {
        name: newEntity.name || '',
        code: newEntity.code || '',
        tableName: newEntity.tableName || '',
        category: newEntity.category || 'BUSINESS',
        status: newEntity.status || 'DRAFT',
        description: newEntity.description || '',
        color: newEntity.color || '#5F95FF',
        width: newEntity.width || 200,
        height: newEntity.height || 120
      });

      positionX.value = newEntity.x || 0;
      positionY.value = newEntity.y || 0;
    }
  },
  { immediate: true, deep: true }
);
</script>

<template>
  <div class="entity-property-panel">
    <!-- 面板头部 -->
    <div class="panel-header">
      <div class="header-title">
        <NIcon class="mr-2 text-blue-500">
          <icon-mdi-cog />
        </NIcon>
        <NText class="font-semibold">实体属性</NText>
      </div>
      <NButton size="small" quaternary @click="$emit('close')">
        <template #icon>
          <NIcon><icon-mdi-close /></NIcon>
        </template>
      </NButton>
    </div>

    <!-- 面板内容 -->
    <div class="panel-content">
      <NScrollbar class="h-full">
        <div class="p-4 space-y-6">
          <!-- 基本信息 -->
          <div class="property-section">
            <div class="section-header">
              <NIcon class="text-green-500">
                <icon-mdi-information />
              </NIcon>
              <NText class="section-title">基本信息</NText>
            </div>
            <div class="section-content">
              <NForm ref="formRef" :model="formData" :rules="formRules" label-placement="top" size="small">
                <NFormItem label="实体名称" path="name">
                  <NInput v-model:value="formData.name" placeholder="请输入实体名称" @blur="handleNameChange" />
                </NFormItem>

                <NFormItem label="实体编码" path="code">
                  <NInput v-model:value="formData.code" placeholder="请输入实体编码" />
                </NFormItem>

                <NFormItem label="数据表名" path="tableName">
                  <NInput v-model:value="formData.tableName" placeholder="请输入数据表名" />
                </NFormItem>

                <NFormItem label="分类" path="category">
                  <NSelect v-model:value="formData.category" :options="categoryOptions" placeholder="请选择分类" />
                </NFormItem>

                <NFormItem label="状态" path="status">
                  <NSelect v-model:value="formData.status" :options="statusOptions" placeholder="请选择状态" />
                </NFormItem>

                <NFormItem label="描述" path="description">
                  <NInput v-model:value="formData.description" type="textarea" placeholder="请输入实体描述" :rows="3" />
                </NFormItem>
              </NForm>
            </div>
          </div>

          <!-- 字段管理 -->
          <div class="property-section">
            <div class="section-header">
              <NIcon class="text-purple-500">
                <icon-mdi-table-column />
              </NIcon>
              <NText class="section-title">字段管理</NText>
            </div>
            <div class="section-content">
              <EntityFieldManager
                :entity-id="entity.id"
                :fields="entity.fields || []"
                @update:fields="handleFieldsUpdate"
                @field-add="handleFieldAdd"
                @field-update="handleFieldUpdate"
                @field-delete="handleFieldDelete"
              />
            </div>
          </div>

          <!-- 统计信息 -->
          <div class="property-section">
            <div class="section-header">
              <NIcon class="text-orange-500">
                <icon-mdi-chart-line />
              </NIcon>
              <NText class="section-title">统计信息</NText>
            </div>
            <div class="section-content">
              <div class="stats-grid">
                <div class="stat-card">
                  <div class="stat-icon">
                    <NIcon class="text-blue-500">
                      <icon-mdi-table-column />
                    </NIcon>
                  </div>
                  <div class="stat-info">
                    <NText class="stat-label">字段数量</NText>
                    <NText class="stat-value">{{ fieldCount }}</NText>
                  </div>
                </div>
                <div class="stat-card">
                  <div class="stat-icon">
                    <NIcon class="text-green-500">
                      <icon-mdi-clock />
                    </NIcon>
                  </div>
                  <div class="stat-info">
                    <NText class="stat-label">创建时间</NText>
                    <NText class="stat-value text-xs">{{ formatDate(entity.createdAt) }}</NText>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 外观设置 -->
          <div class="property-section">
            <div class="section-header">
              <NIcon class="text-pink-500">
                <icon-mdi-palette />
              </NIcon>
              <NText class="section-title">外观设置</NText>
            </div>
            <div class="section-content">
              <NForm label-placement="top" size="small">
                <NFormItem label="实体颜色">
                  <NColorPicker v-model:value="formData.color" :show-alpha="false" @update:value="handleColorChange" />
                </NFormItem>

                <NGrid cols="2" x-gap="12">
                  <NGridItem>
                    <NFormItem label="宽度">
                      <NInputNumber
                        v-model:value="formData.width"
                        :min="120"
                        :max="400"
                        size="small"
                        @update:value="handleSizeChange"
                      />
                    </NFormItem>
                  </NGridItem>
                  <NGridItem>
                    <NFormItem label="高度">
                      <NInputNumber
                        v-model:value="formData.height"
                        :min="80"
                        :max="300"
                        size="small"
                        @update:value="handleSizeChange"
                      />
                    </NFormItem>
                  </NGridItem>
                </NGrid>
              </NForm>
            </div>
          </div>

          <!-- 位置设置 -->
          <div class="property-section">
            <div class="section-header">
              <NIcon class="text-cyan-500">
                <icon-mdi-crosshairs-gps />
              </NIcon>
              <NText class="section-title">位置设置</NText>
            </div>
            <div class="section-content">
              <NGrid cols="2" x-gap="12">
                <NGridItem>
                  <NFormItem label="X坐标">
                    <NInputNumber v-model:value="positionX" size="small" @update:value="handlePositionChange" />
                  </NFormItem>
                </NGridItem>
                <NGridItem>
                  <NFormItem label="Y坐标">
                    <NInputNumber v-model:value="positionY" size="small" @update:value="handlePositionChange" />
                  </NFormItem>
                </NGridItem>
              </NGrid>
            </div>
          </div>

          <!-- 快速操作 -->
          <div class="property-section">
            <div class="section-header">
              <NIcon class="text-red-500">
                <icon-mdi-lightning-bolt />
              </NIcon>
              <NText class="section-title">快速操作</NText>
            </div>
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
                  确定要删除这个实体吗？此操作不可撤销。
                </NPopconfirm>
              </NSpace>
            </div>
          </div>
        </div>
      </NScrollbar>
    </div>

    <!-- 面板底部 -->
    <div class="panel-footer">
      <NSpace justify="end">
        <NButton size="small" @click="handleReset">重置</NButton>
        <NButton type="primary" size="small" :loading="saving" @click="handleSave">保存</NButton>
      </NSpace>
    </div>
  </div>
</template>

<style scoped>
.entity-property-panel {
  @apply h-full flex flex-col bg-white;
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

.property-section {
  @apply space-y-3;
}

.section-header {
  @apply flex items-center space-x-2 pb-2 border-b border-gray-200;
}

.section-title {
  @apply text-sm font-medium text-gray-700;
}

.section-content {
  @apply space-y-3;
}

.stats-grid {
  @apply grid grid-cols-1 gap-3;
}

.stat-card {
  @apply flex items-center space-x-3 p-3 bg-gray-50 rounded-lg;
}

.stat-icon {
  @apply flex-shrink-0;
}

.stat-info {
  @apply flex-1 min-w-0;
}

.stat-label {
  @apply text-xs text-gray-600 block;
}

.stat-value {
  @apply text-sm font-medium text-gray-900 block;
}
</style>
