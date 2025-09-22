import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideLocationMocks } from '@angular/common/testing';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { TuiRoot } from '@taiga-ui/core';
import { AuthService } from '@/features/auth';
import { TelegramService, ThemeService, SwUpdateService, UserStoreService } from '@/shared';
import { configureZonelessTestingModule } from '@/test-setup';
import { AppComponent } from './app.component';

@Component({
  selector: 'tui-root', // eslint-disable-line @angular-eslint/component-selector
  template: '<ng-content></ng-content>',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class MockTuiRootComponent {}

describe('AppComponent', () => {
  beforeEach(async () => {
    const mockWebApp = {
      ready: jasmine.createSpy('ready'),
      close: jasmine.createSpy('close'),
      expand: jasmine.createSpy('expand'),
    };

    const telegramServiceSpy = jasmine.createSpyObj('TelegramService', [], {
      webApp: mockWebApp,
    });

    const themeServiceSpy = jasmine.createSpyObj('ThemeService', ['toggleTheme', 'isDark'], {
      isDark: jasmine.createSpy('isDark').and.returnValue(false),
    });

    const authServiceSpy = jasmine.createSpyObj('AuthService', ['initFromStorage'], {
      isAuthenticated: jasmine.createSpy('isAuthenticated').and.returnValue(false),
      loading: jasmine.createSpy('loading').and.returnValue(false),
      error: jasmine.createSpy('error').and.returnValue(null),
    });

    const swUpdateServiceSpy = jasmine.createSpyObj('SwUpdateService', ['checkForUpdate']);

    const userStoreSpy = jasmine.createSpyObj('UserStoreService', ['clearUser'], {
      user: jasmine.createSpy().and.returnValue(null),
      isAuthenticated: jasmine.createSpy().and.returnValue(false),
    });

    configureZonelessTestingModule({
      imports: [AppComponent, MockTuiRootComponent],
      providers: [
        provideHttpClientTesting(),
        provideRouter([]),
        provideLocationMocks(),
        { provide: TelegramService, useValue: telegramServiceSpy },
        { provide: ThemeService, useValue: themeServiceSpy },
        { provide: AuthService, useValue: authServiceSpy },
        { provide: SwUpdateService, useValue: swUpdateServiceSpy },
        { provide: UserStoreService, useValue: userStoreSpy },
        { provide: TuiRoot, useClass: MockTuiRootComponent },
      ],
    });
    await TestBed.compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });
});
