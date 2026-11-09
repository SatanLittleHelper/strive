import { expect, test } from '@playwright/test';
import { LEGS_WORKOUT_LINK, MOBILE_VIEWPORT } from './e2e.constants';

const LEG_EXTENSION_NAME = 'Разгибание ног сидя';
const LEG_CURL_NAME = 'Сгибание ног лежа';

test.describe('каталог на реальном API', () => {
  test.use({ viewport: MOBILE_VIEWPORT });

  test('seed показывает единую цель повторов у упражнений «Ноги»', async ({ page }) => {
    await page.goto('/workouts');
    await page.getByRole('link', { name: LEGS_WORKOUT_LINK }).click();

    const exercises = page.getByRole('listitem');
    await expect(exercises.filter({ hasText: LEG_EXTENSION_NAME })).toContainText('3 × 15');
    await expect(exercises.filter({ hasText: LEG_CURL_NAME })).toContainText('3 × 15');
  });
});
