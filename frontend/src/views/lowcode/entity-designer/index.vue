<template>
  <div class="entity-designer">
    <!-- 工具栏 -->
    <div class="designer-toolbar">
      <div class="toolbar-left">
        <a-button type="primary" @click="addEntity">
          <template #icon><PlusOutlined /></template>
          添加实体
        </a-button>
        <a-button @click="addRelation" :disabled="selectedEntities.length !== 2">
          <template #icon><LinkOutlined /></template>
          添加关系
        </a-button>
        <a-divider type="vertical" />
        <a-button @click="autoLayout">
          <template #icon><NodeIndexOutlined /></template>
          自动布局
        </a-button>
        <a-button @click="zoomToFit">
          <template #icon><ExpandOutlined /></template>
          适应画布
        </a-button>
      </div>
      <div class="toolbar-right">
        <a-select v-model:value="layoutType" style="width: 120px" @change="onLayoutChange">
          <a-select-option value="hierarchical">层次布局</a-select-option>
          <a-select-option value="force">力导向</a-select-option>
          <a-select-option value="circular">环形布局</a-select-option>
          <a-select-option value="grid">网格布局</a-select-option>
        </a-select>
        <a-button @click="saveDesign" type="primary">
          <template #icon><SaveOutlined /></template>
          保存设计
        </a-button>
      </div>
    </div>

    <!-- 设计画布 -->
    <div class="designer-canvas" ref="canvasRef">
      <div id="entity-graph" ref="graphRef"></div>
    </div>

    <!-- 侧边栏 -->
    <div class="designer-sidebar" :class="{ collapsed: sidebarCollapsed }">
      <div class="sidebar-header">
        <span v-if="!sidebarCollapsed">实体属性</span>
        <a-button 
          type="text" 
          size="small" 
          @click="sidebarCollapsed = !sidebarCollapsed"
        >
          <template #icon>
            <MenuFoldOutlined v-if="!sidebarCollapsed" />
            <MenuUnfoldOutlined v-else />
          </template>
        </a-button>
      </div>
      
      <div class="sidebar-content" v-if="!sidebarCollapsed">
        <!-- 实体属性编辑 -->
        <div v-if="selectedEntity" class="entity-properties">
          <h4>{{ selectedEntity.name }}</h4>
          
          <a-form layout="vertical">
            <a-form-item label="实体名称">
              <a-input v-model:value="selectedEntity.name" @change="updateEntity" />
            </a-form-item>
            
            <a-form-item label="表名">
              <a-input v-model:value="selectedEntity.tableName" @change="updateEntity" />
            </a-form-item>
            
            <a-form-item label="描述">
              <a-textarea v-model:value="selectedEntity.description" @change="updateEntity" />
            </a-form-item>
          </a-form>

          <!-- 字段列表 -->
          <div class="fields-section">
            <div class="section-header">
              <span>字段列表</span>
              <a-button type="link" size="small" @click="addField">
                <template #icon><PlusOutlined /></template>
                添加字段
              </a-button>
            </div>
            
            <div class="fields-list">
              <div 
                v-for="(field, index) in selectedEntity.fields" 
                :key="field.id"
                class="field-item"
                :class="{ selected: selectedField?.id === field.id }"
                @click="selectField(field)"
              >
                <div class="field-info">
                  <span class="field-name">{{ field.name }}</span>
                  <span class="field-type">{{ field.type }}</span>
                  <div class="field-badges">
                    <a-tag v-if="field.isPrimary" color="red" size="small">主键</a-tag>
                    <a-tag v-if="field.isRequired" color="orange" size="small">必填</a-tag>
                    <a-tag v-if="field.isUnique" color="blue" size="small">唯一</a-tag>
                  </div>
                </div>
                <div class="field-actions">
                  <a-button type="text" size="small" @click.stop="editField(field)">
                    <template #icon><EditOutlined /></template>
                  </a-button>
                  <a-button type="text" size="small" danger @click.stop="removeField(index)">
                    <template #icon><DeleteOutlined /></template>
                  </a-button>
                </div>
              </div>
            </div>
          </div>

          <!-- 关系列表 -->
          <div class="relations-section">
            <div class="section-header">
              <span>关系列表</span>
            </div>
            
            <div class="relations-list">
              <div 
                v-for="relation in getEntityRelations(selectedEntity.id)" 
                :key="relation.id"
                class="relation-item"
              >
                <div class="relation-info">
                  <span class="relation-name">{{ relation.name }}</span>
                  <span class="relation-type">{{ relation.type }}</span>
                  <span class="relation-target">
                    → {{ getEntityName(relation.targetEntityId) }}
                  </span>
                </div>
                <div class="relation-actions">
                  <a-button type="text" size="small" @click="editRelation(relation)">
                    <template #icon><EditOutlined /></template>
                  </a-button>
                  <a-button type="text" size="small" danger @click="removeRelation(relation.id)">
                    <template #icon><DeleteOutlined /></template>
                  </a-button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 关系属性编辑 -->
        <div v-else-if="selectedRelation" class="relation-properties">
          <h4>关系属性</h4>
          
          <a-form layout="vertical">
            <a-form-item label="关系名称">
              <a-input v-model:value="selectedRelation.name" @change="updateRelation" />
            </a-form-item>
            
            <a-form-item label="关系类型">
              <a-select v-model:value="selectedRelation.type" @change="updateRelation">
                <a-select-option value="ONE_TO_ONE">一对一</a-select-option>
                <a-select-option value="ONE_TO_MANY">一对多</a-select-option>
                <a-select-option value="MANY_TO_ONE">多对一</a-select-option>
                <a-select-option value="MANY_TO_MANY">多对多</a-select-option>
              </a-select>
            </a-form-item>
            
            <a-form-item label="源字段">
              <a-input v-model:value="selectedRelation.sourceField" @change="updateRelation" />
            </a-form-item>
            
            <a-form-item label="目标字段">
              <a-input v-model:value="selectedRelation.targetField" @change="updateRelation" />
            </a-form-item>
            
            <a-form-item label="外键字段">
              <a-input v-model:value="selectedRelation.foreignKey" @change="updateRelation" />
            </a-form-item>
            
            <a-form-item label="删除时动作">
              <a-select v-model:value="selectedRelation.onDelete" @change="updateRelation">
                <a-select-option value="CASCADE">级联删除</a-select-option>
                <a-select-option value="SET_NULL">设为空</a-select-option>
                <a-select-option value="RESTRICT">限制</a-select-option>
                <a-select-option value="NO_ACTION">无动作</a-select-option>
              </a-select>
            </a-form-item>
            
            <a-form-item>
              <a-checkbox v-model:checked="selectedRelation.required" @change="updateRelation">
                必需关系
              </a-checkbox>
            </a-form-item>
          </a-form>
        </div>

        <!-- 空状态 -->
        <div v-else class="empty-selection">
          <a-empty description="请选择实体或关系进行编辑" />
        </div>
      </div>
    </div>

    <!-- 实体编辑弹窗 -->
    <a-modal
      v-model:open="entityModalVisible"
      :title="editingEntity?.id ? '编辑实体' : '新建实体'"
      @ok="saveEntity"
      @cancel="cancelEntityEdit"
      width="600px"
    >
      <a-form ref="entityFormRef" :model="editingEntity" layout="vertical">
        <a-form-item label="实体名称" name="name" :rules="[{ required: true, message: '请输入实体名称' }]">
          <a-input v-model:value="editingEntity.name" placeholder="请输入实体名称" />
        </a-form-item>
        
        <a-form-item label="表名" name="tableName">
          <a-input v-model:value="editingEntity.tableName" placeholder="自动生成或手动输入" />
        </a-form-item>
        
        <a-form-item label="描述" name="description">
          <a-textarea v-model:value="editingEntity.description" placeholder="请输入实体描述" />
        </a-form-item>
        
        <a-form-item label="位置">
          <a-row :gutter="16">
            <a-col :span="12">
              <a-input-number v-model:value="editingEntity.x" placeholder="X坐标" style="width: 100%" />
            </a-col>
            <a-col :span="12">
              <a-input-number v-model:value="editingEntity.y" placeholder="Y坐标" style="width: 100%" />
            </a-col>
          </a-row>
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- 字段编辑弹窗 -->
    <a-modal
      v-model:open="fieldModalVisible"
      :title="editingField?.id ? '编辑字段' : '新建字段'"
      @ok="saveField"
      @cancel="cancelFieldEdit"
      width="500px"
    >
      <a-form ref="fieldFormRef" :model="editingField" layout="vertical">
        <a-form-item label="字段名称" name="name" :rules="[{ required: true, message: '请输入字段名称' }]">
          <a-input v-model:value="editingField.name" placeholder="请输入字段名称" />
        </a-form-item>
        
        <a-form-item label="字段类型" name="type" :rules="[{ required: true, message: '请选择字段类型' }]">
          <a-select v-model:value="editingField.type" placeholder="请选择字段类型">
            <a-select-option value="string">字符串</a-select-option>
            <a-select-option value="number">数字</a-select-option>
            <a-select-option value="boolean">布尔值</a-select-option>
            <a-select-option value="date">日期</a-select-option>
            <a-select-option value="datetime">日期时间</a-select-option>
            <a-select-option value="text">长文本</a-select-option>
            <a-select-option value="json">JSON</a-select-option>
          </a-select>
        </a-form-item>
        
        <a-form-item label="字段长度" name="length" v-if="['string', 'text'].includes(editingField.type)">
          <a-input-number v-model:value="editingField.length" placeholder="字段长度" style="width: 100%" />
        </a-form-item>
        
        <a-form-item label="默认值" name="defaultValue">
          <a-input v-model:value="editingField.defaultValue" placeholder="默认值" />
        </a-form-item>
        
        <a-form-item label="描述" name="description">
          <a-textarea v-model:value="editingField.description" placeholder="字段描述" />
        </a-form-item>
        
        <a-form-item>
          <a-space>
            <a-checkbox v-model:checked="editingField.isPrimary">主键</a-checkbox>
            <a-checkbox v-model:checked="editingField.isRequired">必填</a-checkbox>
            <a-checkbox v-model:checked="editingField.isUnique">唯一</a-checkbox>
            <a-checkbox v-model:checked="editingField.isIndex">索引</a-checkbox>
          </a-space>
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- 关系编辑弹窗 -->
    <a-modal
      v-model:open="relationModalVisible"
      title="编辑关系"
      @ok="saveRelation"
      @cancel="cancelRelationEdit"
      width="600px"
    >
      <a-form ref="relationFormRef" :model="editingRelation" layout="vertical">
        <a-form-item label="关系名称" name="name" :rules="[{ required: true, message: '请输入关系名称' }]">
          <a-input v-model:value="editingRelation.name" placeholder="请输入关系名称" />
        </a-form-item>
        
        <a-form-item label="源实体" name="sourceEntityId">
          <a-select v-model:value="editingRelation.sourceEntityId" placeholder="选择源实体" disabled>
            <a-select-option v-for="entity in entities" :key="entity.id" :value="entity.id">
              {{ entity.name }}
            </a-select-option>
          </a-select>
        </a-form-item>
        
        <a-form-item label="目标实体" name="targetEntityId">
          <a-select v-model:value="editingRelation.targetEntityId" placeholder="选择目标实体" disabled>
            <a-select-option v-for="entity in entities" :key="entity.id" :value="entity.id">
              {{ entity.name }}
            </a-select-option>
          </a-select>
        </a-form-item>
        
        <a-form-item label="关系类型" name="type" :rules="[{ required: true, message: '请选择关系类型' }]">
          <a-select v-model:value="editingRelation.type" placeholder="请选择关系类型">
            <a-select-option value="ONE_TO_ONE">一对一</a-select-option>
            <a-select-option value="ONE_TO_MANY">一对多</a-select-option>
            <a-select-option value="MANY_TO_ONE">多对一</a-select-option>
            <a-select-option value="MANY_TO_MANY">多对多</a-select-option>
          </a-select>
        </a-form-item>
        
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="源字段" name="sourceField">
              <a-input v-model:value="editingRelation.sourceField" placeholder="源字段名" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="目标字段" name="targetField">
              <a-input v-model:value="editingRelation.targetField" placeholder="目标字段名" />
            </a-form-item>
          </a-col>
        </a-row>
        
        <a-form-item label="外键字段" name="foreignKey">
          <a-input v-model:value="editingRelation.foreignKey" placeholder="外键字段名" />
        </a-form-item>
        
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="删除时动作" name="onDelete">
              <a-select v-model:value="editingRelation.onDelete" placeholder="删除时动作">
                <a-select-option value="CASCADE">级联删除</a-select-option>
                <a-select-option value="SET_NULL">设为空</a-select-option>
                <a-select-option value="RESTRICT">限制</a-select-option>
                <a-select-option value="NO_ACTION">无动作</a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="更新时动作" name="onUpdate">
              <a-select v-model:value="editingRelation.onUpdate" placeholder="更新时动作">
                <a-select-option value="CASCADE">级联更新</a-select-option>
                <a-select-option value="SET_NULL">设为空</a-select-option>
                <a-select-option value="RESTRICT">限制</a-select-option>
                <a-select-option value="NO_ACTION">无动作</a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
        </a-row>
        
        <a-form-item>
          <a-space>
            <a-checkbox v-model:checked="editingRelation.required">必需关系</a-checkbox>
            <a-checkbox v-model:checked="editingRelation.lazy">延迟加载</a-checkbox>
            <a-checkbox v-model:checked="editingRelation.eager">预加载</a-checkbox>
          </a-space>
        </a-form-item>
        
        <a-form-item label="描述" name="description">
          <a-textarea v-model:value="editingRelation.description" placeholder="关系描述" />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, nextTick, computed } from 'vue'
