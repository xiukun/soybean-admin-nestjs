import { Inject, Injectable, NotFoundException, ConflictException } from '@nestjs/common';

import { LowcodeModelReadRepoPortToken, LowcodeModelWriteRepoPortToken } from '../constants';
import { UpdateLowcodeModelEntity, LowcodeModelEntity } from '../domain/lowcode-model.entity';
import { LowcodeModelReadRepoPort } from '../ports/lowcode-model.read.repo.port';
import { LowcodeModelWriteRepoPort } from '../ports/lowcode-model.write.repo.port';

@Injectable()
export class UpdateLowcodeModelCommand {
  constructor(
    @Inject(LowcodeModelReadRepoPortToken)
    private readonly lowcodeModelReadRepo: LowcodeModelReadRepoPort,
    @Inject(LowcodeModelWriteRepoPortToken)
    private readonly lowcodeModelWriteRepo: LowcodeModelWriteRepoPort,
  ) {}

  async execute(id: string, data: UpdateLowcodeModelEntity): Promise<LowcodeModelEntity> {
    // 检查模型是否存在
    const existingModel = await this.lowcodeModelReadRepo.findById(id);
    if (!existingModel) {
      throw new NotFoundException(`模型 ID ${id} 不存在`);
    }

    // 如果更新编码，检查新编码是否已存在
    if (data.code && data.code !== existingModel.code) {
      const modelWithSameCode = await this.lowcodeModelReadRepo.findByCode(data.code);
      if (modelWithSameCode) {
        throw new ConflictException(`模型编码 ${data.code} 已存在`);
      }
    }

    return this.lowcodeModelWriteRepo.update(id, data);
  }
}