# 用户管理系统示例

这是一个使用低代码平台构建的完整用户管理系统示例，展示了如何使用平台的各项功能。

## 📋 系统概述

用户管理系统包含以下功能模块：
- 用户管理（增删改查）
- 角色管理
- 权限管理
- 部门管理
- 用户角色关联
- 角色权限关联

## 🏗️ 数据模型设计

### 实体关系图

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│    User     │    │    Role     │    │ Permission  │
│             │    │             │    │             │
│ - id        │    │ - id        │    │ - id        │
│ - username  │◄──►│ - name      │◄──►│ - name      │
│ - email     │    │ - code      │    │ - code      │
│ - password  │    │ - desc      │    │ - resource  │
│ - status    │    │ - status    │    │ - action    │
│ - dept_id   │    └─────────────┘    └─────────────┘
└─────────────┘           │
       │                  │
       ▼                  ▼
┌─────────────┐    ┌─────────────┐
│ Department  │    │ UserRole    │
│             │    │             │
│ - id        │    │ - user_id   │
│ - name      │    │ - role_id   │
│ - code      │    │ - created_at│
│ - parent_id │    └─────────────┘
│ - level     │
└─────────────┘
```

## 🚀 快速开始

### 1. 创建项目

```bash
curl -X POST http://localhost:3000/api/v1/projects \
  -H "Content-Type: application/json" \
  -d '{
    "name": "用户管理系统",
    "code": "user_management",
    "description": "企业级用户权限管理系统",
    "version": "1.0.0"
  }'
```

### 2. 创建实体

#### 创建用户实体

```bash
curl -X POST http://localhost:3000/api/v1/entities \
  -H "Content-Type: application/json" \
  -d '{
    "projectId": "PROJECT_ID",
    "name": "用户",
    "code": "user",
    "tableName": "users",
    "description": "系统用户实体",
    "category": "core"
  }'
```

#### 添加用户字段

```bash
# 用户名字段
curl -X POST http://localhost:3000/api/v1/entities/USER_ENTITY_ID/fields \
  -H "Content-Type: application/json" \
  -d '{
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
    },
    "comment": "用户登录名"
  }'

# 邮箱字段
curl -X POST http://localhost:3000/api/v1/entities/USER_ENTITY_ID/fields \
  -H "Content-Type: application/json" \
  -d '{
    "name": "邮箱",
    "code": "email",
    "type": "STRING",
    "length": 100,
    "nullable": false,
    "uniqueConstraint": true,
    "indexed": true,
    "validationRules": {
      "required": true,
      "email": true
    },
    "comment": "用户邮箱地址"
  }'

# 密码字段
curl -X POST http://localhost:3000/api/v1/entities/USER_ENTITY_ID/fields \
  -H "Content-Type: application/json" \
  -d '{
    "name": "密码",
    "code": "password",
    "type": "STRING",
    "length": 255,
    "nullable": false,
    "validationRules": {
      "required": true,
      "minLength": 6
    },
    "comment": "用户密码（加密存储）"
  }'

# 状态字段
curl -X POST http://localhost:3000/api/v1/entities/USER_ENTITY_ID/fields \
  -H "Content-Type: application/json" \
  -d '{
    "name": "状态",
    "code": "status",
    "type": "STRING",
    "length": 20,
    "nullable": false,
    "defaultValue": "ACTIVE",
    "indexed": true,
    "enumOptions": ["ACTIVE", "INACTIVE", "LOCKED"],
    "comment": "用户状态"
  }'
```

#### 创建角色实体

```bash
curl -X POST http://localhost:3000/api/v1/entities \
  -H "Content-Type: application/json" \
  -d '{
    "projectId": "PROJECT_ID",
    "name": "角色",
    "code": "role",
    "tableName": "roles",
    "description": "系统角色实体",
    "category": "auth"
  }'
```

#### 创建部门实体

```bash
curl -X POST http://localhost:3000/api/v1/entities \
  -H "Content-Type: application/json" \
  -d '{
    "projectId": "PROJECT_ID",
    "name": "部门",
    "code": "department",
    "tableName": "departments",
    "description": "组织部门实体",
    "category": "org"
  }'
