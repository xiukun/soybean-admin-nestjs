# 模板管理功能需求文档

## 📋 项目概述

### 项目背景
低代码平台需要一个完整的模板管理系统，用于管理和维护各种代码模板，支持用户创建、编辑、发布和使用模板来快速生成代码。

### 项目目标
- 提供完整的模板生命周期管理
- 支持多种编程语言和框架的模板
- 实现模板版本控制和发布机制
- 提供模板变量和参数化功能
- 支持模板分类和标签管理
- 实现模板使用统计和评分系统

## 🎯 功能需求

### 1. 模板基础管理

#### 1.1 模板CRUD操作
- **创建模板**
  - 支持手动创建模板
  - 支持从现有代码导入模板
  - 支持模板复制和克隆
  
- **编辑模板**
  - 在线代码编辑器（Monaco Editor）
  - 语法高亮和代码提示
  - 实时预览功能
  
- **删除模板**
  - 软删除机制
  - 删除前依赖检查
  - 批量删除功能

- **查询模板**
  - 分页查询
  - 多条件筛选（分类、语言、框架、状态等）
  - 全文搜索
  - 排序功能

#### 1.2 模板分类管理
```typescript
enum TemplateCategory {
  CONTROLLER = 'CONTROLLER',     // 控制器模板
  SERVICE = 'SERVICE',           // 服务层模板
  MODEL = 'MODEL',               // 数据模型模板
  DTO = 'DTO',                   // 数据传输对象模板
  COMPONENT = 'COMPONENT',       // 前端组件模板
  PAGE = 'PAGE',                 // 页面模板
  CONFIG = 'CONFIG',             // 配置文件模板
  TEST = 'TEST',                 // 测试代码模板
  UTIL = 'UTIL',                 // 工具类模板
  MIDDLEWARE = 'MIDDLEWARE',     // 中间件模板
}
```

#### 1.3 编程语言支持
```typescript
enum TemplateLanguage {
  TYPESCRIPT = 'TYPESCRIPT',
  JAVASCRIPT = 'JAVASCRIPT',
  JAVA = 'JAVA',
  PYTHON = 'PYTHON',
  CSHARP = 'CSHARP',
  GO = 'GO',
  PHP = 'PHP',
  RUST = 'RUST',
  KOTLIN = 'KOTLIN',
  SWIFT = 'SWIFT',
}
```

#### 1.4 框架支持
```typescript
enum TemplateFramework {
  // Backend Frameworks
  NESTJS = 'NESTJS',
  EXPRESS = 'EXPRESS',
  SPRING = 'SPRING',
  DJANGO = 'DJANGO',
  FLASK = 'FLASK',
  DOTNET = 'DOTNET',
  GIN = 'GIN',
  LARAVEL = 'LARAVEL',
  
  // Frontend Frameworks
  VUE = 'VUE',
  REACT = 'REACT',
  ANGULAR = 'ANGULAR',
  SVELTE = 'SVELTE',
  NUXT = 'NUXT',
  NEXT = 'NEXT',
}
```

### 2. 模板版本管理

#### 2.1 版本控制
- **版本创建**
  - 语义化版本号（Semantic Versioning）
  - 版本变更日志
  - 版本比较功能
  
- **版本发布**
  - 发布流程管理
  - 发布前验证
  - 发布状态跟踪
  
- **版本回滚**
  - 支持回滚到任意版本
  - 回滚影响分析
  - 回滚确认机制

#### 2.2 模板状态管理
```typescript
enum TemplateStatus {
  DRAFT = 'DRAFT',           // 草稿状态
  REVIEW = 'REVIEW',         // 审核中
  PUBLISHED = 'PUBLISHED',   // 已发布
  DEPRECATED = 'DEPRECATED', // 已废弃
  ARCHIVED = 'ARCHIVED',     // 已归档
}
```

### 3. 模板变量系统

#### 3.1 变量定义
```typescript
interface TemplateVariable {
  name: string;                    // 变量名
  type: VariableType;             // 变量类型
  description?: string;           // 变量描述
  defaultValue?: any;             // 默认值
  required: boolean;              // 是否必填
  validation?: ValidationRule;    // 验证规则
  options?: VariableOption[];     // 选项列表（用于枚举类型）
  dependencies?: string[];        // 依赖的其他变量
}

enum VariableType {
  STRING = 'string',
  NUMBER = 'number',
  BOOLEAN = 'boolean',
  ARRAY = 'array',
  OBJECT = 'object',
  ENUM = 'enum',
  DATE = 'date',
  EMAIL = 'email',
  URL = 'url',
}
```

#### 3.2 模板引擎
- **支持的模板语法**
  - Handlebars语法：`{{variableName}}`
  - 条件语句：`{{#if condition}}...{{/if}}`
  - 循环语句：`{{#each items}}...{{/each}}`
  - 辅助函数：`{{pascalCase name}}`、`{{camelCase name}}`等

