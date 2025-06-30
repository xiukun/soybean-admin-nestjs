-- 插入低代码平台主菜单
INSERT INTO "sys_menu" (
    "menu_type", "menu_name", "icon_type", "icon", "route_name", "route_path", 
    "component", "status", "pid", "sequence", "i18n_key", "keep_alive", 
    "constant", "created_at", "created_by"
) VALUES (
    'directory', '低代码平台', 1, 'icon-park-outline:code-computer', 'lowcode', '/lowcode',
    'layout.base$view.blank', 'ENABLED', 0, 100, 'route.lowcode', false,
    false, CURRENT_TIMESTAMP, 'system'
);

-- 获取刚插入的低代码平台菜单ID
-- 注意：在实际执行时需要替换为实际的菜单ID

-- 插入页面管理子菜单
INSERT INTO "sys_menu" (
    "menu_type", "menu_name", "icon_type", "icon", "route_name", "route_path", 
    "component", "status", "pid", "sequence", "i18n_key", "keep_alive", 
    "constant", "created_at", "created_by"
) VALUES (
    'menu', '页面管理', 1, 'icon-park-outline:page-template', 'lowcode_page', '/lowcode/page',
    'view.lowcode_page', 'ENABLED', (SELECT id FROM "sys_menu" WHERE route_name = 'lowcode'), 1, 'route.lowcode_page', true,
    false, CURRENT_TIMESTAMP, 'system'
);

-- 插入模型管理子菜单
INSERT INTO "sys_menu" (
    "menu_type", "menu_name", "icon_type", "icon", "route_name", "route_path", 
    "component", "status", "pid", "sequence", "i18n_key", "keep_alive", 
    "constant", "created_at", "created_by"
) VALUES (
    'menu', '模型管理', 1, 'icon-park-outline:data-sheet', 'lowcode_model', '/lowcode/model',
    'view.lowcode_model', 'ENABLED', (SELECT id FROM "sys_menu" WHERE route_name = 'lowcode'), 2, 'route.lowcode_model', true,
    false, CURRENT_TIMESTAMP, 'system'
);

-- 插入API管理子菜单
INSERT INTO "sys_menu" (
    "menu_type", "menu_name", "icon_type", "icon", "route_name", "route_path", 
    "component", "status", "pid", "sequence", "i18n_key", "keep_alive", 
    "constant", "created_at", "created_by"
) VALUES (
    'menu', 'API管理', 1, 'icon-park-outline:api', 'lowcode_api', '/lowcode/api',
    'view.lowcode_api', 'ENABLED', (SELECT id FROM "sys_menu" WHERE route_name = 'lowcode'), 3, 'route.lowcode_api', true,
    false, CURRENT_TIMESTAMP, 'system'
);

-- 插入页面预览子菜单
INSERT INTO "sys_menu" (
    "menu_type", "menu_name", "icon_type", "icon", "route_name", "route_path", 
    "component", "status", "pid", "sequence", "i18n_key", "keep_alive", 
    "constant", "created_at", "created_by"
) VALUES (
    'menu', '页面预览', 1, 'icon-park-outline:preview-open', 'lowcode_preview', '/lowcode/preview',
    'view.lowcode_preview', 'ENABLED', (SELECT id FROM "sys_menu" WHERE route_name = 'lowcode'), 4, 'route.lowcode_preview', true,
    false, CURRENT_TIMESTAMP, 'system'
);