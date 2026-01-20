import { ApiProperty } from '@nestjs/swagger';
import { ArrayNotEmpty, IsArray, IsNotEmpty, IsString } from 'class-validator';

export class AssignButtonDto {
  @ApiProperty({ required: true })
  @IsString({ message: 'domain must be a string.' })
  @IsNotEmpty({ message: 'domain cannot be empty.' })
  domain: string;

  @ApiProperty({ required: true })
  @IsString({ message: 'Role ID must be a string.' })
  @IsNotEmpty({ message: 'Role ID cannot be empty.' })
  roleId: string;

  @ApiProperty({
    type: String,
    isArray: true,
    required: true,
    description: 'A list of button IDs that will be assigned to the role.',
  })
  @IsArray({ message: 'ButtonIds must be an array of button IDs.' })
  @ArrayNotEmpty({ message: 'ButtonIds array cannot be empty.' })
  @IsString({ each: true, message: 'Each button ID must be a string.' })
  @IsNotEmpty({ each: true, message: 'Button ID cannot be empty.' })
  buttonIds: string[];
}
