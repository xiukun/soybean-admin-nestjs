# Damai Lowcode Admin - 架构模式

## 概述
Damai Lowcode Admin 采用模块化架构，支持多种设计模式，允许团队根据用例选择最合适的模式。

## 后端架构

### 1. MVC 模式（Model-View-Controller）

#### 在 `base-demo` 应用中的实现
- **Model**: Prisma schema 中定义的数据库实体
- **View**: API 响应（JSON）
- **Controller**: 处理 HTTP 请求和响应
- **Service**: 包含业务逻辑

#### 示例结构
```
base-demo/
├── src/
│   ├── controllers/      # 请求处理
│   ├── services/         # 业务逻辑
│   ├── entities/         # 数据库模型
│   ├── dtos/            # 数据传输对象
│   └── base-demo.module.ts
```

#### 使用指南
- 简单 CRUD 操作使用 MVC
- 适合直接的业务逻辑
- 新开发人员更容易理解
- 简单功能实现更快

### 2. CQRS/DDD 模式（命令查询职责分离 / 领域驱动设计）

#### 在 `base-system` 应用中的实现
- **Command**: 改变系统状态
- **Query**: 从系统检索数据
- **Domain Model**: 核心业务实体和逻辑
- **Repository**: 数据访问抽象
- **Event**: 用于解耦通信的领域事件

#### 示例结构
```
base-system/
├── src/
│   ├── api/             # API 层（控制器）
│   ├── application/     # 应用服务
│   ├── domain/          # 领域模型和逻辑
│   │   ├── entities/    # 领域实体
│   │   ├── events/      # 领域事件
│   │   ├── repositories/ # 仓库接口
│   │   └── services/    # 领域服务
│   ├── infrastructure/  # 基础设施实现
│   │   ├── repositories/ # 仓库实现
│   │   └── event-handlers/ # 事件处理器
│   └── base-system.module.ts
```

#### 使用指南
- 复杂业务逻辑使用 CQRS/DDD
- 适合高可扩展性需求的系统
- 复杂领域更好的关注点分离
- 支持读写操作独立扩展

### 3. 分层架构

#### 核心层
1. **API 层**: 处理 HTTP 请求、验证和响应格式化
2. **应用层**: 编排业务流程
3. **领域层**: 包含核心业务逻辑和实体
4. **基础设施层**: 实现技术关注点（数据库、缓存等）

#### 层依赖关系
- **API 层** 依赖于 **应用层**
- **应用层** 依赖于 **领域层**
- **基础设施层** 依赖于 **领域层**
- **领域层** 不依赖于其他层

#### 使用指南
- 保持层之间的清晰分离
- 避免跳过层（例如：不要从 API 层直接访问基础设施）
- 使用接口解耦层
- 实现依赖倒置原则

## 前端架构

### 1. 基于组件的架构

#### Vue 3 组件
- **单文件组件（SFC）**: 包含模板、脚本和样式的 `.vue` 文件
- **组合式 API**: 使用 `setup` 脚本语法实现更好的组合
- **Props 和 Emits**: 类型安全的组件通信
- **Scoped Styles**: 每个组件的隔离样式

#### 组件结构
```
components/
├── common/        # 应用程序中可重用的组件
├── business/      # 业务特定组件
└── custom/        # 自定义 UI 组件
```

#### 使用指南
- 保持组件小且专注于单一职责
- 使用 props 进行输入，emits 进行输出
- 利用 Vue 3 组合式 API 实现可重用逻辑
- 使用 scoped 样式避免 CSS 冲突

### 2. 使用 Pinia 的状态管理

#### Store 结构
- **模块**: 按功能/领域组织
- **State**: 响应式数据
- **Getters**: 派生状态的计算属性
- **Actions**: 异步操作
- **Mutations**: 同步状态变化

#### 示例 Store
```typescript
// store/modules/user.ts
export const useUserStore = defineStore('user', {
  state: () => ({
    currentUser: null as User | null,
    isAuthenticated: false
  }),
  getters: {
    userName: (state) => state.currentUser?.name
  },
  actions: {
    async login(credentials: LoginCredentials) {
      // API 调用和状态更新
    }
  }
})
```

#### 使用指南
- 使用 Pinia 进行全局状态管理
- Store 模块专注于特定功能
- 异步操作使用 actions，同步操作使用 mutations
- 避免过度使用全局状态 - 适当使用组件本地状态

### 3. 组合函数

#### 使用组合式 API 的可重用逻辑
- 将共享逻辑提取到组合函数中
- 使用 TypeScript 确保类型安全
- 遵循 Vue 3 组合式 API 最佳实践

#### 示例组合函数
```typescript
// hooks/useUser.ts
export function useUser() {
  const userStore = useUserStore()
  
  const login = async (credentials: LoginCredentials) => {
    await userStore.login(credentials)
  }
  
  const logout = async () => {
    await userStore.logout()
  }
  
  return {
    currentUser: computed(() => userStore.currentUser),
    isAuthenticated: computed(() => userStore.isAuthenticated),
    login,
    logout
  }
}
```

