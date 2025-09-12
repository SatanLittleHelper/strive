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

    const req = httpMock.expectOne(`${env.apiHost}/v1/auth/login`);
    expect(req.request.headers.get('Authorization')).toBeNull();
  });
});
