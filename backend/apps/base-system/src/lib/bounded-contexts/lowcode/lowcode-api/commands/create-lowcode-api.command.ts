import { Inject, Injectable, ConflictException } from '@nestjs/common';

import { LowcodeApiReadRepoPortToken, LowcodeApiWriteRepoPortToken } from '../constants';
import { CreateLowcodeApiEntity, LowcodeApiEntity } from '../domain/lowcode-api.entity';
import { LowcodeApiReadRepoPort } from '../ports/lowcode-api.read.repo.port';
import { LowcodeApiWriteRepoPort } from '../ports/lowcode-api.write.repo.port';

@Injectable()
export class CreateLowcodeApiCommand {
  constructor(
    @Inject(LowcodeApiReadRepoPortToken)
    private readonly lowcodeApiReadRepo: LowcodeApiReadRepoPort,
    @Inject(LowcodeApiWriteRepoPortToken)
    private readonly lowcodeApiWriteRepo: LowcodeApiWriteRepoPort,
  ) {}

  async execute(data: CreateLowcodeApiEntity): Promise<LowcodeApiEntity> {
    // 检查路径和方法组合是否已存在
    const existingApi = await this.lowcodeApiReadRepo.findByPathAndMethod(data.path, data.method);
    if (existingApi) {
      throw new ConflictException(`API路径 ${data.path} 和方法 ${data.method} 的组合已存在`);
    }

    return this.lowcodeApiWriteRepo.create(data);
  }
}