# 企业级多租户系统开发需求与任务规划

## 项目概述

基于SoybeanAdmin NestJS项目现有架构，设计并实现企业级多租户系统，与低代码平台形成完整的企业级解决方案。主服务(backend)负责核心的多租户管理、权限控制和基础设施，低代码平台(lowcode-platform-backend)负责业务应用的快速构建和部署。

### 技术架构

- **主服务**: NestJS + Fastify + Prisma + PostgreSQL + Redis + Casbin
- **低代码平台**: NestJS + Prisma + 动态代码生成
- **前端**: Vue 3 + TypeScript + AMIS + UnoCSS
- **架构模式**: DDD + CQRS + 微服务 + 多租户
- **数据隔离**: 数据库级别 + 应用级别双重隔离

## 多租户架构设计

### 1. 租户模型设计

#### 1.1 租户层级结构
```
企业集团 (Enterprise)
├── 租户 (Tenant) - 独立的业务实体
│   ├── 组织 (Organization) - 部门/分公司
│   │   ├── 用户组 (UserGroup) - 团队/项目组
│   │   └── 用户 (User) - 最终用户
│   └── 应用空间 (AppSpace) - 低代码应用隔离
└── 共享资源 (SharedResources) - 跨租户共享
```

#### 1.2 数据模型定义

**企业集团模型**:
```typescript
interface Enterprise {
  id: string;
  code: string; // 企业唯一标识
  name: string;
  domain: string; // 主域名
  config: Json; // 企业级配置
  status: 'ACTIVE' | 'SUSPENDED' | 'INACTIVE';
  subscriptionPlan: 'BASIC' | 'PROFESSIONAL' | 'ENTERPRISE';
  maxTenants: number; // 最大租户数量
  features: string[]; // 启用的功能列表
  createdAt: Date;
  updatedAt: Date;
}
```

**租户模型**:
```typescript
interface Tenant {
  id: string;
  enterpriseId: string;
  code: string; // 租户唯一标识
  name: string;
  subdomain?: string; // 子域名
  databaseSchema: string; // 数据库Schema
  config: Json; // 租户配置
  status: 'ACTIVE' | 'SUSPENDED' | 'INACTIVE';
  subscriptionPlan: 'BASIC' | 'STANDARD' | 'PREMIUM';
  maxUsers: number;
  maxStorage: number; // MB
  features: string[];
  customDomain?: string;
  sslEnabled: boolean;
  backupEnabled: boolean;
  auditEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

**组织模型**:
```typescript
interface Organization {
  id: string;
  tenantId: string;
  parentId?: string; // 支持层级结构
  code: string;
  name: string;
  type: 'DEPARTMENT' | 'BRANCH' | 'SUBSIDIARY' | 'PROJECT';
  description?: string;
  managerId?: string; // 负责人
  config: Json;
  status: 'ACTIVE' | 'INACTIVE';
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}
```

**应用空间模型**:
```typescript
interface AppSpace {
  id: string;
  tenantId: string;
  organizationId?: string;
  code: string;
  name: string;
  description?: string;
  type: 'LOWCODE' | 'CUSTOM' | 'INTEGRATION';
  config: Json;
  resourceLimits: Json; // 资源限制
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: Date;
  updatedAt: Date;
}
```

### 2. 数据隔离策略

#### 2.1 数据库级隔离
- **Schema隔离**: 每个租户使用独立的数据库Schema
- **连接池管理**: 动态数据库连接池，支持租户级别的连接管理
- **数据备份**: 租户级别的数据备份和恢复

#### 2.2 应用级隔离
- **请求上下文**: 基于JWT Token的租户识别
- **数据过滤**: Prisma中间件自动添加租户过滤条件
- **缓存隔离**: Redis键值添加租户前缀

### 3. 权限控制模型

#### 3.1 RBAC + ABAC混合模型
```typescript
// 角色定义
interface Role {
  id: string;
  tenantId: string;
  code: string;
  name: string;
  type: 'SYSTEM' | 'TENANT' | 'CUSTOM';
  permissions: Permission[];
  attributes: Json; // ABAC属性
  isBuiltIn: boolean;
  status: 'ACTIVE' | 'INACTIVE';
}

// 权限定义
interface Permission {
  id: string;
  resource: string; // 资源标识
  action: string; // 操作类型
  conditions?: Json; // 条件表达式
  effect: 'ALLOW' | 'DENY';
}

