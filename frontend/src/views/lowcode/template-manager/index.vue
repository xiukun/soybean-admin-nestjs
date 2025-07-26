<template>
  <div class="template-manager">
    <!-- 头部工具栏 -->
    <div class="manager-header">
      <div class="header-left">
        <h2>模板管理</h2>
        <a-breadcrumb>
          <a-breadcrumb-item>
            <router-link to="/lowcode">低代码平台</router-link>
          </a-breadcrumb-item>
          <a-breadcrumb-item>模板管理</a-breadcrumb-item>
        </a-breadcrumb>
      </div>
      <div class="header-right">
        <a-button @click="importTemplate">
          <template #icon><ImportOutlined /></template>
          导入模板
        </a-button>
        <a-button @click="exportTemplates">
          <template #icon><ExportOutlined /></template>
          导出模板
        </a-button>
        <a-button type="primary" @click="showCreateModal">
          <template #icon><PlusOutlined /></template>
          新建模板
        </a-button>
      </div>
    </div>

    <!-- 过滤器和搜索 -->
    <div class="filters-section">
      <div class="filters-left">
        <a-input
          v-model:value="searchText"
          placeholder="搜索模板名称、描述..."
          style="width: 300px"
          allow-clear
        >
          <template #prefix><SearchOutlined /></template>
        </a-input>
        
        <a-select
          v-model:value="categoryFilter"
          placeholder="选择分类"
          style="width: 150px"
          allow-clear
        >
          <a-select-option value="">全部分类</a-select-option>
          <a-select-option value="entity">实体</a-select-option>
          <a-select-option value="service">服务</a-select-option>
          <a-select-option value="controller">控制器</a-select-option>
          <a-select-option value="dto">DTO</a-select-option>
          <a-select-option value="module">模块</a-select-option>
          <a-select-option value="test">测试</a-select-option>
        </a-select>
        
        <a-select
          v-model:value="frameworkFilter"
          placeholder="选择框架"
          style="width: 150px"
          allow-clear
        >
          <a-select-option value="">全部框架</a-select-option>
          <a-select-option value="nestjs">NestJS</a-select-option>
          <a-select-option value="spring-boot">Spring Boot</a-select-option>
          <a-select-option value="express">Express</a-select-option>
          <a-select-option value="django">Django</a-select-option>
          <a-select-option value="universal">通用</a-select-option>
        </a-select>

        <a-select
          v-model:value="statusFilter"
          placeholder="选择状态"
          style="width: 120px"
          allow-clear
        >
          <a-select-option value="">全部状态</a-select-option>
          <a-select-option value="active">启用</a-select-option>
          <a-select-option value="inactive">禁用</a-select-option>
          <a-select-option value="draft">草稿</a-select-option>
        </a-select>
      </div>
      
      <div class="filters-right">
        <a-radio-group v-model:value="viewMode" button-style="solid" size="small">
          <a-radio-button value="table">
            <template #icon><TableOutlined /></template>
            表格视图
          </a-radio-button>
          <a-radio-button value="card">
            <template #icon><AppstoreOutlined /></template>
            卡片视图
          </a-radio-button>
        </a-radio-group>
      </div>
    </div>

    <!-- 统计信息 -->
    <div class="stats-section">
      <a-row :gutter="16">
        <a-col :span="6">
          <a-statistic title="总模板数" :value="templates.length" />
        </a-col>
        <a-col :span="6">
          <a-statistic title="启用模板" :value="activeTemplatesCount" />
        </a-col>
        <a-col :span="6">
          <a-statistic title="本月新增" :value="monthlyNewCount" />
        </a-col>
        <a-col :span="6">
          <a-statistic title="使用次数" :value="totalUsageCount" />
        </a-col>
      </a-row>
    </div>

    <!-- 表格视图 -->
    <div v-if="viewMode === 'table'" class="table-view">
      <a-table
        :columns="columns"
        :data-source="filteredTemplates"
        :pagination="pagination"
        :loading="loading"
        row-key="id"
        :row-selection="rowSelection"
        @change="handleTableChange"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'name'">
            <div class="template-name-cell">
              <a @click="viewTemplate(record)" class="template-name">{{ record.name }}</a>
              <div class="template-desc">{{ record.description }}</div>
            </div>
          </template>
          
          <template v-if="column.key === 'category'">
            <a-tag :color="getCategoryColor(record.category)">
              {{ getCategoryLabel(record.category) }}
            </a-tag>
          </template>
          
          <template v-if="column.key === 'framework'">
            <a-tag :color="getFrameworkColor(record.framework)">
              {{ getFrameworkLabel(record.framework) }}
            </a-tag>
          </template>
          
          <template v-if="column.key === 'status'">
            <a-tag :color="getStatusColor(record.status)">
              {{ getStatusLabel(record.status) }}
            </a-tag>
          </template>

          <template v-if="column.key === 'usage'">
            <div class="usage-cell">
              <span class="usage-count">{{ record.usageCount || 0 }}</span>
              <a-progress 
                :percent="getUsagePercent(record.usageCount)" 
                size="small" 
                :show-info="false"
                style="width: 60px; margin-left: 8px;"
              />
            </div>
          </template>

          <template v-if="column.key === 'version'">
            <a-tag size="small">v{{ record.version }}</a-tag>
          </template>
          
          <template v-if="column.key === 'actions'">
            <a-space>
              <a-tooltip title="查看详情">
                <a-button type="text" size="small" @click="viewTemplate(record)">
                  <template #icon><EyeOutlined /></template>
                </a-button>
              </a-tooltip>
              <a-tooltip title="编辑模板">
                <a-button type="text" size="small" @click="editTemplate(record)">
                  <template #icon><EditOutlined /></template>
                </a-button>
              </a-tooltip>
              <a-tooltip title="复制模板">
                <a-button type="text" size="small" @click="duplicateTemplate(record)">
                  <template #icon><CopyOutlined /></template>
                </a-button>
              </a-tooltip>
              <a-tooltip title="测试模板">
                <a-button type="text" size="small" @click="testTemplate(record)">
                  <template #icon><ExperimentOutlined /></template>
                </a-button>
              </a-tooltip>
              <a-dropdown>
                <a-button type="text" size="small">
                  <template #icon><MoreOutlined /></template>
                </a-button>
                <template #overlay>
                  <a-menu>
                    <a-menu-item @click="toggleTemplateStatus(record)">
                      {{ record.status === 'active' ? '禁用' : '启用' }}
                    </a-menu-item>
                    <a-menu-item @click="exportTemplate(record)">
                      导出模板
                    </a-menu-item>
                    <a-menu-divider />
                    <a-menu-item @click="deleteTemplate(record.id)" danger>
                      删除模板
                    </a-menu-item>
                  </a-menu>
                </template>
              </a-dropdown>
            </a-space>
          </template>
        </template>
      </a-table>
    </div>

    <!-- 卡片视图 -->
    <div v-else class="card-view">
      <a-row :gutter="[16, 16]">
        <a-col 
          v-for="template in filteredTemplates" 
          :key="template.id" 
          :xs="24" :sm="12" :md="8" :lg="6" :xl="4"
        >
          <a-card 
            class="template-card"
            :class="{ selected: selectedTemplateIds.includes(template.id) }"
            @click="selectTemplate(template.id)"
          >
            <template #cover>
              <div class="card-cover">
                <div class="template-icon">
                  <component :is="getTemplateIcon(template.category)" />
                </div>
                <div class="template-badges">
                  <a-tag size="small" :color="getCategoryColor(template.category)">
                    {{ getCategoryLabel(template.category) }}
                  </a-tag>
                  <a-tag size="small" :color="getFrameworkColor(template.framework)">
                    {{ getFrameworkLabel(template.framework) }}
                  </a-tag>
                </div>
              </div>
            </template>

            <template #actions>
              <a-tooltip title="查看详情">
                <EyeOutlined @click.stop="viewTemplate(template)" />
              </a-tooltip>
              <a-tooltip title="编辑模板">
                <EditOutlined @click.stop="editTemplate(template)" />
              </a-tooltip>
              <a-tooltip title="测试模板">
                <ExperimentOutlined @click.stop="testTemplate(template)" />
              </a-tooltip>
              <a-dropdown @click.stop>
                <MoreOutlined />
                <template #overlay>
                  <a-menu>
                    <a-menu-item @click="duplicateTemplate(template)">
                      复制模板
                    </a-menu-item>
                    <a-menu-item @click="toggleTemplateStatus(template)">
                      {{ template.status === 'active' ? '禁用' : '启用' }}
                    </a-menu-item>
                    <a-menu-item @click="exportTemplate(template)">
                      导出模板
                    </a-menu-item>
                    <a-menu-divider />
                    <a-menu-item @click="deleteTemplate(template.id)" danger>
                      删除模板
                    </a-menu-item>
                  </a-menu>
                </template>
              </a-dropdown>
            </template>

            <a-card-meta>
              <template #title>
                <div class="card-title">
                  <span class="template-name">{{ template.name }}</span>
                  <a-tag 
                    size="small" 
                    :color="getStatusColor(template.status)"
                    class="status-tag"
                  >
                    {{ getStatusLabel(template.status) }}
                  </a-tag>
                </div>
              </template>
              <template #description>
                <div class="card-description">
                  <p class="template-desc">{{ template.description || '暂无描述' }}</p>
                  <div class="template-meta">
                    <span class="version">v{{ template.version }}</span>
                    <span class="usage">使用 {{ template.usageCount || 0 }} 次</span>
                    <span class="date">{{ formatDate(template.updatedAt) }}</span>
                  </div>
                </div>
              </template>
            </a-card-meta>
          </a-card>
        </a-col>
      </a-row>
    </div>

    <!-- 批量操作栏 -->
    <div v-if="selectedTemplateIds.length > 0" class="batch-actions">
      <div class="batch-info">
        已选择 {{ selectedTemplateIds.length }} 个模板
      </div>
      <div class="batch-buttons">
        <a-button @click="batchEnable">批量启用</a-button>
        <a-button @click="batchDisable">批量禁用</a-button>
        <a-button @click="batchExport">批量导出</a-button>
        <a-popconfirm
          title="确定要删除选中的模板吗？"
          @confirm="batchDelete"
        >
          <a-button danger>批量删除</a-button>
        </a-popconfirm>
      </div>
    </div>

    <!-- 创建/编辑模板弹窗 -->
    <a-modal
      v-model:open="modalVisible"
      :title="editingTemplate?.id ? '编辑模板' : '新建模板'"
      width="90%"
      :style="{ top: '20px' }"
      @ok="saveTemplate"
      @cancel="cancelEdit"
    >
      <a-form ref="formRef" :model="editingTemplate" layout="vertical">
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="模板名称" name="name" :rules="[{ required: true, message: '请输入模板名称' }]">
              <a-input v-model:value="editingTemplate.name" placeholder="请输入模板名称" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="模板分类" name="category" :rules="[{ required: true, message: '请选择模板分类' }]">
              <a-select v-model:value="editingTemplate.category" placeholder="请选择模板分类">
                <a-select-option value="entity">实体</a-select-option>
                <a-select-option value="service">服务</a-select-option>
                <a-select-option value="controller">控制器</a-select-option>
                <a-select-option value="dto">DTO</a-select-option>
                <a-select-option value="module">模块</a-select-option>
                <a-select-option value="test">测试</a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
        </a-row>

        <a-row :gutter="16">
          <a-col :span="8">
            <a-form-item label="适用框架" name="framework" :rules="[{ required: true, message: '请选择适用框架' }]">
              <a-select v-model:value="editingTemplate.framework" placeholder="请选择适用框架">
                <a-select-option value="nestjs">NestJS</a-select-option>
                <a-select-option value="spring-boot">Spring Boot</a-select-option>
                <a-select-option value="express">Express</a-select-option>
                <a-select-option value="django">Django</a-select-option>
                <a-select-option value="universal">通用</a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
          <a-col :span="8">
            <a-form-item label="版本号" name="version">
              <a-input v-model:value="editingTemplate.version" placeholder="1.0.0" />
            </a-form-item>
          </a-col>
          <a-col :span="8">
            <a-form-item label="状态" name="status">
              <a-select v-model:value="editingTemplate.status" placeholder="选择状态">
                <a-select-option value="draft">草稿</a-select-option>
                <a-select-option value="active">启用</a-select-option>
                <a-select-option value="inactive">禁用</a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
        </a-row>

        <a-form-item label="模板描述" name="description">
          <a-textarea v-model:value="editingTemplate.description" placeholder="请输入模板描述" :rows="3" />
        </a-form-item>

        <a-form-item label="模板内容" name="content" :rules="[{ required: true, message: '请输入模板内容' }]">
          <div class="template-editor">
            <div class="editor-toolbar">
              <a-space>
                <a-button size="small" @click="insertVariable">
                  <template #icon><PlusOutlined /></template>
                  插入变量
                </a-button>
                <a-button size="small" @click="insertHelper">
                  <template #icon><FunctionOutlined /></template>
                  插入辅助函数
                </a-button>
                <a-button size="small" @click="formatTemplate">
                  <template #icon><FormatPainterOutlined /></template>
                  格式化
                </a-button>
                <a-button size="small" @click="validateTemplate">
                  <template #icon><CheckCircleOutlined /></template>
                  验证语法
                </a-button>
              </a-space>
            </div>
            <div class="editor-content">
              <textarea
                ref="templateEditor"
                v-model="editingTemplate.content"
                placeholder="请输入Handlebars模板内容..."
                class="template-textarea"
                @keydown="handleEditorKeydown"
              />
            </div>
            <div class="editor-help">
              <a-collapse size="small">
                <a-collapse-panel key="variables" header="可用变量">
                  <div class="help-content">
                    <a-tag v-for="variable in availableVariables" :key="variable" size="small" @click="insertText(`{{${variable}}}`)">
                      {{ variable }}
                    </a-tag>
                  </div>
                </a-collapse-panel>
                <a-collapse-panel key="helpers" header="辅助函数">
                  <div class="help-content">
                    <a-tag v-for="helper in availableHelpers" :key="helper.name" size="small" @click="insertText(helper.example)">
                      {{ helper.name }}
                    </a-tag>
                  </div>
                </a-collapse-panel>
              </a-collapse>
            </div>
          </div>
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- 模板查看弹窗 -->
    <a-modal
      v-model:open="viewModalVisible"
      title="模板详情"
      width="80%"
      :footer="null"
    >
      <div v-if="viewingTemplate" class="template-detail">
        <a-descriptions :column="2" bordered>
          <a-descriptions-item label="模板名称">{{ viewingTemplate.name }}</a-descriptions-item>
          <a-descriptions-item label="分类">
            <a-tag :color="getCategoryColor(viewingTemplate.category)">
              {{ getCategoryLabel(viewingTemplate.category) }}
            </a-tag>
          </a-descriptions-item>
          <a-descriptions-item label="框架">
            <a-tag :color="getFrameworkColor(viewingTemplate.framework)">
              {{ getFrameworkLabel(viewingTemplate.framework) }}
            </a-tag>
          </a-descriptions-item>
          <a-descriptions-item label="版本">v{{ viewingTemplate.version }}</a-descriptions-item>
          <a-descriptions-item label="状态">
            <a-tag :color="getStatusColor(viewingTemplate.status)">
              {{ getStatusLabel(viewingTemplate.status) }}
            </a-tag>
          </a-descriptions-item>
          <a-descriptions-item label="使用次数">{{ viewingTemplate.usageCount || 0 }}</a-descriptions-item>
          <a-descriptions-item label="创建时间">{{ formatDate(viewingTemplate.createdAt) }}</a-descriptions-item>
          <a-descriptions-item label="更新时间">{{ formatDate(viewingTemplate.updatedAt) }}</a-descriptions-item>
          <a-descriptions-item label="描述" :span="2">{{ viewingTemplate.description || '暂无描述' }}</a-descriptions-item>
        </a-descriptions>

        <div class="template-content">
          <div class="content-header">
            <h4>模板内容</h4>
            <a-button size="small" @click="copyTemplateContent">
              <template #icon><CopyOutlined /></template>
              复制内容
            </a-button>
          </div>
          <div class="content-body">
            <pre><code>{{ viewingTemplate.content }}</code></pre>
          </div>
        </div>
      </div>
    </a-modal>

    <!-- 模板测试弹窗 -->
    <a-modal
      v-model:open="testModalVisible"
      title="模板测试"
      width="95%"
      :style="{ top: '20px' }"
      :footer="null"
    >
      <div v-if="testingTemplate" class="template-test">
        <div class="test-header">
          <h3>{{ testingTemplate.name }} - 模板测试</h3>
          <a-space>
            <a-button type="primary" @click="runTest" :loading="testLoading">
              <template #icon><PlayCircleOutlined /></template>
              运行测试
            </a-button>
            <a-button @click="loadSampleData">
              <template #icon><FileTextOutlined /></template>
              加载示例数据
            </a-button>
            <a-button @click="clearTestData">
              <template #icon><ClearOutlined /></template>
              清空数据
            </a-button>
          </a-space>
        </div>

        <a-row :gutter="16" class="test-content">
          <a-col :span="12">
            <div class="test-panel">
              <div class="panel-header">
                <h4>测试数据 (JSON)</h4>
                <a-button size="small" @click="formatTestData">
                  <template #icon><FormatPainterOutlined /></template>
                  格式化
                </a-button>
              </div>
              <div class="panel-content">
                <textarea
                  v-model="testData"
                  placeholder="请输入JSON格式的测试数据..."
                  class="test-textarea"
                />
              </div>
            </div>
          </a-col>
          <a-col :span="12">
            <div class="test-panel">
              <div class="panel-header">
                <h4>生成结果</h4>
                <a-space>
                  <a-button size="small" @click="copyTestResult" :disabled="!testResult">
                    <template #icon><CopyOutlined /></template>
                    复制结果
                  </a-button>
                  <a-button size="small" @click="downloadTestResult" :disabled="!testResult">
                    <template #icon><DownloadOutlined /></template>
                    下载结果
                  </a-button>
                </a-space>
              </div>
              <div class="panel-content">
                <div v-if="testError" class="test-error">
                  <a-alert type="error" :message="testError" show-icon />
                </div>
                <div v-else-if="testResult" class="test-result">
                  <pre><code>{{ testResult }}</code></pre>
                </div>
                <div v-else class="test-placeholder">
                  <a-empty description="点击运行测试查看结果" />
                </div>
              </div>
            </div>
          </a-col>
        </a-row>

        <div class="test-examples">
          <h4>示例数据模板</h4>
          <a-row :gutter="16">
            <a-col :span="8" v-for="example in testExamples" :key="example.name">
              <a-card size="small" class="example-card" @click="loadExampleData(example)">
                <template #title>{{ example.name }}</template>
                <p>{{ example.description }}</p>
              </a-card>
            </a-col>
          </a-row>
        </div>
      </div>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { message } from 'ant-design-vue'
