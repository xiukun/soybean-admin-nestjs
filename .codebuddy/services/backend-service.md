# Backend 主后端服务说明文档

## 服务概述

Backend 是 SoybeanAdmin NestJS 低代码平台的核心后端服务，基于 NestJS 框架构建的企业级后台管理系统。该服务采用 DDD（领域驱动设计）和 CQRS（命令查询职责分离）架构模式，提供用户管理、权限控制、系统配置、低代码平台支持等核心功能。

## 技术架构

### 核心技术栈
- **框架**: NestJS 11.0.12 + TypeScript 5.8.2
- **HTTP 服务器**: Fastify 5.2.2 (高性能)
- **ORM**: Prisma 6.5.0 (类型安全)
- **数据库**: PostgreSQL 16.3
- **缓存**: Redis + IORedis 5.6.0
- **Node.js**: 18.0.0+

### 架构模式
- **DDD**: 领域驱动设计，按业务领域组织代码
- **CQRS**: 命令查询职责分离，读写分离
- **Monorepo**: 多应用共享库结构
- **微服务**: 支持服务拆分和独立部署

### 安全和认证
- **认证**: JWT + Passport
- **权限控制**: Casbin 5.38.0 (RBAC)
- **加密**: BCrypt 密码加密
- **安全防护**: Helmet, CSRF, Rate Limiting

### 工具和中间件
- **API 文档**: Swagger 11.1.0
- **日志**: Winston 3.17.0 + 日志轮转
- **任务调度**: @nestjs/schedule 5.0.1
- **文件上传**: Fastify Multipart
- **对象存储**: Ali OSS 6.22.0

## 项目结构

```
backend/
├── apps/                       # 应用模块
│   └── base-system/           # 主系统应用
│       └── src/
│           ├── main.ts        # 应用入口
│           ├── app.module.ts  # 根模块
│           ├── api/           # API 接口层
│           │   ├── iam/       # 身份认证管理
│           │   ├── manage/    # 系统管理
│           │   ├── log-audit/ # 日志审计
│           │   ├── access-key/# 访问密钥
│           │   └── endpoint/  # 接口管理
│           ├── lib/           # 业务逻辑层
│           │   └── bounded-contexts/  # 限界上下文
│           │       ├── iam/           # 身份管理领域
│           │       ├── log-audit/     # 日志审计领域
│           │       ├── access-key/    # 访问密钥领域
│           │       ├── api-endpoint/  # API端点领域
│           │       └── lowcode/       # 低代码领域
│           ├── infra/         # 基础设施层
│           └── resources/     # 资源文件
├── libs/                      # 共享库
│   ├── bootstrap/             # 启动配置
│   ├── config/                # 配置管理
│   ├── constants/             # 常量定义
│   ├── global/                # 全局模块
│   ├── infra/                 # 基础设施
│   │   ├── adapter/           # 适配器
│   │   ├── decorators/        # 装饰器
│   │   ├── filters/           # 异常过滤器
│   │   ├── guard/             # 守卫
│   │   ├── interceptors/      # 拦截器
│   │   ├── rest/              # REST 工具
│   │   └── strategies/        # 认证策略
│   ├── shared/                # 共享模块
│   │   ├── errors/            # 错误处理
│   │   ├── prisma/            # Prisma 配置
│   │   ├── redis/             # Redis 配置
│   │   ├── oss/               # 对象存储
│   │   └── ip2region/         # IP 地址解析
│   ├── typings/               # 类型定义
│   └── utils/                 # 工具函数
├── prisma/                    # 数据库配置
│   ├── schema.prisma          # 数据模型
│   ├── migrations/            # 数据库迁移
│   └── seeds/                 # 数据种子
└── dist/                      # 编译输出
```

## 核心功能模块

### 1. 身份认证管理 (IAM)

#### 用户管理
```typescript
// 用户实体
interface SysUser {
  id: string;
  username: string;
  password: string;
  domain: string;
  built_in: boolean;
  avatar?: string;
  email?: string;
  phoneNumber?: string;
  nickName: string;
  status: Status;
}
```

**主要功能**:
- 用户注册、登录、注销
- 用户信息管理和更新
- 密码修改和重置
- 用户状态管理（启用/禁用/封禁）
- 多租户支持（domain）

