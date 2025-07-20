# 低代码项目生成器实施指南

## 🎯 实施概述

基于设计方案，本指南提供详细的实施步骤，确保开发团队能够按照既定计划高效完成低代码业务系统后端项目生成器的开发。

## 📋 第一阶段：基础架构搭建 (第1周)

### Day 1-2: 统一项目上下文管理

#### 1.1 创建全局项目状态管理

```bash
# 创建目录结构
mkdir -p frontend/src/stores/modules
mkdir -p frontend/src/components/lowcode
```

**创建文件**：
- `frontend/src/stores/modules/lowcode-project.ts`
- `frontend/src/components/lowcode/GlobalProjectSelector.vue`

**实施要点**：
- 使用Pinia创建响应式项目状态管理
- 实现项目切换的全局事件通知机制
- 添加项目信息缓存和错误处理

#### 1.2 集成到现有页面

**修改文件**：
- `frontend/src/views/lowcode/entity/index.vue`
- `frontend/src/views/lowcode/template/index.vue`
- `frontend/src/views/lowcode/api-config/index.vue`
- `frontend/src/views/lowcode/query/index.vue`

**实施步骤**：
1. 移除各页面的独立项目选择逻辑
2. 导入GlobalProjectSelector组件
3. 使用useLowcodeProjectStore获取当前项目
4. 添加项目变化监听器

### Day 3-4: 元数据聚合服务

#### 2.1 创建元数据服务架构

```bash
# 创建后端目录结构
mkdir -p lowcode-platform-backend/src/lib/bounded-contexts/metadata
mkdir -p lowcode-platform-backend/src/lib/bounded-contexts/metadata/application/services
mkdir -p lowcode-platform-backend/src/lib/bounded-contexts/metadata/domain
mkdir -p lowcode-platform-backend/src/lib/bounded-contexts/metadata/infrastructure
```

**创建文件**：
- `MetadataAggregatorService` - 元数据聚合服务
- `ProjectMetadata` - 项目元数据接口
- `EntityMetadata` - 实体元数据接口
- `DDLGeneratorService` - DDL生成服务

#### 2.2 实现元数据聚合逻辑

**核心功能**：
- 并行获取项目的实体、字段、关系数据
- 构建完整的项目元数据模型
- 生成数据库DDL脚本
- 提供元数据查询和缓存机制

### Day 5-7: 代码生成控制器

#### 3.1 创建代码生成API

```bash
# 创建代码生成相关文件
mkdir -p lowcode-platform-backend/src/api/lowcode/dto
mkdir -p lowcode-platform-backend/src/lib/bounded-contexts/code-generation/application/handlers
```

**创建文件**：
- `code-generation.controller.ts` - 代码生成控制器
- `code-generation.dto.ts` - 数据传输对象
- `GenerateCodeCommand` - 生成代码命令
- `GenerateCodeHandler` - 命令处理器

#### 3.2 配置CQRS架构

**实施要点**：
- 使用@nestjs/cqrs实现命令查询分离
- 配置事件总线和处理器
- 添加异步任务处理机制
- 实现生成进度跟踪

## 📋 第二阶段：核心功能实现 (第2-3周)

### Week 2: 智能代码生成引擎

#### 4.1 模板引擎增强

**任务清单**：
- [ ] 扩展Handlebars辅助函数
- [ ] 实现模板变量验证
- [ ] 添加条件渲染和循环支持
- [ ] 集成现有模板管理系统

**关键实现**：
```typescript
// 注册自定义辅助函数
this.handlebars.registerHelper('pascalCase', (str: string) => {
  return str.replace(/(?:^|[-_])(\w)/g, (_, c) => c.toUpperCase());
});

this.handlebars.registerHelper('generateImports', (entities: EntityMetadata[]) => {
  return entities.map(entity => 
    `import { ${entity.name} } from './${entity.code}.entity';`
  ).join('\n');
});
```

#### 4.2 Base-Biz架构实现

**核心组件**：
- `BaseBizArchitectureStrategy` - 架构策略类
- `FileClassifier` - 文件分类器
- `BizImportGenerator` - Biz层导入生成器

**实施步骤**：
1. 定义base和biz文件的识别规则
2. 实现文件自动分类逻辑
3. 生成biz层的导入和继承文件
4. 配置TypeScript路径别名

### Week 3: Amis接口规范生成

#### 5.1 Amis响应格式标准化

**实施要点**：
- 创建AmisResponse装饰器
- 统一错误处理格式
- 实现分页响应标准化
- 添加响应数据验证

