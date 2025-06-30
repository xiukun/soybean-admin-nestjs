import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Status } from '@prisma/client';
import { IsString, IsNotEmpty, IsOptional, IsEnum, IsNumber } from 'class-validator';

export class CreateLowcodePageDto {
  @ApiProperty({ description: '页面名称' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: '页面标题' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ description: '页面编码' })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiPropertyOptional({ description: '页面描述' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: '页面路径' })
  @IsString()
  @IsNotEmpty()
  path: string;

  @ApiProperty({ description: '页面Schema配置' })
  @IsString()
  @IsNotEmpty()
  schema: string;

  @ApiPropertyOptional({ description: '关联菜单ID' })
  @IsNumber()
  @IsOptional()
  menuId?: number;

  @ApiProperty({ description: '状态', enum: Status })
  @IsEnum(Status)
  status: Status;
}