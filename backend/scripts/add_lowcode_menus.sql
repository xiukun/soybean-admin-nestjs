-- 低代码平台菜单数据插入脚本
-- 执行前请确保数据库连接正常，并备份现有数据
-- 注意：ID从100开始，避免与ID 80的低代码页面示例冲突

-- 插入低代码平台主菜单（目录）
INSERT INTO "sys_menu" (
    "id", "menu_type", "menu_name", "icon_type", "icon", "route_name", "route_path",
    "component", "path_param", "status", "active_menu", "hide_in_menu", "pid",
    "sequence", "i18n_key", "keep_alive", "constant", "href", "multi_tab",
    "lowcode_page_id", "created_by", "updated_at", "updated_by"
) VALUES (
    100, 'directory', 'lowcode', 1, 'carbon:application-web', 'lowcode', '/lowcode',
    'layout.base', NULL, 'ENABLED', NULL, false, 0,
    5, 'route.lowcode', false, false, NULL, false,
    NULL, '-1', NULL, NULL
);

-- 插入项目管理菜单
INSERT INTO "sys_menu" (
    "id", "menu_type", "menu_name", "icon_type", "icon", "route_name", "route_path",
    "component", "path_param", "status", "active_menu", "hide_in_menu", "pid",
    "sequence", "i18n_key", "keep_alive", "constant", "href", "multi_tab",
    "lowcode_page_id", "created_by", "updated_at", "updated_by"
) VALUES (
    101, 'menu', 'lowcode_project', 1, 'carbon:folder-details', 'lowcode_project', '/lowcode/project',
    'view.lowcode_project', NULL, 'ENABLED', NULL, false, 100,
    1, 'route.lowcode_project', false, false, NULL, false,
    NULL, '-1', NULL, NULL
);

-- 插入实体管理菜单
INSERT INTO "sys_menu" (
    "id", "menu_type", "menu_name", "icon_type", "icon", "route_name", "route_path",
    "component", "path_param", "status", "active_menu", "hide_in_menu", "pid",
    "sequence", "i18n_key", "keep_alive", "constant", "href", "multi_tab",
    "lowcode_page_id", "created_by", "updated_at", "updated_by"
) VALUES (
    102, 'menu', 'lowcode_entity', 1, 'carbon:data-table', 'lowcode_entity', '/lowcode/entity',
    'view.lowcode_entity', NULL, 'ENABLED', NULL, false, 100,
    2, 'route.lowcode_entity', false, false, NULL, false,
    NULL, '-1', NULL, NULL
);

-- 插入字段管理菜单
INSERT INTO "sys_menu" (
    "id", "menu_type", "menu_name", "icon_type", "icon", "route_name", "route_path",
    "component", "path_param", "status", "active_menu", "hide_in_menu", "pid",
    "sequence", "i18n_key", "keep_alive", "constant", "href", "multi_tab",
    "lowcode_page_id", "created_by", "updated_at", "updated_by"
) VALUES (
    103, 'menu', 'lowcode_field', 1, 'carbon:text-column', 'lowcode_field', '/lowcode/field',
    'view.lowcode_field', NULL, 'ENABLED', NULL, false, 100,
    3, 'route.lowcode_field', false, false, NULL, false,
    NULL, '-1', NULL, NULL
);

-- 插入关系管理菜单
INSERT INTO "sys_menu" (
    "id", "menu_type", "menu_name", "icon_type", "icon", "route_name", "route_path",
    "component", "path_param", "status", "active_menu", "hide_in_menu", "pid",
    "sequence", "i18n_key", "keep_alive", "constant", "href", "multi_tab",
    "lowcode_page_id", "created_by", "updated_at", "updated_by"
) VALUES (
    104, 'menu', 'lowcode_relationship', 1, 'carbon:connect', 'lowcode_relationship', '/lowcode/relationship',
    'view.lowcode_relationship', NULL, 'ENABLED', NULL, false, 100,
    4, 'route.lowcode_relationship', false, false, NULL, false,
    NULL, '-1', NULL, NULL
);

-- 插入查询管理菜单
INSERT INTO "sys_menu" (
    "id", "menu_type", "menu_name", "icon_type", "icon", "route_name", "route_path",
    "component", "path_param", "status", "active_menu", "hide_in_menu", "pid",
    "sequence", "i18n_key", "keep_alive", "constant", "href", "multi_tab",
    "lowcode_page_id", "created_by", "updated_at", "updated_by"
) VALUES (
    105, 'menu', 'lowcode_query', 1, 'carbon:search', 'lowcode_query', '/lowcode/query',
    'view.lowcode_query', NULL, 'ENABLED', NULL, false, 100,
    5, 'route.lowcode_query', false, false, NULL, false,
    NULL, '-1', NULL, NULL
);

