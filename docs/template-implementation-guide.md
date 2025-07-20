# 模板管理功能实现指南

## 🎯 当前状态

### ✅ 已完成
- [x] 基础API控制器框架 (`template.controller.ts`)
- [x] DTO定义和类型系统 (`template.dto.ts`)
- [x] 前端页面基础结构 (`template/index.vue`)
- [x] 前端组件框架 (`template-operate-drawer.vue`, `template-search.vue`)
- [x] 国际化翻译配置 (中英文)
- [x] 路由配置和权限设置
- [x] 模拟数据API响应

### ⚠️ 待完成
- [ ] CQRS命令和查询处理器实现
- [ ] 数据库模型和Repository实现
- [ ] 模板引擎和代码生成逻辑
- [ ] 版本管理系统
- [ ] 权限控制系统
- [ ] 文件上传和管理
- [ ] 统计和分析功能

## 🏗️ 实现步骤

### 第一步：数据库层实现

#### 1.1 Prisma Schema 更新
```prisma
// prisma/schema.prisma
model CodeTemplate {
  id          String   @id @default(cuid())
  projectId   String   @map("project_id")
  name        String
  description String?
  category    String
  language    String
  framework   String?
  content     String   @db.Text
  variables   Json     @default("[]")
  tags        String[] @default([])
  isPublic    Boolean  @default(false) @map("is_public")
  status      String   @default("DRAFT")
  usageCount  Int      @default(0) @map("usage_count")
  rating      Float?
  createdBy   String   @map("created_by")
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  // 关联关系
  project     Project           @relation(fields: [projectId], references: [id])
  creator     User              @relation(fields: [createdBy], references: [id])
  versions    TemplateVersion[]
  usageLogs   TemplateUsageLog[]
  ratings     TemplateRating[]

  @@map("code_templates")
}

model TemplateVersion {
  id         String   @id @default(cuid())
  templateId String   @map("template_id")
  version    String
  content    String   @db.Text
  variables  Json     @default("[]")
  changelog  String?
  isCurrent  Boolean  @default(false) @map("is_current")
  createdBy  String   @map("created_by")
  createdAt  DateTime @default(now()) @map("created_at")

  template CodeTemplate @relation(fields: [templateId], references: [id])
  creator  User         @relation(fields: [createdBy], references: [id])

  @@unique([templateId, version])
  @@map("template_versions")
}

model TemplateUsageLog {
  id              String   @id @default(cuid())
  templateId      String   @map("template_id")
  templateVersion String?  @map("template_version")
  userId          String   @map("user_id")
  projectId       String?  @map("project_id")
  variablesUsed   Json?    @map("variables_used")
  generatedFiles  Json?    @map("generated_files")
  success         Boolean  @default(true)
  errorMessage    String?  @map("error_message")
  createdAt       DateTime @default(now()) @map("created_at")

  template CodeTemplate @relation(fields: [templateId], references: [id])
  user     User         @relation(fields: [userId], references: [id])
  project  Project?     @relation(fields: [projectId], references: [id])

  @@map("template_usage_logs")
}

model TemplateRating {
  id         String   @id @default(cuid())
  templateId String   @map("template_id")
  userId     String   @map("user_id")
  rating     Int      @db.SmallInt
  comment    String?
  createdAt  DateTime @default(now()) @map("created_at")
  updatedAt  DateTime @updatedAt @map("updated_at")

  template CodeTemplate @relation(fields: [templateId], references: [id])
  user     User         @relation(fields: [userId], references: [id])

  @@unique([templateId, userId])
  @@map("template_ratings")
}
```

#### 1.2 数据库迁移
```bash
# 生成迁移文件
npx prisma migrate dev --name add_template_management

# 生成Prisma客户端
npx prisma generate
```

### 第二步：领域层实现

