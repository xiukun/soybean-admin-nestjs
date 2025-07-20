# API配置性能优化指南

## 概述

本文档提供了低代码平台API配置功能的性能优化建议和最佳实践。

## 前端性能优化

### 1. 组件懒加载

```typescript
// 使用动态导入实现组件懒加载
const ApiConfigSelector = defineAsyncComponent(() => import('./components/api-config-selector.vue'));
const ApiConfigBatchOperations = defineAsyncComponent(() => import('./components/api-config-batch-operations.vue'));
const ApiConfigOnlineTest = defineAsyncComponent(() => import('./components/api-config-online-test.vue'));
const ApiConfigVersionManagement = defineAsyncComponent(() => import('./components/api-config-version-management.vue'));
const ApiConfigDocumentation = defineAsyncComponent(() => import('./components/api-config-documentation.vue'));
```

### 2. 数据缓存策略

```typescript
// 使用Vue的缓存机制
import { computed, ref, watchEffect } from 'vue';

// 缓存API配置列表
const apiConfigCache = new Map<string, any>();

function useApiConfigCache(projectId: string) {
  const cacheKey = `api-configs-${projectId}`;
  
  const getCachedData = () => apiConfigCache.get(cacheKey);
  const setCachedData = (data: any) => apiConfigCache.set(cacheKey, data);
  const clearCache = () => apiConfigCache.delete(cacheKey);
  
  return { getCachedData, setCachedData, clearCache };
}
```

### 3. 虚拟滚动

```typescript
// 对于大量数据的表格，使用虚拟滚动
import { NDataTable } from 'naive-ui';

// 配置虚拟滚动
const tableProps = {
  virtualScroll: true,
  maxHeight: 400,
  minRowHeight: 40
};
```

### 4. 防抖和节流

```typescript
import { debounce, throttle } from 'lodash-es';

// 搜索防抖
const debouncedSearch = debounce((searchTerm: string) => {
  performSearch(searchTerm);
}, 300);

// 滚动节流
const throttledScroll = throttle((event: Event) => {
  handleScroll(event);
}, 100);
```

## 后端性能优化

### 1. 数据库查询优化

```sql
-- 为常用查询字段添加索引
CREATE INDEX idx_api_config_project_id ON api_configs(project_id);
CREATE INDEX idx_api_config_status ON api_configs(status);
CREATE INDEX idx_api_config_method ON api_configs(method);
CREATE INDEX idx_api_config_created_at ON api_configs(created_at);

-- 复合索引
CREATE INDEX idx_api_config_project_status ON api_configs(project_id, status);
```

### 2. 分页优化

```typescript
// 使用游标分页替代偏移分页
interface CursorPaginationQuery {
  cursor?: string;
  limit: number;
  projectId: string;
}

async function getApiConfigsWithCursor(query: CursorPaginationQuery) {
  const { cursor, limit, projectId } = query;
  
  const whereClause = {
    projectId,
    ...(cursor && { id: { gt: cursor } })
  };
  
  const apiConfigs = await prisma.apiConfig.findMany({
    where: whereClause,
    take: limit + 1, // 多取一个用于判断是否有下一页
    orderBy: { id: 'asc' }
  });
  
  const hasNextPage = apiConfigs.length > limit;
  const items = hasNextPage ? apiConfigs.slice(0, -1) : apiConfigs;
  const nextCursor = hasNextPage ? items[items.length - 1].id : null;
  
  return {
    items,
    nextCursor,
    hasNextPage
  };
}
```

### 3. 缓存策略

```typescript
import { Redis } from 'ioredis';

class ApiConfigCacheService {
  private redis: Redis;
  private readonly CACHE_TTL = 300; // 5分钟

  constructor() {
    this.redis = new Redis(process.env.REDIS_URL);
  }

  async getApiConfigs(projectId: string): Promise<any[] | null> {
    const cacheKey = `api-configs:${projectId}`;
    const cached = await this.redis.get(cacheKey);
    return cached ? JSON.parse(cached) : null;
  }

  async setApiConfigs(projectId: string, data: any[]): Promise<void> {
    const cacheKey = `api-configs:${projectId}`;
    await this.redis.setex(cacheKey, this.CACHE_TTL, JSON.stringify(data));
  }

  async invalidateCache(projectId: string): Promise<void> {
    const cacheKey = `api-configs:${projectId}`;
    await this.redis.del(cacheKey);
  }
}
```

### 4. 批量操作优化

```typescript
// 批量插入优化
async function batchCreateApiConfigs(configs: CreateApiConfigDto[]): Promise<void> {
  const batchSize = 100;
  
  for (let i = 0; i < configs.length; i += batchSize) {
    const batch = configs.slice(i, i + batchSize);
    
    await prisma.apiConfig.createMany({
      data: batch,
      skipDuplicates: true
    });
  }
}

// 批量更新优化
async function batchUpdateApiConfigs(updates: { id: string; data: any }[]): Promise<void> {
  const transaction = await prisma.$transaction(
    updates.map(({ id, data }) =>
      prisma.apiConfig.update({
        where: { id },
        data
      })
    )
  );
  
  return transaction;
}
```

