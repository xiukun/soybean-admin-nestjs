import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EventPublisher, QueryBus } from '@nestjs/cqrs';
import { JwtService } from '@nestjs/jwt';

import { TokensReadModel } from '@app/base-system/lib/bounded-contexts/iam/tokens/domain/tokens.read.model';
import { TokensByRefreshTokenQuery } from '@app/base-system/lib/bounded-contexts/iam/tokens/queries/tokens.by-refresh_token.query';

import { ISecurityConfig, SecurityConfig } from '@lib/config';
import { CacheConstant } from '@lib/constants/cache.constant';
import { RedisUtility } from '@lib/shared/redis/redis.util';
import { IAuthentication } from '@lib/typings/global';
// import { UnifiedJwtService } from '../../../../../../../shared/auth/src';

import { TokenGeneratedEvent } from '../../../tokens/domain/events/token-generated.event';
import { TokensEntity } from '../../../tokens/domain/tokens.entity';
import { UserReadRepoPortToken } from '../../constants';
import { UserLoggedInEvent } from '../../domain/events/user-logged-in.event';
import { User } from '../../domain/user';
import { UserReadRepoPort } from '../../ports/user.read.repo-port';
import { PasswordIdentifierDTO } from '../dto/password-identifier.dto';
import { RefreshTokenDTO } from '../dto/refresh-token.dto';

@Injectable()
export class AuthenticationService {
  constructor(
    private jwtService: JwtService,
    // private readonly unifiedJwtService: UnifiedJwtService,
    private readonly publisher: EventPublisher,
    @Inject(UserReadRepoPortToken)
    private readonly repository: UserReadRepoPort,
    private queryBus: QueryBus,
    @Inject(SecurityConfig.KEY) private securityConfig: ISecurityConfig,
  ) {}

  async refreshToken(dto: RefreshTokenDTO) {
    try {
      // 使用统一JWT服务刷新token - 暂时禁用
      // const tokenPair = await this.unifiedJwtService.refreshToken(dto.refreshToken);
      throw new Error('Token refresh temporarily disabled');
    } catch (error) {
      throw new NotFoundException('Refresh token not found or invalid.');
    }
  }

  async execPasswordLogin(
    dto: PasswordIdentifierDTO,
  ): Promise<{ token: string; refreshToken: string }> {
    const { identifier, password } = dto;
    const user = await this.repository.findUserByIdentifier(identifier);
    if (!user) {
      throw new NotFoundException('User not found.');
    }
    const userAggregate = new User(user);
    const loginResult = await userAggregate.loginUser(password);

    if (!loginResult.success) {
      throw new BadRequestException(loginResult.message);
    }

    // 使用统一JWT服务生成token - 暂时使用原有JWT服务
    // const tokenPair = await this.unifiedJwtService.generateTokenPair({
    //   uid: user.id,
    //   username: user.username,
    //   domain: user.domain,
    // });

    // 使用原有JWT服务生成token
    const payload = {
      uid: user.id,
      username: user.username,
      domain: user.domain,
    };
    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(payload, { expiresIn: '7d' });

    const tokens = {
      token: accessToken,
      refreshToken: refreshToken,
    };

    userAggregate.apply(
      new UserLoggedInEvent(
        user.id,
        user.username,
        user.domain,
        dto.ip,
        dto.address,
        dto.userAgent,
        dto.requestId,
        dto.type,
        dto.port,
      ),
    );
    userAggregate.apply(
      new TokenGeneratedEvent(
        tokens.token,
        tokens.refreshToken,
        user.id,
        user.username,
        user.domain,
        dto.ip,
        dto.address,
        dto.userAgent,
        dto.requestId,
        dto.type,
        dto.port,
      ),
    );
    this.publisher.mergeObjectContext(userAggregate);
    userAggregate.commit();

    const result = await this.repository.findRolesByUserId(user.id);
    const key = `${CacheConstant.AUTH_TOKEN_PREFIX}${user.id}`;
    await RedisUtility.instance.del(key);

    if (result.size > 0) {
      const roles = Array.from(result);
      if (roles.length > 0) {
        await RedisUtility.instance.sadd(key, ...roles);
      }
    }

    await RedisUtility.instance.expire(key, this.securityConfig.jwtExpiresIn);

    return tokens;
  }

  private async generateAccessToken(
    userId: string,
    username: string,
    domain: string,
  ): Promise<{ token: string; refreshToken: string }> {
    const payload: IAuthentication = {
      uid: userId,
      username: username,
      domain: domain,
    };
    const accessToken = await this.jwtService.signAsync(payload);
    const refreshToken = await this.jwtService.signAsync(payload, {
      secret: this.securityConfig.refreshJwtSecret,
      expiresIn: this.securityConfig.refreshJwtExpiresIn,
    });

    return { token: accessToken, refreshToken };
  }
}
