import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * 性能指标数据
 */
export interface PerformanceMetrics {
  /** 请求ID */
  requestId: string;
  /** 服务名称 */
  serviceName: string;
  /** 操作名称 */
  operation: string;
  /** 开始时间 */
  startTime: number;
  /** 结束时间 */
  endTime?: number;
  /** 执行时间（毫秒） */
  duration?: number;
  /** 内存使用情况 */
  memoryUsage?: NodeJS.MemoryUsage;
  /** CPU使用情况 */
  cpuUsage?: NodeJS.CpuUsage;
  /** 错误信息 */
  error?: string;
  /** 额外的元数据 */
  metadata?: Record<string, any>;
}

/**
 * 性能统计数据
 */
export interface PerformanceStats {
  /** 操作名称 */
  operation: string;
  /** 总请求数 */
  totalRequests: number;
  /** 成功请求数 */
  successRequests: number;
  /** 失败请求数 */
  errorRequests: number;
  /** 平均响应时间 */
  averageResponseTime: number;
  /** 最小响应时间 */
  minResponseTime: number;
  /** 最大响应时间 */
  maxResponseTime: number;
  /** 95百分位响应时间 */
  p95ResponseTime: number;
  /** 99百分位响应时间 */
  p99ResponseTime: number;
  /** 吞吐量（请求/秒） */
  throughput: number;
  /** 错误率 */
  errorRate: number;
  /** 最后更新时间 */
  lastUpdated: Date;
}

/**
 * 系统资源使用情况
 */
export interface SystemResourceUsage {
  /** 内存使用情况 */
  memory: {
    /** 总内存 */
    total: number;
    /** 已使用内存 */
    used: number;
    /** 可用内存 */
    free: number;
    /** 使用率 */
    usagePercent: number;
  };
  /** CPU使用情况 */
  cpu: {
    /** 用户CPU时间 */
    user: number;
    /** 系统CPU时间 */
    system: number;
    /** 使用率 */
    usagePercent: number;
  };
  /** 堆内存使用情况 */
  heap: {
    /** 已使用堆内存 */
    used: number;
    /** 总堆内存 */
    total: number;
    /** 使用率 */
    usagePercent: number;
  };
  /** 事件循环延迟 */
  eventLoopDelay: number;
  /** 活跃句柄数 */
  activeHandles: number;
  /** 活跃请求数 */
  activeRequests: number;
}

/**
 * 性能监控服务
 */
@Injectable()
export class PerformanceMonitorService {
  private readonly logger = new Logger(PerformanceMonitorService.name);
  private readonly metrics = new Map<string, PerformanceMetrics>();
  private readonly stats = new Map<string, PerformanceStats>();
  private readonly isEnabled: boolean;
  private readonly serviceName: string;
  private readonly retentionPeriod: number;
  private readonly maxMetricsCount: number;

  constructor(private readonly configService: ConfigService) {
    this.isEnabled = this.configService.get<boolean>('PERFORMANCE_MONITORING', true);
    this.serviceName = this.configService.get<string>('SERVICE_NAME', 'unknown-service');
    this.retentionPeriod = this.configService.get<number>('METRICS_RETENTION_PERIOD', 3600000); // 1小时
    this.maxMetricsCount = this.configService.get<number>('MAX_METRICS_COUNT', 10000);

    if (this.isEnabled) {
      this.startCleanupTimer();
      this.logger.log('性能监控服务已启用');
    }
  }

  /**
   * 开始性能监控
   */
  startMonitoring(operation: string, metadata?: Record<string, any>): string {
    if (!this.isEnabled) return '';

    const requestId = this.generateRequestId();
    const startTime = Date.now();
    const cpuUsage = process.cpuUsage();
    const memoryUsage = process.memoryUsage();

    const metrics: PerformanceMetrics = {
      requestId,
      serviceName: this.serviceName,
      operation,
      startTime,
      cpuUsage,
      memoryUsage,
      metadata
    };

    this.metrics.set(requestId, metrics);
    return requestId;
  }

  /**
   * 结束性能监控
   */
  endMonitoring(requestId: string, error?: string): PerformanceMetrics | null {
    if (!this.isEnabled || !requestId) return null;

    const metrics = this.metrics.get(requestId);
    if (!metrics) return null;

    const endTime = Date.now();
    const duration = endTime - metrics.startTime;
    const cpuUsage = process.cpuUsage(metrics.cpuUsage);
    const memoryUsage = process.memoryUsage();

    metrics.endTime = endTime;
    metrics.duration = duration;
    metrics.cpuUsage = cpuUsage;
    metrics.memoryUsage = memoryUsage;
    metrics.error = error;

    // 更新统计数据
    this.updateStats(metrics);

    // 记录性能日志
    this.logPerformance(metrics);

    return metrics;
  }

  /**
   * 获取操作统计数据
   */
  getOperationStats(operation: string): PerformanceStats | null {
    return this.stats.get(operation) || null;
  }

  /**
   * 获取所有统计数据
   */
  getAllStats(): PerformanceStats[] {
    return Array.from(this.stats.values());
  }