import {
  PlusOutlined,
  SearchOutlined,
  ImportOutlined,
  ExportOutlined,
  TableOutlined,
  AppstoreOutlined,
  EyeOutlined,
  EditOutlined,
  CopyOutlined,
  ExperimentOutlined,
  MoreOutlined,
  DatabaseOutlined,
  ApiOutlined,
  ControlOutlined,
  FileTextOutlined,
  AppstoreAddOutlined,
  BugOutlined,
  FunctionOutlined,
  FormatPainterOutlined,
  CheckCircleOutlined,
  PlayCircleOutlined,
  ClearOutlined,
  DownloadOutlined
} from '@ant-design/icons-vue'

// 响应式数据
const templates = ref([])
const loading = ref(false)
const viewMode = ref('table')

// 过滤器
const searchText = ref('')
const categoryFilter = ref('')
const frameworkFilter = ref('')
const statusFilter = ref('')

// 选择状态
const selectedTemplateIds = ref([])

// 弹窗状态
const modalVisible = ref(false)
const viewModalVisible = ref(false)
const testModalVisible = ref(false)

// 编辑数据
const editingTemplate = ref({})
const viewingTemplate = ref(null)
const testingTemplate = ref(null)
const testData = ref('')
const testResult = ref('')
const testError = ref('')
const testLoading = ref(false)

