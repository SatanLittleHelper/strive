import { getTokenExpirationSeconds } from './jwt.utils';

describe('JWT Utils', () => {
  const createMockJwt = (expirationSeconds: number): string => {
    const currentTime = Math.floor(Date.now() / 1000);
    const exp = currentTime + expirationSeconds;
    const payload = { exp, iat: currentTime, sub: 'user123' };
    const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const encodedPayload = btoa(JSON.stringify(payload));
    return `${header}.${encodedPayload}.mock-signature`;
  };

  describe('getTokenExpirationSeconds', () => {
    it('should return remaining seconds until expiration', () => {
      const expirationSeconds = 3600; // 1 hour
      const token = createMockJwt(expirationSeconds);

      const result = getTokenExpirationSeconds(token);

      expect(result).toBeGreaterThan(3590); // Allow for slight timing differences
      expect(result).toBeLessThanOrEqual(3600);
    });

    it('should return 0 for expired token', () => {
      const expirationSeconds = -3600; // 1 hour ago
      const token = createMockJwt(expirationSeconds);

      const result = getTokenExpirationSeconds(token);

      expect(result).toBe(0);
    });

    it('should return null for invalid token format', () => {
      const invalidToken = 'invalid.token';

      const result = getTokenExpirationSeconds(invalidToken);

      expect(result).toBeNull();
    });

    it('should return null for token without exp claim', () => {
      const payload = { iat: Math.floor(Date.now() / 1000), sub: 'user123' }; // No exp field
      const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
      const encodedPayload = btoa(JSON.stringify(payload));
      const token = `${header}.${encodedPayload}.mock-signature`;

      const result = getTokenExpirationSeconds(token);

      expect(result).toBeNull();
    });

    it('should return null for malformed JSON', () => {
      const invalidToken = 'header.invalid-json.signature';

      const result = getTokenExpirationSeconds(invalidToken);

      expect(result).toBeNull();
    });
  });
});
