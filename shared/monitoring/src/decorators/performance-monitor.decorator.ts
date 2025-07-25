import { SetMetadata, applyDecorators } from '@nestjs/common';
import { PerformanceMonitorService } from '../services/performance-monitor.service';

/**
 * 性能监控装饰器选项
 */
export interface PerformanceMonitorOptions {
  /** 操作名称，默认使用方法名 */
  operation?: string;
  /** 是否记录参数 */
  logArgs?: boolean;
  /** 是否记录返回值 */
  logResult?: boolean;
  /** 慢查询阈值（毫秒） */
  slowThreshold?: number;
  /** 额外的元数据 */
  metadata?: Record<string, any>;
  /** 是否启用监控 */
  enabled?: boolean;
}

/**
 * 性能监控装饰器元数据键
 */
export const PERFORMANCE_MONITOR_KEY = 'performance_monitor';

/**
 * 性能监控装饰器
 * 用于监控方法的执行性能
 */
export function PerformanceMonitor(options: PerformanceMonitorOptions = {}) {
  return applyDecorators(
    SetMetadata(PERFORMANCE_MONITOR_KEY, options)
  );
}

/**
 * 性能监控方法装饰器
 * 直接应用于方法，无需拦截器
 */
export function MonitorPerformance(options: PerformanceMonitorOptions = {}) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    const operation = options.operation || `${target.constructor.name}.${propertyKey}`;

    descriptor.value = async function (...args: any[]) {
      // 获取性能监控服务实例
      const performanceMonitor = getPerformanceMonitorService(this);
      
      if (!performanceMonitor || options.enabled === false) {
        return originalMethod.apply(this, args);
      }

      const metadata = {
        ...options.metadata,
        className: target.constructor.name,
        methodName: propertyKey,
        ...(options.logArgs && { args: sanitizeArgs(args) })
      };

      const requestId = performanceMonitor.startMonitoring(operation, metadata);
      let error: string | undefined;
      let result: any;

      try {
        result = await originalMethod.apply(this, args);
        
        // 记录返回值（如果启用）
        if (options.logResult && result !== undefined) {
          metadata.result = sanitizeResult(result);
        }
        
        return result;
      } catch (err) {
        error = err instanceof Error ? err.message : String(err);
        throw err;
      } finally {
        const metrics = performanceMonitor.endMonitoring(requestId, error);
        
        // 检查是否为慢查询
        if (metrics && options.slowThreshold && metrics.duration && metrics.duration > options.slowThreshold) {
          console.warn(`慢查询检测: ${operation} 耗时 ${metrics.duration}ms，超过阈值 ${options.slowThreshold}ms`);
        }
      }
    };

    return descriptor;
  };
}

/**
 * 批量操作性能监控装饰器
 */
export function MonitorBatchOperation(options: PerformanceMonitorOptions & {
  /** 批量大小字段名 */
  batchSizeField?: string;
  /** 最大批量大小警告阈值 */
  maxBatchSizeWarning?: number;
} = {}) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    const operation = options.operation || `${target.constructor.name}.${propertyKey}`;

    descriptor.value = async function (...args: any[]) {
      const performanceMonitor = getPerformanceMonitorService(this);
      
      if (!performanceMonitor || options.enabled === false) {
        return originalMethod.apply(this, args);
      }

      // 提取批量大小
      let batchSize = 1;
      if (options.batchSizeField && args.length > 0) {
        const firstArg = args[0];
        if (Array.isArray(firstArg)) {
          batchSize = firstArg.length;
        } else if (typeof firstArg === 'object' && firstArg[options.batchSizeField]) {
          batchSize = Array.isArray(firstArg[options.batchSizeField]) 
            ? firstArg[options.batchSizeField].length 
            : firstArg[options.batchSizeField];
        }
      }

      // 检查批量大小警告
      if (options.maxBatchSizeWarning && batchSize > options.maxBatchSizeWarning) {
        console.warn(`大批量操作警告: ${operation} 批量大小 ${batchSize}，超过建议值 ${options.maxBatchSizeWarning}`);
      }

      const metadata = {
        ...options.metadata,
        className: target.constructor.name,
        methodName: propertyKey,
        batchSize,
        ...(options.logArgs && { args: sanitizeArgs(args) })
      };

      const requestId = performanceMonitor.startMonitoring(operation, metadata);
      let error: string | undefined;
      let result: any;

      try {
        result = await originalMethod.apply(this, args);
        
        if (options.logResult && result !== undefined) {
          metadata.result = sanitizeResult(result);
        }
        
        return result;
      } catch (err) {
        error = err instanceof Error ? err.message : String(err);
        throw err;
      } finally {
        const metrics = performanceMonitor.endMonitoring(requestId, error);
        
        // 计算每项平均时间
        if (metrics && metrics.duration && batchSize > 1) {
          const avgTimePerItem = metrics.duration / batchSize;
          console.log(`批量操作完成: ${operation}, 总耗时: ${metrics.duration}ms, 平均每项: ${avgTimePerItem.toFixed(2)}ms`);
        }
      }
    };

    return descriptor;
  };
}

