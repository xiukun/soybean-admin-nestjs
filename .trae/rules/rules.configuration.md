# Damai Lowcode Admin - 配置管理规则

## 配置概述
Damai Lowcode Admin 采用结构化的配置管理方法，将不同环境和组件之间的关注点分离。

## 后端配置

### 配置文件
所有后端配置文件位于 `backend/libs/config/` 目录下：

| 文件名 | 用途 |
|--------|------|
| `app.config.ts` | 应用核心设置 |
| `cors.config.ts` | CORS（跨域资源共享）设置 |
| `crypto.config.ts` | 加密相关配置 |
| `redis.config.ts` | Redis 缓存配置 |
| `security.config.ts` | 安全设置（JWT、密码策略） |
| `throttler.config.ts` | 限流配置 |

### 环境变量

#### 环境文件
- **开发环境**: `.env`（必须从示例手动创建）
- **生产环境**: `.env.production`（必须手动创建）
- **测试环境**: `.env.test`（必须手动创建）

#### 环境变量命名约定
- 使用大写字母和下划线（例如：`DATABASE_URL`）
- 使用组件特定前缀（例如：`REDIS_HOST`、`JWT_SECRET`）
- 相关变量分组（例如：所有 JWT 变量以 `JWT_` 开头）

#### 必需的环境变量
- **数据库**: `DATABASE_URL`
- **JWT**: `JWT_SECRET`、`JWT_EXPIRES_IN`
- **Redis**: `REDIS_HOST`、`REDIS_PORT`、`REDIS_PASSWORD`
- **服务器**: `PORT`、`NODE_ENV`

### 环境工具函数
后端在 `backend/libs/utils/src/env.ts` 中提供了类型安全的环境变量解析工具函数：

```typescript
getEnvBoolean(key: string, defaultValue?: boolean): boolean
getEnvString(key: string, defaultValue?: string): string
getEnvNumber(key: string, defaultValue?: number): number
getEnvArray(key: string, defaultValue?: string[]): string[]
```

### 使用指南
1. **始终使用环境工具函数**以确保类型安全
2. **为非关键变量提供合理默认值**
3. **将敏感变量**排除在版本控制之外
4. **在文档中记录所有环境变量**
5. **跨环境使用一致的命名**

## 前端配置

### Vite 配置
- **主配置**: `frontend/vite.config.ts`
- **构建配置**: `frontend/build/config/`
- **代理设置**: `frontend/build/config/proxy.ts`

### Vite 别名
```typescript
// vite.config.ts resolve.alias
{
  '~': path.resolve(__dirname, './'),
  '@': path.resolve(__dirname, './src'),
}
```

### 前端环境变量
- **前缀**: 所有 Vite 环境变量必须以 `VITE_` 开头
- **开发环境**: `.env`（已提供）
- **生产环境**: `.env.production`（手动创建）
- **测试环境**: `.env.test`（手动创建）

### 可用环境变量
| 变量名 | 用途 | 默认值 |
|--------|------|--------|
| `VITE_PROXY` | 开发环境中启用代理 | `true` |
| `VITE_PORT` | 开发服务器端口 | `9527` |
| `VITE_BASE_URL` | API 请求的基础 URL | `/` |
| `VITE_OUT_DIR` | 构建输出目录 | `dist` |
| `VITE_DROP_CONSOLE` | 生产环境中移除控制台日志 | `false` |

## 配置最佳实践

1. **关注点分离**: 将配置与应用逻辑分离
2. **类型安全**: 使用 TypeScript 接口定义配置对象
3. **环境特定设置**: 为不同环境使用不同配置
4. **提供默认值**: 始终提供合理的默认值
5. **验证**: 在应用启动时验证配置值
6. **文档**: 记录所有配置选项
7. **安全性**: 切勿将敏感信息存储在版本控制中
8. **一致性**: 保持命名约定的一致性

## 配置加载顺序

### 后端加载顺序
1. **默认值**：配置文件中定义的默认值
2. **环境变量**：来自 `.env` 文件的环境变量
3. **运行时环境变量**：来自系统的运行时环境变量

### 前端加载顺序
1. **Vite 默认值**
2. **开发环境**：`.env`
3. **环境特定**：`.env.production`、`.env.test`
4. **构建时变量**：通过 CLI 传递的构建时变量

## 配置验证

### 后端验证
- 使用 NestJS `ConfigModule` 验证
- 为配置对象定义验证模式
- 对无效配置抛出描述性错误

### 前端验证
- 使用 TypeScript 接口进行类型检查
- 在应用启动时验证配置
- 为可选设置提供回退值

## 密钥管理

### 最佳实践
1. **切勿提交密钥**到版本控制
2. **使用环境变量**存储密钥
3. **考虑生产环境使用密钥管理器**（AWS Secrets Manager、HashiCorp Vault）
4. **定期轮换密钥**
5. **限制密钥访问权限**
6. **加密密钥**（传输中和静态存储）

### 开发环境
- 使用 `.env` 文件进行本地开发
- 将 `.env` 添加到 `.gitignore`
- 提供带有占位符值的 `.env.example` 文件

### 生产环境
- 使用容器编排密钥（Docker Swarm、Kubernetes Secrets）
- 或使用专用密钥管理器
- 避免硬编码任何敏感信息

## Docker 中的配置

### Docker Compose 配置
- 使用 `docker-compose.yml` 进行服务配置
- 在 compose 文件中定义环境变量
- 使用 `env_file` 指令加载 `.env` 文件
- 必要时从文件挂载密钥

### Dockerfile 配置
- 避免在 Dockerfile 中设置密钥
- 对非敏感设置使用构建参数
- 在运行时设置环境变量
