import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsObject, IsEnum } from 'class-validator';
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
  @ApiPropertyOptional({ description: 'Page number', default: 1 })
  @IsOptional()
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Items per page', default: 10 })
  @IsOptional()
  limit?: number = 10;

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
  @ApiProperty({ description: 'List of projects', type: [ProjectResponseDto] })
  projects: ProjectResponseDto[];

  @ApiProperty({ description: 'Total number of projects' })
  total: number;

  @ApiProperty({ description: 'Current page' })
  page: number;

  @ApiProperty({ description: 'Items per page' })
  limit: number;

  @ApiProperty({ description: 'Total pages' })
  totalPages: number;
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
