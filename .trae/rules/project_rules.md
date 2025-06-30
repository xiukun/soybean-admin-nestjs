# 企业级低代码平台项目协作章程 (v1.0)

## 1. 核心理念与哲学

1.  **领域驱动设计 (DDD) 为后端之魂**: 后端开发严格遵循 DDD 思想，以业务领域为核心，构建清晰、稳定、可扩展的领域模型。
2.  **AMIS Schema 为前端之体**: 前端开发以 AMIS 为主导，最大化利用其低代码能力快速构建页面。**Schema 即代码**，必须接受同等严格的版本管理和质量要求。
3.  **API 为沟通之桥**: 前后端协作的唯一契约是 **OpenAPI (Swagger) 文档**。接口一旦定义，双方严格遵守。
4.  **Vue 组件为 AMIS 之翼**: Vue 自定义组件是 AMIS 能力的延伸，用于处理复杂交互和定制化业务，是平台的“特种兵”。
5.  **自动化与工具链优先**: 信任并依赖自动化工具来保证代码质量、规范和部署效率，将人的精力聚焦于业务价值创造。

## 2. Git 工作流与提交规范

### 2.1. 分支模型
采用 **Git Flow 简化模型**:

-   **`main`**: 生产分支。受保护，仅接受来自 `develop` 的 PR。
-   **`develop`**: 开发主分支。所有功能开发的基线，是新功能 PR 的目标分支。
-   **`feature/{feature-name}`**: 功能分支 (e.g., `feature/user-permission-model`)。
-   **`fix/{bug-name}`**: 修复分支 (e.g., `fix/login-form-validation`)。
-   **`refactor/{refactor-name}`**: 重构分支 (e.g., `refactor/amis-schema-structure`)。

### 2.2. 提交规范 (Commit Message)
遵循 **Conventional Commits**，并增加 **DDD** 和 **AMIS** 相关 `scope`。

**格式**: `<type>(<scope>): <subject>`

-   **通用 Type**: `feat`, `fix`, `refactor`, `style`, `docs`, `test`, `chore`.
-   **后端 Scope**:
    -   `domain`: 核心领域层变更 (Entities, Aggregates, Domain Services)。
    -   `app`: 应用层变更 (Application Services, DTOs)。
    -   `infra`: 基础设施层变更 (Prisma, Redis, Casbin)。
    -   `ctrl`: 表现层变更 (Controllers)。
-   **前端 Scope**:
    -   `amis`: AMIS Schema 变更 (页面、组件配置)。
    -   `vue`: Vue 自定义组件变更。
    -   `api`: API 请求服务或类型定义变更。
    -   `layout`: 整体布局或样式变更。

**示例**:
-   `git commit -m "feat(domain): add Order aggregate root"`
-   `git commit -m "fix(app): correct price calculation in OrderService"`
-   `git commit -m "feat(amis): design the initial schema for order management page"`
-   `git commit -m "refactor(vue): abstract user selector into a reusable component"`

## 3. 后端协作规范 (NestJS + DDD)

### 3.1. DDD 分层职责
严格遵守代码在各层之间的职责和依赖关系。

1.  **Domain Layer (`libs/.../domain`)**:
    -   **职责**: 包含业务核心逻辑和规则。实现实体 (Entities)、聚合 (Aggregates)、值对象 (Value Objects)、领域事件 (Domain Events)。
    -   **规则**: **纯粹的 TypeScript/JavaScript**。**禁止** 依赖任何外部框架（包括 NestJS 和 Prisma）。

2.  **Application Layer (`libs/.../application`)**:
    -   **职责**: 编排领域对象，执行具体的业务用例 (Use Cases)。定义 DTOs (Data Transfer Objects)。
    -   **规则**: 作为领域层和基础设施层的协调者。不包含业务规则。

3.  **Infrastructure Layer (`libs/.../infrastructure`)**:
    -   **职责**: 实现外部依赖的技术细节。如数据库仓储 (Repositories using Prisma)、缓存 (Redis)、消息队列、第三方 API 调用等。
    -   **规则**: 实现领域层定义的接口（仓储接口等）。

4.  **Presentation Layer (`apps/base-system/src`)**:
    -   **职责**: 对外暴露 API (RESTful Controllers)。处理 HTTP 请求、响应和身份验证。
    -   **规则**: **保持“瘦” (Thin Controller)**。仅做参数校验和调用应用层服务，禁止包含任何业务逻辑。

