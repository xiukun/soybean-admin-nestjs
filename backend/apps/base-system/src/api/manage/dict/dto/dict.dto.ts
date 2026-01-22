import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsOptional, IsString, MaxLength } from 'class-validator';
import { Status } from '@prisma/client';

export class DictCreateDto {
  @ApiProperty({ description: 'Dictionary name' })
  @IsString()
  @MaxLength(100)
  name!: string;

  @ApiProperty({ required: false, description: 'Parent id (tree)' })
  @IsOptional()
  @IsString()
  pid?: string;

  @ApiProperty({ required: false, description: 'Sequence/order' })
  @IsOptional()
  @IsNumber()
  sequence?: number;

  @ApiProperty({ description: 'Dictionary code (unique)' })
  @IsString()
  @MaxLength(100)
  code!: string;

  @ApiProperty({ enum: Status, description: 'Status' })
  @IsEnum(Status)
  status!: Status;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  remark?: string | null;
}

export class DictUpdateDto extends DictCreateDto {
  @ApiProperty({ description: 'Dictionary id' })
  @IsString()
  id!: string;
}
