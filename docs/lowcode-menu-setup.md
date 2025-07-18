# 低代码平台菜单配置说明

## 概述

本文档说明了如何为低代码平台添加菜单配置，包括数据库菜单数据、国际化配置和权限设置。

**重要说明**：菜单ID从100开始，避免与ID 80的低代码页面示例冲突。

## 菜单结构

### 主菜单（目录）
- **ID**: 100
- **名称**: 低代码平台 (Low-Code Platform)
- **路由**: `/lowcode`
- **图标**: `carbon:application-web`
- **排序**: 5

### 子菜单列表

| ID | 菜单名称 | 路由名称 | 路由路径 | 图标 | 排序 | 中文名称 | 英文名称 |
|----|----------|----------|----------|------|------|----------|----------|
| 101 | lowcode_project | lowcode_project | /lowcode/project | carbon:folder-details | 1 | 项目管理 | Project Management |
| 102 | lowcode_entity | lowcode_entity | /lowcode/entity | carbon:data-table | 2 | 实体管理 | Entity Management |
| 103 | lowcode_field | lowcode_field | /lowcode/field | carbon:text-column | 3 | 字段管理 | Field Management |
| 104 | lowcode_relationship | lowcode_relationship | /lowcode/relationship | carbon:connect | 4 | 关系管理 | Relationship Management |
| 105 | lowcode_query | lowcode_query | /lowcode/query | carbon:search | 5 | 查询管理 | Query Management |
| 106 | lowcode_api-config | lowcode_api-config | /lowcode/api-config | carbon:api | 6 | API配置 | API Configuration |
| 107 | lowcode_api-test | lowcode_api-test | /lowcode/api-test | carbon:test-tool | 7 | API测试 | API Testing |
| 108 | lowcode_template | lowcode_template | /lowcode/template | carbon:template | 8 | 模板管理 | Template Management |
| 109 | lowcode_code-generation | lowcode_code-generation | /lowcode/code-generation | carbon:code | 9 | 代码生成 | Code Generation |

## 文件修改清单

### 1. 数据库种子文件
- **文件**: `backend/prisma/seeds/sys/sysMenu.ts`
- **修改**: 添加了低代码平台的10个菜单项（1个主菜单 + 9个子菜单）

### 2. 角色权限配置
- **文件**: `backend/prisma/seeds/sys/sysRoleMenu.ts`
- **修改**: 为管理员角色（roleId='1'）添加了所有低代码平台菜单的访问权限

### 3. 中文国际化
- **文件**: `frontend/src/locales/langs/zh-cn.ts`
- **修改**: 在 `route` 对象中添加了低代码平台相关路由的中文翻译

### 4. 英文国际化
- **文件**: `frontend/src/locales/langs/en-us.ts`
- **修改**: 在 `route` 对象中添加了低代码平台相关路由的英文翻译

### 5. SQL执行脚本
- **文件**: `backend/scripts/add_lowcode_menus.sql`
- **说明**: 可直接在数据库中执行的SQL脚本，包含所有菜单数据和权限配置

## 部署步骤

### 方式一：使用种子数据（推荐）
1. 重新运行数据库种子脚本：
   ```bash
   cd backend
   npm run seed
   ```

### 方式二：直接执行SQL脚本
1. 连接到PostgreSQL数据库
2. 执行 `backend/scripts/add_lowcode_menus.sql` 脚本

### 方式三：手动在菜单管理界面添加
1. 登录系统管理后台
2. 进入"系统管理" -> "菜单管理"
3. 按照上述菜单结构手动添加菜单项

## 验证步骤

1. **数据库验证**：
   ```sql
   -- 查看新增的菜单
   SELECT id, menu_name, route_name, route_path, pid, sequence
   FROM sys_menu
   WHERE id >= 100
   ORDER BY pid, sequence;

   -- 查看角色权限
   SELECT rm.role_id, rm.menu_id, m.menu_name
   FROM sys_role_menu rm
   JOIN sys_menu m ON rm.menu_id = m.id
   WHERE rm.menu_id >= 100;
   ```

2. **前端验证**：
   - 重启前端应用
   - 使用管理员账号登录
   - 检查左侧菜单是否显示"低代码平台"及其子菜单
   - 验证菜单名称的中英文切换是否正常

3. **功能验证**：
   - 点击各个子菜单，确认页面能正常加载
   - 检查路由跳转是否正确
   - 验证菜单权限控制是否生效

## 注意事项

1. **ID冲突**：新菜单ID从100开始，避免与ID 80的低代码页面示例冲突
2. **路由组件**：确保对应的Vue组件文件存在于 `frontend/src/views/lowcode/` 目录下
3. **权限控制**：目前只为管理员角色添加了权限，其他角色需要根据需要单独配置
4. **图标资源**：使用的是Carbon Design System图标，确保图标资源可用
5. **国际化**：如需支持其他语言，需要在对应的语言文件中添加翻译
6. **ID 80预留**：ID 80已被用作低代码页面示例，请勿冲突

## 扩展说明

如果需要添加更多低代码平台相关菜单，请遵循以下规则：
- 菜单ID从110开始递增
- 路由名称以 `lowcode_` 为前缀
- 路由路径以 `/lowcode/` 为前缀
- 在国际化文件中添加对应的翻译
- 为相关角色添加菜单权限
