import { Module } from '@nestjs/common';

import {
  LowcodeApiReadRepoPortToken,
  LowcodeApiWriteRepoPortToken,
} from '@app/base-system/lib/bounded-contexts/lowcode/lowcode-api/constants';
import { LowcodeApiModule } from '@app/base-system/lib/bounded-contexts/lowcode/lowcode-api/lowcode-api.module';

import { LowcodeApiReadPostgresRepository } from './repository/lowcode-api.read.pg.repository';
import { LowcodeApiWritePostgresRepository } from './repository/lowcode-api.write.pg.repository';

const providers = [
  { provide: LowcodeApiReadRepoPortToken, useClass: LowcodeApiReadPostgresRepository },
  { provide: LowcodeApiWriteRepoPortToken, useClass: LowcodeApiWritePostgresRepository },
];

@Module({
  imports: [
    LowcodeApiModule.register({
      inject: [...providers],
      imports: [],
    }),
  ],
  exports: [LowcodeApiModule],
})
export class LowcodeApiInfraModule {}