#### 角色权限管理
```typescript
// 角色实体
interface SysRole {
  id: string;
  code: string;
  name: string;
  description?: string;
  pid: string;
  status: Status;
}

// 权限规则 (Casbin)
interface CasbinRule {
  ptype: string;  // 策略类型
  v0?: string;    // 主体
  v1?: string;    # 资源
  v2?: string;    # 动作
}
```

**权限模型**:
- **RBAC**: 基于角色的访问控制
- **层级角色**: 支持角色继承
- **动态权限**: 运行时权限检查
- **资源权限**: 细粒度资源控制

#### JWT 认证
```typescript
// Token 管理
interface SysTokens {
  id: string;
  accessToken: string;
  refreshToken: string;
  status: string;
  userId: string;
  username: string;
  domain: string;
  loginTime: Date;
  ip: string;
  userAgent: string;
}
```

**认证流程**:
1. 用户登录验证
2. 生成 JWT Token
3. Token 存储和管理
4. Token 刷新机制
5. 登录状态跟踪

### 2. 系统管理

#### 菜单管理
```typescript
// 菜单实体
interface SysMenu {
  id: number;
  menuType: MenuType;  // directory | menu | lowcode
  menuName: string;
  iconType?: number;
  icon?: string;
  routeName: string;
  routePath: string;
  component: string;
  status: Status;
  pid: number;
  order: number;
  lowcodePageId?: string;  // 关联低代码页面
}
```

**菜单特性**:
- **动态菜单**: 基于权限动态生成
- **菜单类型**: 目录、页面、低代码页面
- **层级结构**: 支持多级菜单
- **权限控制**: 菜单级别权限控制
- **国际化**: 多语言菜单支持

#### 组织架构
```typescript
// 组织机构
interface SysOrganization {
  id: string;
  code: string;
  name: string;
  description?: string;
  pid: string;
  status: Status;
}
```

#### 域管理 (多租户)
```typescript
// 租户域
interface SysDomain {
  id: string;
  code: string;
  name: string;
  description?: string;
  status: Status;
}
```

### 3. 日志审计

#### 操作日志
```typescript
// 操作日志
interface SysOperationLog {
  id: string;
  userId: string;
  username: string;
  domain: string;
  moduleName: string;
  description: string;
  method: string;
  url: string;
  ip: string;
  params?: Json;
  body?: Json;
  response?: Json;
  startTime: Date;
  endTime: Date;
  duration: number;
}
```

#### 登录日志
```typescript
// 登录日志
interface SysLoginLog {
  id: string;
  userId: string;
  username: string;
  domain: string;
  loginTime: Date;
  ip: string;
  address: string;
  userAgent: string;
  type: string;
}
```

**日志特性**:
- **自动记录**: 拦截器自动记录操作
- **详细信息**: 请求参数、响应、耗时
- **IP 解析**: 自动解析 IP 地址归属
- **用户代理**: 记录浏览器和设备信息
- **性能监控**: 接口响应时间统计

### 4. 低代码平台支持

#### 低代码页面管理
```typescript
// 低代码页面
interface SysLowcodePage {
  id: string;
  name: string;
  title: string;
  code: string;
  description?: string;
  schema: Json;  // AMIS JSON Schema
  status: Status;
  versions: SysLowcodePageVersion[];
}

// 页面版本
interface SysLowcodePageVersion {
  id: string;
  pageId: string;
  version: string;
  schema: Json;
  changelog?: string;
}
```

#### 低代码项目管理
```typescript
// 低代码项目
interface LowcodeProject {
  id: string;
  name: string;
  code: string;
  description?: string;
  framework: string;
  language: string;
  database: string;
  status: Status;
  config?: Json;
  entities: LowcodeEntity[];
}

// 低代码实体
interface LowcodeEntity {
  id: string;
  projectId: string;
  name: string;
  code: string;
  tableName: string;
  description?: string;
  category: string;
  fields: LowcodeField[];
}

// 低代码字段
interface LowcodeField {
  id: string;
  entityId: string;
  name: string;
  code: string;
  type: string;
  length?: number;
  nullable: boolean;
  defaultValue?: string;
  isPrimaryKey: boolean;
  isUnique: boolean;
}
```

### 5. 接口管理

#### API 端点管理
```typescript
// API 端点
interface SysEndpoint {
  id: string;
  path: string;
  method: string;
  action: string;
  resource: string;
  controller: string;
  summary?: string;
}
```

#### 访问密钥管理
```typescript
// 访问密钥
interface SysAccessKey {
  id: string;
  domain: string;
  AccessKeyID: string;
  AccessKeySecret: string;
  status: Status;
  description?: string;
}
```

