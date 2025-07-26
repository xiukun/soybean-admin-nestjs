-- Prisma Schema 更新
-- 确保所有必要的表和字段都存在
SET search_path TO backend, lowcode, public;

-- 检查并创建缺失的表和字段
-- 这个脚本确保数据库结构与Prisma schema保持一致

-- 1. 检查 sys_menu 表是否有 lowcode_page_id 字段
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'backend' 
        AND table_name = 'sys_menu' 
        AND column_name = 'lowcode_page_id'
    ) THEN
        ALTER TABLE backend.sys_menu ADD COLUMN lowcode_page_id VARCHAR(36);
        RAISE NOTICE '✅ 已添加 sys_menu.lowcode_page_id 字段';
    ELSE
        RAISE NOTICE '✓ sys_menu.lowcode_page_id 字段已存在';
    END IF;
END $$;

-- 2. 检查 sys_lowcode_page 表是否存在
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'backend' 
        AND table_name = 'sys_lowcode_page'
    ) THEN
        CREATE TABLE backend.sys_lowcode_page (
            id VARCHAR(36) PRIMARY KEY,
            name VARCHAR(100) NOT NULL,
            title VARCHAR(100) NOT NULL,
            code VARCHAR(100) UNIQUE NOT NULL,
            description TEXT,
            schema JSONB NOT NULL,
            status VARCHAR(20) DEFAULT 'ENABLED' CHECK (status IN ('ENABLED', 'DISABLED')),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            created_by VARCHAR(36) NOT NULL,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_by VARCHAR(36)
        );
        RAISE NOTICE '✅ 已创建 sys_lowcode_page 表';
    ELSE
        RAISE NOTICE '✓ sys_lowcode_page 表已存在';
    END IF;
END $$;

-- 3. 检查 sys_lowcode_page_version 表是否存在
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'backend' 
        AND table_name = 'sys_lowcode_page_version'
    ) THEN
        CREATE TABLE backend.sys_lowcode_page_version (
            id VARCHAR(36) PRIMARY KEY,
            page_id VARCHAR(36) NOT NULL,
            version VARCHAR(20) NOT NULL,
            schema JSONB NOT NULL,
            changelog TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            created_by VARCHAR(36) NOT NULL,
            FOREIGN KEY (page_id) REFERENCES backend.sys_lowcode_page(id) ON DELETE CASCADE
        );
        RAISE NOTICE '✅ 已创建 sys_lowcode_page_version 表';
    ELSE
        RAISE NOTICE '✓ sys_lowcode_page_version 表已存在';
    END IF;
END $$;

-- 4. 检查 lowcode schema 是否存在
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.schemata 
        WHERE schema_name = 'lowcode'
    ) THEN
        CREATE SCHEMA lowcode;
        RAISE NOTICE '✅ 已创建 lowcode schema';
    ELSE
        RAISE NOTICE '✓ lowcode schema 已存在';
    END IF;
END $$;

-- 5. 检查 lowcode_projects 表是否存在
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'lowcode' 
        AND table_name = 'lowcode_projects'
    ) THEN
        CREATE TABLE lowcode.lowcode_projects (
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
        RAISE NOTICE '✅ 已创建 lowcode_projects 表';
    ELSE
        RAISE NOTICE '✓ lowcode_projects 表已存在';
    END IF;
END $$;

-- 6. 检查 lowcode_entities 表是否存在
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'lowcode' 
        AND table_name = 'lowcode_entities'
    ) THEN
        CREATE TABLE lowcode.lowcode_entities (
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
            FOREIGN KEY (project_id) REFERENCES lowcode.lowcode_projects(id) ON DELETE CASCADE,
            UNIQUE (project_id, code),
            UNIQUE (project_id, table_name)
        );
        RAISE NOTICE '✅ 已创建 lowcode_entities 表';
    ELSE
        RAISE NOTICE '✓ lowcode_entities 表已存在';
    END IF;
END $$;

-- 7. 检查 lowcode_fields 表是否存在
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'lowcode' 
        AND table_name = 'lowcode_fields'
    ) THEN
        CREATE TABLE lowcode.lowcode_fields (
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
            FOREIGN KEY (entity_id) REFERENCES lowcode.lowcode_entities(id) ON DELETE CASCADE,
            UNIQUE (entity_id, code)
        );
        RAISE NOTICE '✅ 已创建 lowcode_fields 表';
    ELSE
        RAISE NOTICE '✓ lowcode_fields 表已存在';
    END IF;
