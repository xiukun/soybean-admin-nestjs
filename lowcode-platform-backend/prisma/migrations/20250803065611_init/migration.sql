-- CreateTable
CREATE TABLE "lowcode"."lowcode_projects" (
    "id" VARCHAR(36) NOT NULL DEFAULT (gen_random_uuid())::text,
    "name" VARCHAR(100) NOT NULL,
    "code" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "version" VARCHAR(20) DEFAULT '1.0.0',
    "config" JSONB DEFAULT '{}',
    "status" VARCHAR(20) DEFAULT 'ACTIVE',
    "deployment_status" VARCHAR(20) DEFAULT 'INACTIVE',
    "deployment_port" INTEGER,
    "deployment_config" JSONB DEFAULT '{}',
    "last_deployed_at" TIMESTAMP(6),
    "deployment_logs" TEXT,
    "created_by" VARCHAR(36) NOT NULL,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_by" VARCHAR(36),
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lowcode_projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lowcode"."lowcode_entities" (
    "id" VARCHAR(36) NOT NULL DEFAULT (gen_random_uuid())::text,
    "project_id" VARCHAR(36) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "code" VARCHAR(100) NOT NULL,
    "table_name" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "category" VARCHAR(50),
    "diagram_position" JSONB,
    "config" JSONB DEFAULT '{}',
    "version" VARCHAR(20) DEFAULT '1.0.0',
    "status" VARCHAR(20) DEFAULT 'DRAFT',
    "created_by" VARCHAR(36) NOT NULL,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_by" VARCHAR(36),
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lowcode_entities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lowcode"."lowcode_fields" (
    "id" VARCHAR(36) NOT NULL DEFAULT (gen_random_uuid())::text,
    "entity_id" VARCHAR(36) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "code" VARCHAR(100) NOT NULL,
    "type" VARCHAR(50) NOT NULL,
    "length" INTEGER,
    "precision" INTEGER,
    "scale" INTEGER,
    "nullable" BOOLEAN DEFAULT true,
    "required" BOOLEAN DEFAULT false,
    "unique_constraint" BOOLEAN DEFAULT false,
    "indexed" BOOLEAN DEFAULT false,
    "primary_key" BOOLEAN DEFAULT false,
    "default_value" TEXT,
    "validation_rules" JSONB,
    "validation" JSONB,
    "reference_config" JSONB,
    "config" JSONB,
    "enum_options" JSONB,
    "comment" TEXT,
    "sort_order" INTEGER DEFAULT 0,
    "created_by" VARCHAR(36) NOT NULL,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_by" VARCHAR(36),
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lowcode_fields_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lowcode"."lowcode_relations" (
    "id" VARCHAR(36) NOT NULL DEFAULT (gen_random_uuid())::text,
    "project_id" VARCHAR(36) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "code" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "type" VARCHAR(50) NOT NULL,
    "source_entity_id" VARCHAR(36) NOT NULL,
    "source_field_id" VARCHAR(36),
    "target_entity_id" VARCHAR(36) NOT NULL,
    "target_field_id" VARCHAR(36),
    "foreign_key_name" VARCHAR(100),
    "join_table_config" JSONB,
    "on_delete" VARCHAR(20) DEFAULT 'RESTRICT',
    "on_update" VARCHAR(20) DEFAULT 'RESTRICT',
    "config" JSONB DEFAULT '{}',
    "status" VARCHAR(20) DEFAULT 'ACTIVE',
    "indexed" BOOLEAN DEFAULT true,
    "index_name" VARCHAR(100),
    "created_by" VARCHAR(36) NOT NULL,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_by" VARCHAR(36),
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lowcode_relations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lowcode"."lowcode_api_configs" (
    "id" VARCHAR(36) NOT NULL DEFAULT (gen_random_uuid())::text,
    "project_id" VARCHAR(36) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "code" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "method" VARCHAR(10) NOT NULL,
    "path" VARCHAR(500) NOT NULL,
    "entity_id" VARCHAR(36),
    "parameters" JSONB DEFAULT '[]',
    "responses" JSONB DEFAULT '[]',
    "security" JSONB DEFAULT '{"type": "none"}',
    "config" JSONB DEFAULT '{}',
    "status" VARCHAR(20) DEFAULT 'DRAFT',
    "version" VARCHAR(20) DEFAULT '1.0.0',
    "created_by" VARCHAR(36) NOT NULL,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_by" VARCHAR(36),
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lowcode_api_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lowcode"."lowcode_apis" (
    "id" VARCHAR(36) NOT NULL DEFAULT (gen_random_uuid())::text,
    "project_id" VARCHAR(36) NOT NULL,
    "entity_id" VARCHAR(36),
    "name" VARCHAR(100) NOT NULL,
    "code" VARCHAR(100) NOT NULL,
    "path" VARCHAR(200) NOT NULL,
    "method" VARCHAR(10) NOT NULL,
    "description" TEXT,
    "request_config" JSONB,
    "response_config" JSONB,
    "query_config" JSONB,
    "auth_config" JSONB,
    "version" VARCHAR(20) DEFAULT '1.0.0',
    "status" VARCHAR(20) DEFAULT 'DRAFT',
    "created_by" VARCHAR(36) NOT NULL,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_by" VARCHAR(36),
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lowcode_apis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lowcode"."lowcode_queries" (
    "id" VARCHAR(36) NOT NULL DEFAULT (gen_random_uuid())::text,
    "project_id" VARCHAR(36) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "base_entity_id" VARCHAR(36) NOT NULL,
    "base_entity_alias" VARCHAR(50) DEFAULT 'main',
    "joins" JSONB DEFAULT '[]',
    "fields" JSONB DEFAULT '[]',
    "filters" JSONB DEFAULT '[]',
    "sorting" JSONB DEFAULT '[]',
    "group_by" JSONB DEFAULT '[]',
    "having_conditions" JSONB DEFAULT '[]',
    "limit_count" INTEGER,
    "offset_count" INTEGER,
    "status" VARCHAR(20) DEFAULT 'DRAFT',
    "sql_query" TEXT,
    "execution_stats" JSONB,
    "created_by" VARCHAR(36) NOT NULL,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_by" VARCHAR(36),
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lowcode_queries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lowcode"."lowcode_codegen_tasks" (
    "id" VARCHAR(36) NOT NULL DEFAULT (gen_random_uuid())::text,
    "project_id" VARCHAR(36) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "type" VARCHAR(50) NOT NULL,
    "config" JSONB DEFAULT '{}',
    "status" VARCHAR(20) DEFAULT 'PENDING',
    "progress" INTEGER DEFAULT 0,
    "result" JSONB,
    "error_msg" TEXT,
    "output_path" VARCHAR(500),
    "created_by" VARCHAR(36) NOT NULL,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lowcode_codegen_tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lowcode"."lowcode_code_templates" (
    "id" VARCHAR(36) NOT NULL DEFAULT (gen_random_uuid())::text,
    "name" VARCHAR(100) NOT NULL,
    "code" VARCHAR(100) NOT NULL,
    "type" VARCHAR(50) NOT NULL,
    "language" VARCHAR(20) NOT NULL,
    "framework" VARCHAR(50) NOT NULL,
    "description" TEXT,
    "content" TEXT NOT NULL DEFAULT '',
    "variables" JSONB DEFAULT '[]',
    "version" VARCHAR(20) DEFAULT '1.0.0',
    "status" VARCHAR(20) DEFAULT 'ACTIVE',
    "created_by" VARCHAR(36) NOT NULL,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_by" VARCHAR(36),
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "category" VARCHAR(50) DEFAULT 'CONTROLLER',
    "tags" JSONB DEFAULT '[]',
    "is_public" BOOLEAN DEFAULT false,

    CONSTRAINT "lowcode_code_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lowcode"."lowcode_template_versions" (
    "id" VARCHAR(36) NOT NULL DEFAULT (gen_random_uuid())::text,
    "template_id" VARCHAR(36) NOT NULL,
    "version" VARCHAR(20) NOT NULL,
    "content" TEXT NOT NULL DEFAULT '',
    "variables" JSONB DEFAULT '[]',
    "changelog" TEXT,
    "created_by" VARCHAR(36) NOT NULL,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lowcode_template_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lowcode"."lowcode_project_deployments" (
    "id" VARCHAR(36) NOT NULL DEFAULT (gen_random_uuid())::text,
    "project_id" VARCHAR(36) NOT NULL,
    "version" VARCHAR(20) NOT NULL,
    "status" VARCHAR(20) NOT NULL,
    "port" INTEGER,
    "config" JSONB DEFAULT '{}',
    "logs" TEXT,
    "started_at" TIMESTAMP(6),
    "completed_at" TIMESTAMP(6),
    "error_msg" TEXT,
    "created_by" VARCHAR(36) NOT NULL,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lowcode_project_deployments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "lowcode_projects_code_key" ON "lowcode"."lowcode_projects"("code");

-- CreateIndex
CREATE INDEX "idx_lowcode_entities_project_id" ON "lowcode"."lowcode_entities"("project_id");

-- CreateIndex
CREATE INDEX "idx_lowcode_entities_status" ON "lowcode"."lowcode_entities"("status");

-- CreateIndex
CREATE UNIQUE INDEX "lowcode_entities_project_id_code_key" ON "lowcode"."lowcode_entities"("project_id", "code");

-- CreateIndex
CREATE UNIQUE INDEX "lowcode_entities_project_id_table_name_key" ON "lowcode"."lowcode_entities"("project_id", "table_name");

-- CreateIndex
CREATE INDEX "idx_lowcode_fields_entity_id" ON "lowcode"."lowcode_fields"("entity_id");

-- CreateIndex
CREATE UNIQUE INDEX "lowcode_fields_entity_id_code_key" ON "lowcode"."lowcode_fields"("entity_id", "code");

-- CreateIndex
CREATE INDEX "idx_lowcode_relations_project_id" ON "lowcode"."lowcode_relations"("project_id");

-- CreateIndex
CREATE INDEX "idx_lowcode_relations_source_entity" ON "lowcode"."lowcode_relations"("source_entity_id");

-- CreateIndex
CREATE INDEX "idx_lowcode_relations_target_entity" ON "lowcode"."lowcode_relations"("target_entity_id");

-- CreateIndex
CREATE UNIQUE INDEX "lowcode_relations_project_id_code_key" ON "lowcode"."lowcode_relations"("project_id", "code");

-- CreateIndex
CREATE INDEX "idx_lowcode_api_configs_project_id" ON "lowcode"."lowcode_api_configs"("project_id");

-- CreateIndex
CREATE UNIQUE INDEX "lowcode_api_configs_project_id_code_key" ON "lowcode"."lowcode_api_configs"("project_id", "code");

-- CreateIndex
CREATE UNIQUE INDEX "lowcode_api_configs_project_id_method_path_key" ON "lowcode"."lowcode_api_configs"("project_id", "method", "path");

-- CreateIndex
CREATE INDEX "idx_lowcode_apis_entity_id" ON "lowcode"."lowcode_apis"("entity_id");

-- CreateIndex
CREATE INDEX "idx_lowcode_apis_project_id" ON "lowcode"."lowcode_apis"("project_id");

-- CreateIndex
CREATE UNIQUE INDEX "lowcode_apis_project_id_code_key" ON "lowcode"."lowcode_apis"("project_id", "code");

-- CreateIndex
CREATE UNIQUE INDEX "lowcode_apis_project_id_path_method_key" ON "lowcode"."lowcode_apis"("project_id", "path", "method");

-- CreateIndex
CREATE INDEX "idx_lowcode_queries_base_entity_id" ON "lowcode"."lowcode_queries"("base_entity_id");

-- CreateIndex
CREATE INDEX "idx_lowcode_queries_project_id" ON "lowcode"."lowcode_queries"("project_id");

-- CreateIndex
CREATE INDEX "idx_lowcode_queries_status" ON "lowcode"."lowcode_queries"("status");

-- CreateIndex
CREATE UNIQUE INDEX "lowcode_queries_project_id_name_key" ON "lowcode"."lowcode_queries"("project_id", "name");

-- CreateIndex
CREATE INDEX "idx_lowcode_codegen_tasks_project_id" ON "lowcode"."lowcode_codegen_tasks"("project_id");

-- CreateIndex
CREATE INDEX "idx_lowcode_codegen_tasks_status" ON "lowcode"."lowcode_codegen_tasks"("status");

-- CreateIndex
CREATE UNIQUE INDEX "lowcode_code_templates_code_key" ON "lowcode"."lowcode_code_templates"("code");

-- CreateIndex
CREATE INDEX "idx_lowcode_code_templates_category" ON "lowcode"."lowcode_code_templates"("category");

-- CreateIndex
CREATE INDEX "idx_lowcode_code_templates_language" ON "lowcode"."lowcode_code_templates"("language");

-- CreateIndex
CREATE INDEX "idx_lowcode_code_templates_framework" ON "lowcode"."lowcode_code_templates"("framework");

-- CreateIndex
CREATE INDEX "idx_lowcode_code_templates_status" ON "lowcode"."lowcode_code_templates"("status");

-- CreateIndex
CREATE INDEX "idx_lowcode_code_templates_is_public" ON "lowcode"."lowcode_code_templates"("is_public");

-- CreateIndex
CREATE INDEX "idx_lowcode_template_versions_template_id" ON "lowcode"."lowcode_template_versions"("template_id");

-- CreateIndex
CREATE INDEX "idx_lowcode_template_versions_version" ON "lowcode"."lowcode_template_versions"("version");

-- CreateIndex
CREATE UNIQUE INDEX "lowcode_template_versions_template_id_version_key" ON "lowcode"."lowcode_template_versions"("template_id", "version");

-- CreateIndex
CREATE INDEX "idx_project_deployments_project_id" ON "lowcode"."lowcode_project_deployments"("project_id");

-- CreateIndex
CREATE INDEX "idx_project_deployments_status" ON "lowcode"."lowcode_project_deployments"("status");

-- AddForeignKey
ALTER TABLE "lowcode"."lowcode_entities" ADD CONSTRAINT "lowcode_entities_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "lowcode"."lowcode_projects"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "lowcode"."lowcode_fields" ADD CONSTRAINT "lowcode_fields_entity_id_fkey" FOREIGN KEY ("entity_id") REFERENCES "lowcode"."lowcode_entities"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "lowcode"."lowcode_relations" ADD CONSTRAINT "lowcode_relations_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "lowcode"."lowcode_projects"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "lowcode"."lowcode_relations" ADD CONSTRAINT "lowcode_relations_source_entity_id_fkey" FOREIGN KEY ("source_entity_id") REFERENCES "lowcode"."lowcode_entities"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "lowcode"."lowcode_relations" ADD CONSTRAINT "lowcode_relations_source_field_id_fkey" FOREIGN KEY ("source_field_id") REFERENCES "lowcode"."lowcode_fields"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "lowcode"."lowcode_relations" ADD CONSTRAINT "lowcode_relations_target_entity_id_fkey" FOREIGN KEY ("target_entity_id") REFERENCES "lowcode"."lowcode_entities"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "lowcode"."lowcode_relations" ADD CONSTRAINT "lowcode_relations_target_field_id_fkey" FOREIGN KEY ("target_field_id") REFERENCES "lowcode"."lowcode_fields"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "lowcode"."lowcode_api_configs" ADD CONSTRAINT "lowcode_api_configs_entity_id_fkey" FOREIGN KEY ("entity_id") REFERENCES "lowcode"."lowcode_entities"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "lowcode"."lowcode_api_configs" ADD CONSTRAINT "lowcode_api_configs_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "lowcode"."lowcode_projects"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "lowcode"."lowcode_apis" ADD CONSTRAINT "lowcode_apis_entity_id_fkey" FOREIGN KEY ("entity_id") REFERENCES "lowcode"."lowcode_entities"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "lowcode"."lowcode_apis" ADD CONSTRAINT "lowcode_apis_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "lowcode"."lowcode_projects"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "lowcode"."lowcode_queries" ADD CONSTRAINT "lowcode_queries_base_entity_id_fkey" FOREIGN KEY ("base_entity_id") REFERENCES "lowcode"."lowcode_entities"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "lowcode"."lowcode_queries" ADD CONSTRAINT "lowcode_queries_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "lowcode"."lowcode_projects"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "lowcode"."lowcode_template_versions" ADD CONSTRAINT "lowcode_template_versions_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "lowcode"."lowcode_code_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lowcode"."lowcode_project_deployments" ADD CONSTRAINT "lowcode_project_deployments_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "lowcode"."lowcode_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
