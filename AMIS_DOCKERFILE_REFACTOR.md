# Amis-Lowcode-Backend Dockerfile 重构

## 重构说明

参考 `backend/Dockerfile` 的成功实现，重新调整了 `amis-lowcode-backend/Dockerfile`，采用相同的多阶段构建模式和最佳实践。

## 主要改进

### 1. 统一的构建模式
- 采用与 backend 相同的多阶段构建结构
- 使用相同的 Node.js 和 pnpm 版本
- 统一的工作目录结构

### 2. 优化的依赖管理
- 使用 bind mount 和 cache mount 优化构建速度
- 分离生产依赖和开发依赖的安装
- 利用 Docker 缓存机制

### 3. 安全性改进
- 使用非 root 用户运行应用
- 正确的文件权限设置
- 最小化运行时镜像

## 详细对比

### 构建参数
```dockerfile
# 新版本 - 与 backend 保持一致
ARG NODE_VERSION=20.11.1
ARG PNPM_VERSION=9.1.2
```

### Base 阶段
```dockerfile
# 新版本 - 统一的基础镜像配置
FROM node:${NODE_VERSION}-alpine AS base
WORKDIR /usr/src/app/amis-lowcode-backend
RUN apk --no-cache add curl
RUN --mount=type=cache,target=/root/.npm \
    npm install -g pnpm@${PNPM_VERSION}
```

### 依赖安装阶段
```dockerfile
# 新版本 - 使用 bind mount 和 cache mount
FROM base AS deps
RUN --mount=type=bind,source=package.json,target=package.json \
    --mount=type=bind,source=pnpm-lock.yaml,target=pnpm-lock.yaml \
    --mount=type=cache,target=/root/.local/share/pnpm/store/amis-lowcode-backend \
    pnpm install --prod --frozen-lockfile
```

### 构建阶段
```dockerfile
# 新版本 - 优化的构建流程
FROM deps AS build
RUN --mount=type=bind,source=package.json,target=package.json \
    --mount=type=bind,source=pnpm-lock.yaml,target=pnpm-lock.yaml \
    --mount=type=cache,target=/root/.local/share/pnpm/store/amis-lowcode-backend \
    pnpm install --frozen-lockfile

COPY . .
RUN pnpm prisma:generate && pnpm build
```

### 运行阶段
```dockerfile
# 新版本 - 安全的运行环境
FROM base AS final
ENV NODE_ENV=production

USER root
RUN mkdir -p /usr/src/app/amis-lowcode-backend/logs \
             /usr/src/app/amis-lowcode-backend/generated \
             /usr/src/app/amis-lowcode-backend/uploads && \
    chown -R node:node /usr/src/app/amis-lowcode-backend

USER node
COPY package.json .
COPY --from=deps /usr/src/app/amis-lowcode-backend/node_modules ./node_modules
COPY --from=build /usr/src/app/amis-lowcode-backend/dist ./dist
COPY --from=build /usr/src/app/amis-lowcode-backend/prisma ./prisma
```

## 关键优化点

### 1. 缓存优化
- 使用 Docker BuildKit 的 cache mount 功能
- pnpm store 缓存加速依赖安装
- npm 缓存加速 pnpm 安装

### 2. 构建效率
- bind mount 避免不必要的文件复制
- 分层构建最大化缓存利用
- 最小化最终镜像大小

### 3. 安全性
- 非 root 用户运行
- 正确的文件权限
- 最小化攻击面

### 4. 一致性
- 与其他服务保持一致的构建模式
- 统一的版本管理
- 标准化的目录结构

## 测试验证

使用更新的测试脚本验证构建：

```bash
./test-amis-build.sh
```

## 预期效果

1. **构建速度提升** - 通过缓存机制显著提升构建速度
2. **构建稳定性** - 使用成熟的构建模式，减少构建失败
3. **镜像大小优化** - 多阶段构建减少最终镜像大小
4. **安全性提升** - 非 root 用户和最小权限原则
5. **维护性改进** - 与其他服务保持一致，便于维护

重构后的 Dockerfile 应该能够稳定构建并与整个系统保持一致。
