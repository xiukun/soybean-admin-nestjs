-- =====================================================
-- 部署验证脚本
-- 验证项目部署功能的数据库更新是否正确应用
-- =====================================================

-- 验证项目表的部署字段
DO $$
DECLARE
    column_count INTEGER;
    deployment_projects INTEGER;
    deployment_records INTEGER;
BEGIN
    -- 检查部署相关字段是否存在
    SELECT COUNT(*) INTO column_count
    FROM information_schema.columns 
    WHERE table_schema = 'lowcode' 
    AND table_name = 'lowcode_projects' 
    AND column_name IN ('deployment_status', 'deployment_port', 'deployment_config', 'last_deployed_at', 'deployment_logs');
    
    IF column_count = 5 THEN
        RAISE NOTICE '✅ 项目表部署字段验证通过 (5/5)';
    ELSE
        RAISE WARNING '⚠️ 项目表部署字段不完整 (%/5)', column_count;
    END IF;
    
    -- 检查部署历史表是否存在
    IF EXISTS (SELECT 1 FROM information_schema.tables 
               WHERE table_schema = 'lowcode' 
               AND table_name = 'lowcode_project_deployments') THEN
        RAISE NOTICE '✅ 项目部署历史表存在';
        
        -- 检查部署历史表的字段
        SELECT COUNT(*) INTO column_count
        FROM information_schema.columns 
        WHERE table_schema = 'lowcode' 
        AND table_name = 'lowcode_project_deployments';
        
        RAISE NOTICE '📊 部署历史表字段数量: %', column_count;
    ELSE
        RAISE WARNING '❌ 项目部署历史表不存在';
    END IF;
    
    -- 检查索引是否创建
    IF EXISTS (SELECT 1 FROM pg_indexes 
               WHERE schemaname = 'lowcode' 
               AND tablename = 'lowcode_project_deployments' 
               AND indexname = 'idx_project_deployments_project_id') THEN
        RAISE NOTICE '✅ 部署历史表索引创建成功';
    ELSE
        RAISE WARNING '⚠️ 部署历史表索引缺失';
    END IF;
    
    -- 统计部署数据
    SELECT COUNT(*) INTO deployment_projects
    FROM lowcode.lowcode_projects 
    WHERE deployment_status IS NOT NULL;
    
    SELECT COUNT(*) INTO deployment_records
    FROM lowcode.lowcode_project_deployments;
    
    RAISE NOTICE '📈 数据统计:';
    RAISE NOTICE '   - 有部署状态的项目: %', deployment_projects;
    RAISE NOTICE '   - 部署历史记录: %', deployment_records;
    
    -- 验证外键约束
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
               WHERE constraint_schema = 'lowcode' 
               AND table_name = 'lowcode_project_deployments' 
               AND constraint_type = 'FOREIGN KEY') THEN
        RAISE NOTICE '✅ 外键约束验证通过';
    ELSE
        RAISE WARNING '⚠️ 外键约束缺失';
    END IF;
END $$;

-- 显示项目部署状态分布
SELECT 
    deployment_status,
    COUNT(*) as project_count,
    ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage
FROM lowcode.lowcode_projects 
WHERE deployment_status IS NOT NULL
GROUP BY deployment_status
ORDER BY project_count DESC;

-- 显示部署历史统计
SELECT 
    status,
    COUNT(*) as deployment_count,
    MIN(created_at) as earliest_deployment,
    MAX(created_at) as latest_deployment
FROM lowcode.lowcode_project_deployments 
GROUP BY status
ORDER BY deployment_count DESC;

-- 显示有部署记录的项目
SELECT 
    p.name as project_name,
    p.code as project_code,
    p.deployment_status,
    p.deployment_port,
    p.last_deployed_at,
    COUNT(d.id) as deployment_count
FROM lowcode.lowcode_projects p
LEFT JOIN lowcode.lowcode_project_deployments d ON p.id = d.project_id
WHERE p.deployment_status IS NOT NULL
GROUP BY p.id, p.name, p.code, p.deployment_status, p.deployment_port, p.last_deployed_at
ORDER BY deployment_count DESC, p.name;

-- 检查端口冲突
WITH port_usage AS (
    SELECT 
        deployment_port,
        COUNT(*) as usage_count,
        STRING_AGG(name, ', ') as projects
    FROM lowcode.lowcode_projects 
    WHERE deployment_port IS NOT NULL 
    AND deployment_status = 'DEPLOYED'
    GROUP BY deployment_port
)
SELECT 
    deployment_port,
    usage_count,
    projects,
    CASE 
        WHEN usage_count > 1 THEN '⚠️ 端口冲突'
        ELSE '✅ 正常'
    END as status
FROM port_usage
ORDER BY usage_count DESC, deployment_port;

-- 验证数据完整性
DO $$
DECLARE
    orphaned_deployments INTEGER;
    invalid_statuses INTEGER;
BEGIN
    -- 检查孤立的部署记录
    SELECT COUNT(*) INTO orphaned_deployments
    FROM lowcode.lowcode_project_deployments d
    WHERE NOT EXISTS (
        SELECT 1 FROM lowcode.lowcode_projects p 
        WHERE p.id = d.project_id
    );
    
    IF orphaned_deployments = 0 THEN
        RAISE NOTICE '✅ 无孤立的部署记录';
    ELSE
        RAISE WARNING '⚠️ 发现 % 条孤立的部署记录', orphaned_deployments;
    END IF;
    
    -- 检查无效的部署状态
    SELECT COUNT(*) INTO invalid_statuses
    FROM lowcode.lowcode_projects 
    WHERE deployment_status NOT IN ('INACTIVE', 'DEPLOYING', 'DEPLOYED', 'FAILED')
    AND deployment_status IS NOT NULL;
    
    IF invalid_statuses = 0 THEN
        RAISE NOTICE '✅ 所有部署状态有效';
    ELSE
        RAISE WARNING '⚠️ 发现 % 个无效的部署状态', invalid_statuses;
    END IF;
    
    RAISE NOTICE '🎉 部署功能验证完成！';
END $$;
