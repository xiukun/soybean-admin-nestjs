import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsString, IsEmail, IsOptional, IsBoolean, IsNumber, IsDateString } from 'class-validator';

/**
 * 创建测试用户DTO
 */
export class CreateTestUserDto {
  @ApiProperty({ description: '用户登录名' })
  @IsString()
  
  username: string;

  @ApiProperty({ description: '用户邮箱地址' })
  @IsEmail()
  
  email: string;

  @ApiPropertyOptional({ description: '用户手机号码' })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional({ description: '用户真实姓名' })
  @IsString()
  @IsOptional()
  realName?: string;

  @ApiPropertyOptional({ description: '用户年龄' })
  @IsNumber()
  @IsOptional()
  age?: number;

  @ApiPropertyOptional({ description: '用户性别' })
  @IsString()
  @IsOptional()
  gender?: string;

  @ApiPropertyOptional({ description: '用户生日' })
  @IsDateString()
  @IsOptional()
  birthday?: Date;

  @ApiPropertyOptional({ description: '用户头像链接' })
  @IsString()
  @IsOptional()
  avatar?: string;

  @ApiPropertyOptional({ description: '用户个人简介' })
  @IsString()
  @IsOptional()
  bio?: string;

  @ApiProperty({ description: '用户账户是否激活' })
  @IsBoolean()
  
  isActive: boolean;

  @ApiPropertyOptional({ description: '用户最后登录时间' })
  @IsDateString()
  @IsOptional()
  lastLoginAt?: Date;

  @ApiPropertyOptional({ description: '用户个性化配置' })
  @IsString()
  @IsOptional()
  settings?: any;
}

/**
 * 更新测试用户DTO
 */
export class UpdateTestUserDto extends PartialType(CreateTestUserDto) {}

/**
 * 测试用户查询DTO
 */
export class TestUserQueryDto {
  @ApiPropertyOptional({ description: '当前页码', example: 1 })
  @IsOptional()
  @IsNumber()
  current?: number;

  @ApiPropertyOptional({ description: '每页大小', example: 10 })
  @IsOptional()
  @IsNumber()
  size?: number;

  @ApiPropertyOptional({ description: '排序字段', example: 'createdAt:desc' })
  @IsOptional()
  @IsString()
  sort?: string;

  @ApiPropertyOptional({ description: '搜索关键词' })
  @IsOptional()
  @IsString()
  search?: string;
}
