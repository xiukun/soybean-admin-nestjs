import { ApiProperty, OmitType } from '@nestjs/swagger';
import { Status } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsArray, IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UserCreateDto {
  @ApiProperty({ required: true })
  @IsString({ message: 'username must be a string' })
  @IsNotEmpty({ message: 'username cannot be empty' })
  username: string;

  @ApiProperty({ required: true })
  @IsString({ message: 'password must be a string' })
  @IsNotEmpty({ message: 'password cannot be empty' })
  password: string;

  @ApiProperty({ required: true })
  @IsString({ message: 'domain must be a string' })
  @IsNotEmpty({ message: 'domain cannot be empty' })
  domain: string;

  @ApiProperty({ required: true })
  @IsString({ message: 'nickName must be a string' })
  @IsNotEmpty({ message: 'nickName cannot be empty' })
  nickName: string;

  @ApiProperty({ type: 'string', required: false, nullable: true })
  @IsOptional()
  @IsString({ message: 'avatar must be a string or null' })
  @Type(() => String)
  avatar: string | null;

  @ApiProperty({ type: 'string', required: false, nullable: true })
  @IsOptional()
  @IsString({ message: 'email must be a string or null' })
  @Type(() => String)
  email: string | null;

  @ApiProperty({ type: 'string', required: false, nullable: true })
  @IsOptional()
  @IsString({ message: 'phoneNumber must be a string or null' })
  @Type(() => String)
  phoneNumber: string | null;

  @ApiProperty({ enum: Status, required: true })
  @IsEnum(Status, { message: 'status must be a valid Status enum value' })
  @IsNotEmpty({ message: 'status cannot be empty' })
  status: Status;

  @ApiProperty({ required: false, type: [String], description: '关联部门ID列表（允许多部门）' })
  @IsOptional()
  @IsArray()
  deptIds?: string[];
}

export class UserUpdateDto extends OmitType(UserCreateDto, [
  'password',
  'domain',
]) {
  @ApiProperty({ required: true })
  @IsString({ message: 'id must be a string' })
  @IsNotEmpty({ message: 'id cannot be empty' })
  id: string;
}

export class BatchDeleteUserDto {
  @ApiProperty({ required: true, description: 'Array of user IDs', type: [String] })
  @IsArray({ message: 'ids must be an array' })
  @IsString({ each: true, message: 'each id must be a string' })
  @IsNotEmpty({ message: 'ids cannot be empty' })
  ids: string[];
}
