import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Low-code Platform Backend Service is running!';
  }

  getHealth() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'lowcode-platform-backend',
      version: '1.0.0',
    };
  }
}
