# Frontend 前端服务说明文档

## 服务概述

Frontend 是 SoybeanAdmin NestJS 低代码平台的主要前端应用，基于 Vue 3 + TypeScript 构建的现代化管理后台系统。该服务提供了完整的用户界面，包括系统管理、低代码平台管理、项目管理等核心功能。

## 技术架构

### 核心技术栈
- **框架**: Vue 3.5.16 + Composition API
- **语言**: TypeScript 5.8.3
- **构建工具**: Vite 6.3.5
- **包管理器**: pnpm 8.7.0+
- **Node.js**: 18.20.0+

### UI 和样式
- **UI 组件库**: Naive UI 2.41.1 (主要)
- **样式框架**: UnoCSS 66.1.4
- **CSS 预处理器**: Sass 1.89.1
- **样式工具**: Tailwind Merge 3.3.0
- **图标**: Iconify + Unplugin Icons

### 状态管理和路由
- **状态管理**: Pinia 3.0.3
- **路由管理**: Vue Router 4.5.1 + Elegant Router 0.3.8
- **国际化**: Vue I18n 11.1.5

### 工具库和插件
- **HTTP 客户端**: Axios 1.9.0 + Axios Retry 4.5.0
- **工具函数**: VueUse 13.3.0
- **日期处理**: Day.js 1.11.13
- **图表库**: ECharts 5.6.0
- **拖拽**: Vue Draggable Plus 0.6.0
- **低代码引擎**: Amis 6.11.0

## 项目结构

```
frontend/
├── src/
│   ├── App.vue                 # 根组件
│   ├── main.ts                 # 应用入口
│   ├── amis/                   # Amis 低代码相关
│   ├── assets/                 # 静态资源
│   ├── components/             # 公共组件
│   ├── constants/              # 常量定义
│   ├── enum/                   # 枚举定义
│   ├── hooks/                  # 组合式函数
│   ├── layouts/                # 布局组件
│   ├── locales/                # 国际化文件
│   ├── plugins/                # 插件配置
│   ├── router/                 # 路由配置
│   ├── service/                # API 服务
│   │   ├── api/                # API 接口定义
│   │   ├── gateway/            # 网关配置
│   │   ├── lowcode/            # 低代码相关 API
│   │   └── request/            # 请求封装
│   ├── store/                  # 状态管理
│   │   ├── modules/            # 状态模块
│   │   └── plugins/            # 状态插件
│   ├── styles/                 # 全局样式
│   ├── theme/                  # 主题配置
│   ├── typings/                # 类型定义
│   ├── utils/                  # 工具函数
│   └── views/                  # 页面组件
│       ├── _builtin/           # 内置页面
│       ├── access-key/         # 访问密钥管理
│       ├── amis-demo/          # Amis 演示
│       ├── home/               # 首页
│       ├── log/                # 日志管理
│       ├── lowcode/            # 低代码平台
│       └── manage/             # 系统管理
├── public/                     # 公共资源
├── package.json                # 项目配置
├── vite.config.ts              # Vite 配置
├── tsconfig.json               # TypeScript 配置
└── uno.config.ts               # UnoCSS 配置
```

## 核心功能模块

### 1. 系统管理 (manage/)
- **用户管理**: 用户增删改查、角色分配
- **角色管理**: 角色权限配置、菜单权限
- **菜单管理**: 系统菜单配置、路由管理
- **部门管理**: 组织架构管理
- **字典管理**: 系统字典配置

### 2. 低代码平台 (lowcode/)
- **项目管理**: 低代码项目的创建、配置、管理
- **实体管理**: 数据实体的设计和管理
- **字段管理**: 实体字段的定义和配置
- **关系设计**: 实体间关系的可视化设计
- **代码生成**: 基于实体模型自动生成代码
- **API 管理**: API 接口的配置和测试
- **模板管理**: 代码生成模板的管理

### 3. 首页仪表板 (home/)
- **数据概览**: 系统关键指标展示
- **快捷操作**: 常用功能快速入口
- **最近活动**: 用户操作记录
- **系统通知**: 重要消息提醒