import { message } from 'ant-design-vue'
import { 
  PlusOutlined, 
  LinkOutlined, 
  NodeIndexOutlined, 
  ExpandOutlined,
  SaveOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  EditOutlined,
  DeleteOutlined
} from '@ant-design/icons-vue'
import { useRoute } from 'vue-router'
import G6 from '@antv/g6'

// 路由参数
const route = useRoute()
const projectId = computed(() => route.params.projectId as string)

// 响应式数据
const canvasRef = ref()
const graphRef = ref()
const entityFormRef = ref()
const fieldFormRef = ref()
const relationFormRef = ref()

// 图形实例
let graph: any = null

// 界面状态
const sidebarCollapsed = ref(false)
const layoutType = ref('hierarchical')

// 数据状态
const entities = ref([])
const relations = ref([])
const selectedEntities = ref([])
const selectedEntity = ref(null)
const selectedRelation = ref(null)
const selectedField = ref(null)

// 弹窗状态
const entityModalVisible = ref(false)
const fieldModalVisible = ref(false)
const relationModalVisible = ref(false)

// 编辑数据
const editingEntity = ref({})
const editingField = ref({})
const editingRelation = ref({})

// 初始化
onMounted(async () => {
  await initGraph()
  await loadData()
})

// 初始化图形
const initGraph = async () => {
  await nextTick()
  
  const container = graphRef.value
  const width = container.offsetWidth
  const height = container.offsetHeight

  graph = new G6.Graph({
    container: container,
    width,
    height,
    modes: {
      default: ['drag-canvas', 'zoom-canvas', 'drag-node', 'click-select']
    },
    defaultNode: {
      type: 'rect',
      size: [200, 120],
      style: {
        fill: '#f0f2f5',
        stroke: '#d9d9d9',
        lineWidth: 1,
        radius: 4
      },
      labelCfg: {
        style: {
          fill: '#000',
          fontSize: 14,
          fontWeight: 'bold'
        }
      }
    },
    defaultEdge: {
      type: 'line',
      style: {
        stroke: '#1890ff',
        lineWidth: 2,
        endArrow: {
          path: G6.Arrow.triangle(8, 8, 8),
          fill: '#1890ff'
        }
      },
      labelCfg: {
        autoRotate: true,
        style: {
          fill: '#666',
          fontSize: 12,
          background: {
            fill: '#fff',
            padding: [2, 4],
            radius: 2
          }
        }
      }
    },
    layout: {
      type: 'dagre',
      direction: 'TB',
      nodesep: 50,
      ranksep: 80
    }
  })

  // 绑定事件
  graph.on('node:click', onNodeClick)
  graph.on('edge:click', onEdgeClick)
  graph.on('canvas:click', onCanvasClick)
  graph.on('node:dragend', onNodeDragEnd)

  // 响应式调整
  window.addEventListener('resize', () => {
    if (graph && !graph.get('destroyed')) {
      const container = graphRef.value
      graph.changeSize(container.offsetWidth, container.offsetHeight)
    }
  })
}

