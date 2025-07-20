# 低代码后端项目脚手架

## 🏗️ 项目目录结构

```
lowcode-backend-scaffold/
├── src/                                    # 源代码目录
│   ├── base/                              # 基础代码层（代码生成器生成）
│   │   ├── controllers/                   # 基础控制器
│   │   │   ├── user.base.controller.ts
│   │   │   └── role.base.controller.ts
│   │   ├── services/                      # 基础服务
│   │   │   ├── user.base.service.ts
│   │   │   └── role.base.service.ts
│   │   ├── dto/                          # 数据传输对象
│   │   │   ├── user.dto.ts
│   │   │   ├── role.dto.ts
│   │   │   └── common.dto.ts
│   │   ├── entities/                     # 数据库实体
│   │   │   ├── user.entity.ts
│   │   │   └── role.entity.ts
│   │   └── interfaces/                   # 接口定义
│   │       ├── user.interface.ts
│   │       └── role.interface.ts
│   ├── biz/                              # 业务代码层（开发者自定义）
│   │   ├── controllers/                  # 业务控制器
│   │   │   ├── user.controller.ts
│   │   │   └── role.controller.ts
│   │   ├── services/                     # 业务服务
│   │   │   ├── user.service.ts
│   │   │   └── role.service.ts
│   │   └── modules/                      # 业务模块
│   │       ├── user.module.ts
│   │       └── role.module.ts
│   ├── shared/                           # 共享模块
│   │   ├── guards/                       # 守卫
│   │   │   ├── jwt-auth.guard.ts
│   │   │   └── roles.guard.ts
│   │   ├── interceptors/                 # 拦截器
│   │   │   ├── response.interceptor.ts
│   │   │   ├── logging.interceptor.ts
│   │   │   └── timeout.interceptor.ts
│   │   ├── decorators/                   # 装饰器
│   │   │   ├── amis-response.decorator.ts
│   │   │   ├── public.decorator.ts
│   │   │   └── roles.decorator.ts
│   │   ├── filters/                      # 异常过滤器
│   │   │   ├── http-exception.filter.ts
│   │   │   └── prisma-exception.filter.ts
│   │   ├── pipes/                        # 管道
│   │   │   ├── validation.pipe.ts
│   │   │   └── parse-int.pipe.ts
│   │   ├── services/                     # 共享服务
│   │   │   ├── prisma.service.ts
│   │   │   ├── redis.service.ts
│   │   │   └── logger.service.ts
│   │   └── utils/                        # 工具函数
│   │       ├── crypto.util.ts
│   │       ├── date.util.ts
│   │       └── response.util.ts
│   ├── config/                           # 配置文件
│   │   ├── database.config.ts
│   │   ├── jwt.config.ts
│   │   ├── redis.config.ts
│   │   ├── swagger.config.ts
│   │   └── app.config.ts
│   ├── app.controller.ts                 # 应用控制器
│   ├── app.service.ts                    # 应用服务
│   ├── app.module.ts                     # 应用模块
│   └── main.ts                           # 应用入口
├── prisma/                               # Prisma数据库
│   ├── schema.prisma                     # 数据库模式
│   ├── migrations/                       # 数据库迁移
│   └── seeds/                           # 数据种子
│       └── index.ts
├── test/                                 # 测试文件
│   ├── app.e2e-spec.ts
│   └── jest-e2e.json
├── docs/                                 # 文档目录
│   ├── api.md
│   └── deployment.md
├── .env.example                          # 环境变量示例
├── .env                                  # 环境变量（本地）
├── .gitignore                           # Git忽略文件
├── .eslintrc.js                         # ESLint配置
├── .prettierrc                          # Prettier配置
├── .husky/                              # Git钩子
│   ├── pre-commit
│   └── commit-msg
├── docker-compose.yml                    # Docker Compose配置
├── Dockerfile                           # Docker配置
├── ecosystem.config.js                  # PM2配置
├── jest.config.js                       # Jest配置
├── nest-cli.json                        # NestJS CLI配置
├── package.json                         # 项目依赖
├── tsconfig.json                        # TypeScript配置
├── tsconfig.build.json                  # 构建配置
└── README.md                            # 项目说明

## 📦 核心依赖配置

### package.json
```json
{
  "name": "lowcode-backend-scaffold",
  "version": "1.0.0",
  "description": "Low-code backend project scaffold with NestJS and Fastify",
  "author": "Low-code Platform Team",
  "private": true,
  "license": "MIT",
  "scripts": {
    "build": "nest build",
    "format": "prettier --write \"src/**/*.ts\" \"test/**/*.ts\"",
    "start": "nest start",
    "start:dev": "cross-env NODE_ENV=development nest start --watch",
    "start:debug": "cross-env NODE_ENV=development nest start --debug --watch",
    "start:prod": "cross-env NODE_ENV=production node dist/main",
    "lint": "eslint \"{src,apps,libs,test}/**/*.ts\" --fix",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:cov": "jest --coverage",
    "test:debug": "node --inspect-brk -r tsconfig-paths/register -r ts-node/register node_modules/.bin/jest --runInBand",
    "test:e2e": "jest --config ./test/jest-e2e.json",
    "prisma:generate": "prisma generate",
    "prisma:migrate": "prisma migrate dev",
    "prisma:migrate:deploy": "prisma migrate deploy",
    "prisma:seed": "ts-node -r tsconfig-paths/register prisma/seeds",
    "prisma:studio": "prisma studio",
    "prepare": "husky install"
  },
  "dependencies": {
    "@fastify/compress": "^8.0.1",
    "@fastify/csrf-protection": "^7.1.0",
    "@fastify/helmet": "^13.0.1",
    "@fastify/multipart": "^9.0.3",
    "@fastify/static": "^8.1.1",
    "@keyv/redis": "^4.3.2",
    "@nest-lab/throttler-storage-redis": "^1.1.0",
    "@nestjs/axios": "^4.0.0",
    "@nestjs/cache-manager": "^3.0.1",
    "@nestjs/common": "^11.0.12",
    "@nestjs/config": "^4.0.2",
    "@nestjs/core": "^11.0.12",
    "@nestjs/cqrs": "^11.0.3",
    "@nestjs/event-emitter": "^3.0.1",
    "@nestjs/jwt": "^11.0.0",
    "@nestjs/passport": "^11.0.5",
    "@nestjs/platform-fastify": "^11.0.12",
    "@nestjs/schedule": "^5.0.1",
    "@nestjs/swagger": "^11.1.0",
    "@nestjs/terminus": "^11.0.0",
    "@nestjs/throttler": "^6.4.0",
    "@prisma/client": "^6.5.0",
    "bcryptjs": "^3.0.2",
    "cache-manager": "^6.4.1",
    "class-transformer": "^0.5.1",
    "class-validator": "^0.14.1",
    "crypto-js": "^4.2.0",
    "dotenv": "^16.4.7",
    "fastify": "^5.2.2",
    "ioredis": "^5.6.0",
    "nest-winston": "^1.10.2",
    "passport": "^0.7.0",
    "passport-jwt": "^4.0.1",
    "reflect-metadata": "^0.2.2",
    "rxjs": "^7.8.2",
    "ulid": "^3.0.0",
    "winston": "^3.17.0",
    "winston-daily-rotate-file": "^5.0.0"
  },
  "devDependencies": {
    "@nestjs/cli": "^10.4.9",
    "@nestjs/schematics": "^11.0.2",
    "@nestjs/testing": "^11.0.12",
    "@types/bcryptjs": "^2.4.6",
    "@types/crypto-js": "^4.2.2",
    "@types/jest": "29.5.14",
    "@types/node": "22.13.5",
    "@types/passport-jwt": "^4.0.1",
    "@types/supertest": "^6.0.3",
    "@typescript-eslint/eslint-plugin": "^8.29.0",
    "@typescript-eslint/parser": "^8.29.0",
    "cross-env": "^7.0.3",
    "eslint": "^9.23.0",
    "eslint-config-prettier": "^10.1.1",
    "eslint-plugin-prettier": "^5.2.5",
    "husky": "^9.1.7",
    "jest": "29.7.0",
    "lint-staged": "^15.2.10",
    "prettier": "^3.5.3",
    "prisma": "^6.5.0",
    "source-map-support": "^0.5.21",
    "supertest": "^7.1.0",
    "ts-jest": "^29.3.1",
    "ts-loader": "^9.5.2",
    "ts-node": "^10.9.2",
    "tsconfig-paths": "4.2.0",
    "typescript": "^5.8.2"
  }
}
```

## ⚙️ TypeScript配置

### tsconfig.json
```json
{
  "compilerOptions": {
    "module": "commonjs",
    "declaration": true,
    "removeComments": true,
    "emitDecoratorMetadata": true,
    "experimentalDecorators": true,
    "allowSyntheticDefaultImports": true,
    "target": "ES2022",
    "sourceMap": true,
    "outDir": "./dist",
    "baseUrl": "./",
    "incremental": true,
    "skipLibCheck": true,
    "strictNullChecks": false,
    "noImplicitAny": false,
    "strictBindCallApply": false,
    "forceConsistentCasingInFileNames": false,
    "noFallthroughCasesInSwitch": false,
    "paths": {
      "@/*": ["src/*"],
      "@base/*": ["src/base/*"],
      "@biz/*": ["src/biz/*"],
      "@shared/*": ["src/shared/*"],
      "@config/*": ["src/config/*"],
      "@dto/*": ["src/base/dto/*"],
      "@entities/*": ["src/base/entities/*"],
      "@interfaces/*": ["src/base/interfaces/*"],
      "@controllers/*": ["src/biz/controllers/*"],
      "@services/*": ["src/biz/services/*"],
      "@modules/*": ["src/biz/modules/*"],
      "@guards/*": ["src/shared/guards/*"],
      "@interceptors/*": ["src/shared/interceptors/*"],
      "@decorators/*": ["src/shared/decorators/*"],
      "@filters/*": ["src/shared/filters/*"],
      "@pipes/*": ["src/shared/pipes/*"],
      "@utils/*": ["src/shared/utils/*"]
    }
  }
}
```

### tsconfig.build.json
```json
{
  "extends": "./tsconfig.json",
  "exclude": ["node_modules", "test", "dist", "**/*spec.ts"]
}
```

## 🔧 开发工具配置

### .eslintrc.js
```javascript
module.exports = {
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: 'tsconfig.json',
    tsconfigRootDir: __dirname,
    sourceType: 'module',
  },
  plugins: ['@typescript-eslint/eslint-plugin'],
  extends: [
    '@typescript-eslint/recommended',
    'plugin:prettier/recommended',
  ],
  root: true,
  env: {
    node: true,
    jest: true,
  },
  ignorePatterns: ['.eslintrc.js'],
  rules: {
    '@typescript-eslint/interface-name-prefix': 'off',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    'prettier/prettier': ['error', { endOfLine: 'auto' }],
  },
};
```

### .prettierrc
```json
{
  "singleQuote": true,
  "trailingComma": "all",
  "tabWidth": 2,
  "semi": true,
  "printWidth": 100,
  "endOfLine": "auto"
}
```

### nest-cli.json
```json
{
  "$schema": "https://json.schemastore.org/nest-cli",
  "collection": "@nestjs/schematics",
  "sourceRoot": "src",
  "compilerOptions": {
    "deleteOutDir": true,
    "webpack": true,
    "tsConfigPath": "tsconfig.build.json"
  }
}
```

## 🚀 核心代码框架

### src/main.ts
```typescript
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from '@filters/http-exception.filter';
import { ResponseInterceptor } from '@interceptors/response.interceptor';
import { LoggingInterceptor } from '@interceptors/logging.interceptor';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  // 创建Fastify应用
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({ logger: true }),
  );

  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT', 3000);
  const globalPrefix = configService.get<string>('GLOBAL_PREFIX', 'api/v1');

  // 设置全局前缀
  app.setGlobalPrefix(globalPrefix);

  // 启用CORS
  await app.register(require('@fastify/cors'), {
    origin: true,
    credentials: true,
  });

  // 启用压缩
  await app.register(require('@fastify/compress'));

  // 启用安全头
  await app.register(require('@fastify/helmet'));

  // 启用CSRF保护
  await app.register(require('@fastify/csrf-protection'));

  // 全局管道
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // 全局过滤器
  app.useGlobalFilters(new HttpExceptionFilter());

  // 全局拦截器
  app.useGlobalInterceptors(
    new LoggingInterceptor(),
    new ResponseInterceptor(),
  );

  // Swagger文档配置
  if (process.env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('Low-code Backend API')
      .setDescription('Auto-generated API documentation for low-code backend')
      .setVersion('1.0.0')
      .addBearerAuth()
      .addTag('Authentication', 'User authentication endpoints')
      .addTag('Users', 'User management endpoints')
      .addTag('Roles', 'Role management endpoints')
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup(`${globalPrefix}/docs`, app, document, {
      swaggerOptions: {
        persistAuthorization: true,
      },
    });

    logger.log(`Swagger documentation available at: http://localhost:${port}/${globalPrefix}/docs`);
  }

  // 启动应用
  await app.listen(port, '0.0.0.0');
  logger.log(`Application is running on: http://localhost:${port}/${globalPrefix}`);
}

