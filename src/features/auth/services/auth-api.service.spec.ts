import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { env } from '@/environments/env';
import { AuthApiService } from '@/features/auth';
import type {
  LoginRequest,
  RegisterRequest,
  LoginResponse,
  RefreshResponse,
} from '@/features/auth';
import { configureZonelessTestingModule } from '@/test-setup';

describe('AuthApiService', () => {
  let service: AuthApiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    configureZonelessTestingModule();

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [AuthApiService],
    });
    service = TestBed.inject(AuthApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('login$', () => {
    it('should send POST request to login endpoint', () => {
      const loginRequest: LoginRequest = {
        email: 'test@example.com',
        password: 'password123',
      };

      const expectedResponse: LoginResponse = {
        access_token: 'test-access-token',
        expires_in: 3600,
        token_type: 'Bearer',
        message: 'Login successful',
      };

      service.login$(loginRequest).subscribe((response) => {
        expect(response).toEqual(expectedResponse);
      });

      const req = httpMock.expectOne(`${env.apiHost}/v1/auth/login`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(loginRequest);
      req.flush(expectedResponse);
    });
  });

  describe('register$', () => {
    it('should send POST request to register endpoint', () => {
      const registerRequest: RegisterRequest = {
        email: 'test@example.com',
        password: 'password123',
      };

      service.register$(registerRequest).subscribe((response) => {
        expect(response).toBeNull();
      });

      const req = httpMock.expectOne(`${env.apiHost}/v1/auth/register`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(registerRequest);
      req.flush(null);
    });
  });

  describe('refresh$', () => {
    it('should send POST request to refresh endpoint', () => {
      const expectedResponse: RefreshResponse = {
        access_token: 'new-access-token',
        expires_in: 3600,
        token_type: 'Bearer',
        message: 'Token refreshed',
      };

      service.refresh$().subscribe((response) => {
        expect(response).toEqual(expectedResponse);
      });

      const req = httpMock.expectOne(`${env.apiHost}/v1/auth/refresh`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({});
      req.flush(expectedResponse);
    });
  });

  describe('error handling', () => {
    it('should handle login error', () => {
      const loginRequest: LoginRequest = {
        email: 'test@example.com',
        password: 'wrongpassword',
      };

      service.login$(loginRequest).subscribe({
        error: (error) => {
          expect(error).toBeDefined();
          expect(typeof error.code).toBe('string');
          expect(typeof error.message).toBe('string');
        },
      });

      const req = httpMock.expectOne(`${env.apiHost}/v1/auth/login`);
      req.flush(
        { error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' } },
        { status: 401, statusText: 'Unauthorized' },
      );
    });

    it('should handle register error', () => {
      const registerRequest: RegisterRequest = {
        email: 'invalid-email',
        password: 'password123',
      };

      service.register$(registerRequest).subscribe({
        error: (error) => {
          expect(error).toBeDefined();
          expect(typeof error.code).toBe('string');
          expect(typeof error.message).toBe('string');
        },
      });

      const req = httpMock.expectOne(`${env.apiHost}/v1/auth/register`);
      req.flush(
        { error: { code: 'VALIDATION_ERROR', message: 'Invalid email format' } },
        { status: 400, statusText: 'Bad Request' },
      );
    });

    it('should handle refresh error', () => {
      service.refresh$().subscribe({
        error: (error) => {
          expect(error).toBeDefined();
          expect(typeof error.code).toBe('string');
          expect(typeof error.message).toBe('string');
        },
      });

      const req = httpMock.expectOne(`${env.apiHost}/v1/auth/refresh`);
      req.flush(
        { error: { code: 'INVALID_REFRESH_TOKEN', message: 'Refresh token is invalid' } },
        { status: 401, statusText: 'Unauthorized' },
      );
    });
  });
});
