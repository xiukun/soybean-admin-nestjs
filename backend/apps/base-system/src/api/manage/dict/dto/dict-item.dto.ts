import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { Status } from '@prisma/client';

export class DictItemCreateDto {
  @ApiProperty({ description: 'Item label' })
  @IsString()
  @MaxLength(100)
  label!: string;

  @ApiProperty({ description: 'Item value (unique within dictId)' })
  @IsString()
  @MaxLength(100)
  dictValue!: string;

  @ApiProperty({ required: false, description: 'Sequence/order' })
  @IsOptional()
  sequence?: number;

  @ApiProperty({ enum: Status, required: false })
  @IsOptional()
  @IsEnum(Status)
  status?: Status;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  remark?: string | null;
}

export class DictItemUpdateDto extends DictItemCreateDto {
  @ApiProperty({ description: 'Item id' })
  @IsString()
  id!: string;
}
