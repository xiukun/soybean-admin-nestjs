# 多租户功能实现指南

本文档描述了系统中多租户功能的实现方案和使用方法。

## 功能概述

多租户架构允许单个应用实例为多个租户（客户）提供服务，每个租户的数据完全隔离。本系统通过以下组件实现多租户功能：

- **租户守卫 (TenantGuard)**: 自动提取和验证租户ID
- **租户装饰器**: 标记需要租户验证的接口和获取当前租户ID
- **租户上下文服务**: 在请求生命周期内管理租户信息
- **数据库Schema**: 在相关表中添加 `tenantId` 字段实现数据隔离

## 核心组件

### 1. 租户守卫 (TenantGuard)

位置: `libs/infra/guard/src/tenant.guard.ts`

功能:
- 从请求头、查询参数或请求体中提取租户ID
- 验证租户ID是否存在
- 将租户ID设置到请求上下文中

### 2. 租户装饰器

位置: `libs/infra/decorators/src/tenant.decorator.ts`

包含两个装饰器:
- `@TenantRequired()`: 标记需要租户验证的控制器或方法
- `@CurrentTenant()`: 在控制器方法中获取当前租户ID

### 3. 租户上下文服务

位置: `libs/shared/src/services/tenant-context.service.ts`

功能:
- 在请求生命周期内存储租户信息
- 提供获取和设置租户ID的方法

## 使用方法

### 1. 在控制器中使用

```typescript
import { Controller, Post, Body } from '@nestjs/common';
import { TenantRequired, CurrentTenant } from '@lib/infra/decorators/tenant.decorator';

@Controller('example')
@TenantRequired() // 标记整个控制器需要租户验证
export class ExampleController {
  
  @Post()
  create(
    @Body() createDto: CreateDto,
    @CurrentTenant() tenantId: string // 获取当前租户ID
  ) {
    // 将租户ID添加到DTO中
    return this.service.create({ ...createDto, tenantId });
  }
}
```

### 2. 在服务中使用

```typescript
import { Injectable } from '@nestjs/common';
import { TenantContextService } from '@lib/shared/services/tenant-context.service';

@Injectable()
export class ExampleService {
  constructor(
    private readonly tenantContextService: TenantContextService
  ) {}
  
  async findAll() {
    const tenantId = this.tenantContextService.getTenantId();
    return this.prisma.example.findMany({
      where: { tenantId }
    });
  }
}
```

### 3. 客户端传递租户ID

支持三种方式传递租户ID（优先级从高到低）：

#### 方式1: 请求头（推荐）
```http
POST /api/v1/organization
Content-Type: application/json
X-Tenant-ID: tenant-001
Authorization: Bearer <token>

{
  "name": "测试组织"
}
```

#### 方式2: 查询参数
```http
GET /api/v1/organization?tenantId=tenant-001
Authorization: Bearer <token>
```

#### 方式3: 请求体
```http
POST /api/v1/organization
Content-Type: application/json
Authorization: Bearer <token>

{
  "name": "测试组织",
  "tenantId": "tenant-001"
}
```

## 数据库Schema变更

### 已支持多租户的表

- `sys_organization`: 组织表，添加了 `tenantId` 字段
- `tenant`: 租户表，用于管理租户信息

### Schema示例

```prisma
model SysOrganization {
  id          String   @id @default(cuid())
  name        String
  code        String?
  description String?
  tenantId    String   // 租户ID字段
  tenant      Tenant   @relation(fields: [tenantId], references: [id])
  // ... 其他字段
  
  @@unique([tenantId, name]) // 确保同一租户内组织名称唯一
  @@map("sys_organization")
}

model Tenant {
  id            String            @id @default(cuid())
  name          String            @unique
  code          String            @unique
  organizations SysOrganization[] // 关联组织
  // ... 其他字段
  
  @@map("tenant")
}
```

## 测试

### 使用HTTP文件测试

项目根目录下的 `test-tenant.http` 文件包含了完整的测试用例：

1. 通过请求头传递租户ID
2. 通过查询参数传递租户ID
3. 缺少租户ID的错误情况
4. 组织创建和查询的多租户测试

### 测试步骤

1. 确保后端服务正在运行
2. 使用VS Code的REST Client插件或Postman
3. 执行 `test-tenant.http` 中的测试用例
4. 验证返回结果中包含正确的租户ID

## 注意事项

1. **数据隔离**: 所有涉及租户数据的查询都必须包含 `tenantId` 过滤条件
2. **唯一性约束**: 需要将原有的唯一性约束改为租户级别的唯一性
3. **权限控制**: 确保用户只能访问自己租户的数据
4. **性能考虑**: 在 `tenantId` 字段上创建索引以提高查询性能

## 扩展其他模块

要为其他模块添加多租户支持，请按以下步骤操作：

1. **更新Prisma Schema**: 在相关表中添加 `tenantId` 字段
2. **运行数据库迁移**: `npx prisma migrate dev`
3. **更新DTO**: 在创建和查询DTO中添加 `tenantId` 字段
4. **更新服务**: 在所有数据库操作中添加租户过滤
5. **更新控制器**: 使用 `@TenantRequired()` 和 `@CurrentTenant()` 装饰器
6. **添加测试**: 创建相应的测试用例验证多租户功能

## 故障排除

### 常见错误

1. **"租户ID不能为空"**: 检查请求是否包含租户ID
2. **类型错误**: 确保Prisma Client已重新生成 (`npx prisma generate`)
3. **数据查询为空**: 检查数据库中是否存在对应租户的数据

### 调试技巧

1. 在租户守卫中添加日志输出
2. 检查请求上下文中的租户ID是否正确设置
3. 验证数据库查询条件是否包含租户过滤