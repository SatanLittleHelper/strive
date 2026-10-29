import 'reflect-metadata';
import { Controller, Get, UseGuards, type INestApplication } from '@nestjs/common';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import { DEVICE_ID_HEADER } from '@strive/api-interfaces';
import { LoggerModule } from 'nestjs-pino';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { ApiExceptionFilter } from '../../common/api-exception-filter.js';
import { ApiResponseInterceptor } from '../../common/api-response.interceptor.js';
import { DeviceId } from '../device-id.decorator.js';
import { DeviceIdGuard } from './device-id.guard.js';

const VALID_DEVICE_ID = '3f2b8f44-5c1d-4a52-9e5b-0b8b6f3c1a10';

@Controller('probe')
class ProbeController {
  @Get('guarded')
  @UseGuards(DeviceIdGuard)
  guarded(@DeviceId() deviceId: string): string {
    return deviceId;
  }

  @Get('unguarded')
  unguarded(@DeviceId() deviceId: string): string {
    return deviceId;
  }
}

describe('DeviceIdGuard', () => {
  const state: { app?: INestApplication; url?: string } = {};

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [LoggerModule.forRoot({ pinoHttp: { level: 'silent' } })],
      controllers: [ProbeController],
      providers: [
        { provide: APP_FILTER, useClass: ApiExceptionFilter },
        { provide: APP_INTERCEPTOR, useClass: ApiResponseInterceptor },
      ],
    }).compile();

    state.app = moduleRef.createNestApplication();
    await state.app.listen(0, '127.0.0.1');
    state.url = await state.app.getUrl();
  });

  afterAll(async () => {
    await state.app?.close();
  });

  it('пропускает запрос с валидным UUID и передаёт его в обработчик', async () => {
    const response = await fetch(`${state.url}/probe/guarded`, {
      headers: { [DEVICE_ID_HEADER]: VALID_DEVICE_ID },
    });

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ success: true, data: VALID_DEVICE_ID });
  });

  it('отвечает 400, если заголовок не передан', async () => {
    const response = await fetch(`${state.url}/probe/guarded`);

    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({ success: false, data: null });
  });

  it('отвечает 400, если значение не UUID', async () => {
    const response = await fetch(`${state.url}/probe/guarded`, {
      headers: { [DEVICE_ID_HEADER]: 'not-a-uuid' },
    });

    expect(response.status).toBe(400);
  });

  it('отвечает 500, если декоратор использован без guard', async () => {
    const response = await fetch(`${state.url}/probe/unguarded`, {
      headers: { [DEVICE_ID_HEADER]: VALID_DEVICE_ID },
    });

    expect(response.status).toBe(500);
  });
});