```

### 3. 创建实体关系

#### 用户-部门关系（多对一）

```bash
curl -X POST http://localhost:3000/api/v1/relations \
  -H "Content-Type: application/json" \
  -d '{
    "projectId": "PROJECT_ID",
    "name": "用户部门关系",
    "type": "MANY_TO_ONE",
    "sourceEntityId": "USER_ENTITY_ID",
    "sourceFieldId": "DEPT_ID_FIELD_ID",
    "targetEntityId": "DEPT_ENTITY_ID",
    "targetFieldId": "DEPT_ID_FIELD_ID",
    "onDelete": "SET_NULL",
    "onUpdate": "CASCADE"
  }'
```

#### 用户-角色关系（多对多）

```bash
curl -X POST http://localhost:3000/api/v1/relations \
  -H "Content-Type: application/json" \
  -d '{
    "projectId": "PROJECT_ID",
    "name": "用户角色关系",
    "type": "MANY_TO_MANY",
    "sourceEntityId": "USER_ENTITY_ID",
    "sourceFieldId": "USER_ID_FIELD_ID",
    "targetEntityId": "ROLE_ENTITY_ID",
    "targetFieldId": "ROLE_ID_FIELD_ID",
    "joinTableConfig": {
      "tableName": "user_roles",
      "sourceColumn": "user_id",
      "targetColumn": "role_id"
    }
  }'
```

### 4. 创建API接口

#### 用户列表API

```bash
curl -X POST http://localhost:3000/api/v1/apis \
  -H "Content-Type: application/json" \
  -d '{
    "projectId": "PROJECT_ID",
    "entityId": "USER_ENTITY_ID",
    "name": "获取用户列表",
    "code": "getUserList",
    "path": "/users",
    "method": "GET",
    "description": "分页获取用户列表，支持筛选和搜索",
    "requestConfig": {
      "query": {
        "page": { "type": "number", "default": 1, "description": "页码" },
        "limit": { "type": "number", "default": 10, "description": "每页数量" },
        "status": { "type": "string", "enum": ["ACTIVE", "INACTIVE", "LOCKED"], "description": "用户状态" },
        "deptId": { "type": "string", "description": "部门ID" },
        "keyword": { "type": "string", "description": "搜索关键词" }
      }
    },
    "responseConfig": {
      "schema": {
        "type": "object",
        "properties": {
          "data": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "id": { "type": "string" },
                "username": { "type": "string" },
                "email": { "type": "string" },
                "status": { "type": "string" },
                "department": {
                  "type": "object",
                  "properties": {
                    "id": { "type": "string" },
                    "name": { "type": "string" }
                  }
                },
                "roles": {
                  "type": "array",
                  "items": {
                    "type": "object",
                    "properties": {
                      "id": { "type": "string" },
                      "name": { "type": "string" }
                    }
                  }
                }
              }
            }
          },
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
          "targetEntity": "departments",
          "sourceField": "dept_id",
          "targetField": "id",
          "joinType": "LEFT",
          "alias": "dept"
        },
        {
          "sourceEntity": "users",
          "targetEntity": "user_roles",
          "sourceField": "id",
          "targetField": "user_id",
          "joinType": "LEFT",
          "alias": "ur"
        },
        {
          "sourceEntity": "ur",
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
        "users.status",
        "users.created_at",
        "dept.name as dept_name",
        "role.name as role_name"
      ]
    }
  }'
```

#### 创建用户API

```bash
curl -X POST http://localhost:3000/api/v1/apis \
  -H "Content-Type: application/json" \
  -d '{
    "projectId": "PROJECT_ID",
    "entityId": "USER_ENTITY_ID",
    "name": "创建用户",
    "code": "createUser",
    "path": "/users",
    "method": "POST",
    "description": "创建新用户",
    "requestConfig": {
      "body": {
        "type": "object",
        "properties": {
          "username": { "type": "string", "minLength": 3, "maxLength": 50 },
          "email": { "type": "string", "format": "email" },
          "password": { "type": "string", "minLength": 6 },
          "deptId": { "type": "string" },
          "roleIds": { "type": "array", "items": { "type": "string" } }
        },
        "required": ["username", "email", "password"]
      }
    },
    "responseConfig": {
      "schema": {
        "type": "object",
        "properties": {
          "id": { "type": "string" },
          "username": { "type": "string" },
          "email": { "type": "string" },
          "status": { "type": "string" },
          "createdAt": { "type": "string", "format": "date-time" }
        }
      }
    }
  }'
