# 微服务架构完整指南

## 🏗️ **系统架构概览**

本低代码平台采用微服务架构，包含以下5个核心服务：

```
┌─────────────────────────────────────────────────────────────────┐
│                    低代码平台微服务架构                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────┐    ┌──────────────────┐    ┌─────────────────┐ │
│  │   Frontend  │    │     Backend      │    │ Lowcode Designer│ │
│  │   (3200)    │◄──►│     (3000)       │◄──►│     (3300)      │ │
│  │  Vue.js UI  │    │  Main Service    │    │ Visual Designer │ │
│  └─────────────┘    └──────────────────┘    └─────────────────┘ │
│         │                     │                       │         │
│         │                     │                       │         │
│         ▼                     ▼                       ▼         │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │            Lowcode Platform Backend (3100)                 │ │
│  │                 核心代码生成服务                            │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                              │                                   │
│                              ▼                                   │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │            Amis Lowcode Backend (3200)                     │ │
│  │                生成的业务API服务                            │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## 🎯 **服务详细说明**

### 1. **Backend (主服务) - Port 3000**
- **职责**: 用户认证、权限管理、系统配置
- **技术栈**: NestJS + PostgreSQL + Prisma
- **核心功能**:
  - 用户登录认证
  - 角色权限管理
  - 系统配置管理
  - 菜单路由管理

### 2. **Lowcode Platform Backend (低代码平台服务) - Port 3100**
- **职责**: 实体管理、代码生成、模板管理
- **技术栈**: NestJS + PostgreSQL + Prisma + Handlebars
- **核心功能**:
  - 实体和字段管理
  - 关系管理
  - 代码模板管理
  - 代码生成引擎
  - 微服务通信协调

### 3. **Amis Lowcode Backend (生成的业务服务) - Port 3200**
- **职责**: 动态生成的业务API服务
- **技术栈**: NestJS + PostgreSQL + Prisma (动态生成)
- **核心功能**:
  - 动态CRUD API
  - Amis兼容响应格式
  - 自动生成的业务逻辑
  - 热重载支持

### 4. **Lowcode Designer (可视化设计器) - Port 3300**
- **职责**: 可视化实体设计、关系设计
- **技术栈**: Vue.js + Canvas/SVG
- **核心功能**:
  - 拖拽式实体设计
  - 可视化关系建模
  - 实时预览
  - 设计数据同步

### 5. **Frontend (前端应用) - Port 3400**
- **职责**: 用户界面、管理控制台
- **技术栈**: Vue.js + Naive UI + Amis
- **核心功能**:
  - 管理界面
  - 代码生成控制台
  - 实体管理界面
  - 系统监控面板

## 🔄 **服务间通信机制**

### 通信协议
- **HTTP/REST**: 主要通信协议
- **WebSocket**: 实时状态更新
- **消息队列**: 异步任务处理

### 统一通信接口
```typescript
// 服务注册表
interface ServiceEndpoint {
  name: string;
  url: string;
  version: string;
  status: 'healthy' | 'unhealthy' | 'unknown';
  capabilities: string[];
}

// 统一请求格式
interface ServiceRequest {
  service: string;
  endpoint: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  data?: any;
  headers?: Record<string, string>;
}

// 统一响应格式
interface ServiceResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  status: number;
  duration: number;
}
```

### 链路追踪
- **Trace ID**: 全链路请求追踪
- **Request ID**: 单次请求标识
- **Context传递**: 跨服务上下文传递

## 📊 **数据同步机制**

### 1. **实时同步**
```typescript
// 实体变更同步
POST /api/sync/entity
{
  "entity": EntityData,
  "operation": "create" | "update" | "delete",
  "timestamp": "2024-01-01T00:00:00Z"
}
```

### 2. **批量同步**
```typescript
// 批量数据同步
POST /api/sync/batch
{
  "entities": EntityData[],
  "relationships": RelationshipData[],
  "syncTimestamp": "2024-01-01T00:00:00Z"
}
```

### 3. **增量同步**
- 基于时间戳的增量更新
- 变更日志记录
- 冲突检测和解决

## 🛡️ **服务健康监控**

### 健康检查端点
```typescript
// 各服务统一健康检查
GET /health
{
  "status": "healthy" | "unhealthy" | "degraded",
  "timestamp": "2024-01-01T00:00:00Z",
  "uptime": 123456,
  "services": {
    "database": { "status": "healthy", "responseTime": 50 },
    "codeGeneration": { "status": "healthy", "responseTime": 100 }
  }
}
```

### 监控指标
- **响应时间**: 服务响应延迟
- **错误率**: 请求失败比例
- **吞吐量**: 每秒处理请求数
- **资源使用**: CPU、内存、磁盘使用率

## 🚀 **部署架构**

### Docker Compose 部署
```yaml
version: '3.8'
services:
  backend:
    build: ./backend
    ports: ["3000:3000"]
    environment:
      - DATABASE_URL=postgresql://...
      
  lowcode-platform-backend:
    build: ./lowcode-platform-backend
    ports: ["3100:3100"]
    depends_on: [backend]
    
  amis-lowcode-backend:
    build: ./amis-lowcode-backend
    ports: ["3200:3200"]
    depends_on: [lowcode-platform-backend]
    
  lowcode-designer:
    build: ./lowcode-designer
    ports: ["3300:3300"]
    
  frontend:
    build: ./frontend
    ports: ["3400:3400"]
    depends_on: [backend, lowcode-platform-backend]
