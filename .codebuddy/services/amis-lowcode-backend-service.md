# Amis Lowcode Backend 业务后端服务说明文档

## 服务概述

Amis Lowcode Backend 是 SoybeanAdmin NestJS 低代码平台的业务运行时后端服务，专门为低代码平台生成的业务代码提供运行环境。该服务基于 NestJS 框架构建，采用代码生成 + 业务定制的混合架构模式，支持动态 API 生成、数据操作、业务逻辑执行等核心功能。

## 技术架构

### 核心技术栈
- **框架**: NestJS 11.0.12 + TypeScript 5.8.2
- **HTTP 服务器**: Fastify 5.2.2 (高性能)
- **ORM**: Prisma 6.5.0 (类型安全)
- **数据库**: PostgreSQL 16.3 (amis schema)
- **Node.js**: 18.0.0+

### 架构特点
- **代码生成架构**: 基于模板自动生成基础 CRUD 代码
- **业务定制层**: 支持业务逻辑的手动定制和扩展
- **动态 API**: 根据实体模型动态生成 RESTful API
- **多租户支持**: 内置多租户数据隔离机制

### 安全和认证
- **认证**: JWT + Passport
- **加密**: BCrypt 6.0.0 密码加密
- **权限控制**: 基于角色的访问控制
- **数据验证**: Class Validator 数据验证

### 工具和中间件
- **API 文档**: Swagger 11.1.0
- **模板引擎**: Handlebars 4.7.8
- **文件处理**: Fastify Static 8.2.0
- **跨域支持**: Fastify CORS 11.0.1

## 项目结构

```
amis-lowcode-backend/
├── src/
│   ├── main.ts                 # 应用入口
│   ├── app.module.ts           # 根模块
│   ├── app.controller.ts       # 根控制器
│   ├── app.service.ts          # 根服务
│   ├── base/                   # 自动生成的基础代码
│   │   ├── controllers/        # 基础控制器
│   │   ├── dto/                # 数据传输对象
│   │   ├── entities/           # 实体定义
│   │   ├── interfaces/         # 接口定义
│   │   └── services/           # 基础服务
│   ├── biz/                    # 业务定制代码
│   │   ├── controllers/        # 业务控制器
│   │   ├── modules/            # 业务模块
│   │   └── services/           # 业务服务
│   ├── config/                 # 配置文件
│   └── shared/                 # 共享模块
│       ├── database/           # 数据库配置
│       ├── decorators/         # 装饰器
│       ├── dto/                # 通用 DTO
│       ├── guards/             # 守卫
│       ├── interceptors/       # 拦截器
│       ├── services/           # 共享服务
│       └── strategies/         # 认证策略
├── prisma/                     # 数据库配置
│   ├── schema.prisma           # 数据模型
│   ├── migrations/             # 数据库迁移
│   └── seed.ts                 # 数据种子
├── templates/                  # 代码生成模板
├── generated/                  # 生成的代码文件
└── dist/                       # 编译输出
```

## 核心功能模块

### 1. 代码生成架构

#### Base 层 (自动生成)
```typescript
// base/entities/user.entity.ts (自动生成)
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('demo_users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  username: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column({ nullable: true })
  nickname?: string;

  @Column({ nullable: true })
  avatar?: string;

  @Column()
  status: string;

  @Column({ name: 'created_at' })
  createdAt: Date;

  @Column({ name: 'updated_at' })
  updatedAt: Date;

  @Column({ name: 'created_by', nullable: true })
  createdBy?: string;

  @Column({ name: 'updated_by', nullable: true })
  updatedBy?: string;
}
```

#### Base 服务 (自动生成)
```typescript
// base/services/user.service.ts (自动生成)
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../shared/database/prisma.service';
import { CreateUserDto, UpdateUserDto, QueryUserDto } from '../dto/user.dto';

@Injectable()
export class BaseUserService {
  constructor(private prisma: PrismaService) {}

  async create(createUserDto: CreateUserDto) {
    return this.prisma.user.create({
      data: {
        ...createUserDto,
        id: this.generateId(),
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });
  }

  async findAll(query: QueryUserDto) {
    const { page = 1, pageSize = 10, search, status } = query;
    
    const where: any = {};
    if (search) {
      where.OR = [
        { username: { contains: search } },
        { email: { contains: search } },
        { nickname: { contains: search } }
      ];
    }
    if (status) {
      where.status = status;
    }

    const [items, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' }
      }),
      this.prisma.user.count({ where })
    ]);

    return {
      items,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize)
    };
  }

  async findOne(id: string) {
    return this.prisma.user.findUnique({
      where: { id }
    });
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    return this.prisma.user.update({
      where: { id },
      data: {
        ...updateUserDto,
        updatedAt: new Date()
      }
    });
  }

  async remove(id: string) {
    return this.prisma.user.delete({
      where: { id }
    });
  }

  private generateId(): string {
    return require('ulid').ulid();
  }
}
```

#### Base 控制器 (自动生成)
```typescript
// base/controllers/user.controller.ts (自动生成)
import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { BaseUserService } from '../services/user.service';
import { CreateUserDto, UpdateUserDto, QueryUserDto } from '../dto/user.dto';

@ApiTags('用户管理')
@Controller('api/v1/users')
export class BaseUserController {
  constructor(private readonly userService: BaseUserService) {}

  @Post()
  @ApiOperation({ summary: '创建用户' })
  @ApiResponse({ status: 201, description: '用户创建成功' })
  create(@Body() createUserDto: CreateUserDto) {
    return this.userService.create(createUserDto);
  }

  @Get()
  @ApiOperation({ summary: '获取用户列表' })
  @ApiResponse({ status: 200, description: '获取用户列表成功' })
  findAll(@Query() query: QueryUserDto) {
    return this.userService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: '获取用户详情' })
  @ApiResponse({ status: 200, description: '获取用户详情成功' })
  findOne(@Param('id') id: string) {
    return this.userService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: '更新用户' })
  @ApiResponse({ status: 200, description: '用户更新成功' })
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.userService.update(id, updateUserDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除用户' })
  @ApiResponse({ status: 200, description: '用户删除成功' })
  remove(@Param('id') id: string) {
    return this.userService.remove(id);
  }
}
```

### 2. 业务定制层