bootstrap().catch((error) => {
  Logger.error('Failed to start application', error);
  process.exit(1);
});
```

### src/app.module.ts
```typescript
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CacheModule } from '@nestjs/cache-manager';
import { ThrottlerModule } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { TerminusModule } from '@nestjs/terminus';
import { redisStore } from 'cache-manager-ioredis-yet';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaService } from '@shared/services/prisma.service';
import { RedisService } from '@shared/services/redis.service';
import { LoggerService } from '@shared/services/logger.service';
import { UserModule } from '@modules/user.module';
import { RoleModule } from '@modules/role.module';
import { AuthModule } from '@modules/auth.module';
import { HealthModule } from '@modules/health.module';
import appConfig from '@config/app.config';
import databaseConfig from '@config/database.config';
import jwtConfig from '@config/jwt.config';
import redisConfig from '@config/redis.config';

@Module({
  imports: [
    // 配置模块
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, databaseConfig, jwtConfig, redisConfig],
      envFilePath: ['.env.local', '.env'],
    }),

    // 缓存模块
    CacheModule.registerAsync({
      isGlobal: true,
      useFactory: async (configService: ConfigService) => {
        const redisConfig = configService.get('redis');
        return {
          store: redisStore,
          host: redisConfig.host,
          port: redisConfig.port,
          password: redisConfig.password,
          db: redisConfig.db,
          ttl: 60 * 60, // 1小时
        };
      },
      inject: [ConfigService],
    }),

    // 限流模块
    ThrottlerModule.forRootAsync({
      useFactory: (configService: ConfigService) => [
        {
          ttl: configService.get('THROTTLE_TTL', 60000),
          limit: configService.get('THROTTLE_LIMIT', 10),
        },
      ],
      inject: [ConfigService],
    }),

    // 定时任务模块
    ScheduleModule.forRoot(),

    // 事件模块
    EventEmitterModule.forRoot(),

    // 健康检查模块
    TerminusModule,

    // 业务模块
    AuthModule,
    UserModule,
    RoleModule,
    HealthModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    PrismaService,
    RedisService,
    LoggerService,
  ],
})
export class AppModule {}
```

### src/app.controller.ts
```typescript
import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AppService } from './app.service';
import { Public } from '@decorators/public.decorator';
import { AmisResponse } from '@decorators/amis-response.decorator';

