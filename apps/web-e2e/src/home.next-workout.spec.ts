import { expect, test, type Page, type Route } from '@playwright/test';
import type { WorkoutSession } from '@strive/api-interfaces';
import { MOBILE_VIEWPORT } from './e2e.constants';
import { fulfillAfterDelay, mockSessionList } from './support/history.fixtures';
import { errorBody, makeSession, mockActive, ok } from './support/session.fixtures';

const HTTP_ERROR = 500;
const CATALOG = [
  { id: 1, name: 'Ноги', description: null, exerciseCount: 5 },
  { id: 2, name: 'Спина', description: null, exerciseCount: 5 },
  { id: 3, name: 'Грудь', description: null, exerciseCount: 5 },
];
const nextCard = (page: Page) => page.getByRole('link', { name: /Следующая тренировка/ });
const loading = (page: Page) => page.getByRole('status', { name: 'Загрузка следующей тренировки' });

function finishedOf(workoutId: number): WorkoutSession {
  const base = makeSession();

  return {
    ...base,
    id: 100 + workoutId,
    workout: { ...base.workout, id: workoutId },
    finishedAt: '2026-11-10T10:00:00.000Z',
  };
}

async function mockCatalog(page: Page, data: unknown) {
  await page.route('**/api/workouts', (route) => route.fulfill({ json: ok(data) }));
}

async function openHome(page: Page) {
  await page.goto('/');
}

test.describe('карточка следующей тренировки', () => {
  test.use({ viewport: MOBILE_VIEWPORT });

  test('[rf-E22] показывает следующую тренировку и открывает её', async ({ page }) => {
    await mockCatalog(page, CATALOG);
    await mockSessionList(page, [finishedOf(2)]);
    await openHome(page);

    await expect(nextCard(page)).toContainText('Грудь');
    await expect(nextCard(page)).toContainText('5 упражнений');
    await expect(nextCard(page)).toContainText('Открыть');
    await nextCard(page).click();

    await expect(page).toHaveURL(/\/workouts\/3$/);
  });

  test('[rf-E23] без истории показывает первую тренировку', async ({ page }) => {
    await mockCatalog(page, CATALOG);
    await mockSessionList(page, []);
    await openHome(page);

    await expect(nextCard(page)).toContainText('Ноги');
  });

  test('[rf-E24] пустой каталог — карточки нет, остальная главная на месте', async ({ page }) => {
    await mockCatalog(page, []);
    await mockSessionList(page, []);
    await openHome(page);

    await expect(page.getByText('Выберите план и начинайте')).toBeVisible();
    await expect(loading(page)).toHaveCount(0);
    await expect(nextCard(page)).toHaveCount(0);
  });

  test('[rf-E25] загрузка и ошибка каталога', async ({ page }) => {
    await mockSessionList(page, []);
    let attempts = 0;
    await page.route('**/api/workouts', async (route: Route) => {
      attempts += 1;
      if (attempts === 1) return fulfillAfterDelay(route, CATALOG).then(() => undefined);
      return route.fulfill({ json: ok(CATALOG) });
    });
    await page.goto('/');
    await expect(loading(page)).toBeVisible();
    await expect(nextCard(page)).toBeVisible();

    await page.unroute('**/api/workouts');
    let failed = false;
    await page.route('**/api/workouts', (route) => {
      if (!failed) {
        failed = true;
        return route.fulfill({ status: HTTP_ERROR, json: errorBody });
      }
      return route.fulfill({ json: ok(CATALOG) });
    });
    await page.reload();
    await expect(page.getByRole('alert')).toContainText(
      'Не удалось загрузить следующую тренировку',
    );

    await page.getByRole('button', { name: 'Повторить' }).click();

    await expect(nextCard(page)).toContainText('Ноги');
  });

  test('[rf-E26] загрузка и ошибка списка завершённых тренировок', async ({ page }) => {
    await mockCatalog(page, CATALOG);
    await page.route('**/api/sessions', (route) =>
      fulfillAfterDelay(route, { sessions: [finishedOf(2)] }),
    );
    await page.goto('/');
    await expect(loading(page)).toBeVisible();
    await expect(nextCard(page)).toContainText('Грудь');

    await page.unroute('**/api/sessions');
    let failed = false;
    await page.route('**/api/sessions', (route) => {
      if (!failed) {
        failed = true;
        return route.fulfill({ status: HTTP_ERROR, json: errorBody });
      }
      return fulfillAfterDelay(route, { sessions: [finishedOf(2)] });
    });
    await page.reload();
    await expect(page.getByRole('alert')).toContainText(
      'Не удалось загрузить следующую тренировку',
    );
    await expect(nextCard(page)).toHaveCount(0);

    await page.getByRole('button', { name: 'Повторить' }).click();

    // пока список завершённых не получен, карточки с «первой» тренировкой нет
    await expect(nextCard(page)).toHaveCount(0);
    await expect(nextCard(page)).toContainText('Грудь');
  });

  test('[rf-E27] при активной тренировке карточки нет, виден только баннер «Продолжить»', async ({
    page,
  }) => {
    await mockCatalog(page, CATALOG);
    await mockSessionList(page, []);
    await mockActive(page, makeSession());
    await openHome(page);

    await expect(
      page.getByRole('complementary', { name: 'Незавершённая тренировка' }),
    ).toBeVisible();
    await expect(nextCard(page)).toHaveCount(0);
  });
});
