<template>
  <div class="property-panel" :class="{ 'panel-visible': visible }">
    <div class="panel-header">
      <h3 class="panel-title">
        <n-icon :component="selectedType === 'node' ? DatabaseIcon : LinkIcon" />
        {{ selectedType === 'node' ? '实体属性' : '关系属性' }}
      </h3>
      <n-button quaternary size="small" @click="$emit('close')">
        <n-icon :component="CloseIcon" />
      </n-button>
    </div>

    <div class="panel-content" v-if="selectedItem">
      <!-- 实体属性面板 -->
      <div v-if="selectedType === 'node'" class="entity-properties">
        <n-form :model="entityForm" label-placement="top" size="small">
          <n-form-item label="实体名称">
            <n-input 
              v-model:value="entityForm.name" 
              placeholder="请输入实体名称"
              @blur="debouncedUpdateEntityProperty('name', entityForm.name)"
            />
          </n-form-item>
          
          <n-form-item label="显示名称">
            <n-input 
              v-model:value="entityForm.displayName" 
              placeholder="请输入显示名称"
              @blur="debouncedUpdateEntityProperty('displayName', entityForm.displayName)"
            />
          </n-form-item>
          
          <n-form-item label="描述">
            <n-input 
              v-model:value="entityForm.description" 
              type="textarea" 
              placeholder="请输入实体描述"
              :rows="3"
              @blur="debouncedUpdateEntityProperty('description', entityForm.description)"
            />
          </n-form-item>
          
          <n-form-item label="颜色">
            <n-color-picker 
              v-model:value="entityForm.color" 
              :show-alpha="false"
              @update:value="debouncedUpdateEntityProperty('color', entityForm.color)"
            />
          </n-form-item>
          
          <n-form-item label="位置">
            <n-space>
              <n-input-number 
                v-model:value="entityForm.x" 
                placeholder="X坐标"
                size="small"
                style="width: 80px"
                @blur="debouncedUpdateEntityPosition"
              />
              <n-input-number 
                v-model:value="entityForm.y" 
                placeholder="Y坐标"
                size="small"
                style="width: 80px"
                @blur="debouncedUpdateEntityPosition"
              />
            </n-space>
          </n-form-item>
        </n-form>

        <!-- 字段列表 - 虚拟滚动优化 -->
        <div class="fields-section">
          <div class="section-header">
            <h4>字段列表 ({{ entityForm.fields.length }})</h4>
            <n-button size="small" type="primary" @click="addField">
              <n-icon :component="PlusIcon" />
              添加字段
            </n-button>
          </div>
          
          <div class="fields-list" v-if="entityForm.fields.length > 0">
            <!-- 使用虚拟滚动处理大量字段 -->
            <n-virtual-list
              v-if="entityForm.fields.length > 20"
              :items="entityForm.fields"
              :item-size="60"
              :max-height="300"
            >
              <template #default="{ item, index }">
                <FieldItem 
                  :field="item" 
                  :index="index"
                  @edit="editField"
                  @remove="removeField"
                />
              </template>
            </n-virtual-list>
            
            <!-- 少量字段直接渲染 -->
            <template v-else>
              <FieldItem 
                v-for="(field, index) in entityForm.fields" 
                :key="field.id"
                :field="field" 
                :index="index"
                @edit="editField"
                @remove="removeField"
              />
            </template>
          </div>
          
          <div v-else class="empty-fields">
            <n-empty description="暂无字段" size="small" />
          </div>
        </div>
      </div>

      <!-- 关系属性面板 -->
      <div v-else-if="selectedType === 'edge'" class="relationship-properties">
        <n-form :model="relationshipForm" label-placement="top" size="small">
          <n-form-item label="关系名称">
            <n-input 
              v-model:value="relationshipForm.name" 
              placeholder="请输入关系名称"
              @blur="debouncedUpdateRelationshipProperty('name', relationshipForm.name)"
            />
          </n-form-item>
          
          <n-form-item label="关系类型">
            <n-select 
              v-model:value="relationshipForm.type" 
              :options="relationshipTypes"
              @update:value="debouncedUpdateRelationshipProperty('type', relationshipForm.type)"
            />
          </n-form-item>
          
          <n-form-item label="描述">
            <n-input 
              v-model:value="relationshipForm.description" 
              type="textarea" 
              placeholder="请输入关系描述"
              :rows="3"
              @blur="debouncedUpdateRelationshipProperty('description', relationshipForm.description)"
            />
          </n-form-item>
          
          <n-form-item label="源实体">
            <n-input :value="relationshipForm.sourceEntity" readonly />
          </n-form-item>
          
          <n-form-item label="目标实体">
            <n-input :value="relationshipForm.targetEntity" readonly />
          </n-form-item>
          
          <n-form-item label="线条样式">
            <n-space>
              <n-select 
                v-model:value="relationshipForm.lineStyle" 
                :options="lineStyles"
                style="width: 100px"
                @update:value="debouncedUpdateRelationshipStyle"
              />
              <n-color-picker 
                v-model:value="relationshipForm.lineColor" 
                :show-alpha="false"
                @update:value="debouncedUpdateRelationshipStyle"
              />
            </n-space>
          </n-form-item>
        </n-form>
      </div>
    </div>

    <!-- 字段编辑对话框 -->
    <n-modal v-model:show="fieldModalVisible" preset="dialog" title="编辑字段">
      <n-form :model="fieldForm" label-placement="left" label-width="80px">
        <n-form-item label="字段名称" required>
          <n-input v-model:value="fieldForm.name" placeholder="请输入字段名称" />
        </n-form-item>
        
        <n-form-item label="字段类型" required>
          <n-select v-model:value="fieldForm.type" :options="fieldTypes" />
        </n-form-item>
        
        <n-form-item label="字段长度">
          <n-input-number v-model:value="fieldForm.length" :min="1" />
        </n-form-item>
        
        <n-form-item label="默认值">
          <n-input v-model:value="fieldForm.defaultValue" placeholder="请输入默认值" />
        </n-form-item>
        
        <n-form-item label="注释">
          <n-input v-model:value="fieldForm.comment" placeholder="请输入字段注释" />
        </n-form-item>
        
        <n-form-item>
          <n-space>
            <n-checkbox v-model:checked="fieldForm.isPrimaryKey">主键</n-checkbox>
            <n-checkbox v-model:checked="fieldForm.isRequired">必填</n-checkbox>
            <n-checkbox v-model:checked="fieldForm.isUnique">唯一</n-checkbox>
            <n-checkbox v-model:checked="fieldForm.isIndex">索引</n-checkbox>
          </n-space>
        </n-form-item>
      </n-form>
      
      <template #action>
        <n-space>
          <n-button @click="fieldModalVisible = false">取消</n-button>
          <n-button type="primary" @click="saveField" :loading="saveFieldLoading">保存</n-button>
        </n-space>
      </template>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, watch, computed, defineComponent, h } from 'vue';
