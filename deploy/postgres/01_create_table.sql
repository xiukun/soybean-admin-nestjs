-- Backend Schema Tables - 系统管理核心表
-- 注意：枚举类型已在00_init_schemas.sql中创建

-- 设置当前schema为backend
SET search_path TO backend, public;

-- CreateTable
CREATE TABLE backend.sys_tokens (
    "id" TEXT NOT NULL,
    "access_token" TEXT NOT NULL,
    "refresh_token" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "login_time" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ip" TEXT NOT NULL,
    "port" INTEGER,
    "address" TEXT NOT NULL,
    "user_agent" TEXT NOT NULL,
    "request_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT NOT NULL,

    CONSTRAINT "sys_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE backend.sys_user (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "built_in" BOOLEAN NOT NULL DEFAULT false,
    "avatar" TEXT,
    "email" TEXT,
    "phone_number" TEXT,
    "nick_name" TEXT NOT NULL,
    "status" backend."Status" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT NOT NULL,
    "updated_at" TIMESTAMP(3),
    "updated_by" TEXT,

    CONSTRAINT "sys_user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE backend.casbin_rule (
    "id" SERIAL NOT NULL,
    "ptype" TEXT NOT NULL,
    "v0" TEXT,
    "v1" TEXT,
    "v2" TEXT,
    "v3" TEXT,
    "v4" TEXT,
    "v5" TEXT,

    CONSTRAINT "casbin_rule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE backend.sys_domain (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" backend."Status" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT NOT NULL,
    "updated_at" TIMESTAMP(3),
    "updated_by" TEXT,

    CONSTRAINT "sys_domain_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE backend.sys_role (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "pid" TEXT NOT NULL DEFAULT '0',
    "status" backend."Status" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT NOT NULL,
    "updated_at" TIMESTAMP(3),
    "updated_by" TEXT,

    CONSTRAINT "sys_role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE backend.sys_user_role (
    "user_id" TEXT NOT NULL,
    "role_id" TEXT NOT NULL,

    CONSTRAINT "sys_user_role_pkey" PRIMARY KEY ("user_id","role_id")
);

-- CreateTable
CREATE TABLE backend.sys_endpoint (
    "id" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "resource" TEXT NOT NULL,
    "controller" TEXT NOT NULL,
    "summary" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),

    CONSTRAINT "sys_endpoint_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE backend.sys_organization (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "pid" TEXT NOT NULL DEFAULT '0',
    "status" backend."Status" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT NOT NULL,
    "updated_at" TIMESTAMP(3),
    "updated_by" TEXT,

    CONSTRAINT "sys_organization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE backend.sys_login_log (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "login_time" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ip" TEXT NOT NULL,
    "port" INTEGER,
    "address" TEXT NOT NULL,
    "user_agent" TEXT NOT NULL,
    "request_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT NOT NULL,

    CONSTRAINT "sys_login_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE backend.sys_operation_log (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "module_name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "request_id" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "ip" TEXT NOT NULL,
    "user_agent" TEXT,
    "params" JSONB,
    "body" JSONB,
    "response" JSONB,
    "start_time" TIMESTAMP(3) NOT NULL,
    "end_time" TIMESTAMP(3) NOT NULL,
    "duration" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sys_operation_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE backend.sys_menu (
    "id" SERIAL NOT NULL,
    "menu_type" backend."MenuType" NOT NULL,
    "menu_name" VARCHAR(64) NOT NULL,
    "icon_type" INTEGER DEFAULT 1,
    "icon" VARCHAR(64),
    "route_name" VARCHAR(64) NOT NULL,
    "route_path" VARCHAR(128) NOT NULL,
    "component" VARCHAR(64) NOT NULL,
    "path_param" VARCHAR(64),
    "status" backend."Status" NOT NULL,
    "active_menu" VARCHAR(64),
    "hide_in_menu" BOOLEAN DEFAULT false,
    "pid" INTEGER NOT NULL DEFAULT 0,
    "sequence" INTEGER NOT NULL,
    "i18n_key" VARCHAR(64),
    "keep_alive" BOOLEAN DEFAULT false,
    "constant" BOOLEAN NOT NULL DEFAULT false,
    "href" VARCHAR(64),
    "multi_tab" BOOLEAN DEFAULT false,
    "lowcode_page_id" VARCHAR(36),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT NOT NULL,
    "updated_at" TIMESTAMP(3),
    "updated_by" TEXT,

    CONSTRAINT "sys_menu_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE backend.sys_role_menu (
    "role_id" TEXT NOT NULL,
    "menu_id" INTEGER NOT NULL,
    "domain" TEXT NOT NULL,

    CONSTRAINT "sys_role_menu_pkey" PRIMARY KEY ("role_id","menu_id","domain")
);

-- CreateTable
CREATE TABLE backend.sys_lowcode_page (
    "id" TEXT NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "title" VARCHAR(100) NOT NULL,
    "code" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "schema" JSONB NOT NULL,
    "status" backend."Status" NOT NULL DEFAULT 'ENABLED',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT NOT NULL,
    "updated_at" TIMESTAMP(3),
    "updated_by" TEXT,

    CONSTRAINT "sys_lowcode_page_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE backend.sys_lowcode_page_version (
    "id" TEXT NOT NULL,
    "page_id" TEXT NOT NULL,
    "version" VARCHAR(20) NOT NULL,
    "schema" JSONB NOT NULL,
    "changelog" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT NOT NULL,

    CONSTRAINT "sys_lowcode_page_version_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE backend.sys_access_key (
    "id" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "access_key_id" TEXT NOT NULL,
    "access_key_secret" TEXT NOT NULL,
    "status" backend."Status" NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT NOT NULL,

    CONSTRAINT "sys_access_key_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "sys_user_username_domain_key" ON "sys_user"("username", "domain");

-- CreateIndex
CREATE UNIQUE INDEX "sys_domain_code_key" ON "sys_domain"("code");

-- CreateIndex
CREATE UNIQUE INDEX "sys_role_code_key" ON "sys_role"("code");

-- CreateIndex
CREATE UNIQUE INDEX "sys_endpoint_path_method_key" ON "sys_endpoint"("path", "method");

-- CreateIndex
CREATE UNIQUE INDEX "sys_organization_code_key" ON "sys_organization"("code");

-- CreateIndex
CREATE UNIQUE INDEX "sys_lowcode_page_code_key" ON "sys_lowcode_page"("code");

-- CreateIndex
CREATE UNIQUE INDEX "sys_access_key_access_key_secret_key" ON "sys_access_key"("access_key_secret");

-- AddForeignKey
ALTER TABLE "sys_user_role" ADD CONSTRAINT "sys_user_role_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES backend.sys_user("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sys_user_role" ADD CONSTRAINT "sys_user_role_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES backend.sys_role("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sys_role_menu" ADD CONSTRAINT "sys_role_menu_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES backend.sys_role("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sys_role_menu" ADD CONSTRAINT "sys_role_menu_menu_id_fkey" FOREIGN KEY ("menu_id") REFERENCES backend.sys_menu("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sys_menu" ADD CONSTRAINT "sys_menu_lowcode_page_id_fkey" FOREIGN KEY ("lowcode_page_id") REFERENCES backend.sys_lowcode_page("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sys_lowcode_page_version" ADD CONSTRAINT "sys_lowcode_page_version_page_id_fkey" FOREIGN KEY ("page_id") REFERENCES backend.sys_lowcode_page("id") ON DELETE CASCADE ON UPDATE CASCADE;
