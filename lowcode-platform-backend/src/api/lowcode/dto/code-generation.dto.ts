import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsArray, IsObject, IsBoolean, IsOptional, IsEnum } from 'class-validator';

export enum GenerationArchitecture {
  BASE_BIZ = 'base-biz',
  STANDARD = 'standard',
}

export enum GenerationFramework {
  NESTJS = 'nestjs',
  EXPRESS = 'express',
  SPRING = 'spring',
}

export class GenerationOptionsDto {
  @ApiProperty({ description: 'Overwrite existing files' })
  @IsBoolean()
  overwriteExisting: boolean;

  @ApiProperty({ description: 'Generate test files' })
  @IsBoolean()
  generateTests: boolean;

  @ApiProperty({ description: 'Generate documentation' })
  @IsBoolean()
  generateDocs: boolean;

  @ApiProperty({ description: 'Architecture pattern', enum: GenerationArchitecture })
  @IsEnum(GenerationArchitecture)
  architecture: GenerationArchitecture;

  @ApiProperty({ description: 'Target framework', enum: GenerationFramework })
  @IsEnum(GenerationFramework)
  framework: GenerationFramework;
}

export class GenerateCodeDto {
  @ApiProperty({ description: 'Project ID' })
  @IsString()
  projectId: string;

  @ApiPropertyOptional({ description: 'Template ID (deprecated, use templateIds)' })
  @IsOptional()
  @IsString()
  templateId?: string;

  @ApiPropertyOptional({ description: 'Template IDs' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  templateIds?: string[];

  @ApiPropertyOptional({ description: 'Entity IDs to generate for' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  entityIds?: string[];

  @ApiProperty({ description: 'Template variables' })
  @IsObject()
  variables: Record<string, any>;

  @ApiProperty({ description: 'Generation options', type: GenerationOptionsDto })
  @IsObject()
  options: GenerationOptionsDto;
}

export class GenerationResultResponseDto {
  @ApiProperty({ description: 'Generation success status' })
  success: boolean;

  @ApiProperty({ description: 'Task ID for tracking' })
  taskId: string;

  @ApiProperty({ description: 'Number of files generated' })
  filesGenerated: number;

  @ApiProperty({ description: 'Output path' })
  outputPath: string;

  @ApiProperty({ description: 'Generation errors', type: [String] })
  errors: string[];

  @ApiProperty({ description: 'Generation warnings', type: [String] })
  warnings: string[];

  @ApiProperty({ description: 'Generated file tree' })
  fileTree: any[];
}

export class GenerationProgressResponseDto {
  @ApiProperty({ description: 'Progress percentage (0-100)' })
  percentage: number;

  @ApiProperty({ description: 'Current status' })
  status: 'pending' | 'running' | 'success' | 'failed';

  @ApiProperty({ description: 'Current progress message' })
  message: string;

  @ApiProperty({ description: 'Progress logs' })
  logs: Array<{
    level: 'info' | 'warn' | 'error';
    message: string;
    timestamp: string;
  }>;
}

export class GenerationHistoryItemDto {
  @ApiProperty({ description: 'Generation task ID' })
  id: string;

  @ApiProperty({ description: 'Project ID' })
  projectId: string;

  @ApiProperty({ description: 'Template IDs used' })
  templateIds: string[];

  @ApiProperty({ description: 'Entity IDs processed' })
  entityIds: string[];

  @ApiProperty({ description: 'Output path' })
  outputPath: string;

  @ApiProperty({ description: 'Generation status' })
  status: 'pending' | 'running' | 'success' | 'failed';

  @ApiProperty({ description: 'Files generated count' })
  filesGenerated: number;

  @ApiProperty({ description: 'Start time' })
  startTime: string;

  @ApiProperty({ description: 'End time' })
  endTime?: string;

  @ApiProperty({ description: 'Duration in milliseconds' })
  duration?: number;

  @ApiProperty({ description: 'Generation errors' })
  errors?: string[];

  @ApiProperty({ description: 'Created by user ID' })
  createdBy: string;

  @ApiProperty({ description: 'Created at timestamp' })
  createdAt: string;
}

export class GenerationHistoryResponseDto {
  @ApiProperty({ description: 'Generation history records', type: [GenerationHistoryItemDto] })
  records: GenerationHistoryItemDto[];

  @ApiProperty({ description: 'Total count' })
  total: number;

  @ApiProperty({ description: 'Current page' })
  current: number;

  @ApiProperty({ description: 'Page size' })
  size: number;
}
