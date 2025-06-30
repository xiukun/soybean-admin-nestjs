import { Status } from '@prisma/client';

export interface LowcodeApiEntity {
  id: string;
  name: string;
  path: string;
  method: string;
  description?: string;
  modelId?: string;
  requestSchema?: string;
  responseSchema?: string;
  status: Status;
  createdAt: Date;
  createdBy: string;
  updatedAt?: Date;
  updatedBy?: string;
}

export interface CreateLowcodeApiEntity {
  name: string;
  path: string;
  method: string;
  description?: string;
  modelId?: string;
  requestSchema?: string;
  responseSchema?: string;
  status: Status;
  createdBy: string;
}

export interface UpdateLowcodeApiEntity {
  name?: string;
  path?: string;
  method?: string;
  description?: string;
  modelId?: string;
  requestSchema?: string;
  responseSchema?: string;
  status?: Status;
  updatedBy: string;
}