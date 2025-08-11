<script setup lang="ts">
import { computed, h, reactive, ref, watch } from 'vue';
import {
  NButton,
  NCheckbox,
  NColorPicker,
  NForm,
  NFormItem,
  NIcon,
  NInput,
  NInputNumber,
  NModal,
  NSelect,
  NSpace,
  NTag,
  useMessage
} from 'naive-ui';
import { Icon } from '@iconify/vue';

// 定义图标组件
const DatabaseIcon = () => h(Icon, { icon: 'mdi:database' });
const LinkIcon = () => h(Icon, { icon: 'mdi:link' });
const CloseIcon = () => h(Icon, { icon: 'mdi:close' });
const PlusIcon = () => h(Icon, { icon: 'mdi:plus' });
const EditIcon = () => h(Icon, { icon: 'mdi:pencil' });
const DeleteIcon = () => h(Icon, { icon: 'mdi:delete' });

interface Props {
  visible: boolean;
  selectedItem: any;
  selectedType: 'node' | 'edge' | null;
}

interface Emits {
  (e: 'close'): void;
  (e: 'update-entity', entityId: string, property: string, value: any): void;
  (e: 'update-relationship', relationshipId: string, property: string, value: any): void;
  (e: 'update-entity-position', entityId: string, x: number, y: number): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();
const message = useMessage();

// 表单数据
const entityForm = reactive({
  name: '',
  displayName: '',
  description: '',
  color: '#1890ff',
  x: 0,
  y: 0,
  fields: [] as any[]
});

const relationshipForm = reactive({
  name: '',
  type: 'one-to-many',
  description: '',
  sourceEntity: '',
  targetEntity: '',
  lineStyle: 'solid',
  lineColor: '#666666'
});

// 字段编辑
const fieldModalVisible = ref(false);
const editingFieldIndex = ref(-1);
const fieldForm = reactive({
  name: '',
  type: 'varchar',
  length: 255,
  defaultValue: '',
  comment: '',
  isPrimaryKey: false,
  isRequired: false,
  isUnique: false,
  isIndex: false
});

// 选项数据
const relationshipTypes = [
  { label: '一对一', value: 'one-to-one' },
  { label: '一对多', value: 'one-to-many' },
  { label: '多对一', value: 'many-to-one' },
  { label: '多对多', value: 'many-to-many' }
];

const lineStyles = [
  { label: '实线', value: 'solid' },
  { label: '虚线', value: 'dashed' },
  { label: '点线', value: 'dotted' }
];

const fieldTypes = [
  { label: 'VARCHAR', value: 'varchar' },
  { label: 'INT', value: 'int' },
  { label: 'BIGINT', value: 'bigint' },
  { label: 'DECIMAL', value: 'decimal' },
  { label: 'TEXT', value: 'text' },
  { label: 'DATE', value: 'date' },
  { label: 'DATETIME', value: 'datetime' },
  { label: 'TIMESTAMP', value: 'timestamp' },
  { label: 'BOOLEAN', value: 'boolean' },
  { label: 'JSON', value: 'json' }
];

// 监听选中项变化
watch(
  () => props.selectedItem,
  newItem => {
    if (newItem && props.selectedType === 'node') {
      Object.assign(entityForm, {
        name: newItem.name || '',
        displayName: newItem.displayName || '',
        description: newItem.description || '',
        color: newItem.color || '#1890ff',
        x: newItem.x || 0,
        y: newItem.y || 0,
        fields: newItem.fields || []
      });
    } else if (newItem && props.selectedType === 'edge') {
      Object.assign(relationshipForm, {
        name: newItem.name || '',
        type: newItem.type || 'one-to-many',
        description: newItem.description || '',
        sourceEntity: newItem.sourceEntity || '',
        targetEntity: newItem.targetEntity || '',
        lineStyle: newItem.lineStyle || 'solid',
        lineColor: newItem.lineColor || '#666666'
      });
    }
  },
  { immediate: true }
);

// 更新实体属性
function updateEntityProperty(property: string, value: any) {
  if (props.selectedItem) {
    emit('update-entity', props.selectedItem.id, property, value);
  }
}

// 更新实体位置
function updateEntityPosition() {
  if (props.selectedItem) {
    emit('update-entity-position', props.selectedItem.id, entityForm.x, entityForm.y);
  }
}

// 更新关系属性
function updateRelationshipProperty(property: string, value: any) {
  if (props.selectedItem) {
    emit('update-relationship', props.selectedItem.id, property, value);
  }
}

// 更新关系样式
function updateRelationshipStyle() {
  if (props.selectedItem) {
    emit('update-relationship', props.selectedItem.id, 'style', {
      lineStyle: relationshipForm.lineStyle,
      lineColor: relationshipForm.lineColor
    });
  }
}

// 字段管理
function addField() {
  Object.assign(fieldForm, {
    name: '',
    type: 'varchar',
    length: 255,
    defaultValue: '',
    comment: '',
    isPrimaryKey: false,
    isRequired: false,
    isUnique: false,
    isIndex: false
  });
  editingFieldIndex.value = -1;
  fieldModalVisible.value = true;
}

function editField(field: any, index: number) {
  Object.assign(fieldForm, field);
  editingFieldIndex.value = index;
  fieldModalVisible.value = true;
}

function removeField(index: number) {
  entityForm.fields.splice(index, 1);
  updateEntityProperty('fields', entityForm.fields);
  message.success('字段删除成功');
}

function saveField() {
  if (!fieldForm.name.trim()) {
    message.error('请输入字段名称');
    return;
  }

  const fieldData = {
    id: editingFieldIndex.value === -1 ? `field_${Date.now()}` : entityForm.fields[editingFieldIndex.value].id,
    ...fieldForm
  };

  if (editingFieldIndex.value === -1) {
    entityForm.fields.push(fieldData);
    message.success('字段添加成功');
  } else {
    entityForm.fields[editingFieldIndex.value] = fieldData;
    message.success('字段更新成功');
  }

  updateEntityProperty('fields', entityForm.fields);
  fieldModalVisible.value = false;
}
</script>

<template>
  <div class="property-panel" :class="{ 'panel-visible': visible }">
    <div class="panel-header">
      <h3 class="panel-title">
        <NIcon :component="selectedType === 'node' ? DatabaseIcon : LinkIcon" />
        {{ selectedType === 'node' ? '实体属性' : '关系属性' }}
      </h3>
      <NButton quaternary size="small" @click="$emit('close')">
        <NIcon :component="CloseIcon" />
      </NButton>
    </div>