#### 2.1 创建领域模型
```typescript
// src/lib/bounded-contexts/template/domain/template.model.ts
import { AggregateRoot } from '@nestjs/cqrs';
import { TemplateCreatedEvent, TemplateUpdatedEvent, TemplatePublishedEvent } from './events';

export class CodeTemplate extends AggregateRoot {
  constructor(
    public readonly id: string,
    public readonly projectId: string,
    public name: string,
    public description: string | undefined,
    public readonly category: TemplateCategory,
    public readonly language: TemplateLanguage,
    public readonly framework: TemplateFramework | undefined,
    public content: string,
    public variables: TemplateVariable[],
    public tags: string[],
    public isPublic: boolean,
    public status: TemplateStatus,
    public readonly versions: TemplateVersion[],
    public readonly usageCount: number,
    public readonly rating: number | undefined,
    public readonly createdBy: string,
    public readonly createdAt: Date,
    public updatedAt: Date,
  ) {
    super();
  }

  static create(props: CreateTemplateProps): CodeTemplate {
    const template = new CodeTemplate(
      ulid(),
      props.projectId,
      props.name,
      props.description,
      props.category,
      props.language,
      props.framework,
      props.content,
      props.variables || [],
      props.tags || [],
      props.isPublic || false,
      TemplateStatus.DRAFT,
      [],
      0,
      undefined,
      props.createdBy,
      new Date(),
      new Date(),
    );

    template.apply(new TemplateCreatedEvent(template.id, props.projectId, props.createdBy));
    return template;
  }

  update(props: UpdateTemplateProps): void {
    if (props.name) this.name = props.name;
    if (props.description !== undefined) this.description = props.description;
    if (props.content) this.content = props.content;
    if (props.variables) this.variables = props.variables;
    if (props.tags) this.tags = props.tags;
    if (props.isPublic !== undefined) this.isPublic = props.isPublic;
    
    this.updatedAt = new Date();
    this.apply(new TemplateUpdatedEvent(this.id, props.updatedBy));
  }

  publish(version: string, userId: string): void {
    if (this.status === TemplateStatus.PUBLISHED) {
      throw new Error('Template is already published');
    }

    this.status = TemplateStatus.PUBLISHED;
    this.updatedAt = new Date();
    
    this.apply(new TemplatePublishedEvent(this.id, version, userId));
  }

  addVersion(version: TemplateVersion): void {
    // 将当前版本设为非当前版本
    this.versions.forEach(v => v.isCurrent = false);
    
    // 添加新版本
    version.isCurrent = true;
    this.versions.push(version);
    
    this.updatedAt = new Date();
  }

  incrementUsage(): void {
    // 使用次数+1的逻辑将在应用层处理
  }
}
```

#### 2.2 创建值对象
```typescript
// src/lib/bounded-contexts/template/domain/value-objects/template-variable.vo.ts
export class TemplateVariable {
  constructor(
    public readonly name: string,
    public readonly type: VariableType,
    public readonly description: string | undefined,
    public readonly defaultValue: any,
    public readonly required: boolean,
    public readonly validation: ValidationRule | undefined,
    public readonly options: VariableOption[] | undefined,
  ) {
    this.validate();
  }

  private validate(): void {
    if (!this.name || this.name.trim().length === 0) {
      throw new Error('Variable name cannot be empty');
    }

    if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(this.name)) {
      throw new Error('Variable name must be a valid identifier');
    }
  }

  static fromPrimitive(data: any): TemplateVariable {
    return new TemplateVariable(
      data.name,
      data.type,
      data.description,
      data.defaultValue,
      data.required,
      data.validation,
      data.options,
    );
  }

  toPrimitive(): any {
    return {
      name: this.name,
      type: this.type,
      description: this.description,
      defaultValue: this.defaultValue,
      required: this.required,
      validation: this.validation,
      options: this.options,
    };
  }
}
```

### 第三步：应用层实现

#### 3.1 命令处理器
```typescript
// src/lib/bounded-contexts/template/application/handlers/create-template.handler.ts
@CommandHandler(CreateTemplateCommand)
export class CreateTemplateHandler implements ICommandHandler<CreateTemplateCommand> {
  constructor(
    @Inject('TemplateRepository')
    private readonly templateRepository: TemplateRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: CreateTemplateCommand): Promise<string> {
    const { projectId, templateData, userId } = command;

    // 验证项目是否存在
    // 验证用户权限
    
    const template = CodeTemplate.create({
      projectId,
      name: templateData.name,
      description: templateData.description,
      category: templateData.category,
      language: templateData.language,
      framework: templateData.framework,
      content: templateData.content,
      variables: templateData.variables?.map(v => TemplateVariable.fromPrimitive(v)),
      tags: templateData.tags,
      isPublic: templateData.isPublic,
      createdBy: userId,
    });

    await this.templateRepository.save(template);
    
    // 发布领域事件
    template.getUncommittedEvents().forEach(event => {
      this.eventBus.publish(event);
    });
    template.markEventsAsCommitted();

    return template.id;
  }
}
```

