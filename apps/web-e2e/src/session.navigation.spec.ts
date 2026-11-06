import { expect, test, type Route } from '@playwright/test';
import { MOBILE_VIEWPORT } from './e2e.constants';
import {
  errorBody as error,
  makeSession,
  mockActive,
  mockHistory,
  ok,
} from './support/session.fixtures';
import { position, repsField, weightField } from './support/session.page';
import { startSessionServer } from './support/session.server';
import { swipe } from './support/swipe';

const HTTP_ERROR = 500;
const HTTP_CONFLICT = 409;
const HTTP_CREATED = 201;
const SESSION = makeSession();

test.describe('навигация между упражнениями', () => {
  test.use({ viewport: MOBILE_VIEWPORT });

  test('«Далее» и «Назад» переключают упражнения', async ({ page }) => {
    await startSessionServer(page);
    await page.goto('/workouts/session');

    await page.getByRole('button', { name: 'Далее', exact: true }).click();
    await page.getByRole('button', { name: 'Далее', exact: true }).click();
    await expect(position({ page, current: 3, total: 3 })).toBeVisible();
    await page.getByRole('button', { name: 'Назад', exact: true }).click();

    await expect(position({ page, current: 2, total: 3 })).toBeVisible();
  });

  test('на границах списка «Назад» и «Далее» отключены', async ({ page }) => {
    await startSessionServer(page);
    await page.goto('/workouts/session');
    await expect(page.getByRole('button', { name: 'Назад', exact: true })).toBeDisabled();
    await page.getByRole('button', { name: 'Назад', exact: true }).dispatchEvent('click');
    await expect(position({ page, current: 1, total: 3 })).toBeVisible();

    await page.getByRole('button', { name: 'Далее', exact: true }).click();
    await page.getByRole('button', { name: 'Далее', exact: true }).click();

    await expect(page.getByRole('button', { name: 'Далее', exact: true })).toBeDisabled();
    await page.getByRole('button', { name: 'Далее', exact: true }).dispatchEvent('click');
    await expect(position({ page, current: 3, total: 3 })).toBeVisible();
  });

  test('свайп влево переключает на следующее упражнение @touch', async ({ page }) => {
    await startSessionServer(page);
    await page.goto('/workouts/session');

    const ring = page.getByRole('img', { name: 'Вес: цель 60 кг' });
    await expect(ring).toBeVisible();

    await swipe(page, {
      from: ring,
      direction: 'left',
    });

    await expect(position({ page, current: 2, total: 3 })).toBeVisible();
  });

  test('свайп, начатый в поле ввода, не переключает упражнение @touch', async ({ page }) => {
    await startSessionServer(page);
    await page.goto('/workouts/session');

    await swipe(page, { from: weightField(page), direction: 'left' });

    await expect(position({ page, current: 1, total: 3 })).toBeVisible();
    await expect(repsField(page)).toBeVisible();
  });

  test('вертикальный жест прокручивает страницу и не переключает упражнение @touch', async ({
    page,
  }) => {
    await startSessionServer(page);
    await page.goto('/workouts/session');
    await page.evaluate(() => {
      document.body.style.minHeight = '3000px';
    });

    await swipe(page, {
      from: page.getByRole('region', { name: 'Приседания со штангой' }),
      direction: 'up',
    });

    await expect(position({ page, current: 1, total: 3 })).toBeVisible();
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(0);
  });
});

test.describe('состояния экрана тренировки', () => {
  test.use({ viewport: MOBILE_VIEWPORT });

  test.beforeEach(async ({ page }) => {
    await mockHistory(page);
  });

  test('во время загрузки виден скелетон со статусом', async ({ page }) => {
    const pending: { route?: Route } = {};
    await page.route('**/api/sessions/active', (route) => {
      pending.route = route;
    });

    await page.goto('/workouts/session');

    await expect(page.getByRole('status', { name: 'Загрузка тренировки' })).toBeVisible();
  });

  test('ошибка загрузки и повторный запрос', async ({ page }) => {
    await page.route('**/api/sessions/active', (route) =>
      route.fulfill({ status: HTTP_ERROR, json: error }),
    );
    await page.goto('/workouts/session');
    await expect(page.getByRole('alert')).toContainText('Не удалось загрузить активную тренировку');
    await page.unroute('**/api/sessions/active');
    await mockActive(page);

    await page.getByRole('button', { name: 'Повторить' }).click();

    await expect(page.getByRole('heading', { name: 'Тренировка A', level: 1 })).toBeVisible();
  });
});

