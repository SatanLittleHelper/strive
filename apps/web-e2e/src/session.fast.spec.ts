import { expect, test, type Page, type Route } from '@playwright/test';
import { SET_RESULT_LIMITS } from '@strive/api-interfaces';
import { swipe } from './support/swipe';
import { MOBILE_VIEWPORT } from './e2e.constants';
import {
  makeSession,
  ok,
  errorBody,
  errorBody as error,
  mockActive,
  mockHistory,
  fullExercise,
  savedSet,
  fillSetForm,
} from './support/session.fixtures';

const HTTP_ERROR = 500;
const HTTP_CONFLICT = 409;
const SESSION = makeSession();

test.describe('экран сессии с мокнутым API', () => {
  test.use({ viewport: MOBILE_VIEWPORT });

  test.beforeEach(async ({ page }) => {
    await mockHistory(page);
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
    await expect(page.getByRole('heading', { name: /Тренировка A/ })).toBeVisible();
  });

  test('E1 · во время загрузки виден скелетон со статусом', async ({ page }) => {
    const pending: { route?: Route } = {};
    await page.route('**/api/sessions/active', (route) => {
      pending.route = route;
    });

    await page.goto('/workouts/session');

    await expect(page.getByRole('status', { name: 'Загрузка тренировки' })).toBeVisible();
    await expect(page.getByText('Загрузка тренировки…')).toHaveCount(0);
  });

  test('E2 · после ответа скелетон исчезает, показано пустое состояние со ссылкой в каталог', async ({
    page,
  }) => {
    const pending: { route?: Route } = {};
    await page.route('**/api/sessions/active', (route) => {
      pending.route = route;
    });
    await page.goto('/workouts/session');
    await expect(page.getByRole('status', { name: 'Загрузка тренировки' })).toBeVisible();
    await expect.poll(() => Boolean(pending.route)).toBe(true);
    if (!pending.route) throw new Error('Запрос активной сессии не отправлен');

    await pending.route.fulfill({ json: ok({ session: null }) });

    await expect(page.getByRole('status', { name: 'Загрузка тренировки' })).toHaveCount(0);
    await expect(page.getByText('Нет активной тренировки')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Выбрать тренировку' })).toHaveAttribute(
      'href',
      '/workouts',
    );
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
    await page.goto('/workouts/session');
    await page.getByRole('button', { name: 'Завершить', exact: true }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Продолжить тренировку' }).click();
    await expect(page.getByRole('dialog')).toHaveCount(0);
    expect(finishes).toEqual([]);
    await page.getByRole('button', { name: 'Завершить', exact: true }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Завершить', exact: true }).click();
    await expect(page.getByRole('alert')).toContainText('Не удалось завершить тренировку');
    await expect(page.getByRole('dialog')).toHaveCount(0);
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
    await expect(page).toHaveURL(/\/workouts\/session$/);
    await expect(page.getByRole('heading', { name: /Тренировка A/ })).toBeVisible();
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

test.describe('маршрут и навигация экрана сессии', () => {
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

  test('«Начать» в деталях тренировки ведёт на экран тренировки', async ({ page }) => {
    await page.unroute('**/api/sessions/active');
    await mockActive(page, null);
    await page.route('**/api/workouts/1', (route) =>
      route.fulfill({ json: ok(makeSession().workout) }),
    );
    await page.route('**/api/sessions', (route) =>
      route.fulfill({ status: 201, json: ok(makeSession()) }),
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
});

const COUNTER = (current: number, total = 3) => `Упражнение ${current} из ${total}`;

test.describe('навигация по упражнениям', () => {
  test.use({ viewport: MOBILE_VIEWPORT });

  test.beforeEach(async ({ page }) => {
    await mockHistory(page);
  });

  test('показывает одно упражнение с подписью «Упражнение 1 из 3»', async ({ page }) => {
    await mockActive(page);
    await page.goto('/workouts/session');

    await expect(page.getByText(COUNTER(1))).toBeVisible();
    await expect(page.getByRole('region', { name: 'Приседания со штангой' })).toBeVisible();
    await expect(page.getByRole('region', { name: 'Жим лёжа' })).toHaveCount(0);
    await expect(page.getByRole('region', { name: 'Тяга штанги в наклоне' })).toHaveCount(0);
  });

  for (const { from, action, to } of [
    { from: 1, action: 'Далее', to: 2 },
    { from: 2, action: 'Назад', to: 1 },
  ]) {
    test(`кнопка «${action}» переключает упражнение ${from} → ${to}`, async ({ page }) => {
      await mockActive(page);
      await page.goto('/workouts/session');
      if (from === 2) await page.getByRole('button', { name: 'Далее', exact: true }).click();

      await page.getByRole('button', { name: action, exact: true }).click();

      await expect(page.getByText(COUNTER(to))).toBeVisible();
    });
  }

  for (const { name, setup, action, expected } of [
    {
      name: 'на первом упражнении «Назад» ничего не меняет',
      setup: 0,
      action: 'Назад',
      expected: 1,
    },
    {
      name: 'на последнем упражнении «Далее» ничего не меняет',
      setup: 2,
      action: 'Далее',
      expected: 3,
    },
  ]) {
    test(name, async ({ page }) => {
      await mockActive(page);
      await page.goto('/workouts/session');
      for (let step = 0; step < setup; step += 1) {
        await page.getByRole('button', { name: 'Далее', exact: true }).click();
      }

      await page.getByRole('button', { name: action, exact: true }).dispatchEvent('click');

      await expect(page.getByText(COUNTER(expected))).toBeVisible();
    });
  }

  test('свайп влево и вправо переключает упражнение @touch', async ({ page }) => {
    await mockActive(page);
    await page.goto('/workouts/session');
    const title = page.getByRole('heading', { name: /Приседания со штангой/ });

    await swipe(page, { from: title, direction: 'left' });
    await expect(page.getByText(COUNTER(2))).toBeVisible();

    await swipe(page, {
      from: page.getByRole('heading', { name: /Жим лёжа/ }),
      direction: 'right',
    });
    await expect(page.getByText(COUNTER(1))).toBeVisible();
  });

  test('свайп из поля ввода не переключает упражнение @touch', async ({ page }) => {
    await mockActive(page);
    await page.goto('/workouts/session');
    const weight = page
      .getByRole('form', { name: 'Подход 1' })
      .getByLabel('Вес, кг', { exact: true });

    await swipe(page, { from: weight, direction: 'left' });

    await expect(page.getByText(COUNTER(1))).toBeVisible();
  });

  test('открывается первое упражнение с невыполненными подходами', async ({ page }) => {
    await mockActive(page, makeSession({ results: fullExercise(0) }));
    await page.goto('/workouts/session');

    await expect(page.getByText(COUNTER(2))).toBeVisible();
  });

  test('вертикальный жест прокручивает страницу и не переключает упражнение @touch', async ({
    page,
  }) => {
    await mockActive(page);
    await page.goto('/workouts/session');
    await page.evaluate(() => {
      document.body.style.minHeight = '3000px';
    });
    const card = page.getByRole('region', { name: 'Приседания со штангой' });

    await swipe(page, { from: card, direction: 'up' });

    await expect(page.getByText(COUNTER(1))).toBeVisible();
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(0);
  });

  test('полоса прогресса показывает число выполненных упражнений', async ({ page }) => {
    await mockActive(page, makeSession({ results: fullExercise(0) }));
    await page.goto('/workouts/session');

    await expect(page.getByRole('progressbar', { name: 'Выполнено упражнений' })).toHaveAttribute(
      'value',
      '1',
    );
  });

  test('сохранение последнего подхода упражнения увеличивает прогресс', async ({ page }) => {
    const before = makeSession({ results: [...fullExercise(0), ...fullExercise(1).slice(0, 2)] });
    const after = makeSession({ results: [...fullExercise(0), ...fullExercise(1)] });
    await mockActive(page, before);
    await page.route('**/api/sessions/1/sets/2/3', (route) => route.fulfill({ json: ok(after) }));
    await page.goto('/workouts/session');
    const progress = page.getByRole('progressbar', { name: 'Выполнено упражнений' });
    await expect(progress).toHaveAttribute('value', '1');

    await page.getByRole('button', { name: 'Сохранить подход' }).click();

    await expect(progress).toHaveAttribute('value', '2');
  });
});

test.describe('блокировка и завершение', () => {
  test.use({ viewport: MOBILE_VIEWPORT });

  test.beforeEach(async ({ page }) => {
    await mockHistory(page);
  });

  test('счётчик «Выполнено N/M» растёт после сохранения подхода', async ({ page }) => {
    const empty = makeSession({ exerciseCount: 2 });
    const saved = makeSession({ exerciseCount: 2, results: [savedSet()] });
    await mockActive(page, empty);
    await page.route('**/api/sessions/1/sets/1/1', (route) => route.fulfill({ json: ok(saved) }));
    await page.goto('/workouts/session');
    await expect(page.getByText('Выполнено 0/6')).toBeVisible();

    await page.getByRole('button', { name: 'Сохранить подход' }).click();

    await expect(page.getByText('Выполнено 1/6')).toBeVisible();
  });

  test('«Завершить» видна над нижней навигацией', async ({ page }) => {
    await mockActive(page);
    await page.goto('/workouts/session');
    const finish = page.getByRole('button', { name: 'Завершить', exact: true });
    await finish.scrollIntoViewIfNeeded();

    const finishBox = await finish.boundingBox();
    const navBox = await page.getByRole('navigation', { name: 'Основная навигация' }).boundingBox();

    expect((finishBox?.y ?? 0) + (finishBox?.height ?? 0)).toBeLessThanOrEqual(navBox?.y ?? 0);
  });

  test('завершение с неполными подходами требует подтверждения', async ({ page }) => {
    await mockActive(page);
    const finishes: string[] = [];
    await page.route('**/api/sessions/1/finish', (route) => {
      finishes.push(route.request().method());
      return route.fulfill({ json: ok(makeSession()) });
    });
    await page.goto('/workouts/session');

    await page.getByRole('button', { name: 'Завершить', exact: true }).click();

    await expect(page.getByRole('dialog')).toContainText('Не все подходы выполнены');
    expect(finishes).toEqual([]);
  });

  for (const { element, check } of [
    { element: 'Далее', check: 'counter' },
    { element: 'Назад', check: 'counter' },
    { element: 'Подход 2', check: 'editor' },
    { element: 'Завершить', check: 'dialog' },
  ]) {
    test(`во время сохранения «${element}» не реагирует на клик`, async ({ page }) => {
      await mockActive(page);
      const pending: { route?: Route } = {};
      const finishes: string[] = [];
      await page.route('**/api/sessions/1/sets/1/1', (route) => {
        pending.route = route;
      });
      await page.route('**/api/sessions/1/finish', (route) => {
        finishes.push(route.request().method());
        return route.fulfill({ json: ok(makeSession()) });
      });
      await page.goto('/workouts/session');
      await page.getByRole('button', { name: 'Сохранить подход' }).click();
      await expect.poll(() => Boolean(pending.route)).toBe(true);
      await expect(page.getByRole('button', { name: element, exact: true })).toBeDisabled();

      await page.getByRole('button', { name: element, exact: true }).dispatchEvent('click');

      if (check === 'counter') await expect(page.getByText(COUNTER(1))).toBeVisible();
      if (check === 'editor')
        await expect(page.getByRole('form', { name: 'Подход 2' })).toHaveCount(0);
      if (check === 'dialog') {
        await expect(page.getByRole('dialog')).toHaveCount(0);
        expect(finishes).toEqual([]);
      }
    });
  }
});

test.describe('предзаполнение подхода', () => {
  test.use({ viewport: MOBILE_VIEWPORT });

  test.beforeEach(async ({ page }) => {
    await mockHistory(page);
  });

  test('первый невыполненный подход открыт и заполнен планом', async ({ page }) => {
    await mockActive(page);
    await page.goto('/workouts/session');
    const form = page.getByRole('form', { name: 'Подход 1' });

    await expect(form.getByLabel('Вес, кг', { exact: true })).toHaveValue('60');
    await expect(form.getByLabel('Повторы', { exact: true })).toHaveValue('6');
    await expect(form.getByLabel('RPE (1–5, необязательно)', { exact: true })).toHaveValue('3');
    await expect(form.getByLabel('Заметка', { exact: true })).toHaveValue('');
  });

  test('после сохранения открывается следующий подход со значениями сохранённого', async ({
    page,
  }) => {
    await mockActive(page);
    const saved = makeSession({ results: [savedSet({ weight: 62.5, reps: 7, rpe: 4 })] });
    await page.route('**/api/sessions/1/sets/1/1', (route) => route.fulfill({ json: ok(saved) }));
    await page.goto('/workouts/session');
    await fillSetForm(page, { weight: '62.5', reps: '7', rpe: '4' });

    await page.getByRole('button', { name: 'Сохранить подход' }).click();

    await expect(page.getByRole('form', { name: 'Подход 1' })).toHaveCount(0);
    const next = page.getByRole('form', { name: 'Подход 2' });
    await expect(next.getByLabel('Вес, кг', { exact: true })).toHaveValue('62.50');
    await expect(next.getByLabel('Повторы', { exact: true })).toHaveValue('7');
    await expect(next.getByLabel('RPE (1–5, необязательно)', { exact: true })).toHaveValue('4');
  });

  test('без целевого веса и истории вес пустой', async ({ page }) => {
    await mockActive(page, makeSession({ weight: null }));
    await page.goto('/workouts/session');
    const form = page.getByRole('form', { name: 'Подход 1' });

    await expect(form.getByLabel('Вес, кг', { exact: true })).toHaveValue('');
    await expect(form.getByLabel('Повторы', { exact: true })).toHaveValue('6');
  });
});

const LABEL_WEIGHT = 'Вес, кг';
const LABEL_REPS = 'Повторы';
const LABEL_RPE = 'RPE (1–5, необязательно)';
const SAVE_BUTTON = 'Сохранить подход';
const VALID_WEIGHT = '62.5';
const SAVE_SET_URL = '**/api/sessions/1/sets/1/1';
const SAVE_ERROR_MESSAGE = 'Не удалось сохранить подход';
const ERROR_TEXT = /Обязательное поле|Не меньше|Не больше|Только целое|Не более/;
const REPS_BELOW_MIN = String(SET_RESULT_LIMITS.repsMin - 1);
const RPE_ABOVE_MAX = String(SET_RESULT_LIMITS.rpeMax + 1);

const formOf = (page: Page) => page.getByRole('form', { name: 'Подход 1' });
const fieldOf = (page: Page, label: string) => formOf(page).getByLabel(label, { exact: true });
const visibleErrors = (page: Page) => formOf(page).getByText(ERROR_TEXT);

const expectMarkedInvalid = (page: Page, label: string) =>
  expect(fieldOf(page, label)).toHaveAttribute('aria-invalid', 'true');
const expectNotMarkedInvalid = (page: Page, label: string) =>
  expect(fieldOf(page, label)).not.toHaveAttribute('aria-invalid', 'true');

test.describe('ошибки формы подхода', () => {
  test.use({ viewport: MOBILE_VIEWPORT });

  test.beforeEach(async ({ page }) => {
    await Promise.all([mockHistory(page), mockActive(page)]);
  });

  test('E3 · пустой вес показывает ошибку под полем веса', async ({ page }) => {
    await page.goto('/workouts/session');
    await fillSetForm(page, { weight: '' });

    await page.getByRole('button', { name: SAVE_BUTTON }).click();

    await expectMarkedInvalid(page, LABEL_WEIGHT);
    await expect(visibleErrors(page)).toHaveCount(1);
    await expect(visibleErrors(page)).toHaveText('Обязательное поле');
    await expectNotMarkedInvalid(page, LABEL_REPS);
    await expectNotMarkedInvalid(page, LABEL_RPE);
  });

  test('E4 · повторы ниже минимума показывают ошибку под полем повторов', async ({ page }) => {
    await page.goto('/workouts/session');
    await fillSetForm(page, { reps: REPS_BELOW_MIN });

    await page.getByRole('button', { name: SAVE_BUTTON }).click();

    await expectMarkedInvalid(page, LABEL_REPS);
    await expect(visibleErrors(page)).toHaveCount(1);
    await expect(visibleErrors(page)).toHaveText(`Не меньше ${SET_RESULT_LIMITS.repsMin}`);
    await expectNotMarkedInvalid(page, LABEL_WEIGHT);
    await expectNotMarkedInvalid(page, LABEL_RPE);
  });

  test('E5 · RPE выше максимума показывает ошибку под полем RPE', async ({ page }) => {
    await page.goto('/workouts/session');
    await fillSetForm(page, { rpe: RPE_ABOVE_MAX });

    await page.getByRole('button', { name: SAVE_BUTTON }).click();

    await expectMarkedInvalid(page, LABEL_RPE);
    await expect(visibleErrors(page)).toHaveCount(1);
    await expect(visibleErrors(page)).toHaveText(`Не больше ${SET_RESULT_LIMITS.rpeMax}`);
    await expectNotMarkedInvalid(page, LABEL_WEIGHT);
    await expectNotMarkedInvalid(page, LABEL_REPS);
  });

  test('E6 · невалидный ввод не отправляет запрос на сохранение', async ({ page }) => {
    const writes: string[] = [];
    await page.route(SAVE_SET_URL, (route) => {
      writes.push(route.request().method());
      return route.fulfill({ status: HTTP_ERROR, json: errorBody });
    });
    await page.goto('/workouts/session');
    await fillSetForm(page, { weight: '' });

    await page.getByRole('button', { name: SAVE_BUTTON }).click();

    await expect(visibleErrors(page)).toHaveCount(1);
    expect(writes).toEqual([]);
  });

  test('E7 · исправление значения убирает ошибку поля', async ({ page }) => {
    await page.goto('/workouts/session');
    await fillSetForm(page, { weight: '' });
    await page.getByRole('button', { name: SAVE_BUTTON }).click();
    await expectMarkedInvalid(page, LABEL_WEIGHT);

    await fillSetForm(page, { weight: VALID_WEIGHT });

    await expectNotMarkedInvalid(page, LABEL_WEIGHT);
    await expect(visibleErrors(page)).toHaveCount(0);
  });

  test('E8 · закрытие и повторное открытие редактора убирает ошибки', async ({ page }) => {
    await page.goto('/workouts/session');
    await fillSetForm(page, { weight: '' });
    await page.getByRole('button', { name: SAVE_BUTTON }).click();
    await expect(visibleErrors(page)).toHaveCount(1);

    const toggle = page.getByRole('button', { name: /^Подход 1/ });
    await toggle.click();
    await toggle.click();

    await expect(formOf(page)).toBeVisible();
    await expect(visibleErrors(page)).toHaveCount(0);
    await expectNotMarkedInvalid(page, LABEL_WEIGHT);
  });

  test('E9 · после исправления значения подход сохраняется', async ({ page }) => {
    const saved = makeSession({ results: [savedSet({ weight: Number(VALID_WEIGHT) })] });
    const bodies: unknown[] = [];
    await page.route(SAVE_SET_URL, (route) => {
      bodies.push(route.request().postDataJSON());
      return route.fulfill({ json: ok(saved) });
    });
    await page.goto('/workouts/session');
    await fillSetForm(page, { weight: '' });
    await page.getByRole('button', { name: SAVE_BUTTON }).click();
    await expect(visibleErrors(page)).toHaveCount(1);

    await fillSetForm(page, { weight: VALID_WEIGHT });
    await page.getByRole('button', { name: SAVE_BUTTON }).click();

    await expect.poll(() => bodies.length).toBe(1);
    expect(bodies[0]).toMatchObject({ weight: Number(VALID_WEIGHT) });
  });

  test('E10 · ошибка сервера при сохранении не показывает ошибок под полями', async ({ page }) => {
    await page.route(SAVE_SET_URL, (route) =>
      route.fulfill({ status: HTTP_ERROR, json: errorBody }),
    );
    await page.goto('/workouts/session');
    await expect(formOf(page)).toBeVisible();

    await page.getByRole('button', { name: SAVE_BUTTON }).click();

    await expect(page.getByRole('alert')).toContainText(SAVE_ERROR_MESSAGE);
    await expect(visibleErrors(page)).toHaveCount(0);
    await expectNotMarkedInvalid(page, LABEL_WEIGHT);
    await expectNotMarkedInvalid(page, LABEL_REPS);
    await expectNotMarkedInvalid(page, LABEL_RPE);
  });
});

const HISTORY_ENTRY = {
  sessionId: 5,
  finishedAt: '2026-10-29T12:00:00.000Z',
  sets: [
    savedSet({ setNumber: 1, weight: 55, reps: 8, rpe: 4, note: 'Контроль техники' }),
    savedSet({ setNumber: 2, weight: 57.5, reps: 6, rpe: 5 }),
  ],
};
const HISTORY = { exercises: [{ exerciseId: 1, entries: [HISTORY_ENTRY] }] };

test.describe('история подходов', () => {
  test.use({ viewport: MOBILE_VIEWPORT });

  test('блок «Прошлые тренировки» показывает подходы прошлых записей', async ({ page }) => {
    await mockActive(page);
    await mockHistory(page, HISTORY);
    await page.goto('/workouts/session');

    await page.getByRole('button', { name: 'Прошлые тренировки' }).click();

    await expect(page.getByText('29.10.2026', { exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: /55 кг × 8/ })).toContainText('RPE 4');
    await expect(page.getByRole('button', { name: /57\.5 кг × 6/ })).toContainText('RPE 5');
  });

  test('тап по подходу из истории заполняет открытый редактор и не сохраняет', async ({ page }) => {
    await mockActive(page);
    await mockHistory(page, HISTORY);
    const writes: string[] = [];
    await page.route('**/api/sessions/1/sets/**', (route) => {
      writes.push(route.request().method());
      return route.fulfill({ json: ok(makeSession()) });
    });
    await page.goto('/workouts/session');
    await page.getByRole('button', { name: 'Прошлые тренировки' }).click();

    await page.getByRole('button', { name: /55 кг × 8/ }).click();

    const form = page.getByRole('form', { name: 'Подход 1' });
    await expect(form.getByLabel('Вес, кг', { exact: true })).toHaveValue('55');
    await expect(form.getByLabel('Повторы', { exact: true })).toHaveValue('8');
    await expect(form.getByLabel('RPE (1–5, необязательно)', { exact: true })).toHaveValue('4');
    await expect(form.getByLabel('Заметка', { exact: true })).toHaveValue('Контроль техники');
    expect(writes).toEqual([]);
  });

  test('повторный тап по подходу из истории возвращает значения после правки', async ({ page }) => {
    await mockActive(page);
    await mockHistory(page, HISTORY);
    await page.goto('/workouts/session');
    await page.getByRole('button', { name: 'Прошлые тренировки' }).click();
    const form = page.getByRole('form', { name: 'Подход 1' });
    const row = page.getByRole('button', { name: /55 кг × 8/ });

    await row.click();
    await fillSetForm(page, { weight: '99' });
    await row.click();

    await expect(form.getByLabel('Вес, кг', { exact: true })).toHaveValue('55');
  });

  test('поздно пришедшая история не затирает введённый вес', async ({ page }) => {
    await mockActive(page, makeSession({ weight: null }));
    const pending: { route?: Route } = {};
    await page.route('**/api/sessions/1/history', (route) => {
      pending.route = route;
    });
    await page.goto('/workouts/session');
    await fillSetForm(page, { weight: '70' });
    await expect.poll(() => Boolean(pending.route)).toBe(true);

    await pending.route?.fulfill({ json: ok(HISTORY) });

    await expect(page.getByRole('button', { name: 'Прошлые тренировки' })).toBeVisible();
    await expect(
      page.getByRole('form', { name: 'Подход 1' }).getByLabel('Вес, кг', { exact: true }),
    ).toHaveValue('70');
  });

  test('без истории блока «Прошлые тренировки» нет', async ({ page }) => {
    await mockActive(page);
    await mockHistory(page, { exercises: [{ exerciseId: 1, entries: [] }] });
    await page.goto('/workouts/session');

    await expect(page.getByRole('button', { name: 'Прошлые тренировки' })).toHaveCount(0);
  });

  test('ошибка истории скрывает блок и не показывает ошибку страницы', async ({ page }) => {
    await mockActive(page);
    await mockHistory(page, { status: 500 });
    await page.goto('/workouts/session');

    await expect(page.getByRole('heading', { name: /Тренировка A/ })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Прошлые тренировки' })).toHaveCount(0);
    await expect(page.getByRole('alert')).toHaveCount(0);
  });

  test('при ошибке истории подход сохраняется', async ({ page }) => {
    await mockActive(page);
    await mockHistory(page, { status: 500 });
    const writes: string[] = [];
    await page.route('**/api/sessions/1/sets/1/1', (route) => {
      writes.push(route.request().method());
      return route.fulfill({
        json: ok(makeSession({ results: [savedSet({ weight: 60, reps: 6, rpe: 3 })] })),
      });
    });
    await page.goto('/workouts/session');

    await page.getByRole('button', { name: 'Сохранить подход' }).click();

    await expect(page.getByRole('button', { name: /Подход 1.*Выполнен/ })).toBeVisible();
    expect(writes).toEqual(['PUT']);
  });
});
