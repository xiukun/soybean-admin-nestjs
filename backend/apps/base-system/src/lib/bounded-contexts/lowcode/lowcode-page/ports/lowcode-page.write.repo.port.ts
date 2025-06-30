import { CreateLowcodePageEntity, LowcodePageEntity, UpdateLowcodePageEntity } from '../domain/lowcode-page.entity';

export interface LowcodePageWriteRepoPort {
  create(data: CreateLowcodePageEntity): Promise<LowcodePageEntity>;
  update(id: string, data: UpdateLowcodePageEntity): Promise<LowcodePageEntity>;
  delete(id: string): Promise<void>;
  updateStatus(id: string, status: string, updatedBy: string): Promise<LowcodePageEntity>;
}