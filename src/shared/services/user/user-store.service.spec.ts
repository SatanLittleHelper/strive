import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import type { User } from '@/shared/lib/types';
import { configureZonelessTestingModule } from '@/test-setup';
import { UserApiService } from './user-api.service';
import { UserStoreService } from './user-store.service';

describe('UserStoreService', () => {
  let service: UserStoreService;
  let userApiService: jasmine.SpyObj<UserApiService>;

  beforeEach(() => {
    const userApiSpy = jasmine.createSpyObj('UserApiService', ['getMe$']);

    configureZonelessTestingModule({
      providers: [{ provide: UserApiService, useValue: userApiSpy }, provideHttpClientTesting()],
    });

    service = TestBed.inject(UserStoreService);
    userApiService = TestBed.inject(UserApiService) as jasmine.SpyObj<UserApiService>;
  });

  describe('initialization', () => {
    it('should initialize with null user', () => {
      expect(service.user()).toBeNull();
      expect(service.isAuthenticated()).toBeFalse();
    });
  });

  describe('user signal', () => {
    it('should set user and update signals', () => {
      const user: User = { id: '1', email: 'test@example.com' };

      service.user.set(user);

      expect(service.user()).toEqual(user);
      expect(service.isAuthenticated()).toBeTrue();
    });

    it('should allow setting null user', () => {
      const user: User = { id: '1', email: 'test@example.com' };
      service.user.set(user);

      service.user.set(null);

      expect(service.user()).toBeNull();
      expect(service.isAuthenticated()).toBeFalse();
    });
  });

  describe('clearUser', () => {
    it('should clear user and update signals', () => {
      const user: User = { id: '1', email: 'test@example.com' };
      service.user.set(user);

      service.clearUser();

      expect(service.user()).toBeNull();
      expect(service.isAuthenticated()).toBeFalse();
    });
  });

  describe('signals behavior', () => {
    it('should update computed signals when user changes', () => {
      const user: User = { id: '1', email: 'test@example.com' };

      expect(service.isAuthenticated()).toBeFalse();

      service.user.set(user);

      expect(service.isAuthenticated()).toBeTrue();

      service.clearUser();

      expect(service.isAuthenticated()).toBeFalse();
    });
  });

  describe('fetchUser$', () => {
    it('should fetch user and update state', () => {
      const user: User = { id: '1', email: 'test@example.com' };
      userApiService.getMe$.and.returnValue(of(user));

      service.fetchUser$().subscribe((result) => {
        expect(result).toEqual(user);
        expect(service.user()).toEqual(user);
        expect(service.isAuthenticated()).toBeTrue();
      });

      expect(userApiService.getMe$).toHaveBeenCalled();
    });

    it('should handle API error and clear user', () => {
      userApiService.getMe$.and.returnValue(throwError(() => new Error('API Error')));

      service.fetchUser$().subscribe((result) => {
        expect(result).toBeNull();
        expect(service.user()).toBeNull();
        expect(service.isAuthenticated()).toBeFalse();
      });

      expect(userApiService.getMe$).toHaveBeenCalled();
    });
  });
});
