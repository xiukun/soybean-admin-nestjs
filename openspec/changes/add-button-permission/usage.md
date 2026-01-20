# 按钮权限使用说明（Button Permission Usage）

> 适用范围：soybean-admin-nestjs（frontend + backend + lowcode-designer）

## 1. buttonCode 命名规范

- 推荐风格：`模块:动作`（全小写，使用 `:` 分隔）
  - 示例：`manage_menu:edit`、`manage_role:button_auth`、`lowcode:save`
- 约束：全局唯一（跨菜单/全局按钮都不能重复）

## 2. 前端管理端（frontend）按钮隐藏

### 2.1 指令

- 指令：`v-button-auth`
- 行为：当用户不具备按钮权限时，DOM 直接移除（隐藏策略）

### 2.2 使用示例

- 在按钮上声明：`v-button-auth="'manage_menu:delete'"`
- 支持数组：`v-button-auth="['a:b', 'c:d']"`（任意一个满足即可显示）

### 2.3 buttons 获取策略

- 登录后 `auth store` 会调用 `GET /authorization/getUserButtons` 兜底刷新 `userInfo.buttons`
- 即使 `getUserInfo` 没下发 buttons，也可保证指令判断数据存在

## 3. 低代码设计器（lowcode-designer）权限控制

### 3.1 本次接入点

- 设计器 Header 的关键操作按按钮权限控制显示/执行
- 缓存与判断工具：`lowcode-designer/src/utils/button-auth.ts`

### 3.2 当前使用的按钮 codes

- 保存页面：`lowcode:save`
- 保存插件：`lowcode:save_plugin`
- 刷新数据字典：`lowcode:refresh_dictionary`

> 你需要在按钮资源中创建这些 code，并分配给对应角色。

## 4. 后端一致性校验（防绕过）

> 目的：即使绕过前端隐藏或直接调接口，后端也会拒绝未授权操作。

### 4.1 已加校验的接口

- `POST /designer/page/save`：需要 `lowcode:save`
- `POST /lowcode/pages`：需要 `lowcode:save`
- `POST /lowcode/pages/menu/:menuId/save`：需要 `lowcode:save`
- `PUT /lowcode/pages/:id`：需要 `lowcode:save`

返回：无权限时 HTTP 403，错误信息包含 `No permission: <code>`

## 5. 回归验证清单（建议）

### 5.0 一键联调脚本

目录：`openspec/changes/add-button-permission/specs/button-permission/e2e.sh`

运行示例：

```bash
chmod +x openspec/changes/add-button-permission/specs/button-permission/e2e.sh
BASE_URL=http://localhost:9528/v1 IDENTIFIER=admin PASSWORD=123456 ROLE_ID=1 \
  ./openspec/changes/add-button-permission/specs/button-permission/e2e.sh
```

可选：为角色分配按钮（需先从 `/button/tree` 找到 buttonId）

```bash
BUTTON_IDS='[1,2,3]' DOMAIN=default ROLE_ID=1 \
  ./openspec/changes/add-button-permission/specs/button-permission/e2e.sh
```


### 5.1 管理端（建议用例）

#### 5.1.1 建议的 buttonCode 清单

> 说明：这些 code 已在管理端页面上使用（`v-button-auth`）。你需要在按钮资源中创建同名 code 并分配给角色，才会生效。

| 页面 | 操作 | buttonCode |
| --- | --- | --- |
| 菜单管理 `/manage/menu` | 添加子菜单 | `manage_menu:add_child` |
| 菜单管理 `/manage/menu` | 编辑 | `manage_menu:edit` |
| 菜单管理 `/manage/menu` | 删除 | `manage_menu:delete` |
| 角色管理 `/manage/role` | 菜单权限 | `manage_role:menu_auth` |
| 角色管理 `/manage/role` | API 权限 | `manage_role:api_auth` |
| 角色管理 `/manage/role` | 按钮权限 | `manage_role:button_auth` |
| 角色管理 `/manage/role` | 编辑 | `manage_role:edit` |
| 角色管理 `/manage/role` | 删除 | `manage_role:delete` |