// 表单引用
const formRef = ref()
const templateEditor = ref()

// 模板编辑辅助数据
const availableVariables = [
  'entityName', 'entityNameCamel', 'entityNameKebab', 'entityNameSnake',
  'tableName', 'fields', 'relations', 'primaryKey', 'author', 'version',
  'timestamp', 'packageName', 'description'
]

const availableHelpers = [
  { name: 'camelCase', example: '{{camelCase entityName}}' },
  { name: 'pascalCase', example: '{{pascalCase entityName}}' },
  { name: 'kebabCase', example: '{{kebabCase entityName}}' },
  { name: 'snakeCase', example: '{{snakeCase entityName}}' },
  { name: 'upperCase', example: '{{upperCase entityName}}' },
  { name: 'lowerCase', example: '{{lowerCase entityName}}' },
  { name: 'pluralize', example: '{{pluralize entityName}}' },
  { name: 'each', example: '{{#each fields}}{{name}}{{/each}}' },
  { name: 'if', example: '{{#if condition}}content{{/if}}' },
  { name: 'unless', example: '{{#unless condition}}content{{/unless}}' }
]

const testExamples = [
  {
    name: '用户实体',
    description: '用户管理相关的实体数据',
    data: {
      entityName: 'User',
      entityNameCamel: 'user',
      entityNameKebab: 'user',
      entityNameSnake: 'user',
      tableName: 'users',
      packageName: 'com.example.user',
      description: '用户实体',
      fields: [
        { name: 'id', type: 'string', isPrimary: true, isRequired: true },
        { name: 'username', type: 'string', isRequired: true, isUnique: true, length: 50 },
        { name: 'email', type: 'string', isRequired: true, isUnique: true },
        { name: 'password', type: 'string', isRequired: true },
        { name: 'avatar', type: 'string', isRequired: false },
        { name: 'status', type: 'number', isRequired: true, defaultValue: 1 },
        { name: 'createdAt', type: 'datetime', isRequired: true },
        { name: 'updatedAt', type: 'datetime', isRequired: true }
      ],
      relations: [
        { name: 'posts', type: 'ONE_TO_MANY', targetEntity: 'Post' },
        { name: 'profile', type: 'ONE_TO_ONE', targetEntity: 'UserProfile' }
      ]
    }
  },
  {
    name: '文章实体',
    description: '博客文章相关的实体数据',
    data: {
      entityName: 'Post',
      entityNameCamel: 'post',
      entityNameKebab: 'post',
      entityNameSnake: 'post',
      tableName: 'posts',
      packageName: 'com.example.blog',
      description: '文章实体',
      fields: [
        { name: 'id', type: 'string', isPrimary: true, isRequired: true },
        { name: 'title', type: 'string', isRequired: true, length: 200 },
        { name: 'content', type: 'text', isRequired: true },
        { name: 'summary', type: 'string', isRequired: false, length: 500 },
        { name: 'status', type: 'string', isRequired: true, defaultValue: 'draft' },
        { name: 'publishedAt', type: 'datetime', isRequired: false },
        { name: 'userId', type: 'string', isRequired: true },
        { name: 'categoryId', type: 'string', isRequired: true }
      ],
      relations: [
        { name: 'user', type: 'MANY_TO_ONE', targetEntity: 'User' },
        { name: 'category', type: 'MANY_TO_ONE', targetEntity: 'Category' },
        { name: 'tags', type: 'MANY_TO_MANY', targetEntity: 'Tag' }
      ]
    }
  },
  {
    name: '订单实体',
    description: '电商订单相关的实体数据',
    data: {
      entityName: 'Order',
      entityNameCamel: 'order',
      entityNameKebab: 'order',
      entityNameSnake: 'order',
      tableName: 'orders',
      packageName: 'com.example.order',
      description: '订单实体',
      fields: [
        { name: 'id', type: 'string', isPrimary: true, isRequired: true },
        { name: 'orderNo', type: 'string', isRequired: true, isUnique: true, length: 32 },
        { name: 'userId', type: 'string', isRequired: true },
        { name: 'totalAmount', type: 'decimal', isRequired: true },
        { name: 'status', type: 'string', isRequired: true, defaultValue: 'pending' },
        { name: 'paymentMethod', type: 'string', isRequired: false },
        { name: 'shippingAddress', type: 'text', isRequired: true },
        { name: 'remark', type: 'text', isRequired: false }
      ],
      relations: [
        { name: 'user', type: 'MANY_TO_ONE', targetEntity: 'User' },
        { name: 'orderItems', type: 'ONE_TO_MANY', targetEntity: 'OrderItem' },
        { name: 'payment', type: 'ONE_TO_ONE', targetEntity: 'Payment' }
      ]
    }
  }
]