#### 业务服务扩展
```typescript
// biz/services/user.service.ts (手动定制)
import { Injectable } from '@nestjs/common';
import { BaseUserService } from '../../base/services/user.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UserService extends BaseUserService {
  
  // 扩展：用户注册
  async register(registerDto: RegisterDto) {
    // 检查用户名是否已存在
    const existingUser = await this.prisma.user.findUnique({
      where: { username: registerDto.username }
    });
    
    if (existingUser) {
      throw new ConflictException('用户名已存在');
    }

    // 密码加密
    const hashedPassword = await bcrypt.hash(registerDto.password, 12);

    // 创建用户
    return this.create({
      ...registerDto,
      password: hashedPassword,
      status: 'ACTIVE'
    });
  }

  // 扩展：用户登录
  async login(loginDto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { username: loginDto.username }
    });

    if (!user) {
      throw new UnauthorizedException('用户名或密码错误');
    }

    const isPasswordValid = await bcrypt.compare(loginDto.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('用户名或密码错误');
    }

    // 生成 JWT Token
    const payload = { sub: user.id, username: user.username };
    const token = this.jwtService.sign(payload);

    return {
      access_token: token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        nickname: user.nickname,
        avatar: user.avatar
      }
    };
  }

  // 扩展：修改密码
  async changePassword(userId: string, changePasswordDto: ChangePasswordDto) {
    const user = await this.findOne(userId);
    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    const isOldPasswordValid = await bcrypt.compare(
      changePasswordDto.oldPassword, 
      user.password
    );
    
    if (!isOldPasswordValid) {
      throw new BadRequestException('原密码错误');
    }

    const hashedNewPassword = await bcrypt.hash(changePasswordDto.newPassword, 12);
    
    return this.update(userId, {
      password: hashedNewPassword
    });
  }

  // 扩展：用户统计
  async getUserStats() {
    const [totalUsers, activeUsers, inactiveUsers] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { status: 'ACTIVE' } }),
      this.prisma.user.count({ where: { status: 'INACTIVE' } })
    ]);

    return {
      totalUsers,
      activeUsers,
      inactiveUsers,
      activeRate: totalUsers > 0 ? (activeUsers / totalUsers * 100).toFixed(2) : 0
    };
  }
}
```

#### 业务控制器扩展
```typescript
// biz/controllers/user.controller.ts (手动定制)
import { Controller, Post, Body, Get, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UserService } from '../services/user.service';
import { RegisterDto, LoginDto, ChangePasswordDto } from '../dto/auth.dto';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';

@ApiTags('用户认证')
@Controller('api/v1/auth')
export class AuthController {
  constructor(private readonly userService: UserService) {}

  @Post('register')
  @ApiOperation({ summary: '用户注册' })
  async register(@Body() registerDto: RegisterDto) {
    const user = await this.userService.register(registerDto);
    return {
      code: 200,
      message: '注册成功',
      data: {
        id: user.id,
        username: user.username,
        email: user.email
      }
    };
  }

  @Post('login')
  @ApiOperation({ summary: '用户登录' })
  async login(@Body() loginDto: LoginDto) {
    const result = await this.userService.login(loginDto);
    return {
      code: 200,
      message: '登录成功',
      data: result
    };
  }

  @Post('change-password')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '修改密码' })
  async changePassword(@Request() req, @Body() changePasswordDto: ChangePasswordDto) {
    await this.userService.changePassword(req.user.sub, changePasswordDto);
    return {
      code: 200,
      message: '密码修改成功'
    };
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取用户信息' })
  async getProfile(@Request() req) {
    const user = await this.userService.findOne(req.user.sub);
    return {
      code: 200,
      message: '获取成功',
      data: {
        id: user.id,
        username: user.username,
        email: user.email,
        nickname: user.nickname,
        avatar: user.avatar,
        status: user.status
      }
    };
  }
}

@ApiTags('用户统计')
@Controller('api/v1/user-stats')
export class UserStatsController {
  constructor(private readonly userService: UserService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取用户统计' })
  async getUserStats() {
    const stats = await this.userService.getUserStats();
    return {
      code: 200,
      message: '获取成功',
      data: stats
    };
  }
}
```

### 3. 数据模型设计

#### 核心实体模型
```typescript
// 用户实体
interface User {
  tenantId?: string;        // 租户ID (多租户支持)
  id: string;               // 用户唯一标识
  username: string;         // 用户名 (唯一)
  email: string;            // 邮箱 (唯一)
  password: string;         // 密码 (加密存储)
  nickname?: string;        // 昵称
  avatar?: string;          // 头像URL
  status: string;           // 状态 (ACTIVE/INACTIVE/BANNED)
  createdAt: Date;          // 创建时间
  updatedAt: Date;          // 更新时间
  createdBy?: string;       // 创建人
  updatedBy?: string;       // 更新人
  userRoles: UserRole[];    # 用户角色关联
}

// 角色实体
interface Role {
  tenantId?: string;        // 租户ID
  id: string;               // 角色唯一标识
  name: string;             // 角色名称 (唯一)
  code: string;             // 角色编码 (唯一)
  description?: string;     // 角色描述
  status: string;           // 状态
  createdAt: Date;          // 创建时间
  updatedAt: Date;          // 更新时间
  createdBy?: string;       // 创建人
  updatedBy?: string;       // 更新人
  userRoles: UserRole[];    # 用户角色关联
}

// 用户角色关联
interface UserRole {
  id: string;               // 关联唯一标识
  userId: string;           // 用户ID
  roleId: string;           // 角色ID
  createdAt: Date;          // 创建时间
  updatedAt: Date;          // 更新时间
  user: User;               // 关联用户
  role: Role;               // 关联角色
}

// 页面模板
interface PageTemplate {
  id: string;               // 模板唯一标识
  name: string;             // 模板名称
  description?: string;     // 模板描述
  content: string;          // 页面配置 (JSON格式)
  category?: string;        // 模板分类
  tags: string[];           // 标签数组
  isPublic: boolean;        // 是否公开
  status: string;           // 状态
  createdAt: Date;          // 创建时间
  updatedAt: Date;          // 更新时间
  createdBy?: string;       // 创建人
  updatedBy?: string;       // 更新人
}

// 测试用户 (示例实体)
interface TestUser {
  id: string;               // 用户唯一标识
  username: string;         // 用户登录名 (唯一)
  email: string;            // 用户邮箱地址 (唯一)
  phone?: string;           // 用户手机号码
  realName?: string;        // 用户真实姓名
  age?: number;             // 用户年龄
  gender?: string;          // 用户性别 (MALE/FEMALE/UNKNOWN)
  birthday?: Date;          // 用户生日
  avatar?: string;          // 用户头像链接
  bio?: string;             // 用户个人简介
  isActive: boolean;        // 用户账户是否激活
  lastLoginAt?: Date;       // 用户最后登录时间
  settings?: Json;          // 用户个性化配置
  createdBy: string;        // 创建人
  createdAt: Date;          // 创建时间
  updatedBy?: string;       // 更新人
  updatedAt: Date;          // 更新时间
}
```

### 4. 数据传输对象 (DTO)

#### 基础 DTO
```typescript
// base/dto/user.dto.ts (自动生成)
import { IsString, IsEmail, IsOptional, IsEnum, IsInt, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({ description: '用户名', example: 'john_doe' })
  @IsString()
  username: string;

  @ApiProperty({ description: '邮箱', example: 'john@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ description: '密码', example: 'password123' })
  @IsString()
  password: string;

  @ApiPropertyOptional({ description: '昵称', example: 'John' })
  @IsOptional()
  @IsString()
  nickname?: string;

  @ApiPropertyOptional({ description: '头像URL' })
  @IsOptional()
  @IsString()
  avatar?: string;

  @ApiProperty({ description: '状态', enum: ['ACTIVE', 'INACTIVE', 'BANNED'] })
  @IsEnum(['ACTIVE', 'INACTIVE', 'BANNED'])
  status: string;
}

export class UpdateUserDto {
  @ApiPropertyOptional({ description: '昵称' })
  @IsOptional()
  @IsString()
  nickname?: string;

  @ApiPropertyOptional({ description: '头像URL' })
  @IsOptional()
  @IsString()
  avatar?: string;

  @ApiPropertyOptional({ description: '状态', enum: ['ACTIVE', 'INACTIVE', 'BANNED'] })
  @IsOptional()
  @IsEnum(['ACTIVE', 'INACTIVE', 'BANNED'])
  status?: string;
}

export class QueryUserDto {
  @ApiPropertyOptional({ description: '页码', example: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ description: '每页数量', example: 10 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize?: number;

  @ApiPropertyOptional({ description: '搜索关键词' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: '状态筛选', enum: ['ACTIVE', 'INACTIVE', 'BANNED'] })
  @IsOptional()
  @IsEnum(['ACTIVE', 'INACTIVE', 'BANNED'])
  status?: string;
}
```

