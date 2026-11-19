import { expect, test } from '@playwright/test';
import { historyOf, makeSession, savedSet } from './support/session.fixtures';
import { startSessionServer } from './support/session.server';
import { VISUAL_NOW, VISUAL_STYLES, VISUAL_USE } from './support/visual';

const WEIGHTS = [8, 62.5, 100];
const TIMES = ['19:10', '19:15', '19:21', '19:27', '19:34'];
const pastSets = [1, 2, 3, 4, 5].map((rpe, index) =>
  savedSet({
    workoutExerciseId: 1,
    setNumber: index + 1,
    rpe,
    weight: WEIGHTS[index % WEIGHTS.length],
    reps: 6 + index,
    completedAt: `2026-10-20T${TIMES[index]}:00.000Z`,
  }),
);

test.describe('история против макета', () => {
  test.use(VISUAL_USE);
  // эталоны сняты в Chromium: в других движках шрифты сглаживаются иначе
  test.skip(({ browserName }) => browserName !== 'chromium');

  test('[rf-E33] история с RPE-цветами совпадает с эталоном', async ({ page }) => {
    await page.clock.install({ time: VISUAL_NOW });
    await startSessionServer(page, {
      session: makeSession({
        results: pastSets.slice(0, 2).map((set, index) => ({
          ...set,
          completedAt: `2026-11-02T${index === 0 ? '18:37' : '18:42'}:00.000Z`,
        })),
      }),
      history: historyOf(1, [
        { sessionId: 3, finishedAt: '2026-10-20T10:00:00.000Z', sets: pastSets },
      ]),
    });
    await page.goto('/workouts/session');

    await expect(page.getByRole('region', { name: 'История упражнения' })).toHaveScreenshot(
      'history-rpe.png',
      { stylePath: VISUAL_STYLES },
    );
  });
});
