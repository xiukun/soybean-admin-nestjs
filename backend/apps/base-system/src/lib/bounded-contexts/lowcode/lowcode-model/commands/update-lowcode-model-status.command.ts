import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Status } from '@prisma/client';

import { LowcodeModelReadRepoPortToken, LowcodeModelWriteRepoPortToken } from '../constants';
import { LowcodeModelEntity } from '../domain/lowcode-model.entity';
import { LowcodeModelReadRepoPort } from '../ports/lowcode-model.read.repo.port';
import { LowcodeModelWriteRepoPort } from '../ports/lowcode-model.write.repo.port';

@Injectable()
export class UpdateLowcodeModelStatusCommand {
  constructor(
    @Inject(LowcodeModelReadRepoPortToken)
    private readonly lowcodeModelReadRepo: LowcodeModelReadRepoPort,
    @Inject(LowcodeModelWriteRepoPortToken)
    private readonly lowcodeModelWriteRepo: LowcodeModelWriteRepoPort,
  ) {}

  async execute(id: string, status: Status, updatedBy: string): Promise<LowcodeModelEntity> {
    // 检查模型是否存在
    const existingModel = await this.lowcodeModelReadRepo.findById(id);
    if (!existingModel) {
      throw new NotFoundException(`模型 ID ${id} 不存在`);
    }

    return this.lowcodeModelWriteRepo.updateStatus(id, status, updatedBy);
  }
}