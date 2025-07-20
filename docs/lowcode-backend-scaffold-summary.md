# 低代码后端项目脚手架完整方案

## 🎯 方案概述

基于您的要求，我已经创建了一个完整的低代码后端项目脚手架，该脚手架完全基于现有的技术栈配置，支持代码生成器直接写入，并严格遵循Amis框架的数据格式规范。

## 📋 技术栈配置

### 核心框架
- **NestJS 11.0.12** - 企业级Node.js框架
- **Fastify 5.2.2** - 高性能Web服务器
- **TypeScript 5.8.2** - 类型安全的JavaScript超集
- **Prisma 6.5.0** - 现代化数据库ORM
- **PostgreSQL** - 关系型数据库
- **Redis** - 内存缓存数据库

### 开发工具
- **ESLint + Prettier** - 代码质量和格式化
- **Jest** - 单元测试和E2E测试
- **Husky** - Git钩子管理
- **Winston** - 日志管理
- **Swagger** - API文档生成

## 🏗️ 项目架构特点

### 1. Base-Biz分层架构
```
src/
├── base/          # 基础代码层（代码生成器生成）
│   ├── controllers/   # 基础控制器
│   ├── services/      # 基础服务
│   ├── dto/          # 数据传输对象
│   ├── entities/     # 数据库实体
│   └── interfaces/   # 接口定义
├── biz/           # 业务代码层（开发者自定义）
│   ├── controllers/   # 业务控制器
│   ├── services/      # 业务服务
│   └── modules/      # 业务模块
└── shared/        # 共享模块
    ├── guards/       # 守卫
    ├── interceptors/ # 拦截器
    ├── decorators/   # 装饰器
    ├── filters/      # 过滤器
    └── services/     # 共享服务
```

### 2. TypeScript路径别名支持
```typescript
{
  "@/*": ["src/*"],
  "@base/*": ["src/base/*"],
  "@biz/*": ["src/biz/*"],
  "@shared/*": ["src/shared/*"],
  "@config/*": ["src/config/*"],
  "@dto/*": ["src/base/dto/*"],
  "@entities/*": ["src/base/entities/*"],
  "@controllers/*": ["src/biz/controllers/*"],
  "@services/*": ["src/biz/services/*"],
  "@modules/*": ["src/biz/modules/*"]
}
```

### 3. Amis框架兼容性
所有API接口严格遵循Amis标准响应格式：

```typescript
// 成功响应
{
  "status": 0,
  "msg": "success", 
  "data": { ... }
}

// 分页响应
{
  "status": 0,
  "msg": "success",
  "data": {
    "items": [...],
    "total": 100,
    "page": 1,
    "pageSize": 10
  }
}

// 错误响应
{
  "status": 1,
  "msg": "error message",
  "data": null
}
```

## 🚀 核心功能实现

### 1. 自动响应格式化
```typescript
@AmisResponse()
@Controller('users')
export class UserController {
  @Get()
  async findAll() {
    // 返回的数据会自动包装为Amis格式
    return { users: [...] };
  }
}
```

### 2. JWT认证和权限控制
```typescript
@UseGuards(JwtAuthGuard)
@Roles('admin')
@Controller('admin')
export class AdminController {
  // 需要admin角色才能访问
}

@Public()
@Get('health')
getHealth() {
  // 公开接口，无需认证
}
```

### 3. 全局异常处理
```typescript
// 自动将异常转换为Amis格式
{
  "status": 1,
  "msg": "Validation failed",
  "data": null,
  "error": {
    "statusCode": 400,
    "timestamp": "2024-01-01T00:00:00.000Z",
    "path": "/api/v1/users"
  }
}
```

### 4. 数据库和缓存集成
```typescript
@Injectable()
export class UserService {
  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
  ) {}

  async findAll(query: UserQueryDto) {
    // 支持分页、排序、筛选
    const cacheKey = `users:${JSON.stringify(query)}`;
    
    let result = await this.redis.get(cacheKey);
    if (!result) {
      result = await this.prisma.user.findMany({
        where: this.buildWhereClause(query),
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      });
      await this.redis.set(cacheKey, result, 300);
    }
    
    return result;
  }
}
```

