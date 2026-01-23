import { ApiPropertyOptional } from '@nestjs/swagger';
import { Status } from '@prisma/client';
import { IsIn, IsInt, IsNotEmpty, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class DeptCreateDto {
  @ApiPropertyOptional({ description: '父部门ID，根部门为 0', default: '0' })
  @IsOptional()
  @IsString()
  pid?: string;

  @ApiPropertyOptional({ description: '部门名称' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  name!: string;

  @ApiPropertyOptional({ description: '部门编码（层级编码）' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  code!: string;

  @ApiPropertyOptional({ description: '排序', default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  sequence?: number;

  @ApiPropertyOptional({ description: '状态', default: Status.ENABLED })
  @IsOptional()
  @IsIn([Status.ENABLED, Status.DISABLED])
  status?: Status;

  @ApiPropertyOptional({ description: '备注' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  remark?: string | null;
}
