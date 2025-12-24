# Damai Lowcode Admin - 技术栈规则

## 概述
本文档概述了 Damai Lowcode Admin 中使用的技术栈，包括推荐版本、依赖项和使用指南。重点说明后端和前端依赖的库及其版本要求。

## 后端技术栈

### 核心框架
| 技术 | 版本 | 用途 | 配置位置 |
|------|------|------|----------|
| NestJS | 11.x | 后端框架 | `backend/package.json` |
| TypeScript | 5.x | 类型安全 JavaScript | `backend/tsconfig.json` |
| Node.js | 20.x+ | JavaScript 运行时 | `.nvmrc` |

### 数据库 & ORM
| 技术 | 版本 | 用途 | 配置位置 |
|------|------|------|----------|
| Prisma | 6.x | 数据库访问 ORM | `backend/prisma/schema.prisma` |
| PostgreSQL | 13.x+ | 关系型数据库 | `backend/.env` (DATABASE_URL) |

### 认证 & 授权
| 技术 | 版本 | 用途 | 配置位置 |
|------|------|------|----------|
| JWT | - | JSON Web Tokens | `backend/libs/config/security.config.ts` |
| Casbin | - | RBAC 授权 | `backend/libs/infra/casbin/` |
| bcryptjs | - | 密码哈希 | `backend/libs/utils/` |

### 缓存
| 技术 | 版本 | 用途 | 配置位置 |
|------|------|------|----------|
| Redis | 6.x+ | 内存缓存 | `backend/libs/config/redis.config.ts` |
| Cache Manager | - | 缓存抽象 | `backend/libs/global/` |

### API & 文档
| 技术 | 版本 | 用途 | 配置位置 |
|------|------|------|----------|
| Swagger | - | API 文档 | `backend/libs/bootstrap/` |
| OpenAPI | 3.x | API 规范 | `backend/libs/bootstrap/` |

### 安全
| 技术 | 版本 | 用途 | 配置位置 |
|------|------|------|----------|
| Helmet | - | 安全头 | `backend/libs/bootstrap/` |
| CORS | - | 跨域资源共享 | `backend/libs/config/cors.config.ts` |
| 限流 | - | API 节流 | `backend/libs/config/throttler.config.ts` |

### 日志
| 技术 | 版本 | 用途 | 配置位置 |
|------|------|------|----------|
| NestJS Logger | - | 内置日志 | `backend/libs/logger/` |

### 测试
| 技术 | 版本 | 用途 | 配置位置 |
|------|------|------|----------|
| Jest | - | 单元测试框架 | `backend/package.json` |
| SuperTest | - | HTTP 测试库 | `backend/package.json` |

## 前端技术栈

### 核心框架
| 技术 | 版本 | 用途 | 配置位置 |
|------|------|------|----------|
| Vue 3 | 3.x | 前端框架 | `frontend/package.json` |
| TypeScript | 5.x | 类型安全 JavaScript | `frontend/tsconfig.json` |
| Vite | 6.x | 构建工具 | `frontend/vite.config.ts` |

### UI 组件库
| 技术 | 版本 | 用途 | 配置位置 |
|------|------|------|----------|
| Naive UI | - | Vue 3 UI 库 | `frontend/src/plugins/` |
| UnoCSS | - | 实用优先 CSS 框架 | `frontend/uno.config.ts` |

### 状态管理
| 技术 | 版本 | 用途 | 配置位置 |
|------|------|------|----------|
| Pinia | 2.x | Vue 状态管理 | `frontend/src/store/` |

### HTTP 客户端
| 技术 | 版本 | 用途 | 配置位置 |
|------|------|------|----------|
| Axios | - | HTTP 客户端 | `frontend/packages/axios/` |
| Alova | - | Vue 特定 HTTP 客户端 | `frontend/packages/alova/` |
| OFetch | - | 轻量级 HTTP 客户端 | `frontend/packages/ofetch/` |

### 路由
| 技术 | 版本 | 用途 | 配置位置 |
|------|------|------|----------|
| Vue Router | 4.x | Vue 路由 | `frontend/src/router/` |

### 开发工具
| 技术 | 版本 | 用途 | 配置位置 |
|------|------|------|----------|
| ESLint | 9.x | 代码检查 | `frontend/eslint.config.js` |
| Prettier | 3.x | 代码格式化 | `frontend/.prettierrc` |

### 图标
| 技术 | 版本 | 用途 | 配置位置 |
|------|------|------|----------|
| Iconify | - | 图标库 | `frontend/src/plugins/iconify.ts` |

### 国际化
| 技术 | 版本 | 用途 | 配置位置 |
|------|------|------|----------|
| Vue I18n | - | 国际化支持 | `frontend/src/locales/` |

