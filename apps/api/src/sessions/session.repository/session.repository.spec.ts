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
const EXTRA_SET = { weight: 50, reps: 6 };
const EXTRA_SET_NUMBER = TARGET_SETS + 1;
const MAX_SET_NUMBER = 20;
const OVER_LIMIT_SET_NUMBER = MAX_SET_NUMBER + 1;

const FIRST_OCCURRENCE = 1;
const SECOND_OCCURRENCE = 2;
const HISTORY_LIMIT = 10;
const OVER_LIMIT_SESSIONS = HISTORY_LIMIT + 1;
const FIRST_FINISHED_AT = '2026-10-01T10:00:00Z';
const SECOND_FINISHED_AT = '2026-10-02T10:00:00Z';
const THIRD_FINISHED_AT = '2026-10-03T10:00:00Z';
const DAY_MS = 24 * 60 * 60 * 1000;
const BASE_FINISHED_MS = Date.parse('2026-09-01T10:00:00Z');
const PLAN_WORKOUT_NAME = 'Тренировка X';
const SESSION_LIST_LIMIT = 20;
const OVER_LIST_LIMIT = SESSION_LIST_LIMIT + 1;
const NUMERIC_WEIGHT = 60.25;
const NUMERIC_REPS = 8;
const FIRST_SET_NUMBER = 1;
const THREE_SETS = 3;
const LIST_WORKOUT_NAME = 'Тренировка X';
const OTHER_LIST_WORKOUT_NAME = 'Тренировка Y';
const SECOND_SET_NUMBER = 2;
const THIRD_SET_NUMBER = 3;
const BENCH_NAME = 'Жим';
const ROW_NAME = 'Тяга';
const SQUAT_NAME = 'Присед';
const FRACTIONAL_WEIGHT = 62.5;
const FIRST_WEIGHT = 60;
const SECOND_WEIGHT = 65;
const OTHER_SESSION_WEIGHT = 100;

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
    const workoutExerciseId = await insertWorkoutExercise({
      client: getClient(),
      workoutId,
      exerciseId,
      targetSets: TARGET_SETS,
    });
    return {
      workoutId: Number(workoutId),
      exerciseId: Number(exerciseId),
      workoutExerciseId: Number(workoutExerciseId),
    };
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
    const { workoutId, workoutExerciseId } = await catalog();
    const session = await repository().start(DEVICE_ID, workoutId);
    const params = { sessionId: session.id, workoutExerciseId, setNumber: SET_NUMBER };
    const created = await repository().saveSetResult({
      deviceId: DEVICE_ID,
      params,
      payload: RESULT,
    });
    expect(created.results).toEqual([
      { workoutExerciseId, setNumber: SET_NUMBER, ...RESULT, completedAt: expect.any(String) },
    ]);
    const updated = await repository().saveSetResult({
      deviceId: DEVICE_ID,
      params,
      payload: { weight: 0, reps: 1 },
    });
    expect(updated.results).toEqual([
      {
        workoutExerciseId,
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
    const { workoutId, workoutExerciseId } = await catalog();
    const session = await repository().start(DEVICE_ID, workoutId);
    await expect(repository().getOwned(OTHER_DEVICE_ID, session.id)).rejects.toBeInstanceOf(
      NotFoundException,
    );
    await expect(
      repository().saveSetResult({
        deviceId: OTHER_DEVICE_ID,
        params: { sessionId: session.id, workoutExerciseId, setNumber: SET_NUMBER },
        payload: RESULT,
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
    await expect(repository().finish(OTHER_DEVICE_ID, session.id)).rejects.toBeInstanceOf(
      NotFoundException,
    );
    await expect(repository().getOwned(DEVICE_ID, UNKNOWN_ID)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('сохраняет подход с номером больше плана', async () => {
    const { workoutId, workoutExerciseId } = await catalog();
    const session = await repository().start(DEVICE_ID, workoutId);

    const saved = await repository().saveSetResult({
      deviceId: DEVICE_ID,
      params: { sessionId: session.id, workoutExerciseId, setNumber: EXTRA_SET_NUMBER },
      payload: EXTRA_SET,
    });

    expect(saved.results).toEqual([
      {
        workoutExerciseId,
        setNumber: EXTRA_SET_NUMBER,
        ...EXTRA_SET,
        rpe: null,
        note: null,
        completedAt: expect.any(String),
      },
    ]);
  });

  it('принимает подход с номером, равным пределу', async () => {
    const { workoutId, workoutExerciseId } = await catalog();
    const session = await repository().start(DEVICE_ID, workoutId);

    const saved = await repository().saveSetResult({
      deviceId: DEVICE_ID,
      params: { sessionId: session.id, workoutExerciseId, setNumber: MAX_SET_NUMBER },
      payload: EXTRA_SET,
    });

    expect(saved.results).toMatchObject([{ setNumber: MAX_SET_NUMBER }]);
  });

  it('отклоняет номер подхода выше предела', async () => {
    const { workoutId, workoutExerciseId } = await catalog();
    const session = await repository().start(DEVICE_ID, workoutId);

    await expect(
      repository().saveSetResult({
        deviceId: DEVICE_ID,
        params: { sessionId: session.id, workoutExerciseId, setNumber: OVER_LIMIT_SET_NUMBER },
        payload: EXTRA_SET,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    const unchanged = await repository().getOwned(DEVICE_ID, session.id);
    expect(unchanged.results).toEqual([]);
  });

  it('отклоняет упражнение вне тренировки', async () => {
    const { workoutId } = await catalog();
    const extraExerciseId = UNKNOWN_ID;
    const session = await repository().start(DEVICE_ID, workoutId);

    await expect(
      repository().saveSetResult({
        deviceId: DEVICE_ID,
        params: {
          sessionId: session.id,
          workoutExerciseId: extraExerciseId,
          setNumber: SET_NUMBER,
        },
        payload: RESULT,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    const unchanged = await repository().getOwned(DEVICE_ID, session.id);
    expect(unchanged.results).toEqual([]);
  });

  it('сериализует одновременные сохранение и завершение, не меняет результаты после завершения', async () => {
    const { workoutId, workoutExerciseId } = await catalog();
    const session = await repository().start(DEVICE_ID, workoutId);
    const params = { sessionId: session.id, workoutExerciseId, setNumber: SET_NUMBER };
    const [save, finish] = await Promise.allSettled([
      repository().saveSetResult({ deviceId: DEVICE_ID, params, payload: RESULT }),
      repository().finish(DEVICE_ID, session.id),
    ]);
    expect(finish.status).toBe('fulfilled');
    const finished = await repository().getOwned(DEVICE_ID, session.id);
    expect(finished.finishedAt).not.toBeNull();
    if (save.status === 'rejected') {
      expect(save.reason).toBeInstanceOf(ConflictException);
      expect(finished.results).toEqual([]);
    } else {
      expect(finished.results).toMatchObject([
        { workoutExerciseId, setNumber: SET_NUMBER, ...RESULT },
      ]);
    }

    await expect(
      repository().saveSetResult({
        deviceId: DEVICE_ID,
        params,
        payload: { ...RESULT, weight: 0 },
      }),
    ).rejects.toBeInstanceOf(ConflictException);
    expect((await repository().getOwned(DEVICE_ID, session.id)).results).toEqual(finished.results);
  });

  it('завершает сессию, запрещает повторное завершение и запись, разрешает новый старт', async () => {
    const { workoutId, workoutExerciseId } = await catalog();
    const session = await repository().start(DEVICE_ID, workoutId);
    const finished = await repository().finish(DEVICE_ID, session.id);
    expect(Number.isNaN(Date.parse(finished.finishedAt ?? ''))).toBe(false);
    await expect(repository().findActive(DEVICE_ID)).resolves.toBeNull();
    await expect(repository().finish(DEVICE_ID, session.id)).rejects.toBeInstanceOf(
      ConflictException,
    );
    await expect(
      repository().saveSetResult({
        deviceId: DEVICE_ID,
        params: { sessionId: session.id, workoutExerciseId, setNumber: SET_NUMBER },
        payload: RESULT,
      }),
    ).rejects.toBeInstanceOf(ConflictException);
    expect((await repository().start(DEVICE_ID, workoutId)).id).not.toBe(session.id);
  });
  it('[I13] отдаёт сессию с названием и упражнениями плана по строкам плана', async () => {
    const workoutId = await insertWorkout(getClient(), { name: PLAN_WORKOUT_NAME });
    const secondExerciseId = await insertExercise(getClient());
    const firstExerciseId = await insertExercise(getClient());
    for (const exerciseId of [firstExerciseId, secondExerciseId]) {
      await insertWorkoutExercise({
        client: getClient(),
        workoutId,
        exerciseId,
        targetSets: TARGET_SETS,
      });
    }
    const sessionId = await insertSession({ client: getClient(), deviceId: DEVICE_ID, workoutId });
    await finishSession({ client: getClient(), sessionId });

    const session = await repository().getOwned(DEVICE_ID, Number(sessionId));

    expect(session.workout.name).toBe(PLAN_WORKOUT_NAME);
    expect(session.workout.exercises).toMatchObject([
      { occurrence: 1, sets: TARGET_SETS, exercise: { id: Number(firstExerciseId) } },
      { occurrence: 1, sets: TARGET_SETS, exercise: { id: Number(secondExerciseId) } },
    ]);
  });

  describe('Список завершённых сессий', () => {
    interface ListedSet {
      workoutExerciseId: string;
      setNumber: number;
      weight?: number;
      reps?: number;
    }

    async function createFinished({
      workoutId,
      finishedAt,
      deviceId = DEVICE_ID,
      sets = [],
    }: {
      workoutId: number;
      finishedAt: string;
      deviceId?: string;
      sets?: ListedSet[];
    }): Promise<number> {
      const sessionId = await insertSession({
        client: getClient(),
        deviceId,
        workoutId: String(workoutId),
      });
      for (const item of sets) {
        await insertSetResult({ client: getClient(), sessionId, ...item });
      }
      await finishSession({ client: getClient(), sessionId, finishedAt });

      return Number(sessionId);
    }

    it('[I5] возвращает только завершённые сессии', async () => {
      const { workoutId } = await catalog();
      const finishedId = await createFinished({ workoutId, finishedAt: FIRST_FINISHED_AT });
      await insertSession({
        client: getClient(),
        deviceId: DEVICE_ID,
        workoutId: String(workoutId),
      });

      const sessions = await repository().findFinished(DEVICE_ID);

      expect(sessions.map((session) => session.id)).toEqual([finishedId]);
      expect(sessions[0]?.finishedAt).not.toBeNull();
    });

    it('[I6] не возвращает сессии другого устройства', async () => {
      const { workoutId } = await catalog();
      const ownId = await createFinished({ workoutId, finishedAt: FIRST_FINISHED_AT });
      await createFinished({
        workoutId,
        finishedAt: SECOND_FINISHED_AT,
        deviceId: OTHER_DEVICE_ID,
      });

      const sessions = await repository().findFinished(DEVICE_ID);

      expect(sessions.map((session) => session.id)).toEqual([ownId]);
    });

    it('[I7] сортирует от новых к старым по finished_at', async () => {
      const { workoutId } = await catalog();
      const first = await createFinished({ workoutId, finishedAt: FIRST_FINISHED_AT });
      const third = await createFinished({ workoutId, finishedAt: THIRD_FINISHED_AT });
      const second = await createFinished({ workoutId, finishedAt: SECOND_FINISHED_AT });

      const sessions = await repository().findFinished(DEVICE_ID);

      expect(sessions.map((session) => session.id)).toEqual([third, second, first]);
    });

    it('[I8] ограничивает список последними 20 сессиями', async () => {
      const { workoutId } = await catalog();
      const ids: number[] = [];
      for (let day = 0; day < OVER_LIST_LIMIT; day += 1) {
        const finishedAt = new Date(BASE_FINISHED_MS + day * DAY_MS).toISOString();
        ids.push(await createFinished({ workoutId, finishedAt }));
      }

      const sessions = await repository().findFinished(DEVICE_ID);

      expect(sessions).toHaveLength(SESSION_LIST_LIMIT);
      expect(sessions[0]?.id).toBe(ids[SESSION_LIST_LIMIT]);
      expect(sessions.at(-1)?.id).toBe(ids[1]);
      expect(sessions.map((session) => session.id)).not.toContain(ids[0]);
    });

    it('[I9] подставляет название тренировки своей сессии', async () => {
      const ownWorkoutId = await insertWorkout(getClient(), { name: LIST_WORKOUT_NAME });
      await insertWorkout(getClient(), { name: OTHER_LIST_WORKOUT_NAME });
      await createFinished({ workoutId: Number(ownWorkoutId), finishedAt: FIRST_FINISHED_AT });

      const sessions = await repository().findFinished(DEVICE_ID);

      expect(sessions[0]?.workout).toMatchObject({
        id: Number(ownWorkoutId),
        name: LIST_WORKOUT_NAME,
      });
    });

    it('[I10] не смешивает подходы разных сессий', async () => {
      const { workoutId, workoutExerciseId } = await catalog();
      const key = String(workoutExerciseId);
      await createFinished({
        workoutId,
        finishedAt: FIRST_FINISHED_AT,
        sets: [{ workoutExerciseId: key, setNumber: 1 }],
      });
      await createFinished({
        workoutId,
        finishedAt: SECOND_FINISHED_AT,
        sets: Array.from({ length: THREE_SETS }, (_, index) => ({
          workoutExerciseId: key,
          setNumber: index + 1,
        })),
      });

      const sessions = await repository().findFinished(DEVICE_ID);

      expect(sessions.map((session) => session.results.length)).toEqual([THREE_SETS, 1]);
    });

    it('[I11] отдаёт вес и повторы подхода числами', async () => {
      const { workoutId, workoutExerciseId } = await catalog();
      await createFinished({
        workoutId,
        finishedAt: FIRST_FINISHED_AT,
        sets: [
          {
            workoutExerciseId: String(workoutExerciseId),
            setNumber: FIRST_SET_NUMBER,
            weight: NUMERIC_WEIGHT,
            reps: NUMERIC_REPS,
          },
        ],
      });

      const sessions = await repository().findFinished(DEVICE_ID);

      expect(sessions[0]?.results[0]).toMatchObject({
        setNumber: FIRST_SET_NUMBER,
        weight: NUMERIC_WEIGHT,
        reps: NUMERIC_REPS,
      });
    });

    it('[I12] оставляет завершённую сессию без подходов в списке', async () => {
      const { workoutId } = await catalog();
      const sessionId = await createFinished({ workoutId, finishedAt: FIRST_FINISHED_AT });

      const sessions = await repository().findFinished(DEVICE_ID);

      expect(sessions.map((session) => session.id)).toEqual([sessionId]);
      expect(sessions[0]?.results).toEqual([]);
    });
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
      const planRow = await getClient().query<{ id: string }>(
        'SELECT id FROM workout_exercise WHERE workout_id = $1 AND exercise_id = $2 ORDER BY id LIMIT 1',
        [workoutId, exerciseId],
      );
      for (const setNumber of setNumbers) {
        await insertSetResult({
          client: getClient(),
          sessionId,
          workoutExerciseId: planRow.rows[0]?.id,
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
      const { workoutId, exerciseId, workoutExerciseId } = await catalog();
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
        workoutExerciseId: String(workoutExerciseId),
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
      const { workoutId, exerciseId, workoutExerciseId } = await catalog();
      const secondExerciseId = Number(await insertExercise(getClient()));
      const secondRowId = await insertWorkoutExercise({
        client: getClient(),
        workoutId: String(workoutId),
        exerciseId: String(secondExerciseId),
      });
      const sessionId = await finishedSession({
        workoutId,
        exerciseId,
        finishedAt: FIRST_FINISHED_AT,
      });
      await insertSetResult({
        client: getClient(),
        sessionId,
        workoutExerciseId: secondRowId,
      });
      const current = await currentSession(workoutId);

      const history = await repository().getHistory(DEVICE_ID, current);

      expect(history.exercises.map((item) => item.exerciseId)).toEqual([
        exerciseId,
        secondExerciseId,
      ]);
      expect(entriesOf(history, exerciseId)[0]?.sets.map((set) => set.workoutExerciseId)).toEqual([
        workoutExerciseId,
      ]);
      expect(
        entriesOf(history, secondExerciseId)[0]?.sets.map((set) => set.workoutExerciseId),
      ).toEqual([Number(secondRowId)]);
    });

    it('отдаёт пустой список для упражнения без истории', async () => {
      const { workoutId, exerciseId } = await catalog();
      const secondExerciseId = Number(await insertExercise(getClient()));
      await insertWorkoutExercise({
        client: getClient(),
        workoutId: String(workoutId),
        exerciseId: String(secondExerciseId),
      });
      await finishedSession({ workoutId, exerciseId, finishedAt: FIRST_FINISHED_AT });
      const current = await currentSession(workoutId);

      const history = await repository().getHistory(DEVICE_ID, current);

      expect(entriesOf(history, secondExerciseId)).toEqual([]);
    });

    it('не возвращает подходы упражнений вне тренировки', async () => {
      const { workoutId, exerciseId } = await catalog();
      const foreignExerciseId = await insertExercise(getClient());
      const foreignWorkoutId = await insertWorkout(getClient());
      const foreignRowId = await insertWorkoutExercise({
        client: getClient(),
        workoutId: foreignWorkoutId,
        exerciseId: foreignExerciseId,
      });
      const sessionId = await finishedSession({
        workoutId,
        exerciseId,
        finishedAt: FIRST_FINISHED_AT,
      });
      await insertSetResult({
        client: getClient(),
        sessionId,
        workoutExerciseId: foreignRowId,
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

  describe('Завершённая сессия с упражнениями', () => {
    interface SetInput {
      workoutExerciseId: string;
      setNumber: number;
      weight?: number;
      reps?: number;
    }

    async function addPlanExercise({
      workoutId,
      name,
    }: {
      workoutId: string;
      name: string;
    }): Promise<string> {
      const exerciseId = await insertExercise(getClient(), name);
      return insertWorkoutExercise({ client: getClient(), workoutId, exerciseId });
    }

    async function createPlan() {
      const workoutId = await insertWorkout(getClient());

      return {
        workoutId,
        benchId: await addPlanExercise({ workoutId, name: BENCH_NAME }),
        rowId: await addPlanExercise({ workoutId, name: ROW_NAME }),
        squatId: await addPlanExercise({ workoutId, name: SQUAT_NAME }),
      };
    }

    async function createSession({
      workoutId,
      sets = [],
      deviceId = DEVICE_ID,
      finished = true,
    }: {
      workoutId: string;
      sets?: SetInput[];
      deviceId?: string;
      finished?: boolean;
    }): Promise<number> {
      const sessionId = await insertSession({ client: getClient(), deviceId, workoutId });
      for (const set of sets) {
        await insertSetResult({ client: getClient(), sessionId, ...set });
      }
      if (finished) await finishSession({ client: getClient(), sessionId });

      return Number(sessionId);
    }

    async function readExercises(sessionId: number) {
      const { exercises } = await repository().getFinishedWithExercises(DEVICE_ID, sessionId);

      return exercises;
    }

    it('[H2-I1] отдаёт упражнения в порядке плана с именем и подходами', async () => {
      const { workoutId, benchId, squatId } = await createPlan();
      const sessionId = await createSession({
        workoutId,
        sets: [
          { workoutExerciseId: squatId, setNumber: FIRST_SET_NUMBER },
          { workoutExerciseId: benchId, setNumber: FIRST_SET_NUMBER },
          { workoutExerciseId: benchId, setNumber: SECOND_SET_NUMBER },
        ],
      });

      const exercises = await readExercises(sessionId);

      expect(
        exercises.map((item) => ({
          workoutExerciseId: item.workoutExerciseId,
          name: item.name,
          setNumbers: item.sets.map((set) => set.setNumber),
        })),
      ).toEqual([
        {
          workoutExerciseId: Number(benchId),
          name: BENCH_NAME,
          setNumbers: [FIRST_SET_NUMBER, SECOND_SET_NUMBER],
        },
        { workoutExerciseId: Number(squatId), name: SQUAT_NAME, setNumbers: [FIRST_SET_NUMBER] },
      ]);
    });

    it('[H2-I2] упорядочивает подходы упражнения по номеру подхода', async () => {
      const { workoutId, benchId } = await createPlan();
      const sessionId = await createSession({
        workoutId,
        sets: [
          { workoutExerciseId: benchId, setNumber: THIRD_SET_NUMBER },
          { workoutExerciseId: benchId, setNumber: FIRST_SET_NUMBER },
          { workoutExerciseId: benchId, setNumber: SECOND_SET_NUMBER },
        ],
      });

      const [bench] = await readExercises(sessionId);

      expect(bench?.sets.map((set) => set.setNumber)).toEqual([
        FIRST_SET_NUMBER,
        SECOND_SET_NUMBER,
        THIRD_SET_NUMBER,
      ]);
    });

    it('[H2-I3] не включает упражнение плана без подходов', async () => {
      const { workoutId, benchId, squatId } = await createPlan();
      const sessionId = await createSession({
        workoutId,
        sets: [
          { workoutExerciseId: benchId, setNumber: FIRST_SET_NUMBER },
          { workoutExerciseId: squatId, setNumber: FIRST_SET_NUMBER },
        ],
      });

      const exercises = await readExercises(sessionId);

      expect(exercises.map((item) => item.name)).toEqual([BENCH_NAME, SQUAT_NAME]);
    });

    it('[H2-I4] не смешивает подходы разных сессий', async () => {
      const { workoutId, benchId } = await createPlan();
      const firstId = await createSession({
        workoutId,
        sets: [
          { workoutExerciseId: benchId, setNumber: FIRST_SET_NUMBER, weight: FIRST_WEIGHT },
          { workoutExerciseId: benchId, setNumber: SECOND_SET_NUMBER, weight: SECOND_WEIGHT },
        ],
      });
      await createSession({
        workoutId,
        sets: [
          { workoutExerciseId: benchId, setNumber: FIRST_SET_NUMBER, weight: OTHER_SESSION_WEIGHT },
          {
            workoutExerciseId: benchId,
            setNumber: SECOND_SET_NUMBER,
            weight: OTHER_SESSION_WEIGHT,
          },
          { workoutExerciseId: benchId, setNumber: THIRD_SET_NUMBER, weight: OTHER_SESSION_WEIGHT },
        ],
      });

      const [bench] = await readExercises(firstId);

      expect(bench?.sets.map((set) => set.weight)).toEqual([FIRST_WEIGHT, SECOND_WEIGHT]);
    });

    it('[H2-I5] отдаёт вес и повторы подхода числами', async () => {
      const { workoutId, benchId } = await createPlan();
      const sessionId = await createSession({
        workoutId,
        sets: [
          {
            workoutExerciseId: benchId,
            setNumber: FIRST_SET_NUMBER,
            weight: FRACTIONAL_WEIGHT,
            reps: NUMERIC_REPS,
          },
        ],
      });

      const [bench] = await readExercises(sessionId);

      expect(bench?.sets[0]).toMatchObject({ weight: FRACTIONAL_WEIGHT, reps: NUMERIC_REPS });
    });

    it('[H2-I6] отдаёт пустой список упражнений для завершённой сессии без подходов', async () => {
      const { workoutId } = await createPlan();
      const sessionId = await createSession({ workoutId });

      expect(await readExercises(sessionId)).toEqual([]);
    });

    it('[H2-I7] не читает чужую сессию', async () => {
      const { workoutId } = await createPlan();
      const foreignId = await createSession({ workoutId, deviceId: OTHER_DEVICE_ID });

      await expect(
        repository().getFinishedWithExercises(DEVICE_ID, foreignId),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('[H2-I8] не читает несуществующую сессию', async () => {
      await expect(
        repository().getFinishedWithExercises(DEVICE_ID, UNKNOWN_ID),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('[H2-I9] не читает незавершённую сессию как завершённую', async () => {
      const { workoutId } = await createPlan();
      const activeId = await createSession({ workoutId, finished: false });

      await expect(
        repository().getFinishedWithExercises(DEVICE_ID, activeId),
      ).rejects.toBeInstanceOf(ConflictException);
    });
  });
  async function lateralWorkout() {
    const workoutId = await insertWorkout(getClient());
    const exerciseId = await insertExercise(getClient(), 'Махи');
    const rows = [
      await insertWorkoutExercise({
        client: getClient(),
        workoutId,
        exerciseId,
        occurrence: FIRST_OCCURRENCE,
      }),
      await insertWorkoutExercise({
        client: getClient(),
        workoutId,
        exerciseId,
        occurrence: SECOND_OCCURRENCE,
      }),
    ].map(Number);

    return { workoutId: Number(workoutId), exerciseId: Number(exerciseId), rows };
  }

  it('[I8] отклоняет строку плана чужой тренировки', async () => {
    const { workoutId } = await catalog();
    const other = await catalog();
    const session = await repository().start(DEVICE_ID, workoutId);

    await expect(
      repository().saveSetResult({
        deviceId: DEVICE_ID,
        params: {
          sessionId: session.id,
          workoutExerciseId: other.workoutExerciseId,
          setNumber: SET_NUMBER,
        },
        payload: RESULT,
      }),
    ).rejects.toThrow('Упражнение не входит в план тренировки');
  });

  it('[I11] отклоняет несуществующую строку плана', async () => {
    const { workoutId } = await catalog();
    const session = await repository().start(DEVICE_ID, workoutId);

    await expect(
      repository().saveSetResult({
        deviceId: DEVICE_ID,
        params: { sessionId: session.id, workoutExerciseId: UNKNOWN_ID, setNumber: SET_NUMBER },
        payload: RESULT,
      }),
    ).rejects.toThrow('Упражнение не входит в план тренировки');
  });

  it('[I9] повторное сохранение того же подхода обновляет запись', async () => {
    const FIRST_ROW_WEIGHT = 10;
    const SECOND_ROW_WEIGHT = 12;
    const UPDATED_WEIGHT = 15;
    const { workoutId, rows } = await lateralWorkout();
    const [firstRow, secondRow] = rows as [number, number];
    const session = await repository().start(DEVICE_ID, workoutId);
    const save = (workoutExerciseId: number, weight: number) =>
      repository().saveSetResult({
        deviceId: DEVICE_ID,
        params: { sessionId: session.id, workoutExerciseId, setNumber: SET_NUMBER },
        payload: { weight, reps: NUMERIC_REPS },
      });
    await save(firstRow, FIRST_ROW_WEIGHT);
    await save(secondRow, SECOND_ROW_WEIGHT);

    const updated = await save(firstRow, UPDATED_WEIGHT);

    expect(updated.results.map((set) => [set.workoutExerciseId, set.weight])).toEqual([
      [firstRow, UPDATED_WEIGHT],
      [secondRow, SECOND_ROW_WEIGHT],
    ]);
  });

  it('[I7] история упражнения при повторе в плане не дублируется', async () => {
    const { workoutId, exerciseId, rows } = await lateralWorkout();
    const [firstRow, secondRow] = rows as [number, number];
    const pastId = await insertSession({
      client: getClient(),
      deviceId: DEVICE_ID,
      workoutId: String(workoutId),
    });
    for (const [rowId, setNumber, weight] of [
      [secondRow, 1, 12],
      [firstRow, 2, 11],
      [firstRow, 1, 10],
    ] as const) {
      await insertSetResult({
        client: getClient(),
        sessionId: pastId,
        workoutExerciseId: String(rowId),
        setNumber,
        weight,
      });
    }
    await finishSession({ client: getClient(), sessionId: pastId });
    const current = await repository().start(DEVICE_ID, workoutId);

    const history = await repository().getHistory(DEVICE_ID, current.id);

    expect(history.exercises).toHaveLength(1);
    expect(history.exercises[0]?.exerciseId).toBe(exerciseId);
    expect(history.exercises[0]?.entries).toHaveLength(1);
    expect(history.exercises[0]?.entries[0]?.sets.map((set) => set.weight)).toEqual([10, 11, 12]);
  });
});
