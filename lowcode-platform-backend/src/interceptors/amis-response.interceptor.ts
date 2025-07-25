import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { Reflector } from '@nestjs/core';
import { AmisComponentAdapterService } from '../services/amis-component-adapter.service';

/**
 * Amis响应格式化拦截器
 * 自动将API响应格式化为Amis标准格式
 */
@Injectable()
export class AmisResponseInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AmisResponseInterceptor.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly amisAdapter: AmisComponentAdapterService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();

    // 检查是否需要Amis格式化
    const needAmisFormat = this.shouldFormatAsAmis(context, request);

    if (!needAmisFormat) {
      return next.handle();
    }

    return next.handle().pipe(
      map(data => this.formatResponse(data, request, response)),
      catchError(error => {
        this.logger.error('Amis响应格式化错误:', error);
        throw error;
      })
    );
  }

  /**
   * 判断是否需要Amis格式化
   */
  private shouldFormatAsAmis(context: ExecutionContext, request: any): boolean {
    // 检查控制器或方法是否有@AmisResponse装饰器
    const amisResponse = this.reflector.getAllAndOverride<boolean>('amis-response', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (amisResponse !== undefined) {
      return amisResponse;
    }

    // 检查请求头
    const acceptAmis = request.headers['x-amis-format'] === 'true';
    if (acceptAmis) {
      return true;
    }

    // 检查查询参数
    const formatParam = request.query?.format;
    if (formatParam === 'amis') {
      return true;
    }

    // 默认情况下，lowcode相关的API都使用Amis格式
    const path = request.route?.path || request.url;
    if (path && (path.includes('/lowcode') || path.includes('/amis'))) {
      return true;
    }

    return false;
  }

  /**
   * 格式化响应数据
   */
  private formatResponse(data: any, request: any, response: any): any {
    try {
      // 如果数据已经是Amis格式，直接返回
      if (this.isAmisFormat(data)) {
        return data;
      }

      // 检查是否是分页数据
      if (this.isPaginationData(data)) {
        return this.formatPaginationResponse(data);
      }

      // 检查是否是列表数据
      if (this.isListData(data)) {
        return this.formatListResponse(data);
      }

      // 检查是否是错误响应
      if (response.statusCode >= 400) {
        return this.formatErrorResponse(data, response.statusCode);
      }

      // 格式化为标准Amis响应
      return this.amisAdapter.formatApiResponse(data, true, 'success');

    } catch (error) {
      this.logger.error('响应格式化失败:', error);
      return this.amisAdapter.formatApiResponse(data, false, '响应格式化失败');
    }
  }

  /**
   * 判断是否已经是Amis格式
   */
  private isAmisFormat(data: any): boolean {
    return (
      data &&
      typeof data === 'object' &&
      typeof data.status === 'number' &&
      typeof data.msg === 'string' &&
      data.hasOwnProperty('data')
    );
  }

  /**
   * 判断是否是分页数据
   */
  private isPaginationData(data: any): boolean {
    return (
      data &&
      typeof data === 'object' &&
      Array.isArray(data.items) &&
      typeof data.total === 'number' &&
      (typeof data.page === 'number' || typeof data.current === 'number')
    );
  }

  /**
   * 判断是否是列表数据
   */
  private isListData(data: any): boolean {
    return (
      data &&
      typeof data === 'object' &&
      Array.isArray(data.data) &&
      typeof data.total === 'number'
    );
  }

  /**
   * 格式化分页响应
   */
  private formatPaginationResponse(data: any): any {
    const paginationData = this.amisAdapter.formatPaginationData({
      items: data.items || data.data || [],
      total: data.total || 0,
      page: data.page || data.current || 1,
      limit: data.limit || data.pageSize || data.size || 10,
    });

    return this.amisAdapter.formatApiResponse(paginationData, true, 'success');
  }

  /**
   * 格式化列表响应
   */
  private formatListResponse(data: any): any {
    const listData = {
      items: data.data || data.list || [],
      total: data.total || (data.data ? data.data.length : 0),
    };

    return this.amisAdapter.formatApiResponse(listData, true, 'success');
  }

  /**
   * 格式化错误响应
   */
  private formatErrorResponse(data: any, statusCode: number): any {
    let errorMessage = 'Unknown error';

    if (typeof data === 'string') {
      errorMessage = data;
    } else if (data && typeof data === 'object') {
      errorMessage = data.message || data.msg || data.error || errorMessage;
    }

    return this.amisAdapter.formatApiResponse(null, false, errorMessage);
  }
}

