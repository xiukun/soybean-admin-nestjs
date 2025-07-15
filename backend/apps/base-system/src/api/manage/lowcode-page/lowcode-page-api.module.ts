import { Module } from '@nestjs/common';
import { LowcodePageController } from './rest/lowcode-page.controller';
import { DesignerController } from './rest/designer.controller';
import { SimpleLowcodeController } from './rest/simple-lowcode.controller';
import { SimpleDesignerController } from './rest/simple-designer.controller';
import { LowcodePageModule } from '@lowcode/page/lowcode-page.module';

@Module({
  imports: [LowcodePageModule],
  controllers: [
    LowcodePageController,
    DesignerController,
    SimpleLowcodeController,
    SimpleDesignerController,
  ],
})
export class LowcodePageApiModule {}
