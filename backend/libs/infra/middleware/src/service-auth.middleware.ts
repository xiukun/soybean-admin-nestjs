import { Injectable, NestMiddleware, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request, Response, NextFunction } from 'express';
import * as crypto from 'crypto';

import { RedisUtility } from '@lib/shared/redis/redis.util';
import { CacheConstant } from '@lib/constants/cache.constant';
import { IAuthentication } from '@lib/typings/global';

/**
 * 微服务认证中间件
 * 处理服务间调用的身份验证
 */
@Injectable()
export class ServiceAuthMiddleware implements NestMiddleware {
  private readonly logger = new Logger(ServiceAuthMiddleware.name);
  private readonly serviceSecret: string;
  private readonly maxTimestampDiff: number;

  constructor(private readonly configService: ConfigService) {
    this.serviceSecret = this.configService.get<string>('SERVICE_SECRET', 'default-service-secret');
    this.maxTimestampDiff = this.configService.get<number>('MAX_TIMESTAMP_DIFF', 300000); // 5分钟
  }

  async use(req: Request, res: Response, next: NextFunction) {
    // 检查是否为服务间调用
    const serviceId = req.headers['x-service-id'] as string;
    const serviceName = req.headers['x-service-name'] as string;

    if (!serviceId || !serviceName) {
      // 不是服务间调用，继续正常流程
      return next();
    }

    try {
      // 验证服务认证
      await this.validateServiceAuth(req);

      // 设置服务上下文
      this.setServiceContext(req);

      this.logger.debug(`Service authentication successful: ${serviceName}`);
      next();
    } catch (error) {
      this.logger.warn(`Service authentication failed: ${error.message}`, {
        serviceId,
        serviceName,
        url: req.url,
        method: req.method,
      });

      res.status(401).json({
        statusCode: 401,
        message: 'Service authentication failed',
        error: 'Unauthorized',
      });
    }
  }

  /**
   * 验证服务认证
   */
  private async validateServiceAuth(req: Request): Promise<void> {
    const serviceId = req.headers['x-service-id'] as string;
    const serviceName = req.headers['x-service-name'] as string;
    const signature = req.headers['x-service-signature'] as string;
    const timestamp = req.headers['x-service-timestamp'] as string;
    const nonce = req.headers['x-service-nonce'] as string;

    if (!signature || !timestamp || !nonce) {
      throw new UnauthorizedException('Missing required service authentication headers');
    }

    // 验证时间戳
    this.validateTimestamp(parseInt(timestamp, 10));

    // 验证nonce（防重放攻击）
    await this.validateNonce(nonce, serviceId);

    // 验证签名
    this.validateSignature(serviceId, serviceName, timestamp, nonce, signature);

    // 验证服务注册状态
    await this.validateServiceRegistration(serviceId, serviceName);
  }

  /**
   * 验证时间戳
   */
  private validateTimestamp(timestamp: number): void {
    const now = Date.now();
    const diff = Math.abs(now - timestamp);

    if (diff > this.maxTimestampDiff) {
      throw new UnauthorizedException('Request timestamp is too old or too far in the future');
    }
  }

  /**
   * 验证nonce（防重放攻击）
   */
  private async validateNonce(nonce: string, serviceId: string): Promise<void> {
    try {
      const nonceKey = `${CacheConstant.CROSS_SERVICE_AUTH_PREFIX}nonce:${serviceId}:${nonce}`;
      const exists = await RedisUtility.instance.exists(nonceKey);

      if (exists) {
        throw new UnauthorizedException('Nonce has already been used');
      }

      // 存储nonce，防止重复使用
      await RedisUtility.instance.setex(nonceKey, 300, '1'); // 5分钟过期
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      this.logger.warn('Failed to validate nonce:', error);
    }
  }

  /**
   * 验证签名
   */
  private validateSignature(
    serviceId: string,
    serviceName: string,
    timestamp: string,
    nonce: string,
    signature: string,
  ): void {
    // 构造签名字符串
    const signatureString = `${serviceId}:${serviceName}:${timestamp}:${nonce}`;
    
    // 计算期望的签名
    const expectedSignature = crypto
      .createHmac('sha256', this.serviceSecret)
      .update(signatureString)
      .digest('hex');

    if (signature !== expectedSignature) {
      throw new UnauthorizedException('Invalid service signature');
    }
  }

  /**
   * 验证服务注册状态
   */
  private async validateServiceRegistration(serviceId: string, serviceName: string): Promise<void> {
    try {
      const registryKey = `${CacheConstant.SERVICE_REGISTRY_PREFIX}${serviceId}`;
      const serviceInfo = await RedisUtility.instance.hgetall(registryKey);

      if (!serviceInfo || Object.keys(serviceInfo).length === 0) {
        throw new UnauthorizedException(`Service '${serviceName}' is not registered`);
      }

      if (serviceInfo.status !== 'active') {
        throw new UnauthorizedException(`Service '${serviceName}' is not active`);
      }

      if (serviceInfo.name !== serviceName) {
        throw new UnauthorizedException('Service name mismatch');
      }

      // 更新服务最后访问时间
      await RedisUtility.instance.hset(registryKey, 'lastAccess', Date.now().toString());

    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      this.logger.warn('Failed to validate service registration:', error);
    }
  }

