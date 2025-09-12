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
    const authApiSpy = jasmine.createSpyObj('AuthApiService', ['login$', 'register$']);
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
});
