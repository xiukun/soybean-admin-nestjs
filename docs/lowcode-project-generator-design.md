# 企业级低代码业务系统后端项目生成器设计方案

## 🎯 1. 统一项目上下文管理

### 1.1 全局项目状态管理

```typescript
// frontend/src/stores/modules/lowcode-project.ts
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { fetchGetAllProjects } from '@/service/api';

export const useLowcodeProjectStore = defineStore('lowcode-project', () => {
  // 状态
  const currentProject = ref<Api.Lowcode.Project | null>(null);
  const projects = ref<Api.Lowcode.Project[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  // 计算属性
  const currentProjectId = computed(() => currentProject.value?.id || '');
  const currentProjectName = computed(() => currentProject.value?.name || '');
  const projectOptions = computed(() => 
    projects.value.map(project => ({
      label: project.name,
      value: project.id,
      description: project.description
    }))
  );

  // 方法
  const loadProjects = async () => {
    try {
      loading.value = true;
      error.value = null;
      const response = await fetchGetAllProjects();
      projects.value = Array.isArray(response) ? response : response.data || [];
    } catch (err: any) {
      error.value = err.message || 'Failed to load projects';
      console.error('Failed to load projects:', err);
    } finally {
      loading.value = false;
    }
  };

  const setCurrentProject = (projectId: string) => {
    const project = projects.value.find(p => p.id === projectId);
    if (project) {
      currentProject.value = project;
      // 触发全局项目切换事件
      window.dispatchEvent(new CustomEvent('lowcode:project-changed', {
        detail: { project, projectId }
      }));
    }
  };

  const clearCurrentProject = () => {
    currentProject.value = null;
  };

  return {
    // 状态
    currentProject,
    projects,
    loading,
    error,
    // 计算属性
    currentProjectId,
    currentProjectName,
    projectOptions,
    // 方法
    loadProjects,
    setCurrentProject,
    clearCurrentProject
  };
});
```

### 1.2 全局项目选择器组件

```vue
<!-- frontend/src/components/lowcode/GlobalProjectSelector.vue -->
<template>
  <div class="global-project-selector">
    <NSpace align="center">
      <NIcon size="18" class="text-primary">
        <icon-mdi-folder-outline />
      </NIcon>
      <NText strong>{{ $t('lowcode.project.current') }}:</NText>
      <NSelect
        v-model:value="selectedProjectId"
        :options="projectStore.projectOptions"
        :loading="projectStore.loading"
        :placeholder="$t('lowcode.project.select.placeholder')"
        style="min-width: 200px"
        clearable
        @update:value="handleProjectChange"
      >
        <template #option="{ node }">
          <div class="project-option">
            <div class="project-name">{{ node.label }}</div>
            <div v-if="node.description" class="project-desc">{{ node.description }}</div>
          </div>
        </template>
      </NSelect>
      <NButton
        v-if="projectStore.currentProject"
        type="info"
        size="small"
        @click="showProjectInfo = true"
      >
        <template #icon>
          <NIcon><icon-mdi-information-outline /></NIcon>
        </template>
        {{ $t('lowcode.project.info') }}
      </NButton>
    </NSpace>

    <!-- 项目信息弹窗 -->
    <NModal v-model:show="showProjectInfo" preset="card" :title="$t('lowcode.project.info')" style="width: 600px">
      <div v-if="projectStore.currentProject">
        <NDescriptions :column="2" bordered>
          <NDescriptionsItem :label="$t('lowcode.project.name')">
            {{ projectStore.currentProject.name }}
          </NDescriptionsItem>
          <NDescriptionsItem :label="$t('lowcode.project.code')">
            <NTag type="info">{{ projectStore.currentProject.code }}</NTag>
          </NDescriptionsItem>
          <NDescriptionsItem :label="$t('lowcode.project.description')" :span="2">
            {{ projectStore.currentProject.description || $t('common.none') }}
          </NDescriptionsItem>
          <NDescriptionsItem :label="$t('lowcode.project.status')">
            <NTag :type="getStatusType(projectStore.currentProject.status)">
              {{ $t(`lowcode.project.status.${projectStore.currentProject.status}`) }}
            </NTag>
          </NDescriptionsItem>
          <NDescriptionsItem :label="$t('lowcode.project.createdAt')">
            {{ formatDate(projectStore.currentProject.createdAt) }}
          </NDescriptionsItem>
        </NDescriptions>
      </div>
    </NModal>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { useLowcodeProjectStore } from '@/stores/modules/lowcode-project';
import { $t } from '@/locales';

const projectStore = useLowcodeProjectStore();
const selectedProjectId = ref<string>('');
const showProjectInfo = ref(false);

const handleProjectChange = (projectId: string | null) => {
  if (projectId) {
    projectStore.setCurrentProject(projectId);
  } else {
    projectStore.clearCurrentProject();
  }
};

const getStatusType = (status: string) => {
  const statusMap: Record<string, 'success' | 'warning' | 'error' | 'info'> = {
    ACTIVE: 'success',
    INACTIVE: 'warning',
    ARCHIVED: 'error',
    DRAFT: 'info'
  };
  return statusMap[status] || 'info';
};

const formatDate = (date: string | Date) => {
  return new Date(date).toLocaleString();
};

// 监听当前项目变化
watch(() => projectStore.currentProject, (project) => {
  selectedProjectId.value = project?.id || '';
}, { immediate: true });

onMounted(() => {
  if (projectStore.projects.length === 0) {
    projectStore.loadProjects();
  }
});
</script>

<style scoped>
.project-option {
  padding: 4px 0;
}

.project-name {
  font-weight: 500;
  color: var(--n-text-color);
}

.project-desc {
  font-size: 12px;
  color: var(--n-text-color-disabled);
  margin-top: 2px;
}
</style>
```

