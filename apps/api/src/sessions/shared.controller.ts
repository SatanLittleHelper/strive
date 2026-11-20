import { Controller, Get, Header, Inject, Param } from '@nestjs/common';
import type { SharedSessionResponse } from '@strive/api-interfaces';
import { SharedSessionsService } from './shared-sessions.service.js';

@Controller('shared')
export class SharedController {
  constructor(@Inject(SharedSessionsService) private readonly shared: SharedSessionsService) {}

  // прогресс меняется каждые секунды, а после отзыва ответ должен пропасть: кэшировать нельзя
  @Get(':token')
  @Header('Cache-Control', 'no-store')
  get(@Param('token') token: string): Promise<SharedSessionResponse> {
    return this.shared.get(token);
  }
}
