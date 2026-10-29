import pg from 'pg';
import { afterAll, beforeAll, beforeEach, inject } from 'vitest';
import './provided-context.types.js';

const TABLES = ['set_result', 'workout_session', 'workout_exercise', 'workout', 'exercise'];

export function getDatabaseUrl(): string {
  return inject('databaseUrl');
}

export function useDatabaseClient(): () => pg.Client {
  const state: { client?: pg.Client } = {};

  function getClient(): pg.Client {
    if (state.client === undefined) {
      throw new Error('Клиент БД не создан');
    }

    return state.client;
  }

  beforeAll(async () => {
    state.client = new pg.Client({ connectionString: getDatabaseUrl() });
    await state.client.connect();
  });

  afterAll(async () => {
    await state.client?.end();
  });

  beforeEach(async () => {
    await getClient().query(`TRUNCATE ${TABLES.join(', ')} RESTART IDENTITY CASCADE`);
  });

  return getClient;
}
