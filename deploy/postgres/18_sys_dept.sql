-- 部门表（树形结构）
CREATE TABLE IF NOT EXISTS "sys_dept" (
  "id" varchar(36) PRIMARY KEY,
  "name" varchar(100) NOT NULL,
  "code" varchar(100) NOT NULL UNIQUE,
  "pid" varchar(36) NOT NULL DEFAULT '0',
  "sequence" int NOT NULL DEFAULT 0,
  "status" "Status" NOT NULL DEFAULT 'ENABLED',
  "remark" varchar(255),

  "created_at" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "created_by" varchar(36) NOT NULL,
  "updated_at" timestamp,
  "updated_by" varchar(36)
);

CREATE INDEX IF NOT EXISTS "idx_sys_dept_pid" ON "sys_dept" ("pid");
