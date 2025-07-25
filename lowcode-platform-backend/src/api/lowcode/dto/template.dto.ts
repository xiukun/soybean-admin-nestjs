import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsArray, IsBoolean, IsEnum, IsNumber, IsObject } from 'class-validator';
import { Transform } from 'class-transformer';

export enum TemplateCategory {
  CONTROLLER = 'CONTROLLER',
  SERVICE = 'SERVICE',
  MODEL = 'MODEL',
  DTO = 'DTO',
  COMPONENT = 'COMPONENT',
  PAGE = 'PAGE',
  CONFIG = 'CONFIG',
  TEST = 'TEST',
}

export enum TemplateLanguage {
  TYPESCRIPT = 'TYPESCRIPT',
  JAVASCRIPT = 'JAVASCRIPT',
  JAVA = 'JAVA',
  PYTHON = 'PYTHON',
  CSHARP = 'CSHARP',
  GO = 'GO',
}

export enum TemplateFramework {
  NESTJS = 'NESTJS',
  EXPRESS = 'EXPRESS',
  SPRING = 'SPRING',
  DJANGO = 'DJANGO',
  DOTNET = 'DOTNET',
  GIN = 'GIN',
}

export enum TemplateStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  DEPRECATED = 'DEPRECATED',
}

export class TemplateVariableDto {
  @ApiProperty({ description: 'Variable name' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Variable type', enum: ['string', 'number', 'boolean', 'array', 'object'] })
  @IsString()
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';

  @ApiPropertyOptional({ description: 'Variable description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Default value' })
  @IsOptional()
  defaultValue?: any;

  @ApiProperty({ description: 'Is required' })
  @IsBoolean()
  required: boolean;

  @ApiPropertyOptional({ description: 'Validation rules' })
  @IsOptional()
  @IsObject()
  validation?: {
    pattern?: string;
    minLength?: number;
    maxLength?: number;
    min?: number;
    max?: number;
  };
}

export class CreateTemplateDto {
  @ApiProperty({ description: 'Template name' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: 'Template description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Template category', enum: TemplateCategory })
  @IsEnum(TemplateCategory)
  category: TemplateCategory;

  @ApiProperty({ description: 'Programming language', enum: TemplateLanguage })
  @IsEnum(TemplateLanguage)
  language: TemplateLanguage;

  @ApiPropertyOptional({ description: 'Framework', enum: TemplateFramework })
  @IsOptional()
  @IsEnum(TemplateFramework)
  framework?: TemplateFramework;

  @ApiProperty({ description: 'Template content' })
  @IsString()
  content: string;

  @ApiPropertyOptional({ description: 'Template variables', type: [TemplateVariableDto] })
  @IsOptional()
  @IsArray()
  variables?: TemplateVariableDto[];

  @ApiPropertyOptional({ description: 'Template tags' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({ description: 'Is public template', default: false })
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;
}

export class UpdateTemplateDto {
  @ApiPropertyOptional({ description: 'Template name' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'Template description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Template category', enum: TemplateCategory })
  @IsOptional()
  @IsEnum(TemplateCategory)
  category?: TemplateCategory;

  @ApiPropertyOptional({ description: 'Programming language', enum: TemplateLanguage })
  @IsOptional()
  @IsEnum(TemplateLanguage)
  language?: TemplateLanguage;

  @ApiPropertyOptional({ description: 'Framework', enum: TemplateFramework })
  @IsOptional()
  @IsEnum(TemplateFramework)
  framework?: TemplateFramework;

  @ApiPropertyOptional({ description: 'Template content' })
  @IsOptional()
  @IsString()
  content?: string;

  @ApiPropertyOptional({ description: 'Template variables', type: [TemplateVariableDto] })
  @IsOptional()
  @IsArray()
  variables?: TemplateVariableDto[];

  @ApiPropertyOptional({ description: 'Template tags' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({ description: 'Is public template' })
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;
}

export class TemplateListQueryDto {
  @ApiPropertyOptional({ description: 'Page number', default: 1 })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsNumber()
  current?: number = 1;

  @ApiPropertyOptional({ description: 'Page size', default: 10 })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsNumber()
  size?: number = 10;

  @ApiPropertyOptional({ description: 'Template name filter' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'Template category filter', enum: TemplateCategory })
  @IsOptional()
  @IsEnum(TemplateCategory)
  category?: TemplateCategory;

  @ApiPropertyOptional({ description: 'Template status filter', enum: TemplateStatus })
  @IsOptional()
  @IsEnum(TemplateStatus)
  status?: TemplateStatus;

  @ApiPropertyOptional({ description: 'Programming language filter', enum: TemplateLanguage })
  @IsOptional()
  @IsEnum(TemplateLanguage)
  language?: TemplateLanguage;

  @ApiPropertyOptional({ description: 'Framework filter', enum: TemplateFramework })
  @IsOptional()
  @IsEnum(TemplateFramework)
  framework?: TemplateFramework;

  @ApiPropertyOptional({ description: 'Search keyword' })
  @IsOptional()
  @IsString()
  search?: string;
}

export class TemplateVersionDto {
  @ApiProperty({ description: 'Version number' })
  version: string;

  @ApiProperty({ description: 'Template content' })
  content: string;

  @ApiProperty({ description: 'Template variables', type: [TemplateVariableDto] })
  variables: TemplateVariableDto[];

  @ApiPropertyOptional({ description: 'Changelog' })
  changelog?: string;

  @ApiProperty({ description: 'Created at' })
  createdAt: Date;

  @ApiProperty({ description: 'Created by' })
  createdBy: string;
}

export class TemplateResponseDto {
  @ApiProperty({ description: 'Template ID' })
  id: string;

  @ApiProperty({ description: 'Project ID' })
  projectId: string;

  @ApiProperty({ description: 'Template name' })
  name: string;

  @ApiPropertyOptional({ description: 'Template description' })
  description?: string;

  @ApiProperty({ description: 'Template category', enum: TemplateCategory })
  category: TemplateCategory;

  @ApiProperty({ description: 'Programming language', enum: TemplateLanguage })
  language: TemplateLanguage;

  @ApiPropertyOptional({ description: 'Framework', enum: TemplateFramework })
  framework?: TemplateFramework;

  @ApiProperty({ description: 'Template content' })
  content: string;

  @ApiProperty({ description: 'Template variables', type: [TemplateVariableDto] })
  variables: TemplateVariableDto[];

  @ApiProperty({ description: 'Template tags' })
  tags: string[];

  @ApiProperty({ description: 'Is public template' })
  isPublic: boolean;

  @ApiProperty({ description: 'Template status', enum: TemplateStatus })
  status: TemplateStatus;

  @ApiProperty({ description: 'Template versions', type: [TemplateVersionDto] })
  versions: TemplateVersionDto[];

  @ApiProperty({ description: 'Current version' })
  currentVersion: string;

  @ApiProperty({ description: 'Usage count' })
  usageCount: number;

  @ApiPropertyOptional({ description: 'Rating' })
  rating?: number;

  @ApiProperty({ description: 'Created by' })
  createdBy: string;

  @ApiProperty({ description: 'Created at' })
  createdAt: Date;

  @ApiProperty({ description: 'Updated at' })
  updatedAt: Date;

  @ApiPropertyOptional({ description: 'Updated by' })
  updatedBy?: string;
}

export class TemplateListResponseDto {
  @ApiProperty({ description: 'Template records', type: [TemplateResponseDto] })
  records: TemplateResponseDto[];

  @ApiProperty({ description: 'Total count' })
  total: number;

  @ApiProperty({ description: 'Current page' })
  current: number;

  @ApiProperty({ description: 'Page size' })
  size: number;
}
