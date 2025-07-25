-- 低代码平台重构SQL脚本
-- Low-code Platform Refactor SQL Script
-- 版本: v2.0
-- 创建日期: 2025-07-25

-- 设置当前schema为lowcode
SET search_path TO lowcode, backend, public;

-- ============================================================================
-- 1. 更新现有表结构
-- ============================================================================

-- 更新代码模板表结构，支持新的模板管理功能
ALTER TABLE lowcode.lowcode_code_templates
ADD COLUMN IF NOT EXISTS category VARCHAR(50) DEFAULT 'CONTROLLER' CHECK (
    category IN (
        'CONTROLLER',
        'SERVICE',
        'DTO',
        'ENTITY',
        'CONFIG'
    )
);

ALTER TABLE lowcode.lowcode_code_templates
ADD COLUMN IF NOT EXISTS tags JSONB DEFAULT '[]';

ALTER TABLE lowcode.lowcode_code_templates
ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT false;

-- 重命名template字段为content，保持一致性
ALTER TABLE lowcode.lowcode_code_templates
RENAME COLUMN template TO content;

-- 更新代码生成任务表，支持新的生成逻辑
ALTER TABLE lowcode.lowcode_codegen_tasks
ADD COLUMN IF NOT EXISTS entity_ids JSONB DEFAULT '[]';

ALTER TABLE lowcode.lowcode_codegen_tasks
ADD COLUMN IF NOT EXISTS template_ids JSONB DEFAULT '[]';

ALTER TABLE lowcode.lowcode_codegen_tasks
ADD COLUMN IF NOT EXISTS generated_files JSONB DEFAULT '[]';

ALTER TABLE lowcode.lowcode_codegen_tasks
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP;

-- 更新API配置表，支持多表关联查询
ALTER TABLE lowcode.lowcode_api_configs
ADD COLUMN IF NOT EXISTS query_config JSONB DEFAULT '{}';

ALTER TABLE lowcode.lowcode_api_configs
ADD COLUMN IF NOT EXISTS request_schema JSONB DEFAULT '{}';

ALTER TABLE lowcode.lowcode_api_configs
ADD COLUMN IF NOT EXISTS response_schema JSONB DEFAULT '{}';

ALTER TABLE lowcode.lowcode_api_configs
ADD COLUMN IF NOT EXISTS auth_required BOOLEAN DEFAULT true;

ALTER TABLE lowcode.lowcode_api_configs
ADD COLUMN IF NOT EXISTS rate_limit INTEGER;

ALTER TABLE lowcode.lowcode_api_configs
ADD COLUMN IF NOT EXISTS cache_ttl INTEGER;

-- ============================================================================
-- 2. 创建新表
-- ============================================================================

-- 模板版本表
CREATE TABLE IF NOT EXISTS lowcode.lowcode_template_versions (
    id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    template_id VARCHAR(36) NOT NULL,
    version VARCHAR(20) NOT NULL,
    content TEXT NOT NULL,
    variables JSONB DEFAULT '[]',
    changelog TEXT,
    created_by VARCHAR(36) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (template_id) REFERENCES lowcode_code_templates(id) ON DELETE CASCADE,
    UNIQUE(template_id, version)
);

-- 代码生成配置表
CREATE TABLE IF NOT EXISTS lowcode.lowcode_generation_configs (
    id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    project_id VARCHAR(36) NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    base_config JSONB DEFAULT '{}',
    biz_config JSONB DEFAULT '{}',
    output_config JSONB DEFAULT '{}',
    template_mapping JSONB DEFAULT '{}',
    status VARCHAR(20) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE')),
    created_by VARCHAR(36) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_by VARCHAR(36),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES lowcode_projects(id) ON DELETE CASCADE,
    UNIQUE(project_id, name)
);

