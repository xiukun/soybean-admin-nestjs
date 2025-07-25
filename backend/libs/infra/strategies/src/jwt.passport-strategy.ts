import { Inject, Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

import { ISecurityConfig, SecurityConfig } from '@lib/config';
import { IAuthentication } from '@lib/typings/global';
import { RedisUtility } from '@lib/shared/redis/redis.util';
import { CacheConstant } from '@lib/constants/cache.constant';

/**
 * 统一JWT认证策略
 * 支持多微服务的JWT token验证
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  private readonly logger = new Logger(JwtStrategy.name);

  constructor(
    @Inject(SecurityConfig.KEY)
    private readonly securityConfig: ISecurityConfig,
    private readonly configService: ConfigService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: securityConfig.jwtSecret,
      passReqToCallback: true, // 允许在validate方法中访问request对象
    });
  }

  /**
   * JWT payload验证
   */
  async validate(request: any, payload: any): Promise<IAuthentication> {
    try {
      // 验证payload结构
      await this.validateAuthenticationPayload(payload);

      // 验证token是否在黑名单中
      await this.validateTokenBlacklist(payload);

      // 验证用户会话是否有效
      await this.validateUserSession(payload);

      // 记录访问日志（可选）
      this.logAccess(payload, request);

      return payload;
    } catch (error) {
      this.logger.error('JWT validation failed:', error);
      throw error;
    }
  }

  /**
   * 验证认证payload结构
   */
  private assertIsIAuthentication(payload: any): asserts payload is IAuthentication {
    if (!payload) {
      throw new UnauthorizedException('Invalid token payload');
    }

    if (typeof payload.uid !== 'string' || !payload.uid) {
      throw new UnauthorizedException('Invalid or missing UID');
    }

    if (typeof payload.username !== 'string' || !payload.username) {
      throw new UnauthorizedException('Invalid or missing username');
    }

    if (typeof payload.domain !== 'string' || !payload.domain) {
      throw new UnauthorizedException('Invalid or missing domain');
    }

    // 验证token类型
    if (payload.type && payload.type !== 'access') {
      throw new UnauthorizedException('Invalid token type');
    }

    // 验证过期时间
    if (payload.exp && Date.now() >= payload.exp * 1000) {
      throw new UnauthorizedException('Token has expired');
    }
  }

  /**
   * 验证认证payload
   */
  private async validateAuthenticationPayload(payload: any): Promise<IAuthentication> {
    this.assertIsIAuthentication(payload);
    return payload;
  }

  /**
   * 验证token黑名单
   */
  private async validateTokenBlacklist(payload: IAuthentication): Promise<void> {
    try {
      const blacklistKey = `${CacheConstant.TOKEN_BLACKLIST_PREFIX}${payload.jti || payload.uid}`;
      const isBlacklisted = await RedisUtility.instance.exists(blacklistKey);

      if (isBlacklisted) {
        throw new UnauthorizedException('Token has been revoked');
      }
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      // Redis连接错误时记录日志但不阻止认证
      this.logger.warn('Failed to check token blacklist:', error);
    }
  }

  /**
   * 验证用户会话
   */
  private async validateUserSession(payload: IAuthentication): Promise<void> {
    try {
      const sessionKey = `${CacheConstant.USER_SESSION_PREFIX}${payload.uid}`;
      const sessionExists = await RedisUtility.instance.exists(sessionKey);

      if (!sessionExists) {
        throw new UnauthorizedException('User session has expired');
      }

      // 更新会话最后访问时间
      await RedisUtility.instance.hset(sessionKey, 'lastAccess', Date.now().toString());
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      // Redis连接错误时记录日志但不阻止认证
      this.logger.warn('Failed to validate user session:', error);
    }
  }

  /**
   * 记录访问日志
   */
  private logAccess(payload: IAuthentication, request: any): void {
    if (this.configService.get('NODE_ENV') === 'development') {
      const userAgent = request.headers['user-agent'] || 'Unknown';
      const ip = request.ip || request.connection?.remoteAddress || 'Unknown';

      this.logger.debug(`User access: ${payload.username} (${payload.uid}) from ${ip}`, {
        userId: payload.uid,
        username: payload.username,
        domain: payload.domain,
        userAgent,
        ip,
        timestamp: new Date().toISOString(),
      });
    }
  }
}
