-- 修复字段表结构问题
-- Fix Field Table Schema Issues
-- 执行时间: 2025-07-27

SET search_path TO lowcode, backend, public;

-- 检查并添加缺失的字段
DO $$
BEGIN
    -- 检查 required 字段是否存在
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'lowcode' 
        AND table_name = 'lowcode_fields' 
        AND column_name = 'required'
    ) THEN
        ALTER TABLE lowcode.lowcode_fields ADD COLUMN required BOOLEAN DEFAULT false;
        COMMENT ON COLUMN lowcode.lowcode_fields.required IS '是否必填字段';
    END IF;

    -- 检查 nullable 字段是否存在
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'lowcode' 
        AND table_name = 'lowcode_fields' 
        AND column_name = 'nullable'
    ) THEN
        ALTER TABLE lowcode.lowcode_fields ADD COLUMN nullable BOOLEAN DEFAULT true;
        COMMENT ON COLUMN lowcode.lowcode_fields.nullable IS '是否可为空';
    END IF;

    -- 检查 unique_constraint 字段是否存在
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'lowcode' 
        AND table_name = 'lowcode_fields' 
        AND column_name = 'unique_constraint'
    ) THEN
        ALTER TABLE lowcode.lowcode_fields ADD COLUMN unique_constraint BOOLEAN DEFAULT false;
        COMMENT ON COLUMN lowcode.lowcode_fields.unique_constraint IS '是否唯一约束';
    END IF;

    -- 检查 indexed 字段是否存在
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'lowcode' 
        AND table_name = 'lowcode_fields' 
        AND column_name = 'indexed'
    ) THEN
        ALTER TABLE lowcode.lowcode_fields ADD COLUMN indexed BOOLEAN DEFAULT false;
        COMMENT ON COLUMN lowcode.lowcode_fields.indexed IS '是否建立索引';
    END IF;

    -- 检查 primary_key 字段是否存在
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'lowcode' 
        AND table_name = 'lowcode_fields' 
        AND column_name = 'primary_key'
    ) THEN
        ALTER TABLE lowcode.lowcode_fields ADD COLUMN primary_key BOOLEAN DEFAULT false;
        COMMENT ON COLUMN lowcode.lowcode_fields.primary_key IS '是否主键';
    END IF;

    -- 检查 default_value 字段是否存在
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'lowcode' 
        AND table_name = 'lowcode_fields' 
        AND column_name = 'default_value'
    ) THEN
        ALTER TABLE lowcode.lowcode_fields ADD COLUMN default_value TEXT;
        COMMENT ON COLUMN lowcode.lowcode_fields.default_value IS '默认值';
    END IF;

    -- 检查 validation_rules 字段是否存在
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'lowcode' 
        AND table_name = 'lowcode_fields' 
        AND column_name = 'validation_rules'
    ) THEN
        ALTER TABLE lowcode.lowcode_fields ADD COLUMN validation_rules JSONB;
        COMMENT ON COLUMN lowcode.lowcode_fields.validation_rules IS '验证规则';
    END IF;

    -- 检查 reference_config 字段是否存在
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'lowcode' 
        AND table_name = 'lowcode_fields' 
        AND column_name = 'reference_config'
    ) THEN
        ALTER TABLE lowcode.lowcode_fields ADD COLUMN reference_config JSONB;
        COMMENT ON COLUMN lowcode.lowcode_fields.reference_config IS '引用配置';
    END IF;

    -- 检查 enum_options 字段是否存在
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'lowcode' 
        AND table_name = 'lowcode_fields' 
        AND column_name = 'enum_options'
    ) THEN
        ALTER TABLE lowcode.lowcode_fields ADD COLUMN enum_options JSONB;
        COMMENT ON COLUMN lowcode.lowcode_fields.enum_options IS '枚举选项';
    END IF;

    -- 检查 sort_order 字段是否存在
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'lowcode' 
        AND table_name = 'lowcode_fields' 
        AND column_name = 'sort_order'
    ) THEN
        ALTER TABLE lowcode.lowcode_fields ADD COLUMN sort_order INTEGER DEFAULT 0;
        COMMENT ON COLUMN lowcode.lowcode_fields.sort_order IS '排序顺序';
    END IF;

END $$;

-- 更新项目表，添加部署相关字段
DO $$
BEGIN
    -- 检查 deployment_status 字段是否存在
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'lowcode' 
        AND table_name = 'lowcode_projects' 
        AND column_name = 'deployment_status'
    ) THEN
        ALTER TABLE lowcode.lowcode_projects ADD COLUMN deployment_status VARCHAR(20) DEFAULT 'INACTIVE';
        COMMENT ON COLUMN lowcode.lowcode_projects.deployment_status IS '部署状态';
    END IF;

    -- 检查 deployment_port 字段是否存在
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'lowcode' 
        AND table_name = 'lowcode_projects' 
        AND column_name = 'deployment_port'
    ) THEN
        ALTER TABLE lowcode.lowcode_projects ADD COLUMN deployment_port INTEGER;
        COMMENT ON COLUMN lowcode.lowcode_projects.deployment_port IS '部署端口';
    END IF;

    -- 检查 deployment_config 字段是否存在
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'lowcode' 
        AND table_name = 'lowcode_projects' 
        AND column_name = 'deployment_config'
    ) THEN
        ALTER TABLE lowcode.lowcode_projects ADD COLUMN deployment_config JSONB;
        COMMENT ON COLUMN lowcode.lowcode_projects.deployment_config IS '部署配置';
    END IF;

    -- 检查 last_deployed_at 字段是否存在
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'lowcode' 
        AND table_name = 'lowcode_projects' 
        AND column_name = 'last_deployed_at'
    ) THEN
        ALTER TABLE lowcode.lowcode_projects ADD COLUMN last_deployed_at TIMESTAMP(6);
        COMMENT ON COLUMN lowcode.lowcode_projects.last_deployed_at IS '最后部署时间';
    END IF;

    -- 检查 deployment_logs 字段是否存在
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'lowcode' 
        AND table_name = 'lowcode_projects' 
        AND column_name = 'deployment_logs'
    ) THEN
        ALTER TABLE lowcode.lowcode_projects ADD COLUMN deployment_logs TEXT;
        COMMENT ON COLUMN lowcode.lowcode_projects.deployment_logs IS '部署日志';
    END IF;

END $$;

-- 创建部署状态枚举类型（如果不存在）
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'deployment_status_enum' AND typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'lowcode')) THEN
        CREATE TYPE lowcode.deployment_status_enum AS ENUM ('INACTIVE', 'DEPLOYING', 'DEPLOYED', 'FAILED');
    END IF;
END $$;

COMMENT ON TABLE lowcode.lowcode_fields IS '低代码平台字段表';

COMMENT ON TABLE lowcode.lowcode_projects IS '低代码平台项目表';

-- 输出完成信息
SELECT 'Field schema fix completed successfully' as result;