import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Low-code Platform Backend Service is running!';
  }


}
