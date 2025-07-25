import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

import { CROSS_SERVICE_AUTH_KEY, CrossServiceAuthConfig } from '@lib/infra/decorators/cross-service-auth.decorator';
import { RedisUtility } from '@lib/shared/redis/redis.util';
import { CacheConstant } from '@lib/constants/cache.constant';
import { IAuthentication } from '@lib/typings/global';

/**
 * 服务认证信息
 */
interface ServiceAuthInfo {
  serviceId: string;
  serviceName: string;
  signature: string;
  timestamp: number;
  nonce: string;
  userContext?: IAuthentication;
}

/**
 * 跨服务认证守卫
 * 验证服务间调用的身份和权限
 */
@Injectable()
export class CrossServiceAuthGuard implements CanActivate {
  private readonly logger = new Logger(CrossServiceAuthGuard.name);
  private readonly serviceSecret: string;
  private readonly maxTimestampDiff: number;

  constructor(
    private readonly reflector: Reflector,
    private readonly configService: ConfigService,
  ) {
    this.serviceSecret = this.configService.get<string>('SERVICE_SECRET', 'default-service-secret');
    this.maxTimestampDiff = this.configService.get<number>('MAX_TIMESTAMP_DIFF', 300000); // 5分钟
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // 获取跨服务认证配置
    const authConfig = this.reflector.getAllAndOverride<CrossServiceAuthConfig>(
      CROSS_SERVICE_AUTH_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!authConfig) {
      return true; // 没有配置跨服务认证，允许通过
    }

    const request = context.switchToHttp().getRequest();

    try {
      // 提取服务认证信息
      const authInfo = this.extractServiceAuthInfo(request);

      // 验证服务身份
      await this.validateServiceAuth(authInfo, authConfig);

      // 设置服务上下文
      this.setServiceContext(request, authInfo);

      this.logger.debug(`Cross-service authentication successful for service: ${authInfo.serviceName}`);
      return true;

    } catch (error) {
      this.logger.warn(`Cross-service authentication failed: ${error.message}`, {
        url: request.url,
        method: request.method,
        headers: this.sanitizeHeaders(request.headers),
      });

      throw error;
    }
  }

  /**
   * 提取服务认证信息
   */
  private extractServiceAuthInfo(request: any): ServiceAuthInfo {
    const headers = request.headers;

    // 检查必需的认证头
    const serviceId = headers['x-service-id'];
    const serviceName = headers['x-service-name'];
    const signature = headers['x-service-signature'];
    const timestamp = headers['x-service-timestamp'];
    const nonce = headers['x-service-nonce'];

    if (!serviceId || !serviceName || !signature || !timestamp || !nonce) {
      throw new UnauthorizedException('Missing required service authentication headers');
    }

    // 解析用户上下文（如果存在）
    let userContext: IAuthentication | undefined;
    const userContextHeader = headers['x-user-context'];
    if (userContextHeader) {
      try {
        userContext = JSON.parse(Buffer.from(userContextHeader, 'base64').toString());
      } catch (error) {
        throw new UnauthorizedException('Invalid user context format');
      }
    }

    return {
      serviceId,
      serviceName,
      signature,
      timestamp: parseInt(timestamp, 10),
      nonce,
      userContext,
    };
  }

