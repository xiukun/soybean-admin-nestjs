import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EnhancedLoggerService } from '../logging/enhanced-logger.service';
import * as os from 'os';
import * as process from 'process';

export interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  timestamp: Date;
  tags?: Record<string, string>;
  metadata?: Record<string, any>;
}

export interface SystemMetrics {
  cpu: {
    usage: number;
    loadAverage: number[];
    cores: number;
  };
  memory: {
    total: number;
    free: number;
    used: number;
    usagePercent: number;
    heap: {
      total: number;
      used: number;
      usagePercent: number;
    };
  };
  disk: {
    total: number;
    free: number;
    used: number;
    usagePercent: number;
  };
  network: {
    bytesReceived: number;
    bytesSent: number;
  };
  process: {
    pid: number;
    uptime: number;
    memoryUsage: NodeJS.MemoryUsage;
    cpuUsage: NodeJS.CpuUsage;
  };
}

export interface ApplicationMetrics {
  requests: {
    total: number;
    successful: number;
    failed: number;
    averageResponseTime: number;
    requestsPerSecond: number;
  };
  codeGeneration: {
    totalGenerations: number;
    successfulGenerations: number;
    failedGenerations: number;
    averageGenerationTime: number;
  };
  templates: {
    totalTemplates: number;
    compilationErrors: number;
    averageCompilationTime: number;
  };
  database: {
    connections: number;
    queries: number;
    averageQueryTime: number;
    slowQueries: number;
  };
}

@Injectable()
export class PerformanceMonitorService implements OnModuleInit, OnModuleDestroy {
  private readonly metrics: Map<string, PerformanceMetric[]> = new Map();
  private readonly timers: Map<string, NodeJS.Timeout> = new Map();
  private readonly requestMetrics: Map<string, { startTime: number; endTime?: number }> = new Map();
  private readonly operationCounters: Map<string, number> = new Map();
  private readonly operationTimings: Map<string, number[]> = new Map();
  
  private systemMetricsInterval?: NodeJS.Timeout;
  private metricsCleanupInterval?: NodeJS.Timeout;
  
  private readonly enabledMetrics: Set<string>;
  private readonly metricsRetentionDays: number;
  private readonly metricsCollectionInterval: number;

  constructor(
    private readonly configService: ConfigService,
    private readonly logger: EnhancedLoggerService,
  ) {
    this.logger = this.logger.child('PerformanceMonitor');
    
    this.enabledMetrics = new Set(
      this.configService.get('METRICS_ENABLED', 'cpu,memory,requests,database').split(',')
    );
    this.metricsRetentionDays = this.configService.get('METRICS_RETENTION_DAYS', 7);
    this.metricsCollectionInterval = this.configService.get('METRICS_COLLECTION_INTERVAL', 60000);
  }

  async onModuleInit(): Promise<void> {
    this.logger.log('Initializing performance monitoring');
    
    // Start system metrics collection
    if (this.enabledMetrics.has('system')) {
      this.startSystemMetricsCollection();
    }
    
    // Start metrics cleanup
    this.startMetricsCleanup();
    
    this.logger.log('Performance monitoring initialized');
  }

  async onModuleDestroy(): Promise<void> {
    this.logger.log('Shutting down performance monitoring');
    
    // Clear all intervals
    if (this.systemMetricsInterval) {
      clearInterval(this.systemMetricsInterval);
    }
    
    if (this.metricsCleanupInterval) {
      clearInterval(this.metricsCleanupInterval);
    }
    
    // Clear all timers
    this.timers.forEach(timer => clearTimeout(timer));
    this.timers.clear();
    
    this.logger.log('Performance monitoring shut down');
  }

  // Metric recording methods
  recordMetric(metric: PerformanceMetric): void {
    if (!this.metrics.has(metric.name)) {
      this.metrics.set(metric.name, []);
    }
    
    const metricsList = this.metrics.get(metric.name)!;
    metricsList.push(metric);
    
    // Keep only recent metrics to prevent memory leaks
    const maxMetrics = 1000;
    if (metricsList.length > maxMetrics) {
      metricsList.splice(0, metricsList.length - maxMetrics);
    }
  }

  recordCounter(name: string, value: number = 1, tags?: Record<string, string>): void {
    const current = this.operationCounters.get(name) || 0;
    this.operationCounters.set(name, current + value);
    
    this.recordMetric({
      name,
      value: current + value,
      unit: 'count',
      timestamp: new Date(),
      tags,
    });
  }

