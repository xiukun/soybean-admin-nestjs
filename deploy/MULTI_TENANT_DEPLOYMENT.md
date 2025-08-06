# 多租户功能部署指南

本文档说明如何部署多租户功能相关的数据库变更和配置。

## 概述

多租户功能为系统添加了企业级的租户隔离能力，包括以下核心组件：

- **企业管理 (Enterprise)**: 顶级组织单位
- **租户管理 (Tenant)**: 企业下的租户实例
- **应用空间 (AppSpace)**: 租户内的应用隔离
- **用户组 (UserGroup)**: 租户内的用户分组
- **计划管理 (Plan)**: 租户的服务计划和限制

## 数据库变更

### 1. 表结构变更

#### 新增表
- `enterprise` - 企业表
- `tenant` - 租户表
- `app_space` - 应用空间表
- `user_group` - 用户组表
- `plan` - 服务计划表

#### 修改表
- `sys_user` - 添加 `tenant_id` 字段
- `sys_organization` - 添加 `tenant_id` 字段和唯一约束

### 2. 约束和索引

#### 唯一约束
- `enterprise.name` - 企业名称唯一
- `tenant(enterprise_id, name)` - 企业内租户名称唯一
- `app_space(tenant_id, name)` - 租户内应用空间名称唯一
- `user_group(tenant_id, name)` - 租户内用户组名称唯一
- `sys_organization(tenant_id, code)` - 租户内组织代码唯一
- `plan.name` - 计划名称唯一

#### 外键约束
- `sys_organization.tenant_id` → `tenant.id`
- `tenant.enterprise_id` → `enterprise.id`
- `tenant.plan_id` → `plan.id`
- `app_space.tenant_id` → `tenant.id`
- `user_group.tenant_id` → `tenant.id`

## 部署步骤

### 方式一：使用自动化脚本（推荐）

```bash
# Linux/macOS
cd deploy
./setup-lowcode-platform.sh

# Windows
cd deploy
setup-lowcode-platform.bat
```

### 方式二：手动执行 SQL 文件

按以下顺序执行 SQL 文件：

```bash
# 1. 更新表结构（包含多租户表）
psql -d your_database -f deploy/postgres/01_create_table.sql

# 2. 初始化多租户基础数据
psql -d your_database -f deploy/postgres/22_multi_tenant_init_data.sql
```

### 方式三：完整数据库初始化

如果是全新部署，可以使用完整初始化脚本：

```bash
cd deploy
./init-database-with-schemas.sh
```

## 初始化数据

### 默认企业和租户

系统会自动创建以下默认数据：

#### 企业
- **default-enterprise**: 默认企业，用于初始化和测试

#### 服务计划
- **basic-plan**: 基础版（10用户，5应用空间）
- **pro-plan**: 专业版（50用户，20应用空间）
- **enterprise-plan**: 企业版（500用户，100应用空间）

#### 租户
- **default-tenant**: 默认租户，使用基础版计划
- **demo-tenant**: 演示租户，使用专业版计划

#### 应用空间
- **default-app-space**: 默认租户的主要应用空间
- **demo-app-space**: 演示租户的应用空间

#### 用户组
- **default-admin-group**: 默认租户的管理员组
- **default-user-group**: 默认租户的普通用户组
- **demo-admin-group**: 演示租户的管理员组

### 数据迁移

脚本会自动将现有数据迁移到多租户架构：

1. **用户迁移**: 所有内置用户（`built_in = true`）会被分配给 `default-tenant`
2. **组织迁移**: 所有现有组织会被分配给 `default-tenant`
3. **测试数据**: 为演示租户创建示例组织数据

## 验证部署

### 1. 检查表结构

```sql
-- 检查多租户表是否创建成功
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'backend' 
AND table_name IN ('enterprise', 'tenant', 'app_space', 'user_group', 'plan');

-- 检查字段是否添加成功
SELECT column_name FROM information_schema.columns 
WHERE table_schema = 'backend' 
AND table_name = 'sys_organization' 
AND column_name = 'tenant_id';
```

### 2. 检查初始数据

```sql
-- 检查企业数据
SELECT id, name, status FROM backend.enterprise;

-- 检查租户数据
SELECT id, name, enterprise_id, plan_id FROM backend.tenant;

-- 检查计划数据
SELECT id, name, max_users, max_app_spaces FROM backend.plan;
```

### 3. 检查数据迁移

```sql
-- 检查用户租户分配
SELECT username, tenant_id FROM backend.sys_user WHERE built_in = true;

-- 检查组织租户分配
SELECT code, name, tenant_id FROM backend.sys_organization;
```

## 回滚方案

如果需要回滚多租户功能，可以执行以下步骤：

### 1. 备份数据

```bash
pg_dump -h localhost -U username -d database_name > backup_before_rollback.sql
```

### 2. 移除多租户字段

```sql
-- 移除外键约束
ALTER TABLE backend.sys_organization DROP CONSTRAINT IF EXISTS sys_organization_tenant_id_fkey;

-- 移除字段
ALTER TABLE backend.sys_organization DROP COLUMN IF EXISTS tenant_id;
ALTER TABLE backend.sys_user DROP COLUMN IF EXISTS tenant_id;

-- 移除唯一约束
DROP INDEX IF EXISTS sys_organization_tenant_id_code_key;
```

### 3. 删除多租户表

```sql
-- 按依赖关系顺序删除
DROP TABLE IF EXISTS backend.user_group;
DROP TABLE IF EXISTS backend.app_space;
DROP TABLE IF EXISTS backend.tenant;
DROP TABLE IF EXISTS backend.enterprise;
DROP TABLE IF EXISTS backend.plan;
```

## 注意事项

1. **数据备份**: 在执行任何数据库变更前，请务必备份现有数据
2. **权限检查**: 确保数据库用户有足够的权限执行 DDL 操作
3. **应用重启**: 部署完成后需要重启后端应用以加载新的数据库结构
4. **Prisma 同步**: 如果使用 Prisma，需要运行 `npx prisma generate` 重新生成客户端
5. **测试验证**: 部署后请使用提供的测试用例验证多租户功能

## 故障排除

### 常见问题

1. **外键约束错误**: 确保按正确顺序执行 SQL 文件
2. **唯一约束冲突**: 检查是否有重复的数据需要清理
3. **权限不足**: 确保数据库用户有 CREATE TABLE 和 ALTER TABLE 权限
4. **Schema 不存在**: 确保先执行了 `00_init_schemas.sql`

### 日志检查

部署脚本会输出详细的执行日志，如果遇到问题，请检查：

1. 数据库连接是否正常
2. SQL 文件是否存在
3. 执行过程中是否有错误信息
4. 数据库事务是否正确提交

## 联系支持

如果在部署过程中遇到问题，请：

1. 检查本文档的故障排除部分
2. 查看系统日志和数据库日志
3. 提供详细的错误信息和环境描述
4. 联系技术支持团队