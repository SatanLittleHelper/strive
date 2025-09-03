import { TestBed } from '@angular/core/testing';
import { TelegramService } from '@/shared';
import { configureZonelessTestingModule } from '@/test-setup';
import { AppComponent } from './app.component';

describe('AppComponent', () => {
  beforeEach(async () => {
    const mockWebApp = {
      ready: jasmine.createSpy('ready'),
      close: jasmine.createSpy('close'),
      expand: jasmine.createSpy('expand'),
    };

    const telegramServiceSpy = jasmine.createSpyObj('TelegramService', ['webApp'], {
      webApp: mockWebApp,
    });

    configureZonelessTestingModule({
      imports: [AppComponent],
      providers: [{ provide: TelegramService, useValue: telegramServiceSpy }],
    });
    await TestBed.compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });
});
