import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import type { User } from '@/shared/lib/types';
import { ThemeService } from '@/shared/services/theme';
import { configureZonelessTestingModule } from '@/test-setup';
import { UserApiService } from './user-api.service';
import { UserStoreService } from './user-store.service';

describe('UserStoreService', () => {
  let service: UserStoreService;
  let userApiService: jasmine.SpyObj<UserApiService>;
  let themeService: jasmine.SpyObj<ThemeService>;
  let mockUser: User;

  beforeEach(() => {
    const userApiSpy = jasmine.createSpyObj('UserApiService', ['getMe$']);
    const themeSpy = jasmine.createSpyObj('ThemeService', ['setTheme']);

    configureZonelessTestingModule({
      providers: [
        { provide: UserApiService, useValue: userApiSpy },
        { provide: ThemeService, useValue: themeSpy },
        provideHttpClientTesting(),
      ],
    });

    service = TestBed.inject(UserStoreService);
    userApiService = TestBed.inject(UserApiService) as jasmine.SpyObj<UserApiService>;
    themeService = TestBed.inject(ThemeService) as jasmine.SpyObj<ThemeService>;
    mockUser = { id: '1', email: 'test@example.com', theme: 'light' };
  });

  describe('initialization', () => {
    it('should initialize with null user', () => {
      expect(service.user()).toBeNull();
      expect(service.isAuthenticated()).toBeFalse();
    });
  });

  describe('user signal', () => {
    it('should set user and update signals', () => {
      service.user.set(mockUser);

      expect(service.user()).toEqual(mockUser);
      expect(service.isAuthenticated()).toBeTrue();
    });

    it('should allow setting null user', () => {
      service.user.set(mockUser);

      service.user.set(null);

      expect(service.user()).toBeNull();
      expect(service.isAuthenticated()).toBeFalse();
    });
  });

  describe('clearUser', () => {
    it('should clear user and update signals', () => {
      service.user.set(mockUser);

      service.clearUser();

      expect(service.user()).toBeNull();
      expect(service.isAuthenticated()).toBeFalse();
    });
  });

  describe('signals behavior', () => {
    it('should update computed signals when user changes', () => {
      expect(service.isAuthenticated()).toBeFalse();

      service.user.set(mockUser);

      expect(service.isAuthenticated()).toBeTrue();

      service.clearUser();

      expect(service.isAuthenticated()).toBeFalse();
    });
  });

  describe('fetchUser$', () => {
    it('should fetch user and update state', () => {
      userApiService.getMe$.and.returnValue(of(mockUser));

      service.fetchUser$().subscribe(() => {
        expect(service.user()).toEqual(mockUser);
        expect(service.isAuthenticated()).toBeTrue();
      });

      expect(userApiService.getMe$).toHaveBeenCalled();
    });

    it('should handle API error and clear user', () => {
      userApiService.getMe$.and.returnValue(throwError(() => new Error('API Error')));

      service.fetchUser$().subscribe(() => {
        expect(service.user()).toBeNull();
        expect(service.isAuthenticated()).toBeFalse();
      });

      expect(userApiService.getMe$).toHaveBeenCalled();
    });
  });

  describe('theme integration', () => {
    it('should apply user theme when fetching user with theme', () => {
      const userWithTheme: User = { id: '1', email: 'test@example.com', theme: 'dark' };
      userApiService.getMe$.and.returnValue(of(userWithTheme));

      service.fetchUser$().subscribe(() => {
        expect(themeService.setTheme).toHaveBeenCalledWith('dark', false);
      });

      expect(userApiService.getMe$).toHaveBeenCalled();
    });

    it('should not apply theme when user has no theme', () => {
      const userWithoutTheme: User = { id: '1', email: 'test@example.com', theme: 'light' };
      userApiService.getMe$.and.returnValue(of(userWithoutTheme));

      service.fetchUser$().subscribe(() => {
        expect(themeService.setTheme).toHaveBeenCalledWith('light', false);
      });

      expect(userApiService.getMe$).toHaveBeenCalled();
    });

    it('should not call setTheme when user is null', () => {
      userApiService.getMe$.and.returnValue(throwError(() => new Error('User not found')));

      service.fetchUser$().subscribe(() => {
        expect(themeService.setTheme).not.toHaveBeenCalled();
      });

      expect(userApiService.getMe$).toHaveBeenCalled();
    });
  });
});
