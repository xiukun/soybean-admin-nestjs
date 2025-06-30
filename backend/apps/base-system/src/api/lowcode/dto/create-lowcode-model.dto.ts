import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Status } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsString, IsNotEmpty, IsOptional, IsEnum, IsArray, ValidateNested, IsBoolean, IsNumber } from 'class-validator';

export class CreateLowcodeModelPropertyDto {
  @ApiProperty({ description: '属性名称' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: '属性编码' })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiPropertyOptional({ description: '属性描述' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: '数据类型' })
  @IsString()
  @IsNotEmpty()
  type: string;

  @ApiPropertyOptional({ description: '长度' })
  @IsNumber()
  @IsOptional()
  length?: number;

  @ApiPropertyOptional({ description: '精度' })
  @IsNumber()
  @IsOptional()
  precision?: number;

  @ApiPropertyOptional({ description: '小数位数' })
  @IsNumber()
  @IsOptional()
  scale?: number;

  @ApiPropertyOptional({ description: '是否可为空', default: true })
  @IsBoolean()
  @IsOptional()
  nullable?: boolean;

  @ApiPropertyOptional({ description: '默认值' })
  @IsString()
  @IsOptional()
  defaultValue?: string;

  @ApiPropertyOptional({ description: '是否主键', default: false })
  @IsBoolean()
  @IsOptional()
  isPrimaryKey?: boolean;

  @ApiPropertyOptional({ description: '是否唯一', default: false })
  @IsBoolean()
  @IsOptional()
  isUnique?: boolean;

  @ApiPropertyOptional({ description: '是否索引', default: false })
  @IsBoolean()
  @IsOptional()
  isIndex?: boolean;
}

export class CreateLowcodeModelReferenceDto {
  @ApiProperty({ description: '关联名称' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: '源模型' })
  @IsString()
  @IsNotEmpty()
  sourceModel: string;

  @ApiProperty({ description: '源属性' })
  @IsString()
  @IsNotEmpty()
  sourceProperty: string;

  @ApiProperty({ description: '目标模型' })
  @IsString()
  @IsNotEmpty()
  targetModel: string;

  @ApiProperty({ description: '目标属性' })
  @IsString()
  @IsNotEmpty()
  targetProperty: string;

  @ApiProperty({ description: '关联类型' })
  @IsString()
  @IsNotEmpty()
  relationType: string;

  @ApiPropertyOptional({ description: '删除时操作' })
  @IsString()
  @IsOptional()
  onDelete?: string;

  @ApiPropertyOptional({ description: '更新时操作' })
  @IsString()
  @IsOptional()
  onUpdate?: string;
}

export class CreateLowcodeModelDto {
  @ApiProperty({ description: '模型名称' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: '模型编码' })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiPropertyOptional({ description: '模型描述' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: '对应表名' })
  @IsString()
  @IsNotEmpty()
  tableName: string;

  @ApiProperty({ description: '状态', enum: Status })
  @IsEnum(Status)
  status: Status;

  @ApiPropertyOptional({ description: '模型属性', type: [CreateLowcodeModelPropertyDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateLowcodeModelPropertyDto)
  @IsOptional()
  properties?: CreateLowcodeModelPropertyDto[];

  @ApiPropertyOptional({ description: '模型关联', type: [CreateLowcodeModelReferenceDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateLowcodeModelReferenceDto)
  @IsOptional()
  references?: CreateLowcodeModelReferenceDto[];
}