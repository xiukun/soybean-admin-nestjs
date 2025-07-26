<template>
  <div class="code-generator">
    <!-- 头部工具栏 -->
    <div class="generator-header">
      <div class="header-left">
        <NBreadcrumb>
          <NBreadcrumbItem>
            <router-link to="/lowcode/projects">项目管理</router-link>
          </NBreadcrumbItem>
          <NBreadcrumbItem>
            <router-link :to="`/lowcode/projects/${projectId}`">{{ projectInfo?.name }}</router-link>
          </NBreadcrumbItem>
          <NBreadcrumbItem>代码生成</NBreadcrumbItem>
        </NBreadcrumb>
      </div>
      <div class="header-right">
        <NButton @click="refreshData">
          <template #icon>
            <NIcon><icon-mdi-refresh /></NIcon>
          </template>
          刷新
        </NButton>
        <NButton type="primary" @click="batchGenerate" :disabled="selectedEntities.length === 0">
          <template #icon>
            <NIcon><icon-mdi-lightning-bolt /></NIcon>
          </template>
          批量生成 ({{ selectedEntities.length }})
        </NButton>
      </div>
    </div>

    <!-- 主要内容区域 -->
    <div class="generator-content">
      <!-- 左侧实体列表 -->
      <div class="entities-panel">
        <div class="panel-header">
          <h3>实体列表</h3>
          <NButton text size="small" @click="selectAllEntities">
            {{ selectedEntities.length === entities.length ? '取消全选' : '全选' }}
          </NButton>
        </div>

        <div class="entities-list">
          <div class="search-box">
            <NInput
              v-model:value="entitySearchText"
              placeholder="搜索实体..."
              clearable
            >
              <template #prefix>
                <NIcon><icon-mdi-magnify /></NIcon>
              </template>
            </NInput>
          </div>
          
          <div class="entity-items">
            <div
              v-for="entity in filteredEntities"
              :key="entity.id"
              class="entity-item"
              :class="{ 
                selected: selectedEntities.includes(entity.id),
                active: currentEntity?.id === entity.id 
              }"
              @click="selectEntity(entity)"
            >
              <div class="entity-checkbox">
                <NCheckbox
                  :checked="selectedEntities.includes(entity.id)"
                  @update:checked="toggleEntitySelection(entity.id)"
                  @click.stop
                />
              </div>
              <div class="entity-info">
                <div class="entity-name">{{ entity.name }}</div>
                <div class="entity-desc">{{ entity.description || entity.tableName }}</div>
                <div class="entity-stats">
                  <NTag size="small">{{ entity.fields?.length || 0 }} 字段</NTag>
                  <NTag size="small" type="info">{{ getEntityRelationsCount(entity.id) }} 关系</NTag>
                </div>
              </div>
              <div class="entity-actions">
                <NButton text size="small" @click.stop="generateSingleEntity(entity)">
                  <template #icon>
                    <NIcon><icon-mdi-code-tags /></NIcon>
                  </template>
                </NButton>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 中间配置面板 -->
      <div class="config-panel">
        <NTabs v-model:value="activeConfigTab" type="card">
          <!-- 生成配置 -->
          <NTabPane name="generation" tab="生成配置">
            <div class="config-section">
              <h4>框架选择</h4>
              <NRadioGroup v-model:value="generationConfig.framework" @update:value="onFrameworkChange">
                <NRadioButton value="nestjs">NestJS</NRadioButton>
                <NRadioButton value="spring-boot">Spring Boot</NRadioButton>
                <NRadioButton value="express">Express</NRadioButton>
                <NRadioButton value="django">Django</NRadioButton>
              </NRadioGroup>
            </div>

            <div class="config-section">
              <h4>数据库类型</h4>
              <NSelect
                v-model:value="generationConfig.database"
                style="width: 200px"
                :options="databaseOptions"
              />
            </div>

            <div class="config-section">
              <h4>ORM框架</h4>
              <NSelect
                v-model:value="generationConfig.orm"
                style="width: 200px"
                :options="ormOptions"
              />
            </div>

            <div class="config-section">
              <h4>生成选项</h4>
              <NSpace vertical>
                <NCheckbox v-model:checked="generationConfig.features.swagger">
                  Swagger API 文档
                </NCheckbox>
                <NCheckbox v-model:checked="generationConfig.features.validation">
                  数据验证
                </NCheckbox>
                <NCheckbox v-model:checked="generationConfig.features.authentication">
                  身份认证
                </NCheckbox>
                <NCheckbox v-model:checked="generationConfig.features.caching">
                  缓存支持
                </NCheckbox>
                <NCheckbox v-model:checked="generationConfig.features.testing">
                  单元测试
                </NCheckbox>
                <NCheckbox v-model:checked="generationConfig.features.pagination">
                  分页查询
                </NCheckbox>
              </NSpace>
            </div>

            <div class="config-section">
              <h4>命名规范</h4>
              <NForm label-placement="top">
                <NFormItem label="命名约定">
                  <NSelect
                    v-model:value="generationConfig.naming.convention"
                    :options="namingConventionOptions"
                  />
                </NFormItem>
                <NFormItem label="类名前缀">
                  <NInput v-model:value="generationConfig.naming.prefix" placeholder="可选" />
                </NFormItem>
                <NFormItem label="类名后缀">
                  <NInput v-model:value="generationConfig.naming.suffix" placeholder="可选" />
                </NFormItem>
              </NForm>
            </div>

            <div class="config-section">
              <h4>输出配置</h4>
              <NForm label-placement="top">
                <NFormItem label="输出目录">
                  <NInput v-model:value="generationConfig.output.baseDir" placeholder="./generated" />
                </NFormItem>
                <NFormItem label="生成层级">
                  <NCheckboxGroup v-model:value="generationConfig.layers">
                    <NCheckbox value="base">Base层 (基础代码)</NCheckbox>
                    <NCheckbox value="biz">Biz层 (业务代码)</NCheckbox>
                  </NCheckboxGroup>
                </NFormItem>
              </NForm>
            </div>
          </NTabPane>

          <!-- 模板选择 -->
          <NTabPane name="templates" tab="模板选择">
            <div class="templates-section">
              <div class="templates-filter">
                <NInput
                  v-model:value="templateSearchText"
                  placeholder="搜索模板..."
                  style="width: 200px"
                >
                  <template #prefix>
                    <NIcon><icon-mdi-magnify /></NIcon>
                  </template>
                </NInput>
                <NSelect
                  v-model:value="templateCategoryFilter"
                  style="width: 150px"
                  placeholder="分类筛选"
                  :options="templateCategoryOptions"
                />
              </div>

              <div class="templates-list">
                <div
                  v-for="template in filteredTemplates"
                  :key="template.id"
                  class="template-item"
                  :class="{ selected: selectedTemplates.includes(template.id) }"
                  @click="toggleTemplateSelection(template.id)"
                >
                  <div class="template-checkbox">
                    <NCheckbox
                      :checked="selectedTemplates.includes(template.id)"
                      @click.stop
                    />
                  </div>
                  <div class="template-info">
                    <div class="template-name">{{ template.name }}</div>
                    <div class="template-desc">{{ template.description }}</div>
                    <div class="template-meta">
                      <NTag size="small" :type="getCategoryColor(template.category)">
                        {{ template.category }}
                      </NTag>
                      <NTag size="small">{{ template.framework }}</NTag>
                      <span class="template-version">v{{ template.version }}</span>
                    </div>
                  </div>
                  <div class="template-actions">
                    <NButton text size="small" @click.stop="previewTemplate(template)">
                      <template #icon>
                        <NIcon><icon-mdi-eye /></NIcon>
                      </template>
                    </NButton>
                  </div>
                </div>
              </div>
            </div>
          </NTabPane>

          <!-- 预览配置 -->
          <NTabPane name="preview" tab="预览配置">
            <div class="preview-section">
              <div class="preview-entity-select">
                <h4>选择预览实体</h4>
                <NSelect
                  v-model:value="previewEntityId"
                  style="width: 100%"
                  placeholder="选择要预览的实体"
                  :options="entityOptions"
                  @update:value="generatePreview"
                />
              </div>

              <div class="preview-templates" v-if="previewEntityId">
                <h4>模板预览</h4>
                <NTabs v-model:value="activePreviewTab" type="card" size="small">
                  <NTabPane
                    v-for="template in selectedTemplateObjects"
                    :key="template.id"
                    :name="template.id"
                    :tab="template.name"
                  >
                    <div class="preview-content">
                      <div class="preview-header">
                        <span>{{ template.name }} - {{ getPreviewEntityName() }}</span>
                        <NButton size="small" @click="copyPreviewCode(template.id)">
                          <template #icon>
                            <NIcon><icon-mdi-content-copy /></NIcon>
                          </template>
                          复制代码
                        </NButton>
                      </div>
                      <div class="preview-code">
                        <pre><code>{{ getPreviewCode(template.id) }}</code></pre>
                      </div>
                    </div>
                  </NTabPane>
                </NTabs>
              </div>
            </div>
          </NTabPane>
        </NTabs>
      </div>

      <!-- 右侧生成结果 -->
      <div class="results-panel">
        <div class="panel-header">
          <h3>生成结果</h3>
          <NButton text size="small" @click="clearResults">
            清空结果
          </NButton>
        </div>

        <div class="results-content">
          <div v-if="generationResults.length === 0" class="empty-results">
            <NEmpty description="暂无生成结果" />
          </div>
          
          <div v-else class="results-list">
            <div
              v-for="result in generationResults"
              :key="result.id"
              class="result-item"
              :class="{ expanded: expandedResults.includes(result.id) }"
            >
              <div class="result-header" @click="toggleResultExpansion(result.id)">
                <div class="result-info">
                  <span class="result-entity">{{ result.entityName }}</span>
                  <span class="result-status" :class="result.status">
                    {{ getStatusText(result.status) }}
                  </span>
                </div>
                <div class="result-meta">
                  <span class="result-files">{{ result.files?.length || 0 }} 文件</span>
                  <span class="result-time">{{ formatTime(result.createdAt) }}</span>
                  <NIcon
                    class="expand-icon"
                    :class="{ expanded: expandedResults.includes(result.id) }"
                  >
                    <icon-mdi-chevron-down />
                  </NIcon>
                </div>
              </div>

              <div class="result-content" v-if="expandedResults.includes(result.id)">
                <div class="result-files">
                  <div
                    v-for="file in result.files"
                    :key="file.path"
                    class="file-item"
                  >
                    <div class="file-info">
                      <span class="file-path">{{ file.path }}</span>
                      <span class="file-size">{{ formatFileSize(file.size) }}</span>
                      <NTag size="small" :type="getFileTypeColor(file.type)">
                        {{ file.type }}
                      </NTag>
                    </div>
                    <div class="file-actions">
                      <NButton text size="small" @click="showFilePreview(file)">
                        <template #icon>
                          <NIcon><icon-mdi-eye /></NIcon>
                        </template>
                      </NButton>
                      <NButton text size="small" @click="downloadFile(file)">
                        <template #icon>
                          <NIcon><icon-mdi-download /></NIcon>
                        </template>
                      </NButton>
                    </div>
                  </div>
                </div>

                <div class="result-actions">
                  <NButton size="small" @click="downloadResult(result)">
                    <template #icon>
                      <NIcon><icon-mdi-download /></NIcon>
                    </template>
                    下载全部
                  </NButton>
                  <NButton size="small" @click="regenerateResult(result)">
                    <template #icon>
                      <NIcon><icon-mdi-refresh /></NIcon>
                    </template>
                    重新生成
                  </NButton>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 文件预览弹窗 -->
    <NModal
      v-model:show="filePreviewVisible"
      title="文件预览"
      style="width: 80%"
      preset="dialog"
    >
      <div class="file-preview">
        <div class="preview-header">
          <span class="file-path">{{ previewFile?.path }}</span>
          <NButton size="small" @click="copyFileContent">
            <template #icon>
              <NIcon><icon-mdi-content-copy /></NIcon>
            </template>
            复制代码
          </NButton>
        </div>
        <div class="preview-content">
          <pre><code>{{ previewFile?.content }}</code></pre>
        </div>
      </div>
    </NModal>

    <!-- 批量生成进度弹窗 -->
    <NModal
      v-model:show="batchGenerationVisible"
      title="批量生成进度"
      :closable="false"
      :mask-closable="false"
      preset="dialog"
      :show-icon="false"
    >
      <div class="batch-progress">
        <NProgress
          :percentage="batchProgress"
          :status="batchGenerationCompleted ? 'success' : 'default'"
        />
        <div class="progress-info">
          <span>{{ batchProgressText }}</span>
        </div>
        <div class="progress-details" v-if="batchGenerationLog.length > 0">
          <div
            v-for="(log, index) in batchGenerationLog"
            :key="index"
            class="log-item"
            :class="log.type"
          >
            {{ log.message }}
          </div>
        </div>
      </div>
      <template #action>
        <NButton v-if="batchGenerationCompleted" @click="batchGenerationVisible = false">
          确定
        </NButton>
      </template>
    </NModal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'

