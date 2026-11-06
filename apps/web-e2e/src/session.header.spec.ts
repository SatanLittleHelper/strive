import { expect, test } from '@playwright/test';
import { MOBILE_VIEWPORT } from './e2e.constants';
import { fullExercise, makeSession, ok } from './support/session.fixtures';
import { position } from './support/session.page';
import { startSessionServer } from './support/session.server';

const MIN_TOUCH_TARGET = 44;
const BACK_NAME = 'К тренировкам';

test.describe('шапка экрана тренировки', () => {
  test.use({ viewport: MOBILE_VIEWPORT });

  test.beforeEach(async ({ page }) => {
    await page.route('**/api/workouts', (route) => route.fulfill({ json: ok([]) }));
  });

  test('показывает название тренировки, упражнение и прогресс по упражнениям', async ({ page }) => {
    await startSessionServer(page, { session: makeSession({ results: fullExercise(0) }) });
    await page.goto('/workouts/session');

    await expect(page.getByRole('heading', { name: 'Тренировка A', level: 1 })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Жим лёжа', level: 2 })).toBeVisible();
    await expect(position({ page, current: 2, total: 3 })).toBeVisible();
    await expect(page.getByRole('progressbar', { name: 'Выполнено упражнений' })).toHaveAttribute(
      'value',
      '1',
    );
  });

  test('старые блоки шапки убраны', async ({ page }) => {
    await startSessionServer(page, { session: makeSession({ results: fullExercise(0) }) });
    await page.goto('/workouts/session');
    await expect(page.getByRole('heading', { name: 'Тренировка A' })).toBeVisible();

    await expect(page.getByText('Выполнение тренировки')).toHaveCount(0);
    await expect(page.getByText(/^Выполнено \d+\/\d+$/)).toHaveCount(0);
    await expect(page.getByText(/^Упражнение \d+ из \d+$/)).toHaveCount(0);
  });

  test('иконка «назад» ведёт к списку тренировок', async ({ page }) => {
    await startSessionServer(page);
    await page.goto('/workouts/session');

    await page.getByRole('button', { name: BACK_NAME }).click();

    await expect(page).toHaveURL(/\/workouts$/);
  });

  test('иконка «назад» не завершает тренировку', async ({ page }) => {
    const server = await startSessionServer(page);
    await page.goto('/workouts/session');

    await page.getByRole('button', { name: BACK_NAME }).click();
    await expect(page).toHaveURL(/\/workouts$/);

    expect(server.finishes).toEqual([]);
  });

  test('после «назад» на главной остаётся баннер «Продолжить»', async ({ page }) => {
    await startSessionServer(page);
    await page.goto('/workouts/session');

    await page.getByRole('button', { name: BACK_NAME }).click();
    await page.getByRole('link', { name: 'Главная', exact: true }).click();

    await expect(page.getByRole('link', { name: 'Продолжить', exact: true })).toBeVisible();
  });

  test('иконка «назад» достаточного размера для нажатия', async ({ page }) => {
    await startSessionServer(page);
    await page.goto('/workouts/session');

    const box = await page.getByRole('button', { name: BACK_NAME }).boundingBox();

    expect(box?.width).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET);
    expect(box?.height).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET);
  });

  test('иконка «назад» имеет доступное имя', async ({ page }) => {
    await startSessionServer(page);
    await page.goto('/workouts/session');

    await expect(page.getByRole('button', { name: BACK_NAME })).toBeVisible();
  });
});
