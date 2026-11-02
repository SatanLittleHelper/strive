import { describe, expect, it } from 'vitest';
import {
  insertExercise,
  insertSession,
  insertSetResult,
  useDatabaseClient,
} from '../test-support/index.js';

const UNIQUE_VIOLATION = '23505';
const CHECK_VIOLATION = '23514';
const FOREIGN_KEY_VIOLATION = '23503';
const UNKNOWN_EXERCISE_ID = '999999';
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

  it('не допускает дубль номера подхода в упражнении сессии', async () => {
    const sessionId = await createSession();
    const exerciseId = await insertExercise(getClient());
    await insertSetResult({ client: getClient(), sessionId, exerciseId });

    await expect(
      insertSetResult({ client: getClient(), sessionId, exerciseId }),
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

  it('[I2] не допускает подход с несуществующим упражнением', async () => {
    const sessionId = await insertSession({ client: getClient(), deviceId: DEVICE_ID });

    await expect(
      insertSetResult({
        client: getClient(),
        sessionId,
        exerciseId: UNKNOWN_EXERCISE_ID,
      }),
    ).rejects.toMatchObject({ code: FOREIGN_KEY_VIOLATION });
  });

  it('[I4] не допускает удаление упражнения с записанными подходами', async () => {
    const sessionId = await insertSession({ client: getClient(), deviceId: DEVICE_ID });
    const exerciseId = await insertExercise(getClient());
    await insertSetResult({ client: getClient(), sessionId, exerciseId });

    await expect(
      getClient().query('DELETE FROM exercise WHERE id = $1', [exerciseId]),
    ).rejects.toMatchObject({ code: FOREIGN_KEY_VIOLATION });
    const remaining = await getClient().query('SELECT 1 FROM set_result WHERE exercise_id = $1', [
      exerciseId,
    ]);
    expect(remaining.rowCount).toBe(1);
  });
});
