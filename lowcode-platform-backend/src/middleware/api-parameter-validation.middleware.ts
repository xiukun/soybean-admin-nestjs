import { Injectable, NestMiddleware, BadRequestException, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { ApiParameterConfigService } from '../services/api-parameter-config.service';

/**
 * API参数验证中间件
 * 根据配置自动验证API请求参数
 */
@Injectable()
export class ApiParameterValidationMiddleware implements NestMiddleware {
  private readonly logger = new Logger(ApiParameterValidationMiddleware.name);

  constructor(
    private readonly apiParameterConfigService: ApiParameterConfigService,
  ) {}

  async use(req: Request, res: Response, next: NextFunction) {
    try {
      // 获取请求路径和方法
      const path = req.route?.path || req.path;
      const method = req.method;

      // 查找对应的API配置
      const apiConfig = await this.apiParameterConfigService.findApiConfigByPathAndMethod(path, method);

      if (!apiConfig || !apiConfig.enabled) {
        // 如果没有配置或配置未启用，直接通过
        return next();
      }

      // 获取请求参数
      const requestParams = this.extractRequestParameters(req, method);

      // 验证参数
      const validation = await this.apiParameterConfigService.validateParameters(
        apiConfig.inputParameters,
        requestParams
      );

      if (!validation.isValid) {
        // 验证失败，返回错误
        const errorMessage = validation.errors.map(error => error.message).join('; ');
        throw new BadRequestException(`参数验证失败: ${errorMessage}`);
      }

      // 将转换后的参数重新设置到请求对象
      this.setTransformedParameters(req, method, validation.transformedValues);

      // 将API配置添加到请求对象，供后续使用
      (req as any).apiConfig = apiConfig;

      next();

    } catch (error) {
      this.logger.error('API参数验证失败:', error);
      
      if (error instanceof BadRequestException) {
        throw error;
      }
      
      // 其他错误不阻塞请求
      next();
    }
  }

  /**
   * 提取请求参数
   */
  private extractRequestParameters(req: Request, method: string): Record<string, any> {
    const params: Record<string, any> = {};

    // 合并不同来源的参数
    Object.assign(params, req.query);
    Object.assign(params, req.params);

    if (method !== 'GET') {
      Object.assign(params, req.body);
    }

    return params;
  }

  /**
   * 设置转换后的参数
   */
  private setTransformedParameters(req: Request, method: string, transformedValues: Record<string, any>): void {
    // 更新query参数
    for (const [key, value] of Object.entries(transformedValues)) {
      if (req.query[key] !== undefined) {
        req.query[key] = value;
      }
    }

    // 更新body参数（非GET请求）
    if (method !== 'GET' && req.body) {
      for (const [key, value] of Object.entries(transformedValues)) {
        if (req.body[key] !== undefined) {
          req.body[key] = value;
        }
      }
    }
  }
}

/**
 * API响应格式化中间件
 * 根据配置自动格式化API响应
 */
@Injectable()
export class ApiResponseFormattingMiddleware implements NestMiddleware {
  private readonly logger = new Logger(ApiResponseFormattingMiddleware.name);

  constructor(
    private readonly apiParameterConfigService: ApiParameterConfigService,
  ) {}

  async use(req: Request, res: Response, next: NextFunction) {
    try {
      // 保存原始的json方法
      const originalJson = res.json.bind(res);

      // 重写json方法
      res.json = (data: any) => {
        try {
          const apiConfig = (req as any).apiConfig;

          if (apiConfig && apiConfig.responseFormat && apiConfig.responseFormat.wrapResponse) {
            // 根据配置格式化响应
            const formattedData = this.formatResponse(data, apiConfig.responseFormat);
            return originalJson(formattedData);
          }

          return originalJson(data);

        } catch (error) {
          this.logger.error('响应格式化失败:', error);
          return originalJson(data);
        }
      };

      next();

    } catch (error) {
      this.logger.error('响应格式化中间件错误:', error);
      next();
    }
  }

  /**
   * 格式化响应数据
   */
  private formatResponse(data: any, responseFormat: any): any {
    // 如果数据已经是包装格式，直接返回
    if (data && typeof data === 'object' && data[responseFormat.statusField] !== undefined) {
      return data;
    }

    // 包装响应数据
    const wrappedResponse: any = {};
    
    wrappedResponse[responseFormat.statusField] = responseFormat.successCode;
    wrappedResponse[responseFormat.messageField] = 'success';
    wrappedResponse[responseFormat.dataField] = data;

    return wrappedResponse;
  }
}

/**
 * API缓存中间件
 * 根据配置自动缓存API响应
 */
@Injectable()
export class ApiCacheMiddleware implements NestMiddleware {
  private readonly logger = new Logger(ApiCacheMiddleware.name);
  private readonly cache = new Map<string, { data: any; expiry: number }>();

  constructor(
    private readonly apiParameterConfigService: ApiParameterConfigService,
  ) {}

  async use(req: Request, res: Response, next: NextFunction) {
    try {
      const apiConfig = (req as any).apiConfig;

      if (!apiConfig || !apiConfig.cacheConfig || !apiConfig.cacheConfig.enabled) {
        return next();
      }

      // 只缓存GET请求
      if (req.method !== 'GET') {
        return next();
      }

      // 生成缓存键
      const cacheKey = this.generateCacheKey(req, apiConfig.cacheConfig);

      // 检查缓存
      const cached = this.getFromCache(cacheKey);
      if (cached) {
        this.logger.debug(`缓存命中: ${cacheKey}`);
        return res.json(cached);
      }

      // 保存原始的json方法
      const originalJson = res.json.bind(res);

      // 重写json方法以缓存响应
      res.json = (data: any) => {
        try {
          // 缓存响应数据
          this.setToCache(cacheKey, data, apiConfig.cacheConfig.ttl);
          this.logger.debug(`缓存设置: ${cacheKey}`);
        } catch (error) {
          this.logger.error('设置缓存失败:', error);
        }

        return originalJson(data);
      };

      next();

    } catch (error) {
      this.logger.error('缓存中间件错误:', error);
      next();
    }
  }

  /**
   * 生成缓存键
   */
  private generateCacheKey(req: Request, cacheConfig: any): string {
    const path = req.route?.path || req.path;
    const method = req.method;
    const query = JSON.stringify(req.query);
    const params = JSON.stringify(req.params);

    if (cacheConfig.keyTemplate) {
      // 使用自定义模板
      return cacheConfig.keyTemplate
        .replace('{path}', path)
        .replace('{method}', method)
        .replace('{query}', query)
        .replace('{params}', params);
    }

    // 默认缓存键格式
    return `api:${method}:${path}:${Buffer.from(query + params).toString('base64')}`;
  }

  /**
   * 从缓存获取数据
   */
  private getFromCache(key: string): any | null {
    const cached = this.cache.get(key);
    
    if (!cached) {
      return null;
    }

    if (Date.now() > cached.expiry) {
      this.cache.delete(key);
      return null;
    }

    return cached.data;
  }

  /**
   * 设置缓存数据
   */
  private setToCache(key: string, data: any, ttl: number): void {
    const expiry = Date.now() + (ttl * 1000);
    this.cache.set(key, { data, expiry });

    // 简单的缓存清理策略
    if (this.cache.size > 1000) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }
  }

  /**
   * 清除缓存
   */
  clearCache(pattern?: string): void {
    if (pattern) {
      for (const key of this.cache.keys()) {
        if (key.includes(pattern)) {
          this.cache.delete(key);
        }
      }
    } else {
      this.cache.clear();
    }
  }
}

