import { expect, test, type Page } from '@playwright/test';
import { MOBILE_VIEWPORT } from './e2e.constants';
import { errorBody, makeSession, ok } from './support/session.fixtures';
import { startSessionServer } from './support/session.server';

const SHARE_URL = '**/api/sessions/1/share';
const LINK = { token: 'tok-1', expiresAt: '2026-11-21T12:00:00.000Z' };
const SERVER_ERROR = 500;
const SHARE_BUTTON = 'Поделиться';
const REVOKE_BUTTON = 'Отозвать ссылку';

async function mockShare(
  page: Page,
  postStatus = 200,
): Promise<{ posts: number; deletes: number }> {
  const counters = { posts: 0, deletes: 0 };
  await page.route(SHARE_URL, (route) => {
    if (route.request().method() === 'POST') {
      counters.posts += 1;

      return postStatus === 200
        ? route.fulfill({ json: ok(LINK) })
        : route.fulfill({ status: postStatus, json: errorBody });
    }
    counters.deletes += 1;

    return route.fulfill({ status: 204 });
  });

  return counters;
}

test.describe('общая ссылка на экране тренировки', () => {
  test.use({ viewport: MOBILE_VIEWPORT });

  test.beforeEach(async ({ browserName, context, page }) => {
    test.skip(
      browserName !== 'chromium',
      'Разрешения буфера обмена настраиваются только в Chromium',
    );
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    // Web Share есть не во всех сборках Chromium: проверяем запасной путь с буфером
    await page.addInitScript(() =>
      Object.defineProperty(navigator, 'share', { value: undefined, configurable: true }),
    );
    await startSessionServer(page, { session: makeSession() });
  });

  test('[ss-E11] «Поделиться» создаёт ссылку и копирует её', async ({ page }) => {
    const counters = await mockShare(page);
    await page.goto('/workouts/session');

    await page.getByRole('button', { name: SHARE_BUTTON, exact: true }).click();

    await expect(page.getByRole('status').filter({ hasText: 'Ссылка скопирована' })).toBeVisible();
    expect(counters.posts).toBe(1);
    const copied = await page.evaluate(() => navigator.clipboard.readText());
    expect(copied).toBe(`${new URL(page.url()).origin}/s/${LINK.token}`);
  });

  test('[ss-E12] «Отозвать ссылку» доступна в меню только при выданной ссылке', async ({
    page,
  }) => {
    const counters = await mockShare(page);
    await page.goto('/workouts/session');
    const share = page.getByRole('button', { name: SHARE_BUTTON, exact: true });
    const revoke = page.getByText(REVOKE_BUTTON, { exact: true });

    await share.click();
    await expect(page.getByRole('status').filter({ hasText: 'Ссылка скопирована' })).toBeVisible();
    await expect(revoke).toHaveCount(0);

    await share.click();
    await expect(revoke).toBeVisible();
    await revoke.click();

    await expect(revoke).toHaveCount(0);
    expect(counters.deletes).toBe(1);

    // после отзыва нажатие снова выпускает ссылку
    await share.click();
    await expect(page.getByRole('status').filter({ hasText: 'Ссылка скопирована' })).toBeVisible();
    expect(counters.posts).toBe(2);
  });

  test('[ss-E13] ошибка выпуска показывается пользователю', async ({ page }) => {
    await mockShare(page, SERVER_ERROR);
    await page.goto('/workouts/session');
    const share = page.getByRole('button', { name: SHARE_BUTTON, exact: true });

    await share.click();

    await expect(
      page.getByRole('alert').filter({ hasText: 'Не удалось создать ссылку. Попробуйте ещё раз.' }),
    ).toBeVisible();
    await expect(share).toBeEnabled();
    await expect(page.getByText(REVOKE_BUTTON, { exact: true })).toHaveCount(0);
  });
});
