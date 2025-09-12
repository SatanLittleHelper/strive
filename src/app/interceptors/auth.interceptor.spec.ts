import { HttpClient } from '@angular/common/http';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { env } from '@/environments/env';
import { AuthApiService } from '@/features/auth';
import type { RefreshResponse } from '@/features/auth';
import { TokenStorageService } from '@/shared/services/auth/token-storage.service';

describe('authInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;
  let authApiService: jasmine.SpyObj<AuthApiService>;
  let tokenStorageService: jasmine.SpyObj<TokenStorageService>;
  let router: jasmine.SpyObj<Router>;

  beforeEach(() => {
    const authApiSpy = jasmine.createSpyObj('AuthApiService', ['refresh$']);
    const tokenStorageSpy = jasmine.createSpyObj('TokenStorageService', [
      'getAccessToken',
      'getRefreshToken',
      'setTokens',
      'clearTokens',
    ]);
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        { provide: AuthApiService, useValue: authApiSpy },
        { provide: TokenStorageService, useValue: tokenStorageSpy },
        { provide: Router, useValue: routerSpy },
      ],
    });

    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
    authApiService = TestBed.inject(AuthApiService) as jasmine.SpyObj<AuthApiService>;
    tokenStorageService = TestBed.inject(
      TokenStorageService,
    ) as jasmine.SpyObj<TokenStorageService>;
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;
  });

  afterEach(() => {
    if (httpMock) {
      httpMock.verify();
    }
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

  it('should handle 401 error and refresh token successfully', () => {
    tokenStorageService.getAccessToken.and.returnValue('expired-token');
    tokenStorageService.getRefreshToken.and.returnValue('refresh-token');

    const refreshResponse: RefreshResponse = {
      access_token: 'new-access-token',
      expires_in: 3600,
      token_type: 'Bearer',
    };

    authApiService.refresh$.and.returnValue(of(refreshResponse));

    http.get('/api/protected').subscribe();

    const firstReq = httpMock.expectOne('/api/protected');
    firstReq.flush(null, { status: 401, statusText: 'Unauthorized' });

    const refreshReq = httpMock.expectOne(`${env.apiHost}/v1/auth/refresh`);
    expect(refreshReq.request.body).toEqual({ refresh_token: 'refresh-token' });
    refreshReq.flush(refreshResponse);

    const retryReq = httpMock.expectOne('/api/protected');
    expect(retryReq.request.headers.get('Authorization')).toBe('Bearer new-access-token');
    retryReq.flush({ data: 'success' });

    expect(tokenStorageService.setTokens).toHaveBeenCalledWith('new-access-token', 'refresh-token');
  });

  it('should handle refresh token failure and logout', () => {
    tokenStorageService.getAccessToken.and.returnValue('expired-token');
    tokenStorageService.getRefreshToken.and.returnValue('invalid-refresh-token');

    authApiService.refresh$.and.returnValue(throwError(() => new Error('Invalid refresh token')));

    http.get('/api/protected').subscribe({
      error: (error) => {
        expect(error.message).toBe('Invalid refresh token');
      },
    });

    const firstReq = httpMock.expectOne('/api/protected');
    firstReq.flush(null, { status: 401, statusText: 'Unauthorized' });

    const refreshReq = httpMock.expectOne(`${env.apiHost}/v1/auth/refresh`);
    refreshReq.flush(null, { status: 401, statusText: 'Unauthorized' });

    expect(tokenStorageService.clearTokens).toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('should handle 401 error without refresh token', () => {
    tokenStorageService.getAccessToken.and.returnValue('expired-token');
    tokenStorageService.getRefreshToken.and.returnValue(null);

    http.get('/api/protected').subscribe({
      error: (error) => {
        expect(error.message).toBe('No refresh token');
      },
    });

    const firstReq = httpMock.expectOne('/api/protected');
    firstReq.flush(null, { status: 401, statusText: 'Unauthorized' });

    expect(tokenStorageService.clearTokens).toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('should queue multiple requests during token refresh', () => {
    tokenStorageService.getAccessToken.and.returnValue('expired-token');
    tokenStorageService.getRefreshToken.and.returnValue('refresh-token');

    const refreshResponse: RefreshResponse = {
      access_token: 'new-access-token',
      expires_in: 3600,
      token_type: 'Bearer',
    };

    authApiService.refresh$.and.returnValue(of(refreshResponse));

    http.get('/api/protected1').subscribe();
    http.get('/api/protected2').subscribe();

    const firstReq = httpMock.expectOne('/api/protected1');
    firstReq.flush(null, { status: 401, statusText: 'Unauthorized' });

    httpMock.expectNone('/api/protected2');

    const refreshReq = httpMock.expectOne(`${env.apiHost}/v1/auth/refresh`);
    refreshReq.flush(refreshResponse);

    const retryReq1 = httpMock.expectOne('/api/protected1');
    const retryReq2 = httpMock.expectOne('/api/protected2');

    expect(retryReq1.request.headers.get('Authorization')).toBe('Bearer new-access-token');
    expect(retryReq2.request.headers.get('Authorization')).toBe('Bearer new-access-token');

    retryReq1.flush({ data: 'success1' });
    retryReq2.flush({ data: 'success2' });
  });

  it('should not intercept auth endpoints', () => {
    tokenStorageService.getAccessToken.and.returnValue('access-token');

    http.post(`${env.apiHost}/v1/auth/login`, {}).subscribe();

    const req = httpMock.expectOne(`${env.apiHost}/v1/auth/login`);
    expect(req.request.headers.get('Authorization')).toBeNull();
  });
});
