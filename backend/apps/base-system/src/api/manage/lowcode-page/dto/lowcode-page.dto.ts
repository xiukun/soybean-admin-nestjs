import { ApiProperty } from '@nestjs/swagger';
import { Status } from '@prisma/client';
import {
  IsJSON,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  ValidateIf,
} from 'class-validator';

export class CreateLowcodePageDto {
  @ApiProperty({ required: true, description: 'Page name' })
  @IsString({ message: 'name must be a string' })
  @IsNotEmpty({ message: 'name cannot be empty' })
  name: string;

  @ApiProperty({ required: true, description: 'Page title' })
  @IsString({ message: 'title must be a string' })
  @IsNotEmpty({ message: 'title cannot be empty' })
  title: string;

  @ApiProperty({ required: true, description: 'Unique page code' })
  @IsString({ message: 'code must be a string' })
  @IsNotEmpty({ message: 'code cannot be empty' })
  code: string;

  @ApiProperty({ required: false, description: 'Page description', nullable: true })
  @IsOptional()
  @ValidateIf((o) => o.description !== null)
  @IsString({ message: 'description must be a string' })
  description?: string | null;

  @ApiProperty({ required: true, description: 'AMIS JSON Schema' })
  @IsJSON({ message: 'schema must be a valid JSON' })
  @IsNotEmpty({ message: 'schema cannot be empty' })
  schema: string; // JSON string

  @ApiProperty({ required: false, enum: Status, default: Status.ENABLED })
  @IsOptional()
  status?: Status;

  @ApiProperty({ required: false, description: 'Changelog for this version', nullable: true })
  @IsOptional()
  @ValidateIf((o) => o.changelog !== null)
  @IsString({ message: 'changelog must be a string' })
  changelog?: string | null;
}

export class UpdateLowcodePageDto {
  @ApiProperty({ required: false, description: 'Page name' })
  @IsOptional()
  @IsString({ message: 'name must be a string' })
  name?: string;

  @ApiProperty({ required: false, description: 'Page title' })
  @IsOptional()
  @IsString({ message: 'title must be a string' })
  title?: string;

  @ApiProperty({ required: false, description: 'Page description', nullable: true })
  @IsOptional()
  @ValidateIf((o) => o.description !== null)
  @IsString({ message: 'description must be a string' })
  description?: string | null;

  @ApiProperty({ required: false, description: 'AMIS JSON Schema' })
  @IsOptional()
  @IsJSON({ message: 'schema must be a valid JSON' })
  schema?: string; // JSON string

  @ApiProperty({ required: false, enum: Status })
  @IsOptional()
  status?: Status;

  @ApiProperty({ required: false, description: 'Changelog for this version', nullable: true })
  @IsOptional()
  @ValidateIf((o) => o.changelog !== null)
  @IsString({ message: 'changelog must be a string' })
  changelog?: string | null;
}

export class GetLowcodePageDto {
  @ApiProperty({ required: true, description: 'Page ID' })
  @IsUUID('4', { message: 'id must be a valid UUID' })
  @IsNotEmpty({ message: 'id cannot be empty' })
  id: string;
}

export class GetLowcodePageByCodeDto {
  @ApiProperty({ required: true, description: 'Page code' })
  @IsString({ message: 'code must be a string' })
  @IsNotEmpty({ message: 'code cannot be empty' })
  code: string;
}

export class LowcodePageVersionDto {
  @ApiProperty({ required: true, description: 'Version string' })
  @IsString({ message: 'version must be a string' })
  @IsNotEmpty({ message: 'version cannot be empty' })
  version: string;

  @ApiProperty({ required: true, description: 'AMIS JSON Schema' })
  @IsJSON({ message: 'schema must be a valid JSON' })
  @IsNotEmpty({ message: 'schema cannot be empty' })
  schema: string; // JSON string

  @ApiProperty({ required: false, description: 'Changelog for this version', nullable: true })
  @IsOptional()
  @ValidateIf((o) => o.changelog !== null)
  @IsString({ message: 'changelog must be a string' })
  changelog?: string | null;
}

export class PaginationQueryDto {
  @ApiProperty({ required: false, description: 'Current page', default: 1 })
  @IsOptional()
  current?: number = 1;

  @ApiProperty({ required: false, description: 'Page size', default: 10 })
  @IsOptional()
  size?: number = 10;

  @ApiProperty({ required: false, description: 'Search term' })
  @IsOptional()
  @IsString()
  search?: string;
}
