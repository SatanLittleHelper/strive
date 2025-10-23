import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import type { LoginRequest, RegisterRequest, LoginResponse } from '@/features/auth';
import { EmailPasswordProvider } from '@/features/auth/services/email-password-provider.service';
import { UserStoreService } from '@/shared';
import type { ApiError } from '@/shared/lib/types';
import { configureZonelessTestingModule } from '@/test-setup';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let emailPasswordProvider: jasmine.SpyObj<EmailPasswordProvider>;
  let userStoreService: jasmine.SpyObj<UserStoreService>;
  let router: jasmine.SpyObj<Router>;

  beforeEach(() => {
    const emailPasswordProviderSpy = jasmine.createSpyObj(
      'EmailPasswordProvider',
      ['login$', 'register$', 'refresh$', 'logout$'],
      {
        name: 'email-password',
      },
    );
    const userStoreSpy = jasmine.createSpyObj('UserStoreService', ['clearUser', 'fetchUser$'], {
      user: jasmine.createSpy().and.returnValue(null),
    });
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    configureZonelessTestingModule({
      providers: [
        AuthService,
        { provide: EmailPasswordProvider, useValue: emailPasswordProviderSpy },
        { provide: UserStoreService, useValue: userStoreSpy },
        { provide: Router, useValue: routerSpy },
      ],
    });

    service = TestBed.inject(AuthService);
    emailPasswordProvider = TestBed.inject(
      EmailPasswordProvider,
    ) as jasmine.SpyObj<EmailPasswordProvider>;
    userStoreService = TestBed.inject(UserStoreService) as jasmine.SpyObj<UserStoreService>;
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;

    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('login$', () => {
    it('should login successfully and set user data', () => {
      const loginRequest: LoginRequest = { email: 'test@test.com', password: 'password' };
      const loginResponse: LoginResponse = {
        access_token:
          'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ0ZXN0IiwiZXhwIjo5OTk5OTk5OTk5LCJpYXQiOjE1MTYyMzkwMjJ9.test',
        expires_in: 900,
        token_type: 'Bearer',
        message: 'Login successful',
      };
      emailPasswordProvider.login$.and.returnValue(of(loginResponse));
      userStoreService.fetchUser$.and.returnValue(of(void 0));

      service.login$(loginRequest).subscribe();

      expect(emailPasswordProvider.login$).toHaveBeenCalledWith(loginRequest);
      expect(userStoreService.fetchUser$).toHaveBeenCalled();
    });

    it('should handle login error', () => {
      const loginRequest: LoginRequest = { email: 'test@test.com', password: 'password' };
      const error: ApiError = { code: 'INVALID_CREDENTIALS', message: 'Invalid credentials' };

      emailPasswordProvider.login$.and.returnValue(throwError(() => error));

      service.login$(loginRequest).subscribe();

      expect(service.error()).toBe('Invalid credentials');
    });
  });

  describe('register$', () => {
    it('should register successfully', () => {
      const registerRequest: RegisterRequest = { email: 'test@test.com', password: 'password' };

      emailPasswordProvider.register$.and.returnValue(of(undefined));

      service.register$(registerRequest).subscribe();

      expect(emailPasswordProvider.register$).toHaveBeenCalledWith(registerRequest);
      expect(router.navigate).toHaveBeenCalledWith(['/login']);
    });

    it('should handle register error', () => {
      const registerRequest: RegisterRequest = { email: 'test@test.com', password: 'password' };
      const error: ApiError = { code: 'EMAIL_EXISTS', message: 'Email already exists' };

      emailPasswordProvider.register$.and.returnValue(throwError(() => error));

      service.register$(registerRequest).subscribe();

      expect(service.error()).toBe('Email already exists');
    });
  });

  describe('logout', () => {
    it('should logout successfully and clear user data', () => {
      emailPasswordProvider.logout$.and.returnValue(of(undefined));

      service.logout();

      expect(emailPasswordProvider.logout$).toHaveBeenCalled();
      expect(userStoreService.clearUser).toHaveBeenCalled();
    });
  });

  describe('isAuthenticated', () => {
    it('should return true when access token exists', () => {
      service.setAccessToken('valid-token');

      const result = service.isAuthenticated();

      expect(result).toBe(true);
    });

    it('should return true when cached auth is valid', () => {
      const authState = {
        timestamp: Date.now(),
        expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
        isAuth: true,
      };
      localStorage.setItem('auth_status_cache', JSON.stringify(authState));

      const result = service.isAuthenticated();

      expect(result).toBe(true);
    });

    it('should return false when no access token and no valid cache', () => {
      const result = service.isAuthenticated();

      expect(result).toBe(false);
    });

    it('should return false when no token', () => {
      const result = service.isAuthenticated();

      expect(result).toBe(false);
    });
  });

  describe('getAccessToken', () => {
    it('should return token when valid', () => {
      const token =
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ0ZXN0IiwiZXhwIjo5OTk5OTk5OTk5LCJpYXQiOjE1MTYyMzkwMjJ9.test';
      service.setAccessToken(token);

      const result = service.getAccessToken();

      expect(result).toBe(token);
    });

    it('should return null when token is expired', () => {
      service.setAccessToken(
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ0ZXN0IiwiZXhwIjoxLCJpYXQiOjE1MTYyMzkwMjJ9.test',
      );

      service.getTokenInfo();
      const result = service.getAccessToken();

      expect(result).toBe(null);
    });
  });

  describe('caching functionality', () => {
    it('should cache auth status on successful login', () => {
      const loginRequest: LoginRequest = { email: 'test@test.com', password: 'password' };
      const loginResponse: LoginResponse = {
        access_token:
          'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ0ZXN0IiwiZXhwIjo5OTk5OTk5OTk5LCJpYXQiOjE1MTYyMzkwMjJ9.test',
        expires_in: 900,
        token_type: 'Bearer',
        message: 'Login successful',
      };
      emailPasswordProvider.login$.and.returnValue(of(loginResponse));
      userStoreService.fetchUser$.and.returnValue(of(void 0));

      service.login$(loginRequest).subscribe();

      const cachedState = localStorage.getItem('auth_status_cache');
      expect(cachedState).toBeTruthy();
      const parsedState = JSON.parse(cachedState!);
      expect(parsedState.isAuth).toBe(true);
    });

    it('should cache auth status on successful refresh', () => {
      const refreshResponse: LoginResponse = {
        access_token:
          'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ0ZXN0IiwiZXhwIjo5OTk5OTk5OTk5LCJpYXQiOjE1MTYyMzkwMjJ9.test',
        expires_in: 900,
        token_type: 'Bearer',
        message: 'Refresh successful',
      };
      emailPasswordProvider.refresh$.and.returnValue(of(refreshResponse));
      userStoreService.fetchUser$.and.returnValue(of(void 0));

      service.refreshToken$().subscribe();

      const cachedState = localStorage.getItem('auth_status_cache');
      expect(cachedState).toBeTruthy();
      const parsedState = JSON.parse(cachedState!);
      expect(parsedState.isAuth).toBe(true);
    });

    it('should clear cache on logout', () => {
      localStorage.setItem(
        'auth_status_cache',
        JSON.stringify({
          timestamp: Date.now(),
          expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
          isAuth: true,
        }),
      );
      emailPasswordProvider.logout$.and.returnValue(of(undefined));

      service.logout();

      const cachedState = localStorage.getItem('auth_status_cache');
      expect(cachedState).toBeNull();
    });
  });
});
