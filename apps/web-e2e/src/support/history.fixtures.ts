import type { Page, Route } from '@playwright/test';
import type { SessionSummary, SetResult, WorkoutSession } from '@strive/api-interfaces';
import { errorBody, makeSession, ok, savedSet } from './session.fixtures';

const FINISHED_AT = '2026-10-15T12:00:00.000Z';
export const SUMMARY_ID = 7;
export const BENCH_EXERCISE_ID = 2;
const SUMMARY_STARTED_AT = '2026-10-15T10:48:00.000Z';
const SUMMARY_VOLUME = 7450;
const SQUAT_EXERCISE_ID = 1;
const RESPONSE_DELAY_MS = 500;

interface FinishedSessionOptions {
  id: number;
  name: string;
  results?: SetResult[];
}

export function makeFinishedSession({
  id,
  name,
  results = [],
}: FinishedSessionOptions): WorkoutSession {
  const session = makeSession({ results });

  return { ...session, id, workout: { ...session.workout, name }, finishedAt: FINISHED_AT };
}

export function historySet(overrides: Partial<SetResult> = {}): SetResult {
  return savedSet({ rpe: null, ...overrides });
}

export function makeSummary(overrides: Partial<SessionSummary> = {}): SessionSummary {
  return {
    id: SUMMARY_ID,
    workoutId: 1,
    workoutName: 'Тренировка A',
    startedAt: SUMMARY_STARTED_AT,
    finishedAt: FINISHED_AT,
    exerciseCount: 2,
    setCount: 3,
    totalVolume: SUMMARY_VOLUME,
    exercises: [
      {
        exerciseId: BENCH_EXERCISE_ID,
        name: 'Жим лёжа',
        supersetGroup: null,
        sets: [
          historySet({ exerciseId: BENCH_EXERCISE_ID, setNumber: 1, weight: 60, reps: 8 }),
          historySet({ exerciseId: BENCH_EXERCISE_ID, setNumber: 2, weight: 60, reps: 6 }),
        ],
      },
      {
        exerciseId: SQUAT_EXERCISE_ID,
        name: 'Приседания со штангой',
        supersetGroup: null,
        sets: [historySet({ exerciseId: SQUAT_EXERCISE_ID, setNumber: 1, weight: 100, reps: 5 })],
      },
    ],
    ...overrides,
  };
}

export async function mockSessionList(page: Page, sessions: WorkoutSession[]) {
  await page.route('**/api/sessions', (route) => route.fulfill({ json: ok({ sessions }) }));
}

export async function mockSummary({
  page,
  id,
  response,
}: {
  page: Page;
  id: number | string;
  response: SessionSummary | { status: number };
}) {
  await page.route(`**/api/sessions/${id}/summary`, (route) =>
    'status' in response
      ? route.fulfill({ status: response.status, json: errorBody })
      : route.fulfill({ json: ok(response) }),
  );
}

export async function fulfillAfterDelay(route: Route, data: unknown) {
  await new Promise((resolve) => setTimeout(resolve, RESPONSE_DELAY_MS));
  await route.fulfill({ json: ok(data) });
}