// 用户角色关联
interface UserRole {
  id: string;
  userId: string;
  roleId: string;
  tenantId: string;
  organizationId?: string;
  scope: 'TENANT' | 'ORGANIZATION' | 'PROJECT';
  validFrom?: Date;
  validTo?: Date;
  status: 'ACTIVE' | 'INACTIVE';
}
```

#### 3.2 Casbin策略配置
```ini
# 租户级别权限模型
[request_definition]
r = sub, dom, obj, act

[policy_definition]
p = sub, dom, obj, act, eft

[role_definition]
g = _, _, _
g2 = _, _, _

[policy_effect]
e = some(where (p.eft == allow)) && !some(where (p.eft == deny))

[matchers]
m = g(r.sub, p.sub, r.dom) && r.dom == p.dom && keyMatch2(r.obj, p.obj) && regexMatch(r.act, p.act)
```

## 核心功能模块

### 1. 企业管理模块

#### 1.1 功能描述
管理企业集团的基本信息、订阅计划、功能配置和租户管理。

#### 1.2 核心接口
- `POST /api/v1/enterprises` - 创建企业
- `GET /api/v1/enterprises` - 查询企业列表
- `GET /api/v1/enterprises/:id` - 获取企业详情
- `PUT /api/v1/enterprises/:id` - 更新企业信息
- `POST /api/v1/enterprises/:id/upgrade` - 升级订阅计划
- `GET /api/v1/enterprises/:id/usage` - 获取使用统计

#### 1.3 业务逻辑
- 企业注册和认证
- 订阅计划管理
- 功能开关控制
- 使用量监控和限制

### 2. 租户管理模块

#### 2.1 功能描述
管理租户的生命周期，包括创建、配置、监控和销毁。

#### 2.2 核心接口
- `POST /api/v1/tenants` - 创建租户
- `GET /api/v1/tenants` - 查询租户列表
- `GET /api/v1/tenants/:id` - 获取租户详情
- `PUT /api/v1/tenants/:id` - 更新租户配置
- `POST /api/v1/tenants/:id/activate` - 激活租户
- `POST /api/v1/tenants/:id/suspend` - 暂停租户
- `DELETE /api/v1/tenants/:id` - 删除租户
- `POST /api/v1/tenants/:id/backup` - 备份租户数据
- `POST /api/v1/tenants/:id/restore` - 恢复租户数据

#### 2.3 业务逻辑
- 租户自动化创建流程
- 数据库Schema自动创建
- 默认角色和权限初始化
- 资源配额管理
- 数据迁移和备份

### 3. 组织架构模块

#### 3.1 功能描述
管理租户内部的组织结构，支持多层级部门和用户组管理。

#### 3.2 核心接口
- `POST /api/v1/organizations` - 创建组织
- `GET /api/v1/organizations` - 查询组织列表
- `GET /api/v1/organizations/:id` - 获取组织详情
- `PUT /api/v1/organizations/:id` - 更新组织信息
- `POST /api/v1/organizations/:id/move` - 移动组织位置
- `GET /api/v1/organizations/:id/tree` - 获取组织树
- `GET /api/v1/organizations/:id/users` - 获取组织用户

#### 3.3 业务逻辑
- 层级组织结构管理
- 组织权限继承
- 用户组织关系管理
- 组织级别的资源控制

### 4. 用户管理模块

#### 4.1 功能描述
增强现有用户管理，支持多租户用户生命周期管理。

#### 4.2 核心接口
- `POST /api/v1/users/invite` - 邀请用户
- `POST /api/v1/users/bulk-import` - 批量导入用户
- `PUT /api/v1/users/:id/transfer` - 转移用户到其他组织
- `POST /api/v1/users/:id/reset-password` - 重置密码
- `GET /api/v1/users/:id/permissions` - 获取用户权限
- `POST /api/v1/users/:id/impersonate` - 用户模拟登录

#### 4.3 业务逻辑
- 用户邀请和激活流程
- 多租户用户身份验证
- 用户权限聚合计算
- 用户行为审计

### 5. 应用空间管理模块

#### 5.1 功能描述
管理租户内的应用空间，与低代码平台集成。

#### 5.2 核心接口
- `POST /api/v1/app-spaces` - 创建应用空间
- `GET /api/v1/app-spaces` - 查询应用空间列表
- `GET /api/v1/app-spaces/:id` - 获取应用空间详情
- `PUT /api/v1/app-spaces/:id` - 更新应用空间配置
- `POST /api/v1/app-spaces/:id/deploy` - 部署应用空间
- `GET /api/v1/app-spaces/:id/metrics` - 获取应用指标

#### 5.3 业务逻辑
- 应用空间资源隔离
- 与低代码平台的集成
- 应用部署和监控
- 资源使用统计

### 6. 计费管理模块

#### 6.1 功能描述
管理订阅计划、使用量计费和账单生成。

#### 6.2 核心接口
- `GET /api/v1/billing/plans` - 获取订阅计划
- `POST /api/v1/billing/subscribe` - 订阅计划
- `GET /api/v1/billing/usage` - 获取使用量
- `GET /api/v1/billing/invoices` - 获取账单列表
- `POST /api/v1/billing/payment` - 处理支付

#### 6.3 业务逻辑
- 使用量实时监控
- 自动计费和账单生成
- 支付集成
- 欠费处理和服务暂停

### 7. 审计日志模块

#### 7.1 功能描述
增强现有日志系统，支持多租户审计和合规要求。

#### 7.2 核心接口
- `GET /api/v1/audit-logs` - 查询审计日志
- `POST /api/v1/audit-logs/export` - 导出审计日志
- `GET /api/v1/audit-logs/statistics` - 获取审计统计

#### 7.3 业务逻辑
- 多租户日志隔离
- 敏感操作审计
- 合规报告生成
- 日志保留策略

## 与低代码平台集成

### 1. 集成架构

```
┌─────────────────┐    ┌──────────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend (主服务)    │    │  Lowcode Platform│
│                 │    │                      │    │                 │
│ - 租户管理界面   │◄──►│ - 多租户管理          │◄──►│ - 业务应用生成   │
│ - 用户权限管理   │    │ - 身份认证           │    │ - 动态API生成    │
│ - 组织架构管理   │    │ - 权限控制           │    │ - 数据模型管理   │
│ - 应用空间管理   │    │ - 审计日志           │    │ - 代码生成       │
└─────────────────┘    └──────────────────────┘    └─────────────────┘
                                │                           │
                                ▼                           ▼
                       ┌─────────────────┐    ┌─────────────────────┐
                       │   PostgreSQL    │    │  Amis-Lowcode-Backend│
                       │                 │    │                     │
                       │ - 多租户数据     │    │ - 生成的业务服务     │
                       │ - Schema隔离     │    │ - 动态路由          │
                       │ - 权限数据       │    │ - 租户数据隔离      │
                       └─────────────────┘    └─────────────────────┘
