import { Inject, Injectable } from '@nestjs/common';

import { LowcodeApiReadRepoPortToken } from '../constants';
import { LowcodeApiEntity } from '../domain/lowcode-api.entity';
import { LowcodeApiReadRepoPort } from '../ports/lowcode-api.read.repo.port';

@Injectable()
export class GetLowcodeApiByIdQuery {
  constructor(
    @Inject(LowcodeApiReadRepoPortToken)
    private readonly lowcodeApiReadRepo: LowcodeApiReadRepoPort,
  ) {}

  async execute(id: string): Promise<LowcodeApiEntity | null> {
    return this.lowcodeApiReadRepo.findById(id);
  }
}