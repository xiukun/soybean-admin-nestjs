import { Body, Controller, Get, Post, Request, Delete, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiTags, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { FastifyRequest } from 'fastify';

import { PasswordIdentifierDTO } from '@app/base-system/lib/bounded-contexts/iam/authentication/application/dto/password-identifier.dto';
import { RefreshTokenDTO } from '@app/base-system/lib/bounded-contexts/iam/authentication/application/dto/refresh-token.dto';
import { AuthenticationService } from '@app/base-system/lib/bounded-contexts/iam/authentication/application/service/authentication.service';

import { CacheConstant } from '@lib/constants/cache.constant';
import { USER_AGENT } from '@lib/constants/rest.constant';
import { Public } from '@lib/infra/decorators/public.decorator';
import { ApiRes } from '@lib/infra/rest/res.response';
import { Ip2regionService } from '@lib/shared/ip2region/ip2region.service';
import { RedisUtility } from '@lib/shared/redis/redis.util';
import { IAuthentication } from '@lib/typings/global';
import { getClientIpAndPort } from '@lib/utils/ip.util';
import { UnifiedJwtService } from '@lib/shared/jwt';

import { PasswordLoginDto } from '../dto/password-login.dto';
import { ApiJwtAuth } from '@lib/infra/decorators';

@ApiTags('Authentication - Module')
@Controller('auth')
export class AuthenticationController {
  constructor(
    private readonly authenticationService: AuthenticationService,
    private readonly jwtService: UnifiedJwtService,
  ) {}

  @Public()
  @Post('login')
  @ApiOperation({
    summary: 'Password-based User Authentication',
    description:
      'Authenticates a user by verifying provided password credentials and issues a JSON Web Token (JWT) upon successful authentication.',
  })
  async login(
    @Body() dto: PasswordLoginDto,
    @Request() request: FastifyRequest,
  ): Promise<ApiRes<any>> {
    const { ip, port } = getClientIpAndPort(request);
    let region = 'Unknown';

    try {
      const ip2regionResult = await Ip2regionService.getSearcher().search(ip);
      region = ip2regionResult.region || region;
    } catch (_) {}
    const token = await this.authenticationService.execPasswordLogin(
      new PasswordIdentifierDTO(
        dto.identifier,
        dto.password,
        ip,
        region,
        request.headers[USER_AGENT] ?? '',
        'TODO',
        'PC',
        port,
      ),
    );
    return ApiRes.success(token);
  }

  @Public()
  @Post('refreshToken')
  async refreshToken(
    @Body('refreshToken') refreshToken: string,
    @Request() request: FastifyRequest,
  ): Promise<ApiRes<any>> {
    const { ip, port } = getClientIpAndPort(request);
    let region = 'Unknown';

    try {
      const ip2regionResult = await Ip2regionService.getSearcher().search(ip);
      region = ip2regionResult.region || region;
    } catch (_) {}
    const token = await this.authenticationService.refreshToken(
      new RefreshTokenDTO(
        refreshToken,
        ip,
        region,
        request.headers[USER_AGENT] ?? '',
        'TODO',
        'PC',
        port,
      ),
    );
    return ApiRes.success(token);
  }

  @ApiJwtAuth() // 添加Bearer认证装饰器
  @Get('getUserInfo')
  async getProfile(@Request() req: any): Promise<ApiRes<any>> {
    const user: IAuthentication = req.user;
    const userRoles = await RedisUtility.instance.smembers(
      `${CacheConstant.AUTH_TOKEN_PREFIX}${user.uid}`,
    );
    return ApiRes.success({
      userId: user.uid,
      userName: user.username,
      roles: userRoles,
    });
  }

  @ApiJwtAuth()
  @Post('logout')
  @ApiOperation({
    summary: 'User Logout',
    description: 'Logs out the user and revokes the current access token',
  })
  @ApiResponse({ status: 200, description: '登出成功' })
  @HttpCode(HttpStatus.OK)
  async logout(@Request() req: any): Promise<ApiRes<any>> {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (token) {
      await this.jwtService.revokeToken(token);
    }

    // 撤销用户所有token
    if (req.user?.uid) {
      await this.jwtService.revokeAllUserTokens(req.user.uid);
    }

    return ApiRes.success({ message: '登出成功' });
  }

  @ApiJwtAuth()
  @Get('token/statistics')
  @ApiOperation({
    summary: 'Get Token Statistics',
    description: 'Retrieves token usage statistics for the current user',
  })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getTokenStatistics(@Request() req: any): Promise<ApiRes<any>> {
    const stats = await this.jwtService.getTokenStatistics(req.user.uid);
    return ApiRes.success(stats);
  }

  @ApiJwtAuth()
  @Delete('token/revoke-all')
  @ApiOperation({
    summary: 'Revoke All Tokens',
    description: 'Revokes all tokens for the current user',
  })
  @ApiResponse({ status: 200, description: '撤销成功' })
  @HttpCode(HttpStatus.OK)
  async revokeAllTokens(@Request() req: any): Promise<ApiRes<any>> {
    await this.jwtService.revokeAllUserTokens(req.user.uid);
    return ApiRes.success({ message: '所有令牌已撤销' });
  }
}
