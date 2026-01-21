## 1. Implementation
- [x] 1.1 梳理现有“角色按钮权限弹窗”的组件实现与树数据结构（菜单节点/按钮节点字段、key 规则、checkedKeys 规则）
- [x] 1.2 在弹窗新增检索输入框（防抖可选）
- [x] 1.3 实现树过滤：仅显示匹配节点与其祖先节点；过滤不改变 checkedKeys
- [x] 1.4 实现关键字高亮（菜单名、按钮名、buttonCode）
- [x] 1.5 补充交互细节：无结果提示、清空检索恢复全量、保持展开状态合理
- [x] 1.6 通过 lint/typecheck，补充必要的单元测试或最小可验证用例（如已有测试框架）

## 2. Validation
- [x] 2.1 `openspec validate add-role-button-auth-search --strict`
