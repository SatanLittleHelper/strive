import { describe, expect, it } from 'vitest';
import { generateShareToken } from './session-share.helpers.js';

const TOKEN_LENGTH = 43;
const TOKEN_PATTERN = new RegExp(`^[A-Za-z0-9_-]{${TOKEN_LENGTH}}$`);

describe('Токен общей ссылки', () => {
  it('[ss-U1] состоит из символов base64url, имеет длину 43 и не повторяется', () => {
    const first = generateShareToken();
    const second = generateShareToken();

    expect(first).toMatch(TOKEN_PATTERN);
    expect(second).toMatch(TOKEN_PATTERN);
    expect(first).not.toBe(second);
  });
});
