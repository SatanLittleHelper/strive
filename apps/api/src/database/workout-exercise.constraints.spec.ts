import { describe, expect, it } from 'vitest';
import {
  insertExercise,
  insertWorkout,
  insertWorkoutExercise,
  useDatabaseClient,
} from '../test-support/index.js';

const UNIQUE_VIOLATION = '23505';
const CHECK_VIOLATION = '23514';
const FIRST_OCCURRENCE = 1;
const SECOND_OCCURRENCE = 2;
const NO_OCCURRENCE = 0;
const ZERO_REPS = 0;
const NEGATIVE_WEIGHT = -1;
const ZERO_WEIGHT = 0;

describe('Ограничения таблицы workout_exercise', () => {
  const getClient = useDatabaseClient();

  async function createParents(): Promise<{ workoutId: string; exerciseId: string }> {
    const exerciseId = await insertExercise(getClient());
    const workoutId = await insertWorkout(getClient());

    return { workoutId, exerciseId };
  }

  it('сохраняет корректный план упражнения', async () => {
    const parents = await createParents();

    await expect(insertWorkoutExercise({ client: getClient(), ...parents })).resolves.toBeDefined();
  });

  it('не допускает нулевую цель повторов', async () => {
    const parents = await createParents();

    await expect(
      insertWorkoutExercise({ client: getClient(), ...parents, targetReps: ZERO_REPS }),
    ).rejects.toMatchObject({ code: CHECK_VIOLATION });
  });

  it('не допускает нулевое число подходов', async () => {
    const parents = await createParents();

    await expect(
      insertWorkoutExercise({ client: getClient(), ...parents, targetSets: 0 }),
    ).rejects.toMatchObject({ code: CHECK_VIOLATION });
  });

  it('[I1] допускает два вхождения одного упражнения в тренировке', async () => {
    const parents = await createParents();

    const firstId = await insertWorkoutExercise({
      client: getClient(),
      ...parents,
      occurrence: FIRST_OCCURRENCE,
    });
    const secondId = await insertWorkoutExercise({
      client: getClient(),
      ...parents,
      occurrence: SECOND_OCCURRENCE,
    });

    expect(firstId).not.toBe(secondId);
  });

  it('[I2] не допускает две строки с одним упражнением и одной копией в тренировке', async () => {
    const parents = await createParents();
    await insertWorkoutExercise({ client: getClient(), ...parents });

    await expect(insertWorkoutExercise({ client: getClient(), ...parents })).rejects.toMatchObject({
      code: UNIQUE_VIOLATION,
    });
  });

  it('[I12] не допускает номер копии меньше единицы', async () => {
    const parents = await createParents();

    await expect(
      insertWorkoutExercise({ client: getClient(), ...parents, occurrence: NO_OCCURRENCE }),
    ).rejects.toMatchObject({ code: CHECK_VIOLATION });
  });

  it('допускает одну копию упражнения в разных тренировках', async () => {
    const parents = await createParents();
    const otherWorkoutId = await insertWorkout(getClient());
    await insertWorkoutExercise({ client: getClient(), ...parents });

    await expect(
      insertWorkoutExercise({
        client: getClient(),
        workoutId: otherWorkoutId,
        exerciseId: parents.exerciseId,
      }),
    ).resolves.toBeDefined();
  });
  it('не допускает отрицательный целевой вес', async () => {
    const parents = await createParents();

    await expect(
      insertWorkoutExercise({ client: getClient(), ...parents, targetWeight: NEGATIVE_WEIGHT }),
    ).rejects.toMatchObject({ code: CHECK_VIOLATION });
  });

  it('допускает план без целевого веса', async () => {
    const parents = await createParents();

    await expect(
      insertWorkoutExercise({ client: getClient(), ...parents, targetWeight: null }),
    ).resolves.toBeDefined();
  });

  it('допускает нулевой целевой вес', async () => {
    const parents = await createParents();

    await expect(
      insertWorkoutExercise({ client: getClient(), ...parents, targetWeight: ZERO_WEIGHT }),
    ).resolves.toBeDefined();
  });
});