```

### 2. 数据同步机制

#### 2.1 租户信息同步
- 主服务创建租户时，自动在低代码平台创建对应的项目空间
- 租户配置变更时，同步更新低代码平台的资源限制
- 租户停用时，自动停用相关的低代码应用

#### 2.2 用户权限同步
- 用户在主服务中的角色变更，自动同步到低代码平台
- 组织架构变更时，更新低代码应用的访问权限
- 统一的JWT Token，支持跨服务认证

### 3. API网关集成

```typescript
// API网关路由配置
interface ApiGatewayConfig {
  routes: {
    // 主服务路由
    '/api/v1/*': {
      target: 'http://backend:3000',
      auth: 'jwt',
      rateLimit: 'tenant-based'
    },
    // 低代码平台路由
    '/api/lowcode/*': {
      target: 'http://lowcode-platform-backend:3002',
      auth: 'jwt',
      tenantIsolation: true
    },
    // 生成的业务服务路由
    '/api/biz/*': {
      target: 'http://amis-lowcode-backend:3002',
      auth: 'jwt',
      dynamicRouting: true
    }
  }
}
```

## 技术实现要点

### 1. 多租户中间件

```typescript
@Injectable()
export class TenantMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    // 从JWT Token或子域名提取租户信息
    const tenantId = this.extractTenantId(req);
    
    // 设置请求上下文
    req['tenantContext'] = {
      tenantId,
      schema: `tenant_${tenantId}`,
      permissions: await this.getTenantPermissions(tenantId)
    };
    
    next();
  }
}
```

### 2. 动态数据库连接

```typescript
@Injectable()
export class TenantPrismaService {
  private connections = new Map<string, PrismaClient>();
  
  async getConnection(tenantId: string): Promise<PrismaClient> {
    if (!this.connections.has(tenantId)) {
      const schema = `tenant_${tenantId}`;
      const client = new PrismaClient({
        datasources: {
          db: {
            url: `${process.env.DATABASE_URL}?schema=${schema}`
          }
        }
      });
      this.connections.set(tenantId, client);
    }
    return this.connections.get(tenantId);
  }
}
```

### 3. 权限装饰器

```typescript
@SetMetadata('permissions', ['tenant:read', 'user:manage'])
export const RequirePermissions = (...permissions: string[]) => 
  SetMetadata('permissions', permissions);

