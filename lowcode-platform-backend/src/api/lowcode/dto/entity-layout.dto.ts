import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsObject, IsOptional, IsNumber, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * 实体位置信息DTO
 */
export class EntityPositionDto {
  @ApiProperty({ description: '实体ID' })
  @IsString()
  @IsNotEmpty()
  id: string;

  @ApiProperty({ description: 'X坐标' })
  @IsNumber()
  x: number;

  @ApiProperty({ description: 'Y坐标' })
  @IsNumber()
  y: number;

  @ApiProperty({ description: '宽度', required: false })
  @IsOptional()
  @IsNumber()
  width?: number;

  @ApiProperty({ description: '高度', required: false })
  @IsOptional()
  @IsNumber()
  height?: number;

  @ApiProperty({ description: '颜色', required: false })
  @IsOptional()
  @IsString()
  color?: string;
}

/**
 * 关系连线样式DTO
 */
export class RelationshipStyleDto {
  @ApiProperty({ description: '线条样式', enum: ['solid', 'dashed', 'dotted'], required: false })
  @IsOptional()
  @IsString()
  lineStyle?: 'solid' | 'dashed' | 'dotted';

  @ApiProperty({ description: '线条颜色', required: false })
  @IsOptional()
  @IsString()
  lineColor?: string;

  @ApiProperty({ description: '线条宽度', required: false })
  @IsOptional()
  @IsNumber()
  lineWidth?: number;
}

/**
 * 关系连线位置信息DTO
 */
export class RelationshipPositionDto {
  @ApiProperty({ description: '关系ID' })
  @IsString()
  @IsNotEmpty()
  id: string;

  @ApiProperty({ description: '起点坐标', required: false })
  @IsOptional()
  @IsObject()
  sourcePoint?: { x: number; y: number };

  @ApiProperty({ description: '终点坐标', required: false })
  @IsOptional()
  @IsObject()
  targetPoint?: { x: number; y: number };

  @ApiProperty({ description: '控制点列表', required: false })
  @IsOptional()
  @IsArray()
  controlPoints?: { x: number; y: number }[];

  @ApiProperty({ description: '样式配置', required: false })
  @IsOptional()
  @ValidateNested()
  @Type(() => RelationshipStyleDto)
  style?: RelationshipStyleDto;
}

/**
 * 视口配置DTO
 */
export class ViewportDto {
  @ApiProperty({ description: 'X偏移量' })
  @IsNumber()
  x: number;

  @ApiProperty({ description: 'Y偏移量' })
  @IsNumber()
  y: number;

  @ApiProperty({ description: '缩放比例' })
  @IsNumber()
  zoom: number;
}

/**
 * 布局配置DTO
 */
export class LayoutConfigDto {
  @ApiProperty({ description: '布局类型', enum: ['force', 'grid', 'hierarchy', 'circular'] })
  @IsString()
  @IsNotEmpty()
  type: 'force' | 'grid' | 'hierarchy' | 'circular';

  @ApiProperty({ description: '布局选项', required: false })
  @IsOptional()
  @IsObject()
  options?: any;
}

/**
 * 创建实体布局DTO
 */
export class CreateEntityLayoutDto {
  @ApiProperty({ description: '项目ID' })
  @IsString()
  @IsNotEmpty()
  projectId: string;

  @ApiProperty({ description: '实体位置列表' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EntityPositionDto)
  entities: EntityPositionDto[];

  @ApiProperty({ description: '关系位置列表' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RelationshipPositionDto)
  relationships: RelationshipPositionDto[];

  @ApiProperty({ description: '视口配置', required: false })
  @IsOptional()
  @ValidateNested()
  @Type(() => ViewportDto)
  viewport?: ViewportDto;

  @ApiProperty({ description: '布局配置' })
  @ValidateNested()
  @Type(() => LayoutConfigDto)
  layoutConfig: LayoutConfigDto;

  @ApiProperty({ description: '版本号', required: false })
  @IsOptional()
  @IsNumber()
  version?: number;

  @ApiProperty({ description: '备注', required: false })
  @IsOptional()
  @IsString()
  description?: string;
}

/**
 * 更新实体布局DTO
 */
export class UpdateEntityLayoutDto {
  @ApiProperty({ description: '实体位置列表', required: false })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EntityPositionDto)
  entities?: EntityPositionDto[];

  @ApiProperty({ description: '关系位置列表', required: false })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RelationshipPositionDto)
  relationships?: RelationshipPositionDto[];

  @ApiProperty({ description: '视口配置', required: false })
  @IsOptional()
  @ValidateNested()
  @Type(() => ViewportDto)
  viewport?: ViewportDto;

  @ApiProperty({ description: '布局配置', required: false })
  @IsOptional()
  @ValidateNested()
  @Type(() => LayoutConfigDto)
  layoutConfig?: LayoutConfigDto;

  @ApiProperty({ description: '备注', required: false })
  @IsOptional()
  @IsString()
  description?: string;
}

/**
 * 实体布局响应DTO
 */
export class EntityLayoutResponseDto {
  @ApiProperty({ description: '布局ID' })
  id: string;

  @ApiProperty({ description: '项目ID' })
  projectId: string;

  @ApiProperty({ description: '布局数据' })
  layoutData: {
    entities: EntityPositionDto[];
    relationships: RelationshipPositionDto[];
    viewport?: ViewportDto;
    layoutConfig: LayoutConfigDto;
    version: number;
    description?: string;
  };

  @ApiProperty({ description: '创建时间' })
  createdAt: Date;

  @ApiProperty({ description: '更新时间' })
  updatedAt: Date;
}

/**
 * 布局版本信息DTO
 */
export class LayoutVersionDto {
  @ApiProperty({ description: '版本号' })
  version: number;

  @ApiProperty({ description: '创建时间' })
  createdAt: Date;

  @ApiProperty({ description: '备注' })
  description?: string;
}