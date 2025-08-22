<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue';
import {
  type FormInst,
  type FormRules,
  NAlert,
  NButton,
  NColorPicker,
  NCollapse,
  NCollapseItem,
  NDivider,
  NForm,
  NFormItem,
  NGrid,
  NGridItem,
  NIcon,
  NInput,
  NInputNumber,
  NModal,
  NSelect,
  NSpace,
  NTag,
  NText,
  useMessage
} from 'naive-ui';
import { useI18n } from 'vue-i18n';
import type { Entity, EntityRelationship } from '../types';
import { fetchGetFieldList } from '@/service/api/lowcode-field';

// 图标导入
import IconMdiInformation from '~icons/mdi/information';
import IconMdiArrowRight from '~icons/mdi/arrow-right';

/** 创建关系弹窗组件 用于配置实体间的关系信息 */

interface Props {
  visible: boolean;
  sourceEntity: Entity | null;
  targetEntity: Entity | null;
  loading?: boolean;
}

interface Emits {
  (e: 'update:visible', value: boolean): void;
  (e: 'confirm', data: Partial<EntityRelationship>): void;
  (e: 'cancel'): void;
}

const props = withDefaults(defineProps<Props>(), {
  loading: false
});

const emit = defineEmits<Emits>();

const { t } = useI18n();
const message = useMessage();
const formRef = ref<FormInst>();

// 字段数据
const sourceFields = ref<any[]>([]);
const targetFields = ref<any[]>([]);
const fieldsLoading = ref(false);

// 表单数据
const formData = ref({
  name: '',
  type: 'ONE_TO_MANY',
  description: '',
  sourceFieldName: 'id',
  targetFieldName: '',
  cascadeAction: 'RESTRICT',
  lineColor: '#1976d2',
  lineWidth: 2,
  lineStyle: 'solid'
});

// 表单验证规则
const rules: FormRules = {
  name: {
    required: true,
    message: '请输入关系名称',
    trigger: ['input', 'blur']
  },
  type: {
    required: true,
    message: '请选择关系类型',
    trigger: ['change', 'blur']
  }
};

// 计算属性
const sourceEntityName = computed(() => props.sourceEntity?.name || '');
const targetEntityName = computed(() => props.targetEntity?.name || '');

// 关系类型示例数据
const relationshipExamples = {
  'ONE_TO_ONE': {
    title: '一对一关系',
    description: '每个源实体对应一个目标实体',
    examples: [
      '用户 ↔ 用户资料：每个用户有且仅有一个详细资料',
      '订单 ↔ 发票：每个订单对应一张发票',
      '员工 ↔ 工作证：每个员工有一个工作证'
    ],
    icon: '🔗',
    supported: true
  },
  'ONE_TO_MANY': {
    title: '一对多关系',
    description: '一个源实体对应多个目标实体',
    examples: [
      '用户 → 订单：一个用户可以有多个订单',
      '分类 → 商品：一个分类下有多个商品',
      '部门 → 员工：一个部门有多个员工'
    ],
    icon: '🌟',
    supported: true
  },
  'MANY_TO_ONE': {
    title: '多对一关系',
    description: '多个源实体对应一个目标实体',
    examples: [
      '订单 ← 用户：多个订单属于一个用户',
      '商品 ← 分类：多个商品属于一个分类',
      '员工 ← 部门：多个员工属于一个部门'
    ],
    icon: '⭐',
    supported: true
  },
  'MANY_TO_MANY': {
    title: '多对多关系',
    description: '多个源实体对应多个目标实体（需要中间表）',
    examples: [
      '用户 ↔ 角色：用户可以有多个角色，角色可以分配给多个用户',
      '商品 ↔ 标签：商品可以有多个标签，标签可以用于多个商品',
      '学生 ↔ 课程：学生可以选多门课程，课程可以有多个学生'
    ],
    icon: '🔀',
    supported: false // 暂时不支持，因为需要复杂的中间表逻辑
  }
};

// 当前选择的关系类型示例
const currentExample = computed(() => {
  const type = formData.value.type as keyof typeof relationshipExamples;
  return relationshipExamples[type] || null;
});

// 过滤后的关系类型选项（只显示支持的）
const relationshipTypeOptions = computed(() => {
  const baseOptions = [
    { label: t('page.lowcode.relationship.relationTypes.oneToOne'), value: 'ONE_TO_ONE' },
    { label: t('page.lowcode.relationship.relationTypes.oneToMany'), value: 'ONE_TO_MANY' },
    { label: t('page.lowcode.relationship.relationTypes.manyToOne'), value: 'MANY_TO_ONE' },
    { label: t('page.lowcode.relationship.relationTypes.manyToMany'), value: 'MANY_TO_MANY' }
  ];

  // 根据系统支持情况过滤选项
  return baseOptions.filter(option => {
    const example = relationshipExamples[option.value as keyof typeof relationshipExamples];
    return example?.supported !== false;
  });
});

