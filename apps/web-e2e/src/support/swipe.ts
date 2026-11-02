import type { Locator, Page } from '@playwright/test';

const SWIPE_DISTANCE = 160;
const SWIPE_STEPS = 4;

type Direction = 'left' | 'right' | 'up' | 'down';

const VECTORS: Record<Direction, { x: number; y: number }> = {
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
};

export async function swipe(
  page: Page,
  { from, direction }: { from: Locator; direction: Direction },
): Promise<void> {
  const box = await from.boundingBox();
  if (!box) throw new Error('Элемент для жеста не найден на странице');

  const vector = VECTORS[direction];
  const centerX = box.x + box.width / 2;
  const centerY = box.y + box.height / 2;
  const startX = centerX - (vector.x * SWIPE_DISTANCE) / 2;
  const startY = centerY - (vector.y * SWIPE_DISTANCE) / 2;
  const client = await page.context().newCDPSession(page);

  await client.send('Input.dispatchTouchEvent', {
    type: 'touchStart',
    touchPoints: [{ x: startX, y: startY }],
  });
  for (let step = 1; step <= SWIPE_STEPS; step += 1) {
    const progress = (step / SWIPE_STEPS) * SWIPE_DISTANCE;
    await client.send('Input.dispatchTouchEvent', {
      type: 'touchMove',
      touchPoints: [{ x: startX + vector.x * progress, y: startY + vector.y * progress }],
    });
  }
  await client.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
}