/**
 * Amis响应装饰器
 * 标记方法或控制器需要Amis格式化
 */
export const AmisResponse = (enable: boolean = true) => {
  return (target: any, propertyKey?: string, descriptor?: PropertyDescriptor) => {
    if (propertyKey) {
      // 方法装饰器
      Reflect.defineMetadata('amis-response', enable, target, propertyKey);
    } else {
      // 类装饰器
      Reflect.defineMetadata('amis-response', enable, target);
    }
  };
};

/**
 * 分页响应装饰器
 * 专门用于分页接口的响应格式化
 */
export const PaginationResponse = () => {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    Reflect.defineMetadata('pagination-response', true, target, propertyKey);
    Reflect.defineMetadata('amis-response', true, target, propertyKey);
  };
};

/**
 * 列表响应装饰器
 * 专门用于列表接口的响应格式化
 */
export const ListResponse = () => {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    Reflect.defineMetadata('list-response', true, target, propertyKey);
    Reflect.defineMetadata('amis-response', true, target, propertyKey);
  };
};

/**
 * CRUD响应装饰器
 * 专门用于CRUD接口的响应格式化
 */
export const CrudResponse = (operation: 'list' | 'detail' | 'create' | 'update' | 'delete') => {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    Reflect.defineMetadata('crud-response', operation, target, propertyKey);
    Reflect.defineMetadata('amis-response', true, target, propertyKey);

    // 根据操作类型设置特定的响应格式
    switch (operation) {
      case 'list':
        Reflect.defineMetadata('pagination-response', true, target, propertyKey);
        break;
      case 'detail':
      case 'create':
      case 'update':
        Reflect.defineMetadata('single-response', true, target, propertyKey);
        break;
      case 'delete':
        Reflect.defineMetadata('delete-response', true, target, propertyKey);
        break;
    }
  };
};

/**
 * 图表响应装饰器
 * 专门用于图表数据接口的响应格式化
 */
export const ChartResponse = () => {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    Reflect.defineMetadata('chart-response', true, target, propertyKey);
    Reflect.defineMetadata('amis-response', true, target, propertyKey);
  };
};

/**
 * 表单响应装饰器
 * 专门用于表单提交接口的响应格式化
 */
export const FormResponse = () => {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    Reflect.defineMetadata('form-response', true, target, propertyKey);
    Reflect.defineMetadata('amis-response', true, target, propertyKey);
  };
};

/**
 * 统计响应装饰器
 * 专门用于统计数据接口的响应格式化
 */
export const StatisticsResponse = () => {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    Reflect.defineMetadata('statistics-response', true, target, propertyKey);
    Reflect.defineMetadata('amis-response', true, target, propertyKey);
  };
};

/**
 * 文件上传响应装饰器
 * 专门用于文件上传接口的响应格式化
 */
export const FileUploadResponse = () => {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    Reflect.defineMetadata('file-upload-response', true, target, propertyKey);
    Reflect.defineMetadata('amis-response', true, target, propertyKey);
  };
};

/**
 * 导入导出响应装饰器
 * 专门用于导入导出接口的响应格式化
 */
export const ImportExportResponse = () => {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    Reflect.defineMetadata('import-export-response', true, target, propertyKey);
    Reflect.defineMetadata('amis-response', true, target, propertyKey);
  };
};

/**
 * 批量操作响应装饰器
 * 专门用于批量操作接口的响应格式化
 */
export const BatchResponse = () => {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    Reflect.defineMetadata('batch-response', true, target, propertyKey);
    Reflect.defineMetadata('amis-response', true, target, propertyKey);
  };
};

/**
 * 树形数据响应装饰器
 * 专门用于树形数据接口的响应格式化
 */
export const TreeResponse = () => {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    Reflect.defineMetadata('tree-response', true, target, propertyKey);
    Reflect.defineMetadata('amis-response', true, target, propertyKey);
  };
};

/**
 * 级联数据响应装饰器
 * 专门用于级联数据接口的响应格式化
 */
export const CascadeResponse = () => {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    Reflect.defineMetadata('cascade-response', true, target, propertyKey);
    Reflect.defineMetadata('amis-response', true, target, propertyKey);
  };
};

/**
 * 选项数据响应装饰器
 * 专门用于选项数据接口的响应格式化
 */
export const OptionsResponse = () => {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    Reflect.defineMetadata('options-response', true, target, propertyKey);
    Reflect.defineMetadata('amis-response', true, target, propertyKey);
  };
};
