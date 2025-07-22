import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ServiceError, AmisResponse } from '../interfaces/service-communication.interface';

@Catch()
export class ServiceExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(ServiceExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const timestamp = new Date().toISOString();
    const traceId = request.headers['x-trace-id'] as string;
    const serviceName = request.headers['x-service-source'] as string;

    let status: number;
    let message: string;
    let code: string;
    let details: any;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      
      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
        code = this.getErrorCode(status);
      } else if (typeof exceptionResponse === 'object') {
        message = (exceptionResponse as any).message || exception.message;
        code = (exceptionResponse as any).code || this.getErrorCode(status);
        details = (exceptionResponse as any).details;
      } else {
        message = exception.message;
        code = this.getErrorCode(status);
      }
    } else if (exception instanceof Error) {
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      message = exception.message;
      code = 'INTERNAL_SERVER_ERROR';
      details = exception.stack;
    } else {
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      message = 'Internal server error';
      code = 'INTERNAL_SERVER_ERROR';
    }

    // 记录错误日志
    this.logger.error(
      `${request.method} ${request.url} - ${status} - ${message}`,
      {
        traceId,
        serviceName,
        userAgent: request.headers['user-agent'],
        ip: request.ip,
        exception: exception instanceof Error ? exception.stack : exception,
      }
    );

    // 检查是否需要Amis格式响应
    const isAmisFormat = this.shouldUseAmisFormat(request);

    if (isAmisFormat) {
      const amisResponse: AmisResponse = {
        status: this.mapHttpStatusToAmisStatus(status),
        msg: message,
        data: null,
        timestamp,
      };
      response.status(200).json(amisResponse); // Amis格式总是返回200状态码
    } else {
      const serviceError: ServiceError = {
        code,
        message,
        details: process.env.NODE_ENV === 'development' ? details : undefined,
        timestamp,
        traceId,
        service: serviceName,
      };

      response.status(status).json({
        success: false,
        error: serviceError,
        status,
        timestamp,
        traceId,
      });
    }
  }

  private getErrorCode(status: number): string {
    const errorCodes: Record<number, string> = {
      400: 'BAD_REQUEST',
      401: 'UNAUTHORIZED',
      403: 'FORBIDDEN',
      404: 'NOT_FOUND',
      409: 'CONFLICT',
      422: 'UNPROCESSABLE_ENTITY',
      429: 'TOO_MANY_REQUESTS',
      500: 'INTERNAL_SERVER_ERROR',
      502: 'BAD_GATEWAY',
      503: 'SERVICE_UNAVAILABLE',
      504: 'GATEWAY_TIMEOUT',
    };

    return errorCodes[status] || 'UNKNOWN_ERROR';
  }

  private shouldUseAmisFormat(request: Request): boolean {
    // 检查请求头或路径来决定是否使用Amis格式
    const acceptHeader = request.headers.accept;
    const userAgent = request.headers['user-agent'];
    const path = request.path;

    // 如果请求来自Amis前端或包含特定标识
    return (
      acceptHeader?.includes('application/amis') ||
      userAgent?.includes('amis') ||
      path.includes('/amis/') ||
      request.headers['x-amis-format'] === 'true'
    );
  }

  private mapHttpStatusToAmisStatus(httpStatus: number): number {
    // Amis状态码映射
    const statusMap: Record<number, number> = {
      200: 0,   // 成功
      400: 1,   // 客户端错误
      401: 2,   // 未授权
      403: 3,   // 禁止访问
      404: 4,   // 未找到
      422: 5,   // 验证错误
      500: 6,   // 服务器错误
    };

    return statusMap[httpStatus] || 6; // 默认为服务器错误
  }
}
