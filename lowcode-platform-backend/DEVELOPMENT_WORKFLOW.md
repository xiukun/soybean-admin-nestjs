# 开发工作流指南

本文档描述了低代码平台后端项目的完整开发工作流，包括路径别名的使用、代码质量检查和最佳实践。

## 🚀 快速开始

### 1. 环境准备

```bash
# 克隆项目
git clone <repository-url>
cd lowcode-platform-backend

# 安装依赖
npm install

# 设置 Git hooks
npm run prepare

# 初始化数据库
npm run prisma:migrate
npm run prisma:generate
```

### 2. 开发环境启动

```bash
# 开发模式启动
npm run start:dev

# 查看 API 文档
open http://localhost:3000/api-docs

# 健康检查
curl http://localhost:3000/health
```

## 📁 路径别名使用

### 配置的路径别名

| 别名 | 路径 | 用途 |
|------|------|------|
| `@src/*` | `src/*` | 源代码根目录 |
| `@controllers/*` | `src/lib/shared/controllers/*` | 控制器 |
| `@services/*` | `src/lib/shared/services/*` | 服务 |
| `@middleware/*` | `src/lib/shared/middleware/*` | 中间件 |
| `@decorators/*` | `src/lib/shared/decorators/*` | 装饰器 |
| `@dto/*` | `src/lib/shared/dto/*` | 数据传输对象 |
| `@prisma/*` | `src/lib/shared/prisma/*` | 数据库相关 |
| `@shared/*` | `src/lib/shared/*` | 共享模块 |
| `@test/*` | `test/*` | 测试文件 |

### 使用示例

```typescript
// ✅ 推荐：使用路径别名
import { PrismaService } from '@prisma/prisma.service';
import { UserController } from '@controllers/user.controller';
import { CreateUserDto } from '@dto/create-user.dto';

// ❌ 避免：复杂的相对路径
import { PrismaService } from '../../../lib/shared/prisma/prisma.service';
import { UserController } from '../../../lib/shared/controllers/user.controller';
```

### 自动化工具

```bash
# 自动更新现有文件的导入路径
npm run update-imports

# 验证路径别名配置
npm run validate-aliases

# 检查循环依赖
npm run check-circular
```

## 🔧 代码质量工具

### ESLint 配置

项目配置了 ESLint 来强制使用路径别名：

```bash
# 检查代码质量
npm run lint:check

# 自动修复问题
npm run lint
```

### Prettier 格式化

```bash
# 检查代码格式
npm run format:check

# 格式化代码
npm run format
```

### TypeScript 检查

```bash
# 检查 TypeScript 编译
npm run check-imports

# 构建项目
npm run build
```

## 🧪 测试工作流

### 运行测试

```bash
# 运行所有测试
npm test

# 监听模式
npm run test:watch

# 覆盖率报告
npm run test:cov

# E2E 测试
npm run test:e2e
```

### 测试中的路径别名

```typescript
// 测试文件中使用路径别名
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '@src/app.module';
import { PrismaService } from '@prisma/prisma.service';
import { UserService } from '@services/user.service';

describe('UserService', () => {
  let service: UserService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    service = module.get<UserService>(UserService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
```

## 📋 Git 工作流

### Pre-commit 检查

每次提交前会自动运行以下检查：

1. **TypeScript 编译检查**
2. **复杂相对路径检测**
3. **ESLint 代码质量检查**
4. **Prettier 格式检查**
5. **路径别名配置验证**

### 提交流程

```bash
# 1. 添加文件到暂存区
git add .

# 2. 提交（会自动运行 pre-commit 检查）
git commit -m "feat: add new feature"

# 3. 如果检查失败，修复问题后重新提交
npm run lint          # 修复 ESLint 问题
npm run format        # 修复格式问题
npm run update-imports # 修复导入路径问题
```

### 分支策略

- `main` - 生产分支
- `develop` - 开发分支
- `feature/*` - 功能分支
- `bugfix/*` - 修复分支

