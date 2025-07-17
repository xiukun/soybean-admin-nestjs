# 多阶段构建
FROM node:18-alpine AS builder

# 设置工作目录
WORKDIR /app

# 复制package文件
COPY package*.json ./
COPY pnpm-lock.yaml ./

# 安装pnpm
RUN npm install -g pnpm

# 安装依赖
RUN pnpm install --frozen-lockfile

# 复制源代码
COPY . .

# 生成Prisma客户端
RUN pnpm prisma:generate

# 构建应用
RUN pnpm build

# 生产阶段
FROM node:18-alpine AS production

# 安装必要的系统依赖
RUN apk add --no-cache dumb-init curl

# 创建应用用户
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nestjs -u 1001

# 设置工作目录
WORKDIR /app

# 复制package文件
COPY package*.json ./
COPY pnpm-lock.yaml ./

# 安装pnpm
RUN npm install -g pnpm

# 只安装生产依赖
RUN pnpm install --frozen-lockfile --prod

# 从构建阶段复制构建产物
COPY --from=builder --chown=nestjs:nodejs /app/dist ./dist
COPY --from=builder --chown=nestjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder --chown=nestjs:nodejs /app/prisma ./prisma

# 创建必要的目录
RUN mkdir -p /app/logs /app/generated && \
    chown -R nestjs:nodejs /app/logs /app/generated

# 复制启动脚本
COPY --chown=nestjs:nodejs docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# 切换到应用用户
USER nestjs

# 暴露端口
EXPOSE 3000

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

# 启动应用
CMD ["dumb-init", "docker-entrypoint.sh"]
