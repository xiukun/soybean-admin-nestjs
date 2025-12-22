import { ApiProperty } from '@nestjs/swagger';
import { Status } from '@prisma/client';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
} from 'class-validator';

export class CreateVersionDto {
  @ApiProperty({ required: true, description: 'Version name' })
  @IsString({ message: 'versionName must be a string' })
  @IsNotEmpty({ message: 'versionName cannot be empty' })
  versionName: string;

  @ApiProperty({ required: true, description: 'Version number (semantic versioning)' })
  @IsString({ message: 'versionNum must be a string' })
  @IsNotEmpty({ message: 'versionNum cannot be empty' })
  @Matches(/^\d+\.\d+\.\d+$/, { message: 'versionNum must follow semantic versioning (x.y.z)' })
  versionNum: string;

  @ApiProperty({ required: false, description: 'Version description' })
  @IsOptional()
  @IsString({ message: 'description must be a string' })
  description?: string;
}

export class UpdateVersionDto {
  @ApiProperty({ required: true, description: 'Version ID' })
  @IsUUID('4', { message: 'id must be a valid UUID' })
  @IsNotEmpty({ message: 'id cannot be empty' })
  id: string;

  @ApiProperty({ required: true, description: 'Version name' })
  @IsString({ message: 'versionName must be a string' })
  @IsNotEmpty({ message: 'versionName cannot be empty' })
  versionName: string;

  @ApiProperty({ required: true, description: 'Version number (semantic versioning)' })
  @IsString({ message: 'versionNum must be a string' })
  @IsNotEmpty({ message: 'versionNum cannot be empty' })
  @Matches(/^\d+\.\d+\.\d+$/, { message: 'versionNum must follow semantic versioning (x.y.z)' })
  versionNum: string;

  @ApiProperty({ required: false, description: 'Version description' })
  @IsOptional()
  @IsString({ message: 'description must be a string' })
  description?: string;
}

export class EnableVersionDto {
  @ApiProperty({ required: true, description: 'Version ID' })
  @IsUUID('4', { message: 'id must be a valid UUID' })
  @IsNotEmpty({ message: 'id cannot be empty' })
  id: string;
}

export class VersionListQueryDto {
  @ApiProperty({ required: false, description: 'Version number filter' })
  @IsOptional()
  @IsString()
  versionNum?: string;

  @ApiProperty({ required: false, description: 'Current page', default: 1 })
  @IsOptional()
  page?: number = 1;

  @ApiProperty({ required: false, description: 'Page size', default: 10 })
  @IsOptional()
  perPage?: number = 10;
}