#### 业务 DTO
```typescript
// biz/dto/auth.dto.ts (手动定制)
import { IsString, IsEmail, MinLength, MaxLength, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ description: '用户名', example: 'john_doe' })
  @IsString()
  @MinLength(3)
  @MaxLength(20)
  @Matches(/^[a-zA-Z0-9_]+$/, { message: '用户名只能包含字母、数字和下划线' })
  username: string;

  @ApiProperty({ description: '邮箱', example: 'john@example.com' })
  @IsEmail({}, { message: '请输入有效的邮箱地址' })
  email: string;

  @ApiProperty({ description: '密码', example: 'Password123!' })
  @IsString()
  @MinLength(8)
  @MaxLength(50)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
    message: '密码必须包含大小写字母、数字和特殊字符'
  })
  password: string;

  @ApiProperty({ description: '昵称', example: 'John Doe' })
  @IsString()
  @MaxLength(50)
  nickname: string;
}

export class LoginDto {
  @ApiProperty({ description: '用户名', example: 'john_doe' })
  @IsString()
  username: string;

  @ApiProperty({ description: '密码', example: 'Password123!' })
  @IsString()
  password: string;
}

export class ChangePasswordDto {
  @ApiProperty({ description: '原密码' })
  @IsString()
  oldPassword: string;

  @ApiProperty({ description: '新密码' })
  @IsString()
  @MinLength(8)
  @MaxLength(50)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
    message: '密码必须包含大小写字母、数字和特殊字符'
  })
  newPassword: string;
}
```

### 5. 共享模块

#### 数据库服务
```typescript
// shared/database/prisma.service.ts
import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    super({
      datasources: {
        db: {
          url: process.env.DATABASE_URL
        }
      },
      log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error']
    });
  }

  async onModuleInit() {
    await this.$connect();
    console.log('✅ Database connected successfully');
  }

  async onModuleDestroy() {
    await this.$disconnect();
    console.log('❌ Database disconnected');
  }

  // 软删除支持
  async softDelete(model: string, where: any) {
    return this[model].update({
      where,
      data: {
        deletedAt: new Date(),
        updatedAt: new Date()
      }
    });
  }

  // 批量操作
  async batchCreate(model: string, data: any[]) {
    return this[model].createMany({
      data,
      skipDuplicates: true
    });
  }

  // 事务支持
  async executeTransaction(operations: ((prisma: PrismaClient) => Promise<any>)[]) {
    return this.$transaction(async (prisma) => {
      const results = [];
      for (const operation of operations) {
        const result = await operation(prisma);
        results.push(result);
      }
      return results;
    });
  }
}
```

#### 认证守卫
```typescript
// shared/guards/jwt-auth.guard.ts
import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    // 检查是否标记为公开接口
    const isPublic = this.reflector.getAllAndOverride<boolean>('isPublic', [
      context.getHandler(),
      context.getClass()
    ]);

    if (isPublic) {
      return true;
    }

    return super.canActivate(context);
  }

  handleRequest(err: any, user: any, info: any) {
    if (err || !user) {
      throw err || new UnauthorizedException('Token 无效或已过期');
    }
    return user;
  }
}
```

#### 响应拦截器
```typescript
// shared/interceptors/response.interceptor.ts
import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface Response<T> {
  code: number;
  message: string;
  data: T;
  timestamp: number;
}

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, Response<T>> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<Response<T>> {
    return next.handle().pipe(
      map(data => ({
        code: 200,
        message: '操作成功',
        data,
        timestamp: Date.now()
      }))
    );
  }
}
```

#### 异常过滤器
```typescript
// shared/filters/http-exception.filter.ts
import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = '服务器内部错误';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      
      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (typeof exceptionResponse === 'object' && exceptionResponse['message']) {
        message = Array.isArray(exceptionResponse['message']) 
          ? exceptionResponse['message'].join(', ')
          : exceptionResponse['message'];
      }
    }

    // 记录错误日志
    console.error(`[${new Date().toISOString()}] ${request.method} ${request.url}`, {
      status,
      message,
      stack: exception instanceof Error ? exception.stack : undefined
    });

    response.status(status).json({
      code: status,
      message,
      timestamp: Date.now(),
      path: request.url
    });
  }
}
```

### 6. 代码生成模板

#### 控制器模板
```handlebars
{{!-- templates/controller.hbs --}}
import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { {{pascalCase name}}Service } from '../services/{{kebabCase name}}.service';
import { Create{{pascalCase name}}Dto, Update{{pascalCase name}}Dto, Query{{pascalCase name}}Dto } from '../dto/{{kebabCase name}}.dto';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';

@ApiTags('{{title}}')
@Controller('api/v1/{{kebabCase name}}s')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class {{pascalCase name}}Controller {
  constructor(private readonly {{camelCase name}}Service: {{pascalCase name}}Service) {}

  @Post()
  @ApiOperation({ summary: '创建{{title}}' })
  @ApiResponse({ status: 201, description: '{{title}}创建成功' })
  create(@Body() create{{pascalCase name}}Dto: Create{{pascalCase name}}Dto) {
    return this.{{camelCase name}}Service.create(create{{pascalCase name}}Dto);
  }

  @Get()
  @ApiOperation({ summary: '获取{{title}}列表' })
  @ApiResponse({ status: 200, description: '获取{{title}}列表成功' })
  findAll(@Query() query: Query{{pascalCase name}}Dto) {
    return this.{{camelCase name}}Service.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: '获取{{title}}详情' })
  @ApiResponse({ status: 200, description: '获取{{title}}详情成功' })
  findOne(@Param('id') id: string) {
    return this.{{camelCase name}}Service.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: '更新{{title}}' })
  @ApiResponse({ status: 200, description: '{{title}}更新成功' })
  update(@Param('id') id: string, @Body() update{{pascalCase name}}Dto: Update{{pascalCase name}}Dto) {
    return this.{{camelCase name}}Service.update(id, update{{pascalCase name}}Dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除{{title}}' })
  @ApiResponse({ status: 200, description: '{{title}}删除成功' })
  remove(@Param('id') id: string) {
    return this.{{camelCase name}}Service.remove(id);
  }
}
```

