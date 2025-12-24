# Damai Lowcode Admin - 编码规范

## ESLint 配置

### 后端 ESLint 规则
- **配置文件**: `backend/eslint.config.js`
- **基础配置**: 使用 NestJS 推荐规则和 TypeScript ESLint
- **关键规则**:
  - 强制特定路径组的导入顺序
  - 按字母顺序排序导入
  - 导入组之间有空行
  - TypeScript 特定规则
  - 禁止未使用的变量
  - 正确的 TypeScript 语法

### 前端 ESLint 规则
- **配置文件**: `frontend/eslint.config.js`
- **基础配置**: 使用 Vue 3 推荐规则、TypeScript ESLint 和 Prettier
- **关键规则**:
  - Vue 特定规则（多词组件名等）
  - 模板中使用 PascalCase 组件名
  - UnoCSS 特定规则
  - Vue 组件使用 script setup 语法
  - 禁止未使用的变量
  - 正确的 TypeScript 语法

## Prettier 配置

### 后端 Prettier
- **配置文件**: `backend/.prettierrc`
- **关键设置**:
  - 单引号: `true`
  - 分号: `true`
  - 缩进宽度: `2`
  - 尾随逗号: `es5`
  - 每行最大字符数: `120`

### 前端 Prettier
- **配置文件**: `frontend/.prettierrc`（继承自根目录）
- **关键设置**:
  - 与后端相同，添加 Vue 特定格式化

## TypeScript 约定

### 后端 TypeScript
- **配置文件**: `backend/tsconfig.json`
- **严格模式**: 已启用 (`"strict": true`)
- **目标**: `ES2020`
- **模块**: `commonjs`
- **空值检查**: `strictNullChecks: true`
- **禁止隐式 any**: `noImplicitAny: true`

### 前端 TypeScript
- **配置文件**: `frontend/tsconfig.json`
- **严格模式**: 已启用 (`"strict": true`)
- **目标**: `ES2020`
- **模块**: `ESNext`
- **空值检查**: `strictNullChecks: true`
- **禁止隐式 any**: `noImplicitAny: true`

## 命名约定

### 通用命名规则
1. **变量**: camelCase
2. **常量**: UPPER_SNAKE_CASE（仅用于真正的常量）
3. **函数**: camelCase
4. **类**: PascalCase
5. **接口**: PascalCase（如果是接口，可选择前缀 `I`）
6. **类型**: PascalCase
7. **枚举**: PascalCase（枚举成员: UPPER_SNAKE_CASE）
8. **文件**: 大多数文件使用 kebab-case，配置文件使用 camelCase
9. **目录**: kebab-case

### 组件命名
1. **Vue 组件**: PascalCase（例如: `UserProfile.vue`）
2. **React 组件**: PascalCase（例如: `UserProfile.tsx`）
3. **NestJS 控制器**: PascalCase 并带有 `Controller` 后缀（例如: `UserController`）
4. **NestJS 服务**: PascalCase 并带有 `Service` 后缀（例如: `UserService`）
5. **NestJS 模块**: PascalCase 并带有 `Module` 后缀（例如: `UserModule`）

### 数据库命名
1. **表**: snake_case（例如: `sys_user`）
2. **列**: snake_case（例如: `user_name`）
3. **关系**: TypeScript 中使用 camelCase，数据库中使用 snake_case

## 导入顺序

### 后端导入顺序
1. **内置 Node.js 模块**（例如: `fs`, `path`）
2. **外部依赖**（例如: `@nestjs/common`, `prisma`）
3. **内部模块** - 按路径模式分组:
   - `@soybeanjs/`（工作区包）
   - `../`（父目录导入）
   - `./`（当前目录导入）
4. **每组内按字母顺序排序**
5. **组之间有空行**

### 前端导入顺序
1. **内置浏览器 API**
2. **外部依赖**（例如: `vue`, `axios`）
3. **内部包**（来自 `packages/` 目录）
4. **Vue 组件**
5. **工具和辅助函数**
6. **样式和资源**
7. **每组内按字母顺序排序**
8. **组之间有空行**

## 代码组织

### 后端代码结构
1. **控制器**: 处理 HTTP 请求、验证和响应格式化
2. **服务**: 包含业务逻辑
3. **仓库**: 数据访问层（如果使用仓库模式）
4. **DTO**: 请求/响应验证的数据传输对象
5. **实体**: 数据库模型
6. **守卫**: 认证/授权逻辑
7. **管道**: 请求转换/验证
8. **过滤器**: 异常处理

### 前端代码结构
1. **组件**: 包含模板、脚本和样式的 UI 元素
2. **组合函数**: 使用 Vue 3 组合式 API 的可复用逻辑
3. **Store**: 使用 Pinia 的状态管理
4. **Hook**: 用于可复用逻辑的自定义 React/Vue 钩子
5. **服务**: API 通信层
6. **工具**: 辅助函数

### Vue 组件组织
```vue
<template>
  <!-- 模板内容优先 -->
</template>

<script setup lang="ts">
// 使用 TypeScript 的 Script setup
// 首先是导入
// 然后是 defineProps, defineEmits
// 然后是响应式状态
// 然后是计算属性
// 然后是方法
// 最后是生命周期钩子
</script>

<style scoped lang="scss">
// 样式最后
// 尽可能使用 scoped 样式
</style>
```

## 文档标准

### JSDoc/TSDoc
- **类**: 记录描述、构造函数和公共方法
- **函数**: 记录参数、返回类型和用途
- **接口**: 记录属性和用途
- **类型**: 记录类型定义
- **模块**: 记录模块用途和导出

