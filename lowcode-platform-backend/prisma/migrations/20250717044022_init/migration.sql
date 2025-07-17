-- CreateTable
CREATE TABLE "lowcode_projects" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "code" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "version" VARCHAR(20) NOT NULL DEFAULT '1.0.0',
    "config" JSONB NOT NULL DEFAULT '{}',
    "status" VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_by" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lowcode_projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lowcode_entities" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "code" VARCHAR(100) NOT NULL,
    "table_name" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "category" VARCHAR(50),
    "diagram_position" JSONB,
    "config" JSONB NOT NULL DEFAULT '{}',
    "version" VARCHAR(20) NOT NULL DEFAULT '1.0.0',
    "status" VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_by" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lowcode_entities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lowcode_fields" (
    "id" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "code" VARCHAR(100) NOT NULL,
    "type" VARCHAR(50) NOT NULL,
    "length" INTEGER,
    "precision" INTEGER,
    "scale" INTEGER,
    "nullable" BOOLEAN NOT NULL DEFAULT true,
    "unique_constraint" BOOLEAN NOT NULL DEFAULT false,
    "indexed" BOOLEAN NOT NULL DEFAULT false,
    "primary_key" BOOLEAN NOT NULL DEFAULT false,
    "default_value" TEXT,
    "validation_rules" JSONB,
    "reference_config" JSONB,
    "enum_options" JSONB,
    "comment" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_by" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lowcode_fields_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lowcode_relations" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "type" VARCHAR(50) NOT NULL,
    "source_entity_id" TEXT NOT NULL,
    "source_field_id" TEXT NOT NULL,
    "target_entity_id" TEXT NOT NULL,
    "target_field_id" TEXT NOT NULL,
    "join_table_config" JSONB,
    "on_delete" VARCHAR(20) DEFAULT 'RESTRICT',
    "on_update" VARCHAR(20) DEFAULT 'RESTRICT',
    "indexed" BOOLEAN NOT NULL DEFAULT true,
    "index_name" VARCHAR(100),
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lowcode_relations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lowcode_apis" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "entity_id" TEXT,
    "name" VARCHAR(100) NOT NULL,
    "code" VARCHAR(100) NOT NULL,
    "path" VARCHAR(200) NOT NULL,
    "method" VARCHAR(10) NOT NULL,
    "description" TEXT,
    "request_config" JSONB,
    "response_config" JSONB,
    "query_config" JSONB,
    "auth_config" JSONB,
    "version" VARCHAR(20) NOT NULL DEFAULT '1.0.0',
    "status" VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_by" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lowcode_apis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lowcode_codegen_tasks" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "type" VARCHAR(50) NOT NULL,
    "config" JSONB NOT NULL DEFAULT '{}',
    "status" VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    "progress" INTEGER NOT NULL DEFAULT 0,
    "result" JSONB,
    "error_msg" TEXT,
    "output_path" VARCHAR(500),
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lowcode_codegen_tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lowcode_code_templates" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "code" VARCHAR(100) NOT NULL,
    "type" VARCHAR(50) NOT NULL,
    "language" VARCHAR(20) NOT NULL,
    "framework" VARCHAR(50) NOT NULL,
    "description" TEXT,
    "template" TEXT NOT NULL,
    "variables" JSONB DEFAULT '[]',
    "version" VARCHAR(20) NOT NULL DEFAULT '1.0.0',
    "status" VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_by" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lowcode_code_templates_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "lowcode_projects_code_key" ON "lowcode_projects"("code");

-- CreateIndex
CREATE UNIQUE INDEX "lowcode_entities_project_id_code_key" ON "lowcode_entities"("project_id", "code");

-- CreateIndex
CREATE UNIQUE INDEX "lowcode_entities_project_id_table_name_key" ON "lowcode_entities"("project_id", "table_name");

-- CreateIndex
CREATE UNIQUE INDEX "lowcode_fields_entity_id_code_key" ON "lowcode_fields"("entity_id", "code");

-- CreateIndex
CREATE UNIQUE INDEX "lowcode_apis_project_id_code_key" ON "lowcode_apis"("project_id", "code");

-- CreateIndex
CREATE UNIQUE INDEX "lowcode_apis_project_id_path_method_key" ON "lowcode_apis"("project_id", "path", "method");

-- CreateIndex
CREATE UNIQUE INDEX "lowcode_code_templates_code_key" ON "lowcode_code_templates"("code");

-- AddForeignKey
ALTER TABLE "lowcode_entities" ADD CONSTRAINT "lowcode_entities_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "lowcode_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lowcode_fields" ADD CONSTRAINT "lowcode_fields_entity_id_fkey" FOREIGN KEY ("entity_id") REFERENCES "lowcode_entities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lowcode_relations" ADD CONSTRAINT "lowcode_relations_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "lowcode_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lowcode_relations" ADD CONSTRAINT "lowcode_relations_source_entity_id_fkey" FOREIGN KEY ("source_entity_id") REFERENCES "lowcode_entities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lowcode_relations" ADD CONSTRAINT "lowcode_relations_source_field_id_fkey" FOREIGN KEY ("source_field_id") REFERENCES "lowcode_fields"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lowcode_relations" ADD CONSTRAINT "lowcode_relations_target_entity_id_fkey" FOREIGN KEY ("target_entity_id") REFERENCES "lowcode_entities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lowcode_relations" ADD CONSTRAINT "lowcode_relations_target_field_id_fkey" FOREIGN KEY ("target_field_id") REFERENCES "lowcode_fields"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lowcode_apis" ADD CONSTRAINT "lowcode_apis_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "lowcode_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lowcode_apis" ADD CONSTRAINT "lowcode_apis_entity_id_fkey" FOREIGN KEY ("entity_id") REFERENCES "lowcode_entities"("id") ON DELETE CASCADE ON UPDATE CASCADE;