@ApiTags('Application')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @Public()
  @AmisResponse()
  @ApiOperation({ summary: 'Get application info' })
  @ApiResponse({
    status: 200,
    description: 'Application information',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'number', example: 0 },
        msg: { type: 'string', example: 'success' },
        data: {
          type: 'object',
          properties: {
            name: { type: 'string', example: 'Low-code Backend API' },
            version: { type: 'string', example: '1.0.0' },
            description: { type: 'string', example: 'Auto-generated backend API' },
            timestamp: { type: 'string', example: '2024-01-01T00:00:00.000Z' },
          },
        },
      },
    },
  })
  getAppInfo() {
    return this.appService.getAppInfo();
  }

  @Get('health')
  @Public()
  @AmisResponse()
  @ApiOperation({ summary: 'Health check' })
  @ApiResponse({
    status: 200,
    description: 'Health status',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'number', example: 0 },
        msg: { type: 'string', example: 'success' },
        data: {
          type: 'object',
          properties: {
            status: { type: 'string', example: 'ok' },
            timestamp: { type: 'string', example: '2024-01-01T00:00:00.000Z' },
            uptime: { type: 'number', example: 12345 },
          },
        },
      },
    },
  })
  getHealth() {
    return this.appService.getHealth();
  }
}
```

### src/app.service.ts
```typescript
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AppService {
  constructor(private readonly configService: ConfigService) {}

  getAppInfo() {
    return {
      name: 'Low-code Backend API',
      version: '1.0.0',
      description: 'Auto-generated backend API with NestJS and Fastify',
      timestamp: new Date().toISOString(),
      environment: this.configService.get('NODE_ENV', 'development'),
    };
  }

  getHealth() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
    };
  }
}

