import { expect, test } from '@playwright/test';
import { MOBILE_VIEWPORT } from './e2e.constants';
import {
  fillSetForm,
  fullExercise,
  historyOf,
  makeSession,
  ok,
  savedSet,
  setsOf,
} from './support/session.fixtures';
import {
  noteField,
  repsField,
  saveButton,
  setForm,
  todayGroup,
  weightField,
} from './support/session.page';
import { startSessionServer } from './support/session.server';

const HTTP_ERROR = 500;
const EMPTY_MESSAGE = 'Это упражнение ещё не выполнялось';
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
}) => savedSet({ workoutExerciseId: 1, setNumber, weight, reps, rpe });

const TWO_ENTRIES = historyOf(1, [
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
    await expect(rows.nth(0)).toContainText('RPE 4');
    await expect(rows.nth(1)).toContainText('60 кг × 6 повт.');
    await expect(rows.nth(1)).toContainText('RPE 3');
  });

  test('группы истории идут от новых дат к старым', async ({ page }) => {
    await startSessionServer(page, { history: TWO_ENTRIES });
    await page.goto('/workouts/session');

    const newer = await page.getByRole('group', { name: FIRST_DATE_TITLE }).boundingBox();
    const older = await page.getByRole('group', { name: SECOND_DATE_TITLE }).boundingBox();

    expect(newer?.y).toBeLessThan(older?.y ?? 0);
  });

  test('[E1] подходы в «Сегодня» и в прошлой дате идут от последнего к первому', async ({
    page,
  }) => {
    await startSessionServer(page, {
      session: makeSession({
        exerciseCount: 1,
        results: setsOf({ index: 0, setNumbers: [1, 2, 3] }),
      }),
      history: TWO_ENTRIES,
    });
    await page.goto('/workouts/session');

    const today = todayGroup(page).getByRole('button');
    const past = page.getByRole('group', { name: FIRST_DATE_TITLE }).getByRole('button');

    await expect(today).toContainText(['Подход 3', 'Подход 2', 'Подход 1']);
    await expect(past).toContainText(['Подход 2', 'Подход 1']);
  });

  test('[E16] порядок отображения не меняет даты и значения по умолчанию', async ({ page }) => {
    await startSessionServer(page, {
      session: makeSession({ weight: null }),
      history: TWO_ENTRIES,
    });
    await page.goto('/workouts/session');

    const newer = await page.getByRole('group', { name: FIRST_DATE_TITLE }).boundingBox();
    const older = await page.getByRole('group', { name: SECOND_DATE_TITLE }).boundingBox();

    expect(newer?.y).toBeLessThan(older?.y ?? 0);
    await expect(weightField(page)).toHaveValue(/^60(\.0+)?$/);
  });

  test('[E3] тап по строке прошлой записи подставляет вес, повторы и RPE, заметка остаётся, без сохранения', async ({
    page,
  }) => {
    const server = await startSessionServer(page, {
      session: makeSession({ results: setsOf({ index: 0, setNumbers: [1, 2] }) }),
      history: historyOf(1, [
        {
          sessionId: 11,
          finishedAt: FIRST_DATE,
          sets: [pastSet({ setNumber: 3, weight: 57.5, reps: 7, rpe: 4 })],
        },
      ]),
    });
    await page.goto('/workouts/session');
    await fillSetForm(page, { weight: '40', reps: '3', note: 'тяжело в конце' }, 3);

    await page.getByRole('group', { name: FIRST_DATE_TITLE }).getByRole('button').click();

    await expect(weightField(page)).toHaveValue(/^57\.5/);
    await expect(repsField(page)).toHaveValue('7');
    await expect(
      page.getByRole('radiogroup', { name: 'RPE от 1 до 5' }).getByRole('radio', { name: '4' }),
    ).toBeChecked();
    await expect(noteField(page)).toHaveValue('тяжело в конце');
    expect(server.saves).toEqual([]);
  });

  test('[E20] тап по сегодняшней записи подставляет значения, заметка и запись не меняются', async ({
    page,
  }) => {
    const server = await startSessionServer(page, {
      session: makeSession({
        results: [pastSet({ setNumber: 1, weight: 40, reps: 10, rpe: 3 })],
      }),
    });
    await page.goto('/workouts/session');
    await fillSetForm(page, { weight: '55', reps: '8', note: 'разминка' }, 2);

    await todayGroup(page).getByRole('button').click();

    await expect(weightField(page)).toHaveValue('40');
    await expect(repsField(page)).toHaveValue('10');
    await expect(
      page.getByRole('radiogroup', { name: 'RPE от 1 до 5' }).getByRole('radio', { name: '3' }),
    ).toBeChecked();
    await expect(noteField(page)).toHaveValue('разминка');
    await expect(page.getByRole('button', { name: 'Сохранить подход', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Сохранить изменения' })).toHaveCount(0);
    await expect(todayGroup(page).getByRole('button')).toContainText('40 кг × 10 повт.');
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

  test('[E28] без сегодняшних и прошлых подходов после загрузки — сообщение', async ({ page }) => {
    await startSessionServer(page, { history: { exercises: [] } });
    await page.goto('/workouts/session');

    await expect(page.getByText(EMPTY_MESSAGE)).toBeVisible();
  });

  test('[E9] при сегодняшнем подходе и пустой прошлой истории сообщения нет', async ({ page }) => {
    await startSessionServer(page, {
      session: makeSession({ results: setsOf({ index: 0, setNumbers: [1] }) }),
      history: { exercises: [] },
    });
    await page.goto('/workouts/session');

    await expect(todayGroup(page)).toBeVisible();
    await expect(page.getByText(EMPTY_MESSAGE)).toHaveCount(0);
  });

  test('[E29] пока история загружается, сообщения нет, после ответа оно появляется', async ({
    page,
  }) => {
    const server = await startSessionServer(page, {
      history: { exercises: [] },
      holdHistory: true,
    });
    await page.goto('/workouts/session');
    await expect(setForm(page)).toBeVisible();

    const loading = page.getByRole('status', { name: 'Загрузка', exact: true });

    await expect(loading).toBeVisible();
    await expect(page.getByText(EMPTY_MESSAGE)).toHaveCount(0);

    server.releaseHistory();

    await expect(page.getByText(EMPTY_MESSAGE)).toBeVisible();
    await expect(loading).toHaveCount(0);
  });

  test('[E30] ошибка истории показывает сообщение об ошибке, не пустое состояние; страница работает', async ({
    page,
  }) => {
    const server = await startSessionServer(page, { history: { status: HTTP_ERROR } });
    await page.goto('/workouts/session');
    await expect(setForm(page)).toBeVisible();

    await expect(page.getByText('Не удалось загрузить данные')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Повторить' })).toBeVisible();
    await expect(page.getByText(EMPTY_MESSAGE)).toHaveCount(0);
    await expect(page.getByRole('group', { name: /^\d{2}\.\d{2}\.\d{4}$/ })).toHaveCount(0);

    await saveButton(page).click();

    await expect.poll(() => server.saves.length).toBe(1);
  });

  test('«Повторить» перезапрашивает историю после ошибки', async ({ page }) => {
    await startSessionServer(page, { history: { status: HTTP_ERROR } });
    await page.goto('/workouts/session');
    await expect(page.getByRole('button', { name: 'Повторить' })).toBeVisible();
    await page.route('**/api/sessions/1/history', (route) =>
      route.fulfill({ json: ok(TWO_ENTRIES) }),
    );

    await page.getByRole('button', { name: 'Повторить' }).click();

    await expect(page.getByRole('group', { name: FIRST_DATE_TITLE })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Повторить' })).toHaveCount(0);
  });

  test('поздно пришедшая история не затирает введённый вес', async ({ page }) => {
    const server = await startSessionServer(page, {
      session: makeSession({ weight: null }),
      history: historyOf(1, [
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

  test.fixme('(вернуть в R2) тап по подходу в «Сегодня» открывает его на правку', async ({
    page,
  }) => {
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

  test.fixme('(вернуть в R2) сохранение правки отправляет тот же номер подхода', async ({
    page,
  }) => {
    const server = await startSessionServer(page, {
      session: makeSession({ results: setsOf({ index: 0, setNumbers: [1, 2] }) }),
    });
    await page.goto('/workouts/session');
    await todayGroup(page).getByRole('button').last().click();
    await weightField(page).fill('65');

    await page.getByRole('button', { name: 'Сохранить изменения' }).click();

    await expect.poll(() => server.saves[0]?.setNumber).toBe(1);
    expect(server.saves[0]?.body.weight).toBe(65);
  });

  test.fixme('(вернуть в R2) после правки форма возвращается к первому несохранённому подходу', async ({
    page,
  }) => {
    await startSessionServer(page, {
      session: makeSession({ results: setsOf({ index: 0, setNumbers: [1, 2] }) }),
    });
    await page.goto('/workouts/session');
    await todayGroup(page).getByRole('button').last().click();

    await page.getByRole('button', { name: 'Сохранить изменения' }).click();

    await expect(page.getByRole('form', { name: 'Подход 3' })).toBeVisible();
    await expect(page.getByText('подход 3', { exact: true })).toBeVisible();
  });

  test.fixme('(вернуть в R2) после правки в полностью выполненном упражнении показывается карточка «Упражнение выполнено»', async ({
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
