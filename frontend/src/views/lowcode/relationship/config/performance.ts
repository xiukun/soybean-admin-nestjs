// 关系管理模块性能优化配置

export const PERFORMANCE_CONFIG = {
  // G6图形渲染配置
  GRAPH: {
    // 大数据量阈值
    LARGE_DATA_THRESHOLD: {
      NODES: 50,
      EDGES: 100
    },
    
    // 渲染优化配置
    RENDER: {
      // 启用GPU加速
      enableGPU: true,
      // 使用Canvas渲染器
      renderer: 'canvas' as const,
      // 禁用操作栈以提升性能
      enabledStack: false,
      // 限制布局迭代次数
      maxLayoutIteration: 100,
      // 最小移动距离
      minMovement: 0.5
    },
    
    // 事件处理优化
    EVENTS: {
      // 防抖延迟（毫秒）
      DEBOUNCE_DELAY: 150,
      // 节流延迟（毫秒）
      THROTTLE_DELAY: 100,
      // 拖拽防抖延迟
      DRAG_DEBOUNCE_DELAY: 50
    }
  },
  
  // 历史记录配置
  HISTORY: {
    // 最大历史记录数量
    MAX_SIZE: 20,
    // 保存防抖延迟
    SAVE_DEBOUNCE_DELAY: 500
  },
  
  // 属性面板配置
  PROPERTY_PANEL: {
    // 字段虚拟滚动阈值
    VIRTUAL_SCROLL_THRESHOLD: 20,
    // 更新防抖延迟
    UPDATE_DEBOUNCE_DELAY: 300
  },
  
  // 数据加载配置
  DATA_LOADING: {
    // 批量更新阈值
    BATCH_UPDATE_THRESHOLD: 10,
    // 并发请求限制
    CONCURRENT_REQUESTS: 3,
    // 请求超时时间
    REQUEST_TIMEOUT: 10000
  },
  
  // 内存管理配置
  MEMORY: {
    // 自动清理间隔（毫秒）
    AUTO_CLEANUP_INTERVAL: 300000, // 5分钟
    // 缓存大小限制
    CACHE_SIZE_LIMIT: 100
  }
};

// 性能监控工具
export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: Map<string, number[]> = new Map();
  
  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }
  
  // 记录性能指标
  recordMetric(name: string, value: number): void {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }
    
    const values = this.metrics.get(name)!;
    values.push(value);
    
    // 限制记录数量
    if (values.length > 100) {
      values.shift();
    }
  }
  
  // 获取平均值
  getAverage(name: string): number {
    const values = this.metrics.get(name);
    if (!values || values.length === 0) return 0;
    
    return values.reduce((sum, val) => sum + val, 0) / values.length;
  }
  
  // 获取最大值
  getMax(name: string): number {
    const values = this.metrics.get(name);
    if (!values || values.length === 0) return 0;
    
    return Math.max(...values);
  }
  
  // 清理指标
  clearMetrics(): void {
    this.metrics.clear();
  }
  
  // 获取所有指标
  getAllMetrics(): Record<string, { avg: number; max: number; count: number }> {
    const result: Record<string, { avg: number; max: number; count: number }> = {};
    
    for (const [name, values] of this.metrics.entries()) {
      result[name] = {
        avg: this.getAverage(name),
        max: this.getMax(name),
        count: values.length
      };
    }
    
    return result;
  }
}

// 性能优化工具函数
export const PerformanceUtils = {
  // 测量函数执行时间
  measureTime: <T>(fn: () => T, metricName?: string): T => {
    const start = performance.now();
    const result = fn();
    const end = performance.now();
    
    if (metricName) {
      PerformanceMonitor.getInstance().recordMetric(metricName, end - start);
    }
    
    return result;
  },
  
  // 异步函数执行时间测量
  measureTimeAsync: async <T>(fn: () => Promise<T>, metricName?: string): Promise<T> => {
    const start = performance.now();
    const result = await fn();
    const end = performance.now();
    
    if (metricName) {
      PerformanceMonitor.getInstance().recordMetric(metricName, end - start);
    }
    
    return result;
  },
  
  // 内存使用情况检查
  checkMemoryUsage: (): MemoryInfo | null => {
    if ('memory' in performance) {
      return (performance as any).memory;
    }
    return null;
  },
  
  // 批量处理数据
  batchProcess: <T, R>(
    items: T[],
    processor: (item: T) => R,
    batchSize: number = PERFORMANCE_CONFIG.DATA_LOADING.BATCH_UPDATE_THRESHOLD
  ): R[] => {
    const results: R[] = [];
    
    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      const batchResults = batch.map(processor);
      results.push(...batchResults);
      
      // 让出控制权，避免阻塞UI
      if (i + batchSize < items.length) {
        return new Promise(resolve => {
          setTimeout(() => {
            resolve(results.concat(
              PerformanceUtils.batchProcess(
                items.slice(i + batchSize),
                processor,
                batchSize
              )
            ));
          }, 0);
        }) as any;
      }
    }
    
    return results;
  }
};

// 导出类型定义
export interface PerformanceMetrics {
  renderTime: number;
  dataLoadTime: number;
  updateTime: number;
  memoryUsage?: MemoryInfo;
}

export interface MemoryInfo {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
}