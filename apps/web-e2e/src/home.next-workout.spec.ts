import { expect, test, type Page } from '@playwright/test';
import type { HomeResponse } from '@strive/api-interfaces';
import { mockHome } from './support/home.fixtures';
import { errorBody, makeSession, mockActive, mockHistory, ok } from './support/session.fixtures';

const session = makeSession();
const active = { kind: 'active', workoutName: session.workout.name } satisfies HomeResponse;
const next = {
  kind: 'next',
  workout: { id: 5, name: 'Грудь', exerciseCount: 3 },
} satisfies HomeResponse;
const homeRequest = 'GET /api/home';

function watchApi(page: Page): string[] {
  const requests: string[] = [];
  page.on('request', (request) => {
    const { pathname } = new URL(request.url());
    if (pathname.startsWith('/api/')) requests.push(`${request.method()} ${pathname}`);
  });
  return requests;
}

async function openHome(page: Page): Promise<void> {
  await Promise.all([page.waitForResponse('**/api/home'), page.goto('/')]);
  await expect(page.getByRole('status', { name: 'Загрузка главной' })).toHaveCount(0);
}

async function openActiveSession({
  page,
  navigate,
}: {
  page: Page;
  navigate: () => Promise<unknown>;
}) {
  await mockActive(page, session);
  await mockHistory(page);
  const activeResponse = page.waitForResponse('**/api/sessions/active');
  const historyResponse = page.waitForResponse(`**/api/sessions/${session.id}/history`);
  await navigate();
  await Promise.all([activeResponse, historyResponse]);
  await expect(page).toHaveURL(/\/workouts\/session$/);
  await expect(page.getByRole('heading', { name: session.workout.name, level: 1 })).toBeVisible();
}

test('[E3] показывает продолжение после ровно одного запроса', async ({ page }) => {
  const requests = watchApi(page);
  await mockHome(page, active);
  await openHome(page);
  await expect(page.getByRole('complementary', { name: 'Незавершённая тренировка' })).toContainText(
    session.workout.name,
  );
  await expect(page.getByRole('link', { name: 'Продолжить' })).toBeVisible();
  await expect(page.getByText('Следующая тренировка')).toHaveCount(0);
  expect(requests).toEqual([homeRequest]);
});

test('[E4] продолжение загружает данные на экране тренировки', async ({ page }) => {
  await mockHome(page, active);
  await openHome(page);
  const continueLink = page.getByRole('link', { name: 'Продолжить' });
  await expect(continueLink).toHaveAttribute('href', '/workouts/session');
  await openActiveSession({
    page,
    navigate: () => continueLink.click(),
  });
});

test('[E5] прямой вход загружает активную тренировку', async ({ page }) => {
  await openActiveSession({ page, navigate: () => page.goto('/workouts/session') });
});

test('[E7] показывает рекомендацию после ровно одного запроса', async ({ page }) => {
  const requests = watchApi(page);
  await mockHome(page, next);
  await openHome(page);
  const card = page.getByRole('link', { name: /Грудь/ });
  await expect(card).toBeVisible();
  await expect(card).toHaveAttribute('href', '/workouts/5');
  await expect(card).toContainText('3 упражнения');
  expect(requests).toEqual([homeRequest]);
});

test('[E9] пустое состояние требует один запрос', async ({ page }) => {
  const requests = watchApi(page);
  const gate = { release: (): void => undefined };
  const held = new Promise<void>((resolve) => {
    gate.release = resolve;
  });
  await page.route('**/api/home', async (route) => {
    await held;
    await route.fulfill({ json: ok({ kind: 'empty' }) });
  });
  await page.goto('/');
  const loading = page.getByRole('status', { name: 'Загрузка главной' });
  try {
    await expect(loading).toBeVisible();
  } finally {
    gate.release();
  }
  await expect(loading).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'Strive' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Продолжить' })).toHaveCount(0);
  await expect(page.getByText('Следующая тренировка')).toHaveCount(0);
  expect(requests).toEqual([homeRequest]);
});

test('[E10] показывает ошибку и повтор рядом с приветствием', async ({ page }) => {
  await page.route('**/api/home', (route) => route.fulfill({ status: 500, json: errorBody }));
  await openHome(page);
  await expect(page.getByRole('heading', { name: 'Strive' })).toBeVisible();
  await expect(page.getByRole('alert')).toContainText('Не удалось загрузить главную');
  await expect(page.getByRole('button', { name: 'Повторить' })).toBeVisible();
});

test('[E11] повтор делает один запрос и восстанавливает карточку', async ({ page }) => {
  const requests = watchApi(page);
  await page.route('**/api/home', (route) => route.fulfill({ status: 500, json: errorBody }), {
    times: 1,
  });
  await openHome(page);
  await page.route('**/api/home', (route) => route.fulfill({ json: ok(next) }));
  await page.getByRole('button', { name: 'Повторить' }).click();
  await expect(page.getByRole('link', { name: /Грудь/ })).toBeVisible();
  expect(requests).toEqual([homeRequest, homeRequest]);
});
