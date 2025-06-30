import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Status } from '@prisma/client';

import { LowcodePageReadRepoPortToken, LowcodePageWriteRepoPortToken } from '../constants';
import { LowcodePageEntity } from '../domain/lowcode-page.entity';
import { LowcodePageReadRepoPort } from '../ports/lowcode-page.read.repo.port';
import { LowcodePageWriteRepoPort } from '../ports/lowcode-page.write.repo.port';

@Injectable()
export class UpdateLowcodePageStatusCommand {
  constructor(
    @Inject(LowcodePageReadRepoPortToken)
    private readonly lowcodePageReadRepo: LowcodePageReadRepoPort,
    @Inject(LowcodePageWriteRepoPortToken)
    private readonly lowcodePageWriteRepo: LowcodePageWriteRepoPort,
  ) {}

  async execute(id: string, status: Status, updatedBy: string): Promise<LowcodePageEntity> {
    // 检查页面是否存在
    const existingPage = await this.lowcodePageReadRepo.findById(id);
    if (!existingPage) {
      throw new NotFoundException(`页面 ID ${id} ��存在`);
    }

    return this.lowcodePageWriteRepo.updateStatus(id, status, updatedBy);
  }
}