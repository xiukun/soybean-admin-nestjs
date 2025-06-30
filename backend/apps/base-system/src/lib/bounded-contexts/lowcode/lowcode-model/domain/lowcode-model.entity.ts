import { Status } from '@prisma/client';

export interface LowcodeModelPropertyEntity {
  id: string;
  modelId: string;
  name: string;
  code: string;
  description?: string;
  type: string;
  length?: number;
  precision?: number;
  scale?: number;
  nullable: boolean;
  defaultValue?: string;
  isPrimaryKey: boolean;
  isUnique: boolean;
  isIndex: boolean;
  createdAt: Date;
  createdBy: string;
  updatedAt?: Date;
  updatedBy?: string;
}

export interface LowcodeModelReferenceEntity {
  id: string;
  modelId: string;
  name: string;
  sourceModel: string;
  sourceProperty: string;
  targetModel: string;
  targetProperty: string;
  relationType: string;
  onDelete?: string;
  onUpdate?: string;
  createdAt: Date;
  createdBy: string;
  updatedAt?: Date;
  updatedBy?: string;
}

export interface LowcodeModelEntity {
  id: string;
  name: string;
  code: string;
  description?: string;
  tableName: string;
  status: Status;
  createdAt: Date;
  createdBy: string;
  updatedAt?: Date;
  updatedBy?: string;
  properties?: LowcodeModelPropertyEntity[];
  references?: LowcodeModelReferenceEntity[];
}

export interface CreateLowcodeModelPropertyEntity {
  name: string;
  code: string;
  description?: string;
  type: string;
  length?: number;
  precision?: number;
  scale?: number;
  nullable?: boolean;
  defaultValue?: string;
  isPrimaryKey?: boolean;
  isUnique?: boolean;
  isIndex?: boolean;
  createdBy: string;
}

export interface CreateLowcodeModelReferenceEntity {
  name: string;
  sourceModel: string;
  sourceProperty: string;
  targetModel: string;
  targetProperty: string;
  relationType: string;
  onDelete?: string;
  onUpdate?: string;
  createdBy: string;
}

export interface CreateLowcodeModelEntity {
  name: string;
  code: string;
  description?: string;
  tableName: string;
  status: Status;
  createdBy: string;
  properties?: CreateLowcodeModelPropertyEntity[];
  references?: CreateLowcodeModelReferenceEntity[];
}

export interface UpdateLowcodeModelEntity {
  name?: string;
  code?: string;
  description?: string;
  tableName?: string;
  status?: Status;
  updatedBy: string;
}