-- 实体关系映射表（用于多表关联查询配置）
CREATE TABLE IF NOT EXISTS lowcode.lowcode_entity_relations (
    id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    project_id VARCHAR(36) NOT NULL,
    source_entity_id VARCHAR(36) NOT NULL,
    target_entity_id VARCHAR(36) NOT NULL,
    relation_name VARCHAR(100) NOT NULL,
    relation_type VARCHAR(20) NOT NULL CHECK (relation_type IN ('ONE_TO_ONE', 'ONE_TO_MANY', 'MANY_TO_ONE', 'MANY_TO_MANY')),
    source_field VARCHAR(50),
    target_field VARCHAR(50),
    join_config JSONB DEFAULT '{}',
    status VARCHAR(20) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE')),
    created_by VARCHAR(36) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_by VARCHAR(36),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES lowcode_projects(id) ON DELETE CASCADE,
    FOREIGN KEY (source_entity_id) REFERENCES lowcode_entities(id) ON DELETE CASCADE,
    FOREIGN KEY (target_entity_id) REFERENCES lowcode_entities(id) ON DELETE CASCADE,
    UNIQUE(project_id, source_entity_id, target_entity_id, relation_name)
);

-- ============================================================================
-- 3. 创建新索引
-- ============================================================================

-- 模板相关索引
CREATE INDEX IF NOT EXISTS idx_lowcode_code_templates_category ON lowcode_code_templates (category);

CREATE INDEX IF NOT EXISTS idx_lowcode_code_templates_language ON lowcode_code_templates (language);

CREATE INDEX IF NOT EXISTS idx_lowcode_code_templates_framework ON lowcode_code_templates (framework);

CREATE INDEX IF NOT EXISTS idx_lowcode_code_templates_status ON lowcode_code_templates (status);

CREATE INDEX IF NOT EXISTS idx_lowcode_code_templates_is_public ON lowcode_code_templates (is_public);

-- 模板版本索引
CREATE INDEX IF NOT EXISTS idx_lowcode_template_versions_template_id ON lowcode_template_versions (template_id);

CREATE INDEX IF NOT EXISTS idx_lowcode_template_versions_version ON lowcode_template_versions (version);

-- 代码生成相关索引
CREATE INDEX IF NOT EXISTS idx_lowcode_generation_configs_project_id ON lowcode_generation_configs (project_id);

CREATE INDEX IF NOT EXISTS idx_lowcode_generation_configs_status ON lowcode_generation_configs (status);

-- 实体关系索引
CREATE INDEX IF NOT EXISTS idx_lowcode_entity_relations_project_id ON lowcode_entity_relations (project_id);

CREATE INDEX IF NOT EXISTS idx_lowcode_entity_relations_source_entity ON lowcode_entity_relations (source_entity_id);

CREATE INDEX IF NOT EXISTS idx_lowcode_entity_relations_target_entity ON lowcode_entity_relations (target_entity_id);

CREATE INDEX IF NOT EXISTS idx_lowcode_entity_relations_type ON lowcode_entity_relations (relation_type);

-- ============================================================================
-- 4. 添加触发器
-- ============================================================================

-- 为新表添加更新时间触发器
CREATE TRIGGER update_lowcode_template_versions_updated_at 
    BEFORE UPDATE ON lowcode_template_versions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_lowcode_generation_configs_updated_at 
    BEFORE UPDATE ON lowcode_generation_configs 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_lowcode_entity_relations_updated_at 
    BEFORE UPDATE ON lowcode_entity_relations 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 5. 添加表注释
-- ============================================================================

COMMENT ON TABLE lowcode_template_versions IS '低代码平台模板版本表';

COMMENT ON TABLE lowcode_generation_configs IS '低代码平台代码生成配置表';

COMMENT ON TABLE lowcode_entity_relations IS '低代码平台实体关系映射表';

-- 添加字段注释
COMMENT ON COLUMN lowcode_code_templates.category IS '模板分类：CONTROLLER, SERVICE, DTO, ENTITY, CONFIG';

COMMENT ON COLUMN lowcode_code_templates.tags IS '模板标签，JSON数组格式';

COMMENT ON COLUMN lowcode_code_templates.is_public IS '是否为公共模板';

COMMENT ON COLUMN lowcode_code_templates.content IS '模板内容，支持Handlebars语法';

