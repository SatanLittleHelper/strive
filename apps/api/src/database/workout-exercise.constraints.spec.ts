import { describe, expect, it } from 'vitest';
import {
  insertExercise,
  insertWorkout,
  insertWorkoutExercise,
  useDatabaseClient,
} from '../test-support/index.js';

const UNIQUE_VIOLATION = '23505';
const CHECK_VIOLATION = '23514';
const REPS_MIN = 10;
const REPS_MAX_BELOW_MIN = 8;

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

  it('не допускает максимум повторов меньше минимума', async () => {
    const parents = await createParents();

    await expect(
      insertWorkoutExercise({
        client: getClient(),
        ...parents,
        targetRepsMin: REPS_MIN,
        targetRepsMax: REPS_MAX_BELOW_MIN,
      }),
    ).rejects.toMatchObject({ code: CHECK_VIOLATION });
  });

  it('не допускает нулевое число подходов', async () => {
    const parents = await createParents();

    await expect(
      insertWorkoutExercise({ client: getClient(), ...parents, targetSets: 0 }),
    ).rejects.toMatchObject({ code: CHECK_VIOLATION });
  });

  it('не допускает две записи с одной позицией в тренировке', async () => {
    const parents = await createParents();
    const secondExerciseId = await insertExercise(getClient());
    await insertWorkoutExercise({ client: getClient(), ...parents });

    await expect(
      insertWorkoutExercise({
        client: getClient(),
        workoutId: parents.workoutId,
        exerciseId: secondExerciseId,
      }),
    ).rejects.toMatchObject({ code: UNIQUE_VIOLATION });
  });

  it('допускает одну позицию в разных тренировках', async () => {
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
});
