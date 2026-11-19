import { expect, test, type Page } from '@playwright/test';
import { MOBILE_VIEWPORT } from './e2e.constants';
import { LONG_EXERCISE_NAME, makeLongNameSession } from './support/session.fixtures';
import { position, repsField, saveButton, weightField } from './support/session.page';
import { startSessionServer } from './support/session.server';

const LARGE_ROOT_FONT = 'html { font-size: 32px }';

const hasNoHorizontalScroll = (page: Page) =>
  page.getByRole('main').evaluate((main) => main.scrollWidth <= main.clientWidth);

test.describe('вёрстка экрана тренировки', () => {
  test.use({ viewport: MOBILE_VIEWPORT });

  test('[rf-E34] длинное название не ломает вёрстку', async ({ page }) => {
    await startSessionServer(page, { session: makeLongNameSession() });
    await page.goto('/workouts/session');

    const heading = page.getByRole('heading', { name: LONG_EXERCISE_NAME, level: 2 });
    await expect(heading).toBeVisible();
    const box = await heading.boundingBox();
    expect((box?.x ?? 0) + (box?.width ?? 0)).toBeLessThanOrEqual(MOBILE_VIEWPORT.width);
    await expect(position({ page, current: 1, total: 3 })).toHaveClass(/sr-only/);
    await expect(heading.locator('span')).toHaveCSS('-webkit-line-clamp', '2');
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= document.documentElement.clientWidth,
      ),
    ).toBe(true);
  });

  test('[rf-E35] крупный шрифт не ломает вёрстку', async ({ page }) => {
    await startSessionServer(page);
    await page.goto('/workouts/session');
    await page.addStyleTag({ content: LARGE_ROOT_FONT });

    await expect(weightField(page)).toBeVisible();
    await expect(repsField(page)).toBeVisible();
    await expect(saveButton(page)).toBeVisible();
    await expect(page.getByRole('button', { name: 'Назад', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Далее', exact: true })).toBeVisible();
    expect(await hasNoHorizontalScroll(page)).toBe(true);
  });
});