COMMENT ON COLUMN lowcode_codegen_tasks.entity_ids IS '选中的实体ID列表，JSON数组格式';

COMMENT ON COLUMN lowcode_codegen_tasks.template_ids IS '使用的模板ID列表，JSON数组格式';

COMMENT ON COLUMN lowcode_codegen_tasks.generated_files IS '生成的文件列表，JSON数组格式';

COMMENT ON COLUMN lowcode_codegen_tasks.completed_at IS '任务完成时间';

COMMENT ON COLUMN lowcode_api_configs.query_config IS '查询配置，支持多表关联';

COMMENT ON COLUMN lowcode_api_configs.request_schema IS '请求参数Schema';

COMMENT ON COLUMN lowcode_api_configs.response_schema IS '响应数据Schema';

COMMENT ON COLUMN lowcode_api_configs.auth_required IS '是否需要认证';

COMMENT ON COLUMN lowcode_api_configs.rate_limit IS '速率限制（请求/分钟）';

COMMENT ON COLUMN lowcode_api_configs.cache_ttl IS '缓存时间（秒）';

-- ============================================================================
-- 6. 插入默认数据
-- ============================================================================

-- 插入默认的代码模板
INSERT INTO
    lowcode.lowcode_code_templates (
        name,
        code,
        category,
        language,
        framework,
        description,
        content,
        variables,
        is_public,
        created_by
    )
