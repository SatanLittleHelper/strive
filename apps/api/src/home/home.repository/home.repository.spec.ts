import { randomUUID } from 'node:crypto';
import type { ConfigService } from '@nestjs/config';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { PrismaService } from '../../prisma/index.js';
import {
  finishSession,
  getDatabaseUrl,
  insertExercise,
  insertSession,
  insertWorkout,
  insertWorkoutExercise,
  useDatabaseClient,
} from '../../test-support/index.js';
import { HomeRepository } from './home.repository.js';

describe('Чтение данных главной', () => {
  const client = useDatabaseClient();
  const deviceId = randomUUID();
  const otherDeviceId = randomUUID();
  const state: { prisma?: PrismaService } = {};

  beforeAll(async () => {
    const config = { getOrThrow: getDatabaseUrl } as unknown as ConfigService;
    state.prisma = new PrismaService(config);
    await state.prisma.onModuleInit();
  });

  afterAll(async () => state.prisma?.onModuleDestroy());

  function repository(): HomeRepository {
    if (!state.prisma) throw new Error('Prisma не инициализирована');
    return new HomeRepository(state.prisma);
  }

  async function complete({
    owner,
    workoutId,
    finishedAt,
  }: {
    owner: string;
    workoutId: string;
    finishedAt: string;
  }): Promise<string> {
    const sessionId = await insertSession({ client: client(), workoutId, deviceId: owner });
    await finishSession({ client: client(), sessionId, finishedAt });
    return sessionId;
  }

  async function seedCatalog(): Promise<void> {
    await client().query(
      "INSERT INTO workout (id, name) VALUES (9, 'Поздняя'), (2, 'Ноги'), (5, 'Грудь')",
    );
  }

  it('[I1] исключает активную сессию другого устройства', async () => {
    const first = await insertWorkout(client(), { name: 'Ноги' });
    await insertSession({ client: client(), deviceId: otherDeviceId });
    expect(await repository().findActiveWorkoutName(deviceId)).toBeNull();
    expect(await repository().findFirstWorkout()).toMatchObject({
      id: Number(first),
      name: 'Ноги',
    });
  });

  it('[I2] учитывает время завершения и владельца', async () => {
    const mostRecent = await insertWorkout(client());
    const older = await insertWorkout(client());
    const latestCompletion = await complete({
      owner: deviceId,
      workoutId: mostRecent,
      finishedAt: '2026-11-12T10:00:00Z',
    });
    const earlierCompletion = await complete({
      owner: deviceId,
      workoutId: older,
      finishedAt: '2026-11-11T10:00:00Z',
    });
    await client().query('UPDATE workout_session SET started_at = $2::timestamptz WHERE id = $1', [
      latestCompletion,
      '2026-11-10T08:00:00Z',
    ]);
    await client().query('UPDATE workout_session SET started_at = $2::timestamptz WHERE id = $1', [
      earlierCompletion,
      '2026-11-10T09:00:00Z',
    ]);
    await complete({ owner: otherDeviceId, workoutId: older, finishedAt: '2026-11-13T10:00:00Z' });
    await insertSession({ client: client(), workoutId: older, deviceId });
    expect(await repository().findLastFinishedWorkoutId(deviceId)).toBe(Number(mostRecent));
  });

  it('[I3] при равных датах учитывает ID сессии', async () => {
    const first = await insertWorkout(client());
    const second = await insertWorkout(client());
    const finishedAt = '2026-11-12T10:00:00Z';
    await complete({ owner: deviceId, workoutId: first, finishedAt });
    await complete({ owner: deviceId, workoutId: second, finishedAt });
    expect(await repository().findLastFinishedWorkoutId(deviceId)).toBe(Number(second));
  });

  it('[I4] находит ближайшую следующую позицию и количество упражнений', async () => {
    await seedCatalog();
    for (const name of ['Жим', 'Тяга', 'Махи']) {
      const exerciseId = await insertExercise(client(), name);
      await insertWorkoutExercise({ client: client(), workoutId: '5', exerciseId });
    }
    expect(await repository().findNextWorkout(2)).toEqual({
      id: 5,
      name: 'Грудь',
      exerciseCount: 3,
    });
  });

  it('[I5] начинает каталог с наименьшего ID', async () => {
    await seedCatalog();
    expect(await repository().findFirstWorkout()).toEqual({
      id: 2,
      name: 'Ноги',
      exerciseCount: 0,
    });
  });

  it('[I6] в пустом каталоге нет первой позиции', async () => {
    expect(await repository().findFirstWorkout()).toBeNull();
  });
});
