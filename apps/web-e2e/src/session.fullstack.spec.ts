import { randomUUID } from 'node:crypto';
import { expect, test, type APIRequestContext, type Page } from '@playwright/test';
import {
  DEFAULT_RPE,
  DEVICE_ID_HEADER,
  type WorkoutSession,
  type WorkoutSummary,
} from '@strive/api-interfaces';
import { API_URL, LEGS_WORKOUT_LINK, MOBILE_VIEWPORT } from './e2e.constants';
import { fillSetForm } from './support/session.fixtures';
import {
  bottomFinishButton,
  saveButton,
  todayGroup,
  todayRow,
  weightField,
  repsField,
} from './support/session.page';
import { swipeRow } from './support/swipe';

const DEVICE_STORAGE_KEY = 'strive.device-id';
const SEED_WEIGHT = '58';
const SEED_REPS = '15';
const DEFAULT_RPE_LABEL = '3';
const FALLBACK_WEIGHT = 20;
const UPDATED_WEIGHT = '65';
const PLANNED_SETS = 3;

test.afterEach(async ({ page, request }) => {
  // У каждого browser context своё устройство; завершаем оставшуюся сессию даже после ошибки теста.
  const deviceId = await page
    .evaluate((key) => localStorage.getItem(key), DEVICE_STORAGE_KEY)
    .catch(() => null);
  if (!deviceId) return;
  const headers = { [DEVICE_ID_HEADER]: deviceId };
  const active = await request.get(`${API_URL}/api/sessions/active`, { headers });
  expect(active.ok()).toBeTruthy();
  const body = await active.json();
  if (body.data.session) {
    const finish = await request.post(`${API_URL}/api/sessions/${body.data.session.id}/finish`, {
      headers,
    });
    expect(finish.ok()).toBeTruthy();
  }
});

test.describe('выполнение тренировки на реальном API', () => {
  test.use({ viewport: MOBILE_VIEWPORT });

  test.beforeEach(async ({ page }) => {
    await page.addInitScript(({ key, id }) => localStorage.setItem(key, id), {
      key: DEVICE_STORAGE_KEY,
      id: randomUUID(),
    });
  });

  async function startLegsWorkout(page: Page): Promise<void> {
    await page.goto('/workouts');
    await page.getByRole('link', { name: LEGS_WORKOUT_LINK }).click();
    await page.getByRole('button', { name: 'Начать', exact: true }).click();
    await expect(page).toHaveURL(/\/workouts\/session$/);
  }

  async function savePlannedSets(page: Page, count: number): Promise<void> {
    for (let setNumber = 1; setNumber <= count; setNumber += 1) {
      await expect(page.getByRole('form', { name: `Подход ${setNumber}` })).toBeVisible();
      await saveButton(page).click();
      if (setNumber < PLANNED_SETS) {
        await expect(
          page.getByRole('img', { name: `Выполнено ${setNumber} из ${PLANNED_SETS} подходов` }),
        ).toBeVisible();
      } else {
        await expect(
          page.getByRole('heading', { name: 'Ягодичный мост в тренажере', level: 2 }),
        ).toBeVisible();
      }
    }
  }

  test('первый подход «Ноги» предзаполнен целью из seed', async ({ page }) => {
    await startLegsWorkout(page);

    await expect(weightField(page)).toHaveValue(SEED_WEIGHT);
    await expect(repsField(page)).toHaveValue(SEED_REPS);
    await expect(
      page
        .getByRole('radiogroup', { name: 'RPE от 1 до 5' })
        .getByRole('radio', { name: DEFAULT_RPE_LABEL }),
    ).toBeChecked();
  });

  test('сохранённые подходы переживают перезагрузку', async ({ page }) => {
    await startLegsWorkout(page);
    await savePlannedSets(page, 2);

    await page.reload();

    const rows = todayGroup(page).getByRole('button');
    await expect(rows).toHaveCount(2);
    await expect(rows.nth(0)).toContainText(`${SEED_WEIGHT} кг × ${SEED_REPS} повт.`);
    await expect(rows.nth(1)).toContainText(`${SEED_WEIGHT} кг × ${SEED_REPS} повт.`);
  });

  test('[E47] правка через «Сегодня» меняет подход без дубликата @touch', async ({ page }) => {
    await startLegsWorkout(page);
    await savePlannedSets(page, 2);
    await page.reload();
    await swipeRow(page, { from: todayRow(page, -1), direction: 'left' });
    await weightField(page).fill(UPDATED_WEIGHT);

    await page.getByRole('button', { name: 'Сохранить изменения' }).click();
    await expect(page.getByRole('form', { name: 'Подход 3' })).toBeVisible();
    await page.reload();

    const rows = todayGroup(page).getByRole('button');
    await expect(rows).toHaveCount(2);
    await expect(rows.nth(1)).toContainText(`${UPDATED_WEIGHT} кг × ${SEED_REPS} повт.`);
  });

  async function savePlanViaApi(page: Page, request: APIRequestContext): Promise<number> {
    await page.goto('/');
    const deviceId = await page.evaluate((key) => localStorage.getItem(key), DEVICE_STORAGE_KEY);
    const headers = { [DEVICE_ID_HEADER]: deviceId ?? '' };
    const catalog = (await (await request.get(`${API_URL}/api/workouts`, { headers })).json()) as {
      data: WorkoutSummary[];
    };
    const legs = catalog.data.find((workout) => LEGS_WORKOUT_LINK.test(workout.name));
    if (!legs) throw new Error('Тренировка «Ноги» не найдена в seed');
    const started = (await (
      await request.post(`${API_URL}/api/sessions`, { headers, data: { workoutId: legs.id } })
    ).json()) as { data: WorkoutSession };
    const { id, workout } = started.data;
    for (const exercise of workout.exercises) {
      for (let setNumber = 1; setNumber <= exercise.sets; setNumber += 1) {
        const saved = await request.put(
          `${API_URL}/api/sessions/${id}/sets/${exercise.id}/${setNumber}`,
          {
            headers,
            data: {
              weight: exercise.weight ?? FALLBACK_WEIGHT,
              reps: exercise.reps,
              rpe: DEFAULT_RPE,
              note: null,
            },
          },
        );
        expect(saved.ok()).toBeTruthy();
      }
    }

    return workout.exercises.reduce((total, exercise) => total + exercise.sets, 0);
  }

  test('[rf-E3] тренировка завершается без добавления подходов', async ({ page, request }) => {
    // seed-тренировка «Ноги» содержит суперсет и упражнение без веса: все плановые подходы кладём через API
    const plannedTotal = await savePlanViaApi(page, request);
    await page.goto('/workouts/session');

    await bottomFinishButton(page).click();
    await expect(page).toHaveURL(/\/history\/\d+$/);

    await expect(page.getByRole('main').getByRole('listitem')).toHaveCount(plannedTotal);
  });

  test('[rf-E6] пустой вес сохраняется как 0 в истории', async ({ page }) => {
    await startLegsWorkout(page);
    await fillSetForm(page, { weight: '' }, 1);
    await saveButton(page).click();
    await expect(
      page.getByRole('img', { name: `Выполнено 1 из ${PLANNED_SETS} подходов` }),
    ).toBeVisible();
    await page.getByRole('button', { name: 'Завершить', exact: true }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Завершить', exact: true }).click();
    await expect(page).toHaveURL(/\/history\/\d+$/);

    await expect(page.getByRole('main').getByRole('listitem').first()).toContainText('0 кг');
  });
});