## 🛡️ 共享模块

### src/shared/decorators/amis-response.decorator.ts
```typescript
import { applyDecorators, UseInterceptors } from '@nestjs/common';
import { ResponseInterceptor } from '@interceptors/response.interceptor';

/**
 * Amis响应格式装饰器
 * 自动将响应包装为Amis标准格式: { status: number, msg: string, data?: any }
 */
export function AmisResponse() {
  return applyDecorators(
    UseInterceptors(ResponseInterceptor),
  );
}
```

### src/shared/decorators/public.decorator.ts
```typescript
import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/**
 * 公开接口装饰器
 * 标记不需要JWT认证的接口
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
```

### src/shared/decorators/roles.decorator.ts
```typescript
import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';

/**
 * 角色权限装饰器
 * 标记需要特定角色才能访问的接口
 */
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
```

### src/shared/interceptors/response.interceptor.ts
```typescript
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface AmisResponse<T> {
  status: number;
  msg: string;
  data?: T;
}

/**
 * 响应拦截器
 * 将所有响应包装为Amis标准格式
 */
@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, AmisResponse<T>> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<AmisResponse<T>> {
    return next.handle().pipe(
      map((data) => {
        // 如果已经是Amis格式，直接返回
        if (data && typeof data === 'object' && 'status' in data && 'msg' in data) {
          return data;
        }

        // 包装为Amis格式
        return {
          status: 0,
          msg: 'success',
          data,
        };
      }),
    );
  }
}
```

### src/shared/interceptors/logging.interceptor.ts
```typescript
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

/**
 * 日志拦截器
 * 记录请求和响应信息
 */
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url, body, query, params } = request;
    const userAgent = request.headers['user-agent'] || '';
    const ip = request.ip || request.connection.remoteAddress;

    const now = Date.now();

    this.logger.log(
      `Incoming Request: ${method} ${url} - ${userAgent} ${ip}`,
    );

    if (Object.keys(body || {}).length > 0) {
      this.logger.debug(`Request Body: ${JSON.stringify(body)}`);
    }

    if (Object.keys(query || {}).length > 0) {
      this.logger.debug(`Query Params: ${JSON.stringify(query)}`);
    }

    if (Object.keys(params || {}).length > 0) {
      this.logger.debug(`Route Params: ${JSON.stringify(params)}`);
    }

    return next.handle().pipe(
      tap(() => {
        const responseTime = Date.now() - now;
        this.logger.log(
          `Outgoing Response: ${method} ${url} - ${responseTime}ms`,
        );
      }),
    );
  }
}
```