-- 插入API配置菜单
INSERT INTO "sys_menu" (
    "id", "menu_type", "menu_name", "icon_type", "icon", "route_name", "route_path",
    "component", "path_param", "status", "active_menu", "hide_in_menu", "pid",
    "sequence", "i18n_key", "keep_alive", "constant", "href", "multi_tab",
    "lowcode_page_id", "created_by", "updated_at", "updated_by"
) VALUES (
    106, 'menu', 'lowcode_api-config', 1, 'carbon:api', 'lowcode_api-config', '/lowcode/api-config',
    'view.lowcode_api-config', NULL, 'ENABLED', NULL, false, 100,
    6, 'route.lowcode_api-config', false, false, NULL, false,
    NULL, '-1', NULL, NULL
);

-- 插入API测试菜单
INSERT INTO "sys_menu" (
    "id", "menu_type", "menu_name", "icon_type", "icon", "route_name", "route_path",
    "component", "path_param", "status", "active_menu", "hide_in_menu", "pid",
    "sequence", "i18n_key", "keep_alive", "constant", "href", "multi_tab",
    "lowcode_page_id", "created_by", "updated_at", "updated_by"
) VALUES (
    107, 'menu', 'lowcode_api-test', 1, 'carbon:test-tool', 'lowcode_api-test', '/lowcode/api-test',
    'view.lowcode_api-test', NULL, 'ENABLED', NULL, false, 100,
    7, 'route.lowcode_api-test', false, false, NULL, false,
    NULL, '-1', NULL, NULL
);

-- 插入模板管理菜单
INSERT INTO "sys_menu" (
    "id", "menu_type", "menu_name", "icon_type", "icon", "route_name", "route_path",
    "component", "path_param", "status", "active_menu", "hide_in_menu", "pid",
    "sequence", "i18n_key", "keep_alive", "constant", "href", "multi_tab",
    "lowcode_page_id", "created_by", "updated_at", "updated_by"
) VALUES (
    108, 'menu', 'lowcode_template', 1, 'carbon:template', 'lowcode_template', '/lowcode/template',
    'view.lowcode_template', NULL, 'ENABLED', NULL, false, 100,
    8, 'route.lowcode_template', false, false, NULL, false,
    NULL, '-1', NULL, NULL
);

-- 插入代码生成菜单
INSERT INTO "sys_menu" (
    "id", "menu_type", "menu_name", "icon_type", "icon", "route_name", "route_path",
    "component", "path_param", "status", "active_menu", "hide_in_menu", "pid",
    "sequence", "i18n_key", "keep_alive", "constant", "href", "multi_tab",
    "lowcode_page_id", "created_by", "updated_at", "updated_by"
) VALUES (
    109, 'menu', 'lowcode_code-generation', 1, 'carbon:code', 'lowcode_code-generation', '/lowcode/code-generation',
    'view.lowcode_code-generation', NULL, 'ENABLED', NULL, false, 100,
    9, 'route.lowcode_code-generation', false, false, NULL, false,
    NULL, '-1', NULL, NULL
);

-- 为管理员角色（roleId='1'）添加低代码平台菜单权限
INSERT INTO "sys_role_menu" ("role_id", "menu_id", "domain") VALUES ('1', 100, 'built-in');
INSERT INTO "sys_role_menu" ("role_id", "menu_id", "domain") VALUES ('1', 101, 'built-in');
INSERT INTO "sys_role_menu" ("role_id", "menu_id", "domain") VALUES ('1', 102, 'built-in');
INSERT INTO "sys_role_menu" ("role_id", "menu_id", "domain") VALUES ('1', 103, 'built-in');
INSERT INTO "sys_role_menu" ("role_id", "menu_id", "domain") VALUES ('1', 104, 'built-in');
INSERT INTO "sys_role_menu" ("role_id", "menu_id", "domain") VALUES ('1', 105, 'built-in');
INSERT INTO "sys_role_menu" ("role_id", "menu_id", "domain") VALUES ('1', 106, 'built-in');
INSERT INTO "sys_role_menu" ("role_id", "menu_id", "domain") VALUES ('1', 107, 'built-in');
INSERT INTO "sys_role_menu" ("role_id", "menu_id", "domain") VALUES ('1', 108, 'built-in');
INSERT INTO "sys_role_menu" ("role_id", "menu_id", "domain") VALUES ('1', 109, 'built-in');

-- 验证插入结果
SELECT
    m.id,
    m.menu_name,
    m.route_name,
    m.route_path,
    m.i18n_key,
    m.pid,
    m.sequence,
    m.status
FROM sys_menu m
WHERE m.id >= 100
ORDER BY m.pid, m.sequence;

-- 验证角色菜单权限
SELECT
    rm.role_id,
    rm.menu_id,
    m.menu_name,
    rm.domain
FROM sys_role_menu rm
JOIN sys_menu m ON rm.menu_id = m.id
WHERE rm.menu_id >= 100
ORDER BY rm.menu_id;