#### 5.2 生成符合Amis规范的控制器

**模板特性**：
- 标准化的CRUD接口
- 统一的响应格式
- 完整的Swagger文档
- 参数验证和错误处理

## 📋 第三阶段：前端优化和集成 (第4周)

### Day 1-3: 代码生成页面改进

#### 6.1 用户体验优化

**改进点**：
- 集成全局项目选择器
- 实现模板多选和变量合并
- 添加架构选择和框架配置
- 优化表单验证和错误提示

#### 6.2 实时代码预览

**功能特性**：
- 模板变量实时渲染
- 语法高亮显示
- 文件树结构预览
- 生成前代码验证

### Day 4-5: 生成进度和结果管理

#### 7.1 进度跟踪组件

**组件功能**：
- 实时进度显示
- 生成日志展示
- 错误信息提示
- 取消生成操作

#### 7.2 结果管理功能

**核心功能**：
- 生成结果文件树展示
- 文件内容预览
- 代码下载和导出
- 生成历史记录

### Day 6-7: 集成测试和优化

#### 8.1 端到端测试

**测试场景**：
- 完整的代码生成流程
- 多模板组合生成
- Base-Biz架构验证
- Amis接口规范检查

#### 8.2 性能优化

**优化重点**：
- 模板编译缓存
- 并发生成处理
- 内存使用优化
- 文件系统操作优化

## 🔧 关键技术实现

### 1. 全局项目状态管理

```typescript
// 使用示例
const projectStore = useLowcodeProjectStore();

// 监听项目变化
watch(() => projectStore.currentProjectId, (projectId) => {
  if (projectId) {
    loadProjectData(projectId);
  }
});

// 设置当前项目
projectStore.setCurrentProject('project-id');
```

### 2. 元数据驱动生成

```typescript
// 获取项目完整元数据
const metadata = await metadataService.getProjectMetadata(projectId);

// 生成DDL脚本
const ddl = await metadataService.generateDDL(projectId);

// 基于元数据生成代码
const context = {
  project: metadata.project,
  entities: metadata.entities,
  relationships: metadata.relationships
};
```

### 3. Base-Biz架构应用

```typescript
// 文件分类
const classifier = new BaseBizArchitectureStrategy();
const fileType = classifier.classifyFile('user.controller.ts'); // 'biz'

// 生成Biz导入文件
const bizImports = classifier.generateBizImports(baseFiles, outputPath);
```

### 4. Amis接口规范

```typescript
// 使用装饰器确保响应格式
@AmisResponse()
async findAll(@Query() query: UserQueryDto) {
  const result = await this.userService.findAll(query);
  // 自动包装为 { status: 0, msg: 'success', data: result }
  return result;
}
```

## 📊 质量检查清单

### 代码质量
- [ ] ESLint检查通过率 > 95%
- [ ] TypeScript类型检查无错误
- [ ] 单元测试覆盖率 > 80%
- [ ] 集成测试通过率 100%

### 性能指标
- [ ] 单个实体生成时间 < 5秒
- [ ] 完整项目生成时间 < 30秒
- [ ] 并发用户支持 > 10个
- [ ] 内存使用 < 512MB

### 用户体验
- [ ] 操作步骤减少 50%
- [ ] 错误提示清晰明确
- [ ] 界面响应速度 < 2秒
- [ ] 移动端适配良好

## 🚀 部署和发布

### 1. 环境配置

```bash
# 安装依赖
npm install

# 数据库迁移
npx prisma migrate deploy

# 启动服务
npm run start:prod
```

### 2. Docker部署

```bash
# 构建镜像
docker build -t lowcode-generator .

# 运行容器
docker run -p 3000:3000 -e DATABASE_URL="..." lowcode-generator
```

### 3. 监控和日志

```bash
# 查看生成日志
tail -f logs/code-generation.log

# 监控性能指标
npm run monitor
```

## 📝 文档和培训

### 1. 技术文档
- API接口文档 (Swagger)
- 架构设计文档
- 部署运维手册

### 2. 用户文档
- 使用指南
- 最佳实践
- 常见问题解答

### 3. 开发者培训
- 架构原理讲解
- 模板开发指南
- 扩展开发教程

---

**实施建议**：
1. 严格按照时间计划执行
2. 每日进行代码审查
3. 及时处理技术债务
4. 保持与用户的沟通反馈
5. 持续优化和改进

这个实施指南为开发团队提供了详细的执行路径，确保项目能够按时高质量交付。