### src/shared/filters/http-exception.filter.ts
```typescript
import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { FastifyRequest, FastifyReply } from 'fastify';

/**
 * HTTP异常过滤器
 * 统一处理HTTP异常，返回Amis标准格式
 */
@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<FastifyReply>();
    const request = ctx.getRequest<FastifyRequest>();
    const status = exception.getStatus();

    const exceptionResponse = exception.getResponse();
    const message = typeof exceptionResponse === 'string'
      ? exceptionResponse
      : (exceptionResponse as any).message || exception.message;

    const errorResponse = {
      status: 1, // Amis错误状态码
      msg: Array.isArray(message) ? message.join(', ') : message,
      data: null,
      error: {
        statusCode: status,
        timestamp: new Date().toISOString(),
        path: request.url,
        method: request.method,
      },
    };

    // 记录错误日志
    this.logger.error(
      `HTTP Exception: ${request.method} ${request.url} - ${status} - ${JSON.stringify(errorResponse)}`,
      exception.stack,
    );

    response.status(status).send(errorResponse);
  }
}
```

### src/shared/guards/jwt-auth.guard.ts
```typescript
import {
  Injectable,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { IS_PUBLIC_KEY } from '@decorators/public.decorator';

/**
 * JWT认证守卫
 * 验证JWT token，支持公开接口跳过认证
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    return super.canActivate(context);
  }

  handleRequest(err: any, user: any, info: any) {
    if (err || !user) {
      throw err || new UnauthorizedException('Invalid token');
    }
    return user;
  }
}

## ⚙️ 配置文件

### src/config/app.config.ts
```typescript
import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  name: process.env.APP_NAME || 'Low-code Backend API',
  version: process.env.APP_VERSION || '1.0.0',
  description: process.env.APP_DESCRIPTION || 'Auto-generated backend API',
  port: parseInt(process.env.PORT, 10) || 3000,
  globalPrefix: process.env.GLOBAL_PREFIX || 'api/v1',
  environment: process.env.NODE_ENV || 'development',
  timezone: process.env.TZ || 'Asia/Shanghai',
}));
```

### src/config/database.config.ts
```typescript
import { registerAs } from '@nestjs/config';

export default registerAs('database', () => ({
  url: process.env.DATABASE_URL,
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT, 10) || 5432,
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
  database: process.env.DB_DATABASE || 'lowcode_db',
  schema: process.env.DB_SCHEMA || 'public',
  ssl: process.env.DB_SSL === 'true',
  logging: process.env.DB_LOGGING === 'true',
}));
```

### src/config/jwt.config.ts
```typescript
import { registerAs } from '@nestjs/config';

export default registerAs('jwt', () => ({
  secret: process.env.JWT_SECRET || 'your-secret-key',
  expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  refreshSecret: process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key',
  refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
}));
```

### src/config/redis.config.ts
```typescript
import { registerAs } from '@nestjs/config';

export default registerAs('redis', () => ({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT, 10) || 6379,
  password: process.env.REDIS_PASSWORD || '',
  db: parseInt(process.env.REDIS_DB, 10) || 0,
  keyPrefix: process.env.REDIS_KEY_PREFIX || 'lowcode:',
  ttl: parseInt(process.env.REDIS_TTL, 10) || 3600,
}));
```

## 🗄️ 数据库和服务

### src/shared/services/prisma.service.ts
```typescript
import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { ConfigService } from '@nestjs/config';

/**
 * Prisma数据库服务
 * 管理数据库连接和事务
 */
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor(private configService: ConfigService) {
    const databaseUrl = configService.get<string>('DATABASE_URL');

    super({
      datasources: {
        db: {
          url: databaseUrl,
        },
      },
      log: configService.get('NODE_ENV') === 'development'
        ? ['query', 'info', 'warn', 'error']
        : ['error'],
    });
  }

  async onModuleInit() {
    try {
      await this.$connect();
      this.logger.log('Database connected successfully');
    } catch (error) {
      this.logger.error('Failed to connect to database', error);
      throw error;
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
    this.logger.log('Database disconnected');
  }

  /**
   * 执行事务
   */
  async executeTransaction<T>(fn: (prisma: PrismaClient) => Promise<T>): Promise<T> {
    return this.$transaction(fn);
  }

  /**
   * 健康检查
   */
  async healthCheck(): Promise<boolean> {
    try {
      await this.$queryRaw`SELECT 1`;
      return true;
    } catch {
      return false;
    }
  }
}
```

### src/shared/services/redis.service.ts
```typescript
import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

/**
 * Redis缓存服务
 * 提供缓存操作和会话管理
 */
