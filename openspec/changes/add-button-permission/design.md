## Context
- 现状：只有菜单级权限；按钮操作无细粒度授权，`findVueMenuBtn` 已存在按钮列表接口需求（示例数据见 `.trae/documents/buttonPermission.json`）。
- 目标：引入按钮资源模型与授权流程，支持菜单内按钮及全局按钮；前后端与低代码统一使用 buttonCode 授权。
- 约束：buttonCode 全局唯一；兼容 MySQL/PostgreSQL/达梦；接口返回 `{ status:0, msg, data:{options:[]} }`。

## Goals / Non-Goals
- Goals: 建模按钮资源；角色-按钮授权；接口/缓存/校验；前端/低代码显隐与禁用控制；空数据安全返回。
- Non-Goals: 重做 UI 视觉；修改现有菜单树字段；引入新鉴权框架（继续用 Casbin/RBAC）；大规模 DB 迁移（仅新增/对齐字段与索引）。

## Decisions
- **资源模型**：`buttonCode` 全局唯一（varchar，索引），`buttonName`，可选 `menuId`（为空表示全局按钮），`type`/`status`/`orderIndex`，审计字段；兼容多数据库命名避免保留字。
- **授权关系**：角色-按钮多对多，Casbin policy 增加按钮维度（如 `sub=role, obj=buttonCode, act=click`）。
- **接口设计**：查询接口支持按菜单或全量返回按钮列表（含 `options` 字段）；角色授权接口接收 buttonCode 列表；用户登录/鉴权时下发允许按钮集合用于前端显隐。
- **前端控制**：统一使用 `hasButton(code)`/指令封装，管理端与设计器共用；无权限时隐藏或禁用并提示；缓存 localStorage，空数据时回退空数组。
- **低代码集成**：`menus-store` 同步按钮/菜单树；`amis-designer` 在保存/插件操作时校验按钮权限，按 hash/search 获取 pageKey 等上下文。

## Risks / Trade-offs
- **兼容旧数据**：若历史按钮无 code，需要生成并回填；风险在数据同步，可提供回填脚本。
- **性能**：按钮列表随菜单加载，需缓存与按需拉取，避免全量过大；可加本地缓存与增量刷新。
- **授权遗漏**：若前端未使用统一指令可能遗漏校验；需在评审与文档中强调接入方式。

## Migration Plan
- 新增按钮表/字段与角色-按钮关联表或复用 Casbin 存储；创建唯一索引于 buttonCode；提供默认种子/回填策略。
- 部署按环境滚动：先后端接口与策略，再前端/低代码接入；灰度验证按钮显隐与 403。

## Open Questions
- 角色-按钮授权 UI 是否需要分组/搜索/批量操作？
- 全局按钮（无菜单）在管理端展示位置：单独分组或共用菜单根？
- 是否需要操作审计（谁分配/谁点击）写入日志？