// 加载数据
const loadData = async () => {
  try {
    // 这里应该调用API加载项目的实体和关系数据
    // const response = await api.getProjectEntities(projectId.value)
    // entities.value = response.data.entities
    // relations.value = response.data.relations
    
    // 模拟数据
    entities.value = [
      {
        id: '1',
        name: 'User',
        tableName: 'users',
        description: '用户实体',
        x: 100,
        y: 100,
        fields: [
          { id: '1', name: 'id', type: 'string', isPrimary: true, isRequired: true },
          { id: '2', name: 'username', type: 'string', isRequired: true, isUnique: true },
          { id: '3', name: 'email', type: 'string', isRequired: true },
          { id: '4', name: 'createdAt', type: 'datetime', isRequired: true }
        ]
      },
      {
        id: '2',
        name: 'Post',
        tableName: 'posts',
        description: '文章实体',
        x: 400,
        y: 100,
        fields: [
          { id: '5', name: 'id', type: 'string', isPrimary: true, isRequired: true },
          { id: '6', name: 'title', type: 'string', isRequired: true },
          { id: '7', name: 'content', type: 'text', isRequired: true },
          { id: '8', name: 'userId', type: 'string', isRequired: true }
        ]
      }
    ]
    
    relations.value = [
      {
        id: '1',
        name: 'user-posts',
        sourceEntityId: '1',
        targetEntityId: '2',
        type: 'ONE_TO_MANY',
        sourceField: 'posts',
        targetField: 'user',
        foreignKey: 'userId',
        onDelete: 'CASCADE',
        required: true
      }
    ]

    renderGraph()
  } catch (error) {
    message.error('加载数据失败')
    console.error(error)
  }
}

