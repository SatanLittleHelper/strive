import { expect, test, type Page } from '@playwright/test';
import { MOBILE_VIEWPORT } from './e2e.constants';
import { fullExercise, makeSession, setsOf } from './support/session.fixtures';
import { progressBar, saveButton, todayGroup } from './support/session.page';
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
  test('[rf-E2] подходы сверх плана видны в кольцах и «Сегодня», но не в прогрессе', async ({
    page,
  }) => {
    await startSessionServer(page, {
      session: makeSession({
        results: [...fullExercise(0), ...setsOf({ index: 0, setNumbers: [EXTRA_SET_NUMBER] })],
      }),
    });
    await page.goto('/workouts/session');
    // при открытии выбирается первое незавершённое упражнение, поэтому возвращаемся к первому
    await page.getByRole('button', { name: 'Назад', exact: true }).click();

    await expect(
      page.getByRole('img', { name: `Выполнено ${EXTRA_SET_NUMBER} из ${PLANNED_SETS} подходов` }),
    ).toBeVisible();
    await expect(todayGroup(page).getByRole('button')).toHaveCount(EXTRA_SET_NUMBER);
    await expect.poll(() => progressValue(page)).toBe(1);
  });

  test('[rf-E28] сегмент упражнения заполнен по доле плановых подходов', async ({ page }) => {
    await startSessionServer(page, {
      session: makeSession({ results: setsOf({ index: 0, setNumbers: [1] }) }),
    });
    await page.goto('/workouts/session');

    await expect.poll(() => progressValue(page)).toBeCloseTo(1 / PLANNED_SETS);
    await expect(progressBar(page)).toHaveJSProperty('max', EXERCISES);
    const ratios = await page.locator('[data-segment]').evaluateAll((items) =>
      items.map((item) => {
        const fill = item.firstElementChild;

        return (fill?.getBoundingClientRect().width ?? 0) / item.getBoundingClientRect().width;
      }),
    );
    expect(ratios[0]).toBeCloseTo(1 / PLANNED_SETS, 1);
    expect(ratios[1]).toBe(0);
    expect(ratios[2]).toBe(0);
  });

  test('[rf-E29] участники суперсета связаны в индикаторе, метки над упражнением нет', async ({
    page,
  }) => {
    await startSessionServer(page, { session: makeSession({ supersetGroups: [1, 1, null] }) });
    await page.goto('/workouts/session');

    const segments = page.locator('[data-segment]');
    await expect(segments.nth(0)).toHaveAttribute('data-group', '1');
    await expect(segments.nth(1)).toHaveAttribute('data-group', '1');
    await expect(segments.nth(2)).not.toHaveAttribute('data-group', /.+/);
    const boxes = await segments.evaluateAll((items) =>
      items.map((item) => item.getBoundingClientRect()),
    );
    const withinGroup = boxes[1].left - boxes[0].right;
    const betweenGroups = boxes[2].left - boxes[1].right;
    expect(withinGroup).toBeGreaterThan(0);
    expect(withinGroup).toBeLessThan(betweenGroups);
    await expect(page.locator('[data-superset]')).toHaveCount(1);
    await expect(page.getByText(/^Суперсет/)).toHaveCount(0);
  });
});
