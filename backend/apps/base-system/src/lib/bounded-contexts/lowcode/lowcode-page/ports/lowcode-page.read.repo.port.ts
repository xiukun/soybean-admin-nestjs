import { LowcodePageEntity } from '../domain/lowcode-page.entity';

export interface LowcodePageReadRepoPort {
  findById(id: string): Promise<LowcodePageEntity | null>;
  findByCode(code: string): Promise<LowcodePageEntity | null>;
  findAll(params?: {
    current?: number;
    size?: number;
    search?: string;
    status?: string;
  }): Promise<{
    records: LowcodePageEntity[];
    total: number;
    current: number;
    size: number;
  }>;
}