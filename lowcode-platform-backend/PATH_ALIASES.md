# TypeScript 路径别名配置指南

本项目已配置了 TypeScript 路径别名，以简化导入路径并提高代码可读性。

## 配置的路径别名

### 主要别名

| 别名 | 路径 | 描述 |
|------|------|------|
| `@src/*` | `src/*` | 源代码根目录 |
| `@/*` | `src/*` | 源代码根目录（简写） |
| `@app/*` | `src/app/*` | 应用程序模块 |
| `@api/*` | `src/api/*` | API 路由 |
| `@lib/*` | `src/lib/*` | 库文件 |
| `@infra/*` | `src/infra/*` | 基础设施层 |
| `@views/*` | `src/views/*` | 视图层 |
| `@resources/*` | `src/resources/*` | 资源文件 |

### 业务上下文别名

| 别名 | 路径 | 描述 |
|------|------|------|
| `@entity/*` | `src/lib/bounded-contexts/entity/*` | 实体管理上下文 |
| `@api-context/*` | `src/lib/bounded-contexts/api/*` | API 管理上下文 |
| `@codegen/*` | `src/lib/bounded-contexts/codegen/*` | 代码生成上下文 |
| `@project/*` | `src/lib/bounded-contexts/project/*` | 项目管理上下文 |
| `@code-generation/*` | `src/lib/code-generation/*` | 代码生成服务 |

### 共享模块别名

| 别名 | 路径 | 描述 |
|------|------|------|
| `@shared/*` | `src/lib/shared/*` | 共享模块 |
| `@config/*` | `src/lib/config/*` | 配置文件 |
| `@utils/*` | `src/lib/utils/*` | 工具函数 |
| `@controllers/*` | `src/lib/shared/controllers/*` | 控制器 |
| `@services/*` | `src/lib/shared/services/*` | 服务 |
| `@middleware/*` | `src/lib/shared/middleware/*` | 中间件 |
| `@decorators/*` | `src/lib/shared/decorators/*` | 装饰器 |
| `@interceptors/*` | `src/lib/shared/interceptors/*` | 拦截器 |
| `@dto/*` | `src/lib/shared/dto/*` | 数据传输对象 |
| `@prisma/*` | `src/lib/shared/prisma/*` | Prisma 相关 |

### 测试别名

| 别名 | 路径 | 描述 |
|------|------|------|
| `@test/*` | `test/*` | 测试文件 |
| `@test-utils/*` | `test/utils/*` | 测试工具 |

## 使用示例

### 之前的导入方式

```typescript
// 复杂的相对路径
import { PrismaService } from '../../../lib/shared/prisma/prisma.service';
import { PerformanceMiddleware } from '../../../lib/shared/middleware/performance.middleware';
import { Public } from '../../../lib/shared/decorators/public.decorator';
import { AppModule } from '../../../app.module';
```

### 使用路径别名后

```typescript
// 清晰简洁的导入路径
import { PrismaService } from '@prisma/prisma.service';
import { PerformanceMiddleware } from '@middleware/performance.middleware';
import { Public } from '@decorators/public.decorator';
import { AppModule } from '@src/app.module';
```

## 实际应用示例

### 控制器示例

```typescript
import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { PrismaService } from '@prisma/prisma.service';
import { Public } from '@decorators/public.decorator';
import { CreateProjectDto } from '@dto/create-project.dto';
import { ProjectService } from '@services/project.service';

@Controller('projects')
@ApiTags('Projects')
export class ProjectController {
  constructor(
    private readonly projectService: ProjectService,
    private readonly prisma: PrismaService,
  ) {}

  @Get()
  @Public()
  @ApiOperation({ summary: 'Get all projects' })
  async findAll() {
    return this.projectService.findAll();
  }

  @Post()
  @ApiOperation({ summary: 'Create project' })
  async create(@Body() createProjectDto: CreateProjectDto) {
    return this.projectService.create(createProjectDto);
  }
}
```

### 服务示例