## 低代码设计器架构

### 1. AMIS 低代码引擎
- **框架**: 基于 React 的低代码引擎
- **版本**: AMIS 6.x
- **自定义插件**: 可扩展架构用于自定义组件

### 2. 设计器结构
```
lowcode-designer/
├── src/
│   ├── designer/        # AMIS 设计器配置
│   ├── components/      # 自定义组件
│   ├── plugins/         # AMIS 插件
│   ├── store/          # 状态管理
│   └── utils/          # 工具函数
```

### 3. 与后端集成
- **API 通信**: RESTful API 用于保存/加载表单
- **认证**: JWT 令牌用于安全访问
- **数据绑定**: 设计器和后端之间的动态数据绑定

## 集成模式

### 1. API 网关模式
- **后端 API**: 所有请求的集中式 API 网关
- **版本控制**: API 版本控制，使用 `/v1` 前缀
- **认证**: 网关级别的 JWT 验证
- **限流**: 网关级别的节流

### 2. 事件驱动架构
- **领域事件**: 在 CQRS/DDD 模式中使用
- **事件处理器**: 异步处理事件
- **消息队列**: Redis Pub/Sub 或类似工具用于事件分发

### 3. 缓存策略
- **Redis 缓存**: 用于频繁访问的数据
- **缓存失效**: 数据变化时适当失效
- **缓存旁置模式**: 应用程序直接管理缓存

## 设计原则

### 1. SOLID 原则
- **单一职责**: 每个类/函数应有一个职责
- **开放/封闭**: 对扩展开放，对修改封闭
- **里氏替换**: 派生类应可替换其基类
- **接口隔离**: 小而集中的接口，而不是大接口
- **依赖倒置**: 依赖抽象，而不是具体实现

### 2. DRY（不要重复自己）
- 将共享逻辑提取到可重用组件/库中
- 避免模块间重复代码
- 适当使用继承和组合

### 3. KISS（保持简单）
- 避免过度设计
- 简单问题简单解决
- 优先考虑可读性和可维护性

### 4. YAGNI（你不会需要它）
- 除非真正需要，否则不要实现功能
- 避免投机设计
- 专注于当前需求

### 5. 关注点分离
- 不同关注点放在不同模块中
- 避免将业务逻辑与技术实现混合
- 使用层分离不同关注点

## 架构最佳实践

### 后端最佳实践
1. **使用 NestJS 模块**: 将代码组织成内聚模块
2. **依赖注入**: 使用 NestJS DI 容器实现松耦合
3. **接口隔离**: 定义小而集中的接口
4. **错误处理**: 使用全局异常过滤器一致处理异常
5. **验证**: 使用 DTO 和管道自动验证请求
6. **日志记录**: 使用结构化日志提高可观察性
7. **测试**: 编写全面的单元测试和集成测试

### 前端最佳实践
1. **组件组合**: 从简单组件构建复杂 UI
2. **组合式 API**: 利用 Vue 3 组合式 API 实现可重用逻辑
3. **类型安全**: 所有组件和逻辑使用 TypeScript
4. **状态管理**: 使用 Pinia 管理全局状态，本地状态用于组件特定数据
5. **API 服务**: 集中管理 API 调用
6. **懒加载**: 懒加载组件和路由以提高性能
7. **响应式设计**: 确保 UI 在所有屏幕尺寸上都能正常工作

### 横切关注点
1. **认证**: 使用 JWT 进行无状态认证
2. **授权**: 使用 Casbin 实现 RBAC
3. **安全性**: 对输入进行 sanitize，验证请求，防止常见漏洞
4. **性能**: 优化数据库查询，使用缓存，最小化网络请求
5. **可观察性**: 实现日志记录、监控和跟踪
6. **可扩展性**: 设计水平扩展

## 架构决策记录（ADRs）

### 何时使用哪种模式

| 使用场景 | 推荐模式 |
|----------|----------|
| 简单 CRUD 操作 | MVC 模式 |
| 复杂业务逻辑 | CQRS/DDD 模式 |
| 高读写比 | CQRS/DDD 模式 |
| 有 DDD 经验的团队 | CQRS/DDD 模式 |
| 简单功能快速开发 | MVC 模式 |
| 微服务架构 | CQRS/DDD 模式 |

### 迁移路径
1. 简单功能从 MVC 开始
2. 随着复杂度增加，逐步迁移到 CQRS/DDD
3. 使用共享库保持跨模式一致性
4. 增量重构，保持向后兼容

## 未来架构考虑

1. **微服务**: 必要时逐步迁移到微服务架构
2. **GraphQL**: 评估复杂 API 需求的 GraphQL
3. **事件溯源**: 考虑用于审计跟踪和时间查询
4. **Serverless**: 评估特定用例的无服务器
5. **gRPC**: 考虑内部服务通信的 gRPC

## 结论
Damai Lowcode Admin 提供灵活的架构，支持多种模式，允许团队根据特定需求选择最合适的方法。遵循本文档中概述的架构原则和最佳实践，团队可以构建可扩展、可维护和高质量的应用程序。
