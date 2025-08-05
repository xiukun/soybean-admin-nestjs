import { IsString, IsOptional, IsEnum, MaxLength, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Status } from '@prisma/client';

/**
 * 创建应用空间的数据传输对象
 */
export class CreateAppSpaceDto {
  @ApiProperty({ description: '应用空间名称', example: '示例应用空间' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @ApiPropertyOptional({ description: '应用空间描述', example: '这是一个示例应用空间' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiProperty({ description: '租户ID', example: 'cmdy37z6o0000kx22oxaeb51m' })
  @IsString()
  tenantId: string;

  @ApiPropertyOptional({ 
    description: '应用空间状态', 
    enum: Status, 
    default: Status.ENABLED 
  })
  @IsOptional()
  @IsEnum(Status)
  status?: Status = Status.ENABLED;
}