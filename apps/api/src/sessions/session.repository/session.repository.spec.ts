import { randomUUID } from 'node:crypto';
import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { PrismaService } from '../../prisma/index.js';
import {
  finishSession,
  insertSession,
  insertSetResult,
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

const HISTORY_LIMIT = 10;
const OVER_LIMIT_SESSIONS = HISTORY_LIMIT + 1;
const FIRST_FINISHED_AT = '2026-10-01T10:00:00Z';
const SECOND_FINISHED_AT = '2026-10-02T10:00:00Z';
const THIRD_FINISHED_AT = '2026-10-03T10:00:00Z';
const DAY_MS = 24 * 60 * 60 * 1000;
const BASE_FINISHED_MS = Date.parse('2026-09-01T10:00:00Z');

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
  describe('История подходов', () => {
    async function finishedSession({
      workoutId,
      exerciseId,
      finishedAt,
      deviceId = DEVICE_ID,
      setNumbers = [1],
    }: {
      workoutId: number;
      exerciseId: number;
      finishedAt: string;
      deviceId?: string;
      setNumbers?: number[];
    }): Promise<string> {
      const sessionId = await insertSession({
        client: getClient(),
        deviceId,
        workoutId: String(workoutId),
      });
      for (const setNumber of setNumbers) {
        await insertSetResult({
          client: getClient(),
          sessionId,
          exerciseId: String(exerciseId),
          setNumber,
        });
      }
      await finishSession({ client: getClient(), sessionId, finishedAt });
      return sessionId;
    }

    async function currentSession(workoutId: number, deviceId = DEVICE_ID): Promise<number> {
      return Number(
        await insertSession({ client: getClient(), deviceId, workoutId: String(workoutId) }),
      );
    }

    function entriesOf(
      history: Awaited<ReturnType<SessionRepository['getHistory']>>,
      exerciseId: number,
    ) {
      return history.exercises.find((item) => item.exerciseId === exerciseId)?.entries ?? [];
    }

    it('не включает незавершённую сессию устройства', async () => {
      const { workoutId, exerciseId } = await catalog();
      const first = await finishedSession({ workoutId, exerciseId, finishedAt: FIRST_FINISHED_AT });
      const requested = await finishedSession({
        workoutId,
        exerciseId,
        finishedAt: SECOND_FINISHED_AT,
      });
      const active = await currentSession(workoutId);
      await insertSetResult({
        client: getClient(),
        sessionId: String(active),
        exerciseId: String(exerciseId),
      });

      const history = await repository().getHistory(DEVICE_ID, Number(requested));

      expect(entriesOf(history, exerciseId).map((entry) => entry.sessionId)).toEqual([
        Number(first),
      ]);
    });

    it('не включает саму запрошенную сессию', async () => {
      const { workoutId, exerciseId } = await catalog();
      const first = await finishedSession({ workoutId, exerciseId, finishedAt: FIRST_FINISHED_AT });
      const requested = await finishedSession({
        workoutId,
        exerciseId,
        finishedAt: SECOND_FINISHED_AT,
      });

      const history = await repository().getHistory(DEVICE_ID, Number(requested));

      expect(entriesOf(history, exerciseId).map((entry) => entry.sessionId)).toEqual([
        Number(first),
      ]);
    });

    it('не показывает сессии другого устройства', async () => {
      const { workoutId, exerciseId } = await catalog();
      await finishedSession({
        workoutId,
        exerciseId,
        finishedAt: FIRST_FINISHED_AT,
        deviceId: OTHER_DEVICE_ID,
      });
      const current = await currentSession(workoutId);

      const history = await repository().getHistory(DEVICE_ID, current);

      expect(entriesOf(history, exerciseId)).toEqual([]);
    });

    it('отдаёт записи от новых к старым', async () => {
      const { workoutId, exerciseId } = await catalog();
      const oldest = await finishedSession({
        workoutId,
        exerciseId,
        finishedAt: FIRST_FINISHED_AT,
      });
      const newest = await finishedSession({
        workoutId,
        exerciseId,
        finishedAt: THIRD_FINISHED_AT,
      });
      const middle = await finishedSession({
        workoutId,
        exerciseId,
        finishedAt: SECOND_FINISHED_AT,
      });
      const current = await currentSession(workoutId);

      const history = await repository().getHistory(DEVICE_ID, current);

      expect(entriesOf(history, exerciseId).map((entry) => entry.sessionId)).toEqual([
        Number(newest),
        Number(middle),
        Number(oldest),
      ]);
    });

    it('ограничивает историю упражнения десятью записями', async () => {
      const { workoutId, exerciseId } = await catalog();
      const ids: string[] = [];
      for (let index = 0; index < OVER_LIMIT_SESSIONS; index += 1) {
        const finishedAt = new Date(BASE_FINISHED_MS + index * DAY_MS).toISOString();
        ids.push(await finishedSession({ workoutId, exerciseId, finishedAt }));
      }
      const current = await currentSession(workoutId);

      const entries = entriesOf(await repository().getHistory(DEVICE_ID, current), exerciseId);

      expect(entries).toHaveLength(HISTORY_LIMIT);
      expect(entries.map((entry) => entry.sessionId)).not.toContain(Number(ids[0]));
    });

    it('группирует подходы по упражнениям тренировки', async () => {
      const { workoutId, exerciseId } = await catalog();
      const secondExerciseId = Number(await insertExercise(getClient()));
      await insertWorkoutExercise({
        client: getClient(),
        workoutId: String(workoutId),
        exerciseId: String(secondExerciseId),
        position: 2,
      });
      const sessionId = await finishedSession({
        workoutId,
        exerciseId,
        finishedAt: FIRST_FINISHED_AT,
      });
      await insertSetResult({
        client: getClient(),
        sessionId,
        exerciseId: String(secondExerciseId),
      });
      const current = await currentSession(workoutId);

      const history = await repository().getHistory(DEVICE_ID, current);

      expect(history.exercises.map((item) => item.exerciseId)).toEqual([
        exerciseId,
        secondExerciseId,
      ]);
      expect(entriesOf(history, exerciseId)[0]?.sets.map((set) => set.exerciseId)).toEqual([
        exerciseId,
      ]);
      expect(entriesOf(history, secondExerciseId)[0]?.sets.map((set) => set.exerciseId)).toEqual([
        secondExerciseId,
      ]);
    });

    it('отдаёт пустой список для упражнения без истории', async () => {
      const { workoutId, exerciseId } = await catalog();
      const secondExerciseId = Number(await insertExercise(getClient()));
      await insertWorkoutExercise({
        client: getClient(),
        workoutId: String(workoutId),
        exerciseId: String(secondExerciseId),
        position: 2,
      });
      await finishedSession({ workoutId, exerciseId, finishedAt: FIRST_FINISHED_AT });
      const current = await currentSession(workoutId);

      const history = await repository().getHistory(DEVICE_ID, current);

      expect(entriesOf(history, secondExerciseId)).toEqual([]);
    });

    it('не возвращает подходы упражнений вне тренировки', async () => {
      const { workoutId, exerciseId } = await catalog();
      const foreignExerciseId = Number(await insertExercise(getClient()));
      const sessionId = await finishedSession({
        workoutId,
        exerciseId,
        finishedAt: FIRST_FINISHED_AT,
      });
      await insertSetResult({
        client: getClient(),
        sessionId,
        exerciseId: String(foreignExerciseId),
      });
      const current = await currentSession(workoutId);

      const history = await repository().getHistory(DEVICE_ID, current);

      expect(history.exercises.map((item) => item.exerciseId)).toEqual([exerciseId]);
      expect(entriesOf(history, exerciseId)[0]?.sets).toHaveLength(1);
    });

    it('включает сессии другой тренировки с тем же упражнением', async () => {
      const { workoutId, exerciseId } = await catalog();
      const otherWorkoutId = Number(await insertWorkout(getClient()));
      await insertWorkoutExercise({
        client: getClient(),
        workoutId: String(otherWorkoutId),
        exerciseId: String(exerciseId),
      });
      const fromOther = await finishedSession({
        workoutId: otherWorkoutId,
        exerciseId,
        finishedAt: FIRST_FINISHED_AT,
      });
      const current = await currentSession(workoutId);

      const history = await repository().getHistory(DEVICE_ID, current);

      expect(entriesOf(history, exerciseId).map((entry) => entry.sessionId)).toEqual([
        Number(fromOther),
      ]);
    });

    it('не отдаёт историю чужой сессии', async () => {
      const { workoutId } = await catalog();
      const foreign = await currentSession(workoutId, OTHER_DEVICE_ID);

      await expect(repository().getHistory(DEVICE_ID, foreign)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('не отдаёт историю несуществующей сессии', async () => {
      await expect(repository().getHistory(DEVICE_ID, UNKNOWN_ID)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });
});
