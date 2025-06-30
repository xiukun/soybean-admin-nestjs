import { Status } from '@prisma/client';

export interface LowcodePageEntity {
  id: string;
  name: string;
  title: string;
  code: string;
  description?: string;
  path: string;
  schema: string;
  menuId?: number;
  status: Status;
  createdAt: Date;
  createdBy: string;
  updatedAt?: Date;
  updatedBy?: string;
}

export interface CreateLowcodePageEntity {
  name: string;
  title: string;
  code: string;
  description?: string;
  path: string;
  schema: string;
  menuId?: number;
  status: Status;
  createdBy: string;
}

export interface UpdateLowcodePageEntity {
  name?: string;
  title?: string;
  code?: string;
  description?: string;
  path?: string;
  schema?: string;
  menuId?: number;
  status?: Status;
  updatedBy: string;
}