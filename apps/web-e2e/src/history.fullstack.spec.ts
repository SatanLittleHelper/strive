import { randomUUID } from 'node:crypto';
import { expect, test, type APIRequestContext, type APIResponse } from '@playwright/test';
import {
  DEVICE_ID_HEADER,
  type ApiResponse,
  type Workout,
  type WorkoutSession,
  type WorkoutSummary,
} from '@strive/api-interfaces';
import { API_URL, LEGS_WORKOUT_LINK, MOBILE_VIEWPORT } from './e2e.constants';

const DEVICE_STORAGE_KEY = 'strive.device-id';
const WORKOUT_NAME = 'Ноги';
const SETS = [
  { weight: 60, reps: 8 },
  { weight: 60, reps: 6 },
];
const EXPECTED_SUMMARY = '1 упражнение · 2 подхода';
const EXPECTED_VOLUME = '840 кг';

async function unwrap<T>(response: APIResponse): Promise<T> {
  expect(response.ok()).toBeTruthy();
  const body = (await response.json()) as ApiResponse<T>;
  if (!body.data) throw new Error('В ответе API нет data');

  return body.data;
}

async function finishWorkout(request: APIRequestContext, deviceId: string): Promise<void> {
  const headers = { [DEVICE_ID_HEADER]: deviceId };
  const workouts = await unwrap<WorkoutSummary[]>(
    await request.get(`${API_URL}/api/workouts`, { headers }),
  );
  const summary = workouts.find((item) => item.name === WORKOUT_NAME);
  if (!summary) throw new Error(`В seed нет тренировки «${WORKOUT_NAME}»`);

  const workout = await unwrap<Workout>(
    await request.get(`${API_URL}/api/workouts/${summary.id}`, { headers }),
  );
  const workoutExercise = workout.exercises[0];
  if (!workoutExercise) throw new Error('В тренировке нет упражнений');

  const session = await unwrap<WorkoutSession>(
    await request.post(`${API_URL}/api/sessions`, { headers, data: { workoutId: workout.id } }),
  );
  for (const [index, set] of SETS.entries()) {
    const saved = await request.put(
      `${API_URL}/api/sessions/${session.id}/sets/${workoutExercise.id}/${index + 1}`,
      { headers, data: set },
    );
    expect(saved.ok()).toBeTruthy();
  }
  const finished = await request.post(`${API_URL}/api/sessions/${session.id}/finish`, { headers });
  expect(finished.ok()).toBeTruthy();
}

test.describe('история на реальном API и засеянной БД', () => {
  test.use({ viewport: MOBILE_VIEWPORT });

  test('[H2-E16] завершённая тренировка видна в списке и в деталях с теми же подходами', async ({
    page,
    request,
  }) => {
    const deviceId = randomUUID();
    await page.addInitScript(({ key, id }) => localStorage.setItem(key, id), {
      key: DEVICE_STORAGE_KEY,
      id: deviceId,
    });
    await finishWorkout(request, deviceId);

    await page.goto('/history');
    const main = page.getByRole('main');
    const row = main.getByRole('link', { name: LEGS_WORKOUT_LINK });
    await expect(row).toContainText(EXPECTED_SUMMARY);
    await row.click();

    const sets = main.getByRole('listitem');
    await expect(sets).toHaveCount(SETS.length);
    await expect(sets.nth(0)).toContainText('60 кг × 8');
    await expect(sets.nth(1)).toContainText('60 кг × 6');
    await expect(main).toContainText(EXPECTED_VOLUME);
  });
});
