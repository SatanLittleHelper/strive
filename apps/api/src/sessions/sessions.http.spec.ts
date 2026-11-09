import 'reflect-metadata';
import { randomUUID } from 'node:crypto';
import type { INestApplication } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import {
  DEVICE_ID_HEADER,
  type ApiResponse,
  type SessionHistoryResponse,
  type SessionListResponse,
  type SessionSummary,
  type WorkoutSession,
} from '@strive/api-interfaces';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { configureApp } from '../app/app.setup.js';
import {
  finishSession,
  insertSetResult,
  getDatabaseUrl,
  insertExercise,
  insertSession,
  insertWorkout,
  insertWorkoutExercise,
  useDatabaseClient,
} from '../test-support/index.js';
import { SessionsController } from './sessions.controller.js';

const LATERAL_NAME = 'Махи';
const FIRST_ROW_WEIGHT = 10;
const FIRST_ROW_SECOND_SET_WEIGHT = 11;
const SECOND_ROW_WEIGHT = 12;
const LATERAL_REPS = 10;
const SUPERSET_GROUP = 1;
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
const MAX_SET_NUMBER = 20;
const PLANNED_SET = { weight: 60, reps: 8 };
const EXTRA_SET = { weight: 50, reps: 6 };
const EXTRA_SET_NUMBER = TARGET_SETS + 1;
const OVER_LIMIT_SET_NUMBER = MAX_SET_NUMBER + 1;
const EXTRA_SETS_TOTAL_VOLUME =
  TARGET_SETS * PLANNED_SET.weight * PLANNED_SET.reps + EXTRA_SET.weight * EXTRA_SET.reps;
const HISTORY_WORKOUT_NAME = 'Тренировка X';
const OTHER_HISTORY_WORKOUT_NAME = 'Тренировка Y';
const HISTORY_FIRST_SET = { weight: 60, reps: 8 };
const HISTORY_SECOND_SET = { weight: 50, reps: 10 };
const HISTORY_SET_COUNT = 2;
const HISTORY_EXERCISE_COUNT = 1;
const HISTORY_TOTAL_VOLUME =
  HISTORY_FIRST_SET.weight * HISTORY_FIRST_SET.reps +
  HISTORY_SECOND_SET.weight * HISTORY_SECOND_SET.reps;

const SUMMARY_FIRST_EXERCISE_NAME = 'Жим';
const SUMMARY_SECOND_EXERCISE_NAME = 'Присед';
const SUMMARY_FIRST_SETS = [
  { weight: 60, reps: 8, rpe: 3, note: 'Легко' },
  { weight: 60, reps: 6 },
];
const SUMMARY_SECOND_SETS = [{ weight: 100, reps: 5 }];
const SUMMARY_PLAN = [
  { name: SUMMARY_FIRST_EXERCISE_NAME, sets: SUMMARY_FIRST_SETS },
  { name: SUMMARY_SECOND_EXERCISE_NAME, sets: SUMMARY_SECOND_SETS },
];
const SUMMARY_EXERCISE_COUNT = 2;
const SUMMARY_SET_COUNT = 3;
const SUMMARY_TOTAL_VOLUME = 60 * 8 + 60 * 6 + 100 * 5;

