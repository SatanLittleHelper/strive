import { expect, test, type Page } from '@playwright/test';
import { MOBILE_VIEWPORT } from './e2e.constants';
import { fullExercise, makeSession, setsOf } from './support/session.fixtures';
import {
  bottomFinishButton,
  countdown,
  exerciseHeading,
  finishButton,
  position,
  saveButton,
  todayRow,
  weightField,
} from './support/session.page';
import { startSessionServer } from './support/session.server';
import { swipe, swipeRow } from './support/swipe';

const SECOND = 'Жим лёжа';
const COUNTDOWN_MS = 3000;
const AFTER_COUNTDOWN_MS = 5000;
const TICK_MS = 1000;
const FIRST_TWO_SETS = setsOf({ index: 0, setNumbers: [1, 2] });
const next = (page: Page) => page.getByRole('button', { name: 'Далее', exact: true });
const back = (page: Page) => page.getByRole('button', { name: 'Назад', exact: true });

async function openAtLastSet(page: Page, options: Parameters<typeof makeSession>[0] = {}) {
  await page.clock.install();
  await startSessionServer(page, {
    session: makeSession({ results: FIRST_TWO_SETS, ...options }),
  });
  await page.goto('/workouts/session');
  await expect(position({ page, current: 1, total: options.exerciseCount ?? 3 })).toBeVisible();
}

test.describe('автопереход с отсчётом', () => {
  test.use({ viewport: MOBILE_VIEWPORT });

  test('[rf-E11] отсчёт показывается и заканчивается переходом', async ({ page }) => {
    await openAtLastSet(page);

    await saveButton(page).click();
    await expect(countdown(page)).toContainText(`Переход к «${SECOND}» через 3 с`);
    await page.clock.runFor(TICK_MS);
    await expect(countdown(page)).toContainText('через 2 с');
    await page.clock.runFor(TICK_MS);
    await expect(countdown(page)).toContainText('через 1 с');
    await page.clock.runFor(TICK_MS);

    await expect(exerciseHeading(page, SECOND)).toBeVisible();
    await expect(countdown(page)).toHaveCount(0);
  });

  test('[rf-E12] у последнего упражнения отсчёта нет', async ({ page }) => {
    await openAtLastSet(page, { exerciseCount: 1 });

    await saveButton(page).click();

    await expect(bottomFinishButton(page)).toBeVisible();
    await expect(countdown(page)).toHaveCount(0);
    await page.clock.runFor(AFTER_COUNTDOWN_MS);
    await expect(position({ page, current: 1, total: 1 })).toBeVisible();
  });

  test('[rf-E13] правка сохранённого подхода не запускает отсчёт @touch', async ({ page }) => {
    await page.clock.install();
    await startSessionServer(page, { session: makeSession({ results: fullExercise(0) }) });
    await page.goto('/workouts/session');
    await back(page).click();
    await swipeRow(page, { from: todayRow(page, -1), direction: 'left' });
    await weightField(page).fill('65');

    await page.getByRole('button', { name: 'Сохранить изменения' }).click();

    await expect(page.getByRole('region', { name: 'Упражнение выполнено' })).toBeVisible();
    await expect(countdown(page)).toHaveCount(0);
    await page.clock.runFor(AFTER_COUNTDOWN_MS);
    await expect(position({ page, current: 1, total: 3 })).toBeVisible();
  });
});

