-- Insert product version data
INSERT INTO sys_product_version (id, version_name, version_num, description, status, created_by, created_at) VALUES
('1', '初始版本', '1.0.0', '系统初始版本', 'ENABLED', '-1', '2024-01-01 00:00:00'),
('2', '功能增强版', '1.1.0', '增加了用户管理和权限控制功能', 'DISABLED', '-1', '2024-02-01 00:00:00'),
('3', '性能优化版', '1.2.0', '优化了系统性能，提升了响应速度', 'DISABLED', '-1', '2024-03-01 00:00:00');
