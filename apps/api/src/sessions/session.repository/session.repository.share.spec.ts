import { randomUUID } from 'node:crypto';
import { NotFoundException } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { PrismaService } from '../../prisma/index.js';
import {
  finishSession,
  getDatabaseUrl,
  getShareColumns,
  insertExercise,
  insertSession,
  insertSetResult,
  insertWorkout,
  insertWorkoutExercise,
  setShare,
  useDatabaseClient,
} from '../../test-support/index.js';
import { SessionRepository } from './session.repository.js';

const DEVICE_ID = randomUUID();
const OTHER_DEVICE_ID = randomUUID();
const UNKNOWN_ID = 999;
const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;
const OLD_TOKEN = 'old-token';
const KNOWN_TOKEN = 'known-token';

const inPast = (): string => new Date(Date.now() - HOUR_MS).toISOString();
const inFuture = (): string => new Date(Date.now() + HOUR_MS).toISOString();

describe('Общая ссылка на сессию', () => {
  const getClient = useDatabaseClient();
  const state: { prisma?: PrismaService } = {};

  beforeAll(async () => {
    const config = { getOrThrow: () => getDatabaseUrl() } as unknown as ConfigService;
    state.prisma = new PrismaService(config);
    await state.prisma.onModuleInit();
  });

  afterAll(async () => {
    await state.prisma?.onModuleDestroy();
  });

  function repository(): SessionRepository {
    if (!state.prisma) throw new Error('PrismaService не создан');
    return new SessionRepository(state.prisma);
  }

  async function newSession(deviceId = DEVICE_ID): Promise<{ id: string; sessionId: number }> {
    const id = await insertSession({ client: getClient(), deviceId });

    return { id, sessionId: Number(id) };
  }

  const columnsOf = (id: string) => getShareColumns({ client: getClient(), sessionId: id });

  it('[ss-I1] первый запрос создаёт токен и срок +24 часа', async () => {
    const { id, sessionId } = await newSession();
    const before = Date.now();

    const link = await repository().getOrCreateShare(DEVICE_ID, sessionId);
    const after = Date.now();

    expect(link.token).not.toBe('');
    expect(Date.parse(link.expiresAt)).toBeGreaterThanOrEqual(before + DAY_MS);
    expect(Date.parse(link.expiresAt)).toBeLessThanOrEqual(after + DAY_MS);
    await expect(columnsOf(id)).resolves.toEqual({ token: link.token, expiresAt: link.expiresAt });
  });

  it('[ss-I2] повторный запрос возвращает ту же ссылку', async () => {
    const { sessionId } = await newSession();
    const first = await repository().getOrCreateShare(DEVICE_ID, sessionId);

    const second = await repository().getOrCreateShare(DEVICE_ID, sessionId);

    expect(second).toEqual(first);
  });

  it('[ss-I3] просроченная ссылка заменяется новой со сроком +24 часа', async () => {
    const { id, sessionId } = await newSession();
    await setShare({ client: getClient(), sessionId: id, token: OLD_TOKEN, expiresAt: inPast() });
    const before = Date.now();

    const link = await repository().getOrCreateShare(DEVICE_ID, sessionId);

    expect(link.token).not.toBe(OLD_TOKEN);
    expect(Date.parse(link.expiresAt)).toBeGreaterThanOrEqual(before + DAY_MS);
  });

  it('[ss-I4] для завершённой сессии ссылка выдаётся', async () => {
    const { id, sessionId } = await newSession();
    await finishSession({ client: getClient(), sessionId: id });

    const link = await repository().getOrCreateShare(DEVICE_ID, sessionId);

    expect(link.token).not.toBe('');
  });

  it('[ss-I5] чужая сессия не получает ссылку', async () => {
    const { id, sessionId } = await newSession(OTHER_DEVICE_ID);

    await expect(repository().getOrCreateShare(DEVICE_ID, sessionId)).rejects.toBeInstanceOf(
      NotFoundException,
    );
    await expect(columnsOf(id)).resolves.toEqual({ token: null, expiresAt: null });
  });

  it('[ss-I6] несуществующая сессия — 404', async () => {
    await expect(repository().getOrCreateShare(DEVICE_ID, UNKNOWN_ID)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('[ss-I7] отзыв обнуляет токен и срок', async () => {
    const { id, sessionId } = await newSession();
    await repository().getOrCreateShare(DEVICE_ID, sessionId);

    await repository().revokeShare(DEVICE_ID, sessionId);

    await expect(columnsOf(id)).resolves.toEqual({ token: null, expiresAt: null });
  });

  it('[ss-I8] после отзыва выдаётся другой токен', async () => {
    const { sessionId } = await newSession();
    const first = await repository().getOrCreateShare(DEVICE_ID, sessionId);
    await repository().revokeShare(DEVICE_ID, sessionId);

    const second = await repository().getOrCreateShare(DEVICE_ID, sessionId);

    expect(second.token).not.toBe(first.token);
  });

  it('[ss-I9] отзыв чужой сессии — 404, ссылка владельца цела', async () => {
    const { id, sessionId } = await newSession();
    const link = await repository().getOrCreateShare(DEVICE_ID, sessionId);

    await expect(repository().revokeShare(OTHER_DEVICE_ID, sessionId)).rejects.toBeInstanceOf(
      NotFoundException,
    );
    await expect(columnsOf(id)).resolves.toMatchObject({ token: link.token });
  });

  it('[ss-I10] отзыв несуществующей сессии — 404', async () => {
    await expect(repository().revokeShare(DEVICE_ID, UNKNOWN_ID)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('[ss-I11] действующая ссылка видна в активной сессии и в сессии по идентификатору', async () => {
    const { id, sessionId } = await newSession();
    const expiresAt = inFuture();
    await setShare({ client: getClient(), sessionId: id, token: KNOWN_TOKEN, expiresAt });
    const expected = { token: KNOWN_TOKEN, expiresAt };

    const active = await repository().findActive(DEVICE_ID);
    const owned = await repository().getOwned(DEVICE_ID, sessionId);

    expect(active?.share).toEqual(expected);
    expect(owned.share).toEqual(expected);
  });

  it('[ss-I12] просроченная ссылка в сессии — null', async () => {
    const { id, sessionId } = await newSession();
    await setShare({ client: getClient(), sessionId: id, token: OLD_TOKEN, expiresAt: inPast() });

    const owned = await repository().getOwned(DEVICE_ID, sessionId);

    expect(owned.share).toBeNull();
  });

  it('[ss-I13] без ссылки share равен null', async () => {
    const { sessionId } = await newSession();

    const owned = await repository().getOwned(DEVICE_ID, sessionId);

    expect(owned.share).toBeNull();
  });

  it('[ss-I14] поиск по действующему токену возвращает эту сессию с планом и подходами', async () => {
    const workoutId = await insertWorkout(getClient());
    const exerciseId = await insertExercise(getClient());
    const workoutExerciseId = await insertWorkoutExercise({
      client: getClient(),
      workoutId,
      exerciseId,
    });
    const id = await insertSession({ client: getClient(), deviceId: DEVICE_ID, workoutId });
    await insertSetResult({ client: getClient(), sessionId: id, workoutExerciseId });
    await setShare({
      client: getClient(),
      sessionId: id,
      token: KNOWN_TOKEN,
      expiresAt: inFuture(),
    });

    const session = await repository().getByShareToken(KNOWN_TOKEN);

    expect(session.id).toBe(Number(id));
    expect(session.workout.exercises).toHaveLength(1);
    expect(session.results).toHaveLength(1);
  });

  it('[ss-I15] просроченный токен не находит сессию', async () => {
    const { id } = await newSession();
    await setShare({ client: getClient(), sessionId: id, token: OLD_TOKEN, expiresAt: inPast() });

    await expect(repository().getByShareToken(OLD_TOKEN)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('[ss-I16] неизвестный токен — не найдено', async () => {
    await expect(repository().getByShareToken('unknown-token')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('[ss-I17] отозванный токен — не найдено', async () => {
    const { sessionId } = await newSession();
    const link = await repository().getOrCreateShare(DEVICE_ID, sessionId);
    await repository().revokeShare(DEVICE_ID, sessionId);

    await expect(repository().getByShareToken(link.token)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
