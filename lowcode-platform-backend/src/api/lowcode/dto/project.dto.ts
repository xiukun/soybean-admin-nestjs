import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsObject, IsEnum, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ProjectStatus } from '@project/domain/project.model';

export class CreateProjectDto {
  @ApiProperty({ description: 'Project name' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Project code' })
  @IsString()
  code: string;

  @ApiPropertyOptional({ description: 'Project description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Project version' })
  @IsOptional()
  @IsString()
  version?: string;

  @ApiPropertyOptional({ description: 'Project configuration' })
  @IsOptional()
  @IsObject()
  config?: any;
}

export class UpdateProjectDto {
  @ApiPropertyOptional({ description: 'Project name' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'Project code' })
  @IsOptional()
  @IsString()
  code?: string;

  @ApiPropertyOptional({ description: 'Project description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Project version' })
  @IsOptional()
  @IsString()
  version?: string;

  @ApiPropertyOptional({ description: 'Project configuration' })
  @IsOptional()
  @IsObject()
  config?: any;
}

export class UpdateProjectStatusDto {
  @ApiProperty({ description: 'Project status', enum: ProjectStatus })
  @IsEnum(ProjectStatus)
  status: ProjectStatus;
}

export class ProjectResponseDto {
  @ApiProperty({ description: 'Project ID' })
  id: string;

  @ApiProperty({ description: 'Project name' })
  name: string;

  @ApiProperty({ description: 'Project code' })
  code: string;

  @ApiPropertyOptional({ description: 'Project description' })
  description?: string;

  @ApiProperty({ description: 'Project version' })
  version: string;

  @ApiPropertyOptional({ description: 'Project configuration' })
  config?: any;

  @ApiProperty({ description: 'Project status', enum: ProjectStatus })
  status: ProjectStatus;

  @ApiProperty({ description: 'Created by' })
  createdBy: string;

  @ApiProperty({ description: 'Created at' })
  createdAt: Date;

  @ApiPropertyOptional({ description: 'Updated by' })
  updatedBy?: string;

  @ApiPropertyOptional({ description: 'Updated at' })
  updatedAt?: Date;
}

export class ProjectListQueryDto {
  @ApiPropertyOptional({ description: 'Current page number', default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @Min(1)
  current?: number = 1;

  @ApiPropertyOptional({ description: 'Page size', default: 10, minimum: 1, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @Min(1)
  size?: number = 10;

  @ApiPropertyOptional({ description: 'Filter by status', enum: ProjectStatus })
  @IsOptional()
  @IsEnum(ProjectStatus)
  status?: ProjectStatus;

  @ApiPropertyOptional({ description: 'Search term' })
  @IsOptional()
  @IsString()
  search?: string;
}

export class ProjectListResponseDto {
  @ApiProperty({ description: 'Projects list', type: [ProjectResponseDto] })
  records: ProjectResponseDto[];

  @ApiProperty({ description: 'Current page number' })
  current: number;

  @ApiProperty({ description: 'Page size' })
  size: number;

  @ApiProperty({ description: 'Total count' })
  total: number;
}

export class ProjectStatsResponseDto {
  @ApiProperty({ description: 'Total projects' })
  total: number;

  @ApiProperty({ description: 'Active projects' })
  active: number;

  @ApiProperty({ description: 'Inactive projects' })
  inactive: number;

  @ApiProperty({ description: 'Archived projects' })
  archived: number;
}
