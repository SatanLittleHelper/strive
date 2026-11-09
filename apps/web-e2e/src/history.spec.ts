import { expect, test, type Page } from '@playwright/test';
import { MOBILE_VIEWPORT } from './e2e.constants';
import {
  BENCH_EXERCISE_ID,
  fulfillAfterDelay,
  historySet,
  makeFinishedSession,
  makeSummary,
  mockSessionList,
  mockSummary,
  SUMMARY_ID,
} from './support/history.fixtures';

const OTHER_SESSION_ID = 8;
const FIRST_EXERCISE_ID = 1;
const SECOND_EXERCISE_ID = 2;
const HTTP_NOT_FOUND = 404;
const HTTP_BAD_REQUEST = 400;
const HTTP_CONFLICT = 409;
const UNKNOWN_SESSION_ID = 999;
const NOT_FINISHED_SESSION_ID = 8;
const NOTE = 'Контроль техники';
const RPE = 4;

const FIRST_SESSION = makeFinishedSession({
  id: SUMMARY_ID,
  name: 'Тренировка A',
  results: [
    historySet({ exerciseId: FIRST_EXERCISE_ID, setNumber: 1 }),
    historySet({ exerciseId: FIRST_EXERCISE_ID, setNumber: 2 }),
    historySet({ exerciseId: SECOND_EXERCISE_ID, setNumber: 1 }),
  ],
});
const SECOND_SESSION = makeFinishedSession({ id: OTHER_SESSION_ID, name: 'Тренировка B' });

const listItems = (page: Page) => page.getByRole('main').getByRole('listitem');

test.describe('список истории с мокнутым API', () => {
  test.use({ viewport: MOBILE_VIEWPORT, timezoneId: 'UTC' });

  test('[H2-E3] список показывает название, дату и сводку каждой тренировки', async ({ page }) => {
    await mockSessionList(page, [FIRST_SESSION, SECOND_SESSION]);
    await page.goto('/history');

    const rows = listItems(page);
    await expect(rows).toHaveCount(2);
    await expect(rows.nth(0)).toContainText('Тренировка A');
    await expect(rows.nth(0)).toContainText('15.10.2026');
    await expect(rows.nth(0)).toContainText('2 упражнения · 3 подхода');
    await expect(rows.nth(1)).toContainText('Тренировка B');
  });

  test('[H2-E4] тап по строке открывает детали', async ({ page }) => {
    await mockSessionList(page, [FIRST_SESSION]);
    await mockSummary({ page, id: SUMMARY_ID, response: makeSummary() });
    await page.goto('/history');

    await page
      .getByRole('main')
      .getByRole('link', { name: /Тренировка A/ })
      .click();

    await expect(page).toHaveURL(new RegExp(`/history/${SUMMARY_ID}$`));
  });

  test('[H2-E5] пустая история показывает пустое состояние', async ({ page }) => {
    await mockSessionList(page, []);
    await page.goto('/history');

    await expect(page.getByRole('heading', { name: 'История', exact: true })).toBeVisible();
    await expect(page.getByText('История пока пуста')).toBeVisible();
  });

  test('[H2-E6] ошибка загрузки списка даёт повторить запрос', async ({ page }) => {
    await page.route('**/api/sessions', (route) => route.abort());
    await page.goto('/history');
    await expect(page.getByRole('alert')).toContainText('Не удалось загрузить историю');

    await page.unroute('**/api/sessions');
    await mockSessionList(page, [FIRST_SESSION]);
    await page.getByRole('button', { name: 'Повторить' }).click();

    await expect(listItems(page)).toHaveCount(1);
    await expect(page.getByRole('main')).toContainText('Тренировка A');
  });

  test('[H2-E7] пока список грузится, виден индикатор загрузки', async ({ page }) => {
    await page.route('**/api/sessions', (route) =>
      fulfillAfterDelay(route, { sessions: [FIRST_SESSION] }),
    );
    await page.goto('/history');

    await expect(page.getByRole('status', { name: 'Загрузка истории' })).toBeVisible();
    await expect(listItems(page)).toHaveCount(1);
  });
});

