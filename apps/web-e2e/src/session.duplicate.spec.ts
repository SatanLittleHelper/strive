import { expect, test } from '@playwright/test';
import { MOBILE_VIEWPORT } from './e2e.constants';
import { historyOf, makeSession, savedSet, setsOf } from './support/session.fixtures';
import {
  exerciseHeading,
  position,
  saveButton,
  todayGroup,
  todayRow,
} from './support/session.page';
import { startSessionServer } from './support/session.server';
import { swipeRow } from './support/swipe';

const SETS = 2;
const LATERAL_EXERCISE_ID = 2;
const LATERAL_NAME = 'Жим лёжа';
const FIRST_NAME = 'Приседания со штангой';
const HISTORY_WEIGHT = 12;
const HISTORY_REPS = 15;
const PAST_SESSION_ID = 7;
const PAST_FINISHED_AT = '2026-10-01T10:00:00.000Z';

test.describe('повтор упражнения на экране тренировки', () => {
  test.use({ viewport: MOBILE_VIEWPORT });

  test('[E9] подходы повторяющегося упражнения не смешиваются на экране', async ({ page }) => {
    await startSessionServer(page, {
      session: makeSession({
        exerciseCount: 4,
        exerciseIds: [1, LATERAL_EXERCISE_ID, LATERAL_EXERCISE_ID, 3],
        supersetGroups: [1, 1, 2, 2],
        sets: SETS,
      }),
    });
    await page.goto('/workouts/session');
    await expect(exerciseHeading(page, FIRST_NAME)).toBeVisible();

    await saveButton(page).click();
    await expect(exerciseHeading(page, LATERAL_NAME)).toBeVisible();
    await saveButton(page).click();
    await expect(exerciseHeading(page, FIRST_NAME)).toBeVisible();
    await saveButton(page).click();
    await expect(exerciseHeading(page, LATERAL_NAME)).toBeVisible();
    await saveButton(page).click();

    await expect(position({ page, current: 3, total: 4 })).toBeVisible();
    await expect(page.getByRole('img', { name: `Выполнено 0 из ${SETS} подходов` })).toBeVisible();
  });

  test('[E10] выбранный для правки подход не переходит на соседнее вхождение @touch', async ({
    page,
  }) => {
    await startSessionServer(page, {
      session: makeSession({
        exerciseCount: 2,
        exerciseIds: [LATERAL_EXERCISE_ID, LATERAL_EXERCISE_ID],
        sets: SETS,
        results: setsOf({ index: 0, setNumbers: [1] }),
      }),
    });
    await page.goto('/workouts/session');
    await swipeRow(page, { from: todayRow(page), direction: 'left' });
    await expect(page.getByRole('button', { name: 'Сохранить изменения' })).toBeVisible();

    await page.getByRole('button', { name: 'Далее', exact: true }).click();

    await expect(position({ page, current: 2, total: 2 })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Сохранить подход', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Сохранить изменения' })).toHaveCount(0);
  });

  test('[E53] после ухода с упражнения и возврата правка не восстанавливается @touch', async ({
    page,
  }) => {
    await startSessionServer(page, {
      session: makeSession({ results: setsOf({ index: 0, setNumbers: [1] }) }),
    });
    await page.goto('/workouts/session');
    await swipeRow(page, { from: todayRow(page), direction: 'left' });
    await expect(page.getByRole('button', { name: 'Сохранить изменения' })).toBeVisible();

    await page.getByRole('button', { name: 'Далее', exact: true }).click();
    await page.getByRole('button', { name: 'Назад', exact: true }).click();

    await expect(page.getByRole('button', { name: 'Сохранить подход', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Сохранить изменения' })).toHaveCount(0);
  });

  test('[E11] обе строки плана показывают одну и ту же историю упражнения', async ({ page }) => {
    await startSessionServer(page, {
      session: makeSession({
        exerciseCount: 2,
        exerciseIds: [LATERAL_EXERCISE_ID, LATERAL_EXERCISE_ID],
        sets: SETS,
      }),
      history: historyOf(LATERAL_EXERCISE_ID, [
        {
          sessionId: PAST_SESSION_ID,
          finishedAt: PAST_FINISHED_AT,
          sets: [savedSet({ workoutExerciseId: 99, weight: HISTORY_WEIGHT, reps: HISTORY_REPS })],
        },
      ]),
    });
    await page.goto('/workouts/session');
    const entry = page.getByText(`${HISTORY_WEIGHT} кг × ${HISTORY_REPS}`);
    await expect(entry.first()).toBeVisible();

    await page.getByRole('button', { name: 'Далее', exact: true }).click();

    await expect(position({ page, current: 2, total: 2 })).toBeVisible();
    await expect(entry.first()).toBeVisible();
  });
});
