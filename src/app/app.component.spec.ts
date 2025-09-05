import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { TuiRoot } from '@taiga-ui/core';
import { TelegramService, ThemeService } from '@/shared';
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

    configureZonelessTestingModule({
      imports: [AppComponent, RouterTestingModule, MockTuiRootComponent],
      providers: [
        { provide: TelegramService, useValue: telegramServiceSpy },
        { provide: ThemeService, useValue: themeServiceSpy },
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
