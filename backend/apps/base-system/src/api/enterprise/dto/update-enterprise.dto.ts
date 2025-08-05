import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class UpdateEnterpriseDto {
  @ApiProperty({ description: 'The name of the enterprise', required: false })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ description: 'The description of the enterprise', required: false })
  @IsOptional()
  @IsString()
  description?: string;
}