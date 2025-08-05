# 综合开发路线图 - 低代码平台 + 企业级多租户系统

## 项目概述

本项目旨在构建一个完整的企业级低代码平台生态系统，包含两个核心组成部分：

1. **低代码平台服务** (`lowcode-platform-backend` + `amis-lowcode-backend`)
   - 提供可视化开发能力
   - 支持动态表单、页面生成
   - 代码生成和模板管理

2. **企业级多租户主服务** (`backend/apps/base-system`)
   - 提供企业级多租户架构
   - 统一身份认证和权限管理
   - 与低代码平台深度集成

## 技术架构总览

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (Vue 3 + AMIS)                 │
├─────────────────────────────────────────────────────────────┤
│                    API Gateway / Load Balancer             │
├─────────────────────┬───────────────────────────────────────┤
│  Enterprise Backend │         Lowcode Platform             │
│  (Multi-tenant)     │                                       │
│  ┌─────────────────┐│  ┌─────────────────┐ ┌──────────────┐ │
│  │ Base System     ││  │ Platform Backend│ │ AMIS Backend │ │
│  │ - IAM           ││  │ - Entity Mgmt   │ │ - Page Render│ │
│  │ - Tenant Mgmt   ││  │ - Code Gen      │ │ - Form Build │ │
│  │ - Org Structure ││  │ - Template Mgmt │ │ - Component  │ │
│  │ - Billing       ││  │ - API Config    │ │   Library    │ │
│  └─────────────────┘│  └─────────────────┘ └──────────────┘ │
├─────────────────────┴───────────────────────────────────────┤
│                    Shared Infrastructure                    │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐           │
│  │ PostgreSQL  │ │    Redis    │ │   Docker    │           │
│  │ (Multi-DB)  │ │   (Cache)   │ │ (Container) │           │
│  └─────────────┘ └─────────────┘ └─────────────┘           │
└─────────────────────────────────────────────────────────────┘
```

## 开发阶段规划

### 第一阶段：基础设施完善 (4周)

#### 目标
- 完善低代码平台核心功能
- 建立企业级多租户基础架构
- 实现基础的集成机制

#### 主要任务

**低代码平台优化** (2周)
- [ ] 完善实体管理功能
- [ ] 优化代码生成器
- [ ] 增强模板管理
- [ ] 改进API配置功能
- [ ] 优化前端页面性能

**多租户基础架构** (2周)
- [ ] 设计多租户数据模型
- [ ] 开发租户识别中间件
- [ ] 实现动态数据库连接
- [ ] 建立权限控制框架
- [ ] 创建基础服务层

#### 交付物
- 优化后的低代码平台
- 多租户基础架构
- 集成接口规范
- 技术文档

### 第二阶段：核心功能开发 (6周)

#### 目标
- 实现完整的企业级多租户功能
- 建立低代码平台与主服务的集成
- 提供完整的管理界面

#### 主要任务

**企业管理模块** (1.5周)
- [ ] 企业注册和配置
- [ ] 订阅计划管理
- [ ] 企业级权限控制
- [ ] 企业监控面板

**租户管理模块** (1.5周)
- [ ] 租户生命周期管理
- [ ] 租户配置和监控
- [ ] 数据隔离机制
- [ ] 租户使用统计

**组织架构模块** (1周)
- [ ] 多层级组织结构
- [ ] 组织权限继承
- [ ] 用户组管理
- [ ] 组织树操作

**用户管理增强** (1周)
- [ ] 多租户用户管理
- [ ] 用户邀请流程
- [ ] 批量用户操作
- [ ] 用户权限聚合

**前端管理界面** (1周)
- [ ] 企业管理界面
- [ ] 租户管理界面
- [ ] 组织架构管理
- [ ] 用户管理界面
- [ ] 权限配置界面

#### 交付物
- 完整的多租户管理功能
- 管理界面和用户体验
- API接口文档
- 功能测试报告

### 第三阶段：深度集成和扩展 (4周)

#### 目标
- 实现低代码平台与主服务的深度集成
- 开发应用空间管理
- 建立计费和审计系统

#### 主要任务

**平台集成** (1.5周)
- [ ] 统一身份认证
- [ ] 权限信息同步
- [ ] 租户信息同步
- [ ] 应用部署集成
- [ ] 数据同步机制

**应用空间管理** (1周)
- [ ] 应用空间创建和配置
- [ ] 资源隔离和限制
- [ ] 应用部署管理
- [ ] 应用监控和统计

**计费管理** (1周)
- [ ] 订阅计划配置
- [ ] 使用量监控
- [ ] 自动计费系统
- [ ] 账单生成和支付

**审计增强** (0.5周)
- [ ] 多租户审计日志
- [ ] 合规报告生成
- [ ] 敏感操作追踪
- [ ] 日志导出功能

#### 交付物
- 集成的平台生态
- 应用空间管理功能
- 计费管理系统
- 增强的审计功能

### 第四阶段：优化和部署 (3周)

#### 目标
- 系统性能优化
- 安全加固
- 生产环境部署
- 监控和运维

#### 主要任务

**性能优化** (1周)
- [ ] 数据库查询优化
- [ ] 缓存策略优化
- [ ] API响应时间优化
- [ ] 并发处理能力提升
- [ ] 前端性能优化

**安全加固** (1周)
- [ ] 数据加密实现
- [ ] API安全防护
- [ ] 权限安全审计
- [ ] 安全漏洞扫描
- [ ] 安全配置检查

**部署和运维** (1周)
- [ ] 生产环境配置
- [ ] 容器化部署
- [ ] 监控告警系统
- [ ] 备份恢复策略
- [ ] 运维文档编写

#### 交付物
- 优化后的系统性能
- 安全加固的系统
- 生产环境部署
- 完整的运维体系

## 技术实现重点

### 1. 多租户数据隔离

```typescript
// 租户中间件实现
@Injectable()
export class TenantMiddleware implements NestMiddleware {
  async use(req: Request, res: Response, next: NextFunction) {
    const tenantId = await this.extractTenantId(req);
    const tenantContext = await this.buildTenantContext(tenantId);
    
    req['tenantContext'] = tenantContext;
    req['tenantId'] = tenantId;
    
    next();
  }
}