// 选项数据
const databaseOptions = [
  { label: 'PostgreSQL', value: 'postgresql' },
  { label: 'MySQL', value: 'mysql' },
  { label: 'MongoDB', value: 'mongodb' },
  { label: 'SQLite', value: 'sqlite' }
]

const ormOptions = [
  { label: 'TypeORM', value: 'typeorm' },
  { label: 'Prisma', value: 'prisma' },
  { label: 'Sequelize', value: 'sequelize' },
  { label: 'Mongoose', value: 'mongoose' }
]

const namingConventionOptions = [
  { label: '驼峰命名', value: 'camelCase' },
  { label: '帕斯卡命名', value: 'pascalCase' },
  { label: '短横线命名', value: 'kebabCase' },
  { label: '下划线命名', value: 'snakeCase' }
]

const templateCategoryOptions = [
  { label: '全部分类', value: '' },
  { label: '实体模板', value: 'entity' },
  { label: '服务模板', value: 'service' },
  { label: '控制器模板', value: 'controller' },
  { label: 'DTO模板', value: 'dto' }
]

// 路由参数
const route = useRoute()
const projectId = computed(() => route.params.projectId as string)

// 响应式数据
const projectInfo = ref(null)
const entities = ref([])
const relations = ref([])
const templates = ref([])

