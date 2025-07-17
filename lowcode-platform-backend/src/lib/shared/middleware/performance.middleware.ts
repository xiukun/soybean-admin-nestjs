import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { FastifyRequest, FastifyReply } from 'fastify';
import * as prometheus from 'prom-client';

@Injectable()
export class PerformanceMiddleware implements NestMiddleware {
  private readonly logger = new Logger(PerformanceMiddleware.name);

  // Prometheus metrics
  private readonly httpRequestDuration = new prometheus.Histogram({
    name: 'http_request_duration_seconds',
    help: 'Duration of HTTP requests in seconds',
    labelNames: ['method', 'route', 'status_code'],
    buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10],
  });

  private readonly httpRequestTotal = new prometheus.Counter({
    name: 'http_requests_total',
    help: 'Total number of HTTP requests',
    labelNames: ['method', 'route', 'status_code'],
  });

  private readonly httpRequestSize = new prometheus.Histogram({
    name: 'http_request_size_bytes',
    help: 'Size of HTTP requests in bytes',
    labelNames: ['method', 'route'],
    buckets: [100, 1000, 10000, 100000, 1000000],
  });

  private readonly httpResponseSize = new prometheus.Histogram({
    name: 'http_response_size_bytes',
    help: 'Size of HTTP responses in bytes',
    labelNames: ['method', 'route', 'status_code'],
    buckets: [100, 1000, 10000, 100000, 1000000],
  });

  private readonly activeConnections = new prometheus.Gauge({
    name: 'http_active_connections',
    help: 'Number of active HTTP connections',
  });

  private readonly memoryUsage = new prometheus.Gauge({
    name: 'nodejs_memory_usage_bytes',
    help: 'Node.js memory usage in bytes',
    labelNames: ['type'],
  });

  private readonly cpuUsage = new prometheus.Gauge({
    name: 'nodejs_cpu_usage_percent',
    help: 'Node.js CPU usage percentage',
  });

  constructor() {
    // Start collecting default metrics
    prometheus.collectDefaultMetrics({
      prefix: 'lowcode_platform_',
      timeout: 5000,
    });

    // Start memory and CPU monitoring
    this.startSystemMonitoring();
  }

  use(req: FastifyRequest, res: FastifyReply, next: Function) {
    const startTime = Date.now();
    const startHrTime = process.hrtime();

    // Increment active connections
    this.activeConnections.inc();

    // Get request size
    const requestSize = this.getRequestSize(req);
    if (requestSize > 0) {
      this.httpRequestSize
        .labels(req.method, this.getRoute(req))
        .observe(requestSize);
    }

    // Hook into response completion for Fastify
    res.raw.on('finish', () => {
      const endTime = Date.now();
      const duration = (endTime - startTime) / 1000;
      const hrDuration = process.hrtime(startHrTime);
      const durationInSeconds = hrDuration[0] + hrDuration[1] / 1e9;

      const route = this.getRoute(req);
      const statusCode = res.raw.statusCode.toString();

      // Record metrics
      this.httpRequestDuration
        .labels(req.method, route, statusCode)
        .observe(durationInSeconds);

      this.httpRequestTotal
        .labels(req.method, route, statusCode)
        .inc();

      // Get response size
      const responseSize = this.getResponseSize(res);
      if (responseSize > 0) {
        this.httpResponseSize
          .labels(req.method, route, statusCode)
          .observe(responseSize);
      }

      // Decrement active connections
      this.activeConnections.dec();

      // Log slow requests
      if (duration > 1) {
        this.logger.warn(`Slow request detected: ${req.method} ${req.url} - ${duration}s`);
      }

      // Log performance metrics for debugging
      if (process.env.NODE_ENV === 'development') {
        this.logger.debug(`${req.method} ${req.url} - ${statusCode} - ${duration}ms`);
      }
    });

    next();
  }

  private getRoute(req: FastifyRequest): string {
    // Try to get the route pattern from the request
    if (req.routerPath) {
      return req.routerPath;
    }

    // Fallback to URL path with parameter normalization
    let path = req.url;

    // Replace UUIDs with :id
    path = path.replace(/\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, '/:id');

    // Replace numeric IDs with :id
    path = path.replace(/\/\d+/g, '/:id');

    return path;
  }

  private getRequestSize(req: FastifyRequest): number {
    const contentLength = req.headers['content-length'];
    return contentLength ? parseInt(contentLength as string, 10) : 0;
  }

  private getResponseSize(res: FastifyReply): number {
    const contentLength = res.getHeader('content-length');
    if (contentLength) {
      return parseInt(contentLength as string, 10);
    }

    // For Fastify, we can try to get the response size from the raw response
    const rawRes = res.raw;
    if (rawRes && rawRes.getHeader) {
      const rawContentLength = rawRes.getHeader('content-length');
      if (rawContentLength) {
        return parseInt(rawContentLength as string, 10);
      }
    }

    return 0;
  }

  private startSystemMonitoring() {
    // Monitor memory usage every 30 seconds
    setInterval(() => {
      const memUsage = process.memoryUsage();
      this.memoryUsage.labels('rss').set(memUsage.rss);
      this.memoryUsage.labels('heapTotal').set(memUsage.heapTotal);
      this.memoryUsage.labels('heapUsed').set(memUsage.heapUsed);
      this.memoryUsage.labels('external').set(memUsage.external);
    }, 30000);

    // Monitor CPU usage every 10 seconds
    let lastCpuUsage = process.cpuUsage();
    setInterval(() => {
      const currentCpuUsage = process.cpuUsage(lastCpuUsage);
      const totalUsage = currentCpuUsage.user + currentCpuUsage.system;
      const cpuPercent = (totalUsage / 1000000) * 100; // Convert to percentage
      
      this.cpuUsage.set(cpuPercent);
      lastCpuUsage = process.cpuUsage();
    }, 10000);
  }

  // Method to get current metrics (for health checks or debugging)
  getMetrics(): string {
    return prometheus.register.metrics();
  }

  // Method to get specific metric values
  async getMetricValues() {
    const metrics = await prometheus.register.getMetricsAsJSON();
    
    return {
      httpRequests: {
        total: this.getMetricValue(metrics, 'http_requests_total'),
        duration: this.getMetricValue(metrics, 'http_request_duration_seconds'),
      },
      system: {
        memory: this.getMetricValue(metrics, 'nodejs_memory_usage_bytes'),
        cpu: this.getMetricValue(metrics, 'nodejs_cpu_usage_percent'),
        activeConnections: this.getMetricValue(metrics, 'http_active_connections'),
      },
      timestamp: new Date().toISOString(),
    };
  }

  private getMetricValue(metrics: any[], metricName: string) {
    const metric = metrics.find(m => m.name === metricName);
    return metric ? metric.values : null;
  }

  // Method to reset metrics (useful for testing)
  resetMetrics() {
    prometheus.register.resetMetrics();
  }

  // Method to create custom metrics for specific operations
  createCustomTimer(name: string, help: string, labels: string[] = []) {
    return new prometheus.Histogram({
      name: `lowcode_${name}_duration_seconds`,
      help,
      labelNames: labels,
      buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5],
    });
  }

  createCustomCounter(name: string, help: string, labels: string[] = []) {
    return new prometheus.Counter({
      name: `lowcode_${name}_total`,
      help,
      labelNames: labels,
    });
  }

  createCustomGauge(name: string, help: string, labels: string[] = []) {
    return new prometheus.Gauge({
      name: `lowcode_${name}`,
      help,
      labelNames: labels,
    });
  }
}

