import { ApiPropertyOptional } from '@nestjs/swagger';
import { Status } from '@prisma/client';
import { IsString, IsOptional, IsEnum, IsNumber } from 'class-validator';

export class UpdateLowcodePageDto {
  @ApiPropertyOptional({ description: '页面名称' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ description: '页面标题' })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiPropertyOptional({ description: '页面编码' })
  @IsString()
  @IsOptional()
  code?: string;

  @ApiPropertyOptional({ description: '页面描述' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: '页面路径' })
  @IsString()
  @IsOptional()
  path?: string;

  @ApiPropertyOptional({ description: '页面Schema配置' })
  @IsString()
  @IsOptional()
  schema?: string;

  @ApiPropertyOptional({ description: '���联菜单ID' })
  @IsNumber()
  @IsOptional()
  menuId?: number;

  @ApiPropertyOptional({ description: '状态', enum: Status })
  @IsEnum(Status)
  @IsOptional()
  status?: Status;
}