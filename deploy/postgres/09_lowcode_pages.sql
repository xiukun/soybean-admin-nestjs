-- 插入低代码页面示例数据
INSERT INTO public.sys_lowcode_page (id, name, title, code, description, schema, status, created_by) VALUES 
('demo-page-1', '用户管理页面', '用户管理', 'demo-user-management', '演示用户管理功能的低代码页面', 
 '{"type":"page","title":"用户管理","body":[{"type":"crud","api":"/api/users","columns":[{"name":"id","label":"ID","type":"text"},{"name":"username","label":"用户名","type":"text"},{"name":"email","label":"邮箱","type":"text"},{"name":"status","label":"状态","type":"status"}]}]}', 
 'ENABLED', 'system'),
('demo-page-2', '数据仪表板', '仪表板', 'demo-dashboard', '演示数据展示的仪表板页面',
 '{"type":"page","title":"数据仪表板","body":[{"type":"grid","columns":[{"type":"panel","title":"用户统计","body":[{"type":"tpl","tpl":"<div class=\"text-center\"><h2 class=\"text-info\">1,234</h2><p>总用户数</p></div>"}]}]}]}',
 'ENABLED', 'system'),
('demo-page-3', '表单页面', '表单示例', 'demo-form', '演示表单功能的低代码页面',
 '{"type":"page","title":"表单示例","body":[{"type":"form","api":"/api/form","body":[{"type":"input-text","name":"name","label":"姓名","required":true},{"type":"input-email","name":"email","label":"邮箱","required":true},{"type":"textarea","name":"description","label":"描述"}]}]}',
 'ENABLED', 'system');

-- 插入低代码页面版本数据
INSERT INTO public.sys_lowcode_page_version (id, page_id, version, schema, changelog, created_by) VALUES 
('demo-version-1', 'demo-page-1', '1.0.0', 
 '{"type":"page","title":"用户管理","body":[{"type":"crud","api":"/api/users","columns":[{"name":"id","label":"ID","type":"text"},{"name":"username","label":"用户名","type":"text"},{"name":"email","label":"邮箱","type":"text"},{"name":"status","label":"状态","type":"status"}]}]}',
 '初始版本', 'system'),
('demo-version-2', 'demo-page-2', '1.0.0',
 '{"type":"page","title":"数据仪表板","body":[{"type":"grid","columns":[{"type":"panel","title":"用户统计","body":[{"type":"tpl","tpl":"<div class=\"text-center\"><h2 class=\"text-info\">1,234</h2><p>总用户数</p></div>"}]}]}]}',
 '初始版本', 'system'),
('demo-version-3', 'demo-page-3', '1.0.0',
 '{"type":"page","title":"表单示例","body":[{"type":"form","api":"/api/form","body":[{"type":"input-text","name":"name","label":"姓名","required":true},{"type":"input-email","name":"email","label":"邮箱","required":true},{"type":"textarea","name":"description","label":"描述"}]}]}',
 '初始版本', 'system');

-- 添加低代码菜单项（使用修正后的数据）
INSERT INTO public.sys_menu (id, menu_type, menu_name, icon_type, icon, route_name, route_path, component, path_param, status, active_menu, hide_in_menu, pid, sequence, i18n_key, keep_alive, constant, href, multi_tab, lowcode_page_id, created_at, created_by, updated_at, updated_by) VALUES
(80, 'directory', '低代码示例', 1, 'carbon:application-web', 'lowcode-demo', '/lowcode-demo', 'layout.base', null, 'ENABLED', null, false, 0, 5, null, false, false, null, false, null, '2024-05-15 00:00:00.000', 'system', null, null),
(81, 'lowcode', '低代码用户', 1, 'ic:round-manage-accounts', 'lowcode-demo_user', '/lowcode-demo/user', 'view.amis-template', null, 'ENABLED', null, false, 80, 1, null, true, false, null, false, 'demo-page-1', '2024-05-15 00:00:00.000', 'system', null, null),
(82, 'lowcode', '低代码面板', 1, 'mdi:monitor-dashboard', 'lowcode-demo_dashboard', '/lowcode-demo/dashboard', 'view.amis-template', null, 'ENABLED', null, false, 80, 2, null, true, false, null, false, 'demo-page-2', '2024-05-15 00:00:00.000', 'system', null, null),
(83, 'lowcode', '低代码表单', 1, 'carbon:ibm-watsonx-code-assistant-for-z-refactor', 'lowcode-demo_form', '/lowcode-demo/form', 'view.amis-template', null, 'ENABLED', null, false, 80, 3, null, true, false, null, false, 'demo-page-3', '2024-05-15 00:00:00.000', 'system', null, null);

-- 为超级管理员角色添加低代码菜单权限
INSERT INTO public.sys_role_menu (role_id, menu_id, domain) VALUES 
('1', 80, 'soybean'),
('1', 81, 'soybean'),
('1', 82, 'soybean'),
('1', 83, 'soybean');
