# Lowcode 路径映射配置

## 📋 概述

为了提高代码的可维护性和可读性，我们在 `tsconfig.json` 中配置了 lowcode 相关的路径映射，将相对路径导入改为更清晰的映射路径。

## 🔧 tsconfig.json 配置

### 新增的路径映射

```json
{
  "compilerOptions": {
    "paths": {
      // 基础 lowcode 路径
      "@lowcode": [
        "apps/base-system/src/lib/bounded-contexts/lowcode"
      ],
      "@lowcode/*": [
        "apps/base-system/src/lib/bounded-contexts/lowcode/*"
      ],
      
      // 页面管理模块
      "@lowcode/page": [
        "apps/base-system/src/lib/bounded-contexts/lowcode/page"
      ],
      "@lowcode/page/*": [
        "apps/base-system/src/lib/bounded-contexts/lowcode/page/*"
      ],
      
      // 领域层
      "@lowcode/page/domain": [
        "apps/base-system/src/lib/bounded-contexts/lowcode/page/domain"
      ],
      "@lowcode/page/domain/*": [
        "apps/base-system/src/lib/bounded-contexts/lowcode/page/domain/*"
      ],
      
      // 应用层
      "@lowcode/page/application": [
        "apps/base-system/src/lib/bounded-contexts/lowcode/page/application"
      ],
      "@lowcode/page/application/*": [
        "apps/base-system/src/lib/bounded-contexts/lowcode/page/application/*"
      ],
      
      // 基础设施层
      "@lowcode/page/infrastructure": [
        "apps/base-system/src/lib/bounded-contexts/lowcode/page/infrastructure"
      ],
      "@lowcode/page/infrastructure/*": [
        "apps/base-system/src/lib/bounded-contexts/lowcode/page/infrastructure/*"
      ],
      
      // 命令
      "@lowcode/page/commands": [
        "apps/base-system/src/lib/bounded-contexts/lowcode/page/commands"
      ],
      "@lowcode/page/commands/*": [
        "apps/base-system/src/lib/bounded-contexts/lowcode/page/commands/*"
      ],
      
      // 查询
      "@lowcode/page/queries": [
        "apps/base-system/src/lib/bounded-contexts/lowcode/page/queries"
      ],
      "@lowcode/page/queries/*": [
        "apps/base-system/src/lib/bounded-contexts/lowcode/page/queries/*"
      ]
    }
  }
}
```

## 🔄 导入路径对比

### 修改前 (相对路径)
```typescript
// 命令处理器中的导入
import { LowcodePageCreateCommand } from '../../commands/lowcode-page-create.command';
import { ILowcodePageRepository } from '../../domain/lowcode-page.repository';
import { LOWCODE_PAGE_REPOSITORY } from '../../lowcode-page.tokens';

// API 控制器中的导入
import { LowcodePageCreateCommand } from '../../../../lib/bounded-contexts/lowcode/page/commands/lowcode-page-create.command';
import { GetLowcodePagesQuery } from '../../../../lib/bounded-contexts/lowcode/page/queries/get-lowcode-pages.query';

// 模块导入
import { LowcodePageModule } from '../../../lib/bounded-contexts/lowcode/page/lowcode-page.module';
```

### 修改后 (映射路径)
```typescript
// 命令处理器中的导入
import { LowcodePageCreateCommand } from '@lowcode/page/commands/lowcode-page-create.command';
import { ILowcodePageRepository } from '@lowcode/page/domain/lowcode-page.repository';
import { LOWCODE_PAGE_REPOSITORY } from '@lowcode/page/lowcode-page.tokens';

// API 控制器中的导入
import { LowcodePageCreateCommand } from '@lowcode/page/commands/lowcode-page-create.command';
import { GetLowcodePagesQuery } from '@lowcode/page/queries/get-lowcode-pages.query';

// 模块导入
import { LowcodePageModule } from '@lowcode/page/lowcode-page.module';
```

## ✅ 已更新的文件

### 命令处理器
- ✅ `lowcode-page-create.command.handler.ts`
- ✅ `lowcode-page-update.command.handler.ts`
- ✅ `lowcode-page-delete.command.handler.ts`
- ✅ `lowcode-page-version-create.command.handler.ts`

### 查询处理器
- ✅ `get-lowcode-pages.query.handler.ts`
- ✅ `get-lowcode-page-by-id.query.handler.ts`
- ✅ `get-lowcode-page-by-code.query.handler.ts`
- ✅ `get-lowcode-page-by-menu.query.handler.ts`
- ✅ `get-lowcode-page-versions.query.handler.ts`

### 基础设施层
- ✅ `lowcode-page-prisma.repository.ts`

### 模块文件
- ✅ `lowcode-page.module.ts`
- ✅ `lowcode.module.ts`
- ✅ `lowcode-page-api.module.ts`

### API 控制器
- ✅ `lowcode-page.controller.ts`
- ✅ `designer.controller.ts`

## 🎯 优势

### 1. **可读性提升**
- 路径更加清晰，一眼就能看出导入的模块层次
- 减少了复杂的相对路径 `../../../..`

### 2. **维护性增强**
- 文件移动时不需要修改大量的相对路径
- 重构更加安全和便捷

### 3. **开发体验改善**
- IDE 自动补全更加准确
- 减少路径错误的可能性

### 4. **架构清晰**
- 明确区分不同的架构层次
- 符合 DDD 和 Clean Architecture 原则

## 🔍 使用示例

### 在命令处理器中使用
```typescript
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';

// 使用映射路径导入
import { LowcodePageCreateCommand } from '@lowcode/page/commands/lowcode-page-create.command';
import { ILowcodePageRepository } from '@lowcode/page/domain/lowcode-page.repository';
import { LOWCODE_PAGE_REPOSITORY } from '@lowcode/page/lowcode-page.tokens';

@CommandHandler(LowcodePageCreateCommand)
export class LowcodePageCreateCommandHandler implements ICommandHandler<LowcodePageCreateCommand> {
  constructor(
    @Inject(LOWCODE_PAGE_REPOSITORY)
    private readonly repository: ILowcodePageRepository,
  ) {}
  
  // 实现逻辑...
}
```

### 在 API 控制器中使用
```typescript
import { Controller, Post, Body } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';

// 使用映射路径导入
import { LowcodePageCreateCommand } from '@lowcode/page/commands/lowcode-page-create.command';
import { GetLowcodePagesQuery } from '@lowcode/page/queries/get-lowcode-pages.query';

@Controller('lowcode-pages')
export class LowcodePageController {
  constructor(private readonly commandBus: CommandBus) {}
  
  // 实现逻辑...
}
```

## 🚀 编译验证

✅ **编译成功**: 所有路径映射配置正确，项目可以正常编译
✅ **类型检查通过**: TypeScript 类型解析正常
✅ **IDE 支持**: 自动补全和跳转功能正常

## 💡 最佳实践

1. **统一使用映射路径**: 在 lowcode 相关代码中统一使用 `@lowcode/*` 路径
2. **保持层次清晰**: 按照 DDD 架构层次组织导入
3. **避免循环依赖**: 合理使用依赖注入令牌
4. **定期检查**: 确保路径映射配置与实际文件结构一致

## 🎉 总结

通过配置 lowcode 路径映射，我们实现了：
- ✅ 更清晰的代码结构
- ✅ 更好的开发体验
- ✅ 更强的可维护性
- ✅ 更符合架构原则的代码组织

这为后续的 lowcode 功能扩展和维护奠定了良好的基础。
