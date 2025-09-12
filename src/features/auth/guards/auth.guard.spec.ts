import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { configureZonelessTestingModule } from '@/test-setup';
import { authGuard } from './auth.guard';
import { AuthService } from '../services/auth.service';

describe('authGuard', () => {
  let authService: jasmine.SpyObj<AuthService>;
  let router: jasmine.SpyObj<Router>;

  beforeEach(() => {
    const authServiceSpy = jasmine.createSpyObj('AuthService', ['isAuthenticated']);
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

  it('should allow access when user is authenticated', () => {
    authService.isAuthenticated.and.returnValue(true);

    const result = TestBed.runInInjectionContext(() => authGuard({} as any, []));

    expect(result).toBe(true);
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('should redirect to login when user is not authenticated', () => {
    authService.isAuthenticated.and.returnValue(false);

    const result = TestBed.runInInjectionContext(() => authGuard({} as any, []));

    expect(result).toBe(false);
    expect(router.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('should save return URL when redirecting to login', () => {
    authService.isAuthenticated.and.returnValue(false);

    Object.defineProperty(TestBed.inject(Router), 'url', {
      get: () => '/protected-page',
      configurable: true,
    });

    TestBed.runInInjectionContext(() => authGuard({} as any, []));

    expect(sessionStorage.getItem('return_url')).toBe('/protected-page');
  });

  it('should not save return URL when already on login page', () => {
    authService.isAuthenticated.and.returnValue(false);

    Object.defineProperty(TestBed.inject(Router), 'url', {
      get: () => '/login',
      configurable: true,
    });

    TestBed.runInInjectionContext(() => authGuard({} as any, []));

    expect(sessionStorage.getItem('return_url')).toBeNull();
  });

  it('should not save return URL when already on register page', () => {
    authService.isAuthenticated.and.returnValue(false);

    Object.defineProperty(TestBed.inject(Router), 'url', {
      get: () => '/register',
      configurable: true,
    });

    TestBed.runInInjectionContext(() => authGuard({} as any, []));

    expect(sessionStorage.getItem('return_url')).toBeNull();
  });
});
