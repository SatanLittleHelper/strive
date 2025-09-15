import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { configureZonelessTestingModule } from '@/test-setup';
import { authGuard } from './auth.guard';
import { AuthService } from '../services/auth.service';
import type { Route, UrlSegment } from '@angular/router';

describe('authGuard', () => {
  let authService: jasmine.SpyObj<AuthService>;
  let router: jasmine.SpyObj<Router>;

  beforeEach(() => {
    const authServiceSpy = jasmine.createSpyObj('AuthService', ['isAuthenticatedAndValid']);
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    configureZonelessTestingModule();

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Router, useValue: routerSpy },
      ],
    });

    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;

    sessionStorage.clear();
  });

  it('should allow access when user is authenticated and tokens are valid', async () => {
    authService.isAuthenticatedAndValid.and.returnValue(Promise.resolve(true));

    const result = await TestBed.runInInjectionContext(() =>
      authGuard({} as Route, [] as UrlSegment[]),
    );

    expect(result).toBe(true);
    expect(authService.isAuthenticatedAndValid).toHaveBeenCalled();
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('should redirect to login when user is not authenticated', async () => {
    authService.isAuthenticatedAndValid.and.returnValue(Promise.resolve(false));

    const result = await TestBed.runInInjectionContext(() =>
      authGuard({} as Route, [] as UrlSegment[]),
    );

    expect(result).toBe(false);
    expect(authService.isAuthenticatedAndValid).toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('should redirect to login when token validation fails', async () => {
    authService.isAuthenticatedAndValid.and.returnValue(Promise.resolve(false));

    const result = await TestBed.runInInjectionContext(() =>
      authGuard({} as Route, [] as UrlSegment[]),
    );

    expect(result).toBe(false);
    expect(authService.isAuthenticatedAndValid).toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('should save return URL when redirecting to login', async () => {
    authService.isAuthenticatedAndValid.and.returnValue(Promise.resolve(false));

    Object.defineProperty(TestBed.inject(Router), 'url', {
      get: () => '/protected-page',
      configurable: true,
    });

    await TestBed.runInInjectionContext(() => authGuard({} as Route, [] as UrlSegment[]));

    expect(sessionStorage.getItem('return_url')).toBe('/protected-page');
    expect(router.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('should not save return URL when already on login page', async () => {
    authService.isAuthenticatedAndValid.and.returnValue(Promise.resolve(false));

    Object.defineProperty(TestBed.inject(Router), 'url', {
      get: () => '/login',
      configurable: true,
    });

    await TestBed.runInInjectionContext(() => authGuard({} as Route, [] as UrlSegment[]));

    expect(sessionStorage.getItem('return_url')).toBeNull();
  });

  it('should not save return URL when already on register page', async () => {
    authService.isAuthenticatedAndValid.and.returnValue(Promise.resolve(false));

    Object.defineProperty(TestBed.inject(Router), 'url', {
      get: () => '/register',
      configurable: true,
    });

    await TestBed.runInInjectionContext(() => authGuard({} as Route, [] as UrlSegment[]));

    expect(sessionStorage.getItem('return_url')).toBeNull();
  });
});
