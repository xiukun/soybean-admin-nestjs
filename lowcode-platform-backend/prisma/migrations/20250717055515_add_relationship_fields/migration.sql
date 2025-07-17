/*
  Warnings:

  - A unique constraint covering the columns `[project_id,code]` on the table `lowcode_relations` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `code` to the `lowcode_relations` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "lowcode_relations" ADD COLUMN     "code" VARCHAR(100) NOT NULL,
ADD COLUMN     "config" JSONB NOT NULL DEFAULT '{}',
ADD COLUMN     "description" TEXT,
ADD COLUMN     "foreign_key_name" VARCHAR(100),
ADD COLUMN     "status" VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
ADD COLUMN     "updated_at" TIMESTAMP(3),
ADD COLUMN     "updated_by" TEXT,
ALTER COLUMN "source_field_id" DROP NOT NULL,
ALTER COLUMN "target_field_id" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "lowcode_relations_project_id_code_key" ON "lowcode_relations"("project_id", "code");