#### 服务模板
```handlebars
{{!-- templates/service.hbs --}}
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../shared/database/prisma.service';
import { Create{{pascalCase name}}Dto, Update{{pascalCase name}}Dto, Query{{pascalCase name}}Dto } from '../dto/{{kebabCase name}}.dto';

@Injectable()
export class {{pascalCase name}}Service {
  constructor(private prisma: PrismaService) {}

  async create(create{{pascalCase name}}Dto: Create{{pascalCase name}}Dto) {
    return this.prisma.{{camelCase name}}.create({
      data: {
        ...create{{pascalCase name}}Dto,
        id: this.generateId(),
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });
  }

  async findAll(query: Query{{pascalCase name}}Dto) {
    const { page = 1, pageSize = 10, search } = query;
    
    const where: any = {};
    {{#if searchFields}}
    if (search) {
      where.OR = [
        {{#each searchFields}}
        { {{this}}: { contains: search } },
        {{/each}}
      ];
    }
    {{/if}}

    const [items, total] = await Promise.all([
      this.prisma.{{camelCase name}}.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' }
      }),
      this.prisma.{{camelCase name}}.count({ where })
    ]);

    return {
      items,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize)
    };
  }

  async findOne(id: string) {
    const {{camelCase name}} = await this.prisma.{{camelCase name}}.findUnique({
      where: { id }
    });

    if (!{{camelCase name}}) {
      throw new NotFoundException('{{title}}不存在');
    }

    return {{camelCase name}};
  }

  async update(id: string, update{{pascalCase name}}Dto: Update{{pascalCase name}}Dto) {
    await this.findOne(id); // 检查是否存在

    return this.prisma.{{camelCase name}}.update({
      where: { id },
      data: {
        ...update{{pascalCase name}}Dto,
        updatedAt: new Date()
      }
    });
  }

  async remove(id: string) {
    await this.findOne(id); // 检查是否存在

    return this.prisma.{{camelCase name}}.delete({
      where: { id }
    });
  }

  private generateId(): string {
    return require('ulid').ulid();
  }
}
```

## API 接口设计

### 统一响应格式
```typescript
// 成功响应
interface SuccessResponse<T> {
  code: 200;
  message: string;
  data: T;
  timestamp: number;
}

// 分页响应
interface PageResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// 错误响应
interface ErrorResponse {
  code: number;
  message: string;
  timestamp: number;
  path: string;
}
```

### 主要 API 端点

#### 用户管理
```typescript
GET    /api/v1/users           # 获取用户列表
POST   /api/v1/users           # 创建用户
GET    /api/v1/users/:id       # 获取用户详情
PATCH  /api/v1/users/:id       # 更新用户
DELETE /api/v1/users/:id       # 删除用户
```

#### 认证相关
```typescript
POST   /api/v1/auth/register   # 用户注册
POST   /api/v1/auth/login      # 用户登录
POST   /api/v1/auth/change-password # 修改密码
GET    /api/v1/auth/profile    # 获取用户信息
```

#### 角色管理
```typescript
GET    /api/v1/roles           # 获取角色列表
POST   /api/v1/roles           # 创建角色
GET    /api/v1/roles/:id       # 获取角色详情
PATCH  /api/v1/roles/:id       # 更新角色
DELETE /api/v1/roles/:id       # 删除角色
```

#### 页面模板
```typescript
GET    /api/v1/page-templates  # 获取页面模板列表
POST   /api/v1/page-templates  # 创建页面模板
GET    /api/v1/page-templates/:id # 获取页面模板详情
PATCH  /api/v1/page-templates/:id # 更新页面模板
DELETE /api/v1/page-templates/:id # 删除页面模板
```

#### 健康检查
```typescript
GET    /api/v1/health          # 服务健康检查
GET    /api/v1/health/database # 数据库连接检查
```

## 部署配置

### Docker 配置
```dockerfile
# Dockerfile
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

FROM node:18-alpine
WORKDIR /app

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package.json ./

EXPOSE 9522

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD curl -f http://localhost:9522/api/v1/health || exit 1

CMD ["node", "dist/main.js"]
```

### 环境变量配置
```bash
# 应用配置
NODE_ENV=production
PORT=9522
SERVICE_NAME=amis-backend

# 数据库配置
DATABASE_URL=postgresql://soybean:soybean@123.@postgres:5432/soybean-admin-nest-backend?schema=amis

# JWT 配置
JWT_SECRET=JWT_SECRET-soybean-admin-nest!@#123.
JWT_EXPIRES_IN=7d

# 服务间通信
BACKEND_URL=http://backend:9528
LOWCODE_PLATFORM_URL=http://lowcode-platform:3000

# CORS 配置
CORS_ENABLED=true
CORS_ORIGIN=http://localhost:9527,http://127.0.0.1:9527,http://localhost:3000,http://127.0.0.1:3000,http://localhost:9555,http://127.0.0.1:9555
CORS_METHODS=GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS
CORS_CREDENTIALS=true

# 数据同步配置
DATA_SYNC_ENABLED=true
DATA_SYNC_INTERVAL=30000

# 自动初始化配置
AUTO_INIT_DATA=false
FIRST_RUN_DETECTION=false
DOCKER_ENV=true
```

## 性能优化

### 数据库优化
```sql
-- 用户表索引
CREATE INDEX idx_demo_users_username ON amis.demo_users(username);
CREATE INDEX idx_demo_users_email ON amis.demo_users(email);
CREATE INDEX idx_demo_users_status ON amis.demo_users(status);
CREATE INDEX idx_demo_users_created_at ON amis.demo_users(created_at);

-- 角色表索引
CREATE INDEX idx_demo_roles_code ON amis.demo_roles(code);
CREATE INDEX idx_demo_roles_name ON amis.demo_roles(name);
CREATE INDEX idx_demo_roles_status ON amis.demo_roles(status);

-- 用户角色关联表索引
CREATE INDEX idx_demo_user_roles_user_id ON amis.demo_user_roles(user_id);
CREATE INDEX idx_demo_user_roles_role_id ON amis.demo_user_roles(role_id);

-- 测试用户表索引
CREATE INDEX idx_test_users_username ON amis.test_users(username);
CREATE INDEX idx_test_users_email ON amis.test_users(email);
CREATE INDEX idx_test_users_phone ON amis.test_users(phone);
CREATE INDEX idx_test_users_created_at ON amis.test_users(created_at);
```

### 查询优化
```typescript
// 优化的分页查询
async findUsersOptimized(query: QueryUserDto) {
  const { page = 1, pageSize = 10, search, status } = query;
  
  // 构建查询条件
  const where: any = {};
  if (search) {
    where.OR = [
      { username: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
      { nickname: { contains: search, mode: 'insensitive' } }
    ];
  }
  if (status) {
    where.status = status;
  }

  // 使用游标分页提高性能
  const [items, total] = await Promise.all([
    this.prisma.user.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        username: true,
        email: true,
        nickname: true,
        avatar: true,
        status: true,
        createdAt: true,
        updatedAt: true
      }
    }),
    this.prisma.user.count({ where })
  ]);

  return {
    items,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize)
  };
}
```

### 缓存策略
```typescript
// Redis 缓存服务
@Injectable()
export class CacheService {
  constructor(
    @Inject('REDIS_CLIENT') private redis: Redis
  ) {}

  // 用户信息缓存
  async cacheUser(userId: string, user: any, ttl = 1800) {
    const key = `user:${userId}`;
    await this.redis.setex(key, ttl, JSON.stringify(user));
  }

  async getCachedUser(userId: string) {
    const key = `user:${userId}`;
    const cached = await this.redis.get(key);
    return cached ? JSON.parse(cached) : null;
  }

  // 角色权限缓存
  async cacheUserRoles(userId: string, roles: any[], ttl = 900) {
    const key = `user:roles:${userId}`;
    await this.redis.setex(key, ttl, JSON.stringify(roles));
  }

  async getCachedUserRoles(userId: string) {
    const key = `user:roles:${userId}`;
    const cached = await this.redis.get(key);
    return cached ? JSON.parse(cached) : null;
  }

  // 清除用户相关缓存
  async clearUserCache(userId: string) {
    const keys = [`user:${userId}`, `user:roles:${userId}`];
    await this.redis.del(...keys);
  }
}
```