## 数据库设计

### Schema 架构
项目使用 PostgreSQL 的 Schema 功能实现逻辑分离：

```sql
-- backend schema: 主后端业务数据
CREATE SCHEMA backend;

-- 主要表结构
backend.sys_user          -- 用户表
backend.sys_role          -- 角色表
backend.sys_user_role     -- 用户角色关联
backend.sys_menu          -- 菜单表
backend.sys_role_menu     -- 角色菜单权限
backend.casbin_rule       -- Casbin 权限规则
backend.sys_domain        -- 租户域
backend.sys_organization  -- 组织架构
backend.sys_tokens        -- Token 管理
backend.sys_login_log     -- 登录日志
backend.sys_operation_log -- 操作日志
backend.sys_lowcode_page  -- 低代码页面
backend.lowcode_project   -- 低代码项目
backend.lowcode_entity    -- 低代码实体
backend.lowcode_field     -- 低代码字段
```

### 数据库连接配置
```typescript
// Prisma 配置
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_DATABASE_URL")
  schemas   = ["backend"]
}

// 连接字符串
DATABASE_URL="postgresql://soybean:soybean@123.@postgres:5432/soybean-admin-nest-backend?schema=backend"
```

## API 接口设计

### RESTful API 规范
```typescript
// 统一响应格式
interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
  timestamp: number;
}

// 分页响应
interface PageResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}
```

### 主要 API 端点

#### 认证相关
```typescript
POST   /v1/auth/login           # 用户登录
POST   /v1/auth/logout          # 用户注销
POST   /v1/auth/refresh         # 刷新Token
GET    /v1/auth/profile         # 获取用户信息
PUT    /v1/auth/profile         # 更新用户信息
```

#### 用户管理
```typescript
GET    /v1/manage/user          # 获取用户列表
POST   /v1/manage/user          # 创建用户
PUT    /v1/manage/user/:id      # 更新用户
DELETE /v1/manage/user/:id      # 删除用户
PUT    /v1/manage/user/:id/status # 更新用户状态
```

#### 角色权限
```typescript
GET    /v1/manage/role          # 获取角色列表
POST   /v1/manage/role          # 创建角色
PUT    /v1/manage/role/:id      # 更新角色
DELETE /v1/manage/role/:id      # 删除角色
GET    /v1/manage/role/:id/permissions # 获取角色权限
PUT    /v1/manage/role/:id/permissions # 设置角色权限
```

#### 菜单管理
```typescript
GET    /v1/manage/menu          # 获取菜单列表
POST   /v1/manage/menu          # 创建菜单
PUT    /v1/manage/menu/:id      # 更新菜单
DELETE /v1/manage/menu/:id      # 删除菜单
GET    /v1/route/getUserRoutes  # 获取用户菜单路由
```

#### 低代码相关
```typescript
GET    /v1/lowcode/project      # 获取项目列表
POST   /v1/lowcode/project      # 创建项目
GET    /v1/lowcode/entity       # 获取实体列表
POST   /v1/lowcode/entity       # 创建实体
GET    /v1/lowcode/page         # 获取低代码页面
POST   /v1/lowcode/page         # 创建低代码页面
```

## 架构设计模式

### DDD 领域驱动设计
```typescript
// 领域结构
src/lib/bounded-contexts/
├── iam/                    # 身份管理领域
│   ├── domain/            # 领域模型
│   ├── application/       # 应用服务
│   ├── infrastructure/    # 基础设施
│   └── interfaces/        # 接口层
├── log-audit/             # 日志审计领域
├── access-key/            # 访问密钥领域
└── lowcode/               # 低代码领域
```

### CQRS 命令查询分离
```typescript
// 命令处理
@CommandHandler(CreateUserCommand)
export class CreateUserHandler implements ICommandHandler<CreateUserCommand> {
  async execute(command: CreateUserCommand): Promise<void> {
    // 处理创建用户命令
  }
}

// 查询处理
@QueryHandler(GetUserQuery)
export class GetUserHandler implements IQueryHandler<GetUserQuery> {
  async execute(query: GetUserQuery): Promise<UserDto> {
    // 处理获取用户查询
  }
}
```