@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client: Redis;

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    const redisConfig = this.configService.get('redis');

    this.client = new Redis({
      host: redisConfig.host,
      port: redisConfig.port,
      password: redisConfig.password,
      db: redisConfig.db,
      keyPrefix: redisConfig.keyPrefix,
      retryDelayOnFailover: 100,
      maxRetriesPerRequest: 3,
    });

    this.client.on('connect', () => {
      this.logger.log('Redis connected successfully');
    });

    this.client.on('error', (error) => {
      this.logger.error('Redis connection error', error);
    });
  }

  async onModuleDestroy() {
    if (this.client) {
      await this.client.quit();
      this.logger.log('Redis disconnected');
    }
  }

  /**
   * 设置缓存
   */
  async set(key: string, value: any, ttl?: number): Promise<void> {
    const serializedValue = JSON.stringify(value);
    if (ttl) {
      await this.client.setex(key, ttl, serializedValue);
    } else {
      await this.client.set(key, serializedValue);
    }
  }

  /**
   * 获取缓存
   */
  async get<T>(key: string): Promise<T | null> {
    const value = await this.client.get(key);
    return value ? JSON.parse(value) : null;
  }

  /**
   * 删除缓存
   */
  async del(key: string): Promise<void> {
    await this.client.del(key);
  }

  /**
   * 检查键是否存在
   */
  async exists(key: string): Promise<boolean> {
    const result = await this.client.exists(key);
    return result === 1;
  }

  /**
   * 设置过期时间
   */
  async expire(key: string, seconds: number): Promise<void> {
    await this.client.expire(key, seconds);
  }

  /**
   * 健康检查
   */
  async healthCheck(): Promise<boolean> {
    try {
      const result = await this.client.ping();
      return result === 'PONG';
    } catch {
      return false;
    }
  }
}

## 🗃️ Prisma数据库配置

### prisma/schema.prisma
```prisma
// This is your Prisma schema file,
// learn more about it in the docs: https://pris.ly/d/prisma-schema

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// 用户表
model User {
  id        String   @id @default(cuid())
  username  String   @unique @db.VarChar(50)
  email     String   @unique @db.VarChar(100)
  password  String   @db.VarChar(255)
  fullName  String?  @db.VarChar(100)
  phone     String?  @db.VarChar(20)
  avatar    String?  @db.VarChar(255)
  status    String   @default("active") @db.VarChar(20)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // 关联关系
  userRoles UserRole[]

  @@map("users")
}

// 角色表
model Role {
  id          String   @id @default(cuid())
  name        String   @unique @db.VarChar(50)
  code        String   @unique @db.VarChar(50)
  description String?  @db.VarChar(200)
  status      String   @default("active") @db.VarChar(20)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // 关联关系
  userRoles UserRole[]

  @@map("roles")
}

// 用户角色关联表
model UserRole {
  id     String @id @default(cuid())
  userId String
  roleId String

  // 关联关系
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  role Role @relation(fields: [roleId], references: [id], onDelete: Cascade)

  @@unique([userId, roleId])
  @@map("user_roles")
}
```

### prisma/seeds/index.ts
```typescript
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // 创建默认角色
  const adminRole = await prisma.role.upsert({
    where: { code: 'admin' },
    update: {},
    create: {
      name: '管理员',
      code: 'admin',
      description: '系统管理员角色',
      status: 'active',
    },
  });

  const userRole = await prisma.role.upsert({
    where: { code: 'user' },
    update: {},
    create: {
      name: '普通用户',
      code: 'user',
      description: '普通用户角色',
      status: 'active',
    },
  });

  // 创建默认管理员用户
  const hashedPassword = await bcrypt.hash('admin123', 10);
  const adminUser = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      email: 'admin@example.com',
      password: hashedPassword,
      fullName: '系统管理员',
      status: 'active',
    },
  });

  // 分配管理员角色
  await prisma.userRole.upsert({
    where: {
      userId_roleId: {
        userId: adminUser.id,
        roleId: adminRole.id,
      },
    },
    update: {},
    create: {
      userId: adminUser.id,
      roleId: adminRole.id,
    },
  });

  console.log('✅ Database seeding completed successfully!');
  console.log(`👤 Admin user created: admin / admin123`);
}

main()
  .catch((e) => {
    console.error('❌ Database seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

## 🐳 Docker配置

### Dockerfile
```dockerfile
# 多阶段构建
FROM node:18-alpine AS builder

# 设置工作目录
WORKDIR /app

# 复制package文件
COPY package*.json ./
COPY prisma ./prisma/

# 安装依赖
RUN npm ci --only=production && npm cache clean --force

# 复制源代码
COPY . .

# 生成Prisma客户端
RUN npx prisma generate

# 构建应用
RUN npm run build

# 生产镜像
FROM node:18-alpine AS production

# 安装dumb-init
RUN apk add --no-cache dumb-init

# 创建应用用户
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nestjs -u 1001

# 设置工作目录
WORKDIR /app

# 复制构建产物
COPY --from=builder --chown=nestjs:nodejs /app/dist ./dist
COPY --from=builder --chown=nestjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nestjs:nodejs /app/package*.json ./
COPY --from=builder --chown=nestjs:nodejs /app/prisma ./prisma

