import { ApiProperty } from '@nestjs/swagger';
import { Status } from '@prisma/client';
import { Transform } from 'class-transformer';
import { IsArray, IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

import { PaginationParams } from '@lib/infra/rest/pagination-params';

export class PageUsersDto extends PaginationParams {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString({ message: 'Username must be a string' })
  @IsNotEmpty({ message: 'Username cannot be empty' })
  username?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString({ message: 'Nickname must be a string' })
  @IsNotEmpty({ message: 'Nickname cannot be empty' })
  nickName?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsEnum(Status, { message: 'Status must be a valid enum value' })
  status?: Status;

  @ApiProperty({ required: false, type: [String], description: '部门ID列表（用于按部门筛选）' })
  @IsOptional()
  @Transform(({ value, obj }) => {
    // NestJS 将 deptIds[0]=value 解析为 { 'deptIds[0]': value }
    // 需要从原始查询对象中提取所有 deptIds 相关的键
    const deptIdsValues: string[] = [];
    
    if (obj && typeof obj === 'object') {
      // 方法1: 查找 deptIds[0], deptIds[1] 等格式的键（这是 NestJS 解析后的实际格式）
      // 注意：NestJS 会将 deptIds[0] 解析为键名 'deptIds[0]'，而不是嵌套对象
      Object.keys(obj).forEach(key => {
        // 匹配 deptIds[0], deptIds[1] 等格式
        const match = key.match(/^deptIds\[(\d+)\]$/);
        if (match) {
          const val = obj[key];
          if (val && typeof val === 'string' && val.trim()) {
            deptIdsValues.push(val.trim());
          }
        }
      });
      
      // 方法2: 查找 deptIds 键（标准格式或对象格式）
      if (obj.deptIds !== undefined) {
        if (Array.isArray(obj.deptIds)) {
          deptIdsValues.push(...obj.deptIds.filter(Boolean).map((v: any) => String(v).trim()).filter(Boolean));
        } else if (typeof obj.deptIds === 'object' && obj.deptIds !== null) {
          // 处理 { '0': value } 格式
          const values = Object.values(obj.deptIds).filter(Boolean);
          deptIdsValues.push(...values.map((v: any) => String(v).trim()).filter(Boolean));
        } else if (typeof obj.deptIds === 'string') {
          // 处理逗号分隔的字符串
          deptIdsValues.push(...obj.deptIds.split(',').map((v: string) => v.trim()).filter(Boolean));
        }
      }
    }
    
    // 如果从 obj 中找到了值，返回去重后的数组
    if (deptIdsValues.length > 0) {
      const result = [...new Set(deptIdsValues.filter(Boolean))];
      return result;
    }
    
    // 处理 value 本身（如果 obj 中没有找到，fallback 到 value）
    if (!value) return undefined;
    if (Array.isArray(value)) {
      return value.filter(Boolean).map((v: any) => String(v).trim()).filter(Boolean);
    }
    if (typeof value === 'string') {
      return value.split(',').map((v: string) => v.trim()).filter(Boolean);
    }
    if (typeof value === 'object' && value !== null) {
      const values = Object.values(value).filter(Boolean);
      return values.length > 0 ? values.map((v: any) => String(v).trim()).filter(Boolean) : undefined;
    }
    const result = [String(value).trim()].filter(Boolean);
    return result.length > 0 ? result : undefined;
  })
  @IsArray()
  deptIds?: string[];
}