#### 3.2 查询处理器
```typescript
// src/lib/bounded-contexts/template/application/handlers/get-templates.handler.ts
@QueryHandler(GetTemplatesByProjectQuery)
export class GetTemplatesByProjectHandler implements IQueryHandler<GetTemplatesByProjectQuery> {
  constructor(
    @Inject('TemplateRepository')
    private readonly templateRepository: TemplateRepository,
  ) {}

  async execute(query: GetTemplatesByProjectQuery): Promise<TemplateListResponse> {
    const { projectId, filters, pagination } = query;

    const result = await this.templateRepository.findByProject(
      projectId,
      filters,
      pagination,
    );

    return {
      records: result.items.map(template => this.mapToResponse(template)),
      total: result.total,
      current: pagination?.page || 1,
      size: pagination?.limit || 10,
    };
  }

  private mapToResponse(template: CodeTemplate): TemplateResponseDto {
    return {
      id: template.id,
      projectId: template.projectId,
      name: template.name,
      description: template.description,
      category: template.category,
      language: template.language,
      framework: template.framework,
      content: template.content,
      variables: template.variables.map(v => v.toPrimitive()),
      tags: template.tags,
      isPublic: template.isPublic,
      status: template.status,
      versions: template.versions.map(v => ({
        version: v.version,
        content: v.content,
        variables: v.variables,
        changelog: v.changelog,
        createdAt: v.createdAt,
        createdBy: v.createdBy,
      })),
      currentVersion: template.versions.find(v => v.isCurrent)?.version || '1.0.0',
      usageCount: template.usageCount,
      rating: template.rating,
      createdBy: template.createdBy,
      createdAt: template.createdAt,
      updatedAt: template.updatedAt,
    };
  }
}
```

### 第四步：基础设施层实现

#### 4.1 Repository实现
```typescript
// src/infra/bounded-contexts/template/template-prisma.repository.ts
@Injectable()
export class TemplatePrismaRepository implements TemplateRepository {
  constructor(private readonly prisma: PrismaService) {}

  async save(template: CodeTemplate): Promise<void> {
    const data = {
      id: template.id,
      projectId: template.projectId,
      name: template.name,
      description: template.description,
      category: template.category,
      language: template.language,
      framework: template.framework,
      content: template.content,
      variables: template.variables.map(v => v.toPrimitive()),
      tags: template.tags,
      isPublic: template.isPublic,
      status: template.status,
      usageCount: template.usageCount,
      rating: template.rating,
      createdBy: template.createdBy,
      createdAt: template.createdAt,
      updatedAt: template.updatedAt,
    };

    await this.prisma.codeTemplate.upsert({
      where: { id: template.id },
      create: data,
      update: data,
    });
  }

  async findById(id: string): Promise<CodeTemplate | null> {
    const template = await this.prisma.codeTemplate.findUnique({
      where: { id },
      include: {
        versions: true,
      },
    });

    if (!template) return null;

    return this.mapToDomain(template);
  }

  async findByProject(
    projectId: string,
    filters?: TemplateFilters,
    pagination?: PaginationOptions,
  ): Promise<PaginatedResult<CodeTemplate>> {
    const where: any = { projectId };

    if (filters?.category) where.category = filters.category;
    if (filters?.language) where.language = filters.language;
    if (filters?.framework) where.framework = filters.framework;
    if (filters?.status) where.status = filters.status;
    if (filters?.name) {
      where.name = { contains: filters.name, mode: 'insensitive' };
    }
    if (filters?.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
        { tags: { has: filters.search } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.codeTemplate.findMany({
        where,
        include: { versions: true },
        skip: pagination ? (pagination.page - 1) * pagination.limit : 0,
        take: pagination?.limit || 10,
        orderBy: { updatedAt: 'desc' },
      }),
      this.prisma.codeTemplate.count({ where }),
    ]);

    return {
      items: items.map(item => this.mapToDomain(item)),
      total,
    };
  }

  private mapToDomain(data: any): CodeTemplate {
    return new CodeTemplate(
      data.id,
      data.projectId,
      data.name,
      data.description,
      data.category,
      data.language,
      data.framework,
      data.content,
      data.variables.map((v: any) => TemplateVariable.fromPrimitive(v)),
      data.tags,
      data.isPublic,
      data.status,
      data.versions || [],
      data.usageCount,
      data.rating,
      data.createdBy,
      data.createdAt,
      data.updatedAt,
    );
  }
}
```

