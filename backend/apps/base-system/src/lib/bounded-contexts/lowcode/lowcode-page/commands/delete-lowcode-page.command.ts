import { Inject, Injectable, NotFoundException } from '@nestjs/common';

import { LowcodePageReadRepoPortToken, LowcodePageWriteRepoPortToken } from '../constants';
import { LowcodePageReadRepoPort } from '../ports/lowcode-page.read.repo.port';
import { LowcodePageWriteRepoPort } from '../ports/lowcode-page.write.repo.port';

@Injectable()
export class DeleteLowcodePageCommand {
  constructor(
    @Inject(LowcodePageReadRepoPortToken)
    private readonly lowcodePageReadRepo: LowcodePageReadRepoPort,
    @Inject(LowcodePageWriteRepoPortToken)
    private readonly lowcodePageWriteRepo: LowcodePageWriteRepoPort,
  ) {}

  async execute(id: string): Promise<void> {
    // 检查页面是否存在
    const existingPage = await this.lowcodePageReadRepo.findById(id);
    if (!existingPage) {
      throw new NotFoundException(`页面 ID ${id} 不存在`);
    }

    await this.lowcodePageWriteRepo.delete(id);
  }
}