import { Inject, Injectable, NotFoundException, ConflictException } from '@nestjs/common';

import { LowcodePageReadRepoPortToken, LowcodePageWriteRepoPortToken } from '../constants';
import { UpdateLowcodePageEntity, LowcodePageEntity } from '../domain/lowcode-page.entity';
import { LowcodePageReadRepoPort } from '../ports/lowcode-page.read.repo.port';
import { LowcodePageWriteRepoPort } from '../ports/lowcode-page.write.repo.port';

@Injectable()
export class UpdateLowcodePageCommand {
  constructor(
    @Inject(LowcodePageReadRepoPortToken)
    private readonly lowcodePageReadRepo: LowcodePageReadRepoPort,
    @Inject(LowcodePageWriteRepoPortToken)
    private readonly lowcodePageWriteRepo: LowcodePageWriteRepoPort,
  ) {}

  async execute(id: string, data: UpdateLowcodePageEntity): Promise<LowcodePageEntity> {
    // 检查页面是否存在
    const existingPage = await this.lowcodePageReadRepo.findById(id);
    if (!existingPage) {
      throw new NotFoundException(`页面 ID ${id} 不存在`);
    }

    // 如果更新编码，检查新编码是否已存在
    if (data.code && data.code !== existingPage.code) {
      const pageWithSameCode = await this.lowcodePageReadRepo.findByCode(data.code);
      if (pageWithSameCode) {
        throw new ConflictException(`页面编码 ${data.code} 已存在`);
      }
    }

    return this.lowcodePageWriteRepo.update(id, data);
  }
}