// 渲染图形
const renderGraph = () => {
  const nodes = entities.value.map(entity => ({
    id: entity.id,
    label: entity.name,
    x: entity.x,
    y: entity.y,
    data: entity,
    style: {
      fill: selectedEntity.value?.id === entity.id ? '#e6f7ff' : '#f0f2f5'
    }
  }))

  const edges = relations.value.map(relation => ({
    id: relation.id,
    source: relation.sourceEntityId,
    target: relation.targetEntityId,
    label: `${relation.name}\n(${relation.type})`,
    data: relation,
    style: {
      stroke: selectedRelation.value?.id === relation.id ? '#ff4d4f' : '#1890ff'
    }
  }))

  graph.data({ nodes, edges })
  graph.render()
}

// 事件处理
const onNodeClick = (e) => {
  const node = e.item
  const entity = node.getModel().data
  selectedEntity.value = entity
  selectedRelation.value = null
  selectedField.value = null
  
  // 更新选中状态
  graph.getNodes().forEach(n => {
    graph.updateItem(n, {
      style: {
        fill: n === node ? '#e6f7ff' : '#f0f2f5'
      }
    })
  })
}

const onEdgeClick = (e) => {
  const edge = e.item
  const relation = edge.getModel().data
  selectedRelation.value = relation
  selectedEntity.value = null
  selectedField.value = null
  
  // 更新选中状态
  graph.getEdges().forEach(ed => {
    graph.updateItem(ed, {
      style: {
        stroke: ed === edge ? '#ff4d4f' : '#1890ff'
      }
    })
  })
}