## 监控和日志

### 日志配置
```typescript
// 日志服务
import { Injectable, LoggerService } from '@nestjs/common';
import * as winston from 'winston';
import 'winston-daily-rotate-file';

@Injectable()
export class CustomLogger implements LoggerService {
  private logger: winston.Logger;

  constructor() {
    this.logger = winston.createLogger({
      level: process.env.LOG_LEVEL || 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
      ),
      transports: [
        // 控制台输出
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
          )
        }),
        // 应用日志文件
        new winston.transports.DailyRotateFile({
          filename: 'logs/amis-backend-%DATE%.log',
          datePattern: 'YYYY-MM-DD',
          maxSize: '20m',
          maxFiles: '14d'
        }),
        // 错误日志文件
        new winston.transports.DailyRotateFile({
          filename: 'logs/amis-backend-error-%DATE%.log',
          datePattern: 'YYYY-MM-DD',
          level: 'error',
          maxSize: '20m',
          maxFiles: '30d'
        })
      ]
    });
  }

  log(message: string, context?: string) {
    this.logger.info(message, { context });
  }

  error(message: string, trace?: string, context?: string) {
    this.logger.error(message, { trace, context });
  }

  warn(message: string, context?: string) {
    this.logger.warn(message, { context });
  }

  debug(message: string, context?: string) {
    this.logger.debug(message, { context });
  }

  verbose(message: string, context?: string) {
    this.logger.verbose(message, { context });
  }
}
```

### 健康检查
```typescript
// 健康检查服务
import { Injectable } from '@nestjs/common';
import { HealthCheckService, HealthCheck, PrismaHealthIndicator } from '@nestjs/terminus';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class HealthService {
  constructor(
    private health: HealthCheckService,
    private prismaHealth: PrismaHealthIndicator,
    private prisma: PrismaService
  ) {}

  @HealthCheck()
  async check() {
    return this.health.check([
      // 数据库健康检查
      () => this.prismaHealth.pingCheck('database', this.prisma),
      
      // 自定义健康检查
      () => this.checkCustomHealth()
    ]);
  }

  private async checkCustomHealth() {
    try {
      // 检查数据库连接
      await this.prisma.$queryRaw`SELECT 1`;
      
      // 检查基础数据
      const userCount = await this.prisma.user.count();
      
      return {
        amis_backend: {
          status: 'up',
          database: 'connected',
          userCount,
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      throw new Error(`Health check failed: ${error.message}`);
    }
  }
}
```

## 安全措施

### 数据验证
```typescript
// 自定义验证装饰器
import { registerDecorator, ValidationOptions, ValidationArguments } from 'class-validator';

export function IsStrongPassword(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isStrongPassword',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          if (typeof value !== 'string') return false;
          
          // 至少8位，包含大小写字母、数字和特殊字符
          const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
          return strongPasswordRegex.test(value);
        },
        defaultMessage(args: ValidationArguments) {
          return '密码必须至少8位，包含大小写字母、数字和特殊字符';
        }
      }
    });
  };
}

// 使用示例
export class CreateUserDto {
  @IsStrongPassword()
  password: string;
}
```

### 数据脱敏
```typescript
// 数据脱敏服务
@Injectable()
export class DataMaskingService {
  // 手机号脱敏
  maskPhone(phone: string): string {
    if (!phone || phone.length < 11) return phone;
    return phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2');
  }

  // 邮箱脱敏
  maskEmail(email: string): string {
    if (!email || !email.includes('@')) return email;
    const [username, domain] = email.split('@');
    const maskedUsername = username.length > 2 
      ? username.substring(0, 2) + '*'.repeat(username.length - 2)
      : username;
    return `${maskedUsername}@${domain}`;
  }

  // 身份证脱敏
  maskIdCard(idCard: string): string {
    if (!idCard || idCard.length < 18) return idCard;
    return idCard.replace(/(\d{6})\d{8}(\d{4})/, '$1********$2');
  }

  // 用户信息脱敏
  maskUserInfo(user: any): any {
    return {
      ...user,
      phone: user.phone ? this.maskPhone(user.phone) : null,
      email: user.email ? this.maskEmail(user.email) : null,
      password: undefined // 移除密码字段
    };
  }
}
```

## 开发指南

### 本地开发
```bash
# 安装依赖
pnpm install

# 数据库迁移
pnpm prisma:migrate
pnpm prisma:generate

# 数据种子
pnpm prisma:seed

# 启动开发服务器
pnpm start:dev

# 运行测试
pnpm test
pnpm test:e2e
```

### 代码生成
```bash
# 生成新的资源模块
nest g resource product --no-spec

# 生成 Prisma 客户端
pnpm prisma:generate

# 创建数据库迁移
pnpm prisma:migrate

# 重置数据库
pnpm prisma:migrate:reset
```

### 调试配置
```json
// .vscode/launch.json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug Amis Backend",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/dist/main.js",
      "env": {
        "NODE_ENV": "development",
        "DATABASE_URL": "postgresql://soybean:soybean@123.@localhost:25432/soybean-admin-nest-backend?schema=amis"
      },
      "console": "integratedTerminal",
      "restart": true,
      "runtimeArgs": ["--nolazy"],
      "sourceMaps": true
    }
  ]
}
```

## 故障排查

### 常见问题

#### 1. 数据库连接失败
```typescript
// 检查数据库连接
async function checkDatabaseConnection() {
  try {
    await prisma.$connect();
    console.log('✅ 数据库连接成功');
  } catch (error) {
    console.error('❌ 数据库连接失败:', error.message);
    
    // 检查环境变量
    console.log('DATABASE_URL:', process.env.DATABASE_URL);
    
    // 检查网络连接
    const { exec } = require('child_process');
    exec('ping -c 1 postgres', (error, stdout, stderr) => {
      if (error) {
        console.error('网络连接检查失败:', error.message);
      } else {
        console.log('网络连接正常');
      }
    });
  }
}
```

#### 2. JWT Token 验证失败
```typescript
// JWT 调试工具
function debugJWT(token: string) {
  try {
    const decoded = jwt.decode(token, { complete: true });
    console.log('JWT Header:', decoded.header);
    console.log('JWT Payload:', decoded.payload);
    
    // 检查过期时间
    const now = Math.floor(Date.now() / 1000);
    if (decoded.payload.exp < now) {
      console.log('❌ Token 已过期');
    } else {
      console.log('✅ Token 有效');
    }
  } catch (error) {
    console.error('JWT 解析失败:', error.message);
  }
}
```

#### 3. 性能问题排查
```typescript
// 性能监控中间件
@Injectable()
export class PerformanceMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const start = Date.now();
    
    res.on('finish', () => {
      const duration = Date.now() - start;
      
      // 记录慢查询
      if (duration > 1000) {
        console.warn(`慢请求警告: ${req.method} ${req.url} - ${duration}ms`);
      }
      
      // 记录性能指标
      console.log(`${req.method} ${req.url} - ${duration}ms - ${res.statusCode}`);
    });
    
    next();
  }
}
```

