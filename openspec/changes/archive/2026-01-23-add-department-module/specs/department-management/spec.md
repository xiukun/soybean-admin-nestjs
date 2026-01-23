## ADDED Requirements

### Requirement: Department tree CRUD
系统 SHALL 提供“部门管理”能力，支持部门树形结构的创建、查询、更新与删除。

#### Scenario: Create root department
- **WHEN** 管理员创建根部门（pid='0'）并提交 name/code/sequence
- **THEN** 系统保存部门记录并在树中展示

#### Scenario: Create child department
- **WHEN** 管理员在某部门下创建子部门（pid=parentId）
- **THEN** 系统保存子部门记录并在树中展示为 parent 的 children

#### Scenario: Delete department blocked by children
- **WHEN** 管理员删除一个存在子部门的部门
- **THEN** 系统 MUST 拒绝删除并返回错误信息

### Requirement: Department code hierarchy rule
系统 MUST 校验部门编码 `code` 的层级规则。

#### Scenario: Validate child code prefix
- **WHEN** 创建或更新子部门且其父部门 code 为 `001-01`
- **AND** 子部门 code 不以 `001-01-` 为前缀
- **THEN** 系统 MUST 拒绝请求并返回“部门编码不符合层级规则”

#### Scenario: Code uniqueness
- **WHEN** 创建或更新部门且 code 与已有部门重复
- **THEN** 系统 MUST 拒绝请求并返回“部门编码已存在”

### Requirement: Default super admin center department
系统 SHALL 在初始化/种子数据中创建默认部门“超级管理中心”，用于存放当前系统超级管理员。

#### Scenario: Seed default department
- **WHEN** 系统首次初始化数据库
- **THEN** 默认部门“超级管理中心” MUST 存在

#### Scenario: Attach super admin to default department
- **WHEN** 数据库存在超级管理员用户且其未关联任何部门
- **THEN** 系统 MUST 将其关联到“超级管理中心”

### Requirement: User-department multi-association
系统 SHALL 支持用户关联多个部门（多对多）。

#### Scenario: Assign multiple departments
- **WHEN** 管理员为用户保存 deptIds=[A,B]
- **THEN** 系统保存用户-部门关联，且用户在 A/B 部门筛选下均可查询到

#### Scenario: Delete department blocked by user association
- **WHEN** 管理员删除一个已被任意用户关联的部门
- **THEN** 系统 MUST 拒绝删除并返回错误信息