```typescript
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@prisma/prisma.service';
import { CreateProjectDto } from '@dto/create-project.dto';
import { UpdateProjectDto } from '@dto/update-project.dto';
import { ProjectEntity } from '@entity/project.entity';

@Injectable()
export class ProjectService {
  private readonly logger = new Logger(ProjectService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(createProjectDto: CreateProjectDto): Promise<ProjectEntity> {
    this.logger.log('Creating new project');
    return this.prisma.project.create({
      data: createProjectDto,
    });
  }

  async findAll(): Promise<ProjectEntity[]> {
    return this.prisma.project.findMany();
  }
}
```

### 测试示例

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import * as request from 'supertest';
import { AppModule } from '@src/app.module';
import { PrismaService } from '@prisma/prisma.service';
import { ProjectService } from '@services/project.service';

describe('ProjectController (e2e)', () => {
  let app: NestFastifyApplication;
  let prisma: PrismaService;
  let projectService: ProjectService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication<NestFastifyApplication>(
      new FastifyAdapter()
    );
    
    prisma = moduleFixture.get<PrismaService>(PrismaService);
    projectService = moduleFixture.get<ProjectService>(ProjectService);

    await app.init();
    await app.getHttpAdapter().getInstance().ready();
  });

  it('/projects (GET)', () => {
    return request(app.getHttpServer())
      .get('/projects')
      .expect(200);
  });
});
```

## IDE 支持

### VSCode 配置

路径别名会自动被 VSCode 识别，支持：

- **自动补全**: 输入 `@` 会显示可用的别名
- **跳转定义**: Ctrl/Cmd + Click 跳转到文件
- **重构支持**: 重命名文件时自动更新导入路径
- **智能提示**: 显示完整的文件路径

### WebStorm/IntelliJ 配置

这些 IDE 也会自动识别 tsconfig.json 中的路径配置。

## 构建和部署

### TypeScript 编译

路径别名在编译时会被自动解析为相对路径，不影响最终的 JavaScript 输出。

### Jest 测试

Jest 配置已同步更新，支持在测试中使用相同的路径别名。

### Docker 构建

Docker 构建过程中会正确处理路径别名，无需额外配置。

## 最佳实践

### 1. 优先使用具体的别名

```typescript
// 推荐：使用具体的别名
import { PrismaService } from '@prisma/prisma.service';
import { UserController } from '@controllers/user.controller';

// 避免：使用过于通用的别名
import { PrismaService } from '@shared/prisma/prisma.service';
import { UserController } from '@lib/shared/controllers/user.controller';
```

### 2. 保持一致性

在同一个文件中，尽量使用相同风格的导入路径。

### 3. 合理分组导入

```typescript
// 第三方库
import { Controller, Get, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

// 项目内部模块
import { PrismaService } from '@prisma/prisma.service';
import { UserService } from '@services/user.service';
import { CreateUserDto } from '@dto/create-user.dto';
```

### 4. 避免循环依赖

使用路径别名时要特别注意避免循环依赖，可以通过以下方式检测：

```bash
# 安装循环依赖检测工具
npm install --save-dev madge

# 检测循环依赖
npx madge --circular --extensions ts src/
```

## 故障排除

### 1. 路径别名不生效

- 检查 `tsconfig.json` 中的 `baseUrl` 和 `paths` 配置
- 确保 IDE 使用的是项目的 TypeScript 版本
- 重启 IDE 或 TypeScript 服务

### 2. 测试中路径别名不工作

- 检查 `jest.config.js` 中的 `moduleNameMapping` 配置
- 确保测试文件的路径别名与 tsconfig.json 一致

### 3. 构建失败

- 确保所有路径别名都正确映射到实际文件
- 检查是否有拼写错误或路径不存在

## 配置文件

### tsconfig.json

```json
{
  "compilerOptions": {
    "baseUrl": "./",
    "paths": {
      "@src/*": ["src/*"],
      "@/*": ["src/*"],
      // ... 其他路径别名
    }
  }
}
```

### jest.config.js

```javascript
module.exports = {
  moduleNameMapping: {
    '^@src/(.*)$': '<rootDir>/src/$1',
    '^@/(.*)$': '<rootDir>/src/$1',
    // ... 其他路径别名
  },
};
```

通过使用这些路径别名，可以让代码更加清晰、易于维护，并减少因文件移动导致的导入路径更新工作。
