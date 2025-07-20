# 数据库部署和初始化指南

## 概述

本目录包含了Soybean Admin NestJS项目的数据库初始化脚本，包括系统基础表和低代码平台相关表的创建和数据初始化。

## 文件结构

```
deploy/
└── postgres/
    ├── 01_create_table.sql          # 系统基础表结构
    ├── 02_sys_user.sql              # 系统用户表数据
    ├── 03_sys_role.sql              # 系统角色表数据
    ├── 04_sys_menu.sql              # 系统菜单表数据
    ├── 05_sys_domain.sql            # 系统域表数据
    ├── 06_sys_user_role.sql         # 用户角色关联数据
    ├── 07_sys_role_menu.sql         # 角色菜单权限数据
    ├── 08_casbin_rule.sql           # Casbin权限规则数据
    ├── 09_lowcode_pages.sql         # 低代码页面表数据
    ├── 10_lowcode_platform_tables.sql  # 低代码平台表结构
    ├── 11_lowcode_platform_data.sql    # 低代码平台初始数据
    └── 12_lowcode_queries_init.sql     # 查询管理初始化脚本
```

## 执行顺序

脚本按文件名的数字前缀顺序执行：

1. **01-08**: 系统基础功能（用户、角色、菜单、权限）
2. **09**: 低代码页面管理
3. **10**: 低代码平台核心表结构
4. **11**: 低代码平台示例数据
5. **12**: 查询管理功能初始化

## 低代码平台表结构

### 核心表

- `lowcode_projects` - 项目管理
- `lowcode_entities` - 实体管理
- `lowcode_fields` - 字段管理
- `lowcode_relations` - 关系管理
- `lowcode_api_configs` - API配置管理
- `lowcode_apis` - API管理
- `lowcode_queries` - 查询管理 ⭐ **新增**
- `lowcode_codegen_tasks` - 代码生成任务
- `lowcode_code_templates` - 代码模板

### 查询管理表详情

`lowcode_queries` 表支持以下功能：

- **基础查询配置**: 基于实体的查询构建
- **多表关联**: 支持JOIN操作配置
- **字段选择**: 灵活的字段选择和别名
- **过滤条件**: 复杂的WHERE条件配置
- **排序和分组**: ORDER BY和GROUP BY支持
- **分页支持**: LIMIT和OFFSET配置
- **SQL生成**: 自动生成SQL查询语句
- **执行统计**: 查询性能和使用统计

## 部署方式

### 1. Docker Compose 自动初始化

使用Docker Compose启动时，脚本会自动执行：

```bash
# 首次启动（会自动执行所有初始化脚本）
docker-compose up -d

# 如果需要重新初始化数据库
docker-compose down -v  # 删除数据卷
docker-compose up -d    # 重新启动
```

### 2. 手动执行脚本

如果需要在现有数据库中手动执行：

```bash
# 连接到PostgreSQL
psql -h localhost -p 25432 -U soybean -d soybean-admin-nest-backend

# 按顺序执行脚本
\i /path/to/deploy/postgres/10_lowcode_platform_tables.sql
\i /path/to/deploy/postgres/11_lowcode_platform_data.sql
\i /path/to/deploy/postgres/12_lowcode_queries_init.sql
```

### 3. 生产环境部署

生产环境建议：

1. **备份现有数据**
2. **测试脚本执行**
3. **分步骤执行**
4. **验证数据完整性**

```bash
# 备份
pg_dump -h localhost -p 5432 -U username -d database_name > backup.sql

# 执行新脚本
psql -h localhost -p 5432 -U username -d database_name -f 12_lowcode_queries_init.sql

# 验证
psql -h localhost -p 5432 -U username -d database_name -c "\dt lowcode_*"
```

## 示例数据

### 默认项目
- **项目名**: 示例项目
- **项目编码**: demo-project
- **包含实体**: 用户(User)、角色(Role)

### 示例查询
1. **活跃用户查询** - 查询所有活跃状态的用户
2. **用户角色查询** - 查询用户及其关联角色
3. **用户统计查询** - 按状态统计用户数量
4. **用户状态统计** - 复杂的分组统计查询
5. **用户角色详情查询** - 多表关联查询
6. **活跃用户分页查询** - 支持搜索的分页查询

### 菜单权限
系统会自动创建低代码平台相关菜单：
- 低代码平台 (ID: 100)
  - 项目管理 (ID: 101)
  - 实体管理 (ID: 102)
  - 字段管理 (ID: 103)
  - 关系管理 (ID: 104)
  - 查询管理 (ID: 105) ⭐ **新增**
  - API配置 (ID: 106)
  - API测试 (ID: 107)
  - 模板管理 (ID: 108)
  - 代码生成 (ID: 109)

## 验证部署

### 检查表结构
```sql
-- 检查所有低代码平台表
SELECT table_name FROM information_schema.tables 
WHERE table_name LIKE 'lowcode_%' 
ORDER BY table_name;

-- 检查查询管理表结构
\d lowcode_queries
```

### 检查示例数据
```sql
-- 检查项目数据
SELECT * FROM lowcode_projects;

-- 检查查询数据
SELECT id, name, description, status FROM lowcode_queries;

-- 检查菜单权限
SELECT id, menu_name, route_path FROM sys_menu WHERE id >= 100;
```

### 检查索引和约束
```sql
-- 检查索引
SELECT indexname, tablename FROM pg_indexes 
WHERE tablename LIKE 'lowcode_%' 
ORDER BY tablename, indexname;

-- 检查外键约束
SELECT conname, conrelid::regclass, confrelid::regclass 
FROM pg_constraint 
WHERE contype = 'f' AND conrelid::regclass::text LIKE 'lowcode_%';
```

## 故障排除

### 常见问题

1. **权限错误**
   ```bash
   # 确保用户有足够权限
   GRANT ALL PRIVILEGES ON DATABASE database_name TO username;
   ```

2. **表已存在**
   ```sql
   -- 脚本使用 IF NOT EXISTS，通常不会有问题
   -- 如需重建，先删除表
   DROP TABLE IF EXISTS lowcode_queries CASCADE;
   ```

3. **外键约束错误**
   ```sql
   -- 检查依赖表是否存在
   SELECT * FROM lowcode_projects;
   SELECT * FROM lowcode_entities;
   ```

### 日志检查
```bash
# 查看Docker容器日志
docker-compose logs postgres

# 查看PostgreSQL日志
docker-compose exec postgres tail -f /var/log/postgresql/postgresql-*.log
```

## 更新和维护

### 添加新的初始化脚本
1. 创建新的SQL文件，使用递增的数字前缀
2. 确保脚本具有幂等性（可重复执行）
3. 添加适当的注释和文档

### 数据迁移
对于生产环境的数据迁移，建议：
1. 创建专门的迁移脚本
2. 使用事务确保数据一致性
3. 提供回滚方案
4. 充分测试

## 联系信息

如有问题，请联系开发团队或查看项目文档。
