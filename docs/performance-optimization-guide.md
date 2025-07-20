# 低代码平台性能优化指南

## 🎯 概述

本指南提供了低代码平台的性能优化策略和最佳实践，帮助提升用户体验和系统响应速度。

## 🚀 前端性能优化

### 1. 组件级优化

#### 1.1 防抖和节流
```typescript
// 使用防抖优化搜索功能
import { debounce } from '@/utils/performance';

const debouncedSearch = debounce((query: string) => {
  performSearch(query);
}, 300);
```

#### 1.2 虚拟滚动
```vue
<template>
  <PerformanceTable
    :data="largeDataset"
    :virtual-scroll="true"
    :max-height="600"
    :columns="columns"
  />
</template>
```

#### 1.3 懒加载
```typescript
import { useLazyLoading } from '@/utils/performance';

const { data, loading, loadMore, hasMore } = useLazyLoading(
  async (page, size) => {
    const response = await fetchData(page, size);
    return {
      data: response.data.records,
      total: response.data.total
    };
  },
  20 // 每页20条
);
```

### 2. 数据管理优化

#### 2.1 缓存策略
```typescript
import { useCache } from '@/utils/performance';

const cache = useCache<string, any>(100, 5 * 60 * 1000); // 5分钟TTL

// 缓存API响应
function getCachedData(key: string) {
  const cached = cache.get(key);
  if (cached) return cached;
  
  const data = fetchFromAPI();
  cache.set(key, data);
  return data;
}
```

#### 2.2 内存管理
```typescript
import { useMemoryOptimization } from '@/utils/performance';

const { cleanup, addTimer, addEventListener } = useMemoryOptimization();

// 组件卸载时自动清理
onUnmounted(() => {
  cleanup();
});
```

### 3. 渲染优化

#### 3.1 使用 shallowRef 和 shallowReactive
```typescript
import { shallowRef, shallowReactive } from 'vue';

// 对于大型对象，使用浅层响应式
const largeData = shallowRef(new Array(10000).fill({}));
const config = shallowReactive({ settings: {} });
```

#### 3.2 条件渲染优化
```vue
<template>
  <!-- 使用 v-show 而不是 v-if 对于频繁切换的元素 -->
  <div v-show="isVisible" class="expensive-component">
    <ExpensiveComponent />
  </div>
  
  <!-- 使用 v-if 对于条件很少改变的元素 -->
  <div v-if="hasPermission" class="admin-panel">
    <AdminPanel />
  </div>
</template>
```

#### 3.3 列表渲染优化
```vue
<template>
  <!-- 使用唯一且稳定的 key -->
  <div v-for="item in items" :key="item.id" class="item">
    {{ item.name }}
  </div>
  
  <!-- 避免在模板中使用复杂计算 -->
  <div v-for="item in processedItems" :key="item.id">
    {{ item.displayName }}
  </div>
</template>

<script setup>
// 将复杂计算移到计算属性中
const processedItems = computed(() => {
  return items.value.map(item => ({
    ...item,
    displayName: formatDisplayName(item)
  }));
});
</script>
```

## 🔧 后端性能优化

### 1. 数据库优化

#### 1.1 索引优化
```sql
-- 为常用查询字段添加索引
CREATE INDEX idx_api_config_project_status ON "ApiConfig" ("projectId", "status");
CREATE INDEX idx_api_config_method_path ON "ApiConfig" ("method", "path");

-- 复合索引优化查询
CREATE INDEX idx_api_config_search ON "ApiConfig" ("projectId", "status", "method", "createdAt");
```

#### 1.2 查询优化
```typescript
// 使用 select 只查询需要的字段
const apiConfigs = await this.prisma.apiConfig.findMany({
  select: {
    id: true,
    name: true,
    method: true,
    path: true,
    status: true,
    createdAt: true
  },
  where: { projectId, status: 'ACTIVE' },
  orderBy: { createdAt: 'desc' },
  take: pageSize,
  skip: (page - 1) * pageSize
});
```

#### 1.3 分页优化
```typescript
// 使用游标分页替代偏移分页（大数据集）
async findApiConfigsCursor(
  projectId: string,
  cursor?: string,
  take: number = 20
) {
  return await this.prisma.apiConfig.findMany({
    where: { projectId },
    take,
    ...(cursor && {
      cursor: { id: cursor },
      skip: 1
    }),
    orderBy: { createdAt: 'desc' }
  });
}
```

### 2. 缓存策略

#### 2.1 Redis 缓存
```typescript
import { Injectable } from '@nestjs/common';
import { RedisService } from '@nestjs-modules/ioredis';

@Injectable()
export class ApiConfigCacheService {
  constructor(private readonly redis: RedisService) {}

  async getApiConfigs(projectId: string): Promise<any[] | null> {
    const cached = await this.redis.get(`api-configs:${projectId}`);
    return cached ? JSON.parse(cached) : null;
  }

  async setApiConfigs(projectId: string, data: any[], ttl: number = 300) {
    await this.redis.setex(
      `api-configs:${projectId}`,
      ttl,
      JSON.stringify(data)
    );
  }
}
```

