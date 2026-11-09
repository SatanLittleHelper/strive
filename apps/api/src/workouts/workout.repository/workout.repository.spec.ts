import { NotFoundException } from '@nestjs/common';
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
import { WorkoutRepository } from './workout.repository.js';

const SUPERSET_GROUP = 1;
const UNKNOWN_WORKOUT_ID = 999;
const FIRST_POSITION = 1;
const SECOND_POSITION = 2;
const LEGS_WORKOUT = { name: 'Ноги', description: 'Приседания и тяга' };
const REST_WORKOUT = { name: 'Отдых', description: null };
const SQUAT = 'Приседания';
const DEADLIFT = 'Тяга';
const SQUAT_PLAN = { targetSets: 3, targetReps: 8 };
const DEADLIFT_PLAN = { targetSets: 2, targetReps: 5 };

describe('WorkoutRepository', () => {
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

  function createRepository(): WorkoutRepository {
    if (state.prisma === undefined) {
      throw new Error('PrismaService не создан');
    }

    return new WorkoutRepository(state.prisma);
  }

  async function insertLegsWorkout(): Promise<{
    workoutId: string;
    squatId: string;
    deadliftId: string;
  }> {
    const workoutId = await insertWorkout(getClient(), LEGS_WORKOUT);
    const squatId = await insertExercise(getClient(), SQUAT);
    const deadliftId = await insertExercise(getClient(), DEADLIFT);
    // вставка в обратном порядке позиций: порядок обязан задавать запрос, а не вставка
    await insertWorkoutExercise({
      client: getClient(),
      workoutId,
      exerciseId: deadliftId,
      position: SECOND_POSITION,
      ...DEADLIFT_PLAN,
    });
    await insertWorkoutExercise({
      client: getClient(),
      workoutId,
      exerciseId: squatId,
      position: FIRST_POSITION,
      ...SQUAT_PLAN,
    });

    return { workoutId, squatId, deadliftId };
  }

  it('возвращает пустой список, если тренировок нет', async () => {
    await expect(createRepository().findAll()).resolves.toEqual([]);
  });

  it('возвращает сводки тренировок по возрастанию id с числом упражнений', async () => {
    const { workoutId } = await insertLegsWorkout();
    const restId = await insertWorkout(getClient(), REST_WORKOUT);

    await expect(createRepository().findAll()).resolves.toEqual([
      { id: Number(workoutId), ...LEGS_WORKOUT, exerciseCount: 2 },
      { id: Number(restId), ...REST_WORKOUT, exerciseCount: 0 },
    ]);
  });

  it('возвращает тренировку с упражнениями по порядку позиций', async () => {
    const { workoutId, squatId, deadliftId } = await insertLegsWorkout();

    await expect(createRepository().getById(Number(workoutId))).resolves.toEqual({
      id: Number(workoutId),
      ...LEGS_WORKOUT,
      exercises: [
        {
          exercise: { id: Number(squatId), name: SQUAT },
          position: FIRST_POSITION,
          sets: SQUAT_PLAN.targetSets,
          reps: SQUAT_PLAN.targetReps,
          weight: null,
          supersetGroup: null,
        },
        {
          exercise: { id: Number(deadliftId), name: DEADLIFT },
          position: SECOND_POSITION,
          sets: DEADLIFT_PLAN.targetSets,
          reps: DEADLIFT_PLAN.targetReps,
          weight: null,
          supersetGroup: null,
        },
      ],
    });
  });

  it('бросает NotFoundException для неизвестной тренировки', async () => {
    await expect(createRepository().getById(UNKNOWN_WORKOUT_ID)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
  it('[I1] возвращает группу суперсета упражнения', async () => {
    const workoutId = await insertWorkout(getClient(), LEGS_WORKOUT);
    const groupedIds = [await insertExercise(getClient()), await insertExercise(getClient())];
    const singleId = await insertExercise(getClient());
    for (const [index, exerciseId] of [...groupedIds, singleId].entries()) {
      await insertWorkoutExercise({
        client: getClient(),
        workoutId,
        exerciseId,
        position: index + 1,
        supersetGroup: index < groupedIds.length ? SUPERSET_GROUP : null,
      });
    }

    const workout = await createRepository().getById(Number(workoutId));

    expect(workout.exercises.map((item) => item.supersetGroup)).toEqual([
      SUPERSET_GROUP,
      SUPERSET_GROUP,
      null,
    ]);
  });
});
