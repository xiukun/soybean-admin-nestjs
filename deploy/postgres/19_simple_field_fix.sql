-- 简单修复字段表结构问题
SET search_path TO lowcode, backend, public;

-- 添加缺失的字段到 lowcode_fields 表
ALTER TABLE lowcode.lowcode_fields ADD COLUMN IF NOT EXISTS required BOOLEAN DEFAULT false;
ALTER TABLE lowcode.lowcode_fields ADD COLUMN IF NOT EXISTS nullable BOOLEAN DEFAULT true;
ALTER TABLE lowcode.lowcode_fields ADD COLUMN IF NOT EXISTS unique_constraint BOOLEAN DEFAULT false;
ALTER TABLE lowcode.lowcode_fields ADD COLUMN IF NOT EXISTS indexed BOOLEAN DEFAULT false;
ALTER TABLE lowcode.lowcode_fields ADD COLUMN IF NOT EXISTS primary_key BOOLEAN DEFAULT false;
ALTER TABLE lowcode.lowcode_fields ADD COLUMN IF NOT EXISTS default_value TEXT;
ALTER TABLE lowcode.lowcode_fields ADD COLUMN IF NOT EXISTS validation_rules JSONB;
ALTER TABLE lowcode.lowcode_fields ADD COLUMN IF NOT EXISTS reference_config JSONB;
ALTER TABLE lowcode.lowcode_fields ADD COLUMN IF NOT EXISTS enum_options JSONB;
ALTER TABLE lowcode.lowcode_fields ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;

-- 添加部署相关字段到 lowcode_projects 表
ALTER TABLE lowcode.lowcode_projects ADD COLUMN IF NOT EXISTS deployment_status VARCHAR(20) DEFAULT 'INACTIVE';
ALTER TABLE lowcode.lowcode_projects ADD COLUMN IF NOT EXISTS deployment_port INTEGER;
ALTER TABLE lowcode.lowcode_projects ADD COLUMN IF NOT EXISTS deployment_config JSONB;
ALTER TABLE lowcode.lowcode_projects ADD COLUMN IF NOT EXISTS last_deployed_at TIMESTAMP(6);
ALTER TABLE lowcode.lowcode_projects ADD COLUMN IF NOT EXISTS deployment_logs TEXT;

-- 输出完成信息
SELECT 'Field schema fix completed successfully' as result;
