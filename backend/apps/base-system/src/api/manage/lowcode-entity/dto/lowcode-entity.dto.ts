import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, IsNumber, Min } from 'class-validator';

export enum EntityStatus {
  ENABLED = 'ENABLED',
  DISABLED = 'DISABLED',
  BANNED = 'BANNED',
}

export class CreateEntityDto {
  @ApiProperty({ description: '实体名称' })
  @IsString()
  name: string;

  @ApiProperty({ description: '实体代码' })
  @IsString()
  code: string;

  @ApiProperty({ description: '表名' })
  @IsString()
  tableName: string;

  @ApiProperty({ description: '项目ID' })
  @IsString()
  projectId: string;

  @ApiProperty({ description: '分类', required: false })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiProperty({ description: '描述', required: false })
  @IsOptional()
  @IsString()
  description?: string;
}

export class UpdateEntityDto {
  @ApiProperty({ description: '实体名称', required: false })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ description: '实体代码', required: false })
  @IsOptional()
  @IsString()
  code?: string;

  @ApiProperty({ description: '表名', required: false })
  @IsOptional()
  @IsString()
  tableName?: string;

  @ApiProperty({ description: '分类', required: false })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiProperty({ description: '描述', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: '状态', required: false })
  @IsOptional()
  @IsEnum(EntityStatus)
  status?: EntityStatus;
}

export class EntityQueryDto {
  @ApiProperty({ description: '项目ID' })
  @IsString()
  projectId: string;

  @ApiProperty({ description: '页码', required: false, default: 1 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number;

  @ApiProperty({ description: '每页数量', required: false, default: 10 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  pageSize?: number;

  @ApiProperty({ description: '搜索关键词', required: false })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({ description: '分类', required: false })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiProperty({ description: '状态', required: false })
  @IsOptional()
  @IsEnum(EntityStatus)
  status?: EntityStatus;
}