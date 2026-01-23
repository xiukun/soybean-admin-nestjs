# Change: add-department-module（新增部门管理 + 用户关联部门重构）

## Why
当前“用户管理”缺少部门维度的组织结构支撑，无法实现“先建部门、再关联用户”的管理流程，也无法通过部门树进行用户筛选与权限/归属管理。需要新增“部门管理”能力，并重构用户与部门的关联关系。

## What Changes
- 新增部门管理模块（树形结构），支持部门/子部门的 CRUD、排序、启用/禁用、搜索。
- 部门支持“部门编码”并具备层级编码规则（例如：`001-01-02`），新增子部门时可基于父编码生成建议编码。
- 用户管理重构：用户允许关联多个部门（多对多），并提供“所属部门”选择与展示。
- 提供默认部门“超级管理中心”，用于存放当前系统的超级管理员（兼容历史数据：未关联部门的超级管理员自动关联该部门）。
- 数据一致性：更新 Prisma schema 与 `deploy/postgres` SQL（建表 + seed），保证与 Docker 中运行的 PostgreSQL 一致。

## Impact
- Affected specs: 新增 capability `department-management`；修改 capability `user-management`（若当前未有 user spec，则在本次 change 内先以 delta spec 形式描述影响）。
- Affected code:
  - Backend: `backend/prisma/schema.prisma`，`backend/apps/base-system/src/api/manage/**`
  - Deploy: `deploy/postgres/*`（新增部门相关建表与 seed SQL，确保与 Prisma 一致）
  - Frontend: `frontend/src/views/manage/**`（新增部门管理页面；用户管理页面增加部门选择/展示/筛选）

## Out of Scope / Non-Goals
- 不在本次实现“部门级数据权限/行级权限”（后续可扩展）。
- 不在本次实现复杂的组织架构编制、岗位、职级等。

## Breaking Changes
- 用户与部门关系由“无部门/单部门”升级为“多部门”，涉及用户查询与保存 payload 变化（管理端/低代码侧如依赖旧字段需同步调整）。

## Migration
- 部门表新增后，初始化时插入默认部门“超级管理中心”。
- 对已有超级管理员：若无任何部门关联，则自动关联到“超级管理中心”。

## Open Questions
- 部门编码自动生成策略：
  - 是否必须强校验“与父编码前缀一致”？（建议：强校验，避免编码漂移）
  - 是否允许手动编辑编码？（建议：允许，但需校验唯一性与层级规则）