// 表格配置
const columns = [
  {
    title: '模板名称',
    dataIndex: 'name',
    key: 'name',
    width: 200,
    sorter: true
  },
  {
    title: '分类',
    dataIndex: 'category',
    key: 'category',
    width: 100,
    filters: [
      { text: '实体', value: 'entity' },
      { text: '服务', value: 'service' },
      { text: '控制器', value: 'controller' },
      { text: 'DTO', value: 'dto' },
      { text: '模块', value: 'module' },
      { text: '测试', value: 'test' }
    ]
  },
  {
    title: '框架',
    dataIndex: 'framework',
    key: 'framework',
    width: 120,
    filters: [
      { text: 'NestJS', value: 'nestjs' },
      { text: 'Spring Boot', value: 'spring-boot' },
      { text: 'Express', value: 'express' },
      { text: 'Django', value: 'django' },
      { text: '通用', value: 'universal' }
    ]
  },
  {
    title: '版本',
    dataIndex: 'version',
    key: 'version',
    width: 80
  },
  {
    title: '状态',
    dataIndex: 'status',
    key: 'status',
    width: 100,
    filters: [
      { text: '启用', value: 'active' },
      { text: '禁用', value: 'inactive' },
      { text: '草稿', value: 'draft' }
    ]
  },
  {
    title: '使用次数',
    dataIndex: 'usageCount',
    key: 'usage',
    width: 120,
    sorter: true
  },
  {
    title: '更新时间',
    dataIndex: 'updatedAt',
    key: 'updatedAt',
    width: 150,
    sorter: true
  },
  {
    title: '操作',
    key: 'actions',
    width: 200,
    fixed: 'right'
  }
]

