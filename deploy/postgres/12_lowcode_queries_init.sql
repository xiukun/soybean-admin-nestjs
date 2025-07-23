-- Lowcode Platform Schema Tables
SET search_path TO lowcode, backend, public;

-- 低代码平台查询管理初始化脚本
-- Low-code Platform Query Management Initialization Script

-- 确保查询管理表存在
CREATE TABLE IF NOT EXISTS lowcode.lowcode_queries (
    id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    project_id VARCHAR(36) NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    base_entity_id VARCHAR(36) NOT NULL,
    base_entity_alias VARCHAR(50) DEFAULT 'main',
    joins JSONB DEFAULT '[]',
    fields JSONB DEFAULT '[]',
    filters JSONB DEFAULT '[]',
    sorting JSONB DEFAULT '[]',
    group_by JSONB DEFAULT '[]',
    having_conditions JSONB DEFAULT '[]',
    limit_count INTEGER,
    offset_count INTEGER,
    status VARCHAR(20) DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'PUBLISHED', 'DEPRECATED')),
    sql_query TEXT,
    execution_stats JSONB,
    created_by VARCHAR(36) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_by VARCHAR(36),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES lowcode_projects(id) ON DELETE CASCADE,
    FOREIGN KEY (base_entity_id) REFERENCES lowcode_entities(id) ON DELETE CASCADE,
    UNIQUE (project_id, name)
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_lowcode_queries_project_id ON lowcode_queries(project_id);
CREATE INDEX IF NOT EXISTS idx_lowcode_queries_base_entity_id ON lowcode_queries(base_entity_id);
CREATE INDEX IF NOT EXISTS idx_lowcode_queries_status ON lowcode_queries(status);

-- 创建更新时间触发器
DROP TRIGGER IF EXISTS update_lowcode_queries_updated_at ON lowcode_queries;
CREATE TRIGGER update_lowcode_queries_updated_at
    BEFORE UPDATE ON lowcode_queries
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 添加表注释
COMMENT ON TABLE lowcode_queries IS '低代码平台查询管理表';
COMMENT ON COLUMN lowcode_queries.id IS '查询唯一标识';
COMMENT ON COLUMN lowcode_queries.project_id IS '所属项目ID';
COMMENT ON COLUMN lowcode_queries.name IS '查询名称';
COMMENT ON COLUMN lowcode_queries.description IS '查询描述';
COMMENT ON COLUMN lowcode_queries.base_entity_id IS '基础实体ID';
COMMENT ON COLUMN lowcode_queries.base_entity_alias IS '基础实体别名';
COMMENT ON COLUMN lowcode_queries.joins IS '关联配置JSON';
COMMENT ON COLUMN lowcode_queries.fields IS '查询字段配置JSON';
COMMENT ON COLUMN lowcode_queries.filters IS '过滤条件配置JSON';
COMMENT ON COLUMN lowcode_queries.sorting IS '排序配置JSON';
COMMENT ON COLUMN lowcode_queries.group_by IS '分组配置JSON';
COMMENT ON COLUMN lowcode_queries.having_conditions IS 'Having条件配置JSON';
COMMENT ON COLUMN lowcode_queries.limit_count IS '限制返回数量';
COMMENT ON COLUMN lowcode_queries.offset_count IS '偏移量';
COMMENT ON COLUMN lowcode_queries.status IS '查询状态：DRAFT-草稿，PUBLISHED-已发布，DEPRECATED-已废弃';
COMMENT ON COLUMN lowcode_queries.sql_query IS '生成的SQL查询语句';
COMMENT ON COLUMN lowcode_queries.execution_stats IS '执行统计信息JSON';

-- 插入高级示例查询数据
INSERT INTO lowcode.lowcode_queries (id, project_id, name, description, base_entity_id, base_entity_alias, fields, filters, sorting, group_by, status, created_by) VALUES 
-- 复杂用户统计查询
('query-user-status-stats', 'demo-project-1', '用户状态统计', '按用户状态分组统计用户数量和最近注册时间', 'demo-entity-user', 'u',
'[
  {"field":"status","alias":"用户状态","type":"STRING","aggregation":null},
  {"field":"COUNT(*)","alias":"用户数量","type":"INTEGER","aggregation":"COUNT"},
  {"field":"MAX(created_at)","alias":"最近注册时间","type":"DATETIME","aggregation":"MAX"},
  {"field":"MIN(created_at)","alias":"最早注册时间","type":"DATETIME","aggregation":"MIN"}
]',
'[
  {"field":"created_at","operator":"gte","value":"2024-01-01","type":"DATETIME","logic":"AND"}
]',
'[
  {"field":"COUNT(*)","direction":"DESC"},
  {"field":"status","direction":"ASC"}
]',
'[
  {"field":"status"}
]',
'PUBLISHED',
'system'),

-- 用户角色关联查询
('query-user-role-details', 'demo-project-1', '用户角色详情查询', '查询用户详细信息及其关联的所有角色', 'demo-entity-user', 'u',
'[
  {"field":"u.id","alias":"用户ID","type":"UUID"},
  {"field":"u.username","alias":"用户名","type":"STRING"},
  {"field":"u.email","alias":"邮箱","type":"STRING"},
  {"field":"u.nickname","alias":"昵称","type":"STRING"},
  {"field":"u.status","alias":"用户状态","type":"STRING"},
  {"field":"r.name","alias":"角色名称","type":"STRING"},
  {"field":"r.code","alias":"角色编码","type":"STRING"},
  {"field":"r.description","alias":"角色描述","type":"TEXT"}
]',
'[
  {"field":"u.status","operator":"eq","value":"ACTIVE","type":"STRING","logic":"AND"},
  {"field":"r.status","operator":"eq","value":"ACTIVE","type":"STRING","logic":"AND"}
]',
'[
  {"field":"u.username","direction":"ASC"},
  {"field":"r.name","direction":"ASC"}
]',
'[]',
'PUBLISHED',
'system'),

