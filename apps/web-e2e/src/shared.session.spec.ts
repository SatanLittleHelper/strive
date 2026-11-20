import { expect, test } from '@playwright/test';
import { MOBILE_VIEWPORT } from './e2e.constants';
import { fullExercise, makeSession, ok, setsOf } from './support/session.fixtures';
import { progressBar } from './support/session.page';
import {
  mockShared,
  SHARED_POLL_MS,
  SHARED_TOKEN,
  toSharedActive,
  toSharedFinished,
} from './support/shared.fixtures';

const SHARED_PATH = `/s/${SHARED_TOKEN}`;
const INVALID_MESSAGE = 'Ссылка недействительна';
const OFFLINE_MESSAGE = 'Нет соединения. Повторяем попытку…';
const NOT_FOUND = 404;
const PLANNED_SETS = 3;
const EXERCISES = 3;
const PLAN_SET_TEXT = '62.5 кг × 7';
// подходы раскрыты только у текущего упражнения
const CURRENT_SETS_A = 1;
const CURRENT_SETS_B = 2;
const SUPERSET_SETS = 2;
const STATUS_HEADING = 'Тренировка идёт';
const WORKOUT_NAME = 'Тренировка A';
const SECRET_NOTE = 'Секретная заметка';

// первое упражнение выполнено, во втором один подход из трёх
const SESSION_A = makeSession({
  results: [...fullExercise(0), ...setsOf({ index: 1, setNumbers: [1] })],
});
const SESSION_B = makeSession({
  results: [...fullExercise(0), ...setsOf({ index: 1, setNumbers: [1, 2] })],
});

const SUPERSET_SESSION = makeSession({
  supersetGroups: [null, 1, 1],
  results: [
    ...fullExercise(0),
    ...setsOf({ index: 1, setNumbers: [1] }),
    ...setsOf({ index: 2, setNumbers: [1] }),
  ],
});

