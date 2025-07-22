import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import * as cls from 'cls-hooked';

// 创建命名空间用于存储请求上下文
const namespace = cls.createNamespace('request-context');

export interface RequestContext {
  traceId: string;
  requestId: string;
  userId?: string;
  userAgent?: string;
  ip?: string;
  startTime: number;
  method: string;
  url: string;
  headers: Record<string, string>;
}

@Injectable()
export class TracingMiddleware implements NestMiddleware {
  private readonly logger = new Logger(TracingMiddleware.name);

  use(req: Request, res: Response, next: NextFunction) {
    // 生成或获取追踪ID
    const traceId = (req.headers['x-trace-id'] as string) || uuidv4();
    const requestId = uuidv4();
    const startTime = Date.now();

    // 创建请求上下文
    const context: RequestContext = {
      traceId,
      requestId,
      userId: req.headers['x-user-id'] as string,
      userAgent: req.headers['user-agent'],
      ip: req.ip || req.connection.remoteAddress,
      startTime,
      method: req.method,
      url: req.url,
      headers: this.sanitizeHeaders(req.headers),
    };

    // 设置响应头
    res.setHeader('X-Trace-ID', traceId);
    res.setHeader('X-Request-ID', requestId);

    // 在命名空间中运行请求处理
    namespace.run(() => {
      // 设置上下文
      namespace.set('context', context);

      // 记录请求开始
      this.logRequestStart(context);

      // 监听响应完成
      res.on('finish', () => {
        this.logRequestEnd(context, res.statusCode, Date.now() - startTime);
      });

      // 监听响应错误
      res.on('error', (error) => {
        this.logRequestError(context, error, Date.now() - startTime);
      });

      next();
    });
  }

  /**
   * 获取当前请求上下文
   */
  static getCurrentContext(): RequestContext | undefined {
    return namespace.get('context');
  }

  /**
   * 获取当前追踪ID
   */
  static getCurrentTraceId(): string | undefined {
    const context = TracingMiddleware.getCurrentContext();
    return context?.traceId;
  }

  /**
   * 获取当前请求ID
   */
  static getCurrentRequestId(): string | undefined {
    const context = TracingMiddleware.getCurrentContext();
    return context?.requestId;
  }

  /**
   * 在当前上下文中执行函数
   */
  static runInContext<T>(fn: () => T): T {
    return namespace.runAndReturn(fn);
  }

  /**
   * 记录请求开始
   */
  private logRequestStart(context: RequestContext) {
    this.logger.log(
      `Request started: ${context.method} ${context.url}`,
      {
        traceId: context.traceId,
        requestId: context.requestId,
        method: context.method,
        url: context.url,
        userAgent: context.userAgent,
        ip: context.ip,
        userId: context.userId,
      }
    );
  }

  /**
   * 记录请求结束
   */
  private logRequestEnd(context: RequestContext, statusCode: number, duration: number) {
    const level = statusCode >= 400 ? 'warn' : 'log';
    
    this.logger[level](
      `Request completed: ${context.method} ${context.url} - ${statusCode} (${duration}ms)`,
      {
        traceId: context.traceId,
        requestId: context.requestId,
        method: context.method,
        url: context.url,
        statusCode,
        duration,
        userId: context.userId,
      }
    );
  }

  /**
   * 记录请求错误
   */
  private logRequestError(context: RequestContext, error: Error, duration: number) {
    this.logger.error(
      `Request error: ${context.method} ${context.url} - ${error.message} (${duration}ms)`,
      error.stack,
      {
        traceId: context.traceId,
        requestId: context.requestId,
        method: context.method,
        url: context.url,
        duration,
        error: {
          name: error.name,
          message: error.message,
        },
        userId: context.userId,
      }
    );
  }

  /**
   * 清理敏感的请求头
   */
  private sanitizeHeaders(headers: any): Record<string, string> {
    const sensitiveHeaders = ['authorization', 'cookie', 'x-api-key', 'x-auth-token'];
    const sanitized: Record<string, string> = {};

    Object.keys(headers).forEach(key => {
      const lowerKey = key.toLowerCase();
      if (sensitiveHeaders.includes(lowerKey)) {
        sanitized[key] = '[REDACTED]';
      } else {
        sanitized[key] = headers[key];
      }
    });

    return sanitized;
  }
}