## 🏗️ 2. 深度元数据服务集成

### 2.1 元数据聚合服务

```typescript
// lowcode-platform-backend/src/lib/bounded-contexts/metadata/application/services/metadata-aggregator.service.ts
import { Injectable, Inject } from '@nestjs/common';
import { EntityRepository } from '@entity/domain/entity.repository';
import { FieldRepository } from '@field/domain/field.repository';
import { RelationshipRepository } from '@lib/bounded-contexts/relationship/domain/relationship.repository';

export interface ProjectMetadata {
  project: {
    id: string;
    name: string;
    code: string;
    description?: string;
  };
  entities: EntityMetadata[];
  relationships: RelationshipMetadata[];
  apiConfigs: ApiConfigMetadata[];
}

export interface EntityMetadata {
  id: string;
  name: string;
  code: string;
  tableName: string;
  description?: string;
  fields: FieldMetadata[];
  relationships: {
    incoming: RelationshipMetadata[];
    outgoing: RelationshipMetadata[];
  };
  indexes: IndexMetadata[];
  constraints: ConstraintMetadata[];
}

@Injectable()
export class MetadataAggregatorService {
  constructor(
    @Inject('EntityRepository')
    private readonly entityRepository: EntityRepository,
    @Inject('FieldRepository')
    private readonly fieldRepository: FieldRepository,
    @Inject('RelationshipRepository')
    private readonly relationshipRepository: RelationshipRepository,
  ) {}

  async getProjectMetadata(projectId: string): Promise<ProjectMetadata> {
    // 并行获取所有元数据
    const [entities, relationships, apiConfigs] = await Promise.all([
      this.getEntitiesMetadata(projectId),
      this.getRelationshipsMetadata(projectId),
      this.getApiConfigsMetadata(projectId)
    ]);

    // 构建完整的项目元数据
    return {
      project: await this.getProjectInfo(projectId),
      entities: this.enrichEntitiesWithRelationships(entities, relationships),
      relationships,
      apiConfigs
    };
  }

  private async getEntitiesMetadata(projectId: string): Promise<EntityMetadata[]> {
    const entities = await this.entityRepository.findByProject(projectId);
    
    return Promise.all(entities.map(async (entity) => {
      const fields = await this.fieldRepository.findByEntity(entity.id);
      
      return {
        id: entity.id,
        name: entity.name,
        code: entity.code,
        tableName: entity.tableName || this.toSnakeCase(entity.code),
        description: entity.description,
        fields: fields.map(field => ({
          id: field.id,
          name: field.name,
          code: field.code,
          type: field.type,
          length: field.length,
          precision: field.precision,
          scale: field.scale,
          nullable: field.nullable,
          defaultValue: field.defaultValue,
          isPrimaryKey: field.isPrimaryKey,
          isUnique: field.isUnique,
          isIndexed: field.isIndexed,
          comment: field.comment,
          validationRules: field.validationRules
        })),
        relationships: { incoming: [], outgoing: [] },
        indexes: await this.generateIndexes(entity, fields),
        constraints: await this.generateConstraints(entity, fields)
      };
    }));
  }

  private enrichEntitiesWithRelationships(
    entities: EntityMetadata[], 
    relationships: RelationshipMetadata[]
  ): EntityMetadata[] {
    return entities.map(entity => {
      const incoming = relationships.filter(rel => rel.targetEntityId === entity.id);
      const outgoing = relationships.filter(rel => rel.sourceEntityId === entity.id);
      
      return {
        ...entity,
        relationships: { incoming, outgoing }
      };
    });
  }

  async generateDDL(projectId: string): Promise<string> {
    const metadata = await this.getProjectMetadata(projectId);
    return this.buildDDLScript(metadata);
  }

  private buildDDLScript(metadata: ProjectMetadata): string {
    let ddl = `-- Generated DDL for project: ${metadata.project.name}\n`;
    ddl += `-- Generated at: ${new Date().toISOString()}\n\n`;

    // 创建表
    for (const entity of metadata.entities) {
      ddl += this.generateCreateTableSQL(entity);
      ddl += '\n';
    }

    // 创建外键约束
    for (const relationship of metadata.relationships) {
      ddl += this.generateForeignKeySQL(relationship, metadata.entities);
      ddl += '\n';
    }

    // 创建索引
    for (const entity of metadata.entities) {
      for (const index of entity.indexes) {
        ddl += this.generateCreateIndexSQL(entity.tableName, index);
        ddl += '\n';
      }
    }

    return ddl;
  }

  private generateCreateTableSQL(entity: EntityMetadata): string {
    let sql = `CREATE TABLE ${entity.tableName} (\n`;
    
    const fieldDefinitions = entity.fields.map(field => {
      let definition = `  ${field.code} ${this.mapFieldTypeToSQL(field)}`;
      
      if (!field.nullable) definition += ' NOT NULL';
      if (field.defaultValue) definition += ` DEFAULT ${field.defaultValue}`;
      if (field.comment) definition += ` COMMENT '${field.comment}'`;
      
      return definition;
    });

    sql += fieldDefinitions.join(',\n');

    // 添加主键约束
    const primaryKeys = entity.fields.filter(f => f.isPrimaryKey).map(f => f.code);
    if (primaryKeys.length > 0) {
      sql += `,\n  PRIMARY KEY (${primaryKeys.join(', ')})`;
    }

    // 添加唯一约束
    const uniqueFields = entity.fields.filter(f => f.isUnique && !f.isPrimaryKey);
    for (const field of uniqueFields) {
      sql += `,\n  UNIQUE (${field.code})`;
    }

    sql += '\n);';
    
    if (entity.description) {
      sql += `\nCOMMENT ON TABLE ${entity.tableName} IS '${entity.description}';`;
    }

    return sql;
  }

  private mapFieldTypeToSQL(field: FieldMetadata): string {
    const typeMap: Record<string, string> = {
      'string': field.length ? `VARCHAR(${field.length})` : 'TEXT',
      'text': 'TEXT',
      'integer': 'INTEGER',
      'bigint': 'BIGINT',
      'decimal': field.precision && field.scale ? 
        `DECIMAL(${field.precision},${field.scale})` : 'DECIMAL',
      'boolean': 'BOOLEAN',
      'date': 'DATE',
      'datetime': 'TIMESTAMP',
      'timestamp': 'TIMESTAMP',
      'json': 'JSONB',
      'uuid': 'UUID'
    };

    return typeMap[field.type] || 'TEXT';
  }

  private toSnakeCase(str: string): string {
    return str.replace(/([A-Z])/g, '_$1').toLowerCase().replace(/^_/, '');
  }
}
```

### 2.2 智能代码生成引擎

```typescript
// lowcode-platform-backend/src/lib/bounded-contexts/code-generation/application/services/intelligent-code-generator.service.ts
import { Injectable, Inject } from '@nestjs/common';
import { MetadataAggregatorService, ProjectMetadata } from '@lib/bounded-contexts/metadata/application/services/metadata-aggregator.service';
import { TemplateEngineService } from '@lib/bounded-contexts/template/application/services/template-engine.service';
import { CodeTemplate } from '@lib/bounded-contexts/template/domain/template.model';

export interface GenerationRequest {
  projectId: string;
  templateIds: string[];
  entityIds?: string[];
  outputPath: string;
  variables: Record<string, any>;
  options: {
    overwriteExisting: boolean;
    generateTests: boolean;
    generateDocs: boolean;
    architecture: 'base-biz' | 'standard';
    framework: 'nestjs' | 'express' | 'spring';
  };
}

export interface GenerationResult {
  success: boolean;
  taskId: string;
  filesGenerated: number;
  outputPath: string;
  errors: string[];
  warnings: string[];
  fileTree: FileTreeNode[];
  metadata: {
    projectId: string;
    templatesUsed: string[];
    entitiesProcessed: string[];
    generatedAt: Date;
    duration: number;
  };
}

@Injectable()
export class IntelligentCodeGeneratorService {
  constructor(
    private readonly metadataService: MetadataAggregatorService,
    private readonly templateEngine: TemplateEngineService,
    @Inject('TemplateRepository')
    private readonly templateRepository: TemplateRepository,
  ) {}

  async generateProject(request: GenerationRequest): Promise<GenerationResult> {
    const startTime = Date.now();
    const taskId = this.generateTaskId();
    
    try {
      // 1. 获取项目元数据
      const metadata = await this.metadataService.getProjectMetadata(request.projectId);
      
      // 2. 获取模板
      const templates = await this.loadTemplates(request.templateIds);
      
      // 3. 准备生成上下文
      const context = await this.prepareGenerationContext(metadata, request);
      
      // 4. 生成代码文件
      const generatedFiles = await this.generateFiles(templates, context, request);
      
      // 5. 应用base-biz架构
      if (request.options.architecture === 'base-biz') {
        await this.applyBaseBizArchitecture(generatedFiles, request.outputPath);
      }
      
      // 6. 生成测试文件
      if (request.options.generateTests) {
        const testFiles = await this.generateTestFiles(templates, context, request);
        generatedFiles.push(...testFiles);
      }
      
      // 7. 生成文档
      if (request.options.generateDocs) {
        const docFiles = await this.generateDocumentationFiles(metadata, request);
        generatedFiles.push(...docFiles);
      }
      
      // 8. 构建文件树
      const fileTree = this.buildFileTree(generatedFiles);
      
      return {
        success: true,
        taskId,
        filesGenerated: generatedFiles.length,
        outputPath: request.outputPath,
        errors: [],
        warnings: [],
        fileTree,
        metadata: {
          projectId: request.projectId,
          templatesUsed: request.templateIds,
          entitiesProcessed: request.entityIds || [],
          generatedAt: new Date(),
          duration: Date.now() - startTime
        }
      };
      
    } catch (error) {
      return {
        success: false,
        taskId,
        filesGenerated: 0,
        outputPath: request.outputPath,
        errors: [error.message],
        warnings: [],
        fileTree: [],
        metadata: {
          projectId: request.projectId,
          templatesUsed: request.templateIds,
          entitiesProcessed: request.entityIds || [],
          generatedAt: new Date(),
          duration: Date.now() - startTime
        }
      };
    }
  }

  private async prepareGenerationContext(
    metadata: ProjectMetadata, 
    request: GenerationRequest
  ): Promise<GenerationContext> {
    const entities = request.entityIds 
      ? metadata.entities.filter(e => request.entityIds!.includes(e.id))
      : metadata.entities;

    return {
      project: metadata.project,
      entities,
      relationships: metadata.relationships,
      apiConfigs: metadata.apiConfigs,
      variables: {
        ...request.variables,
        // 自动注入的变量
        projectName: metadata.project.name,
        projectCode: metadata.project.code,
        timestamp: new Date().toISOString(),
        generator: 'lowcode-platform',
        version: '1.0.0'
      },
      options: request.options
    };
  }

  private async generateFiles(
    templates: CodeTemplate[],
    context: GenerationContext,
    request: GenerationRequest
  ): Promise<GeneratedFile[]> {
    const files: GeneratedFile[] = [];

    for (const template of templates) {
      if (template.category === 'PROJECT') {
        // 项目级模板，生成一次
        const file = await this.generateFileFromTemplate(template, context);
        files.push(file);
      } else {
        // 实体级模板，为每个实体生成
        for (const entity of context.entities) {
          const entityContext = { ...context, currentEntity: entity };
          const file = await this.generateFileFromTemplate(template, entityContext);
          files.push(file);
        }
      }
    }

    return files;
  }

  private async applyBaseBizArchitecture(
    files: GeneratedFile[],
    outputPath: string
  ): Promise<void> {
    // 将文件分类到base和biz目录
    for (const file of files) {
      if (this.isBaseFile(file)) {
        file.path = `${outputPath}/base/${file.path}`;
      } else {
        file.path = `${outputPath}/biz/${file.path}`;
      }
    }

    // 生成biz层的导入文件
    await this.generateBizImports(files, outputPath);
  }

  private isBaseFile(file: GeneratedFile): boolean {
    // 基础文件判断逻辑
    const basePatterns = [
      /\.base\.(ts|js)$/,
      /base-.*\.(ts|js)$/,
      /.*\.base\..*$/,
      /dto\/.*\.(ts|js)$/,
      /interfaces\/.*\.(ts|js)$/
    ];

    return basePatterns.some(pattern => pattern.test(file.filename));
  }

  private generateTaskId(): string {
    return `gen_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
```

## 🚀 3. 完整项目脚手架生成

### 3.1 NestJS项目模板

```typescript
// lowcode-platform-backend/src/lib/code-generation/templates/nestjs-project.template.ts
export class NestJSProjectTemplate {
  generateProjectStructure(metadata: ProjectMetadata): ProjectStructure {
    return {
      'package.json': this.generatePackageJson(metadata),
      'tsconfig.json': this.generateTsConfig(),
      'nest-cli.json': this.generateNestCliConfig(),
      '.env.example': this.generateEnvExample(),
      'docker-compose.yml': this.generateDockerCompose(metadata),
      'Dockerfile': this.generateDockerfile(),
      'README.md': this.generateReadme(metadata),
      
      // 源代码结构
      'src/': {
        'main.ts': this.generateMain(),
        'app.module.ts': this.generateAppModule(metadata),
        'app.controller.ts': this.generateAppController(),
        'app.service.ts': this.generateAppService(),
        
        // Base层
        'base/': {
          'controllers/': this.generateBaseControllers(metadata.entities),
          'services/': this.generateBaseServices(metadata.entities),
          'dto/': this.generateBaseDTOs(metadata.entities),
          'entities/': this.generateBaseEntities(metadata.entities),
          'interfaces/': this.generateBaseInterfaces(metadata.entities),
        },
        
        // Biz层
        'biz/': {
          'controllers/': this.generateBizControllers(metadata.entities),
          'services/': this.generateBizServices(metadata.entities),
          'modules/': this.generateBizModules(metadata.entities),
        },
        
        // 共享模块
        'shared/': {
          'guards/': this.generateGuards(),
          'interceptors/': this.generateInterceptors(),
          'decorators/': this.generateDecorators(),
          'filters/': this.generateFilters(),
          'pipes/': this.generatePipes(),
          'utils/': this.generateUtils(),
        },
        
        // 配置
        'config/': {
          'database.config.ts': this.generateDatabaseConfig(),
          'jwt.config.ts': this.generateJwtConfig(),
          'swagger.config.ts': this.generateSwaggerConfig(),
        }
      },
      
      // 测试文件
      'test/': {
        'app.e2e-spec.ts': this.generateE2ETest(),
        'jest-e2e.json': this.generateJestE2EConfig(),
      },
      
      // 数据库相关
      'prisma/': {
        'schema.prisma': this.generatePrismaSchema(metadata),
        'seed.ts': this.generateSeed(metadata),
        'migrations/': {}
      }
    };
  }

  private generateBaseController(entity: EntityMetadata): string {
    return `import { Controller, Get, Post, Put, Delete, Body, Param, Query, HttpStatus, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '@shared/guards/jwt-auth.guard';
import { ${entity.name}BaseService } from '../services/${entity.code}.base.service';
import { Create${entity.name}BaseDto, Update${entity.name}BaseDto, ${entity.name}ResponseDto, ${entity.name}QueryDto } from '../dto/${entity.code}.dto';

@Controller('${this.toKebabCase(entity.code)}')
@ApiTags('${entity.name} Management')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
export class ${entity.name}BaseController {
  constructor(
    protected readonly ${this.toCamelCase(entity.code)}Service: ${entity.name}BaseService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get all ${entity.name}' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Successfully retrieved ${entity.name} list',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'number', example: 0 },
        msg: { type: 'string', example: 'success' },
        data: {
          type: 'object',
          properties: {
            items: {
              type: 'array',
              items: { $ref: '#/components/schemas/${entity.name}ResponseDto' }
            },
            total: { type: 'number' },
            page: { type: 'number' },
            pageSize: { type: 'number' }
          }
        }
      }
    }
  })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number' })
  @ApiQuery({ name: 'pageSize', required: false, type: Number, description: 'Page size' })
  async findAll(@Query() query: ${entity.name}QueryDto) {
    const result = await this.${this.toCamelCase(entity.code)}Service.findAll(query);
    
    // 符合amis规范的响应格式
    return {
      status: 0,
      msg: 'success',
      data: {
        items: result.items,
        total: result.total,
        page: query.page || 1,
        pageSize: query.pageSize || 10
      }
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get ${entity.name} by ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Successfully retrieved ${entity.name}',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'number', example: 0 },
        msg: { type: 'string', example: 'success' },
        data: { $ref: '#/components/schemas/${entity.name}ResponseDto' }
      }
    }
  })
  async findOne(@Param('id') id: string) {
    const item = await this.${this.toCamelCase(entity.code)}Service.findOne(id);
    
    return {
      status: 0,
      msg: 'success',
      data: item
    };
  }

  @Post()
  @ApiOperation({ summary: 'Create ${entity.name}' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: '${entity.name} created successfully',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'number', example: 0 },
        msg: { type: 'string', example: 'success' },
        data: { $ref: '#/components/schemas/${entity.name}ResponseDto' }
      }
    }
  })
  async create(@Body() createDto: Create${entity.name}BaseDto) {
    const item = await this.${this.toCamelCase(entity.code)}Service.create(createDto);
    
    return {
      status: 0,
      msg: 'success',
      data: item
    };
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update ${entity.name}' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '${entity.name} updated successfully',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'number', example: 0 },
        msg: { type: 'string', example: 'success' },
        data: { $ref: '#/components/schemas/${entity.name}ResponseDto' }
      }
    }
  })
  async update(@Param('id') id: string, @Body() updateDto: Update${entity.name}BaseDto) {
    const item = await this.${this.toCamelCase(entity.code)}Service.update(id, updateDto);
    
    return {
      status: 0,
      msg: 'success',
      data: item
    };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete ${entity.name}' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '${entity.name} deleted successfully',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'number', example: 0 },
        msg: { type: 'string', example: 'success' }
      }
    }
  })
  async remove(@Param('id') id: string) {
    await this.${this.toCamelCase(entity.code)}Service.remove(id);
    
    return {
      status: 0,
      msg: 'success'
    };
  }
}`;
  }

  private generateAmisCompliantResponse(): string {
    return `// Amis框架标准响应格式
export interface AmisResponse<T = any> {
  status: number;        // 0表示成功，非0表示失败
  msg: string;          // 返回消息
  data?: T;             // 返回数据
}

export interface AmisPaginationResponse<T = any> extends AmisResponse {
  data: {
    items: T[];         // 数据列表
    total: number;      // 总数
    page: number;       // 当前页
    pageSize: number;   // 每页大小
  };
}

// 响应装饰器
export function AmisResponseFormat() {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;
    descriptor.value = async function (...args: any[]) {
      try {
        const result = await method.apply(this, args);
        
        // 如果已经是amis格式，直接返回
        if (result && typeof result === 'object' && 'status' in result) {
          return result;
        }
        
        // 包装为amis格式
        return {
          status: 0,
          msg: 'success',
          data: result
        };
      } catch (error) {
        return {
          status: 1,
          msg: error.message || 'Internal server error',
          data: null
        };
      }
    };
  };
}`;
  }
}
```

## 📊 6. 实施计划和时间安排

### 6.1 第一阶段：基础架构搭建 (1周)

**任务清单**：
- [ ] 创建统一项目上下文管理Store
- [ ] 实现全局项目选择器组件
- [ ] 搭建元数据聚合服务框架
- [ ] 创建代码生成控制器和DTO
- [ ] 配置CQRS命令查询处理器

**关键文件**：
```
frontend/src/stores/modules/lowcode-project.ts
frontend/src/components/lowcode/GlobalProjectSelector.vue
lowcode-platform-backend/src/lib/bounded-contexts/metadata/
lowcode-platform-backend/src/api/lowcode/code-generation.controller.ts
```

### 6.2 第二阶段：核心功能实现 (2周)

**任务清单**：
- [ ] 实现智能代码生成引擎
- [ ] 完善模板引擎和变量系统
- [ ] 实现base-biz架构支持
- [ ] 开发amis接口规范生成器
- [ ] 集成现有模板管理功能

**关键文件**：
```
lowcode-platform-backend/src/lib/bounded-contexts/code-generation/
lowcode-platform-backend/src/lib/code-generation/templates/
frontend/src/views/lowcode/code-generation/index.vue
```

### 6.3 第三阶段：前端优化和集成 (1周)

**任务清单**：
- [ ] 改进代码生成页面用户体验
- [ ] 实现实时代码预览功能
- [ ] 添加生成进度跟踪和日志
- [ ] 完善错误处理和用户反馈
- [ ] 集成文件下载和管理功能

### 6.4 第四阶段：测试和优化 (1周)

**任务清单**：
- [ ] 编写单元测试和集成测试
- [ ] 性能优化和并发处理
- [ ] 文档编写和API规范完善
- [ ] 用户验收测试和反馈收集

## 🎯 7. 质量保证和性能指标

### 7.1 性能目标

| 指标 | 目标值 | 测量方法 |
|------|--------|----------|
| 单个实体生成时间 | < 5秒 | 端到端测试 |
| 完整项目生成时间 | < 30秒 | 压力测试 |
| 并发用户支持 | > 10个 | 负载测试 |
| 生成代码质量 | ESLint通过率 > 95% | 静态分析 |
| 测试覆盖率 | > 80% | Jest覆盖率报告 |

### 7.2 用户体验指标

| 指标 | 目标值 | 测量方法 |
|------|--------|----------|
| 操作步骤减少 | 50% | 用户行为分析 |
| 学习成本 | < 30分钟 | 用户测试 |
| 错误率 | < 5% | 错误日志分析 |
| 用户满意度 | > 4.0/5.0 | 用户调研 |

## 🔧 8. 技术实现要点

### 8.1 Amis接口规范实现

```typescript
// 标准Amis响应格式
export interface AmisStandardResponse<T = any> {
  status: number;    // 0表示成功，非0表示失败
  msg: string;       // 返回消息
  data?: T;          // 返回数据
}

// 分页响应格式
export interface AmisPaginationResponse<T = any> {
  status: number;
  msg: string;
  data: {
    items: T[];      // 数据列表
    total: number;   // 总数
    page: number;    // 当前页
    pageSize: number; // 每页大小
  };
}

// 响应装饰器
export function AmisResponse() {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;
    descriptor.value = async function (...args: any[]) {
      try {
        const result = await method.apply(this, args);

        // 如果已经是amis格式，直接返回
        if (result && typeof result === 'object' && 'status' in result) {
          return result;
        }

        // 包装为amis格式
        return {
          status: 0,
          msg: 'success',
          data: result
        };
      } catch (error) {
        return {
          status: 1,
          msg: error.message || 'Internal server error',
          data: null
        };
      }
    };
  };
}
```

### 8.2 Base-Biz架构实现

```typescript
// Base层文件生成策略
export class BaseBizArchitectureStrategy {
  private readonly basePatterns = [
    /\.base\.(ts|js)$/,
    /base-.*\.(ts|js)$/,
    /dto\/.*\.(ts|js)$/,
    /interfaces\/.*\.(ts|js)$/,
    /entities\/.*\.(ts|js)$/
  ];