    <div v-if="selectedItem" class="panel-content">
      <!-- 实体属性面板 -->
      <div v-if="selectedType === 'node'" class="entity-properties">
        <NForm :model="entityForm" label-placement="top" size="small">
          <NFormItem label="实体名称">
            <NInput
              v-model:value="entityForm.name"
              placeholder="请输入实体名称"
              @blur="updateEntityProperty('name', entityForm.name)"
            />
          </NFormItem>

          <NFormItem label="显示名称">
            <NInput
              v-model:value="entityForm.displayName"
              placeholder="请输入显示名称"
              @blur="updateEntityProperty('displayName', entityForm.displayName)"
            />
          </NFormItem>

          <NFormItem label="描述">
            <NInput
              v-model:value="entityForm.description"
              type="textarea"
              placeholder="请输入实体描述"
              :rows="3"
              @blur="updateEntityProperty('description', entityForm.description)"
            />
          </NFormItem>

          <NFormItem label="颜色">
            <NColorPicker
              v-model:value="entityForm.color"
              :show-alpha="false"
              @update:value="updateEntityProperty('color', entityForm.color)"
            />
          </NFormItem>

          <NFormItem label="位置">
            <NSpace>
              <NInputNumber
                v-model:value="entityForm.x"
                placeholder="X坐标"
                size="small"
                style="width: 80px"
                @blur="updateEntityPosition"
              />
              <NInputNumber
                v-model:value="entityForm.y"
                placeholder="Y坐标"
                size="small"
                style="width: 80px"
                @blur="updateEntityPosition"
              />
            </NSpace>
          </NFormItem>
        </NForm>

        <!-- 字段列表 -->
        <div class="fields-section">
          <div class="section-header">
            <h4>字段列表</h4>
            <NButton size="small" type="primary" @click="addField">
              <NIcon :component="PlusIcon" />
              添加字段
            </NButton>
          </div>

          <div class="fields-list">
            <div v-for="(field, index) in entityForm.fields" :key="field.id" class="field-item">
              <NSpace align="center" justify="space-between">
                <div class="field-info">
                  <div class="field-name">{{ field.name }}</div>
                  <div class="field-type">{{ field.type }}</div>
                </div>
                <NSpace>
                  <NTag v-if="field.isPrimaryKey" type="warning" size="small">主键</NTag>
                  <NTag v-if="field.isRequired" type="error" size="small">必填</NTag>
                  <NButton size="small" quaternary @click="editField(field, index)">
                    <NIcon :component="EditIcon" />
                  </NButton>
                  <NButton size="small" quaternary @click="removeField(index)">
                    <NIcon :component="DeleteIcon" />
                  </NButton>
                </NSpace>
              </NSpace>
            </div>
          </div>
        </div>
      </div>

