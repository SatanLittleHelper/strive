import { expect, test } from '@playwright/test';
import { MOBILE_VIEWPORT } from './e2e.constants';
import { fullExercise, makeSession } from './support/session.fixtures';
import { setForm } from './support/session.page';
import { startSessionServer } from './support/session.server';

test.describe('подходы только по плану', () => {
  test.use({ viewport: MOBILE_VIEWPORT });

  test('[rf-E1] карточка «Упражнение выполнено» без кнопки добавления подхода', async ({
    page,
  }) => {
    await startSessionServer(page, {
      session: makeSession({ exerciseCount: 1, results: fullExercise(0) }),
    });
    await page.goto('/workouts/session');

    await expect(page.getByRole('region', { name: 'Упражнение выполнено' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Ещё подход' })).toHaveCount(0);
    await expect(setForm(page)).toHaveCount(0);
  });
});
