import { ApiProperty } from '@nestjs/swagger';
import { Status } from '@prisma/client';

export class LowcodePageReadModel {
  @ApiProperty({
    description: 'Unique identifier for the lowcode page',
    example: 'a1b2c3d4-e5f6-g7h8-i9j0-k1l2m3n4o5p6',
  })
  id: string;

  @ApiProperty({
    description: 'Page name',
    example: 'User Management Page',
  })
  name: string;

  @ApiProperty({
    description: 'Page title',
    example: 'User Management',
  })
  title: string;

  @ApiProperty({
    description: 'Unique page code',
    example: 'user-management',
  })
  code: string;

  @ApiProperty({
    description: 'Page description',
    example: 'A page for managing users',
    required: false,
    nullable: true,
  })
  description: string | null;

  @ApiProperty({
    description: 'AMIS JSON Schema',
    example: { type: 'page', body: [] },
  })
  schema: any;

  @ApiProperty({
    description: 'Page status',
    enum: Status,
    example: Status.ENABLED,
  })
  status: Status;

  @ApiProperty({
    description: 'Creation timestamp',
    example: '2023-01-01T00:00:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'User who created the page',
    example: 'admin',
  })
  createdBy: string;

  @ApiProperty({
    description: 'Last update timestamp',
    example: '2023-01-02T00:00:00.000Z',
    required: false,
    nullable: true,
  })
  updatedAt: Date | null;

  @ApiProperty({
    description: 'User who last updated the page',
    example: 'admin',
    required: false,
    nullable: true,
  })
  updatedBy: string | null;
}

export class LowcodePageVersionReadModel {
  @ApiProperty({
    description: 'Unique identifier for the page version',
    example: 'v1b2c3d4-e5f6-g7h8-i9j0-k1l2m3n4o5p6',
  })
  id: string;

  @ApiProperty({
    description: 'Page ID this version belongs to',
    example: 'a1b2c3d4-e5f6-g7h8-i9j0-k1l2m3n4o5p6',
  })
  pageId: string;

  @ApiProperty({
    description: 'Version string',
    example: '1.0.0',
  })
  version: string;

  @ApiProperty({
    description: 'AMIS JSON Schema for this version',
    example: { type: 'page', body: [] },
  })
  schema: any;

  @ApiProperty({
    description: 'Changelog for this version',
    example: 'Initial version',
    required: false,
    nullable: true,
  })
  changelog: string | null;

  @ApiProperty({
    description: 'Version creation timestamp',
    example: '2023-01-01T00:00:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'User who created this version',
    example: 'admin',
  })
  createdBy: string;
}