```

### 5. 生成代码

```bash
curl -X POST http://localhost:3000/api/v1/codegen/tasks \
  -H "Content-Type: application/json" \
  -d '{
    "projectId": "PROJECT_ID",
    "name": "生成用户管理系统代码",
    "type": "FULL_PROJECT",
    "config": {
      "outputPath": "/path/to/business-system",
      "templates": [
        "ENTITY_MODEL",
        "ENTITY_DTO",
        "ENTITY_SERVICE",
        "ENTITY_CONTROLLER",
        "ENTITY_REPOSITORY"
      ],
      "generateBase": true,
      "generateBiz": true,
      "language": "TYPESCRIPT",
      "framework": "NESTJS"
    }
  }'
```

## 📁 生成的代码结构

```
business-system/
├── base/                           # 基础代码（自动生成，不可修改）
│   ├── user/
│   │   ├── user.model.ts          # 用户实体模型
│   │   ├── user.dto.ts            # 数据传输对象
│   │   ├── user.base.service.ts   # 基础服务类
│   │   ├── user.base.controller.ts # 基础控制器
│   │   └── user.repository.ts     # 仓储接口
│   ├── role/
│   │   ├── role.model.ts
│   │   ├── role.dto.ts
│   │   ├── role.base.service.ts
│   │   ├── role.base.controller.ts
│   │   └── role.repository.ts
│   ├── department/
│   │   └── ...
│   └── business-system.module.ts  # 主模块文件
└── biz/                           # 业务扩展代码（可修改）
    ├── user/
    │   ├── user.service.ts        # 扩展用户服务
    │   ├── user.controller.ts     # 扩展用户控制器
    │   ├── user.module.ts         # 用户模块
    │   └── dto/
    │       ├── create-user.dto.ts
    │       └── update-user.dto.ts
    ├── role/
    │   └── ...
    └── department/
        └── ...
```

## 🔧 业务扩展示例

### 扩展用户服务

```typescript
// biz/user/user.service.ts
import { Injectable } from '@nestjs/common';
import { UserBaseService } from '../../base/user/user.base.service';
import { EmailService } from '../shared/email.service';

@Injectable()
export class UserService extends UserBaseService {
  constructor(
    userRepository: UserRepository,
    private readonly emailService: EmailService,
  ) {
    super(userRepository);
  }

  // 扩展：用户注册
  async register(data: RegisterUserDto): Promise<User> {
    // 密码加密
    const hashedPassword = await bcrypt.hash(data.password, 10);
    
    const user = await this.create({
      ...data,
      password: hashedPassword,
      status: 'INACTIVE', // 需要邮箱验证
    });

    // 发送验证邮件
    await this.emailService.sendVerificationEmail(user.email, user.id);

    return user;
  }

  // 扩展：用户登录
  async login(username: string, password: string): Promise<LoginResult> {
    const user = await this.repository.findByUsername(username);
    if (!user) {
      throw new UnauthorizedException('用户名或密码错误');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('用户名或密码错误');
    }

    if (user.status !== 'ACTIVE') {
      throw new UnauthorizedException('账户未激活或已被锁定');
    }

    // 生成JWT token
    const token = this.jwtService.sign({ userId: user.id });

    return {
      user: user.toJSON(),
      token,
      expiresIn: '7d',
    };
  }

  // 扩展：重置密码
  async resetPassword(email: string): Promise<void> {
    const user = await this.repository.findByEmail(email);
    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    const resetToken = this.generateResetToken();
    user.setResetToken(resetToken);
    await this.repository.update(user);

    await this.emailService.sendPasswordResetEmail(email, resetToken);
  }

