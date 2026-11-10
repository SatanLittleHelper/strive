import { expect, test } from '@playwright/test';
import { SET_RESULT_LIMITS } from '@strive/api-interfaces';
import { MOBILE_VIEWPORT } from './e2e.constants';
import { fillSetForm, makeSession, selectRpe } from './support/session.fixtures';
import { position, repsField, saveButton, setForm, weightField } from './support/session.page';
import { startSessionServer } from './support/session.server';

const HTTP_ERROR = 500;
const NOTE_TEXT = 'тяжело в нижней точке';
const NOTE_CHAR = 'я';
const SAVE_ERROR = 'Не удалось сохранить подход. Попробуйте ещё раз.';

test.describe('ввод подхода', () => {
  test.use({ viewport: MOBILE_VIEWPORT });

  test('ошибка пустого веса не меняет высоту полей', async ({ page }) => {
    await startSessionServer(page);
    await page.goto('/workouts/session');
    const heightBefore = [
      await weightField(page).boundingBox(),
      await repsField(page).boundingBox(),
    ];

    await weightField(page).fill('');
    await saveButton(page).click();
    await expect(setForm(page).locator('tui-error').first()).toBeVisible();

    expect(
      await weightField(page)
        .boundingBox()
        .then((box) => box?.height),
    ).toBe(heightBefore[0]?.height);
    expect(
      await repsField(page)
        .boundingBox()
        .then((box) => box?.height),
    ).toBe(heightBefore[1]?.height);
  });

  test('поля предзаполнены целью упражнения', async ({ page }) => {
    await startSessionServer(page, { session: makeSession({ weight: 62.5, reps: 10 }) });
    await page.goto('/workouts/session');

    await expect(weightField(page)).toHaveValue(/^62\.5/);
    await expect(repsField(page)).toHaveValue('10');
  });

  test('у полей веса и повторов нет кнопок −/+', async ({ page }) => {
    await startSessionServer(page);
    await page.goto('/workouts/session');
    const form = page.getByRole('form', { name: 'Подход 1' });
    await expect(form).toBeVisible();

    await expect(
      form.getByRole('button', { name: /^(?:Увеличить|Уменьшить|−|-|\+)$/ }),
    ).toHaveCount(0);
  });

  test('RPE выбирается сегментами 1–5, по умолчанию выбран 3', async ({ page }) => {
    await startSessionServer(page);
    await page.goto('/workouts/session');

    const rpe = page.getByRole('radiogroup', { name: 'RPE от 1 до 5' });

    await expect(rpe.getByRole('radio')).toHaveCount(SET_RESULT_LIMITS.rpeMax);
    await expect(rpe.getByRole('radio', { name: '3' })).toBeChecked();
  });

  test('выбранный RPE уходит в запрос сохранения', async ({ page }) => {
    const server = await startSessionServer(page);
    await page.goto('/workouts/session');
    await selectRpe(setForm(page), '5');

    await saveButton(page).click();

    await expect.poll(() => server.saves[0]?.body.rpe).toBe(5);
  });

  test('«+ Заметка» раскрывает поле, заметка уходит в запрос', async ({ page }) => {
    const server = await startSessionServer(page);
    await page.goto('/workouts/session');
    const form = page.getByRole('form', { name: 'Подход 1' });
    await expect(form).toBeVisible();
    await expect(form.getByLabel('Заметка', { exact: true })).toHaveCount(0);
    await form.getByRole('button', { name: '+ Заметка' }).click();
    await form.getByLabel('Заметка', { exact: true }).fill(NOTE_TEXT);

    await saveButton(page).click();

    await expect.poll(() => server.saves[0]?.body.note).toBe(NOTE_TEXT);
  });

  test('без раскрытия заметки в запросе note: null', async ({ page }) => {
    const server = await startSessionServer(page);
    await page.goto('/workouts/session');
    await expect(setForm(page)).toBeVisible();

    await saveButton(page).click();

    await expect.poll(() => server.saves[0]?.body.note).toBeNull();
  });

  test('заметка из 501 символа не отправляется', async ({ page }) => {
    const server = await startSessionServer(page);
    await page.goto('/workouts/session');
    await fillSetForm(page, { note: NOTE_CHAR.repeat(SET_RESULT_LIMITS.noteMaxLength + 1) });

    await saveButton(page).click();

    await expect(
      page.getByText(`Не больше ${SET_RESULT_LIMITS.noteMaxLength} символов`),
    ).toBeVisible();
    expect(server.saves).toEqual([]);
  });

  test('заметка из 500 символов отправляется', async ({ page }) => {
    const server = await startSessionServer(page);
    await page.goto('/workouts/session');
    await fillSetForm(page, { note: NOTE_CHAR.repeat(SET_RESULT_LIMITS.noteMaxLength) });

    await saveButton(page).click();

    await expect
      .poll(() => server.saves[0]?.body.note?.length)
      .toBe(SET_RESULT_LIMITS.noteMaxLength);
  });

  test('пустой вес не отправляется и показывает ошибку у поля', async ({ page }) => {
    const server = await startSessionServer(page);
    await page.goto('/workouts/session');
    await fillSetForm(page, { weight: '' });

    await saveButton(page).click();

    await expect(page.getByText('Обязательное поле')).toBeVisible();
    await expect(weightField(page)).toHaveAttribute('aria-invalid', 'true');
    expect(server.saves).toEqual([]);
  });

  test('повторы ниже минимума не отправляются', async ({ page }) => {
    const server = await startSessionServer(page);
    await page.goto('/workouts/session');
    await fillSetForm(page, { reps: String(SET_RESULT_LIMITS.repsMin - 1) });

    await saveButton(page).click();

    await expect(page.getByText(`Не меньше ${SET_RESULT_LIMITS.repsMin}`)).toBeVisible();
    expect(server.saves).toEqual([]);
  });

  test('ошибка сервера при сохранении показывается, введённое остаётся', async ({ page }) => {
    await startSessionServer(page, { saveStatus: HTTP_ERROR });
    await page.goto('/workouts/session');
    await fillSetForm(page, { weight: '62.5', reps: '7' });

    await saveButton(page).click();

    await expect(page.getByRole('alert')).toContainText(SAVE_ERROR);
    await expect(weightField(page)).toHaveValue(/^62\.5/);
    await expect(repsField(page)).toHaveValue('7');
  });

  test('пока идёт сохранение, действия заблокированы', async ({ page }) => {
    const server = await startSessionServer(page, { holdSaves: true });
    await page.goto('/workouts/session');

    await saveButton(page).click();
    await expect.poll(() => server.saves.length).toBe(1);

    for (const name of ['Назад', 'Далее', 'Завершить']) {
      await expect(page.getByRole('button', { name, exact: true })).toBeDisabled();
    }
    await page.getByRole('button', { name: 'Далее', exact: true }).dispatchEvent('click');
    await expect(position({ page, current: 1, total: 3 })).toBeVisible();
    server.releaseSaves();
  });
});
