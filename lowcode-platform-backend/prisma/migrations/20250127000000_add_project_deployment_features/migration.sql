-- AlterTable
ALTER TABLE "lowcode"."lowcode_projects" ADD COLUMN     "deployment_config" JSONB DEFAULT '{}',
ADD COLUMN     "deployment_logs" TEXT,
ADD COLUMN     "deployment_port" INTEGER,
ADD COLUMN     "deployment_status" VARCHAR(20) DEFAULT 'INACTIVE',
ADD COLUMN     "last_deployed_at" TIMESTAMP(6);

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
CREATE INDEX "idx_project_deployments_project_id" ON "lowcode"."lowcode_project_deployments"("project_id");

-- CreateIndex
CREATE INDEX "idx_project_deployments_status" ON "lowcode"."lowcode_project_deployments"("status");

-- AddForeignKey
ALTER TABLE "lowcode"."lowcode_project_deployments" ADD CONSTRAINT "lowcode_project_deployments_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "lowcode"."lowcode_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
