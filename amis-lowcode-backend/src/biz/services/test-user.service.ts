import { Injectable } from '@nestjs/common';
import { TestUserBaseService } from '../../base/services/test-user.base.service';
import { PrismaService } from '../../shared/services/prisma.service';

/**
 * 测试用户业务服务
 * 继承Base服务，可以在此添加自定义业务逻辑
 */
@Injectable()
export class TestUserService extends TestUserBaseService {
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  // 在此添加自定义业务方法
  // 例如：
  // async customMethod() {
  //   // 自定义业务逻辑
  // }
}
