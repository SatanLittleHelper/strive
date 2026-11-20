import { describe, expect, it, vi } from 'vitest';
import { shareLink } from './share-link.helpers';

const ORIGIN = 'https://strive.test';
const TOKEN = 'abc';
const URL_OF_LINK = `${ORIGIN}/s/${TOKEN}`;

function navigatorOf(parts: object): Navigator {
  return parts as unknown as Navigator;
}

describe('Отправка ссылки', () => {
  it('[ss-U5] открывает системное меню, если Web Share доступен', async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    const writeText = vi.fn();

    const outcome = await shareLink({
      token: TOKEN,
      origin: ORIGIN,
      nav: navigatorOf({ share, clipboard: { writeText } }),
    });

    expect(outcome).toBe('shared');
    expect(share).toHaveBeenCalledWith({ url: URL_OF_LINK });
    expect(writeText).not.toHaveBeenCalled();
  });

  it('[ss-U6] без Web Share копирует ссылку в буфер', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);

    const outcome = await shareLink({
      token: TOKEN,
      origin: ORIGIN,
      nav: navigatorOf({ clipboard: { writeText } }),
    });

    expect(outcome).toBe('copied');
    expect(writeText).toHaveBeenCalledWith(URL_OF_LINK);
  });

  it('[ss-U7] закрытое системное меню не считается ошибкой', async () => {
    const share = vi.fn().mockRejectedValue(new DOMException('закрыто', 'AbortError'));
    const writeText = vi.fn();

    const outcome = await shareLink({
      token: TOKEN,
      origin: ORIGIN,
      nav: navigatorOf({ share, clipboard: { writeText } }),
    });

    expect(outcome).toBe('cancelled');
    expect(writeText).not.toHaveBeenCalled();
  });

  it.each([
    {
      name: 'Web Share отклонён не-AbortError',
      nav: navigatorOf({ share: vi.fn().mockRejectedValue(new Error('сбой')) }),
    },
    { name: 'буфер недоступен', nav: navigatorOf({}) },
  ])('[ss-U8] сбой даёт ошибку: $name', async ({ nav }) => {
    await expect(shareLink({ token: TOKEN, origin: ORIGIN, nav })).resolves.toBe('failed');
  });
});
