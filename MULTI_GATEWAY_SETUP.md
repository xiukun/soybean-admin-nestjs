# 多网关配置指南 (Multi-Gateway Setup Guide)

本文档介绍如何配置和使用多网关架构，让低代码平台功能使用3000端口服务，其他功能使用9528端口服务。

## 🏗️ 架构概述

### 服务分离架构
```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────────┐
│   Frontend      │    │   Base System    │    │  Low-code Platform  │
│   (Port 9527)   │────│   (Port 9528)    │    │    (Port 3000)      │
│                 │    │                  │    │                     │
│ - 用户界面      │    │ - 用户管理       │    │ - 项目管理          │
│ - 路由管理      │    │ - 权限控制       │    │ - 实体管理          │
│ - API代理       │    │ - 菜单管理       │    │ - 字段管理          │
└─────────────────┘    │ - 系统配置       │    │ - 关系管理          │
                       └──────────────────┘    │ - API配置           │
                                               │ - 代码生成          │
                                               └─────────────────────┘
```

### 请求路由规则

#### Base System (9528端口)
- `/auth/**` - 认证相关
- `/user/**` - 用户管理
- `/role/**` - 角色管理
- `/menu/**` - 菜单管理
- `/system/**` - 系统配置
- `/demo/**` - 演示功能

#### Low-code Platform (3000端口)
- `/projects/**` - 项目管理
- `/entities/**` - 实体管理
- `/fields/**` - 字段管理
- `/relationships/**` - 关系管理
- `/api-configs/**` - API配置
- `/templates/**` - 模板管理
- `/queries/**` - 查询管理
- `/code-generation/**` - 代码生成

## 🚀 快速启动

### 方式一：使用启动脚本（推荐）
```bash
# 启动所有服务
./start-multi-gateway.sh
```

### 方式二：手动启动
```bash
# 1. 启动Base System (9528端口)
cd backend
pnpm run start:dev:base-system

# 2. 启动Low-code Platform (3000端口)
cd lowcode-platform-backend
npm run start:dev

# 3. 启动Frontend (9527端口)
cd frontend
pnpm run dev
```

## 📁 配置文件说明

### 1. 环境配置 (.env)
```bash
# Base System服务
VITE_SERVICE_BASE_URL=http://localhost:9528/v1

# 其他服务配置
VITE_OTHER_SERVICE_BASE_URL= `{
  "demo": "http://localhost:9528/v1",
  "amisService": "https://m1.apifoxmock.com/m1/3546534-2258203-default",
  "lowcodeService": "http://localhost:3000/api"
}`
```

### 2. 网关路由配置
```typescript
// src/service/gateway/index.ts
export const ROUTE_PATTERNS = {
  baseSystem: ['/auth/**', '/user/**', '/role/**'],
  lowcodePlatform: ['/projects/**', '/entities/**', '/fields/**']
};
```

### 3. 请求实例配置
```typescript
// src/service/request/index.ts
export const request = createFlatRequest(/* Base System */);
export const lowcodeRequest = createFlatRequest(/* Low-code Platform */);
```

## 🔧 开发配置

### Vite代理配置
开发环境下，Vite会自动代理请求到对应的后端服务：

```typescript
// vite.config.ts
server: {
  proxy: {
    '/proxy-default': 'http://localhost:9528',
    '/proxy-lowcodeService': 'http://localhost:3000'
  }
}
```

### TypeScript类型定义
```typescript
// src/typings/app.d.ts
namespace Service {
  type OtherBaseURLKey = 'demo' | 'amisService' | 'lowcodeService';
}
```

## 🛠️ API使用示例

### 使用特定服务请求
```typescript
// 使用Base System服务
import { request } from '@/service/request';
const userList = await request({ url: '/user/list' });

// 使用Low-code Platform服务
import { lowcodeRequest } from '@/service/request';
const projects = await lowcodeRequest({ url: '/projects' });
```

### 使用智能路由
```typescript
// 自动路由到正确的服务
import { smartRequest } from '@/service/request/router';
const result = await smartRequest({ url: '/projects' }); // 自动路由到3000端口
```

## 📊 服务监控

### 服务状态组件
```vue
<template>
  <ServiceStatus />
</template>

<script setup>
import ServiceStatus from '@/components/common/service-status.vue';
</script>
```

### 健康检查
```typescript
import { checkServicesHealth } from '@/service/request/router';

const health = await checkServicesHealth();
// { baseSystem: true, lowcodePlatform: true }
```

## 🔍 调试和故障排除

### 1. 检查服务状态
```bash
# 检查端口占用
lsof -i :9528  # Base System
lsof -i :3000  # Low-code Platform
lsof -i :9527  # Frontend
```

### 2. 查看服务日志
```bash
# Base System日志
cd backend && pnpm run start:dev:base-system

# Low-code Platform日志
cd lowcode-platform-backend && npm run start:dev
```

### 3. 网络请求调试
开发环境下，请求头会包含调试信息：
```
X-Service-Route: lowcodePlatform
X-Is-Lowcode: true
```

## 🚦 部署配置

### Docker部署
```yaml
# docker-compose.yml
version: '3.8'
services:
  base-system:
    build: ./backend
    ports:
      - "9528:9528"
    
  lowcode-platform:
    build: ./lowcode-platform-backend
    ports:
      - "3000:3000"
    
  frontend:
    build: ./frontend
    ports:
      - "9527:9527"
```

### Nginx配置
```nginx
# nginx.conf
upstream base_system {
    server localhost:9528;
}

upstream lowcode_platform {
    server localhost:3000;
}

server {
    listen 80;
    
    # Base System API
    location /v1/ {
        proxy_pass http://base_system;
    }
    
    # Low-code Platform API
    location /api/ {
        proxy_pass http://lowcode_platform;
    }
    
    # Frontend
    location / {
        proxy_pass http://localhost:9527;
    }
}
```

## 📈 性能优化

### 1. 请求缓存
```typescript
// 为不同服务配置不同的缓存策略
const baseSystemCache = new Map();
const lowcodeCache = new Map();
```

### 2. 连接池配置
```typescript
// 为不同服务配置独立的连接池
const baseSystemAgent = new https.Agent({ keepAlive: true });
const lowcodeAgent = new https.Agent({ keepAlive: true });
```

### 3. 负载均衡
```typescript
// 支持多实例负载均衡
const lowcodeServices = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:3002'
];
```

## 🔐 安全配置

### 1. CORS配置
```typescript
// Base System CORS
app.enableCors({
  origin: ['http://localhost:9527'],
  credentials: true
});

// Low-code Platform CORS
app.enableCors({
  origin: ['http://localhost:9527'],
  credentials: true
});
```

### 2. 认证共享
```typescript
// JWT Token在两个服务间共享
const sharedSecret = process.env.JWT_SECRET;
```

## 📚 API文档

### Swagger文档地址
- Base System: http://localhost:9528/api-docs
- Low-code Platform: http://localhost:3000/api-docs

### API版本管理
- Base System: `/v1/`
- Low-code Platform: `/api/v1/`

## 🤝 贡献指南

1. 添加新的服务路由时，更新 `ROUTE_PATTERNS`
2. 新增API时，选择合适的服务端口
3. 更新类型定义和文档
4. 添加相应的测试用例

## 📞 支持

如有问题，请查看：
1. 服务日志输出
2. 网络请求调试信息
3. 健康检查结果
4. 本文档的故障排除部分
