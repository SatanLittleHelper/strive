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
    it('should set tokens in cookies', () => {
      service.setTokens('access-token', 'refresh-token');

      expect(document.cookie).toContain('access_token=access-token');
      expect(document.cookie).toContain('refresh_token=refresh-token');
    });
  });

  describe('getAccessToken', () => {
    it('should return access token from cookies', () => {
      service.setTokens('test-token', 'refresh-token');

      expect(service.getAccessToken()).toBe('test-token');
    });

    it('should return null when no token is set', () => {
      expect(service.getAccessToken()).toBeNull();
    });
  });

  describe('getRefreshToken', () => {
    it('should return refresh token from cookies', () => {
      service.setTokens('access-token', 'test-refresh');

      expect(service.getRefreshToken()).toBe('test-refresh');
    });

    it('should return null when no token is set', () => {
      expect(service.getRefreshToken()).toBeNull();
    });
  });

  describe('clearTokens', () => {
    it('should clear both tokens', () => {
      service.setTokens('access-token', 'refresh-token');

      service.clearTokens();

      expect(service.getAccessToken()).toBeNull();
      expect(service.getRefreshToken()).toBeNull();
    });
  });
});
