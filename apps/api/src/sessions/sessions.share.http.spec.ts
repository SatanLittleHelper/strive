import 'reflect-metadata';
import { randomUUID } from 'node:crypto';
import type { INestApplication } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DEVICE_ID_HEADER } from '@strive/api-interfaces';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { configureApp } from '../app/app.setup.js';
import {
  finishSession,
  getDatabaseUrl,
  insertExercise,
  insertSession,
  insertSetResult,
  insertWorkout,
  insertWorkoutExercise,
  setShare,
  useDatabaseClient,
} from '../test-support/index.js';
import { SessionsController } from './sessions.controller.js';
import { SharedController } from './shared.controller.js';

const DEVICE_ID = randomUUID();
const OTHER_DEVICE_ID = randomUUID();
const OK = 200;
const CREATED = 201;
const BAD_REQUEST = 400;
const NOT_FOUND = 404;
const INVALID_LINK_MESSAGE = 'Ссылка недействительна';
const NOTE = 'Болит колено';
const HOUR_MS = 60 * 60 * 1000;
const LONG_TOKEN_LENGTH = 5000;
const SET_VOLUME = 60 * 8;

describe('HTTP общей ссылки на сессию', () => {
  const getClient = useDatabaseClient();
  const state: { app?: INestApplication; url?: string } = {};

  beforeAll(async () => {
    for (const method of ['share', 'revokeShare', 'active']) {
      Reflect.deleteMetadata('design:paramtypes', SessionsController.prototype, method);
    }
    Reflect.deleteMetadata('design:paramtypes', SharedController.prototype, 'get');
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

  async function call({
    path,
    method = 'GET',
    deviceId = DEVICE_ID,
  }: {
    path: string;
    method?: string;
    deviceId?: string | null;
  }) {
    const response = await fetch(`${state.url}/api${path}`, {
      method,
      headers: deviceId === null ? {} : { [DEVICE_ID_HEADER]: deviceId },
    });

    return {
      status: response.status,
      body: JSON.parse((await response.text()) || 'null'),
    };
  }

  async function startedSession(deviceId = DEVICE_ID) {
    const workoutId = await insertWorkout(getClient());
    const exerciseId = await insertExercise(getClient());
    const workoutExerciseId = await insertWorkoutExercise({
      client: getClient(),
      workoutId,
      exerciseId,
    });
    const sessionId = await insertSession({ client: getClient(), deviceId, workoutId });

    return { sessionId, workoutExerciseId };
  }

  async function issueToken(sessionId: string): Promise<string> {
    const { body } = await call({ path: `/sessions/${sessionId}/share`, method: 'POST' });

    return body.data.token;
  }

  const sharedPath = (token: string): string => `/shared/${token}`;

  it('[ss-E1] POST выдаёт ссылку', async () => {
    const { sessionId } = await startedSession();

    const { status, body } = await call({ path: `/sessions/${sessionId}/share`, method: 'POST' });

    expect(status).toBe(CREATED);
    expect(body.data).toEqual({ token: expect.any(String), expiresAt: expect.any(String) });
  });

  it('[ss-E2] POST без идентификатора устройства отклоняется', async () => {
    const { sessionId } = await startedSession();

    const { status } = await call({
      path: `/sessions/${sessionId}/share`,
      method: 'POST',
      deviceId: null,
    });

    expect(status).toBe(BAD_REQUEST);
  });

  it('[ss-E3] POST по чужой сессии — 404', async () => {
    const { sessionId } = await startedSession();

    const { status, body } = await call({
      path: `/sessions/${sessionId}/share`,
      method: 'POST',
      deviceId: OTHER_DEVICE_ID,
    });

    expect(status).toBe(NOT_FOUND);
    expect(body.message).toBe('Сессия не найдена');
  });

  it('[ss-E4] DELETE по чужой сессии — 404', async () => {
    const { sessionId } = await startedSession();

    const { status, body } = await call({
      path: `/sessions/${sessionId}/share`,
      method: 'DELETE',
      deviceId: OTHER_DEVICE_ID,
    });

    expect(status).toBe(NOT_FOUND);
    expect(body.message).toBe('Сессия не найдена');
  });

  it('[ss-E5] GET /sessions/active отдаёт share после выпуска', async () => {
    const { sessionId } = await startedSession();
    const token = await issueToken(sessionId);

    const { body } = await call({ path: '/sessions/active' });

    expect(body.data.session.share.token).toBe(token);
  });

  it('[ss-E6] страница читается без идентификатора устройства', async () => {
    const { sessionId, workoutExerciseId } = await startedSession();
    await insertSetResult({ client: getClient(), sessionId, workoutExerciseId });
    const token = await issueToken(sessionId);

    const { status, body } = await call({ path: sharedPath(token), deviceId: null });

    expect(status).toBe(OK);
    expect(body.data.finishedAt).toBeNull();
    expect(body.data.workout.exercises).toHaveLength(1);
    expect(body.data.results).toHaveLength(1);
  });

  it('[ss-E7] три вида недействительных токенов дают один ответ', async () => {
    const revoked = await startedSession();
    const revokedToken = await issueToken(revoked.sessionId);
    await call({ path: `/sessions/${revoked.sessionId}/share`, method: 'DELETE' });
    const expired = await startedSession(OTHER_DEVICE_ID);
    await setShare({
      client: getClient(),
      sessionId: expired.sessionId,
      token: 'expired-token',
      expiresAt: new Date(Date.now() - HOUR_MS).toISOString(),
    });

    const replies = await Promise.all(
      ['unknown-token', revokedToken, 'expired-token'].map((token) =>
        call({ path: sharedPath(token), deviceId: null }),
      ),
    );

    const expected = {
      status: NOT_FOUND,
      success: false,
      message: INVALID_LINK_MESSAGE,
      data: null,
    };
    for (const { status, body } of replies) {
      expect({ status, success: body.success, message: body.message, data: body.data }).toEqual(
        expected,
      );
    }
  });

  it('[ss-E8] некорректный токен — тот же 404', async () => {
    const tokens = [
      encodeURIComponent(`<script>alert(1)</script>"';--`),
      'a'.repeat(LONG_TOKEN_LENGTH),
    ];

    for (const token of tokens) {
      const { status, body } = await call({ path: sharedPath(token), deviceId: null });

      expect(status).toBe(NOT_FOUND);
      expect(body.message).toBe(INVALID_LINK_MESSAGE);
    }
  });

  it('[ss-E9] ответ не содержит заметок и идентификатора устройства', async () => {
    const { sessionId, workoutExerciseId } = await startedSession();
    await insertSetResult({ client: getClient(), sessionId, workoutExerciseId, note: NOTE });
    const token = await issueToken(sessionId);

    const { body } = await call({ path: sharedPath(token), deviceId: null });

    const text = JSON.stringify(body);
    expect(text).not.toContain(NOTE);
    expect(text).not.toContain(DEVICE_ID);
  });

  it('[ss-E10] завершённая сессия отдаётся со сводкой', async () => {
    const { sessionId, workoutExerciseId } = await startedSession();
    await insertSetResult({ client: getClient(), sessionId, workoutExerciseId });
    const token = await issueToken(sessionId);
    await finishSession({ client: getClient(), sessionId });

    const { body } = await call({ path: sharedPath(token), deviceId: null });

    expect(body.data).toMatchObject({
      finishedAt: expect.any(String),
      exerciseCount: 1,
      setCount: 1,
      totalVolume: SET_VOLUME,
    });
  });
});