const onCanvasClick = () => {
  selectedEntity.value = null
  selectedRelation.value = null
  selectedField.value = null
  
  // 清除选中状态
  graph.getNodes().forEach(node => {
    graph.updateItem(node, {
      style: { fill: '#f0f2f5' }
    })
  })
  
  graph.getEdges().forEach(edge => {
    graph.updateItem(edge, {
      style: { stroke: '#1890ff' }
    })
  })
}

const onNodeDragEnd = (e) => {
  const node = e.item
  const model = node.getModel()
  const entity = entities.value.find(e => e.id === model.id)
  if (entity) {
    entity.x = model.x
    entity.y = model.y
  }
}

// 工具栏操作
const addEntity = () => {
  editingEntity.value = {
    name: '',
    tableName: '',
    description: '',
    x: Math.random() * 400 + 100,
    y: Math.random() * 300 + 100,
    fields: []
  }
  entityModalVisible.value = true
}

const addRelation = () => {
  if (selectedEntities.value.length !== 2) {
    message.warning('请选择两个实体来创建关系')
    return
  }
  
  editingRelation.value = {
    name: '',
    sourceEntityId: selectedEntities.value[0].id,
    targetEntityId: selectedEntities.value[1].id,
    type: 'ONE_TO_MANY',
    sourceField: '',
    targetField: '',
    foreignKey: '',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
    required: false,
    lazy: false,
    eager: false,
    description: ''
  }
  relationModalVisible.value = true
}

