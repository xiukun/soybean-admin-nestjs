-- 低代码平台数据库表结构
-- Low-code Platform Database Tables

-- 项目管理表
CREATE TABLE IF NOT EXISTS lowcode_projects (
    id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    version VARCHAR(20) DEFAULT '1.0.0',
    config JSONB DEFAULT '{}',
    status VARCHAR(20) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE', 'ARCHIVED')),
    created_by VARCHAR(36) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_by VARCHAR(36),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 实体管理表
CREATE TABLE IF NOT EXISTS lowcode_entities (
    id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    project_id VARCHAR(36) NOT NULL,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(100) NOT NULL,
    table_name VARCHAR(100) NOT NULL,
    description TEXT,
    category VARCHAR(50),
    diagram_position JSONB,
    config JSONB DEFAULT '{}',
    version VARCHAR(20) DEFAULT '1.0.0',
    status VARCHAR(20) DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'PUBLISHED', 'DEPRECATED')),
    created_by VARCHAR(36) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_by VARCHAR(36),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES lowcode_projects(id) ON DELETE CASCADE,
    UNIQUE (project_id, code),
    UNIQUE (project_id, table_name)
);

-- 字段管理表
CREATE TABLE IF NOT EXISTS lowcode_fields (
    id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    entity_id VARCHAR(36) NOT NULL,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(100) NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('STRING', 'INTEGER', 'DECIMAL', 'BOOLEAN', 'DATE', 'DATETIME', 'TIME', 'UUID', 'JSON', 'TEXT')),
    length INTEGER,
    precision INTEGER,
    scale INTEGER,
    nullable BOOLEAN DEFAULT true,
    unique_constraint BOOLEAN DEFAULT false,
    indexed BOOLEAN DEFAULT false,
    primary_key BOOLEAN DEFAULT false,
    default_value TEXT,
    validation_rules JSONB,
    reference_config JSONB,
    enum_options JSONB,
    comment TEXT,
    sort_order INTEGER DEFAULT 0,
    created_by VARCHAR(36) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_by VARCHAR(36),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (entity_id) REFERENCES lowcode_entities(id) ON DELETE CASCADE,
    UNIQUE (entity_id, code)
);

-- 关系管理表
CREATE TABLE IF NOT EXISTS lowcode_relations (
    id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    project_id VARCHAR(36) NOT NULL,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(100) NOT NULL,
    description TEXT,
    type VARCHAR(50) NOT NULL CHECK (type IN ('ONE_TO_ONE', 'ONE_TO_MANY', 'MANY_TO_ONE', 'MANY_TO_MANY')),
    source_entity_id VARCHAR(36) NOT NULL,
    source_field_id VARCHAR(36),
    target_entity_id VARCHAR(36) NOT NULL,
    target_field_id VARCHAR(36),
    foreign_key_name VARCHAR(100),
    join_table_config JSONB,
    on_delete VARCHAR(20) DEFAULT 'RESTRICT' CHECK (on_delete IN ('CASCADE', 'SET_NULL', 'RESTRICT', 'NO_ACTION')),
    on_update VARCHAR(20) DEFAULT 'RESTRICT' CHECK (on_update IN ('CASCADE', 'SET_NULL', 'RESTRICT', 'NO_ACTION')),
    config JSONB DEFAULT '{}',
    status VARCHAR(20) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE')),
    indexed BOOLEAN DEFAULT true,
    index_name VARCHAR(100),
    created_by VARCHAR(36) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_by VARCHAR(36),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES lowcode_projects(id) ON DELETE CASCADE,
    FOREIGN KEY (source_entity_id) REFERENCES lowcode_entities(id) ON DELETE CASCADE,
    FOREIGN KEY (source_field_id) REFERENCES lowcode_fields(id) ON DELETE CASCADE,
    FOREIGN KEY (target_entity_id) REFERENCES lowcode_entities(id) ON DELETE CASCADE,
    FOREIGN KEY (target_field_id) REFERENCES lowcode_fields(id) ON DELETE CASCADE,
    UNIQUE (project_id, code)
);

-- API配置管理表
CREATE TABLE IF NOT EXISTS lowcode_api_configs (
    id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    project_id VARCHAR(36) NOT NULL,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(100) NOT NULL,
    description TEXT,
    method VARCHAR(10) NOT NULL CHECK (method IN ('GET', 'POST', 'PUT', 'DELETE', 'PATCH')),
    path VARCHAR(500) NOT NULL,
    entity_id VARCHAR(36),
    parameters JSONB DEFAULT '[]',
    responses JSONB DEFAULT '[]',
    security JSONB DEFAULT '{"type":"none"}',
    config JSONB DEFAULT '{}',
    status VARCHAR(20) DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'PUBLISHED', 'DEPRECATED')),
    version VARCHAR(20) DEFAULT '1.0.0',
    created_by VARCHAR(36) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_by VARCHAR(36),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES lowcode_projects(id) ON DELETE CASCADE,
    FOREIGN KEY (entity_id) REFERENCES lowcode_entities(id) ON DELETE SET NULL,
    UNIQUE (project_id, code),
    UNIQUE (project_id, method, path)
);