test.describe('маршрут экрана тренировки', () => {
  test.use({ viewport: MOBILE_VIEWPORT });

  test.beforeEach(async ({ page }) => {
    await mockActive(page);
    await mockHistory(page);
  });

  test('на экране тренировки вкладка «Тренировки» активна, «Главная» нет', async ({ page }) => {
    await page.goto('/workouts/session');

    await expect(page.getByRole('link', { name: 'Тренировки', exact: true })).toHaveAttribute(
      'aria-current',
      'page',
    );
    await expect(page.getByRole('link', { name: 'Главная', exact: true })).not.toHaveAttribute(
      'aria-current',
      'page',
    );
  });

  test('пустое состояние ведёт в каталог', async ({ page }) => {
    await page.unroute('**/api/sessions/active');
    await mockActive(page, null);
    await page.goto('/workouts/session');

    await expect(page.getByText('Нет активной тренировки')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Выбрать тренировку' })).toHaveAttribute(
      'href',
      '/workouts',
    );
  });

  test('«Начать» в деталях тренировки ведёт на экран тренировки', async ({ page }) => {
    await page.unroute('**/api/sessions/active');
    await mockActive(page, null);
    await page.route('**/api/workouts/1', (route) => route.fulfill({ json: ok(SESSION.workout) }));
    await page.route('**/api/sessions', (route) =>
      route.fulfill({ status: HTTP_CREATED, json: ok(SESSION) }),
    );
    await page.goto('/workouts/1');

    await page.getByRole('button', { name: 'Начать', exact: true }).click();

    await expect(page).toHaveURL(/\/workouts\/session$/);
  });

  test('баннер «Продолжить» ведёт на экран тренировки', async ({ page }) => {
    await page.goto('/');

    await page.getByRole('link', { name: 'Продолжить', exact: true }).click();

    await expect(page).toHaveURL(/\/workouts\/session$/);
  });

  test('ошибка старта показана в деталях, 409 открывает существующую сессию', async ({ page }) => {
    await page.route('**/api/workouts/1', (route) => route.fulfill({ json: ok(SESSION.workout) }));
    await page.route('**/api/sessions', (route) =>
      route.fulfill({ status: HTTP_ERROR, json: error }),
    );
    await page.goto('/workouts/1');
    await page.getByRole('button', { name: 'Начать', exact: true }).click();
    await expect(page.getByRole('alert')).toContainText('Не удалось начать тренировку');
    await page.unroute('**/api/sessions');
    await page.route('**/api/sessions', (route) =>
      route.fulfill({ status: HTTP_CONFLICT, json: error }),
    );

    await page.getByRole('button', { name: 'Начать', exact: true }).click();

    await expect(page).toHaveURL(/\/workouts\/session$/);
    await expect(page.getByRole('heading', { name: 'Тренировка A', level: 1 })).toBeVisible();
  });

  test('при ошибке active главная скрывает баннер и сохраняет единственный status', async ({
    page,
  }) => {
    await page.unroute('**/api/sessions/active');
    await page.route('**/api/sessions/active', (route) =>
      route.fulfill({ status: HTTP_ERROR, json: error }),
    );
    await page.goto('/');

    await expect(page.getByRole('heading', { name: 'Strive' })).toBeVisible();
    await expect(page.getByRole('status')).toHaveCount(1);
    await expect(page.getByRole('link', { name: 'Продолжить', exact: true })).toHaveCount(0);
  });
});
