import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import type { ApiError } from '@/shared/lib/types';
import { TokenStorageService } from '@/shared/services/auth/token-storage.service';
import { configureZonelessTestingModule } from '@/test-setup';
import { AuthApiService } from './auth-api.service';
import { AuthService } from './auth.service';
import type { LoginRequest, RegisterRequest, LoginResponse } from '../models/auth.types';

describe('AuthService', () => {
  let service: AuthService;
  let authApiService: jasmine.SpyObj<AuthApiService>;
  let tokenStorageService: jasmine.SpyObj<TokenStorageService>;
  let router: jasmine.SpyObj<Router>;

  beforeEach(() => {
    const authApiSpy = jasmine.createSpyObj('AuthApiService', ['login$', 'register$', 'refresh$']);
    const tokenStorageSpy = jasmine.createSpyObj('TokenStorageService', [
      'setTokens',
      'getAccessToken',
      'getRefreshToken',
      'clearTokens',
    ]);
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    configureZonelessTestingModule({
      providers: [
        AuthService,
        { provide: AuthApiService, useValue: authApiSpy },
        { provide: TokenStorageService, useValue: tokenStorageSpy },
        { provide: Router, useValue: routerSpy },
      ],
    });

    service = TestBed.inject(AuthService);
    authApiService = TestBed.inject(AuthApiService) as jasmine.SpyObj<AuthApiService>;
    tokenStorageService = TestBed.inject(
      TokenStorageService,
    ) as jasmine.SpyObj<TokenStorageService>;
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;

    sessionStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('isAuthenticated', () => {
    it('should return true when valid tokens exist', () => {
      tokenStorageService.getAccessToken.and.returnValue('access-token');
      tokenStorageService.getRefreshToken.and.returnValue('refresh-token');

      service.initFromStorage();
      expect(service.isAuthenticated()).toBe(true);
    });
    it('should return false when access token is missing', () => {
      tokenStorageService.getAccessToken.and.returnValue(null);
      tokenStorageService.getRefreshToken.and.returnValue('refresh-token');

      service.initFromStorage();
      expect(service.isAuthenticated()).toBe(false);
    });

    it('should return false when refresh token is missing', () => {
      tokenStorageService.getAccessToken.and.returnValue('access-token');
      tokenStorageService.getRefreshToken.and.returnValue(null);

      service.initFromStorage();
      expect(service.isAuthenticated()).toBe(false);
    });

    it('should return false when both tokens are missing', () => {
      tokenStorageService.getAccessToken.and.returnValue(null);
      tokenStorageService.getRefreshToken.and.returnValue(null);

      service.initFromStorage();
      expect(service.isAuthenticated()).toBe(false);
    });
  });

  describe('login$', () => {
    it('should successfully login and navigate to dashboard', () => {
      const loginRequest: LoginRequest = {
        email: 'test@example.com',
        password: 'password123',
      };

      const loginResponse: LoginResponse = {
        access_token: 'access-token',
        refresh_token: 'refresh-token',
        expires_in: 3600,
        token_type: 'Bearer',
      };

      authApiService.login$.and.returnValue(of(loginResponse));

      service.login$(loginRequest).subscribe();

      expect(authApiService.login$).toHaveBeenCalledWith(loginRequest);
      expect(tokenStorageService.setTokens).toHaveBeenCalledWith(
        loginResponse.access_token,
        loginResponse.refresh_token,
      );
      expect(router.navigate).toHaveBeenCalledWith(['/dashboard']);
    });

    it('should navigate to returnUrl when available', () => {
      const loginRequest: LoginRequest = {
        email: 'test@example.com',
        password: 'password123',
      };

      const loginResponse: LoginResponse = {
        access_token: 'access-token',
        refresh_token: 'refresh-token',
        expires_in: 3600,
        token_type: 'Bearer',
      };

      sessionStorage.setItem('return_url', '/protected-page');
      authApiService.login$.and.returnValue(of(loginResponse));

      service.login$(loginRequest).subscribe();

      expect(router.navigate).toHaveBeenCalledWith(['/protected-page']);
      expect(sessionStorage.getItem('return_url')).toBeNull();
    });

    it('should handle login error', () => {
      const loginRequest: LoginRequest = {
        email: 'test@example.com',
        password: 'wrongpassword',
      };

      const apiError: ApiError = {
        code: 'INVALID_CREDENTIALS',
        message: 'Invalid email or password',
      };

      authApiService.login$.and.returnValue(throwError(() => apiError));

      service.login$(loginRequest).subscribe();

      expect(service.error()).toBe('Invalid email or password');
      expect(router.navigate).not.toHaveBeenCalled();
    });

    it('should set loading state during login', () => {
      const loginRequest: LoginRequest = {
        email: 'test@example.com',
        password: 'password123',
      };

      const loginResponse: LoginResponse = {
        access_token: 'access-token',
        refresh_token: 'refresh-token',
        expires_in: 3600,
        token_type: 'Bearer',
      };

      authApiService.login$.and.returnValue(of(loginResponse));

      expect(service.loading()).toBe(false);

      service.login$(loginRequest).subscribe();

      expect(service.loading()).toBe(false); // Should be false after completion
    });
  });

  describe('register$', () => {
    it('should successfully register and navigate to login', () => {
      const registerRequest: RegisterRequest = {
        email: 'test@example.com',
        password: 'password123',
      };

      authApiService.register$.and.returnValue(of(undefined));

      service.register$(registerRequest).subscribe();

      expect(authApiService.register$).toHaveBeenCalledWith(registerRequest);
      expect(router.navigate).toHaveBeenCalledWith(['/login']);
    });

    it('should handle registration error', () => {
      const registerRequest: RegisterRequest = {
        email: 'test@example.com',
        password: 'password123',
      };

      const apiError: ApiError = {
        code: 'EMAIL_ALREADY_EXISTS',
        message: 'Email is already registered',
      };

      authApiService.register$.and.returnValue(throwError(() => apiError));

      service.register$(registerRequest).subscribe();

      expect(service.error()).toBe('Email is already registered');
      expect(router.navigate).not.toHaveBeenCalled();
    });
  });

  describe('logout', () => {
    it('should clear tokens and navigate to login', () => {
      service.logout();

      expect(tokenStorageService.clearTokens).toHaveBeenCalled();
      expect(router.navigate).toHaveBeenCalledWith(['/login']);
    });
  });

  describe('clearError', () => {
    it('should clear error message', () => {
      service.error.set('Some error');
      service.clearError();

      expect(service.error()).toBeNull();
    });
  });

  describe('isTokenExpired (private method)', () => {
    it('should return true when token is null', () => {
      const result = (
        service as unknown as { isTokenExpired: (token: string | null) => boolean }
      ).isTokenExpired(null);
      expect(result).toBe(true);
    });

    it('should return true when token is empty string', () => {
      const result = (
        service as unknown as { isTokenExpired: (token: string | null) => boolean }
      ).isTokenExpired('');
      expect(result).toBe(true);
    });

    it('should return true when token cannot be decoded', () => {
      const result = (
        service as unknown as { isTokenExpired: (token: string | null) => boolean }
      ).isTokenExpired('invalid-token');
      expect(result).toBe(true);
    });

    it('should return true when token is expired', () => {
      const expiredTime = Math.floor(Date.now() / 1000) - 3600;
      const expiredToken = `header.${btoa(JSON.stringify({ exp: expiredTime }))}.signature`;

      const result = (
        service as unknown as { isTokenExpired: (token: string | null) => boolean }
      ).isTokenExpired(expiredToken);
      expect(result).toBe(true);
    });

    it('should return false when token is valid and not expired', () => {
      const futureTime = Math.floor(Date.now() / 1000) + 3600;
      const validToken = `header.${btoa(JSON.stringify({ exp: futureTime }))}.signature`;

      const result = (
        service as unknown as { isTokenExpired: (token: string | null) => boolean }
      ).isTokenExpired(validToken);
      expect(result).toBe(false);
    });
  });

  describe('refreshTokenSync', () => {
    it('should successfully refresh token and return true', async () => {
      const refreshResponse = {
        access_token: 'new-access-token',
        refresh_token: 'new-refresh-token',
        expires_in: 3600,
        token_type: 'Bearer' as const,
      };

      tokenStorageService.getRefreshToken.and.returnValue('refresh-token');
      authApiService.refresh$.and.returnValue(of(refreshResponse));

      const result = await service.refreshTokenSync();

      expect(result).toBe(true);
      expect(authApiService.refresh$).toHaveBeenCalledWith('refresh-token');
      expect(tokenStorageService.setTokens).toHaveBeenCalledWith(
        'new-access-token',
        'new-refresh-token',
      );
      expect(service.isAuthenticated()).toBe(true);
    });

    it('should logout and return false when refresh token is missing', async () => {
      tokenStorageService.getRefreshToken.and.returnValue(null);
      spyOn(service, 'logout');

      const result = await service.refreshTokenSync();

      expect(result).toBe(false);
      expect(service.logout).toHaveBeenCalled();
      expect(authApiService.refresh$).not.toHaveBeenCalled();
    });

    it('should logout and return false when refresh fails', async () => {
      tokenStorageService.getRefreshToken.and.returnValue('refresh-token');
      authApiService.refresh$.and.returnValue(throwError(() => new Error('Refresh failed')));
      spyOn(service, 'logout');

      const result = await service.refreshTokenSync();

      expect(result).toBe(false);
      expect(service.logout).toHaveBeenCalled();
      expect(authApiService.refresh$).toHaveBeenCalledWith('refresh-token');
    });
  });

  describe('refreshTokensInBackground', () => {
    it('should not call refreshTokenSync if already refreshing', () => {
      service.isRefreshingTokens.set(true);
      spyOn(service, 'refreshTokenSync');

      (service as unknown as { refreshTokensInBackground: () => void }).refreshTokensInBackground();

      expect(service.refreshTokenSync).not.toHaveBeenCalled();
    });

    it('should call refreshTokenSync if not refreshing', () => {
      service.isRefreshingTokens.set(false);
      spyOn(service, 'refreshTokenSync').and.returnValue(Promise.resolve(true));

      (service as unknown as { refreshTokensInBackground: () => void }).refreshTokensInBackground();

      expect(service.refreshTokenSync).toHaveBeenCalled();
    });

    it('should handle errors silently', () => {
      service.isRefreshingTokens.set(false);
      spyOn(service, 'refreshTokenSync').and.returnValue(Promise.reject(new Error('Test error')));

      expect(() =>
        (
          service as unknown as { refreshTokensInBackground: () => void }
        ).refreshTokensInBackground(),
      ).not.toThrow();
    });
  });

  describe('isAuthenticatedAndValid', () => {
    it('should return false when both tokens are missing', async () => {
      tokenStorageService.getAccessToken.and.returnValue(null);
      tokenStorageService.getRefreshToken.and.returnValue(null);

      const result = await service.isAuthenticatedAndValid();

      expect(result).toBe(false);
    });

    it('should return true when only access token exists and is valid', async () => {
      const futureTime = Math.floor(Date.now() / 1000) + 3600;
      const validToken = `header.${btoa(JSON.stringify({ exp: futureTime }))}.signature`;

      tokenStorageService.getAccessToken.and.returnValue(validToken);
      tokenStorageService.getRefreshToken.and.returnValue(null);
      spyOn(
        service as unknown as { refreshTokensInBackground: () => void },
        'refreshTokensInBackground',
      );

      const result = await service.isAuthenticatedAndValid();

      expect(result).toBe(true);
      expect(
        (service as unknown as { refreshTokensInBackground: () => void }).refreshTokensInBackground,
      ).not.toHaveBeenCalled();
    });

    it('should return true when only refresh token exists and is valid', async () => {
      const futureTime = Math.floor(Date.now() / 1000) + 3600;
      const validRefreshToken = `header.${btoa(JSON.stringify({ exp: futureTime }))}.signature`;
      const refreshResponse = {
        access_token: 'new-access-token',
        refresh_token: 'new-refresh-token',
        expires_in: 3600,
        token_type: 'Bearer' as const,
      };

      tokenStorageService.getAccessToken.and.returnValue(null);
      tokenStorageService.getRefreshToken.and.returnValue(validRefreshToken);
      authApiService.refresh$.and.returnValue(of(refreshResponse));
      spyOn(
        service as unknown as { refreshTokensInBackground: () => void },
        'refreshTokensInBackground',
      );

      const result = await service.isAuthenticatedAndValid();

      expect(result).toBe(true);
      expect(
        (service as unknown as { refreshTokensInBackground: () => void }).refreshTokensInBackground,
      ).toHaveBeenCalled();
    });

    it('should return true when both tokens exist and access token is valid', async () => {
      const futureTime = Math.floor(Date.now() / 1000) + 3600;
      const validToken = `header.${btoa(JSON.stringify({ exp: futureTime }))}.signature`;

      tokenStorageService.getAccessToken.and.returnValue(validToken);
      tokenStorageService.getRefreshToken.and.returnValue('refresh-token');
      spyOn(
        service as unknown as { refreshTokensInBackground: () => void },
        'refreshTokensInBackground',
      );

      const result = await service.isAuthenticatedAndValid();

      expect(result).toBe(true);
      expect(
        (service as unknown as { refreshTokensInBackground: () => void }).refreshTokensInBackground,
      ).not.toHaveBeenCalled();
    });

    it('should refresh token when access token is expired but refresh token is valid', async () => {
      const expiredTime = Math.floor(Date.now() / 1000) - 3600;
      const expiredAccessToken = `header.${btoa(JSON.stringify({ exp: expiredTime }))}.signature`;
      const futureTime = Math.floor(Date.now() / 1000) + 3600;
      const validRefreshToken = `header.${btoa(JSON.stringify({ exp: futureTime }))}.signature`;
      const refreshResponse = {
        access_token: 'new-access-token',
        refresh_token: 'new-refresh-token',
        expires_in: 3600,
        token_type: 'Bearer' as const,
      };

      tokenStorageService.getAccessToken.and.returnValue(expiredAccessToken);
      tokenStorageService.getRefreshToken.and.returnValue(validRefreshToken);
      authApiService.refresh$.and.returnValue(of(refreshResponse));
      spyOn(
        service as unknown as { refreshTokensInBackground: () => void },
        'refreshTokensInBackground',
      );

      const result = await service.isAuthenticatedAndValid();

      expect(result).toBe(true);
      expect(
        (service as unknown as { refreshTokensInBackground: () => void }).refreshTokensInBackground,
      ).toHaveBeenCalled();
    });

    it('should logout and return false when both tokens are expired', async () => {
      const expiredTime = Math.floor(Date.now() / 1000) - 3600;
      const expiredAccessToken = `header.${btoa(JSON.stringify({ exp: expiredTime }))}.signature`;
      const expiredRefreshToken = `header.${btoa(JSON.stringify({ exp: expiredTime }))}.signature`;

      tokenStorageService.getAccessToken.and.returnValue(expiredAccessToken);
      tokenStorageService.getRefreshToken.and.returnValue(expiredRefreshToken);
      spyOn(service, 'logout');

      const result = await service.isAuthenticatedAndValid();

      expect(result).toBe(false);
      expect(service.logout).toHaveBeenCalled();
      expect(authApiService.refresh$).not.toHaveBeenCalled();
    });

    it('should return true when refresh token is valid even if refresh fails in background', async () => {
      const expiredTime = Math.floor(Date.now() / 1000) - 3600;
      const expiredAccessToken = `header.${btoa(JSON.stringify({ exp: expiredTime }))}.signature`;
      const futureTime = Math.floor(Date.now() / 1000) + 3600;
      const validRefreshToken = `header.${btoa(JSON.stringify({ exp: futureTime }))}.signature`;

      tokenStorageService.getAccessToken.and.returnValue(expiredAccessToken);
      tokenStorageService.getRefreshToken.and.returnValue(validRefreshToken);
      authApiService.refresh$.and.returnValue(throwError(() => new Error('Refresh failed')));
      spyOn(
        service as unknown as { refreshTokensInBackground: () => void },
        'refreshTokensInBackground',
      );

      const result = await service.isAuthenticatedAndValid();

      expect(result).toBe(true);
      expect(
        (service as unknown as { refreshTokensInBackground: () => void }).refreshTokensInBackground,
      ).toHaveBeenCalled();
    });
  });
});
