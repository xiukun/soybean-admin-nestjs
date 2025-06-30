import { Inject, Injectable, ConflictException } from '@nestjs/common';

import { LowcodeModelReadRepoPortToken, LowcodeModelWriteRepoPortToken } from '../constants';
import { CreateLowcodeModelEntity, LowcodeModelEntity } from '../domain/lowcode-model.entity';
import { LowcodeModelReadRepoPort } from '../ports/lowcode-model.read.repo.port';
import { LowcodeModelWriteRepoPort } from '../ports/lowcode-model.write.repo.port';

@Injectable()
export class CreateLowcodeModelCommand {
  constructor(
    @Inject(LowcodeModelReadRepoPortToken)
    private readonly lowcodeModelReadRepo: LowcodeModelReadRepoPort,
    @Inject(LowcodeModelWriteRepoPortToken)
    private readonly lowcodeModelWriteRepo: LowcodeModelWriteRepoPort,
  ) {}

  async execute(data: CreateLowcodeModelEntity): Promise<LowcodeModelEntity> {
    // 检查编码是否已存在
    const existingModel = await this.lowcodeModelReadRepo.findByCode(data.code);
    if (existingModel) {
      throw new ConflictException(`模型编码 ${data.code} 已存在`);
    }

    return this.lowcodeModelWriteRepo.create(data);
  }
}