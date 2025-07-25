import { Injectable, Logger, UnauthorizedException, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService as NestJwtService } from '@nestjs/jwt';
import * as crypto from 'crypto';
import { Redis } from 'ioredis';

import { UnifiedJwtConfig, JWT_CONFIG_TOKEN, JWT_CONSTANTS } from '../config/jwt.config';

/**
 * 统一的用户认证信息接口
 * 兼容所有微服务的用户数据结构
 */
export interface IAuthentication {
  /** 用户ID */
  uid: string;
  /** 用户名 */
  username: string;
  /** 用户域 */
  domain: string;
  /** 用户角色 */
  roles?: string[];
  /** 用户权限 */
  permissions?: string[];
  /** 用户邮箱 */
  email?: string;
  /** 额外信息 */
  extra?: Record<string, any>;
}

/**
 * JWT载荷数据
 */
export interface JwtPayload extends IAuthentication {
  /** 令牌类型 */
  type: 'access' | 'refresh';
  /** 发行者 */
  iss: string;
  /** 受众 */
  aud: string;
  /** 发行时间 */
  iat: number;
  /** 过期时间 */
  exp: number;
  /** JWT ID */
  jti: string;
}

/**
 * 令牌对
 */
export interface TokenPair {
  /** 访问令牌 */
  accessToken: string;
  /** 刷新令牌 */
  refreshToken: string;
  /** 访问令牌过期时间（秒） */
  accessTokenExpiresIn: number;
  /** 刷新令牌过期时间（秒） */
  refreshTokenExpiresIn: number;
  /** 令牌类型 */
  tokenType: string;
  /** 用户信息 */
  user?: IAuthentication;
}

/**
 * 统一JWT服务
 * 提供跨微服务的JWT认证功能
 * 支持：backend, lowcode-platform-backend, amis-lowcode-backend
 */
@Injectable()
export class UnifiedJwtService {
  private readonly logger = new Logger(UnifiedJwtService.name);
  private readonly redis: Redis;

  constructor(
    private readonly jwtService: NestJwtService,
    private readonly configService: ConfigService,
    @Inject(JWT_CONFIG_TOKEN) private readonly jwtConfig: UnifiedJwtConfig,
  ) {
    // 初始化Redis连接
    this.redis = new Redis({
      host: this.jwtConfig.redis.host,
      port: this.jwtConfig.redis.port,
      password: this.jwtConfig.redis.password,
      db: this.jwtConfig.redis.db,
      retryDelayOnFailover: 100,
      maxRetriesPerRequest: 3,
      lazyConnect: true,
    });

    this.redis.on('error', (error) => {
      this.logger.error('Redis connection error:', error);
    });

    this.redis.on('connect', () => {
      this.logger.log('Redis connected successfully');
    });
  }

  /**
   * 生成令牌对
   */
  async generateTokenPair(user: IAuthentication): Promise<TokenPair> {
    try {
      const jti = this.generateJti();
      const now = Math.floor(Date.now() / 1000);

      // 计算过期时间
      const accessTokenExpiresIn = this.parseExpiresIn(this.jwtConfig.accessTokenExpiresIn);
      const refreshTokenExpiresIn = this.parseExpiresIn(this.jwtConfig.refreshTokenExpiresIn);

      // 生成访问令牌
      const accessTokenPayload: Partial<JwtPayload> = {
        uid: user.uid,
        username: user.username,
        domain: user.domain,
        roles: user.roles || [],
        permissions: user.permissions || [],
        email: user.email,
        type: 'access',
        iss: this.jwtConfig.issuer,
        aud: this.jwtConfig.audience,
        iat: now,
        exp: now + accessTokenExpiresIn,
        jti,
      };

      const accessToken = this.jwtService.sign(accessTokenPayload, {
        secret: this.jwtConfig.accessTokenSecret,
        expiresIn: this.jwtConfig.accessTokenExpiresIn,
      });

      // 生成刷新令牌
      const refreshTokenPayload: Partial<JwtPayload> = {
        uid: user.uid,
        username: user.username,
        domain: user.domain,
        type: 'refresh',
        iss: this.jwtConfig.issuer,
        aud: this.jwtConfig.audience,
        iat: now,
        exp: now + refreshTokenExpiresIn,
        jti: jti + '_refresh',
      };

      const refreshToken = this.jwtService.sign(refreshTokenPayload, {
        secret: this.jwtConfig.refreshTokenSecret,
        expiresIn: this.jwtConfig.refreshTokenExpiresIn,
      });

      // 存储令牌信息
      if (this.jwtConfig.enableSessionManagement) {
        await this.storeTokenInfo(user.uid, jti, accessToken, refreshToken);
        await this.updateUserSession(user);
      }

      this.logger.log(`Generated token pair for user: ${user.username}`);

      return {
        accessToken,
        refreshToken,
        accessTokenExpiresIn,
        refreshTokenExpiresIn,
        tokenType: 'Bearer',
        user,
      };
    } catch (error) {
      this.logger.error('Failed to generate token pair:', error);
      throw new Error('Token generation failed');
    }
  }

