-- 低代码页面表
CREATE TABLE IF NOT EXISTS "sys_lowcode_page" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "name" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "code" TEXT NOT NULL UNIQUE,
    "description" TEXT,
    "path" TEXT NOT NULL,
    "schema" TEXT NOT NULL,
    "menu_id" INTEGER,
    "status" "Status" NOT NULL,
    "created_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT NOT NULL,
    "updated_at" TIMESTAMP(3),
    "updated_by" TEXT
);

-- 低代码模型表
CREATE TABLE IF NOT EXISTS "sys_lowcode_model" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL UNIQUE,
    "description" TEXT,
    "table_name" TEXT NOT NULL,
    "status" "Status" NOT NULL,
    "created_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT NOT NULL,
    "updated_at" TIMESTAMP(3),
    "updated_by" TEXT
);

-- 低代码模型属性表
CREATE TABLE IF NOT EXISTS "sys_lowcode_model_property" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "model_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL,
    "length" INTEGER,
    "precision" INTEGER,
    "scale" INTEGER,
    "nullable" BOOLEAN DEFAULT true,
    "default_value" TEXT,
    "is_primary_key" BOOLEAN DEFAULT false,
    "is_unique" BOOLEAN DEFAULT false,
    "is_index" BOOLEAN DEFAULT false,
    "created_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT NOT NULL,
    "updated_at" TIMESTAMP(3),
    "updated_by" TEXT,
    FOREIGN KEY ("model_id") REFERENCES "sys_lowcode_model"("id") ON DELETE CASCADE
);

-- 低代码模型关联表
CREATE TABLE IF NOT EXISTS "sys_lowcode_model_reference" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "model_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "source_model" TEXT NOT NULL,
    "source_property" TEXT NOT NULL,
    "target_model" TEXT NOT NULL,
    "target_property" TEXT NOT NULL,
    "relation_type" TEXT NOT NULL,
    "on_delete" TEXT,
    "on_update" TEXT,
    "created_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT NOT NULL,
    "updated_at" TIMESTAMP(3),
    "updated_by" TEXT,
    FOREIGN KEY ("model_id") REFERENCES "sys_lowcode_model"("id") ON DELETE CASCADE
);

-- 低代码API表
CREATE TABLE IF NOT EXISTS "sys_lowcode_api" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "name" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "description" TEXT,
    "model_id" TEXT,
    "request_schema" TEXT,
    "response_schema" TEXT,
    "status" "Status" NOT NULL,
    "created_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT NOT NULL,
    "updated_at" TIMESTAMP(3),
    "updated_by" TEXT,
    UNIQUE("path", "method")
);