### 第五步：模板引擎实现

#### 5.1 模板引擎服务
```typescript
// src/lib/bounded-contexts/template/application/services/template-engine.service.ts
@Injectable()
export class TemplateEngineService {
  private handlebars: typeof Handlebars;

  constructor() {
    this.handlebars = Handlebars.create();
    this.registerHelpers();
  }

  async generateCode(
    template: CodeTemplate,
    variables: Record<string, any>,
  ): Promise<GeneratedCode> {
    // 验证变量
    this.validateVariables(template.variables, variables);

    // 编译模板
    const compiledTemplate = this.handlebars.compile(template.content);

    // 生成代码
    const generatedContent = compiledTemplate(variables);

    return {
      content: generatedContent,
      filename: this.generateFilename(template, variables),
      language: template.language,
      framework: template.framework,
    };
  }

  private registerHelpers(): void {
    // 字符串转换辅助函数
    this.handlebars.registerHelper('pascalCase', (str: string) => {
      return str.replace(/(?:^|[-_])(\w)/g, (_, c) => c.toUpperCase());
    });

    this.handlebars.registerHelper('camelCase', (str: string) => {
      const pascal = str.replace(/(?:^|[-_])(\w)/g, (_, c) => c.toUpperCase());
      return pascal.charAt(0).toLowerCase() + pascal.slice(1);
    });

    this.handlebars.registerHelper('kebabCase', (str: string) => {
      return str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
    });

    this.handlebars.registerHelper('snakeCase', (str: string) => {
      return str.replace(/([a-z])([A-Z])/g, '$1_$2').toLowerCase();
    });

    // 条件判断辅助函数
    this.handlebars.registerHelper('eq', (a: any, b: any) => a === b);
    this.handlebars.registerHelper('ne', (a: any, b: any) => a !== b);
    this.handlebars.registerHelper('gt', (a: number, b: number) => a > b);
    this.handlebars.registerHelper('lt', (a: number, b: number) => a < b);

    // 数组操作辅助函数
    this.handlebars.registerHelper('join', (array: any[], separator: string) => {
      return array.join(separator);
    });

    this.handlebars.registerHelper('first', (array: any[]) => array[0]);
    this.handlebars.registerHelper('last', (array: any[]) => array[array.length - 1]);
  }

  private validateVariables(
    templateVariables: TemplateVariable[],
    providedVariables: Record<string, any>,
  ): void {
    for (const templateVar of templateVariables) {
      if (templateVar.required && !(templateVar.name in providedVariables)) {
        throw new Error(`Required variable '${templateVar.name}' is missing`);
      }

      const value = providedVariables[templateVar.name];
      if (value !== undefined) {
        this.validateVariableValue(templateVar, value);
      }
    }
  }

  private validateVariableValue(variable: TemplateVariable, value: any): void {
    // 类型验证
    switch (variable.type) {
      case VariableType.STRING:
        if (typeof value !== 'string') {
          throw new Error(`Variable '${variable.name}' must be a string`);
        }
        break;
      case VariableType.NUMBER:
        if (typeof value !== 'number') {
          throw new Error(`Variable '${variable.name}' must be a number`);
        }
        break;
      case VariableType.BOOLEAN:
        if (typeof value !== 'boolean') {
          throw new Error(`Variable '${variable.name}' must be a boolean`);
        }
        break;
      case VariableType.ARRAY:
        if (!Array.isArray(value)) {
          throw new Error(`Variable '${variable.name}' must be an array`);
        }
        break;
      case VariableType.OBJECT:
        if (typeof value !== 'object' || value === null) {
          throw new Error(`Variable '${variable.name}' must be an object`);
        }
        break;
    }

    // 验证规则
    if (variable.validation) {
      this.applyValidationRules(variable, value);
    }
  }

  private applyValidationRules(variable: TemplateVariable, value: any): void {
    const validation = variable.validation!;

    if (validation.pattern && typeof value === 'string') {
      const regex = new RegExp(validation.pattern);
      if (!regex.test(value)) {
        throw new Error(`Variable '${variable.name}' does not match pattern ${validation.pattern}`);
      }
    }

    if (validation.minLength && typeof value === 'string') {
      if (value.length < validation.minLength) {
        throw new Error(`Variable '${variable.name}' must be at least ${validation.minLength} characters`);
      }
    }

    if (validation.maxLength && typeof value === 'string') {
      if (value.length > validation.maxLength) {
        throw new Error(`Variable '${variable.name}' must be at most ${validation.maxLength} characters`);
      }
    }

    if (validation.min && typeof value === 'number') {
      if (value < validation.min) {
        throw new Error(`Variable '${variable.name}' must be at least ${validation.min}`);
      }
    }

    if (validation.max && typeof value === 'number') {
      if (value > validation.max) {
        throw new Error(`Variable '${variable.name}' must be at most ${validation.max}`);
      }
    }
  }

  private generateFilename(template: CodeTemplate, variables: Record<string, any>): string {
    // 根据模板类型和变量生成文件名
    const entityName = variables.entityName || 'Entity';
    const extension = this.getFileExtension(template.language);

    switch (template.category) {
      case TemplateCategory.CONTROLLER:
        return `${entityName.toLowerCase()}.controller${extension}`;
      case TemplateCategory.SERVICE:
        return `${entityName.toLowerCase()}.service${extension}`;
      case TemplateCategory.MODEL:
        return `${entityName.toLowerCase()}.model${extension}`;
      case TemplateCategory.DTO:
        return `${entityName.toLowerCase()}.dto${extension}`;
      default:
        return `${entityName.toLowerCase()}${extension}`;
    }
  }

  private getFileExtension(language: TemplateLanguage): string {
    switch (language) {
      case TemplateLanguage.TYPESCRIPT:
        return '.ts';
      case TemplateLanguage.JAVASCRIPT:
        return '.js';
      case TemplateLanguage.JAVA:
        return '.java';
      case TemplateLanguage.PYTHON:
        return '.py';
      case TemplateLanguage.CSHARP:
        return '.cs';
      case TemplateLanguage.GO:
        return '.go';
      default:
        return '.txt';
    }
  }
}
```

