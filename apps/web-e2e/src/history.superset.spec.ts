import { expect, test } from '@playwright/test';
import { MOBILE_VIEWPORT } from './e2e.constants';
import { historySet, makeSummary, mockSummary, SUMMARY_ID } from './support/history.fixtures';

const GROUP = 1;
const FIRST = { exerciseId: 1, name: 'Приседания со штангой' };
const SECOND = { exerciseId: 2, name: 'Жим лёжа' };
const SINGLE = { exerciseId: 3, name: 'Тяга штанги в наклоне' };

function exerciseOf({
  exerciseId,
  name,
  group,
}: {
  exerciseId: number;
  name: string;
  group: number | null;
}) {
  return {
    exerciseId,
    name,
    supersetGroup: group,
    sets: [historySet({ exerciseId, setNumber: 1 })],
  };
}

test.describe('детали истории с суперсетом', () => {
  test.use({ viewport: MOBILE_VIEWPORT, timezoneId: 'UTC' });

  test('[E8] упражнения суперсета идут подряд с бейджем, одиночное отдельно', async ({ page }) => {
    await mockSummary({
      page,
      id: SUMMARY_ID,
      response: makeSummary({
        exercises: [
          exerciseOf({ ...FIRST, group: GROUP }),
          exerciseOf({ ...SECOND, group: GROUP }),
          exerciseOf({ ...SINGLE, group: null }),
        ],
      }),
    });
    await page.goto(`/history/${SUMMARY_ID}`);

    await expect(page.getByRole('heading', { level: 2 })).toHaveText([
      FIRST.name,
      SECOND.name,
      SINGLE.name,
    ]);
    await expect(page.getByRole('main').getByText('Суперсет', { exact: true })).toHaveCount(2);
    await expect(
      page
        .locator('section[tuiCardLarge]', { hasText: SINGLE.name })
        .getByText('Суперсет', { exact: true }),
    ).toHaveCount(0);
  });
});
