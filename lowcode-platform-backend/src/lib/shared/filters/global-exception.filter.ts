import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { FastifyRequest, FastifyReply } from 'fastify';
import { EnhancedLoggerService } from '../logging/enhanced-logger.service';
import { LowcodeException, createLowcodeException } from '../exceptions/lowcode.exceptions';
import { FriendlyValidationException } from '../exceptions/validation.exception';
import { ConfigService } from '@nestjs/config';

export interface ErrorResponse {
  status: number;
  msg: string;
  data: null;
  error: {
    code: string;
    message: string;
    details?: any;
    timestamp: string;
    path: string;
    method: string;
    requestId?: string;
    stack?: string;
    // 验证错误的额外字段
    validationErrors?: Array<{
      field: string;
      fieldLabel?: string;
      message: string;
      code: string;
      value?: any;
    }>;
    errorSummary?: string;
  };
}

@Injectable()
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  constructor(
    private readonly logger: EnhancedLoggerService,
    private readonly configService: ConfigService,
  ) {
    this.logger = this.logger.child('GlobalExceptionFilter');
  }

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest<FastifyRequest>();
    const response = ctx.getResponse<FastifyReply>();

    // Convert to LowcodeException for consistent handling
    const lowcodeException = this.convertToLowcodeException(exception);
    
    // Extract request information
    const requestInfo = this.extractRequestInfo(request);
    
    // Log the exception
    this.logException(lowcodeException, requestInfo);
    
    // Create error response
    const errorResponse = this.createErrorResponse(lowcodeException, requestInfo);
    
    // Send response
    response
      .status(lowcodeException.getStatus())
      .send(errorResponse);
  }

  private convertToLowcodeException(exception: unknown): LowcodeException {
    if (exception instanceof LowcodeException) {
      return exception;
    }

    // 特殊处理友好验证异常
    if (exception instanceof FriendlyValidationException) {
      return new LowcodeException(
        exception.getErrorSummary(),
        HttpStatus.BAD_REQUEST,
        'VALIDATION_FAILED',
        {
          validationErrors: exception.validationErrors,
          errorsByField: exception.getErrorsByField(),
        },
      );
    }

    return createLowcodeException(exception);
  }

  private extractRequestInfo(request: FastifyRequest): {
    path: string;
    method: string;
    requestId?: string;
    userId?: string;
    userAgent?: string;
    ip: string;
    query: any;
    body: any;
  } {
    return {
      path: request.url,
      method: request.method,
      requestId: request.headers['x-request-id'] as string,
      userId: (request as any).user?.id,
      userAgent: request.headers['user-agent'],
      ip: request.ip,
      query: request.query,
      body: this.sanitizeBody(request.body),
    };
  }

  private sanitizeBody(body: any): any {
    if (!body || typeof body !== 'object') {
      return body;
    }

    // Remove sensitive fields
    const sensitiveFields = ['password', 'token', 'secret', 'key', 'authorization'];
    const sanitized = { ...body };

    const sanitizeObject = (obj: any): any => {
      if (Array.isArray(obj)) {
        return obj.map(item => sanitizeObject(item));
      }

      if (obj && typeof obj === 'object') {
        const result: any = {};
        for (const [key, value] of Object.entries(obj)) {
          if (sensitiveFields.some(field => key.toLowerCase().includes(field))) {
            result[key] = '[REDACTED]';
          } else {
            result[key] = sanitizeObject(value);
          }
        }
        return result;
      }

      return obj;
    };

    return sanitizeObject(sanitized);
  }

  private logException(
    exception: LowcodeException,
    requestInfo: any,
  ): void {
    const logContext = {
      requestId: requestInfo.requestId,
      userId: requestInfo.userId,
      operation: `${requestInfo.method} ${requestInfo.path}`,
      metadata: {
        userAgent: requestInfo.userAgent,
        ip: requestInfo.ip,
        query: requestInfo.query,
        body: requestInfo.body,
      },
    };

    const exceptionResponse = exception.getResponse() as any;
    const errorDetails = {
      code: exceptionResponse.code,
      message: exception.message,
      details: exceptionResponse.details,
      status: exception.getStatus(),
      stack: exception.stack,
    };

    // Log based on severity
    if (exception.getStatus() >= 500) {
      // Server errors - log as error with full details
      this.logger.error(
        `Server error: ${exception.message}`,
        exception.stack,
        {
          ...logContext,
          errorDetails,
        },
      );

      // Log security events for certain errors
      if (exception.getStatus() === HttpStatus.UNAUTHORIZED) {
        this.logger.logSecurity(
          'Unauthorized access attempt',
          'medium',
          logContext,
        );
      }
    } else if (exception.getStatus() >= 400) {
      // Client errors - log as warning
      this.logger.warn(
        `Client error: ${exception.message}`,
        {
          ...logContext,
          errorDetails: {
            ...errorDetails,
            stack: undefined, // Don't log stack for client errors
          },
        },
      );

      // Log specific security events
      if (exception.getStatus() === HttpStatus.FORBIDDEN) {
        this.logger.logSecurity(
          'Forbidden access attempt',
          'low',
          logContext,
        );
      }

      if (exception.getStatus() === HttpStatus.TOO_MANY_REQUESTS) {
        this.logger.logSecurity(
          'Rate limit exceeded',
          'medium',
          logContext,
        );
      }
    } else {
      // Other status codes - log as info
      this.logger.log(
        `Request completed with status ${exception.getStatus()}: ${exception.message}`,
        logContext,
      );
    }

    // Log audit trail for certain operations
    if (this.isAuditableOperation(requestInfo.method, requestInfo.path)) {
      this.logger.logAudit(
        `${requestInfo.method} ${requestInfo.path}`,
        'api_request',
        requestInfo.requestId || 'unknown',
        {
          ...logContext,
          status: exception.getStatus(),
          error: exception.message,
        },
      );
    }
  }

  private isAuditableOperation(method: string, path: string): boolean {
    // Define which operations should be audited
    const auditablePaths = [
      '/api/v1/projects',
      '/api/v1/entities',
      '/api/v1/templates',
      '/api/v1/code-generation',
    ];

    const auditableMethods = ['POST', 'PUT', 'DELETE'];

    return auditableMethods.includes(method) && 
           auditablePaths.some(auditPath => path.startsWith(auditPath));
  }

  private createErrorResponse(
    exception: LowcodeException,
    requestInfo: any,
  ): ErrorResponse {
    const exceptionResponse = exception.getResponse() as any;
    const isDevelopment = this.configService.get('NODE_ENV') === 'development';

    // 基础错误响应
    const errorResponse: ErrorResponse = {
      status: 1, // Error status for frontend compatibility
      msg: this.getFriendlyErrorMessage(exception),
      data: null,
      error: {
        code: exceptionResponse.code || 'UNKNOWN_ERROR',
        message: exception.message,
        details: exceptionResponse.details,
        timestamp: exceptionResponse.timestamp || new Date().toISOString(),
        path: requestInfo.path,
        method: requestInfo.method,
        requestId: requestInfo.requestId,
        // Only include stack trace in development
        ...(isDevelopment && { stack: exception.stack }),
      },
    };

    // 如果是验证错误，添加验证相关的信息
    if (exceptionResponse.code === 'VALIDATION_FAILED' && exceptionResponse.details) {
      if (exceptionResponse.details.validationErrors) {
        errorResponse.error.validationErrors = exceptionResponse.details.validationErrors;
        errorResponse.error.errorSummary = exception.message;
      }
    }

    return errorResponse;
  }

  /**
   * 获取友好的错误消息
   */
  private getFriendlyErrorMessage(exception: LowcodeException): string {
    const exceptionResponse = exception.getResponse() as any;
    
    switch (exceptionResponse.code) {
      case 'VALIDATION_FAILED':
        return '请求参数验证失败';
      case 'ENTITY_NOT_FOUND':
        return '实体不存在';
      case 'PROJECT_NOT_FOUND':
        return '项目不存在';
      case 'TEMPLATE_NOT_FOUND':
        return '模板不存在';
      case 'ENTITY_ALREADY_EXISTS':
        return '实体已存在';
      case 'PROJECT_ALREADY_EXISTS':
        return '项目已存在';
      case 'TEMPLATE_ALREADY_EXISTS':
        return '模板已存在';
      case 'CODE_GENERATION_FAILED':
        return '代码生成失败';
      case 'DATABASE_CONNECTION_ERROR':
        return '数据库连接失败';
      case 'FILE_NOT_FOUND':
        return '文件不存在';
      case 'INSUFFICIENT_PERMISSIONS':
        return '权限不足';
      case 'UNAUTHORIZED':
        return '未授权访问';
      case 'FORBIDDEN':
        return '访问被禁止';
      case 'RATE_LIMIT_EXCEEDED':
        return '请求频率超限';
      case 'EXTERNAL_SERVICE_ERROR':
        return '外部服务错误';
      case 'CONFIGURATION_ERROR':
        return '配置错误';
      case 'BUSINESS_RULE_VIOLATION':
        return '业务规则违反';
      default:
        return '操作失败';
    }
  }
}

