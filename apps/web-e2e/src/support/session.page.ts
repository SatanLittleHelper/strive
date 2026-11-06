import type { Locator, Page } from '@playwright/test';

export const saveButton = (page: Page): Locator =>
  page.getByRole('button', { name: /^Сохранить (подход|изменения)$/ });
export const setForm = (page: Page): Locator =>
  page
    .getByRole('group', { name: 'План и ввод подхода' })
    .getByRole('form', { name: /^Подход \d+$/ });
export const weightField = (page: Page): Locator =>
  setForm(page).getByLabel('Рабочий вес, кг', { exact: true });
export const repsField = (page: Page): Locator =>
  setForm(page).getByLabel('Повторы', { exact: true });
export const position = ({
  page,
  current,
  total,
}: {
  page: Page;
  current: number;
  total: number;
}): Locator => page.getByText(`${current} из ${total}`, { exact: true });
export const exerciseHeading = (page: Page, name: string): Locator =>
  page.getByRole('heading', { name, level: 2 });
export const todayGroup = (page: Page): Locator => page.getByRole('group', { name: 'Сегодня' });
export const finishButton = (page: Page): Locator =>
  page.locator('app-active-session header').getByRole('button', { name: 'Завершить', exact: true });
export const bottomFinishButton = (page: Page): Locator =>
  page.getByRole('button', { name: 'Завершить тренировку', exact: true });