## 最佳实践

### 1. 错误处理
```typescript
// 统一错误处理
export class BusinessException extends HttpException {
  constructor(message: string, code: number = HttpStatus.BAD_REQUEST) {
    super({
      code,
      message,
      timestamp: new Date().toISOString()
    }, code);
  }
}

// 使用示例
if (!user) {
  throw new BusinessException('用户不存在', HttpStatus.NOT_FOUND);
}
```

### 2. 数据库事务
```typescript
// 事务操作示例
async createUserWithRole(userData: CreateUserDto, roleIds: string[]) {
  return this.prisma.$transaction(async (prisma) => {
    // 创建用户
    const user = await prisma.user.create({
      data: userData
    });

    // 分配角色
    const userRoles = roleIds.map(roleId => ({
      userId: user.id,
      roleId
    }));

    await prisma.userRole.createMany({
      data: userRoles
    });

    return user;
  });
}
```

### 3. 数据验证
```typescript
// 自定义验证管道
@Injectable()
export class CustomValidationPipe extends ValidationPipe {
  constructor() {
    super({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true
      },
      exceptionFactory: (errors) => {
        const messages = errors.map(error => 
          Object.values(error.constraints || {}).join(', ')
        );
        return new BadRequestException({
          code: HttpStatus.BAD_REQUEST,
          message: '数据验证失败',
          details: messages
        });
      }
    });
  }
}
```

### 4. 接口版本控制
```typescript
// API 版本控制
@Controller({
  path: 'users',
  version: '1'
})
export class UsersV1Controller {
  // v1 版本的用户接口
}

@Controller({
  path: 'users',
  version: '2'
})
export class UsersV2Controller {
  // v2 版本的用户接口
}
```

---

**服务端口**: 9522  
**API 基础路径**: http://localhost:9522/api/v1  
**健康检查**: http://localhost:9522/api/v1/health  
**API 文档**: http://localhost:9522/api-docs  
**文档版本**: v1.0.0  
**更新时间**: 2024年12月  
**维护团队**: SoybeanAdmin Amis 后端团队
# Amis Lowcode Backend 业务后端服务说明文档

## 服务概述

Amis Lowcode Backend 是 SoybeanAdmin NestJS 低代码平台的业务运行时后端服务，专门为低代码平台生成的业务代码提供运行环境。该服务基于 NestJS 框架构建，采用代码生成 + 业务定制的混合架构模式，支持动态 API 生成、数据操作、业务逻辑执行等核心功能。

## 技术架构

### 核心技术栈
- **框架**: NestJS 11.0.12 + TypeScript 5.8.2
- **HTTP 服务器**: Fastify 5.2.2 (高性能)
- **ORM**: Prisma 6.5.0 (类型安全)
- **数据库**: PostgreSQL 16.3 (amis schema)
- **Node.js**: 18.0.0+

### 架构特点
- **代码生成架构**: 基于模板自动生成基础 CRUD 代码
- **业务定制层**: 支持业务逻辑的手动定制和扩展
- **动态 API**: 根据实体模型动态生成 RESTful API
- **多租户支持**: 内置多租户数据隔离机制

### 安全和认证
- **认证**: JWT + Passport
- **加密**: BCrypt 6.0.0 密码加密
- **权限控制**: 基于角色的访问控制
- **数据验证**: Class Validator 数据验证

### 工具和中间件
- **API 文档**: Swagger 11.1.0
- **模板引擎**: Handlebars 4.7.8
- **文件处理**: Fastify Static 8.2.0
- **跨域支持**: Fastify CORS 11.0.1

## 项目结构

```
amis-lowcode-backend/
├── src/
│   ├── main.ts                 # 应用入口
│   ├── app.module.ts           # 根模块
│   ├── app.controller.ts       # 根控制器
│   ├── app.service.ts          # 根服务
│   ├── base/                   # 自动生成的基础代码
│   │   ├── controllers/        # 基础控制器
│   │   ├── dto/                # 数据传输对象
│   │   ├── entities/           # 实体定义
│   │   ├── interfaces/         # 接口定义
│   │   └── services/           # 基础服务
│   ├── biz/                    # 业务定制代码
│   │   ├── controllers/        # 业务控制器
│   │   ├── modules/            # 业务模块
│   │   └── services/           # 业务服务
│   ├── config/                 # 配置文件
│   └── shared/                 # 共享模块
│       ├── database/           # 数据库配置
│       ├── decorators/         # 装饰器
│       ├── dto/                # 通用 DTO
│       ├── guards/             # 守卫
│       ├── interceptors/       # 拦截器
│       ├── services/           # 共享服务
│       └── strategies/         # 认证策略
├── prisma/                     # 数据库配置
│   ├── schema.prisma           # 数据模型
│   ├── migrations/             # 数据库迁移
│   └── seed.ts                 # 数据种子
├── templates/                  # 代码生成模板
├── generated/                  # 生成的代码文件
└── dist/                       # 编译输出
```

## 核心功能模块

### 1. 代码生成架构

#### Base 层 (自动生成)
```typescript
// base/entities/user.entity.ts (自动生成)
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('demo_users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  username: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column({ nullable: true })
  nickname?: string;

  @Column({ nullable: true })
  avatar?: string;

  @Column()
  status: string;

  @Column({ name: 'created_at' })
  createdAt: Date;

  @Column({ name: 'updated_at' })
  updatedAt: Date;

  @Column({ name: 'created_by', nullable: true })
  createdBy?: string;

  @Column({ name: 'updated_by', nullable: true })
  updatedBy?: string;
}
```

#### Base 服务 (自动生成)
```typescript
// base/services/user.service.ts (自动生成)
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../shared/database/prisma.service';
import { CreateUserDto, UpdateUserDto, QueryUserDto } from '../dto/user.dto';

@Injectable()
export class BaseUserService {
  constructor(private prisma: PrismaService) {}

  async create(createUserDto: CreateUserDto) {
    return this.prisma.user.create({
      data: {
        ...createUserDto,
        id: this.generateId(),
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });
  }

  async findAll(query: QueryUserDto) {
    const { page = 1, pageSize = 10, search, status } = query;
    
    const where: any = {};
    if (search) {
      where.OR = [
        { username: { contains: search } },
        { email: { contains: search } },
        { nickname: { contains: search } }
      ];
    }
    if (status) {
      where.status = status;
    }

    const [items, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' }
      }),
      this.prisma.user.count({ where })
    ]);

    return {
      items,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize)
    };
  }

  async findOne(id: string) {
    return this.prisma.user.findUnique({
      where: { id }
    });
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    return this.prisma.user.update({
      where: { id },
      data: {
        ...updateUserDto,
        updatedAt: new Date()
      }
    });
  }

  async remove(id: string) {
    return this.prisma.user.delete({
      where: { id }
    });
  }

  private generateId(): string {
    return require('ulid').ulid();
  }
}
```

