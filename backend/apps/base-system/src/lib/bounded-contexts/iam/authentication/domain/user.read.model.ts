import { ApiProperty } from '@nestjs/swagger';
import { Status } from '@prisma/client';

import { UpdateAuditInfo } from '@lib/shared/prisma/db.constant';
import { CreationAuditInfoProperties } from '@lib/typings/global';

export type UserEssentialProperties = Readonly<
  Required<{
    id: string;
    username: string;
    domain: string;
    nickName: string;
    status: Status;
  }>
>;

export type UserOptionalProperties = Readonly<
  Partial<{
    password: string;
    avatar: string | null;
    email: string | null;
    phoneNumber: string | null;
  }>
>;

export type UserProperties = UserEssentialProperties &
  Required<UserOptionalProperties> & {
    departments?: DeptLite[];
  };

export type UserCreateProperties = UserProperties & CreationAuditInfoProperties & {
  deptIds?: string[];
};

export type UserUpdateProperties = Omit<
  UserProperties,
  'username' | 'password' | 'domain'
> &
  CreationAuditInfoProperties & {
    deptIds?: string[];
  };

export type DeptLite = Readonly<{
  id: string;
  name: string;
  code: string;
}>;

export class UserReadModel extends UpdateAuditInfo {
  @ApiProperty({ description: 'The unique identifier of the user' })
  id: string;

  @ApiProperty({ description: 'Username of the user' })
  username: string;

  @ApiProperty({ description: 'Domain associated with the user' })
  domain: string;

  @ApiProperty({ description: 'Nickname of the user' })
  nickName: string;

  @ApiProperty({
    description: 'Current status of the user',
    enum: Object.values(Status),
  })
  status: Status;

  @ApiProperty({ description: 'Avatar URL of the user', nullable: true })
  avatar: string | null;

  @ApiProperty({ description: 'Email address of the user', nullable: true })
  email: string | null;

  @ApiProperty({ description: 'Phone number of the user', nullable: true })
  phoneNumber: string | null;

  @ApiProperty({ description: 'Departments of the user', required: false, type: 'array' })
  departments?: DeptLite[];
}