/**
 * API权限验证中间件
 * 根据配置自动验证API权限
 */
@Injectable()
export class ApiPermissionMiddleware implements NestMiddleware {
  private readonly logger = new Logger(ApiPermissionMiddleware.name);

  constructor(
    private readonly apiParameterConfigService: ApiParameterConfigService,
  ) {}

  async use(req: Request, res: Response, next: NextFunction) {
    try {
      const apiConfig = (req as any).apiConfig;

      if (!apiConfig || !apiConfig.permissionConfig) {
        return next();
      }

      const permissionConfig = apiConfig.permissionConfig;

      // 检查是否需要认证
      if (permissionConfig.requireAuth) {
        const user = (req as any).user;
        if (!user) {
          return res.status(401).json({
            status: 1,
            msg: '未认证',
            data: null,
          });
        }
      }

      // 检查权限
      if (permissionConfig.permissions && permissionConfig.permissions.length > 0) {
        const user = (req as any).user;
        const userPermissions = user?.permissions || [];

        const hasPermission = permissionConfig.permissions.some((permission: string) =>
          userPermissions.includes(permission)
        );

        if (!hasPermission) {
          return res.status(403).json({
            status: 1,
            msg: '权限不足',
            data: null,
          });
        }
      }

      // 检查数据权限
      if (permissionConfig.dataPermissions && permissionConfig.dataPermissions.length > 0) {
        // 这里可以实现更复杂的数据权限逻辑
        // 例如：只能访问自己创建的数据、只能访问同部门的数据等
        (req as any).dataPermissions = permissionConfig.dataPermissions;
      }

      next();

    } catch (error) {
      this.logger.error('权限验证中间件错误:', error);
      return res.status(500).json({
        status: 1,
        msg: '权限验证失败',
        data: null,
      });
    }
  }
}
