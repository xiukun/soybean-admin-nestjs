-- 多Schema数据库初始化脚本
-- Multi-Schema Database Initialization Script
-- 
-- 此脚本创建三个独立的schema用于不同的微服务：
-- - backend: 系统管理核心服务
-- - lowcode: 低代码平台服务  
-- - amis: 代码生成业务服务

-- 创建schemas
CREATE SCHEMA IF NOT EXISTS backend;
CREATE SCHEMA IF NOT EXISTS lowcode;
CREATE SCHEMA IF NOT EXISTS amis;

-- 设置搜索路径，优先使用backend schema
SET search_path TO backend, lowcode, amis, public;

-- 在backend schema中创建枚举类型
CREATE TYPE backend."Status" AS ENUM ('ENABLED', 'DISABLED', 'BANNED');
CREATE TYPE backend."MenuType" AS ENUM ('directory', 'menu', 'lowcode');

-- 注释说明
COMMENT ON SCHEMA backend IS '系统管理核心服务 - 用户、角色、菜单、权限等';
COMMENT ON SCHEMA lowcode IS '低代码平台服务 - 项目、实体、API配置等';
COMMENT ON SCHEMA amis IS '代码生成业务服务 - 演示数据和页面模板';

-- 为各schema设置默认权限
GRANT USAGE ON SCHEMA backend TO soybean;
GRANT USAGE ON SCHEMA lowcode TO soybean;
GRANT USAGE ON SCHEMA amis TO soybean;

GRANT CREATE ON SCHEMA backend TO soybean;
GRANT CREATE ON SCHEMA lowcode TO soybean;
GRANT CREATE ON SCHEMA amis TO soybean;

-- 输出初始化信息
DO $$
BEGIN
    RAISE NOTICE '✅ 多Schema数据库初始化完成';
    RAISE NOTICE '📊 已创建schemas: backend, lowcode, amis';
    RAISE NOTICE '🔧 已创建枚举类型: Status, MenuType (在backend schema中)';
    RAISE NOTICE '🔑 已设置权限: soybean用户可访问所有schema';
END $$;
