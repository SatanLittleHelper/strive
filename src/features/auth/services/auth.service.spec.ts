import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { AuthApiService } from '@/features/auth';
import type { LoginRequest, RegisterRequest, LoginResponse } from '@/features/auth';
import type { ApiError } from '@/shared/lib/types';
import { configureZonelessTestingModule } from '@/test-setup';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let authApiService: jasmine.SpyObj<AuthApiService>;
  let router: jasmine.SpyObj<Router>;

  beforeEach(() => {
    const authApiSpy = jasmine.createSpyObj('AuthApiService', [
      'login$',
      'register$',
      'refresh$',
      'logout$',
      'checkAuth$',
    ]);
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    configureZonelessTestingModule({
      providers: [
        AuthService,
        { provide: AuthApiService, useValue: authApiSpy },
        { provide: Router, useValue: routerSpy },
      ],
    });

    service = TestBed.inject(AuthService);
    authApiService = TestBed.inject(AuthApiService) as jasmine.SpyObj<AuthApiService>;
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('login$', () => {
    it('should login successfully with HttpOnly cookies', () => {
      const loginRequest: LoginRequest = { email: 'test@test.com', password: 'password' };
      const loginResponse: LoginResponse = {
        expires_in: 900,
        token_type: 'Bearer',
        message: 'Login successful',
      };

      authApiService.login$.and.returnValue(of(loginResponse));

      service.login$(loginRequest).subscribe();

      expect(authApiService.login$).toHaveBeenCalledWith(loginRequest);
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
    it('should logout successfully', () => {
      authApiService.logout$.and.returnValue(of(undefined));

      service.logout();

      expect(authApiService.logout$).toHaveBeenCalled();
    });
  });

  describe('isAuthenticatedAndValid', () => {
    it('should return true when authenticated', async () => {
      authApiService.checkAuth$.and.returnValue(of(undefined));

      const result = await service.isAuthenticatedAndValid();

      expect(result).toBe(true);
      expect(service.isAuthenticated()).toBe(true);
    });

    it('should return false when not authenticated', async () => {
      const error: ApiError = { code: 'UNAUTHORIZED', message: 'Unauthorized' };
      authApiService.checkAuth$.and.returnValue(throwError(() => error));

      const result = await service.isAuthenticatedAndValid();

      expect(result).toBe(false);
      expect(service.isAuthenticated()).toBe(false);
    });
  });
});
