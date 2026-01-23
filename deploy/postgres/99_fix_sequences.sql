-- 修复所有使用 autoincrement 的表的序列
-- 这个脚本应该在所有初始化数据之后执行
-- 确保序列的值大于等于表中最大的 id

-- 修复 sys_menu 表的序列
SELECT setval(
    'sys_menu_id_seq',
    COALESCE((SELECT MAX(id) FROM sys_menu), 0) + 1,
    false
);

-- 修复 casbin_rule 表的序列
SELECT setval(
    'casbin_rule_id_seq',
    COALESCE((SELECT MAX(id) FROM casbin_rule), 0) + 1,
    false
);

-- 验证修复结果（可选，用于调试）
-- SELECT 'sys_menu_id_seq' as sequence_name, last_value FROM sys_menu_id_seq;
-- SELECT 'casbin_rule_id_seq' as sequence_name, last_value FROM casbin_rule_id_seq;
