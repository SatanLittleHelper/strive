import type { Page } from '@playwright/test';
import type { HomeResponse } from '@strive/api-interfaces';
import { ok } from './session.fixtures';

export async function mockHome(page: Page, response: HomeResponse): Promise<void> {
  await page.route('**/api/home', (route) => route.fulfill({ json: ok(response) }));
}