// 动态数据库连接
@Injectable()
export class TenantPrismaService {
  private connections = new Map<string, PrismaClient>();
  
  async getConnection(tenantId: string): Promise<PrismaClient> {
    if (!this.connections.has(tenantId)) {
      await this.createConnection(tenantId);
    }
    return this.connections.get(tenantId)!;
  }
}
```

### 2. 权限控制集成

```typescript
// 多租户权限守卫
@Injectable()
export class TenantPermissionGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const tenantContext = request.tenantContext;
    
    return this.checkTenantPermissions(user, tenantContext, permissions);
  }
}

// 权限装饰器
export const RequirePermissions = (...permissions: string[]) =>
  SetMetadata('permissions', permissions);

export const RequireTenantRole = (role: string) =>
  SetMetadata('tenantRole', role);
```

### 3. 低代码平台集成

```typescript
// 集成API接口
@Controller('integration/lowcode')
export class LowcodeIntegrationController {
  @Post('sync-tenant')
  async syncTenant(
    @Body() dto: SyncTenantDto,
    @TenantContext() tenantContext: TenantContext
  ): Promise<ApiRes<null>> {
    await this.lowcodeIntegrationService.syncTenant(dto.tenantId, tenantContext);
    return ApiRes.success(null);
  }
  
  @Post('create-app-space')
  async createAppSpace(
    @Body() dto: CreateAppSpaceDto,
    @TenantContext() tenantContext: TenantContext
  ): Promise<ApiRes<{ appSpaceId: string }>> {
    const result = await this.lowcodeIntegrationService.createAppSpace(dto, tenantContext);
    return ApiRes.success(result);
  }
}
```

### 4. 前端集成架构

```vue
<!-- 企业管理主界面 -->
<template>
  <div class="enterprise-dashboard">
    <!-- 企业信息概览 -->
    <EnterpriseOverview :enterprise="currentEnterprise" />
    
    <!-- 租户管理 -->
    <TenantManagement :tenants="tenants" @create="handleCreateTenant" />
    
    <!-- 低代码应用空间 -->
    <AppSpaceManagement :spaces="appSpaces" @deploy="handleDeploy" />
    
    <!-- 监控面板 -->
    <MonitoringDashboard :metrics="metrics" />
  </div>
</template>

<script setup lang="ts">
/**
 * 企业管理主界面组件
 * 集成企业信息、租户管理、应用空间和监控功能
 */
import { ref, onMounted } from 'vue';
import { useEnterpriseStore } from '@/stores/enterprise';
import { useTenantStore } from '@/stores/tenant';
import { useAppSpaceStore } from '@/stores/appSpace';

const enterpriseStore = useEnterpriseStore();
const tenantStore = useTenantStore();
const appSpaceStore = useAppSpaceStore();

const currentEnterprise = ref(null);
const tenants = ref([]);
const appSpaces = ref([]);
const metrics = ref({});

/**
 * 初始化页面数据
 */
onMounted(async () => {
  await loadEnterpriseData();
  await loadTenants();
  await loadAppSpaces();
  await loadMetrics();
});

/**
 * 加载企业数据
 */
async function loadEnterpriseData() {
  currentEnterprise.value = await enterpriseStore.getCurrentEnterprise();
}

/**
 * 处理创建租户
 */
async function handleCreateTenant(tenantData: any) {
  await tenantStore.createTenant(tenantData);
  await loadTenants();
}

