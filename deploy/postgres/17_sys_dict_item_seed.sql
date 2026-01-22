-- Seed sys_dict_item
INSERT INTO "sys_dict_item" ("id", "dict_id", "label", "dict_value", "sequence", "status", "remark", "created_by") VALUES
('dict-item-user-status-enabled', 'dict-user-status', '启用', 'ENABLED', 10, 'ENABLED', '示例字典项', 'system'),
('dict-item-user-status-disabled', 'dict-user-status', '禁用', 'DISABLED', 20, 'ENABLED', '示例字典项', 'system');
