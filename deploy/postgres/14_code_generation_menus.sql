-- Lowcode Platform Schema Tables
SET search_path TO lowcode, backend, public;

-- 代码生成器菜单和权限初始化
-- 此文件包含代码生成器相关的菜单项、页面配置和权限设置

-- 首先插入低代码页面配置
INSERT INTO
    backend.sys_lowcode_page (
        id,
        name,
        title,
        code,
        description,
        schema,
        status,
        created_by,
        created_at
    )
VALUES (
        'code-generation-page',
        '代码生成器',
        '代码生成器',
        'code-generation',
        '从实体定义生成完整的业务代码',
        '{
   "type": "page",
   "title": "代码生成器",
   "subTitle": "从实体定义生成完整的业务代码",
   "body": [
     {
       "type": "tabs",
       "tabs": [
         {
           "title": "代码生成",
           "body": [
             {
               "type": "form",
               "title": "代码生成配置",
               "mode": "horizontal",
               "api": {
                 "method": "post",
                 "url": "/api/v1/code-generation/generate"
               },
               "body": [
                 {
                   "type": "select",
                   "name": "entityIds",
                   "label": "选择实体",
                   "multiple": true,
                   "required": true,
                   "source": {
                     "method": "get",
                     "url": "/api/v1/entities?size=100"
                   },
                   "description": "选择要生成代码的实体，支持多选"
                 },
                 {
                   "type": "select",
                   "name": "targetProject",
                   "label": "目标项目",
                   "required": true,
                   "value": "amis-lowcode-backend",
                   "source": {
                     "method": "get",
                     "url": "/api/v1/target-projects"
                   },
                   "description": "选择代码生成的目标项目"
                 },
                 {
                   "type": "group",
                   "body": [
                     {
                       "type": "switch",
                       "name": "options.overwrite",
                       "label": "覆盖现有文件",
                       "value": true
                     },
                     {
                       "type": "switch",
                       "name": "options.createDirectories",
                       "label": "自动创建目录",
                       "value": true
                     },
                     {
                       "type": "switch",
                       "name": "git.enabled",
                       "label": "启用Git集成",
                       "value": false
                     }
                   ]
                 }
               ],
               "actions": [
                 {
                   "type": "button",
                   "actionType": "submit",
                   "label": "生成代码",
                   "level": "primary",
                   "size": "lg"
                 }
               ]
             }
           ]
         },
         {
           "title": "代码预览",
           "body": [
             {
               "type": "alert",
               "level": "info",
               "body": "代码预览功能开发中..."
             }
           ]
         }
       ]
     }
   ]
 }',
        'ENABLED',
        'system',
        NOW()
    ),
    (
        'target-project-page',
        '目标项目管理',
        '目标项目管理',
        'target-project',
        '管理代码生成的目标项目',
        '{
   "type": "page",
   "title": "目标项目管理",
   "body": [
     {
       "type": "crud",
       "title": "目标项目列表",
       "api": {
         "method": "get",
         "url": "/api/v1/target-projects"
       },
       "columns": [
         {
           "name": "displayName",
           "label": "项目名称",
           "type": "text"
         },
         {
           "name": "name",
           "label": "项目标识",
           "type": "text"
         },
         {
           "name": "type",
           "label": "项目类型",
           "type": "mapping",
           "map": {
             "nestjs": "<span class=\"label label-info\">NestJS</span>",
             "react": "<span class=\"label label-success\">React</span>",
             "vue": "<span class=\"label label-warning\">Vue.js</span>",
             "angular": "<span class=\"label label-danger\">Angular</span>",
             "other": "<span class=\"label label-default\">其他</span>"
           }
         },
         {
           "name": "framework",
           "label": "框架",
           "type": "text"
         },
         {
           "name": "language",
           "label": "语言",
           "type": "text"
         },
         {
           "name": "status",
           "label": "状态",
           "type": "mapping",
           "map": {
             "active": "<span class=\"label label-success\">活跃</span>",
             "inactive": "<span class=\"label label-default\">非活跃</span>"
           }
         },
         {
           "type": "operation",
           "label": "操作",
           "buttons": [
             {
               "type": "button",
               "label": "验证",
               "level": "link",
               "actionType": "ajax",
               "api": {
                 "method": "get",
                 "url": "/api/v1/target-projects/${id}/validate"
               }
             },
             {
               "type": "button",
               "label": "统计",
               "level": "link",
               "actionType": "dialog",
               "dialog": {
                 "title": "项目统计信息",
                 "body": {
                   "type": "service",
                   "api": {
                     "method": "get",
                     "url": "/api/v1/target-projects/${id}/statistics"
                   }
                 }
               }
             }
           ]
         }
       ]
     }
   ]
 }',
        'ENABLED',
        'system',
        NOW()
    );

-- 插入低代码页面版本数据
INSERT INTO
    backend.sys_lowcode_page_version (
        id,
        page_id,
        version,
        schema,
        changelog,
        created_by,
        created_at
    )