const autoLayout = () => {
  graph.layout()
  graph.fitView()
}

const zoomToFit = () => {
  graph.fitView()
}

const onLayoutChange = (value) => {
  const layouts = {
    hierarchical: { type: 'dagre', direction: 'TB' },
    force: { type: 'force', preventOverlap: true },
    circular: { type: 'circular' },
    grid: { type: 'grid' }
  }
  
  graph.updateLayout(layouts[value])
}

const saveDesign = async () => {
  try {
    // 这里应该调用API保存设计
    // await api.saveProjectDesign(projectId.value, { entities: entities.value, relations: relations.value })
    message.success('设计已保存')
  } catch (error) {
    message.error('保存失败')
    console.error(error)
  }
}

// 实体操作
const saveEntity = async () => {
  try {
    await entityFormRef.value.validate()
    
    if (editingEntity.value.id) {
      // 更新实体
      const index = entities.value.findIndex(e => e.id === editingEntity.value.id)
      entities.value[index] = { ...editingEntity.value }
    } else {
      // 新建实体
      editingEntity.value.id = Date.now().toString()
      editingEntity.value.fields = []
      entities.value.push({ ...editingEntity.value })
    }
    
    renderGraph()
    entityModalVisible.value = false
    message.success('实体保存成功')
  } catch (error) {
    console.error(error)
  }
}

const cancelEntityEdit = () => {
  entityModalVisible.value = false
  editingEntity.value = {}
}

const updateEntity = () => {
  if (selectedEntity.value) {
    renderGraph()
  }
}

// 字段操作
const addField = () => {
  editingField.value = {
    name: '',
    type: 'string',
    length: null,
    defaultValue: '',
    description: '',
    isPrimary: false,
    isRequired: false,
    isUnique: false,
    isIndex: false
  }
  fieldModalVisible.value = true
}

const editField = (field) => {
  editingField.value = { ...field }
  fieldModalVisible.value = true
}

const selectField = (field) => {
  selectedField.value = field
}

