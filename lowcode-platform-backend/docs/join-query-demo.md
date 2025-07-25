# 多表关联接口生成功能演示

## 概述

本文档演示低代码平台的多表关联接口生成功能，包括实体关系配置和关联查询自动生成。

## 功能架构

```
多表关联接口生成
├── 实体关系管理
│   ├── 关系配置 (RelationshipManagerService)
│   ├── 关系验证 (配置验证、冲突检测)
│   ├── 关系图生成 (可视化展示)
│   └── 关系统计 (数量、类型分布)
├── 关联查询生成
│   ├── 查询引擎 (JoinQueryGeneratorService)
│   ├── SQL生成 (标准SQL、复杂JOIN)
│   ├── Prisma生成 (类型安全查询)
│   ├── 类型生成 (TypeScript接口)
│   ├── API生成 (NestJS控制器)
│   └── 文档生成 (Markdown文档)
└── 配置管理
    ├── 配置验证 (CQRS模式)
    ├── 配置保存 (版本控制)
    ├── 批量操作 (批量生成)
    └── 预览功能 (实时预览)
```

## 使用场景

### 场景1：用户订单关联查询

**业务需求**: 查询用户及其订单信息，支持按用户名筛选，按订单金额排序。

**实体关系配置**:
```json
{
  "name": "用户订单关系",
  "code": "user_order_rel",
  "type": "one-to-many",
  "sourceEntityId": "user-entity-id",
  "targetEntityId": "order-entity-id",
  "sourceFieldId": "user-id-field",
  "targetFieldId": "order-user-id-field",
  "foreignKeyName": "fk_order_user_id",
  "onDelete": "CASCADE",
  "onUpdate": "RESTRICT",
  "indexed": true
}
```

**关联查询配置**:
```json
{
  "mainEntityId": "user-entity-id",
  "joinConfigs": [
    {
      "relationshipId": "user-order-rel-id",
      "joinType": "LEFT"
    }
  ],
  "selectFields": [
    {
      "entityId": "user-entity-id",
      "fieldId": "user-id-field",
      "alias": "user_id"
    },
    {
      "entityId": "user-entity-id", 
      "fieldId": "user-name-field",
      "alias": "user_name"
    },
    {
      "entityId": "order-entity-id",
      "fieldId": "order-total-field",
      "alias": "order_total",
      "aggregation": "SUM"
    }
  ],
  "filterConditions": [
    {
      "entityId": "user-entity-id",
      "fieldId": "user-name-field",
      "operator": "like",
      "value": "张"
    }
  ],
  "sortConfig": [
    {
      "entityId": "order-entity-id",
      "fieldId": "order-total-field",
      "direction": "DESC"
    }
  ],
  "pagination": {
    "page": 1,
    "size": 10
  }
}
```

**生成的SQL**:
```sql
SELECT 
  users.id AS user_id,
  users.name AS user_name,
  SUM(orders.total) AS order_total
FROM users
LEFT JOIN orders ON users.id = orders.user_id
WHERE users.name LIKE '%张%'
GROUP BY users.id, users.name
ORDER BY SUM(orders.total) DESC
LIMIT 10 OFFSET 0
```

**生成的Prisma查询**:
```typescript
{
  where: { 
    name: { contains: '张', mode: 'insensitive' } 
  },
  include: { 
    orders: { 
      select: { total: true } 
    } 
  },
  orderBy: [{ orders: { total: 'desc' } }],
  skip: 0,
  take: 10
}
```

**生成的TypeScript类型**:
```typescript
export interface UserJoinResult {
  user_id: string;
  user_name: string;
  order_total: number;
}

export interface UserJoinResultListResponse {
  items: UserJoinResult[];
  total: number;
  page: number;
  size: number;
}
```

**生成的API控制器**:
```typescript
@Controller('api/v1/user-join')
export class UserJoinController {
  @Get()
  @ApiOperation({ summary: '用户关联查询' })
  async getJoinData(
    @Query('user_name') user_name?: string,
    @Query('page') page?: number,
    @Query('size') size?: number,
  ): Promise<any> {
    // 自动生成的查询逻辑
    return {
      status: 0,
      msg: 'success',
      data: {
        items: result.items,
        total: result.total,
        page: result.page,
        size: result.size,
      },
    };
  }
}
```

## API接口使用

### 1. 实体关系管理

