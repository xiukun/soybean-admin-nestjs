import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface AmisResponse<T> {
  status: number;
  msg: string;
  data?: T;
}

/**
 * 响应拦截器
 * 将所有响应包装为Amis标准格式
 */
@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, AmisResponse<T>> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<AmisResponse<T>> {
    return next.handle().pipe(
      map((data) => {
        // 如果已经是Amis格式，直接返回
        if (data && typeof data === 'object' && 'status' in data && 'msg' in data) {
          return data;
        }

        // 包装为Amis格式
        return {
          status: 0,
          msg: 'success',
          data,
        };
      }),
    );
  }
}
