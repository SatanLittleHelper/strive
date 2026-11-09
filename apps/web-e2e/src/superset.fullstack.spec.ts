import { randomUUID } from 'node:crypto';
import { expect, test, type Page } from '@playwright/test';
import { MOBILE_VIEWPORT } from './e2e.constants';
import { fillSetForm } from './support/session.fixtures';
import { exerciseHeading, saveButton } from './support/session.page';
import { createSupersetWorkout, type SupersetWorkout } from './support/superset.db';

const DEVICE_STORAGE_KEY = 'strive.device-id';
const WEIGHT = '40';
const REPS = '8';

test.describe('суперсет на реальном API', () => {
  test.use({ viewport: MOBILE_VIEWPORT });

  const state: { workout?: SupersetWorkout } = {};

  test.beforeEach(async ({ page }) => {
    state.workout = await createSupersetWorkout();
    await page.addInitScript(({ key, id }) => localStorage.setItem(key, id), {
      key: DEVICE_STORAGE_KEY,
      id: randomUUID(),
    });
  });

  test.afterEach(async () => {
    await state.workout?.cleanup();
  });

  async function saveSet(page: Page, setNumber: number): Promise<void> {
    await fillSetForm(page, { weight: WEIGHT, reps: REPS }, setNumber);
    await saveButton(page).click();
  }

  test('[E9] тренировка с суперсетом завершается, подходы видны в истории', async ({ page }) => {
    const workout = state.workout;
    if (!workout) throw new Error('Тренировка не создана');
    const [a1, a2, b] = workout.exerciseNames;
    await page.goto('/workouts');
    await page.getByRole('link', { name: new RegExp(workout.workoutName) }).click();
    await page.getByRole('button', { name: 'Начать', exact: true }).click();
    await expect(page).toHaveURL(/\/workouts\/session$/);

    // A1 №1, A2 №1, A1 №2, A2 №2, затем B №1
    await expect(exerciseHeading(page, a1)).toBeVisible();
    await saveSet(page, 1);
    await expect(exerciseHeading(page, a2)).toBeVisible();
    await saveSet(page, 1);
    await expect(exerciseHeading(page, a1)).toBeVisible();
    await saveSet(page, 2);
    await expect(exerciseHeading(page, a2)).toBeVisible();
    await saveSet(page, 2);
    await expect(exerciseHeading(page, b)).toBeVisible();
    await saveSet(page, 1);
    await page.getByRole('button', { name: 'Завершить', exact: true }).first().click();
    await expect(page).toHaveURL(/\/history$/);
    await page
      .getByRole('main')
      .getByRole('link', { name: new RegExp(workout.workoutName) })
      .click();

    for (const [name, count] of [
      [a1, 2],
      [a2, 2],
      [b, 1],
    ] as const) {
      await expect(
        page.locator('section[tuiCardLarge]', { hasText: name }).getByRole('listitem'),
      ).toHaveCount(count);
    }
  });
});