## 📦 快速开始

### 1. 使用脚手架生成器
```bash
# 运行生成器
node scripts/create-lowcode-project.js

# 按提示输入项目信息
项目名称: my-lowcode-api
项目描述: My lowcode backend API
作者姓名: Developer
作者邮箱: dev@example.com
服务端口: 3000
是否包含 Docker 配置? Yes
是否包含 JWT 认证模块? Yes
是否包含 Redis 缓存? Yes
```

### 2. 项目初始化
```bash
cd my-lowcode-api

# 配置环境变量
cp .env.example .env
vim .env

# 初始化数据库
npm run prisma:migrate
npm run prisma:seed

# 启动开发服务器
npm run start:dev
```

### 3. 访问应用
- API地址: http://localhost:3000/api/v1
- API文档: http://localhost:3000/api/v1/docs
- 健康检查: http://localhost:3000/api/v1/health

## 🔧 代码生成器集成

### 1. 目录结构支持
脚手架完全支持代码生成器直接写入：
- `src/base/` - 生成的基础代码
- `src/biz/` - 自定义业务代码
- 自动导入和继承机制
- TypeScript路径别名支持

### 2. 生成文件示例
```typescript
// src/base/controllers/user.base.controller.ts (生成)
@Controller('users')
@ApiTags('User Management')
export class UserBaseController {
  @Get()
  @AmisResponse()
  async findAll(@Query() query: UserQueryDto) {
    // 基础CRUD实现
  }
}

// src/biz/controllers/user.controller.ts (自定义)
@Controller('users')
export class UserController extends UserBaseController {
  // 可以覆盖基础方法或添加新方法
  @Post('batch')
  async batchCreate(@Body() data: CreateUserDto[]) {
    // 自定义业务逻辑
  }
}
```

### 3. 模块自动注册
```typescript
// src/biz/modules/user.module.ts
@Module({
  imports: [PrismaModule],
  controllers: [UserController], // 使用biz层控制器
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
```

## 🐳 Docker部署支持

### 1. 多阶段构建
```dockerfile
FROM node:18-alpine AS builder
# 构建阶段

FROM node:18-alpine AS production  
# 生产阶段
```

### 2. Docker Compose
```yaml
services:
  app:
    build: .
    ports:
      - "3000:3000"
    depends_on:
      - postgres
      - redis
  
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: lowcode_db
  
  redis:
    image: redis:7-alpine
```

## 📊 质量保证

### 1. 代码质量
- ESLint规则配置
- Prettier代码格式化
- Husky Git钩子
- 类型安全检查

### 2. 测试覆盖
- 单元测试框架
- E2E测试配置
- 测试覆盖率报告
- 自动化测试流程

### 3. 性能优化
- Fastify高性能服务器
- Redis缓存支持
- 数据库查询优化
- 响应压缩和安全头

## 🎯 核心优势

### 1. 开箱即用
- 完整的项目结构
- 所有依赖预配置
- 开发工具集成
- Docker化支持

### 2. 代码生成友好
- Base-Biz分层架构
- TypeScript路径别名
- 自动导入机制
- 模块化设计

### 3. Amis框架兼容
- 标准响应格式
- 分页排序支持
- 错误处理统一
- API文档完整

### 4. 企业级特性
- JWT认证授权
- 角色权限控制
- 日志监控
- 健康检查
- 缓存支持

## 📝 使用建议

### 1. 项目创建
使用提供的脚手架生成器快速创建项目，确保所有配置正确。

### 2. 环境配置
仔细配置.env文件，特别是数据库连接和JWT密钥。

### 3. 代码生成
将生成的代码放在`src/base/`目录，自定义代码放在`src/biz/`目录。

### 4. 部署上线
使用Docker进行容器化部署，确保环境一致性。

## 🔮 扩展方向

### 1. 微服务支持
- 服务发现
- 配置中心
- 链路追踪

### 2. 监控告警
- 性能监控
- 错误追踪
- 业务指标

### 3. 安全增强
- API限流
- 数据加密
- 审计日志

这个脚手架为低代码平台提供了坚实的技术基础，支持快速开发和部署，同时保持了高度的可扩展性和维护性。
