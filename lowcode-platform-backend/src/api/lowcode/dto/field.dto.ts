import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsEnum, IsBoolean, IsNumber, Min, Matches } from 'class-validator';
import { FieldDataType } from '@field/domain/field.model';

export class CreateFieldDto {
  @ApiProperty({ description: '实体ID' })
  @IsString()
  @IsNotEmpty()
  entityId: string;

  @ApiProperty({ description: '字段名称' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: '字段代码' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^[a-zA-Z][a-zA-Z0-9_]*$/, {
    message: 'Field code must start with a letter and contain only letters, numbers, and underscores'
  })
  code: string;

  @ApiProperty({ description: '数据类型', enum: FieldDataType })
  @IsEnum(FieldDataType)
  dataType: FieldDataType;

  @ApiPropertyOptional({ description: '字段描述' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: '字段长度' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  length?: number;

  @ApiPropertyOptional({ description: '精度' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  precision?: number;

  @ApiPropertyOptional({ description: '是否必填', default: false })
  @IsOptional()
  @IsBoolean()
  required?: boolean;

  @ApiPropertyOptional({ description: '是否唯一', default: false })
  @IsOptional()
  @IsBoolean()
  unique?: boolean;

  @ApiPropertyOptional({ description: '默认值' })
  @IsOptional()
  @IsString()
  defaultValue?: string;

  @ApiPropertyOptional({ description: '配置信息' })
  @IsOptional()
  config?: any;

  @ApiPropertyOptional({ description: '显示顺序' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  displayOrder?: number;

  @ApiPropertyOptional({ description: '创建者' })
  @IsOptional()
  @IsString()
  createdBy?: string;
}

export class UpdateFieldDto {
  @ApiPropertyOptional({ description: '字段名称' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;

  @ApiPropertyOptional({ description: '字段代码' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @Matches(/^[a-zA-Z][a-zA-Z0-9_]*$/, {
    message: 'Field code must start with a letter and contain only letters, numbers, and underscores'
  })
  code?: string;

  @ApiPropertyOptional({ description: '数据类型', enum: FieldDataType })
  @IsOptional()
  @IsEnum(FieldDataType)
  dataType?: FieldDataType;

  @ApiPropertyOptional({ description: '字段描述' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: '字段长度' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  length?: number;

  @ApiPropertyOptional({ description: '精度' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  precision?: number;

  @ApiPropertyOptional({ description: '是否必填' })
  @IsOptional()
  @IsBoolean()
  required?: boolean;

  @ApiPropertyOptional({ description: '是否唯一' })
  @IsOptional()
  @IsBoolean()
  unique?: boolean;

  @ApiPropertyOptional({ description: '默认值' })
  @IsOptional()
  @IsString()
  defaultValue?: string;

  @ApiPropertyOptional({ description: '配置信息' })
  @IsOptional()
  config?: any;

  @ApiPropertyOptional({ description: '显示顺序' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  displayOrder?: number;

  @ApiPropertyOptional({ description: '更新者' })
  @IsOptional()
  @IsString()
  updatedBy?: string;
}

export class MoveFieldDto {
  @ApiProperty({ description: '移动方向', enum: ['up', 'down'] })
  @IsEnum(['up', 'down'])
  direction: 'up' | 'down';
}

export class FieldResponseDto {
  @ApiProperty({ description: '字段ID' })
  id: string;

  @ApiProperty({ description: '实体ID' })
  entityId: string;

  @ApiProperty({ description: '字段名称' })
  name: string;

  @ApiProperty({ description: '字段代码' })
  code: string;

  @ApiProperty({ description: '数据类型', enum: FieldDataType })
  dataType: FieldDataType;

  @ApiPropertyOptional({ description: '字段描述' })
  description?: string;

  @ApiPropertyOptional({ description: '字段长度' })
  length?: number;

  @ApiPropertyOptional({ description: '精度' })
  precision?: number;

  @ApiProperty({ description: '是否必填' })
  required: boolean;

  @ApiProperty({ description: '是否唯一' })
  unique: boolean;

  @ApiPropertyOptional({ description: '默认值' })
  defaultValue?: string;

  @ApiPropertyOptional({ description: '配置信息' })
  config?: any;

  @ApiProperty({ description: '显示顺序' })
  displayOrder: number;

  @ApiProperty({ description: '创建者' })
  createdBy: string;

  @ApiProperty({ description: '创建时间' })
  createdAt: Date;

  @ApiPropertyOptional({ description: '更新者' })
  updatedBy?: string;

  @ApiPropertyOptional({ description: '更新时间' })
  updatedAt?: Date;
}