test.describe('отмена отсчёта', () => {
  test.use({ viewport: MOBILE_VIEWPORT });

  test('[rf-E14] кнопка «Отменить» останавливает отсчёт', async ({ page }) => {
    await openAtLastSet(page);
    await saveButton(page).click();
    await expect(countdown(page)).toBeVisible();

    await countdown(page).getByRole('button', { name: 'Отменить' }).click();
    await page.clock.runFor(AFTER_COUNTDOWN_MS);

    await expect(countdown(page)).toHaveCount(0);
    await expect(position({ page, current: 1, total: 3 })).toBeVisible();
  });

  test('[rf-E15] ручной переход во время отсчёта не даёт второго прыжка', async ({ page }) => {
    await openAtLastSet(page);
    await saveButton(page).click();
    await expect(countdown(page)).toBeVisible();
    await page.clock.runFor(TICK_MS);

    await page.getByRole('button', { name: 'Следующее упражнение' }).click();
    await page.clock.runFor(AFTER_COUNTDOWN_MS);

    await expect(position({ page, current: 2, total: 3 })).toBeVisible();
    await expect(countdown(page)).toHaveCount(0);
  });

  const MANUAL_MOVES = [
    {
      title: '«Назад»',
      expected: 1,
      move: async (page: Page) => {
        await back(page).click();
      },
    },
    {
      title: '«Далее» дважды',
      expected: 4,
      move: async (page: Page) => {
        await next(page).click();
        await expect(position({ page, current: 3, total: 4 })).toBeVisible();
        await next(page).click();
      },
    },
    {
      title: 'горизонтальный свайп дважды @touch',
      expected: 4,
      move: async (page: Page) => {
        const ring = page.getByRole('img', { name: /^Вес: цель/ });
        await swipe(page, { from: ring, direction: 'left' });
        await expect(position({ page, current: 3, total: 4 })).toBeVisible();
        await swipe(page, { from: ring, direction: 'left' });
      },
    },
  ];

  for (const { title, expected, move } of MANUAL_MOVES) {
    test(`[rf-E16] ${title} отменяет отсчёт`, async ({ page }) => {
      await page.clock.install();
      await startSessionServer(page, {
        session: makeSession({
          exerciseCount: 4,
          results: [...fullExercise(0), ...setsOf({ index: 1, setNumbers: [1, 2] })],
        }),
      });
      await page.goto('/workouts/session');
      await expect(position({ page, current: 2, total: 4 })).toBeVisible();
      await saveButton(page).click();
      await expect(countdown(page)).toBeVisible();

      await move(page);
      await page.clock.runFor(AFTER_COUNTDOWN_MS);

      await expect(position({ page, current: expected, total: 4 })).toBeVisible();
      await expect(countdown(page)).toHaveCount(0);
    });
  }

  test('[rf-E17] открытие правки отменяет отсчёт @touch', async ({ page }) => {
    await openAtLastSet(page);
    await saveButton(page).click();
    await expect(countdown(page)).toBeVisible();

    await swipeRow(page, { from: todayRow(page, 0), direction: 'left' });
    await page.clock.runFor(AFTER_COUNTDOWN_MS);

    await expect(page.getByText('правка 3', { exact: true })).toBeVisible();
    await expect(countdown(page)).toHaveCount(0);
    await expect(position({ page, current: 1, total: 3 })).toBeVisible();
  });

  test('[rf-E18] запрос завершения отменяет отсчёт', async ({ page }) => {
    await openAtLastSet(page);
    await saveButton(page).click();
    await expect(countdown(page)).toBeVisible();

    await finishButton(page).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Продолжить тренировку' }).click();
    await page.clock.runFor(AFTER_COUNTDOWN_MS);

    await expect(countdown(page)).toHaveCount(0);
    await expect(position({ page, current: 1, total: 3 })).toBeVisible();
  });

  test('[rf-E19] уход с экрана тренировки отменяет отсчёт', async ({ page }) => {
    await openAtLastSet(page);
    await saveButton(page).click();
    await expect(countdown(page)).toBeVisible();

    await page.getByRole('button', { name: 'К тренировкам' }).click();
    await page.clock.runFor(AFTER_COUNTDOWN_MS);
    await expect(page).toHaveURL(/\/workouts$/);
    await page.goBack();

    await expect(position({ page, current: 2, total: 3 })).toBeVisible();
    await expect(countdown(page)).toHaveCount(0);
  });
});

test.describe('суперсет без задержки', () => {
  test.use({ viewport: MOBILE_VIEWPORT });

  test('[rf-E20] суперсет переключается сразу и без уведомления', async ({ page }) => {
    await page.clock.install();
    await startSessionServer(page, {
      session: makeSession({ supersetGroups: [1, 1, null] }),
    });
    await page.goto('/workouts/session');

    await saveButton(page).click();

    await expect(exerciseHeading(page, SECOND)).toBeVisible();
    await expect(countdown(page)).toHaveCount(0);
  });

  test('[rf-E21] выход из выполненного суперсета без задержки', async ({ page }) => {
    await page.clock.install();
    await startSessionServer(page, {
      session: makeSession({
        sets: 1,
        supersetGroups: [1, 1, null],
        results: setsOf({ index: 0, setNumbers: [1] }),
      }),
    });
    await page.goto('/workouts/session');
    await expect(exerciseHeading(page, SECOND)).toBeVisible();

    await saveButton(page).click();

    await expect(position({ page, current: 3, total: 3 })).toBeVisible();
    await expect(countdown(page)).toHaveCount(0);
  });
});
