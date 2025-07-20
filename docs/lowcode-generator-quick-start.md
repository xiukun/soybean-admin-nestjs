# 低代码项目生成器快速开始指南

## 🚀 快速开始

本指南帮助您快速上手低代码业务系统后端项目生成器，在30分钟内完成第一个项目的生成。

## 📋 前置条件

- Node.js 18+
- PostgreSQL 12+
- Redis 6+
- Docker (可选)

## 🔧 环境准备

### 1. 启动现有服务

```bash
# 启动后端服务
cd lowcode-platform-backend
npm run start:dev

# 启动前端服务
cd ../frontend
npm run dev
```

### 2. 访问系统

- 前端地址: http://localhost:9527
- 后端API: http://localhost:3000
- API文档: http://localhost:3000/api-docs

## 📝 第一步：创建项目

### 1.1 登录系统

使用默认账号登录：
- 用户名: `Soybean`
- 密码: `soybean123`

### 1.2 创建新项目

1. 进入项目管理页面
2. 点击"新增项目"
3. 填写项目信息：
   ```
   项目名称: 用户管理系统
   项目代码: user-management
   描述: 基于低代码平台生成的用户管理系统
   ```

## 🏗️ 第二步：设计数据模型

### 2.1 创建用户实体

1. 进入实体管理页面
2. 选择刚创建的项目
3. 创建"User"实体：

```json
{
  "name": "用户",
  "code": "User",
  "tableName": "users",
  "description": "系统用户实体"
}
```

### 2.2 添加字段

为User实体添加以下字段：

| 字段名 | 字段代码 | 类型 | 长度 | 必填 | 描述 |
|--------|----------|------|------|------|------|
| ID | id | string | 26 | 是 | 主键ID |
| 用户名 | username | string | 50 | 是 | 登录用户名 |
| 邮箱 | email | string | 100 | 是 | 用户邮箱 |
| 姓名 | fullName | string | 100 | 否 | 用户姓名 |
| 手机号 | phone | string | 20 | 否 | 手机号码 |
| 状态 | status | string | 20 | 是 | 用户状态 |
| 创建时间 | createdAt | datetime | - | 是 | 创建时间 |
| 更新时间 | updatedAt | datetime | - | 是 | 更新时间 |

### 2.3 创建角色实体

同样创建"Role"实体：

```json
{
  "name": "角色",
  "code": "Role", 
  "tableName": "roles",
  "description": "用户角色实体"
}
```

添加字段：

| 字段名 | 字段代码 | 类型 | 长度 | 必填 | 描述 |
|--------|----------|------|------|------|------|
| ID | id | string | 26 | 是 | 主键ID |
| 角色名 | name | string | 50 | 是 | 角色名称 |
| 角色代码 | code | string | 50 | 是 | 角色代码 |
| 描述 | description | string | 200 | 否 | 角色描述 |
| 创建时间 | createdAt | datetime | - | 是 | 创建时间 |

### 2.4 创建实体关系

1. 进入关系管理页面
2. 创建User和Role的多对多关系：

```json
{
  "sourceEntity": "User",
  "targetEntity": "Role", 
  "relationType": "manyToMany",
  "relationshipName": "userRoles",
  "description": "用户角色关联"
}
```

## 🎨 第三步：创建代码模板

### 3.1 创建控制器模板

1. 进入模板管理页面
2. 创建NestJS控制器模板：

