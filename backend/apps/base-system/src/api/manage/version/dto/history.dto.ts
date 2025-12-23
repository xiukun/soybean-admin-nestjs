import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

export class HistoryListQueryDto {
  @ApiProperty({ required: false, description: 'Menu page ID filter' })
  @IsOptional()
  @IsString()
  mainId?: string;

  @ApiProperty({ required: false, description: 'Version number filter' })
  @IsOptional()
  @IsString()
  versionNum?: string;

  @ApiProperty({ required: false, description: 'Product version ID filter' })
  @IsOptional()
  @IsString()
  productVersionId?: string;

  @ApiProperty({ required: false, description: 'Current page', default: 1 })
  @IsOptional()
  pageNum?: number = 1;

  @ApiProperty({ required: false, description: 'Page size', default: 10 })
  @IsOptional()
  pageSize?: number = 10;
}

export class DeleteHistoryDto {
  @ApiProperty({ required: true, description: 'History version ID' })
  @IsUUID('4', { message: 'id must be a valid UUID' })
  @IsNotEmpty({ message: 'id cannot be empty' })
  id: string;
}

export class BatchDeleteHistoryDto {
  @ApiProperty({ required: true, description: 'Array of history version IDs', type: [String] })
  @IsArray({ message: 'ids must be an array' })
  @IsUUID('4', { each: true, message: 'each id must be a valid UUID' })
  @IsNotEmpty({ message: 'ids cannot be empty' })
  ids: string[];
}
