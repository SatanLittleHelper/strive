import { expect, test, type Page } from '@playwright/test';
import { API_URL, MOBILE_VIEWPORT } from './e2e.constants';

const HTTP_NOT_FOUND = 404;
const HTTP_BAD_REQUEST = 400;
const MIN_SEEDED_WORKOUTS = 3;

const SUMMARIES = [
  { id: 1, name: 'Тренировка A', description: 'Ноги и грудь', exerciseCount: 2 },
  { id: 2, name: 'Тренировка B', description: null, exerciseCount: 1 },
];
const DETAILS = {
  id: 1,
  name: 'Тренировка A',
  description: 'Ноги и грудь',
  exercises: [
    {
      exercise: { id: 1, name: 'Приседания со штангой' },
      position: 1,
      sets: 3,
      repsMin: 6,
      repsMax: 8,
    },
    { exercise: { id: 2, name: 'Жим лёжа' }, position: 2, sets: 2, repsMin: 5, repsMax: 5 },
  ],
};

const ok = (data: unknown) => ({ success: true, message: null, data, details: null });

async function mockWorkouts(page: Page, data: unknown): Promise<void> {
  await page.route('**/api/workouts', (route) => route.fulfill({ json: ok(data) }));
}

test.describe('каталог с мокнутым API', () => {
  test.use({ viewport: MOBILE_VIEWPORT });

  test('список показывает карточки тренировок', async ({ page }) => {
    await mockWorkouts(page, SUMMARIES);
    await page.goto('/workouts');

    await expect(page.getByRole('heading', { name: 'Тренировки', exact: true })).toBeVisible();
    await expect(page.getByRole('link', { name: /Тренировка A/ })).toContainText('Ноги и грудь');
    await expect(page.getByRole('link', { name: /Тренировка A/ })).toContainText('2 упражнения');
    await expect(page.getByRole('link', { name: /Тренировка B/ })).toContainText('1 упражнение');
  });

  test('пустой каталог показывает пустое состояние', async ({ page }) => {
    await mockWorkouts(page, []);
    await page.goto('/workouts');

    await expect(page.getByText('Тренировок пока нет')).toBeVisible();
  });

  test('ошибка загрузки списка даёт повторить запрос', async ({ page }) => {
    await page.route('**/api/workouts', (route) => route.abort());
    await page.goto('/workouts');
    await expect(page.getByRole('alert')).toContainText('Не удалось загрузить тренировки');

    await page.unroute('**/api/workouts');
    await mockWorkouts(page, SUMMARIES);
    await page.getByRole('button', { name: 'Повторить' }).click();

    await expect(page.getByRole('link', { name: /Тренировка A/ })).toBeVisible();
  });

  test('карточка ведёт на детали с планом упражнений', async ({ page }) => {
    await mockWorkouts(page, SUMMARIES);
    await page.route('**/api/workouts/1', (route) => route.fulfill({ json: ok(DETAILS) }));
    await page.goto('/workouts');

    await page.getByRole('link', { name: /Тренировка A/ }).click();

    await expect(page).toHaveURL(/\/workouts\/1$/);
    await expect(page.getByRole('heading', { name: 'Тренировка A' })).toBeVisible();
    const exercises = page.getByRole('listitem');
    await expect(exercises.nth(0)).toContainText('Приседания со штангой');
    await expect(exercises.nth(0)).toContainText('3 × 6–8');
    await expect(exercises.nth(1)).toContainText('2 × 5');
  });

  test('кнопка «Начать» доступна и видна над нижней навигацией', async ({ page }) => {
    await page.route('**/api/workouts/1', (route) => route.fulfill({ json: ok(DETAILS) }));
    await page.goto('/workouts/1');

    const start = page.getByRole('button', { name: 'Начать' });
    await expect(start).toBeEnabled();
    const startBox = await start.boundingBox();
    const navigationBox = await page
      .getByRole('navigation', { name: 'Основная навигация' })
      .boundingBox();
    expect((startBox?.y ?? 0) + (startBox?.height ?? 0)).toBeLessThanOrEqual(navigationBox?.y ?? 0);
  });

  test('несуществующая тренировка показывает сообщение', async ({ page }) => {
    await page.route('**/api/workouts/999', (route) =>
      route.fulfill({
        status: HTTP_NOT_FOUND,
        json: { success: false, message: 'Не найдено', data: null, details: null },
      }),
    );
    await page.goto('/workouts/999');

    await expect(page.getByText('Тренировка не найдена')).toBeVisible();
  });

  test('некорректный id в адресе показывает «не найдено», а не повтор', async ({ page }) => {
    await page.route('**/api/workouts/abc', (route) =>
      route.fulfill({
        status: HTTP_BAD_REQUEST,
        json: { success: false, message: 'Некорректный id', data: null, details: null },
      }),
    );
    await page.goto('/workouts/abc');

    await expect(page.getByText('Тренировка не найдена')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Повторить' })).toHaveCount(0);
  });

  test('ошибка загрузки деталей даёт повторить запрос', async ({ page }) => {
    await page.route('**/api/workouts/1', (route) => route.abort());
    await page.goto('/workouts/1');
    await expect(page.getByRole('alert')).toContainText('Не удалось загрузить тренировку');

    await page.unroute('**/api/workouts/1');
    await page.route('**/api/workouts/1', (route) => route.fulfill({ json: ok(DETAILS) }));
    await page.getByRole('button', { name: 'Повторить' }).click();

    await expect(page.getByRole('heading', { name: 'Тренировка A' })).toBeVisible();
  });
});

test.describe('каталог на реальном API и засеянной БД', () => {
  test('API отдаёт засеянные тренировки, каждая открывается', async ({ request }) => {
    const list = await (await request.get(`${API_URL}/api/workouts`)).json();

    expect(list.data.length).toBeGreaterThanOrEqual(MIN_SEEDED_WORKOUTS);
    for (const summary of list.data) {
      const details = await request.get(`${API_URL}/api/workouts/${summary.id}`);
      expect(details.ok()).toBeTruthy();
      expect((await details.json()).data.exercises).toHaveLength(summary.exerciseCount);
    }
  });

  test('из списка можно открыть первую тренировку', async ({ page }) => {
    await page.goto('/workouts');

    await page.getByRole('link', { name: /Тренировка A/ }).click();

    await expect(page.getByRole('heading', { name: 'Тренировка A' })).toBeVisible();
    await expect(page.getByRole('listitem').first()).toContainText('×');
  });
});
