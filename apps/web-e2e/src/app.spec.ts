import { expect, test } from '@playwright/test';
import { API_URL } from './e2e.constants';

test('показывает стартовую страницу с подсказкой', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Strive', exact: true })).toBeVisible();
  await expect(page.getByText('Выберите план и начинайте')).toBeVisible();
  await expect(page.getByText(/API/)).toHaveCount(0);
});

test('API возвращает состояние и обрабатывает неизвестный маршрут', async ({ request }) => {
  const health = await request.get(`${API_URL}/api/health`);
  expect(health.ok()).toBeTruthy();
  expect(await health.json()).toMatchObject({
    success: true,
    data: { status: 'ok', info: { database: { status: 'up' } } },
  });
  const missing = await request.get(`${API_URL}/api/missing`);
  expect(missing.status()).toBe(404);
  expect(await missing.json()).toMatchObject({ success: false, data: null });
});
