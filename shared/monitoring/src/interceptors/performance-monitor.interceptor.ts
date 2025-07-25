import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { Request, Response } from 'express';
import { PerformanceMonitorService } from '../services/performance-monitor.service';
import { PERFORMANCE_MONITOR_KEY, PerformanceMonitorOptions } from '../decorators/performance-monitor.decorator';

/**
 * 性能监控拦截器
 * 自动监控所有HTTP请求的性能
 */
@Injectable()
export class PerformanceMonitorInterceptor implements NestInterceptor {
  private readonly logger = new Logger(PerformanceMonitorInterceptor.name);

  constructor(
    private readonly performanceMonitor: PerformanceMonitorService,
    private readonly reflector: Reflector,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const contextType = context.getType();
    
    // 只处理HTTP请求
    if (contextType !== 'http') {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();
    const handler = context.getHandler();
    const controller = context.getClass();

    // 获取装饰器选项
    const options = this.reflector.get<PerformanceMonitorOptions>(
      PERFORMANCE_MONITOR_KEY,
      handler,
    ) || {};

    // 如果明确禁用监控，则跳过
    if (options.enabled === false) {
      return next.handle();
    }

    // 构建操作名称
    const controllerName = controller.name;
    const handlerName = handler.name;
    const operation = options.operation || `${controllerName}.${handlerName}`;

    // 提取请求信息
    const requestInfo = this.extractRequestInfo(request);
    
    const metadata = {
      ...options.metadata,
      ...requestInfo,
      controllerName,
      handlerName,
    };

    // 开始监控
    const requestId = this.performanceMonitor.startMonitoring(operation, metadata);

    // 记录请求开始
    this.logger.debug(`开始处理请求: ${operation} [${requestId}]`);

    return next.handle().pipe(
      tap((data) => {
        // 请求成功完成
        const metrics = this.performanceMonitor.endMonitoring(requestId);
        
        if (metrics) {
          // 设置响应头
          this.setPerformanceHeaders(response, metrics);
          
          // 记录成功日志
          this.logRequestCompletion(operation, metrics, requestInfo, false);
          
          // 检查慢请求
          this.checkSlowRequest(operation, metrics, options);
        }
      }),
      catchError((error) => {
        // 请求失败
        const errorMessage = error instanceof Error ? error.message : String(error);
        const metrics = this.performanceMonitor.endMonitoring(requestId, errorMessage);
        
        if (metrics) {
          // 设置响应头
          this.setPerformanceHeaders(response, metrics);
          
          // 记录错误日志
          this.logRequestCompletion(operation, metrics, requestInfo, true, errorMessage);
        }

        return throwError(() => error);
      }),
    );
  }

  /**
   * 提取请求信息
   */
  private extractRequestInfo(request: Request) {
    return {
      method: request.method,
      url: request.url,
      path: request.path,
      userAgent: request.get('User-Agent'),
      ip: request.ip || request.connection.remoteAddress,
      contentLength: request.get('Content-Length') ? parseInt(request.get('Content-Length')!, 10) : 0,
      queryParams: Object.keys(request.query).length > 0 ? request.query : undefined,
      hasBody: request.method !== 'GET' && request.method !== 'HEAD',
    };
  }

  /**
   * 设置性能相关的响应头
   */
  private setPerformanceHeaders(response: Response, metrics: any) {
    if (metrics.duration) {
      response.setHeader('X-Response-Time', `${metrics.duration}ms`);
    }
    
    if (metrics.requestId) {
      response.setHeader('X-Request-ID', metrics.requestId);
    }

    // 添加服务器时间戳
    response.setHeader('X-Server-Time', new Date().toISOString());
  }

  /**
   * 记录请求完成日志
   */
  private logRequestCompletion(
    operation: string,
    metrics: any,
    requestInfo: any,
    isError: boolean,
    errorMessage?: string,
  ) {
    const { method, url, ip, userAgent } = requestInfo;
    const duration = metrics.duration || 0;
    const memoryUsed = metrics.memoryUsage?.heapUsed || 0;

    const logMessage = [
      `${method} ${url}`,
      `${duration}ms`,
      `${Math.round(memoryUsed / 1024 / 1024)}MB`,
      `IP: ${ip}`,
      isError ? `ERROR: ${errorMessage}` : 'SUCCESS',
    ].join(' | ');

    if (isError) {
      this.logger.error(`${operation} - ${logMessage}`);
    } else if (duration > 1000) {
      this.logger.warn(`${operation} - SLOW REQUEST - ${logMessage}`);
    } else {
      this.logger.log(`${operation} - ${logMessage}`);
    }
  }

  /**
   * 检查慢请求
   */
  private checkSlowRequest(
    operation: string,
    metrics: any,
    options: PerformanceMonitorOptions,
  ) {
    const duration = metrics.duration || 0;
    const slowThreshold = options.slowThreshold || 1000; // 默认1秒

    if (duration > slowThreshold) {
      this.logger.warn(
        `慢请求检测: ${operation} 耗时 ${duration}ms，超过阈值 ${slowThreshold}ms`,
      );

      // 可以在这里添加告警逻辑
      this.sendSlowRequestAlert(operation, duration, slowThreshold, metrics);
    }
  }

  /**
   * 发送慢请求告警
   */
  private sendSlowRequestAlert(
    operation: string,
    duration: number,
    threshold: number,
    metrics: any,
  ) {
    // 这里可以集成告警系统，如钉钉、邮件等
    const alertData = {
      type: 'slow_request',
      operation,
      duration,
      threshold,
      timestamp: new Date().toISOString(),
      requestId: metrics.requestId,
      memoryUsage: metrics.memoryUsage,
      cpuUsage: metrics.cpuUsage,
    };

    // 示例：输出到控制台（实际使用时应该发送到告警系统）
    console.warn('🚨 慢请求告警:', JSON.stringify(alertData, null, 2));
  }
}

/**
 * 全局性能监控拦截器
 * 监控所有请求，无需装饰器
 */
@Injectable()
export class GlobalPerformanceMonitorInterceptor implements NestInterceptor {
  private readonly logger = new Logger(GlobalPerformanceMonitorInterceptor.name);

