import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { Redis } from 'ioredis';

import { RATE_LIMIT_KEY } from '../decorators/auth.decorators';
import { IAuthentication } from '../services/unified-jwt.service';

/**
 * 限流配置接口
 */
export interface RateLimitOptions {
  /** 最大请求数 */
  maxRequests: number;
  /** 时间窗口（毫秒） */
  windowMs: number;
  /** 是否跳过成功请求 */
  skipSuccessfulRequests?: boolean;
  /** 是否跳过失败请求 */
  skipFailedRequests?: boolean;
  /** 自定义键生成函数 */
  keyGenerator?: (context: ExecutionContext) => string;
  /** 自定义错误消息 */
  message?: string;
}

/**
 * 限流信息接口
 */
export interface RateLimitInfo {
  /** 总请求数 */
  totalHits: number;
  /** 剩余请求数 */
  remainingPoints: number;
  /** 重置时间（毫秒时间戳） */
  msBeforeNext: number;
  /** 是否被限流 */
  isBlocked: boolean;
}

/**
 * 限流守卫
 * 基于Redis实现的分布式限流
 */
@Injectable()
export class RateLimitGuard implements CanActivate {
  private readonly logger = new Logger(RateLimitGuard.name);
  private readonly redis: Redis;
  private readonly defaultOptions: RateLimitOptions;

