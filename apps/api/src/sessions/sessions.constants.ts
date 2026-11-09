import type { Prisma } from '../generated/prisma/client.js';
import { WORKOUT_INCLUDE } from '../workouts/index.js';

export const SESSION_INCLUDE = {
  set_results: { orderBy: [{ workout_exercise_id: 'asc' }, { set_number: 'asc' }] },
  workout: { include: WORKOUT_INCLUDE },
} satisfies Prisma.workout_sessionInclude;

export const MIN_SESSION_ID = 1;
export const MIN_SET_NUMBER = 1;

export const HISTORY_ENTRIES_PER_EXERCISE = 10;
// Окно выборки для истории по упражнению: в нём ищутся записи конкретных упражнений.
export const HISTORY_SESSIONS_LIMIT = 100;
// Размер списка завершённых тренировок на экране истории.
export const SESSION_LIST_LIMIT = 20;
