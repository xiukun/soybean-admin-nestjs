# Fastify Integration Guide

本项目使用 Fastify 作为 HTTP 服务器，而不是 Express。Fastify 提供了更好的性能和更现代的 API。

## 为什么选择 Fastify？

1. **性能优势**: Fastify 比 Express 快 2-3 倍
2. **TypeScript 支持**: 原生 TypeScript 支持，更好的类型安全
3. **插件生态**: 丰富的插件生态系统
4. **JSON Schema**: 内置 JSON Schema 验证
5. **现代化**: 支持 async/await，Promise 原生支持

## 主要差异

### 请求/响应对象

```typescript
// Express 风格
import { Request, Response } from 'express';

// Fastify 风格
import { FastifyRequest, FastifyReply } from 'fastify';
```

### 响应方法

```typescript
// Express
res.json(data);
res.status(200).json(data);

// Fastify
res.send(data);
res.status(200).send(data);
```

### 头部设置

```typescript
// Express
res.set('Content-Type', 'application/json');

// Fastify
res.header('Content-Type', 'application/json');
```

## 已配置的 Fastify 插件

### 1. CORS 支持
```typescript
await fastifyAdapter.register(require('@fastify/cors'), {
  origin: ['http://localhost:9527', 'http://localhost:9528'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  credentials: true,
});
```

### 2. 文件上传支持
```typescript
await fastifyAdapter.register(require('@fastify/multipart'), {
  limits: {
    fileSize: 10485760, // 10MB
    files: 5,
  },
});
```

### 3. 压缩支持
```typescript
await fastifyAdapter.register(require('@fastify/compress'), {
  global: true,
  threshold: 1024,
});
```

### 4. 速率限制
```typescript
await fastifyAdapter.register(require('@fastify/rate-limit'), {
  max: 200,
  timeWindow: 60000, // 1 minute
});
```

## 使用示例

### 控制器示例

```typescript
import { Controller, Get, Post, Body, Res } from '@nestjs/common';
import { FastifyReply } from 'fastify';

@Controller('example')
export class ExampleController {
  @Get()
  async getExample(@Res() res: FastifyReply) {
    return res.status(200).send({ message: 'Hello Fastify!' });
  }

  @Post()
  async createExample(@Body() data: any, @Res() res: FastifyReply) {
    // 处理数据
    return res.status(201).send({ id: 1, ...data });
  }
}
```

### 中间件示例

```typescript
import { Injectable, NestMiddleware } from '@nestjs/common';
import { FastifyRequest, FastifyReply } from 'fastify';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  use(req: FastifyRequest, res: FastifyReply, next: Function) {
    console.log(`${req.method} ${req.url}`);
    next();
  }
}
```

### 文件上传处理

```typescript
import { Controller, Post, Req } from '@nestjs/common';
import { FastifyRequest } from 'fastify';

@Controller('upload')
export class UploadController {
  @Post('file')
  async uploadFile(@Req() req: FastifyRequest) {
    const data = await req.file();
    
    return {
      filename: data.filename,
      mimetype: data.mimetype,
      size: data.file.bytesRead,
    };
  }

  @Post('files')
  async uploadFiles(@Req() req: FastifyRequest) {
    const files = await req.files();
    const results = [];
    
    for await (const file of files) {
      results.push({
        filename: file.filename,
        mimetype: file.mimetype,
        size: file.file.bytesRead,
      });
    }
    
    return results;
  }
}
```

## 性能监控

Fastify 集成了性能监控中间件：

```typescript
// 自动记录请求指标
- http_requests_total
- http_request_duration_seconds
- http_request_size_bytes
- http_response_size_bytes
```

## 健康检查

健康检查端点已适配 Fastify：

- `GET /health` - 基础健康检查
- `GET /health/detailed` - 详细健康信息
- `GET /health/ready` - 就绪性探针
- `GET /health/live` - 存活性探针
- `GET /health/metrics` - Prometheus 指标

## WebSocket 支持

如需 WebSocket 支持，可以添加 `@fastify/websocket` 插件：

```bash
npm install @fastify/websocket
```

```typescript
// 在 main.ts 中注册
await fastifyAdapter.register(require('@fastify/websocket'));
```

## 测试

测试时需要使用 Fastify 适配器：

```typescript
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';

describe('E2E Tests', () => {
  let app: NestFastifyApplication;

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication<NestFastifyApplication>(
      new FastifyAdapter()
    );
    
    await app.init();
    await app.getHttpAdapter().getInstance().ready();
  });
});
```

## 部署注意事项

1. **Docker**: Dockerfile 已配置支持 Fastify
2. **环境变量**: 支持所有 Fastify 相关配置
3. **日志**: 使用 Fastify 内置日志系统
4. **集群**: 支持 PM2 集群模式

## 迁移指南

如果从 Express 迁移到 Fastify：

1. 更新导入语句
2. 修改响应方法调用
3. 更新中间件实现
4. 调整测试代码
5. 验证插件兼容性

## 性能优化建议

1. **启用压缩**: 已默认启用 gzip 压缩
2. **连接池**: 配置数据库连接池
3. **缓存**: 使用 Redis 缓存
4. **静态文件**: 使用 CDN 或反向代理
5. **监控**: 启用 Prometheus 指标收集

## 故障排除

### 常见问题

1. **插件注册失败**: 检查插件版本兼容性
2. **CORS 问题**: 验证 CORS 配置
3. **文件上传失败**: 检查文件大小限制
4. **性能问题**: 启用监控和分析

### 调试技巧

```typescript
// 启用 Fastify 日志
const fastifyAdapter = new FastifyAdapter({
  logger: {
    level: 'debug',
    prettyPrint: true,
  },
});
```

## 相关资源

- [Fastify 官方文档](https://www.fastify.io/)
- [NestJS Fastify 集成](https://docs.nestjs.com/techniques/performance)
- [Fastify 插件生态](https://www.fastify.io/ecosystem/)
- [性能基准测试](https://www.fastify.io/benchmarks/)
