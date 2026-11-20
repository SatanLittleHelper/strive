import { randomUUID } from 'node:crypto';
import { expect, test, type Page } from '@playwright/test';
import { DEVICE_ID_HEADER } from '@strive/api-interfaces';
import { API_URL, LEGS_WORKOUT_LINK, MOBILE_VIEWPORT } from './e2e.constants';
import { fillSetForm } from './support/session.fixtures';
import { saveButton } from './support/session.page';

const DEVICE_STORAGE_KEY = 'strive.device-id';
const DEVICE_ID = randomUUID();
const NOTE = 'Болит колено';
const SEED_SET_TEXT = '58 кг × 15';
const PLANNED_SETS = 3;
const FRIEND_TIMEOUT_MS = 20_000;

test.describe('общая ссылка на реальном API', () => {
  test.use({ viewport: MOBILE_VIEWPORT });

  test.beforeEach(async ({ browserName, context, page }) => {
    test.skip(
      browserName !== 'chromium',
      'Разрешения буфера обмена настраиваются только в Chromium',
    );
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await page.addInitScript(
      ({ key, id }) => {
        localStorage.setItem(key, id);
        Object.defineProperty(navigator, 'share', { value: undefined, configurable: true });
      },
      { key: DEVICE_STORAGE_KEY, id: DEVICE_ID },
    );
  });

  async function startLegsWorkout(page: Page): Promise<void> {
    await page.goto('/workouts');
    await page.getByRole('link', { name: LEGS_WORKOUT_LINK }).click();
    await page.getByRole('button', { name: 'Начать', exact: true }).click();
    await expect(page).toHaveURL(/\/workouts\/session$/);
  }

  async function saveSet(page: Page, setNumber: number): Promise<void> {
    await expect(page.getByRole('form', { name: `Подход ${setNumber}` })).toBeVisible();
    await saveButton(page).click();
    await expect(
      page.getByRole('img', { name: `Выполнено ${setNumber} из ${PLANNED_SETS} подходов` }),
    ).toBeVisible();
  }

  test('[ss-E22] друг видит прогресс без заметок, сводку, а после отзыва — недействительную ссылку', async ({
    page,
    browser,
    request,
  }) => {
    const headers = { [DEVICE_ID_HEADER]: DEVICE_ID };
    await startLegsWorkout(page);
    await fillSetForm(page, { note: NOTE }, 1);
    await saveSet(page, 1);
    await page.getByRole('button', { name: 'Поделиться', exact: true }).click();
    await expect(page.getByRole('status').filter({ hasText: 'Ссылка скопирована' })).toBeVisible();
    const link = await page.evaluate(() => navigator.clipboard.readText());

    const friendContext = await browser.newContext({ viewport: MOBILE_VIEWPORT });
    const friend = await friendContext.newPage();
    await friend.goto(link);
    await expect(friend.getByText(SEED_SET_TEXT)).toHaveCount(1);
    await expect(friend.getByText(NOTE)).toHaveCount(0);

    await saveSet(page, 2);
    await expect(friend.getByText(SEED_SET_TEXT)).toHaveCount(2, { timeout: FRIEND_TIMEOUT_MS });

    const active = await (await request.get(`${API_URL}/api/sessions/active`, { headers })).json();
    const sessionId: number = active.data.session.id;
    await page.getByRole('button', { name: 'Завершить', exact: true }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Завершить', exact: true }).click();
    await expect(page).toHaveURL(/\/history\/\d+$/);
    await expect(friend.getByText('Тренировка завершена')).toBeVisible({
      timeout: FRIEND_TIMEOUT_MS,
    });
    // два подхода одного упражнения: 2 × 58 кг × 15 = 1740 кг
    await expect(friend.getByText('Упражнений: 1', { exact: true })).toBeVisible();
    await expect(friend.getByText('Подходов: 2', { exact: true })).toBeVisible();
    await expect(friend.getByText(/1\D740/)).toBeVisible();

    const revoked = await request.delete(`${API_URL}/api/sessions/${sessionId}/share`, { headers });
    expect(revoked.ok()).toBeTruthy();
    await friend.reload();

    await expect(friend.getByText('Ссылка недействительна')).toBeVisible();
    await friendContext.close();
  });
});