#### 创建关系
```bash
POST /api/v1/relationships
Content-Type: application/json

{
  "projectId": "project-123",
  "name": "用户订单关系",
  "code": "user_order_rel",
  "description": "用户和订单的一对多关系",
  "config": {
    "type": "one-to-many",
    "sourceEntityId": "user-entity-id",
    "targetEntityId": "order-entity-id",
    "sourceFieldId": "user-id-field",
    "targetFieldId": "order-user-id-field",
    "foreignKeyName": "fk_order_user_id",
    "onDelete": "CASCADE",
    "onUpdate": "RESTRICT",
    "indexed": true
  },
  "userId": "user-123"
}
```

#### 获取关系列表
```bash
GET /api/v1/relationships?projectId=project-123&page=1&size=10
```

#### 验证关系配置
```bash
POST /api/v1/relationships/validate
Content-Type: application/json

{
  "projectId": "project-123",
  "config": {
    "type": "one-to-many",
    "sourceEntityId": "user-entity-id",
    "targetEntityId": "order-entity-id"
  }
}
```

### 2. 关联查询生成

#### 生成关联查询
```bash
POST /api/v1/code-generation/join-query/generate
Content-Type: application/json

{
  "projectId": "project-123",
  "config": {
    "mainEntityId": "user-entity-id",
    "joinConfigs": [...],
    "selectFields": [...],
    "filterConditions": [...],
    "sortConfig": [...],
    "pagination": {...}
  },
  "outputPath": "./generated/join-queries",
  "options": {
    "generateController": true,
    "generateService": true,
    "generateTypes": true,
    "generateDocumentation": true,
    "overwriteExisting": true
  },
  "userId": "user-123"
}
```

#### 预览关联查询
```bash
POST /api/v1/code-generation/join-query/preview
Content-Type: application/json

{
  "projectId": "project-123",
  "config": {
    "mainEntityId": "user-entity-id",
    "joinConfigs": [...],
    "selectFields": [...]
  }
}
```

#### 保存查询配置
```bash
POST /api/v1/code-generation/join-query/save
Content-Type: application/json

{
  "projectId": "project-123",
  "name": "用户订单关联查询",
  "description": "查询用户及其订单信息",
  "config": {...},
  "userId": "user-123"
}
```

#### 获取配置列表
```bash
GET /api/v1/code-generation/join-query/configs?projectId=project-123&page=1&size=10
```

#### 批量生成查询
```bash
POST /api/v1/code-generation/join-query/batch
Content-Type: application/json

{
  "projectId": "project-123",
  "configs": [
    {
      "name": "用户订单查询",
      "description": "用户和订单关联",
      "config": {...}
    },
    {
      "name": "订单商品查询", 
      "description": "订单和商品关联",
      "config": {...}
    }
  ],
  "outputPath": "./generated/join-queries",
  "options": {...},
  "userId": "user-123"
}
```

## 高级特性

### 1. 多对多关系处理
```json
{
  "type": "many-to-many",
  "joinTableConfig": {
    "tableName": "user_roles",
    "sourceColumn": "user_id",
    "targetColumn": "role_id"
  }
}
```

### 2. 聚合函数支持
```json
{
  "selectFields": [
    {
      "entityId": "order-entity-id",
      "fieldId": "total-field",
      "aggregation": "SUM",
      "alias": "total_amount"
    },
    {
      "entityId": "order-entity-id", 
      "fieldId": "id-field",
      "aggregation": "COUNT",
      "alias": "order_count"
    }
  ]
}
```

### 3. 复杂过滤条件
```json
{
  "filterConditions": [
    {
      "entityId": "user-entity-id",
      "fieldId": "status-field",
      "operator": "in",
      "value": ["active", "premium"]
    },
    {
      "entityId": "order-entity-id",
      "fieldId": "created-at-field", 
      "operator": "between",
      "value": ["2024-01-01", "2024-12-31"]
    }
  ]
}
```

## 最佳实践

1. **关系设计**: 先设计实体关系，再配置关联查询
2. **性能优化**: 合理使用索引，避免过度JOIN
3. **字段选择**: 只选择必要的字段，减少数据传输
4. **分页查询**: 大数据量时必须使用分页
5. **缓存策略**: 对频繁查询的结果进行缓存
6. **监控告警**: 监控查询性能，及时优化

## 总结

多表关联接口生成功能为低代码平台提供了强大的数据查询能力，支持：

- ✅ 四种标准关系类型
- ✅ 复杂SQL查询生成
- ✅ 类型安全的代码生成
- ✅ 完整的API接口生成
- ✅ 智能配置验证
- ✅ 批量操作支持
- ✅ 实时预览功能

这些功能大大提升了开发效率，降低了多表查询的开发复杂度。
