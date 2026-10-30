import { randomUUID } from 'node:crypto';
import { expect, test, type Page, type Route } from '@playwright/test';
import { DEVICE_ID_HEADER, type WorkoutSession } from '@strive/api-interfaces';
import { API_URL, MOBILE_VIEWPORT } from './e2e.constants';

const DEVICE_STORAGE_KEY = 'strive.device-id';
const HTTP_ERROR = 500;
const HTTP_CONFLICT = 409;
const WEIGHT = '60';
const UPDATED_WEIGHT = '65';
const REPS = '8';
const RPE = '3';
const NOTE = 'Контроль техники';
const SESSION: WorkoutSession = {
  id: 1,
  workout: {
    id: 1,
    name: 'Тренировка A',
    description: null,
    exercises: [
      {
        exercise: { id: 1, name: 'Приседания со штангой' },
        position: 1,
        sets: 3,
        repsMin: 6,
        repsMax: 8,
      },
    ],
  },
  startedAt: '2026-10-30T12:00:00.000Z',
  finishedAt: null,
  results: [],
};
const ok = (data: unknown) => ({ success: true, message: null, data, details: null });
const error = { success: false, message: 'Ошибка', data: null, details: null };

async function mockActive(page: Page, session: WorkoutSession | null = SESSION): Promise<void> {
  await page.route('**/api/sessions/active', (route) => route.fulfill({ json: ok({ session }) }));
}

async function fillSet(page: Page): Promise<void> {
  await page.getByRole('button', { name: 'Подход 1', exact: true }).first().click();
  const form = page.getByRole('form', { name: 'Подход 1' }).first();
  await form.getByLabel('Вес, кг', { exact: true }).fill(WEIGHT);
  await form.getByLabel('Повторы', { exact: true }).fill(REPS);
  await form.getByLabel('RPE (1–5, необязательно)', { exact: true }).fill(RPE);
  await form.getByLabel('Заметка', { exact: true }).fill(NOTE);
}