// 界面状态
const activeConfigTab = ref('generation')
const activePreviewTab = ref('')
const entitySearchText = ref('')
const templateSearchText = ref('')
const templateCategoryFilter = ref('')

// 选择状态
const selectedEntities = ref([])
const selectedTemplates = ref([])
const currentEntity = ref(null)

// 生成配置
const generationConfig = reactive({
  framework: 'nestjs',
  database: 'postgresql',
  orm: 'typeorm',
  features: {
    swagger: true,
    validation: true,
    authentication: false,
    caching: false,
    testing: true,
    pagination: true
  },
  naming: {
    convention: 'camelCase',
    prefix: '',
    suffix: ''
  },
  output: {
    baseDir: './generated'
  },
  layers: ['base', 'biz']
})

// 预览相关
const previewEntityId = ref('')
const previewCodes = ref({})

// 生成结果
const generationResults = ref([])
const expandedResults = ref([])

// 弹窗状态
const filePreviewVisible = ref(false)
const previewFile = ref(null)
const batchGenerationVisible = ref(false)
const batchGenerationCompleted = ref(false)
const batchProgress = ref(0)
const batchProgressText = ref('')
const batchGenerationLog = ref([])

// 计算属性
const filteredEntities = computed(() => {
  if (!entitySearchText.value) return entities.value
  return entities.value.filter(entity =>
    entity.name.toLowerCase().includes(entitySearchText.value.toLowerCase()) ||
    entity.description?.toLowerCase().includes(entitySearchText.value.toLowerCase())
  )
})