  private readonly bizPatterns = [
    /\.biz\.(ts|js)$/,
    /biz-.*\.(ts|js)$/,
    /controllers\/(?!.*\.base\.).*\.(ts|js)$/,
    /services\/(?!.*\.base\.).*\.(ts|js)$/,
    /modules\/.*\.(ts|js)$/
  ];

  classifyFile(filename: string): 'base' | 'biz' {
    if (this.basePatterns.some(pattern => pattern.test(filename))) {
      return 'base';
    }

    if (this.bizPatterns.some(pattern => pattern.test(filename))) {
      return 'biz';
    }

    // 默认归类为biz层
    return 'biz';
  }

  generateBizImports(baseFiles: GeneratedFile[], outputPath: string): GeneratedFile[] {
    const imports: GeneratedFile[] = [];

    // 为每个base文件生成对应的biz导入文件
    baseFiles.forEach(baseFile => {
      if (this.shouldGenerateBizImport(baseFile)) {
        const bizFile = this.createBizImportFile(baseFile, outputPath);
        imports.push(bizFile);
      }
    });

    return imports;
  }

  private shouldGenerateBizImport(baseFile: GeneratedFile): boolean {
    // 只为控制器和服务生成biz导入文件
    return baseFile.filename.includes('controller') ||
           baseFile.filename.includes('service');
  }

