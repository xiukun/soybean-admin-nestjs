## Context
新增部门管理（树）并重构用户与部门为多对多关联。需要保证：
- 部门编码支持层级编码规则（父编码前缀 + 子段）。
- Docker 中 PostgreSQL 的实际表结构与 Prisma schema、deploy SQL 完全一致。

## Goals
- 部门树 CRUD、编码规则校验、排序、启用/禁用。
- 用户可关联多个部门，用户管理支持按部门树筛选。
- 初始化默认部门“超级管理中心”，并将现有超级管理员关联进去。

## Non-Goals
- 行级数据权限/部门权限继承策略。
- 组织架构编制、岗位/职级等复杂 HR 模型。

## Data Model
### sys_dept
- id: string
- name: string
- code: string（唯一；层级编码，如 001-01-02）
- pid: string（父部门 id，根节点为 '0'）
- sequence: number（排序）
- status: ENABLED/DISABLED
- remark?: string
- createdAt/updatedAt/createdBy/updatedBy（与现有 sys_dict 风格对齐）

### sys_user_dept
- id: string（或复合主键 userId+deptId，需与现有工程风格一致）
- userId: string
- deptId: string
- unique(userId, deptId)

## Department Code Rule
- 规则：子部门 code MUST 以父部门 code 为前缀，并通过 `-` 分段。
  - 示例：父 `001-01` 子 `001-01-04`
- 新增子部门时：后端提供建议 code（基于父 code + 下一个可用序号，按 2 位/3 位补零策略可配置）。
- 更新部门时：若修改 code，需要同步校验：
  - code 唯一
  - 若非根节点：满足前缀规则
  - 可选：是否允许改动导致整棵子树 code 不一致（本次建议：不自动级联修改子节点 code，若需改动则要求先调整子节点或禁止改动）。

## API Design
- GET /dept/tree：返回部门树
- GET /dept：列表（可选 keyword）
- POST /dept：创建
- PUT /dept/:id：更新
- DELETE /dept/:id：删除（若存在子部门或被用户关联，则禁止）
- GET /dept/:id/suggest-code?pid=xxx：返回建议编码（可合并到 create 表单前置接口）

用户接口扩展（示意）：
- GET /user：返回用户列表，新增 departments 字段或 deptIds
- POST/PUT /user：支持 deptIds: string[]

## Migration Plan
1) deploy/postgres 新增建表 SQL（sys_dept, sys_user_dept）
2) seed：插入默认部门“超级管理中心”
3) seed：将超级管理员（role=super 或 userId=1 等，按项目现状）关联到默认部门
4) Prisma schema 同步并 `prisma generate`

## Risks / Trade-offs
- 多对多后，用户列表联表查询/筛选会更复杂：需要 Prisma include + where some。
- 部门 code 规则若允许随意编辑，可能造成历史数据不一致；建议后端强校验。

## Open Questions
- 子部门 code 自动生成的补零位数（2 位还是 3 位）？
- 超级管理员识别规则：roleId=1？还是 username=admin？需要以当前数据库/代码为准。
