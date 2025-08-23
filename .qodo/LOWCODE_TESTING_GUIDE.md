# 🚀 低代码平台功能测试指南

## 📋 目录
1. [环境准备](#环境准备)
2. [服务启动验证](#服务启动验证)
3. [项目管理功能测试](#项目管理功能测试)
4. [实体管理功能测试](#实体管理功能测试)
5. [字段管理功能测试](#字段管理功能测试)
6. [关系管理功能测试](#关系管理功能测试)
7. [API配置功能测试](#api配置功能测试)
8. [查询管理功能测试](#查询管理功能测试)
9. [代码生成功能测试](#代码生成功能测试)
10. [Amis项目代码生成](#amis项目代码生成)
11. [前端界面测试](#前端界面测试)

---

## 🛠️ 环境准备

### 1. 确保所有服务正常运行

```bash
# 检查Docker服务状态
docker ps -a

# 应该看到以下容器正在运行:
# - soybean-postgres (PostgreSQL数据库)
# - soybean-redis (Redis缓存)
```

### 2. 启动后端服务

```bash
# 启动低代码平台后端服务
cd lowcode-platform-backend
pnpm run start:dev
# 服务地址: http://localhost:3002

# 启动基础系统后端服务
cd backend
pnpm start:dev
# 服务地址: http://127.0.0.1:9528
```

### 3. 启动前端服务

```bash
# 启动前端管理界面
cd frontend
pnpm dev
# 服务地址: http://localhost:9529
```

---

## ✅ 服务启动验证

### 验证所有服务状态

```bash
# 1. 检查低代码平台后端健康状态
curl -s http://localhost:3002/api/v1/projects | jq 'length'

# 2. 检查基础系统后端
curl -s http://127.0.0.1:9528/v1/systemManage/getAllRoles | jq '.data | length'

# 3. 检查前端服务
curl -I http://localhost:9529 | head -1
```

### 访问入口

- **前端管理界面**: http://localhost:9529
- **API文档**: http://localhost:3002/api-docs
- **登录凭据**: 用户名 `Soybean`, 密码 `soybean123`

---

## 📊 项目管理功能测试

### 1. 获取所有项目列表

```bash
curl -s "http://localhost:3002/api/v1/projects" | jq .
```

### 2. 创建新项目

```bash
curl -s -X POST "http://localhost:3002/api/v1/projects" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "电商管理系统",
    "code": "ecommerce-system",
    "description": "完整的电商管理系统，包含商品、订单、用户管理",
    "version": "1.0.0",
    "config": {
      "author": "测试用户",
      "database": "postgresql",
      "language": "typescript",
      "framework": "nestjs",
      "outputPath": "./generated",
      "architecture": "ddd"
    }
  }' | jq .
```

**保存项目ID**: 记录返回的项目ID，后续测试会用到

### 3. 更新项目信息

```bash
# 使用上一步返回的项目ID
PROJECT_ID="YOUR_PROJECT_ID"

curl -s -X PUT "http://localhost:3002/api/v1/projects/$PROJECT_ID" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "电商管理系统（增强版）",
    "description": "增强版电商管理系统，新增库存管理和报表功能",
    "version": "1.1.0"
  }' | jq .
```

### 4. 查看项目统计

```bash
curl -s "http://localhost:3002/api/v1/projects/stats" | jq .
```

---

## 🏗️ 实体管理功能测试

### 1. 创建用户实体

```bash
curl -s -X POST "http://localhost:3002/api/v1/entities/enhanced" \
  -H "Content-Type: application/json" \
  -d '{
    "projectId": "'$PROJECT_ID'",
    "name": "用户",
    "code": "User",
    "tableName": "users",
    "description": "系统用户实体",
    "category": "用户管理",
    "config": {
      "icon": "user",
      "color": "#1890ff",
      "displayName": "用户"
    },
    "fields": [
      {
        "name": "用户名",
        "code": "username",
        "type": "STRING",
        "length": 50,
        "nullable": false,
        "uniqueConstraint": true,
        "description": "用户登录名",
        "sortOrder": 10
      },
      {
        "name": "邮箱",
        "code": "email",
        "type": "STRING",
        "length": 100,
        "nullable": false,
        "uniqueConstraint": true,
        "description": "用户邮箱地址",
        "sortOrder": 11
      },
      {
        "name": "手机号",
        "code": "phone",
        "type": "STRING",
        "length": 20,
        "nullable": true,
        "description": "手机号码",
        "sortOrder": 12
      }
    ]
  }' | jq .entity.id
```

**保存用户实体ID**: `USER_ENTITY_ID`

### 2. 创建商品实体

```bash
curl -s -X POST "http://localhost:3002/api/v1/entities/enhanced" \
  -H "Content-Type: application/json" \
  -d '{
    "projectId": "'$PROJECT_ID'",
    "name": "商品",
    "code": "Product",
    "tableName": "products",
    "description": "商品信息实体",
    "category": "商品管理",
    "config": {
      "icon": "shopping",
      "color": "#52c41a",
      "displayName": "商品"
    },
    "fields": [
      {
        "name": "商品名称",
        "code": "name",
        "type": "STRING",
        "length": 200,
        "nullable": false,
        "description": "商品完整名称",
        "sortOrder": 10
      },
      {
        "name": "商品编码",
        "code": "sku",
        "type": "STRING",
        "length": 50,
        "nullable": false,
        "uniqueConstraint": true,
        "description": "商品SKU编码",
        "sortOrder": 11
      },
      {
        "name": "价格",
        "code": "price",
        "type": "DECIMAL",
        "precision": 10,
        "scale": 2,
        "nullable": false,
        "defaultValue": "0.00",
        "description": "商品价格",
        "sortOrder": 12
      },
      {
        "name": "库存数量",
        "code": "stock",
        "type": "INTEGER",
        "nullable": false,
        "defaultValue": "0",
        "description": "当前库存",
        "sortOrder": 13
      },
      {
        "name": "商品描述",
        "code": "description",
        "type": "TEXT",
        "nullable": true,
        "description": "商品详细描述",
        "sortOrder": 14
      },
      {
        "name": "状态",
        "code": "status",
        "type": "STRING",
        "length": 20,
        "nullable": false,
        "defaultValue": "ACTIVE",
        "description": "商品状态",
        "sortOrder": 15
      }
    ]
  }' | jq .entity.id
```

**保存商品实体ID**: `PRODUCT_ENTITY_ID`

### 3. 创建订单实体

```bash
curl -s -X POST "http://localhost:3002/api/v1/entities/enhanced" \
  -H "Content-Type: application/json" \
  -d '{
    "projectId": "'$PROJECT_ID'",
    "name": "订单",
    "code": "Order",
    "tableName": "orders",
    "description": "订单信息实体",
    "category": "订单管理",
    "config": {
      "icon": "file-text",
      "color": "#fa8c16",
      "displayName": "订单"
    },
    "fields": [
      {
        "name": "订单号",
        "code": "orderNumber",
        "type": "STRING",
        "length": 50,
        "nullable": false,
        "uniqueConstraint": true,
        "description": "唯一订单编号",
        "sortOrder": 10
      },
      {
        "name": "订单状态",
        "code": "status",
        "type": "STRING",
        "length": 20,
        "nullable": false,
        "defaultValue": "PENDING",
        "description": "订单状态",
        "sortOrder": 11
      },
      {
        "name": "总金额",
        "code": "totalAmount",
        "type": "DECIMAL",
        "precision": 12,
        "scale": 2,
        "nullable": false,
        "defaultValue": "0.00",
        "description": "订单总金额",
        "sortOrder": 12
      },
      {
        "name": "订单时间",
        "code": "orderTime",
        "type": "DATETIME",
        "nullable": false,
        "defaultValue": "now()",
        "description": "下单时间",
        "sortOrder": 13
      },
      {
        "name": "备注",
        "code": "notes",
        "type": "TEXT",
        "nullable": true,
        "description": "订单备注",
        "sortOrder": 14
      }
    ]
  }' | jq .entity.id
```

**保存订单实体ID**: `ORDER_ENTITY_ID`

### 4. 创建订单项实体

```bash
curl -s -X POST "http://localhost:3002/api/v1/entities/enhanced" \
  -H "Content-Type: application/json" \
  -d '{
    "projectId": "'$PROJECT_ID'",
    "name": "订单项",
    "code": "OrderItem",
    "tableName": "order_items",
    "description": "订单明细项实体",
    "category": "订单管理",
    "config": {
      "icon": "shopping-cart",
      "color": "#722ed1",
      "displayName": "订单项"
    },
    "fields": [
      {
        "name": "数量",
        "code": "quantity",
        "type": "INTEGER",
        "nullable": false,
        "defaultValue": "1",
        "description": "购买数量",
        "sortOrder": 10
      },
      {
        "name": "单价",
        "code": "unitPrice",
        "type": "DECIMAL",
        "precision": 10,
        "scale": 2,
        "nullable": false,
        "defaultValue": "0.00",
        "description": "商品单价",
        "sortOrder": 11
      },
      {
        "name": "小计",
        "code": "subtotal",
        "type": "DECIMAL",
        "precision": 12,
        "scale": 2,
        "nullable": false,
        "defaultValue": "0.00",
        "description": "订单项小计",
        "sortOrder": 12
      }
    ]
  }' | jq .entity.id
```

**保存订单项实体ID**: `ORDER_ITEM_ENTITY_ID`

### 5. 查看项目实体列表

```bash
curl -s "http://localhost:3002/api/v1/entities/project/$PROJECT_ID" | jq .
```

---

## 🔗 字段管理功能测试

### 1. 为商品实体添加分类字段

```bash
curl -s -X POST "http://localhost:3002/api/v1/fields" \
  -H "Content-Type: application/json" \
  -d '{
    "entityId": "'$PRODUCT_ENTITY_ID'",
    "name": "商品分类",
    "code": "category",
    "dataType": "STRING",
    "description": "商品所属分类",
    "length": 50,
    "required": true,
    "unique": false,
    "defaultValue": "其他",
    "displayOrder": 16
  }' | jq .
```

### 2. 更新字段信息

```bash
# 获取刚创建的字段ID
FIELD_ID="YOUR_FIELD_ID"

curl -s -X PUT "http://localhost:3002/api/v1/fields/$FIELD_ID" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "商品分类（更新）",
    "description": "商品分类信息（已更新）",
    "length": 100,
    "required": true,
    "unique": false,
    "displayOrder": 16
  }' | jq .
```

### 3. 查看实体的所有字段

```bash
curl -s "http://localhost:3002/api/v1/fields/entity/$PRODUCT_ENTITY_ID" | jq .
```

---

## 🔗 关系管理功能测试

### 1. 创建用户-订单关系（一对多）

```bash
curl -s -X POST "http://localhost:3002/api/v1/relationships" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "用户拥有订单",
    "sourceEntityId": "'$USER_ENTITY_ID'",
    "targetEntityId": "'$ORDER_ENTITY_ID'",
    "relationType": "ONE_TO_MANY",
    "sourceFieldName": "orders",
    "targetFieldName": "user",
    "config": {
      "onDelete": "CASCADE",
      "onUpdate": "CASCADE",
      "description": "一个用户可以有多个订单"
    }
  }' | jq .
```

### 2. 创建订单-订单项关系（一对多）

```bash
curl -s -X POST "http://localhost:3002/api/v1/relationships" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "订单包含订单项",
    "sourceEntityId": "'$ORDER_ENTITY_ID'",
    "targetEntityId": "'$ORDER_ITEM_ENTITY_ID'",
    "relationType": "ONE_TO_MANY",
    "sourceFieldName": "orderItems",
    "targetFieldName": "order",
    "config": {
      "onDelete": "CASCADE",
      "onUpdate": "CASCADE",
      "description": "一个订单包含多个订单项"
    }
  }' | jq .
```

### 3. 创建商品-订单项关系（一对多）

```bash
curl -s -X POST "http://localhost:3002/api/v1/relationships" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "商品关联订单项",
    "sourceEntityId": "'$PRODUCT_ENTITY_ID'",
    "targetEntityId": "'$ORDER_ITEM_ENTITY_ID'",
    "relationType": "ONE_TO_MANY",
    "sourceFieldName": "orderItems",
    "targetFieldName": "product",
    "config": {
      "onDelete": "RESTRICT",
      "onUpdate": "CASCADE",
      "description": "一个商品可以关联多个订单项"
    }
  }' | jq .
```

---

## ⚙️ API配置功能测试

### 1. 创建商品查询API

```bash
curl -s -X POST "http://localhost:3002/api/v1/api-configs" \
  -H "Content-Type: application/json" \
  -d '{
    "projectId": "'$PROJECT_ID'",
    "entityId": "'$PRODUCT_ENTITY_ID'",
    "name": "商品列表查询API",
    "code": "product-list-api",
    "method": "GET",
    "path": "/api/products",
    "description": "分页查询商品列表",
    "config": {
      "pagination": true,
      "sorting": true,
      "filtering": true,
      "authentication": true,
      "responseFields": ["id", "name", "sku", "price", "stock", "status"]
    }
  }' | jq .
```

### 2. 创建商品详情API

```bash
curl -s -X POST "http://localhost:3002/api/v1/api-configs" \
  -H "Content-Type: application/json" \
  -d '{
    "projectId": "'$PROJECT_ID'",
    "entityId": "'$PRODUCT_ENTITY_ID'",
    "name": "商品详情查询API",
    "code": "product-detail-api",
    "method": "GET",
    "path": "/api/products/{id}",
    "description": "根据ID查询商品详情",
    "config": {
      "authentication": true,
      "pathParams": ["id"],
      "responseFields": ["id", "name", "sku", "price", "stock", "description", "status"]
    }
  }' | jq .
```

### 3. 创建商品创建API

```bash
curl -s -X POST "http://localhost:3002/api/v1/api-configs" \
  -H "Content-Type: application/json" \
  -d '{
    "projectId": "'$PROJECT_ID'",
    "entityId": "'$PRODUCT_ENTITY_ID'",
    "name": "商品创建API",
    "code": "product-create-api",
    "method": "POST",
    "path": "/api/products",
    "description": "创建新商品",
    "config": {
      "authentication": true,
      "validation": true,
      "requestFields": ["name", "sku", "price", "stock", "description", "category"],
      "responseFields": ["id", "name", "sku", "price", "stock", "status", "createdAt"]
    }
  }' | jq .
```

---

## 🔍 查询管理功能测试

### 1. 创建商品价格查询

```bash
curl -s -X POST "http://localhost:3002/api/v1/queries" \
  -H "Content-Type: application/json" \
  -d '{
    "projectId": "'$PROJECT_ID'",
    "entityId": "'$PRODUCT_ENTITY_ID'",
    "name": "商品价格范围查询",
    "description": "查询指定价格范围内的商品",
    "config": {
      "fields": [
        {"field": "id", "alias": "productId"},
        {"field": "name", "alias": "productName"},
        {"field": "sku", "alias": "productSku"},
        {"field": "price", "alias": "productPrice"},
        {"field": "stock", "alias": "stockCount"},
        {"field": "status", "alias": "productStatus"}
      ],
      "filters": [
        {
          "field": "price",
          "operator": "BETWEEN",
          "value": "10,1000",
          "condition": "AND"
        },
        {
          "field": "status",
          "operator": "EQUALS",
          "value": "ACTIVE",
          "condition": "AND"
        }
      ],
      "orderBy": [
        {"field": "price", "direction": "ASC"},
        {"field": "name", "direction": "ASC"}
      ],
      "pagination": {
        "page": 1,
        "size": 20
      }
    }
  }' | jq .
```

### 2. 创建订单统计查询

```bash
curl -s -X POST "http://localhost:3002/api/v1/queries" \
  -H "Content-Type: application/json" \
  -d '{
    "projectId": "'$PROJECT_ID'",
    "entityId": "'$ORDER_ENTITY_ID'",
    "name": "订单统计查询",
    "description": "按状态统计订单数量和金额",
    "config": {
      "fields": [
        {"field": "status", "alias": "orderStatus"},
        {"field": "COUNT(*)", "alias": "orderCount", "aggregation": "COUNT"},
        {"field": "SUM(totalAmount)", "alias": "totalAmount", "aggregation": "SUM"},
        {"field": "AVG(totalAmount)", "alias": "avgAmount", "aggregation": "AVG"}
      ],
      "groupBy": ["status"],
      "orderBy": [
        {"field": "orderCount", "direction": "DESC"}
      ]
    }
  }' | jq .
```

---

## 🎯 代码生成功能测试

### 1. 获取项目配置

```bash
curl -s "http://localhost:3002/api/v1/code-generation/config/projects/$PROJECT_ID" | jq .
```

### 2. 获取可用模板

```bash
curl -s "http://localhost:3002/api/v1/code-generation/templates" | jq .
```

### 3. 获取项目实体用于代码生成

```bash
curl -s "http://localhost:3002/api/v1/code-generation/dual-layer/entities/$PROJECT_ID" | jq .
```

### 4. 验证代码生成配置

```bash
curl -s -X POST "http://localhost:3002/api/v1/code-generation/dual-layer/validate" \
  -H "Content-Type: application/json" \
  -d '{
    "projectId": "'$PROJECT_ID'",
    "entities": ["'$USER_ENTITY_ID'", "'$PRODUCT_ENTITY_ID'", "'$ORDER_ENTITY_ID'", "'$ORDER_ITEM_ENTITY_ID'"],
    "config": {
      "framework": "nestjs",
      "language": "typescript",
      "architecture": "ddd",
      "outputPath": "./generated-code",
      "includeTests": true,
      "includeDocumentation": true
    }
  }' | jq .
```

### 5. 执行代码生成

```bash
curl -s -X POST "http://localhost:3002/api/v1/code-generation/dual-layer/generate" \
  -H "Content-Type: application/json" \
  -d '{
    "projectId": "'$PROJECT_ID'",
    "entities": ["'$USER_ENTITY_ID'", "'$PRODUCT_ENTITY_ID'", "'$ORDER_ENTITY_ID'", "'$ORDER_ITEM_ENTITY_ID'"],
    "config": {
      "framework": "nestjs",
      "language": "typescript",
      "architecture": "ddd",
      "outputPath": "./generated-code",
      "includeTests": true,
      "includeDocumentation": true,
      "generateApi": true,
      "generateService": true,
      "generateRepository": true,
      "generateDto": true,
      "generateEntity": true
    }
  }' | jq .taskId
```

**保存任务ID**: `TASK_ID`

### 6. 查看代码生成状态

```bash
curl -s "http://localhost:3002/api/v1/code-generation/dual-layer/status/$TASK_ID" | jq .
```

---

## 🎨 Amis项目代码生成

### 1. 为Amis后端项目创建专门的项目

```bash
curl -s -X POST "http://localhost:3002/api/v1/projects" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Amis低代码后端",
    "code": "amis-lowcode-backend",
    "description": "专门为Amis前端提供API的NestJS后端项目",
    "version": "1.0.0",
    "config": {
      "author": "低代码平台",
      "database": "postgresql",
      "language": "typescript",
      "framework": "nestjs",
      "outputPath": "./amis-generated",
      "architecture": "clean",
      "apiPrefix": "/api/amis",
      "enableSwagger": true,
      "enableValidation": true
    }
  }' | jq .id
```

**保存Amis项目ID**: `AMIS_PROJECT_ID`

### 2. 为Amis项目创建业务实体

#### 创建文章实体

```bash
curl -s -X POST "http://localhost:3002/api/v1/entities/enhanced" \
  -H "Content-Type: application/json" \
  -d '{
    "projectId": "'$AMIS_PROJECT_ID'",
    "name": "文章",
    "code": "Article",
    "tableName": "amis_articles",
    "description": "文章管理实体",
    "category": "内容管理",
    "config": {
      "icon": "file-text",
      "color": "#1890ff",
      "displayName": "文章"
    },
    "fields": [
      {
        "name": "标题",
        "code": "title",
        "type": "STRING",
        "length": 200,
        "nullable": false,
        "description": "文章标题",
        "sortOrder": 10
      },
      {
        "name": "内容",
        "code": "content",
        "type": "TEXT",
        "nullable": false,
        "description": "文章内容",
        "sortOrder": 11
      },
      {
        "name": "摘要",
        "code": "summary",
        "type": "STRING",
        "length": 500,
        "nullable": true,
        "description": "文章摘要",
        "sortOrder": 12
      },
      {
        "name": "状态",
        "code": "status",
        "type": "STRING",
        "length": 20,
        "nullable": false,
        "defaultValue": "DRAFT",
        "description": "文章状态",
        "sortOrder": 13
      },
      {
        "name": "发布时间",
        "code": "publishTime",
        "type": "DATETIME",
        "nullable": true,
        "description": "文章发布时间",
        "sortOrder": 14
      },
      {
        "name": "浏览量",
        "code": "viewCount",
        "type": "INTEGER",
        "nullable": false,
        "defaultValue": "0",
        "description": "文章浏览量",
        "sortOrder": 15
      }
    ]
  }' | jq .entity.id
```

#### 创建分类实体

```bash
curl -s -X POST "http://localhost:3002/api/v1/entities/enhanced" \
  -H "Content-Type: application/json" \
  -d '{
    "projectId": "'$AMIS_PROJECT_ID'",
    "name": "分类",
    "code": "Category",
    "tableName": "amis_categories",
    "description": "文章分类实体",
    "category": "内容管理",
    "config": {
      "icon": "folder",
      "color": "#52c41a",
      "displayName": "分类"
    },
    "fields": [
      {
        "name": "分类名称",
        "code": "name",
        "type": "STRING",
        "length": 100,
        "nullable": false,
        "uniqueConstraint": true,
        "description": "分类名称",
        "sortOrder": 10
      },
      {
        "name": "描述",
        "code": "description",
        "type": "TEXT",
        "nullable": true,
        "description": "分类描述",
        "sortOrder": 11
      },
      {
        "name": "排序",
        "code": "sortOrder",
        "type": "INTEGER",
        "nullable": false,
        "defaultValue": "0",
        "description": "排序权重",
        "sortOrder": 12
      }
    ]
  }' | jq .entity.id
```

### 3. 专门为Amis生成NestJS代码

```bash
curl -s -X POST "http://localhost:3002/api/v1/code-generation/dual-layer/generate" \
  -H "Content-Type: application/json" \
  -d '{
    "projectId": "'$AMIS_PROJECT_ID'",
    "entities": ["'$ARTICLE_ENTITY_ID'", "'$CATEGORY_ENTITY_ID'"],
    "config": {
      "framework": "nestjs",
      "language": "typescript",
      "architecture": "clean",
      "outputPath": "./amis-lowcode-backend/src/generated",
      "includeTests": true,
      "includeDocumentation": true,
      "generateApi": true,
      "generateService": true,
      "generateRepository": true,
      "generateDto": true,
      "generateEntity": true,
      "apiPrefix": "/api/amis",
      "enablePagination": true,
      "enableFiltering": true,
      "enableSorting": true,
      "enableValidation": true,
      "generateSwagger": true,
      "prismaIntegration": true,
      "authenticationRequired": false
    }
  }' | jq .taskId
```

### 4. 监控Amis代码生成进度

```bash
# 保存返回的任务ID
AMIS_TASK_ID="YOUR_AMIS_TASK_ID"

# 查看生成进度
while true; do
  STATUS=$(curl -s "http://localhost:3002/api/v1/code-generation/dual-layer/status/$AMIS_TASK_ID" | jq -r .status)
  echo "代码生成状态: $STATUS"
  if [ "$STATUS" = "COMPLETED" ] || [ "$STATUS" = "FAILED" ]; then
    break
  fi
  sleep 2
done

# 查看详细结果
curl -s "http://localhost:3002/api/v1/code-generation/dual-layer/status/$AMIS_TASK_ID" | jq .
```

### 5. 验证生成的代码

```bash
# 查看生成的文件结构
find ./amis-lowcode-backend/src/generated -type f -name "*.ts" | head -20

# 检查生成的API控制器
ls -la ./amis-lowcode-backend/src/generated/controllers/

# 检查生成的服务类
ls -la ./amis-lowcode-backend/src/generated/services/

# 检查生成的DTO类
ls -la ./amis-lowcode-backend/src/generated/dto/
```

---

## 🖥️ 前端界面测试

### 1. 登录系统

1. 访问 http://localhost:9529
2. 使用凭据登录：
   - 用户名: `Soybean`
   - 密码: `soybean123`

### 2. 访问低代码平台

1. 在左侧菜单中找到"低代码平台"菜单
2. 点击"项目管理"查看所有项目
3. 选择刚创建的项目进行管理

### 3. 测试实体管理界面

1. 点击"实体管理"菜单
2. 查看创建的实体列表
3. 点击实体进入详情页面
4. 测试字段编辑功能

### 4. 测试关系图

1. 点击"关系管理"菜单
2. 查看实体关系图
3. 验证创建的关系连线

### 5. 测试API配置

1. 点击"API配置"菜单
2. 查看配置的API列表
3. 测试API预览功能

---

## 🔧 故障排除

### 常见问题

1. **服务无法启动**
   ```bash
   # 检查端口占用
   lsof -i :3002
   lsof -i :9528
   lsof -i :9529
   
   # 停止占用进程
   kill <PID>
   ```

2. **数据库连接失败**
   ```bash
   # 检查数据库状态
   docker ps | grep postgres
   
   # 重启数据库
   docker restart soybean-postgres
   ```

3. **API调用失败**
   ```bash
   # 检查服务健康状态
   curl -s http://localhost:3002/api/v1/projects | jq 'length'
   ```

### 性能监控

```bash
# 查看服务资源使用
docker stats

# 查看API响应时间
time curl -s http://localhost:3002/api/v1/projects > /dev/null
```

---

## 📝 测试检查清单

- [ ] 所有服务正常启动
- [ ] 数据库连接正常
- [ ] 项目CRUD功能正常
- [ ] 实体CRUD功能正常
- [ ] 字段管理功能正常
- [ ] 关系创建功能正常
- [ ] API配置功能正常
- [ ] 查询配置功能正常
- [ ] 代码生成功能正常
- [ ] Amis项目代码生成成功
- [ ] 前端界面访问正常
- [ ] 低代码平台菜单可用

---

## 🎯 下一步计划

1. **扩展实体模型**: 添加更多业务实体
2. **完善API配置**: 配置更多API接口
3. **优化代码生成**: 测试不同架构模式
4. **集成测试**: 测试生成代码的运行效果
5. **性能测试**: 验证平台在大量数据下的表现

---

> 💡 **提示**: 建议按照本指南的顺序逐步执行测试，每完成一个模块后验证功能正常再进入下一个模块。如遇到问题，请参考故障排除部分或查看服务日志。