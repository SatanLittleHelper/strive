import { expect, test, type Locator, type Page } from '@playwright/test';
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
  position,
  repsField,
  saveButton,
  setForm,
  todayGroup,
  todayRow,
  weightField,
} from './support/session.page';
import { startSessionServer } from './support/session.server';
import { swipeRow } from './support/swipe';

const SAVE_ERROR = 'Не удалось сохранить подход. Попробуйте ещё раз.';

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

  test('[E2] свайп влево по строке «Сегодня» открывает подход на правку @touch', async ({
    page,
  }) => {
    await startSessionServer(page, {
      session: makeSession({
        results: [
          savedSet({
            workoutExerciseId: 1,
            setNumber: 1,
            weight: 60,
            reps: 6,
            rpe: 4,
            note: 'тяжело в конце',
          }),
        ],
      }),
    });
    await page.goto('/workouts/session');

    await swipeRow(page, { from: todayRow(page), direction: 'left' });

    await expect(weightField(page)).toHaveValue('60');
    await expect(repsField(page)).toHaveValue('6');
    await expect(
      page.getByRole('radiogroup', { name: 'RPE от 1 до 5' }).getByRole('radio', { name: '4' }),
    ).toBeChecked();
    await expect(noteField(page)).toHaveValue('тяжело в конце');
    await expect(page.getByText('правка 1', { exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Сохранить изменения' })).toBeVisible();
  });

  test('[E46] свайп вправо по строке «Сегодня» правку не открывает @touch', async ({ page }) => {
    await startSessionServer(page, {
      session: makeSession({ results: [pastSet({ setNumber: 1, weight: 60, reps: 6, rpe: 4 })] }),
    });
    await page.goto('/workouts/session');

    await swipeRow(page, { from: todayRow(page), direction: 'right' });

    await expect(page.getByRole('form', { name: 'Подход 2' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Сохранить подход', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Сохранить изменения' })).toHaveCount(0);
  });

  test('[E51] свайп по строке «Сегодня» не переключает упражнение @touch', async ({ page }) => {
    await startSessionServer(page, {
      session: makeSession({ results: [pastSet({ setNumber: 1, weight: 60, reps: 6, rpe: 4 })] }),
    });
    await page.goto('/workouts/session');

    await swipeRow(page, { from: todayRow(page), direction: 'left' });

    await expect(position({ page, current: 1, total: 3 })).toBeVisible();
    await expect(page.getByText('правка 1', { exact: true })).toBeVisible();
  });

  test('[E54] во время сохранения свайп по строке «Сегодня» правку не открывает @touch', async ({
    page,
  }) => {
    const server = await startSessionServer(page, {
      session: makeSession({ results: [pastSet({ setNumber: 1, weight: 60, reps: 6, rpe: 4 })] }),
      holdSaves: true,
    });
    await page.goto('/workouts/session');
    await saveButton(page).click();
    await expect.poll(() => server.saves.length).toBe(1);

    await swipeRow(page, { from: todayRow(page), direction: 'left' });

    await expect(position({ page, current: 1, total: 3 })).toBeVisible();
    await expect(page.getByRole('form', { name: 'Подход 2' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Сохранить изменения' })).toHaveCount(0);
    server.releaseSaves();
  });

  test('[E17] сохранение правки отправляет тот же номер подхода @touch', async ({ page }) => {
    const server = await startSessionServer(page, {
      session: makeSession({ results: setsOf({ index: 0, setNumbers: [1, 2] }) }),
    });
    await page.goto('/workouts/session');
    await swipeRow(page, { from: todayRow(page, -1), direction: 'left' });
    await weightField(page).fill('65');

    await page.getByRole('button', { name: 'Сохранить изменения' }).click();

    await expect.poll(() => server.saves.length).toBe(1);
    expect(server.saves[0]?.setNumber).toBe(1);
    expect(server.saves[0]?.body.weight).toBe(65);
  });

  test('[E18] после правки форма возвращается к первому несохранённому подходу @touch', async ({
    page,
  }) => {
    await startSessionServer(page, {
      session: makeSession({ results: setsOf({ index: 0, setNumbers: [1, 2] }) }),
    });
    await page.goto('/workouts/session');
    await swipeRow(page, { from: todayRow(page, -1), direction: 'left' });

    await page.getByRole('button', { name: 'Сохранить изменения' }).click();

    await expect(page.getByRole('form', { name: 'Подход 3' })).toBeVisible();
    await expect(page.getByText('подход 3', { exact: true })).toBeVisible();
  });

  test('[E19] после правки в полностью выполненном упражнении показывается карточка «Упражнение выполнено» @touch', async ({
    page,
  }) => {
    await startSessionServer(page, {
      session: makeSession({ exerciseCount: 1, results: fullExercise(0) }),
    });
    await page.goto('/workouts/session');
    await swipeRow(page, { from: todayRow(page, 1), direction: 'left' });

    await page.getByRole('button', { name: 'Сохранить изменения' }).click();

    await expect(page.getByRole('region', { name: 'Упражнение выполнено' })).toBeVisible();
    await expect(setForm(page)).toHaveCount(0);
  });

  test('[E52] ошибка сохранения правки оставляет правку открытой @touch', async ({ page }) => {
    await startSessionServer(page, {
      session: makeSession({ results: setsOf({ index: 0, setNumbers: [1, 2] }) }),
      saveStatus: HTTP_ERROR,
    });
    await page.goto('/workouts/session');
    await swipeRow(page, { from: todayRow(page, -1), direction: 'left' });
    await weightField(page).fill('65');

    await page.getByRole('button', { name: 'Сохранить изменения' }).click();

    await expect(page.getByText(SAVE_ERROR)).toBeVisible();
    await expect(weightField(page)).toHaveValue('65');
    await expect(page.getByText('правка 1', { exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Сохранить изменения' })).toBeVisible();
  });

  test('[E50] правка открывается со значениями подхода, а не с прежней подстановкой из истории @touch', async ({
    page,
  }) => {
    await startSessionServer(page, {
      history: historyOf(1, [
        {
          sessionId: 11,
          finishedAt: FIRST_DATE,
          sets: [pastSet({ setNumber: 1, weight: 40, reps: 10, rpe: 3 })],
        },
      ]),
    });
    await page.goto('/workouts/session');
    await page.getByRole('group', { name: FIRST_DATE_TITLE }).getByRole('button').click();
    await expect(weightField(page)).toHaveValue('40');
    await fillSetForm(page, { weight: '60', reps: '6', rpe: '4' }, 1);
    await saveButton(page).click();
    await expect(page.getByRole('form', { name: 'Подход 2' })).toBeVisible();

    await swipeRow(page, { from: todayRow(page), direction: 'left' });

    await expect(page.getByRole('form', { name: 'Подход 1' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Сохранить изменения' })).toBeVisible();
    await expect(weightField(page)).toHaveValue('60');
    await expect(repsField(page)).toHaveValue('6');
    await expect(
      page.getByRole('radiogroup', { name: 'RPE от 1 до 5' }).getByRole('radio', { name: '4' }),
    ).toBeChecked();
  });

  test('[E48] «Отменить правку» закрывает правку без запроса на сервер @touch', async ({
    page,
  }) => {
    const server = await startSessionServer(page, {
      session: makeSession({ results: setsOf({ index: 0, setNumbers: [1, 2] }) }),
    });
    await page.goto('/workouts/session');
    await swipeRow(page, { from: todayRow(page, -1), direction: 'left' });
    await weightField(page).fill('65');

    await page.getByRole('button', { name: 'Отменить правку' }).click();

    await expect(page.getByRole('form', { name: 'Подход 3' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Сохранить подход', exact: true })).toBeVisible();
    await expect(todayRow(page, -1)).toContainText('62.5 кг × 7 повт.');
    expect(server.saves).toEqual([]);
  });

  test('[E49] вне режима правки кнопки «Отменить правку» нет', async ({ page }) => {
    await startSessionServer(page);
    await page.goto('/workouts/session');
    await expect(setForm(page)).toBeVisible();

    await expect(page.getByRole('button', { name: 'Отменить правку' })).toHaveCount(0);
  });

  test('без сохранённых подходов группы «Сегодня» нет', async ({ page }) => {
    await startSessionServer(page);
    await page.goto('/workouts/session');
    await expect(setForm(page)).toBeVisible();

    await expect(page.getByRole('heading', { name: 'Сегодня' })).toHaveCount(0);
  });
});
