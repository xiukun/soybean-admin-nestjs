-- Seed sys_dict
INSERT INTO "sys_dict" ("id", "name", "code", "pid", "sequence", "status", "remark", "created_by") VALUES
('dict-root', '字典根', 'dict_root', '0', 0, 'ENABLED', '根节点', 'system'),
('dict-user-status', '用户状态', 'user_status', 'dict-root', 10, 'ENABLED', '示例字典', 'system');
