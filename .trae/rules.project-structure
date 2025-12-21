# Damai Lowcode Admin - 项目结构规则

## 项目目录组织
Damai Lowcode Admin 采用单体仓库结构，各组件之间有明确的分离：

```
damai-lowcode-admin/
├── backend/          # NestJS 后端，采用 monorepo 结构
├── frontend/         # Vue 3 前端应用
├── lowcode-designer/ # React 低代码设计器
├── deploy/           # 部署脚本和配置
└── static-designer/  # 静态设计器资源
```

## 后端结构
后端采用 NestJS monorepo 模式，使用 NestJS CLI workspaces：

```
backend/
├── apps/                  # NestJS 应用
│   ├── base-demo/        # MVC 模式的演示应用
│   └── base-system/      # CQRS/DDD 模式的核心系统
├── libs/                  # 共享库
│   ├── bootstrap/         # 应用引导逻辑
│   ├── config/           # 配置管理
│   ├── constants/         # 全局常量
│   ├── global/           # 全局模块
│   ├── infra/            # 基础设施组件
│   ├── logger/           # 日志工具
│   ├── shared/           # 共享工具
│   ├── typings/          # 类型定义
│   └── utils/           # 工具函数
├── prisma/               # Prisma ORM 相关文件
│   ├── schema.prisma     # 数据库 schema
│   └── seeds/           # 数据库种子数据
└── nest-cli.json          # NestJS CLI 配置
```

## 前端结构
前端采用 Vue 3 + Vite 项目结构：

```
frontend/
├── build/                  # 构建配置
├── packages/               # 内部包
│   ├── alova/            # Alova HTTP 客户端封装
│   ├── axios/            # Axios HTTP 客户端
│   ├── color/            # 颜色工具
│   ├── hooks/            # 共享钩子
│   ├── materials/         # UI 素材
│   ├── ofetch/           # OFetch HTTP 客户端
│   ├── scripts/          # 构建脚本
│   └── utils/            # 工具函数
├── public/                # 静态资源
├── src/                   # 源代码
│   ├── amis/             # AMIS 低代码配置
│   ├── assets/           # 静态资源
│   ├── components/       # Vue 组件
│   ├── constants/        # 常量
│   ├── enum/            # 枚举类型
│   ├── hooks/           # 自定义钩子
│   ├── layouts/          # 布局组件
│   ├── locales/          # 国际化
│   ├── plugins/         # Vue 插件
│   ├── router/          # Vue Router 配置
│   ├── service/          # API 通信层
│   ├── store/           # Pinia 状态管理
│   ├── styles/         # 全局样式
│   ├── typings/        # 类型定义
│   ├── utils/          # 工具函数
│   ├── views/          # 页面组件
│   ├── App.vue         # 根组件
│   └── main.ts         # 应用入口
└── vite.config.ts        # Vite 配置
```

## 低代码设计器结构
低代码设计器是一个基于 React 的应用：

```
lowcode-designer/
├── public/              # 静态资源
├── src/                 # 源代码
│   ├── api/             # API 服务
│   ├── components/       # React 组件
│   ├── db/              # 本地数据库
│   ├── designer/        # AMIS 设计器配置
│   ├── pages/           # 页面组件
│   ├── router/          # React Router 配置
│   ├── store/           # 状态管理
│   ├── styles/          # CSS 样式
│   └── utils/          # 工具函数
└── vite.config.ts        # Vite 配置
```

## 部署结构
```
deploy/
└── postgres/           # PostgreSQL 迁移脚本
    ├── 01_create_table.sql
    ├── 02_sys_user.sql
    ├── 03_sys_role.sql
    ├── 04_sys_menu.sql
    ├── 05_sys_domain.sql
    ├── 06_sys_user_role.sql
    ├── 07_sys_role_menu.sql
    ├── 08_casbin_rule.sql
    └── 09_lowcode_pages.sql
```

## 最佳实践
1. **组件分离**: 将后端、前端和低代码设计器保持在单独目录中
2. **Monorepo 结构**: 使用 NestJS CLI workspaces 进行后端 monorepo 管理
3. **共享库**: 将通用功能提取到共享库中（后端 libs/ 文件夹）
4. **类型安全**: 在专门的 typings 文件夹中维护类型定义
5. **配置分离**: 将配置与应用逻辑分离
6. **静态资源**: 将静态文件存储在 public/ 目录中

## 命名约定
1. **目录**: 使用 kebab-case 命名
2. **文件**: 大多数文件使用 kebab-case，配置文件使用 camelCase
3. **组件**: Vue/React 组件使用 PascalCase
4. **模块**: NestJS 模块使用 kebab-case

## 模块组织
1. **后端模块**: 将相关功能分组到单独的 NestJS 模块中
2. **前端组件**: 遵循 Vue 3 composition API 模式
3. **共享代码**: 将共享逻辑提取到单独的包/库中
4. **配置**: 保持配置文件集中化和类型化

## 基础设施层
后端 libs 中的 `infra` 目录包含横切关注点：
- **Adapter**: 外部系统集成
- **Casbin**: 授权逻辑
- **Crypto**: 加密工具
- **Decorators**: 自定义 NestJS 装饰器
- **Filters**: 异常处理
- **Guard**: 认证/授权守卫
- **Rest**: REST API 工具
- **Strategies**: 认证策略
