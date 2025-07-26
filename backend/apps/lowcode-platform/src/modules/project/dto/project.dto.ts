import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, IsArray, IsUUID, IsBoolean, IsObject, IsNumber } from 'class-validator';

export enum ProjectStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  ARCHIVED = 'ARCHIVED',
  DEVELOPMENT = 'DEVELOPMENT',
  TESTING = 'TESTING',
  PRODUCTION = 'PRODUCTION',
}

export enum ProjectType {
  WEB = 'WEB',
  MOBILE = 'MOBILE',
  DESKTOP = 'DESKTOP',
  API = 'API',
  MICROSERVICE = 'MICROSERVICE',
}

export enum ProjectFramework {
  NESTJS = 'NESTJS',
  EXPRESS = 'EXPRESS',
  SPRING_BOOT = 'SPRING_BOOT',
  DJANGO = 'DJANGO',
  LARAVEL = 'LARAVEL',
  VUE = 'VUE',
  REACT = 'REACT',
  ANGULAR = 'ANGULAR',
}

export enum DatabaseType {
  POSTGRESQL = 'POSTGRESQL',
  MYSQL = 'MYSQL',
  MONGODB = 'MONGODB',
  SQLITE = 'SQLITE',
  REDIS = 'REDIS',
}

export class ProjectConfigDto {
  @ApiPropertyOptional({ description: '项目框架', enum: ProjectFramework })
  @IsOptional()
  @IsEnum(ProjectFramework)
  framework?: ProjectFramework;

  @ApiPropertyOptional({ description: '数据库类型', enum: DatabaseType })
  @IsOptional()
  @IsEnum(DatabaseType)
  database?: DatabaseType;

  @ApiPropertyOptional({ description: '输出路径' })
  @IsOptional()
  @IsString()
  outputPath?: string;

  @ApiPropertyOptional({ description: '包名前缀' })
  @IsOptional()
  @IsString()
  packagePrefix?: string;

  @ApiPropertyOptional({ description: '作者信息' })
  @IsOptional()
  @IsString()
  author?: string;

  @ApiPropertyOptional({ description: '版本号' })
  @IsOptional()
  @IsString()
  version?: string;

  @ApiPropertyOptional({ description: '许可证' })
  @IsOptional()
  @IsString()
  license?: string;

  @ApiPropertyOptional({ description: '代码生成选项' })
  @IsOptional()
  @IsObject()
  codeGeneration?: {
    enableSwagger?: boolean;
    enableValidation?: boolean;
    enableAuth?: boolean;
    enableLogging?: boolean;
    enableCaching?: boolean;
    enableTesting?: boolean;
  };

  @ApiPropertyOptional({ description: '数据库配置' })
  @IsOptional()
  @IsObject()
  databaseConfig?: {
    host?: string;
    port?: number;
    username?: string;
    password?: string;
    database?: string;
    schema?: string;
  };

  @ApiPropertyOptional({ description: '部署配置' })
  @IsOptional()
  @IsObject()
  deploymentConfig?: {
    environment?: string;
    dockerEnabled?: boolean;
    kubernetesEnabled?: boolean;
    cicdEnabled?: boolean;
  };
}

export class CreateProjectDto {
  @ApiProperty({ description: '项目名称' })
  @IsString()
  name: string;

  @ApiProperty({ description: '项目代码' })
  @IsString()
  code: string;

  @ApiPropertyOptional({ description: '项目描述' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: '项目类型', enum: ProjectType })
  @IsEnum(ProjectType)
  type: ProjectType;

  @ApiPropertyOptional({ description: '项目标签' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({ description: '项目配置' })
  @IsOptional()
  @IsObject()
  config?: ProjectConfigDto;

  @ApiPropertyOptional({ description: '是否公开' })
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;

  @ApiPropertyOptional({ description: '团队成员' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  teamMembers?: string[];
}

export class UpdateProjectDto extends PartialType(CreateProjectDto) {
  @ApiPropertyOptional({ description: '项目状态', enum: ProjectStatus })
  @IsOptional()
  @IsEnum(ProjectStatus)
  status?: ProjectStatus;
}

export class QueryProjectDto {
  @ApiPropertyOptional({ description: '搜索关键词' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: '项目状态', enum: ProjectStatus })
  @IsOptional()
  @IsEnum(ProjectStatus)
  status?: ProjectStatus;

  @ApiPropertyOptional({ description: '项目类型', enum: ProjectType })
  @IsOptional()
  @IsEnum(ProjectType)
  type?: ProjectType;

  @ApiPropertyOptional({ description: '项目框架', enum: ProjectFramework })
  @IsOptional()
  @IsEnum(ProjectFramework)
  framework?: ProjectFramework;

  @ApiPropertyOptional({ description: '标签过滤' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({ description: '是否只显示我的项目' })
  @IsOptional()
  @IsBoolean()
  myProjects?: boolean;

  @ApiPropertyOptional({ description: '是否只显示公开项目' })
  @IsOptional()
  @IsBoolean()
  publicOnly?: boolean;

  @ApiPropertyOptional({ description: '创建时间开始' })
  @IsOptional()
  @IsString()
  createdFrom?: string;

  @ApiPropertyOptional({ description: '创建时间结束' })
  @IsOptional()
  @IsString()
  createdTo?: string;

  @ApiPropertyOptional({ description: '排序字段' })
  @IsOptional()
  @IsString()
  sortBy?: string;

  @ApiPropertyOptional({ description: '排序方向', enum: ['ASC', 'DESC'] })
  @IsOptional()
  @IsEnum(['ASC', 'DESC'])
  sortOrder?: 'ASC' | 'DESC';

  @ApiPropertyOptional({ description: '页码', default: 1 })
  @IsOptional()
  @IsNumber()
  page?: number = 1;

  @ApiPropertyOptional({ description: '每页数量', default: 10 })
  @IsOptional()
  @IsNumber()
  pageSize?: number = 10;
}

export class ProjectStatsDto {
  @ApiPropertyOptional({ description: '统计类型' })
  @IsOptional()
  @IsEnum(['overview', 'by-type', 'by-status', 'by-framework'])
  type?: string;

  @ApiPropertyOptional({ description: '时间范围（天）' })
  @IsOptional()
  @IsNumber()
  days?: number;
}