  private createBizImportFile(baseFile: GeneratedFile, outputPath: string): GeneratedFile {
    const bizFilename = baseFile.filename.replace('.base.', '.biz.');
    const baseImportPath = `../base/${baseFile.filename}`;

    const content = `// Auto-generated biz layer file
// This file extends the base implementation
// You can override methods and add custom business logic here

import { ${this.extractClassName(baseFile)} } from '${baseImportPath}';

export class ${this.extractClassName(baseFile).replace('Base', 'Biz')} extends ${this.extractClassName(baseFile)} {
  // Add your custom business logic here
  // Override base methods as needed
}

// Export the biz implementation as default
export { ${this.extractClassName(baseFile).replace('Base', 'Biz')} as ${this.extractClassName(baseFile).replace('Base', '')} };
`;

    return {
      filename: bizFilename,
      path: `${outputPath}/biz/${bizFilename}`,
      content,
      language: baseFile.language,
      size: content.length
    };
  }

  private extractClassName(file: GeneratedFile): string {
    // 从文件内容中提取类名的简单实现
    const classMatch = file.content.match(/export class (\w+)/);
    return classMatch ? classMatch[1] : 'UnknownClass';
  }
}
```

### 8.3 TypeScript路径别名配置

```json
// tsconfig.json 路径别名配置
{
  "compilerOptions": {
    "baseUrl": "./",
    "paths": {
      "@/*": ["src/*"],
      "@base/*": ["src/base/*"],
      "@biz/*": ["src/biz/*"],
      "@shared/*": ["src/shared/*"],
      "@config/*": ["src/config/*"],
      "@utils/*": ["src/utils/*"],
      "@dto/*": ["src/base/dto/*"],
      "@entities/*": ["src/base/entities/*"],
      "@interfaces/*": ["src/base/interfaces/*"],
      "@controllers/*": ["src/biz/controllers/*"],
      "@services/*": ["src/biz/services/*"],
      "@modules/*": ["src/biz/modules/*"]
    }
  }
}
```

## 🚀 9. 部署和运维

### 9.1 Docker配置

```dockerfile
# Dockerfile for generated project
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