  /**
   * 设置服务上下文
   */
  private setServiceContext(req: Request): void {
    const serviceId = req.headers['x-service-id'] as string;
    const serviceName = req.headers['x-service-name'] as string;
    const timestamp = req.headers['x-service-timestamp'] as string;
    const userContextHeader = req.headers['x-user-context'] as string;

    // 设置服务上下文
    (req as any).serviceContext = {
      serviceId,
      serviceName,
      timestamp: parseInt(timestamp, 10),
    };

    // 如果有用户上下文，解析并设置
    if (userContextHeader) {
      try {
        const userContext: IAuthentication = JSON.parse(
          Buffer.from(userContextHeader, 'base64').toString()
        );
        (req as any).user = userContext;
        (req as any).serviceContext.userContext = userContext;
      } catch (error) {
        this.logger.warn('Failed to parse user context:', error);
      }
    }
  }
}

/**
 * 服务认证工具类
 * 用于生成服务间调用的认证头
 */
export class ServiceAuthUtil {
  private static readonly serviceSecret = process.env.SERVICE_SECRET || 'default-service-secret';

  /**
   * 生成服务认证头
   */
  static generateAuthHeaders(
    serviceId: string,
    serviceName: string,
    userContext?: IAuthentication,
  ): Record<string, string> {
    const timestamp = Date.now().toString();
    const nonce = crypto.randomBytes(16).toString('hex');

    // 构造签名字符串
    const signatureString = `${serviceId}:${serviceName}:${timestamp}:${nonce}`;
    
    // 计算签名
    const signature = crypto
      .createHmac('sha256', this.serviceSecret)
      .update(signatureString)
      .digest('hex');

    const headers: Record<string, string> = {
      'x-service-id': serviceId,
      'x-service-name': serviceName,
      'x-service-signature': signature,
      'x-service-timestamp': timestamp,
      'x-service-nonce': nonce,
    };

    // 如果有用户上下文，添加到头部
    if (userContext) {
      headers['x-user-context'] = Buffer.from(JSON.stringify(userContext)).toString('base64');
    }

    return headers;
  }

  /**
   * 创建带认证的HTTP客户端配置
   */
  static createAuthenticatedConfig(
    serviceId: string,
    serviceName: string,
    userContext?: IAuthentication,
  ): { headers: Record<string, string> } {
    return {
      headers: this.generateAuthHeaders(serviceId, serviceName, userContext),
    };
  }
}

/**
 * 服务注册工具类
 */
export class ServiceRegistryUtil {
  private static readonly logger = new Logger(ServiceRegistryUtil.name);

  /**
   * 注册服务
   */
  static async registerService(serviceInfo: {
    serviceId: string;
    serviceName: string;
    version: string;
    endpoints: string[];
    capabilities: string[];
    metadata?: Record<string, any>;
  }): Promise<void> {
    try {
      const registryKey = `${CacheConstant.SERVICE_REGISTRY_PREFIX}${serviceInfo.serviceId}`;
      const serviceData = {
        ...serviceInfo,
        status: 'active',
        registeredAt: Date.now(),
        lastAccess: Date.now(),
      };

      await RedisUtility.instance.hset(registryKey, serviceData);
      await RedisUtility.instance.expire(registryKey, 3600); // 1小时过期

      this.logger.log(`Service registered: ${serviceInfo.serviceName} (${serviceInfo.serviceId})`);
    } catch (error) {
      this.logger.error('Failed to register service:', error);
      throw error;
    }
  }

  /**
   * 注销服务
   */
  static async unregisterService(serviceId: string): Promise<void> {
    try {
      const registryKey = `${CacheConstant.SERVICE_REGISTRY_PREFIX}${serviceId}`;
      await RedisUtility.instance.del(registryKey);

      this.logger.log(`Service unregistered: ${serviceId}`);
    } catch (error) {
      this.logger.error('Failed to unregister service:', error);
    }
  }

  /**
   * 更新服务状态
   */
  static async updateServiceStatus(serviceId: string, status: 'active' | 'inactive' | 'maintenance'): Promise<void> {
    try {
      const registryKey = `${CacheConstant.SERVICE_REGISTRY_PREFIX}${serviceId}`;
      await RedisUtility.instance.hset(registryKey, 'status', status);

      this.logger.log(`Service status updated: ${serviceId} -> ${status}`);
    } catch (error) {
      this.logger.error('Failed to update service status:', error);
    }
  }

  /**
   * 服务健康检查
   */
  static async performHealthCheck(serviceId: string): Promise<boolean> {
    try {
      const registryKey = `${CacheConstant.SERVICE_REGISTRY_PREFIX}${serviceId}`;
      const serviceInfo = await RedisUtility.instance.hgetall(registryKey);

      if (!serviceInfo || Object.keys(serviceInfo).length === 0) {
        return false;
      }

      // 检查服务是否超时未访问（超过1小时）
      const lastAccess = parseInt(serviceInfo.lastAccess || '0', 10);
      const now = Date.now();
      const timeout = 60 * 60 * 1000; // 1小时

      if (now - lastAccess > timeout) {
        await this.updateServiceStatus(serviceId, 'inactive');
        return false;
      }

      return serviceInfo.status === 'active';
    } catch (error) {
      this.logger.error('Health check failed:', error);
      return false;
    }
  }
}