/**
 * 处理应用部署
 */
async function handleDeploy(appData: any) {
  await appSpaceStore.deployApp(appData);
  await loadAppSpaces();
}
</script>
```

## 数据流设计

### 1. 用户认证流程

```
用户登录 → JWT Token (包含租户信息) → 租户中间件 → 权限验证 → 业务处理
```

### 2. 多租户数据访问

```
请求 → 租户识别 → 动态数据库连接 → 数据过滤 → 返回结果
```

### 3. 低代码集成流程

```
租户创建 → 同步到低代码平台 → 创建应用空间 → 配置权限 → 部署应用
```

## 部署架构

### Docker Compose 配置

```yaml
version: '3.8'
services:
  # 数据库
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: soybean_admin
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  # Redis缓存
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

  # 企业级主服务
  enterprise-backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    environment:
      - DATABASE_URL=postgresql://postgres:postgres@postgres:5432/soybean_admin
      - REDIS_URL=redis://redis:6379
      - JWT_SECRET=${JWT_SECRET}
    ports:
      - "3000:3000"
    depends_on:
      - postgres
      - redis

  # 低代码平台后端
  lowcode-platform:
    build:
      context: ./lowcode-platform-backend
      dockerfile: Dockerfile
    environment:
      - DATABASE_URL=postgresql://postgres:postgres@postgres:5432/soybean_admin
      - REDIS_URL=redis://redis:6379
    ports:
      - "3002:3002"
    depends_on:
      - postgres
      - redis

  # AMIS低代码后端
  amis-lowcode:
    build:
      context: ./amis-lowcode-backend
      dockerfile: Dockerfile
    environment:
      - DATABASE_URL=postgresql://postgres:postgres@postgres:5432/soybean_admin
    ports:
      - "3003:3003"
    depends_on:
      - postgres

  # 前端应用
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    ports:
      - "5173:5173"
    environment:
      - VITE_API_BASE_URL=http://enterprise-backend:3000
      - VITE_LOWCODE_API_URL=http://lowcode-platform:3002
      - VITE_AMIS_API_URL=http://amis-lowcode:3003

  # Nginx反向代理
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - frontend
      - enterprise-backend
      - lowcode-platform
      - amis-lowcode

volumes:
  postgres_data:
  redis_data:
```

## 质量保证

### 测试策略

1. **单元测试**: 覆盖率 > 85%
2. **集成测试**: 覆盖核心业务流程
3. **端到端测试**: 覆盖用户关键路径
4. **性能测试**: 并发用户 > 1000
5. **安全测试**: 渗透测试和漏洞扫描

### 代码质量

1. **代码审查**: 所有代码必须经过审查
2. **静态分析**: ESLint + SonarQube
3. **类型检查**: TypeScript严格模式
4. **文档**: 函数级中文注释
5. **规范**: 遵循团队编码规范

### 监控指标

1. **性能指标**:
   - API响应时间 < 200ms
   - 数据库查询时间 < 100ms
   - 页面加载时间 < 3s

2. **可用性指标**:
   - 系统可用性 > 99.9%
   - 错误率 < 0.1%
   - 恢复时间 < 5min

3. **业务指标**:
   - 租户创建成功率 > 99%
   - 用户登录成功率 > 99.5%
   - 应用部署成功率 > 98%

## 风险管控

### 技术风险

1. **数据一致性风险**
   - 实现分布式事务
   - 建立数据同步机制
   - 制定数据恢复策略

2. **性能风险**
   - 提前进行压力测试
   - 实现自动扩缩容
   - 建立性能监控

3. **安全风险**
   - 定期安全评估
   - 实施安全加固
   - 建立应急响应

### 项目风险

1. **进度风险**
   - 制定详细计划
   - 定期进度评估
   - 建立风险预警

2. **质量风险**
   - 严格测试流程
   - 代码质量检查
   - 用户验收测试

3. **集成风险**
   - 分阶段集成
   - 接口契约测试
   - 集成环境验证

## 成功标准

### 功能完整性
- [ ] 企业级多租户功能完整
- [ ] 低代码平台功能完善
- [ ] 两个系统深度集成
- [ ] 管理界面用户友好
- [ ] API接口文档完整

### 性能指标
- [ ] 支持1000+并发用户
- [ ] API响应时间<200ms
- [ ] 页面加载时间<3s
- [ ] 系统可用性>99.9%

### 安全合规
- [ ] 数据加密传输存储
- [ ] 权限控制精确
- [ ] 审计日志完整
- [ ] 安全漏洞修复

### 可维护性
- [ ] 代码结构清晰
- [ ] 文档完整准确
- [ ] 测试覆盖充分
- [ ] 监控告警完善

---

本路线图将指导整个项目的开发过程，确保构建出高质量、可扩展、安全可靠的企业级低代码平台生态系统。