#### 5.1.1.1 按钮资源创建建议（推荐配置）

> 字段说明（按后端模型约定）：
> - `code`：全局唯一 buttonCode
> - `desc`：按钮说明（建议中文）
> - `order`：同一菜单下按钮排序（数字越小越靠前）
> - `menuId`：建议绑定到对应菜单；如果是全局操作可不绑定（menuId 为空）

| 建议绑定菜单 | code | desc（建议） | order（建议） | 说明 |
| --- | --- | --- | --- | --- |
| 菜单管理 | `manage_menu:add_child` | 添加子菜单 | 10 | 仅影响菜单列表行内“添加子菜单” |
| 菜单管理 | `manage_menu:edit` | 编辑菜单 | 20 | 仅影响菜单列表行内“编辑” |
| 菜单管理 | `manage_menu:delete` | 删除菜单 | 30 | 仅影响菜单列表行内“删除” |
| 角色管理 | `manage_role:menu_auth` | 分配菜单权限 | 10 | 角色列表行内“菜单权限”入口 |
| 角色管理 | `manage_role:api_auth` | 分配接口权限 | 20 | 角色列表行内“API 权限”入口 |
| 角色管理 | `manage_role:button_auth` | 分配按钮权限 | 30 | 角色列表行内“按钮权限”入口 |
| 角色管理 | `manage_role:edit` | 编辑角色 | 40 | 角色列表行内“编辑” |
| 角色管理 | `manage_role:delete` | 删除角色 | 50 | 角色列表行内“删除” |

> 提醒：目前 `TableHeaderOperation`（顶部“新增/批量删除/刷新”等）未接入 `v-button-auth`，因此不在本表范围内。

#### 5.1.2 人工验收步骤（隐藏策略）

1. 使用管理员账号创建上述 buttonCode 对应的按钮资源（建议绑定到各自菜单）。
2. 创建两个角色：
   - `RoleA`：分配全部 buttonCode
   - `RoleB`：只分配部分 buttonCode（例如不给 `manage_menu:delete`）
3. 使用 `RoleB` 登录：
   - 进入 `/manage/menu`：列表行内“删除”按钮应被隐藏（DOM 不存在）
   - 进入 `/manage/role`：未分配的权限按钮入口应被隐藏
4. 使用 `RoleA` 登录：上述按钮均应可见。

### 5.2 低代码设计器

1. 用无 `lowcode:save` 权限账号进入设计器
2. Header 不应显示“保存”
3. 直接请求 `POST /designer/page/save` 应返回 403

## 6. 相关接口

### 6.1 权限分配与下发

- 按钮树（按菜单分组）：`GET /button/tree`
- 角色已分配按钮：`GET /button/auth-buttons/:roleId`
- 角色分配按钮：`POST /authorization/assign-buttons`
- 用户按钮下发（code 列表）：`GET /authorization/getUserButtons`

### 6.2 按钮资源管理（菜单/低代码页面）

> 管理端“菜单管理”中通过“更多 -> 按钮管理”进入。

- 查询某菜单按钮列表：`GET /button/list?menuId=<number>`
- 创建按钮：`POST /button`
- 更新按钮：`PUT /button/:id`
- 删除按钮：`DELETE /button/:id`

### 6.3 设计器绑定权限（按钮树 & 运行时解析）

- 设计器按钮树（用于“绑定权限”下拉选择）：`GET /lowcode/designer/buttons-tree`
  - 返回树节点字段：`menuId/menuName/children`
  - 其中叶子节点 `menuId` 实际为 `buttonCode`（字符串），用于写入 schema

- Vue 运行时解析函数：`getPermissionById(buttonCode)`
  - 数据来源：`GET /authorization/getUserButtons` 下发的 `buttonCodes`
  - 返回值语义：返回 `true` 表示“无权限”，用于 `hiddenOn` 隐藏
