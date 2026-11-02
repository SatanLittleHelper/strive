import { expect, type Page } from '@playwright/test';
import type {
  SessionHistoryResponse,
  SetResult,
  WorkoutExercise,
  WorkoutSession,
} from '@strive/api-interfaces';

export const ok = (data: unknown) => ({ success: true, message: null, data, details: null });
export const errorBody = { success: false, message: 'Ошибка', data: null, details: null };

const SESSION_ID = 1;
const STARTED_AT = '2026-11-02T12:00:00.000Z';
const DEFAULT_EXERCISE_COUNT = 3;
const SETS_PER_EXERCISE = 3;
const REPS_MIN = 6;
const REPS_MAX = 8;
export const PLAN_WEIGHT = 60;

const EXERCISE_NAMES = ['Приседания со штангой', 'Жим лёжа', 'Тяга штанги в наклоне'];

export interface SessionOptions {
  exerciseCount?: number;
  weight?: number | null;
  results?: SetResult[];
}

export function exerciseId(index: number): number {
  return index + 1;
}

export function savedSet(overrides: Partial<SetResult> = {}): SetResult {
  return {
    exerciseId: 1,
    setNumber: 1,
    weight: 62.5,
    reps: 7,
    rpe: 4,
    note: null,
    completedAt: STARTED_AT,
    ...overrides,
  };
}

export function makeSession({
  exerciseCount = DEFAULT_EXERCISE_COUNT,
  weight = PLAN_WEIGHT,
  results = [],
}: SessionOptions = {}): WorkoutSession {
  const exercises: WorkoutExercise[] = Array.from({ length: exerciseCount }, (_, index) => ({
    exercise: { id: exerciseId(index), name: EXERCISE_NAMES[index] ?? `Упражнение ${index + 1}` },
    position: index + 1,
    sets: SETS_PER_EXERCISE,
    repsMin: REPS_MIN,
    repsMax: REPS_MAX,
    weight,
  }));

  return {
    id: SESSION_ID,
    workout: { id: 1, name: 'Тренировка A', description: null, exercises },
    startedAt: STARTED_AT,
    finishedAt: null,
    results,
  };
}

export function fullExercise(index: number): SetResult[] {
  return Array.from({ length: SETS_PER_EXERCISE }, (_, setIndex) =>
    savedSet({ exerciseId: exerciseId(index), setNumber: setIndex + 1 }),
  );
}

export async function mockActive(page: Page, session: WorkoutSession | null = makeSession()) {
  await page.route('**/api/sessions/active', (route) => route.fulfill({ json: ok({ session }) }));
}

export async function mockHistory(
  page: Page,
  response: SessionHistoryResponse | { status: number } = { exercises: [] },
) {
  await page.route(`**/api/sessions/${SESSION_ID}/history`, (route) =>
    'status' in response
      ? route.fulfill({ status: response.status, json: errorBody })
      : route.fulfill({ json: ok(response) }),
  );
}

export async function fillSetForm(
  page: Page,
  values: { weight?: string; reps?: string; rpe?: string; note?: string },
  setNumber = 1,
) {
  const form = page.getByRole('form', { name: `Подход ${setNumber}` });
  await expect(form).toBeVisible();
  if (values.weight !== undefined)
    await form.getByLabel('Вес, кг', { exact: true }).fill(values.weight);
  if (values.reps !== undefined)
    await form.getByLabel('Повторы', { exact: true }).fill(values.reps);
  if (values.rpe !== undefined)
    await form.getByLabel('RPE (1–5, необязательно)', { exact: true }).fill(values.rpe);
  if (values.note !== undefined)
    await form.getByLabel('Заметка', { exact: true }).fill(values.note);
}