```

### Kubernetes 部署
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: lowcode-platform
spec:
  replicas: 3
  selector:
    matchLabels:
      app: lowcode-platform
  template:
    spec:
      containers:
      - name: backend
        image: lowcode/backend:latest
        ports: [containerPort: 3000]
      - name: lowcode-platform
        image: lowcode/platform:latest
        ports: [containerPort: 3100]
```

## 🔧 **开发环境配置**

### 环境变量配置
```bash
# Backend Service
DATABASE_URL=postgresql://user:pass@localhost:5432/backend_db
JWT_SECRET=your-jwt-secret
REDIS_URL=redis://localhost:6379

# Lowcode Platform Backend
LOWCODE_DATABASE_URL=postgresql://user:pass@localhost:5432/lowcode_db
BACKEND_URL=http://localhost:3000
AMIS_BACKEND_URL=http://localhost:3200
DESIGNER_URL=http://localhost:3300

# Amis Lowcode Backend
AMIS_DATABASE_URL=postgresql://user:pass@localhost:5432/amis_db
LOWCODE_PLATFORM_URL=http://localhost:3100

# Frontend
VITE_API_URL=http://localhost:3000
VITE_LOWCODE_API_URL=http://localhost:3100
VITE_AMIS_API_URL=http://localhost:3200
```

### 启动顺序
1. **数据库服务**: PostgreSQL, Redis
2. **Backend**: 主服务 (3000)
3. **Lowcode Platform Backend**: 低代码平台 (3100)
4. **Amis Lowcode Backend**: 生成的服务 (3200)
5. **Lowcode Designer**: 设计器 (3300)
6. **Frontend**: 前端应用 (3400)

## 📈 **性能优化**

### 缓存策略
- **Redis缓存**: 热点数据缓存
- **内存缓存**: 模板和配置缓存
- **CDN缓存**: 静态资源缓存

### 负载均衡
- **Nginx**: 反向代理和负载均衡
- **服务发现**: 动态服务注册和发现
- **健康检查**: 自动故障转移

### 数据库优化
- **连接池**: 数据库连接复用
- **索引优化**: 查询性能优化
- **读写分离**: 主从数据库架构

## 🧪 **测试策略**

### 测试层级
1. **单元测试**: 各服务内部逻辑测试
2. **集成测试**: 服务间接口测试
3. **E2E测试**: 完整业务流程测试
4. **性能测试**: 负载和压力测试

### 测试覆盖率要求
- **单元测试**: ≥ 80%
- **集成测试**: ≥ 70%
- **E2E测试**: 核心流程 100%

## 🔒 **安全机制**

### 认证授权
- **JWT Token**: 无状态认证
- **RBAC**: 基于角色的访问控制
- **API Gateway**: 统一认证入口

### 数据安全
- **数据加密**: 敏感数据加密存储
- **传输加密**: HTTPS/TLS通信
- **访问日志**: 完整的访问审计

## 📚 **API文档**

### Swagger文档
- 各服务提供完整的API文档
- 统一的错误码和响应格式
- 交互式API测试界面

### 接口版本管理
- **语义化版本**: v1.0.0格式
- **向后兼容**: 渐进式升级
- **废弃通知**: 提前通知接口变更

## 🎉 **总结**

这个微服务架构提供了：

✅ **高可扩展性**: 各服务独立部署和扩展
✅ **高可用性**: 服务故障隔离和自动恢复
✅ **开发效率**: 团队并行开发和独立发布
✅ **技术灵活性**: 各服务可选择最适合的技术栈
✅ **运维友好**: 完善的监控、日志和部署机制

通过这个架构，我们实现了一个完整、稳定、高效的低代码平台，能够支持企业级的业务需求和快速迭代开发。
