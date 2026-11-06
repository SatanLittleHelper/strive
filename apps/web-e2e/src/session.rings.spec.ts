import { expect, test } from '@playwright/test';
import { MOBILE_VIEWPORT } from './e2e.constants';
import { makeSession, setsOf } from './support/session.fixtures';
import { saveButton } from './support/session.page';
import { startSessionServer } from './support/session.server';

test.describe('кольца экрана упражнения', () => {
  test.use({ viewport: MOBILE_VIEWPORT });

  test('показывают цель повторов, цель веса и прогресс подходов', async ({ page }) => {
    await startSessionServer(page, {
      session: makeSession({
        weight: 60,
        reps: 8,
        results: setsOf({ index: 0, setNumbers: [1, 2] }),
      }),
    });
    await page.goto('/workouts/session');

    await expect(page.getByRole('img', { name: 'Повторы: цель 8' })).toContainText('8');
    await expect(page.getByRole('img', { name: 'Вес: цель 60 кг' })).toContainText('60');
    await expect(page.getByRole('img', { name: 'Выполнено 2 из 3 подходов' })).toContainText('2/3');
    await expect(page.getByText('подход 3', { exact: true })).toBeVisible();
  });

  test('без целевого веса в кольце веса «—»', async ({ page }) => {
    await startSessionServer(page, { session: makeSession({ weight: null }) });
    await page.goto('/workouts/session');

    await expect(page.getByRole('img', { name: 'Вес: цель не задана' })).toContainText('—');
  });

  test('кольцо подходов обновляется после сохранения', async ({ page }) => {
    await startSessionServer(page, {
      session: makeSession({ exerciseCount: 1, results: setsOf({ index: 0, setNumbers: [1, 2] }) }),
    });
    await page.goto('/workouts/session');
    await expect(page.getByRole('img', { name: 'Выполнено 2 из 3 подходов' })).toBeVisible();

    await saveButton(page).click();

    await expect(page.getByRole('img', { name: 'Выполнено 3 из 3 подходов' })).toContainText('3/3');
    await expect(page.getByText('готово', { exact: true })).toBeVisible();
  });
});
