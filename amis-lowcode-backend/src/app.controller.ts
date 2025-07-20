import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AppService } from './app.service';

@ApiTags('Application')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiOperation({ summary: 'Get application info' })
  @ApiResponse({
    status: 200,
    description: 'Application information',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'number', example: 0 },
        msg: { type: 'string', example: 'success' },
        data: {
          type: 'object',
          properties: {
            name: { type: 'string', example: 'Amis Lowcode Business API' },
            version: { type: 'string', example: '1.0.0' },
            timestamp: { type: 'string', example: '2024-01-01T00:00:00.000Z' },
          },
        },
      },
    },
  })
  getAppInfo() {
    return {
      status: 0,
      msg: 'success',
      data: this.appService.getAppInfo(),
    };
  }

  @Get('health')
  @ApiOperation({ summary: 'Health check' })
  @ApiResponse({
    status: 200,
    description: 'Health status',
  })
  getHealth() {
    return {
      status: 0,
      msg: 'success',
      data: this.appService.getHealth(),
    };
  }
}
