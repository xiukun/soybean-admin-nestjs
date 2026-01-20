## 1. 需求与数据
- [x] 1.1 定义按钮资源模型（全局唯一 buttonCode，菜单/全局绑定、排序、状态）及与角色的授权关系，兼容多数据库字段命名与长度。
- [x] 1.2 设计/确认接口：按钮查询（菜单/全局）、角色分配按钮、用户按钮下发，返回遵循 `{ status, msg, data }` 与分页/空数据约定。

## 2. 后端实现
- [ ] 2.1 建立按钮资源存储与服务，整合 Casbin/RBAC 策略新增按钮维度，补充 403 拒绝与审计日志。
- [x] 2.2 提供 `findVueMenuBtn` 等按钮列表接口与角色绑定接口，处理缓存/并发与错误兜底。

## 3. 前端管理端
- [x] 3.1 `/manage/role` 增加按钮分配与权限校验展示，加载/缓存按钮树，含空态/加载/错误提示。
- [x] 3.2 `/manage/menu` 菜单/低代码页面按菜单类型维护按钮权限：提供按钮管理 Drawer，支持按钮 CRUD（增删改查）与与菜单绑定；保证“配置权限入口”默认可见以避免锁死；操作按钮按 buttonCode 控制显隐或禁用。

  - [x] 3.2.1 菜单列表行新增“按钮管理”入口，使用 Drawer 展示当前菜单（menu/lowcode）的按钮列表。
  - [x] 3.2.2 Drawer 内实现按钮 CRUD：新增/编辑（表单）、删除、排序；保存后刷新列表。
  - [x] 3.2.3 菜单编辑/新增表单中“创建按钮”入口调整为打开 Drawer（不再依赖不可见的内嵌按钮）。
  - [x] 3.2.4 约束：按钮 code 全局唯一；当菜单类型为 `lowcode` 时仍允许维护按钮（用于低代码页面按钮权限）。

## 4. 低代码设计器
- [x] 4.1 `amis-designer`/`menus-store` 加载按钮数据与菜单树，按权限过滤可操作项（保存、插件等），保障 hash/search 参数兼容。
- [x] 4.2 确认按钮权限与页面/组件交互（保存、插件保存等）的一致校验，并提供提示。

## 5. 验证与文档
- [ ] 5.1 回归多数据库兼容（MySQL/PostgreSQL/达梦）与未授权用户行为；关键接口单测/联调。
- [x] 5.2 更新按钮权限使用文档/示例，运行 `openspec-cn validate add-button-permission --strict`。

---

### 已实现内容摘要（便于联调/回归）

#### 数据结构
- Prisma：`SysButton`、`SysRoleButton`
- Postgres 初始化：`deploy/postgres/11_sys_button.sql`、`12_sys_role_button.sql`

#### 后端接口（base-system, prefix `/v1`）
- 按钮树（按菜单分组）：`GET /button/tree`
- 角色已分配按钮（id 列表）：`GET /button/auth-buttons/:roleId`
- 角色分配按钮：`POST /authorization/assign-buttons`
- 用户按钮下发（code 列表）：`GET /authorization/getUserButtons`

#### 前端
- 角色管理按钮分配弹窗：`frontend/src/views/manage/role/modules/button-auth-modal.vue`