## 网络优化

### 1. HTTP/2 和压缩

```typescript
// 启用 gzip 压缩
import compression from 'compression';

app.use(compression({
  level: 6,
  threshold: 1024,
  filter: (req, res) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  }
}));
```

### 2. CDN 配置

```nginx
# Nginx 配置示例
location /api/lowcode/ {
    proxy_pass http://backend;
    proxy_cache api_cache;
    proxy_cache_valid 200 5m;
    proxy_cache_key "$scheme$request_method$host$request_uri";
    
    # 启用压缩
    gzip on;
    gzip_types application/json text/plain application/javascript text/css;
}
```

### 3. 请求合并

```typescript
// 合并多个API请求
async function fetchApiConfigsWithRelatedData(projectId: string) {
  const [apiConfigs, entities, projects] = await Promise.all([
    fetchGetApiConfigList(projectId),
    fetchGetAllEntities(projectId),
    fetchGetAllProjects()
  ]);
  
  return { apiConfigs, entities, projects };
}
```

## 内存优化

### 1. 对象池

```typescript
class ApiConfigObjectPool {
  private pool: any[] = [];
  private maxSize = 100;

  acquire(): any {
    return this.pool.pop() || this.createNew();
  }

  release(obj: any): void {
    if (this.pool.length < this.maxSize) {
      this.reset(obj);
      this.pool.push(obj);
    }
  }

  private createNew(): any {
    return {
      id: '',
      name: '',
      path: '',
      method: 'GET',
      // ... 其他字段
    };
  }

  private reset(obj: any): void {
    Object.keys(obj).forEach(key => {
      obj[key] = typeof obj[key] === 'string' ? '' : null;
    });
  }
}
```

### 2. 内存泄漏防护

```typescript
// 组件卸载时清理资源
import { onUnmounted } from 'vue';

export function useApiConfigCleanup() {
  const timers: NodeJS.Timeout[] = [];
  const subscriptions: (() => void)[] = [];

  function addTimer(timer: NodeJS.Timeout) {
    timers.push(timer);
  }

  function addSubscription(unsubscribe: () => void) {
    subscriptions.push(unsubscribe);
  }

  onUnmounted(() => {
    // 清理定时器
    timers.forEach(timer => clearTimeout(timer));
    
    // 清理订阅
    subscriptions.forEach(unsubscribe => unsubscribe());
    
    // 清空数组
    timers.length = 0;
    subscriptions.length = 0;
  });

  return { addTimer, addSubscription };
}
```

## 监控和分析

### 1. 性能监控

```typescript
// 性能监控装饰器
function performanceMonitor(target: any, propertyName: string, descriptor: PropertyDescriptor) {
  const method = descriptor.value;

  descriptor.value = async function (...args: any[]) {
    const start = performance.now();
    
    try {
      const result = await method.apply(this, args);
      const duration = performance.now() - start;
      
      console.log(`${propertyName} executed in ${duration.toFixed(2)}ms`);
      
      // 发送到监控系统
      if (duration > 1000) { // 超过1秒的慢查询
        sendToMonitoring({
          method: propertyName,
          duration,
          args: args.length,
          timestamp: Date.now()
        });
      }
      
      return result;
    } catch (error) {
      const duration = performance.now() - start;
      console.error(`${propertyName} failed after ${duration.toFixed(2)}ms:`, error);
      throw error;
    }
  };
}
```

### 2. 错误追踪

```typescript
// 错误边界组件
import { defineComponent, onErrorCaptured } from 'vue';

export const ApiConfigErrorBoundary = defineComponent({
  name: 'ApiConfigErrorBoundary',
  setup(_, { slots }) {
    onErrorCaptured((error, instance, info) => {
      console.error('API Config Error:', error);
      
      // 发送错误报告
      sendErrorReport({
        error: error.message,
        stack: error.stack,
        component: instance?.$options.name,
        info,
        timestamp: Date.now(),
        url: window.location.href
      });
      
      return false; // 阻止错误继续传播
    });

    return () => slots.default?.();
  }
});
```

## 最佳实践总结

### 1. 开发阶段
- 使用 TypeScript 确保类型安全
- 实现适当的错误处理和边界情况
- 编写单元测试和集成测试
- 使用 ESLint 和 Prettier 保持代码质量

### 2. 部署阶段
- 启用生产环境优化
- 配置适当的缓存策略
- 使用 CDN 加速静态资源
- 监控应用性能和错误

### 3. 运维阶段
- 定期清理缓存和日志
- 监控数据库性能
- 分析用户行为和性能瓶颈
- 持续优化和改进

## 性能指标

### 目标指标
- 页面首次加载时间 < 2秒
- API响应时间 < 500ms
- 表格渲染时间 < 100ms
- 内存使用量 < 100MB
- 错误率 < 0.1%

### 监控工具
- 前端：Web Vitals, Lighthouse
- 后端：APM工具（如 New Relic, DataDog）
- 数据库：慢查询日志, 性能监控
- 网络：CDN分析, 网络延迟监控
