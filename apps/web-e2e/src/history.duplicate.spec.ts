import { expect, test } from '@playwright/test';
import { MOBILE_VIEWPORT } from './e2e.constants';
import { historySet, makeSummary, mockSummary, SUMMARY_ID } from './support/history.fixtures';

const LATERAL = { exerciseId: 2, name: 'Жим лёжа' };

function card({
  workoutExerciseId,
  setNumbers,
}: {
  workoutExerciseId: number;
  setNumbers: number[];
}) {
  return {
    workoutExerciseId,
    exerciseId: LATERAL.exerciseId,
    name: LATERAL.name,
    supersetGroup: null,
    sets: setNumbers.map((setNumber) => historySet({ workoutExerciseId, setNumber })),
  };
}

test.describe('детали истории при повторе упражнения', () => {
  test.use({ viewport: MOBILE_VIEWPORT, timezoneId: 'UTC' });

  test('[E12] показывает обе карточки одного упражнения', async ({ page }) => {
    await mockSummary({
      page,
      id: SUMMARY_ID,
      response: makeSummary({
        exercises: [
          card({ workoutExerciseId: 1, setNumbers: [1] }),
          card({ workoutExerciseId: 2, setNumbers: [1, 2] }),
        ],
      }),
    });
    await page.goto(`/history/${SUMMARY_ID}`);

    const cards = page.locator('section[tuiCardLarge]', { hasText: LATERAL.name });
    await expect(cards).toHaveCount(2);
    await expect(cards.nth(0).getByRole('listitem')).toHaveCount(1);
    await expect(cards.nth(1).getByRole('listitem')).toHaveCount(2);
  });
});