const filteredTemplates = computed(() => {
  let filtered = templates.value

  if (templateSearchText.value) {
    filtered = filtered.filter(template =>
      template.name.toLowerCase().includes(templateSearchText.value.toLowerCase()) ||
      template.description?.toLowerCase().includes(templateSearchText.value.toLowerCase())
    )
  }

  if (templateCategoryFilter.value) {
    filtered = filtered.filter(template => template.category === templateCategoryFilter.value)
  }

  // 根据框架过滤
  filtered = filtered.filter(template => 
    template.framework === generationConfig.framework || template.framework === 'universal'
  )

  return filtered
})

const selectedTemplateObjects = computed(() => {
  return templates.value.filter(template => selectedTemplates.value.includes(template.id))
})

const entityOptions = computed(() => {
  return entities.value.map(entity => ({
    label: entity.name,
    value: entity.id
  }))
})

// 初始化
onMounted(async () => {
  await loadData()
  await loadTemplates()
})

// 数据加载
const loadData = async () => {
  try {
    // 加载项目信息
    // const projectResponse = await api.getProject(projectId.value)
    // projectInfo.value = projectResponse.data

    // 加载实体和关系
    // const entitiesResponse = await api.getProjectEntities(projectId.value)
    // entities.value = entitiesResponse.data.entities
    // relations.value = entitiesResponse.data.relations

    // 模拟数据
    projectInfo.value = { name: '示例项目' }
    entities.value = [
      {
        id: '1',
        name: 'User',
        tableName: 'users',
        description: '用户实体',
        fields: [
          { id: '1', name: 'id', type: 'string', isPrimary: true },
          { id: '2', name: 'username', type: 'string', isRequired: true },
          { id: '3', name: 'email', type: 'string', isRequired: true }
        ]
      },
      {
        id: '2',
        name: 'Post',
        tableName: 'posts',
        description: '文章实体',
        fields: [
          { id: '4', name: 'id', type: 'string', isPrimary: true },
          { id: '5', name: 'title', type: 'string', isRequired: true },
          { id: '6', name: 'content', type: 'text', isRequired: true }
        ]
      }
    ]
  } catch (error) {
    window.$message?.error('加载数据失败')
    console.error(error)
  }
}

