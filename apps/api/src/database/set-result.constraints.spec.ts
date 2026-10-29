import { describe, expect, it } from 'vitest';
import { insertSession, insertSetResult, useDatabaseClient } from '../test-support/index.js';

const UNIQUE_VIOLATION = '23505';
const CHECK_VIOLATION = '23514';
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
    await insertSetResult({ client: getClient(), sessionId });

    await expect(insertSetResult({ client: getClient(), sessionId })).rejects.toMatchObject({
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
});
