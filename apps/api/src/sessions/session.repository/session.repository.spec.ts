import { randomUUID } from 'node:crypto';
import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { PrismaService } from '../../prisma/index.js';
import {
  getDatabaseUrl,
  insertExercise,
  insertWorkout,
  insertWorkoutExercise,
  useDatabaseClient,
} from '../../test-support/index.js';
import { SessionRepository } from './session.repository.js';

const DEVICE_ID = randomUUID();
const OTHER_DEVICE_ID = randomUUID();
const UNKNOWN_ID = 999;
const TARGET_SETS = 3;
const SET_NUMBER = 1;
const RESULT = { weight: 60.25, reps: 8, rpe: 3, note: 'Легко' };

describe('Репозиторий сессий', () => {
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

  it('создаёт сессию с тренировкой и возвращает только активную сессию устройства', async () => {
    const { workoutId } = await catalog();
    await expect(repository().findActive(DEVICE_ID)).resolves.toBeNull();
    const session = await repository().start(DEVICE_ID, workoutId);
    expect(session).toMatchObject({ workout: { id: workoutId }, finishedAt: null, results: [] });
    expect(Number.isNaN(Date.parse(session.startedAt))).toBe(false);
    await expect(repository().findActive(DEVICE_ID)).resolves.toEqual(session);
    await expect(repository().getOwned(DEVICE_ID, session.id)).resolves.toEqual(session);
    await expect(repository().findActive(OTHER_DEVICE_ID)).resolves.toBeNull();
  });

  it('не начинает неизвестную тренировку', async () => {
    await expect(repository().start(DEVICE_ID, UNKNOWN_ID)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('не допускает второй старт, включая одновременные запросы', async () => {
    const { workoutId } = await catalog();
    const results = await Promise.allSettled([
      repository().start(DEVICE_ID, workoutId),
      repository().start(DEVICE_ID, workoutId),
    ]);
    expect(results.filter((result) => result.status === 'fulfilled')).toHaveLength(1);
    expect(results.find((result) => result.status === 'rejected')).toMatchObject({
      reason: expect.any(ConflictException),
    });
    await expect(repository().start(DEVICE_ID, workoutId)).rejects.toBeInstanceOf(
      ConflictException,
    );
  });

  it('создаёт и обновляет один подход, преобразует Decimal в number', async () => {
    const { workoutId, exerciseId } = await catalog();
    const session = await repository().start(DEVICE_ID, workoutId);
    const params = { sessionId: session.id, exerciseId, setNumber: SET_NUMBER };
    const created = await repository().saveSetResult(DEVICE_ID, params, RESULT);
    expect(created.results).toEqual([
      { exerciseId, setNumber: SET_NUMBER, ...RESULT, completedAt: expect.any(String) },
    ]);
    const updated = await repository().saveSetResult(DEVICE_ID, params, { weight: 0, reps: 1 });
    expect(updated.results).toEqual([
      {
        exerciseId,
        setNumber: SET_NUMBER,
        weight: 0,
        reps: 1,
        rpe: null,
        note: null,
        completedAt: expect.any(String),
      },
    ]);
  });

  it('не раскрывает чужую сессию для чтения, записи и завершения', async () => {
    const { workoutId, exerciseId } = await catalog();
    const session = await repository().start(DEVICE_ID, workoutId);
    await expect(repository().getOwned(OTHER_DEVICE_ID, session.id)).rejects.toBeInstanceOf(
      NotFoundException,
    );
    await expect(
      repository().saveSetResult(
        OTHER_DEVICE_ID,
        { sessionId: session.id, exerciseId, setNumber: SET_NUMBER },
        RESULT,
      ),
    ).rejects.toBeInstanceOf(NotFoundException);
    await expect(repository().finish(OTHER_DEVICE_ID, session.id)).rejects.toBeInstanceOf(
      NotFoundException,
    );
    await expect(repository().getOwned(DEVICE_ID, UNKNOWN_ID)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('отклоняет упражнение вне тренировки и подход сверх плана', async () => {
    const { workoutId, exerciseId } = await catalog();
    const extraExerciseId = Number(await insertExercise(getClient()));
    const session = await repository().start(DEVICE_ID, workoutId);
    await expect(
      repository().saveSetResult(
        DEVICE_ID,
        { sessionId: session.id, exerciseId: extraExerciseId, setNumber: SET_NUMBER },
        RESULT,
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
    await expect(
      repository().saveSetResult(
        DEVICE_ID,
        { sessionId: session.id, exerciseId, setNumber: TARGET_SETS + 1 },
        RESULT,
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('сериализует одновременные сохранение и завершение, не меняет результаты после завершения', async () => {
    const { workoutId, exerciseId } = await catalog();
    const session = await repository().start(DEVICE_ID, workoutId);
    const params = { sessionId: session.id, exerciseId, setNumber: SET_NUMBER };
    const [save, finish] = await Promise.allSettled([
      repository().saveSetResult(DEVICE_ID, params, RESULT),
      repository().finish(DEVICE_ID, session.id),
    ]);
    expect(finish.status).toBe('fulfilled');
    const finished = await repository().getOwned(DEVICE_ID, session.id);
    expect(finished.finishedAt).not.toBeNull();
    if (save.status === 'rejected') {
      expect(save.reason).toBeInstanceOf(ConflictException);
      expect(finished.results).toEqual([]);
    } else {
      expect(finished.results).toMatchObject([{ exerciseId, setNumber: SET_NUMBER, ...RESULT }]);
    }

    await expect(
      repository().saveSetResult(DEVICE_ID, params, { ...RESULT, weight: 0 }),
    ).rejects.toBeInstanceOf(ConflictException);
    expect((await repository().getOwned(DEVICE_ID, session.id)).results).toEqual(finished.results);
  });

  it('завершает сессию, запрещает повторное завершение и запись, разрешает новый старт', async () => {
    const { workoutId, exerciseId } = await catalog();
    const session = await repository().start(DEVICE_ID, workoutId);
    const finished = await repository().finish(DEVICE_ID, session.id);
    expect(Number.isNaN(Date.parse(finished.finishedAt ?? ''))).toBe(false);
    await expect(repository().findActive(DEVICE_ID)).resolves.toBeNull();
    await expect(repository().finish(DEVICE_ID, session.id)).rejects.toBeInstanceOf(
      ConflictException,
    );
    await expect(
      repository().saveSetResult(
        DEVICE_ID,
        { sessionId: session.id, exerciseId, setNumber: SET_NUMBER },
        RESULT,
      ),
    ).rejects.toBeInstanceOf(ConflictException);
    expect((await repository().start(DEVICE_ID, workoutId)).id).not.toBe(session.id);
  });
});