const pagination = reactive({
  current: 1,
  pageSize: 20,
  total: 0,
  showSizeChanger: true,
  showQuickJumper: true,
  showTotal: (total: number) => `共 ${total} 条记录`
})

const rowSelection = {
  selectedRowKeys: selectedTemplateIds,
  onChange: (selectedRowKeys: string[]) => {
    selectedTemplateIds.value = selectedRowKeys
  }
}

// 计算属性
const filteredTemplates = computed(() => {
  let filtered = templates.value

  if (searchText.value) {
    const search = searchText.value.toLowerCase()
    filtered = filtered.filter(template =>
      template.name.toLowerCase().includes(search) ||
      template.description?.toLowerCase().includes(search)
    )
  }

  if (categoryFilter.value) {
    filtered = filtered.filter(template => template.category === categoryFilter.value)
  }

  if (frameworkFilter.value) {
    filtered = filtered.filter(template => template.framework === frameworkFilter.value)
  }

  if (statusFilter.value) {
    filtered = filtered.filter(template => template.status === statusFilter.value)
  }

  return filtered
})

const activeTemplatesCount = computed(() => {
  return templates.value.filter(t => t.status === 'active').length
})

const monthlyNewCount = computed(() => {
  const oneMonthAgo = new Date()
  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1)
  return templates.value.filter(t => new Date(t.createdAt) > oneMonthAgo).length
})

const totalUsageCount = computed(() => {
  return templates.value.reduce((total, t) => total + (t.usageCount || 0), 0)
})

// 初始化
onMounted(() => {
  loadTemplates()
})

// 数据加载
const loadTemplates = async () => {
  loading.value = true
  try {
    // const response = await api.getTemplates()
    // templates.value = response.data.options
    // pagination.total = response.data.total

    // 模拟数据
    templates.value = [
      {
        id: '1',
        name: 'NestJS Entity Template',
        description: 'NestJS实体模板，支持TypeORM装饰器',
        category: 'entity',
        framework: 'nestjs',
        version: '1.2.0',
        status: 'active',
        usageCount: 156,
        createdAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-02-20T15:30:00Z',
        content: `import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('{{tableName}}')
export class {{entityName}} {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  {{#each fields}}
  @Column({{#if options}}{{{options}}}{{/if}})
  {{name}}: {{type}};

  {{/each}}
}`
      },
      {
        id: '2',
        name: 'NestJS Service Template',
        description: 'NestJS服务模板，包含CRUD操作',
        category: 'service',
        framework: 'nestjs',
        version: '1.1.0',
        status: 'active',
        usageCount: 89,
        createdAt: '2024-01-20T14:00:00Z',
        updatedAt: '2024-02-18T09:15:00Z',
        content: `import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { {{entityName}} } from './{{entityNameKebab}}.entity';

@Injectable()
export class {{entityName}}Service {
  constructor(
    @InjectRepository({{entityName}})
    private readonly {{entityNameCamel}}Repository: Repository<{{entityName}}>,
  ) {}

  async create(data: any): Promise<{{entityName}}> {
    const entity = this.{{entityNameCamel}}Repository.create(data);
    return this.{{entityNameCamel}}Repository.save(entity);
  }

  async findAll(): Promise<{{entityName}}[]> {
    return this.{{entityNameCamel}}Repository.find();
  }

  async findOne(id: string): Promise<{{entityName}}> {
    return this.{{entityNameCamel}}Repository.findOne({ where: { id } });
  }

  async update(id: string, data: any): Promise<{{entityName}}> {
    await this.{{entityNameCamel}}Repository.update(id, data);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    await this.{{entityNameCamel}}Repository.delete(id);
  }
}`
      },
      {
        id: '3',
        name: 'Spring Boot Entity Template',
        description: 'Spring Boot JPA实体模板',
        category: 'entity',
        framework: 'spring-boot',
        version: '1.0.0',
        status: 'active',
        usageCount: 45,
        createdAt: '2024-02-01T11:00:00Z',
        updatedAt: '2024-02-15T16:45:00Z',
        content: `package {{packageName}}.entity;

import javax.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "{{tableName}}")
public class {{entityName}} {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    {{#each fields}}
    @Column(name = "{{snakeCase name}}")
    private {{javaType type}} {{name}};
    
    {{/each}}
    
    @Column(name = "created_at")
    private LocalDateTime createdAt;
    
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    // Constructors, getters and setters
}`
      }
    ]
    pagination.total = templates.value.length
  } catch (error) {
    message.error('加载模板失败')
    console.error(error)
  } finally {
    loading.value = false
  }
}

// 工具函数
const getCategoryColor = (category: string) => {
  const colors = {
    entity: 'blue',
    service: 'green',
    controller: 'orange',
    dto: 'purple',
    module: 'cyan',
    test: 'red'
  }
  return colors[category] || 'default'
}

const getCategoryLabel = (category: string) => {
  const labels = {
    entity: '实体',
    service: '服务',
    controller: '控制器',
    dto: 'DTO',
    module: '模块',
    test: '测试'
  }
  return labels[category] || category
}

const getFrameworkColor = (framework: string) => {
  const colors = {
    nestjs: 'red',
    'spring-boot': 'green',
    express: 'blue',
    django: 'orange',
    universal: 'gray'
  }
  return colors[framework] || 'default'
}

const getFrameworkLabel = (framework: string) => {
  const labels = {
    nestjs: 'NestJS',
    'spring-boot': 'Spring Boot',
    express: 'Express',
    django: 'Django',
    universal: '通用'
  }
  return labels[framework] || framework
}

const getStatusColor = (status: string) => {
  const colors = {
    active: 'green',
    inactive: 'red',
    draft: 'orange'
  }
  return colors[status] || 'default'
}

