import { ApiPropertyOptional } from '@nestjs/swagger';
import { Status } from '@prisma/client';
import { IsString, IsOptional, IsEnum } from 'class-validator';

export class UpdateLowcodeModelDto {
  @ApiPropertyOptional({ description: '模型名称' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ description: '模型编码' })
  @IsString()
  @IsOptional()
  code?: string;

  @ApiPropertyOptional({ description: '模型描述' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: '对应表名' })
  @IsString()
  @IsOptional()
  tableName?: string;

  @ApiPropertyOptional({ description: '状态', enum: Status })
  @IsEnum(Status)
  @IsOptional()
  status?: Status;
}