  /**
   * 验证访问令牌
   */
  async verifyAccessToken(token: string): Promise<JwtPayload> {
    try {
      const payload = this.jwtService.verify(token, {
        secret: this.jwtConfig.accessTokenSecret,
      }) as JwtPayload;

      // 验证令牌类型
      if (payload.type !== 'access') {
        throw new UnauthorizedException('Invalid token type');
      }

      // 检查黑名单
      if (this.jwtConfig.enableBlacklist) {
        await this.checkTokenBlacklist(payload.jti);
      }

      return payload;
    } catch (error) {
      this.logger.warn('Access token verification failed:', error.message);
      throw new UnauthorizedException('Invalid access token');
    }
  }

  /**
   * 验证刷新令牌
   */
  async verifyRefreshToken(token: string): Promise<JwtPayload> {
    try {
      const payload = this.jwtService.verify(token, {
        secret: this.jwtConfig.refreshTokenSecret,
      }) as JwtPayload;

      // 验证令牌类型
      if (payload.type !== 'refresh') {
        throw new UnauthorizedException('Invalid token type');
      }

      // 检查黑名单
      if (this.jwtConfig.enableBlacklist) {
        await this.checkTokenBlacklist(payload.jti);
      }

      return payload;
    } catch (error) {
      this.logger.warn('Refresh token verification failed:', error.message);
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  /**
   * 刷新令牌
   */
  async refreshToken(refreshToken: string): Promise<TokenPair> {
    try {
      // 验证刷新令牌
      const payload = await this.verifyRefreshToken(refreshToken);

      // 构造用户信息
      const user: IAuthentication = {
        uid: payload.uid,
        username: payload.username,
        domain: payload.domain,
        roles: payload.roles,
        permissions: payload.permissions,
        email: payload.email,
      };

      // 将旧的刷新令牌加入黑名单
      if (this.jwtConfig.enableBlacklist) {
        const ttl = payload.exp - Math.floor(Date.now() / 1000);
        if (ttl > 0) {
          await this.addToBlacklist(payload.jti, ttl);
        }
      }

      // 生成新的令牌对
      return await this.generateTokenPair(user);
    } catch (error) {
      this.logger.error('Token refresh failed:', error);
      throw new UnauthorizedException('Token refresh failed');
    }
  }

  /**
   * 撤销令牌
   */
  async revokeToken(token: string): Promise<void> {
    try {
      const payload = this.jwtService.decode(token) as JwtPayload;
      
      if (payload && payload.jti && this.jwtConfig.enableBlacklist) {
        const ttl = payload.exp - Math.floor(Date.now() / 1000);
        if (ttl > 0) {
          await this.addToBlacklist(payload.jti, ttl);
        }
        
        this.logger.log(`Token revoked for user: ${payload.username}`);
      }
    } catch (error) {
      this.logger.error('Failed to revoke token:', error);
    }
  }

  /**
   * 撤销用户所有令牌
   */
  async revokeAllUserTokens(userId: string): Promise<void> {
    try {
      if (!this.jwtConfig.enableSessionManagement) {
        return;
      }

      // 获取用户所有令牌
      const tokenKeys = await this.redis.keys(`${JWT_CONSTANTS.REDIS_KEYS.USER_TOKENS}${userId}:*`);
      
      for (const key of tokenKeys) {
        const tokenInfo = await this.redis.hgetall(key);
        if (tokenInfo.jti && this.jwtConfig.enableBlacklist) {
          await this.addToBlacklist(tokenInfo.jti, 86400); // 24小时
        }
        await this.redis.del(key);
      }

      // 清除用户会话
      await this.redis.del(`${JWT_CONSTANTS.REDIS_KEYS.USER_SESSION}${userId}`);

      this.logger.log(`All tokens revoked for user: ${userId}`);
    } catch (error) {
      this.logger.error('Failed to revoke all user tokens:', error);
    }
  }

  /**
   * 生成JWT ID
   */
  private generateJti(): string {
    return crypto.randomBytes(16).toString('hex');
  }

  /**
   * 解析过期时间字符串为秒数
   */
  private parseExpiresIn(expiresIn: string): number {
    const match = expiresIn.match(/^(\d+)([smhd])$/);
    if (!match) {
      throw new Error(`Invalid expiresIn format: ${expiresIn}`);
    }

    const value = parseInt(match[1], 10);
    const unit = match[2];

    switch (unit) {
      case 's': return value;
      case 'm': return value * 60;
      case 'h': return value * 60 * 60;
      case 'd': return value * 60 * 60 * 24;
      default: throw new Error(`Invalid time unit: ${unit}`);
    }
  }

  /**
   * 存储令牌信息
   */
  private async storeTokenInfo(
    userId: string,
    jti: string,
    accessToken: string,
    refreshToken: string,
  ): Promise<void> {
    try {
      const tokenKey = `${JWT_CONSTANTS.REDIS_KEYS.USER_TOKENS}${userId}:${jti}`;
      const tokenInfo = {
        jti,
        accessToken: this.hashToken(accessToken),
        refreshToken: this.hashToken(refreshToken),
        createdAt: Date.now().toString(),
        lastUsed: Date.now().toString(),
      };

      const refreshTokenExpiresIn = this.parseExpiresIn(this.jwtConfig.refreshTokenExpiresIn);
      await this.redis.hset(tokenKey, tokenInfo);
      await this.redis.expire(tokenKey, refreshTokenExpiresIn);
    } catch (error) {
      this.logger.error('Failed to store token info:', error);
    }
  }

  /**
   * 更新用户会话
   */
  private async updateUserSession(user: IAuthentication): Promise<void> {
    try {
      const sessionKey = `${JWT_CONSTANTS.REDIS_KEYS.USER_SESSION}${user.uid}`;
      const sessionInfo = {
        userId: user.uid,
        username: user.username,
        domain: user.domain,
        lastLogin: Date.now().toString(),
        lastAccess: Date.now().toString(),
      };

      const refreshTokenExpiresIn = this.parseExpiresIn(this.jwtConfig.refreshTokenExpiresIn);
      await this.redis.hset(sessionKey, sessionInfo);
      await this.redis.expire(sessionKey, refreshTokenExpiresIn);
    } catch (error) {
      this.logger.error('Failed to update user session:', error);
    }
  }

  /**
   * 检查令牌黑名单
   */
  private async checkTokenBlacklist(jti: string): Promise<void> {
    try {
      const blacklistKey = `${JWT_CONSTANTS.REDIS_KEYS.TOKEN_BLACKLIST}${jti}`;
      const isBlacklisted = await this.redis.exists(blacklistKey);

      if (isBlacklisted) {
        throw new UnauthorizedException('Token has been revoked');
      }
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      this.logger.warn('Failed to check token blacklist:', error);
    }
  }

  /**
   * 添加令牌到黑名单
   */
  private async addToBlacklist(jti: string, ttl: number): Promise<void> {
    try {
      const blacklistKey = `${JWT_CONSTANTS.REDIS_KEYS.TOKEN_BLACKLIST}${jti}`;
      await this.redis.setex(blacklistKey, ttl, '1');
    } catch (error) {
      this.logger.error('Failed to add token to blacklist:', error);
    }
  }

  /**
   * 哈希令牌（用于存储）
   */
  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  /**
   * 获取令牌统计信息
   */
  async getTokenStatistics(userId?: string): Promise<{
    totalTokens: number;
    activeTokens: number;
    blacklistedTokens: number;
    userTokens?: number;
  }> {
    try {
      const stats = {
        totalTokens: 0,
        activeTokens: 0,
        blacklistedTokens: 0,
        userTokens: 0,
      };

      if (userId) {
        const userTokenKeys = await this.redis.keys(`${JWT_CONSTANTS.REDIS_KEYS.USER_TOKENS}${userId}:*`);
        stats.userTokens = userTokenKeys.length;
      }

      const blacklistKeys = await this.redis.keys(`${JWT_CONSTANTS.REDIS_KEYS.TOKEN_BLACKLIST}*`);
      stats.blacklistedTokens = blacklistKeys.length;

      const allTokenKeys = await this.redis.keys(`${JWT_CONSTANTS.REDIS_KEYS.USER_TOKENS}*`);
      stats.totalTokens = allTokenKeys.length;
      stats.activeTokens = stats.totalTokens - stats.blacklistedTokens;

      return stats;
    } catch (error) {
      this.logger.error('Failed to get token statistics:', error);
      return {
        totalTokens: 0,
        activeTokens: 0,
        blacklistedTokens: 0,
        userTokens: 0,
      };
    }
  }
}
