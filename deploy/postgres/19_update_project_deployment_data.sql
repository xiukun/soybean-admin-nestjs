-- =====================================================
-- 更新项目部署数据
-- 为现有项目添加部署状态和配置信息
-- =====================================================

-- 更新现有项目的部署状态
UPDATE lowcode.lowcode_projects 
SET 
    deployment_status = CASE 
        WHEN status = 'ACTIVE' THEN 'DEPLOYED'
        WHEN status = 'INACTIVE' THEN 'INACTIVE'
        ELSE 'INACTIVE'
    END,
    deployment_port = CASE 
        WHEN id = 'demo-project-1' THEN 9522
        WHEN id = '1' THEN 9523
        WHEN id = '2' THEN 9524
        ELSE NULL
    END,
    deployment_config = CASE 
        WHEN status = 'ACTIVE' THEN jsonb_build_object(
            'autoRestart', true,
            'environment', 'development',
            'healthCheck', jsonb_build_object(
                'enabled', true,
                'path', '/health',
                'interval', 30
            ),
            'resources', jsonb_build_object(
                'memory', '512MB',
                'cpu', '0.5'
            )
        )
        ELSE '{}'::jsonb
    END,
    last_deployed_at = CASE 
        WHEN status = 'ACTIVE' THEN updated_at
        ELSE NULL
    END,
    deployment_logs = CASE 
        WHEN status = 'ACTIVE' THEN 'Project deployed successfully during system initialization'
        ELSE NULL
    END
WHERE deployment_status IS NULL;

-- 插入部署历史记录
INSERT INTO lowcode.lowcode_project_deployments (
    project_id,
    version,
    status,
    port,
    config,
    logs,
    started_at,
    completed_at,
    created_by,
    created_at
)
SELECT 
    p.id,
    p.version,
    CASE 
        WHEN p.status = 'ACTIVE' THEN 'DEPLOYED'
        ELSE 'STOPPED'
    END as status,
    p.deployment_port,
    p.deployment_config,
    CASE 
        WHEN p.status = 'ACTIVE' THEN 'Initial deployment completed successfully'
        ELSE 'Project deployment stopped'
    END as logs,
    p.created_at as started_at,
    CASE 
        WHEN p.status = 'ACTIVE' THEN p.updated_at
        ELSE p.created_at
    END as completed_at,
    p.created_by,
    p.created_at
FROM lowcode.lowcode_projects p
WHERE NOT EXISTS (
    SELECT 1 FROM lowcode.lowcode_project_deployments d 
    WHERE d.project_id = p.id
);

-- 为演示项目添加额外的部署记录（模拟历史部署）
INSERT INTO lowcode.lowcode_project_deployments (
    project_id,
    version,
    status,
    port,
    config,
    logs,
    started_at,
    completed_at,
    created_by,
    created_at
) VALUES 
(
    'demo-project-1',
    '1.0.0',
    'DEPLOYED',
    9522,
    '{"autoRestart": true, "environment": "production", "healthCheck": {"enabled": true, "path": "/health", "interval": 30}}',
    'Production deployment completed successfully. All services are running normally.',
    CURRENT_TIMESTAMP - INTERVAL '7 days',
    CURRENT_TIMESTAMP - INTERVAL '7 days' + INTERVAL '5 minutes',
    'system',
    CURRENT_TIMESTAMP - INTERVAL '7 days'
),
(
    'demo-project-1',
    '1.0.1',
    'FAILED',
    9522,
    '{"autoRestart": true, "environment": "production"}',
    'Deployment failed: Port 9522 is already in use. Error: EADDRINUSE',
    CURRENT_TIMESTAMP - INTERVAL '3 days',
    CURRENT_TIMESTAMP - INTERVAL '3 days' + INTERVAL '2 minutes',
    'system',
    CURRENT_TIMESTAMP - INTERVAL '3 days'
),
(
    'demo-project-1',
    '1.0.1',
    'DEPLOYED',
    9525,
    '{"autoRestart": true, "environment": "production", "port": 9525}',
    'Deployment successful on alternative port 9525. All services are running normally.',
    CURRENT_TIMESTAMP - INTERVAL '3 days' + INTERVAL '10 minutes',
    CURRENT_TIMESTAMP - INTERVAL '3 days' + INTERVAL '15 minutes',
    'system',
    CURRENT_TIMESTAMP - INTERVAL '3 days' + INTERVAL '10 minutes'
);

-- 验证更新结果
DO $$
DECLARE
    project_count INTEGER;
    deployment_count INTEGER;
    active_deployments INTEGER;
BEGIN
    -- 检查项目部署状态更新
    SELECT COUNT(*) INTO project_count 
    FROM lowcode.lowcode_projects 
    WHERE deployment_status IS NOT NULL;
    
    -- 检查部署历史记录
    SELECT COUNT(*) INTO deployment_count 
    FROM lowcode.lowcode_project_deployments;
    
    -- 检查活跃部署
    SELECT COUNT(*) INTO active_deployments 
    FROM lowcode.lowcode_projects 
    WHERE deployment_status = 'DEPLOYED';
    
    RAISE NOTICE '✅ 项目部署状态更新完成';
    RAISE NOTICE '📊 更新统计:';
    RAISE NOTICE '   - 项目总数: %', project_count;
    RAISE NOTICE '   - 部署记录总数: %', deployment_count;
    RAISE NOTICE '   - 活跃部署数: %', active_deployments;
    
    IF project_count > 0 AND deployment_count > 0 THEN
        RAISE NOTICE '🎉 项目部署数据更新成功！';
    ELSE
        RAISE WARNING '⚠️ 部分数据更新可能未成功，请检查';
    END IF;
END $$;