// Performance monitoring decorator
export function MonitorPerformance(metricName: string) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;
    const timer = new prometheus.Histogram({
      name: `lowcode_${metricName}_duration_seconds`,
      help: `Duration of ${metricName} operations`,
      labelNames: ['method', 'status'],
    });

    descriptor.value = async function (...args: any[]) {
      const startTime = Date.now();
      let status = 'success';

      try {
        const result = await method.apply(this, args);
        return result;
      } catch (error) {
        status = 'error';
        throw error;
      } finally {
        const duration = (Date.now() - startTime) / 1000;
        timer.labels(propertyName, status).observe(duration);
      }
    };

    return descriptor;
  };
}

// Database query performance monitoring
export class DatabasePerformanceMonitor {
  private static queryTimer = new prometheus.Histogram({
    name: 'lowcode_database_query_duration_seconds',
    help: 'Duration of database queries',
    labelNames: ['operation', 'table', 'status'],
    buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 2],
  });

  private static queryCounter = new prometheus.Counter({
    name: 'lowcode_database_queries_total',
    help: 'Total number of database queries',
    labelNames: ['operation', 'table', 'status'],
  });

  static monitorQuery<T>(
    operation: string,
    table: string,
    queryFn: () => Promise<T>
  ): Promise<T> {
    const startTime = Date.now();
    let status = 'success';

    return queryFn()
      .then(result => {
        return result;
      })
      .catch(error => {
        status = 'error';
        throw error;
      })
      .finally(() => {
        const duration = (Date.now() - startTime) / 1000;
        this.queryTimer.labels(operation, table, status).observe(duration);
        this.queryCounter.labels(operation, table, status).inc();
      });
  }
}

// Cache performance monitoring
export class CachePerformanceMonitor {
  private static cacheHits = new prometheus.Counter({
    name: 'lowcode_cache_hits_total',
    help: 'Total number of cache hits',
    labelNames: ['cache_type', 'key_pattern'],
  });

  private static cacheMisses = new prometheus.Counter({
    name: 'lowcode_cache_misses_total',
    help: 'Total number of cache misses',
    labelNames: ['cache_type', 'key_pattern'],
  });

  private static cacheOperationDuration = new prometheus.Histogram({
    name: 'lowcode_cache_operation_duration_seconds',
    help: 'Duration of cache operations',
    labelNames: ['operation', 'cache_type', 'status'],
    buckets: [0.001, 0.005, 0.01, 0.05, 0.1],
  });

  static recordHit(cacheType: string, keyPattern: string) {
    this.cacheHits.labels(cacheType, keyPattern).inc();
  }

  static recordMiss(cacheType: string, keyPattern: string) {
    this.cacheMisses.labels(cacheType, keyPattern).inc();
  }

  static monitorOperation<T>(
    operation: string,
    cacheType: string,
    operationFn: () => Promise<T>
  ): Promise<T> {
    const startTime = Date.now();
    let status = 'success';

    return operationFn()
      .then(result => {
        return result;
      })
      .catch(error => {
        status = 'error';
        throw error;
      })
      .finally(() => {
        const duration = (Date.now() - startTime) / 1000;
        this.cacheOperationDuration.labels(operation, cacheType, status).observe(duration);
      });
  }
}
