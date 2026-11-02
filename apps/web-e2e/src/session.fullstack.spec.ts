import { randomUUID } from 'node:crypto';
import { expect, test, type Page } from '@playwright/test';
import { DEVICE_ID_HEADER } from '@strive/api-interfaces';
import { API_URL, MOBILE_VIEWPORT } from './e2e.constants';
import { fillSetForm } from './support/session.fixtures';

const DEVICE_STORAGE_KEY = 'strive.device-id';
const WEIGHT = '60';
const UPDATED_WEIGHT = '65';
const REPS = '8';
const RPE = '3';
const NOTE = 'Контроль техники';

async function fillSet(page: Page): Promise<void> {
  await fillSetForm(page, { weight: WEIGHT, reps: REPS, rpe: RPE, note: NOTE });
}

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
    const deviceId = randomUUID();
    await page.addInitScript(({ key, id }) => localStorage.setItem(key, id), {
      key: DEVICE_STORAGE_KEY,
      id: deviceId,
    });
  });

  test('старт, сохранение и правка, перезагрузка, продолжение и завершение', async ({ page }) => {
    await page.goto('/workouts');
    await page.getByRole('link', { name: /Тренировка A/ }).click();
    await page.getByRole('button', { name: 'Начать', exact: true }).click();
    await expect(page).toHaveURL(/\/workouts\/session$/);
    await expect(page.getByRole('heading', { name: /Тренировка A/ })).toBeVisible();
    await fillSet(page);
    await page.getByRole('button', { name: 'Сохранить подход' }).click();
    await expect(page.getByText(/^Выполнено 1\//)).toBeVisible();

    await page.reload();
    const saved = page.getByRole('button', { name: /Подход 1.*Выполнен/ }).first();
    await expect(saved).toContainText(`${WEIGHT} кг × ${REPS}`);
    await saved.click();
    const form = page.getByRole('form', { name: 'Подход 1' }).first();
    await expect(form.getByLabel('Вес, кг', { exact: true })).toHaveValue(WEIGHT);
    await expect(form.getByLabel('Повторы', { exact: true })).toHaveValue(REPS);
    await expect(form.getByLabel('RPE (1–5, необязательно)', { exact: true })).toHaveValue(RPE);
    await expect(form.getByLabel('Заметка', { exact: true })).toHaveValue(NOTE);
    await form.getByLabel('Вес, кг', { exact: true }).fill(UPDATED_WEIGHT);
    await form.getByRole('button', { name: 'Сохранить подход' }).click();
    await expect(saved).toContainText(`${UPDATED_WEIGHT} кг × ${REPS}`);
    await expect(page.getByText(/^Выполнено 1\//)).toBeVisible();

    await page.getByRole('link', { name: 'Главная', exact: true }).click();
    await expect(page.getByRole('status')).toHaveCount(1);
    await page.getByRole('link', { name: 'Продолжить', exact: true }).click();
    await expect(page).toHaveURL(/\/workouts\/session$/);
    const finish = page.getByRole('button', { name: 'Завершить', exact: true });
    await finish.scrollIntoViewIfNeeded();
    await expect(finish).toBeInViewport();
    const finishBox = await finish.boundingBox();
    const navBox = await page.getByRole('navigation', { name: 'Основная навигация' }).boundingBox();
    expect(finishBox).not.toBeNull();
    expect(navBox).not.toBeNull();
    expect((finishBox?.y ?? 0) + (finishBox?.height ?? 0)).toBeLessThanOrEqual(navBox?.y ?? 0);
    await finish.click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toContainText('Не все подходы выполнены');
    await dialog.getByRole('button', { name: 'Завершить', exact: true }).click();
    await expect(page).toHaveURL(/\/history$/);
    const activeResponse = page.waitForResponse((response) =>
      response.url().endsWith('/api/sessions/active'),
    );
    await page.getByRole('link', { name: 'Главная', exact: true }).click();
    expect((await (await activeResponse).json()).data.session).toBeNull();
    await expect(page.getByRole('link', { name: 'Продолжить', exact: true })).toHaveCount(0);
    await page.reload();
    await expect(page.getByRole('status')).toHaveText('API работает');
    await expect(page.getByRole('link', { name: 'Продолжить', exact: true })).toHaveCount(0);
  });
});

const SEED_SQUAT_WEIGHT = 60;
const SEED_SQUAT_REPS = '6';
const DEFAULT_RPE_TEXT = '3';
const HISTORY_WEIGHT = '55';
const HISTORY_REPS = '8';

test.describe('предзаполнение и история на реальном API', () => {
  test.use({ viewport: MOBILE_VIEWPORT });

  test.beforeEach(async ({ page }) => {
    await page.addInitScript(({ key, id }) => localStorage.setItem(key, id), {
      key: DEVICE_STORAGE_KEY,
      id: randomUUID(),
    });
  });

  async function startWorkoutA(page: Page): Promise<void> {
    await page.goto('/workouts');
    await page.getByRole('link', { name: /Тренировка A/ }).click();
    await page.getByRole('button', { name: 'Начать', exact: true }).click();
    await expect(page).toHaveURL(/\/workouts\/session$/);
  }

  test('первый подход «Тренировки A» предзаполнен значениями из seed', async ({ page }) => {
    await startWorkoutA(page);
    const form = page.getByRole('form', { name: 'Подход 1' });

    await expect(form.getByLabel('Вес, кг', { exact: true })).toHaveValue(
      String(SEED_SQUAT_WEIGHT),
    );
    await expect(form.getByLabel('Повторы', { exact: true })).toHaveValue(SEED_SQUAT_REPS);
    await expect(form.getByLabel('RPE (1–5, необязательно)', { exact: true })).toHaveValue(
      DEFAULT_RPE_TEXT,
    );
  });

  test('история прошлой тренировки приходит с реального API', async ({ page }) => {
    await startWorkoutA(page);
    await fillSetForm(page, { weight: HISTORY_WEIGHT, reps: HISTORY_REPS });
    await page.getByRole('button', { name: 'Сохранить подход' }).click();
    await expect(page.getByText(/^Выполнено 1\//)).toBeVisible();
    await page.getByRole('button', { name: 'Завершить', exact: true }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Завершить', exact: true }).click();
    await expect(page).toHaveURL(/\/history$/);

    await startWorkoutA(page);
    await page.getByRole('button', { name: 'Прошлые тренировки' }).click();

    await expect(
      page.getByRole('button', { name: new RegExp(`${HISTORY_WEIGHT} кг × ${HISTORY_REPS}`) }),
    ).toBeVisible();
  });
});
