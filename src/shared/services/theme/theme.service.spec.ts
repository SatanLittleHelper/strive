import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { UserApiService } from '@/shared/services/user';
import { configureZonelessTestingModule } from '@/test-setup';
import { ThemeService } from './theme.service';

describe('ThemeService', () => {
  let service: ThemeService;
  let userApiService: jasmine.SpyObj<UserApiService>;

  beforeEach((): void => {
    const matchMediaMock = jasmine.createSpy('matchMedia').and.returnValue({
      matches: false,
      addEventListener: jasmine.createSpy('addEventListener'),
      removeEventListener: jasmine.createSpy('removeEventListener'),
    });
    Object.defineProperty(window, 'matchMedia', {
      value: matchMediaMock,
      writable: true,
    });

    const documentElementMock = {
      setAttribute: jasmine.createSpy('setAttribute'),
    };
    Object.defineProperty(document, 'documentElement', {
      value: documentElementMock,
      writable: true,
    });

    const userApiSpy = jasmine.createSpyObj('UserApiService', ['updateTheme$']);
    userApiSpy.updateTheme$.and.returnValue(
      of({ message: 'Theme updated successfully', theme: 'light' }),
    );

    configureZonelessTestingModule({
      providers: [ThemeService, { provide: UserApiService, useValue: userApiSpy }],
    });

    service = TestBed.inject(ThemeService);
    userApiService = TestBed.inject(UserApiService) as jasmine.SpyObj<UserApiService>;
  });

  it('should be created', (): void => {
    expect(service).toBeTruthy();
  });

  it('should have a theme', (): void => {
    expect(service.theme()).toBeDefined();
  });

  it('should set theme', (): void => {
    service.setTheme('dark');
    expect(service.theme()).toBe('dark');
  });

  it('should toggle theme', (): void => {
    const initialTheme = service.theme();
    service.toggleTheme();
    const newTheme = service.theme();
    expect(newTheme).not.toBe(initialTheme);
  });

  it('should compute isDark correctly', (): void => {
    service.setTheme('dark');
    expect(service.isDark()).toBe(true);
    service.setTheme('light');
    expect(service.isDark()).toBe(false);
  });

  it('should initialize theme', (): void => {
    expect(() => service.initialize()).not.toThrow();
  });

  describe('setTheme with syncWithServer parameter', () => {
    it('should sync with server when syncWithServer is true (default)', (done: DoneFn) => {
      userApiService.updateTheme$.and.returnValue(
        of({ message: 'Theme updated successfully', theme: 'dark' }),
      );

      service.setTheme('dark');

      setTimeout(() => {
        expect(userApiService.updateTheme$).toHaveBeenCalledWith({ theme: 'dark' });
        done();
      }, 600);
    });

    it('should not sync with server when syncWithServer is false', () => {
      service.setTheme('dark', false);

      expect(userApiService.updateTheme$).not.toHaveBeenCalled();
    });

    it('should still apply theme locally when syncWithServer is false', () => {
      service.setTheme('dark', false);

      expect(service.theme()).toBe('dark');
    });
  });

  describe('debounce functionality', () => {
    it('should debounce multiple rapid theme changes', (done: DoneFn) => {
      userApiService.updateTheme$.and.returnValue(
        of({ message: 'Theme updated successfully', theme: 'dark' }),
      );

      service.setTheme('light');
      service.setTheme('dark');
      service.setTheme('light');
      service.setTheme('dark');

      expect(userApiService.updateTheme$).not.toHaveBeenCalled();

      setTimeout(() => {
        expect(userApiService.updateTheme$).toHaveBeenCalledTimes(1);
        expect(userApiService.updateTheme$).toHaveBeenCalledWith({ theme: 'dark' });
        done();
      }, 600);
    });

    it('should not call API for duplicate theme changes', (done: DoneFn) => {
      userApiService.updateTheme$.and.returnValue(
        of({ message: 'Theme updated successfully', theme: 'dark' }),
      );

      service.setTheme('dark');
      service.setTheme('dark');
      service.setTheme('dark');

      setTimeout(() => {
        expect(userApiService.updateTheme$).toHaveBeenCalledTimes(1);
        done();
      }, 600);
    });

    it('should handle rapid theme changes with distinctUntilChanged', (done: DoneFn) => {
      userApiService.updateTheme$.and.returnValue(
        of({ message: 'Theme updated successfully', theme: 'light' }),
      );

      service.setTheme('light');
      service.setTheme('dark');
      service.setTheme('light');

      setTimeout(() => {
        expect(userApiService.updateTheme$).toHaveBeenCalledTimes(1);
        expect(userApiService.updateTheme$).toHaveBeenCalledWith({ theme: 'light' });
        done();
      }, 600);
    });
  });

  describe('server synchronization', () => {
    it('should call updateTheme$ when setTheme is called with default parameters', (done: DoneFn) => {
      userApiService.updateTheme$.and.returnValue(
        of({ message: 'Theme updated successfully', theme: 'light' }),
      );

      service.setTheme('light');

      setTimeout(() => {
        expect(userApiService.updateTheme$).toHaveBeenCalledWith({ theme: 'light' });
        done();
      }, 600);
    });

    it('should handle API errors gracefully', (done: DoneFn) => {
      userApiService.updateTheme$.and.returnValue(
        of({ message: 'Theme updated successfully', theme: 'dark' }),
      );

      expect(() => {
        service.setTheme('dark');
        setTimeout(() => {
          done();
        }, 600);
      }).not.toThrow();
    });
  });
});