FROM node:18-alpine AS runtime

WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./

EXPOSE 3000

CMD ["node", "dist/main.js"]
```

### 9.2 环境配置

```bash
# .env.example for generated project
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/database"

# JWT
JWT_SECRET="your-jwt-secret-key"
JWT_EXPIRES_IN="7d"

# Redis
REDIS_HOST="localhost"
REDIS_PORT=6379
REDIS_PASSWORD=""

# Application
PORT=3000
NODE_ENV="development"

# Swagger
SWAGGER_TITLE="Generated API"
SWAGGER_DESCRIPTION="Auto-generated API documentation"
SWAGGER_VERSION="1.0.0"
```

## 📝 10. 总结和后续规划

### 10.1 核心价值

1. **统一项目上下文** - 解决各模块项目选择分散的问题
2. **深度元数据集成** - 基于实体关系自动生成完整的业务逻辑
3. **智能代码生成** - 支持模板变量、实时预览、批量生成
4. **企业级架构** - base-biz分层、amis规范、完整测试覆盖

### 10.2 技术创新点

1. **元数据驱动** - 从数据模型到完整应用的自动化生成
2. **架构分层** - base-biz模式支持业务定制和基础代码分离
3. **模板引擎** - 强大的变量系统和辅助函数支持
4. **实时预览** - 生成前可预览代码，提升开发体验

### 10.3 后续扩展方向

1. **多框架支持** - 扩展到Spring Boot、Django等其他框架
2. **前端生成** - 支持Vue、React组件和页面生成
3. **微服务架构** - 支持多服务项目的生成和管理
4. **CI/CD集成** - 与DevOps流水线深度集成

这个设计方案提供了一个完整的企业级低代码业务系统后端项目生成器，具有高度的可扩展性和实用性，能够显著提升开发效率和代码质量。