VALUES (
        'code-generation-version-1',
        'code-generation-page',
        '1.0.0',
        '{"type":"page","title":"代码生成器","body":[{"type":"form","api":"/api/v1/code-generation/generate"}]}',
        '初始版本 - 代码生成器功能',
        'system',
        NOW()
    ),
    (
        'target-project-version-1',
        'target-project-page',
        '1.0.0',
        '{"type":"page","title":"目标项目管理","body":[{"type":"crud","api":"/api/v1/target-projects"}]}',
        '初始版本 - 目标项目管理功能',
        'system',
        NOW()
    );

-- 添加低代码平台主菜单（如果不存在）
INSERT INTO
    backend.sys_menu (
        id,
        menu_type,
        menu_name,
        icon_type,
        icon,
        route_name,
        route_path,
        component,
        path_param,
        status,
        active_menu,
        hide_in_menu,
        pid,
        sequence,
        i18n_key,
        keep_alive,
        constant,
        href,
        multi_tab,
        lowcode_page_id,
        created_at,
        created_by,
        updated_at,
        updated_by
    )
SELECT
    100,
    'directory',
    '低代码平台',
    1,
    'mdi:code-braces',
    'lowcode',
    '/lowcode',
    'layout.base',
    null,
    'ENABLED',
    null,
    false,
    0,
    3,
    'route.lowcode',
    false,
    false,
    null,
    false,
    null,
    NOW(),
    'system',
    null,
    null
WHERE
    NOT EXISTS (
        SELECT 1
        FROM public.sys_menu
        WHERE
            route_name = 'lowcode'
    );

-- 添加低代码平台子菜单
INSERT INTO
    backend.sys_menu (
        id,
        menu_type,
        menu_name,
        icon_type,
        icon,
        route_name,
        route_path,
        component,
        path_param,
        status,
        active_menu,
        hide_in_menu,
        pid,
        sequence,
        i18n_key,
        keep_alive,
        constant,
        href,
        multi_tab,
        lowcode_page_id,
        created_at,
        created_by,
        updated_at,
        updated_by
    )
VALUES
    -- 项目管理 - 创建项目：定义项目基本信息和配置
    (
        101,
        'lowcode',
        '项目管理',
        1,
        'mdi:folder-multiple-outline',
        'lowcode_project',
        '/lowcode/project',
        'view.amis-template',
        null,
        'ENABLED',
        null,
        false,
        100,
        1,
        'route.lowcode_project',
        true,
        false,
        null,
        false,
        'lowcode-project-page',
        NOW(),
        'system',
        null,
        null
    ),
    -- 实体管理 - 设计实体：创建业务实体和数据模型
    (
        102,
        'lowcode',
        '实体管理',
        1,
        'mdi:database-outline',
        'lowcode_entity',
        '/lowcode/entity',
        'view.amis-template',
        null,
        'ENABLED',
        null,
        false,
        100,
        2,
        'route.lowcode_entity',
        true,
        false,
        null,
        false,
        'lowcode-entity-page',
        NOW(),
        'system',
        null,
        null
    ),
    -- 字段管理 - 管理字段：定义字段类型、验证规则、UI配置
    (
        103,
        'lowcode',
        '字段管理',
        1,
        'mdi:table-column',
        'lowcode_field',
        '/lowcode/field',
        'view.amis-template',
        null,
        'ENABLED',
        null,
        false,
        100,
        3,
        'route.lowcode_field',
        true,
        false,
        null,
        false,
        'lowcode-field-page',
        NOW(),
        'system',
        null,
        null
    ),
    -- 关系管理 - 配置关系：设置实体间的关联关系
    (
        104,
        'lowcode',
        '关系管理',
        1,
        'mdi:relation-many-to-many',
        'lowcode_relationship',
        '/lowcode/relationship',
        'view.amis-template',
        null,
        'ENABLED',
        null,
        false,
        100,
        4,
        'route.lowcode_relationship',
        true,
        false,
        null,
        false,
        'lowcode-relationship-page',
        NOW(),
        'system',
        null,
        null
    ),
    -- 查询管理 - 编写查询：创建复杂的数据查询逻辑
    (
        105,
        'lowcode',
        '查询管理',
        1,
        'mdi:database-search',
        'lowcode_query',
        '/lowcode/query',
        'view.amis-template',
        null,
        'ENABLED',
        null,
        false,
        100,
        5,
        'route.lowcode_query',
        true,
        false,
        null,
        false,
        'lowcode-query-page',
        NOW(),
        'system',
        null,
        null
    ),
    -- API配置 - 配置API：定义RESTful API接口
    (
        106,
        'lowcode',
        'API配置',
        1,
        'mdi:api',
        'lowcode_api-config',
        '/lowcode/api-config',
        'view.amis-template',
        null,
        'ENABLED',
        null,
        false,
        100,
        6,
        'route.lowcode_api-config',
        true,
        false,
        null,
        false,
        'lowcode-api-config-page',
        NOW(),
        'system',
        null,
        null
    ),
    -- API测试 - 测试API：在线测试API功能
    (
        107,
        'lowcode',
        'API测试',
        1,
        'mdi:test-tube',
        'lowcode_api-test',
        '/lowcode/api-test',
        'view.amis-template',
        null,
        'ENABLED',
        null,
        false,
        100,
        7,
        'route.lowcode_api-test',
        true,
        false,
        null,
        false,
        'lowcode-api-test-page',
        NOW(),
        'system',
        null,
        null
    ),
    -- 模板管理 - 管理模板：维护代码生成模板
    (
        108,
        'lowcode',
        '模板管理',
        1,
        'mdi:file-code-outline',
        'lowcode_template',
        '/lowcode/template',
        'view.amis-template',
        null,
        'ENABLED',
        null,
        false,
        100,
        8,
        'route.lowcode_template',
        true,
        false,
        null,
        false,
        'lowcode-template-page',
        NOW(),
        'system',
        null,
        null
    ),
    -- 代码生成器 - 生成代码：一键生成NestJS业务服务
    (
        109,
        'lowcode',
        '代码生成器',
        1,
        'mdi:code-tags',
        'lowcode_code-generation',
        '/lowcode/code-generation',
        'view.amis-template',
        null,
        'ENABLED',
        null,
        false,
        100,
        9,
        'route.lowcode_code-generation',
        true,
        false,
        null,
        false,
        'code-generation-page',
        NOW(),
        'system',
        null,
        null
    ),
    -- 目标项目管理
    (
        110,
        'lowcode',
        '目标项目管理',
        1,
        'mdi:folder-cog',
        'lowcode_target-project',
        '/lowcode/target-project',
        'view.amis-template',
        null,
        'ENABLED',
        null,
        false,
        100,
        10,
        'route.lowcode_target-project',
        true,
        false,
        null,
        false,
        'target-project-page',
        NOW(),
        'system',
        null,
        null
    );