- **内置辅助函数**
  ```typescript
  // 字符串转换
  pascalCase(str: string): string     // PascalCase
  camelCase(str: string): string      // camelCase
  kebabCase(str: string): string      // kebab-case
  snakeCase(str: string): string      // snake_case
  upperCase(str: string): string      // UPPER_CASE
  lowerCase(str: string): string      // lower_case
  
  // 日期格式化
  formatDate(date: Date, format: string): string
  
  // 数组操作
  join(array: any[], separator: string): string
  first(array: any[]): any
  last(array: any[]): any
  
  // 条件判断
  eq(a: any, b: any): boolean
  ne(a: any, b: any): boolean
  gt(a: number, b: number): boolean
  lt(a: number, b: number): boolean
  ```

### 4. 模板使用和生成

#### 4.1 代码生成
- **生成流程**
  1. 选择模板
  2. 填写变量参数
  3. 预览生成结果
  4. 确认生成代码
  5. 下载或直接集成到项目

- **生成选项**
  - 单文件生成
  - 批量文件生成
  - 目录结构生成
  - 增量更新生成

#### 4.2 集成方式
- **API集成**
  - RESTful API
  - GraphQL API
  - WebSocket实时生成

- **CLI工具**
  - 命令行生成工具
  - 项目脚手架集成
  - CI/CD流水线集成

### 5. 权限和协作

#### 5.1 权限管理
```typescript
enum TemplatePermission {
  READ = 'READ',           // 查看权限
  WRITE = 'WRITE',         // 编辑权限
  DELETE = 'DELETE',       // 删除权限
  PUBLISH = 'PUBLISH',     // 发布权限
  ADMIN = 'ADMIN',         // 管理权限
}
```

#### 5.2 协作功能
- **模板共享**
  - 公开模板市场
  - 团队内部共享
  - 权限控制分享

- **协作编辑**
  - 多人同时编辑
  - 变更冲突解决
  - 编辑历史记录

### 6. 统计和分析

#### 6.1 使用统计
- 模板使用次数
- 用户使用偏好
- 生成代码统计
- 错误率统计

#### 6.2 质量评估
- 用户评分系统
- 使用反馈收集
- 模板质量指标
- 推荐算法

## 🏗️ 技术架构

### 后端架构

#### 领域模型
```typescript
// 模板聚合根
class CodeTemplate extends AggregateRoot {
  constructor(
    public readonly id: TemplateId,
    public readonly projectId: ProjectId,
    public readonly name: string,
    public readonly description: string,
    public readonly category: TemplateCategory,
    public readonly language: TemplateLanguage,
    public readonly framework: TemplateFramework,
    public readonly content: string,
    public readonly variables: TemplateVariable[],
    public readonly tags: string[],
    public readonly isPublic: boolean,
    public readonly status: TemplateStatus,
    public readonly versions: TemplateVersion[],
    public readonly permissions: TemplatePermission[],
    public readonly metadata: TemplateMetadata,
    public readonly createdBy: UserId,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {
    super();
  }
}
```

#### CQRS命令和查询
```typescript
// 命令
export class CreateTemplateCommand {
  constructor(
    public readonly projectId: string,
    public readonly templateData: CreateTemplateDto,
    public readonly userId: string,
  ) {}
}

export class UpdateTemplateCommand {
  constructor(
    public readonly templateId: string,
    public readonly templateData: UpdateTemplateDto,
    public readonly userId: string,
  ) {}
}

export class PublishTemplateCommand {
  constructor(
    public readonly templateId: string,
    public readonly version: string,
    public readonly userId: string,
  ) {}
}

// 查询
export class GetTemplateQuery {
  constructor(public readonly templateId: string) {}
}

export class GetTemplatesByProjectQuery {
  constructor(
    public readonly projectId: string,
    public readonly filters?: TemplateFilters,
    public readonly pagination?: PaginationOptions,
  ) {}
}

export class SearchTemplatesQuery {
  constructor(
    public readonly searchTerm: string,
    public readonly filters?: TemplateFilters,
    public readonly pagination?: PaginationOptions,
  ) {}
}
```

### 前端架构

#### 页面结构
```
/lowcode/template/
├── index.vue                    # 模板列表页
├── detail/[id].vue             # 模板详情页
├── editor/[id].vue             # 模板编辑器
├── generator/[id].vue          # 代码生成器
└── modules/
    ├── template-list.vue       # 模板列表组件
    ├── template-editor.vue     # 模板编辑器组件
    ├── template-preview.vue    # 模板预览组件
    ├── variable-form.vue       # 变量表单组件
    ├── code-generator.vue      # 代码生成器组件
    └── template-market.vue     # 模板市场组件
```

