# Change: 角色按钮权限弹窗支持前端检索

## Why
当前 `manage/role` 的“编辑按钮权限”弹窗以树形结构展示菜单/按钮列表。当菜单/页面数量增长后，按钮数量会非常多，人工滚动查找并勾选会变得非常繁琐且易错。

## What Changes
- 在“编辑按钮权限”弹窗中新增检索输入框
- 支持对树节点进行前端过滤：仅展示**匹配节点 + 其祖先节点**
- 支持关键字高亮（菜单名、按钮名、buttonCode）
- 过滤不影响已勾选状态：被过滤隐藏的已选节点仍保持选中，清空检索后仍可见

## Impact
- Affected specs: `button-permission`
- Affected code:
  - `frontend/src/views/manage/role/modules/button-auth-modal.vue`（或当前角色按钮权限弹窗文件）
  - 可能新增一个通用树过滤/高亮工具（若需要）

## Out of Scope
- 后端接口与数据结构调整
- “全选/反选/仅看已选” 等高级批量能力（如后续需要可另开变更）
