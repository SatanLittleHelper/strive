import { expect, test } from '@playwright/test';
import { makeFinishedSession, mockSessionList } from './support/history.fixtures';

test.use({ timezoneId: 'UTC' });

test('страница использует тёмную тему на токенах', async ({ page }) => {
  await page.goto('/');

  await expect(page.locator('tui-root')).toHaveAttribute('tuiTheme', 'dark');
  await expect(page.locator('body')).toHaveCSS('background-color', 'rgb(15, 17, 21)');
  await expect(page.locator('tui-root')).toHaveCSS('--tui-background-base', '#0f1115');
});

test('вторичный текст в истории использует приглушённый цвет токена', async ({ page }) => {
  await mockSessionList(page, [makeFinishedSession({ id: 1, name: 'Тренировка A' })]);
  await page.goto('/history');

  await expect(page.getByText('15.10.2026')).toHaveCSS('color', 'rgb(154, 163, 178)');
});

test('статус API на главной приглушён и не использует акцент', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('status')).toHaveCSS('color', 'rgb(154, 163, 178)');
});