-- API管理表
CREATE TABLE IF NOT EXISTS lowcode_apis (
    id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    project_id VARCHAR(36) NOT NULL,
    entity_id VARCHAR(36),
    name VARCHAR(100) NOT NULL,
    code VARCHAR(100) NOT NULL,
    path VARCHAR(200) NOT NULL,
    method VARCHAR(10) NOT NULL CHECK (method IN ('GET', 'POST', 'PUT', 'DELETE', 'PATCH')),
    description TEXT,
    request_config JSONB,
    response_config JSONB,
    query_config JSONB,
    auth_config JSONB,
    version VARCHAR(20) DEFAULT '1.0.0',
    status VARCHAR(20) DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'PUBLISHED', 'DEPRECATED')),
    created_by VARCHAR(36) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_by VARCHAR(36),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES lowcode_projects(id) ON DELETE CASCADE,
    FOREIGN KEY (entity_id) REFERENCES lowcode_entities(id) ON DELETE CASCADE,
    UNIQUE (project_id, code),
    UNIQUE (project_id, path, method)
);

-- 查询管理表
CREATE TABLE IF NOT EXISTS lowcode_queries (
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

-- 代码生成任务表
CREATE TABLE IF NOT EXISTS lowcode_codegen_tasks (
    id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    project_id VARCHAR(36) NOT NULL,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('ENTITY', 'API', 'FULL_PROJECT')),
    config JSONB DEFAULT '{}',
    status VARCHAR(20) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'RUNNING', 'COMPLETED', 'FAILED')),
    progress INTEGER DEFAULT 0,
    result JSONB,
    error_msg TEXT,
    output_path VARCHAR(500),
    created_by VARCHAR(36) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 代码模板表
CREATE TABLE IF NOT EXISTS lowcode_code_templates (
    id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(100) UNIQUE NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('ENTITY_MODEL', 'ENTITY_DTO', 'ENTITY_SERVICE', 'ENTITY_CONTROLLER', 'API_CONTROLLER')),
    language VARCHAR(20) NOT NULL CHECK (language IN ('TYPESCRIPT', 'JAVASCRIPT', 'JAVA', 'PYTHON')),
    framework VARCHAR(50) NOT NULL CHECK (framework IN ('NESTJS', 'EXPRESS', 'SPRING_BOOT', 'FASTAPI')),
    description TEXT,
    template TEXT NOT NULL,
    variables JSONB DEFAULT '[]',
    version VARCHAR(20) DEFAULT '1.0.0',
    status VARCHAR(20) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE')),
    created_by VARCHAR(36) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_by VARCHAR(36),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_lowcode_entities_project_id ON lowcode_entities(project_id);
CREATE INDEX IF NOT EXISTS idx_lowcode_entities_status ON lowcode_entities(status);
CREATE INDEX IF NOT EXISTS idx_lowcode_fields_entity_id ON lowcode_fields(entity_id);
CREATE INDEX IF NOT EXISTS idx_lowcode_relations_project_id ON lowcode_relations(project_id);
CREATE INDEX IF NOT EXISTS idx_lowcode_relations_source_entity ON lowcode_relations(source_entity_id);
CREATE INDEX IF NOT EXISTS idx_lowcode_relations_target_entity ON lowcode_relations(target_entity_id);
CREATE INDEX IF NOT EXISTS idx_lowcode_api_configs_project_id ON lowcode_api_configs(project_id);
CREATE INDEX IF NOT EXISTS idx_lowcode_apis_project_id ON lowcode_apis(project_id);
CREATE INDEX IF NOT EXISTS idx_lowcode_apis_entity_id ON lowcode_apis(entity_id);
CREATE INDEX IF NOT EXISTS idx_lowcode_queries_project_id ON lowcode_queries(project_id);
CREATE INDEX IF NOT EXISTS idx_lowcode_queries_base_entity_id ON lowcode_queries(base_entity_id);
CREATE INDEX IF NOT EXISTS idx_lowcode_queries_status ON lowcode_queries(status);
CREATE INDEX IF NOT EXISTS idx_lowcode_codegen_tasks_project_id ON lowcode_codegen_tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_lowcode_codegen_tasks_status ON lowcode_codegen_tasks(status);

-- 创建更新时间触发器函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 为所有表添加更新时间触发器
CREATE TRIGGER update_lowcode_projects_updated_at BEFORE UPDATE ON lowcode_projects FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_lowcode_entities_updated_at BEFORE UPDATE ON lowcode_entities FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_lowcode_fields_updated_at BEFORE UPDATE ON lowcode_fields FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_lowcode_relations_updated_at BEFORE UPDATE ON lowcode_relations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_lowcode_api_configs_updated_at BEFORE UPDATE ON lowcode_api_configs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_lowcode_apis_updated_at BEFORE UPDATE ON lowcode_apis FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_lowcode_queries_updated_at BEFORE UPDATE ON lowcode_queries FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_lowcode_codegen_tasks_updated_at BEFORE UPDATE ON lowcode_codegen_tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_lowcode_code_templates_updated_at BEFORE UPDATE ON lowcode_code_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 添加表注释
COMMENT ON TABLE lowcode_projects IS '低代码平台项目表';
COMMENT ON TABLE lowcode_entities IS '低代码平台实体表';
COMMENT ON TABLE lowcode_fields IS '低代码平台字段表';
COMMENT ON TABLE lowcode_relations IS '低代码平台关系表';
COMMENT ON TABLE lowcode_api_configs IS '低代码平台API配置表';
COMMENT ON TABLE lowcode_apis IS '低代码平台API表';
COMMENT ON TABLE lowcode_queries IS '低代码平台查询管理表';
COMMENT ON TABLE lowcode_codegen_tasks IS '低代码平台代码生成任务表';
COMMENT ON TABLE lowcode_code_templates IS '低代码平台代码模板表';