### 4. 日志管理 (log/)
- **操作日志**: 用户操作记录查询
- **系统日志**: 系统运行日志
- **错误日志**: 异常错误记录
- **登录日志**: 用户登录记录

## 低代码平台详细功能

### 项目管理 (project/)
```typescript
// 项目管理核心功能
interface Project {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'inactive';
  entities: Entity[];
  createdAt: Date;
  updatedAt: Date;
}
```

**主要功能**:
- 项目创建和配置
- 项目状态管理（激活/停用）
- 项目信息编辑
- 项目删除和归档

### 实体管理 (entity/)
```typescript
// 实体定义
interface Entity {
  id: string;
  name: string;
  tableName: string;
  description: string;
  fields: Field[];
  relationships: Relationship[];
}
```

**主要功能**:
- 实体创建和编辑
- 实体字段管理
- 实体关系定义
- 实体代码生成

### 字段管理 (field/)
```typescript
// 字段定义
interface Field {
  id: string;
  name: string;
  type: FieldType;
  required: boolean;
  unique: boolean;
  defaultValue?: any;
  validation?: ValidationRule[];
}
```

**支持的字段类型**:
- 基础类型: String, Number, Boolean, Date
- 高级类型: JSON, Array, File, Image
- 关系类型: OneToOne, OneToMany, ManyToMany

### 关系设计 (relationship/)
- **可视化关系设计器**: 拖拽式实体关系建模
- **关系类型支持**: 一对一、一对多、多对多
- **外键约束**: 自动生成外键约束
- **级联操作**: 支持级联删除和更新

### 代码生成 (code-generation/)
**生成内容**:
- **后端代码**: NestJS Controller、Service、DTO
- **数据库迁移**: Prisma Schema 和 Migration
- **API 文档**: Swagger 接口文档
- **前端代码**: CRUD 页面和组件

**生成模板**:
- Controller 模板
- Service 模板
- DTO 模板
- Entity 模板
- 前端页面模板

## 状态管理架构

### Pinia Store 模块
```typescript
// 主要状态模块
├── auth/           # 认证状态
├── app/            # 应用全局状态
├── theme/          # 主题配置
├── tab/            # 标签页管理
├── route/          # 路由状态
└── lowcode/        # 低代码平台状态
    ├── project/    # 项目状态
    ├── entity/     # 实体状态
    ├── field/      # 字段状态
    └── generation/ # 代码生成状态
```

### 状态管理特性
- **类型安全**: 完整的 TypeScript 类型支持
- **持久化**: 关键状态本地存储
- **响应式**: 基于 Vue 3 响应式系统
- **模块化**: 按功能模块组织状态

## 路由系统

### 路由配置
```typescript
// 路由结构
const routes = [
  {
    path: '/home',
    component: () => import('@/views/home/index.vue'),
    meta: { title: '首页', requiresAuth: true }
  },
  {
    path: '/lowcode',
    component: () => import('@/layouts/base-layout/index.vue'),
    children: [
      {
        path: 'project',
        component: () => import('@/views/lowcode/project/index.vue'),
        meta: { title: '项目管理' }
      }
      // ... 其他低代码路由
    ]
  }
];
```

### 路由守卫
- **认证守卫**: 检查用户登录状态
- **权限守卫**: 验证页面访问权限
- **标题守卫**: 动态设置页面标题
- **进度条**: 路由切换进度提示

## API 服务架构

### 服务分层
```typescript
// API 服务结构
├── request/           # 请求封装
│   ├── index.ts      # Axios 实例配置
│   ├── interceptors/ # 请求/响应拦截器
│   └── types.ts      # 请求类型定义
├── api/              # API 接口定义
│   ├── auth.ts       # 认证相关 API
│   ├── user.ts       # 用户管理 API
│   └── system.ts     # 系统管理 API
└── lowcode/          # 低代码平台 API
    ├── project.ts    # 项目管理 API
    ├── entity.ts     # 实体管理 API
    └── generation.ts # 代码生成 API
```

