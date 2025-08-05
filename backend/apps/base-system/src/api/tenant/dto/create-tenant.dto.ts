import { IsString, IsOptional, IsEnum, IsNumber, IsArray, IsBoolean, MaxLength, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Status } from '@prisma/client';

/**
 * 创建租户的数据传输对象
 */
export class CreateTenantDto {
  @ApiProperty({ description: '租户名称', example: '示例租户' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @ApiPropertyOptional({ description: '租户描述', example: '这是一个示例租户' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiProperty({ description: '企业ID', example: 'cmdy37z6o0000kx22oxaeb51m' })
  @IsString()
  enterpriseId: string;

  @ApiPropertyOptional({ description: '订阅计划ID', example: 'plan_basic' })
  @IsOptional()
  @IsString()
  planId?: string;

  @ApiPropertyOptional({ 
    description: '租户状态', 
    enum: Status, 
    default: Status.ENABLED 
  })
  @IsOptional()
  @IsEnum(Status)
  status?: Status = Status.ENABLED;
}