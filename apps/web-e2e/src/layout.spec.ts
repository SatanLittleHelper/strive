import { expect, test, type Page } from '@playwright/test';
import { DESKTOP_VIEWPORT, MOBILE_VIEWPORT } from './e2e.constants';

const NAV_TAB_COUNT = 3;
const CENTER_TOLERANCE = 1;
const MIN_EDGE_GAP = 8;

const mainNavigation = (page: Page) => page.getByRole('navigation', { name: 'Основная навигация' });

test('навигация открывает разделы Главная, Тренировки и История', async ({ page }) => {
  await page.goto('/history');
  const navigation = mainNavigation(page);

  await navigation.getByRole('link', { name: 'Главная' }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole('heading', { name: 'Strive', exact: true })).toBeVisible();

  await navigation.getByRole('link', { name: 'Тренировки' }).click();
  await expect(page).toHaveURL(/\/workouts$/);
  await expect(page.getByRole('heading', { name: 'Тренировки' })).toBeVisible();

  await navigation.getByRole('link', { name: 'История' }).click();
  await expect(page).toHaveURL(/\/history$/);
  await expect(page.getByRole('heading', { name: 'История' })).toBeVisible();
});

test('активная вкладка помечается aria-current', async ({ page }) => {
  await page.goto('/workouts');
  const navigation = mainNavigation(page);

  await expect(navigation.getByRole('link', { name: 'Тренировки' })).toHaveAttribute(
    'aria-current',
    'page',
  );
  await expect(navigation.getByRole('link', { name: 'Главная' })).not.toHaveAttribute(
    'aria-current',
    'page',
  );
});

test('на телефоне навигация закреплена внизу экрана', async ({ page }) => {
  await page.setViewportSize(MOBILE_VIEWPORT);
  await page.goto('/');

  const box = await mainNavigation(page).boundingBox();

  expect(box).not.toBeNull();
  expect((box?.y ?? 0) + (box?.height ?? 0)).toBeCloseTo(MOBILE_VIEWPORT.height, 0);
});

test('на телефоне подписи вкладок отцентрованы и не прижаты к краям экрана', async ({ page }) => {
  await page.setViewportSize(MOBILE_VIEWPORT);
  await page.goto('/');

  const tabs = await mainNavigation(page)
    .getByRole('link')
    .evaluateAll((links) =>
      links.map((link) => {
        const box = link.getBoundingClientRect();
        const range = link.ownerDocument.createRange();
        range.selectNodeContents(link);
        const text = range.getBoundingClientRect();

        return {
          width: box.width,
          centerOffset: Math.abs(text.x + text.width / 2 - (box.x + box.width / 2)),
          textLeft: text.x,
          textRight: text.right,
        };
      }),
    );

  expect(tabs).toHaveLength(NAV_TAB_COUNT);
  for (const tab of tabs) {
    expect(tab.centerOffset).toBeLessThan(CENTER_TOLERANCE);
    expect(tab.width).toBeCloseTo(tabs[0]?.width ?? 0, 0);
  }
  expect(tabs[0]?.textLeft).toBeGreaterThanOrEqual(MIN_EDGE_GAP);
  expect(MOBILE_VIEWPORT.width - (tabs.at(-1)?.textRight ?? 0)).toBeGreaterThanOrEqual(
    MIN_EDGE_GAP,
  );
});

test('на десктопе навигация расположена сверху над контентом', async ({ page }) => {
  await page.setViewportSize(DESKTOP_VIEWPORT);
  await page.goto('/');

  const header = await page.getByRole('banner').boundingBox();
  const navigation = await mainNavigation(page).boundingBox();
  const content = await page.getByRole('main').boundingBox();

  expect(header).not.toBeNull();
  expect(navigation).not.toBeNull();
  expect(content).not.toBeNull();
  // порядок сверху вниз: шапка, навигация, контент; навигация не растянута на весь экран
  expect(navigation?.y ?? 0).toBeGreaterThanOrEqual((header?.y ?? 0) + (header?.height ?? 0));
  expect((navigation?.y ?? 0) + (navigation?.height ?? 0)).toBeLessThanOrEqual(content?.y ?? 0);
  expect(navigation?.height ?? Infinity).toBeLessThan(DESKTOP_VIEWPORT.height / 4);
});

for (const [viewportName, viewport] of [
  ['телефоне', MOBILE_VIEWPORT],
  ['десктопе', DESKTOP_VIEWPORT],
] as const) {
  test(`все вкладки навигации не меньше 44px по высоте на ${viewportName}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto('/');

    for (const name of ['Главная', 'Тренировки', 'История']) {
      const box = await mainNavigation(page).getByRole('link', { name }).boundingBox();

      expect(box?.height ?? 0).toBeGreaterThanOrEqual(44);
    }
  });
}

test('нижний отступ контента на телефоне не меньше высоты фиксированной навигации', async ({
  page,
}) => {
  await page.setViewportSize(MOBILE_VIEWPORT);
  await page.goto('/');

  const navigation = await mainNavigation(page).boundingBox();
  const contentPaddingBottom = await page
    .getByRole('main')
    .evaluate((element) =>
      Number.parseFloat(
        element.ownerDocument.defaultView?.getComputedStyle(element).paddingBottom ?? '0',
      ),
    );

  expect(navigation).not.toBeNull();
  expect(contentPaddingBottom).toBeGreaterThanOrEqual(navigation?.height ?? Infinity);
});

test('название приложения в шапке возвращает на главную', async ({ page }) => {
  await page.goto('/history');

  await page.getByRole('link', { name: 'Strive' }).click();

  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole('heading', { name: 'Strive', exact: true })).toBeVisible();
});

test('на узком экране страница не прокручивается по горизонтали', async ({ page }) => {
  await page.setViewportSize(MOBILE_VIEWPORT);
  await page.goto('/');

  const hasHorizontalScroll = await page
    .locator('html')
    .evaluate((element) => element.scrollWidth > element.clientWidth);

  expect(hasHorizontalScroll).toBe(false);
});

test('веб-клиент передаёт идентификатор устройства в API', async ({ page }) => {
  const requestPromise = page.waitForRequest('**/api/health');

  await page.goto('/');

  const request = await requestPromise;
  expect(request.headers()['x-device-id']).toMatch(/^[0-9a-f-]{36}$/);
});
