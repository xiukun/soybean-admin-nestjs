## ADDED Requirements

### Requirement: 数据字典模块（树形字典）
系统 SHALL 提供“数据字典”功能模块，用于维护可复用的字典定义与字典项，并支持树形层级结构（父子关系）与排序。

#### Scenario: 维护树形字典目录
- **WHEN** 管理员在管理端进入“数据字典”模块
- **THEN** 系统展示字典目录树（支持父子层级与排序）
- **AND** 管理员可以对字典目录进行 CRUD、调整父节点（pid）与排序

#### Scenario: 禁止循环引用
- **WHEN** 管理员修改某个字典节点的父节点（pid）
- **AND** 目标父节点为该节点自身或其任意后代节点
- **THEN** 系统 MUST 拒绝该操作并返回明确错误信息

#### Scenario: 删除有子节点的字典
- **WHEN** 管理员删除一个仍存在子节点的字典目录
- **THEN** 系统 MUST 拒绝删除并提示“请先删除子节点”

#### Scenario: 删除存在字典项的字典
- **WHEN** 管理员删除一个仍存在字典项（dict items）的字典目录
- **THEN** 系统 MUST 拒绝删除并提示“请先删除字典项”

#### Scenario: 字典项批量删除
- **WHEN** 管理员在字典项列表中勾选多条字典项并执行批量删除
- **THEN** 系统一次性删除这些字典项
- **AND** 删除完成后字典项列表刷新

#### Scenario: 树节点检索
- **WHEN** 管理员在字典目录树输入检索关键字
- **THEN** 系统仅展示“匹配节点及其祖先节点”，其他节点隐藏
- **AND** 检索不影响已选中节点状态，清空检索后恢复全量树

#### Scenario: 删除确认
- **WHEN** 管理员在字典目录树对选中节点点击删除
- **THEN** 系统 MUST 弹出二次确认
- **AND** 管理员确认后才执行删除

#### Scenario: 维护字典项（作为二级资源）
- **WHEN** 管理员在“数据字典”模块中选择某个字典（dict）
- **THEN** 系统展示该字典下的字典项列表（dict items）
- **AND** 管理员可以对字典项进行 CRUD 与排序调整

#### Scenario: 创建字典项
- **WHEN** 管理员在某个字典下创建字典项
- **THEN** 系统保存字典项并关联到该 dictId
- **AND** 字典项至少包含 `label` 与 `dictValue`

#### Scenario: 字典项唯一性约束（同一字典内）
- **WHEN** 管理员在同一个 dictId 下创建/更新字典项，且 `dictValue` 与已存在项重复
- **THEN** 后端拒绝并返回明确错误信息

### Requirement: 设计器加载字典名称列表（MAITA_LOWCODE_DICT_NAME_LIST）
系统 SHALL 支持低代码设计器通过 `window.MAITA_LOWCODE_DICT_NAME_LIST` 获取字典名称列表，用于 AMIS `select` 组件的 `source: '${ls:MAITA_LOWCODE_DICT_NAME_LIST}'`。

#### Scenario: 设计器首屏加载并缓存字典名称列表
- **WHEN** 用户打开低代码设计器
- **THEN** 设计器从后端拉取字典名称列表并写入 `window.MAITA_LOWCODE_DICT_NAME_LIST`
- **AND** 设计器应采用缓存策略避免频繁请求（至少在同一会话内缓存）

#### Scenario: 字典名称列表返回格式适配 AMIS select
- **WHEN** AMIS `select` 使用 `labelField: 'name'`、`valueField: 'id'`
- **THEN** `MAITA_LOWCODE_DICT_NAME_LIST` 的每个元素应至少包含 `id` 与 `name`

### Requirement: 设计器按 dictId 动态加载字典项（getDictById）
系统 SHALL 支持在 AMIS schema 中通过 `source: "${'<dictId>'|getDictById}"` 动态加载字典项列表。

#### Scenario: getDictById 返回字典项 options
- **WHEN** 设计器运行时调用 `getDictById('<dictId>')`
- **THEN** 系统请求后端接口并返回字典项数组
- **AND** 每个字典项至少包含 `label` 与 `dictValue` 以适配 `labelField: 'label'`、`valueField: 'dictValue'`

### Requirement: 数据一致性（deploy seed 与 prisma）
系统 MUST 保证开发阶段数据库结构与 seed 数据在 `deploy/postgres` 与 `backend/prisma/schema.prisma` 中保持一致，以确保本地与 docker 环境行为一致。

#### Scenario: 同步维护 deploy 与 prisma
- **WHEN** 新增或修改数据字典相关表结构
- **THEN** 必须同时更新 `deploy/postgres` 初始化 SQL 与 `prisma/schema.prisma`
- **AND** 不创建迁移文件（migration），以项目规则为准