const loadTemplates = async () => {
  try {
    // const response = await api.getTemplates({ framework: generationConfig.framework })
    // templates.value = response.data.options

    // 模拟数据
    templates.value = [
      {
        id: '1',
        name: 'NestJS Entity',
        description: 'NestJS实体模板',
        category: 'entity',
        framework: 'nestjs',
        version: '1.0.0',
        content: 'entity template content...'
      },
      {
        id: '2',
        name: 'NestJS Service',
        description: 'NestJS服务模板',
        category: 'service',
        framework: 'nestjs',
        version: '1.0.0',
        content: 'service template content...'
      },
      {
        id: '3',
        name: 'NestJS Controller',
        description: 'NestJS控制器模板',
        category: 'controller',
        framework: 'nestjs',
        version: '1.0.0',
        content: 'controller template content...'
      }
    ]

    // 默认选择所有模板
    selectedTemplates.value = templates.value.map(t => t.id)
  } catch (error) {
    window.$message?.error('加载模板失败')
    console.error(error)
  }
}

// 实体操作
const selectEntity = (entity) => {
  currentEntity.value = entity
}

const toggleEntitySelection = (entityId) => {
  const index = selectedEntities.value.indexOf(entityId)
  if (index > -1) {
    selectedEntities.value.splice(index, 1)
  } else {
    selectedEntities.value.push(entityId)
  }
}

const selectAllEntities = () => {
  if (selectedEntities.value.length === entities.value.length) {
    selectedEntities.value = []
  } else {
    selectedEntities.value = entities.value.map(e => e.id)
  }
}

const getEntityRelationsCount = (entityId) => {
  return relations.value.filter(r => 
    r.sourceEntityId === entityId || r.targetEntityId === entityId
  ).length
}

// 模板操作
const toggleTemplateSelection = (templateId) => {
  const index = selectedTemplates.value.indexOf(templateId)
  if (index > -1) {
    selectedTemplates.value.splice(index, 1)
  } else {
    selectedTemplates.value.push(templateId)
  }
}