  // 扩展：获取用户权限
  async getUserPermissions(userId: string): Promise<string[]> {
    const userWithRoles = await this.repository.findWithRoles(userId);
    if (!userWithRoles) {
      throw new NotFoundException('用户不存在');
    }

    const permissions = new Set<string>();
    for (const role of userWithRoles.roles) {
      const rolePermissions = await this.roleService.getRolePermissions(role.id);
      rolePermissions.forEach(permission => permissions.add(permission));
    }

    return Array.from(permissions);
  }
}
```

### 扩展用户控制器

```typescript
// biz/user/user.controller.ts
import { Controller, Post, Body, Get, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { UserBaseController } from '../../base/user/user.base.controller';
import { UserService } from './user.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@ApiTags('用户管理')
@Controller('users')
export class UserController extends UserBaseController {
  constructor(
    protected readonly userService: UserService,
  ) {
    super(userService);
  }

  @Post('register')
  @ApiOperation({ summary: '用户注册' })
  async register(@Body() registerDto: RegisterUserDto) {
    return await this.userService.register(registerDto);
  }

  @Post('login')
  @ApiOperation({ summary: '用户登录' })
  async login(@Body() loginDto: LoginDto) {
    return await this.userService.login(loginDto.username, loginDto.password);
  }

  @Post('reset-password')
  @ApiOperation({ summary: '重置密码' })
  async resetPassword(@Body() resetDto: ResetPasswordDto) {
    await this.userService.resetPassword(resetDto.email);
    return { message: '重置密码邮件已发送' };
  }

  @Get(':id/permissions')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'user')
  @ApiOperation({ summary: '获取用户权限' })
  async getUserPermissions(@Param('id') id: string) {
    return await this.userService.getUserPermissions(id);
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: '获取当前用户信息' })
  async getProfile(@Request() req) {
    return await this.userService.findById(req.user.userId);
  }
}
```

## 🧪 测试示例

### API测试

```bash
# 1. 创建用户
curl -X POST http://localhost:3000/api/v1/users \
  -H "Content-Type: application/json" \
  -d '{
    "username": "john_doe",
    "email": "john@example.com",
    "password": "123456",
    "deptId": "dept-uuid",
    "roleIds": ["role-uuid-1", "role-uuid-2"]
  }'

# 2. 获取用户列表
curl -X GET "http://localhost:3000/api/v1/users?page=1&limit=10&status=ACTIVE&keyword=john"

# 3. 更新用户
curl -X PUT http://localhost:3000/api/v1/users/user-uuid \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john.doe@example.com",
    "status": "ACTIVE"
  }'

# 4. 删除用户
curl -X DELETE http://localhost:3000/api/v1/users/user-uuid
```

### 多表查询测试

```bash
curl -X POST http://localhost:3000/api/v1/queries/execute \
  -H "Content-Type: application/json" \
  -d '{
    "mainEntity": "users",
    "joins": [
      {
        "sourceEntity": "users",
        "targetEntity": "departments",
        "sourceField": "dept_id",
        "targetField": "id",
        "joinType": "LEFT",
        "alias": "dept"
      },
      {
        "sourceEntity": "users",
        "targetEntity": "user_roles",
        "sourceField": "id",
        "targetField": "user_id",
        "joinType": "LEFT",
        "alias": "ur"
      },
      {
        "sourceEntity": "ur",
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
      "users.status",
      "dept.name as department_name",
      "role.name as role_name"
    ],
    "where": {
      "users.status": { "eq": "ACTIVE" },
      "dept.name": { "like": "%技术%" }
    },
    "orderBy": {
      "users.created_at": "DESC"
    },
    "limit": 20
  }'
```

## 📊 监控和维护

### 性能监控

1. **数据库查询优化**
   - 监控慢查询
   - 添加必要索引
   - 优化复杂查询

2. **API性能监控**
   - 响应时间监控
   - 错误率统计
   - 并发量监控

### 日志管理

```typescript
// 添加结构化日志
import { Logger } from '@nestjs/common';

@Injectable()
export class UserService extends UserBaseService {
  private readonly logger = new Logger(UserService.name);

  async create(data: CreateUserDto): Promise<User> {
    this.logger.log(`Creating user: ${data.username}`);
    
    try {
      const user = await super.create(data);
      this.logger.log(`User created successfully: ${user.id}`);
      return user;
    } catch (error) {
      this.logger.error(`Failed to create user: ${error.message}`, error.stack);
      throw error;
    }
  }
}
```

## 🎯 总结

这个示例展示了如何使用低代码平台快速构建一个完整的用户管理系统，包括：

1. **数据模型设计** - 实体、字段、关系的定义
2. **API接口配置** - RESTful API的自动生成和配置
3. **代码生成** - 基础CRUD代码的自动生成
4. **业务扩展** - 在生成代码基础上的业务逻辑扩展
5. **测试验证** - API测试和功能验证

通过这种方式，开发者可以专注于业务逻辑的实现，而不需要重复编写基础的CRUD代码，大大提高了开发效率。