test.describe('детали истории с мокнутым API', () => {
  test.use({ viewport: MOBILE_VIEWPORT, timezoneId: 'UTC' });

  test('[H2-E8] показывает шапку и карточки упражнений с подходами', async ({ page }) => {
    await mockSummary({ page, id: SUMMARY_ID, response: makeSummary() });
    await page.goto(`/history/${SUMMARY_ID}`);

    const main = page.getByRole('main');
    await expect(page.getByRole('heading', { name: 'Тренировка A', level: 1 })).toBeVisible();
    await expect(main).toContainText('15.10.2026');
    await expect(main).toContainText('1 ч 12 мин');
    await expect(main).toContainText('7 450 кг');
    const exercises = page.getByRole('heading', { level: 2 });
    await expect(exercises.nth(0)).toHaveText('Жим лёжа');
    await expect(exercises.nth(1)).toHaveText('Приседания со штангой');
    const sets = listItems(page);
    await expect(sets.nth(0)).toContainText('60 кг × 8');
    await expect(sets.nth(1)).toContainText('60 кг × 6');
    await expect(sets.nth(2)).toContainText('100 кг × 5');
  });

  test('[H2-E9] показывает RPE и заметку только если они заданы', async ({ page }) => {
    const summary = makeSummary({
      exercises: [
        {
          exerciseId: BENCH_EXERCISE_ID,
          name: 'Жим лёжа',
          supersetGroup: null,
          sets: [
            historySet({ exerciseId: BENCH_EXERCISE_ID, setNumber: 1, rpe: RPE, note: NOTE }),
            historySet({ exerciseId: BENCH_EXERCISE_ID, setNumber: 2 }),
          ],
        },
      ],
    });
    await mockSummary({ page, id: SUMMARY_ID, response: summary });
    await page.goto(`/history/${SUMMARY_ID}`);

    const sets = listItems(page);
    await expect(sets.nth(0)).toContainText(`RPE ${RPE}`);
    await expect(sets.nth(0)).toContainText(NOTE);
    await expect(sets.nth(1)).not.toContainText('RPE');
    await expect(sets.nth(1)).not.toContainText(NOTE);
  });

  test('[H2-E10] ответ 404 показывает «Тренировка не найдена» со ссылкой назад', async ({
    page,
  }) => {
    await mockSummary({ page, id: UNKNOWN_SESSION_ID, response: { status: HTTP_NOT_FOUND } });
    await page.goto(`/history/${UNKNOWN_SESSION_ID}`);

    await expect(page.getByText('Тренировка не найдена')).toBeVisible();
    await expect(page.getByRole('link', { name: '← История' })).toBeVisible();
  });

  test('[H2-E11] ответ 400 показывает «Тренировка не найдена», а не повтор', async ({ page }) => {
    await mockSummary({ page, id: 'abc', response: { status: HTTP_BAD_REQUEST } });
    await page.goto('/history/abc');

    await expect(page.getByText('Тренировка не найдена')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Повторить' })).toHaveCount(0);
  });

  test('[H2-E12] ответ 409 показывает «Тренировка не найдена», а не повтор', async ({ page }) => {
    await mockSummary({
      page,
      id: NOT_FINISHED_SESSION_ID,
      response: { status: HTTP_CONFLICT },
    });
    await page.goto(`/history/${NOT_FINISHED_SESSION_ID}`);

    await expect(page.getByText('Тренировка не найдена')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Повторить' })).toHaveCount(0);
  });

  test('[H2-E13] ошибка сети в деталях даёт повторить запрос', async ({ page }) => {
    await page.route(`**/api/sessions/${SUMMARY_ID}/summary`, (route) => route.abort());
    await page.goto(`/history/${SUMMARY_ID}`);
    await expect(page.getByRole('alert')).toContainText('Не удалось загрузить тренировку');

    await page.unroute(`**/api/sessions/${SUMMARY_ID}/summary`);
    await mockSummary({ page, id: SUMMARY_ID, response: makeSummary() });
    await page.getByRole('button', { name: 'Повторить' }).click();

    await expect(page.getByRole('heading', { name: 'Тренировка A', level: 1 })).toBeVisible();
    await expect(listItems(page)).toHaveCount(3);
  });

  test('[H2-E14] ссылка «← История» возвращает к списку', async ({ page }) => {
    await mockSessionList(page, [FIRST_SESSION]);
    await mockSummary({ page, id: SUMMARY_ID, response: makeSummary() });
    await page.goto(`/history/${SUMMARY_ID}`);

    await page.getByRole('link', { name: '← История' }).click();

    await expect(page).toHaveURL(/\/history$/);
    await expect(listItems(page)).toHaveCount(1);
  });

  test('[H2-E15] пока детали грузятся, виден индикатор загрузки', async ({ page }) => {
    await page.route(`**/api/sessions/${SUMMARY_ID}/summary`, (route) =>
      fulfillAfterDelay(route, makeSummary()),
    );
    await page.goto(`/history/${SUMMARY_ID}`);

    await expect(page.getByRole('status', { name: 'Загрузка тренировки' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Тренировка A', level: 1 })).toBeVisible();
  });
});