#### Base 控制器 (自动生成)
```typescript
// base/controllers/user.controller.ts (自动生成)
import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { BaseUserService } from '../services/user.service';
import { CreateUserDto, UpdateUserDto, QueryUserDto } from '../dto/user.dto';

@ApiTags('用户管理')
@Controller('api/v1/users')
export class BaseUserController {
  constructor(private readonly userService: BaseUserService) {}

  @Post()
  @ApiOperation({ summary: '创建用户' })
  @ApiResponse({ status: 201, description: '用户创建成功' })
  create(@Body() createUserDto: CreateUserDto) {
    return this.userService.create(createUserDto);
  }

  @Get()
  @ApiOperation({ summary: '获取用户列表' })
  @ApiResponse({ status: 200, description: '获取用户列表成功' })
  findAll(@Query() query: QueryUserDto) {
    return this.userService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: '获取用户详情' })
  @ApiResponse({ status: 200, description: '获取用户详情成功' })
  findOne(@Param('id') id: string) {
    return this.userService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: '更新用户' })
  @ApiResponse({ status: 200, description: '用户更新成功' })
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.userService.update(id, updateUserDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除用户' })
  @ApiResponse({ status: 200, description: '用户删除成功' })
  remove(@Param('id') id: string) {
    return this.userService.remove(id);
  }
}
```

### 2. 业务定制层

#### 业务服务扩展
```typescript
// biz/services/user.service.ts (手动定制)
import { Injectable } from '@nestjs/common';
import { BaseUserService } from '../../base/services/user.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UserService extends BaseUserService {
  
  // 扩展：用户注册
  async register(registerDto: RegisterDto) {
    // 检查用户名是否已存在
    const existingUser = await this.prisma.user.findUnique({
      where: { username: registerDto.username }
    });
    
    if (existingUser) {
      throw new ConflictException('用户名已存在');
    }

    // 密码加密
    const hashedPassword = await bcrypt.hash(registerDto.password, 12);

    // 创建用户
    return this.create({
      ...registerDto,
      password: hashedPassword,
      status: 'ACTIVE'
    });
  }

  // 扩展：用户登录
  async login(loginDto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { username: loginDto.username }
    });

    if (!user) {
      throw new UnauthorizedException('用户名或密码错误');
    }

    const isPasswordValid = await bcrypt.compare(loginDto.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('用户名或密码错误');
    }

    // 生成 JWT Token
    const payload = { sub: user.id, username: user.username };
    const token = this.jwtService.sign(payload);

    return {
      access_token: token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        nickname: user.nickname,
        avatar: user.avatar
      }
    };
  }

  // 扩展：修改密码
  async changePassword(userId: string, changePasswordDto: ChangePasswordDto) {
    const user = await this.findOne(userId);
    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    const isOldPasswordValid = await bcrypt.compare(
      changePasswordDto.oldPassword, 
      user.password
    );
    
    if (!isOldPasswordValid) {
      throw new BadRequestException('原密码错误');
    }

    const hashedNewPassword = await bcrypt.hash(changePasswordDto.newPassword, 12);
    
    return this.update(userId, {
      password: hashedNewPassword
    });
  }

  // 扩展：用户统计
  async getUserStats() {
    const [totalUsers, activeUsers, inactiveUsers] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { status: 'ACTIVE' } }),
      this.prisma.user.count({ where: { status: 'INACTIVE' } })
    ]);

    return {
      totalUsers,
      activeUsers,
      inactiveUsers,
      activeRate: totalUsers > 0 ? (activeUsers / totalUsers * 100).toFixed(2) : 0
    };
  }
}
```

#### 业务控制器扩展
```typescript
// biz/controllers/user.controller.ts (手动定制)
import { Controller, Post, Body, Get, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UserService } from '../services/user.service';
import { RegisterDto, LoginDto, ChangePasswordDto } from '../dto/auth.dto';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';

@ApiTags('用户认证')
@Controller('api/v1/auth')
export class AuthController {
  constructor(private readonly userService: UserService) {}

  @Post('register')
  @ApiOperation({ summary: '用户注册' })
  async register(@Body() registerDto: RegisterDto) {
    const user = await this.userService.register(registerDto);
    return {
      code: 200,
      message: '注册成功',
      data: {
        id: user.id,
        username: user.username,
        email: user.email
      }
    };
  }

  @Post('login')
  @ApiOperation({ summary: '用户登录' })
  async login(@Body() loginDto: LoginDto) {
    const result = await this.userService.login(loginDto);
    return {
      code: 200,
      message: '登录成功',
      data: result
    };
  }

  @Post('change-password')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '修改密码' })
  async changePassword(@Request() req, @Body() changePasswordDto: ChangePasswordDto) {
    await this.userService.changePassword(req.user.sub, changePasswordDto);
    return {
      code: 200,
      message: '密码修改成功'
    };
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取用户信息' })
  async getProfile(@Request() req) {
    const user = await this.userService.findOne(req.user.sub);
    return {
      code: 200,
      message: '获取成功',
      data: {
        id: user.id,
        username: user.username,
        email: user.email,
        nickname: user.nickname,
        avatar: user.avatar,
        status: user.status
      }
    };
  }
}

@ApiTags('用户统计')
@Controller('api/v1/user-stats')
export class UserStatsController {
  constructor(private readonly userService: UserService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取用户统计' })
  async getUserStats() {
    const stats = await this.userService.getUserStats();
    return {
      code: 200,
      message: '获取成功',
      data: stats
    };
  }
}
```

### 3. 数据模型设计

#### 核心实体模型
```typescript
// 用户实体
interface User {
  tenantId?: string;        // 租户ID (多租户支持)
  id: string;               // 用户唯一标识
  username: string;         // 用户名 (唯一)
  email: string;            // 邮箱 (唯一)
  password: string;         // 密码 (加密存储)
  nickname?: string;        // 昵称
  avatar?: string;          // 头像URL
  status: string;           // 状态 (ACTIVE/INACTIVE/BANNED)
  createdAt: Date;          // 创建时间
  updatedAt: Date;          // 更新时间
  createdBy?: string;       // 创建人
  updatedBy?: string;       // 更新人
  userRoles: UserRole[];    # 用户角色关联
}

// 角色实体
interface Role {
  tenantId?: string;        // 租户ID
  id: string;               // 角色唯一标识
  name: string;             // 角色名称 (唯一)
  code: string;             // 角色编码 (唯一)
  description?: string;     // 角色描述
  status: string;           // 状态
  createdAt: Date;          // 创建时间
  updatedAt: Date;          // 更新时间
  createdBy?: string;       // 创建人
  updatedBy?: string;       // 更新人
  userRoles: UserRole[];    # 用户角色关联
}

// 用户角色关联
interface UserRole {
  id: string;               // 关联唯一标识
  userId: string;           // 用户ID
  roleId: string;           // 角色ID
  createdAt: Date;          // 创建时间
  updatedAt: Date;          // 更新时间
  user: User;               // 关联用户
  role: Role;               // 关联角色
}

// 页面模板
interface PageTemplate {
  id: string;               // 模板唯一标识
  name: string;             // 模板名称
  description?: string;     // 模板描述
  content: string;          // 页面配置 (JSON格式)
  category?: string;        // 模板分类
  tags: string[];           // 标签数组
  isPublic: boolean;        // 是否公开
  status: string;           // 状态
  createdAt: Date;          // 创建时间
  updatedAt: Date;          // 更新时间
  createdBy?: string;       // 创建人
  updatedBy?: string;       // 更新人
}

// 测试用户 (示例实体)
interface TestUser {
  id: string;               // 用户唯一标识
  username: string;         // 用户登录名 (唯一)
  email: string;            // 用户邮箱地址 (唯一)
  phone?: string;           // 用户手机号码
  realName?: string;        // 用户真实姓名
  age?: number;             // 用户年龄
  gender?: string;          // 用户性别 (MALE/FEMALE/UNKNOWN)
  birthday?: Date;          // 用户生日
  avatar?: string;          // 用户头像链接
  bio?: string;             // 用户个人简介
  isActive: boolean;        // 用户账户是否激活
  lastLoginAt?: Date;       // 用户最后登录时间
  settings?: Json;          // 用户个性化配置
  createdBy: string;        // 创建人
  createdAt: Date;          // 创建时间
  updatedBy?: string;       // 更新人
  updatedAt: Date;          // 更新时间
}
```

