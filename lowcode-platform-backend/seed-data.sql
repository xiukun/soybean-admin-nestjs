-- 插入Mock数据中的项目
INSERT INTO lowcode.lowcode_projects (id, name, code, description, version, config, status, created_by, created_at, updated_at) VALUES 
('1', 'E-commerce Platform', 'ecommerce', '电商平台低代码项目，包含商品管理、订单处理、用户管理等核心功能', '1.0.0',
'{"framework":"nestjs","architecture":"base-biz","language":"typescript","database":"postgresql","packageName":"","basePackage":"","author":"","outputPath":"./generated"}', 
'ACTIVE', 'admin', '2024-01-01 00:00:00', '2024-01-15 00:00:00'),

('2', 'CRM System', 'crm', '客户关系管理系统，帮助企业管理客户信息、销售流程和客户服务', '1.2.0',
'{"framework":"nestjs","architecture":"ddd","language":"typescript","database":"postgresql","packageName":"","basePackage":"","author":"","outputPath":"./generated"}', 
'ACTIVE', 'admin', '2024-01-10 00:00:00', '2024-01-20 00:00:00'),

('3', 'Blog Management System', 'blog', '博客管理系统，支持文章发布、分类管理、评论系统等功能', '1.0.0',
'{"framework":"express","architecture":"clean","language":"javascript","database":"mysql","packageName":"","basePackage":"","author":"","outputPath":"./generated"}', 
'INACTIVE', 'user1', '2024-02-01 00:00:00', '2024-02-05 00:00:00'),

('4', 'Inventory Management', 'inventory', '库存管理系统，实现商品入库、出库、盘点等库存管理功能', '2.1.0',
'{"framework":"nestjs","architecture":"hexagonal","language":"typescript","database":"postgresql","packageName":"","basePackage":"","author":"","outputPath":"./generated"}', 
'ACTIVE', 'manager', '2024-01-20 00:00:00', '2024-02-10 00:00:00'),

('5', 'HR Management Portal', 'hr-portal', '人力资源管理门户，包含员工信息管理、考勤管理、薪资管理等模块', '1.5.0',
'{"framework":"nestjs","architecture":"base-biz","language":"typescript","database":"postgresql","packageName":"","basePackage":"","author":"","outputPath":"./generated"}', 
'ARCHIVED', 'hr-admin', '2023-12-01 00:00:00', '2024-01-30 00:00:00')

ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  version = EXCLUDED.version,
  config = EXCLUDED.config,
  status = EXCLUDED.status,
  updated_at = EXCLUDED.updated_at;

-- 插入实体
INSERT INTO lowcode.lowcode_entities (id, project_id, name, code, table_name, description, category, config, created_by, created_at, updated_at) VALUES 
-- E-commerce Platform 实体
('entity-ecommerce-product', '1', '商品', 'Product', 'ecommerce_products', '电商平台商品实体，包含商品基本信息', '商品管理', '{"displayName":"商品","icon":"shopping","color":"#1890ff"}', 'admin', '2024-01-01 00:00:00', '2024-01-15 00:00:00'),

('entity-ecommerce-order', '1', '订单', 'Order', 'ecommerce_orders', '电商平台订单实体，管理用户订单信息', '订单管理', '{"displayName":"订单","icon":"file-text","color":"#52c41a"}', 'admin', '2024-01-01 00:00:00', '2024-01-15 00:00:00'),

-- CRM System 实体
('entity-crm-customer', '2', '客户', 'Customer', 'crm_customers', 'CRM系统客户实体，管理客户基本信息', '客户管理', '{"displayName":"客户","icon":"user","color":"#722ed1"}', 'admin', '2024-01-10 00:00:00', '2024-01-20 00:00:00'),

('entity-crm-lead', '2', '销售线索', 'Lead', 'crm_leads', 'CRM系统销售线索实体，跟踪销售机会', '销售管理', '{"displayName":"销售线索","icon":"target","color":"#fa8c16"}', 'admin', '2024-01-10 00:00:00', '2024-01-20 00:00:00'),

-- Blog Management System 实体
('entity-blog-post', '3', '文章', 'Post', 'blog_posts', '博客系统文章实体，管理博客文章', '内容管理', '{"displayName":"文章","icon":"edit","color":"#13c2c2"}', 'user1', '2024-02-01 00:00:00', '2024-02-05 00:00:00'),