## 🚀 下一步行动

### 立即执行
1. **运行数据库迁移**
   ```bash
   cd lowcode-platform-backend
   npx prisma migrate dev --name add_template_management
   npx prisma generate
   ```

2. **创建模块结构**
   ```bash
   mkdir -p src/lib/bounded-contexts/template/{domain,application,infrastructure}
   mkdir -p src/lib/bounded-contexts/template/application/{handlers,services}
   mkdir -p src/lib/bounded-contexts/template/domain/{events,value-objects}
   ```

3. **实现核心功能**
   - 按照上述代码示例实现各个层次的代码
   - 编写单元测试和集成测试
   - 更新API控制器以使用真实的业务逻辑

### 测试验证
1. **API测试**
   ```bash
   # 创建模板
   curl -X POST http://localhost:3000/api/v1/templates \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer $TOKEN" \
     -d '{"projectId":"demo-project-1","name":"Test Template","category":"CONTROLLER","language":"TYPESCRIPT","content":"console.log(\"Hello {{name}}\");"}'

   # 获取模板列表
   curl http://localhost:3000/api/v1/templates/project/demo-project-1/paginated?current=1&size=10 \
     -H "Authorization: Bearer $TOKEN"
   ```

2. **前端测试**
   - 访问 http://localhost:9527/lowcode/template
   - 测试模板的增删改查功能
   - 验证代码生成功能

### 持续改进
- 监控性能指标
- 收集用户反馈
- 优化用户体验
- 扩展模板类型和功能

---

**实现优先级**: 高  
**预计工期**: 2-3周  
**技术难点**: 模板引擎、版本管理、权限控制
