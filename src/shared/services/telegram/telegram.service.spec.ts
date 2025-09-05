import { TestBed } from '@angular/core/testing';
import { configureZonelessTestingModule } from '@/test-setup';
import { TelegramService } from './telegram.service';

describe('TelegramService', () => {
  let service: TelegramService;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockWebApp: any;

  beforeEach((): void => {
    // Simple mock for Telegram WebApp
    mockWebApp = {
      ready: jasmine.createSpy('ready'),
      expand: jasmine.createSpy('expand'),
      close: jasmine.createSpy('close'),
      initData: 'test_init_data',
      version: '6.0',
      platform: 'web',
    };

    // Mock window.Telegram.WebApp
    Object.defineProperty(window, 'Telegram', {
      value: {
        WebApp: mockWebApp,
      },
      writable: true,
    });

    configureZonelessTestingModule({
      providers: [TelegramService],
    });

    service = TestBed.inject(TelegramService);
  });

  it('should be created', (): void => {
    expect(service).toBeTruthy();
  });

  it('should return WebApp instance', (): void => {
    const webApp = service.webApp;
    expect(webApp).toBe(mockWebApp);
  });

  it('should provide access to WebApp properties', (): void => {
    const webApp = service.webApp;

    expect(webApp.initData).toBe('test_init_data');
    expect(webApp.version).toBe('6.0');
    expect(webApp.platform).toBe('web');
  });

  it('should provide access to WebApp methods', (): void => {
    const webApp = service.webApp;

    webApp.ready();
    webApp.expand();
    webApp.close();

    expect(mockWebApp.ready).toHaveBeenCalled();
    expect(mockWebApp.expand).toHaveBeenCalled();
    expect(mockWebApp.close).toHaveBeenCalled();
  });
});