### 依赖注入和模块化
```typescript
// 模块定义
@Module({
  imports: [
    ConfigModule,
    PrismaModule,
    RedisModule,
    CasbinModule
  ],
  controllers: [UserController],
  providers: [
    UserService,
    UserRepository,
    CreateUserHandler,
    GetUserHandler
  ],
  exports: [UserService]
})
export class UserModule {}
```

## 中间件和拦截器

### 认证守卫
```typescript
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext): boolean | Promise<boolean> {
    // JWT 认证逻辑
    return super.canActivate(context);
  }
}
```

### 权限守卫
```typescript
@Injectable()
export class CasbinGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Casbin 权限检查
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const resource = request.route.path;
    const action = request.method;
    
    return await this.casbinService.enforce(user.id, resource, action);
  }
}
```

### 日志拦截器
```typescript
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const startTime = Date.now();
    
    return next.handle().pipe(
      tap(() => {
        const duration = Date.now() - startTime;
        // 记录操作日志
        this.logService.logOperation(context, duration);
      })
    );
  }
}
```

### 异常过滤器
```typescript
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();
    
    // 统一异常处理
    const status = exception instanceof HttpException 
      ? exception.getStatus() 
      : HttpStatus.INTERNAL_SERVER_ERROR;
      
    response.status(status).json({
      code: status,
      message: exception.message,
      timestamp: new Date().toISOString(),
      path: request.url
    });
  }
}
```

## 配置管理

### 环境配置
```typescript
// 配置结构
libs/config/src/
├── app.config.ts          # 应用配置
├── database.config.ts     # 数据库配置
├── redis.config.ts        # Redis 配置
├── jwt.config.ts          # JWT 配置
├── casbin.config.ts       # Casbin 配置
├── oss.config.ts          # 对象存储配置
└── swagger.config.ts      # API 文档配置
```

### 配置示例
```typescript
// 数据库配置
export const databaseConfig = registerAs('database', () => ({
  url: process.env.DATABASE_URL,
  directUrl: process.env.DIRECT_DATABASE_URL,
  schema: 'backend'
}));

// JWT 配置
export const jwtConfig = registerAs('jwt', () => ({
  secret: process.env.JWT_SECRET,
  expiresIn: process.env.JWT_EXPIRE_IN || '3600s',
  refreshSecret: process.env.REFRESH_TOKEN_SECRET,
  refreshExpiresIn: process.env.REFRESH_TOKEN_EXPIRE_IN || '7200s'
}));
```

## 缓存策略

### Redis 缓存
```typescript
// 缓存配置
@Injectable()
export class CacheService {
  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private redisService: RedisService
  ) {}
  
  // 用户信息缓存
  async getUserCache(userId: string): Promise<UserDto> {
    const cacheKey = `user:${userId}`;
    return await this.cacheManager.get(cacheKey);
  }
  
  // 权限缓存
  async getPermissionCache(userId: string): Promise<string[]> {
    const cacheKey = `permissions:${userId}`;
    return await this.redisService.get(cacheKey);
  }
}
```

### 缓存策略
- **用户信息**: 30分钟缓存
- **权限数据**: 15分钟缓存
- **菜单数据**: 1小时缓存
- **字典数据**: 24小时缓存
- **Token 黑名单**: 实时缓存

## 性能优化

### 数据库优化
```sql
-- 索引优化
CREATE INDEX idx_sys_user_username ON backend.sys_user(username);
CREATE INDEX idx_sys_user_email ON backend.sys_user(email);
CREATE INDEX idx_sys_tokens_access_token ON backend.sys_tokens(access_token);
CREATE INDEX idx_sys_operation_log_user_id ON backend.sys_operation_log(user_id);
CREATE INDEX idx_sys_operation_log_created_at ON backend.sys_operation_log(created_at);
```

### 连接池配置
```typescript
// Prisma 连接池
generator client {
  provider = "prisma-client-js"
  previewFeatures = ["multiSchema"]
}

// 连接池设置
datasource db {
  provider = "postgresql"
  url = env("DATABASE_URL")
  directUrl = env("DIRECT_DATABASE_URL")
  relationMode = "prisma"
}
```

### 查询优化
```typescript
// 分页查询优化
async findUsers(query: GetUsersQuery): Promise<PageResponse<UserDto>> {
  const { page, pageSize, search } = query;
  
  const where = search ? {
    OR: [
      { username: { contains: search } },
      { nickName: { contains: search } },
      { email: { contains: search } }
    ]
  } : {};
  
  const [users, total] = await Promise.all([
    this.prisma.sysUser.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        username: true,
        nickName: true,
        email: true,
        status: true,
        createdAt: true
      }
    }),
    this.prisma.sysUser.count({ where })
  ]);
  
  return { items: users, total, page, pageSize };
}
```

