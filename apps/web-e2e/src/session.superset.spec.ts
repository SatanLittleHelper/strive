import { expect, test } from '@playwright/test';
import { MOBILE_VIEWPORT } from './e2e.constants';
import { makeSession } from './support/session.fixtures';
import { exerciseHeading, saveButton } from './support/session.page';
import { startSessionServer } from './support/session.server';

const FIRST = 'Приседания со штангой';
const SECOND = 'Жим лёжа';
const SUPERSET_LABEL = `Суперсет ${FIRST} + ${SECOND}`;
const SETS = 2;
const GROUP = 1;

test.describe('суперсет на экране тренировки', () => {
  test.use({ viewport: MOBILE_VIEWPORT });

  test('[E5] над упражнением суперсета видна метка', async ({ page }) => {
    await startSessionServer(page, {
      session: makeSession({ exerciseCount: 3, supersetGroups: [GROUP, GROUP, null], sets: SETS }),
    });
    await page.goto('/workouts/session');

    await expect(page.getByText(SUPERSET_LABEL, { exact: true })).toBeVisible();
  });

  test('[E6] подходы чередуются на экране', async ({ page }) => {
    await startSessionServer(page, {
      session: makeSession({ exerciseCount: 3, supersetGroups: [GROUP, GROUP, null], sets: SETS }),
    });
    await page.goto('/workouts/session');
    await expect(exerciseHeading(page, FIRST)).toBeVisible();

    await saveButton(page).click();
    await expect(exerciseHeading(page, SECOND)).toBeVisible();

    await saveButton(page).click();
    await expect(exerciseHeading(page, FIRST)).toBeVisible();
  });

  test('[E7] одиночное упражнение без метки суперсета', async ({ page }) => {
    await startSessionServer(page, { session: makeSession({ sets: SETS }) });
    await page.goto('/workouts/session');
    await expect(exerciseHeading(page, FIRST)).toBeVisible();

    await expect(page.getByText(/^Суперсет/)).toHaveCount(0);
  });
});
