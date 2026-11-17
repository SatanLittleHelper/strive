import { expect, test, type Page } from '@playwright/test';
import { MOBILE_VIEWPORT } from './e2e.constants';
import { fullExercise, makeSession, setsOf } from './support/session.fixtures';
import { progressBar, saveButton } from './support/session.page';
import { startSessionServer } from './support/session.server';

const EXTRA_SET_NUMBER = 4;
const PLANNED_SETS = 3;
const EXERCISES = 3;

const progressValue = (page: Page): Promise<number> =>
  progressBar(page).evaluate((element: HTMLProgressElement) => element.value);

test.describe('прогресс тренировки', () => {
  test.use({ viewport: MOBILE_VIEWPORT });

  test('[fb-E26] подход сверх плана не входит в сумму прогресса', async ({ page }) => {
    await startSessionServer(page, {
      session: makeSession({
        results: [
          ...fullExercise(0),
          ...setsOf({ index: 0, setNumbers: [EXTRA_SET_NUMBER] }),
          ...setsOf({ index: 1, setNumbers: [1] }),
        ],
      }),
    });
    await page.goto('/workouts/session');

    // первое выполнено (1) + второе 1 из 3 подходов; дополнительный подход первого в сумму не входит
    await expect.poll(() => progressValue(page)).toBeCloseTo(1 + 1 / PLANNED_SETS);
    await expect(progressBar(page)).toHaveJSProperty('max', EXERCISES);
  });

  test('[fb-E45] индикатор растёт после сохранения подхода', async ({ page }) => {
    await startSessionServer(page, { session: makeSession({ results: fullExercise(0) }) });
    await page.goto('/workouts/session');
    await expect.poll(() => progressValue(page)).toBe(1);

    await saveButton(page).click();

    await expect.poll(() => progressValue(page)).toBeCloseTo(1 + 1 / PLANNED_SETS);
  });
});
