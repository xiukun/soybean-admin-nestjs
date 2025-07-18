import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { AmisResponseUtil } from '@lib/bounded-contexts/api-config/domain/amis-response.util';
import { AMIS_RESPONSE_KEY } from '@decorators/amis-response.decorator';

@Injectable()
export class AmisResponseInterceptor implements NestInterceptor {
  constructor(private reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const amisConfig = this.reflector.getAllAndOverride(AMIS_RESPONSE_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!amisConfig?.enabled) {
      return next.handle();
    }

    return next.handle().pipe(
      map((data) => {
        // 如果已经是amis格式，直接返回
        if (AmisResponseUtil.isValidAmisResponse(data)) {
          return data;
        }

        // 处理分页响应
        if (amisConfig.pagination && this.isPaginationData(data)) {
          return AmisResponseUtil.pagination(
            data.items || data.data || data.list || data.options || [],
            data.page || data.pageNum || 1,
            data.perPage || data.limit || data.pageSize || 10,
            data.total || 0
          );
        }

        // 处理普通响应
        return AmisResponseUtil.success(data, amisConfig.dataKey);
      })
    );
  }

  private isPaginationData(data: any): boolean {
    if (!data || typeof data !== 'object') {
      return false;
    }

    // 检查是否包含分页相关字段
    const hasItems = Array.isArray(data.items) || Array.isArray(data.data) || Array.isArray(data.list) || Array.isArray(data.options);
    const hasTotal = typeof data.total === 'number';
    const hasPage = typeof data.page === 'number' || typeof data.pageNum === 'number';
    const hasPerPage = typeof data.perPage === 'number' || typeof data.limit === 'number' || typeof data.pageSize === 'number';

    return hasItems && (hasTotal || hasPage || hasPerPage);
  }
}
