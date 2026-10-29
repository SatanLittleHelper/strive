import { expect, test } from '@playwright/test';

test('страница использует тёмную тему на токенах', async ({ page }) => {
  await page.goto('/');

  await expect(page.locator('tui-root')).toHaveAttribute('tuiTheme', 'dark');
  await expect(page.locator('body')).toHaveCSS('background-color', 'rgb(15, 17, 21)');
  await expect(page.locator('tui-root')).toHaveCSS('--tui-background-base', '#0f1115');
});

test('вторичный текст на заглушке раздела использует приглушённый цвет токена', async ({
  page,
}) => {
  await page.goto('/workouts');

  await expect(page.getByText('Раздел появится в следующих этапах.')).toHaveCSS(
    'color',
    'rgb(154, 163, 178)',
  );
});

test('статус API на главной приглушён и не использует акцент', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('status')).toHaveCSS('color', 'rgb(154, 163, 178)');
});
