-- 插入代码模板
INSERT INTO lowcode_code_templates (id, name, code, type, language, framework, description, template, variables, status, created_by, created_at, updated_at)
VALUES
  ('tpl-001', 'NestJS实体模板', 'nestjs_entity', 'ENTITY_MODEL', 'TYPESCRIPT', 'NESTJS', 'NestJS实体类模板',
   'import { Entity, Column, PrimaryGeneratedColumn } from ''typeorm'';

@Entity(''{{tableName}}'')
export class {{entityName}} {
  @PrimaryGeneratedColumn(''uuid'')
  id: string;
}',
   '[{"name": "entityName", "type": "string", "required": true}]',
   'ACTIVE', 'admin', NOW(), NOW()),

  ('tpl-002', 'NestJS控制器模板', 'nestjs_controller', 'ENTITY_CONTROLLER', 'TYPESCRIPT', 'NESTJS', 'NestJS控制器模板',
   '@Controller(''{{routePath}}'')
export class {{controllerName}} {
  @Get()
  findAll() {
    return [];
  }
}',
   '[{"name": "controllerName", "type": "string", "required": true}]',
   'ACTIVE', 'admin', NOW(), NOW()),

  ('tpl-003', 'NestJS服务模板', 'nestjs_service', 'ENTITY_SERVICE', 'TYPESCRIPT', 'NESTJS', 'NestJS服务类模板',
   '@Injectable()
export class {{serviceName}} {
  findAll() {
    return [];
  }
}',
   '[{"name": "serviceName", "type": "string", "required": true}]',
   'ACTIVE', 'admin', NOW(), NOW());
