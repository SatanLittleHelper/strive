import 'reflect-metadata';
import { HttpStatus, type INestApplication } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { configureApp } from '../app/app.setup.js';
import {
  getDatabaseUrl,
  insertExercise,
  insertWorkout,
  insertWorkoutExercise,
  useDatabaseClient,
} from '../test-support/index.js';
import { WorkoutsController } from './workouts.controller.js';

const UNKNOWN_WORKOUT_ID = 999;
const INVALID_IDS = ['abc', '0', '-1', '1.5', '99999999999999999999'];
const WORKOUT = { name: 'Тренировка HTTP', description: 'Проверка контракта' };
const EXERCISE_NAME = 'Жим';
const PLAN = { targetSets: 4, targetRepsMin: 8, targetRepsMax: 10 };

describe('HTTP каталога тренировок', () => {
  const getClient = useDatabaseClient();
  const state: { app?: INestApplication; url?: string } = {};

  beforeAll(async () => {
    // dev-запуск идёт через tsx, который не эмитит метаданные типов параметров: проверяем в тех же условиях
    Reflect.deleteMetadata('design:paramtypes', WorkoutsController.prototype, 'getDetails');
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

  async function get(path: string): Promise<{ status: number; body: unknown }> {
    const response = await fetch(`${state.url}${path}`);

    return { status: response.status, body: await response.json() };
  }

  async function insertCatalogWorkout(): Promise<string> {
    const workoutId = await insertWorkout(getClient(), WORKOUT);
    const exerciseId = await insertExercise(getClient(), EXERCISE_NAME);
    await insertWorkoutExercise({ client: getClient(), workoutId, exerciseId, ...PLAN });

    return workoutId;
  }

  it('возвращает пустой список каталога', async () => {
    expect(await get('/api/workouts')).toMatchObject({
      status: HttpStatus.OK,
      body: { success: true, data: [] },
    });
  });

  it('возвращает сводки тренировок', async () => {
    const workoutId = await insertCatalogWorkout();

    expect(await get('/api/workouts')).toMatchObject({
      status: HttpStatus.OK,
      body: { success: true, data: [{ id: Number(workoutId), ...WORKOUT, exerciseCount: 1 }] },
    });
  });

  it('возвращает тренировку с планом упражнений', async () => {
    const workoutId = await insertCatalogWorkout();

    expect(await get(`/api/workouts/${workoutId}`)).toMatchObject({
      status: HttpStatus.OK,
      body: {
        success: true,
        data: {
          id: Number(workoutId),
          ...WORKOUT,
          exercises: [
            {
              exercise: { name: EXERCISE_NAME },
              position: 1,
              sets: PLAN.targetSets,
              repsMin: PLAN.targetRepsMin,
              repsMax: PLAN.targetRepsMax,
            },
          ],
        },
      },
    });
  });

  it('отвечает 404 для несуществующей тренировки', async () => {
    expect(await get(`/api/workouts/${UNKNOWN_WORKOUT_ID}`)).toMatchObject({
      status: HttpStatus.NOT_FOUND,
      body: { success: false, data: null },
    });
  });

  it.each(INVALID_IDS)('отвечает 400 для некорректного id %s', async (id) => {
    expect(await get(`/api/workouts/${id}`)).toMatchObject({
      status: HttpStatus.BAD_REQUEST,
      body: { success: false, data: null },
    });
  });
});