// 源字段选项
const sourceFieldOptions = computed(() => {
  return sourceFields.value.map(field => ({
    label: `${field.name} (${field.code})`,
    value: field.code,
    disabled: false
  }));
});

// 目标字段选项
const targetFieldOptions = computed(() => {
  return targetFields.value.map(field => ({
    label: `${field.name} (${field.code})`,
    value: field.code,
    disabled: false
  }));
});

/** 加载实体字段数据 */
async function loadEntityFields() {
  if (!props.sourceEntity || !props.targetEntity) return;
  
  fieldsLoading.value = true;
  try {
    const [sourceRes, targetRes] = await Promise.all([
      fetchGetFieldList(props.sourceEntity.id),
      fetchGetFieldList(props.targetEntity.id)
    ]);
    
    sourceFields.value = sourceRes.data || [];
    targetFields.value = targetRes.data || [];
    
    // 智能设置默认字段
    autoSetDefaultFields();
  } catch (error) {
    console.error('加载字段数据失败:', error);
    message.warning('加载字段数据失败，请手动选择字段');
  } finally {
    fieldsLoading.value = false;
  }
}

/** 智能设置默认字段 */
function autoSetDefaultFields() {
  // 为源字段设置默认值（通常是主键）
  const primaryKeyField = sourceFields.value.find(f => f.isPrimaryKey);
  if (primaryKeyField) {
    formData.value.sourceFieldName = primaryKeyField.code;
  } else if (sourceFields.value.length > 0) {
    formData.value.sourceFieldName = sourceFields.value[0].code;
  }
  
  // 根据关系类型智能生成目标字段名
  generateTargetFieldName();
}

/** 根据关系类型生成目标字段名 */
function generateTargetFieldName() {
  if (!props.sourceEntity || !props.targetEntity) return;
  
  const relationType = formData.value.type;
  const sourceCode = props.sourceEntity.code || props.sourceEntity.name;
  
  // 检查是否已存在对应的外键字段
  const existingForeignKey = targetFields.value.find(f => 
    f.code.includes(sourceCode.toLowerCase()) || 
    f.code.includes('id') || 
    f.isForeignKey
  );
  
  if (existingForeignKey) {
    formData.value.targetFieldName = existingForeignKey.code;
  } else {
    // 根据关系类型生成字段名
    switch (relationType) {
      case 'ONE_TO_ONE':
      case 'MANY_TO_ONE':
        formData.value.targetFieldName = `${sourceCode.toLowerCase()}_id`;
        break;
      case 'ONE_TO_MANY':
        formData.value.targetFieldName = 'id'; // 通常是目标实体的主键
        break;
    }
  }
}

const cascadeOptions = [
  { label: '限制 (RESTRICT)', value: 'RESTRICT' },
  { label: '级联 (CASCADE)', value: 'CASCADE' },
  { label: '设为空 (SET_NULL)', value: 'SET_NULL' },
  { label: '无操作 (NO_ACTION)', value: 'NO_ACTION' }
];

const lineStyleOptions = [
  { label: '实线', value: 'solid' },
  { label: '虚线', value: 'dashed' },
  { label: '点线', value: 'dotted' }
];

// 监听弹窗显示状态，加载字段数据
watch(
  () => props.visible,
  visible => {
    if (visible) {
      // 延迟执行以确保props已更新
      nextTick(() => {
        if (props.sourceEntity && props.targetEntity) {
          // 加载字段数据
          loadEntityFields();
          // 智能生成关系名称
          generateRelationshipName();
          // 根据关系类型自动生成描述
          generateRelationshipDescription();
        } else {
          console.warn('源实体或目标实体未正确传递:', {
            sourceEntity: props.sourceEntity,
            targetEntity: props.targetEntity
          });
        }
      });
    } else if (!visible) {
      // 重置表单
      resetForm();
    }
  }
);

// 监听实体变化
watch(
  [() => props.sourceEntity, () => props.targetEntity],
  ([sourceEntity, targetEntity]) => {
    if (props.visible && sourceEntity && targetEntity) {
      loadEntityFields();
      generateRelationshipName();
      generateRelationshipDescription();
    }
  },
  { immediate: true }
);