#### 2.2 应用级缓存
```typescript
import { LRUCache } from 'lru-cache';

const cache = new LRUCache<string, any>({
  max: 1000,
  ttl: 5 * 60 * 1000 // 5分钟
});

// 在服务中使用
@Injectable()
export class ApiConfigService {
  async getApiConfigs(projectId: string) {
    const cacheKey = `api-configs:${projectId}`;
    
    let result = cache.get(cacheKey);
    if (!result) {
      result = await this.repository.findByProject(projectId);
      cache.set(cacheKey, result);
    }
    
    return result;
  }
}
```

### 3. API 优化

#### 3.1 响应压缩
```typescript
// main.ts
import compression from 'compression';

app.use(compression({
  filter: (req, res) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  },
  level: 6,
  threshold: 1024
}));
```

#### 3.2 批量操作
```typescript
// 批量创建API配置
@Post('batch')
async createBatch(@Body() createDtos: CreateApiConfigDto[]) {
  const results = await this.prisma.$transaction(
    createDtos.map(dto => 
      this.prisma.apiConfig.create({ data: dto })
    )
  );
  return results;
}
```

## 📊 性能监控

### 1. 前端监控

#### 1.1 性能指标收集
```typescript
// 收集核心Web指标
function collectWebVitals() {
  // First Contentful Paint
  new PerformanceObserver((list) => {
    const entries = list.getEntries();
    entries.forEach((entry) => {
      if (entry.name === 'first-contentful-paint') {
        console.log('FCP:', entry.startTime);
      }
    });
  }).observe({ entryTypes: ['paint'] });

  // Largest Contentful Paint
  new PerformanceObserver((list) => {
    const entries = list.getEntries();
    const lastEntry = entries[entries.length - 1];
    console.log('LCP:', lastEntry.startTime);
  }).observe({ entryTypes: ['largest-contentful-paint'] });
}
```

#### 1.2 组件性能监控
```typescript
// 监控组件渲染时间
function measureComponentRender(componentName: string, renderFn: () => void) {
  performance.mark(`${componentName}-start`);
  renderFn();
  performance.mark(`${componentName}-end`);
  performance.measure(
    `${componentName}-render`,
    `${componentName}-start`,
    `${componentName}-end`
  );
}
```

### 2. 后端监控

#### 2.1 API 响应时间监控
```typescript
import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class PerformanceInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const start = Date.now();
    const request = context.switchToHttp().getRequest();
    
    return next.handle().pipe(
      tap(() => {
        const duration = Date.now() - start;
        if (duration > 1000) { // 记录超过1秒的请求
          console.warn(`Slow API: ${request.method} ${request.url} took ${duration}ms`);
        }
      })
    );
  }
}
```

#### 2.2 数据库查询监控
```typescript
// Prisma 查询日志
const prisma = new PrismaClient({
  log: [
    { emit: 'event', level: 'query' },
    { emit: 'event', level: 'error' },
    { emit: 'event', level: 'warn' }
  ]
});

prisma.$on('query', (e) => {
  if (e.duration > 1000) { // 记录慢查询
    console.warn(`Slow query: ${e.query} took ${e.duration}ms`);
  }
});
```

## 🎯 性能优化检查清单

### 前端优化
- [ ] 实现防抖和节流
- [ ] 使用虚拟滚动处理大列表
- [ ] 实现懒加载
- [ ] 添加缓存机制
- [ ] 优化组件渲染
- [ ] 使用适当的响应式API
- [ ] 实现内存管理
- [ ] 添加性能监控

### 后端优化
- [ ] 数据库索引优化
- [ ] 查询优化
- [ ] 实现缓存策略
- [ ] API响应压缩
- [ ] 批量操作支持
- [ ] 连接池优化
- [ ] 添加性能监控
- [ ] 实现限流机制

### 部署优化
- [ ] 启用Gzip压缩
- [ ] 配置CDN
- [ ] 实现负载均衡
- [ ] 数据库读写分离
- [ ] 缓存服务器配置
- [ ] 监控和告警设置

## 📈 性能基准

### 目标指标
- **首屏加载时间**: < 2秒
- **API响应时间**: < 500ms
- **大列表渲染**: < 100ms
- **搜索响应**: < 300ms
- **内存使用**: < 100MB
- **CPU使用率**: < 50%

### 测试工具
- **前端**: Lighthouse, WebPageTest, Chrome DevTools
- **后端**: Artillery, JMeter, New Relic
- **数据库**: EXPLAIN ANALYZE, pg_stat_statements

## 🔧 故障排查

### 常见性能问题
1. **内存泄漏**: 检查事件监听器、定时器清理
2. **慢查询**: 分析查询计划，添加索引
3. **大数据渲染**: 实现虚拟滚动或分页
4. **频繁重渲染**: 使用memo、computed优化
5. **网络延迟**: 实现缓存、压缩、CDN

### 调试技巧
```typescript
// 性能分析
console.time('operation');
performExpensiveOperation();
console.timeEnd('operation');

// 内存使用监控
console.log('Memory usage:', performance.memory);

// 组件更新追踪
watch(() => someReactiveData, (newVal, oldVal) => {
  console.log('Data changed:', { newVal, oldVal });
}, { deep: true });
```

通过遵循这些优化策略和最佳实践，可以显著提升低代码平台的性能和用户体验。
