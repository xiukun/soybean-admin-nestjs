import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsObject, IsEnum, IsUUID, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { EntityStatus } from '@entity/domain/entity.model';

export class CreateEntityDto {
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
}

export class UpdateEntityDto {
  @ApiPropertyOptional({ description: 'Entity name' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'Entity code' })
  @IsOptional()
  @IsString()
  code?: string;

  @ApiPropertyOptional({ description: 'Database table name' })
  @IsOptional()
  @IsString()
  tableName?: string;

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
}

export class EntityResponseDto {
  @ApiProperty({ description: 'Entity ID' })
  id: string;

  @ApiProperty({ description: 'Project ID' })
  projectId: string;

  @ApiProperty({ description: 'Entity name' })
  name: string;

  @ApiProperty({ description: 'Entity code' })
  code: string;

  @ApiProperty({ description: 'Database table name' })
  tableName: string;

  @ApiPropertyOptional({ description: 'Entity description' })
  description?: string;

  @ApiPropertyOptional({ description: 'Entity category' })
  category?: string;

  @ApiPropertyOptional({ description: 'ER diagram position' })
  diagramPosition?: any;

  @ApiPropertyOptional({ description: 'Entity configuration' })
  config?: any;

  @ApiProperty({ description: 'Entity version' })
  version: string;

  @ApiProperty({ description: 'Entity status', enum: EntityStatus })
  status: EntityStatus;

  @ApiProperty({ description: 'Created by' })
  createdBy: string;

  @ApiProperty({ description: 'Created at' })
  createdAt: Date;

  @ApiPropertyOptional({ description: 'Updated by' })
  updatedBy?: string;

  @ApiPropertyOptional({ description: 'Updated at' })
  updatedAt?: Date;
}

export class EntityListQueryDto {
  @ApiPropertyOptional({ description: 'Current page number', default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @Min(1)
  current?: number = 1;

  @ApiPropertyOptional({ description: 'Page size', default: 10, minimum: 1, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @Min(1)
  @Max(100)
  size?: number = 10;

  @ApiPropertyOptional({ description: 'Filter by status', enum: EntityStatus })
  @IsOptional()
  @IsEnum(EntityStatus)
  status?: EntityStatus;

  @ApiPropertyOptional({ description: 'Filter by category' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ description: 'Search term' })
  @IsOptional()
  @IsString()
  search?: string;
}

export class EntityListResponseDto {
  @ApiProperty({ description: 'Entities list (AMIS format)', type: [EntityResponseDto] })
  options: EntityResponseDto[];

  @ApiProperty({ description: 'Current page number (AMIS format)' })
  page: number;

  @ApiProperty({ description: 'Page size (AMIS format)' })
  perPage: number;

  @ApiProperty({ description: 'Total count' })
  total: number;
}