## 🚀 CI/CD 流程

### GitHub Actions

项目配置了自动化的 CI/CD 流程：

1. **路径别名验证** - 验证配置和使用情况
2. **代码质量检查** - ESLint 和 Prettier
3. **测试运行** - 单元测试和 E2E 测试
4. **构建验证** - TypeScript 编译
5. **循环依赖检测** - 确保代码架构健康

### 部署流程

```bash
# 生产构建
npm run build

# Docker 构建
docker build -t lowcode-platform .

# 启动容器
docker run -p 3000:3000 lowcode-platform
```

## 📊 监控和维护

### 定期检查

```bash
# 每周运行一次
npm run validate-aliases  # 验证路径别名
npm run check-circular     # 检查循环依赖
npm audit                  # 安全审计
npm outdated              # 检查过期依赖
```

### 性能监控

```bash
# 查看性能指标
curl http://localhost:3000/health/metrics

# 详细健康检查
curl http://localhost:3000/health/detailed
```

## 🛠️ 开发最佳实践

### 1. 导入顺序

```typescript
// 1. Node.js 内置模块
import * as fs from 'fs';
import * as path from 'path';

// 2. 第三方库
import { Controller, Get, Post } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

// 3. 项目内部模块（按别名分组）
import { PrismaService } from '@prisma/prisma.service';
import { UserService } from '@services/user.service';
import { CreateUserDto } from '@dto/create-user.dto';
import { Public } from '@decorators/public.decorator';
```

### 2. 文件组织

```
src/
├── app.module.ts                 # 主应用模块
├── main.ts                       # 应用入口
└── lib/
    ├── shared/                   # 共享模块
    │   ├── controllers/          # @controllers/*
    │   ├── services/            # @services/*
    │   ├── middleware/          # @middleware/*
    │   ├── decorators/          # @decorators/*
    │   ├── dto/                 # @dto/*
    │   └── prisma/              # @prisma/*
    ├── bounded-contexts/        # 业务上下文
    └── code-generation/         # @code-generation/*
```

### 3. 命名约定

- **文件名**: kebab-case (`user-service.ts`)
- **类名**: PascalCase (`UserService`)
- **变量名**: camelCase (`userName`)
- **常量**: UPPER_SNAKE_CASE (`MAX_RETRY_COUNT`)

### 4. 错误处理

```typescript
import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from '@prisma/prisma.service';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(private readonly prisma: PrismaService) {}

  async findUser(id: string) {
    try {
      const user = await this.prisma.user.findUnique({ where: { id } });
      
      if (!user) {
        throw new HttpException('User not found', HttpStatus.NOT_FOUND);
      }
      
      return user;
    } catch (error) {
      this.logger.error(`Failed to find user ${id}:`, error);
      throw error;
    }
  }
}
```

## 🔍 故障排除

### 常见问题

1. **路径别名不生效**
   ```bash
   # 重启 TypeScript 服务
   # VSCode: Ctrl/Cmd + Shift + P → "TypeScript: Restart TS Server"
   
   # 检查配置
   npm run validate-aliases
   ```

2. **ESLint 错误**
   ```bash
   # 自动修复
   npm run lint
   
   # 检查配置
   npx eslint --print-config src/main.ts
   ```

3. **测试失败**
   ```bash
   # 清除缓存
   npm run test -- --clearCache
   
   # 重新生成 Prisma 客户端
   npm run prisma:generate
   ```

4. **构建失败**
   ```bash
   # 清理构建目录
   rm -rf dist/
   
   # 重新构建
   npm run build
   ```

### 获取帮助

- 查看项目文档: [PATH_ALIASES.md](./PATH_ALIASES.md)
- 检查配置: `npm run validate-aliases`
- 查看日志: `npm run start:dev`
- 健康检查: `curl http://localhost:3000/health/detailed`

通过遵循这个工作流，可以确保代码质量、提高开发效率，并维护一个健康的项目架构。
