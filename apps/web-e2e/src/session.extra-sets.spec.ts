import { expect, test } from '@playwright/test';
import { SET_RESULT_LIMITS } from '@strive/api-interfaces';
import { MOBILE_VIEWPORT } from './e2e.constants';
import { fullExercise, makeSession, savedSet, setsOf } from './support/session.fixtures';
import {
  bottomFinishButton,
  exerciseHeading,
  position,
  repsField,
  saveButton,
  setForm,
  weightField,
} from './support/session.page';
import { startSessionServer } from './support/session.server';

const LAST_PLANNED_WEIGHT = 60;
const LAST_PLANNED_REPS = 8;
const EXTRA_SET_NUMBER = 4;
const LAST_PLANNED = savedSet({
  workoutExerciseId: 1,
  setNumber: 3,
  weight: LAST_PLANNED_WEIGHT,
  reps: LAST_PLANNED_REPS,
});

function doneFirstExercise() {
  return [...setsOf({ index: 0, setNumbers: [1, 2] }), LAST_PLANNED];
}

test.describe('автопереход и подходы сверх плана', () => {
  test.use({ viewport: MOBILE_VIEWPORT });

  test('после сохранения последнего планового подхода экран переходит к следующему упражнению', async ({
    page,
  }) => {
    await startSessionServer(page, {
      session: makeSession({ results: setsOf({ index: 0, setNumbers: [1, 2] }) }),
    });
    await page.goto('/workouts/session');
    await expect(position({ page, current: 1, total: 3 })).toBeVisible();

    await saveButton(page).click();

    await expect(exerciseHeading(page, 'Жим лёжа')).toBeVisible();
    await expect(position({ page, current: 2, total: 3 })).toBeVisible();
  });

  test('на последнем упражнении автоперехода нет, кнопка «Завершить тренировку»', async ({
    page,
  }) => {
    await startSessionServer(page, {
      session: makeSession({ exerciseCount: 1, results: setsOf({ index: 0, setNumbers: [1, 2] }) }),
    });
    await page.goto('/workouts/session');

    await saveButton(page).click();

    await expect(position({ page, current: 1, total: 1 })).toBeVisible();
    await expect(bottomFinishButton(page)).toBeVisible();
  });

  test('«Ещё подход» открывает форму следующего подхода с предзаполнением', async ({ page }) => {
    await startSessionServer(page, {
      session: makeSession({ exerciseCount: 1, results: doneFirstExercise() }),
    });
    await page.goto('/workouts/session');

    await page.getByRole('button', { name: 'Ещё подход' }).click();

    await expect(page.getByRole('form', { name: 'Подход 4' })).toBeVisible();
    await expect(weightField(page)).toHaveValue(String(LAST_PLANNED_WEIGHT));
    await expect(repsField(page)).toHaveValue(String(LAST_PLANNED_REPS));
  });

  test('дополнительный подход сохраняется без автоперехода', async ({ page }) => {
    const server = await startSessionServer(page, {
      session: makeSession({
        exerciseCount: 2,
        results: [...doneFirstExercise(), ...setsOf({ index: 1, setNumbers: [1] })],
      }),
    });
    await page.goto('/workouts/session');
    await page.getByRole('button', { name: 'Назад', exact: true }).click();
    await page.getByRole('button', { name: 'Ещё подход' }).click();

    await saveButton(page).click();

    await expect.poll(() => server.saves[0]?.setNumber).toBe(EXTRA_SET_NUMBER);
    await expect(position({ page, current: 1, total: 2 })).toBeVisible();
    await expect(page.getByRole('img', { name: 'Выполнено 4 из 3 подходов' })).toBeVisible();
  });

  test('на пределе подходов «Ещё подход» скрыта', async ({ page }) => {
    const limit = SET_RESULT_LIMITS.setNumberMax;
    const results = setsOf({
      index: 0,
      setNumbers: Array.from({ length: limit }, (_, index) => index + 1),
    });
    await startSessionServer(page, { session: makeSession({ exerciseCount: 1, results }) });
    await page.goto('/workouts/session');
    await expect(page.getByRole('region', { name: 'Упражнение выполнено' })).toBeVisible();

    await expect(page.getByRole('button', { name: 'Ещё подход' })).toHaveCount(0);
  });

  test('открытое выполненное упражнение показывает карточку «Упражнение выполнено» и «Ещё подход»', async ({
    page,
  }) => {
    await startSessionServer(page, {
      session: makeSession({ exerciseCount: 1, results: fullExercise(0) }),
    });
    await page.goto('/workouts/session');

    await expect(page.getByRole('region', { name: 'Упражнение выполнено' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Ещё подход' })).toBeVisible();
    await expect(setForm(page)).toHaveCount(0);
  });
});