      <!-- 关系属性面板 -->
      <div v-else-if="selectedType === 'edge'" class="relationship-properties">
        <NForm :model="relationshipForm" label-placement="top" size="small">
          <NFormItem label="关系名称">
            <NInput
              v-model:value="relationshipForm.name"
              placeholder="请输入关系名称"
              @blur="updateRelationshipProperty('name', relationshipForm.name)"
            />
          </NFormItem>

          <NFormItem label="关系类型">
            <NSelect
              v-model:value="relationshipForm.type"
              :options="relationshipTypes"
              @update:value="updateRelationshipProperty('type', relationshipForm.type)"
            />
          </NFormItem>

          <NFormItem label="描述">
            <NInput
              v-model:value="relationshipForm.description"
              type="textarea"
              placeholder="请输入关系描述"
              :rows="3"
              @blur="updateRelationshipProperty('description', relationshipForm.description)"
            />
          </NFormItem>

          <NFormItem label="源实体">
            <NInput :value="relationshipForm.sourceEntity" readonly />
          </NFormItem>

          <NFormItem label="目标实体">
            <NInput :value="relationshipForm.targetEntity" readonly />
          </NFormItem>

          <NFormItem label="线条样式">
            <NSpace>
              <NSelect
                v-model:value="relationshipForm.lineStyle"
                :options="lineStyles"
                style="width: 100px"
                @update:value="updateRelationshipStyle"
              />
              <NColorPicker
                v-model:value="relationshipForm.lineColor"
                :show-alpha="false"
                @update:value="updateRelationshipStyle"
              />
            </NSpace>
          </NFormItem>
        </NForm>
      </div>
    </div>

    <!-- 字段编辑对话框 -->
    <NModal v-model:show="fieldModalVisible" preset="dialog" title="编辑字段">
      <NForm :model="fieldForm" label-placement="left" label-width="80px">
        <NFormItem label="字段名称" required>
          <NInput v-model:value="fieldForm.name" placeholder="请输入字段名称" />
        </NFormItem>

        <NFormItem label="字段类型" required>
          <NSelect v-model:value="fieldForm.type" :options="fieldTypes" />
        </NFormItem>

        <NFormItem label="字段长度">
          <NInputNumber v-model:value="fieldForm.length" :min="1" />
        </NFormItem>

        <NFormItem label="默认值">
          <NInput v-model:value="fieldForm.defaultValue" placeholder="请输入默认值" />
        </NFormItem>

        <NFormItem label="注释">
          <NInput v-model:value="fieldForm.comment" placeholder="请输入字段注释" />
        </NFormItem>

        <NFormItem>
          <NSpace>
            <NCheckbox v-model:checked="fieldForm.isPrimaryKey">主键</NCheckbox>
            <NCheckbox v-model:checked="fieldForm.isRequired">必填</NCheckbox>
            <NCheckbox v-model:checked="fieldForm.isUnique">唯一</NCheckbox>
            <NCheckbox v-model:checked="fieldForm.isIndex">索引</NCheckbox>
          </NSpace>
        </NFormItem>
      </NForm>

      <template #action>
        <NSpace>
          <NButton @click="fieldModalVisible = false">取消</NButton>
          <NButton type="primary" @click="saveField">保存</NButton>
        </NSpace>
      </template>
    </NModal>
  </div>
</template>

<style scoped>
.property-panel {
  position: fixed;
  top: 80px;
  right: -400px;
  width: 380px;
  height: calc(100vh - 80px);
  background: white;
  border-left: 1px solid #e8e8e8;
  box-shadow: -2px 0 8px rgba(0, 0, 0, 0.1);
  transition: right 0.3s ease;
  z-index: 1000;
  display: flex;
  flex-direction: column;
}

.property-panel.panel-visible {
  right: 0;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  border-bottom: 1px solid #e8e8e8;
  background: #fafafa;
}

.panel-title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.panel-content {
  flex: 1;
  padding: 16px;
  overflow-y: auto;
}

.fields-section {
  margin-top: 24px;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.section-header h4 {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: #333;
}

.fields-list {
  max-height: 300px;
  overflow-y: auto;
}

.field-item {
  padding: 12px;
  border: 1px solid #e8e8e8;
  border-radius: 6px;
  margin-bottom: 8px;
  background: #fafafa;
}

.field-info {
  flex: 1;
}

.field-name {
  font-weight: 600;
  color: #333;
  margin-bottom: 4px;
}

.field-type {
  font-size: 12px;
  color: #666;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .property-panel {
    width: 100%;
    right: -100%;
    top: 0;
    height: 100vh;
  }
}
</style>
