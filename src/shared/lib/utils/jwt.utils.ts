export const getTokenExpirationSeconds = (token: string): number | null => {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }

    const payload = parts[1];
    const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    const parsed = JSON.parse(decoded);

    if (!parsed.exp) {
      return null;
    }

    const currentTime = Math.floor(Date.now() / 1000);
    return Math.max(0, parsed.exp - currentTime);
  } catch {
    return null;
  }
};
