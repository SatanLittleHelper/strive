import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { INestApplication } from '@nestjs/common';

describe('HTTP API и граф зависимостей', () => {
  const state: { app?: INestApplication; url?: string } = {};

  beforeAll(async () => {
    process.env['LOG_PRETTY'] = 'false';
    const { AppModule } = await import('./app.module.js');
    const app = await NestFactory.create(AppModule, { logger: false });
    app.setGlobalPrefix('api');
    await app.listen(0, '127.0.0.1');
    state.app = app;
    state.url = await app.getUrl();
  });

  afterAll(async () => {
    await state.app?.close();
  });

  it('возвращает состояние API через единый формат ответа', async () => {
    const response = await fetch(`${state.url}/api/health`);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      success: true,
      data: { service: 'api', status: 'ok' },
      message: null,
      details: null,
    });
  });

  it('возвращает 404 в едином формате для неизвестного маршрута', async () => {
    const response = await fetch(`${state.url}/api/missing`);
    expect(response.status).toBe(404);
    expect(await response.json()).toMatchObject({ success: false, data: null });
  });
});
