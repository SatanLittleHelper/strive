import { expect, test } from '@playwright/test';
import { MOBILE_VIEWPORT } from './e2e.constants';
import { fullExercise, historyOf, makeSession, savedSet, setsOf } from './support/session.fixtures';
import { repsField, saveButton, setForm, todayGroup, weightField } from './support/session.page';
import { startSessionServer } from './support/session.server';

const HTTP_ERROR = 500;
const FIRST_DATE = '2026-10-29T12:00:00.000Z';
const SECOND_DATE = '2026-10-22T12:00:00.000Z';
const FIRST_DATE_TITLE = '29.10.2026';
const SECOND_DATE_TITLE = '22.10.2026';

const pastSet = ({
  setNumber,
  weight,
  reps,
  rpe,
}: {
  setNumber: number;
  weight: number;
  reps: number;
  rpe: number;
}) => savedSet({ exerciseId: 1, setNumber, weight, reps, rpe });

const TWO_ENTRIES = historyOf(0, [
  {
    sessionId: 11,
    finishedAt: FIRST_DATE,
    sets: [
      pastSet({ setNumber: 1, weight: 60, reps: 6, rpe: 3 }),
      pastSet({ setNumber: 2, weight: 60, reps: 6, rpe: 4 }),
    ],
  },
  {
    sessionId: 12,
    finishedAt: SECOND_DATE,
    sets: [pastSet({ setNumber: 1, weight: 57.5, reps: 6, rpe: 3 })],
  },
]);

