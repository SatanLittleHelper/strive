import { describe, expect, it } from 'vitest';
import {
  insertExercise,
  insertWorkout,
  insertWorkoutExercise,
  insertSession,
  insertSetResult,
  useDatabaseClient,
} from '../test-support/index.js';

const NOT_NULL_VIOLATION = '23502';
const UNIQUE_VIOLATION = '23505';
const CHECK_VIOLATION = '23514';
const FOREIGN_KEY_VIOLATION = '23503';
const UNKNOWN_WORKOUT_EXERCISE_ID = '999999';
const DEVICE_ID = '11111111-1111-4111-8111-111111111111';
const MIN_RPE = 1;
const MAX_RPE = 5;

describe('Ограничения таблицы set_result', () => {
  const getClient = useDatabaseClient();

  function createSession(): Promise<string> {
    return insertSession({ client: getClient(), deviceId: DEVICE_ID });
  }

  it('сохраняет подход с корректными значениями', async () => {
    const sessionId = await createSession();

    await expect(insertSetResult({ client: getClient(), sessionId })).resolves.toBeDefined();
  });

  it('не допускает дубль номера подхода в строке плана сессии', async () => {
    const sessionId = await createSession();
    const workoutId = await insertWorkout(getClient());
    const exerciseId = await insertExercise(getClient());
    const workoutExerciseId = await insertWorkoutExercise({
      client: getClient(),
      workoutId,
      exerciseId,
    });
    await insertSetResult({ client: getClient(), sessionId, workoutExerciseId });

    await expect(
      insertSetResult({ client: getClient(), sessionId, workoutExerciseId }),
    ).rejects.toMatchObject({
      code: UNIQUE_VIOLATION,
    });
  });

  it.each([MIN_RPE - 1, MAX_RPE + 1])('не допускает RPE %i вне диапазона 1–5', async (rpe) => {
    const sessionId = await createSession();

    await expect(insertSetResult({ client: getClient(), sessionId, rpe })).rejects.toMatchObject({
      code: CHECK_VIOLATION,
    });
  });

  it.each([MIN_RPE, MAX_RPE, null])('допускает RPE %s', async (rpe) => {
    const sessionId = await createSession();

    await expect(insertSetResult({ client: getClient(), sessionId, rpe })).resolves.toBeDefined();
  });

  it('не допускает отрицательный вес', async () => {
    const sessionId = await createSession();

    await expect(
      insertSetResult({ client: getClient(), sessionId, weight: -1 }),
    ).rejects.toMatchObject({ code: CHECK_VIOLATION });
  });

  it('не допускает нулевое число повторов', async () => {
    const sessionId = await createSession();

    await expect(
      insertSetResult({ client: getClient(), sessionId, reps: 0 }),
    ).rejects.toMatchObject({ code: CHECK_VIOLATION });
  });

  it('не допускает нулевой номер подхода', async () => {
    const sessionId = await createSession();

    await expect(
      insertSetResult({ client: getClient(), sessionId, setNumber: 0 }),
    ).rejects.toMatchObject({ code: CHECK_VIOLATION });
  });

  it('[I5] не допускает подход с несуществующей строкой плана', async () => {
    const sessionId = await insertSession({ client: getClient(), deviceId: DEVICE_ID });

    await expect(
      insertSetResult({
        client: getClient(),
        sessionId,
        workoutExerciseId: UNKNOWN_WORKOUT_EXERCISE_ID,
      }),
    ).rejects.toMatchObject({ code: FOREIGN_KEY_VIOLATION });
  });

  it('не допускает удаление упражнения с записанными подходами', async () => {
    const sessionId = await insertSession({ client: getClient(), deviceId: DEVICE_ID });
    const workoutId = await insertWorkout(getClient());
    const exerciseId = await insertExercise(getClient());
    const workoutExerciseId = await insertWorkoutExercise({
      client: getClient(),
      workoutId,
      exerciseId,
    });
    await insertSetResult({ client: getClient(), sessionId, workoutExerciseId });

    await expect(
      getClient().query('DELETE FROM exercise WHERE id = $1', [exerciseId]),
    ).rejects.toMatchObject({ code: FOREIGN_KEY_VIOLATION });
    const remaining = await getClient().query(
      'SELECT 1 FROM set_result WHERE workout_exercise_id = $1',
      [workoutExerciseId],
    );
    expect(remaining.rowCount).toBe(1);
  });

  async function insertPlanRow(): Promise<{ sessionId: string; rowId: string }> {
    const workoutId = await insertWorkout(getClient());
    const exerciseId = await insertExercise(getClient());
    const rowId = await insertWorkoutExercise({ client: getClient(), workoutId, exerciseId });
    const sessionId = await insertSession({ client: getClient(), deviceId: DEVICE_ID, workoutId });

    return { sessionId, rowId };
  }

  it('[I4] различает подходы двух вхождений с одним номером', async () => {
    const workoutId = await insertWorkout(getClient());
    const exerciseId = await insertExercise(getClient());
    const firstRow = await insertWorkoutExercise({
      client: getClient(),
      workoutId,
      exerciseId,
      occurrence: 1,
    });
    const secondRow = await insertWorkoutExercise({
      client: getClient(),
      workoutId,
      exerciseId,
      occurrence: 2,
    });
    const sessionId = await insertSession({ client: getClient(), deviceId: DEVICE_ID, workoutId });
    await insertSetResult({ client: getClient(), sessionId, workoutExerciseId: firstRow });

    await expect(
      insertSetResult({ client: getClient(), sessionId, workoutExerciseId: secondRow }),
    ).resolves.toBeDefined();
    await expect(
      insertSetResult({ client: getClient(), sessionId, workoutExerciseId: firstRow }),
    ).rejects.toMatchObject({ code: UNIQUE_VIOLATION });
  });

  it('[I6] не допускает удаление строки плана с подходами', async () => {
    const { sessionId, rowId } = await insertPlanRow();
    await insertSetResult({ client: getClient(), sessionId, workoutExerciseId: rowId });

    await expect(
      getClient().query('DELETE FROM workout_exercise WHERE id = $1', [rowId]),
    ).rejects.toMatchObject({ code: FOREIGN_KEY_VIOLATION });
    const remaining = await getClient().query(
      'SELECT 1 FROM set_result WHERE workout_exercise_id = $1',
      [rowId],
    );
    expect(remaining.rowCount).toBe(1);
  });

  it('[I10] не допускает подход без строки плана', async () => {
    const sessionId = await createSession();

    await expect(
      getClient().query(
        'INSERT INTO set_result (session_id, workout_exercise_id, set_number, weight, reps) VALUES ($1, NULL, 1, 60, 8)',
        [sessionId],
      ),
    ).rejects.toMatchObject({ code: NOT_NULL_VIOLATION });
  });
});
