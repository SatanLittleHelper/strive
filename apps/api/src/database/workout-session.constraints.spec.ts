import { describe, expect, it } from 'vitest';
import {
  finishSession,
  insertSession,
  insertWorkout,
  useDatabaseClient,
} from '../test-support/index.js';

const UNIQUE_VIOLATION = '23505';
const FOREIGN_KEY_VIOLATION = '23503';
const UNKNOWN_WORKOUT_ID = '999999';
const FIRST_DEVICE = '11111111-1111-4111-8111-111111111111';
const SECOND_DEVICE = '22222222-2222-4222-8222-222222222222';

describe('Ограничения таблицы workout_session', () => {
  const getClient = useDatabaseClient();

  it('не допускает вторую активную сессию одного устройства', async () => {
    await insertSession({ client: getClient(), deviceId: FIRST_DEVICE });

    await expect(
      insertSession({ client: getClient(), deviceId: FIRST_DEVICE }),
    ).rejects.toMatchObject({ code: UNIQUE_VIOLATION });
  });

  it('допускает новую активную сессию после завершения предыдущей', async () => {
    const sessionId = await insertSession({ client: getClient(), deviceId: FIRST_DEVICE });
    await finishSession({ client: getClient(), sessionId });

    await expect(
      insertSession({ client: getClient(), deviceId: FIRST_DEVICE }),
    ).resolves.toBeDefined();
  });

  it('допускает активные сессии разных устройств', async () => {
    await insertSession({ client: getClient(), deviceId: FIRST_DEVICE });

    await expect(
      insertSession({ client: getClient(), deviceId: SECOND_DEVICE }),
    ).resolves.toBeDefined();
  });

  it('[I1] не допускает сессию с несуществующей тренировкой', async () => {
    await expect(
      insertSession({
        client: getClient(),
        deviceId: FIRST_DEVICE,
        workoutId: UNKNOWN_WORKOUT_ID,
      }),
    ).rejects.toMatchObject({ code: FOREIGN_KEY_VIOLATION });
  });

  it('[I3] не допускает удаление тренировки, на которую ссылается сессия', async () => {
    const workoutId = await insertWorkout(getClient());
    await insertSession({ client: getClient(), deviceId: FIRST_DEVICE, workoutId });

    await expect(
      getClient().query('DELETE FROM workout WHERE id = $1', [workoutId]),
    ).rejects.toMatchObject({ code: FOREIGN_KEY_VIOLATION });
    const remaining = await getClient().query('SELECT id FROM workout WHERE id = $1', [workoutId]);
    expect(remaining.rowCount).toBe(1);
  });
});
