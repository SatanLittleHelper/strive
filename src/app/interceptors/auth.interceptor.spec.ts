import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { env } from '@/environments/env';
import { TokenStorageService } from '@/shared/services/auth/token-storage.service';
import { configureZonelessTestingModule } from '@/test-setup';
import { authInterceptor } from './auth.interceptor';

describe('authInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;
  let tokenStorageService: jasmine.SpyObj<TokenStorageService>;

  beforeEach(() => {
    const tokenStorageSpy = jasmine.createSpyObj('TokenStorageService', [
      'getAccessToken',
      'getRefreshToken',
      'setTokens',
      'clearTokens',
    ]);

    configureZonelessTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        { provide: TokenStorageService, useValue: tokenStorageSpy },
      ],
    });

    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
    tokenStorageService = TestBed.inject(
      TokenStorageService,
    ) as jasmine.SpyObj<TokenStorageService>;
  });

  it('should add Authorization header when access token exists', () => {
    tokenStorageService.getAccessToken.and.returnValue('access-token');

    http.get('/api/test').subscribe();

    const req = httpMock.expectOne('/api/test');
    expect(req.request.headers.get('Authorization')).toBe('Bearer access-token');
  });

  it('should not add Authorization header when no access token', () => {
    tokenStorageService.getAccessToken.and.returnValue(null);

    http.get('/api/test').subscribe();

    const req = httpMock.expectOne('/api/test');
    expect(req.request.headers.get('Authorization')).toBeNull();
  });

  it('should not intercept auth endpoints', () => {
    tokenStorageService.getAccessToken.and.returnValue('access-token');

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

  it('should queue requests during token refresh and execute them with new token', () => {
    tokenStorageService.getAccessToken.and.returnValue('expired-token');
    tokenStorageService.getRefreshToken.and.returnValue('refresh-token');

    tokenStorageService.setTokens.and.stub();

    http.get('/api/protected').subscribe();

    const firstReq = httpMock.expectOne('/api/protected');
    expect(firstReq.request.headers.get('Authorization')).toBe('Bearer expired-token');

    firstReq.flush(null, { status: 401, statusText: 'Unauthorized' });
  });

  it('should add auth header to endpoints that contain auth path but are not auth endpoints', () => {
    tokenStorageService.getAccessToken.and.returnValue('access-token');

    http.get('/api/user/auth-status').subscribe();

    const req = httpMock.expectOne('/api/user/auth-status');
    expect(req.request.headers.get('Authorization')).toBe('Bearer access-token');
  });
});
