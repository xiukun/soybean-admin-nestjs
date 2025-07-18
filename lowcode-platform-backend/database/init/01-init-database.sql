-- 低代码平台数据库初始化脚本
-- Low-code Platform Database Initialization Script

-- 创建数据库（如果不存在）
-- Create database if not exists
-- 注意：在Docker容器中，数据库已经通过环境变量创建，这里主要是确保配置正确

-- 设置数据库编码和排序规则
-- Set database encoding and collation
ALTER DATABASE lowcode_platform SET timezone TO 'Asia/Shanghai';

-- 创建扩展（如果需要）
-- Create extensions if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "btree_gin";

-- 创建自定义类型（如果Prisma schema中有用到）
-- Create custom types if used in Prisma schema

-- 设置默认权限
-- Set default permissions
GRANT ALL PRIVILEGES ON DATABASE lowcode_platform TO soybean;

-- 创建schema（如果需要多schema支持）
-- Create schemas if multi-schema support is needed
-- CREATE SCHEMA IF NOT EXISTS lowcode AUTHORIZATION soybean;
-- CREATE SCHEMA IF NOT EXISTS metadata AUTHORIZATION soybean;

-- 注释说明
-- Comments
COMMENT ON DATABASE lowcode_platform IS '低代码平台数据库 - Low-code Platform Database';

-- 设置搜索路径
-- Set search path
-- ALTER DATABASE lowcode_platform SET search_path TO public, lowcode, metadata;

-- 创建一些有用的函数
-- Create useful functions

-- 更新时间戳函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- UUID生成函数（如果需要自定义格式）
CREATE OR REPLACE FUNCTION generate_custom_id(prefix TEXT DEFAULT '')
RETURNS TEXT AS $$
BEGIN
    RETURN prefix || replace(uuid_generate_v4()::text, '-', '');
END;
$$ language 'plpgsql';

-- 创建审计日志表（可选）
-- Create audit log table (optional)
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    table_name VARCHAR(100) NOT NULL,
    operation VARCHAR(10) NOT NULL, -- INSERT, UPDATE, DELETE
    old_data JSONB,
    new_data JSONB,
    user_id VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建审计触发器函数
CREATE OR REPLACE FUNCTION audit_trigger_function()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        INSERT INTO audit_logs (table_name, operation, old_data, user_id)
        VALUES (TG_TABLE_NAME, TG_OP, row_to_json(OLD), current_setting('app.current_user_id', true));
        RETURN OLD;
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO audit_logs (table_name, operation, old_data, new_data, user_id)
        VALUES (TG_TABLE_NAME, TG_OP, row_to_json(OLD), row_to_json(NEW), current_setting('app.current_user_id', true));
        RETURN NEW;
    ELSIF TG_OP = 'INSERT' THEN
        INSERT INTO audit_logs (table_name, operation, new_data, user_id)
        VALUES (TG_TABLE_NAME, TG_OP, row_to_json(NEW), current_setting('app.current_user_id', true));
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ language 'plpgsql';

-- 创建性能监控视图（可选）
-- Create performance monitoring views (optional)
CREATE OR REPLACE VIEW database_stats AS
SELECT 
    schemaname,
    tablename,
    attname,
    n_distinct,
    correlation
FROM pg_stats
WHERE schemaname = 'public'
ORDER BY schemaname, tablename, attname;

-- 创建连接监控视图
CREATE OR REPLACE VIEW connection_stats AS
SELECT 
    datname,
    numbackends,
    xact_commit,
    xact_rollback,
    blks_read,
    blks_hit,
    tup_returned,
    tup_fetched,
    tup_inserted,
    tup_updated,
    tup_deleted
FROM pg_stat_database
WHERE datname = 'lowcode_platform';

-- 设置一些有用的配置
-- Set useful configurations
ALTER SYSTEM SET shared_preload_libraries = 'pg_stat_statements';
ALTER SYSTEM SET log_statement = 'mod';
ALTER SYSTEM SET log_min_duration_statement = 1000;

-- 创建索引优化函数
CREATE OR REPLACE FUNCTION optimize_table_indexes(table_name TEXT)
RETURNS TEXT AS $$
DECLARE
    result TEXT;
BEGIN
    EXECUTE 'REINDEX TABLE ' || table_name;
    EXECUTE 'ANALYZE ' || table_name;
    result := 'Table ' || table_name || ' optimized successfully';
    RETURN result;
END;
$$ language 'plpgsql';

-- 输出初始化完成信息
DO $$
BEGIN
    RAISE NOTICE '低代码平台数据库初始化完成 - Low-code Platform Database Initialization Completed';
    RAISE NOTICE '数据库名称: lowcode_platform';
    RAISE NOTICE '用户名: soybean';
    RAISE NOTICE '端口: 25432 (Docker映射)';
    RAISE NOTICE '时区: Asia/Shanghai';
END $$;
