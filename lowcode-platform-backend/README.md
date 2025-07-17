# 低代码平台后端 - 开发使用说明

## 📋 目录

- [项目概述](#项目概述)
- [架构设计](#架构设计)
- [快速开始](#快速开始)
- [核心功能](#核心功能)
- [API文档](#api文档)
- [代码生成](#代码生成)
- [二次开发](#二次开发)
- [部署指南](#部署指南)

## 🎯 项目概述

低代码平台后端是一个基于 NestJS 和 DDD（领域驱动设计）架构的企业级低代码开发平台。它提供了完整的实体管理、API管理、代码生成等功能，支持快速构建业务应用。

### 主要特性

- 🏗️ **DDD架构设计** - 采用领域驱动设计，清晰的分层架构
- 🔧 **实体管理** - 可视化实体设计，支持字段管理和关系设计
- 🌐 **API管理** - 灵活的API配置，支持多表查询和自定义参数
- ⚡ **代码生成** - 自动生成高质量的业务代码，支持base/biz分离
- 🔄 **热更新** - 支持代码生成后的热更新机制
- 📊 **多表查询** - 强大的多表关联查询能力
- 🔐 **权限控制** - 完整的认证和授权机制

### 技术栈

- **框架**: NestJS 11.x
- **数据库**: PostgreSQL + Prisma ORM
- **架构**: CQRS + Event Sourcing + DDD
- **文档**: Swagger/OpenAPI
- **模板引擎**: Handlebars
- **缓存**: Redis (可选)

## 🏛️ 架构设计

### DDD分层架构

```
src/
├── api/                    # API接口层
│   └── lowcode/           # 低代码相关API
├── lib/                   # 核心业务逻辑
│   ├── bounded-contexts/  # 限界上下文
│   │   ├── entity/       # 实体管理上下文
│   │   ├── api/          # API管理上下文
│   │   ├── codegen/      # 代码生成上下文
│   │   └── project/      # 项目管理上下文
│   └── shared/           # 共享模块
├── infra/                # 基础设施层
│   └── bounded-contexts/ # 仓储实现
└── resources/            # 资源文件
```

### 限界上下文设计

每个限界上下文包含：

```
entity/
├── domain/              # 领域层
│   ├── *.model.ts      # 聚合根和实体
│   ├── *.repository.ts # 仓储接口
│   └── events/         # 领域事件
├── application/         # 应用层
│   ├── commands/       # 命令
│   ├── queries/        # 查询
│   ├── handlers/       # 处理器
│   └── services/       # 应用服务
└── infrastructure/      # 基础设施层
    └── repositories/   # 仓储实现
```

## 🚀 快速开始

### 环境要求

- Node.js 18.x+
- PostgreSQL 13.x+
- Redis 6.x+ (可选)
- pnpm 8.x+

### 安装依赖

```bash
cd lowcode-platform-backend
pnpm install
```

### 配置环境变量

```bash
cp .env.example .env
```

编辑 `.env` 文件：

```env
# 数据库配置
DATABASE_URL="postgresql://username:password@localhost:5432/lowcode_platform"

# 服务配置
PORT=3000
NODE_ENV=development

# JWT配置
JWT_SECRET=your-jwt-secret-key
JWT_EXPIRES_IN=7d
```

### 数据库初始化

```bash
# 生成Prisma客户端
pnpm prisma:generate

# 运行数据库迁移
pnpm prisma:migrate

# 查看数据库（可选）
pnpm prisma:studio
```

### 启动服务

```bash
# 开发模式
pnpm start:dev

# 生产模式
pnpm start:prod
```

服务启动后访问：
- API服务: http://localhost:3000
- API文档: http://localhost:3000/api-docs

## 🔧 核心功能

### 1. 项目管理

创建和管理低代码项目：

```typescript
// 创建项目
POST /api/v1/projects
{
  "name": "用户管理系统",
  "code": "user_management",
  "description": "企业用户管理系统"
}
```

### 2. 实体管理

#### 创建实体

```typescript
POST /api/v1/entities
{
  "projectId": "project-uuid",
  "name": "用户",
  "code": "user",
  "tableName": "users",
  "description": "系统用户实体",
  "category": "core"
}
```

#### 添加字段

```typescript
POST /api/v1/entities/{entityId}/fields
{
  "name": "用户名",
  "code": "username",
  "type": "STRING",
  "length": 50,
  "nullable": false,
  "uniqueConstraint": true,
  "indexed": true,
  "validationRules": {
    "required": true,
    "minLength": 3,
    "maxLength": 50,
    "pattern": "^[a-zA-Z0-9_]+$"
  }
}
```

#### 创建关系

```typescript
POST /api/v1/relations
{
  "projectId": "project-uuid",
  "name": "用户角色关系",
  "type": "MANY_TO_MANY",
  "sourceEntityId": "user-entity-id",
  "sourceFieldId": "user-id-field",
  "targetEntityId": "role-entity-id",
  "targetFieldId": "role-id-field",
  "joinTableConfig": {
    "tableName": "user_roles"
  }
}
```

### 3. API管理

#### 创建API

```typescript
POST /api/v1/apis
{
  "projectId": "project-uuid",
  "entityId": "user-entity-id",
  "name": "获取用户列表",
  "code": "getUserList",
  "path": "/users",
  "method": "GET",
  "requestConfig": {
    "query": {
      "page": { "type": "number", "default": 1 },
      "limit": { "type": "number", "default": 10 },
      "status": { "type": "string", "enum": ["ACTIVE", "INACTIVE"] }
    }
  },
  "responseConfig": {
    "schema": {
      "type": "object",
      "properties": {
        "data": { "type": "array" },
        "total": { "type": "number" },
        "page": { "type": "number" },
        "limit": { "type": "number" }
      }
    }
  },
  "queryConfig": {
    "multiTable": true,
    "joins": [
      {
        "sourceEntity": "users",
        "targetEntity": "roles",
        "joinType": "LEFT",
        "condition": "users.role_id = roles.id"
      }
    ]
  }
}
```

### 4. 多表查询

```typescript
POST /api/v1/queries/execute
{
  "mainEntity": "users",
  "joins": [
    {
      "sourceEntity": "users",
      "targetEntity": "roles",
      "sourceField": "role_id",
      "targetField": "id",
      "joinType": "LEFT",
      "alias": "role"
    }
  ],
  "select": [
    "users.id",
    "users.username",
    "users.email",
    "role.name as role_name"
  ],
  "where": {
    "users.status": { "eq": "ACTIVE" },
    "users.created_at": { "gte": "2024-01-01" }
  },
  "orderBy": {
    "users.created_at": "DESC"
  },
  "limit": 10,
  "offset": 0
}
```

## ⚡ 代码生成

### 1. 生成实体CRUD代码

```typescript
POST /api/v1/codegen/tasks
{
  "projectId": "project-uuid",
  "name": "生成用户管理代码",
  "type": "ENTITY",
  "config": {
    "outputPath": "/path/to/business-system",
    "entityIds": ["user-entity-id"],
    "templates": ["ENTITY_MODEL", "ENTITY_SERVICE", "ENTITY_CONTROLLER"],
    "generateBase": true,
    "generateBiz": true
  }
}
```

### 2. 生成的代码结构

```
business-system/
├── base/                    # 生成的基础代码（不可修改）
│   └── user/
│       ├── user.model.ts
│       ├── user.dto.ts
│       ├── user.base.service.ts
│       ├── user.base.controller.ts
│       └── user.repository.ts
└── biz/                     # 业务扩展代码（可修改）
    └── user/
        ├── user.service.ts  # 继承base service
        ├── user.controller.ts # 继承base controller
        └── user.module.ts
```

### 3. 基础代码示例

生成的基础服务类：

```typescript
// base/user/user.base.service.ts
@Injectable()
export abstract class UserBaseService {
  constructor(
    protected readonly repository: UserRepository,
  ) {}

  async create(data: CreateUserDto): Promise<User> {
    return await this.repository.save(User.create(data));
  }

  async findById(id: string): Promise<User | null> {
    return await this.repository.findById(id);
  }

  async findAll(query: QueryUserDto): Promise<PaginatedResult<User>> {
    return await this.repository.findPaginated(query);
  }

  async update(id: string, data: UpdateUserDto): Promise<User> {
    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    user.update(data);
    return await this.repository.update(user);
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }
}
```

### 4. 业务扩展代码示例

```typescript
// biz/user/user.service.ts
@Injectable()
export class UserService extends UserBaseService {
  // 添加自定义业务逻辑
  
  async findByEmail(email: string): Promise<User | null> {
    // 自定义查询逻辑
    return await this.repository.findByEmail(email);
  }

  async activateUser(id: string): Promise<User> {
    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    
    // 自定义业务逻辑
    user.activate();
    return await this.repository.update(user);
  }

  async getUserStatistics(): Promise<any> {
    // 自定义统计逻辑
    return {
      total: await this.repository.count(),
      active: await this.repository.countByStatus('ACTIVE'),
      inactive: await this.repository.countByStatus('INACTIVE'),
    };
  }
}
```

## 🔄 二次开发

### 1. 扩展实体模型

在 `biz` 目录下扩展实体：

```typescript
// biz/user/user.extended.model.ts
export class ExtendedUser extends User {
  // 添加额外的业务方法
  
  calculateAge(): number {
    if (!this.birthDate) return 0;
    return new Date().getFullYear() - this.birthDate.getFullYear();
  }

  isVip(): boolean {
    return this.memberLevel === 'VIP';
  }

  async sendWelcomeEmail(): Promise<void> {
    // 发送欢迎邮件逻辑
  }
}
```

### 2. 自定义API端点

```typescript
// biz/user/user.controller.ts
@Controller('users')
export class UserController extends UserBaseController {
  constructor(
    protected readonly userService: UserService,
  ) {
    super(userService);
  }

  @Get('statistics')
  @ApiOperation({ summary: '获取用户统计信息' })
  async getStatistics() {
    return await this.userService.getUserStatistics();
  }

  @Post(':id/activate')
  @ApiOperation({ summary: '激活用户' })
  async activateUser(@Param('id') id: string) {
    return await this.userService.activateUser(id);
  }

  @Get('search')
  @ApiOperation({ summary: '搜索用户' })
  async searchUsers(@Query() query: SearchUserDto) {
    return await this.userService.searchUsers(query);
  }
}
```

### 3. 添加自定义验证

```typescript
// biz/user/dto/create-user.dto.ts
export class CreateUserDto extends CreateUserBaseDto {
  @IsOptional()
  @IsDateString()
  @ApiPropertyOptional({ description: '生日' })
  birthDate?: string;

  @IsOptional()
  @IsEnum(['BASIC', 'VIP', 'PREMIUM'])
  @ApiPropertyOptional({ description: '会员等级' })
  memberLevel?: string;

  @IsOptional()
  @IsArray()
  @ApiPropertyOptional({ description: '用户标签' })
  tags?: string[];
}
```

### 4. 自定义事件处理

```typescript
// biz/user/events/user-activated.event.ts
export class UserActivatedEvent {
  constructor(
    public readonly userId: string,
    public readonly email: string,
  ) {}
}

// biz/user/handlers/user-activated.handler.ts
@EventsHandler(UserActivatedEvent)
export class UserActivatedHandler implements IEventHandler<UserActivatedEvent> {
  constructor(
    private readonly emailService: EmailService,
    private readonly notificationService: NotificationService,
  ) {}

  async handle(event: UserActivatedEvent) {
    // 发送激活邮件
    await this.emailService.sendActivationEmail(event.email);
    
    // 发送系统通知
    await this.notificationService.sendNotification({
      userId: event.userId,
      type: 'USER_ACTIVATED',
      message: '您的账户已成功激活',
    });
  }
}
```

## 📚 API文档

启动服务后，访问 http://localhost:3000/api-docs 查看完整的API文档。

### 主要API端点

| 模块 | 端点 | 描述 |
|------|------|------|
| 项目管理 | `/api/v1/projects` | 项目CRUD操作 |
| 实体管理 | `/api/v1/entities` | 实体CRUD操作 |
| 字段管理 | `/api/v1/entities/{id}/fields` | 字段管理 |
| 关系管理 | `/api/v1/relations` | 实体关系管理 |
| API管理 | `/api/v1/apis` | API配置管理 |
| 代码生成 | `/api/v1/codegen/tasks` | 代码生成任务 |
| 多表查询 | `/api/v1/queries/execute` | 执行多表查询 |

## 🚀 部署指南

### Docker部署

1. 构建镜像：

```bash
docker build -t lowcode-platform-backend .
```

2. 运行容器：

```bash
docker run -d \
  --name lowcode-backend \
  -p 3000:3000 \
  -e DATABASE_URL="postgresql://user:pass@host:5432/db" \
  lowcode-platform-backend
```

### 生产环境配置

1. 环境变量配置：

```env
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://...
JWT_SECRET=your-production-secret
REDIS_URL=redis://...
```

2. PM2部署：

```bash
pnpm build
pm2 start ecosystem.config.js
```

### 性能优化

1. **数据库优化**
   - 为经常查询的字段添加索引
   - 使用连接池
   - 启用查询缓存

2. **缓存策略**
   - Redis缓存热点数据
   - API响应缓存
   - 查询结果缓存

3. **监控和日志**
   - 集成APM工具
   - 结构化日志
   - 性能指标监控

## 🤝 贡献指南

1. Fork项目
2. 创建功能分支
3. 提交更改
4. 推送到分支
5. 创建Pull Request

## 📄 许可证

MIT License

## 🆘 支持

如有问题，请提交Issue或联系开发团队。