@Injectable()
export class PermissionGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const requiredPermissions = this.reflector.get<string[]>(
      'permissions', 
      context.getHandler()
    );
    
    return this.checkPermissions(
      request.user,
      request.tenantContext,
      requiredPermissions
    );
  }
}
```

### 4. 资源配额管理

```typescript
@Injectable()
export class ResourceQuotaService {
  async checkQuota(tenantId: string, resource: string, amount: number): Promise<boolean> {
    const tenant = await this.getTenant(tenantId);
    const usage = await this.getResourceUsage(tenantId, resource);
    const limit = tenant.resourceLimits[resource];
    
    return usage + amount <= limit;
  }
  
  async enforceQuota(tenantId: string, resource: string, amount: number): Promise<void> {
    if (!await this.checkQuota(tenantId, resource, amount)) {
      throw new QuotaExceededException(`Resource ${resource} quota exceeded`);
    }
  }
}
```

## 部署和运维

### 1. Docker容器化

```yaml
# docker-compose.yml
version: '3.8'
services:
  # 主服务
  backend:
    build: ./backend
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql://postgres:postgres@postgres:5432/soybean_admin
      - REDIS_URL=redis://redis:6379
      - JWT_SECRET=${JWT_SECRET}
    depends_on:
      - postgres
      - redis
  
  # 低代码平台
  lowcode-platform-backend:
    build: ./lowcode-platform-backend
    ports:
      - "3002:3002"
    environment:
      - DATABASE_URL=postgresql://postgres:postgres@postgres:5432/soybean_admin
      - MAIN_SERVICE_URL=http://backend:3000
    depends_on:
      - backend
  
  # 生成的业务服务
  amis-lowcode-backend:
    build: ./amis-lowcode-backend
    ports:
      - "3002:3002"
    environment:
      - DATABASE_URL=postgresql://postgres:postgres@postgres:5432/soybean_admin
      - TENANT_ISOLATION=true
    depends_on:
      - backend
  
  # 数据库
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: soybean_admin
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./deploy/postgres:/docker-entrypoint-initdb.d
  
  # 缓存
  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data
  
  # API网关
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./deploy/nginx:/etc/nginx/conf.d
    depends_on:
      - backend
      - lowcode-platform-backend
      - amis-lowcode-backend

volumes:
  postgres_data:
  redis_data:
```

### 2. 监控和告警

```typescript
// 监控指标
interface TenantMetrics {
  activeUsers: number;
  apiCalls: number;
  storageUsage: number;
  cpuUsage: number;
  memoryUsage: number;
  errorRate: number;
  responseTime: number;
}

// 告警规则
interface AlertRule {
  metric: string;
  threshold: number;
  operator: 'gt' | 'lt' | 'eq';
  duration: number; // 持续时间(秒)
  action: 'email' | 'sms' | 'webhook';
}
```

### 3. 备份策略

- **数据库备份**: 每日全量备份 + 实时增量备份
- **租户级备份**: 支持单租户数据导出和恢复
- **配置备份**: 系统配置和租户配置的版本化管理
- **灾难恢复**: 跨区域备份和快速恢复机制

## 安全策略

### 1. 数据安全
- **传输加密**: 全站HTTPS + TLS 1.3
- **存储加密**: 数据库字段级加密
- **密钥管理**: 基于HSM的密钥轮换
- **数据脱敏**: 敏感数据自动脱敏

### 2. 访问控制
- **多因素认证**: 支持TOTP、SMS、邮箱验证
- **单点登录**: SAML 2.0 + OAuth 2.0 + OpenID Connect
- **会话管理**: JWT + Redis会话存储
- **IP白名单**: 租户级别的IP访问控制

### 3. 合规要求
- **GDPR合规**: 数据主体权利管理
- **SOC 2合规**: 安全控制框架
- **ISO 27001**: 信息安全管理体系
- **等保三级**: 国内等级保护要求

## 性能优化

### 1. 缓存策略
- **多级缓存**: L1(内存) + L2(Redis) + L3(CDN)
- **租户缓存**: 租户级别的缓存隔离
- **智能预热**: 基于使用模式的缓存预热
- **缓存一致性**: 分布式缓存一致性保证

### 2. 数据库优化
- **读写分离**: 主从复制 + 读写分离
- **分库分表**: 基于租户的水平分片
- **索引优化**: 多租户查询索引策略
- **连接池**: 租户级别的连接池管理

### 3. 应用优化
- **异步处理**: 基于消息队列的异步任务
- **负载均衡**: 基于租户的智能负载均衡
- **资源隔离**: 容器级别的资源限制
- **弹性伸缩**: 基于负载的自动扩缩容

---

本文档为企业级多租户系统的综合开发需求，后续将基于此需求制定详细的开发任务和实施计划。