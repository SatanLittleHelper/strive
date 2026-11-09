import { randomUUID } from 'node:crypto';
import { expect, test, type Page } from '@playwright/test';
import { DEVICE_ID_HEADER } from '@strive/api-interfaces';
import { API_URL, LEGS_WORKOUT_LINK, MOBILE_VIEWPORT } from './e2e.constants';
import { fillSetForm } from './support/session.fixtures';
import { saveButton, todayGroup, weightField, repsField } from './support/session.page';

const DEVICE_STORAGE_KEY = 'strive.device-id';
const SEED_WEIGHT = '58';
const SEED_REPS = '15';
const DEFAULT_RPE = '3';
const UPDATED_WEIGHT = '65';
const EXTRA_RPE = '4';
const PLANNED_SETS = 3;
const EXTRA_SET_NUMBER = 4;

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
        .getByRole('radio', { name: DEFAULT_RPE }),
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

  test('правка через «Сегодня» меняет подход без дубликата', async ({ page }) => {
    await startLegsWorkout(page);
    await savePlannedSets(page, 2);
    await page.reload();
    await todayGroup(page).getByRole('button').first().click();
    await weightField(page).fill(UPDATED_WEIGHT);

    await page.getByRole('button', { name: 'Сохранить изменения' }).click();
    await page.reload();

    const rows = todayGroup(page).getByRole('button');
    await expect(rows).toHaveCount(2);
    await expect(rows.nth(0)).toContainText(`${UPDATED_WEIGHT} кг × ${SEED_REPS} повт.`);
  });

  async function finishWithExtraSet(page: Page): Promise<void> {
    await startLegsWorkout(page);
    await savePlannedSets(page, PLANNED_SETS);
    // после последнего планового подхода экран перешёл к следующему упражнению
    await page.getByRole('button', { name: 'Назад', exact: true }).click();
    await page.getByRole('button', { name: 'Ещё подход' }).click();
    await fillSetForm(page, { rpe: EXTRA_RPE }, EXTRA_SET_NUMBER);
    await saveButton(page).click();
    await expect(
      page.getByRole('img', { name: `Выполнено ${EXTRA_SET_NUMBER} из ${PLANNED_SETS} подходов` }),
    ).toBeVisible();
    await page.getByRole('button', { name: 'Завершить', exact: true }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Завершить', exact: true }).click();
    await expect(page).toHaveURL(/\/history$/);
    await page.getByRole('main').getByRole('link', { name: LEGS_WORKOUT_LINK }).click();
  }

  test('дополнительный подход виден в деталях завершённой тренировки', async ({ page }) => {
    await finishWithExtraSet(page);

    await expect(page.getByRole('main').getByRole('listitem')).toHaveCount(EXTRA_SET_NUMBER);
  });

  test('RPE дополнительного подхода виден в деталях', async ({ page }) => {
    await finishWithExtraSet(page);

    await expect(
      page
        .getByRole('main')
        .getByRole('listitem')
        .nth(EXTRA_SET_NUMBER - 1),
    ).toContainText(`RPE ${EXTRA_RPE}`);
  });
});
