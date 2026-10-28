import { Controller, Get } from '@nestjs/common';
import type { HealthResponse } from '../common/api.types.js';

@Controller()
export class AppController {
  @Get('health')
  getHealth(): HealthResponse {
    return { service: 'api', status: 'ok' };
  }
}
