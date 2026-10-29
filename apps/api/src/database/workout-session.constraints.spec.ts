import { describe, expect, it } from 'vitest';
import { finishSession, insertSession, useDatabaseClient } from '../test-support/index.js';

const UNIQUE_VIOLATION = '23505';
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
});
