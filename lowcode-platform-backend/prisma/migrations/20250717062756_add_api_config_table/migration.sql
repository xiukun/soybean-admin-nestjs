-- CreateTable
CREATE TABLE "lowcode_api_configs" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "code" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "method" VARCHAR(10) NOT NULL,
    "path" VARCHAR(500) NOT NULL,
    "entity_id" TEXT,
    "parameters" JSONB NOT NULL DEFAULT '[]',
    "responses" JSONB NOT NULL DEFAULT '[]',
    "security" JSONB NOT NULL DEFAULT '{"type":"none"}',
    "config" JSONB NOT NULL DEFAULT '{}',
    "status" VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    "version" VARCHAR(20) NOT NULL DEFAULT '1.0.0',
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_by" TEXT,
    "updated_at" TIMESTAMP(3),

    CONSTRAINT "lowcode_api_configs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "lowcode_api_configs_project_id_code_key" ON "lowcode_api_configs"("project_id", "code");

-- CreateIndex
CREATE UNIQUE INDEX "lowcode_api_configs_project_id_method_path_key" ON "lowcode_api_configs"("project_id", "method", "path");

-- AddForeignKey
ALTER TABLE "lowcode_api_configs" ADD CONSTRAINT "lowcode_api_configs_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "lowcode_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lowcode_api_configs" ADD CONSTRAINT "lowcode_api_configs_entity_id_fkey" FOREIGN KEY ("entity_id") REFERENCES "lowcode_entities"("id") ON DELETE SET NULL ON UPDATE CASCADE;