-- Inventory Management 实体
('entity-inventory-item', '4', '库存商品', 'InventoryItem', 'inventory_items', '库存管理系统商品实体，跟踪库存信息', '库存管理', '{"displayName":"库存商品","icon":"database","color":"#eb2f96"}', 'manager', '2024-01-20 00:00:00', '2024-02-10 00:00:00'),

-- HR Management Portal 实体
('entity-hr-employee', '5', '员工', 'Employee', 'hr_employees', 'HR系统员工实体，管理员工基本信息', '人员管理', '{"displayName":"员工","icon":"team","color":"#f5222d"}', 'hr-admin', '2023-12-01 00:00:00', '2024-01-30 00:00:00')

ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  category = EXCLUDED.category,
  config = EXCLUDED.config,
  updated_at = EXCLUDED.updated_at;

-- 插入字段
INSERT INTO lowcode.lowcode_fields (id, entity_id, name, code, type, length, nullable, unique_constraint, primary_key, comment, sort_order, created_by, created_at, updated_at) VALUES 
-- Product 字段
('field-product-id', 'entity-ecommerce-product', 'ID', 'id', 'UUID', NULL, false, true, true, '商品唯一标识', 1, 'admin', '2024-01-01 00:00:00', '2024-01-15 00:00:00'),
('field-product-name', 'entity-ecommerce-product', '商品名称', 'name', 'STRING', 100, false, false, false, '商品名称', 2, 'admin', '2024-01-01 00:00:00', '2024-01-15 00:00:00'),
('field-product-price', 'entity-ecommerce-product', '价格', 'price', 'DECIMAL', NULL, false, false, false, '商品价格', 3, 'admin', '2024-01-01 00:00:00', '2024-01-15 00:00:00'),
('field-product-stock', 'entity-ecommerce-product', '库存', 'stock', 'INTEGER', NULL, true, false, false, '库存数量', 4, 'admin', '2024-01-01 00:00:00', '2024-01-15 00:00:00'),

-- Order 字段
('field-order-id', 'entity-ecommerce-order', 'ID', 'id', 'UUID', NULL, false, true, true, '订单唯一标识', 1, 'admin', '2024-01-01 00:00:00', '2024-01-15 00:00:00'),
('field-order-user-id', 'entity-ecommerce-order', '用户ID', 'user_id', 'UUID', NULL, false, false, false, '下单用户ID', 2, 'admin', '2024-01-01 00:00:00', '2024-01-15 00:00:00'),
('field-order-total', 'entity-ecommerce-order', '订单总额', 'total_amount', 'DECIMAL', NULL, false, false, false, '订单总金额', 3, 'admin', '2024-01-01 00:00:00', '2024-01-15 00:00:00'),
('field-order-status', 'entity-ecommerce-order', '订单状态', 'status', 'STRING', 20, false, false, false, '订单状态：PENDING, PAID, SHIPPED, DELIVERED, CANCELLED', 4, 'admin', '2024-01-01 00:00:00', '2024-01-15 00:00:00'),

-- Customer 字段
('field-customer-id', 'entity-crm-customer', 'ID', 'id', 'UUID', NULL, false, true, true, '客户唯一标识', 1, 'admin', '2024-01-10 00:00:00', '2024-01-20 00:00:00'),
('field-customer-name', 'entity-crm-customer', '客户姓名', 'name', 'STRING', 100, false, false, false, '客户姓名', 2, 'admin', '2024-01-10 00:00:00', '2024-01-20 00:00:00'),
('field-customer-email', 'entity-crm-customer', '邮箱', 'email', 'STRING', 100, true, true, false, '客户邮箱', 3, 'admin', '2024-01-10 00:00:00', '2024-01-20 00:00:00'),
('field-customer-phone', 'entity-crm-customer', '电话', 'phone', 'STRING', 20, true, false, false, '客户电话', 4, 'admin', '2024-01-10 00:00:00', '2024-01-20 00:00:00'),
('field-customer-company', 'entity-crm-customer', '公司', 'company', 'STRING', 100, true, false, false, '客户公司', 5, 'admin', '2024-01-10 00:00:00', '2024-01-20 00:00:00')

ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  type = EXCLUDED.type,
  length = EXCLUDED.length,
  nullable = EXCLUDED.nullable,
  unique_constraint = EXCLUDED.unique_constraint,
  primary_key = EXCLUDED.primary_key,
  comment = EXCLUDED.comment,
  sort_order = EXCLUDED.sort_order,
  updated_at = EXCLUDED.updated_at;