test.describe('история упражнения и правка подхода', () => {
  test.use({ viewport: MOBILE_VIEWPORT });

  test('история показывает строки «вес × повторы» и RPE', async ({ page }) => {
    await startSessionServer(page, { history: TWO_ENTRIES });
    await page.goto('/workouts/session');

    const rows = page.getByRole('group', { name: FIRST_DATE_TITLE }).getByRole('button');

    await expect(rows).toHaveCount(2);
    await expect(rows.nth(0)).toContainText('60 кг × 6 повт.');
    await expect(rows.nth(0)).toContainText('RPE 3');
    await expect(rows.nth(1)).toContainText('60 кг × 6 повт.');
    await expect(rows.nth(1)).toContainText('RPE 4');
  });

  test('группы истории идут от новых дат к старым', async ({ page }) => {
    await startSessionServer(page, { history: TWO_ENTRIES });
    await page.goto('/workouts/session');

    const newer = await page.getByRole('group', { name: FIRST_DATE_TITLE }).boundingBox();
    const older = await page.getByRole('group', { name: SECOND_DATE_TITLE }).boundingBox();

    expect(newer?.y).toBeLessThan(older?.y ?? 0);
  });

  test('тап по строке прошлой записи подставляет вес, повторы и RPE без сохранения', async ({
    page,
  }) => {
    const server = await startSessionServer(page, {
      session: makeSession({ results: setsOf({ index: 0, setNumbers: [1, 2] }) }),
      history: historyOf(0, [
        {
          sessionId: 11,
          finishedAt: FIRST_DATE,
          sets: [pastSet({ setNumber: 3, weight: 57.5, reps: 7, rpe: 4 })],
        },
      ]),
    });
    await page.goto('/workouts/session');

    await page.getByRole('group', { name: FIRST_DATE_TITLE }).getByRole('button').click();

    await expect(weightField(page)).toHaveValue(/^57\.5/);
    await expect(repsField(page)).toHaveValue('7');
    await expect(
      page.getByRole('radiogroup', { name: 'RPE от 1 до 5' }).getByRole('radio', { name: '4' }),
    ).toBeChecked();
    expect(server.saves).toEqual([]);
  });

  test('у выполненного упражнения строки прошлых дат неактивны', async ({ page }) => {
    await startSessionServer(page, {
      session: makeSession({ exerciseCount: 1, results: fullExercise(0) }),
      history: TWO_ENTRIES,
    });
    await page.goto('/workouts/session');

    await expect(
      page.getByRole('group', { name: FIRST_DATE_TITLE }).getByRole('button').first(),
    ).toBeDisabled();
  });

  test('без прошлых записей — сообщение', async ({ page }) => {
    await startSessionServer(page, { history: { exercises: [] } });
    await page.goto('/workouts/session');

    await expect(page.getByText('Это упражнение ещё не выполнялось')).toBeVisible();
  });

  test('ошибка загрузки истории скрывает прошлые даты, страница работает', async ({ page }) => {
    const server = await startSessionServer(page, { history: { status: HTTP_ERROR } });
    await page.goto('/workouts/session');
    await expect(setForm(page)).toBeVisible();

    await saveButton(page).click();

    await expect(page.getByRole('group', { name: /^\d{2}\.\d{2}\.\d{4}$/ })).toHaveCount(0);
    await expect(page.getByRole('alert')).toHaveCount(0);
    await expect.poll(() => server.saves.length).toBe(1);
  });

  test('поздно пришедшая история не затирает введённый вес', async ({ page }) => {
    const server = await startSessionServer(page, {
      session: makeSession({ weight: null }),
      history: historyOf(0, [
        {
          sessionId: 11,
          finishedAt: FIRST_DATE,
          sets: [pastSet({ setNumber: 1, weight: 57.5, reps: 6, rpe: 3 })],
        },
      ]),
      holdHistory: true,
    });
    await page.goto('/workouts/session');
    await weightField(page).fill('62.5');

    server.releaseHistory();

    await expect(page.getByRole('group', { name: FIRST_DATE_TITLE })).toBeVisible();
    await expect(weightField(page)).toHaveValue(/^62\.5/);
  });

  test('«Сегодня» показывает сохранённые подходы с весом, повторами и RPE', async ({ page }) => {
    await startSessionServer(page, {
      session: makeSession({ results: [pastSet({ setNumber: 1, weight: 60, reps: 6, rpe: 4 })] }),
    });
    await page.goto('/workouts/session');

    const row = todayGroup(page).getByRole('button');

    await expect(row).toContainText('60 кг × 6 повт.');
    await expect(row).toContainText('RPE 4');
  });

  test('тап по подходу в «Сегодня» открывает его на правку', async ({ page }) => {
    await startSessionServer(page, {
      session: makeSession({ results: [pastSet({ setNumber: 1, weight: 60, reps: 6, rpe: 4 })] }),
    });
    await page.goto('/workouts/session');

    await todayGroup(page).getByRole('button').click();

    await expect(weightField(page)).toHaveValue('60');
    await expect(repsField(page)).toHaveValue('6');
    await expect(
      page.getByRole('radiogroup', { name: 'RPE от 1 до 5' }).getByRole('radio', { name: '4' }),
    ).toBeChecked();
    await expect(page.getByText('правка 1', { exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Сохранить изменения' })).toBeVisible();
  });

  test('сохранение правки отправляет тот же номер подхода', async ({ page }) => {
    const server = await startSessionServer(page, {
      session: makeSession({ results: setsOf({ index: 0, setNumbers: [1, 2] }) }),
    });
    await page.goto('/workouts/session');
    await todayGroup(page).getByRole('button').first().click();
    await weightField(page).fill('65');

    await page.getByRole('button', { name: 'Сохранить изменения' }).click();

    await expect.poll(() => server.saves[0]?.setNumber).toBe(1);
    expect(server.saves[0]?.body.weight).toBe(65);
  });

  test('после правки форма возвращается к первому несохранённому подходу', async ({ page }) => {
    await startSessionServer(page, {
      session: makeSession({ results: setsOf({ index: 0, setNumbers: [1, 2] }) }),
    });
    await page.goto('/workouts/session');
    await todayGroup(page).getByRole('button').first().click();

    await page.getByRole('button', { name: 'Сохранить изменения' }).click();

    await expect(page.getByRole('form', { name: 'Подход 3' })).toBeVisible();
    await expect(page.getByText('подход 3', { exact: true })).toBeVisible();
  });

  test('после правки в полностью выполненном упражнении показывается карточка «Упражнение выполнено»', async ({
    page,
  }) => {
    await startSessionServer(page, {
      session: makeSession({ exerciseCount: 1, results: fullExercise(0) }),
    });
    await page.goto('/workouts/session');
    await todayGroup(page).getByRole('button').nth(1).click();

    await page.getByRole('button', { name: 'Сохранить изменения' }).click();

    await expect(page.getByRole('region', { name: 'Упражнение выполнено' })).toBeVisible();
    await expect(setForm(page)).toHaveCount(0);
  });

  test('без сохранённых подходов группы «Сегодня» нет', async ({ page }) => {
    await startSessionServer(page);
    await page.goto('/workouts/session');
    await expect(setForm(page)).toBeVisible();

    await expect(page.getByRole('heading', { name: 'Сегодня' })).toHaveCount(0);
  });
});
