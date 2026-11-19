import { expect, test } from '@playwright/test';
import { makeSession, setsOf } from './support/session.fixtures';
import { startSessionServer } from './support/session.server';
import { VISUAL_NOW, VISUAL_STYLES, VISUAL_USE } from './support/visual';

test.describe('индикатор прогресса против макета', () => {
  test.use(VISUAL_USE);
  // эталоны сняты в Chromium: в других движках шрифты сглаживаются иначе
  test.skip(({ browserName }) => browserName !== 'chromium');

  test('[rf-E30] индикатор с частичным прогрессом и суперсетом совпадает с эталоном', async ({
    page,
  }) => {
    await page.clock.install({ time: VISUAL_NOW });
    await startSessionServer(page, {
      session: makeSession({
        supersetGroups: [1, 1, null],
        results: setsOf({ index: 0, setNumbers: [1] }),
      }),
    });
    await page.goto('/workouts/session');

    await expect(page.getByTestId('progress-segments')).toHaveScreenshot(
      'progress-partial-superset.png',
      { stylePath: VISUAL_STYLES, maxDiffPixels: 0 },
    );
  });
});
