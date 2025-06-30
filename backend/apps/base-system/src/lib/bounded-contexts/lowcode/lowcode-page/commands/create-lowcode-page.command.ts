import { Inject, Injectable, ConflictException } from '@nestjs/common';

import { LowcodePageReadRepoPortToken, LowcodePageWriteRepoPortToken } from '../constants';
import { CreateLowcodePageEntity, LowcodePageEntity } from '../domain/lowcode-page.entity';
import { LowcodePageReadRepoPort } from '../ports/lowcode-page.read.repo.port';
import { LowcodePageWriteRepoPort } from '../ports/lowcode-page.write.repo.port';

@Injectable()
export class CreateLowcodePageCommand {
  constructor(
    @Inject(LowcodePageReadRepoPortToken)
    private readonly lowcodePageReadRepo: LowcodePageReadRepoPort,
    @Inject(LowcodePageWriteRepoPortToken)
    private readonly lowcodePageWriteRepo: LowcodePageWriteRepoPort,
  ) {}

  async execute(data: CreateLowcodePageEntity): Promise<LowcodePageEntity> {
    // 检查编码是否已存在
    const existingPage = await this.lowcodePageReadRepo.findByCode(data.code);
    if (existingPage) {
      throw new ConflictException(`页面编码 ${data.code} 已存在`);
    }

    return this.lowcodePageWriteRepo.create(data);
  }
}