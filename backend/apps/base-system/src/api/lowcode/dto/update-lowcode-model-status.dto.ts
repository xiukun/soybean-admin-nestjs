import { ApiProperty } from '@nestjs/swagger';
import { Status } from '@prisma/client';
import { IsEnum } from 'class-validator';

export class UpdateLowcodeModelStatusDto {
  @ApiProperty({ description: '状态', enum: Status })
  @IsEnum(Status)
  status: Status;
}