/** 智能生成关系名称 */
function generateRelationshipName() {
  if (!props.sourceEntity || !props.targetEntity) return;

  const sourceCode = props.sourceEntity.code || props.sourceEntity.name;
  const targetCode = props.targetEntity.code || props.targetEntity.name;
  const relationType = formData.value.type;

  let relationshipName = '';

  switch (relationType) {
    case 'ONE_TO_ONE':
      relationshipName = `${sourceCode}To${targetCode}`;
      break;
    case 'ONE_TO_MANY':
      relationshipName = `${sourceCode}ToMany${targetCode}`;
      break;
    case 'MANY_TO_ONE':
      relationshipName = `Many${sourceCode}To${targetCode}`;
      break;
    case 'MANY_TO_MANY':
      relationshipName = `${sourceCode}To${targetCode}Many`;
      break;
    default:
      relationshipName = `${sourceCode}_${targetCode}`;
  }

  formData.value.name = relationshipName;
}

/** 生成关系描述 */
function generateRelationshipDescription() {
  if (!props.sourceEntity || !props.targetEntity) return;

  const sourceName = props.sourceEntity.name;
  const targetName = props.targetEntity.name;
  const relationType = formData.value.type;

  let description = '';

  switch (relationType) {
    case 'ONE_TO_ONE':
      description = `${sourceName}与${targetName}是一对一关系`;
      break;
    case 'ONE_TO_MANY':
      description = `一个${sourceName}可以关联多个${targetName}`;
      break;
    case 'MANY_TO_ONE':
      description = `多个${sourceName}可以关联一个${targetName}`;
      break;
    case 'MANY_TO_MANY':
      description = `${sourceName}与${targetName}是多对多关系`;
      break;
  }

  formData.value.description = description;
}

/** 重置表单 */
function resetForm() {
  formData.value = {
    name: '',
    type: 'ONE_TO_MANY',
    description: '',
    sourceFieldName: 'id',
    targetFieldName: '',
    cascadeAction: 'RESTRICT',
    lineColor: '#1976d2',
    lineWidth: 2,
    lineStyle: 'solid'
  };
}

/** 处理确认 */
async function handleConfirm() {
  try {
    await formRef.value?.validate();

    if (!props.sourceEntity || !props.targetEntity) {
      message.error('源实体或目标实体不能为空');
      return;
    }

    const relationshipData: Partial<EntityRelationship> = {
      name: formData.value.name,
      type: formData.value.type as any,
      description: formData.value.description,
      sourceEntityId: props.sourceEntity.id,
      targetEntityId: props.targetEntity.id,
      sourceFieldName: formData.value.sourceFieldName,
      targetFieldName: formData.value.targetFieldName,
      cascadeAction: formData.value.cascadeAction as any,
      lineColor: formData.value.lineColor,
      lineWidth: formData.value.lineWidth,
      lineStyle: formData.value.lineStyle as any
    };

    emit('confirm', relationshipData);
  } catch (error) {
    console.error('表单验证失败:', error);
  }
}

/** 处理取消 */
function handleCancel() {
  emit('cancel');
  emit('update:visible', false);
}
</script>

