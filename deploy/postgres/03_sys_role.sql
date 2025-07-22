-- Backend Schema Tables
SET search_path TO backend, public;

INSERT INTO backend.sys_role (id, code, name, description, pid, status, created_at, created_by, updated_at, updated_by) VALUES ('1', 'ROLE_SUPER', '超级管理员', '超级管理员', '0', 'ENABLED', '2024-05-15 00:00:00.000', '-1', null, null);
INSERT INTO backend.sys_role (id, code, name, description, pid, status, created_at, created_by, updated_at, updated_by) VALUES ('2', 'ROLE_ADMIN', '管理员', '管理员', '1', 'ENABLED', '2024-05-15 00:00:00.000', '-1', null, null);
INSERT INTO backend.sys_role (id, code, name, description, pid, status, created_at, created_by, updated_at, updated_by) VALUES ('3', 'ROLE_USER', '用户', '用户', '1', 'ENABLED', '2024-05-15 00:00:00.000', '-1', null, null);