### 3.2. 开发准则
-   **DTO 驱动**: Controller 的出入参、应用服务的输入输出，**必须** 使用 DTO。严禁将领域实体直接暴露到 Controller。
-   **依赖注入**: 遵循 NestJS 的 DI 机制和依赖倒置原则。高层模块不依赖底层模块，两者都依赖于抽象。
-   **配置中心**: 所有敏感信息、环境相关配置均通过 `libs/config` 模块读取环境变量，严禁硬编码。
-   **错误处理**: 使用全局异常过滤器 (`libs/infra/filters`) 统一处理业务异常和未知错误，返回标准化的错误响应体。

## 4. 前端协作规范 (Vue + AMIS)

### 4.1. AMIS 与 Vue 的边界
这是前端开发的核心决策点。

-   **优先 AMIS (80%场景)**:
    -   所有标准的 **CRUD** 页面、数据报表、表单、弹窗等。
    -   **原则**: 如果一个功能可以通过组合 AMIS 内置组件和配置 `onEvent` 动作实现，就 **必须** 使用 AMIS。

-   **适时 Vue 自定义组件 (20%场景)**:
    -   **复杂交互**: AMIS 事件链无法优雅实现的复杂前端逻辑（如拖拽画布、流程编排）。
    -   **高复用业务模块**: 需要在多个页面中复用的、带有业务逻辑的组件（如组织架构选择器、商品规格编辑器）。
    -   **集成第三方库**: 需要深度集成非 AMIS 生态的库（如 ECharts, Mapbox）。
    -   **性能优化**: 对渲染性能有极致要求的虚拟列表等。

### 4.2. AMIS Schema 规范
-   **结构化与拆分**:
    -   禁止编写超过 300 行的“巨型” JSON。应在 `.ts` 文件中，将 Schema 按逻辑块（`filter`, `crud`, `headerToolbar`）拆分为独立的变量或函数。
    -   利用 TypeScript 的函数和模板字符串动态生成 Schema，提高可维护性。
-   **复用与抽象**:
    -   将通用的 Schema 片段（如统一的操作按钮、状态渲染）封装为可复用的函数。
    -   **示例**: `export const createDefaultCRUDTable = (columns) => ({ type: 'crud', ... });`
-   **状态管理**:
    -   **AMIS 内部状态优先**: 充分利用 AMIS 自身的数据链和变量作用域管理页面级状态。
    -   **Pinia (全局状态)**: 仅用于管理跨页面、跨组件的全局状态，如用户信息、权限、系统配置等。避免滥用。

## 5. 前后端接口协作规范

1.  **API-First & OpenAPI (Swagger)**:
    -   **后端职责**: 在 Controller 和 DTO 上使用 `@nestjs/swagger` 装饰器，自动生成准确、详尽的 OpenAPI 文档。这是后端开发的 “Definition of Done” 之一。
    -   **前端职责**: **禁止** 手动编写 API 请求函数和 TS 类型。应使用工具（如 `openapi-typescript-codegen`）基于后端提供的 `swagger.json` 自动生成。

2.  **数据契约 (DTO)**:
    -   前后端交互的数据结构完全由后端定义的 DTO 决定。
    -   **数据转换**: 后端负责提供结构清晰的 DTO。前端若需适配 UI，应优先使用 AMIS 的 `dataMapping` 或 `source` 表达式进行转换，而不是要求后端频繁修改接口。

3.  **统一响应结构**:
    -   所有 API 响应遵循统一结构：`{ success: boolean, code: number, message: string, data: T }`。
    -   前端在统一的请求库 (`packages/alova` 或 `axios`) 拦截器中处理 `success: false` 的情况和 `401`, `403` 等 HTTP 状态码。

## 6. 测试与质量保证

-   **后端**:
    -   **单元测试**: 针对领域层的核心业务逻辑编写。
    -   **集成测试**: 针对应用层服务，测试其与仓储、外部服务的集成。
    -   **E2E 测试**: 针对 Controller，覆盖关键业务流程。
-   **前端**:
    -   **单元测试**: 针对 Vue 自定义组件和 `utils` 中的复杂函数。
    -   **E2E 测试**: 使用 Cypress 或 Playwright 验证关键页面的 AMIS 渲染和核心交互流程是否正常。

## 7. 文档

-   **API 文档**: 唯一来源是后端自动生成的 Swagger UI。
-   **代码注释**: 注释**为什么**这样写，而不是**写了什么**。特别是复杂的领域逻辑和 AMIS `onEvent` 中的 `script`。
-   **核心组件文档**: 为高复用的 Vue 自-定义组件和 AMIS Schema 生成函数编写 `README.md`，说明其 `props`、`events` 和用法。
