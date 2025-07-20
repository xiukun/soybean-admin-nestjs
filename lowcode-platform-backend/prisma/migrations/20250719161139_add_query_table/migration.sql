-- CreateTable
CREATE TABLE "lowcode_queries" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "base_entity_id" TEXT NOT NULL,
    "base_entity_alias" TEXT NOT NULL DEFAULT 'main',
    "joins" JSONB NOT NULL DEFAULT '[]',
    "fields" JSONB NOT NULL DEFAULT '[]',
    "filters" JSONB NOT NULL DEFAULT '[]',
    "sorting" JSONB NOT NULL DEFAULT '[]',
    "group_by" JSONB NOT NULL DEFAULT '[]',
    "having" JSONB NOT NULL DEFAULT '[]',
    "limit" INTEGER,
    "offset" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "sql_query" TEXT,
    "execution_stats" JSONB,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_by" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lowcode_queries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "lowcode_queries_project_id_name_key" ON "lowcode_queries"("project_id", "name");

-- AddForeignKey
ALTER TABLE "lowcode_queries" ADD CONSTRAINT "lowcode_queries_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "lowcode_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lowcode_queries" ADD CONSTRAINT "lowcode_queries_base_entity_id_fkey" FOREIGN KEY ("base_entity_id") REFERENCES "lowcode_entities"("id") ON DELETE CASCADE ON UPDATE CASCADE;
