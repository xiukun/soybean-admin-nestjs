-- 用户-部门 多对多关联
CREATE TABLE IF NOT EXISTS "sys_user_dept" (
  "user_id" varchar(36) NOT NULL,
  "dept_id" varchar(36) NOT NULL,
  PRIMARY KEY ("user_id", "dept_id"),
  CONSTRAINT "fk_sys_user_dept_user" FOREIGN KEY ("user_id") REFERENCES "sys_user" ("id") ON DELETE CASCADE,
  CONSTRAINT "fk_sys_user_dept_dept" FOREIGN KEY ("dept_id") REFERENCES "sys_dept" ("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "idx_sys_user_dept_dept_id" ON "sys_user_dept" ("dept_id");
