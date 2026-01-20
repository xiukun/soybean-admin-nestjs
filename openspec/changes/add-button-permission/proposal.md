# Change: 引入按钮级权限控制

## Why
- 当前仅有菜单级权限，无法对按钮操作进行精细化授权，存在越权风险。
- 需要支持按钮 Code 全局唯一、可绑定菜单或全局场景，并兼容多数据库（MySQL/PostgreSQL/达梦）。
- 低代码/管理端需要加载按钮权限树，以便分配与 UI 显隐控制。

## What Changes
- **后端**：建模按钮资源（全局唯一 buttonCode，支持挂载菜单/全局）、角色-按钮授权接口、按钮查询接口（含 `findVueMenuBtn` 兼容）与鉴权返回；保证多数据库兼容字段命名与长度。
- **授权**：在 Casbin/RBAC 策略中增加按钮维度，角色分配按钮权限，下发用户可用按钮列表，未授权操作统一 403。
- **前端管理端**：`/manage/role`、`/manage/menu` 接入按钮列表与分配能力；前端指令/工具基于 buttonCode 控制按钮显隐与禁用；缓存与空态/错误兜底。
- **低代码设计器**：`amis-designer` 与 `menus-store` 加载按钮/菜单树，按按钮权限过滤可执行操作（保存、插件等），维持分页/返回格式与 AMIS 规范。
- **数据与兼容**：约定 buttonCode 命名、唯一性与长度；对现有菜单数据兼容，空列表返回 `status:0`、`data:{options:[]}`。

## Impact
- 受影响的规范：button-permission（新增）。
- 受影响的代码：backend `base-system` 授权/配置/Prisma，frontend `/manage/role`、`/manage/menu`、权限指令，lowcode-designer `amis-designer.tsx`、`menus-store.ts`，以及按钮权限文档/接口调用。