### 请求配置
```typescript
// Axios 配置
const request = axios.create({
  baseURL: import.meta.env.VITE_SERVICE_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// 多服务配置
const services = {
  main: 'http://localhost:9528/v1',
  lowcode: 'http://localhost:3002/api/v1',
  amis: 'http://localhost:9522/api/v1'
};
```

## 组件系统

### 公共组件
- **布局组件**: 页面布局、侧边栏、头部
- **表单组件**: 动态表单、表单验证
- **表格组件**: 数据表格、分页、排序
- **图表组件**: ECharts 封装组件
- **上传组件**: 文件上传、图片上传

### 低代码组件
- **实体设计器**: 可视化实体建模
- **字段编辑器**: 字段属性配置
- **关系设计器**: 实体关系可视化
- **代码预览器**: 生成代码预览
- **模板编辑器**: 代码模板编辑

## 主题系统

### 主题配置
```typescript
// 主题配置
interface ThemeConfig {
  colorScheme: 'light' | 'dark' | 'auto';
  primaryColor: string;
  layout: 'vertical' | 'horizontal';
  siderCollapse: boolean;
  animations: boolean;
}
```

### 样式特性
- **响应式设计**: 适配不同屏幕尺寸
- **暗色模式**: 支持明暗主题切换
- **主题定制**: 可配置的主题色彩
- **动画效果**: 流畅的过渡动画

## 国际化支持

### 语言配置
```typescript
// 支持的语言
const locales = {
  'zh-CN': '简体中文',
  'en-US': 'English'
};

// 翻译文件结构
├── zh-CN/
│   ├── common.json    # 通用翻译
│   ├── route.json     # 路由翻译
│   ├── system.json    # 系统翻译
│   └── lowcode.json   # 低代码翻译
└── en-US/
    └── ... (同上)
```

## 开发配置

### 环境变量
```bash
# 开发环境配置
VITE_SERVICE_BASE_URL=http://localhost:9528/v1
VITE_OTHER_SERVICE_BASE_URL={"lowcodeService": "http://localhost:3002/api/v1", "amisService": "http://localhost:9522/api/v1"}
VITE_ROUTER_HISTORY_MODE=history
VITE_BASE_URL=/
```

### 构建配置
```typescript
// vite.config.ts 主要配置
export default defineConfig({
  plugins: [
    vue(),
    vueJsx(),
    UnoCSS(),
    Icons(),
    Components()
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '~': path.resolve(__dirname)
    }
  },
  server: {
    port: 9527,
    proxy: {
      '/api': {
        target: 'http://localhost:9528',
        changeOrigin: true
      }
    }
  }
});
```

## 部署配置

### Docker 配置
```dockerfile
# Dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
```

### 构建脚本
```json
{
  "scripts": {
    "dev": "vite --mode development",
    "build": "vite build --mode prod",
    "build:test": "vite build --mode test",
    "preview": "vite preview"
  }
}
```

## 性能优化

### 代码分割
- **路由懒加载**: 按路由分割代码
- **组件懒加载**: 大型组件按需加载
- **第三方库分割**: 独立打包第三方依赖

### 缓存策略
- **HTTP 缓存**: 静态资源缓存
- **组件缓存**: Keep-alive 组件缓存
- **数据缓存**: API 响应缓存

### 打包优化
- **Tree Shaking**: 移除未使用代码
- **压缩优化**: Gzip/Brotli 压缩
- **资源优化**: 图片压缩、字体优化

## 开发指南

### 开发环境启动
```bash
# 安装依赖
pnpm install

# 启动开发服务器
pnpm dev

# 类型检查
pnpm typecheck

# 代码检查
pnpm lint
```

### 代码规范
- **ESLint**: 代码质量检查
- **Prettier**: 代码格式化
- **TypeScript**: 类型安全
- **Git Hooks**: 提交前检查

### 调试配置
- **Vue DevTools**: Vue 组件调试
- **Vite DevTools**: 构建调试
- **Source Maps**: 源码映射
- **HMR**: 热模块替换

---

**服务端口**: 9527  
**文档版本**: v1.0.0  
**更新时间**: 2024年12月  
**维护团队**: SoybeanAdmin 前端团队