<template>
  <NModal
    :show="visible"
    preset="dialog"
    :title="$t('page.lowcode.relationship.createRelationshipDialog')"
    style="width: 900px"
    @update:show="emit('update:visible', $event)"
  >
    <!-- 实体关系概览 -->
    <div class="mb-6 rounded-lg bg-gradient-to-r from-blue-50 to-green-50 p-4">
      <div class="flex items-center justify-center space-x-4">
        <div class="entity-card">
          <NIcon class="text-blue-500" size="20">
            <icon-mdi-information />
          </NIcon>
          <NText strong class="text-blue-600">{{ sourceEntityName || '未选择' }}</NText>
        </div>
        <NIcon class="text-gray-400" size="24">
          <icon-mdi-arrow-right />
        </NIcon>
        <div class="entity-card">
          <NIcon class="text-green-500" size="20">
            <icon-mdi-information />
          </NIcon>
          <NText strong class="text-green-600">{{ targetEntityName || '未选择' }}</NText>
        </div>
      </div>
    </div>

    <NForm ref="formRef" :model="formData" :rules="rules" label-placement="left" label-width="100px">
      <NFormItem :label="$t('page.lowcode.relationship.name')" path="name">
        <NInput v-model="formData.name" :placeholder="$t('page.lowcode.relationship.form.name.placeholder')" />
      </NFormItem>

      <NFormItem :label="$t('page.lowcode.relationship.relationType')" path="type">
        <NSelect
          v-model="formData.type"
          :options="relationshipTypeOptions"
          :placeholder="$t('page.lowcode.relationship.form.relationType.placeholder')"
          style="width: 100%"
        />
      </NFormItem>

      <!-- 关系类型示例说明 -->
      <div v-if="currentExample" class="relationship-example">
        <NAlert :type="currentExample.supported ? 'info' : 'warning'" :show-icon="false">
          <template #header>
            <div class="flex items-center space-x-2">
              <span class="text-lg">{{ currentExample.icon }}</span>
              <NText strong>{{ currentExample.title }}</NText>
              <NTag v-if="!currentExample.supported" type="warning" size="small">暂不支持</NTag>
            </div>
          </template>
          <div class="space-y-2">
            <NText depth="2">{{ currentExample.description }}</NText>
            <div class="examples">
              <NText depth="3" class="text-sm font-medium">示例场景：</NText>
              <ul class="example-list">
                <li v-for="example in currentExample.examples" :key="example" class="example-item">
                  <NText depth="3" class="text-sm">{{ example }}</NText>
                </li>
              </ul>
            </div>
          </div>
        </NAlert>
      </div>

      <NFormItem :label="$t('page.lowcode.relationship.description')" path="description">
        <NInput
          v-model="formData.description"
          type="textarea"
          :rows="3"
          :placeholder="$t('page.lowcode.relationship.form.description.placeholder')"
        />
      </NFormItem>

      <NDivider>高级配置</NDivider>

      <NGrid :cols="2" :x-gap="16">
        <NGridItem>
          <NFormItem label="源字段" path="sourceFieldName">
            <NSelect
              v-model="formData.sourceFieldName"
              :options="sourceFieldOptions"
              :loading="fieldsLoading"
              placeholder="选择源实体的关联字段"
              clearable
            />
          </NFormItem>
        </NGridItem>
        <NGridItem>
          <NFormItem label="目标字段" path="targetFieldName">
            <NSelect
              v-model="formData.targetFieldName"
              :options="targetFieldOptions"
              :loading="fieldsLoading"
              placeholder="选择目标实体的关联字段"
              clearable
            />
          </NFormItem>
        </NGridItem>
      </NGrid>

      <!-- 字段关系说明 -->
      <div v-if="formData.sourceFieldName && formData.targetFieldName" class="field-relationship-info">
        <NAlert type="success" :show-icon="false">
          <template #header>
            <NText strong>字段关系映射</NText>
          </template>
          <div class="relationship-mapping">
            <NText class="text-sm">
              {{ sourceEntityName }}.{{ formData.sourceFieldName }} 
              {{ formData.type === 'ONE_TO_MANY' ? '→' : formData.type === 'MANY_TO_ONE' ? '←' : '↔' }}
              {{ targetEntityName }}.{{ formData.targetFieldName }}
            </NText>
          </div>
        </NAlert>
      </div>

      <!-- 高级配置折叠面板 -->
      <NCollapse>
        <NCollapseItem title="样式配置" name="style">
          <NGrid :cols="2" :x-gap="16" :y-gap="16">
            <NGridItem>
              <NFormItem label="线条颜色">
                <NColorPicker v-model="formData.lineColor" style="width: 100%" />
              </NFormItem>
            </NGridItem>
            <NGridItem>
              <NFormItem label="线条宽度">
                <NInputNumber v-model="formData.lineWidth" :min="1" :max="10" style="width: 100%" />
              </NFormItem>
            </NGridItem>
            <NGridItem span="2">
              <NFormItem label="线条样式">
                <NSelect v-model="formData.lineStyle" :options="lineStyleOptions" style="width: 100%" />
              </NFormItem>
            </NGridItem>
          </NGrid>
        </NCollapseItem>
        
        <NCollapseItem title="级联操作" name="cascade">
          <NFormItem label="级联操作" path="cascadeAction">
            <NSelect v-model="formData.cascadeAction" :options="cascadeOptions" style="width: 100%" />
            <template #feedback>
              <NText depth="3" class="text-xs">
                删除或更新主表记录时对关联记录的处理方式
              </NText>
            </template>
          </NFormItem>
        </NCollapseItem>
      </NCollapse>
    </NForm>

    <template #action>
      <NSpace justify="end">
        <NButton @click="handleCancel">取消</NButton>
        <NButton type="primary" :loading="loading" @click="handleConfirm">确认</NButton>
      </NSpace>
    </template>
  </NModal>
</template>

<style scoped>
.entity-card {
  @apply flex items-center space-x-2 bg-white px-3 py-2 rounded-lg shadow-sm;
}

.relationship-example {
  @apply my-4;
}

.example-list {
  @apply mt-2 space-y-1 pl-4;
}

.example-item {
  @apply relative;
}

.example-item::before {
  content: '•';
  @apply absolute -left-3 text-gray-400;
}

.field-relationship-info {
  @apply my-4;
}

.relationship-mapping {
  @apply text-center py-2;
}

.n-divider {
  margin: 16px 0;
}

.n-collapse {
  @apply mt-4;
}
</style>
