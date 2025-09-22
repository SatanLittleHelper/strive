import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { AuthService } from '@/features/auth';
import { configureZonelessTestingModule } from '@/test-setup';
import { authGuard } from './auth.guard';
import type { Route, UrlSegment } from '@angular/router';

describe('authGuard', () => {
  let authService: jasmine.SpyObj<AuthService>;
  let router: jasmine.SpyObj<Router>;

  beforeEach(() => {
    const authServiceSpy = jasmine.createSpyObj('AuthService', [
      'isAuthenticated',
      'refreshToken$',
    ]);
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
    authService.isAuthenticated.and.returnValue(true);

    const result = await TestBed.runInInjectionContext(() =>
      authGuard({} as Route, [] as UrlSegment[]),
    );

    expect(result).toBe(true);
    expect(authService.isAuthenticated).toHaveBeenCalled();
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('should redirect to login when user is not authenticated and refresh fails', async () => {
    authService.isAuthenticated.and.returnValue(false);
    authService.refreshToken$.and.returnValue(of(false));

    const result = await TestBed.runInInjectionContext(() =>
      authGuard({} as Route, [] as UrlSegment[]),
    );

    expect(result).toBe(false);
    expect(authService.isAuthenticated).toHaveBeenCalled();
    expect(authService.refreshToken$).toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('should allow access when refresh is successful', async () => {
    authService.isAuthenticated.and.returnValue(false);
    authService.refreshToken$.and.returnValue(of(true));

    const result = await TestBed.runInInjectionContext(() =>
      authGuard({} as Route, [] as UrlSegment[]),
    );

    expect(result).toBe(true);
    expect(authService.isAuthenticated).toHaveBeenCalled();
    expect(authService.refreshToken$).toHaveBeenCalled();
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('should save return URL when redirecting to login', async () => {
    authService.isAuthenticated.and.returnValue(false);
    authService.refreshToken$.and.returnValue(of(false));

    Object.defineProperty(TestBed.inject(Router), 'url', {
      get: () => '/protected-page',
      configurable: true,
    });

    await TestBed.runInInjectionContext(() => authGuard({} as Route, [] as UrlSegment[]));

    expect(sessionStorage.getItem('return_url')).toBe('/protected-page');
    expect(router.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('should not save return URL when already on login page', async () => {
    authService.isAuthenticated.and.returnValue(false);
    authService.refreshToken$.and.returnValue(of(false));

    Object.defineProperty(TestBed.inject(Router), 'url', {
      get: () => '/login',
      configurable: true,
    });

    await TestBed.runInInjectionContext(() => authGuard({} as Route, [] as UrlSegment[]));

    expect(sessionStorage.getItem('return_url')).toBeNull();
  });

  it('should not save return URL when already on register page', async () => {
    authService.isAuthenticated.and.returnValue(false);
    authService.refreshToken$.and.returnValue(of(false));

    Object.defineProperty(TestBed.inject(Router), 'url', {
      get: () => '/register',
      configurable: true,
    });

    await TestBed.runInInjectionContext(() => authGuard({} as Route, [] as UrlSegment[]));

    expect(sessionStorage.getItem('return_url')).toBeNull();
  });
});
