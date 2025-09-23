import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { env } from '@/environments/env';
import { AuthService } from '@/features/auth';
import { configureZonelessTestingModule } from '@/test-setup';
import { authInterceptor } from './auth.interceptor';
import { TokenRefreshManager } from './token-refresh-manager';

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

    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    configureZonelessTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Router, useValue: routerSpy },
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

  it('should not add authorization header when no token', () => {
    authService.getAccessToken.and.returnValue(null);

    http.get('/api/protected').subscribe();

    const req = httpMock.expectOne('/api/protected');
    expect(req.request.headers.get('Authorization')).toBeNull();
  });

  it('should handle non-401 errors without refresh', (done) => {
    authService.getAccessToken.and.returnValue('test-token');

    http.get('/api/protected').subscribe({
      next: () => done(),
      error: () => {
        expect(authService.refreshToken$).not.toHaveBeenCalled();
        done();
      },
    });

    const req = httpMock.expectOne('/api/protected');
    req.flush(null, { status: 500, statusText: 'Internal Server Error' });
  });

  it('should handle 401 error when refresh fails', () => {
    const router = TestBed.inject(Router) as jasmine.SpyObj<Router>;
    router.navigate.and.returnValue(Promise.resolve(true));

    authService.getAccessToken.and.returnValue('test-token');
    authService.refreshToken$.and.returnValue(of(false));

    http.get('/api/protected').subscribe({
      next: () => {},
      error: () => {
        expect(router.navigate).toHaveBeenCalledWith(['/login']);
      },
    });

    const req = httpMock.expectOne('/api/protected');
    req.flush(null, { status: 401, statusText: 'Unauthorized' });
  });

  it('should queue request when refresh is already in progress', () => {
    const refreshManager = TokenRefreshManager.getInstance();
    const addPendingRequestSpy = spyOn(refreshManager, 'addPendingRequest').and.callThrough();

    authService.getAccessToken.and.returnValue('test-token');
    authService.refreshToken$.and.returnValue(of(true));

    refreshManager.setRefreshInProgress(true);

    http.get('/api/queued').subscribe();

    const req = httpMock.expectOne('/api/queued');
    req.flush(null, { status: 401, statusText: 'Unauthorized' });

    expect(addPendingRequestSpy).toHaveBeenCalledWith(jasmine.any(Function));
  });
});
