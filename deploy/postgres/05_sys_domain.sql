-- Backend Schema Tables
SET search_path TO backend, public;

INSERT INTO backend.sys_domain (id, code, name, description, status, created_at, created_by, updated_at, updated_by) VALUES ('1', 'built-in', 'built-in', '内置域,请勿进行任何操作', 'ENABLED', '2024-05-15 00:00:00.000', '-1', null, null);
