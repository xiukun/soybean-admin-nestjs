import { LowcodeModelEntity } from '../domain/lowcode-model.entity';

export interface LowcodeModelReadRepoPort {
  findById(id: string): Promise<LowcodeModelEntity | null>;
  findByCode(code: string): Promise<LowcodeModelEntity | null>;
  findAll(params?: {
    current?: number;
    size?: number;
    search?: string;
    status?: string;
  }): Promise<{
    records: LowcodeModelEntity[];
    total: number;
    current: number;
    size: number;
  }>;
  findAllWithRelations(params?: {
    current?: number;
    size?: number;
    search?: string;
    status?: string;
  }): Promise<{
    records: LowcodeModelEntity[];
    total: number;
    current: number;
    size: number;
  }>;
}