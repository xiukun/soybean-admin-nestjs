-- 为管理员角色分配低代码平台菜单权限
-- 假设管理员角色ID为 'R_SUPER'，域为 'soybean'

-- 分配低代码平台主菜单权限
INSERT INTO "sys_role_menu" ("role_id", "menu_id", "domain")
SELECT 'R_SUPER', id, 'soybean' 
FROM "sys_menu" 
WHERE route_name = 'lowcode';

-- 分配页面管理菜单权限
INSERT INTO "sys_role_menu" ("role_id", "menu_id", "domain")
SELECT 'R_SUPER', id, 'soybean' 
FROM "sys_menu" 
WHERE route_name = 'lowcode_page';

-- 分配模型管理菜单权限
INSERT INTO "sys_role_menu" ("role_id", "menu_id", "domain")
SELECT 'R_SUPER', id, 'soybean' 
FROM "sys_menu" 
WHERE route_name = 'lowcode_model';

-- 分配API管理菜单权限
INSERT INTO "sys_role_menu" ("role_id", "menu_id", "domain")
SELECT 'R_SUPER', id, 'soybean' 
FROM "sys_menu" 
WHERE route_name = 'lowcode_api';

-- 分配页面预览菜单权限
INSERT INTO "sys_role_menu" ("role_id", "menu_id", "domain")
SELECT 'R_SUPER', id, 'soybean' 
FROM "sys_menu" 
WHERE route_name = 'lowcode_preview';