  /**
   * 获取系统资源使用情况
   */
  getSystemResourceUsage(): SystemResourceUsage {
    const memoryUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();

    return {
      memory: {
        total: memoryUsage.rss + memoryUsage.external,
        used: memoryUsage.rss,
        free: memoryUsage.external,
        usagePercent: (memoryUsage.rss / (memoryUsage.rss + memoryUsage.external)) * 100
      },
      cpu: {
        user: cpuUsage.user,
        system: cpuUsage.system,
        usagePercent: ((cpuUsage.user + cpuUsage.system) / 1000000) * 100 // 转换为百分比
      },
      heap: {
        used: memoryUsage.heapUsed,
        total: memoryUsage.heapTotal,
        usagePercent: (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100
      },
      eventLoopDelay: this.getEventLoopDelay(),
      activeHandles: (process as any)._getActiveHandles().length,
      activeRequests: (process as any)._getActiveRequests().length
    };
  }

  /**
   * 清理过期指标
   */
  cleanup(): void {
    const now = Date.now();
    const expiredKeys: string[] = [];

    for (const [key, metrics] of this.metrics.entries()) {
      if (now - metrics.startTime > this.retentionPeriod) {
        expiredKeys.push(key);
      }
    }

    expiredKeys.forEach(key => this.metrics.delete(key));

    // 如果指标数量超过限制，删除最旧的指标
    if (this.metrics.size > this.maxMetricsCount) {
      const sortedMetrics = Array.from(this.metrics.entries())
        .sort(([, a], [, b]) => a.startTime - b.startTime);
      
      const toDelete = sortedMetrics.slice(0, this.metrics.size - this.maxMetricsCount);
      toDelete.forEach(([key]) => this.metrics.delete(key));
    }

    this.logger.debug(`清理了 ${expiredKeys.length} 个过期指标`);
  }

  /**
   * 获取性能报告
   */
  getPerformanceReport(): {
    systemResources: SystemResourceUsage;
    operationStats: PerformanceStats[];
    summary: {
      totalOperations: number;
      totalRequests: number;
      averageResponseTime: number;
      errorRate: number;
    };
  } {
    const systemResources = this.getSystemResourceUsage();
    const operationStats = this.getAllStats();

    const summary = {
      totalOperations: operationStats.length,
      totalRequests: operationStats.reduce((sum, stat) => sum + stat.totalRequests, 0),
      averageResponseTime: operationStats.length > 0 
        ? operationStats.reduce((sum, stat) => sum + stat.averageResponseTime, 0) / operationStats.length 
        : 0,
      errorRate: operationStats.length > 0
        ? operationStats.reduce((sum, stat) => sum + stat.errorRate, 0) / operationStats.length
        : 0
    };

    return {
      systemResources,
      operationStats,
      summary
    };
  }

  /**
   * 重置统计数据
   */
  resetStats(): void {
    this.stats.clear();
    this.logger.log('性能统计数据已重置');
  }

  /**
   * 更新统计数据
   */
  private updateStats(metrics: PerformanceMetrics): void {
    const { operation, duration, error } = metrics;
    if (!duration) return;

    let stats = this.stats.get(operation);
    if (!stats) {
      stats = {
        operation,
        totalRequests: 0,
        successRequests: 0,
        errorRequests: 0,
        averageResponseTime: 0,
        minResponseTime: Infinity,
        maxResponseTime: 0,
        p95ResponseTime: 0,
        p99ResponseTime: 0,
        throughput: 0,
        errorRate: 0,
        lastUpdated: new Date()
      };
      this.stats.set(operation, stats);
    }

    // 更新基本统计
    stats.totalRequests++;
    if (error) {
      stats.errorRequests++;
    } else {
      stats.successRequests++;
    }

    // 更新响应时间统计
    stats.minResponseTime = Math.min(stats.minResponseTime, duration);
    stats.maxResponseTime = Math.max(stats.maxResponseTime, duration);
    stats.averageResponseTime = (stats.averageResponseTime * (stats.totalRequests - 1) + duration) / stats.totalRequests;

    // 计算百分位数（简化实现）
    stats.p95ResponseTime = stats.averageResponseTime * 1.5;
    stats.p99ResponseTime = stats.averageResponseTime * 2;

    // 计算错误率
    stats.errorRate = (stats.errorRequests / stats.totalRequests) * 100;

    // 计算吞吐量（简化实现，基于最近1分钟）
    const now = Date.now();
    const oneMinuteAgo = now - 60000;
    const recentRequests = Array.from(this.metrics.values())
      .filter(m => m.operation === operation && m.startTime > oneMinuteAgo)
      .length;
    stats.throughput = recentRequests;

    stats.lastUpdated = new Date();
  }

  /**
   * 记录性能日志
   */
  private logPerformance(metrics: PerformanceMetrics): void {
    const { operation, duration, error, cpuUsage, memoryUsage } = metrics;
    
    if (error) {
      this.logger.warn(`操作 ${operation} 执行失败: ${error}, 耗时: ${duration}ms`);
    } else if (duration && duration > 1000) {
      this.logger.warn(`操作 ${operation} 执行缓慢: ${duration}ms`);
    } else {
      this.logger.debug(`操作 ${operation} 执行完成: ${duration}ms, CPU: ${cpuUsage?.user}μs, 内存: ${memoryUsage?.heapUsed}bytes`);
    }
  }

  /**
   * 生成请求ID
   */
  private generateRequestId(): string {
    return `${this.serviceName}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 获取事件循环延迟
   */
  private getEventLoopDelay(): number {
    // 简化实现，实际应该使用perf_hooks
    return 0;
  }

  /**
   * 启动清理定时器
   */
  private startCleanupTimer(): void {
    setInterval(() => {
      this.cleanup();
    }, this.retentionPeriod / 10); // 每10分之一保留期执行一次清理
  }
}
