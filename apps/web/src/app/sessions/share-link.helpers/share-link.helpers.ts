import type { ShareLinkParams, ShareOutcome } from '../share-link.types';

export async function shareLink({
  token,
  origin = location.origin,
  nav = navigator,
}: ShareLinkParams): Promise<ShareOutcome> {
  const url = `${origin}/s/${token}`;

  try {
    if (typeof nav.share === 'function') {
      await nav.share({ url });

      return 'shared';
    }

    await nav.clipboard.writeText(url);

    return 'copied';
  } catch (error) {
    return error instanceof DOMException && error.name === 'AbortError' ? 'cancelled' : 'failed';
  }
}
