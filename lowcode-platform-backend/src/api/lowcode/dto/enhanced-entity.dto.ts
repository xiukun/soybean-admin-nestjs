import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsObject, IsEnum, IsBoolean, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { EntityStatus } from '@entity/domain/entity.model';

/**
 * 通用字段配置选项
 */
export class CommonFieldOptionsDto {
  @ApiPropertyOptional({ 
    description: '是否自动添加通用字段', 
    default: true 
  })
  @IsOptional()
  @IsBoolean()
  autoAddCommonFields?: boolean = true;

  @ApiPropertyOptional({ 
    description: '是否自动创建数据库表', 
    default: true 
  })
  @IsOptional()
  @IsBoolean()
  autoCreateTable?: boolean = true;

  @ApiPropertyOptional({ 
    description: '是否验证字段约束', 
    default: true 
  })
  @IsOptional()
  @IsBoolean()
  validateFieldConstraints?: boolean = true;

  @ApiPropertyOptional({ 
    description: '是否生成Prisma Schema', 
    default: false 
  })
  @IsOptional()
  @IsBoolean()
  generatePrismaSchema?: boolean = false;

  @ApiPropertyOptional({ 
    description: '自定义通用字段创建者ID' 
  })
  @IsOptional()
  @IsString()
  commonFieldsCreatedBy?: string;
}

/**
 * 数据库表配置选项
 */
export class DatabaseTableOptionsDto {
  @ApiPropertyOptional({ 
    description: '数据库模式名称', 
    default: 'lowcode' 
  })
  @IsOptional()
  @IsString()
  schemaName?: string = 'lowcode';

  @ApiPropertyOptional({ 
    description: '是否创建索引', 
    default: true 
  })
  @IsOptional()
  @IsBoolean()
  createIndexes?: boolean = true;

  @ApiPropertyOptional({ 
    description: '是否添加注释', 
    default: true 
  })
  @IsOptional()
  @IsBoolean()
  addComments?: boolean = true;

  @ApiPropertyOptional({ 
    description: '表存储引擎（PostgreSQL中无效）' 
  })
  @IsOptional()
  @IsString()
  engine?: string;
}

/**
 * 增强的实体创建DTO
 */
export class EnhancedCreateEntityDto {
  @ApiProperty({ description: 'Project ID', example: 'demo-project-1' })
  @IsString()
  projectId: string;

  @ApiProperty({ description: 'Entity name' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Entity code' })
  @IsString()
  code: string;

  @ApiProperty({ description: 'Database table name' })
  @IsString()
  tableName: string;

  @ApiPropertyOptional({ description: 'Entity description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Entity category' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ description: 'ER diagram position' })
  @IsOptional()
  @IsObject()
  diagramPosition?: any;

  @ApiPropertyOptional({ description: 'Entity configuration' })
  @IsOptional()
  @IsObject()
  config?: any;

  @ApiPropertyOptional({ description: 'Entity status', enum: EntityStatus })
  @IsOptional()
  @IsEnum(EntityStatus)
  status?: EntityStatus;

  @ApiPropertyOptional({ 
    description: '通用字段配置选项',
    type: CommonFieldOptionsDto
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => CommonFieldOptionsDto)
  commonFieldOptions?: CommonFieldOptionsDto;

  @ApiPropertyOptional({ 
    description: '数据库表配置选项',
    type: DatabaseTableOptionsDto
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => DatabaseTableOptionsDto)
  databaseOptions?: DatabaseTableOptionsDto;
}

/**
 * 实体创建结果DTO
 */
export class EntityCreationResultDto {
  @ApiProperty({ description: '创建的实体信息' })
  entity: any;

  @ApiProperty({ description: '是否成功添加通用字段' })
  commonFieldsAdded: boolean;

  @ApiProperty({ description: '是否成功创建数据库表' })
  databaseTableCreated: boolean;

  @ApiProperty({ description: '创建过程中的警告信息', type: [String] })
  warnings: string[];

  @ApiProperty({ description: '创建过程中的错误信息', type: [String] })
  errors: string[];

  @ApiPropertyOptional({ description: '生成的Prisma Schema内容' })
  prismaSchema?: string;

  @ApiProperty({ description: '创建时间戳' })
  createdAt: Date;
}

/**
 * 字段验证结果DTO
 */
export class FieldValidationResultDto {
  @ApiProperty({ description: '字段代码' })
  fieldCode: string;

  @ApiProperty({ description: '是否验证通过' })
  isValid: boolean;

  @ApiProperty({ description: '验证错误信息', type: [String] })
  errors: string[];

  @ApiProperty({ description: '验证警告信息', type: [String] })
  warnings: string[];
}

/**
 * 实体验证结果DTO
 */
export class EntityValidationResultDto {
  @ApiProperty({ description: '实体ID' })
  entityId: string;

  @ApiProperty({ description: '是否验证通过' })
  isValid: boolean;

  @ApiProperty({ description: '字段验证结果', type: [FieldValidationResultDto] })
  fieldValidations: FieldValidationResultDto[];

  @ApiProperty({ description: '全局错误信息', type: [String] })
  globalErrors: string[];

  @ApiProperty({ description: '全局警告信息', type: [String] })
  warnings: string[];

  @ApiProperty({ description: '验证时间戳' })
  validatedAt: Date;
}

/**
 * 数据库表状态DTO
 */
export class DatabaseTableStatusDto {
  @ApiProperty({ description: '表名' })
  tableName: string;

  @ApiProperty({ description: '表是否存在' })
  exists: boolean;

  @ApiProperty({ description: '表结构是否正确' })
  structureValid: boolean;

  @ApiProperty({ description: '缺失的列', type: [String] })
  missingColumns: string[];

  @ApiProperty({ description: '多余的列', type: [String] })
  extraColumns: string[];

  @ApiProperty({ description: '结构问题描述', type: [String] })
  issues: string[];

  @ApiProperty({ description: '检查时间戳' })
  checkedAt: Date;
}

/**
 * 批量实体创建DTO
 */
export class BatchCreateEntitiesDto {
  @ApiProperty({ 
    description: '实体列表',
    type: [EnhancedCreateEntityDto]
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EnhancedCreateEntityDto)
  entities: EnhancedCreateEntityDto[];

  @ApiPropertyOptional({ 
    description: '全局通用字段配置选项',
    type: CommonFieldOptionsDto
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => CommonFieldOptionsDto)
  globalCommonFieldOptions?: CommonFieldOptionsDto;

  @ApiPropertyOptional({ 
    description: '全局数据库配置选项',
    type: DatabaseTableOptionsDto
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => DatabaseTableOptionsDto)
  globalDatabaseOptions?: DatabaseTableOptionsDto;

  @ApiPropertyOptional({ 
    description: '是否在出现错误时继续处理其他实体', 
    default: true 
  })
  @IsOptional()
  @IsBoolean()
  continueOnError?: boolean = true;
}

/**
 * 批量实体创建结果DTO
 */
export class BatchEntityCreationResultDto {
  @ApiProperty({ description: '成功创建的实体数量' })
  successCount: number;

  @ApiProperty({ description: '失败的实体数量' })
  failureCount: number;

  @ApiProperty({ description: '创建结果详情', type: [EntityCreationResultDto] })
  results: EntityCreationResultDto[];

  @ApiProperty({ description: '全局错误信息', type: [String] })
  globalErrors: string[];

  @ApiProperty({ description: '处理时间戳' })
  processedAt: Date;
}