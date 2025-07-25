import { Controller, Post, Body, HttpCode, HttpStatus, UnauthorizedException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse as SwaggerApiResponse, ApiProperty } from '@nestjs/swagger';
import { PrismaService } from '../services/prisma.service';
import { Public } from '../decorators/public.decorator';
import { IsString, IsNotEmpty } from 'class-validator';
import * as bcrypt from 'bcryptjs';

// 临时的JWT服务，后续会使用统一认证库
import * as jwt from 'jsonwebtoken';

/**
 * 登录请求DTO
 */
export class LoginDto {
  @ApiProperty({
    description: '用户名',
    example: 'admin',
    minLength: 1,
    maxLength: 50,
  })
  @IsString()
  @IsNotEmpty()
  username: string;

  @ApiProperty({
    description: '密码',
    example: 'admin123',
    minLength: 6,
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty()
  password: string;
}

/**
 * 刷新令牌请求DTO
 */
export class RefreshTokenDto {
  @ApiProperty({
    description: '刷新令牌',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  @IsString()
  @IsNotEmpty()
  refreshToken: string;
}

/**
 * 用户信息响应
 */
export class UserResponse {
  @ApiProperty({ description: '用户ID', example: '1' })
  uid: string;

  @ApiProperty({ description: '用户名', example: 'admin' })
  username: string;

  @ApiProperty({ description: '用户域', example: 'built-in' })
  domain: string;

  @ApiProperty({
    description: '用户角色',
    example: ['admin'],
    type: [String],
    required: false
  })
  roles?: string[];

  @ApiProperty({
    description: '用户权限',
    example: ['*'],
    type: [String],
    required: false
  })
  permissions?: string[];
}

/**
 * 登录响应数据
 */
export class LoginResponseData {
  @ApiProperty({
    description: '访问令牌',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
  })
  token: string;

  @ApiProperty({
    description: '刷新令牌',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
  })
  refreshToken: string;

  @ApiProperty({ description: '令牌类型', example: 'Bearer' })
  tokenType: string;

  @ApiProperty({ description: '过期时间（秒）', example: 7200 })
  expiresIn: number;

  @ApiProperty({ description: '用户信息', type: UserResponse })
  user: UserResponse;
}

/**
 * 统一响应格式
 */
export class ApiResponse<T = any> {
  @ApiProperty({ description: '状态码，0表示成功，1表示失败', example: 0 })
  status: number;

  @ApiProperty({ description: '响应消息', example: 'success' })
  msg: string;

  @ApiProperty({ description: '响应数据' })
  data: T;
}

interface LoginResponse {
  token: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
  user: {
    uid: string;
    username: string;
    domain: string;
    roles?: string[];
    permissions?: string[];
  };
}

/**
 * 统一认证控制器
 * 为amis低代码后端提供登录功能
 */
@ApiTags('认证')
@Controller('auth')
export class AuthController {
  constructor(private readonly prisma: PrismaService) {}

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '用户登录',
    description: '使用用户名和密码进行登录，成功后返回JWT访问令牌和刷新令牌'
  })
  @SwaggerApiResponse({
    status: HttpStatus.OK,
    description: '登录成功',
    type: ApiResponse<LoginResponseData>,
    schema: {
      example: {
        status: 0,
        msg: 'success',
        data: {
          token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1aWQiOiIxIiwidXNlcm5hbWUiOiJhZG1pbiIsImRvbWFpbiI6ImJ1aWx0LWluIiwicm9sZXMiOlsiYWRtaW4iXSwicGVybWlzc2lvbnMiOlsiKiJdLCJpc3MiOiJzb3liZWFuLWFkbWluIiwiYXVkIjoic295YmVhbi1hZG1pbiIsImlhdCI6MTc1MzMyMTYzNCwiZXhwIjoxNzUzMzI4ODM0fQ.Hu61vH-99g_rHH6_zFrw8YokP2iA0UktIok16O3-HV4',
          refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1aWQiOiIxIiwidXNlcm5hbWUiOiJhZG1pbiIsImRvbWFpbiI6ImJ1aWx0LWluIiwiaXNzIjoic295YmVhbi1hZG1pbiIsImF1ZCI6InNveWJlYW4tYWRtaW4iLCJpYXQiOjE3NTMzMjE2MzQsImV4cCI6MTc1Mzk0NjQzNH0.abc123...',
          tokenType: 'Bearer',
          expiresIn: 7200,
          user: {
            uid: '1',
            username: 'admin',
            domain: 'built-in',
            roles: ['admin'],
            permissions: ['*']
          }
        }
      }
    }
  })
  @SwaggerApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: '请求参数错误',
    schema: {
      example: {
        status: 1,
        msg: '用户名或密码不能为空',
        data: null
      }
    }
  })
  @SwaggerApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: '用户名或密码错误',
    schema: {
      example: {
        status: 1,
        msg: '用户名或密码错误',
        data: null
      }
    }
  })
  async login(@Body() loginDto: LoginDto): Promise<any> {
    try {
      const { username, password } = loginDto;

      // 查找用户
      const user = await this.findUserByUsername(username);
      if (!user) {
        throw new UnauthorizedException('用户名或密码错误');
      }

      // 验证密码
      const isPasswordValid = await this.validatePassword(password, user.password);
      if (!isPasswordValid) {
        throw new UnauthorizedException('用户名或密码错误');
      }

      // 生成JWT token
      const loginResponse = this.generateLoginResponse(user);

      return {
        status: 0,
        msg: 'success',
        data: loginResponse,
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        return {
          status: 1,
          msg: error.message,
          data: null,
        };
      }

      return {
        status: 1,
        msg: '登录失败',
        data: null,
      };
    }
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '刷新访问令牌',
    description: '使用刷新令牌获取新的访问令牌，延长登录状态'
  })
  @SwaggerApiResponse({
    status: HttpStatus.OK,
    description: '刷新成功',
    type: ApiResponse<LoginResponseData>,
    schema: {
      example: {
        status: 0,
        msg: 'success',
        data: {
          token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.new_access_token...',
          refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.new_refresh_token...',
          tokenType: 'Bearer',
          expiresIn: 7200,
          user: {
            uid: '1',
            username: 'admin',
            domain: 'built-in',
            roles: ['admin'],
            permissions: ['*']
          }
        }
      }
    }
  })
  @SwaggerApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: '刷新令牌无效或已过期',
    schema: {
      example: {
        status: 1,
        msg: '刷新令牌失败',
        data: null
      }
    }
  })
  async refresh(@Body() refreshTokenDto: RefreshTokenDto): Promise<any> {
    try {
      const { refreshToken } = refreshTokenDto;

      // 验证刷新令牌
      const payload = this.verifyRefreshToken(refreshToken);
      
      // 查找用户
      const user = await this.findUserByUsername(payload.username);
      if (!user) {
        throw new UnauthorizedException('用户不存在');
      }

      // 生成新的令牌
      const loginResponse = this.generateLoginResponse(user);

      return {
        status: 0,
        msg: 'success',
        data: loginResponse,
      };
    } catch (error) {
      return {
        status: 1,
        msg: '刷新令牌失败',
        data: null,
      };
    }
  }

  /**
   * 根据用户名查找用户
   */
  private async findUserByUsername(username: string): Promise<any> {
    // 这里需要根据实际的用户表结构来查询
    // 暂时返回一个模拟用户
    if (username === 'admin') {
      return {
        id: '1',
        username: 'admin',
        password: await bcrypt.hash('admin123', 10), // 模拟加密密码
        domain: 'built-in',
        roles: ['admin'],
        permissions: ['*'],
      };
    }

    if (username === 'Soybean') {
      return {
        id: '2',
        username: 'Soybean',
        password: await bcrypt.hash('soybean123', 10), // 模拟加密密码
        domain: 'built-in',
        roles: ['user'],
        permissions: ['read', 'write'],
      };
    }

    return null;
  }

  /**
   * 验证密码
   */
  private async validatePassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(plainPassword, hashedPassword);
  }

  /**
   * 生成登录响应
   */
  private generateLoginResponse(user: any): LoginResponse {
    const payload = {
      uid: user.id,
      username: user.username,
      domain: user.domain,
      roles: user.roles || [],
      permissions: user.permissions || [],
    };

    const secret = process.env.JWT_SECRET || 'default-secret';
    const expiresIn = 7200; // 2小时

    const accessToken = jwt.sign(
      {
        ...payload,
        iss: 'soybean-admin',
        aud: 'soybean-admin',
      },
      secret,
      { expiresIn: `${expiresIn}s` }
    );

    const refreshToken = jwt.sign(
      {
        uid: user.id,
        username: user.username,
        domain: user.domain,
        iss: 'soybean-admin',
        aud: 'soybean-admin',
      },
      process.env.REFRESH_TOKEN_SECRET || 'default-refresh-secret',
      { expiresIn: '7d' }
    );

    return {
      token: accessToken,
      refreshToken,
      tokenType: 'Bearer',
      expiresIn,
      user: {
        uid: user.id,
        username: user.username,
        domain: user.domain,
        roles: user.roles,
        permissions: user.permissions,
      },
    };
  }

  /**
   * 验证刷新令牌
   */
  private verifyRefreshToken(token: string): any {
    const secret = process.env.REFRESH_TOKEN_SECRET || 'default-refresh-secret';
    return jwt.verify(token, secret);
  }
}