# 切换到应用用户
USER nestjs

# 暴露端口
EXPOSE 3000

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node dist/health-check.js

# 启动应用
CMD ["dumb-init", "node", "dist/main"]
```

### docker-compose.yml
```yaml
version: '3.8'

services:
  # 应用服务
  app:
    build:
      context: .
      dockerfile: Dockerfile
      target: production
    container_name: lowcode-backend
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://postgres:password@postgres:5432/lowcode_db
      - REDIS_HOST=redis
      - REDIS_PORT=6379
      - JWT_SECRET=your-super-secret-jwt-key
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    networks:
      - lowcode-network
    volumes:
      - ./logs:/app/logs

  # PostgreSQL数据库
  postgres:
    image: postgres:15-alpine
    container_name: lowcode-postgres
    restart: unless-stopped
    environment:
      - POSTGRES_DB=lowcode_db
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./init.sql:/docker-entrypoint-initdb.d/init.sql
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - lowcode-network

  # Redis缓存
  redis:
    image: redis:7-alpine
    container_name: lowcode-redis
    restart: unless-stopped
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 3s
      retries: 5
    networks:
      - lowcode-network

  # Nginx反向代理（可选）
  nginx:
    image: nginx:alpine
    container_name: lowcode-nginx
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - app
    networks:
      - lowcode-network

volumes:
  postgres_data:
  redis_data:

networks:
  lowcode-network:
    driver: bridge
```

## 🌍 环境配置

### .env.example
```bash
# 应用配置
APP_NAME="Low-code Backend API"
APP_VERSION="1.0.0"
APP_DESCRIPTION="Auto-generated backend API with NestJS and Fastify"
PORT=3000
GLOBAL_PREFIX="api/v1"
NODE_ENV="development"
TZ="Asia/Shanghai"

# 数据库配置
DATABASE_URL="postgresql://postgres:password@localhost:5432/lowcode_db?schema=public"
DB_HOST="localhost"
DB_PORT=5432
DB_USERNAME="postgres"
DB_PASSWORD="password"
DB_DATABASE="lowcode_db"
DB_SCHEMA="public"
DB_SSL=false
DB_LOGGING=true

# JWT配置
JWT_SECRET="your-super-secret-jwt-key-change-in-production"
JWT_EXPIRES_IN="7d"
JWT_REFRESH_SECRET="your-super-secret-refresh-key-change-in-production"
JWT_REFRESH_EXPIRES_IN="30d"

# Redis配置
REDIS_HOST="localhost"
REDIS_PORT=6379
REDIS_PASSWORD=""
REDIS_DB=0
REDIS_KEY_PREFIX="lowcode:"
REDIS_TTL=3600

# 限流配置
THROTTLE_TTL=60000
THROTTLE_LIMIT=10

# 日志配置
LOG_LEVEL="info"
LOG_FILE_ENABLED=true
LOG_FILE_PATH="./logs"

# 文件上传配置
UPLOAD_MAX_FILE_SIZE=10485760
UPLOAD_ALLOWED_TYPES="image/jpeg,image/png,image/gif,application/pdf"

# 邮件配置（可选）
MAIL_HOST=""
MAIL_PORT=587
MAIL_USERNAME=""
MAIL_PASSWORD=""
MAIL_FROM=""

# 短信配置（可选）
SMS_ACCESS_KEY=""
SMS_SECRET_KEY=""
SMS_REGION=""
```

### .gitignore
```gitignore
# Dependencies
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Runtime data
pids
*.pid
*.seed
*.pid.lock

# Coverage directory used by tools like istanbul
coverage/
*.lcov

# nyc test coverage
.nyc_output

# Grunt intermediate storage
.grunt

# Bower dependency directory
bower_components

# node-waf configuration
.lock-wscript

# Compiled binary addons
build/Release

# Dependency directories
node_modules/
jspm_packages/

# TypeScript cache
*.tsbuildinfo

# Optional npm cache directory
.npm

# Optional eslint cache
.eslintcache

# Optional REPL history
.node_repl_history

# Output of 'npm pack'
*.tgz

# Yarn Integrity file
.yarn-integrity

# dotenv environment variables file
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# parcel-bundler cache
.cache
.parcel-cache

# next.js build output
.next

# nuxt.js build output
.nuxt

# vuepress build output
.vuepress/dist

# Serverless directories
.serverless

# FuseBox cache
.fusebox/

# DynamoDB Local files
.dynamodb/

# TernJS port file
.tern-port

# Stores VSCode versions used for testing VSCode extensions
.vscode-test

# Compiled output
/dist
/tmp
/out-tsc

# OS
.DS_Store
Thumbs.db

# IDEs and editors
/.idea
.project
.classpath
.c9/
*.launch
.settings/
*.sublime-workspace