const getStatusLabel = (status: string) => {
  const labels = {
    active: '启用',
    inactive: '禁用',
    draft: '草稿'
  }
  return labels[status] || status
}

const getUsagePercent = (usageCount: number) => {
  const maxUsage = Math.max(...templates.value.map(t => t.usageCount || 0))
  return maxUsage > 0 ? Math.round((usageCount / maxUsage) * 100) : 0
}

const getTemplateIcon = (category: string) => {
  const icons = {
    entity: DatabaseOutlined,
    service: ApiOutlined,
    controller: ControlOutlined,
    dto: FileTextOutlined,
    module: AppstoreAddOutlined,
    test: BugOutlined
  }
  return icons[category] || FileTextOutlined
}

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString()
}

// 模板操作
const showCreateModal = () => {
  editingTemplate.value = {
    name: '',
    description: '',
    category: 'entity',
    framework: 'nestjs',
    version: '1.0.0',
    status: 'draft',
    content: ''
  }
  modalVisible.value = true
}

const viewTemplate = (template: any) => {
  viewingTemplate.value = template
  viewModalVisible.value = true
}

const editTemplate = (template: any) => {
  editingTemplate.value = { ...template }
  modalVisible.value = true
}

const duplicateTemplate = (template: any) => {
  editingTemplate.value = {
    ...template,
    id: undefined,
    name: `${template.name} (副本)`,
    version: '1.0.0',
    status: 'draft',
    usageCount: 0
  }
  modalVisible.value = true
}

const testTemplate = (template: any) => {
  testingTemplate.value = template
  testData.value = JSON.stringify({
    entityName: 'User',
    entityNameCamel: 'user',
    entityNameKebab: 'user',
    tableName: 'users',
    fields: [
      { name: 'username', type: 'string', options: '{ length: 50 }' },
      { name: 'email', type: 'string', options: '{ unique: true }' },
      { name: 'age', type: 'number' }
    ]
  }, null, 2)
  testResult.value = ''
  testModalVisible.value = true
}

const toggleTemplateStatus = async (template: any) => {
  try {
    const newStatus = template.status === 'active' ? 'inactive' : 'active'
    // await api.updateTemplate(template.id, { status: newStatus })
    
    template.status = newStatus
    message.success(`模板已${newStatus === 'active' ? '启用' : '禁用'}`)
  } catch (error) {
    message.error('操作失败')
    console.error(error)
  }
}

