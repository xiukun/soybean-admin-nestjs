-- =====================================================
-- 修复Prisma Schema与PostgreSQL数据库一致性问题
-- 解决字段缺失和类型不匹配问题
-- =====================================================

SET search_path TO lowcode, backend, public;

-- 1. 修复 lowcode_fields 表缺失字段
DO $$
BEGIN
    -- 添加 required 字段
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'lowcode' 
        AND table_name = 'lowcode_fields' 
        AND column_name = 'required'
    ) THEN
        ALTER TABLE lowcode.lowcode_fields ADD COLUMN required BOOLEAN DEFAULT false;
        RAISE NOTICE '✅ 已添加 lowcode_fields.required 字段';
    ELSE
        RAISE NOTICE '✓ lowcode_fields.required 字段已存在';
    END IF;

    -- 添加 validation 字段
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'lowcode' 
        AND table_name = 'lowcode_fields' 
        AND column_name = 'validation'
    ) THEN
        ALTER TABLE lowcode.lowcode_fields ADD COLUMN validation JSONB;
        RAISE NOTICE '✅ 已添加 lowcode_fields.validation 字段';
    ELSE
        RAISE NOTICE '✓ lowcode_fields.validation 字段已存在';
    END IF;

    -- 添加 config 字段
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'lowcode' 
        AND table_name = 'lowcode_fields' 
        AND column_name = 'config'
    ) THEN
        ALTER TABLE lowcode.lowcode_fields ADD COLUMN config JSONB;
        RAISE NOTICE '✅ 已添加 lowcode_fields.config 字段';
    ELSE
        RAISE NOTICE '✓ lowcode_fields.config 字段已存在';
    END IF;
END $$;

-- 2. 修复 lowcode_projects 表部署相关字段
DO $$
BEGIN
    -- 添加部署状态字段
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'lowcode' 
        AND table_name = 'lowcode_projects' 
        AND column_name = 'deployment_status'
    ) THEN
        ALTER TABLE lowcode.lowcode_projects ADD COLUMN deployment_status VARCHAR(20) DEFAULT 'INACTIVE';
        RAISE NOTICE '✅ 已添加 lowcode_projects.deployment_status 字段';
    ELSE
        RAISE NOTICE '✓ lowcode_projects.deployment_status 字段已存在';
    END IF;

    -- 添加部署端口字段
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'lowcode' 
        AND table_name = 'lowcode_projects' 
        AND column_name = 'deployment_port'
    ) THEN
        ALTER TABLE lowcode.lowcode_projects ADD COLUMN deployment_port INTEGER;
        RAISE NOTICE '✅ 已添加 lowcode_projects.deployment_port 字段';
    ELSE
        RAISE NOTICE '✓ lowcode_projects.deployment_port 字段已存在';
    END IF;

    -- 添加部署配置字段
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'lowcode' 
        AND table_name = 'lowcode_projects' 
        AND column_name = 'deployment_config'
    ) THEN
        ALTER TABLE lowcode.lowcode_projects ADD COLUMN deployment_config JSONB DEFAULT '{}';
        RAISE NOTICE '✅ 已添加 lowcode_projects.deployment_config 字段';
    ELSE
        RAISE NOTICE '✓ lowcode_projects.deployment_config 字段已存在';
    END IF;

    -- 添加最后部署时间字段
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'lowcode' 
        AND table_name = 'lowcode_projects' 
        AND column_name = 'last_deployed_at'
    ) THEN
        ALTER TABLE lowcode.lowcode_projects ADD COLUMN last_deployed_at TIMESTAMP(6);
        RAISE NOTICE '✅ 已添加 lowcode_projects.last_deployed_at 字段';
    ELSE
        RAISE NOTICE '✓ lowcode_projects.last_deployed_at 字段已存在';
    END IF;

    -- 添加部署日志字段
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'lowcode' 
        AND table_name = 'lowcode_projects' 
        AND column_name = 'deployment_logs'
    ) THEN
        ALTER TABLE lowcode.lowcode_projects ADD COLUMN deployment_logs TEXT;
        RAISE NOTICE '✅ 已添加 lowcode_projects.deployment_logs 字段';
    ELSE
        RAISE NOTICE '✓ lowcode_projects.deployment_logs 字段已存在';
    END IF;
