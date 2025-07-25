import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';

import { AUDIT_LOG_KEY } from '../decorators/auth.decorators';
import { IAuthentication } from '../services/unified-jwt.service';

/**
 * 审计日志条目接口
 */
export interface AuditLogEntry {
  /** 用户ID */
  userId?: string;
  /** 用户名 */
  username?: string;
  /** 用户域 */
  domain?: string;
  /** 操作动作 */
  action: string;
  /** 资源类型 */
  resource: string;
  /** 资源ID */
  resourceId?: string;
  /** 操作描述 */
  description?: string;
  /** 请求方法 */
  method: string;
  /** 请求路径 */
  path: string;
  /** 请求IP */
  ip: string;
  /** User-Agent */
  userAgent: string;
  /** 请求参数 */
  params?: any;
  /** 请求体 */
  body?: any;
  /** 响应状态码 */
  statusCode?: number;
  /** 响应数据 */
  response?: any;
  /** 错误信息 */
  error?: string;
  /** 执行时间（毫秒） */
  duration: number;
  /** 时间戳 */
  timestamp: Date;
  /** 服务名称 */
  serviceName?: string;
  /** 请求ID */
  requestId?: string;
}

/**
 * 审计日志拦截器
 * 自动记录用户操作日志
 */
@Injectable()
export class AuditLogInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AuditLogInterceptor.name);

  constructor(private reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    // 检查是否需要审计日志
    const auditOptions = this.reflector.getAllAndOverride(AUDIT_LOG_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!auditOptions) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();
    const user: IAuthentication = request.user;
    const startTime = Date.now();

    // 构建基础审计日志条目
    const auditEntry: Partial<AuditLogEntry> = {
      userId: user?.uid,
      username: user?.username,
      domain: user?.domain,
      action: auditOptions.action || this.extractActionFromMethod(request.method, request.route?.path),
      resource: auditOptions.resource || this.extractResourceFromPath(request.route?.path),
      description: auditOptions.description,
      method: request.method,
      path: request.url,
      ip: this.getClientIp(request),
      userAgent: request.headers['user-agent'] || 'unknown',
      params: this.sanitizeData(request.params),
      body: this.sanitizeData(request.body),
      timestamp: new Date(),
      serviceName: process.env.SERVICE_NAME || 'unknown',
      requestId: request.headers['x-request-id'] || this.generateRequestId(),
    };

    return next.handle().pipe(
      tap((data) => {
        // 成功响应的审计日志
        const duration = Date.now() - startTime;
        const completeEntry: AuditLogEntry = {
          ...auditEntry,
          statusCode: response.statusCode,
          response: this.sanitizeData(data),
          duration,
        } as AuditLogEntry;

        this.logAuditEntry(completeEntry, 'SUCCESS');
      }),
      catchError((error) => {
        // 错误响应的审计日志
        const duration = Date.now() - startTime;
        const completeEntry: AuditLogEntry = {
          ...auditEntry,
          statusCode: error.status || 500,
          error: error.message || 'Unknown error',
          duration,
        } as AuditLogEntry;

        this.logAuditEntry(completeEntry, 'ERROR');
        return throwError(() => error);
      }),
    );
  }

  /**
   * 记录审计日志条目
   */
  private logAuditEntry(entry: AuditLogEntry, type: 'SUCCESS' | 'ERROR'): void {
    const logMessage = `[AUDIT] ${type} - ${entry.username || 'Anonymous'} ${entry.action} ${entry.resource}`;
    
    if (type === 'SUCCESS') {
      this.logger.log(logMessage, {
        ...entry,
        level: 'audit',
      });
    } else {
      this.logger.error(logMessage, {
        ...entry,
        level: 'audit',
      });
    }

    // 这里可以添加将审计日志发送到外部系统的逻辑
    // 例如：发送到 ELK Stack、数据库、消息队列等
    this.sendToAuditSystem(entry, type);
  }

  /**
   * 发送到审计系统
   */
  private async sendToAuditSystem(entry: AuditLogEntry, type: 'SUCCESS' | 'ERROR'): Promise<void> {
    try {
      // 这里实现发送到外部审计系统的逻辑
      // 例如：
      // - 发送到 Elasticsearch
      // - 存储到数据库
      // - 发送到消息队列
      // - 发送到第三方审计服务

      // 示例：简单的控制台输出（生产环境应该替换为实际的审计系统）
      if (process.env.NODE_ENV === 'development') {
        console.log(`[AUDIT-${type}]`, JSON.stringify(entry, null, 2));
      }
    } catch (error) {
      this.logger.error('Failed to send audit log to external system:', error);
    }
  }

  /**
   * 从HTTP方法和路径提取操作动作
   */
  private extractActionFromMethod(method: string, path?: string): string {
    const methodActionMap: Record<string, string> = {
      GET: 'read',
      POST: 'create',
      PUT: 'update',
      PATCH: 'update',
      DELETE: 'delete',
    };

    const baseAction = methodActionMap[method.toUpperCase()] || 'unknown';
    
    // 可以根据路径进一步细化动作
    if (path) {
      if (path.includes('/login')) return 'login';
      if (path.includes('/logout')) return 'logout';
      if (path.includes('/refresh')) return 'refresh_token';
      if (path.includes('/password')) return 'change_password';
    }

    return baseAction;
  }

  /**
   * 从路径提取资源类型
   */
  private extractResourceFromPath(path?: string): string {
    if (!path) return 'unknown';

    // 提取路径中的资源名称
    const segments = path.split('/').filter(segment => segment && !segment.startsWith(':'));
    
    // 通常资源名称是路径的第二个或第三个段
    if (segments.length >= 2) {
      return segments[1]; // 例如：/api/users -> users
    }

    return 'unknown';
  }

  /**
   * 获取客户端IP地址
   */
  private getClientIp(request: any): string {
    return (
      request.headers['x-forwarded-for']?.split(',')[0] ||
      request.headers['x-real-ip'] ||
      request.connection?.remoteAddress ||
      request.socket?.remoteAddress ||
      request.ip ||
      'unknown'
    );
  }

  /**
   * 数据脱敏处理
   */
  private sanitizeData(data: any): any {
    if (!data) return data;

    // 敏感字段列表
    const sensitiveFields = [
      'password',
      'token',
      'secret',
      'key',
      'authorization',
      'cookie',
      'session',
      'credit_card',
      'ssn',
      'phone',
      'email',
    ];

    const sanitize = (obj: any): any => {
      if (typeof obj !== 'object' || obj === null) {
        return obj;
      }

      if (Array.isArray(obj)) {
        return obj.map(item => sanitize(item));
      }

      const sanitized: any = {};
      for (const [key, value] of Object.entries(obj)) {
        const lowerKey = key.toLowerCase();
        const isSensitive = sensitiveFields.some(field => lowerKey.includes(field));
        
        if (isSensitive) {
          sanitized[key] = '***REDACTED***';
        } else if (typeof value === 'object') {
          sanitized[key] = sanitize(value);
        } else {
          sanitized[key] = value;
        }
      }
      return sanitized;
    };

    return sanitize(data);
  }

  /**
   * 生成请求ID
   */
  private generateRequestId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}
