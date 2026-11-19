import { expect, test } from '@playwright/test';
import { DESKTOP_VIEWPORT, MOBILE_VIEWPORT } from './e2e.constants';
import { fullExercise, makeSession, ok, setsOf, STARTED_AT } from './support/session.fixtures';
import {
  bottomFinishButton,
  finishButton,
  position,
  saveButton,
  setForm,
} from './support/session.page';
import {
  makeFinishedSession,
  makeSummary,
  mockSessionList,
  mockSummary,
} from './support/history.fixtures';
import { startSessionServer } from './support/session.server';

const HTTP_ERROR = 500;
const SESSION_ID = 1;
const OTHER_SESSION_ID = 8;
const MAX_COLUMN_WIDTH = 720;
const ALL_DONE = [...fullExercise(0), ...fullExercise(1), ...fullExercise(2)];
const FIRST_MISSING_SET = [
  ...setsOf({ index: 0, setNumbers: [1, 2] }),
  ...fullExercise(1),
  ...fullExercise(2),
];
const FINISH_DIALOG = 'Завершить тренировку?';

test.describe('действие и завершение', () => {
  test.use({ viewport: MOBILE_VIEWPORT });

  test('[rf-E7] завершение открывает детали именно этой тренировки', async ({ page }) => {
    await startSessionServer(page, { session: makeSession({ results: ALL_DONE }) });
    await mockSessionList(page, [
      makeFinishedSession({ id: OTHER_SESSION_ID, name: 'Тренировка B' }),
    ]);
    await mockSummary({
      page,
      id: SESSION_ID,
      response: makeSummary({ id: SESSION_ID, workoutName: 'Тренировка A' }),
    });
    await page.goto('/workouts/session');

    await bottomFinishButton(page).click();

    await expect(page).toHaveURL(/\/history\/1$/);
    await expect(page.getByRole('heading', { name: 'Тренировка A', level: 1 })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Тренировка B' })).toHaveCount(0);
  });

  test('[rf-E9] из деталей можно вернуться к списку', async ({ page }) => {
    await startSessionServer(page, { session: makeSession({ results: ALL_DONE }) });
    await mockSessionList(page, [makeFinishedSession({ id: SESSION_ID, name: 'Тренировка A' })]);
    await mockSummary({
      page,
      id: SESSION_ID,
      response: makeSummary({ id: SESSION_ID, workoutName: 'Тренировка A' }),
    });
    await page.goto('/workouts/session');
    await bottomFinishButton(page).click();
    await expect(page).toHaveURL(/\/history\/1$/);

    await page.getByRole('link', { name: '← История' }).click();

    await expect(page).toHaveURL(/\/history$/);
    await expect(page.getByRole('main').getByRole('listitem')).toContainText('Тренировка A');
  });

  test('«Следующее упражнение» переключает на следующее', async ({ page }) => {
    await startSessionServer(page, { session: makeSession({ results: fullExercise(0) }) });
    await page.goto('/workouts/session');
    await page.getByRole('button', { name: 'Назад', exact: true }).click();
    await expect(position({ page, current: 1, total: 3 })).toBeVisible();

    await page.getByRole('button', { name: 'Следующее упражнение' }).click();

    await expect(position({ page, current: 2, total: 3 })).toBeVisible();
  });

  test('«Завершить» в шапке при выполненной тренировке завершает без диалога', async ({ page }) => {
    const server = await startSessionServer(page, { session: makeSession({ results: ALL_DONE }) });
    await page.goto('/workouts/session');

    await finishButton(page).click();

    await expect(page).toHaveURL(/\/history\/1$/);
    await expect(page.getByRole('dialog')).toHaveCount(0);
    expect(server.finishes).toEqual(['POST']);
  });

  test('«Завершить» в шапке при неполных подходах открывает подтверждение', async ({ page }) => {
    await startSessionServer(page);
    await page.goto('/workouts/session');

    await finishButton(page).click();

    await expect(page.getByRole('dialog')).toContainText(FINISH_DIALOG);
  });

  test('[rf-E8] «Продолжить тренировку» в диалоге не завершает тренировку', async ({ page }) => {
    const server = await startSessionServer(page);
    await page.goto('/workouts/session');
    await finishButton(page).click();

    await page.getByRole('dialog').getByRole('button', { name: 'Продолжить тренировку' }).click();

    await expect(page.getByRole('dialog')).toHaveCount(0);
    expect(server.finishes).toEqual([]);
  });

  test('[rf-E8] подтверждение завершает тренировку и открывает её детали', async ({ page }) => {
    const server = await startSessionServer(page);
    await page.goto('/workouts/session');
    await finishButton(page).click();

    await page.getByRole('dialog').getByRole('button', { name: 'Завершить', exact: true }).click();

    await expect(page).toHaveURL(/\/history\/1$/);
    expect(server.finishes).toEqual(['POST']);
  });

  test('нижняя «Завершить тренировку» при неполных подходах тоже просит подтверждение', async ({
    page,
  }) => {
    const server = await startSessionServer(page, {
      session: makeSession({ results: FIRST_MISSING_SET }),
    });
    await page.goto('/workouts/session');
    await page.getByRole('button', { name: 'Далее', exact: true }).click();
    await page.getByRole('button', { name: 'Далее', exact: true }).click();

    await bottomFinishButton(page).click();

    await expect(page.getByRole('dialog')).toContainText(FINISH_DIALOG);
    expect(server.finishes).toEqual([]);
  });

  test('когда выполнены все подходы, «Завершить тренировку» завершает без диалога', async ({
    page,
  }) => {
    const server = await startSessionServer(page, { session: makeSession({ results: ALL_DONE }) });
    await page.goto('/workouts/session');

    await bottomFinishButton(page).click();

    await expect(page).toHaveURL(/\/history\/1$/);
    await expect(page.getByRole('dialog')).toHaveCount(0);
    expect(server.finishes).toEqual(['POST']);
  });

  test('[rf-E10] ошибка завершения оставляет на экране тренировки, повтор открывает детали', async ({
    page,
  }) => {
    await startSessionServer(page, { finishStatus: HTTP_ERROR });
    await page.goto('/workouts/session');
    await finishButton(page).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Завершить', exact: true }).click();
    await expect(page.getByRole('alert')).toContainText(
      'Не удалось завершить тренировку. Попробуйте ещё раз.',
    );
    await expect(page).toHaveURL(/\/workouts\/session$/);
    await page.route('**/api/sessions/1/finish', (route) =>
      route.fulfill({ json: ok({ ...makeSession(), finishedAt: STARTED_AT }) }),
    );

    await finishButton(page).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Завершить', exact: true }).click();

    await expect(page).toHaveURL(/\/history\/1$/);
  });

  test('на 375×667 кнопка действия видна над нижней навигацией', async ({ page }) => {
    await startSessionServer(page);
    await page.goto('/workouts/session');
    await expect(setForm(page)).toBeVisible();
    const save = saveButton(page);
    await save.scrollIntoViewIfNeeded();

    const saveBox = await save.boundingBox();
    const navBox = await page.getByRole('navigation', { name: 'Основная навигация' }).boundingBox();

    expect((saveBox?.y ?? 0) + (saveBox?.height ?? 0)).toBeLessThanOrEqual(navBox?.y ?? 0);
  });
});

test.describe('раскладка экрана', () => {
  test.use({ viewport: DESKTOP_VIEWPORT });

  test('на 1280×720 контент в колонке не шире 720 px', async ({ page }) => {
    await startSessionServer(page);
    await page.goto('/workouts/session');

    const box = await page.getByRole('group', { name: 'План и ввод подхода' }).boundingBox();

    expect(box?.width).toBeLessThanOrEqual(MAX_COLUMN_WIDTH);
  });

  test('на 1280×720 действия доступны и нет горизонтальной прокрутки', async ({ page }) => {
    await startSessionServer(page);
    await page.goto('/workouts/session');

    await expect(setForm(page)).toBeVisible();
    await expect(saveButton(page)).toBeVisible();
    await expect(page.getByRole('button', { name: 'Назад', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Далее', exact: true })).toBeVisible();
    const noOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth <= document.documentElement.clientWidth,
    );
    expect(noOverflow).toBe(true);
  });
});
