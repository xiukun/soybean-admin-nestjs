-- CreateTable
CREATE TABLE "sys_dict_item" (
    "id" TEXT NOT NULL,
    "dict_id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "dict_value" TEXT NOT NULL,
    "sequence" INTEGER NOT NULL DEFAULT 0,
    "status" "Status" NOT NULL DEFAULT 'ENABLED',
    "remark" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT NOT NULL,
    "updated_at" TIMESTAMP(3),
    "updated_by" TEXT,

    CONSTRAINT "sys_dict_item_pkey" PRIMARY KEY ("id")
);

-- Indexes & Constraints
CREATE INDEX "sys_dict_item_dict_id_idx" ON "sys_dict_item"("dict_id");
CREATE UNIQUE INDEX "sys_dict_item_dict_id_dict_value_key" ON "sys_dict_item"("dict_id", "dict_value");
