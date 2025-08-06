-- 多租户基础数据初始化
-- 设置当前schema为backend
SET search_path TO backend, public;

-- 插入默认企业
INSERT INTO backend.enterprise (id, name, description, status, created_at, updated_at) VALUES
('default-enterprise', '默认企业', '系统默认企业，用于初始化和测试', 'ENABLED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (id) DO NOTHING;

-- 插入默认计划
INSERT INTO backend.plan (id, name, description, max_users, max_app_spaces, price_per_month, price_per_year, features, status, created_at, updated_at) VALUES
('basic-plan', '基础版', '适合小型团队的基础功能', 10, 5, 99.00, 999.00, '{"features": ["基础用户管理", "组织架构", "权限控制", "基础报表"]}', 'ENABLED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('pro-plan', '专业版', '适合中型企业的专业功能', 50, 20, 299.00, 2999.00, '{"features": ["高级用户管理", "多级组织架构", "细粒度权限", "高级报表", "API接口"]}', 'ENABLED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('enterprise-plan', '企业版', '适合大型企业的全功能版本', 500, 100, 999.00, 9999.00, '{"features": ["无限用户管理", "复杂组织架构", "自定义权限", "实时报表", "完整API", "专属支持"]}', 'ENABLED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (id) DO NOTHING;

-- 插入默认租户
INSERT INTO backend.tenant (id, name, description, status, enterprise_id, plan_id, created_at, updated_at) VALUES
('default-tenant', '默认租户', '系统默认租户，用于初始化和测试', 'ENABLED', 'default-enterprise', 'basic-plan', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('demo-tenant', '演示租户', '用于演示多租户功能的租户', 'ENABLED', 'default-enterprise', 'pro-plan', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (id) DO NOTHING;

-- 插入默认应用空间
INSERT INTO backend.app_space (id, name, description, tenant_id, created_at, updated_at) VALUES
('default-app-space', '默认应用空间', '默认租户的主要应用空间', 'default-tenant', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('demo-app-space', '演示应用空间', '演示租户的应用空间', 'demo-tenant', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (id) DO NOTHING;

-- 插入默认用户组
INSERT INTO backend.user_group (id, name, description, tenant_id, created_at, updated_at) VALUES
('default-admin-group', '管理员组', '默认租户的管理员用户组', 'default-tenant', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('default-user-group', '普通用户组', '默认租户的普通用户组', 'default-tenant', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('demo-admin-group', '演示管理员组', '演示租户的管理员用户组', 'demo-tenant', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (id) DO NOTHING;

-- 更新现有用户的租户ID（将内置用户分配给默认租户）
UPDATE backend.sys_user 
SET tenant_id = 'default-tenant' 
WHERE built_in = true AND tenant_id IS NULL;

-- 更新现有组织的租户ID（将现有组织分配给默认租户）
UPDATE backend.sys_organization 
SET tenant_id = 'default-tenant' 
WHERE tenant_id IS NULL;

-- 创建一些测试组织数据
INSERT INTO backend.sys_organization (id, code, name, description, pid, tenant_id, status, created_at, created_by, updated_at, updated_by) VALUES
('demo-org-001', 'DEMO_ORG_001', '演示组织001', '演示租户的测试组织', '0', 'demo-tenant', 'ENABLED', CURRENT_TIMESTAMP, '-1', NULL, NULL),
('demo-org-002', 'DEMO_ORG_002', '演示组织002', '演示租户的另一个测试组织', '0', 'demo-tenant', 'ENABLED', CURRENT_TIMESTAMP, '-1', NULL, NULL)
ON CONFLICT (id) DO NOTHING;

COMMIT;