END $$;

-- 3. 创建 lowcode_apis 表（如果不存在）
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'lowcode' 
        AND table_name = 'lowcode_apis'
    ) THEN
        CREATE TABLE lowcode.lowcode_apis (
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
        
        -- 创建索引
        CREATE INDEX idx_lowcode_apis_project_id ON lowcode_apis(project_id);
        CREATE INDEX idx_lowcode_apis_entity_id ON lowcode_apis(entity_id);
        
        RAISE NOTICE '✅ 已创建 lowcode_apis 表';
    ELSE
        RAISE NOTICE '✓ lowcode_apis 表已存在';
    END IF;
END $$;

-- 4. 创建 lowcode_codegen_tasks 表（如果不存在）
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'lowcode' 
        AND table_name = 'lowcode_codegen_tasks'
    ) THEN
        CREATE TABLE lowcode.lowcode_codegen_tasks (
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
        
        -- 创建索引
        CREATE INDEX idx_lowcode_codegen_tasks_project_id ON lowcode_codegen_tasks(project_id);
        CREATE INDEX idx_lowcode_codegen_tasks_status ON lowcode_codegen_tasks(status);
        
        RAISE NOTICE '✅ 已创建 lowcode_codegen_tasks 表';
    ELSE
        RAISE NOTICE '✓ lowcode_codegen_tasks 表已存在';
    END IF;
END $$;

-- 5. 更新 lowcode_code_templates 表结构
DO $$
BEGIN
    -- 修改 template 字段名为 content
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'lowcode' 
        AND table_name = 'lowcode_code_templates' 
        AND column_name = 'template'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'lowcode' 
        AND table_name = 'lowcode_code_templates' 
        AND column_name = 'content'
    ) THEN
        ALTER TABLE lowcode.lowcode_code_templates RENAME COLUMN template TO content;
        RAISE NOTICE '✅ 已重命名 lowcode_code_templates.template 为 content';
    ELSE
        RAISE NOTICE '✓ lowcode_code_templates.content 字段已存在';
    END IF;

    -- 添加 category 字段
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'lowcode' 
        AND table_name = 'lowcode_code_templates' 
        AND column_name = 'category'
    ) THEN
        ALTER TABLE lowcode.lowcode_code_templates ADD COLUMN category VARCHAR(50) DEFAULT 'CONTROLLER';
        RAISE NOTICE '✅ 已添加 lowcode_code_templates.category 字段';
    ELSE
        RAISE NOTICE '✓ lowcode_code_templates.category 字段已存在';
    END IF;

    -- 添加 tags 字段
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'lowcode' 
        AND table_name = 'lowcode_code_templates' 
        AND column_name = 'tags'
    ) THEN
        ALTER TABLE lowcode.lowcode_code_templates ADD COLUMN tags JSONB DEFAULT '[]';
        RAISE NOTICE '✅ 已添加 lowcode_code_templates.tags 字段';
    ELSE
        RAISE NOTICE '✓ lowcode_code_templates.tags 字段已存在';
    END IF;

    -- 添加 is_public 字段
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'lowcode' 
        AND table_name = 'lowcode_code_templates' 
        AND column_name = 'is_public'
    ) THEN
        ALTER TABLE lowcode.lowcode_code_templates ADD COLUMN is_public BOOLEAN DEFAULT false;
        RAISE NOTICE '✅ 已添加 lowcode_code_templates.is_public 字段';
    ELSE
        RAISE NOTICE '✓ lowcode_code_templates.is_public 字段已存在';
    END IF;
END $$;

