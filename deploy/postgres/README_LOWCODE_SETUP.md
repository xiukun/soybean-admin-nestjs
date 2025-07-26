# 低代码平台菜单和数据库设置指南

## 概述

本指南说明如何为低代码平台设置完整的菜单管理和数据库结构。低代码平台提供以下核心功能：

### 低代码平台功能模块

1. **创建项目** - 定义项目基本信息和配置
2. **设计实体** - 创建业务实体和数据模型
3. **管理字段** - 定义字段类型、验证规则、UI配置
4. **配置关系** - 设置实体间的关联关系
5. **编写查询** - 创建复杂的数据查询逻辑
6. **配置API** - 定义RESTful API接口
7. **测试API** - 在线测试API功能
8. **管理模板** - 维护代码生成模板
9. **生成代码** - 一键生成NestJS业务服务

## SQL文件说明

### 核心文件

1. **14_code_generation_menus.sql** - 低代码平台菜单配置
   - 创建低代码平台主菜单
   - 添加所有功能子菜单
   - 配置菜单权限
   - 关联低代码页面

2. **16_lowcode_platform_pages.sql** - 低代码页面配置
   - 创建各功能模块的AMIS页面配置
   - 定义页面版本历史
   - 关联菜单项到对应页面

3. **17_prisma_schema_updates.sql** - 数据库结构更新
   - 确保所有必要的表和字段存在
   - 检查并创建缺失的数据库结构
   - 保持与Prisma Schema的一致性

### 依赖文件

- **10_lowcode_platform_tables.sql** - 低代码平台数据表结构
- **04_sys_menu.sql** - 基础菜单数据
- **09_lowcode_pages.sql** - 低代码页面示例

## 安装步骤

### 1. 按顺序执行SQL文件

```bash
# 1. 确保基础表结构存在
psql -d your_database -f deploy/postgres/00_init_schemas.sql
psql -d your_database -f deploy/postgres/01_create_table.sql

# 2. 创建基础菜单数据
psql -d your_database -f deploy/postgres/04_sys_menu.sql

# 3. 创建低代码平台表结构
psql -d your_database -f deploy/postgres/10_lowcode_platform_tables.sql

# 4. 更新数据库结构（确保兼容性）
psql -d your_database -f deploy/postgres/17_prisma_schema_updates.sql

# 5. 创建低代码页面配置
psql -d your_database -f deploy/postgres/16_lowcode_platform_pages.sql

# 6. 创建低代码平台菜单
psql -d your_database -f deploy/postgres/14_code_generation_menus.sql
```

### 2. 验证安装

执行以下查询验证安装是否成功：

```sql
-- 检查低代码平台菜单
SELECT id, menu_name, route_name, menu_type, lowcode_page_id 
FROM backend.sys_menu 
WHERE route_name LIKE 'lowcode%' 
ORDER BY pid, sequence;

-- 检查低代码页面
SELECT id, name, title, code, status 
FROM backend.sys_lowcode_page 
WHERE code LIKE 'lowcode%';

-- 检查菜单权限
SELECT rm.role_id, m.menu_name, m.route_name 
FROM backend.sys_role_menu rm
JOIN backend.sys_menu m ON rm.menu_id = m.id
WHERE m.route_name LIKE 'lowcode%'
ORDER BY rm.role_id, m.sequence;
```

## 菜单结构

```
低代码平台 (lowcode)
├── 项目管理 (lowcode_project) - 创建项目：定义项目基本信息和配置
├── 实体管理 (lowcode_entity) - 设计实体：创建业务实体和数据模型
├── 字段管理 (lowcode_field) - 管理字段：定义字段类型、验证规则、UI配置
├── 关系管理 (lowcode_relationship) - 配置关系：设置实体间的关联关系
├── 查询管理 (lowcode_query) - 编写查询：创建复杂的数据查询逻辑
├── API配置 (lowcode_api-config) - 配置API：定义RESTful API接口
├── API测试 (lowcode_api-test) - 测试API：在线测试API功能
├── 模板管理 (lowcode_template) - 管理模板：维护代码生成模板
├── 代码生成器 (lowcode_code-generation) - 生成代码：一键生成NestJS业务服务
└── 目标项目管理 (lowcode_target-project) - 管理代码生成的目标项目
```

## 多语言支持

### 中文 (zh-CN)
所有菜单项都已配置中文显示名称和描述。

### 英文 (en-US)
前端语言文件已更新，支持英文界面。

## 权限配置

默认为超级管理员角色（ID: '1'）分配所有低代码平台菜单权限。如需为其他角色分配权限，请执行：

```sql
-- 为特定角色添加低代码平台权限
INSERT INTO backend.sys_role_menu (role_id, menu_id, domain) 
SELECT 'your_role_id', id, 'soybean' 
FROM backend.sys_menu 
WHERE route_name LIKE 'lowcode%';
```

## 故障排除

### 常见问题

1. **菜单不显示**
   - 检查用户角色是否有相应权限
   - 确认菜单状态为 'ENABLED'
   - 验证路由配置是否正确

2. **低代码页面无法加载**
   - 检查 lowcode_page_id 是否正确关联
   - 确认页面配置的 schema 格式正确
   - 验证 AMIS 组件配置

3. **数据库连接错误**
   - 确认数据库连接配置
   - 检查 schema 权限
   - 验证表结构是否完整

### 日志检查

```bash
# 检查后端服务日志
docker logs soybean-admin-backend

# 检查低代码平台服务日志
docker logs lowcode-platform-backend

# 检查数据库日志
docker logs postgres
```

## 开发指南

### 添加新功能模块

1. 在 `16_lowcode_platform_pages.sql` 中添加新的页面配置
2. 在 `14_code_generation_menus.sql` 中添加对应的菜单项
3. 更新前端语言文件添加多语言支持
4. 配置相应的权限

### 自定义页面配置

低代码页面使用 AMIS JSON Schema 配置。参考现有页面配置进行自定义：

```json
{
  "type": "page",
  "title": "页面标题",
  "subTitle": "页面副标题",
  "body": [
    {
      "type": "crud",
      "title": "数据表格",
      "api": {
        "method": "get",
        "url": "/api/v1/your-endpoint"
      }
    }
  ]
}
```

## 支持

如有问题，请查看：
- [AMIS 官方文档](https://aisuda.bce.baidu.com/amis/zh-CN/docs/index)
- [NestJS 官方文档](https://nestjs.com/)
- [Prisma 官方文档](https://www.prisma.io/docs/)
