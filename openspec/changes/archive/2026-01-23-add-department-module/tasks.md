## 1. Investigation
- [x] 1.1 复核现有用户表/租户/角色模型，确认用户与部门的最小改动点（多对多关联）
- [x] 1.2 复核前端用户管理页面现状与 API 交互（新增部门字段、筛选条件）

## 2. Backend
- [x] 2.1 Prisma：新增 `sys_dept`（部门树：pid/sequence/status/remark/code 等）
- [x] 2.2 Prisma：新增 `sys_user_dept`（用户-部门多对多关联表，含唯一约束）
- [x] 2.3 Deploy：新增 `deploy/postgres/18_sys_dept.sql`、`19_sys_user_dept.sql` 建表脚本
- [x] 2.4 Deploy：新增 seed：默认部门"超级管理中心"，并将超级管理员用户关联到该部门（`20_sys_dept_seed.sql`）
- [x] 2.5 API：部门 CRUD + tree（参考字典树实现，含循环引用防护/删除校验）
- [x] 2.6 API：用户查询/保存接口扩展部门字段（返回 departments；保存支持 deptIds）

## 3. Frontend (admin)
- [x] 3.1 新增"部门管理"菜单/路由（与权限按钮体系一致）
- [x] 3.2 部门管理页面：树形列表 + 搜索 + 新增/编辑/删除 + 添加子部门
- [x] 3.3 用户管理页面重构：左侧部门树筛选、用户表格新增"所属部门"列
- [x] 3.4 用户新增/编辑弹窗：支持选择多个部门（多选），并回填/保存

## 4. Validation
- [x] 4.1 数据一致性校验：Prisma schema 与 deploy SQL 字段/约束一致（docker 初始化可用）
- [ ] 4.2 联调：创建部门/子部门、编码层级规则校验、删除限制
- [ ] 4.3 联调：用户绑定多个部门、按部门筛选用户
- [x] 4.4 `openspec validate add-department-module --strict`