VALUES (
        'NestJS Base Controller Template',
        'nestjs-base-controller',
        'CONTROLLER',
        'TYPESCRIPT',
        'NESTJS',
        'NestJS基础控制器模板，支持AMIS标准格式',
        '{{! NestJS Base Controller Template }}
import { Controller, Get, Post, Put, Delete, Body, Param, Query } from ''@nestjs/common'';
import { ApiTags, ApiOperation, ApiResponse } from ''@nestjs/swagger'';
{{#if config.generateAuth}}
import { UseGuards } from ''@nestjs/common'';
import { JwtAuthGuard } from ''@guards/jwt-auth.guard'';
{{/if}}
import { {{pascalCase entity.code}}BaseService } from ''../services/{{kebabCase entity.code}}.base.service'';

@ApiTags(''{{entity.name}}管理'')
{{#if config.generateAuth}}
@UseGuards(JwtAuthGuard)
{{/if}}
@Controller(''{{kebabCase entity.code}}'')
export abstract class {{pascalCase entity.code}}BaseController {
  constructor(
    protected readonly {{camelCase entity.code}}Service: {{pascalCase entity.code}}BaseService,
  ) {}

  @Get()
  @ApiOperation({ summary: ''获取{{entity.name}}列表'' })
  async findAll(@Query() query: any) {
    const result = await this.{{camelCase entity.code}}Service.findAll(query);
    return {
      status: 0,
      msg: ''success'',
      data: {
        options: result.options,
        total: result.total,
        page: result.page,
        perPage: result.perPage,
      },
    };
  }
}',
        '[
      {"name": "entity", "type": "object", "required": true, "description": "实体信息"},
      {"name": "config", "type": "object", "required": false, "description": "配置信息"}
    ]',
        true,
        'system'
    ) ON CONFLICT (code) DO NOTHING,
    (
        'NestJS Base Service Template',
        'nestjs-base-service',
        'SERVICE',
        'TYPESCRIPT',
        'NESTJS',
        'NestJS基础服务模板，包含CRUD操作',
        '{{! NestJS Base Service Template }}
import { Injectable } from ''@nestjs/common'';
import { PrismaService } from ''@lib/shared/prisma/prisma.service'';

@Injectable()
export abstract class {{pascalCase entity.code}}BaseService {
  constructor(protected readonly prisma: PrismaService) {}

  async findAll(query: any) {
    const { page = 1, perPage = 10, ...filters } = query;
    const skip = (page - 1) * perPage;

    const [options, total] = await Promise.all([
      this.prisma.{{camelCase entity.tableName}}.findMany({
        where: filters,
        skip,
        take: perPage,
        orderBy: { createdAt: ''desc'' },
      }),
      this.prisma.{{camelCase entity.tableName}}.count({ where: filters }),
    ]);

    return {
      options,
      total,
      page: Number(page),
      perPage: Number(perPage),
    };
  }

  async findOne(id: string) {
    return this.prisma.{{camelCase entity.tableName}}.findUnique({
      where: { id },
    });
  }

  async create(data: any) {
    return this.prisma.{{camelCase entity.tableName}}.create({
      data,
    });
  }

  async update(id: string, data: any) {
    return this.prisma.{{camelCase entity.tableName}}.update({
      where: { id },
      data,
    });
  }

  async remove(id: string) {
    return this.prisma.{{camelCase entity.tableName}}.delete({
      where: { id },
    });
  }
}',
        '[
      {"name": "entity", "type": "object", "required": true, "description": "实体信息"}
    ]',
        true,
        'system'
    ) ON CONFLICT (code) DO NOTHING,
    (
        'NestJS DTO Template',
        'nestjs-dto',
        'DTO',
        'TYPESCRIPT',
        'NESTJS',
        'NestJS DTO模板，包含验证规则',
        '{{! NestJS DTO Template }}
import { IsString, IsOptional, IsBoolean, IsNumber, IsDate } from ''class-validator'';
import { ApiProperty, ApiPropertyOptional } from ''@nestjs/swagger'';
import { Type } from ''class-transformer'';

export class {{pascalCase entity.code}}BaseDto {
{{#each fields}}
  {{#if this.nullable}}
  @ApiPropertyOptional({ description: ''{{this.comment}}'' })
  @IsOptional()
  {{else}}
  @ApiProperty({ description: ''{{this.comment}}'' })
  {{/if}}
  {{#eq this.type "STRING"}}
  @IsString()
  {{/eq}}
  {{#eq this.type "INTEGER"}}
  @IsNumber()
  @Type(() => Number)
  {{/eq}}
  {{#eq this.type "BOOLEAN"}}
  @IsBoolean()
  @Type(() => Boolean)
  {{/eq}}
  {{#eq this.type "DATE"}}
  @IsDate()
  @Type(() => Date)
  {{/eq}}
  {{camelCase this.code}}{{#if this.nullable}}?{{/if}}: {{#eq this.type "STRING"}}string{{/eq}}{{#eq this.type "INTEGER"}}number{{/eq}}{{#eq this.type "BOOLEAN"}}boolean{{/eq}}{{#eq this.type "DATE"}}Date{{/eq}};

{{/each}}
}

export class Create{{pascalCase entity.code}}BaseDto extends {{pascalCase entity.code}}BaseDto {}

export class Update{{pascalCase entity.code}}BaseDto extends {{pascalCase entity.code}}BaseDto {}

export class {{pascalCase entity.code}}QueryDto {
  @ApiPropertyOptional({ description: ''页码'', default: 1 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  page?: number = 1;

  @ApiPropertyOptional({ description: ''每页数量'', default: 10 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  perPage?: number = 10;

  @ApiPropertyOptional({ description: ''排序字段'' })
  @IsOptional()
  @IsString()
  orderBy?: string;

  @ApiPropertyOptional({ description: ''排序方向'', enum: [''asc'', ''desc''] })
  @IsOptional()
  @IsString()
  orderDir?: ''asc'' | ''desc'';

  @ApiPropertyOptional({ description: ''关键词搜索'' })
  @IsOptional()
  @IsString()
  keywords?: string;
}',
        '[
      {"name": "entity", "type": "object", "required": true, "description": "实体信息"},
      {"name": "fields", "type": "array", "required": true, "description": "字段列表"}
    ]',
        true,
        'system'
    ) ON CONFLICT (code) DO NOTHING;

-- 插入默认的代码生成配置
INSERT INTO
    lowcode.lowcode_generation_configs (
        project_id,
        name,
        description,
        base_config,
        biz_config,
        output_config,
        created_by
    )
SELECT p.id, 'Default Generation Config', '默认代码生成配置', '{
        "generateAuth": true,
        "generateValidation": true,
        "generateSwagger": true,
        "generateTests": false,
        "outputFormat": "typescript"
    }', '{
        "allowCustomization": true,
        "preserveCustomCode": true,
        "generateInterfaces": true
    }', '{
        "baseDir": "src/base",
        "bizDir": "src/biz",
        "testDir": "src/test"
    }', 'system'
FROM lowcode.lowcode_projects p
WHERE
    NOT EXISTS (
        SELECT 1
        FROM lowcode.lowcode_generation_configs gc
        WHERE
            gc.project_id = p.id
            AND gc.name = 'Default Generation Config'
    );

-- ============================================================================
-- 7. 数据迁移和清理
-- ============================================================================

-- 更新现有模板的分类
UPDATE lowcode.lowcode_code_templates
SET
    category = CASE
        WHEN type IN (
            'ENTITY_CONTROLLER',
            'API_CONTROLLER'
        ) THEN 'CONTROLLER'
        WHEN type IN ('ENTITY_SERVICE') THEN 'SERVICE'
        WHEN type IN ('ENTITY_DTO') THEN 'DTO'
        WHEN type IN (
            'ENTITY_MODEL',
            'ENTITY_REPOSITORY'
        ) THEN 'ENTITY'
        ELSE 'CONFIG'
    END
WHERE
    category IS NULL;

-- 清理重复的API配置
DELETE FROM lowcode.lowcode_api_configs a
WHERE
    EXISTS (
        SELECT 1
        FROM lowcode.lowcode_api_configs b
        WHERE
            a.project_id = b.project_id
            AND a.method = b.method
            AND a.path = b.path
            AND a.id > b.id
    );

-- ============================================================================
-- 8. 权限和安全设置
-- ============================================================================

-- 创建低代码平台相关的权限记录（如果需要）
-- 这里可以根据实际的权限系统进行调整

-- ============================================================================
-- 9. 性能优化
-- ============================================================================

-- 分析表统计信息
ANALYZE lowcode.lowcode_projects;

ANALYZE lowcode.lowcode_entities;

ANALYZE lowcode.lowcode_fields;

ANALYZE lowcode.lowcode_relations;

ANALYZE lowcode.lowcode_api_configs;

ANALYZE lowcode.lowcode_code_templates;

ANALYZE lowcode.lowcode_codegen_tasks;

ANALYZE lowcode.lowcode_template_versions;

ANALYZE lowcode.lowcode_generation_configs;

ANALYZE lowcode.lowcode_entity_relations;

-- ============================================================================
-- 10. 验证脚本
-- ============================================================================

-- 验证表结构是否正确创建
DO $$
DECLARE
    table_count INTEGER;
    index_count INTEGER;
BEGIN
    -- 检查核心表是否存在
    SELECT COUNT(*) INTO table_count
    FROM information_schema.tables
    WHERE table_schema = 'lowcode'
    AND table_name IN (
        'lowcode_projects', 'lowcode_entities', 'lowcode_fields',
        'lowcode_relations', 'lowcode_api_configs', 'lowcode_code_templates',
        'lowcode_codegen_tasks', 'lowcode_template_versions',
        'lowcode_generation_configs', 'lowcode_entity_relations'
    );

    IF table_count < 10 THEN
        RAISE EXCEPTION '低代码平台表创建不完整，期望10个表，实际%个表', table_count;
    END IF;

    -- 检查索引是否创建
    SELECT COUNT(*) INTO index_count
    FROM pg_indexes
    WHERE schemaname = 'lowcode'
    AND indexname LIKE 'idx_lowcode_%';

    IF index_count < 15 THEN
        RAISE NOTICE '低代码平台索引创建可能不完整，当前%个索引', index_count;
    END IF;

    RAISE NOTICE '低代码平台数据库重构完成！表数量: %, 索引数量: %', table_count, index_count;
END $$;

-- 显示重构完成信息
SELECT
    '低代码平台数据库重构完成' as status,
    NOW() as completed_at,
    'v2.0' as version,
    '支持双层代码生成、模板管理、多表关联查询' as features;