## 低代码设计器技术栈

### 核心框架
| 技术 | 版本 | 用途 | 配置位置 |
|------|------|------|----------|
| React | 18.x | UI 库 | `lowcode-designer/package.json` |
| TypeScript | 5.x | 类型安全 JavaScript | `lowcode-designer/tsconfig.json` |
| Vite | 5.x | 构建工具 | `lowcode-designer/vite.config.ts` |

### 低代码引擎
| 技术 | 版本 | 用途 | 配置位置 |
|------|------|------|----------|
| AMIS | 6.x | 低代码引擎 | `lowcode-designer/src/designer/` |

### 开发工具
| 技术 | 版本 | 用途 | 配置位置 |
|------|------|------|----------|
| ESLint | 8.x | 代码检查 | `lowcode-designer/.eslintrc.cjs` |
| Prettier | 3.x | 代码格式化 | `lowcode-designer/.prettierrc.cjs` |

## 基础设施 & DevOps

### 容器化
| 技术 | 版本 | 用途 | 配置位置 |
|------|------|------|----------|
| Docker | 20.10.x+ | 容器化 | 各组件中的 `Dockerfile` |
| Docker Compose | 2.x+ | 多容器编排 | `docker-compose.yml` |

### CI/CD
| 技术 | 版本 | 用途 | 配置位置 |
|------|------|------|----------|
| GitHub Actions | - | CI/CD 流水线 | `.github/workflows/` |

### 包管理
| 技术 | 版本 | 用途 | 配置位置 |
|------|------|------|----------|
| pnpm | 9.x+ | 包管理器 | `package.json` |

## 版本控制指南

### 语义化版本控制
所有依赖项应遵循语义化版本控制：
- **主要版本**: 破坏性变更
- **次要版本**: 新功能，无破坏性变更
- **补丁版本**: Bug 修复，无破坏性变更

### 依赖管理
1. **关键依赖始终使用精确版本**
2. **非关键依赖使用 caret 范围**（例如：`^1.0.0`）
3. **避免通配符版本**（例如：`*` 或 `x`）
4. **定期更新依赖**以获取安全补丁
5. **更新主要依赖后彻底测试**

### 推荐版本
- **Node.js**: LTS 版本（20.x 或 22.x）
- **pnpm**: 最新稳定版本
- **数据库**: PostgreSQL 14.x+（生产环境）
- **Redis**: 7.x+（生产环境）

## 使用指南

### 后端
1. **使用 NestJS CLI** 生成模块、控制器和服务
2. **遵循 NestJS 最佳实践** 进行模块组织
3. **使用 Prisma Client** 进行数据库操作
4. **使用 NestJS 异常** 实现适当的错误处理
5. **使用适当的守卫** 保护所有端点

### 前端
1. **使用 Vue 3 组合式 API** 和 `<script setup>` 语法
2. **遵循组件化架构**
3. **使用 Pinia** 进行状态管理
4. **为所有屏幕尺寸实现响应式设计**
5. **懒加载组件和路由** 以提高性能

### 低代码设计器
1. **必要时扩展 AMIS** 自定义插件
2. **遵循 React 最佳实践** 进行组件开发
3. **为设计器状态实现适当的状态管理**
4. **彻底测试自定义组件**

## 依赖更新流程

1. **检查更新**: 在每个组件目录中运行 `pnpm outdated`
2. **更新依赖**: 非主要更新运行 `pnpm update`，主要更新手动更新
3. **测试**: 运行所有测试以确保兼容性
4. **Lint**: 运行 ESLint 检查任何问题
5. **类型检查**: 运行 TypeScript 编译器检查类型错误
6. **构建**: 构建项目确保没有构建错误
7. **部署**: 部署到暂存环境进行进一步测试

## 安全考虑

1. **定期更新依赖** 修复安全漏洞
2. **使用 Snyk 或类似工具** 扫描漏洞
3. **遵循 OWASP Top 10** 安全指南
4. **对所有用户输入进行 sanitize**
5. **验证所有 API 请求**

## 未来技术考虑

1. **GraphQL**: 评估复杂 API 需求
2. **gRPC**: 考虑内部服务通信
3. **WebAssembly**: 评估性能关键组件
4. **Serverless**: 考虑特定用例
5. **AI/ML 集成**: 探索低代码设计器的 AI 功能

## 结论
Damai Lowcode Admin 使用现代化、健壮的技术栈，为构建可扩展、可维护的应用程序提供了坚实的基础。遵循本文档中概述的版本控制指南和使用最佳实践，团队可以确保其应用程序保持安全、高性能并与最新技术保持同步。
