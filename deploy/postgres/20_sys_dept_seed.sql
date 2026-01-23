-- 默认部门：超级管理中心
-- 说明：created_by/updated_by 使用超级管理员 id=1（与现有 seed 一致）
INSERT INTO "sys_dept" ("id", "name", "code", "pid", "sequence", "status", "remark", "created_at", "created_by")
VALUES ('super-admin-center', '超级管理中心', '000', '0', 0, 'ENABLED', '系统默认部门，用于承载超级管理员', CURRENT_TIMESTAMP, '1')
ON CONFLICT ("id") DO NOTHING;

-- 将超级管理员/管理员绑定到默认部门（若已绑定则忽略）
INSERT INTO "sys_user_dept" ("user_id", "dept_id")
VALUES ('1', 'super-admin-center'),
       ('2', 'super-admin-center')
ON CONFLICT ("user_id", "dept_id") DO NOTHING;
