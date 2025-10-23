import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { AuthApiService } from '@/features/auth';
import type { LoginRequest, RegisterRequest, LoginResponse } from '@/features/auth';
import { configureZonelessTestingModule } from '@/test-setup';
import { EmailPasswordProvider } from './email-password-provider.service';

describe('EmailPasswordProvider', () => {
  let service: EmailPasswordProvider;
  let authApiService: jasmine.SpyObj<AuthApiService>;

  beforeEach(() => {
    const authApiSpy = jasmine.createSpyObj('AuthApiService', [
      'login$',
      'register$',
      'refresh$',
      'logout$',
    ]);

    configureZonelessTestingModule({
      providers: [EmailPasswordProvider, { provide: AuthApiService, useValue: authApiSpy }],
    });

    service = TestBed.inject(EmailPasswordProvider);
    authApiService = TestBed.inject(AuthApiService) as jasmine.SpyObj<AuthApiService>;
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should have correct name', () => {
    expect(service.name).toBe('email-password');
  });

  describe('login$', () => {
    it('should call authApi login$ method', () => {
      const loginRequest: LoginRequest = { email: 'test@test.com', password: 'password' };
      const loginResponse: LoginResponse = {
        access_token: 'token',
        expires_in: 900,
        token_type: 'Bearer',
        message: 'Login successful',
      };

      authApiService.login$.and.returnValue(of(loginResponse));

      service.login$(loginRequest).subscribe();

      expect(authApiService.login$).toHaveBeenCalledWith(loginRequest);
    });

    it('should return login response', () => {
      const loginRequest: LoginRequest = { email: 'test@test.com', password: 'password' };
      const loginResponse: LoginResponse = {
        access_token: 'token',
        expires_in: 900,
        token_type: 'Bearer',
        message: 'Login successful',
      };

      authApiService.login$.and.returnValue(of(loginResponse));

      service.login$(loginRequest).subscribe((response) => {
        expect(response).toEqual(loginResponse);
      });
    });
  });

  describe('register$', () => {
    it('should call authApi register$ method', () => {
      const registerRequest: RegisterRequest = { email: 'test@test.com', password: 'password' };

      authApiService.register$.and.returnValue(of(undefined));

      service.register$(registerRequest).subscribe();

      expect(authApiService.register$).toHaveBeenCalledWith(registerRequest);
    });
  });

  describe('refresh$', () => {
    it('should call authApi refresh$ method', () => {
      const refreshResponse: LoginResponse = {
        access_token: 'new-token',
        expires_in: 900,
        token_type: 'Bearer',
        message: 'Refresh successful',
      };

      authApiService.refresh$.and.returnValue(of(refreshResponse));

      service.refresh$().subscribe();

      expect(authApiService.refresh$).toHaveBeenCalled();
    });

    it('should return refresh response', () => {
      const refreshResponse: LoginResponse = {
        access_token: 'new-token',
        expires_in: 900,
        token_type: 'Bearer',
        message: 'Refresh successful',
      };

      authApiService.refresh$.and.returnValue(of(refreshResponse));

      service.refresh$().subscribe((response) => {
        expect(response).toEqual(refreshResponse);
      });
    });
  });

  describe('logout$', () => {
    it('should call authApi logout$ method', () => {
      authApiService.logout$.and.returnValue(of(undefined));

      service.logout$().subscribe();

      expect(authApiService.logout$).toHaveBeenCalled();
    });
  });
});
