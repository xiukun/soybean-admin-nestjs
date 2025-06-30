import { CreateLowcodeModelEntity, LowcodeModelEntity, UpdateLowcodeModelEntity } from '../domain/lowcode-model.entity';

export interface LowcodeModelWriteRepoPort {
  create(data: CreateLowcodeModelEntity): Promise<LowcodeModelEntity>;
  update(id: string, data: UpdateLowcodeModelEntity): Promise<LowcodeModelEntity>;
  delete(id: string): Promise<void>;
  updateStatus(id: string, status: string, updatedBy: string): Promise<LowcodeModelEntity>;
}