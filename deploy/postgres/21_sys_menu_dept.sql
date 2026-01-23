-- 添加部门管理菜单
-- 插入部门管理菜单到系统管理目录下
INSERT INTO public.sys_menu (
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
) VALUES (
  69, 
  'menu', 
  'manage_dept', 
  1, 
  'carbon:building', 
  'manage_dept', 
  '/manage/dept', 
  'view.manage_dept', 
  null, 
  'ENABLED', 
  null, 
  false, 
  54, 
  7, 
  'route.manage_dept', 
  false, 
  false, 
  null, 
  false, 
  null, 
  CURRENT_TIMESTAMP, 
  '-1', 
  null, 
  null
)
ON CONFLICT (id) DO UPDATE SET
  menu_name = EXCLUDED.menu_name,
  route_name = EXCLUDED.route_name,
  route_path = EXCLUDED.route_path,
  component = EXCLUDED.component,
  sequence = EXCLUDED.sequence,
  i18n_key = EXCLUDED.i18n_key,
  icon = EXCLUDED.icon;

-- 为超级管理员角色(role_id='1')授权部门管理菜单
INSERT INTO public.sys_role_menu (role_id, menu_id, domain) 
VALUES ('1', 69, 'built-in')
ON CONFLICT (role_id, menu_id, domain) DO NOTHING;

-- 为管理员角色(role_id='2')授权部门管理菜单（可选）
INSERT INTO public.sys_role_menu (role_id, menu_id, domain) 
VALUES ('2', 69, 'built-in')
ON CONFLICT (role_id, menu_id, domain) DO NOTHING;
