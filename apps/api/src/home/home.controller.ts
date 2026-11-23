import { Controller, Get, Inject, UseGuards } from '@nestjs/common';
import type { HomeResponse } from '@strive/api-interfaces';
import { DeviceId, DeviceIdGuard } from '../device-id/index.js';
import { HomeService } from './home.service/index.js';

@Controller('home')
@UseGuards(DeviceIdGuard)
export class HomeController {
  constructor(@Inject(HomeService) private readonly home: HomeService) {}

  @Get()
  getHome(@DeviceId() deviceId: string): Promise<HomeResponse> {
    return this.home.getHome(deviceId);
  }
}
