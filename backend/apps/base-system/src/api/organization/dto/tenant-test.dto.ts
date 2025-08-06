import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

/**
 * 租户测试DTO
 * 用于测试多租户功能
 */
export class TenantTestDto {
  @ApiProperty({ description: '测试消息', example: 'Hello from tenant' })
  @IsString()
  @IsNotEmpty()
  message: string;
}