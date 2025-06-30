import { ApiPropertyOptional } from '@nestjs/swagger';
import { Status } from '@prisma/client';
import { Transform } from 'class-transformer';
import { IsOptional, IsString, IsEnum, IsBoolean } from 'class-validator';

import { PaginationParams } from '@lib/infra/rest/pagination-params';

export class GetLowcodeModelsDto extends PaginationParams {

  @ApiPropertyOptional({ description: '搜索关键词' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: '状态', enum: Status })
  @IsOptional()
  @IsEnum(Status)
  status?: Status;

  @ApiPropertyOptional({ description: '是否包��关联数据', default: false })
  @IsOptional()
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  withRelations?: boolean = false;
}