END $$;

-- 8. 检查 lowcode_relations 表是否存在
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'lowcode' 
        AND table_name = 'lowcode_relations'
    ) THEN
        CREATE TABLE lowcode.lowcode_relations (
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
            FOREIGN KEY (project_id) REFERENCES lowcode.lowcode_projects(id) ON DELETE CASCADE,
            FOREIGN KEY (source_entity_id) REFERENCES lowcode.lowcode_entities(id) ON DELETE CASCADE,
            FOREIGN KEY (target_entity_id) REFERENCES lowcode.lowcode_entities(id) ON DELETE CASCADE,
            UNIQUE (project_id, code)
        );
        RAISE NOTICE '✅ 已创建 lowcode_relations 表';
    ELSE
        RAISE NOTICE '✓ lowcode_relations 表已存在';
    END IF;
END $$;

-- 9. 检查 lowcode_queries 表是否存在
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'lowcode' 
        AND table_name = 'lowcode_queries'
    ) THEN
        CREATE TABLE lowcode.lowcode_queries (
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
            FOREIGN KEY (project_id) REFERENCES lowcode.lowcode_projects(id) ON DELETE CASCADE,
            FOREIGN KEY (base_entity_id) REFERENCES lowcode.lowcode_entities(id) ON DELETE CASCADE,
            UNIQUE (project_id, name)
        );
        RAISE NOTICE '✅ 已创建 lowcode_queries 表';
    ELSE
        RAISE NOTICE '✓ lowcode_queries 表已存在';
    END IF;
END $$;

-- 10. 检查 lowcode_api_configs 表是否存在
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'lowcode' 
        AND table_name = 'lowcode_api_configs'
    ) THEN
        CREATE TABLE lowcode.lowcode_api_configs (
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
            FOREIGN KEY (project_id) REFERENCES lowcode.lowcode_projects(id) ON DELETE CASCADE,
            FOREIGN KEY (entity_id) REFERENCES lowcode.lowcode_entities(id) ON DELETE SET NULL,
            UNIQUE (project_id, code),
            UNIQUE (project_id, method, path)
        );
        RAISE NOTICE '✅ 已创建 lowcode_api_configs 表';
    ELSE
        RAISE NOTICE '✓ lowcode_api_configs 表已存在';
    END IF;
END $$;

-- 11. 检查 lowcode_code_templates 表是否存在
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'lowcode' 
        AND table_name = 'lowcode_code_templates'
    ) THEN
        CREATE TABLE lowcode.lowcode_code_templates (
            id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
            name VARCHAR(100) NOT NULL,
            code VARCHAR(100) UNIQUE NOT NULL,
            type VARCHAR(50) NOT NULL CHECK (type IN ('ENTITY_MODEL', 'ENTITY_DTO', 'ENTITY_SERVICE', 'ENTITY_CONTROLLER', 'ENTITY_REPOSITORY', 'API_CONTROLLER')),
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
        RAISE NOTICE '✅ 已创建 lowcode_code_templates 表';
    ELSE
        RAISE NOTICE '✓ lowcode_code_templates 表已存在';
    END IF;
END $$;

-- 完成提示
DO $$
BEGIN
    RAISE NOTICE '✅ Prisma Schema 更新完成！';
    RAISE NOTICE '📋 已检查并确保以下表结构存在：';
    RAISE NOTICE '   - backend.sys_menu (包含 lowcode_page_id 字段)';
    RAISE NOTICE '   - backend.sys_lowcode_page';
    RAISE NOTICE '   - backend.sys_lowcode_page_version';
    RAISE NOTICE '   - lowcode.lowcode_projects';
    RAISE NOTICE '   - lowcode.lowcode_entities';
    RAISE NOTICE '   - lowcode.lowcode_fields';
    RAISE NOTICE '   - lowcode.lowcode_relations';
    RAISE NOTICE '   - lowcode.lowcode_queries';
    RAISE NOTICE '   - lowcode.lowcode_api_configs';
    RAISE NOTICE '   - lowcode.lowcode_code_templates';
    RAISE NOTICE '🎯 数据库结构与 Prisma Schema 保持一致！';
END $$;
