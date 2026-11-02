import 'reflect-metadata';
import { randomUUID } from 'node:crypto';
import type { INestApplication } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DEVICE_ID_HEADER, type ApiResponse, type WorkoutSession } from '@strive/api-interfaces';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { configureApp } from '../app/app.setup.js';
import {
  getDatabaseUrl,
  insertExercise,
  insertSession,
  insertWorkout,
  insertWorkoutExercise,
  useDatabaseClient,
} from '../test-support/index.js';
import { SessionsController } from './sessions.controller.js';

const DEVICE_ID = randomUUID();
const OTHER_DEVICE_ID = randomUUID();
const OK = 200;
const CREATED = 201;
const BAD_REQUEST = 400;
const NOT_FOUND = 404;
const CONFLICT = 409;
const UNKNOWN_ID = 999;
const TARGET_SETS = 3;
const RESULT = { weight: 60.25, reps: 8, rpe: 3, note: 'Хороший подход' };

describe('HTTP сессий тренировок', () => {
  const getClient = useDatabaseClient();
  const state: { app?: INestApplication; url?: string } = {};

  beforeAll(async () => {
    for (const method of ['active', 'start', 'get', 'saveSet', 'finish']) {
      Reflect.deleteMetadata('design:paramtypes', SessionsController.prototype, method);
    }
    process.env['LOG_PRETTY'] = 'false';
    process.env['DATABASE_URL'] = getDatabaseUrl();
    const { AppModule } = await import('../app/app.module.js');
    const app = await NestFactory.create(AppModule, { logger: false });
    configureApp(app);
    await app.listen(0, '127.0.0.1');
    state.app = app;
    state.url = await app.getUrl();
  });

  afterAll(async () => {
    await state.app?.close();
  });

  async function request({
    path = '',
    method = 'GET',
    body,
    deviceId = DEVICE_ID,
  }: {
    path?: string;
    method?: string;
    body?: unknown;
    deviceId?: string | null;
  }) {
    const response = await fetch(`${state.url}/api/sessions${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(deviceId === null ? {} : { [DEVICE_ID_HEADER]: deviceId }),
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    return { status: response.status, body: await response.json() };
  }

  async function catalog() {
    const workoutId = await insertWorkout(getClient());
    const exerciseId = await insertExercise(getClient());
    await insertWorkoutExercise({
      client: getClient(),
      workoutId,
      exerciseId,
      targetSets: TARGET_SETS,
    });
    return { workoutId: Number(workoutId), exerciseId: Number(exerciseId) };
  }

  it.each([
    { path: '/active' },
    { method: 'POST' },
    { path: '/1' },
    { path: '/1/sets/1/1', method: 'PUT' },
    { path: '/1/finish', method: 'POST' },
  ])('требует заголовок устройства: %j', async (options) => {
    expect(await request({ ...options, deviceId: null })).toMatchObject({ status: BAD_REQUEST });
  });

  it('выполняет старт → active → запись и правка подхода → finish → active null', async () => {
    const { workoutId, exerciseId } = await catalog();
    expect(await request({ path: '/active' })).toMatchObject({
      status: OK,
      body: { data: { session: null } },
    });
    const start = await request({ method: 'POST', body: { workoutId } });
    expect(start).toMatchObject({
      status: CREATED,
      body: { success: true, data: { workout: { id: workoutId }, results: [], finishedAt: null } },
    });
    const started = start.body as ApiResponse<WorkoutSession>;
    if (!started.data) throw new Error('Сессия не создана');
    const sessionId = started.data.id;
    expect(await request({ path: '/active' })).toMatchObject({
      status: OK,
      body: { data: { session: { id: sessionId } } },
    });
    expect(await request({ path: `/${sessionId}` })).toMatchObject({
      status: OK,
      body: { data: { id: sessionId } },
    });
    expect(
      await request({ method: 'PUT', path: `/${sessionId}/sets/${exerciseId}/1`, body: RESULT }),
    ).toMatchObject({
      status: OK,
      body: { data: { results: [{ exerciseId, setNumber: 1, ...RESULT }] } },
    });
    expect(
      await request({
        method: 'PUT',
        path: `/${sessionId}/sets/${exerciseId}/1`,
        body: { weight: 0, reps: 1, rpe: null, note: null },
      }),
    ).toMatchObject({
      status: OK,
      body: { data: { results: [{ weight: 0, reps: 1, rpe: null, note: null }] } },
    });
    expect(await request({ method: 'POST', path: `/${sessionId}/finish` })).toMatchObject({
      status: OK,
      body: { data: { finishedAt: expect.any(String) } },
    });
    expect(await request({ path: '/active' })).toMatchObject({
      status: OK,
      body: { data: { session: null } },
    });
    expect(await request({ method: 'POST', path: `/${sessionId}/finish` })).toMatchObject({
      status: CONFLICT,
    });
    expect(
      await request({ method: 'PUT', path: `/${sessionId}/sets/${exerciseId}/1`, body: RESULT }),
    ).toMatchObject({ status: CONFLICT });
  });

  it('отвечает 409 при повторном старте', async () => {
    const { workoutId } = await catalog();
    await request({ method: 'POST', body: { workoutId } });
    expect(await request({ method: 'POST', body: { workoutId } })).toMatchObject({
      status: CONFLICT,
    });
  });

  it.each([
    { weight: -1 },
    { weight: 10000 },
    { weight: 1.234 },
    { weight: null },
    { reps: 0 },
    { reps: 1000 },
    { reps: 1.5 },
    { reps: null },
    { rpe: 6 },
    { rpe: 0 },
    { rpe: 1.5 },
    { note: 'x'.repeat(501) },
    { note: 1 },
  ])('отклоняет некорректный ввод %j', async (invalid) => {
    const { workoutId, exerciseId } = await catalog();
    const sessionId = await insertSession({
      client: getClient(),
      deviceId: DEVICE_ID,
      workoutId: String(workoutId),
    });
    expect(
      await request({
        method: 'PUT',
        path: `/${sessionId}/sets/${exerciseId}/1`,
        body: { ...RESULT, ...invalid },
      }),
    ).toMatchObject({ status: BAD_REQUEST });
  });

  it('отклоняет упражнение вне плана и лишний подход', async () => {
    const { workoutId, exerciseId } = await catalog();
    const sessionId = await insertSession({
      client: getClient(),
      deviceId: DEVICE_ID,
      workoutId: String(workoutId),
    });
    for (const suffix of [`${UNKNOWN_ID}/1`, `${exerciseId}/${TARGET_SETS + 1}`]) {
      expect(
        await request({ method: 'PUT', path: `/${sessionId}/sets/${suffix}`, body: RESULT }),
      ).toMatchObject({ status: BAD_REQUEST });
    }
  });

  it.each(['abc', '0', '-1', '1.5', '99999999999999999999'])(
    'валидирует id и параметры подхода без метаданных: %s',
    async (invalid) => {
      expect(await request({ path: `/${invalid}` })).toMatchObject({ status: BAD_REQUEST });
      expect(await request({ method: 'POST', path: `/${invalid}/finish` })).toMatchObject({
        status: BAD_REQUEST,
      });
      expect(await request({ method: 'POST', body: { workoutId: invalid } })).toMatchObject({
        status: BAD_REQUEST,
      });
      expect(
        await request({ method: 'PUT', path: `/1/sets/${invalid}/1`, body: RESULT }),
      ).toMatchObject({ status: BAD_REQUEST });
      expect(
        await request({ method: 'PUT', path: `/1/sets/1/${invalid}`, body: RESULT }),
      ).toMatchObject({ status: BAD_REQUEST });
    },
  );

  it('отвечает 404 на чужую сессию для всех операций', async () => {
    const { workoutId, exerciseId } = await catalog();
    const sessionId = await insertSession({
      client: getClient(),
      deviceId: OTHER_DEVICE_ID,
      workoutId: String(workoutId),
    });
    for (const options of [
      { path: `/${sessionId}` },
      { method: 'POST', path: `/${sessionId}/finish` },
      { method: 'PUT', path: `/${sessionId}/sets/${exerciseId}/1`, body: RESULT },
    ]) {
      expect(await request(options)).toMatchObject({ status: NOT_FOUND });
    }
  });
});