### 4. 数据传输对象 (DTO)

#### 基础 DTO
```typescript
// base/dto/user.dto.ts (自动生成)
import { IsString, IsEmail, IsOptional, IsEnum, IsInt, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({ description: '用户名', example: 'john_doe' })
  @IsString()
  username: string;

  @ApiProperty({ description: '邮箱', example: 'john@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ description: '密码', example: 'password123' })
  @IsString()
  password: string;

  @ApiPropertyOptional({ description: '昵称', example: 'John' })
  @IsOptional()
  @IsString()
  nickname?: string;

  @ApiPropertyOptional({ description: '头像URL' })
  @IsOptional()
  @IsString()
  avatar?: string;

  @ApiProperty({ description: '状态', enum: ['ACTIVE', 'INACTIVE', 'BANNED'] })
  @IsEnum(['ACTIVE', 'INACTIVE', 'BANNED'])
  status: string;
}

export class UpdateUserDto {
  @ApiPropertyOptional({ description: '昵称' })
  @IsOptional()
  @IsString()
  nickname?: string;

  @ApiPropertyOptional({ description: '头像URL' })
  @IsOptional()
  @IsString()
  avatar?: string;

  @ApiPropertyOptional({ description: '状态', enum: ['ACTIVE', 'INACTIVE', 'BANNED'] })
  @IsOptional()
  @IsEnum(['ACTIVE', 'INACTIVE', 'BANNED'])
  status?: string;
}

export class QueryUserDto {
  @ApiPropertyOptional({ description: '页码', example: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ description: '每页数量', example: 10 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize?: number;

  @ApiPropertyOptional({ description: '搜索关键词' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: '状态筛选', enum: ['ACTIVE', 'INACTIVE', 'BANNED'] })
  @IsOptional()
  @IsEnum(['ACTIVE', 'INACTIVE', 'BANNED'])
  status?: string;
}
```

#### 业务 DTO
```typescript
// biz/dto/auth.dto.ts (手动定制)
import { IsString, IsEmail, MinLength, MaxLength, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ description: '用户名', example: 'john_doe' })
  @IsString()
  @MinLength(3)
  @MaxLength(20)
  @Matches(/^[a-zA-Z0-9_]+$/, { message: '用户名只能包含字母、数字和下划线' })
  username: string;

  @ApiProperty({ description: '邮箱', example: 'john@example.com' })
  @IsEmail({}, { message: '请输入有效的邮箱地址' })
  email: string;

  @ApiProperty({ description: '密码', example: 'Password123!' })
  @IsString()
  @MinLength(8)
  @MaxLength(50)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
    message: '密码必须包含大小写字母、数字和特殊字符'
  })
  password: string;

  @ApiProperty({ description: '昵称', example: 'John Doe' })
  @IsString()
  @MaxLength(50)
  nickname: string;
}

export class LoginDto {
  @ApiProperty({ description: '用户名', example: 'john_doe' })
  @IsString()
  username: string;

  @ApiProperty({ description: '密码', example: 'Password123!' })
  @IsString()
  password: string;
}

export class ChangePasswordDto {
  @ApiProperty({ description: '原密码' })
  @IsString()
  oldPassword: string;

  @ApiProperty({ description: '新密码' })
  @IsString()
  @MinLength(8)
  @MaxLength(50)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
    message: '密码必须包含大小写字母、数字和特殊字符'
  })
  newPassword: string;
}
```

### 5. 共享模块

#### 数据库服务
```typescript
// shared/database/prisma.service.ts
import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    super({
      datasources: {
        db: {
          url: process.env.DATABASE_URL
        }
      },
      log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error']
    });
  }

  async onModuleInit() {
    await this.$connect();
    console.log('✅ Database connected successfully');
  }

  async onModuleDestroy() {
    await this.$disconnect();
    console.log('❌ Database disconnected');
  }

  // 软删除支持
  async softDelete(model: string, where: any) {
    return this[model].update({
      where,
      data: {
        deletedAt: new Date(),
        updatedAt: new Date()
      }
    });
  }

  // 批量操作
  async batchCreate(model: string, data: any[]) {
    return this[model].createMany({
      data,
      skipDuplicates: true
    });
  }

  // 事务支持
  async executeTransaction(operations: ((prisma: PrismaClient) => Promise<any>)[]) {
    return this.$transaction(async (prisma) => {
      const results = [];
      for (const operation of operations) {
        const result = await operation(prisma);
        results.push(result);
      }
      return results;
    });
  }
}
```

#### 认证守卫
```typescript
// shared/guards/jwt-auth.guard.ts
import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    // 检查是否标记为公开接口
    const isPublic = this.reflector.getAllAndOverride<boolean>('isPublic', [
      context.getHandler(),
      context.getClass()
    ]);

    if (isPublic) {
      return true;
    }

    return super.canActivate(context);
  }

  handleRequest(err: any, user: any, info: any) {
    if (err || !user) {
      throw err || new UnauthorizedException('Token 无效或已过期');
    }
    return user;
  }
}
```

#### 响应拦截器
```typescript
// shared/interceptors/response.interceptor.ts
import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface Response<T> {
  code: number;
  message: string;
  data: T;
  timestamp: number;
}

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, Response<T>> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<Response<T>> {
    return next.handle().pipe(
      map(data => ({
        code: 200,
        message: '操作成功',
        data,
        timestamp: Date.now()
      }))
    );
  }
}
```

#### 异常过滤器
```typescript
// shared/filters/http-exception.filter.ts
import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = '服务器内部错误';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      
      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (typeof exceptionResponse === 'object' && exceptionResponse['message']) {
        message = Array.isArray(exceptionResponse['message']) 
          ? exceptionResponse['message'].join(', ')
          : exceptionResponse['message'];
      }
    }

    // 记录错误日志
    console.error(`[${new Date().toISOString()}] ${request.method} ${request.url}`, {
      status,
      message,
      stack: exception instanceof Error ? exception.stack : undefined
    });

    response.status(status).json({
      code: status,
      message,
      timestamp: Date.now(),
      path: request.url
    });
  }
}
```

### 6. 代码生成模板

#### 控制器模板
```handlebars
{{!-- templates/controller.hbs --}}
import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { {{pascalCase name}}Service } from '../services/{{kebabCase name}}.service';
import { Create{{pascalCase name}}Dto, Update{{pascalCase name}}Dto, Query{{pascalCase name}}Dto } from '../dto/{{kebabCase name}}.dto';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';

@ApiTags('{{title}}')
@Controller('api/v1/{{kebabCase name}}s')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class {{pascalCase name}}Controller {
  constructor(private readonly {{camelCase name}}Service: {{