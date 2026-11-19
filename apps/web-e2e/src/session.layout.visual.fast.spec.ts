import { expect, test } from '@playwright/test';
import { makeLongNameSession, makeSession } from './support/session.fixtures';
import { startSessionServer } from './support/session.server';
import { VISUAL_NOW, VISUAL_STYLES, VISUAL_USE } from './support/visual';

test.describe('экран тренировки против макетов', () => {
  test.use(VISUAL_USE);
  // эталоны сняты в Chromium: в других движках шрифты сглаживаются иначе
  test.skip(({ browserName }) => browserName !== 'chromium');

  test('[rf-E36] мобильные кольца и заголовок совпадают с эталоном', async ({ page }) => {
    await page.clock.install({ time: VISUAL_NOW });
    await startSessionServer(page, { session: makeSession({ supersetGroups: [1, 1, null] }) });
    await page.goto('/workouts/session');

    await expect(page.getByRole('main')).toHaveScreenshot('workout-mobile.png', {
      stylePath: VISUAL_STYLES,
    });
  });

  test('[rf-E37] экран с длинным названием совпадает с эталоном', async ({ page }) => {
    await page.clock.install({ time: VISUAL_NOW });
    await startSessionServer(page, {
      session: makeLongNameSession({ supersetGroups: [1, 1, null] }),
    });
    await page.goto('/workouts/session');

    await expect(page.getByRole('main')).toHaveScreenshot('workout-long-name.png', {
      stylePath: VISUAL_STYLES,
    });
  });
});
