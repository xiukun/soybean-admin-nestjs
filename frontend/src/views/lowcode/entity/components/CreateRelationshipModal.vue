<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue';
import {
  type FormInst,
  type FormRules,
  NButton,
  NColorPicker,
  NDivider,
  NForm,
  NFormItem,
  NGrid,
  NGridItem,
  NInput,
  NInputNumber,
  NModal,
  NSelect,
  NSpace,
  useMessage
} from 'naive-ui';
import { useI18n } from 'vue-i18n';
import type { Entity, EntityRelationship } from '../types';

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

// 选项配置
const relationshipTypeOptions = computed(() => [
  { label: t('page.lowcode.relationship.relationTypes.oneToOne'), value: 'ONE_TO_ONE' },
  { label: t('page.lowcode.relationship.relationTypes.oneToMany'), value: 'ONE_TO_MANY' },
  { label: t('page.lowcode.relationship.relationTypes.manyToOne'), value: 'MANY_TO_ONE' },
  { label: t('page.lowcode.relationship.relationTypes.manyToMany'), value: 'MANY_TO_MANY' }
]);

// 监听关系类型变化，重新生成名称和描述
watch(
  () => formData.value.type,
  () => {
    if (props.visible && props.sourceEntity && props.targetEntity) {
      generateRelationshipName();
      generateRelationshipDescription();
    }
  }
);

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

// 监听弹窗显示状态，重置表单
watch(
  () => props.visible,
  visible => {
    if (visible) {
      // 延迟执行以确保props已更新
      nextTick(() => {
        if (props.sourceEntity && props.targetEntity) {
          // 智能生成关系名称
          generateRelationshipName();
          // 自动生成目标字段名
          formData.value.targetFieldName = `${props.sourceEntity.code}_id`;
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
      generateRelationshipName();
      formData.value.targetFieldName = `${sourceEntity.code}_id`;
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
    style="width: 800px"
    @update:show="emit('update:visible', $event)"
  >
    <div class="mb-4 rounded-lg bg-blue-50 p-3">
      <span class="text-sm text-gray-700 font-medium">
        {{ $t('page.lowcode.relationship.sourceEntity') }}:
        <span class="text-blue-600">{{ sourceEntityName || '未选择' }}</span>
        →
        {{ $t('page.lowcode.relationship.targetEntity') }}:
        <span class="text-green-600">{{ targetEntityName || '未选择' }}</span>
      </span>
    </div>

    <NForm ref="formRef" :model="formData" :rules="rules" label-placement="left" label-width="100px">
      <NFormItem :label="$t('page.lowcode.relationship.name')" path="name">
        <NInput v-model:value="formData.name" :placeholder="$t('page.lowcode.relationship.form.name.placeholder')" />
      </NFormItem>

      <NFormItem :label="$t('page.lowcode.relationship.relationType')" path="type">
        <NSelect
          v-model:value="formData.type"
          :options="relationshipTypeOptions"
          :placeholder="$t('page.lowcode.relationship.form.relationType.placeholder')"
          style="width: 100%"
        />
      </NFormItem>

      <NFormItem :label="$t('page.lowcode.relationship.description')" path="description">
        <NInput
          v-model:value="formData.description"
          type="textarea"
          :rows="3"
          :placeholder="$t('page.lowcode.relationship.form.description.placeholder')"
        />
      </NFormItem>

      <NDivider>高级配置</NDivider>

      <NFormItem label="源字段" path="sourceFieldName">
        <NInput v-model:value="formData.sourceFieldName" placeholder="默认为 id" />
      </NFormItem>

      <NFormItem label="目标字段" path="targetFieldName">
        <NInput v-model:value="formData.targetFieldName" placeholder="自动生成" />
      </NFormItem>

      <NFormItem label="级联操作" path="cascadeAction">
        <NSelect v-model:value="formData.cascadeAction" :options="cascadeOptions" style="width: 100%" />
      </NFormItem>

      <NDivider>样式配置</NDivider>

      <NGrid :cols="2" :x-gap="16" :y-gap="16">
        <NGridItem>
          <NFormItem label="线条颜色">
            <NColorPicker v-model:value="formData.lineColor" style="width: 100%" />
          </NFormItem>
        </NGridItem>
        <NGridItem>
          <NFormItem label="线条宽度">
            <NInputNumber v-model:value="formData.lineWidth" :min="1" :max="10" style="width: 100%" />
          </NFormItem>
        </NGridItem>
        <NGridItem span="2">
          <NFormItem label="线条样式">
            <NSelect v-model:value="formData.lineStyle" :options="lineStyleOptions" style="width: 100%" />
          </NFormItem>
        </NGridItem>
      </NGrid>
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
.n-divider {
  margin: 16px 0;
}
</style>