  constructor(private readonly performanceMonitor: PerformanceMonitorService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const contextType = context.getType();
    
    // 只处理HTTP请求
    if (contextType !== 'http') {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();
    const handler = context.getHandler();
    const controller = context.getClass();

    // 构建操作名称
    const operation = `${controller.name}.${handler.name}`;
    
    // 提取基本请求信息
    const metadata = {
      method: request.method,
      url: request.url,
      userAgent: request.get('User-Agent'),
      ip: request.ip,
    };

    // 开始监控
    const requestId = this.performanceMonitor.startMonitoring(operation, metadata);

    return next.handle().pipe(
      tap(() => {
        // 请求成功
        const metrics = this.performanceMonitor.endMonitoring(requestId);
        this.setBasicHeaders(response, metrics);
      }),
      catchError((error) => {
        // 请求失败
        const errorMessage = error instanceof Error ? error.message : String(error);
        const metrics = this.performanceMonitor.endMonitoring(requestId, errorMessage);
        this.setBasicHeaders(response, metrics);
        return throwError(() => error);
      }),
    );
  }

  /**
   * 设置基本的性能响应头
   */
  private setBasicHeaders(response: Response, metrics: any) {
    if (metrics?.duration) {
      response.setHeader('X-Response-Time', `${metrics.duration}ms`);
    }
    if (metrics?.requestId) {
      response.setHeader('X-Request-ID', metrics.requestId);
    }
  }
}

/**
 * 数据库操作性能监控拦截器
 */
@Injectable()
export class DatabasePerformanceMonitorInterceptor implements NestInterceptor {
  private readonly logger = new Logger(DatabasePerformanceMonitorInterceptor.name);

  constructor(private readonly performanceMonitor: PerformanceMonitorService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const handler = context.getHandler();
    const controller = context.getClass();
    
    // 只监控包含数据库操作关键词的方法
    const methodName = handler.name.toLowerCase();
    const isDatabaseOperation = ['find', 'create', 'update', 'delete', 'save', 'query'].some(
      keyword => methodName.includes(keyword)
    );

    if (!isDatabaseOperation) {
      return next.handle();
    }

    const operation = `DB.${controller.name}.${handler.name}`;
    const requestId = this.performanceMonitor.startMonitoring(operation, {
      type: 'database',
      controller: controller.name,
      method: handler.name,
    });

    return next.handle().pipe(
      tap((result) => {
        const metrics = this.performanceMonitor.endMonitoring(requestId);
        
        // 记录数据库操作结果
        if (metrics && metrics.duration) {
          let resultInfo = '';
          if (Array.isArray(result)) {
            resultInfo = `返回 ${result.length} 条记录`;
          } else if (result && typeof result === 'object' && result.count !== undefined) {
            resultInfo = `影响 ${result.count} 条记录`;
          }
          
          this.logger.debug(`数据库操作完成: ${operation} - ${metrics.duration}ms ${resultInfo}`);
          
          // 数据库慢查询检测
          if (metrics.duration > 100) {
            this.logger.warn(`数据库慢查询: ${operation} - ${metrics.duration}ms`);
          }
        }
      }),
      catchError((error) => {
        const errorMessage = error instanceof Error ? error.message : String(error);
        this.performanceMonitor.endMonitoring(requestId, errorMessage);
        this.logger.error(`数据库操作失败: ${operation} - ${errorMessage}`);
        return throwError(() => error);
      }),
    );
  }
}
