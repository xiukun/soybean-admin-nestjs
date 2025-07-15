import { Module } from '@nestjs/common';
import { LowcodePageModule } from '@lowcode/page/lowcode-page.module';

@Module({
  imports: [LowcodePageModule],
  exports: [LowcodePageModule],
})
export class LowcodeModule {}