describe('HTTP сессий тренировок', () => {
  const getClient = useDatabaseClient();
  const state: { app?: INestApplication; url?: string } = {};

  beforeAll(async () => {
    for (const method of [
      'active',
      'list',
      'start',
      'get',
      'summary',
      'history',
      'saveSet',
      'finish',
    ]) {
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

  it.each([
    { path: '' },
    { path: '/active' },
    { method: 'POST' },
    { path: '/1' },
    { path: '/1/summary' },
    { path: '/1/sets/1/1', method: 'PUT' },
    { path: '/1/finish', method: 'POST' },
  ])('требует заголовок устройства: %j', async (options) => {
    expect(await request({ ...options, deviceId: null })).toMatchObject({ status: BAD_REQUEST });
  });

  it('выполняет старт → active → запись и правка подхода → finish → active null', async () => {
    const { workoutId, workoutExerciseId } = await catalog();
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
      await request({
        method: 'PUT',
        path: `/${sessionId}/sets/${workoutExerciseId}/1`,
        body: RESULT,
      }),
    ).toMatchObject({
      status: OK,
      body: { data: { results: [{ workoutExerciseId, setNumber: 1, ...RESULT }] } },
    });
    expect(
      await request({
        method: 'PUT',
        path: `/${sessionId}/sets/${workoutExerciseId}/1`,
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
      await request({
        method: 'PUT',
        path: `/${sessionId}/sets/${workoutExerciseId}/1`,
        body: RESULT,
      }),
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
    const { workoutId, workoutExerciseId } = await catalog();
    const sessionId = await insertSession({
      client: getClient(),
      deviceId: DEVICE_ID,
      workoutId: String(workoutId),
    });
    expect(
      await request({
        method: 'PUT',
        path: `/${sessionId}/sets/${workoutExerciseId}/1`,
        body: { ...RESULT, ...invalid },
      }),
    ).toMatchObject({ status: BAD_REQUEST });
  });

  it('принимает подход сверх плана', async () => {
    const { workoutId, workoutExerciseId } = await catalog();
    const sessionId = await insertSession({
      client: getClient(),
      deviceId: DEVICE_ID,
      workoutId: String(workoutId),
    });

    expect(
      await request({
        method: 'PUT',
        path: `/${sessionId}/sets/${workoutExerciseId}/${EXTRA_SET_NUMBER}`,
        body: RESULT,
      }),
    ).toMatchObject({
      status: OK,
      body: { success: true, data: { results: [{ setNumber: EXTRA_SET_NUMBER }] } },
    });
  });

  it('отвечает 400 на номер подхода выше предела', async () => {
    const { workoutId, workoutExerciseId } = await catalog();
    const sessionId = await insertSession({
      client: getClient(),
      deviceId: DEVICE_ID,
      workoutId: String(workoutId),
    });

    expect(
      await request({
        method: 'PUT',
        path: `/${sessionId}/sets/${workoutExerciseId}/${OVER_LIMIT_SET_NUMBER}`,
        body: RESULT,
      }),
    ).toMatchObject({ status: BAD_REQUEST, body: { success: false, data: null } });
  });

  it('отвечает 400 на упражнение вне плана', async () => {
    const { workoutId } = await catalog();
    const sessionId = await insertSession({
      client: getClient(),
      deviceId: DEVICE_ID,
      workoutId: String(workoutId),
    });

    expect(
      await request({
        method: 'PUT',
        path: `/${sessionId}/sets/${UNKNOWN_ID}/1`,
        body: RESULT,
      }),
    ).toMatchObject({ status: BAD_REQUEST, body: { success: false, data: null } });
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
    const { workoutId, workoutExerciseId } = await catalog();
    const sessionId = await insertSession({
      client: getClient(),
      deviceId: OTHER_DEVICE_ID,
      workoutId: String(workoutId),
    });
    for (const options of [
      { path: `/${sessionId}` },
      { method: 'POST', path: `/${sessionId}/finish` },
      { method: 'PUT', path: `/${sessionId}/sets/${workoutExerciseId}/1`, body: RESULT },
    ]) {
      expect(await request(options)).toMatchObject({ status: NOT_FOUND });
    }
  });
  async function sessionWithHistory(): Promise<{
    currentId: string;
    exerciseId: number;
    workoutExerciseId: number;
  }> {
    const { workoutId, exerciseId, workoutExerciseId } = await catalog();
    const pastId = await insertSession({
      client: getClient(),
      deviceId: DEVICE_ID,
      workoutId: String(workoutId),
    });
    await insertSetResult({
      client: getClient(),
      sessionId: pastId,
      workoutExerciseId: String(workoutExerciseId),
      weight: 55,
      reps: 8,
    });
    await finishSession({ client: getClient(), sessionId: pastId });
    const currentId = await insertSession({
      client: getClient(),
      deviceId: DEVICE_ID,
      workoutId: String(workoutId),
    });

    return { currentId, exerciseId, workoutExerciseId };
  }

  it('отдаёт историю подходов в контрактной форме', async () => {
    const { currentId, exerciseId, workoutExerciseId } = await sessionWithHistory();

    const response = await request({ path: `/${currentId}/history` });

    expect(response.status).toBe(OK);
    expect(response.body).toMatchObject({
      success: true,
      data: {
        exercises: [
          {
            exerciseId,
            entries: [
              {
                sets: [
                  { workoutExerciseId, setNumber: 1, weight: 55, reps: 8, rpe: null, note: null },
                ],
              },
            ],
          },
        ],
      },
    });
    const body = response.body as ApiResponse<SessionHistoryResponse>;
    expect(body.data?.exercises[0]?.entries[0]?.finishedAt).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/,
    );
    expect(Number.isNaN(Date.parse(body.data?.exercises[0]?.entries[0]?.finishedAt ?? ''))).toBe(
      false,
    );
  });

  it('отвечает 400 на историю без заголовка устройства', async () => {
    const { currentId } = await sessionWithHistory();

    const response = await request({ path: `/${currentId}/history`, deviceId: null });

    expect(response.status).toBe(BAD_REQUEST);
  });

  it('отвечает 404 на историю сессии другого устройства', async () => {
    const { currentId } = await sessionWithHistory();

    const response = await request({ path: `/${currentId}/history`, deviceId: OTHER_DEVICE_ID });

    expect(response.status).toBe(NOT_FOUND);
  });

  it('отвечает 400 на историю с некорректным id сессии', async () => {
    const response = await request({ path: '/0/history' });

    expect(response.status).toBe(BAD_REQUEST);
  });

  describe('История и сводка', () => {
    async function finishedSession({
      deviceId = DEVICE_ID,
      sets = [HISTORY_FIRST_SET, HISTORY_SECOND_SET],
      workoutName = HISTORY_WORKOUT_NAME,
    }: {
      deviceId?: string;
      sets?: Array<{ weight: number; reps: number }>;
      workoutName?: string;
    } = {}) {
      const workoutId = await insertWorkout(getClient(), { name: workoutName });
      const exerciseId = await insertExercise(getClient());
      const workoutExerciseId = await insertWorkoutExercise({
        client: getClient(),
        workoutId,
        exerciseId,
        targetSets: TARGET_SETS,
      });
      const sessionId = await insertSession({ client: getClient(), deviceId, workoutId });
      for (const [index, set] of sets.entries()) {
        await insertSetResult({
          client: getClient(),
          sessionId,
          workoutExerciseId,
          setNumber: index + 1,
          ...set,
        });
      }
      await finishSession({ client: getClient(), sessionId });

      return { sessionId, exerciseId: Number(exerciseId) };
    }

    it('[E1] отдаёт массив завершённых сессий с подходами и без тоннажа', async () => {
      const { exerciseId } = await finishedSession();

      const response = await request({});

      expect(response).toMatchObject({
        status: OK,
        body: {
          data: {
            sessions: [
              {
                workout: {
                  name: HISTORY_WORKOUT_NAME,
                  exercises: [{ exercise: { id: exerciseId } }],
                },
                finishedAt: expect.any(String),
                results: [HISTORY_FIRST_SET, HISTORY_SECOND_SET],
              },
            ],
          },
        },
      });
      const body = response.body as ApiResponse<SessionListResponse>;
      if (!body.data) throw new Error('Список сессий не получен');
      const [session] = body.data.sessions;
      for (const field of ['totalVolume', 'setCount', 'exerciseCount']) {
        expect(session).not.toHaveProperty(field);
      }
    });

    it('[E3] отдаёт пустой список для нового устройства', async () => {
      expect(await request({})).toMatchObject({ status: OK, body: { data: { sessions: [] } } });
    });

    it('[E4] не показывает в списке сессии другого устройства', async () => {
      await finishedSession({
        deviceId: OTHER_DEVICE_ID,
        workoutName: OTHER_HISTORY_WORKOUT_NAME,
      });
      const own = await finishedSession();

      expect(await request({})).toMatchObject({
        status: OK,
        body: { data: { sessions: [{ id: Number(own.sessionId) }] } },
      });
    });

    async function finishedWithExtraSet() {
      const { workoutId, exerciseId, workoutExerciseId } = await catalog();
      const started = await request({ method: 'POST', body: { workoutId } });
      const sessionId = (started.body as ApiResponse<WorkoutSession>).data?.id;
      if (sessionId === undefined) throw new Error('Сессия не начата');

      for (let setNumber = 1; setNumber <= TARGET_SETS; setNumber += 1) {
        await request({
          method: 'PUT',
          path: `/${sessionId}/sets/${workoutExerciseId}/${setNumber}`,
          body: PLANNED_SET,
        });
      }
      await request({
        method: 'PUT',
        path: `/${sessionId}/sets/${workoutExerciseId}/${EXTRA_SET_NUMBER}`,
        body: EXTRA_SET,
      });
      await request({ method: 'POST', path: `/${sessionId}/finish` });

      return { workoutId, exerciseId, sessionId };
    }

    it('сводка включает подходы сверх плана', async () => {
      const { sessionId } = await finishedWithExtraSet();

      expect(await request({ path: `/${sessionId}/summary` })).toMatchObject({
        status: OK,
        body: { data: { setCount: EXTRA_SET_NUMBER, totalVolume: EXTRA_SETS_TOTAL_VOLUME } },
      });
    });

    it('история упражнения включает подходы сверх плана прошлой тренировки', async () => {
      const { workoutId, exerciseId } = await finishedWithExtraSet();
      const started = await request({ method: 'POST', body: { workoutId } });
      const currentId = (started.body as ApiResponse<WorkoutSession>).data?.id;
      if (currentId === undefined) throw new Error('Сессия не начата');

      const response = await request({ path: `/${currentId}/history` });

      const history = (response.body as ApiResponse<SessionHistoryResponse>).data;
      const sets = history?.exercises.find((item) => item.exerciseId === exerciseId)?.entries[0]
        ?.sets;
      expect(sets).toHaveLength(EXTRA_SET_NUMBER);
      expect(sets?.[EXTRA_SET_NUMBER - 1]).toMatchObject({
        setNumber: EXTRA_SET_NUMBER,
        ...EXTRA_SET,
      });
    });

    it('[E5] отдаёт сводку завершённой тренировки с тоннажем', async () => {
      const { sessionId } = await finishedSession();

      const response = await request({ path: `/${sessionId}/summary` });

      expect(response).toMatchObject({
        status: OK,
        body: {
          data: {
            id: Number(sessionId),
            workoutName: HISTORY_WORKOUT_NAME,
            setCount: HISTORY_SET_COUNT,
            exerciseCount: HISTORY_EXERCISE_COUNT,
            totalVolume: HISTORY_TOTAL_VOLUME,
            finishedAt: expect.any(String),
          },
        },
      });
    });

    async function finishedViaApi() {
      const workoutId = await insertWorkout(getClient(), { name: HISTORY_WORKOUT_NAME });
      const exerciseIds: string[] = [];
      const rowIds: string[] = [];
      for (const { name, sets } of SUMMARY_PLAN) {
        const exerciseId = await insertExercise(getClient(), name);
        const workoutExerciseId = await insertWorkoutExercise({
          client: getClient(),
          workoutId,
          exerciseId,

          targetSets: sets.length,
        });
        exerciseIds.push(exerciseId);
        rowIds.push(workoutExerciseId);
      }

      const started = await request({ method: 'POST', body: { workoutId: Number(workoutId) } });
      const sessionId = (started.body as ApiResponse<WorkoutSession>).data?.id;
      if (sessionId === undefined) throw new Error('Сессия не начата');

      for (const [planIndex, { sets }] of SUMMARY_PLAN.entries()) {
        for (const [index, set] of sets.entries()) {
          await request({
            method: 'PUT',
            path: `/${sessionId}/sets/${rowIds[planIndex]}/${index + 1}`,
            body: set,
          });
        }
      }
      await request({ method: 'POST', path: `/${sessionId}/finish` });

      const [firstId, secondId] = exerciseIds.map(Number);

      return { sessionId, firstId, secondId };
    }

    it('[H2-E1] отдаёт exercises в контрактной форме', async () => {
      const { sessionId, firstId, secondId } = await finishedViaApi();

      const response = await request({ path: `/${sessionId}/summary` });

      expect(response).toMatchObject({
        status: OK,
        body: {
          data: {
            exercises: [
              {
                exerciseId: firstId,
                name: SUMMARY_FIRST_EXERCISE_NAME,
                sets: [
                  {
                    setNumber: 1,
                    weight: 60,
                    reps: 8,
                    rpe: 3,
                    note: 'Легко',
                    completedAt: expect.any(String),
                  },
                  {
                    setNumber: 2,
                    weight: 60,
                    reps: 6,
                    rpe: null,
                    note: null,
                    completedAt: expect.any(String),
                  },
                ],
              },
              {
                exerciseId: secondId,
                name: SUMMARY_SECOND_EXERCISE_NAME,
                sets: [
                  {
                    setNumber: 1,
                    weight: 100,
                    reps: 5,
                    rpe: null,
                    note: null,
                    completedAt: expect.any(String),
                  },
                ],
              },
            ],
          },
        },
      });
    });

    it('[H2-E2] согласует агрегаты с подходами в том же ответе', async () => {
      const { sessionId } = await finishedViaApi();

      const response = await request({ path: `/${sessionId}/summary` });

      expect(response).toMatchObject({
        status: OK,
        body: {
          data: {
            exerciseCount: SUMMARY_EXERCISE_COUNT,
            setCount: SUMMARY_SET_COUNT,
            totalVolume: SUMMARY_TOTAL_VOLUME,
          },
        },
      });
      const summary = (response.body as ApiResponse<SessionSummary>).data;
      expect(summary?.exercises).toBeInstanceOf(Array);
      if (!summary) throw new Error('В ответе API нет сводки');

      const exercises = summary.exercises;
      const sets = exercises.flatMap((exercise) => exercise.sets);
      expect(summary.exerciseCount).toBe(exercises.length);
      expect(summary.setCount).toBe(sets.length);
      expect(summary.totalVolume).toBe(sets.reduce((sum, set) => sum + set.weight * set.reps, 0));
    });

    it('[E6] отвечает 409 для ещё не завершённой сессии', async () => {
      const { workoutId } = await catalog();
      const sessionId = await insertSession({
        client: getClient(),
        deviceId: DEVICE_ID,
        workoutId: String(workoutId),
      });

      expect(await request({ path: `/${sessionId}/summary` })).toMatchObject({
        status: CONFLICT,
      });
    });

    it('[E7] отвечает 404 на сводку чужой сессии', async () => {
      const { sessionId } = await finishedSession({ deviceId: OTHER_DEVICE_ID });

      expect(await request({ path: `/${sessionId}/summary` })).toMatchObject({
        status: NOT_FOUND,
      });
    });

    it('[E8] отвечает 404 на сводку несуществующей сессии', async () => {
      expect(await request({ path: `/${UNKNOWN_ID}/summary` })).toMatchObject({
        status: NOT_FOUND,
      });
    });

    it('[E9] отвечает 400 на нечисловой id в сводке', async () => {
      expect(await request({ path: '/abc/summary' })).toMatchObject({ status: BAD_REQUEST });
    });

    it('[E10] отдаёт детали завершённой тренировки по id', async () => {
      const { sessionId } = await finishedSession();

      const response = await request({ path: `/${sessionId}` });

      expect(response).toMatchObject({
        status: OK,
        body: {
          data: {
            finishedAt: expect.any(String),
            workout: { name: HISTORY_WORKOUT_NAME },
            results: [HISTORY_FIRST_SET, HISTORY_SECOND_SET],
          },
        },
      });
    });

    it('[E11] отвечает 404 на детали чужой завершённой тренировки', async () => {
      const { sessionId } = await finishedSession({ deviceId: OTHER_DEVICE_ID });

      expect(await request({ path: `/${sessionId}` })).toMatchObject({ status: NOT_FOUND });
    });
  });
  async function supersetCatalog() {
    const workoutId = await insertWorkout(getClient());
    const exerciseIds: number[] = [];
    const rowIds: number[] = [];
    for (const group of [SUPERSET_GROUP, SUPERSET_GROUP, null]) {
      const exerciseId = await insertExercise(getClient());
      const workoutExerciseId = await insertWorkoutExercise({
        client: getClient(),
        workoutId,
        exerciseId,

        targetSets: 2,
        supersetGroup: group,
      });
      exerciseIds.push(Number(exerciseId));
      rowIds.push(Number(workoutExerciseId));
    }

    return { workoutId: Number(workoutId), exerciseIds, rowIds };
  }

  async function startSession(workoutId: number): Promise<number> {
    const started = await request({ method: 'POST', body: { workoutId } });
    const id = (started.body as ApiResponse<WorkoutSession>).data?.id;
    if (id === undefined) throw new Error('Сессия не создана');

    return id;
  }

  it('[E3] план сессии содержит группу суперсета', async () => {
    const { workoutId } = await supersetCatalog();
    const sessionId = await startSession(workoutId);

    const response = await request({ path: `/${sessionId}` });

    const session = (response.body as ApiResponse<WorkoutSession>).data;
    expect(session?.workout.exercises.map((item) => item.supersetGroup)).toEqual([
      SUPERSET_GROUP,
      SUPERSET_GROUP,
      null,
    ]);
  });

  it('[E4] принимает чередующиеся подходы двух упражнений суперсета', async () => {
    const { workoutId, rowIds } = await supersetCatalog();
    const [first, second] = rowIds;
    const sessionId = await startSession(workoutId);

    const statuses = [];
    for (const [workoutExerciseId, setNumber] of [
      [first, 1],
      [second, 1],
      [first, 2],
    ] as const) {
      const saved = await request({
        method: 'PUT',
        path: `/${sessionId}/sets/${workoutExerciseId}/${setNumber}`,
        body: PLANNED_SET,
      });
      statuses.push(saved.status);
    }

    expect(statuses).toEqual([OK, OK, OK]);
    const response = await request({ path: `/${sessionId}` });
    expect((response.body as ApiResponse<WorkoutSession>).data?.results).toHaveLength(3);
  });

  it('[E10] сводка сохраняет порядок плана и отдаёт группу', async () => {
    const { workoutId, exerciseIds, rowIds } = await supersetCatalog();
    const sessionId = await startSession(workoutId);
    for (const workoutExerciseId of rowIds) {
      await request({
        method: 'PUT',
        path: `/${sessionId}/sets/${workoutExerciseId}/1`,
        body: PLANNED_SET,
      });
    }
    await request({ method: 'POST', path: `/${sessionId}/finish` });

    const response = await request({ path: `/${sessionId}/summary` });

    const summary = (response.body as ApiResponse<SessionSummary>).data;
    expect(
      summary?.exercises.map(({ exerciseId, supersetGroup }) => [exerciseId, supersetGroup]),
    ).toEqual(
      exerciseIds.map((exerciseId, index) => [exerciseId, index < 2 ? SUPERSET_GROUP : null]),
    );
  });

  async function lateralWorkout() {
    const workoutId = await insertWorkout(getClient());
    const exerciseId = await insertExercise(getClient(), LATERAL_NAME);
    const rows: number[] = [];
    for (const occurrence of [1, 2]) {
      const id = await insertWorkoutExercise({
        client: getClient(),
        workoutId,
        exerciseId,
        occurrence,
        targetSets: 2,
      });
      rows.push(Number(id));
    }

    return { workoutId: Number(workoutId), exerciseId: Number(exerciseId), rows };
  }

  function putSet({
    sessionId,
    row,
    setNumber,
    weight,
  }: {
    sessionId: number;
    row: number;
    setNumber: number;
    weight: number;
  }) {
    return request({
      method: 'PUT',
      path: `/${sessionId}/sets/${row}/${setNumber}`,
      body: { weight, reps: LATERAL_REPS },
    });
  }

  it('[E2] подходы двух вхождений одного упражнения не смешиваются', async () => {
    const { workoutId, rows } = await lateralWorkout();
    const [first, second] = rows as [number, number];
    const sessionId = await startSession(workoutId);

    const statuses = [
      (await putSet({ sessionId, row: second, setNumber: 1, weight: SECOND_ROW_WEIGHT })).status,
      (await putSet({ sessionId, row: first, setNumber: 2, weight: FIRST_ROW_SECOND_SET_WEIGHT }))
        .status,
      (await putSet({ sessionId, row: first, setNumber: 1, weight: FIRST_ROW_WEIGHT })).status,
    ];

    expect(statuses).toEqual([OK, OK, OK]);
    const results = ((await request({ path: `/${sessionId}` })).body as ApiResponse<WorkoutSession>)
      .data?.results;
    expect(results?.map((set) => [set.workoutExerciseId, set.setNumber, set.weight])).toEqual([
      [first, 1, FIRST_ROW_WEIGHT],
      [first, 2, FIRST_ROW_SECOND_SET_WEIGHT],
      [second, 1, SECOND_ROW_WEIGHT],
    ]);
  });

  it('[E3] строка плана чужой тренировки отклоняется', async () => {
    const { workoutId, exerciseId } = await lateralWorkout();
    const otherWorkoutId = await insertWorkout(getClient());
    const otherRowId = await insertWorkoutExercise({
      client: getClient(),
      workoutId: otherWorkoutId,
      exerciseId: String(exerciseId),
    });
    const sessionId = await startSession(workoutId);

    const response = await putSet({
      sessionId,
      row: Number(otherRowId),
      setNumber: 1,
      weight: FIRST_ROW_WEIGHT,
    });

    expect(response).toMatchObject({
      status: BAD_REQUEST,
      body: { message: 'Упражнение не входит в план тренировки' },
    });
  });

  it('[E4] несуществующая строка плана отклоняется', async () => {
    const { workoutId } = await lateralWorkout();
    const sessionId = await startSession(workoutId);

    const response = await putSet({
      sessionId,
      row: UNKNOWN_ID,
      setNumber: 1,
      weight: FIRST_ROW_WEIGHT,
    });

    expect(response).toMatchObject({
      status: BAD_REQUEST,
      body: { message: 'Упражнение не входит в план тренировки' },
    });
  });

  it.each(['abc', '0'])(
    '[E5] некорректный идентификатор строки плана «%s» отклоняется',
    async (row) => {
      const { workoutId } = await lateralWorkout();
      const sessionId = await startSession(workoutId);

      const response = await request({
        method: 'PUT',
        path: `/${sessionId}/sets/${row}/1`,
        body: { weight: FIRST_ROW_WEIGHT, reps: LATERAL_REPS },
      });

      expect(response.status).toBe(BAD_REQUEST);
    },
  );

  async function finishedLateralSession() {
    const { workoutId, rows } = await lateralWorkout();
    const [first, second] = rows as [number, number];
    const sessionId = await startSession(workoutId);
    await putSet({ sessionId, row: first, setNumber: 1, weight: FIRST_ROW_WEIGHT });
    await putSet({ sessionId, row: second, setNumber: 1, weight: SECOND_ROW_WEIGHT });
    await request({ method: 'POST', path: `/${sessionId}/finish` });

    return { sessionId, workoutId, rows: [first, second] };
  }

  it('[E6] сводка отдаёт две карточки одного упражнения', async () => {
    const { sessionId, rows } = await finishedLateralSession();

    const summary = (
      (await request({ path: `/${sessionId}/summary` })).body as ApiResponse<SessionSummary>
    ).data;

    expect(summary?.exercises.map((item) => item.workoutExerciseId)).toEqual(rows);
  });

  it('[E7] счётчик упражнений сводки считается по вхождениям', async () => {
    const { sessionId } = await finishedLateralSession();

    const summary = (
      (await request({ path: `/${sessionId}/summary` })).body as ApiResponse<SessionSummary>
    ).data;

    expect(summary?.exerciseCount).toBe(2);
  });

  it('[E14] тоннаж сводки суммирует подходы обоих вхождений', async () => {
    const { sessionId } = await finishedLateralSession();

    const summary = (
      (await request({ path: `/${sessionId}/summary` })).body as ApiResponse<SessionSummary>
    ).data;

    expect(summary?.totalVolume).toBe((FIRST_ROW_WEIGHT + SECOND_ROW_WEIGHT) * LATERAL_REPS);
  });

  it('[E8] история не дублирует упражнение, повторенное в плане', async () => {
    const { workoutId, rows } = await finishedLateralSession();
    const currentId = await startSession(workoutId);

    const history = (
      (await request({ path: `/${currentId}/history` })).body as ApiResponse<SessionHistoryResponse>
    ).data;

    expect(history?.exercises).toHaveLength(1);
    expect(rows).toHaveLength(2);
  });
});