const getCategoryColor = (category) => {
  const colors = {
    entity: 'blue',
    service: 'green',
    controller: 'orange',
    dto: 'purple'
  }
  return colors[category] || 'default'
}

const previewTemplate = (template) => {
  window.$message?.info(`预览模板: ${template.name}`)
}

// 配置操作
const onFrameworkChange = () => {
  loadTemplates()
}

// 预览操作
const generatePreview = async () => {
  if (!previewEntityId.value || selectedTemplates.value.length === 0) return

  try {
    // const response = await api.previewGeneration({
    //   entityId: previewEntityId.value,
    //   templateIds: selectedTemplates.value,
    //   config: generationConfig
    // })
    // previewCodes.value = response.data

    // 模拟预览代码
    previewCodes.value = {}
    selectedTemplates.value.forEach(templateId => {
      previewCodes.value[templateId] = `// Generated code for ${getPreviewEntityName()}
// Template: ${templates.value.find(t => t.id === templateId)?.name}
// Framework: ${generationConfig.framework}

export class ${getPreviewEntityName()} {
  // Generated properties and methods
}`
    })

    if (selectedTemplateObjects.value.length > 0) {
      activePreviewTab.value = selectedTemplateObjects.value[0].id
    }
  } catch (error) {
    window.$message?.error('生成预览失败')
    console.error(error)
  }
}

const getPreviewEntityName = () => {
  const entity = entities.value.find(e => e.id === previewEntityId.value)
  return entity ? entity.name : ''
}

const getPreviewCode = (templateId) => {
  return previewCodes.value[templateId] || '// 暂无预览代码'
}

const copyPreviewCode = (templateId) => {
  const code = getPreviewCode(templateId)
  navigator.clipboard.writeText(code)
  window.$message?.success('代码已复制到剪贴板')
}

// 生成操作
const generateSingleEntity = async (entity) => {
  if (selectedTemplates.value.length === 0) {
    window.$message?.warning('请先选择模板')
    return
  }

  try {
    // const response = await api.generateCode({
    //   entityIds: [entity.id],
    //   templateIds: selectedTemplates.value,
    //   config: generationConfig
    // })

    // 模拟生成结果
    const result = {
      id: Date.now().toString(),
      entityName: entity.name,
      status: 'success',
      createdAt: new Date(),
      files: [
        {
          path: `src/entities/${entity.name.toLowerCase()}.entity.ts`,
          content: `// Generated entity for ${entity.name}`,
          size: 1024,
          type: 'entity'
        },
        {
          path: `src/services/${entity.name.toLowerCase()}.service.ts`,
          content: `// Generated service for ${entity.name}`,
          size: 2048,
          type: 'service'
        }
      ]
    }

    generationResults.value.unshift(result)
    window.$message?.success(`${entity.name} 代码生成成功`)
  } catch (error) {
    window.$message?.error('代码生成失败')
    console.error(error)
  }
}

const batchGenerate = async () => {
  if (selectedEntities.value.length === 0) {
    window.$message?.warning('请先选择实体')
    return
  }

  if (selectedTemplates.value.length === 0) {
    window.$message?.warning('请先选择模板')
    return
  }

  batchGenerationVisible.value = true
  batchGenerationCompleted.value = false
  batchProgress.value = 0
  batchProgressText.value = '准备生成...'
  batchGenerationLog.value = []

  try {
    const totalEntities = selectedEntities.value.length
    
    for (let i = 0; i < totalEntities; i++) {
      const entityId = selectedEntities.value[i]
      const entity = entities.value.find(e => e.id === entityId)
      
      batchProgressText.value = `正在生成 ${entity.name}...`
      batchGenerationLog.value.push({
        type: 'info',
        message: `开始生成 ${entity.name}`
      })

      // 模拟生成过程
      await new Promise(resolve => setTimeout(resolve, 1000))

      // 模拟生成结果
      const result = {
        id: Date.now().toString() + i,
        entityName: entity.name,
        status: 'success',
        createdAt: new Date(),
        files: [
          {
            path: `src/entities/${entity.name.toLowerCase()}.entity.ts`,
            content: `// Generated entity for ${entity.name}`,
            size: 1024,
            type: 'entity'
          }
        ]
      }

      generationResults.value.unshift(result)
      batchGenerationLog.value.push({
        type: 'success',
        message: `${entity.name} 生成完成`
      })

      batchProgress.value = Math.round(((i + 1) / totalEntities) * 100)
    }

    batchProgressText.value = '批量生成完成'
    batchGenerationCompleted.value = true
    window.$message?.success('批量生成完成')
  } catch (error) {
    batchGenerationLog.value.push({
      type: 'error',
      message: `生成失败: ${error.message}`
    })
    window.$message?.error('批量生成失败')
    console.error(error)
  }
}