test.describe('страница друга', () => {
  test.use({ viewport: MOBILE_VIEWPORT });

  test('[ss-E14] показывает прогресс, текущее упражнение, вес, повторы и RPE', async ({ page }) => {
    await mockShared(page, [{ body: toSharedActive(SUPERSET_SESSION) }]);

    await page.goto(SHARED_PATH);

    await expect(page.getByRole('heading', { name: STATUS_HEADING, level: 1 })).toBeVisible();
    await expect(page.getByText(WORKOUT_NAME)).toHaveCount(0);
    await expect(progressBar(page)).toHaveJSProperty('max', EXERCISES);
    await expect
      .poll(() => progressBar(page).evaluate((element: HTMLProgressElement) => element.value))
      .toBeCloseTo(1 + 2 / PLANNED_SETS);
    await expect(page.getByText('Осталось подходов: 4 из 9', { exact: true })).toBeVisible();
    await expect(page.getByText('Осталось упражнений: 2 из 3', { exact: true })).toBeVisible();
    // подходы чередуются, поэтому раскрыты оба упражнения суперсета
    await expect(page.getByText(PLAN_SET_TEXT)).toHaveCount(SUPERSET_SETS);
    await expect(page.getByText('RPE 4')).toHaveCount(SUPERSET_SETS);
    await expect(page.getByText('Завершено', { exact: true })).toHaveCount(1);
    await expect(page.getByText('Сейчас', { exact: true })).toHaveCount(2);
    await expect(page.getByText('Не начато', { exact: true })).toHaveCount(0);
    // суперсет из двух последних упражнений отмечен
    await expect(page.getByRole('list', { name: 'Суперсет' })).toHaveCount(1);
  });

  test('[ss-E15] прогресс обновляется при следующем опросе', async ({ page }) => {
    await page.clock.install();
    await mockShared(page, [
      { body: toSharedActive(SESSION_A) },
      { body: toSharedActive(SESSION_B) },
    ]);
    await page.goto(SHARED_PATH);
    await expect(page.getByText(PLAN_SET_TEXT)).toHaveCount(CURRENT_SETS_A);

    await page.clock.runFor(SHARED_POLL_MS);

    await expect(page.getByText(PLAN_SET_TEXT)).toHaveCount(CURRENT_SETS_B);
  });

  test('[ss-E16] завершённая тренировка показывает сводку и прекращает опрос', async ({ page }) => {
    await page.clock.install();
    const server = await mockShared(page, [{ body: toSharedFinished(SESSION_B) }]);
    await page.goto(SHARED_PATH);

    await expect(page.getByText('Тренировка завершена')).toBeVisible();
    await expect(page.getByText('Упражнений: 2', { exact: true })).toBeVisible();
    await expect(page.getByText('Подходов: 5', { exact: true })).toBeVisible();
    // 5 подходов по 62,5 кг × 7 повторов; разделитель разрядов зависит от локали
    await expect(page.getByText(/2\D187,5/)).toBeVisible();
    await expect(page.getByText('Приседания со штангой')).toBeVisible();
    await expect(page.getByText('Завершено', { exact: true })).toHaveCount(2);
    await expect(page.getByText('Пропущено', { exact: true })).toHaveCount(1);
    await expect(page.getByText(PLAN_SET_TEXT)).toHaveCount(0);
    await expect(progressBar(page)).toHaveCount(0);
    await page.clock.runFor(SHARED_POLL_MS * 3);

    expect(server.calls()).toBe(1);
  });

  test('[ss-E17] недействительная ссылка', async ({ page }) => {
    await mockShared(page, [{ status: NOT_FOUND }]);

    await page.goto(SHARED_PATH);

    await expect(page.getByText(INVALID_MESSAGE)).toBeVisible();
    await expect(page.getByRole('heading', { name: WORKOUT_NAME })).toHaveCount(0);
  });

  test('[ss-E18] сетевая ошибка при опросе оставляет данные на экране', async ({ page }) => {
    await page.clock.install();
    await mockShared(page, [
      { body: toSharedActive(SESSION_A) },
      { abort: true },
      { body: toSharedActive(SESSION_B) },
    ]);
    await page.goto(SHARED_PATH);
    await expect(page.getByText(PLAN_SET_TEXT)).toHaveCount(CURRENT_SETS_A);

    await page.clock.runFor(SHARED_POLL_MS);

    await expect(page.getByText(OFFLINE_MESSAGE)).toBeVisible();
    await expect(page.getByText(PLAN_SET_TEXT)).toHaveCount(CURRENT_SETS_A);

    await page.clock.runFor(SHARED_POLL_MS);

    await expect(page.getByText(OFFLINE_MESSAGE)).toHaveCount(0);
    await expect(page.getByText(PLAN_SET_TEXT)).toHaveCount(CURRENT_SETS_B);
  });

  test('[ss-E19] сетевая ошибка при открытии страницы', async ({ page }) => {
    await page.clock.install();
    await mockShared(page, [{ abort: true }, { body: toSharedActive(SESSION_A) }]);

    await page.goto(SHARED_PATH);

    await expect(page.getByText(OFFLINE_MESSAGE)).toBeVisible();
    await expect(page.getByText(INVALID_MESSAGE)).toHaveCount(0);

    await page.clock.runFor(SHARED_POLL_MS);

    await expect(page.getByRole('heading', { name: STATUS_HEADING, level: 1 })).toBeVisible();
  });

  test('[ss-E20] состояние загрузки до первого ответа', async ({ page }) => {
    let release = (): void => undefined;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    await page.route(`**/api/shared/${SHARED_TOKEN}`, async (route) => {
      await gate;
      await route.fulfill({ json: ok(toSharedActive(SESSION_A)) });
    });

    await page.goto(SHARED_PATH);

    await expect(page.getByRole('status', { name: 'Загрузка тренировки' })).toBeVisible();
    await expect(page.getByText(INVALID_MESSAGE)).toHaveCount(0);
    await expect(page.getByRole('heading', { name: WORKOUT_NAME })).toHaveCount(0);
    release();
    await expect(page.getByRole('heading', { name: STATUS_HEADING, level: 1 })).toBeVisible();
  });

  test('[ss-E21] страница открывается вне оболочки приложения и не показывает заметок', async ({
    page,
  }) => {
    // сервер заметок не отдаёт; страница не должна выводить их, даже если поле окажется в ответе
    const leaked = toSharedActive(SESSION_A);
    const withNote = {
      ...leaked,
      results: leaked.results.map((result) => ({ ...result, note: SECRET_NOTE })),
    } as unknown as typeof leaked;
    await mockShared(page, [{ body: withNote }]);

    await page.goto(SHARED_PATH);
    await expect(page.getByRole('heading', { name: STATUS_HEADING, level: 1 })).toBeVisible();

    await expect(page.locator('app-shell')).toHaveCount(0);
    await expect(page.getByRole('link', { name: 'Strive' })).toHaveCount(0);
    await expect(page.getByText(SECRET_NOTE)).toHaveCount(0);
  });
});