test.describe('выполнение тренировки на реальном API', () => {
  test.use({ viewport: MOBILE_VIEWPORT });

  test.beforeEach(async ({ page }) => {
    const deviceId = randomUUID();
    await page.addInitScript(({ key, id }) => localStorage.setItem(key, id), {
      key: DEVICE_STORAGE_KEY,
      id: deviceId,
    });
  });

  test.afterEach(async ({ page, request }) => {
    // У каждого browser context своё устройство; завершаем оставшуюся сессию даже после ошибки теста.
    const deviceId = await page
      .evaluate((key) => localStorage.getItem(key), DEVICE_STORAGE_KEY)
      .catch(() => null);
    if (!deviceId) return;
    const headers = { [DEVICE_ID_HEADER]: deviceId };
    const active = await request.get(`${API_URL}/api/sessions/active`, { headers });
    expect(active.ok()).toBeTruthy();
    const body = await active.json();
    if (body.data.session) {
      const finish = await request.post(`${API_URL}/api/sessions/${body.data.session.id}/finish`, {
        headers,
      });
      expect(finish.ok()).toBeTruthy();
    }
  });

  test('старт, сохранение и правка, перезагрузка, продолжение и завершение', async ({ page }) => {
    await page.goto('/workouts');
    await page.getByRole('link', { name: /Тренировка A/ }).click();
    await page.getByRole('button', { name: 'Начать', exact: true }).click();
    await expect(page).toHaveURL(/\/session$/);
    await expect(page.getByRole('heading', { name: /Тренировка A/ })).toBeVisible();
    await fillSet(page);
    await page.getByRole('button', { name: 'Сохранить подход' }).click();
    await expect(page.getByText(/^Выполнено 1\//)).toBeVisible();

    await page.reload();
    const saved = page.getByRole('button', { name: /Подход 1.*Выполнен/ }).first();
    await expect(saved).toContainText(`${WEIGHT} кг × ${REPS}`);
    await saved.click();
    const form = page.getByRole('form', { name: 'Подход 1' }).first();
    await expect(form.getByLabel('Вес, кг', { exact: true })).toHaveValue(WEIGHT);
    await expect(form.getByLabel('Повторы', { exact: true })).toHaveValue(REPS);
    await expect(form.getByLabel('RPE (1–5, необязательно)', { exact: true })).toHaveValue(RPE);
    await expect(form.getByLabel('Заметка', { exact: true })).toHaveValue(NOTE);
    await form.getByLabel('Вес, кг', { exact: true }).fill(UPDATED_WEIGHT);
    await form.getByRole('button', { name: 'Сохранить подход' }).click();
    await expect(saved).toContainText(`${UPDATED_WEIGHT} кг × ${REPS}`);
    await expect(page.getByText(/^Выполнено 1\//)).toBeVisible();

    await page.getByRole('link', { name: 'Главная', exact: true }).click();
    await expect(page.getByRole('status')).toHaveCount(1);
    await page.getByRole('link', { name: 'Продолжить', exact: true }).click();
    await expect(page).toHaveURL(/\/session$/);
    const finish = page.getByRole('button', { name: 'Завершить', exact: true });
    await finish.scrollIntoViewIfNeeded();
    await expect(finish).toBeInViewport();
    const finishBox = await finish.boundingBox();
    const navBox = await page.getByRole('navigation', { name: 'Основная навигация' }).boundingBox();
    expect(finishBox).not.toBeNull();
    expect(navBox).not.toBeNull();
    expect((finishBox?.y ?? 0) + (finishBox?.height ?? 0)).toBeLessThanOrEqual(navBox?.y ?? 0);
    await finish.click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toContainText('Не все подходы выполнены');
    await dialog.getByRole('button', { name: 'Завершить', exact: true }).click();
    await expect(page).toHaveURL(/\/history$/);
    const activeResponse = page.waitForResponse((response) =>
      response.url().endsWith('/api/sessions/active'),
    );
    await page.getByRole('link', { name: 'Главная', exact: true }).click();
    expect((await (await activeResponse).json()).data.session).toBeNull();
    await expect(page.getByRole('link', { name: 'Продолжить', exact: true })).toHaveCount(0);
    await page.reload();
    await expect(page.getByRole('status')).toHaveText('API работает');
    await expect(page.getByRole('link', { name: 'Продолжить', exact: true })).toHaveCount(0);
  });
});

test.describe('экран сессии с мокнутым API', () => {
  test.use({ viewport: MOBILE_VIEWPORT });

  test('ошибка загрузки и повторный запрос', async ({ page }) => {
    await page.route('**/api/sessions/active', (route) =>
      route.fulfill({ status: HTTP_ERROR, json: error }),
    );
    await page.goto('/session');
    await expect(page.getByRole('alert')).toContainText('Не удалось загрузить активную тренировку');
    await page.unroute('**/api/sessions/active');
    await mockActive(page);
    await page.getByRole('button', { name: 'Повторить' }).click();
    await expect(page.getByRole('heading', { name: /Тренировка A/ })).toBeVisible();
  });

  test('загрузка и пустое состояние со ссылкой в каталог', async ({ page }) => {
    const pending: { route?: Route } = {};
    await page.route('**/api/sessions/active', (route) => {
      pending.route = route;
    });
    await page.goto('/session');
    await expect(page.getByRole('status')).toHaveText('Загрузка тренировки…');
    await expect.poll(() => Boolean(pending.route)).toBe(true);
    if (!pending.route) throw new Error('Запрос активной сессии не отправлен');
    await pending.route.fulfill({ json: ok({ session: null }) });
    await expect(page.getByText('Нет активной тренировки')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Выбрать тренировку' })).toHaveAttribute(
      'href',
      '/workouts',
    );
  });

  test('валидация не отправляет запрос, ошибка сохранения оставляет введённые значения', async ({
    page,
  }) => {
    await mockActive(page);
    const writes: string[] = [];
    await page.route('**/api/sessions/1/sets/1/1', (route) => {
      writes.push(route.request().method());
      return route.fulfill({ status: HTTP_ERROR, json: error });
    });
    await page.goto('/session');
    await page.getByRole('button', { name: 'Подход 1', exact: true }).click();
    await page.getByRole('button', { name: 'Сохранить подход' }).click();
    await expect(page.getByRole('alert')).toContainText('Вес:');
    expect(writes).toEqual([]);
    await page.getByRole('button', { name: 'Подход 1', exact: true }).click();
    await fillSet(page);
    await page.getByRole('button', { name: 'Сохранить подход' }).click();
    await expect(page.getByRole('alert')).toContainText('Не удалось сохранить подход');
    await expect(page.getByLabel('Вес, кг', { exact: true })).toHaveValue(WEIGHT);
    expect(writes).toEqual(['PUT']);
  });

  test('отмена завершения не вызывает API, ошибка завершения позволяет повторить', async ({
    page,
  }) => {
    await mockActive(page);
    const finishes: string[] = [];
    await page.route('**/api/sessions/1/finish', (route) => {
      finishes.push(route.request().method());
      return route.fulfill({ status: HTTP_ERROR, json: error });
    });
    await page.goto('/session');
    await page.getByRole('button', { name: 'Завершить', exact: true }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Продолжить тренировку' }).click();
    await expect(page.getByRole('dialog')).toHaveCount(0);
    expect(finishes).toEqual([]);
    await page.getByRole('button', { name: 'Завершить', exact: true }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Завершить', exact: true }).click();
    await expect(page.getByRole('alert')).toContainText('Не удалось завершить тренировку');
    await expect(page.getByRole('button', { name: 'Завершить', exact: true })).toBeEnabled();
    expect(finishes).toEqual(['POST']);
  });

  test('ошибка старта показана в деталях, 409 открывает существующую сессию', async ({ page }) => {
    await mockActive(page);
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
    await expect(page).toHaveURL(/\/session$/);
    await expect(page.getByRole('heading', { name: /Тренировка A/ })).toBeVisible();
  });

  test('сохранение блокирует другие подходы и завершение до ответа сервера', async ({ page }) => {
    await mockActive(page);
    const pending: { route?: Route } = {};
    await page.route('**/api/sessions/1/sets/1/1', (route) => {
      pending.route = route;
    });
    await page.goto('/session');
    await fillSet(page);
    await page.getByRole('button', { name: 'Сохранить подход' }).click();
    await expect(page.getByRole('button', { name: 'Подход 2', exact: true })).toBeDisabled();
    await expect(page.getByRole('button', { name: 'Завершить', exact: true })).toBeDisabled();
    await expect.poll(() => Boolean(pending.route)).toBe(true);
    if (!pending.route) throw new Error('Запрос сохранения не отправлен');
    await pending.route.fulfill({
      json: ok({
        ...SESSION,
        results: [
          {
            exerciseId: 1,
            setNumber: 1,
            weight: Number(WEIGHT),
            reps: Number(REPS),
            rpe: Number(RPE),
            note: NOTE,
            completedAt: SESSION.startedAt,
          },
        ],
      }),
    });
    await expect(page.getByRole('button', { name: 'Подход 2', exact: true })).toBeEnabled();
    await expect(page.getByRole('button', { name: 'Завершить', exact: true })).toBeEnabled();
    await expect(page.getByText('Выполнено 1/3')).toBeVisible();
  });

  test('при ошибке active главная скрывает баннер и сохраняет единственный status', async ({
    page,
  }) => {
    await page.route('**/api/sessions/active', (route) =>
      route.fulfill({ status: HTTP_ERROR, json: error }),
    );
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Strive' })).toBeVisible();
    await expect(page.getByRole('status')).toHaveCount(1);
    await expect(page.getByRole('link', { name: 'Продолжить', exact: true })).toHaveCount(0);
  });
});