-- 活跃用户分页查询
('query-active-users-paginated', 'demo-project-1', '活跃用户分页查询', '分页查询活跃状态的用户，支持按用户名搜索', 'demo-entity-user', 'user',
'[
  {"field":"id","alias":"用户ID","type":"UUID"},
  {"field":"username","alias":"用户名","type":"STRING"},
  {"field":"email","alias":"邮箱","type":"STRING"},
  {"field":"nickname","alias":"昵称","type":"STRING"},
  {"field":"avatar","alias":"头像","type":"STRING"},
  {"field":"created_at","alias":"注册时间","type":"DATETIME"},
  {"field":"updated_at","alias":"更新时间","type":"DATETIME"}
]',
'[
  {"field":"status","operator":"eq","value":"ACTIVE","type":"STRING","logic":"AND"},
  {"field":"username","operator":"like","value":"%{search}%","type":"STRING","logic":"AND","optional":true}
]',
'[
  {"field":"created_at","direction":"DESC"},
  {"field":"username","direction":"ASC"}
]',
'[]',
'PUBLISHED',
'system');

-- 插入查询执行统计示例数据
UPDATE lowcode.lowcode_queries SET
    execution_stats = '{"totalExecutions":156,"avgExecutionTime":45,"lastExecuted":"2024-07-20T10:30:00Z","errorCount":2,"successRate":98.7}',
    sql_query = 'SELECT status as "用户状态", COUNT(*) as "用户数量", MAX(created_at) as "最近注册时间", MIN(created_at) as "最早注册时间" FROM amis.demo_users u WHERE created_at >= ''2024-01-01'' GROUP BY status ORDER BY COUNT(*) DESC, status ASC'
WHERE id = 'query-user-status-stats';

UPDATE lowcode.lowcode_queries SET
    execution_stats = '{"totalExecutions":89,"avgExecutionTime":78,"lastExecuted":"2024-07-20T09:15:00Z","errorCount":0,"successRate":100}',
    sql_query = 'SELECT u.id as "用户ID", u.username as "用户名", u.email as "邮箱", u.nickname as "昵称", u.status as "用户状态", r.name as "角色名称", r.code as "角色编码", r.description as "角色描述" FROM amis.demo_users u LEFT JOIN amis.demo_user_roles ur ON u.id = ur.user_id LEFT JOIN amis.demo_roles r ON ur.role_id = r.id WHERE u.status = ''ACTIVE'' AND r.status = ''ACTIVE'' ORDER BY u.username ASC, r.name ASC'
WHERE id = 'query-user-role-details';

UPDATE lowcode.lowcode_queries SET
    execution_stats = '{"totalExecutions":234,"avgExecutionTime":32,"lastExecuted":"2024-07-20T11:45:00Z","errorCount":1,"successRate":99.6}',
    sql_query = 'SELECT id as "用户ID", username as "用户名", email as "邮箱", nickname as "昵称", avatar as "头像", created_at as "注册时间", updated_at as "更新时间" FROM amis.demo_users WHERE status = ''ACTIVE'' AND (username LIKE ''%{search}%'' OR ''{search}'' IS NULL) ORDER BY created_at DESC, username ASC'
WHERE id = 'query-active-users-paginated';

-- 创建查询执行日志表（可选）
CREATE TABLE IF NOT EXISTS lowcode_query_execution_logs (
    id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    query_id VARCHAR(36) NOT NULL,
    executed_by VARCHAR(36) NOT NULL,
    execution_time INTEGER NOT NULL, -- 执行时间（毫秒）
    parameters JSONB,
    result_count INTEGER,
    error_message TEXT,
    executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (query_id) REFERENCES lowcode_queries(id) ON DELETE CASCADE
);

-- 为执行日志表创建索引
CREATE INDEX IF NOT EXISTS idx_lowcode_query_logs_query_id ON lowcode_query_execution_logs(query_id);
CREATE INDEX IF NOT EXISTS idx_lowcode_query_logs_executed_at ON lowcode_query_execution_logs(executed_at);
CREATE INDEX IF NOT EXISTS idx_lowcode_query_logs_executed_by ON lowcode_query_execution_logs(executed_by);

-- 添加执行日志表注释
COMMENT ON TABLE lowcode_query_execution_logs IS '低代码平台查询执行日志表';
COMMENT ON COLUMN lowcode_query_execution_logs.query_id IS '查询ID';
COMMENT ON COLUMN lowcode_query_execution_logs.executed_by IS '执行者ID';
COMMENT ON COLUMN lowcode_query_execution_logs.execution_time IS '执行时间（毫秒）';
COMMENT ON COLUMN lowcode_query_execution_logs.parameters IS '执行参数JSON';
COMMENT ON COLUMN lowcode_query_execution_logs.result_count IS '结果数量';
COMMENT ON COLUMN lowcode_query_execution_logs.error_message IS '错误信息';
COMMENT ON COLUMN lowcode_query_execution_logs.executed_at IS '执行时间';
