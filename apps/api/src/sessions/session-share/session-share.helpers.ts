import { randomBytes } from 'node:crypto';
import type { ShareLink } from '@strive/api-interfaces';
import type { ShareRow } from '../session.types.js';

const SHARE_TOKEN_BYTES = 32;

export function generateShareToken(): string {
  return randomBytes(SHARE_TOKEN_BYTES).toString('base64url');
}

// просроченная ссылка считается отсутствующей
export function toShareLink(row: ShareRow, now: Date = new Date()): ShareLink | null {
  if (row.share_token === null || row.share_expires_at === null) return null;
  if (row.share_expires_at <= now) return null;

  return { token: row.share_token, expiresAt: row.share_expires_at.toISOString() };
}
