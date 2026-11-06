import { expect, test } from '@playwright/test';
import { MOBILE_VIEWPORT } from './e2e.constants';

const WORKOUT_NAME = /Тренировка A/;
const SQUAT_NAME = 'Приседания со штангой';
const ROW_NAME = 'Тяга штанги в наклоне';

test.describe('каталог на реальном API', () => {
  test.use({ viewport: MOBILE_VIEWPORT });

  test('seed показывает единую цель повторов у упражнений «Тренировки A»', async ({ page }) => {
    await page.goto('/workouts');
    await page.getByRole('link', { name: WORKOUT_NAME }).click();

    const exercises = page.getByRole('listitem');
    await expect(exercises.filter({ hasText: SQUAT_NAME })).toContainText('3 × 8');
    await expect(exercises.filter({ hasText: ROW_NAME })).toContainText('3 × 10');
  });
});
