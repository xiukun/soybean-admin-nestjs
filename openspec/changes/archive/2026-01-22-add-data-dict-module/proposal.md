# Change: 数据字典模块 + 低代码设计器动态字典加载

## Why
当前低代码设计器的 `dictIdProp` 需要通过 `window.MAITA_LOWCODE_DICT_NAME_LIST` 提供可选的数据字典列表，并通过 `getDictById` 动态加载字典项。随着页面/表单配置增多，缺少统一的“数据字典”模块会导致：
- 字典来源分散、无法统一维护与复用
- 设计器无法稳定加载字典列表/字典项，影响 AMIS `select` 的动态数据源能力

## What Changes
- 新增“数据字典”功能模块（管理端路由默认可见）
- 新增数据库表与 seed：支持树形层级的字典（父子关系 + 排序）
- 新增后端接口：
  - 查询字典树/列表（给管理端维护、给设计器加载字典名称列表）
  - 按 dictId 查询字典项列表（适配 AMIS `select` 的 `source`）
- lowcode-designer：重新实现 `window.MAITA_LOWCODE_DICT_NAME_LIST` 的加载与缓存，保证返回格式与管理端/后端一致

## Impact
- Affected specs: 新增 `data-dictionary`
- Affected code:
  - `backend/prisma/schema.prisma`
  - `deploy/postgres/*.sql`（seed/初始化 SQL）
  - `backend/apps/base-system/src/api/**`（dict REST）
  - `frontend/src/router/**`、`frontend/src/views/**`（数据字典模块页面）
  - `lowcode-designer/src/**`（全局变量字典列表加载）

## Constraints / Rules
- 开发阶段不创建迁移文件，直接维护 `deploy/postgres` 与 `prisma/schema.prisma` 的一致性（见 `.kiro/rules`）
- AMIS 后端返回需遵循：`{ status, msg, data: { ... } }`，禁止直接返回数组/字符串

## Non-Goals
- 不实现复杂的字典版本管理/多租户
- 不实现跨系统字典同步