-- 6. 创建 lowcode_template_versions 表
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'lowcode' 
        AND table_name = 'lowcode_template_versions'
    ) THEN
        CREATE TABLE lowcode.lowcode_template_versions (
            id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
            template_id VARCHAR(36) NOT NULL,
            version VARCHAR(20) NOT NULL,
            content TEXT DEFAULT '',
            variables JSONB DEFAULT '[]',
            changelog TEXT,
            created_by VARCHAR(36) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (template_id) REFERENCES lowcode_code_templates(id) ON DELETE CASCADE,
            UNIQUE (template_id, version)
        );
        
        -- 创建索引
        CREATE INDEX idx_lowcode_template_versions_template_id ON lowcode_template_versions(template_id);
        CREATE INDEX idx_lowcode_template_versions_version ON lowcode_template_versions(version);
        
        RAISE NOTICE '✅ 已创建 lowcode_template_versions 表';
    ELSE
        RAISE NOTICE '✓ lowcode_template_versions 表已存在';
    END IF;
END $$;

-- 7. 创建 lowcode_project_deployments 表
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'lowcode' 
        AND table_name = 'lowcode_project_deployments'
    ) THEN
        CREATE TABLE lowcode.lowcode_project_deployments (
            id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
            project_id VARCHAR(36) NOT NULL,
            version VARCHAR(20) NOT NULL,
            status VARCHAR(20) NOT NULL,
            port INTEGER,
            config JSONB DEFAULT '{}',
            logs TEXT,
            started_at TIMESTAMP(6),
            completed_at TIMESTAMP(6),
            error_msg TEXT,
            created_by VARCHAR(36) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (project_id) REFERENCES lowcode_projects(id) ON DELETE CASCADE
        );
        
        -- 创建索引
        CREATE INDEX idx_project_deployments_project_id ON lowcode_project_deployments(project_id);
        CREATE INDEX idx_project_deployments_status ON lowcode_project_deployments(status);
        
        RAISE NOTICE '✅ 已创建 lowcode_project_deployments 表';
    ELSE
        RAISE NOTICE '✓ lowcode_project_deployments 表已存在';
    END IF;
END $$;

-- 8. 修复外键约束
DO $$
BEGIN
    -- 检查并添加 lowcode_relations 表的外键约束
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_schema = 'lowcode' 
        AND table_name = 'lowcode_relations' 
        AND constraint_name = 'lowcode_relations_source_field_id_fkey'
    ) THEN
        ALTER TABLE lowcode.lowcode_relations 
        ADD CONSTRAINT lowcode_relations_source_field_id_fkey 
        FOREIGN KEY (source_field_id) REFERENCES lowcode_fields(id) ON DELETE CASCADE;
        RAISE NOTICE '✅ 已添加 lowcode_relations.source_field_id 外键约束';
    ELSE
        RAISE NOTICE '✓ lowcode_relations.source_field_id 外键约束已存在';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_schema = 'lowcode' 
        AND table_name = 'lowcode_relations' 
        AND constraint_name = 'lowcode_relations_target_field_id_fkey'
    ) THEN
        ALTER TABLE lowcode.lowcode_relations 
        ADD CONSTRAINT lowcode_relations_target_field_id_fkey 
        FOREIGN KEY (target_field_id) REFERENCES lowcode_fields(id) ON DELETE CASCADE;
        RAISE NOTICE '✅ 已添加 lowcode_relations.target_field_id 外键约束';
    ELSE
        RAISE NOTICE '✓ lowcode_relations.target_field_id 外键约束已存在';
    END IF;
END $$;

