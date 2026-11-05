import { randomUUID } from 'node:crypto';
import { expect, test } from '@playwright/test';
import { MOBILE_VIEWPORT } from './e2e.constants';
import { fillSetForm } from './support/session.fixtures';

const DEVICE_STORAGE_KEY = 'strive.device-id';
const WORKOUT_NAME = /Тренировка A/;
const FIRST_SET = { weight: '60', reps: '8' };
const SECOND_SET = { weight: '60', reps: '6' };
const EXPECTED_SUMMARY = '1 упражнение · 2 подхода';
const EXPECTED_VOLUME = '840 кг';

test.describe('сквозной сценарий на реальном API', () => {
  test.use({ viewport: MOBILE_VIEWPORT });

  test.beforeEach(async ({ page }) => {
    await page.addInitScript(({ key, id }) => localStorage.setItem(key, id), {
      key: DEVICE_STORAGE_KEY,
      id: randomUUID(),
    });
  });

  test('[P2-E1] подходы, записанные в тренировке, видны в истории', async ({ page }) => {
    await page.goto('/workouts');
    const workoutLink = page.getByRole('link', { name: WORKOUT_NAME });
    await expect(workoutLink).toBeVisible();
    await workoutLink.click();
    await page.getByRole('button', { name: 'Начать', exact: true }).click();
    await expect(page).toHaveURL(/\/workouts\/session$/);

    await fillSetForm(page, FIRST_SET, 1);
    await page.getByRole('button', { name: 'Сохранить подход' }).click();
    await expect(page.getByText(/^Выполнено 1\//)).toBeVisible();
    await fillSetForm(page, SECOND_SET, 2);
    await page.getByRole('button', { name: 'Сохранить подход' }).click();
    await expect(page.getByText(/^Выполнено 2\//)).toBeVisible();

    await page.getByRole('button', { name: 'Завершить', exact: true }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Завершить', exact: true }).click();
    await expect(page).toHaveURL(/\/history$/);

    const main = page.getByRole('main');
    const row = main.getByRole('link', { name: WORKOUT_NAME });
    await test.step('список', async () => {
      await expect(row).toContainText(EXPECTED_SUMMARY);
    });

    await test.step('детали', async () => {
      await row.click();
      const sets = main.getByRole('listitem');
      await expect(sets).toHaveCount(2);
      await expect(sets.nth(0)).toContainText('60 кг × 8');
      await expect(sets.nth(1)).toContainText('60 кг × 6');
      await expect(main).toContainText(EXPECTED_VOLUME);
    });
  });
});
