# 低代码平台开发指南

## 📖 目录

1. [开发环境搭建](#开发环境搭建)
2. [项目架构](#项目架构)
3. [核心概念](#核心概念)
4. [二次开发指南](#二次开发指南)
5. [扩展开发](#扩展开发)
6. [API开发](#api开发)
7. [前端开发](#前端开发)
8. [测试指南](#测试指南)
9. [部署指南](#部署指南)
10. [贡献指南](#贡献指南)

## 🛠️ 开发环境搭建

### 系统要求

- **Node.js**: 18.x 或更高版本
- **pnpm**: 8.x 或更高版本
- **Docker**: 20.x 或更高版本
- **Docker Compose**: 2.x 或更高版本
- **Git**: 2.x 或更高版本

### 开发工具推荐

- **IDE**: VSCode, WebStorm, IntelliJ IDEA
- **数据库工具**: DBeaver, pgAdmin, Redis Desktop Manager
- **API测试**: Postman, Insomnia
- **版本控制**: Git, GitHub Desktop

### 环境配置

#### 1. 克隆项目

```bash
git clone <repository-url>
cd soybean-admin-nestjs
```

#### 2. 安装依赖

```bash
# 后端基础系统
cd backend
pnpm install

# 低代码平台后端
cd ../lowcode-platform-backend
npm install

# 前端
cd ../frontend
pnpm install
```

#### 3. 环境变量配置

```bash
# 复制环境变量模板
cp .env.example .env

# 编辑环境变量
vim .env
```

关键环境变量说明：

```bash
# 数据库配置
DATABASE_URL="postgresql://username:password@localhost:5432/database"

# Redis配置
REDIS_HOST="localhost"
REDIS_PORT=6379
REDIS_PASSWORD="password"

# JWT配置
JWT_SECRET="your-secret-key"
JWT_EXPIRE_IN=3600

# 服务端口
BASE_SYSTEM_PORT=9528
LOWCODE_PLATFORM_PORT=3000
FRONTEND_PORT=9527
```

#### 4. 启动开发环境

```bash
# 启动数据库和缓存
docker-compose up -d postgres redis

# 启动后端服务
cd backend && pnpm run start:dev:base-system
cd ../lowcode-platform-backend && npm run start:dev

# 启动前端服务
cd ../frontend && pnpm run dev
```

## 🏗️ 项目架构

### 整体架构

```
soybean-admin-nestjs/
├── backend/                    # 基础系统后端 (9528端口)
│   ├── src/
│   │   ├── modules/           # 业务模块
│   │   ├── shared/            # 共享模块
│   │   └── main.ts           # 应用入口
│   └── prisma/               # 数据库模式
├── lowcode-platform-backend/  # 低代码平台后端 (3000端口)
│   ├── src/
│   │   ├── lib/
│   │   │   ├── bounded-contexts/  # 领域上下文
│   │   │   │   ├── project/       # 项目管理
│   │   │   │   ├── entity/        # 实体管理
│   │   │   │   ├── api/           # API管理
│   │   │   │   └── codegen/       # 代码生成
│   │   │   ├── shared/            # 共享组件
│   │   │   └── config/            # 配置管理
│   │   └── main.ts               # 应用入口
│   └── prisma/                   # 数据库模式
├── frontend/                     # 前端应用 (9527端口)
│   ├── src/
│   │   ├── views/               # 页面组件
│   │   ├── components/          # 通用组件
│   │   ├── service/             # API服务
│   │   └── stores/              # 状态管理
│   └── public/                  # 静态资源
└── docker-compose.yml           # Docker编排配置
```

### 技术栈

#### 后端技术栈
- **框架**: NestJS (Node.js)
- **语言**: TypeScript
- **数据库**: PostgreSQL + Prisma ORM
- **缓存**: Redis
- **认证**: JWT
- **文档**: Swagger/OpenAPI
- **测试**: Jest

#### 前端技术栈
- **框架**: Vue 3
- **语言**: TypeScript
- **构建工具**: Vite
- **UI库**: Naive UI
- **状态管理**: Pinia
- **路由**: Vue Router
- **HTTP客户端**: Axios
- **测试**: Vitest

### 设计模式

#### 后端设计模式
- **领域驱动设计 (DDD)**: 按业务领域组织代码
- **CQRS**: 命令查询职责分离
- **依赖注入**: NestJS内置DI容器
- **装饰器模式**: 使用装饰器进行配置
- **策略模式**: 代码生成策略

#### 前端设计模式
- **组合式API**: Vue 3 Composition API
- **单向数据流**: Pinia状态管理
- **组件化**: 可复用的UI组件
- **服务层**: API调用封装
- **路由守卫**: 权限控制

## 🧠 核心概念

### 领域模型

#### 项目 (Project)
- **定义**: 低代码开发的基本单位
- **属性**: 名称、描述、版本、状态、配置
- **关系**: 包含多个实体、API配置、代码模板

#### 实体 (Entity)
- **定义**: 业务数据模型
- **属性**: 名称、代码、表名、分类、状态
- **关系**: 属于项目，包含多个字段，参与关系

#### 字段 (Field)
- **定义**: 实体的属性
- **属性**: 名称、类型、约束、默认值
- **类型**: VARCHAR, INTEGER, BOOLEAN, DATE等

#### 关系 (Relationship)
- **定义**: 实体间的关联
- **类型**: 一对一、一对多、多对多
- **约束**: 级联删除、级联更新

#### API配置 (ApiConfig)
- **定义**: REST API的配置
- **属性**: 路径、方法、参数、响应格式
- **功能**: 查询、过滤、分页、排序

#### 代码模板 (CodeTemplate)
- **定义**: 代码生成的模板
- **语法**: Handlebars模板语法
- **变量**: 支持动态变量替换
- **版本**: 支持模板版本管理

### 代码生成流程

```mermaid
graph TD
    A[选择实体] --> B[选择模板]
    B --> C[配置变量]
    C --> D[生成代码]
    D --> E[代码预览]
    E --> F[确认生成]
    F --> G[写入文件]
    G --> H[完成]
```

### 数据流

```mermaid
graph LR
    A[前端请求] --> B[路由分发]
    B --> C[基础系统API]
    B --> D[低代码平台API]
    C --> E[业务逻辑处理]
    D --> F[领域服务处理]
    E --> G[数据库操作]
    F --> G
    G --> H[返回响应]
```

## 🔧 二次开发指南

### 扩展实体字段类型

#### 1. 添加新的字段类型

在 `lowcode-platform-backend/src/lib/bounded-contexts/entity/domain/field-type.enum.ts` 中添加新类型：

```typescript
export enum FieldType {
  // 现有类型...
  CUSTOM_TYPE = 'CUSTOM_TYPE',  // 新增类型
}
```

#### 2. 更新字段验证

在 `field.service.ts` 中添加验证逻辑：

```typescript
private validateFieldType(field: CreateFieldDto): void {
  switch (field.type) {
    case FieldType.CUSTOM_TYPE:
      // 添加自定义类型的验证逻辑
      this.validateCustomType(field);
      break;
    // 其他类型...
  }
}

private validateCustomType(field: CreateFieldDto): void {
  // 实现自定义验证逻辑
  if (!field.customConfig) {
    throw new BadRequestException('Custom type requires customConfig');
  }
}
```

#### 3. 更新前端组件

在 `frontend/src/views/lowcode/entity/components/FieldForm.vue` 中添加UI支持：

```vue
<template>
  <n-form-item label="字段类型">
    <n-select v-model:value="formData.type" :options="fieldTypeOptions" />
  </n-form-item>
  
  <!-- 自定义类型的配置 -->
  <n-form-item v-if="formData.type === 'CUSTOM_TYPE'" label="自定义配置">
    <CustomTypeConfig v-model:value="formData.customConfig" />
  </n-form-item>
</template>

<script setup lang="ts">
const fieldTypeOptions = [
  // 现有选项...
  { label: '自定义类型', value: 'CUSTOM_TYPE' },
];
</script>
```

### 扩展代码生成模板

#### 1. 创建新的模板类型

```typescript
// lowcode-platform-backend/src/lib/bounded-contexts/codegen/domain/template-category.enum.ts
export enum TemplateCategory {
  // 现有类型...
  CUSTOM_COMPONENT = 'custom-component',
}
```

#### 2. 实现模板处理器

```typescript
// lowcode-platform-backend/src/lib/bounded-contexts/codegen/application/template-processors/custom-component.processor.ts
@Injectable()
export class CustomComponentProcessor implements TemplateProcessor {
  process(template: CodeTemplate, context: GenerationContext): string {
    // 实现自定义模板处理逻辑
    const handlebars = Handlebars.create();
    
    // 注册自定义助手函数
    handlebars.registerHelper('customHelper', (value) => {
      return value.toUpperCase();
    });
    
    const compiledTemplate = handlebars.compile(template.content);
    return compiledTemplate(context.variables);
  }
}
```

#### 3. 注册处理器

```typescript
// lowcode-platform-backend/src/lib/bounded-contexts/codegen/codegen.module.ts
@Module({
  providers: [
    // 现有处理器...
    CustomComponentProcessor,
    {
      provide: 'TEMPLATE_PROCESSORS',
      useFactory: (
        // 现有处理器...
        customProcessor: CustomComponentProcessor,
      ) => new Map([
        // 现有映射...
        [TemplateCategory.CUSTOM_COMPONENT, customProcessor],
      ]),
      inject: [
        // 现有依赖...
        CustomComponentProcessor,
      ],
    },
  ],
})
export class CodegenModule {}
```

### 扩展API功能

#### 1. 添加新的API端点

```typescript
// lowcode-platform-backend/src/lib/bounded-contexts/api/presentation/api-config.controller.ts
@Controller('api-configs')
export class ApiConfigController {
  // 现有方法...

  @Post(':id/custom-action')
  @ApiOperation({ summary: '自定义API操作' })
  async customAction(
    @Param('id') id: string,
    @Body() dto: CustomActionDto,
  ): Promise<any> {
    return this.apiConfigService.executeCustomAction(id, dto);
  }
}
```

#### 2. 实现业务逻辑

```typescript
// lowcode-platform-backend/src/lib/bounded-contexts/api/application/api-config.service.ts
@Injectable()
export class ApiConfigService {
  // 现有方法...

  async executeCustomAction(id: string, dto: CustomActionDto): Promise<any> {
    const apiConfig = await this.findById(id);
    
    // 实现自定义操作逻辑
    switch (dto.action) {
      case 'export':
        return this.exportApiConfig(apiConfig);
      case 'validate':
        return this.validateApiConfig(apiConfig);
      default:
        throw new BadRequestException('Unknown action');
    }
  }

  private async exportApiConfig(apiConfig: ApiConfig): Promise<any> {
    // 实现导出逻辑
    return {
      openapi: '3.0.0',
      info: {
        title: apiConfig.name,
        version: '1.0.0',
      },
      paths: {
        [apiConfig.path]: {
          [apiConfig.method.toLowerCase()]: {
            summary: apiConfig.description,
            // 更多OpenAPI配置...
          },
        },
      },
    };
  }
}
```

#### 3. 添加前端调用

```typescript
// frontend/src/service/api/lowcode-api-config.ts
export function fetchCustomAction(id: string, action: string) {
  return lowcodeRequest<any>({
    url: `/api-configs/${id}/custom-action`,
    method: 'post',
    data: { action },
  });
}
```

### 扩展前端组件

#### 1. 创建自定义组件

```vue
<!-- frontend/src/components/lowcode/CustomEntityDesigner.vue -->
<template>
  <div class="custom-entity-designer">
    <div class="toolbar">
      <n-button @click="addEntity">添加实体</n-button>
      <n-button @click="saveDesign">保存设计</n-button>
    </div>
    
    <div class="canvas" ref="canvasRef">
      <EntityNode
        v-for="entity in entities"
        :key="entity.id"
        :entity="entity"
        @update="updateEntity"
        @delete="deleteEntity"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useEntityDesigner } from '@/hooks/useEntityDesigner';

const canvasRef = ref<HTMLElement>();
const { entities, addEntity, updateEntity, deleteEntity, saveDesign } = useEntityDesigner();

onMounted(() => {
  // 初始化画布
  initCanvas();
});

function initCanvas() {
  // 实现画布初始化逻辑
  // 可以集成第三方图形库如 Konva.js, Fabric.js 等
}
</script>
```

#### 2. 创建自定义Hook

```typescript
// frontend/src/hooks/useEntityDesigner.ts
import { ref, reactive } from 'vue';
import { fetchEntityList, fetchAddEntity } from '@/service/api';

export function useEntityDesigner() {
  const entities = ref<Entity[]>([]);
  const selectedEntity = ref<Entity | null>(null);

  const addEntity = async (entityData: Partial<Entity>) => {
    try {
      const newEntity = await fetchAddEntity(entityData);
      entities.value.push(newEntity);
      return newEntity;
    } catch (error) {
      console.error('Failed to add entity:', error);
      throw error;
    }
  };

  const updateEntity = async (id: string, updates: Partial<Entity>) => {
    try {
      const updatedEntity = await fetchUpdateEntity(id, updates);
      const index = entities.value.findIndex(e => e.id === id);
      if (index !== -1) {
        entities.value[index] = updatedEntity;
      }
      return updatedEntity;
    } catch (error) {
      console.error('Failed to update entity:', error);
      throw error;
    }
  };

  const deleteEntity = async (id: string) => {
    try {
      await fetchDeleteEntity(id);
      entities.value = entities.value.filter(e => e.id !== id);
    } catch (error) {
      console.error('Failed to delete entity:', error);
      throw error;
    }
  };

  const saveDesign = async () => {
    // 实现设计保存逻辑
    try {
      const designData = {
        entities: entities.value,
        layout: getCanvasLayout(),
      };
      await fetchSaveDesign(designData);
    } catch (error) {
      console.error('Failed to save design:', error);
      throw error;
    }
  };

  return {
    entities,
    selectedEntity,
    addEntity,
    updateEntity,
    deleteEntity,
    saveDesign,
  };
}
```

## 🚀 扩展开发

### 插件系统

#### 1. 插件接口定义

```typescript
// lowcode-platform-backend/src/lib/shared/interfaces/plugin.interface.ts
export interface Plugin {
  name: string;
  version: string;
  description: string;
  
  install(app: INestApplication): Promise<void>;
  uninstall(app: INestApplication): Promise<void>;
}

export interface FieldTypePlugin extends Plugin {
  getFieldTypes(): FieldTypeDefinition[];
  validateField(field: any): boolean;
  generateCode(field: any, template: string): string;
}

export interface TemplatePlugin extends Plugin {
  getTemplates(): TemplateDefinition[];
  processTemplate(template: string, context: any): string;
}
```

#### 2. 插件管理器

```typescript
// lowcode-platform-backend/src/lib/shared/services/plugin-manager.service.ts
@Injectable()
export class PluginManager {
  private plugins = new Map<string, Plugin>();

  async loadPlugin(pluginPath: string): Promise<void> {
    try {
      const pluginModule = await import(pluginPath);
      const plugin: Plugin = new pluginModule.default();
      
      await plugin.install(this.app);
      this.plugins.set(plugin.name, plugin);
      
      console.log(`Plugin ${plugin.name} loaded successfully`);
    } catch (error) {
      console.error(`Failed to load plugin from ${pluginPath}:`, error);
      throw error;
    }
  }

  async unloadPlugin(pluginName: string): Promise<void> {
    const plugin = this.plugins.get(pluginName);
    if (plugin) {
      await plugin.uninstall(this.app);
      this.plugins.delete(pluginName);
      console.log(`Plugin ${pluginName} unloaded successfully`);
    }
  }

  getPlugin<T extends Plugin>(pluginName: string): T | undefined {
    return this.plugins.get(pluginName) as T;
  }

  getAllPlugins(): Plugin[] {
    return Array.from(this.plugins.values());
  }
}
```

#### 3. 示例插件

```typescript
// plugins/custom-field-types/index.ts
export default class CustomFieldTypesPlugin implements FieldTypePlugin {
  name = 'custom-field-types';
  version = '1.0.0';
  description = 'Custom field types plugin';

  async install(app: INestApplication): Promise<void> {
    // 注册自定义字段类型
    const fieldTypeRegistry = app.get(FieldTypeRegistry);
    
    this.getFieldTypes().forEach(fieldType => {
      fieldTypeRegistry.register(fieldType);
    });
  }

  async uninstall(app: INestApplication): Promise<void> {
    // 清理注册的字段类型
    const fieldTypeRegistry = app.get(FieldTypeRegistry);
    
    this.getFieldTypes().forEach(fieldType => {
      fieldTypeRegistry.unregister(fieldType.name);
    });
  }

  getFieldTypes(): FieldTypeDefinition[] {
    return [
      {
        name: 'EMAIL',
        label: '邮箱',
        validation: {
          pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
          message: '请输入有效的邮箱地址',
        },
        defaultValue: '',
        inputComponent: 'EmailInput',
      },
      {
        name: 'PHONE',
        label: '手机号',
        validation: {
          pattern: /^1[3-9]\d{9}$/,
          message: '请输入有效的手机号码',
        },
        defaultValue: '',
        inputComponent: 'PhoneInput',
      },
    ];
  }

  validateField(field: any): boolean {
    const fieldType = this.getFieldTypes().find(ft => ft.name === field.type);
    if (!fieldType) return true;

    if (fieldType.validation?.pattern) {
      return fieldType.validation.pattern.test(field.value);
    }

    return true;
  }

  generateCode(field: any, template: string): string {
    // 实现代码生成逻辑
    return template.replace(/{{fieldType}}/g, field.type);
  }
}
```

### 主题系统

#### 1. 主题配置

```typescript
// frontend/src/themes/theme.interface.ts
export interface Theme {
  name: string;
  colors: {
    primary: string;
    secondary: string;
    success: string;
    warning: string;
    error: string;
    background: string;
    surface: string;
    text: string;
  };
  typography: {
    fontFamily: string;
    fontSize: {
      small: string;
      medium: string;
      large: string;
    };
  };
  spacing: {
    small: string;
    medium: string;
    large: string;
  };
  borderRadius: string;
  shadows: {
    small: string;
    medium: string;
    large: string;
  };
}
```

#### 2. 主题管理

```typescript
// frontend/src/stores/theme.ts
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { Theme } from '@/themes/theme.interface';
import { defaultTheme, darkTheme } from '@/themes';

export const useThemeStore = defineStore('theme', () => {
  const currentTheme = ref<Theme>(defaultTheme);
  const isDark = ref(false);

  const theme = computed(() => currentTheme.value);

  const setTheme = (theme: Theme) => {
    currentTheme.value = theme;
    applyTheme(theme);
  };

  const toggleDarkMode = () => {
    isDark.value = !isDark.value;
    setTheme(isDark.value ? darkTheme : defaultTheme);
  };

  const applyTheme = (theme: Theme) => {
    const root = document.documentElement;
    
    Object.entries(theme.colors).forEach(([key, value]) => {
      root.style.setProperty(`--color-${key}`, value);
    });

    Object.entries(theme.typography.fontSize).forEach(([key, value]) => {
      root.style.setProperty(`--font-size-${key}`, value);
    });

    root.style.setProperty('--font-family', theme.typography.fontFamily);
    root.style.setProperty('--border-radius', theme.borderRadius);
  };

  return {
    theme,
    isDark,
    setTheme,
    toggleDarkMode,
  };
});
```

### 国际化支持

#### 1. 多语言配置

```typescript
// frontend/src/locales/index.ts
import { createI18n } from 'vue-i18n';
import zhCN from './zh-CN.json';
import enUS from './en-US.json';

const messages = {
  'zh-CN': zhCN,
  'en-US': enUS,
};

export const i18n = createI18n({
  legacy: false,
  locale: 'zh-CN',
  fallbackLocale: 'en-US',
  messages,
});
```

#### 2. 语言文件

```json
// frontend/src/locales/zh-CN.json
{
  "common": {
    "save": "保存",
    "cancel": "取消",
    "delete": "删除",
    "edit": "编辑",
    "add": "添加",
    "search": "搜索"
  },
  "project": {
    "title": "项目管理",
    "create": "创建项目",
    "name": "项目名称",
    "description": "项目描述",
    "status": "项目状态"
  },
  "entity": {
    "title": "实体管理",
    "create": "创建实体",
    "name": "实体名称",
    "code": "实体代码",
    "tableName": "表名"
  }
}
```

```json
// frontend/src/locales/en-US.json
{
  "common": {
    "save": "Save",
    "cancel": "Cancel",
    "delete": "Delete",
    "edit": "Edit",
    "add": "Add",
    "search": "Search"
  },
  "project": {
    "title": "Project Management",
    "create": "Create Project",
    "name": "Project Name",
    "description": "Project Description",
    "status": "Project Status"
  },
  "entity": {
    "title": "Entity Management",
    "create": "Create Entity",
    "name": "Entity Name",
    "code": "Entity Code",
    "tableName": "Table Name"
  }
}
```

## 📝 API开发

### RESTful API设计原则

#### 1. 资源命名

```
GET    /api/projects              # 获取项目列表
GET    /api/projects/{id}         # 获取单个项目
POST   /api/projects              # 创建项目
PUT    /api/projects/{id}         # 更新项目
DELETE /api/projects/{id}         # 删除项目

GET    /api/projects/{id}/entities    # 获取项目下的实体
POST   /api/projects/{id}/entities    # 在项目下创建实体
```

#### 2. 状态码使用

```typescript
// 成功响应
200 OK          # 获取资源成功
201 Created     # 创建资源成功
204 No Content  # 删除资源成功

// 客户端错误
400 Bad Request     # 请求参数错误
401 Unauthorized    # 未认证
403 Forbidden       # 无权限
404 Not Found       # 资源不存在
409 Conflict        # 资源冲突

// 服务器错误
500 Internal Server Error  # 服务器内部错误
```

#### 3. 响应格式

```typescript
// 成功响应格式
interface SuccessResponse<T> {
  success: true;
  data: T;
  message?: string;
}

// 错误响应格式
interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
  };
}

// 分页响应格式
interface PaginatedResponse<T> {
  success: true;
  data: {
    records: T[];
    total: number;
    current: number;
    size: number;
  };
}
```

### API文档生成

#### 1. Swagger配置

```typescript
// lowcode-platform-backend/src/main.ts
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Swagger配置
  const config = new DocumentBuilder()
    .setTitle('Low-code Platform API')
    .setDescription('API documentation for low-code platform')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document);

  await app.listen(3000);
}
```

#### 2. API装饰器使用

```typescript
@Controller('projects')
@ApiTags('项目管理')
export class ProjectController {
  @Get()
  @ApiOperation({ summary: '获取项目列表' })
  @ApiQuery({ name: 'page', required: false, description: '页码' })
  @ApiQuery({ name: 'size', required: false, description: '每页大小' })
  @ApiResponse({ status: 200, description: '获取成功', type: PaginatedProjectDto })
  async findAll(@Query() query: FindProjectsDto): Promise<PaginatedResponse<Project>> {
    return this.projectService.findAll(query);
  }

  @Post()
  @ApiOperation({ summary: '创建项目' })
  @ApiBody({ type: CreateProjectDto })
  @ApiResponse({ status: 201, description: '创建成功', type: ProjectDto })
  @ApiResponse({ status: 400, description: '请求参数错误' })
  async create(@Body() createProjectDto: CreateProjectDto): Promise<Project> {
    return this.projectService.create(createProjectDto);
  }
}
```

### 错误处理

#### 1. 全局异常过滤器

```typescript
// lowcode-platform-backend/src/lib/shared/filters/http-exception.filter.ts
@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();

    const errorResponse = {
      success: false,
      error: {
        code: exception.constructor.name,
        message: exception.message,
        timestamp: new Date().toISOString(),
        path: request.url,
      },
    };

    response.status(status).json(errorResponse);
  }
}
```

#### 2. 自定义异常

```typescript
// lowcode-platform-backend/src/lib/shared/exceptions/business.exception.ts
export class BusinessException extends HttpException {
  constructor(message: string, code?: string) {
    super(
      {
        code: code || 'BUSINESS_ERROR',
        message,
      },
      HttpStatus.BAD_REQUEST,
    );
  }
}

export class ResourceNotFoundException extends HttpException {
  constructor(resource: string, id: string) {
    super(
      {
        code: 'RESOURCE_NOT_FOUND',
        message: `${resource} with id ${id} not found`,
      },
      HttpStatus.NOT_FOUND,
    );
  }
}
```

## 🎨 前端开发

### 组件开发规范

#### 1. 组件结构

```vue
<template>
  <!-- 模板内容 -->
</template>

<script setup lang="ts">
// 导入
import { ref, computed, onMounted } from 'vue';
import type { ComponentProps } from './types';

// 接口定义
interface Props {
  // 属性定义
}

interface Emits {
  // 事件定义
}

// Props和Emits
const props = withDefaults(defineProps<Props>(), {
  // 默认值
});

const emit = defineEmits<Emits>();

// 响应式数据
const state = ref();

// 计算属性
const computed = computed(() => {
  // 计算逻辑
});

// 方法
const methods = () => {
  // 方法实现
};

// 生命周期
onMounted(() => {
  // 初始化逻辑
});
</script>

<style scoped>
/* 样式 */
</style>
```

#### 2. 状态管理

```typescript
// frontend/src/stores/project.ts
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { fetchProjectList, fetchAddProject } from '@/service/api';
import type { Project, CreateProjectDto } from '@/types';

export const useProjectStore = defineStore('project', () => {
  // 状态
  const projects = ref<Project[]>([]);
  const currentProject = ref<Project | null>(null);
  const loading = ref(false);

  // 计算属性
  const activeProjects = computed(() => 
    projects.value.filter(p => p.status === 'ACTIVE')
  );

  // 操作
  const loadProjects = async () => {
    loading.value = true;
    try {
      const response = await fetchProjectList();
      projects.value = response.data;
    } catch (error) {
      console.error('Failed to load projects:', error);
    } finally {
      loading.value = false;
    }
  };

  const createProject = async (projectData: CreateProjectDto) => {
    try {
      const newProject = await fetchAddProject(projectData);
      projects.value.push(newProject);
      return newProject;
    } catch (error) {
      console.error('Failed to create project:', error);
      throw error;
    }
  };

  const setCurrentProject = (project: Project) => {
    currentProject.value = project;
  };

  return {
    // 状态
    projects,
    currentProject,
    loading,
    // 计算属性
    activeProjects,
    // 操作
    loadProjects,
    createProject,
    setCurrentProject,
  };
});
```

### 路由配置

#### 1. 路由定义

```typescript
// frontend/src/router/modules/lowcode.ts
import type { RouteRecordRaw } from 'vue-router';

const lowcodeRoutes: RouteRecordRaw[] = [
  {
    path: '/lowcode',
    name: 'Lowcode',
    component: () => import('@/layouts/LowcodeLayout.vue'),
    meta: {
      title: '低代码平台',
      requiresAuth: true,
    },
    children: [
      {
        path: 'projects',
        name: 'LowcodeProjects',
        component: () => import('@/views/lowcode/project/index.vue'),
        meta: {
          title: '项目管理',
        },
      },
      {
        path: 'projects/:id',
        name: 'LowcodeProjectDetail',
        component: () => import('@/views/lowcode/project/detail.vue'),
        meta: {
          title: '项目详情',
        },
      },
      {
        path: 'projects/:id/entities',
        name: 'LowcodeEntities',
        component: () => import('@/views/lowcode/entity/index.vue'),
        meta: {
          title: '实体管理',
        },
      },
    ],
  },
];

export default lowcodeRoutes;
```

#### 2. 路由守卫

```typescript
// frontend/src/router/guard.ts
import type { Router } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

export function setupRouterGuard(router: Router) {
  router.beforeEach(async (to, from, next) => {
    const authStore = useAuthStore();

    // 检查认证
    if (to.meta.requiresAuth && !authStore.isAuthenticated) {
      next('/login');
      return;
    }

    // 检查权限
    if (to.meta.permissions && !authStore.hasPermissions(to.meta.permissions)) {
      next('/403');
      return;
    }

    next();
  });
}
```

## 🧪 测试指南

### 单元测试

#### 1. 后端单元测试

```typescript
// lowcode-platform-backend/src/lib/bounded-contexts/project/application/project.service.spec.ts
describe('ProjectService', () => {
  let service: ProjectService;
  let repository: ProjectRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProjectService,
        {
          provide: ProjectRepository,
          useValue: {
            findAll: jest.fn(),
            findById: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<ProjectService>(ProjectService);
    repository = module.get<ProjectRepository>(ProjectRepository);
  });

  describe('create', () => {
    it('should create a project successfully', async () => {
      const createDto = {
        name: 'Test Project',
        description: 'Test Description',
        version: '1.0.0',
        status: 'ACTIVE',
      };

      const expectedProject = {
        id: '1',
        ...createDto,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      jest.spyOn(repository, 'create').mockResolvedValue(expectedProject);

      const result = await service.create(createDto);

      expect(repository.create).toHaveBeenCalledWith(createDto);
      expect(result).toEqual(expectedProject);
    });

    it('should throw error when name is duplicate', async () => {
      const createDto = {
        name: 'Duplicate Project',
        description: 'Test Description',
        version: '1.0.0',
        status: 'ACTIVE',
      };

      jest.spyOn(repository, 'create').mockRejectedValue(
        new Error('Project name already exists')
      );

      await expect(service.create(createDto)).rejects.toThrow(
        'Project name already exists'
      );
    });
  });
});
```

#### 2. 前端单元测试

```typescript
// frontend/src/components/lowcode/ProjectCard.test.ts
import { mount } from '@vue/test-utils';
import { describe, it, expect } from 'vitest';
import ProjectCard from './ProjectCard.vue';

describe('ProjectCard', () => {
  const mockProject = {
    id: '1',
    name: 'Test Project',
    description: 'Test Description',
    status: 'ACTIVE',
    createdAt: '2024-01-01T00:00:00Z',
  };

  it('should render project information correctly', () => {
    const wrapper = mount(ProjectCard, {
      props: { project: mockProject },
    });

    expect(wrapper.find('.project-name').text()).toBe('Test Project');
    expect(wrapper.find('.project-description').text()).toBe('Test Description');
    expect(wrapper.find('.project-status').text()).toBe('ACTIVE');
  });

  it('should emit edit event when edit button is clicked', async () => {
    const wrapper = mount(ProjectCard, {
      props: { project: mockProject },
    });

    await wrapper.find('.edit-button').trigger('click');

    expect(wrapper.emitted('edit')).toBeTruthy();
    expect(wrapper.emitted('edit')[0]).toEqual([mockProject]);
  });

  it('should emit delete event when delete button is clicked', async () => {
    const wrapper = mount(ProjectCard, {
      props: { project: mockProject },
    });

    await wrapper.find('.delete-button').trigger('click');

    expect(wrapper.emitted('delete')).toBeTruthy();
    expect(wrapper.emitted('delete')[0]).toEqual([mockProject.id]);
  });
});
```

### 集成测试

#### 1. API集成测试

```typescript
// lowcode-platform-backend/test/integration/project.integration.spec.ts
describe('Project Integration Tests', () => {
  let app: INestApplication;
  let authToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    // 获取认证token
    authToken = await getAuthToken(app);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /projects', () => {
    it('should create a project successfully', async () => {
      const projectData = {
        name: 'Integration Test Project',
        description: 'Test project for integration testing',
        version: '1.0.0',
        status: 'ACTIVE',
      };

      const response = await request(app.getHttpServer())
        .post('/projects')
        .set('Authorization', `Bearer ${authToken}`)
        .send(projectData)
        .expect(201);

      expect(response.body).toMatchObject({
        name: projectData.name,
        description: projectData.description,
        version: projectData.version,
        status: projectData.status,
      });

      expect(response.body.id).toBeDefined();
      expect(response.body.createdAt).toBeDefined();
    });
  });
});
```

### 端到端测试

#### 1. Playwright E2E测试

```typescript
// e2e/project-management.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Project Management', () => {
  test.beforeEach(async ({ page }) => {
    // 登录
    await page.goto('/login');
    await page.fill('[data-testid="username"]', 'admin');
    await page.fill('[data-testid="password"]', 'admin123');
    await page.click('[data-testid="login-button"]');
    
    // 等待登录完成
    await page.waitForURL('/dashboard');
  });

  test('should create a new project', async ({ page }) => {
    // 导航到项目管理页面
    await page.goto('/lowcode/projects');
    
    // 点击创建项目按钮
    await page.click('[data-testid="create-project-button"]');
    
    // 填写项目信息
    await page.fill('[data-testid="project-name"]', 'E2E Test Project');
    await page.fill('[data-testid="project-description"]', 'Project created by E2E test');
    await page.selectOption('[data-testid="project-status"]', 'ACTIVE');
    
    // 提交表单
    await page.click('[data-testid="submit-button"]');
    
    // 验证项目创建成功
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
    await expect(page.locator('text=E2E Test Project')).toBeVisible();
  });

  test('should edit an existing project', async ({ page }) => {
    await page.goto('/lowcode/projects');
    
    // 点击第一个项目的编辑按钮
    await page.click('[data-testid="project-item"]:first-child [data-testid="edit-button"]');
    
    // 修改项目名称
    await page.fill('[data-testid="project-name"]', 'Updated Project Name');
    
    // 保存修改
    await page.click('[data-testid="submit-button"]');
    
    // 验证修改成功
    await expect(page.locator('text=Updated Project Name')).toBeVisible();
  });
});
```

## 🚀 部署指南

### 开发环境部署

参考前面的[开发环境搭建](#开发环境搭建)部分。

### 生产环境部署

#### 1. 环境准备

```bash
# 安装Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 安装pnpm
npm install -g pnpm

# 安装Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# 安装Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

#### 2. 应用构建

```bash
# 构建后端应用
cd backend
pnpm install --frozen-lockfile
pnpm run build

cd ../lowcode-platform-backend
npm ci --only=production
npm run build

# 构建前端应用
cd ../frontend
pnpm install --frozen-lockfile
pnpm run build
```

#### 3. Docker部署

```bash
# 使用Docker Compose部署
docker-compose -f docker-compose.prod.yml up -d

# 检查服务状态
docker-compose ps

# 查看日志
docker-compose logs -f
```

#### 4. Nginx配置

```nginx
# /etc/nginx/sites-available/lowcode-platform
server {
    listen 80;
    server_name your-domain.com;
    
    # 重定向到HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;
    
    # SSL配置
    ssl_certificate /path/to/ssl/cert.pem;
    ssl_certificate_key /path/to/ssl/key.pem;
    
    # 前端静态文件
    location / {
        root /var/www/lowcode-platform/frontend/dist;
        try_files $uri $uri/ /index.html;
        
        # 缓存配置
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
    
    # API代理
    location /v1/ {
        proxy_pass http://localhost:9528;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### 监控和日志

#### 1. 应用监控

```typescript
// lowcode-platform-backend/src/lib/shared/middleware/metrics.middleware.ts
import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import * as prometheus from 'prom-client';

@Injectable()
export class MetricsMiddleware implements NestMiddleware {
  private readonly httpRequestDuration = new prometheus.Histogram({
    name: 'http_request_duration_seconds',
    help: 'Duration of HTTP requests in seconds',
    labelNames: ['method', 'route', 'status'],
  });

  private readonly httpRequestTotal = new prometheus.Counter({
    name: 'http_requests_total',
    help: 'Total number of HTTP requests',
    labelNames: ['method', 'route', 'status'],
  });

  use(req: Request, res: Response, next: NextFunction) {
    const start = Date.now();

    res.on('finish', () => {
      const duration = (Date.now() - start) / 1000;
      const labels = {
        method: req.method,
        route: req.route?.path || req.path,
        status: res.statusCode.toString(),
      };

      this.httpRequestDuration.observe(labels, duration);
      this.httpRequestTotal.inc(labels);
    });

    next();
  }
}
```

#### 2. 日志配置

```typescript
// lowcode-platform-backend/src/lib/shared/logger/logger.service.ts
import { Injectable, LoggerService } from '@nestjs/common';
import * as winston from 'winston';

@Injectable()
export class CustomLoggerService implements LoggerService {
  private readonly logger: winston.Logger;

  constructor() {
    this.logger = winston.createLogger({
      level: process.env.LOG_LEVEL || 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json(),
      ),
      transports: [
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple(),
          ),
        }),
        new winston.transports.File({
          filename: 'logs/error.log',
          level: 'error',
        }),
        new winston.transports.File({
          filename: 'logs/combined.log',
        }),
      ],
    });
  }

  log(message: string, context?: string) {
    this.logger.info(message, { context });
  }

  error(message: string, trace?: string, context?: string) {
    this.logger.error(message, { trace, context });
  }

  warn(message: string, context?: string) {
    this.logger.warn(message, { context });
  }

  debug(message: string, context?: string) {
    this.logger.debug(message, { context });
  }

  verbose(message: string, context?: string) {
    this.logger.verbose(message, { context });
  }
}
```

## 🤝 贡献指南

### 开发流程

1. **Fork项目**
   ```bash
   # Fork项目到你的GitHub账号
   # 然后克隆到本地
   git clone https://github.com/your-username/soybean-admin-nestjs.git
   cd soybean-admin-nestjs
   ```

2. **创建功能分支**
   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **开发和测试**
   ```bash
   # 安装依赖
   pnpm install
   
   # 运行测试
   pnpm run test
   
   # 运行E2E测试
   pnpm run test:e2e
   ```

4. **提交代码**
   ```bash
   git add .
   git commit -m "feat: add your feature description"
   git push origin feature/your-feature-name
   ```

5. **创建Pull Request**
   - 在GitHub上创建Pull Request
   - 填写详细的描述和变更说明
   - 等待代码审查

### 代码规范

#### 1. 提交信息规范

使用[Conventional Commits](https://www.conventionalcommits.org/)规范：

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

类型说明：
- `feat`: 新功能
- `fix`: 修复bug
- `docs`: 文档更新
- `style`: 代码格式调整
- `refactor`: 代码重构
- `test`: 测试相关
- `chore`: 构建过程或辅助工具的变动

示例：
```
feat(entity): add field validation support

Add comprehensive field validation including:
- Type validation
- Length constraints
- Custom validation rules

Closes #123
```

#### 2. 代码风格

- 使用ESLint和Prettier进行代码格式化
- 遵循TypeScript最佳实践
- 编写清晰的注释和文档
- 保持代码简洁和可读性

#### 3. 测试要求

- 新功能必须包含单元测试
- 重要功能需要集成测试
- 测试覆盖率不低于80%
- 所有测试必须通过

### 问题报告

使用GitHub Issues报告问题时，请包含：

1. **问题描述**: 清晰描述遇到的问题
2. **重现步骤**: 详细的重现步骤
3. **期望行为**: 期望的正确行为
4. **实际行为**: 实际发生的行为
5. **环境信息**: 操作系统、浏览器、Node.js版本等
6. **截图或日志**: 相关的截图或错误日志

### 功能请求

提交功能请求时，请说明：

1. **功能描述**: 详细描述需要的功能
2. **使用场景**: 什么情况下会用到这个功能
3. **预期收益**: 这个功能能带来什么价值
4. **实现建议**: 如果有实现想法，可以分享

---

**感谢您对低代码平台的贡献！** 🎉