-- 为超级管理员角色添加新菜单权限
-- 注意：这里假设超级管理员角色ID为'1'，domain为'soybean'
INSERT INTO
    backend.sys_role_menu (role_id, menu_id, domain)
VALUES ('1', 100, 'soybean'), -- 低代码平台主菜单
    ('1', 101, 'soybean'), -- 项目管理 - 创建项目：定义项目基本信息和配置
    ('1', 102, 'soybean'), -- 实体管理 - 设计实体：创建业务实体和数据模型
    ('1', 103, 'soybean'), -- 字段管理 - 管理字段：定义字段类型、验证规则、UI配置
    ('1', 104, 'soybean'), -- 关系管理 - 配置关系：设置实体间的关联关系
    ('1', 105, 'soybean'), -- 查询管理 - 编写查询：创建复杂的数据查询逻辑
    ('1', 106, 'soybean'), -- API配置 - 配置API：定义RESTful API接口
    ('1', 107, 'soybean'), -- API测试 - 测试API：在线测试API功能
    ('1', 108, 'soybean'), -- 模板管理 - 管理模板：维护代码生成模板
    ('1', 109, 'soybean'), -- 代码生成器 - 生成代码：一键生成NestJS业务服务
    ('1', 110, 'soybean');
-- 目标项目管理

-- 为管理员角色添加新菜单权限（如果存在管理员角色）
INSERT INTO
    backend.sys_role_menu (role_id, menu_id, domain)
SELECT 'admin-role-001', menu_id, 'soybean'
FROM (
        VALUES (100), (101), (102), (103), (104), (105), (106), (107), (108), (109), (110)
    ) AS menu_ids (menu_id)
WHERE
    EXISTS (
        SELECT 1
        FROM public.sys_role
        WHERE
            id = 'admin-role-001'
    );

-- 添加序列更新（确保ID不冲突）
SELECT setval (
        'sys_menu_id_seq', (
            SELECT MAX(id)
            FROM sys_menu
        ), true
    );

-- 插入完成提示
DO $$
BEGIN
    RAISE NOTICE '✅ 低代码平台菜单和权限初始化完成！';
    RAISE NOTICE '📋 已添加以下功能菜单项：';
    RAISE NOTICE '   - 低代码平台 (主菜单)';
    RAISE NOTICE '   - 项目管理 - 创建项目：定义项目基本信息和配置';
    RAISE NOTICE '   - 实体管理 - 设计实体：创建业务实体和数据模型';
    RAISE NOTICE '   - 字段管理 - 管理字段：定义字段类型、验证规则、UI配置';
    RAISE NOTICE '   - 关系管理 - 配置关系：设置实体间的关联关系';
    RAISE NOTICE '   - 查询管理 - 编写查询：创建复杂的数据查询逻辑';
    RAISE NOTICE '   - API配置 - 配置API：定义RESTful API接口';
    RAISE NOTICE '   - API测试 - 测试API：在线测试API功能';
    RAISE NOTICE '   - 模板管理 - 管理模板：维护代码生成模板';
    RAISE NOTICE '   - 代码生成器 - 生成代码：一键生成NestJS业务服务';
    RAISE NOTICE '   - 目标项目管理';
    RAISE NOTICE '🔐 已为超级管理员分配所有权限';
    RAISE NOTICE '🎯 低代码平台功能完整，支持完整的开发流程！';
END $$;