  recordTiming(name: string, duration: number, tags?: Record<string, string>): void {
    if (!this.operationTimings.has(name)) {
      this.operationTimings.set(name, []);
    }
    
    const timings = this.operationTimings.get(name)!;
    timings.push(duration);
    
    // Keep only recent timings
    if (timings.length > 100) {
      timings.splice(0, timings.length - 100);
    }
    
    this.recordMetric({
      name,
      value: duration,
      unit: 'ms',
      timestamp: new Date(),
      tags,
    });
  }

  recordGauge(name: string, value: number, tags?: Record<string, string>): void {
    this.recordMetric({
      name,
      value,
      unit: 'gauge',
      timestamp: new Date(),
      tags,
    });
  }

  // Request tracking
  startRequest(requestId: string): void {
    this.requestMetrics.set(requestId, {
      startTime: Date.now(),
    });
  }

  endRequest(requestId: string, success: boolean = true): void {
    const request = this.requestMetrics.get(requestId);
    if (!request) return;
    
    const endTime = Date.now();
    const duration = endTime - request.startTime;
    
    request.endTime = endTime;
    
    this.recordTiming('request_duration', duration, {
      success: success.toString(),
    });
    
    this.recordCounter('requests_total', 1, {
      success: success.toString(),
    });
    
    // Clean up
    this.requestMetrics.delete(requestId);
  }

  // Operation timing
  startTimer(operationName: string): () => void {
    const startTime = Date.now();
    
    return () => {
      const duration = Date.now() - startTime;
      this.recordTiming(operationName, duration);
      
      this.logger.logPerformance({
        operation: operationName,
        duration,
        memoryUsage: process.memoryUsage(),
        timestamp: new Date(),
      });
    };
  }

  // System metrics collection
  private startSystemMetricsCollection(): void {
    this.systemMetricsInterval = setInterval(() => {
      this.collectSystemMetrics();
    }, this.metricsCollectionInterval);
    
    // Collect initial metrics
    this.collectSystemMetrics();
  }

  private collectSystemMetrics(): void {
    try {
      const metrics = this.getSystemMetrics();
      
      // Record CPU metrics
      this.recordGauge('system_cpu_usage', metrics.cpu.usage, { type: 'system' });
      this.recordGauge('system_cpu_cores', metrics.cpu.cores, { type: 'system' });
      
      // Record memory metrics
      this.recordGauge('system_memory_total', metrics.memory.total, { type: 'system' });
      this.recordGauge('system_memory_used', metrics.memory.used, { type: 'system' });
      this.recordGauge('system_memory_usage_percent', metrics.memory.usagePercent, { type: 'system' });
      
      // Record process metrics
      this.recordGauge('process_memory_heap_used', metrics.memory.heap.used, { type: 'process' });
      this.recordGauge('process_memory_heap_total', metrics.memory.heap.total, { type: 'process' });
      this.recordGauge('process_uptime', metrics.process.uptime, { type: 'process' });
      
    } catch (error) {
      this.logger.error('Failed to collect system metrics', error.stack);
    }
  }

