import { Injectable, CanActivate, ExecutionContext, UnauthorizedException, Logger } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

import { CROSS_SERVICE_KEY, INTERNAL_SERVICE_KEY } from '../decorators/auth.decorators';
import { IAuthentication } from '../services/unified-jwt.service';

/**
 * 跨服务认证守卫
 * 验证服务间调用的身份
 */
@Injectable()
export class CrossServiceGuard implements CanActivate {
  private readonly logger = new Logger(CrossServiceGuard.name);
  private readonly serviceSecret: string;
  private readonly maxTimestampDiff: number;

  constructor(
    private reflector: Reflector,
    private configService: ConfigService,
  ) {
    this.serviceSecret = this.configService.get<string>('SERVICE_SECRET', 'default-service-secret');
    this.maxTimestampDiff = this.configService.get<number>('MAX_TIMESTAMP_DIFF', 300000); // 5分钟
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    // 检查是否为跨服务调用
    const crossServiceOptions = this.reflector.getAllAndOverride(CROSS_SERVICE_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const internalServiceOptions = this.reflector.getAllAndOverride(INTERNAL_SERVICE_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // 如果没有跨服务或内部服务标记，跳过验证
    if (!crossServiceOptions && !internalServiceOptions) {
      return true;
    }

    // 验证服务认证头
    const serviceId = request.headers['x-service-id'] as string;
    const serviceName = request.headers['x-service-name'] as string;
    const signature = request.headers['x-service-signature'] as string;
    const timestamp = request.headers['x-service-timestamp'] as string;
    const nonce = request.headers['x-service-nonce'] as string;

    if (!serviceId || !serviceName || !signature || !timestamp || !nonce) {
      this.logger.warn('Missing required service authentication headers');
      throw new UnauthorizedException('Missing service authentication headers');
    }

    // 验证时间戳
    this.validateTimestamp(parseInt(timestamp, 10));

    // 验证签名
    this.validateSignature(serviceId, serviceName, timestamp, nonce, signature);

    // 验证允许的服务
    if (crossServiceOptions?.allowedServices) {
      if (!crossServiceOptions.allowedServices.includes(serviceName)) {
        this.logger.warn(`Service ${serviceName} not allowed for cross-service call`);
        throw new UnauthorizedException(`Service ${serviceName} not authorized`);
      }
    }

    if (internalServiceOptions && Array.isArray(internalServiceOptions)) {
      if (internalServiceOptions.length > 0 && !internalServiceOptions.includes(serviceName)) {
        this.logger.warn(`Service ${serviceName} not allowed for internal service call`);
        throw new UnauthorizedException(`Service ${serviceName} not authorized for internal calls`);
      }
    }

    // 处理用户上下文
    if (crossServiceOptions?.requireUserContext) {
      const userContextHeader = request.headers['x-user-context'] as string;
      
      if (!userContextHeader) {
        this.logger.warn('User context required but not provided');
        throw new UnauthorizedException('User context required for this cross-service call');
      }

      try {
        const userContext: IAuthentication = JSON.parse(
          Buffer.from(userContextHeader, 'base64').toString()
        );
        
        // 将用户上下文添加到请求中
        request.user = userContext;
        request.serviceContext = {
          serviceId,
          serviceName,
          timestamp: parseInt(timestamp, 10),
          userContext,
        };
      } catch (error) {
        this.logger.error('Failed to parse user context:', error);
        throw new UnauthorizedException('Invalid user context format');
      }
    } else {
      // 设置服务上下文
      request.serviceContext = {
        serviceId,
        serviceName,
        timestamp: parseInt(timestamp, 10),
      };
    }

    this.logger.debug(`Cross-service authentication successful: ${serviceName}`);
    return true;
  }

  /**
   * 验证时间戳
   */
  private validateTimestamp(timestamp: number): void {
    const now = Date.now();
    const diff = Math.abs(now - timestamp);

    if (diff > this.maxTimestampDiff) {
      this.logger.warn(`Request timestamp too old or too far in future: ${diff}ms`);
      throw new UnauthorizedException('Request timestamp is invalid');
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
      this.logger.warn('Service signature validation failed');
      throw new UnauthorizedException('Invalid service signature');
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
