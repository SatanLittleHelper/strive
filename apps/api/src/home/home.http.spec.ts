import 'reflect-metadata';
import { randomUUID } from 'node:crypto';
import { HttpStatus, type INestApplication } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DEVICE_ID_HEADER } from '@strive/api-interfaces';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { configureApp } from '../app/app.setup.js';
import {
  finishSession,
  getDatabaseUrl,
  insertSession,
  insertWorkout,
  useDatabaseClient,
} from '../test-support/index.js';

describe('HTTP главной', () => {
  const client = useDatabaseClient();
  const deviceId = randomUUID();
  const otherDeviceId = randomUUID();
  const state: { app?: INestApplication; url?: string } = {};

  beforeAll(async () => {
    process.env['LOG_PRETTY'] = 'false';
    process.env['DATABASE_URL'] = getDatabaseUrl();
    const { AppModule } = await import('../app/app.module.js');
    const app = await NestFactory.create(AppModule, { logger: false });
    configureApp(app);
    await app.listen(0, '127.0.0.1');
    state.app = app;
    state.url = await app.getUrl();
  });

  afterAll(async () => state.app?.close());

  async function get(owner: string | null = deviceId) {
    const response = await fetch(`${state.url}/api/home`, {
      headers: owner === null ? {} : { [DEVICE_ID_HEADER]: owner },
    });
    return { status: response.status, body: await response.json() };
  }

  it('[E1] отдаёт только имя активной тренировки текущего устройства', async () => {
    const legs = await insertWorkout(client(), { name: 'Ноги' });
    const back = await insertWorkout(client(), { name: 'Спина' });
    await insertSession({ client: client(), deviceId: otherDeviceId, workoutId: back });
    await insertSession({ client: client(), deviceId, workoutId: legs });
    expect(await get()).toEqual({
      status: HttpStatus.OK,
      body: {
        success: true,
        message: null,
        details: null,
        data: { kind: 'active', workoutName: 'Ноги' },
      },
    });
  });

  it('[E2] отклоняет запрос без идентификатора устройства', async () => {
    expect(await get(null)).toMatchObject({
      status: HttpStatus.BAD_REQUEST,
      body: { success: false, data: null },
    });
  });

  it('[E6] отдаёт краткую карточку следующей тренировки', async () => {
    const back = await insertWorkout(client(), { name: 'Спина' });
    const chest = await insertWorkout(client(), { name: 'Грудь' });
    const sessionId = await insertSession({ client: client(), deviceId, workoutId: back });
    await finishSession({ client: client(), sessionId });
    expect(await get()).toEqual({
      status: HttpStatus.OK,
      body: {
        success: true,
        message: null,
        details: null,
        data: { kind: 'next', workout: { id: Number(chest), name: 'Грудь', exerciseCount: 0 } },
      },
    });
  });

  it('[E8] отдаёт пустое состояние', async () => {
    expect(await get()).toEqual({
      status: HttpStatus.OK,
      body: { success: true, message: null, details: null, data: { kind: 'empty' } },
    });
  });

  it('[E9] активная сессия приоритетнее завершённых', async () => {
    const legs = await insertWorkout(client(), { name: 'Ноги' });
    const back = await insertWorkout(client(), { name: 'Спина' });
    const finished = await insertSession({ client: client(), deviceId, workoutId: legs });
    await finishSession({ client: client(), sessionId: finished });
    await insertSession({ client: client(), deviceId, workoutId: back });
    expect(await get()).toMatchObject({
      body: { data: { kind: 'active', workoutName: 'Спина' } },
    });
  });

  it('[E10] после последней тренировки каталога возвращается первая', async () => {
    const legs = await insertWorkout(client(), { name: 'Ноги' });
    const back = await insertWorkout(client(), { name: 'Спина' });
    const sessionId = await insertSession({ client: client(), deviceId, workoutId: back });
    await finishSession({ client: client(), sessionId });
    expect(await get()).toMatchObject({
      body: {
        data: { kind: 'next', workout: { id: Number(legs), name: 'Ноги', exerciseCount: 0 } },
      },
    });
  });
});
