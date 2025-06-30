import { ApiPropertyOptional } from '@nestjs/swagger';
import { Status } from '@prisma/client';
import { IsOptional, IsString, IsEnum } from 'class-validator';

import { PaginationParams } from '@lib/infra/rest/pagination-params';

export class GetLowcodePagesDto extends PaginationParams {

  @ApiPropertyOptional({ description: '搜索关键词' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: '状态', enum: Status })
  @IsOptional()
  @IsEnum(Status)
  status?: Status;
}