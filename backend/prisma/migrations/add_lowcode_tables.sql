-- 低代码平台数据库迁移脚本
-- 执行此脚本前请备份数据库

-- 1. 为菜单表添加低代码页面关联字段
ALTER TABLE sys_menu ADD COLUMN IF NOT EXISTS lowcode_page_id VARCHAR(36);

-- 2. 创建低代码页面表
CREATE TABLE IF NOT EXISTS sys_lowcode_page (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(100) NOT NULL COMMENT '页面名称',
    title VARCHAR(100) NOT NULL COMMENT '页面标题',
    code VARCHAR(100) UNIQUE NOT NULL COMMENT '页面代码',
    description TEXT COMMENT '页面描述',
    schema JSON NOT NULL COMMENT 'AMIS JSON Schema',
    status ENUM('ENABLED', 'DISABLED') DEFAULT 'ENABLED' COMMENT '页面状态',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    created_by VARCHAR(255) NOT NULL COMMENT '创建人',
    updated_at TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    updated_by VARCHAR(255) NULL COMMENT '更新人',
    
    INDEX idx_code (code),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='低代码页面表';

-- 3. 创建低代码页面版本表
CREATE TABLE IF NOT EXISTS sys_lowcode_page_version (
    id VARCHAR(36) PRIMARY KEY,
    page_id VARCHAR(36) NOT NULL COMMENT '页面ID',
    version VARCHAR(20) NOT NULL COMMENT '版本号',
    schema JSON NOT NULL COMMENT 'AMIS JSON Schema',
    changelog TEXT COMMENT '变更日志',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    created_by VARCHAR(255) NOT NULL COMMENT '创建人',
    
    INDEX idx_page_id (page_id),
    INDEX idx_version (version),
    INDEX idx_created_at (created_at),
    
    FOREIGN KEY (page_id) REFERENCES sys_lowcode_page(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='低代码页面版本表';

-- 4. 为菜单表添加外键约束（可选）
-- ALTER TABLE sys_menu ADD CONSTRAINT fk_menu_lowcode_page 
-- FOREIGN KEY (lowcode_page_id) REFERENCES sys_lowcode_page(id) ON DELETE SET NULL;

-- 5. 插入示例数据（可选）
INSERT IGNORE INTO sys_lowcode_page (id, name, title, code, description, schema, status, created_by) VALUES
('lowcode-demo-1', '用户管理页面', '用户管理', 'user-management', '用于管理系统用户的低代码页面', 
 JSON_OBJECT(
   'type', 'page',
   'title', '用户管理',
   'body', JSON_ARRAY(
     JSON_OBJECT(
       'type', 'crud',
       'api', '/api/users',
       'columns', JSON_ARRAY(
         JSON_OBJECT('name', 'id', 'label', 'ID', 'type', 'text'),
         JSON_OBJECT('name', 'username', 'label', '用户名', 'type', 'text'),
         JSON_OBJECT('name', 'email', 'label', '邮箱', 'type', 'text'),
         JSON_OBJECT('name', 'status', 'label', '状态', 'type', 'status')
       )
     )
   )
 ), 
 'ENABLED', 'system'),

('lowcode-demo-2', '数据统计页面', '数据统计', 'data-statistics', '数据统计和图表展示页面',
 JSON_OBJECT(
   'type', 'page',
   'title', '数据统计',
   'body', JSON_ARRAY(
     JSON_OBJECT(
       'type', 'grid',
       'columns', JSON_ARRAY(
         JSON_OBJECT(
           'type', 'panel',
           'title', '用户统计',
           'body', JSON_ARRAY(
             JSON_OBJECT(
               'type', 'tpl',
               'tpl', '<div class="text-center"><h2 class="text-info">1,234</h2><p>总用户数</p></div>'
             )
           )
         ),
         JSON_OBJECT(
           'type', 'panel',
           'title', '订单统计',
           'body', JSON_ARRAY(
             JSON_OBJECT(
               'type', 'tpl',
               'tpl', '<div class="text-center"><h2 class="text-success">5,678</h2><p>总订单数</p></div>'
             )
           )
         )
       )
     )
   )
 ),
 'ENABLED', 'system');

-- 6. 插入版本数据
INSERT IGNORE INTO sys_lowcode_page_version (id, page_id, version, schema, changelog, created_by) VALUES
('version-demo-1', 'lowcode-demo-1', '1.0.0', 
 JSON_OBJECT(
   'type', 'page',
   'title', '用户管理',
   'body', JSON_ARRAY(
     JSON_OBJECT(
       'type', 'crud',
       'api', '/api/users',
       'columns', JSON_ARRAY(
         JSON_OBJECT('name', 'id', 'label', 'ID', 'type', 'text'),
         JSON_OBJECT('name', 'username', 'label', '用户名', 'type', 'text'),
         JSON_OBJECT('name', 'email', 'label', '邮箱', 'type', 'text'),
         JSON_OBJECT('name', 'status', 'label', '状态', 'type', 'status')
       )
     )
   )
 ),
 '初始版本', 'system'),

('version-demo-2', 'lowcode-demo-2', '1.0.0',
 JSON_OBJECT(
   'type', 'page',
   'title', '数据统计',
   'body', JSON_ARRAY(
     JSON_OBJECT(
       'type', 'grid',
       'columns', JSON_ARRAY(
         JSON_OBJECT(
           'type', 'panel',
           'title', '用户统计',
           'body', JSON_ARRAY(
             JSON_OBJECT(
               'type', 'tpl',
               'tpl', '<div class="text-center"><h2 class="text-info">1,234</h2><p>总用户数</p></div>'
             )
           )
         )
       )
     )
   )
 ),
 '初始版本', 'system');

-- 7. 验证数据
SELECT 'Tables created successfully' as status;
SELECT COUNT(*) as lowcode_pages_count FROM sys_lowcode_page;
SELECT COUNT(*) as lowcode_versions_count FROM sys_lowcode_page_version;