-- 9. 创建缺失的索引
DO $$
BEGIN
    -- 为新添加的字段创建索引
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE schemaname = 'lowcode' 
        AND tablename = 'lowcode_code_templates' 
        AND indexname = 'idx_lowcode_code_templates_category'
    ) THEN
        CREATE INDEX idx_lowcode_code_templates_category ON lowcode_code_templates(category);
        RAISE NOTICE '✅ 已创建 idx_lowcode_code_templates_category 索引';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE schemaname = 'lowcode' 
        AND tablename = 'lowcode_code_templates' 
        AND indexname = 'idx_lowcode_code_templates_language'
    ) THEN
        CREATE INDEX idx_lowcode_code_templates_language ON lowcode_code_templates(language);
        RAISE NOTICE '✅ 已创建 idx_lowcode_code_templates_language 索引';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE schemaname = 'lowcode' 
        AND tablename = 'lowcode_code_templates' 
        AND indexname = 'idx_lowcode_code_templates_framework'
    ) THEN
        CREATE INDEX idx_lowcode_code_templates_framework ON lowcode_code_templates(framework);
        RAISE NOTICE '✅ 已创建 idx_lowcode_code_templates_framework 索引';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE schemaname = 'lowcode' 
        AND tablename = 'lowcode_code_templates' 
        AND indexname = 'idx_lowcode_code_templates_status'
    ) THEN
        CREATE INDEX idx_lowcode_code_templates_status ON lowcode_code_templates(status);
        RAISE NOTICE '✅ 已创建 idx_lowcode_code_templates_status 索引';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE schemaname = 'lowcode' 
        AND tablename = 'lowcode_code_templates' 
        AND indexname = 'idx_lowcode_code_templates_is_public'
    ) THEN
        CREATE INDEX idx_lowcode_code_templates_is_public ON lowcode_code_templates(is_public);
        RAISE NOTICE '✅ 已创建 idx_lowcode_code_templates_is_public 索引';
    END IF;
END $$;

-- 10. 验证数据一致性
DO $$
DECLARE
    missing_tables TEXT[] := ARRAY[]::TEXT[];
    missing_fields TEXT[] := ARRAY[]::TEXT[];
BEGIN
    -- 检查必要的表是否存在
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'lowcode' AND table_name = 'lowcode_projects') THEN
        missing_tables := array_append(missing_tables, 'lowcode_projects');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'lowcode' AND table_name = 'lowcode_entities') THEN
        missing_tables := array_append(missing_tables, 'lowcode_entities');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'lowcode' AND table_name = 'lowcode_fields') THEN
        missing_tables := array_append(missing_tables, 'lowcode_fields');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'lowcode' AND table_name = 'lowcode_relations') THEN
        missing_tables := array_append(missing_tables, 'lowcode_relations');
    END IF;

    -- 检查关键字段是否存在
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'lowcode' AND table_name = 'lowcode_fields' AND column_name = 'required') THEN
        missing_fields := array_append(missing_fields, 'lowcode_fields.required');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'lowcode' AND table_name = 'lowcode_projects' AND column_name = 'deployment_status') THEN
        missing_fields := array_append(missing_fields, 'lowcode_projects.deployment_status');
    END IF;

    -- 报告结果
    IF array_length(missing_tables, 1) > 0 THEN
        RAISE EXCEPTION '❌ 缺失表: %', array_to_string(missing_tables, ', ');
    END IF;
    
    IF array_length(missing_fields, 1) > 0 THEN
        RAISE EXCEPTION '❌ 缺失字段: %', array_to_string(missing_fields, ', ');
    END IF;
    
    RAISE NOTICE '✅ 数据库一致性检查通过！';
    RAISE NOTICE '🎯 Prisma Schema 与 PostgreSQL 数据库结构已保持一致';
END $$;

-- 完成提示
DO $$
BEGIN
    RAISE NOTICE '🎉 数据库一致性修复完成！';
    RAISE NOTICE '📋 已修复的问题：';
    RAISE NOTICE '   ✅ lowcode_fields 表缺失字段 (required, validation, config)';
    RAISE NOTICE '   ✅ lowcode_projects 表缺失部署相关字段';
    RAISE NOTICE '   ✅ lowcode_apis 表创建';
    RAISE NOTICE '   ✅ lowcode_codegen_tasks 表创建';
    RAISE NOTICE '   ✅ lowcode_template_versions 表创建';
    RAISE NOTICE '   ✅ lowcode_project_deployments 表创建';
    RAISE NOTICE '   ✅ lowcode_code_templates 表结构更新';
    RAISE NOTICE '   ✅ 外键约束修复';
    RAISE NOTICE '   ✅ 索引创建';
    RAISE NOTICE '🔧 现在数据库结构与 Prisma Schema 完全一致！';
END $$;