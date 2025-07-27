-- =====================================================
-- 项目部署功能数据库更新
-- 添加项目激活/停用和部署管理功能
-- =====================================================

-- 更新项目表，添加部署相关字段
ALTER TABLE lowcode.lowcode_projects 
ADD COLUMN IF NOT EXISTS deployment_status VARCHAR(20) DEFAULT 'INACTIVE',
ADD COLUMN IF NOT EXISTS deployment_port INTEGER,
ADD COLUMN IF NOT EXISTS deployment_config JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS last_deployed_at TIMESTAMP(6),
ADD COLUMN IF NOT EXISTS deployment_logs TEXT;

-- 添加部署状态字段的注释
COMMENT ON COLUMN lowcode.lowcode_projects.deployment_status IS '部署状态: INACTIVE, DEPLOYING, DEPLOYED, FAILED';
COMMENT ON COLUMN lowcode.lowcode_projects.deployment_port IS '部署端口号';
COMMENT ON COLUMN lowcode.lowcode_projects.deployment_config IS '部署配置信息';
COMMENT ON COLUMN lowcode.lowcode_projects.last_deployed_at IS '最后部署时间';
COMMENT ON COLUMN lowcode.lowcode_projects.deployment_logs IS '部署日志';

-- 创建项目部署历史表
CREATE TABLE IF NOT EXISTS lowcode.lowcode_project_deployments (
    id VARCHAR(36) PRIMARY KEY DEFAULT (gen_random_uuid())::text,
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
    created_at TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    
    -- 外键约束
    CONSTRAINT fk_project_deployments_project_id 
        FOREIGN KEY (project_id) 
        REFERENCES lowcode.lowcode_projects(id) 
        ON DELETE CASCADE
);

-- 添加表注释
COMMENT ON TABLE lowcode.lowcode_project_deployments IS '项目部署历史记录表';
COMMENT ON COLUMN lowcode.lowcode_project_deployments.id IS '部署记录ID';
COMMENT ON COLUMN lowcode.lowcode_project_deployments.project_id IS '项目ID';
COMMENT ON COLUMN lowcode.lowcode_project_deployments.version IS '部署版本';
COMMENT ON COLUMN lowcode.lowcode_project_deployments.status IS '部署状态: PENDING, DEPLOYING, DEPLOYED, FAILED, STOPPED';
COMMENT ON COLUMN lowcode.lowcode_project_deployments.port IS '部署端口';
COMMENT ON COLUMN lowcode.lowcode_project_deployments.config IS '部署配置';
COMMENT ON COLUMN lowcode.lowcode_project_deployments.logs IS '部署日志';
COMMENT ON COLUMN lowcode.lowcode_project_deployments.started_at IS '开始部署时间';
COMMENT ON COLUMN lowcode.lowcode_project_deployments.completed_at IS '完成部署时间';
COMMENT ON COLUMN lowcode.lowcode_project_deployments.error_msg IS '错误信息';
COMMENT ON COLUMN lowcode.lowcode_project_deployments.created_by IS '创建者';
COMMENT ON COLUMN lowcode.lowcode_project_deployments.created_at IS '创建时间';

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_project_deployments_project_id 
    ON lowcode.lowcode_project_deployments(project_id);

CREATE INDEX IF NOT EXISTS idx_project_deployments_status 
    ON lowcode.lowcode_project_deployments(status);

CREATE INDEX IF NOT EXISTS idx_project_deployments_created_at 
    ON lowcode.lowcode_project_deployments(created_at);

-- 更新现有项目的部署状态
UPDATE lowcode.lowcode_projects 
SET deployment_status = 'INACTIVE' 
WHERE deployment_status IS NULL;

-- 插入示例部署记录（可选）
INSERT INTO lowcode.lowcode_project_deployments (
    project_id, 
    version, 
    status, 
    port, 
    config, 
    logs, 
    started_at, 
    completed_at, 
    created_by
) 
SELECT 
    id as project_id,
    version,
    'DEPLOYED' as status,
    9522 as port,
    '{"autoRestart": true, "environment": "development"}' as config,
    'Initial deployment completed successfully' as logs,
    created_at as started_at,
    created_at as completed_at,
    created_by
FROM lowcode.lowcode_projects 
WHERE status = 'ACTIVE' 
AND NOT EXISTS (
    SELECT 1 FROM lowcode.lowcode_project_deployments 
    WHERE project_id = lowcode.lowcode_projects.id
);

-- 验证数据
DO $$
BEGIN
    -- 检查表是否创建成功
    IF EXISTS (SELECT 1 FROM information_schema.tables 
               WHERE table_schema = 'lowcode' 
               AND table_name = 'lowcode_project_deployments') THEN
        RAISE NOTICE '✅ 项目部署历史表创建成功';
    ELSE
        RAISE EXCEPTION '❌ 项目部署历史表创建失败';
    END IF;
    
    -- 检查字段是否添加成功
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_schema = 'lowcode' 
               AND table_name = 'lowcode_projects' 
               AND column_name = 'deployment_status') THEN
        RAISE NOTICE '✅ 项目表部署字段添加成功';
    ELSE
        RAISE EXCEPTION '❌ 项目表部署字段添加失败';
    END IF;
    
    RAISE NOTICE '🎉 项目部署功能数据库更新完成！';
END $$;
