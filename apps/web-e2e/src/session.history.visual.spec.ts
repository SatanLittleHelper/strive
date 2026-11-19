import { expect, test } from '@playwright/test';
import { MOBILE_VIEWPORT } from './e2e.constants';
import { historyOf, makeSession, savedSet, setsOf } from './support/session.fixtures';
import { startSessionServer } from './support/session.server';

const TODAY_ROWS = 2;
const WEIGHTS = [8, 62.5, 100];
const RPES = [1, 2, 3, 4, 5];
const pastSets = RPES.map((rpe, index) =>
  savedSet({
    workoutExerciseId: 1,
    setNumber: index + 1,
    rpe,
    weight: WEIGHTS[index % WEIGHTS.length],
    reps: 6 + index,
  }),
);
const history = historyOf(1, [
  { sessionId: 3, finishedAt: '2026-10-20T10:00:00.000Z', sets: pastSets },
]);

test.describe('строки истории', () => {
  test.use({ viewport: MOBILE_VIEWPORT, timezoneId: 'UTC' });

  test('[rf-E31] RPE читается без цвета', async ({ page }) => {
    await startSessionServer(page, { session: makeSession(), history });
    await page.goto('/workouts/session');

    for (const rpe of RPES) {
      await expect(page.getByRole('img', { name: `RPE ${rpe} из 5` })).toBeVisible();
    }
    const group = page.getByRole('group', { name: '20.10.2026' });
    await expect(group).toContainText('RPE 5');
    await expect(group.locator('[data-col="time"]').first()).toContainText('12:00');
    await expect(group.getByRole('img', { name: 'RPE 1 из 5' }).locator('progress')).toHaveCount(0);
    await expect(group).not.toContainText('Подход 1');
  });

  test('[rf-E31] время подхода показано без подписи номера и полоски RPE', async ({ page }) => {
    await startSessionServer(page, { session: makeSession(), history });
    await page.goto('/workouts/session');
    const group = page.getByRole('group', { name: '20.10.2026' });

    await expect(group.locator('[data-col="time"]').first()).toHaveText('12:00');
    await expect(group.locator('progress')).toHaveCount(0);
    await expect(group).not.toContainText('Подход 1');
  });

  test('[rf-E32] значения в строках выровнены по столбцам', async ({ page }) => {
    await startSessionServer(page, {
      session: makeSession({ results: setsOf({ index: 0, setNumbers: [1, 2] }) }),
      history,
    });
    await page.goto('/workouts/session');
    await expect(page.getByRole('group', { name: '20.10.2026' })).toBeVisible();

    // две строки «Сегодня» и пять строк прошлой даты
    for (const column of ['time', 'weight', 'rpe']) {
      const cells = page.locator(`[data-col="${column}"]`);
      await expect(cells).toHaveCount(TODAY_ROWS + RPES.length);
      const lefts = await cells.evaluateAll((items) =>
        items.map((item) => Math.round(item.getBoundingClientRect().left)),
      );
      expect(new Set(lefts).size).toBe(1);
    }
  });
});
