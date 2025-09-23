import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { ThemeService } from '@/shared';
import { UserApiService } from '@/shared/services/user';
import { configureZonelessTestingModule } from '@/test-setup';

describe('ThemeService', () => {
  let service: ThemeService;

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

  describe('theme color management', () => {
    it('should update theme color meta tag for dark theme', () => {
      const mockMeta = document.createElement('meta');
      mockMeta.setAttribute('name', 'theme-color');
      document.head.appendChild(mockMeta);

      service.setTheme('dark');

      expect(mockMeta.getAttribute('content')).toBe('#0f172a');

      document.head.removeChild(mockMeta);
    });

    it('should update theme color meta tag for light theme', () => {
      const mockMeta = document.createElement('meta');
      mockMeta.setAttribute('name', 'theme-color');
      document.head.appendChild(mockMeta);

      service.setTheme('light');

      expect(mockMeta.getAttribute('content')).toBe('#ffffff');

      document.head.removeChild(mockMeta);
    });

    it('should handle missing theme color meta tag', () => {
      expect(() => {
        service.setTheme('dark');
      }).not.toThrow();
    });
  });

  describe('localStorage handling', () => {
    it('should handle localStorage errors gracefully', () => {
      spyOn(localStorage, 'getItem').and.throwError('Storage error');

      expect(() => {
        service.setTheme('dark');
      }).not.toThrow();
    });

    it('should handle localStorage setItem errors', () => {
      spyOn(localStorage, 'setItem').and.throwError('Storage error');

      expect(() => {
        service.setTheme('light');
      }).not.toThrow();
    });
  });
});
