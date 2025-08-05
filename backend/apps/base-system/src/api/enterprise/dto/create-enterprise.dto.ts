import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional } from 'class-validator';

export class CreateEnterpriseDto {
  @ApiProperty({ description: 'The name of the enterprise' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ description: 'The description of the enterprise', required: false })
  @IsOptional()
  @IsString()
  description?: string;
}