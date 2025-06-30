import { LowcodeApiEntity } from '../domain/lowcode-api.entity';

export interface LowcodeApiReadRepoPort {
  findById(id: string): Promise<LowcodeApiEntity | null>;
  findByPathAndMethod(path: string, method: string): Promise<LowcodeApiEntity | null>;
  findAll(params?: {
    current?: number;
    size?: number;
    search?: string;
    status?: string;
    method?: string;
  }): Promise<{
    records: LowcodeApiEntity[];
    total: number;
    current: number;
    size: number;
  }>;
}