## 安全措施

### 密码安全
```typescript
// 密码加密
import * as bcrypt from 'bcryptjs';

@Injectable()
export class PasswordService {
  private readonly saltRounds = 12;
  
  async hashPassword(password: string): Promise<string> {
    return await bcrypt.hash(password, this.saltRounds);
  }
  
  async comparePassword(password: string, hash: string): Promise<boolean> {
    return await bcrypt.compare(password, hash);
  }
}
```

### 请求限制
```typescript
// 速率限制
@Controller()
@UseGuards(ThrottlerGuard)
export class AuthController {
  @Post('login')
  @Throttle(5, 60) // 每分钟最多5次登录尝试
  async login(@Body() loginDto: LoginDto) {
    return await this.authService.login(loginDto);
  }
}
```

### CORS 配置
```typescript
// CORS 设置
app.enableCors({
  origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:9527'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true,
  maxAge: 3600
});
```

## 监控和日志

### 日志配置
```typescript
// Winston 日志配置
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.DailyRotateFile({
      filename: 'logs/application-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '14d'
    }),
    new winston.transports.DailyRotateFile({
      filename: 'logs/error-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      level: 'error',
      maxSize: '20m',
      maxFiles: '30d'
    })
  ]
});
```

### 健康检查
```typescript
// 健康检查端点
@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private db: PrismaHealthIndicator,
    private redis: RedisHealthIndicator
  ) {}
  
  @Get()
  @HealthCheck()
  check() {
    return this.health.check([
      () => this.db.pingCheck('database'),
      () => this.redis.pingCheck('redis')
    ]);
  }
}
```

## 部署配置

### Docker 配置
```dockerfile
# Dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

FROM node:18-alpine
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY dist ./dist
COPY prisma ./prisma
EXPOSE 9528
CMD ["node", "dist/apps/base-system/src/main.js"]
```

### 环境变量
```bash
# 生产环境配置
NODE_ENV=production
APP_PORT=9528

# 数据库配置
DATABASE_URL=postgresql://soybean:soybean@123.@postgres:5432/soybean-admin-nest-backend?schema=backend
DIRECT_DATABASE_URL=postgresql://soybean:soybean@123.@postgres:5432/soybean-admin-nest-backend?schema=backend

# Redis 配置
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=123456
REDIS_DB=1

# JWT 配置
JWT_SECRET=JWT_SECRET-soybean-admin-nest!@#123.
JWT_EXPIRE_IN=3600
REFRESH_TOKEN_SECRET=REFRESH_TOKEN_SECRET-soybean-admin-nest!@#123.
REFRESH_TOKEN_EXPIRE_IN=7200

# Swagger 配置
DOC_SWAGGER_ENABLE=true
DOC_SWAGGER_PATH=api-docs

# CORS 配置
CORS_ENABLED=true
CORS_ORIGIN=http://localhost:9527,http://127.0.0.1:9527
CORS_METHODS=GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS
CORS_CREDENTIALS=true
```

## 开发指南

### 本地开发
```bash
# 安装依赖
pnpm install

# 数据库迁移
pnpm prisma:migrate:deploy
pnpm prisma:generate

# 数据种子
pnpm prisma:seed

# 启动开发服务器
pnpm start:dev

# 运行测试
pnpm test
pnpm test:e2e
```

### 代码生成
```bash
# 生成新的模块
nest g module user
nest g controller user
nest g service user

# 生成 Prisma 客户端
pnpm prisma:generate

# 创建数据库迁移
pnpm prisma:migrate
```

### 调试配置
```json
// .vscode/launch.json
{
  "type": "node",
  "request": "launch",
  "name": "Debug NestJS",
  "program": "${workspaceFolder}/dist/apps/base-system/src/main.js",
  "env": {
    "NODE_ENV": "development"
  },
  "console": "integratedTerminal",
  "restart": true,
  "runtimeArgs": ["--nolazy"],
  "sourceMaps": true
}
```

---

**服务端口**: 9528  
**API 文档**: http://localhost:9528/api-docs  
**健康检查**: http://localhost:9528/v1/health  
**文档版本**: v1.0.0  
**更新时间**: 2024年12月  
**维护团队**: SoybeanAdmin 后端团队