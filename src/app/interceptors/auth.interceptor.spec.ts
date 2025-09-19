import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { env } from '@/environments/env';
import { AuthApiService } from '@/features/auth';
import { configureZonelessTestingModule } from '@/test-setup';
import { authInterceptor } from './auth.interceptor';

describe('authInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;
  let authApiService: jasmine.SpyObj<AuthApiService>;

  beforeEach(() => {
    const authApiSpy = jasmine.createSpyObj('AuthApiService', ['refresh$']);

    configureZonelessTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        { provide: AuthApiService, useValue: authApiSpy },
      ],
    });

    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
    authApiService = TestBed.inject(AuthApiService) as jasmine.SpyObj<AuthApiService>;
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

  it('should handle 401 errors by attempting refresh', () => {
    authApiService.refresh$.and.returnValue(
      of({
        expires_in: 900,
        token_type: 'Bearer',
        message: 'Token refreshed',
      }),
    );

    http.get('/api/protected').subscribe();

    const req = httpMock.expectOne('/api/protected');
    req.flush(null, { status: 401, statusText: 'Unauthorized' });

    expect(authApiService.refresh$).toHaveBeenCalled();
  });
});