# IDE - VSCode
.vscode/*
!.vscode/settings.json
!.vscode/tasks.json
!.vscode/launch.json
!.vscode/extensions.json

# Logs
logs
*.log

# Database
*.sqlite
*.db

# Prisma
/prisma/migrations/dev.db*

# PM2
ecosystem.config.js

# Docker
docker-compose.override.yml

# SSL certificates
ssl/
```

## 📚 项目文档

### README.md
```markdown
# Low-code Backend API

基于 NestJS + Fastify 构建的低代码后端项目脚手架，支持代码生成器直接写入，遵循 Amis 框架数据格式规范。

## ✨ 特性

- 🚀 **高性能**: 基于 NestJS 11.x + Fastify 5.x
- 🏗️ **分层架构**: 支持 base/biz 双层架构设计
- 📊 **Amis兼容**: 严格遵循 Amis 框架数据格式规范
- 🔐 **安全认证**: JWT + 角色权限控制
- 📝 **API文档**: 自动生成 Swagger 文档
- 🗄️ **数据库**: PostgreSQL + Prisma ORM
- 🚀 **缓存**: Redis 缓存支持
- 🐳 **容器化**: Docker + Docker Compose
- 🧪 **测试**: Jest 单元测试和 E2E 测试
- 📦 **代码质量**: ESLint + Prettier + Husky

## 🏗️ 项目结构

\`\`\`
src/
├── base/          # 基础代码层（代码生成器生成）
├── biz/           # 业务代码层（开发者自定义）
├── shared/        # 共享模块
├── config/        # 配置文件
├── app.module.ts  # 应用模块
└── main.ts        # 应用入口
\`\`\`

## 🚀 快速开始

### 1. 环境要求

- Node.js >= 18.0.0
- PostgreSQL >= 12.0
- Redis >= 6.0

### 2. 安装依赖

\`\`\`bash
npm install
\`\`\`

### 3. 环境配置

\`\`\`bash
# 复制环境变量文件
cp .env.example .env

# 编辑环境变量
vim .env
\`\`\`

### 4. 数据库设置

\`\`\`bash
# 生成 Prisma 客户端
npm run prisma:generate

# 运行数据库迁移
npm run prisma:migrate

# 填充初始数据
npm run prisma:seed
\`\`\`

### 5. 启动应用

\`\`\`bash
# 开发模式
npm run start:dev

# 生产模式
npm run build
npm run start:prod
\`\`\`

### 6. 访问应用

- API 地址: http://localhost:3000/api/v1
- API 文档: http://localhost:3000/api/v1/docs
- 健康检查: http://localhost:3000/api/v1/health

## 🐳 Docker 部署

### 使用 Docker Compose

\`\`\`bash
# 启动所有服务
docker-compose up -d

# 查看日志
docker-compose logs -f app

# 停止服务
docker-compose down
\`\`\`

### 单独构建镜像

\`\`\`bash
# 构建镜像
docker build -t lowcode-backend .

# 运行容器
docker run -p 3000:3000 -e DATABASE_URL="..." lowcode-backend
\`\`\`

## 📝 API 规范

### Amis 响应格式

所有 API 接口都遵循 Amis 标准响应格式：

\`\`\`typescript
// 成功响应
{
  "status": 0,
  "msg": "success",
  "data": { ... }
}

// 错误响应
{
  "status": 1,
  "msg": "error message",
  "data": null
}

// 分页响应
{
  "status": 0,
  "msg": "success",
  "data": {
    "items": [...],
    "total": 100,
    "page": 1,
    "pageSize": 10
  }
}
\`\`\`

### 认证方式

使用 JWT Bearer Token 认证：

\`\`\`bash
curl -H "Authorization: Bearer <token>" http://localhost:3000/api/v1/users
\`\`\`

## 🧪 测试

\`\`\`bash
# 单元测试
npm run test

# E2E 测试
npm run test:e2e

# 测试覆盖率
npm run test:cov
\`\`\`

## 📦 构建部署

\`\`\`bash
# 构建项目
npm run build

# 生产环境启动
npm run start:prod

# PM2 部署
npm run pm2:start:prod
\`\`\`

## 🔧 开发指南

### 添加新模块

1. 在 \`src/base/\` 目录下创建基础代码
2. 在 \`src/biz/\` 目录下创建业务代码
3. 在 \`app.module.ts\` 中注册模块

### 代码生成器集成

项目结构完全支持代码生成器：

- \`src/base/\` - 生成的基础代码
- \`src/biz/\` - 自定义业务代码
- TypeScript 路径别名支持
- 自动导入和继承机制

### 数据库操作

\`\`\`bash
# 创建迁移
npx prisma migrate dev --name add_new_table

# 重置数据库
npx prisma migrate reset

# 查看数据库
npx prisma studio
\`\`\`

## 📋 默认账号

- 用户名: \`admin\`
- 密码: \`admin123\`

## 🤝 贡献指南

1. Fork 项目
2. 创建特性分支
3. 提交更改
4. 推送到分支
5. 创建 Pull Request

## 📄 许可证

[MIT License](LICENSE)
\`\`\`
```
```
