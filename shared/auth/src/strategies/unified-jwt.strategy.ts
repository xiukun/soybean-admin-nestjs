import { Injectable, UnauthorizedException, Inject, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

import { UnifiedJwtService, IAuthentication, JwtPayload } from '../services/unified-jwt.service';
import { UnifiedJwtConfig, JWT_CONFIG_TOKEN } from '../config/jwt.config';

/**
 * 统一JWT策略
 * 用于验证JWT令牌，支持所有微服务
 */
@Injectable()
export class UnifiedJwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  private readonly logger = new Logger(UnifiedJwtStrategy.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly jwtService: UnifiedJwtService,
    @Inject(JWT_CONFIG_TOKEN) private readonly jwtConfig: UnifiedJwtConfig,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtConfig.accessTokenSecret,
      passReqToCallback: true, // 允许在validate方法中访问request对象
    });
  }

  async validate(request: any, payload: JwtPayload): Promise<IAuthentication> {
    try {
      // 验证基本字段
      this.validateBasicFields(payload);

      // 验证签发者和受众
      this.validateIssuerAndAudience(payload);

      // 验证令牌类型
      if (payload.type !== 'access') {
        throw new UnauthorizedException('Invalid token type');
      }

      // 使用统一JWT服务进行额外验证
      await this.jwtService.verifyAccessToken(this.extractTokenFromRequest(request));

      // 记录访问日志（开发环境）
      this.logAccess(payload, request);

      // 返回用户信息
      return {
        uid: payload.uid,
        username: payload.username,
        domain: payload.domain,
        roles: payload.roles || [],
        permissions: payload.permissions || [],
        email: payload.email,
        extra: payload.extra,
      };
    } catch (error) {
      this.logger.error('JWT validation failed:', error);
      throw error;
    }
  }

  /**
   * 验证基本字段
   */
  private validateBasicFields(payload: JwtPayload): void {
    if (!payload.uid || !payload.username || !payload.domain) {
      throw new UnauthorizedException('Invalid JWT payload: missing required fields');
    }

    if (typeof payload.uid !== 'string' || typeof payload.username !== 'string' || typeof payload.domain !== 'string') {
      throw new UnauthorizedException('Invalid JWT payload: invalid field types');
    }
  }

  /**
   * 验证签发者和受众
   */
  private validateIssuerAndAudience(payload: JwtPayload): void {
    if (payload.iss && payload.iss !== this.jwtConfig.issuer) {
      throw new UnauthorizedException('Invalid JWT issuer');
    }

    if (payload.aud && payload.aud !== this.jwtConfig.audience) {
      throw new UnauthorizedException('Invalid JWT audience');
    }
  }

  /**
   * 从请求中提取令牌
   */
  private extractTokenFromRequest(request: any): string {
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing or invalid authorization header');
    }
    return authHeader.substring(7);
  }

  /**
   * 记录访问日志
   */
  private logAccess(payload: JwtPayload, request: any): void {
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
