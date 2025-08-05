import { IsOptional, IsString, IsEnum, IsNumber, Min, Max } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { Status } from '@prisma/client';

/**
 * 应用空间查询的数据传输对象
 */
export class QueryAppSpaceDto {
  @ApiPropertyOptional({ description: '页码', example: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: '每页数量', example: 10, minimum: 1, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 10;

  @ApiPropertyOptional({ description: '应用空间名称搜索', example: '示例' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: '租户ID过滤', example: 'cmdy37z6o0000kx22oxaeb51m' })
  @IsOptional()
  @IsString()
  tenantId?: string;

  @ApiPropertyOptional({ 
    description: '状态过滤', 
    enum: Status 
  })
  @IsOptional()
  @IsEnum(Status)
  status?: Status;
}