const exportTemplate = (template: any) => {
  const dataStr = JSON.stringify(template, null, 2)
  const blob = new Blob([dataStr], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${template.name}.json`
  a.click()
  URL.revokeObjectURL(url)
  message.success('模板导出成功')
}

const deleteTemplate = async (templateId: string) => {
  try {
    // await api.deleteTemplate(templateId)
    
    const index = templates.value.findIndex(t => t.id === templateId)
    if (index > -1) {
      templates.value.splice(index, 1)
    }
    message.success('模板删除成功')
  } catch (error) {
    message.error('删除失败')
    console.error(error)
  }
}

// 表格操作
const handleTableChange = (pag: any, filters: any, sorter: any) => {
  pagination.current = pag.current
  pagination.pageSize = pag.pageSize
  // 这里可以添加排序和过滤逻辑
}

// 卡片操作
const selectTemplate = (templateId: string) => {
  const index = selectedTemplateIds.value.indexOf(templateId)
  if (index > -1) {
    selectedTemplateIds.value.splice(index, 1)
  } else {
    selectedTemplateIds.value.push(templateId)
  }
}

// 批量操作
const batchEnable = async () => {
  try {
    // await api.batchUpdateTemplates(selectedTemplateIds.value, { status: 'active' })
    
    selectedTemplateIds.value.forEach(id => {
      const template = templates.value.find(t => t.id === id)
      if (template) template.status = 'active'
    })
    selectedTemplateIds.value = []
    message.success('批量启用成功')
  } catch (error) {
    message.error('批量启用失败')
    console.error(error)
  }
}

const batchDisable = async () => {
  try {
    // await api.batchUpdateTemplates(selectedTemplateIds.value, { status: 'inactive' })
    
    selectedTemplateIds.value.forEach(id => {
      const template = templates.value.find(t => t.id === id)
      if (template) template.status = 'inactive'
    })
    selectedTemplateIds.value = []
    message.success('批量禁用成功')
  } catch (error) {
    message.error('批量禁用失败')
    console.error(error)
  }
}

const batchExport = () => {
  const selectedTemplates = templates.value.filter(t => selectedTemplateIds.value.includes(t.id))
  const dataStr = JSON.stringify(selectedTemplates, null, 2)
  const blob = new Blob([dataStr], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `templates_${Date.now()}.json`
  a.click()
  URL.revokeObjectURL(url)
  message.success('批量导出成功')
}

const batchDelete = async () => {
  try {
    // await api.batchDeleteTemplates(selectedTemplateIds.value)
    
    templates.value = templates.value.filter(t => !selectedTemplateIds.value.includes(t.id))
    selectedTemplateIds.value = []
    message.success('批量删除成功')
  } catch (error) {
    message.error('批量删除失败')
    console.error(error)
  }
}

// 导入导出
const importTemplate = () => {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = '.json'
  input.onchange = (e: any) => {
    const file = e.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e: any) => {
        try {
          const importedTemplates = JSON.parse(e.target.result)
          if (Array.isArray(importedTemplates)) {
            templates.value.push(...importedTemplates)
          } else {
            templates.value.push(importedTemplates)
          }
          message.success('模板导入成功')
        } catch (error) {
          message.error('导入文件格式错误')
        }
      }
      reader.readAsText(file)
    }
  }
  input.click()
}

const exportTemplates = () => {
  const dataStr = JSON.stringify(templates.value, null, 2)
  const blob = new Blob([dataStr], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `all_templates_${Date.now()}.json`
  a.click()
  URL.revokeObjectURL(url)
  message.success('模板导出成功')
}

// 模板编辑相关方法
const saveTemplate = async () => {
  try {
    await formRef.value.validate()

    if (editingTemplate.value.id) {
      // 更新模板
      const index = templates.value.findIndex(t => t.id === editingTemplate.value.id)
      if (index > -1) {
        templates.value[index] = {
          ...editingTemplate.value,
          updatedAt: new Date().toISOString()
        }
      }
      message.success('模板更新成功')
    } else {
      // 新建模板
      const newTemplate = {
        ...editingTemplate.value,
        id: Date.now().toString(),
        usageCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      templates.value.unshift(newTemplate)
      message.success('模板创建成功')
    }

    modalVisible.value = false
    editingTemplate.value = {}
  } catch (error) {
    console.error('保存模板失败:', error)
  }
}

const cancelEdit = () => {
  modalVisible.value = false
  editingTemplate.value = {}
}

// 模板编辑器相关方法
const insertVariable = () => {
  const select = document.createElement('select')
  availableVariables.forEach(variable => {
    const option = document.createElement('option')
    option.value = `{{${variable}}}`
    option.text = variable
    select.appendChild(option)
  })

  // 这里可以实现一个变量选择器弹窗
  message.info('请从帮助面板中选择变量')
}

const insertHelper = () => {
  message.info('请从帮助面板中选择辅助函数')
}

const insertText = (text: string) => {
  const textarea = templateEditor.value
  if (textarea) {
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const content = editingTemplate.value.content || ''

    editingTemplate.value.content =
      content.substring(0, start) +
      text +
      content.substring(end)

    // 设置光标位置
    setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(start + text.length, start + text.length)
    }, 0)
  }
}

const formatTemplate = () => {
  try {
    // 简单的格式化逻辑
    let content = editingTemplate.value.content || ''

    // 格式化缩进
    const lines = content.split('\n')
    let indentLevel = 0
    const formattedLines = lines.map(line => {
      const trimmed = line.trim()

      if (trimmed.includes('{{#') && !trimmed.includes('{{/')) {
        const result = '  '.repeat(indentLevel) + trimmed
        indentLevel++
        return result
      } else if (trimmed.includes('{{/')) {
        indentLevel = Math.max(0, indentLevel - 1)
        return '  '.repeat(indentLevel) + trimmed
      } else {
        return '  '.repeat(indentLevel) + trimmed
      }
    })

    editingTemplate.value.content = formattedLines.join('\n')
    message.success('模板格式化完成')
  } catch (error) {
    message.error('格式化失败')
  }
}

const validateTemplate = () => {
  try {
    const content = editingTemplate.value.content || ''

    // 简单的语法验证
    const openTags = content.match(/\{\{#\w+/g) || []
    const closeTags = content.match(/\{\{\/\w+/g) || []

    if (openTags.length !== closeTags.length) {
      message.error('模板语法错误：标签不匹配')
      return
    }

    // 检查变量语法
    const variables = content.match(/\{\{[^#\/][^}]*\}\}/g) || []
    const invalidVariables = variables.filter(v => !v.match(/^\{\{[\w\s.()]+\}\}$/))

    if (invalidVariables.length > 0) {
      message.error(`模板语法错误：无效变量 ${invalidVariables.join(', ')}`)
      return
    }

    message.success('模板语法验证通过')
  } catch (error) {
    message.error('验证失败')
  }
}

const handleEditorKeydown = (e: KeyboardEvent) => {
  // Tab键缩进
  if (e.key === 'Tab') {
    e.preventDefault()
    insertText('  ')
  }

  // Ctrl+S 保存
  if (e.ctrlKey && e.key === 's') {
    e.preventDefault()
    saveTemplate()
  }
}

// 模板查看相关方法
const copyTemplateContent = () => {
  if (viewingTemplate.value?.content) {
    navigator.clipboard.writeText(viewingTemplate.value.content)
    message.success('模板内容已复制到剪贴板')
  }
}

// 模板测试相关方法
const runTest = async () => {
  if (!testingTemplate.value || !testData.value) {
    message.warning('请输入测试数据')
    return
  }

  testLoading.value = true
  testError.value = ''
  testResult.value = ''

  try {
    // 解析测试数据
    const data = JSON.parse(testData.value)

    // 模拟模板渲染
    let result = testingTemplate.value.content

    // 简单的变量替换
    Object.keys(data).forEach(key => {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g')
      result = result.replace(regex, data[key])
    })

    // 处理数组循环
    const eachMatches = result.match(/\{\{#each\s+(\w+)\}\}([\s\S]*?)\{\{\/each\}\}/g)
    if (eachMatches) {
      eachMatches.forEach(match => {
        const arrayMatch = match.match(/\{\{#each\s+(\w+)\}\}([\s\S]*?)\{\{\/each\}\}/)
        if (arrayMatch) {
          const arrayName = arrayMatch[1]
          const template = arrayMatch[2]
          const arrayData = data[arrayName]

          if (Array.isArray(arrayData)) {
            const renderedItems = arrayData.map(item => {
              let itemResult = template
              Object.keys(item).forEach(prop => {
                const propRegex = new RegExp(`\\{\\{${prop}\\}\\}`, 'g')
                itemResult = itemResult.replace(propRegex, item[prop])
              })
              return itemResult
            })
            result = result.replace(match, renderedItems.join(''))
          }
        }
      })
    }

    // 处理条件语句
    const ifMatches = result.match(/\{\{#if\s+(\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g)
    if (ifMatches) {
      ifMatches.forEach(match => {
        const conditionMatch = match.match(/\{\{#if\s+(\w+)\}\}([\s\S]*?)\{\{\/if\}\}/)
        if (conditionMatch) {
          const condition = conditionMatch[1]
          const content = conditionMatch[2]
          const conditionValue = data[condition]

          result = result.replace(match, conditionValue ? content : '')
        }
      })
    }

    // 处理辅助函数
    const helperMatches = result.match(/\{\{(\w+)\s+([^}]+)\}\}/g)
    if (helperMatches) {
      helperMatches.forEach(match => {
        const helperMatch = match.match(/\{\{(\w+)\s+([^}]+)\}\}/)
        if (helperMatch) {
          const helperName = helperMatch[1]
          const helperArg = helperMatch[2]

          let helperResult = helperArg
          switch (helperName) {
            case 'camelCase':
              helperResult = helperArg.charAt(0).toLowerCase() + helperArg.slice(1)
              break
            case 'pascalCase':
              helperResult = helperArg.charAt(0).toUpperCase() + helperArg.slice(1)
              break
            case 'kebabCase':
              helperResult = helperArg.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase()
              break
            case 'snakeCase':
              helperResult = helperArg.replace(/([a-z])([A-Z])/g, '$1_$2').toLowerCase()
              break
            case 'upperCase':
              helperResult = helperArg.toUpperCase()
              break
            case 'lowerCase':
              helperResult = helperArg.toLowerCase()
              break
            case 'pluralize':
              helperResult = helperArg.endsWith('y') ?
                helperArg.slice(0, -1) + 'ies' :
                helperArg + 's'
              break
          }

          result = result.replace(match, helperResult)
        }
      })
    }

    testResult.value = result
    message.success('模板测试完成')
  } catch (error) {
    testError.value = error.message
    message.error('测试失败：' + error.message)
  } finally {
    testLoading.value = false
  }
}

const loadSampleData = () => {
  testData.value = JSON.stringify({
    entityName: 'User',
    entityNameCamel: 'user',
    entityNameKebab: 'user',
    tableName: 'users',
    fields: [
      { name: 'id', type: 'string' },
      { name: 'username', type: 'string' },
      { name: 'email', type: 'string' }
    ]
  }, null, 2)
}

const loadExampleData = (example: any) => {
  testData.value = JSON.stringify(example.data, null, 2)
  message.success(`已加载${example.name}示例数据`)
}

const clearTestData = () => {
  testData.value = ''
  testResult.value = ''
  testError.value = ''
}

const formatTestData = () => {
  try {
    const data = JSON.parse(testData.value)
    testData.value = JSON.stringify(data, null, 2)
    message.success('数据格式化完成')
  } catch (error) {
    message.error('数据格式错误')
  }
}

const copyTestResult = () => {
  if (testResult.value) {
    navigator.clipboard.writeText(testResult.value)
    message.success('测试结果已复制到剪贴板')
  }
}

const downloadTestResult = () => {
  if (testResult.value) {
    const blob = new Blob([testResult.value], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `test_result_${Date.now()}.txt`
    a.click()
    URL.revokeObjectURL(url)
    message.success('测试结果下载成功')
  }
}
</script>

<style scoped>
.template-manager {
  padding: 24px;
  background: #f0f2f5;
  min-height: 100vh;
}

.manager-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding: 20px 24px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.header-left h2 {
  margin: 0 0 8px 0;
  color: #262626;
}

.header-right {
  display: flex;
  gap: 12px;
}

.filters-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding: 16px 24px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.filters-left {
  display: flex;
  gap: 12px;
  align-items: center;
}

.stats-section {
  margin-bottom: 16px;
  padding: 20px 24px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.table-view,
.card-view {
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  overflow: hidden;
}

.table-view {
  padding: 24px;
}

.card-view {
  padding: 24px;
}

.template-name-cell {
  display: flex;
  flex-direction: column;
}

.template-name {
  font-weight: 500;
  color: #1890ff;
  margin-bottom: 4px;
}

.template-desc {
  color: #8c8c8c;
  font-size: 12px;
}

.usage-cell {
  display: flex;
  align-items: center;
}

.usage-count {
  font-weight: 500;
  color: #262626;
}

.template-card {
  cursor: pointer;
  transition: all 0.3s ease;
  border: 2px solid transparent;
}

.template-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0,0,0,0.15);
}

.template-card.selected {
  border-color: #1890ff;
}

.card-cover {
  height: 120px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 16px;
  position: relative;
}

.template-icon {
  color: #fff;
  font-size: 32px;
  text-align: center;
}

.template-badges {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}

.card-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.template-name {
  font-weight: 500;
  color: #262626;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.status-tag {
  margin-left: 8px;
}

.card-description {
  height: 80px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.template-desc {
  color: #8c8c8c;
  font-size: 12px;
  line-height: 1.4;
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.template-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 11px;
  color: #8c8c8c;
}

.batch-actions {
  position: fixed;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);
  background: #fff;
  padding: 12px 24px;
  border-radius: 8px;
  box-shadow: 0 4px 16px rgba(0,0,0,0.15);
  display: flex;
  align-items: center;
  gap: 16px;
  z-index: 1000;
}

.batch-info {
  color: #262626;
  font-weight: 500;
}

.batch-buttons {
  display: flex;
  gap: 8px;
}

/* 模板编辑器样式 */
.template-editor {
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  overflow: hidden;
}

.editor-toolbar {
  padding: 8px 12px;
  background: #fafafa;
  border-bottom: 1px solid #d9d9d9;
}

.editor-content {
  position: relative;
}

.template-textarea {
  width: 100%;
  height: 400px;
  border: none;
  outline: none;
  resize: vertical;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 14px;
  line-height: 1.5;
  padding: 16px;
  background: #f8f8f8;
}

.editor-help {
  border-top: 1px solid #d9d9d9;
}

.help-content {
  padding: 8px;
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.help-content .ant-tag {
  cursor: pointer;
  margin: 2px;
}

.help-content .ant-tag:hover {
  background: #1890ff;
  color: #fff;
}

/* 模板详情样式 */
.template-detail {
  max-height: 70vh;
  overflow-y: auto;
}

.template-content {
  margin-top: 24px;
}

.content-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.content-header h4 {
  margin: 0;
  color: #262626;
}

.content-body {
  background: #f8f8f8;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  max-height: 400px;
  overflow: auto;
}

.content-body pre {
  margin: 0;
  padding: 16px;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 13px;
  line-height: 1.5;
}

/* 模板测试样式 */
.template-test {
  max-height: 80vh;
  overflow-y: auto;
}

.test-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 16px;
  border-bottom: 1px solid #f0f0f0;
}

.test-header h3 {
  margin: 0;
  color: #262626;
}

.test-content {
  margin-bottom: 24px;
}

.test-panel {
  height: 500px;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: #fafafa;
  border-bottom: 1px solid #d9d9d9;
}

.panel-header h4 {
  margin: 0;
  color: #262626;
  font-size: 14px;
}

.panel-content {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.test-textarea {
  flex: 1;
  width: 100%;
  border: none;
  outline: none;
  resize: none;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 13px;
  line-height: 1.5;
  padding: 16px;
  background: #f8f8f8;
}

.test-result {
  flex: 1;
  overflow: auto;
  background: #f8f8f8;
}

.test-result pre {
  margin: 0;
  padding: 16px;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 13px;
  line-height: 1.5;
  white-space: pre-wrap;
  word-wrap: break-word;
}

.test-error {
  padding: 16px;
}

.test-placeholder {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #8c8c8c;
}

.test-examples {
  margin-top: 24px;
  padding-top: 24px;
  border-top: 1px solid #f0f0f0;
}

.test-examples h4 {
  margin-bottom: 16px;
  color: #262626;
}

.example-card {
  cursor: pointer;
  transition: all 0.2s ease;
}

.example-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}

.example-card .ant-card-meta-title {
  font-size: 14px;
  font-weight: 500;
}

.example-card .ant-card-meta-description {
  font-size: 12px;
  color: #8c8c8c;
}
</style>
