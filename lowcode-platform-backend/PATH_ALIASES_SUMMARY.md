# TypeScript 路径别名配置总结

## 🎯 配置目标

为低代码平台后端项目配置 TypeScript 路径别名，设置 `@src` 等别名来优化引用路径，提升开发体验。

## ✅ 已完成的配置

### 1. TypeScript 配置 (tsconfig.json)

```json
{
  "compilerOptions": {
    "baseUrl": "./",
    "paths": {
      "@src/*": ["src/*"],
      "@/*": ["src/*"],
      "@app/*": ["src/app/*"],
      "@api/*": ["src/api/*"],
      "@lib/*": ["src/lib/*"],
      "@infra/*": ["src/infra/*"],
      "@views/*": ["src/views/*"],
      "@resources/*": ["src/resources/*"],
      "@entity/*": ["src/lib/bounded-contexts/entity/*"],
      "@api-context/*": ["src/lib/bounded-contexts/api/*"],
      "@codegen/*": ["src/lib/bounded-contexts/codegen/*"],
      "@project/*": ["src/lib/bounded-contexts/project/*"],
      "@code-generation/*": ["src/lib/code-generation/*"],
      "@shared/*": ["src/lib/shared/*"],
      "@config/*": ["src/lib/config/*"],
      "@utils/*": ["src/lib/utils/*"],
      "@controllers/*": ["src/lib/shared/controllers/*"],
      "@services/*": ["src/lib/shared/services/*"],
      "@middleware/*": ["src/lib/shared/middleware/*"],
      "@decorators/*": ["src/lib/shared/decorators/*"],
      "@interceptors/*": ["src/lib/shared/interceptors/*"],
      "@dto/*": ["src/lib/shared/dto/*"],
      "@prisma/*": ["src/lib/shared/prisma/*"],
      "@test/*": ["test/*"],
      "@test-utils/*": ["test/utils/*"]
    }
  }
}
```

### 2. Jest 测试配置 (jest.config.js)

同步更新了 Jest 的 `moduleNameMapping` 配置，确保测试中也能正确解析路径别名。

### 3. 脚本配置 (scripts/tsconfig.json)

为脚本文件创建了专门的 TypeScript 配置，支持路径别名。

### 4. VSCode 配置

- `.vscode/settings.json` - 优化 TypeScript 和导入体验
- `.vscode/extensions.json` - 推荐有用的扩展

## 🔧 新增工具和脚本

### 1. 导入路径更新脚本 (scripts/update-imports.js)

自动化工具，可以将现有文件中的相对路径转换为路径别名：

```bash
npm run update-imports
```

### 2. 导入检查命令

```bash
# 检查 TypeScript 编译是否通过
npm run check-imports

# 检测循环依赖
npx madge --circular --extensions ts src/
```

### 3. 新增依赖

- `glob` - 文件匹配工具
- `madge` - 循环依赖检测工具

## 📁 已更新的文件示例

### main.ts
```typescript
// 之前
import { AppModule } from './app.module';

// 之后
import { AppModule } from '@src/app.module';
```

### health.controller.ts
```typescript
// 之前
import { PrismaService } from '../../../prisma/prisma.service';
import { PerformanceMiddleware } from '../middleware/performance.middleware';
import { Public } from '../decorators/public.decorator';

// 之后
import { PrismaService } from '@prisma/prisma.service';
import { PerformanceMiddleware } from '@middleware/performance.middleware';
import { Public } from '@decorators/public.decorator';
```

### 测试文件
```typescript
// 之前
import { AppModule } from '../../lowcode-platform-backend/src/app.module';
import { PrismaService } from '../../lowcode-platform-backend/src/lib/shared/prisma/prisma.service';

// 之后
import { AppModule } from '@src/app.module';
import { PrismaService } from '@prisma/prisma.service';
```

## 🎨 开发体验改进

### 1. 更清晰的导入路径
- 消除了复杂的相对路径 `../../../`
- 路径语义更明确，一眼就能看出模块来源
- 减少了因文件移动导致的路径更新工作

### 2. IDE 支持增强
- 自动补全：输入 `@` 显示可用别名
- 跳转定义：Ctrl/Cmd + Click 直接跳转
- 重构支持：重命名文件时自动更新导入
- 智能提示：显示完整文件路径

### 3. 代码维护性提升
- 导入语句更短更清晰
- 减少拼写错误
- 便于代码审查
- 提高团队开发效率

## 📊 路径别名分类

### 核心别名
- `@src/*` - 源代码根目录（主要别名）
- `@/*` - 源代码根目录（简写）

### 架构层级别名
- `@app/*` - 应用层
- `@api/*` - API 层
- `@lib/*` - 库文件层
- `@infra/*` - 基础设施层
- `@views/*` - 视图层

### 业务上下文别名
- `@entity/*` - 实体管理
- `@project/*` - 项目管理
- `@codegen/*` - 代码生成
- `@api-context/*` - API 管理

### 共享模块别名
- `@shared/*` - 共享模块
- `@controllers/*` - 控制器
- `@services/*` - 服务
- `@middleware/*` - 中间件
- `@decorators/*` - 装饰器
- `@dto/*` - 数据传输对象
- `@prisma/*` - 数据库相关

### 测试别名
- `@test/*` - 测试文件
- `@test-utils/*` - 测试工具

## 🚀 使用建议

### 1. 优先级顺序
1. 使用最具体的别名（如 `@prisma/*`）
2. 使用模块类型别名（如 `@controllers/*`）
3. 使用通用别名（如 `@shared/*`）
4. 最后使用根别名（如 `@src/*`）

### 2. 导入分组
```typescript
// 第三方库
import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

// 项目内部 - 按别名分组
import { PrismaService } from '@prisma/prisma.service';
import { UserService } from '@services/user.service';
import { CreateUserDto } from '@dto/create-user.dto';
```

### 3. 避免循环依赖
使用路径别名时要特别注意循环依赖，定期运行检测：
```bash
npx madge --circular --extensions ts src/
```

## 🔍 故障排除

### 1. 路径别名不生效
- 重启 TypeScript 服务：Ctrl/Cmd + Shift + P → "TypeScript: Restart TS Server"
- 检查 `tsconfig.json` 配置
- 确保 IDE 使用项目的 TypeScript 版本

### 2. 测试中路径别名不工作
- 检查 `jest.config.js` 中的 `moduleNameMapping`
- 确保测试配置与 tsconfig.json 一致

### 3. 构建失败
- 运行 `npm run check-imports` 检查编译错误
- 确保所有路径别名都映射到实际存在的文件

## 📈 效果评估

### 代码质量提升
- ✅ 导入路径更清晰易读
- ✅ 减少相对路径错误
- ✅ 提高代码可维护性
- ✅ 增强团队协作效率

### 开发效率提升
- ✅ IDE 自动补全更准确
- ✅ 文件跳转更便捷
- ✅ 重构操作更安全
- ✅ 新人上手更容易

### 项目结构优化
- ✅ 模块边界更清晰
- ✅ 依赖关系更明确
- ✅ 架构层次更分明
- ✅ 代码组织更合理

## 🎯 后续优化建议

1. **定期检查**：定期运行循环依赖检测
2. **团队规范**：制定导入路径使用规范
3. **自动化**：集成到 CI/CD 流程中
4. **监控**：监控路径别名使用情况
5. **培训**：团队成员培训和知识分享

通过这些路径别名配置，低代码平台的开发体验得到了显著提升，代码更加清晰、维护更加便捷。