// Specific exception filters for different types of errors
@Injectable()
@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  constructor(private readonly logger: EnhancedLoggerService) {
    this.logger = this.logger.child('HttpExceptionFilter');
  }

  catch(exception: HttpException, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest<FastifyRequest>();
    const response = ctx.getResponse<FastifyReply>();

    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    this.logger.warn(
      `HTTP Exception: ${exception.message}`,
      {
        requestId: request.headers['x-request-id'] as string,
        path: request.url,
        method: request.method,
        status,
        response: exceptionResponse,
      },
    );

    response.status(status).send({
      status: 1,
      msg: 'error',
      data: null,
      error: {
        code: 'HTTP_EXCEPTION',
        message: exception.message,
        details: exceptionResponse,
        timestamp: new Date().toISOString(),
        path: request.url,
        method: request.method,
      },
    });
  }
}

@Injectable()
@Catch(Error)
export class UnhandledExceptionFilter implements ExceptionFilter {
  constructor(private readonly logger: EnhancedLoggerService) {
    this.logger = this.logger.child('UnhandledExceptionFilter');
  }

  catch(exception: Error, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest<FastifyRequest>();
    const response = ctx.getResponse<FastifyReply>();

    this.logger.error(
      `Unhandled Exception: ${exception.message}`,
      exception.stack,
      {
        requestId: request.headers['x-request-id'] as string,
        path: request.url,
        method: request.method,
      },
    );

    response.status(HttpStatus.INTERNAL_SERVER_ERROR).send({
      status: 1,
      msg: 'error',
      data: null,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An unexpected error occurred',
        timestamp: new Date().toISOString(),
        path: request.url,
        method: request.method,
        requestId: request.headers['x-request-id'] as string,
      },
    });
  }
}
