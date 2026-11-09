import { randomUUID } from 'node:crypto';
import { expect, test, type Page } from '@playwright/test';
import { MOBILE_VIEWPORT } from './e2e.constants';
import { fillSetForm } from './support/session.fixtures';
import { exerciseHeading, saveButton } from './support/session.page';
import { createSupersetWorkout, type SupersetWorkout } from './support/superset.db';

const DEVICE_STORAGE_KEY = 'strive.device-id';
const WEIGHT = '40';
const REPS = '8';
const SETS_PER_ROW = 2;
const GROUP_LENGTH = 2;

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

  async function saveSet(page: Page, setNumber = 1): Promise<void> {
    await fillSetForm(page, { weight: WEIGHT, reps: REPS }, setNumber);
    await saveButton(page).click();
  }

  test('[E13] тренировка с повтором упражнения проходит на реальном API', async ({ page }) => {
    const workout = state.workout;
    if (!workout) throw new Error('Тренировка не создана');
    const { block, lateral, french } = workout.exerciseNames;
    await page.goto('/workouts');
    await page.getByRole('link', { name: new RegExp(workout.workoutName) }).click();
    await page.getByRole('button', { name: 'Начать', exact: true }).click();
    await expect(page).toHaveURL(/\/workouts\/session$/);

    // порядок экрана: Блок №1, Махи(2) №1, Блок №2, Махи(2) №2, Махи(3) №1, Французский №1, Махи(3) №2, Французский №2
    for (const [index, name] of [
      block,
      lateral,
      block,
      lateral,
      lateral,
      french,
      lateral,
      french,
    ].entries()) {
      await expect(exerciseHeading(page, name)).toBeVisible();
      await saveSet(page, Math.floor((index % (GROUP_LENGTH * SETS_PER_ROW)) / GROUP_LENGTH) + 1);
    }
    await page.getByRole('button', { name: 'Завершить', exact: true }).first().click();
    await expect(page).toHaveURL(/\/history$/);
    await page
      .getByRole('main')
      .getByRole('link', { name: new RegExp(workout.workoutName) })
      .click();

    await expect(page.getByRole('heading', { level: 2 })).toHaveText([
      block,
      lateral,
      lateral,
      french,
    ]);
    const cards = page.getByRole('main').locator('section[tuiCardLarge]');
    const expectedNames = [block, lateral, lateral, french];
    await expect(cards).toHaveCount(expectedNames.length);
    for (const index of expectedNames.keys()) {
      await expect(cards.nth(index).getByRole('listitem')).toHaveCount(SETS_PER_ROW);
    }
    await expect(page.getByRole('main').getByRole('listitem')).toHaveCount(
      expectedNames.length * SETS_PER_ROW,
    );
  });
});
