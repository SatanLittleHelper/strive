import { expect, test } from '@playwright/test';

const MOBILE_VIEWPORT = { width: 375, height: 667 };

test('навигация открывает разделы Тренировки и История', async ({ page }) => {
  await page.goto('/');
  const navigation = page.getByRole('navigation', { name: 'Основная навигация' });

  await navigation.getByRole('link', { name: 'Тренировки' }).click();
  await expect(page).toHaveURL(/\/workouts$/);
  await expect(page.getByRole('heading', { name: 'Тренировки' })).toBeVisible();

  await navigation.getByRole('link', { name: 'История' }).click();
  await expect(page).toHaveURL(/\/history$/);
  await expect(page.getByRole('heading', { name: 'История' })).toBeVisible();
});

test('название приложения в шапке возвращает на главную', async ({ page }) => {
  await page.goto('/history');

  await page.getByRole('link', { name: 'Strive' }).click();

  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole('heading', { name: 'Strive', exact: true })).toBeVisible();
});

test('на узком экране страница не прокручивается по горизонтали', async ({ page }) => {
  await page.setViewportSize(MOBILE_VIEWPORT);
  await page.goto('/');

  const hasHorizontalScroll = await page
    .locator('html')
    .evaluate((element) => element.scrollWidth > element.clientWidth);

  expect(hasHorizontalScroll).toBe(false);
});

test('веб-клиент передаёт идентификатор устройства в API', async ({ page }) => {
  const requestPromise = page.waitForRequest('**/api/health');

  await page.goto('/');

  const request = await requestPromise;
  expect(request.headers()['x-device-id']).toMatch(/^[0-9a-f-]{36}$/);
});
