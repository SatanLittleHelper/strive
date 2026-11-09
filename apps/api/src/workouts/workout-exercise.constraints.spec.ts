import { describe, expect, it } from 'vitest';
import {
  insertExercise,
  insertWorkout,
  insertWorkoutExercise,
  useDatabaseClient,
} from '../test-support/index.js';

const CHECK_VIOLATION = '23514';
const VALID_GROUP = 1;
const ZERO_GROUP = 0;
const NEGATIVE_GROUP = -1;

describe('Ограничение superset_group', () => {
  const getClient = useDatabaseClient();

  async function setup() {
    const workoutId = await insertWorkout(getClient());
    const exerciseId = await insertExercise(getClient());

    return { client: getClient(), workoutId, exerciseId };
  }

  it('[I2] группа ≤ 0 отклоняется', async () => {
    const { client, workoutId, exerciseId } = await setup();

    await expect(
      insertWorkoutExercise({ client, workoutId, exerciseId, supersetGroup: ZERO_GROUP }),
    ).rejects.toMatchObject({ code: CHECK_VIOLATION });
    await expect(
      insertWorkoutExercise({ client, workoutId, exerciseId, supersetGroup: NEGATIVE_GROUP }),
    ).rejects.toMatchObject({ code: CHECK_VIOLATION });
  });

  it('[I3] пустая группа и группа 1 принимаются', async () => {
    const { client, workoutId, exerciseId } = await setup();
    const otherExerciseId = await insertExercise(client);

    await expect(
      insertWorkoutExercise({ client, workoutId, exerciseId, position: 1, supersetGroup: null }),
    ).resolves.toBeDefined();
    await expect(
      insertWorkoutExercise({
        client,
        workoutId,
        exerciseId: otherExerciseId,
        position: 2,
        supersetGroup: VALID_GROUP,
      }),
    ).resolves.toBeDefined();
  });
});