import { 
  NButton, NIcon, NForm, NFormItem, NInput, NInputNumber, 
  NSelect, NColorPicker, NSpace, NTag, NModal, NCheckbox,
  NVirtualList, NEmpty, useMessage 
} from 'naive-ui';
import { Icon } from '@iconify/vue';
import { debounce } from 'lodash-es';

// 定义图标组件
const DatabaseIcon = () => h(Icon, { icon: 'mdi:database' });
const LinkIcon = () => h(Icon, { icon: 'mdi:link' });
const CloseIcon = () => h(Icon, { icon: 'mdi:close' });
const PlusIcon = () => h(Icon, { icon: 'mdi:plus' });
const EditIcon = () => h(Icon, { icon: 'mdi:pencil' });
const DeleteIcon = () => h(Icon, { icon: 'mdi:delete' });
const InfoIcon = () => h(Icon, { icon: 'mdi:information' });

// 字段项组件 - 提取为独立组件优化性能
const FieldItem = defineComponent({
  name: 'FieldItem',
  props: {
    field: { type: Object, required: true },
    index: { type: Number, required: true }
  },
  emits: ['edit', 'remove'],
  setup(props, { emit }) {
    return () => h('div', { class: 'field-item' }, [
      h(NSpace, { align: 'center', justify: 'space-between' }, [
        h('div', { class: 'field-info' }, [
          h('div', { class: 'field-name' }, props.field.name),
          h('div', { class: 'field-type' }, props.field.type)
        ]),
        h(NSpace, {}, [
          props.field.isPrimaryKey && h(NTag, { type: 'warning', size: 'small' }, '主键'),
          props.field.isRequired && h(NTag, { type: 'error', size: 'small' }, '必填'),
          h(NButton, { 
            size: 'small', 
            quaternary: true, 
            onClick: () => emit('edit', props.field, props.index) 
          }, [h(NIcon, { component: EditIcon })]),
          h(NButton, { 
            size: 'small', 
            quaternary: true, 
            onClick: () => emit('remove', props.index) 
          }, [h(NIcon, { component: DeleteIcon })])
        ])
      ])
    ]);
  }
});

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
const saveFieldLoading = ref(false);
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

// 性能优化：防抖函数
const debouncedUpdateEntityProperty = debounce((property: string, value: any) => {
  updateEntityProperty(property, value);
}, 300);

const debouncedUpdateEntityPosition = debounce(() => {
  updateEntityPosition();
}, 300);

const debouncedUpdateRelationshipProperty = debounce((property: string, value: any) => {
  updateRelationshipProperty(property, value);
}, 300);

const debouncedUpdateRelationshipStyle = debounce(() => {
  updateRelationshipStyle();
}, 300);

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

// 监听选中项变化 - 优化深度监听
watch(() => props.selectedItem, (newItem) => {
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
}, { immediate: true, deep: false });

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

async function saveField() {
  if (!fieldForm.name.trim()) {
    message.error('请输入字段名称');
    return;
  }

  try {
    saveFieldLoading.value = true;

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
  } catch (error) {
    console.error('Failed to save field:', error);
    message.error('字段保存失败');
  } finally {
    saveFieldLoading.value = false;
  }
}
</script>

<style scoped>
.property-panel {
  position: fixed;
  top: 60px;
  right: -400px;
  width: 380px;
  height: calc(100vh - 60px);
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
  transition: all 0.2s ease;
}

.field-item:hover {
  background: #f0f0f0;
  border-color: #d0d0d0;
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

.empty-fields {
  padding: 20px;
  text-align: center;
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

/* 性能优化：减少重绘 */
.field-item {
  contain: layout style paint;
}

.panel-content {
  contain: layout style;
}
</style>