  getSystemMetrics(): SystemMetrics {
    const memoryUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();
    
    return {
      cpu: {
        usage: this.getCpuUsage(),
        loadAverage: os.loadavg(),
        cores: os.cpus().length,
      },
      memory: {
        total: os.totalmem(),
        free: os.freemem(),
        used: os.totalmem() - os.freemem(),
        usagePercent: ((os.totalmem() - os.freemem()) / os.totalmem()) * 100,
        heap: {
          total: memoryUsage.heapTotal,
          used: memoryUsage.heapUsed,
          usagePercent: (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100,
        },
      },
      disk: {
        total: 0, // Would need additional library for disk metrics
        free: 0,
        used: 0,
        usagePercent: 0,
      },
      network: {
        bytesReceived: 0, // Would need additional library for network metrics
        bytesSent: 0,
      },
      process: {
        pid: process.pid,
        uptime: process.uptime(),
        memoryUsage,
        cpuUsage,
      },
    };
  }

  getApplicationMetrics(): ApplicationMetrics {
    const requestsTotal = this.operationCounters.get('requests_total') || 0;
    const requestsSuccessful = this.operationCounters.get('requests_successful') || 0;
    const requestsFailed = requestsTotal - requestsSuccessful;
    
    const requestTimings = this.operationTimings.get('request_duration') || [];
    const averageResponseTime = requestTimings.length > 0 
      ? requestTimings.reduce((sum, time) => sum + time, 0) / requestTimings.length 
      : 0;
    
    return {
      requests: {
        total: requestsTotal,
        successful: requestsSuccessful,
        failed: requestsFailed,
        averageResponseTime,
        requestsPerSecond: this.calculateRequestsPerSecond(),
      },
      codeGeneration: {
        totalGenerations: this.operationCounters.get('code_generation_total') || 0,
        successfulGenerations: this.operationCounters.get('code_generation_successful') || 0,
        failedGenerations: this.operationCounters.get('code_generation_failed') || 0,
        averageGenerationTime: this.getAverageOperationTime('code_generation'),
      },
      templates: {
        totalTemplates: this.operationCounters.get('templates_total') || 0,
        compilationErrors: this.operationCounters.get('template_compilation_errors') || 0,
        averageCompilationTime: this.getAverageOperationTime('template_compilation'),
      },
      database: {
        connections: this.operationCounters.get('database_connections') || 0,
        queries: this.operationCounters.get('database_queries') || 0,
        averageQueryTime: this.getAverageOperationTime('database_query'),
        slowQueries: this.operationCounters.get('database_slow_queries') || 0,
      },
    };
  }

  // Utility methods
  private getCpuUsage(): number {
    // Simple CPU usage calculation
    const cpus = os.cpus();
    let totalIdle = 0;
    let totalTick = 0;
    
    cpus.forEach(cpu => {
      for (const type in cpu.times) {
        totalTick += cpu.times[type as keyof typeof cpu.times];
      }
      totalIdle += cpu.times.idle;
    });
    
    return 100 - (totalIdle / totalTick) * 100;
  }

  private calculateRequestsPerSecond(): number {
    const now = Date.now();
    const oneSecondAgo = now - 1000;
    
    const recentRequests = this.metrics.get('requests_total')?.filter(
      metric => metric.timestamp.getTime() > oneSecondAgo
    ) || [];
    
    return recentRequests.length;
  }

  private getAverageOperationTime(operationName: string): number {
    const timings = this.operationTimings.get(operationName) || [];
    return timings.length > 0 
      ? timings.reduce((sum, time) => sum + time, 0) / timings.length 
      : 0;
  }

  private startMetricsCleanup(): void {
    this.metricsCleanupInterval = setInterval(() => {
      this.cleanupOldMetrics();
    }, 60000); // Clean up every minute
  }

  private cleanupOldMetrics(): void {
    const cutoffTime = new Date();
    cutoffTime.setDate(cutoffTime.getDate() - this.metricsRetentionDays);
    
    this.metrics.forEach((metricsList, name) => {
      const filteredMetrics = metricsList.filter(
        metric => metric.timestamp > cutoffTime
      );
      this.metrics.set(name, filteredMetrics);
    });
  }

  // Public API for retrieving metrics
  getMetrics(name?: string): PerformanceMetric[] {
    if (name) {
      return this.metrics.get(name) || [];
    }
    
    const allMetrics: PerformanceMetric[] = [];
    this.metrics.forEach(metricsList => {
      allMetrics.push(...metricsList);
    });
    
    return allMetrics.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  getMetricsSummary(): {
    totalMetrics: number;
    metricNames: string[];
    oldestMetric?: Date;
    newestMetric?: Date;
  } {
    const allMetrics = this.getMetrics();
    const metricNames = Array.from(this.metrics.keys());
    
    return {
      totalMetrics: allMetrics.length,
      metricNames,
      oldestMetric: allMetrics.length > 0 ? allMetrics[allMetrics.length - 1].timestamp : undefined,
      newestMetric: allMetrics.length > 0 ? allMetrics[0].timestamp : undefined,
    };
  }

  // Health check
  getHealthStatus(): {
    status: 'healthy' | 'degraded' | 'unhealthy';
    details: Record<string, any>;
  } {
    const systemMetrics = this.getSystemMetrics();
    const appMetrics = this.getApplicationMetrics();
    
    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    const details: Record<string, any> = {};
    
    // Check CPU usage
    if (systemMetrics.cpu.usage > 90) {
      status = 'unhealthy';
      details.cpu = 'High CPU usage';
    } else if (systemMetrics.cpu.usage > 70) {
      status = 'degraded';
      details.cpu = 'Moderate CPU usage';
    }
    
    // Check memory usage
    if (systemMetrics.memory.usagePercent > 90) {
      status = 'unhealthy';
      details.memory = 'High memory usage';
    } else if (systemMetrics.memory.usagePercent > 70) {
      status = 'degraded';
      details.memory = 'Moderate memory usage';
    }
    
    // Check error rates
    const errorRate = appMetrics.requests.total > 0 
      ? (appMetrics.requests.failed / appMetrics.requests.total) * 100 
      : 0;
    
    if (errorRate > 10) {
      status = 'unhealthy';
      details.errorRate = 'High error rate';
    } else if (errorRate > 5) {
      status = 'degraded';
      details.errorRate = 'Moderate error rate';
    }
    
    return { status, details };
  }
}
