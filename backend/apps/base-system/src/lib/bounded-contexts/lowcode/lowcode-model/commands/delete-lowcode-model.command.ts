import { Inject, Injectable, NotFoundException } from '@nestjs/common';

import { LowcodeModelReadRepoPortToken, LowcodeModelWriteRepoPortToken } from '../constants';
import { LowcodeModelReadRepoPort } from '../ports/lowcode-model.read.repo.port';
import { LowcodeModelWriteRepoPort } from '../ports/lowcode-model.write.repo.port';

@Injectable()
export class DeleteLowcodeModelCommand {
  constructor(
    @Inject(LowcodeModelReadRepoPortToken)
    private readonly lowcodeModelReadRepo: LowcodeModelReadRepoPort,
    @Inject(LowcodeModelWriteRepoPortToken)
    private readonly lowcodeModelWriteRepo: LowcodeModelWriteRepoPort,
  ) {}

  async execute(id: string): Promise<void> {
    // 检查模型是否存在
    const existingModel = await this.lowcodeModelReadRepo.findById(id);
    if (!existingModel) {
      throw new NotFoundException(`模型 ID ${id} 不存在`);
    }

    await this.lowcodeModelWriteRepo.delete(id);
  }
}