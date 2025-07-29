import { Module } from '@nestjs/common';
import { LowcodeEntityController } from './rest/lowcode-entity.controller';

@Module({
  controllers: [LowcodeEntityController],
})
export class LowcodeEntityApiModule {}