#### 状态管理
```typescript
// Pinia Store
export const useTemplateStore = defineStore('template', () => {
  const templates = ref<Template[]>([]);
  const currentTemplate = ref<Template | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);

  // Actions
  const fetchTemplates = async (projectId: string, filters?: TemplateFilters) => {
    // 获取模板列表
  };

  const createTemplate = async (templateData: CreateTemplateDto) => {
    // 创建模板
  };

  const updateTemplate = async (id: string, templateData: UpdateTemplateDto) => {
    // 更新模板
  };

  const generateCode = async (templateId: string, variables: Record<string, any>) => {
    // 生成代码
  };

  return {
    templates,
    currentTemplate,
    loading,
    error,
    fetchTemplates,
    createTemplate,
    updateTemplate,
    generateCode,
  };
});
```

## 📊 数据库设计

### 核心表结构
```sql
-- 模板表
CREATE TABLE code_templates (
    id VARCHAR(26) PRIMARY KEY,
    project_id VARCHAR(26) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(50) NOT NULL,
    language VARCHAR(50) NOT NULL,
    framework VARCHAR(50),
    content TEXT NOT NULL,
    variables JSONB DEFAULT '[]',
    tags TEXT[] DEFAULT '{}',
    is_public BOOLEAN DEFAULT FALSE,
    status VARCHAR(20) DEFAULT 'DRAFT',
    usage_count INTEGER DEFAULT 0,
    rating DECIMAL(3,2),
    created_by VARCHAR(26) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY (project_id) REFERENCES projects(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- 模板版本表
CREATE TABLE template_versions (
    id VARCHAR(26) PRIMARY KEY,
    template_id VARCHAR(26) NOT NULL,
    version VARCHAR(20) NOT NULL,
    content TEXT NOT NULL,
    variables JSONB DEFAULT '[]',
    changelog TEXT,
    is_current BOOLEAN DEFAULT FALSE,
    created_by VARCHAR(26) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY (template_id) REFERENCES code_templates(id),
    FOREIGN KEY (created_by) REFERENCES users(id),
    UNIQUE(template_id, version)
);

-- 模板使用记录表
CREATE TABLE template_usage_logs (
    id VARCHAR(26) PRIMARY KEY,
    template_id VARCHAR(26) NOT NULL,
    template_version VARCHAR(20),
    user_id VARCHAR(26) NOT NULL,
    project_id VARCHAR(26),
    variables_used JSONB,
    generated_files JSONB,
    success BOOLEAN DEFAULT TRUE,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY (template_id) REFERENCES code_templates(id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (project_id) REFERENCES projects(id)
);

-- 模板评分表
CREATE TABLE template_ratings (
    id VARCHAR(26) PRIMARY KEY,
    template_id VARCHAR(26) NOT NULL,
    user_id VARCHAR(26) NOT NULL,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY (template_id) REFERENCES code_templates(id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    UNIQUE(template_id, user_id)
);
```

## 🚀 实施计划

### 第一阶段：基础功能（2周）
- [ ] 完善模板CRUD API实现
- [ ] 实现模板列表和详情页面
- [ ] 添加模板编辑器（Monaco Editor集成）
- [ ] 实现基础的模板变量系统

### 第二阶段：核心功能（3周）
- [ ] 实现模板版本管理
- [ ] 添加模板发布和状态管理
- [ ] 实现代码生成功能
- [ ] 添加模板预览功能

### 第三阶段：高级功能（2周）
- [ ] 实现模板市场和共享功能
- [ ] 添加权限管理系统
- [ ] 实现使用统计和评分系统
- [ ] 添加模板导入导出功能

### 第四阶段：优化和扩展（1周）
- [ ] 性能优化和缓存策略
- [ ] 添加更多辅助函数和模板语法
- [ ] 实现CLI工具
- [ ] 完善文档和测试

## 📝 验收标准

### 功能验收
- [ ] 用户可以创建、编辑、删除模板
- [ ] 支持模板分类和标签管理
- [ ] 模板版本控制功能正常
- [ ] 代码生成功能准确无误
- [ ] 权限控制有效
- [ ] 统计数据准确

### 性能验收
- [ ] 模板列表加载时间 < 2秒
- [ ] 代码生成响应时间 < 5秒
- [ ] 支持并发用户数 > 100
- [ ] 数据库查询优化

### 用户体验验收
- [ ] 界面友好，操作直观
- [ ] 错误提示清晰
- [ ] 响应式设计适配
- [ ] 无障碍访问支持

## 📚 相关文档

- [API接口文档](./api-documentation.md)
- [数据库设计文档](./database-design.md)
- [前端组件文档](./frontend-components.md)
- [部署指南](./deployment-guide.md)
- [用户使用手册](./user-manual.md)

---

**文档版本**: v1.0  
**创建日期**: 2025-07-20  
**最后更新**: 2025-07-20  
**负责人**: 开发团队
