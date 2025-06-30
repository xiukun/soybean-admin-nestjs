import { CreateLowcodeApiEntity, LowcodeApiEntity, UpdateLowcodeApiEntity } from '../domain/lowcode-api.entity';

export interface LowcodeApiWriteRepoPort {
  create(data: CreateLowcodeApiEntity): Promise<LowcodeApiEntity>;
  update(id: string, data: UpdateLowcodeApiEntity): Promise<LowcodeApiEntity>;
  delete(id: string): Promise<void>;
  updateStatus(id: string, status: string, updatedBy: string): Promise<LowcodeApiEntity>;
}