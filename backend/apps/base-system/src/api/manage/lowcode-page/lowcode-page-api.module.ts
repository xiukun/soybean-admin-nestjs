import { Module } from '@nestjs/common';

import { LowcodePageModule } from '@lowcode/page/lowcode-page.module';

import { IamModule } from '@app/base-system/infra/bounded-contexts/iam/authentication/iam.module';

import { DesignerController } from './rest/designer.controller';
import { LowcodePageController } from './rest/lowcode-page.controller';
import { SimpleDesignerController } from './rest/simple-designer.controller';
import { SimpleLowcodeController } from './rest/simple-lowcode.controller';
import { LowcodeDesignerTreeController } from './rest/lowcode-designer-tree.controller';


@Module({
  imports: [LowcodePageModule, IamModule],
  controllers: [
    LowcodePageController,
    DesignerController,
    SimpleLowcodeController,
    SimpleDesignerController,
    LowcodeDesignerTreeController,
  ],
})
export class LowcodePageApiModule {}
