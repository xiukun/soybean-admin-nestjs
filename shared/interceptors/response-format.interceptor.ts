import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ServiceResponse, AmisResponse } from '../interfaces/service-communication.interface';

@Injectable()
export class ResponseFormatInterceptor implements NestInterceptor {
  constructor(private readonly format: 'standard' | 'amis' = 'standard') {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const startTime = Date.now();

    return next.handle().pipe(
      map((data) => {
        const duration = Date.now() - startTime;
        const timestamp = new Date().toISOString();

        // 如果数据已经是格式化的响应，直接返回
        if (this.isFormattedResponse(data)) {
          return data;
        }

        if (this.format === 'amis') {
          return this.formatAmisResponse(data, timestamp);
        } else {
          return this.formatStandardResponse(data, duration, timestamp, request);
        }
      })
    );
  }

  private isFormattedResponse(data: any): boolean {
    // 检查是否已经是标准格式
    if (data && typeof data === 'object') {
      // 标准格式检查
      if ('success' in data && 'timestamp' in data) {
        return true;
      }
      // Amis格式检查
      if ('status' in data && 'msg' in data) {
        return true;
      }
    }
    return false;
  }

  private formatStandardResponse(
    data: any,
    duration: number,
    timestamp: string,
    request: any
  ): ServiceResponse {
    return {
      success: true,
      data,
      status: 200,
      duration,
      timestamp,
      traceId: request.headers['x-trace-id'],
    };
  }

  private formatAmisResponse(data: any, timestamp: string): AmisResponse {
    return {
      status: 0,
      msg: 'success',
      data,
      timestamp,
    };
  }
}
