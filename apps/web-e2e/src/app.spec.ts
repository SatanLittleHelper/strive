import { expect, test } from '@playwright/test';

test('показывает стартовую страницу и состояние API', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Strive', exact: true })).toBeVisible();
  await expect(page.getByRole('status')).toHaveText('API работает');
});

test('показывает ошибку подключения к API', async ({ page }) => {
  await page.route('**/api/health', (route) => route.abort());
  await page.goto('/');
  await expect(page.getByRole('status')).toHaveText('API недоступен');
});

test('API возвращает состояние и обрабатывает неизвестный маршрут', async ({ request }) => {
  const health = await request.get('http://127.0.0.1:3000/api/health');
  expect(health.ok()).toBeTruthy();
  expect(await health.json()).toMatchObject({
    success: true,
    data: { service: 'api', status: 'ok' },
  });
  const missing = await request.get('http://127.0.0.1:3000/api/missing');
  expect(missing.status()).toBe(404);
  expect(await missing.json()).toMatchObject({ success: false, data: null });
});