  /**
   * 验证服务认证
   */
  private async validateServiceAuth(
    authInfo: ServiceAuthInfo,
    config: CrossServiceAuthConfig,
  ): Promise<void> {
    // 验证时间戳
    this.validateTimestamp(authInfo.timestamp);

    // 验证nonce（防重放攻击）
    await this.validateNonce(authInfo.nonce, authInfo.serviceId);

    // 验证服务是否在允许列表中
    this.validateAllowedService(authInfo.serviceName, config.allowedServices);

    // 验证签名
    if (config.verifySignature) {
      this.validateSignature(authInfo);
    }

    // 验证用户上下文
    if (config.requireUserContext && !authInfo.userContext) {
      throw new UnauthorizedException('User context is required for this service call');
    }

    // 验证服务注册状态
    await this.validateServiceRegistration(authInfo.serviceId, authInfo.serviceName);
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
   * 验证允许的服务
   */
  private validateAllowedService(serviceName: string, allowedServices?: string[]): void {
    if (allowedServices && allowedServices.length > 0) {
      if (!allowedServices.includes(serviceName)) {
        throw new ForbiddenException(`Service '${serviceName}' is not allowed to access this endpoint`);
      }
    }
  }

  /**
   * 验证签名
   */
  private validateSignature(authInfo: ServiceAuthInfo): void {
    const { serviceId, serviceName, timestamp, nonce, signature } = authInfo;

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
        throw new ForbiddenException(`Service '${serviceName}' is not active`);
      }

      if (serviceInfo.name !== serviceName) {
        throw new UnauthorizedException('Service name mismatch');
      }

      // 更新服务最后访问时间
      await RedisUtility.instance.hset(registryKey, 'lastAccess', Date.now().toString());

    } catch (error) {
      if (error instanceof UnauthorizedException || error instanceof ForbiddenException) {
        throw error;
      }
      this.logger.warn('Failed to validate service registration:', error);
    }
  }

  /**
   * 设置服务上下文
   */
  private setServiceContext(request: any, authInfo: ServiceAuthInfo): void {
    request.serviceContext = {
      serviceId: authInfo.serviceId,
      serviceName: authInfo.serviceName,
      timestamp: authInfo.timestamp,
      userContext: authInfo.userContext,
    };

    // 如果有用户上下文，也设置到request.user
    if (authInfo.userContext) {
      request.user = authInfo.userContext;
    }
  }

  /**
   * 清理敏感头信息用于日志
   */
  private sanitizeHeaders(headers: any): any {
    const sanitized = { ...headers };
    delete sanitized['x-service-signature'];
    delete sanitized['authorization'];
    return sanitized;
  }
}

/**
 * 服务注册信息
 */
export interface ServiceRegistrationInfo {
  serviceId: string;
  serviceName: string;
  version: string;
  status: 'active' | 'inactive' | 'maintenance';
  endpoints: string[];
  capabilities: string[];
  registeredAt: number;
  lastAccess: number;
  metadata?: Record<string, any>;
}

/**
 * 服务注册管理器
 */
@Injectable()
export class ServiceRegistrationManager {
  private readonly logger = new Logger(ServiceRegistrationManager.name);

  /**
   * 注册服务
   */
  async registerService(info: ServiceRegistrationInfo): Promise<void> {
    try {
      const registryKey = `${CacheConstant.SERVICE_REGISTRY_PREFIX}${info.serviceId}`;
      const serviceData = {
        ...info,
        registeredAt: Date.now(),
        lastAccess: Date.now(),
      };

      await RedisUtility.instance.hset(registryKey, serviceData);
      await RedisUtility.instance.expire(registryKey, 3600); // 1小时过期

      this.logger.log(`Service registered: ${info.serviceName} (${info.serviceId})`);
    } catch (error) {
      this.logger.error('Failed to register service:', error);
      throw error;
    }
  }

  /**
   * 注销服务
   */
  async unregisterService(serviceId: string): Promise<void> {
    try {
      const registryKey = `${CacheConstant.SERVICE_REGISTRY_PREFIX}${serviceId}`;
      await RedisUtility.instance.del(registryKey);

      this.logger.log(`Service unregistered: ${serviceId}`);
    } catch (error) {
      this.logger.error('Failed to unregister service:', error);
    }
  }

  /**
   * 获取服务信息
   */
  async getServiceInfo(serviceId: string): Promise<ServiceRegistrationInfo | null> {
    try {
      const registryKey = `${CacheConstant.SERVICE_REGISTRY_PREFIX}${serviceId}`;
      const serviceData = await RedisUtility.instance.hgetall(registryKey);

      if (!serviceData || Object.keys(serviceData).length === 0) {
        return null;
      }

      return serviceData as any;
    } catch (error) {
      this.logger.error('Failed to get service info:', error);
      return null;
    }
  }

  /**
   * 获取所有注册的服务
   */
  async getAllServices(): Promise<ServiceRegistrationInfo[]> {
    try {
      const keys = await RedisUtility.instance.keys(`${CacheConstant.SERVICE_REGISTRY_PREFIX}*`);
      const services: ServiceRegistrationInfo[] = [];

      for (const key of keys) {
        const serviceData = await RedisUtility.instance.hgetall(key);
        if (serviceData && Object.keys(serviceData).length > 0) {
          services.push(serviceData as any);
        }
      }

      return services;
    } catch (error) {
      this.logger.error('Failed to get all services:', error);
      return [];
    }
  }
}
