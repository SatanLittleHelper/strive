import { fileURLToPath } from 'node:url';

export const VISUAL_STYLES = fileURLToPath(new URL('./visual.css', import.meta.url));
export const VISUAL_NOW = new Date('2026-11-02T12:00:00.000Z');
export const VISUAL_USE = {
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 1,
  timezoneId: 'UTC',
  locale: 'ru-RU',
} as const;
