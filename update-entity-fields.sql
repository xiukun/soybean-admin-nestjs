-- 为每个实体添加默认系统字段
-- 1. 租户ID字段
INSERT INTO lowcode_fields (id, entity_id, name, code, type, length, nullable, unique_constraint, indexed, primary_key, default_value, comment, sort_order, created_by, created_at, updated_at)
SELECT
  'field-' || e.code || '-tenant-id',
  e.id,
  '租户ID',
  'tenantId',
  'STRING',
  36,
  true,
  false,
  true,
  false,
  null,
  '租户ID，用于多租户数据隔离',
  0,
  'system',
  NOW(),
  NOW()
FROM lowcode_entities e
WHERE e.project_id = 'demo-project-1'
  AND NOT EXISTS (
    SELECT 1 FROM lowcode_fields f
    WHERE f.entity_id = e.id AND f.code = 'tenantId'
  );

-- 2. 创建时间字段
INSERT INTO lowcode_fields (id, entity_id, name, code, type, nullable, unique_constraint, indexed, primary_key, default_value, comment, sort_order, created_by, created_at, updated_at)
SELECT
  'field-' || e.code || '-created-at',
  e.id,
  '创建时间',
  'createdAt',
  'DATETIME',
  false,
  false,
  true,
  false,
  'now()',
  '记录创建时间',
  997,
  'system',
  NOW(),
  NOW()
FROM lowcode_entities e
WHERE e.project_id = 'demo-project-1'
  AND NOT EXISTS (
    SELECT 1 FROM lowcode_fields f
    WHERE f.entity_id = e.id AND f.code = 'createdAt'
  );

-- 3. 更新时间字段
INSERT INTO lowcode_fields (id, entity_id, name, code, type, nullable, unique_constraint, indexed, primary_key, default_value, comment, sort_order, created_by, created_at, updated_at)
SELECT
  'field-' || e.code || '-updated-at',
  e.id,
  '更新时间',
  'updatedAt',
  'DATETIME',
  false,
  false,
  true,
  false,
  'now()',
  '记录最后更新时间',
  998,
  'system',
  NOW(),
  NOW()
FROM lowcode_entities e
WHERE e.project_id = 'demo-project-1'
  AND NOT EXISTS (
    SELECT 1 FROM lowcode_fields f
    WHERE f.entity_id = e.id AND f.code = 'updatedAt'
  );

-- 4. 创建人字段
INSERT INTO lowcode_fields (id, entity_id, name, code, type, length, nullable, unique_constraint, indexed, primary_key, default_value, comment, sort_order, created_by, created_at, updated_at)
SELECT
  'field-' || e.code || '-created-by',
  e.id,
  '创建人',
  'createdBy',
  'STRING',
  36,
  true,
  false,
  true,
  false,
  null,
  '记录创建人ID',
  999,
  'system',
  NOW(),
  NOW()
FROM lowcode_entities e
WHERE e.project_id = 'demo-project-1'
  AND NOT EXISTS (
    SELECT 1 FROM lowcode_fields f
    WHERE f.entity_id = e.id AND f.code = 'createdBy'
  );

-- 5. 更新人字段
INSERT INTO lowcode_fields (id, entity_id, name, code, type, length, nullable, unique_constraint, indexed, primary_key, default_value, comment, sort_order, created_by, created_at, updated_at)
SELECT
  'field-' || e.code || '-updated-by',
  e.id,
  '更新人',
  'updatedBy',
  'STRING',
  36,
  true,
  false,
  true,
  false,
  null,
  '记录最后更新人ID',
  1000,
  'system',
  NOW(),
  NOW()
FROM lowcode_entities e
WHERE e.project_id = 'demo-project-1'
  AND NOT EXISTS (
    SELECT 1 FROM lowcode_fields f
    WHERE f.entity_id = e.id AND f.code = 'updatedBy'
  );
