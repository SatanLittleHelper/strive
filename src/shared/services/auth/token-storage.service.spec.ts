import { TestBed } from '@angular/core/testing';
import { configureZonelessTestingModule } from '@/test-setup';
import { TokenStorageService } from './token-storage.service';

describe('TokenStorageService', () => {
  let service: TokenStorageService;

  beforeEach(() => {
    configureZonelessTestingModule();

    TestBed.configureTestingModule({});
    service = TestBed.inject(TokenStorageService);

    document.cookie = 'access_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    document.cookie = 'refresh_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('setTokens', () => {
    it('should set access and refresh tokens in cookies', () => {
      const accessToken = 'test-access-token';
      const refreshToken = 'test-refresh-token';

      service.setTokens(accessToken, refreshToken);

      expect(document.cookie).toContain('access_token=test-access-token');
      expect(document.cookie).toContain('refresh_token=test-refresh-token');
    });

    it('should set secure and SameSite attributes', () => {
      const accessToken = 'test-access-token';
      const refreshToken = 'test-refresh-token';

      service.setTokens(accessToken, refreshToken);

      expect(document.cookie).toContain('access_token=test-access-token');
      expect(document.cookie).toContain('refresh_token=test-refresh-token');
    });
  });

  describe('getAccessToken', () => {
    it('should return access token from cookies', () => {
      const accessToken = 'test-access-token';
      service.setTokens(accessToken, 'refresh-token');

      const result = service.getAccessToken();

      expect(result).toBe(accessToken);
    });

    it('should return null when no access token is set', () => {
      const result = service.getAccessToken();

      expect(result).toBeNull();
    });
  });

  describe('getRefreshToken', () => {
    it('should return refresh token from cookies', () => {
      const refreshToken = 'test-refresh-token';
      service.setTokens('access-token', refreshToken);

      const result = service.getRefreshToken();

      expect(result).toBe(refreshToken);
    });

    it('should return null when no refresh token is set', () => {
      const result = service.getRefreshToken();

      expect(result).toBeNull();
    });
  });

  describe('clearTokens', () => {
    it('should clear both access and refresh tokens', () => {
      service.setTokens('access-token', 'refresh-token');

      service.clearTokens();

      expect(service.getAccessToken()).toBeNull();
      expect(service.getRefreshToken()).toBeNull();
    });
  });
});