```typescript
/**
 * 用户服务，用于管理用户操作
 */
export class UserService {
  /**
   * 创建新用户
   * @param createUserDto - 用户创建数据
   * @returns Promise，包含创建的用户
   */
  async createUser(createUserDto: CreateUserDto): Promise<User> {
    // 实现
  }
}
```

### API 文档
- **后端**: 使用 Swagger/OpenAPI 进行 API 文档
- **前端**: 记录 API 服务及其使用方法
- **端点**: 记录所有 API 端点的参数、响应和示例

## TypeScript 最佳实践

### 类型安全
1. **使用严格模式**: 始终在 tsconfig.json 中启用 `strict: true`
2. **避免 `any`**: 使用特定类型或 `unknown` 代替
3. **使用类型守卫**: 处理 `unknown` 类型时
4. **定义接口**: 用于复杂数据结构
5. **使用泛型**: 用于可复用组件和函数
6. **类型推断**: 让 TypeScript 尽可能推断类型

### 类型定义
1. **后端**: 存储在 `backend/libs/typings/`
2. **前端**: 存储在 `frontend/src/typings/`
3. **共享类型**: 如果需要，考虑创建共享包
4. **API 类型**: 尽可能从 OpenAPI 规范生成

## 错误处理

### 后端错误处理
1. **使用 NestJS 异常**: `BadRequestException`, `NotFoundException` 等
2. **全局异常过滤器**: 一致地处理所有异常
3. **验证管道**: 自动验证 DTO
4. **自定义异常**: 必要时创建领域特定异常

### 前端错误处理
1. **Axios 拦截器**: 全局处理 API 错误
2. **Try/catch 块**: 用于异步操作
3. **错误边界**: 用于 React 组件
4. **用户反馈**: 显示用户友好的错误消息

## 测试约定

### 后端测试
1. **单元测试**: 使用 Jest 进行单元测试
2. **E2E 测试**: 使用 Jest 和 SuperTest 进行端到端测试
3. **测试文件**: 遵循 `*.spec.ts` 命名模式
4. **测试组织**: 按功能分组测试
5. **覆盖率**: 目标是关键功能 80%+ 的代码覆盖率

### 前端测试
1. **单元测试**: 使用 Vue Test Utils 和 Jest
2. **组件测试**: 隔离测试组件
3. **E2E 测试**: 使用 Cypress 或 Playwright
4. **测试文件**: 遵循 `*.spec.ts` 或 `*.test.ts` 命名模式

## 性能考虑

### 后端性能
1. **数据库查询**: 使用索引优化，避免 N+1 查询
2. **缓存**: 对频繁访问的数据使用 Redis
3. **批处理**: 尽可能批处理请求
4. **Async/Await**: 正确使用非阻塞操作
5. **流处理**: 处理大数据集

### 前端性能
1. **懒加载**: 懒加载组件和路由
2. **代码分割**: 按路由分割 bundle
3. **记忆化**: 对昂贵的计算使用 `computed` 和 `memo`
4. **虚拟滚动**: 用于大型列表
5. **优化资源**: 压缩图像并使用适当的格式

## 提交前钩子

### 后端钩子
- **pre-commit**: 运行 ESLint、Prettier 和 TypeScript 编译
- **commit-msg**: 验证提交消息格式

### 前端钩子
- **pre-commit**: 运行 ESLint、Prettier 和 TypeScript 编译
- **commit-msg**: 验证提交消息格式

## 提交消息格式

### 约定式提交
所有提交都应遵循 [Conventional Commits](https://www.conventionalcommits.org/) 格式:

```
<type>[可选 scope]: <description>

[可选 body]

[可选 footer(s)]
```

### 类型
- **feat**: 新功能
- **fix**: 修复 bug
- **docs**: 文档变更
- **style**: 代码风格变更（格式化等）
- **refactor**: 代码重构
- **test**: 添加或更新测试
- **chore**: 构建过程或辅助工具变更
- **perf**: 性能改进
- **ci**: CI 配置变更
- **revert**: 回滚之前的提交

### 示例
```
feat(auth): 添加 JWT 认证

实现带有刷新令牌和适当错误处理的 JWT 认证

Closes #123
```

## 代码审查指南

### 审查清单
1. **代码质量**: 遵循编码约定和最佳实践
2. **类型安全**: 没有 `any` 类型，正确使用 TypeScript
3. **性能**: 没有明显的性能问题
4. **安全性**: 没有安全漏洞
5. **文档**: 文档齐全
6. **测试**: 为新功能添加了测试
7. **错误处理**: 正确的错误处理
8. **可读性**: 代码易于理解
9. **可维护性**: 代码可维护且可扩展

### 审查流程
1. **自我审查**: 提交前先审查自己的代码
2. **同行审查**: 所有 PR 至少需要一名审查者批准
3. **自动化检查**: 所有 CI 检查必须通过
4. **测试**: 验证功能是否按预期工作
5. **文档**: 必要时更新文档

## 最佳实践

1. **保持函数小**: 单一职责原则
2. **编写可读代码**: 优先考虑可读性而非巧妙性
3. **避免魔术数字/字符串**: 使用常量代替
4. **DRY 原则**: 不要重复自己
5. **KISS 原则**: 保持简单
6. **YAGNI 原则**: 不要实现尚未需要的功能
7. **明智地注释**: 解释 "为什么"，而不是 "是什么"
8. **使用描述性名称**: 让代码自文档化
9. **版本依赖**: 适当使用精确版本或范围
10. **遵循框架约定**: 适当使用 NestJS 和 Vue 模式