/**
 * 数据库操作性能监控装饰器
 */
export function MonitorDatabaseOperation(options: PerformanceMonitorOptions & {
  /** 数据库操作类型 */
  operationType?: 'query' | 'insert' | 'update' | 'delete' | 'transaction';
  /** 表名 */
  tableName?: string;
} = {}) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    const operation = options.operation || `DB.${options.operationType || 'query'}.${options.tableName || propertyKey}`;

    descriptor.value = async function (...args: any[]) {
      const performanceMonitor = getPerformanceMonitorService(this);
      
      if (!performanceMonitor || options.enabled === false) {
        return originalMethod.apply(this, args);
      }

      const metadata = {
        ...options.metadata,
        className: target.constructor.name,
        methodName: propertyKey,
        operationType: options.operationType,
        tableName: options.tableName,
        ...(options.logArgs && { args: sanitizeArgs(args) })
      };

      const requestId = performanceMonitor.startMonitoring(operation, metadata);
      let error: string | undefined;
      let result: any;

      try {
        result = await originalMethod.apply(this, args);
        
        // 记录查询结果数量
        if (result && typeof result === 'object') {
          if (Array.isArray(result)) {
            metadata.resultCount = result.length;
          } else if (result.count !== undefined) {
            metadata.resultCount = result.count;
          }
        }
        
        return result;
      } catch (err) {
        error = err instanceof Error ? err.message : String(err);
        throw err;
      } finally {
        const metrics = performanceMonitor.endMonitoring(requestId, error);
        
        // 数据库操作慢查询检测
        const dbSlowThreshold = options.slowThreshold || 100; // 数据库操作默认100ms阈值
        if (metrics && metrics.duration && metrics.duration > dbSlowThreshold) {
          console.warn(`数据库慢查询: ${operation} 耗时 ${metrics.duration}ms`);
        }
      }
    };

    return descriptor;
  };
}

/**
 * 获取性能监控服务实例
 */
function getPerformanceMonitorService(instance: any): PerformanceMonitorService | null {
  // 尝试从实例中获取性能监控服务
  if (instance.performanceMonitor) {
    return instance.performanceMonitor;
  }
  
  // 尝试从模块容器中获取（需要在实际使用时实现）
  // 这里返回null，实际使用时需要通过依赖注入获取
  return null;
}

/**
 * 清理参数，移除敏感信息
 */
function sanitizeArgs(args: any[]): any[] {
  return args.map(arg => {
    if (typeof arg === 'object' && arg !== null) {
      const sanitized = { ...arg };
      
      // 移除常见的敏感字段
      const sensitiveFields = ['password', 'token', 'secret', 'key', 'authorization'];
      sensitiveFields.forEach(field => {
        if (sanitized[field]) {
          sanitized[field] = '[REDACTED]';
        }
      });
      
      return sanitized;
    }
    return arg;
  });
}

/**
 * 清理返回值，移除敏感信息
 */
function sanitizeResult(result: any): any {
  if (typeof result === 'object' && result !== null) {
    if (Array.isArray(result)) {
      return `[Array with ${result.length} items]`;
    }
    
    const sanitized = { ...result };
    
    // 移除常见的敏感字段
    const sensitiveFields = ['password', 'token', 'secret', 'key', 'authorization'];
    sensitiveFields.forEach(field => {
      if (sanitized[field]) {
        sanitized[field] = '[REDACTED]';
      }
    });
    
    return sanitized;
  }
  
  return result;
}