const saveField = async () => {
  try {
    await fieldFormRef.value.validate()
    
    if (editingField.value.id) {
      // 更新字段
      const fieldIndex = selectedEntity.value.fields.findIndex(f => f.id === editingField.value.id)
      selectedEntity.value.fields[fieldIndex] = { ...editingField.value }
    } else {
      // 新建字段
      editingField.value.id = Date.now().toString()
      selectedEntity.value.fields.push({ ...editingField.value })
    }
    
    fieldModalVisible.value = false
    message.success('字段保存成功')
  } catch (error) {
    console.error(error)
  }
}

const cancelFieldEdit = () => {
  fieldModalVisible.value = false
  editingField.value = {}
}

const removeField = (index) => {
  selectedEntity.value.fields.splice(index, 1)
  message.success('字段已删除')
}

// 关系操作
const getEntityRelations = (entityId) => {
  return relations.value.filter(r => r.sourceEntityId === entityId || r.targetEntityId === entityId)
}

const getEntityName = (entityId) => {
  const entity = entities.value.find(e => e.id === entityId)
  return entity ? entity.name : 'Unknown'
}

const editRelation = (relation) => {
  editingRelation.value = { ...relation }
  relationModalVisible.value = true
}

const saveRelation = async () => {
  try {
    await relationFormRef.value.validate()
    
    if (editingRelation.value.id) {
      // 更新关系
      const index = relations.value.findIndex(r => r.id === editingRelation.value.id)
      relations.value[index] = { ...editingRelation.value }
    } else {
      // 新建关系
      editingRelation.value.id = Date.now().toString()
      relations.value.push({ ...editingRelation.value })
    }
    
    renderGraph()
    relationModalVisible.value = false
    message.success('关系保存成功')
  } catch (error) {
    console.error(error)
  }
}

const cancelRelationEdit = () => {
  relationModalVisible.value = false
  editingRelation.value = {}
}

const removeRelation = (relationId) => {
  const index = relations.value.findIndex(r => r.id === relationId)
  relations.value.splice(index, 1)
  renderGraph()
  message.success('关系已删除')
}

const updateRelation = () => {
  if (selectedRelation.value) {
    renderGraph()
  }
}
</script>

<style scoped>
.entity-designer {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: #f0f2f5;
}

.designer-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: #fff;
  border-bottom: 1px solid #d9d9d9;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.toolbar-left,
.toolbar-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.designer-canvas {
  flex: 1;
  position: relative;
  overflow: hidden;
}

#entity-graph {
  width: 100%;
  height: 100%;
}

.designer-sidebar {
  position: absolute;
  top: 0;
  right: 0;
  width: 320px;
  height: 100%;
  background: #fff;
  border-left: 1px solid #d9d9d9;
  box-shadow: -2px 0 8px rgba(0,0,0,0.1);
  transition: all 0.3s ease;
  z-index: 10;
}

.designer-sidebar.collapsed {
  width: 48px;
}

.sidebar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid #f0f0f0;
  font-weight: 500;
}

.sidebar-content {
  padding: 16px;
  height: calc(100% - 57px);
  overflow-y: auto;
}

.entity-properties h4,
.relation-properties h4 {
  margin-bottom: 16px;
  color: #262626;
}

.fields-section,
.relations-section {
  margin-top: 24px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  font-weight: 500;
}

.fields-list,
.relations-list {
  max-height: 300px;
  overflow-y: auto;
}

.field-item,
.relation-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  margin-bottom: 4px;
  border: 1px solid #f0f0f0;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.field-item:hover,
.relation-item:hover {
  border-color: #1890ff;
  background: #f6ffed;
}

.field-item.selected {
  border-color: #1890ff;
  background: #e6f7ff;
}

.field-info,
.relation-info {
  flex: 1;
}

.field-name,
.relation-name {
  font-weight: 500;
  color: #262626;
}

.field-type,
.relation-type {
  color: #8c8c8c;
  font-size: 12px;
  margin-left: 8px;
}

.relation-target {
  color: #1890ff;
  font-size: 12px;
  display: block;
  margin-top: 2px;
}

.field-badges {
  margin-top: 4px;
}

.field-actions,
.relation-actions {
  display: flex;
  gap: 4px;
}

.empty-selection {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
}
</style>
