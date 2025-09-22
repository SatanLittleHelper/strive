import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { env } from '@/environments/env';
import { AuthService } from '@/features/auth';
import { configureZonelessTestingModule } from '@/test-setup';
import { authInterceptor } from './auth.interceptor';

describe('authInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;
  let authService: jasmine.SpyObj<AuthService>;

  beforeEach(() => {
    const authServiceSpy = jasmine.createSpyObj('AuthService', [
      'getAccessToken',
      'setAccessToken',
      'refreshToken$',
    ]);

    configureZonelessTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: authServiceSpy },
      ],
    });

    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
  });

  it('should not intercept auth endpoints', () => {
    http.post(`${env.apiHost}/v1/auth/login`, {}).subscribe();
    http.post(`${env.apiHost}/v1/auth/register`, {}).subscribe();
    http.post(`${env.apiHost}/v1/auth/refresh`, {}).subscribe();

    const loginReq = httpMock.expectOne(`${env.apiHost}/v1/auth/login`);
    const registerReq = httpMock.expectOne(`${env.apiHost}/v1/auth/register`);
    const refreshReq = httpMock.expectOne(`${env.apiHost}/v1/auth/refresh`);

    expect(loginReq.request.headers.get('Authorization')).toBeNull();
    expect(registerReq.request.headers.get('Authorization')).toBeNull();
    expect(refreshReq.request.headers.get('Authorization')).toBeNull();
  });

  it('should handle 401 errors by attempting refresh', (done) => {
    authService.getAccessToken.and.returnValue('test-token');
    authService.refreshToken$.and.returnValue(of(true));

    http.get('/api/protected').subscribe({
      next: () => {
        expect(authService.refreshToken$).toHaveBeenCalled();
        done();
      },
      error: () => {
        // Expected error
        done();
      },
    });

    const req = httpMock.expectOne('/api/protected');
    expect(req.request.headers.get('Authorization')).toBe('Bearer test-token');
    req.flush(null, { status: 401, statusText: 'Unauthorized' });
  });
});