/**
 * 增强的Logger，自动包含追踪信息
 */
export class TracingLogger extends Logger {
  log(message: any, context?: string) {
    const traceContext = TracingMiddleware.getCurrentContext();
    const enhancedMessage = traceContext 
      ? `[${traceContext.traceId}] ${message}`
      : message;
    
    super.log(enhancedMessage, context);
  }

  error(message: any, trace?: string, context?: string) {
    const traceContext = TracingMiddleware.getCurrentContext();
    const enhancedMessage = traceContext 
      ? `[${traceContext.traceId}] ${message}`
      : message;
    
    super.error(enhancedMessage, trace, context);
  }

  warn(message: any, context?: string) {
    const traceContext = TracingMiddleware.getCurrentContext();
    const enhancedMessage = traceContext 
      ? `[${traceContext.traceId}] ${message}`
      : message;
    
    super.warn(enhancedMessage, context);
  }

  debug(message: any, context?: string) {
    const traceContext = TracingMiddleware.getCurrentContext();
    const enhancedMessage = traceContext 
      ? `[${traceContext.traceId}] ${message}`
      : message;
    
    super.debug(enhancedMessage, context);
  }

  verbose(message: any, context?: string) {
    const traceContext = TracingMiddleware.getCurrentContext();
    const enhancedMessage = traceContext 
      ? `[${traceContext.traceId}] ${message}`
      : message;
    
    super.verbose(enhancedMessage, context);
  }
}

/**
 * 装饰器：自动记录方法执行时间
 */
export function TraceMethod(target: any, propertyName: string, descriptor: PropertyDescriptor) {
  const method = descriptor.value;

  descriptor.value = async function (...args: any[]) {
    const context = TracingMiddleware.getCurrentContext();
    const logger = new TracingLogger(target.constructor.name);
    const startTime = Date.now();

    try {
      logger.debug(`Method ${propertyName} started`);
      const result = await method.apply(this, args);
      const duration = Date.now() - startTime;
      logger.debug(`Method ${propertyName} completed (${duration}ms)`);
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error(`Method ${propertyName} failed (${duration}ms): ${error.message}`);
      throw error;
    }
  };

  return descriptor;
}

/**
 * 服务间调用追踪工具
 */
export class ServiceTracing {
  private static readonly logger = new TracingLogger('ServiceTracing');

  /**
   * 创建带有追踪信息的HTTP请求头
   */
  static createTracingHeaders(): Record<string, string> {
    const context = TracingMiddleware.getCurrentContext();
    const headers: Record<string, string> = {};

    if (context) {
      headers['X-Trace-ID'] = context.traceId;
      headers['X-Parent-Request-ID'] = context.requestId;
      headers['X-User-ID'] = context.userId || '';
    }

    return headers;
  }

  /**
   * 记录服务间调用
   */
  static async traceServiceCall<T>(
    serviceName: string,
    operation: string,
    fn: () => Promise<T>
  ): Promise<T> {
    const context = TracingMiddleware.getCurrentContext();
    const startTime = Date.now();
    const callId = uuidv4();

    this.logger.log(`Service call started: ${serviceName}.${operation}`, JSON.stringify({
      traceId: context?.traceId,
      parentRequestId: context?.requestId,
      callId,
      serviceName,
      operation,
    }));

    try {
      const result = await fn();
      const duration = Date.now() - startTime;
      
      this.logger.log(`Service call completed: ${serviceName}.${operation} (${duration}ms)`, JSON.stringify({
        traceId: context?.traceId,
        parentRequestId: context?.requestId,
        callId,
        serviceName,
        operation,
        duration,
        success: true,
      }));

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      
      this.logger.error(`Service call failed: ${serviceName}.${operation} (${duration}ms)`, error.stack, JSON.stringify({
        traceId: context?.traceId,
        parentRequestId: context?.requestId,
        callId,
        serviceName,
        operation,
        duration,
        success: false,
        error: {
          name: error.name,
          message: error.message,
        },
      }));

      throw error;
    }
  }
}
