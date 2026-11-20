import type { Page } from '@playwright/test';
import type {
  FinishedSharedSession,
  SharedSessionResponse,
  WorkoutSession,
} from '@strive/api-interfaces';
import { errorBody, ok } from './session.fixtures';

export const SHARED_TOKEN = 'share-token';
export const SHARED_POLL_MS = 5000;
const FINISHED_AT = '2026-11-02T13:00:00.000Z';

function withoutNotes(session: WorkoutSession) {
  return session.results.map(
    ({ workoutExerciseId, setNumber, weight, reps, rpe, completedAt }) => ({
      workoutExerciseId,
      setNumber,
      weight,
      reps,
      rpe,
      completedAt,
    }),
  );
}

export function toSharedActive(session: WorkoutSession): SharedSessionResponse {
  return {
    workout: session.workout,
    startedAt: session.startedAt,
    finishedAt: null,
    results: withoutNotes(session),
  };
}

export function toSharedFinished(session: WorkoutSession): FinishedSharedSession {
  const results = withoutNotes(session);

  return {
    workout: session.workout,
    startedAt: session.startedAt,
    finishedAt: FINISHED_AT,
    results,
    exerciseCount: new Set(results.map((result) => result.workoutExerciseId)).size,
    setCount: results.length,
    totalVolume: results.reduce((sum, result) => sum + result.weight * result.reps, 0),
  };
}

export type SharedReply = { body: SharedSessionResponse } | { status: number } | { abort: true };

// последний ответ повторяется, пока тест не потребует другого
export async function mockShared(
  page: Page,
  replies: SharedReply[],
): Promise<{ calls: () => number }> {
  let calls = 0;
  await page.route(`**/api/shared/${SHARED_TOKEN}`, (route) => {
    const reply = replies[Math.min(calls, replies.length - 1)];
    calls += 1;
    if (!reply) return route.abort('failed');
    if ('abort' in reply) return route.abort('failed');
    if ('status' in reply) return route.fulfill({ status: reply.status, json: errorBody });

    return route.fulfill({ json: ok(reply.body) });
  });

  return { calls: () => calls };
}
