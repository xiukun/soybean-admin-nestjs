import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, IsArray, IsUUID, IsBoolean, IsObject, IsNumber } from 'class-validator';

export enum RelationType {
  ONE_TO_ONE = 'ONE_TO_ONE',
  ONE_TO_MANY = 'ONE_TO_MANY',
  MANY_TO_ONE = 'MANY_TO_ONE',
  MANY_TO_MANY = 'MANY_TO_MANY',
}

export enum RelationAction {
  CASCADE = 'CASCADE',
  SET_NULL = 'SET_NULL',
  RESTRICT = 'RESTRICT',
  NO_ACTION = 'NO_ACTION',
}

export class CreateEntityRelationDto {
  @ApiProperty({ description: '关系名称' })
  @IsString()
  name: string;

  @ApiProperty({ description: '源实体ID' })
  @IsUUID()
  sourceEntityId: string;

  @ApiProperty({ description: '目标实体ID' })
  @IsUUID()
  targetEntityId: string;

  @ApiProperty({ description: '关系类型', enum: RelationType })
  @IsEnum(RelationType)
  type: RelationType;

  @ApiPropertyOptional({ description: '源字段名' })
  @IsOptional()
  @IsString()
  sourceField?: string;

  @ApiPropertyOptional({ description: '目标字段名' })
  @IsOptional()
  @IsString()
  targetField?: string;

  @ApiPropertyOptional({ description: '外键字段名' })
  @IsOptional()
  @IsString()
  foreignKey?: string;

  @ApiPropertyOptional({ description: '删除时动作', enum: RelationAction })
  @IsOptional()
  @IsEnum(RelationAction)
  onDelete?: RelationAction;

  @ApiPropertyOptional({ description: '更新时动作', enum: RelationAction })
  @IsOptional()
  @IsEnum(RelationAction)
  onUpdate?: RelationAction;

  @ApiPropertyOptional({ description: '是否必需' })
  @IsOptional()
  @IsBoolean()
  required?: boolean;

  @ApiPropertyOptional({ description: '关系描述' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: '关系配置' })
  @IsOptional()
  @IsObject()
  config?: {
    joinTable?: string;
    joinColumns?: string[];
    inverseJoinColumns?: string[];
    lazy?: boolean;
    eager?: boolean;
  };
}

export class UpdateEntityRelationDto {
  @ApiPropertyOptional({ description: '关系名称' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: '关系类型', enum: RelationType })
  @IsOptional()
  @IsEnum(RelationType)
  type?: RelationType;

  @ApiPropertyOptional({ description: '源字段名' })
  @IsOptional()
  @IsString()
  sourceField?: string;

  @ApiPropertyOptional({ description: '目标字段名' })
  @IsOptional()
  @IsString()
  targetField?: string;

  @ApiPropertyOptional({ description: '外键字段名' })
  @IsOptional()
  @IsString()
  foreignKey?: string;

  @ApiPropertyOptional({ description: '删除时动作', enum: RelationAction })
  @IsOptional()
  @IsEnum(RelationAction)
  onDelete?: RelationAction;

  @ApiPropertyOptional({ description: '更新时动作', enum: RelationAction })
  @IsOptional()
  @IsEnum(RelationAction)
  onUpdate?: RelationAction;

  @ApiPropertyOptional({ description: '是否必需' })
  @IsOptional()
  @IsBoolean()
  required?: boolean;

  @ApiPropertyOptional({ description: '关系描述' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: '关系配置' })
  @IsOptional()
  @IsObject()
  config?: {
    joinTable?: string;
    joinColumns?: string[];
    inverseJoinColumns?: string[];
    lazy?: boolean;
    eager?: boolean;
  };
}

export class QueryEntityRelationDto {
  @ApiPropertyOptional({ description: '项目ID' })
  @IsOptional()
  @IsUUID()
  projectId?: string;

  @ApiPropertyOptional({ description: '源实体ID' })
  @IsOptional()
  @IsUUID()
  sourceEntityId?: string;

  @ApiPropertyOptional({ description: '目标实体ID' })
  @IsOptional()
  @IsUUID()
  targetEntityId?: string;

  @ApiPropertyOptional({ description: '关系类型', enum: RelationType })
  @IsOptional()
  @IsEnum(RelationType)
  type?: RelationType;

  @ApiPropertyOptional({ description: '搜索关键词' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: '页码', default: 1 })
  @IsOptional()
  @IsNumber()
  page?: number = 1;

  @ApiPropertyOptional({ description: '每页数量', default: 20 })
  @IsOptional()
  @IsNumber()
  pageSize?: number = 20;
}

export class EntityRelationGraphDto {
  @ApiProperty({ description: '项目ID' })
  @IsUUID()
  projectId: string;

  @ApiPropertyOptional({ description: '是否包含字段详情' })
  @IsOptional()
  @IsBoolean()
  includeFields?: boolean;

  @ApiPropertyOptional({ description: '布局类型' })
  @IsOptional()
  @IsEnum(['hierarchical', 'force', 'circular', 'grid'])
  layout?: string;

  @ApiPropertyOptional({ description: '过滤实体ID列表' })
  @IsOptional()
  @IsArray()
  @IsUUID(undefined, { each: true })
  entityIds?: string[];
}

export class ValidateRelationDto {
  @ApiProperty({ description: '源实体ID' })
  @IsUUID()
  sourceEntityId: string;

  @ApiProperty({ description: '目标实体ID' })
  @IsUUID()
  targetEntityId: string;

  @ApiProperty({ description: '关系类型', enum: RelationType })
  @IsEnum(RelationType)
  type: RelationType;

  @ApiPropertyOptional({ description: '外键字段名' })
  @IsOptional()
  @IsString()
  foreignKey?: string;
}