```typescript
// 模板名称: NestJS Base Controller
// 分类: CONTROLLER
// 语言: TYPESCRIPT
// 框架: NESTJS

import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '@shared/guards/jwt-auth.guard';
import { {{pascalCase entityName}}BaseService } from '../services/{{kebabCase entityName}}.base.service';
import { 
  Create{{pascalCase entityName}}BaseDto, 
  Update{{pascalCase entityName}}BaseDto, 
  {{pascalCase entityName}}ResponseDto,
  {{pascalCase entityName}}QueryDto 
} from '../dto/{{kebabCase entityName}}.dto';

@Controller('{{kebabCase entityName}}')
@ApiTags('{{pascalCase entityName}} Management')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
export class {{pascalCase entityName}}BaseController {
  constructor(
    protected readonly {{camelCase entityName}}Service: {{pascalCase entityName}}BaseService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get all {{entityName}}' })
  async findAll(@Query() query: {{pascalCase entityName}}QueryDto) {
    const result = await this.{{camelCase entityName}}Service.findAll(query);
    
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
  @ApiOperation({ summary: 'Get {{entityName}} by ID' })
  async findOne(@Param('id') id: string) {
    const item = await this.{{camelCase entityName}}Service.findOne(id);
    
    return {
      status: 0,
      msg: 'success',
      data: item
    };
  }

  @Post()
  @ApiOperation({ summary: 'Create {{entityName}}' })
  async create(@Body() createDto: Create{{pascalCase entityName}}BaseDto) {
    const item = await this.{{camelCase entityName}}Service.create(createDto);
    
    return {
      status: 0,
      msg: 'success',
      data: item
    };
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update {{entityName}}' })
  async update(@Param('id') id: string, @Body() updateDto: Update{{pascalCase entityName}}BaseDto) {
    const item = await this.{{camelCase entityName}}Service.update(id, updateDto);
    
    return {
      status: 0,
      msg: 'success',
      data: item
    };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete {{entityName}}' })
  async remove(@Param('id') id: string) {
    await this.{{camelCase entityName}}Service.remove(id);
    
    return {
      status: 0,
      msg: 'success'
    };
  }
}
```

**模板变量**：
```json
[
  {
    "name": "entityName",
    "type": "string",
    "description": "实体名称",
    "required": true,
    "defaultValue": "Entity"
  }
]
```

### 3.2 创建服务模板

创建对应的服务模板：

```typescript
// 模板名称: NestJS Base Service
// 分类: SERVICE
// 语言: TYPESCRIPT
// 框架: NESTJS

import { Injectable } from '@nestjs/common';
import { PrismaService } from '@shared/services/prisma.service';
import { 
  Create{{pascalCase entityName}}BaseDto, 
  Update{{pascalCase entityName}}BaseDto,
  {{pascalCase entityName}}QueryDto 
} from '../dto/{{kebabCase entityName}}.dto';

@Injectable()
export class {{pascalCase entityName}}BaseService {
  constructor(protected readonly prisma: PrismaService) {}

  async findAll(query: {{pascalCase entityName}}QueryDto) {
    const { page = 1, pageSize = 10, ...filters } = query;
    const skip = (page - 1) * pageSize;

    const [items, total] = await Promise.all([
      this.prisma.{{camelCase entityName}}.findMany({
        where: this.buildWhereClause(filters),
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' }
      }),
      this.prisma.{{camelCase entityName}}.count({
        where: this.buildWhereClause(filters)
      })
    ]);

    return { items, total };
  }

  async findOne(id: string) {
    return this.prisma.{{camelCase entityName}}.findUnique({
      where: { id }
    });
  }

  async create(createDto: Create{{pascalCase entityName}}BaseDto) {
    return this.prisma.{{camelCase entityName}}.create({
      data: createDto
    });
  }

  async update(id: string, updateDto: Update{{pascalCase entityName}}BaseDto) {
    return this.prisma.{{camelCase entityName}}.update({
      where: { id },
      data: updateDto
    });
  }

  async remove(id: string) {
    return this.prisma.{{camelCase entityName}}.delete({
      where: { id }
    });
  }

  private buildWhereClause(filters: any) {
    const where: any = {};
    
    // 添加过滤条件
    Object.keys(filters).forEach(key => {
      if (filters[key] !== undefined && filters[key] !== '') {
        where[key] = filters[key];
      }
    });

    return where;
  }
}
```

## 🎯 第四步：生成代码

### 4.1 进入代码生成页面

1. 点击"代码生成"菜单
2. 系统会自动选择当前项目

