import { TestBed } from '@angular/core/testing';
import { configureZonelessTestingModule } from '@/test-setup';
import { ThemeService } from './theme.service';

describe('ThemeService', () => {
  let service: ThemeService;

  beforeEach((): void => {
    // Mock matchMedia
    const matchMediaMock = jasmine.createSpy('matchMedia').and.returnValue({
      matches: false,
      addEventListener: jasmine.createSpy('addEventListener'),
      removeEventListener: jasmine.createSpy('removeEventListener'),
    });
    Object.defineProperty(window, 'matchMedia', {
      value: matchMediaMock,
      writable: true,
    });

    // Mock document.documentElement
    const documentElementMock = {
      setAttribute: jasmine.createSpy('setAttribute'),
    };
    Object.defineProperty(document, 'documentElement', {
      value: documentElementMock,
      writable: true,
    });

    configureZonelessTestingModule({
      providers: [ThemeService],
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
});