  constructor(
    private reflector: Reflector,
    private configService: ConfigService,
  ) {
    // 初始化Redis连接
    this.redis = new Redis({
      host: this.configService.get<string>('REDIS_HOST', 'localhost'),
      port: this.configService.get<number>('REDIS_PORT', 6379),
      password: this.configService.get<string>('REDIS_PASSWORD'),
      db: this.configService.get<number>('REDIS_DB', 0),
      retryDelayOnFailover: 100,
      maxRetriesPerRequest: 3,
      lazyConnect: true,
    });

    // 默认限流配置
    this.defaultOptions = {
      maxRequests: this.configService.get<number>('RATE_LIMIT_MAX_REQUESTS', 100),
      windowMs: this.configService.get<number>('RATE_LIMIT_WINDOW_MS', 60000), // 1分钟
      skipSuccessfulRequests: false,
      skipFailedRequests: false,
      message: 'Too many requests, please try again later.',
    };
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // 获取限流配置
    const rateLimitOptions = this.reflector.getAllAndOverride<RateLimitOptions>(RATE_LIMIT_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // 如果没有限流配置，允许通过
    if (!rateLimitOptions) {
      return true;
    }

    const options = { ...this.defaultOptions, ...rateLimitOptions };
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();

    try {
      // 生成限流键
      const key = this.generateKey(context, options);

      // 检查限流状态
      const rateLimitInfo = await this.checkRateLimit(key, options);

      // 设置响应头
      this.setRateLimitHeaders(response, rateLimitInfo, options);

      // 如果被限流，抛出异常
      if (rateLimitInfo.isBlocked) {
        this.logger.warn(`Rate limit exceeded for key: ${key}`);
        throw new HttpException(
          {
            statusCode: HttpStatus.TOO_MANY_REQUESTS,
            message: options.message,
            error: 'Too Many Requests',
            retryAfter: Math.ceil(rateLimitInfo.msBeforeNext / 1000),
          },
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }

      this.logger.debug(`Rate limit check passed for key: ${key}`, rateLimitInfo);
      return true;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      this.logger.error('Rate limit check failed:', error);
      // 如果Redis出错，默认允许通过（可配置）
      return true;
    }
  }

  /**
   * 生成限流键
   */
  private generateKey(context: ExecutionContext, options: RateLimitOptions): string {
    if (options.keyGenerator) {
      return options.keyGenerator(context);
    }

    const request = context.switchToHttp().getRequest();
    const user: IAuthentication = request.user;
    const ip = this.getClientIp(request);
    const route = request.route?.path || request.url;

    // 如果用户已认证，使用用户ID；否则使用IP地址
    const identifier = user?.uid || ip;
    
    return `rate_limit:${identifier}:${route}`;
  }

  /**
   * 检查限流状态
   */
  private async checkRateLimit(key: string, options: RateLimitOptions): Promise<RateLimitInfo> {
    const now = Date.now();
    const windowStart = now - options.windowMs;

    // 使用Redis的有序集合实现滑动窗口限流
    const pipeline = this.redis.pipeline();
    
    // 删除窗口外的记录
    pipeline.zremrangebyscore(key, 0, windowStart);
    
    // 添加当前请求
    pipeline.zadd(key, now, `${now}-${Math.random()}`);
    
    // 获取窗口内的请求数
    pipeline.zcard(key);
    
    // 设置过期时间
    pipeline.expire(key, Math.ceil(options.windowMs / 1000));

    const results = await pipeline.exec();
    
    if (!results) {
      throw new Error('Redis pipeline execution failed');
    }

    const totalHits = results[2][1] as number;
    const remainingPoints = Math.max(0, options.maxRequests - totalHits);
    const isBlocked = totalHits > options.maxRequests;

    // 计算下次重置时间
    let msBeforeNext = 0;
    if (isBlocked) {
      // 获取最早的请求时间
      const earliestRequests = await this.redis.zrange(key, 0, 0, 'WITHSCORES');
      if (earliestRequests.length > 0) {
        const earliestTime = parseInt(earliestRequests[1], 10);
        msBeforeNext = Math.max(0, earliestTime + options.windowMs - now);
      }
    }

    return {
      totalHits,
      remainingPoints,
      msBeforeNext,
      isBlocked,
    };
  }

  /**
   * 设置限流响应头
   */
  private setRateLimitHeaders(
    response: any,
    rateLimitInfo: RateLimitInfo,
    options: RateLimitOptions,
  ): void {
    response.setHeader('X-RateLimit-Limit', options.maxRequests);
    response.setHeader('X-RateLimit-Remaining', rateLimitInfo.remainingPoints);
    response.setHeader('X-RateLimit-Reset', new Date(Date.now() + rateLimitInfo.msBeforeNext).toISOString());

    if (rateLimitInfo.isBlocked) {
      response.setHeader('Retry-After', Math.ceil(rateLimitInfo.msBeforeNext / 1000));
    }
  }

  /**
   * 获取客户端IP地址
   */
  private getClientIp(request: any): string {
    return (
      request.headers['x-forwarded-for']?.split(',')[0] ||
      request.headers['x-real-ip'] ||
      request.connection?.remoteAddress ||
      request.socket?.remoteAddress ||
      request.ip ||
      'unknown'
    );
  }

  /**
   * 获取限流统计信息
   */
  async getRateLimitStats(key: string): Promise<RateLimitInfo | null> {
    try {
      const now = Date.now();
      const windowStart = now - this.defaultOptions.windowMs;

      // 清理过期记录
      await this.redis.zremrangebyscore(key, 0, windowStart);

      // 获取当前请求数
      const totalHits = await this.redis.zcard(key);
      const remainingPoints = Math.max(0, this.defaultOptions.maxRequests - totalHits);
      const isBlocked = totalHits > this.defaultOptions.maxRequests;

      let msBeforeNext = 0;
      if (isBlocked) {
        const earliestRequests = await this.redis.zrange(key, 0, 0, 'WITHSCORES');
        if (earliestRequests.length > 0) {
          const earliestTime = parseInt(earliestRequests[1], 10);
          msBeforeNext = Math.max(0, earliestTime + this.defaultOptions.windowMs - now);
        }
      }

      return {
        totalHits,
        remainingPoints,
        msBeforeNext,
        isBlocked,
      };
    } catch (error) {
      this.logger.error('Failed to get rate limit stats:', error);
      return null;
    }
  }

  /**
   * 重置限流计数
   */
  async resetRateLimit(key: string): Promise<void> {
    try {
      await this.redis.del(key);
      this.logger.log(`Rate limit reset for key: ${key}`);
    } catch (error) {
      this.logger.error('Failed to reset rate limit:', error);
    }
  }
}
