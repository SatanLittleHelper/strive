import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { AuthApiService } from '@/features/auth';
import type { LoginRequest, RegisterRequest, LoginResponse } from '@/features/auth';
import { UserStoreService } from '@/shared';
import type { ApiError } from '@/shared/lib/types';
import { configureZonelessTestingModule } from '@/test-setup';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let authApiService: jasmine.SpyObj<AuthApiService>;
  let userStoreService: jasmine.SpyObj<UserStoreService>;
  let router: jasmine.SpyObj<Router>;

  beforeEach(() => {
    const authApiSpy = jasmine.createSpyObj('AuthApiService', [
      'login$',
      'register$',
      'refresh$',
      'logout$',
      'checkAuth$',
    ]);
    const userStoreSpy = jasmine.createSpyObj('UserStoreService', ['clearUser', 'fetchUser$'], {
      user: jasmine.createSpy().and.returnValue(null),
    });
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    configureZonelessTestingModule({
      providers: [
        AuthService,
        { provide: AuthApiService, useValue: authApiSpy },
        { provide: UserStoreService, useValue: userStoreSpy },
        { provide: Router, useValue: routerSpy },
      ],
    });

    service = TestBed.inject(AuthService);
    authApiService = TestBed.inject(AuthApiService) as jasmine.SpyObj<AuthApiService>;
    userStoreService = TestBed.inject(UserStoreService) as jasmine.SpyObj<UserStoreService>;
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;
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
      authApiService.login$.and.returnValue(of(loginResponse));
      userStoreService.fetchUser$.and.returnValue(of(void 0));

      service.login$(loginRequest).subscribe();

      expect(authApiService.login$).toHaveBeenCalledWith(loginRequest);
      expect(userStoreService.fetchUser$).toHaveBeenCalled();
      expect(service.isAuthenticated()).toBe(true);
    });

    it('should handle login error', () => {
      const loginRequest: LoginRequest = { email: 'test@test.com', password: 'password' };
      const error: ApiError = { code: 'INVALID_CREDENTIALS', message: 'Invalid credentials' };

      authApiService.login$.and.returnValue(throwError(() => error));

      service.login$(loginRequest).subscribe();

      expect(service.error()).toBe('Invalid credentials');
    });
  });

  describe('register$', () => {
    it('should register successfully', () => {
      const registerRequest: RegisterRequest = { email: 'test@test.com', password: 'password' };

      authApiService.register$.and.returnValue(of(undefined));

      service.register$(registerRequest).subscribe();

      expect(authApiService.register$).toHaveBeenCalledWith(registerRequest);
      expect(router.navigate).toHaveBeenCalledWith(['/login']);
    });

    it('should handle register error', () => {
      const registerRequest: RegisterRequest = { email: 'test@test.com', password: 'password' };
      const error: ApiError = { code: 'EMAIL_EXISTS', message: 'Email already exists' };

      authApiService.register$.and.returnValue(throwError(() => error));

      service.register$(registerRequest).subscribe();

      expect(service.error()).toBe('Email already exists');
    });
  });

  describe('logout', () => {
    it('should logout successfully and clear user data', () => {
      authApiService.logout$.and.returnValue(of(undefined));

      service.logout();

      expect(authApiService.logout$).toHaveBeenCalled();
      expect(userStoreService.clearUser).toHaveBeenCalled();
    });
  });

  describe('isAuthenticated', () => {
    it('should return true when token is valid', () => {
      service.setAccessToken(
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ0ZXN0IiwiZXhwIjo5OTk5OTk5OTk5LCJpYXQiOjE1MTYyMzkwMjJ9.test',
      );

      const result = service.isAuthenticated();

      expect(result).toBe(true);
    });

    it('should return false when token is expired', () => {
      service.setAccessToken(
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ0ZXN0IiwiZXhwIjoxLCJpYXQiOjE1MTYyMzkwMjJ9.test',
      );

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

      const result = service.getAccessToken();

      expect(result).toBe(null);
    });
  });
});
