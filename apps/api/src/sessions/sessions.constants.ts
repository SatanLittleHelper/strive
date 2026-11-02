import type { Prisma } from '../generated/prisma/client.js';

export const SESSION_INCLUDE = {
  set_results: { orderBy: [{ exercise_id: 'asc' }, { set_number: 'asc' }] },
} satisfies Prisma.workout_sessionInclude;

export const MIN_SESSION_ID = 1;
export const MIN_SET_NUMBER = 1;

export const HISTORY_ENTRIES_PER_EXERCISE = 10;
export const HISTORY_SESSIONS_LIMIT = 100;
