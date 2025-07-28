/**
 * 性能监控工具
 * 用于监控虚拟滚动和搜索性能
 */

interface PerformanceMetric {
  name: string;
  startTime: number;
  endTime?: number;
  duration?: number;
}

class PerformanceMonitor {
  private metrics: Map<string, PerformanceMetric> = new Map();
  private enabled = process.env.NODE_ENV === 'development';

  /**
   * 开始性能测量
   */
  start(name: string): void {
    if (!this.enabled) return;
    
    this.metrics.set(name, {
      name,
      startTime: performance.now()
    });
  }

  /**
   * 结束性能测量
   */
  end(name: string): number | null {
    if (!this.enabled) return null;
    
    const metric = this.metrics.get(name);
    if (!metric) return null;

    const endTime = performance.now();
    const duration = endTime - metric.startTime;
    
    metric.endTime = endTime;
    metric.duration = duration;

    // 输出性能日志
    console.log(`⚡ 性能监控 [${name}]: ${duration.toFixed(2)}ms`);
    
    return duration;
  }

  /**
   * 获取性能报告
   */
  getReport(): PerformanceMetric[] {
    return Array.from(this.metrics.values()).filter(m => m.duration !== undefined);
  }

  /**
   * 清除所有指标
   */
  clear(): void {
    this.metrics.clear();
  }

  /**
   * 监控虚拟滚动性能
   */
  monitorVirtualScroll(callback: () => void): void {
    this.start('virtual-scroll-render');
    callback();
    this.end('virtual-scroll-render');
  }

  /**
   * 监控搜索性能
   */
  monitorSearch(callback: () => Promise<void>): Promise<void> {
    this.start('search-operation');
    return callback().finally(() => {
      this.end('search-operation');
    });
  }

  /**
   * 监控分页性能
   */
  monitorPagination(callback: () => Promise<void>): Promise<void> {
    this.start('pagination-load');
    return callback().finally(() => {
      this.end('pagination-load');
    });
  }
}

export const performanceMonitor = new PerformanceMonitor();

/**
 * 性能装饰器
 */
export function measurePerformance(name: string) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    
    descriptor.value = function (...args: any[]) {
      performanceMonitor.start(`${name}-${propertyKey}`);
      const result = originalMethod.apply(this, args);
      
      if (result instanceof Promise) {
        return result.finally(() => {
          performanceMonitor.end(`${name}-${propertyKey}`);
        });
      } else {
        performanceMonitor.end(`${name}-${propertyKey}`);
        return result;
      }
    };
    
    return descriptor;
  };
}