### 4.2 配置生成参数

1. **选择模板**：
   - NestJS Base Controller
   - NestJS Base Service

2. **选择实体**：
   - User
   - Role

3. **配置输出路径**：
   ```
   ./generated/user-management-api
   ```

4. **设置架构**：
   - 选择"Base-Biz架构"

5. **选择框架**：
   - NestJS

6. **配置选项**：
   - ✅ 生成测试文件
   - ✅ 生成文档
   - ✅ 覆盖已存在文件

### 4.3 填写模板变量

系统会自动为每个实体填充变量：

**User实体**：
```json
{
  "entityName": "User"
}
```

**Role实体**：
```json
{
  "entityName": "Role"
}
```

### 4.4 开始生成

1. 点击"生成代码"按钮
2. 观察生成进度
3. 查看生成日志
4. 等待生成完成

## 📁 第五步：查看生成结果

### 5.1 生成的目录结构

```
generated/user-management-api/
├── src/
│   ├── base/
│   │   ├── controllers/
│   │   │   ├── user.base.controller.ts
│   │   │   └── role.base.controller.ts
│   │   ├── services/
│   │   │   ├── user.base.service.ts
│   │   │   └── role.base.service.ts
│   │   └── dto/
│   │       ├── user.dto.ts
│   │       └── role.dto.ts
│   ├── biz/
│   │   ├── controllers/
│   │   │   ├── user.controller.ts
│   │   │   └── role.controller.ts
│   │   └── services/
│   │       ├── user.service.ts
│   │       └── role.service.ts
│   ├── shared/
│   │   ├── guards/
│   │   ├── services/
│   │   └── utils/
│   ├── config/
│   └── main.ts
├── test/
├── prisma/
├── package.json
├── tsconfig.json
├── nest-cli.json
└── README.md
```

### 5.2 验证生成的代码

1. **检查控制器**：
   - 包含完整的CRUD接口
   - 符合Amis响应格式
   - 包含Swagger文档注解

2. **检查服务**：
   - 实现基础的数据库操作
   - 包含查询条件构建
   - 支持分页和排序

3. **检查DTO**：
   - 包含创建、更新、查询DTO
   - 包含响应DTO定义
   - 包含验证规则

## 🚀 第六步：运行生成的项目

### 6.1 安装依赖

```bash
cd generated/user-management-api
npm install
```

### 6.2 配置环境

```bash
# 复制环境配置
cp .env.example .env

# 编辑数据库连接
vim .env
```

### 6.3 初始化数据库

```bash
# 生成Prisma客户端
npx prisma generate

# 运行数据库迁移
npx prisma migrate dev --name init
```

### 6.4 启动服务

```bash
# 开发模式
npm run start:dev

# 生产模式
npm run build
npm run start:prod
```

### 6.5 测试API

访问 http://localhost:3000/api-docs 查看API文档，测试生成的接口：

```bash
# 创建用户
curl -X POST http://localhost:3000/users \
  -H "Content-Type: application/json" \
  -d '{
    "username": "john_doe",
    "email": "john@example.com",
    "fullName": "John Doe",
    "status": "active"
  }'

# 获取用户列表
curl http://localhost:3000/users?page=1&pageSize=10
```

## 🎉 完成！

恭喜！您已经成功使用低代码平台生成了第一个完整的后端项目。生成的项目包含：

- ✅ 完整的NestJS项目结构
- ✅ Base-Biz分层架构
- ✅ 符合Amis规范的API接口
- ✅ 完整的Swagger文档
- ✅ 数据库模型和迁移
- ✅ 单元测试和集成测试

## 📚 下一步

1. **自定义业务逻辑** - 在biz层添加自定义业务代码
2. **扩展模板** - 创建更多模板满足特定需求
3. **集成前端** - 使用生成的API开发前端应用
4. **部署上线** - 将生成的项目部署到生产环境

---

**提示**：如果遇到问题，请查看详细的技术文档或联系开发团队获取支持。