// 结果操作
const toggleResultExpansion = (resultId) => {
  const index = expandedResults.value.indexOf(resultId)
  if (index > -1) {
    expandedResults.value.splice(index, 1)
  } else {
    expandedResults.value.push(resultId)
  }
}

const getStatusText = (status) => {
  const statusMap = {
    success: '成功',
    error: '失败',
    pending: '进行中'
  }
  return statusMap[status] || status
}

const formatTime = (time) => {
  return new Date(time).toLocaleString()
}

const formatFileSize = (size) => {
  if (size < 1024) return `${size} B`
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`
  return `${(size / (1024 * 1024)).toFixed(1)} MB`
}

const getFileTypeColor = (type) => {
  const colors = {
    entity: 'blue',
    service: 'green',
    controller: 'orange',
    dto: 'purple',
    test: 'cyan'
  }
  return colors[type] || 'default'
}

const showFilePreview = (file) => {
  previewFile.value = file
  filePreviewVisible.value = true
}

const copyFileContent = () => {
  navigator.clipboard.writeText(previewFile.value.content)
  window.$message?.success('文件内容已复制到剪贴板')
}

const downloadFile = (file) => {
  const blob = new Blob([file.content], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = file.path.split('/').pop()
  a.click()
  URL.revokeObjectURL(url)
}

const downloadResult = (result) => {
  window.$message?.info(`下载 ${result.entityName} 的所有文件`)
}

const regenerateResult = (result) => {
  window.$message?.info(`重新生成 ${result.entityName}`)
}

const clearResults = () => {
  generationResults.value = []
  expandedResults.value = []
  window.$message?.success('结果已清空')
}

const refreshData = () => {
  loadData()
  loadTemplates()
  window.$message?.success('数据已刷新')
}
</script>

<style scoped>
.code-generator {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: #f0f2f5;
}

.generator-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  background: #fff;
  border-bottom: 1px solid #d9d9d9;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.header-left,
.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.generator-content {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.entities-panel,
.config-panel,
.results-panel {
  background: #fff;
  border-right: 1px solid #d9d9d9;
  display: flex;
  flex-direction: column;
}

.entities-panel {
  width: 300px;
  min-width: 300px;
}

.config-panel {
  flex: 1;
  min-width: 400px;
}

.results-panel {
  width: 350px;
  min-width: 350px;
  border-right: none;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #f0f0f0;
}

.panel-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 500;
}

.entities-list,
.results-content {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

.search-box {
  margin-bottom: 16px;
}

.entity-item {
  display: flex;
  align-items: center;
  padding: 12px;
  margin-bottom: 8px;
  border: 1px solid #f0f0f0;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.entity-item:hover {
  border-color: #1890ff;
  background: #f6ffed;
}

.entity-item.selected {
  border-color: #1890ff;
  background: #e6f7ff;
}

.entity-item.active {
  border-color: #52c41a;
  background: #f6ffed;
}

.entity-checkbox {
  margin-right: 12px;
}

.entity-info {
  flex: 1;
}

.entity-name {
  font-weight: 500;
  color: #262626;
  margin-bottom: 4px;
}

.entity-desc {
  color: #8c8c8c;
  font-size: 12px;
  margin-bottom: 6px;
}

.entity-stats {
  display: flex;
  gap: 4px;
}

.config-section {
  margin-bottom: 24px;
}

.config-section h4 {
  margin-bottom: 12px;
  color: #262626;
  font-size: 14px;
  font-weight: 500;
}

.templates-section {
  padding: 16px;
}

.templates-filter {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}

.templates-list {
  max-height: 400px;
  overflow-y: auto;
}

.template-item {
  display: flex;
  align-items: center;
  padding: 12px;
  margin-bottom: 8px;
  border: 1px solid #f0f0f0;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.template-item:hover {
  border-color: #1890ff;
  background: #f6ffed;
}

.template-item.selected {
  border-color: #1890ff;
  background: #e6f7ff;
}

.template-checkbox {
  margin-right: 12px;
}

.template-info {
  flex: 1;
}

.template-name {
  font-weight: 500;
  color: #262626;
  margin-bottom: 4px;
}

.template-desc {
  color: #8c8c8c;
  font-size: 12px;
  margin-bottom: 6px;
}

.template-meta {
  display: flex;
  align-items: center;
  gap: 8px;
}

.template-version {
  color: #8c8c8c;
  font-size: 12px;
}

.preview-section {
  padding: 16px;
}

.preview-entity-select {
  margin-bottom: 24px;
}

.preview-entity-select h4 {
  margin-bottom: 12px;
  color: #262626;
  font-size: 14px;
  font-weight: 500;
}

.preview-content {
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  overflow: hidden;
}

.preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: #fafafa;
  border-bottom: 1px solid #d9d9d9;
  font-size: 12px;
}

.preview-code {
  max-height: 300px;
  overflow: auto;
  background: #f8f8f8;
}

.preview-code pre {
  margin: 0;
  padding: 12px;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 12px;
  line-height: 1.5;
}

.results-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.result-item {
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  overflow: hidden;
  transition: all 0.2s ease;
}

.result-item:hover {
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.result-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: #fafafa;
  cursor: pointer;
  transition: background 0.2s ease;
}

.result-header:hover {
  background: #f0f0f0;
}

.result-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.result-entity {
  font-weight: 500;
  color: #262626;
}

.result-status {
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 11px;
  font-weight: 500;
}

.result-status.success {
  background: #f6ffed;
  color: #52c41a;
}

.result-status.error {
  background: #fff2f0;
  color: #ff4d4f;
}

.result-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  color: #8c8c8c;
  font-size: 12px;
}

.expand-icon {
  transition: transform 0.2s ease;
}

.expand-icon.expanded {
  transform: rotate(180deg);
}

.result-content {
  padding: 16px;
  border-top: 1px solid #f0f0f0;
}

.result-files {
  margin-bottom: 16px;
}

.file-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  margin-bottom: 4px;
  background: #fafafa;
  border-radius: 4px;
}

.file-info {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 8px;
}

.file-path {
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 12px;
  color: #262626;
}

.file-size {
  color: #8c8c8c;
  font-size: 11px;
}

.file-actions {
  display: flex;
  gap: 4px;
}

.result-actions {
  display: flex;
  gap: 8px;
}

.empty-results {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
}

.file-preview {
  max-height: 70vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.file-preview .preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: #fafafa;
  border-bottom: 1px solid #d9d9d9;
  font-size: 12px;
}

.file-preview .preview-content {
  flex: 1;
  overflow: auto;
  background: #f8f8f8;
}

.file-preview .preview-content pre {
  margin: 0;
  padding: 16px;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 13px;
  line-height: 1.5;
}

.batch-progress {
  padding: 16px 0;
}

.progress-info {
  text-align: center;
  margin: 16px 0;
  color: #666;
}

.progress-details {
  max-height: 200px;
  overflow-y: auto;
  margin-top: 16px;
  padding: 12px;
  background: #fafafa;
  border-radius: 4px;
}

.log-item {
  padding: 4px 0;
  font-size: 12px;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
}

.log-item.info {
  color: #1890ff;
}

.log-item.success {
  color: #52c41a;
}

.log-item.error {
  color: #ff4d4f;
}
</style>
